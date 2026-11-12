"use client";

/* The agent.
 *
 * One conversation, one panel, and a job that ENDS. It reads your work,
 * builds your profile, tells you which live campaigns want somebody
 * like you, and takes you as far as joining one. What happens after
 * that runs for weeks and belongs on a page you check rather than in a
 * thread you scroll.
 *
 * WHAT THE 21 SEP REVIEW CHANGED HERE, because it is most of the file:
 *
 *   - There is no price in this conversation. The agent does not price
 *     the creator and the creator does not price themselves; a campaign
 *     pays a share of the orders it drives and the share is the
 *     brand's. Money questions get an explanation, not a setting.
 *   - Pre-qualified campaigns join outright. Only the rest are an
 *     application a brand answers.
 *   - The calculator comes after joining, never before.
 *   - Connecting Instagram is not asked here at all. Rasha: "connecting
 *     their Instagram might be too early from just a conversation." It
 *     is an alert on the dashboard.
 *   - A question mid-flow is answered AND the open step comes back.
 *
 * Every interactive block here becomes a record once it is answered.
 * A prompt is live only while it is the last thing said. */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { ChatShell } from "../components/chat/ChatShell";
import { OnboardingSteps, type Step } from "../components/chat/Steps";
import { PanelHost } from "../components/chat/PanelHost";
import { AgentProse, AgentTurn, BlockRow, UserTurn } from "../components/chat/Turn";
import { Composer } from "../components/chat/Composer";
import { Thinking, WorkingLine, Typed } from "../components/Stream";
import { Emblem } from "../../../_shared/Emblem";
import { MoonLoop } from "../../../_shared/MoonLoop";
import { AccountSheet, dialFor } from "../components/AccountSheet";
import { ToastHost } from "../components/campaign/Toasts";
import {
  AcceptBlock, BriefBlock, CadenceBlock, CampaignBlockCard, ChangesBlock, DecisionBlock,
  EarningsBlock, IntroBlock, OfferCarousel, ProfileBlock, ReadBlock, RejectedBlock, TaskRoster, countWord, rosterTitle,
} from "../components/blocks";
import { useStream } from "../lib/agent/useStream";
import { displayHandle } from "../lib/handle";
import { askCadence, chatCampaigns, chatCampaignsTitle } from "../lib/join";
import { personFor } from "../lib/mock/people";
import { BUILD_TASKS, offersFor, tools } from "../lib/agent/tools";
import { byStrength, MATCH_WORD } from "../lib/agent/model";
import { chatPicks, wantsYou, type CreatorRead, type Offer, type Profile } from "../lib/agent/types";
import {
  claimOnce, confirmAccept, cancelAccept, correctRead, decideOffer, dropThread, liveThread, markDecisionSeen, openCampaign, openPanel, push,
  closeSignIn, putAccept, putOffers, putProfile, putRead, selectOffer, setAccount, setOfferState, threadIsEmpty,
  useActiveProfile, useDecisions, useOffers, useReviewClock, useSignInFor, useStore, useThread, type NewThreadItem,
} from "../lib/store";
import { relDay } from "../lib/dates";
import { usePlans, useToday } from "../lib/usePlans";

/** The one sentence the check buttons hang off. Warmer than it was
    ("Does that look right?") after the 28 Sep review: Alex found the
    flow transactional, a "next, next, next". A conversation saved
    before then still carries the old sentence, and still gets its
    buttons. */
const CHECK = "Did I get you right? If anything is off, just say so and I will fix it before I build your profile.";
const isCheck = (t: string) => t === CHECK || t === "Does that look right?";

/** A thread item, ready to be pushed again. Its id and timestamp are
    the thread's to assign, not the caller's. */
const stripped = (it: ReturnType<typeof useThread>[number]): NewThreadItem => {
  const copy = { ...it } as Record<string, unknown>;
  delete copy.id; delete copy.at;
  return copy as NewThreadItem;
};

export default function Page() {
  return <Suspense fallback={null}><Conversation /></Suspense>;
}

function Conversation() {
  const params = useSearchParams();
  const router = useRouter();
  /* Normalised again here, for anybody arriving with a link rather than
     from the landing: the agent says "Reading @name", never a URL.
     Whatever arrives is read. A handle that is not seeded comes back as
     a sample read that says so (personFor), never as somebody else's. */
  const handle = displayHandle(params.get("h")) ?? "@mais.mustafa";
  const thread = useThread();
  const profile = useActiveProfile();
  const offers = useOffers();
  /* An ad sent from the panel gets its answer here too. */
  useReviewClock();
  const signInId = useSignInFor();
  const signInFor = offers.find((o) => o.id === signInId) ?? null;
  const reads = useStore((s) => s.reads);
  const accepts = useStore((s) => s.accepts);
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  /* The connection handler, the brand's (PRD v0.2, H7): offline blocks the chat with one line and no error page; back
     online, it says so for three seconds and carries on where it was. */
  const [online, setOnline] = useState(true);
  const [backOnline, setBackOnline] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = () => { setOnline(false); setBackOnline(false); };
    const on = () => { setOnline(true); setBackOnline(true); clearTimeout(t); t = setTimeout(() => setBackOnline(false), 3000); };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    if (!navigator.onLine) off();
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); clearTimeout(t); };
  }, []);

  const readRun = useStream<CreatorRead>();
  const buildRun = useStream<Profile>();
  const offerRun = useStream<Offer[]>();

  /* HOW THE THREAD ARRIVES, as the brand's does (12 Nov: "every component in the creator should act similar to its
     similar one in the brand"). Only the newest agent message types; everything above it is history and renders whole.
     While it types, nothing below it is shown, because a card that lands before the sentence introducing it reads as
     two things happening at once. A conversation restored from an earlier visit renders whole: what was already in
     the store when this page opened counts as typed. Read from the store once, before this page pushes anything. */
  const [typedDone, setTypedDone] = useState<Record<string, true>>({});
  const finish = useCallback((id: string) => setTypedDone((d) => (d[id] ? d : { ...d, [id]: true })), []);
  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const done: Record<string, true> = {};
    for (const it of liveThread()) if (it.kind === "say") done[it.id] = true;
    if (Object.keys(done).length) setTypedDone((d) => ({ ...done, ...d }));
  }, []);
  const lastSay = [...thread].reverse().find((i) => i.kind === "say");
  const isTyping = !!lastSay && !typedDone[lastSay.id];
  const visible = isTyping ? thread.slice(0, thread.findIndex((i) => i.id === lastSay!.id) + 1) : thread;
  /* The answer a step is waiting on, when it is not one of the standing chips (a stopped read or build). */
  const [pending, setPending] = useState<string[] | null>(null);
  /* "Not quite" was pressed: the next thing the creator types is the correction. */
  const [awaitingCorrection, setAwaitingCorrection] = useState(false);

  /* SCROLL THE THREAD, AND ONLY THE THREAD: the one scroller's own scrollTop, never scrollIntoView, which also moves
     the app shell. And park the TOP of the newest turn under the header, as the brand does, rather than jumping to
     the bottom: on a long answer that meant watching the last line being written and never seeing the first. */
  const park = useCallback((smooth: boolean) => {
    const box = scroller.current;
    if (!box) return;
    const last = box.querySelector<HTMLElement>("[data-last-turn]");
    if (!last) return;
    /* 76, not 16: the header (the mark and where they are in getting started) floats over the top of the thread. */
    const top = box.scrollTop + (last.getBoundingClientRect().top - box.getBoundingClientRect().top) - 76;
    box.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  }, []);
  useEffect(() => { park(true); }, [thread.length, park]);
  /* And again when the blocks a sentence was holding back appear (`visible` grows when the typing finishes). */
  useEffect(() => { if (!isTyping) park(true); }, [visible.length, isTyping, park]);

  /* ── 1. The read ──────────────────────────────────────────────── */
  /* WHAT A PERSON WOULD SAY WITH YOUR PROFILE ON THEIR PHONE: you are a fit and why, then what HeyMoon is — and only
     then the question. Alex, 28 Sep: "the conversation and experience need to mimic a little bit of that." */
  const afterRead = (value: CreatorRead) => {
    /* A read stopped before the check ran has no answer yet, so it is not a fit by default (the brand's read treats
       a missing result the same way). */
    if (!value.standing) {
      push({ kind: "say", text: "The check on whether brands here want you did not finish, so I cannot tell you yet. Let me read it again." });
      setPending(["Read it again"]);
      return;
    }
    /* Nothing for this person, said where it happens, with the way on, as the brand's "One thing didn't clear". */
    if (value.standing.state !== "ok") {
      push({ kind: "say", text: "One thing didn't clear. Everything I read stands, and it is checked again whenever you ask." });
      push({ kind: "rejected", readId: value.id });
      setPending(["Read it again", "When do I get paid?"]);
      return;
    }
    push({ kind: "say", text: tools.welcome_line({ read: value }) });
    push({ kind: "intro" });
    push({ kind: "say", text: CHECK });
  };
  const lastRead = useRef<CreatorRead | null>(null);
  const runRead = () => {
    readRun.start(
      (ctx) => tools.read_profile({ handle }, ctx),
      (value, cancelled) => {
        if (!value) return;
        /* A stopped run carries the same id as the finished read, so storing it would replace a complete read with a
           partial one (the brand's read guards the same way). */
        if (!cancelled || !reads[value.id]?.standing) putRead(value);
        lastRead.current = value;
        /* Stopped: said, and the choice offered, as the brand's read does. Nothing found is thrown away. */
        if (cancelled) {
          push({ kind: "say", text: "Stopped there. What I found is above, and I can finish the job if you want it." });
          setPending(["Read it again", "Work with this"]);
          return;
        }
        afterRead(value);
      }
    );
  };
  useEffect(() => {
    if (!threadIsEmpty()) return;
    if (!claimOnce(`read:${handle}`)) return;
    push({ kind: "say", text: `Hi! Let me have a look at ${handle}.` });
    push({ kind: "read", handle });
    runRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  /* ── 2. Build the profile ─────────────────────────────────────── */
  const build = useCallback((read: CreatorRead) => {
    push({ kind: "say", text: "Great. I am building your profile now." });
    buildRun.start(
      (ctx) => tools.propose_profile({ read }, ctx),
      (value, cancelled) => {
        if (!value) return;
        /* Stopped: nothing half-built is saved as if it were finished (the brand's build does the same). */
        if (cancelled) {
          push({ kind: "say", text: "Stopped too early to show you anything. Say “build my profile” to run it again." });
          setPending(["Build my profile"]);
          return;
        }
        putProfile(value);
        /* ONLY WHERE THE PANEL SITS BESIDE THE CHAT. Above 768px this
           puts the profile next to the sentence about it. Below, the
           panel is a full-screen takeover, so opening it unasked pulled
           the creator out of the conversation mid-flow — and the
           campaigns matched a second later arrived in a thread they
           could no longer see. On a phone the profile is a block in the
           thread, and "Open" is one press away. */
        if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) openPanel("profile");
        /* WHAT IT IS, THEN HOW TO CHANGE IT. The line before this read
           the block back as a fragment ("Lifestyle, 5 deliverables a
           month, 3 days from brief to cut"), answered a question about
           rates nobody had asked, and the one after it was three orders
           in a row. The block says what is on the profile; the sentences
           around it say what it is for and that it is one message away
           from changing — the examples are the chips under the box. */
        push({ kind: "say", text: "Here is your profile. It is what brands are matched to, and every campaign you join pays you a share of each order you bring in." });
        push({ kind: "profile" });
        push({ kind: "say", text: "Want anything changed? Just tell me, like \"no gambling\"." });
        matchOffers(value);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 3. Match the campaigns ───────────────────────────────────── */
  const matchOffers = useCallback((pr: Profile) => {
    offerRun.start(
      (ctx) => tools.match_offers({ profile: pr }, ctx),
      (value) => {
        if (!value?.length) { push({ kind: "say", text: "No campaign running today is a fit. Nothing about that is fixable by taking less — it is which brands are live, and HeyMoon looks again as each one opens." }); return; }
        putOffers(value);
        /* WEAK MATCHES ARE IN THE LIST BUT NOT IN THIS SENTENCE. They
           are brought so a creator can see and apply to them; saying a
           campaign wants somebody when the match is under the floor
           would be the agent flattering them. */
        /* History rides along with the matches (see match_offers), and a
           campaign you finished last month does not want you today. */
        /* THREE HERE, AND ONLY THREE. A thread is the wrong place to
           browse sixteen campaigns and the right place to be handed the
           few you can act on — so the sentence counts what it hands
           over, never everything that is running ("16 campaigns want
           somebody like you" put the other thirteen back in through the
           number). The agent does not narrate where the others are. */
        const picks = chatPicks(value);
        const n = countWord(picks.length);
        const one = picks.length === 1;
        const pre = picks.length > 0 && picks.every((o) => o.match.level === "prequalified");
        push({
          kind: "say",
          text: pre
            ? `Good news. You're Pre-qualified for ${one ? "one campaign" : `${n} campaigns`}, so you can join ${one ? "it" : "any of them"} right away, with no brand review.`
            : `Here ${one ? "is the campaign that fits" : `are the ${n} campaigns that fit`} you best. Each is a request to join, and the brand answers.`,
        });
        push({ kind: "offers" });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 4. Joining ───────────────────────────────────────────────── */
  /* THE CODE IS NAMED WHERE IT CAN BE COPIED. This said "Your code
     is MAIS-TT" in a sentence, but nothing in the conversation shows the
     code — it is a copyable badge on the campaign's dashboard page — so
     the creator was told something they could not use from here. */
  const joined = (o: Offer) => {
    push({ kind: "say", text: `You're on ${o.brand}. From now on, every order your code brings in pays you ${o.commissionPct}%.` });
    push({ kind: "earnings", offerId: o.id });
    push({ kind: "say", text: "Your code, your tracking link and your ads are on your dashboard, one row per ad, dated by the schedule you picked. Post each one, then submit it there to get paid. The campaign runs for weeks, so that is where it lives." });
  };

  /* ── 5. A QUESTION INTERRUPTS, AND THE STEP COMES BACK ─────────
     Alex: "there are always things they could ask, interrupt the flow.
     That's fine. They interrupt, we answer them, and we go back to the
     flow." The open step is MOVED to the end rather than copied, so
     there is never a second live copy of the same control. */
  const reopen = () => {
    const items = liveThread();
    for (let n = items.length - 1; n >= 0; n--) {
      const it = items[n];
      const open =
        (it.kind === "accept" && accepts[it.requestId]?.state === "pending") ||
        (it.kind === "cadence" && !accepts[`acc-${it.offerId}`]) ||
        (it.kind === "offers" && offers.some((o) => o.state === "open")) ||
        (it.kind === "say" && isCheck(it.text));
      if (!open) continue;
      dropThread(it.id);
      push(stripped(it));
      return;
    }
  };

  /* ── 6. Free text ─────────────────────────────────────────────── */
  const send = (said?: string) => {
    const t = (said ?? text).trim(); if (!t) return;
    setText("");
    setPending(null);
    push({ kind: "user", text: t });
    /* The answer to "Not quite": kept beside the read as the creator's correction, and the profile is built on it, as
       the brand's "Something's off" does. */
    if (awaitingCorrection && !profile) {
      setAwaitingCorrection(false);
      const read = Object.values(reads)[0];
      if (read) {
        correctRead(read.id, { layer: "identity", field: "note", was: "what HeyMoon found", now: t, at: Date.now() }, (r) => r);
        push({ kind: "say", text: "Fixed. Building your profile on that." });
        build(read);
        return;
      }
    }
    const i = tools.interpret({ text: t, profile: profile ?? undefined, joined: offers.some((o) => o.state === "approved") });

    if (i.kind === "edit" && profile && i.patch) {
      const { profile: next, changes } = tools.edit_profile({ profile, patch: i.patch, because: i.because ?? "", by: "creator" });
      putProfile(next);
      push({ kind: "say", text: i.say });
      if (changes.length) push({ kind: "changes", changeIds: changes.map((c) => c.id) });
      /* Matching runs on the profile, so a change to it re-matches. */
      const rebuilt = offersFor(next);
      putOffers(rebuilt);
      if (rebuilt.some((o) => o.state === "open")) push({ kind: "offers" });
      else push({ kind: "say", text: "That leaves nothing matching you today. Say the word and I will put it back." });
      return;
    }

    if (i.kind === "command") {
      if (i.command === "show-offers") { openPanel("offers"); push({ kind: "say", text: i.say }); return; }
      if (i.command === "show-profile") { openPanel("profile"); push({ kind: "say", text: i.say }); return; }
      if (i.command === "build") { const read = Object.values(reads)[0]; if (read) { build(read); return; } }
      if (i.command === "join") {
        const best = offers.filter((o) => o.state === "open" && wantsYou(o)).sort(byStrength)[0];
        if (best) { selectOffer(best.id); openPanel("offers"); push({ kind: "say", text: `${best.brand} is your strongest, and it is ${MATCH_WORD[best.match.level].toLowerCase()}. Open in the panel — you press it.` }); return; }
      }
      push({ kind: "say", text: i.say });
      if (i.command === "report-post" || i.command === "show-report") return;
      reopen();
      return;
    }

    if (i.kind === "question") {
      push({ kind: "say", text: ANSWERS[i.answerRef ?? ""] ?? "I do not have that one." });
      reopen();
      return;
    }

    push({ kind: "say", text: i.say });
  };

  const busy = readRun.status === "running" || buildRun.status === "running" || offerRun.status === "running";
  const stopAll = () => { readRun.cancel(); buildRun.cancel(); offerRun.cancel(); };
  const looksRight = () => { setPending(null); const read = Object.values(reads)[0]; push({ kind: "user", text: "Yes, that's me" }); if (read) build(read); };
  const somethingOff = () => {
    setPending(null);
    push({ kind: "user", text: "Not quite" });
    /* Beside the chat only: below 768px the panel is a full-screen takeover that would hide the reply. */
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) openPanel("read");
    push({ kind: "say", text: "No problem. Tell me what I got wrong, or change it in the panel, and I will build on your version." });
    setAwaitingCorrection(true);
  };
  /* "Did I get you right?" is answered from the chips, as the brand's "Does this look right?" is, while it is the
     last thing said. */
  const checkOpen = !profile && buildRun.status === "idle" && !!lastSay && isCheck(lastSay.text) && thread[thread.length - 1]?.id === lastSay.id;
  /* A question or a change already sent is not offered again, as in the brand's conversation (its liveChips): the
     answer is in the thread, and the chip sitting under it read as if it had not been asked (12 Nov). What goes
     somewhere or answers a step stays, because pressing it twice still does something. */
  const asked = new Set(thread.filter((i) => i.kind === "user").map((i) => (i as { text: string }).text));
  const REPEATABLE = new Set(["Go to the dashboard", "Show me my profile", "Read it again", "Work with this", "Build my profile", "Yes, that's me", "Not quite"]);
  const fresh = (list: string[]) => list.filter((c) => REPEATABLE.has(c) || !asked.has(c));
  const chips = fresh(pending ?? (checkOpen ? ["Yes, that's me", "Not quite"] : !profile ? [] : offers.some((o) => o.state === "approved")
    ? ["Go to the dashboard", "When do I get paid?", "Show me my profile"]
    : ["When do I get paid?", "Why did this match me?", "No gambling or vaping"]));
  /* A chip is an answer, so it sends, as in the brand's conversation; it used to only fill the box. */
  const onChip = (c: string) => {
    if (c === "Yes, that's me") return looksRight();
    if (c === "Go to the dashboard") { router.push("/creators/dashboard"); return; }
    if (c === "Not quite") return somethingOff();
    if (c === "Read it again") { setPending(null); push({ kind: "user", text: c }); push({ kind: "say", text: "Picking it back up." }); push({ kind: "read", handle }); runRead(); return; }
    if (c === "Work with this") { setPending(null); push({ kind: "user", text: c }); push({ kind: "say", text: "Working with what arrived." }); if (lastRead.current) afterRead(lastRead.current); return; }
    send(c);
  };
  /* The read item the live card belongs to: a read run again draws a new card, and the earlier one stays as it was. */
  const liveReadId = [...thread].reverse().find((i) => i.kind === "read")?.id;
  /* The build roster waits for the sentence introducing it, as the brand's does. */
  const rosterReady = buildRun.status === "running" && !isTyping;


  const steps: Step[] = [
    /* Ticked when the read cleared, not merely when it ran, as the brand's "Your store". */
    { key: "read", label: "Read", done: Object.values(reads).some((r) => r.standing?.state === "ok") || !!profile },
    { key: "profile", label: "Profile", done: !!profile },
    { key: "matches", label: "Matches", done: offers.length > 0 },
    { key: "join", label: "Join", done: offers.some((o) => o.state === "approved") },
  ];

  return (
    /* Getting started, ticked by what is true rather than by the scroll (Steps.tsx). */
    <ChatShell panel={<PanelHost />} top={<OnboardingSteps steps={steps} />}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-16">
        {/* THE CONTAINER. Every block in the thread sizes itself by
            this column's width (`@lg:` = 512px), not the viewport's:
            with the panel open at 768px this column is 361px, which is
            a phone, and it should be laid out like one. */}
        {/* Offline, the cards can be read and scrolled but not pressed: a Join made offline would record a step the server
            never saw. */}
        <div
          aria-disabled={!online || undefined}
          className={`@container mx-auto w-full max-w-[720px] space-y-7 transition-opacity ${online ? "" : "pointer-events-none select-none opacity-60"}`}
        >
          {/* The brand's rhythm: prose and the creator's own words start a new group, the cards a sentence produced join
              its group. 28px between turns, 20px between a turn and the blocks it introduced. The last group is
              where the view parks. */}
          {groupRows(visible.map((item, i) => ({
            id: item.id,
            block: item.kind !== "say" && item.kind !== "user",
            node: (
              <Item key={item.id} item={item} readRun={readRun} onJoined={joined}
                mark={!(i > 0 && visible[i - 1].kind === "say")}
                typing={item.kind === "say" && item.id === lastSay?.id && !typedDone[item.id]}
                centered={visible.length === 1 && !profile}
                liveRead={item.id === liveReadId}
                onTyped={() => finish(item.id)}
                onTick={() => park(false)} />
            ),
          }))).map((g, i, all) => (
            <div key={g[0].id} data-last-turn={i === all.length - 1 ? "" : undefined} className="space-y-5">
              {g.map((r) => r.node)}
            </div>
          ))}
          {/* The dots, for the gap between "I will do that" and the first thing appearing; once the roster is up they
              would be a second spinner beside a real one. */}
          {(readRun.status === "running" || buildRun.status === "running") && !isTyping && !rosterReady && <Thinking />}
          {/* Building the profile, as the brand's plan build: the agents' tiles and the working line under them. */}
          {rosterReady && (
            <BlockRow>
              <TaskRoster tasks={BUILD_TASKS} done={BUILD_TASKS.slice(0, buildRun.progress.done).map((t) => t.key)} live title={rosterTitle(BUILD_TASKS, "building your profile")} />
              <WorkingLine className="mt-2" note={buildRun.note} done={buildRun.progress.done} total={buildRun.progress.total} status={buildRun.status} />
              {/* The profile filling in as it is built, as the brand's plan does under its roster. */}
              {buildRun.partial && (
                <div className="mt-3">
                  <ProfileBlock profile={buildRun.partial} building={{ landed: BUILD_TASKS.slice(0, buildRun.progress.done).map((t) => t.key) }} />
                </div>
              )}
            </BlockRow>
          )}
          {offerRun.status === "running" && !isTyping && <BlockRow><WorkingLine note={offerRun.note} done={offerRun.progress.done} total={offerRun.progress.total} status="running" /></BlockRow>}
          {/* Held back until the thread has finished arriving. It is not
              a thread item, so nothing gated it, and it turned up beside
              a sentence that was still being typed. */}
          {offers.some((o) => o.state === "approved") && !isTyping && (
            <BlockRow>
              <Link href="/creators/dashboard" className="btn-pri inline-flex h-12 items-center gap-2 rounded-pill px-5 text-body font-semibold">
                Go to your dashboard <ArrowRight size={14} weight="bold" aria-hidden />
              </Link>
            </BlockRow>
          )}
        </div>
      </div>
      {(!online || backOnline) && (
        <div role={online ? "status" : "alert"} className="mx-auto w-full max-w-[720px] px-4 pb-2">
          <p className={`flex items-center gap-2 rounded-[12px] px-3.5 py-2.5 text-meta font-semibold ${online ? "bg-green/[0.08] text-[#1C7A26]" : "bg-amber-soft text-amber"}`}>
            <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-green" : "animate-pulse bg-amber"}`} />
            {online ? "Back online." : "You're offline. Reconnecting. Nothing here is lost."}
          </p>
        </div>
      )}
      <Composer disabled={!online} value={text} onChange={setText} onSend={() => send()} chips={isTyping || !online ? [] : chips} onChip={onChip}
        placeholder="Ask anything, or change your profile" note="HeyMoon cannot post to your accounts, join a campaign or sign anything."
        busy={busy} onStop={stopAll} />
      {/* THE FIRST JOIN MAKES THE ACCOUNT — see beginJoin. Over the
          page rather than in the thread, and gone the moment the code
          is verified; the join then carries on where it was going, to
          the scheduling question for the campaign that was pressed. */}
      <AccountSheet open={!!signInFor} brand={signInFor?.brand}
        name={profile?.creatorName} dial={dialFor(profile ? personFor(profile.handle).location : undefined)}
        onClose={closeSignIn}
        onVerified={(a) => {
          setAccount(a);
          closeSignIn();
          if (signInFor) askCadence(signInFor);
        }} />
      {/* Above the message box, which the dashboard does not have. */}
      <ToastHost offset="bottom-40" onOpen={(id) => { openCampaign(id, "content"); openPanel("offers"); }} />
    </ChatShell>
  );
}

/* ------------------------------------------------------------------ */

type Row = { id: string; block: boolean; node: React.ReactNode };
/** Rows into turns: a sentence or the creator's words starts one, the blocks after it join it. */
function groupRows(rows: Row[]): Row[][] {
  const groups: Row[][] = [];
  for (const r of rows) {
    if (!r.block || !groups.length) groups.push([r]);
    else groups[groups.length - 1].push(r);
  }
  return groups;
}

function Item({ item, readRun, onJoined, typing, centered, liveRead, onTyped, onTick, mark = true }: {
  item: ReturnType<typeof useThread>[number];
  /** Consecutive agent lines share one mark: the speaker is named once and then keeps talking. */
  mark?: boolean;
  readRun: ReturnType<typeof useStream<CreatorRead>>;
  onJoined: (o: Offer) => void;
  /** The newest sentence, still being written. Everything else renders whole. */
  typing?: boolean;
  /** The conversation is only its opening line: it opens like a page, as the brand's does. */
  centered?: boolean;
  /** This is the read the running read belongs to. */
  liveRead?: boolean;
  onTyped?: () => void;
  onTick?: () => void;
}) {
  const profile = useActiveProfile();
  const offers = useOffers();
  const accepts = useStore((s) => s.accepts);
  const decisions = useDecisions();
  const reads = useStore((s) => s.reads);
  const thread = useThread();
  const plans = usePlans();
  const today = useToday();

  switch (item.kind) {
    case "user": return <UserTurn text={item.text} />;

    case "say":
      /* A conversation that is only its opening line opens like a page, not like a log, as the brand's does: the mark
         large, and the same words in the middle of the screen, still typed out. The first card turns it back into the
         thread. */
      if (centered) {
        return (
          <div className="flex min-h-[calc(100dvh-260px)] flex-col items-center justify-center text-center">
            <span aria-hidden className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(135deg,#6848D1,#C2418B)] text-white shadow-pri">
              {typing ? <MoonLoop size={30} /> : <Emblem size={30} />}
            </span>
            <div className="mt-6 max-w-[34ch] text-[24px] font-semibold leading-[1.3] tracking-[-0.02em] text-ink @lg:text-[28px]">
              {typing
                ? <Typed text={item.text} className="!text-[length:inherit] !leading-[inherit]" onDone={onTyped} />
                : <p>{item.text}</p>}
            </div>
          </div>
        );
      }
      return (
        <AgentTurn mark={mark} live={typing}>
          {typing ? <Typed text={item.text} onTick={onTick} onDone={onTyped} /> : <AgentProse text={item.text} />}
        </AgentTurn>
      );

    case "read": {
      const running = !!liveRead && readRun.status === "running";
      const read = (liveRead ? readRun.partial : null) ?? Object.values(reads)[0] ?? null;
      /* As the brand's read: the card, and the working line under it while it runs. */
      return (
        <BlockRow>
          <ReadBlock read={read} live={running} onOpen={() => openPanel("read")} />
          {running && (
            <WorkingLine className="mt-2" note={readRun.note} done={readRun.progress.done} total={readRun.progress.total} status={readRun.status} />
          )}
        </BlockRow>
      );
    }
    case "rejected": { const read = reads[item.readId]; return read ? <BlockRow><RejectedBlock read={read} /></BlockRow> : null; }

    case "profile": return profile ? <BlockRow><ProfileBlock profile={profile} onOpen={() => openPanel("profile")} /></BlockRow> : null;

    case "intro": return <BlockRow><IntroBlock /></BlockRow>;

    /* The campaigns as the file's cards. Pressing one opens it at full
       length in the panel, where Join Campaign lives. A decided card
       stays in the row and says what happened to it. Pre-qualified
       first — Alex: "the highest matching needs to be featured." */
    case "offers": {
      /* The carousel is what MATCHED. Everything running, weak matches
         included, is a section on the dashboard — putting a long shot
         in the same row as a pre-qualified campaign would make the row
         mean nothing. */
      /* The three strongest pre-qualified campaigns and no more — see
         chatPicks. Nothing in the thread points at the others; they are
         on the dashboard, and the conversation does not narrate it.
         LIVE, NOT A SNAPSHOT: once a join starts this row narrows to the
         campaign being joined, and its card says where it stands — see
         chatCampaigns. */
      const shown = chatCampaigns(offers, thread, accepts);
      if (!shown.list.length) return null;
      return (
        <BlockRow>
          <OfferCarousel offers={shown.list} title={chatCampaignsTitle(shown, countWord)}
            render={(o) => <CampaignBlockCard offer={o} pill={shown.joining.has(o.id) ? "Joining" : undefined}
              onOpen={() => { selectOffer(o.id); openPanel("offers"); }} />} />
        </BlockRow>
      );
    }

    case "brief": { const o = offers.find((x) => x.id === item.offerId); return o ? <BlockRow><BriefBlock offer={o} /></BlockRow> : null; }

    case "cadence": {
      const o = offers.find((x) => x.id === item.offerId); if (!o) return null;
      return (
        <BlockRow>
          <CadenceBlock offer={o} settled={accepts[`acc-${o.id}`]?.cadence}
            onPick={(c) => {
              const req = tools.request_accept({ offer: o, cadence: c });
              putAccept(req);
              push({ kind: "say", text: req.needsApproval
                ? "Here is exactly what you would be asking to join, and what you would not."
                : "Here is exactly what you are joining, and what you are not." });
              push({ kind: "accept", requestId: req.id });
            }} />
        </BlockRow>
      );
    }

    case "accept": {
      const req = accepts[item.requestId]; if (!req) return null;
      return (
        <BlockRow>
          <AcceptBlock req={req}
            onConfirm={() => {
              confirmAccept(req.id);
              const o = offers.find((x) => x.id === req.offerId);
              if (!o) return;

              /* PRE-QUALIFIED JOINS OUTRIGHT. There is no brand to wait
                 for, so manufacturing a two-second pause would be
                 theatre about a decision nobody is making. */
              /* THE CONVERSATION IS WHERE THIS ANSWER WAS SEEN, so the
                 dashboard does not greet them with it a second time. */
              if (!req.needsApproval) {
                setOfferState(o.id, "approved");
                decideOffer(tools.decide(o, req.cadence));
                markDecisionSeen(o.id);
                onJoined(o);
                return;
              }

              push({ kind: "say", text: `Sent. ${req.brand} has your request, and nothing is owed either way until they answer.` });
              window.setTimeout(() => {
                const d = tools.decide(o, req.cadence);
                decideOffer(d);
                markDecisionSeen(o.id);
                push({ kind: "decision", offerId: o.id });
                if (d.outcome === "approved") onJoined(o);
                else push({ kind: "say", text: "That one is not on you. Nothing about your profile changed, and the others are still open." });
              }, 2600);
            }}
            onCancel={() => { cancelAccept(req.id); push({ kind: "say", text: "Not sent. It is still open for another two days." }); }} />
        </BlockRow>
      );
    }

    case "decision": {
      const o = offers.find((x) => x.id === item.offerId); const d = decisions[item.offerId];
      const first = o ? plans.get(o.id)?.[0] : undefined;
      return o && d ? <BlockRow><DecisionBlock offer={o} decision={d} firstDue={first ? relDay(first.day, today) : undefined}
        onGo={d.outcome === "approved" ? () => { openCampaign(o.id, "content"); openPanel("offers"); } : undefined} /></BlockRow> : null;
    }

    /* THE CALCULATOR, and only ever here — after the campaign is
       theirs. Alex: "we want to calculate when you join a campaign,
       not before." */
    case "earnings": { const o = offers.find((x) => x.id === item.offerId); return o ? <BlockRow><EarningsBlock offer={o} /></BlockRow> : null; }

    case "changes": return profile ? <BlockRow><ChangesBlock changes={profile.changes.filter((c) => item.changeIds.includes(c.id))} /></BlockRow> : null;
    default: return null;
  }
}

/* WHAT THE AGENT CAN ANSWER MID-FLOW. Rasha: "an influencer can ask,
   from the first analysis, 'when do I get paid?'" — so these are
   written to be readable the moment the read lands, before there is a
   campaign to point at. */
const ANSWERS: Record<string, string> = {
  pay: "Every campaign pays you a share of every order you bring in. The brand sets the share and it is the same for everybody on that campaign, so there is nothing for you to price. It is paid weekly on the orders that cleared. What that comes to depends on how many orders your code carries, so the campaign works it out with you once you have joined rather than guessing at you now.",
  match: "Four things, and audience size is not one of them: how much of your audience is in a market the brand actually ships to, how much of your grid is already advertising, how consistently you post, and who the brand asked for. Open a campaign and it lists all four with what it found. Your three strongest matches are Pre-qualified, which means you join them outright. Any other campaign you can request to join, and the brand answers.",
  payment: "The brand funded the phase before the brief was written, so the money is already with HeyMoon rather than on the brand's terms. Orders attributed to your code and your tracking link are counted weekly, and your share of the ones that cleared is paid out the same week.",
  terms: "Nothing exclusive, and no usage past 90 days. The brand cannot run your post as an ad after that without asking you again, and nothing you agree here touches your other posts.",
  followers: "They are not what you are matched on. A large following in a country the brand does not ship to is worth nothing to it, and a grid that is mostly advertising converts worse than a smaller one that is not. What HeyMoon reads is where your audience is, how much of your grid is your own work, how consistently you post, and who the brand asked for.",
};
