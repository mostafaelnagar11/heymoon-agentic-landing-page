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
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { ChatShell } from "../components/chat/ChatShell";
import { PanelHost } from "../components/chat/PanelHost";
import { AgentTurn, BlockRow, UserTurn } from "../components/chat/Turn";
import { Composer } from "../components/chat/Composer";
import { WorkingLine, Typed } from "../components/Stream";
import { Btn } from "../components/ui";
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
  claimOnce, confirmAccept, cancelAccept, decideOffer, dropThread, liveThread, markDecisionSeen, openCampaign, openPanel, push,
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

  const readRun = useStream<CreatorRead>();
  const buildRun = useStream<Profile>();
  const offerRun = useStream<Offer[]>();

  /* ONE THING ARRIVES AT A TIME.
   *
   * The agent pushes a burst — a sentence, the block it is about, then
   * the sentence after it — and every one of them used to mount in the
   * same frame, so three messages appeared at once and the middle one
   * was a component nobody had been told about yet. A conversation does
   * not work that way.
   *
   * So the thread is REVEALED rather than rendered: the item arriving
   * reports when it has finished, and only then does the next appear. A sentence reports
   * when it has finished typing; a block reports after a beat; a line
   * the creator typed themselves reports immediately, because they
   * already know what it says.
   *
   * `landed` counts the items that have FINISHED arriving, and the
   * thread always shows those plus the ONE that is arriving now. This
   * used to count what was visible and reveal the next item when the
   * newest visible one reported — which deadlocked from zero: nothing
   * visible, so nothing to report, so nothing ever appeared. It hit
   * exactly the path every real creator takes, arriving from the
   * landing page, and was invisible when the conversation was opened by
   * URL, which is how every check had opened it.
   *
   * `null` until the first effect, so a RESTORED conversation reveals
   * whole: history should not replay itself. What counts as history is
   * read from the STORE, once — not from this render's snapshot, which
   * can be the empty server one on a full page load, and not twice,
   * which in development would count the conversation's own first
   * pushes as history and skip typing them. */
  const [landed, setLanded] = useState<number | null>(null);
  const [restored, setRestored] = useState(0);
  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const n = liveThread().length;
    setLanded(n);
    setRestored(n);
  }, []);
  const advance = useCallback(() => setLanded((n) => (n === null ? n : n + 1)), []);

  const visible = landed === null ? [] : thread.slice(0, landed + 1);
  const cursor = landed !== null && landed < thread.length ? thread[landed] : null;

  /* SCROLL THE THREAD, AND ONLY THE THREAD. This was
     `bottom.scrollIntoView()`, which scrolls every ancestor that has any
     overflow to reach the target — including the app shell. The shell is
     `overflow: hidden`, which stops a person scrolling it but not a
     script, so after a join the whole app slid up 304px on a phone,
     the composer floated mid-screen over white space, and nothing could
     scroll it back. Setting the one scroller's `scrollTop` cannot touch
     anything outside it. */
  const pin = useCallback(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);
  /* On `landed`, not `visible.length`: the step that finishes the thread
     (and brings the dashboard button in under it) does not change how
     many items are visible, so keyed on the length it never scrolled,
     and on a phone the button landed below the fold. */
  useEffect(() => { pin(); }, [landed, readRun.progress.done, buildRun.progress.done, pin]);

  /* ── 1. The read ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!threadIsEmpty()) return;
    if (!claimOnce(`read:${handle}`)) return;
    push({ kind: "say", text: `Hi! Let me have a look at ${handle}.` });
    push({ kind: "read", handle });
    readRun.start(
      (ctx) => tools.read_profile({ handle }, ctx),
      (value, cancelled) => {
        if (!value) return;
        putRead(value);
        /* Nothing for this person, said where it happens. */
        if ((value.standing?.state ?? "ok") !== "ok") { push({ kind: "rejected", readId: value.id }); return; }
        /* The result is the strip at the foot of the read block, so it
           is not said again here — it used to be, word for word, in the
           next bubble down. Only a stopped read needs a sentence. */
        if (cancelled) push({ kind: "say", text: "Stopped there. What arrived is enough to build on." });
        /* WHAT A PERSON WOULD SAY WITH YOUR PROFILE ON THEIR PHONE: you
           are a fit and why, then what HeyMoon is — and only then the
           question. Alex, 28 Sep: "the conversation and experience need
           to mimic a little bit of that." */
        push({ kind: "say", text: tools.welcome_line({ read: value }) });
        push({ kind: "intro" });
        push({ kind: "say", text: CHECK });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  /* ── 2. Build the profile ─────────────────────────────────────── */
  const build = useCallback((read: CreatorRead) => {
    push({ kind: "say", text: "Great. I am building your profile now." });
    buildRun.start(
      (ctx) => tools.propose_profile({ read }, ctx),
      (value) => {
        if (!value) return;
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
  const send = () => {
    const t = text.trim(); if (!t) return;
    setText("");
    push({ kind: "user", text: t });
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
  const chips = !profile ? [] : offers.some((o) => o.state === "approved")
    ? ["How is it doing?", "When do I get paid?", "Show me my profile"]
    : ["When do I get paid?", "Why did this match me?", "No gambling or vaping"];


  return (
    <ChatShell panel={<PanelHost />}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-16">
        {/* THE CONTAINER. Every block in the thread sizes itself by
            this column's width (`@lg:` = 512px), not the viewport's:
            with the panel open at 768px this column is 361px, which is
            a phone, and it should be laid out like one. */}
        <div className="@container mx-auto w-full max-w-[720px] space-y-5">
          {visible.map((item, i) => (
            <Item key={item.id} item={item} last={i === thread.length - 1} readRun={readRun} onJoined={joined}
              instant={i < restored}
              onTyped={item.kind === "say" && cursor?.id === item.id ? advance : undefined}
              onLooksRight={() => { const read = Object.values(reads)[0]; push({ kind: "user", text: "Yes, that's me" }); if (read) build(read); }}
              onSomethingOff={() => { push({ kind: "user", text: "Not quite" }); openPanel("read"); push({ kind: "say", text: "No problem. Tell me what I got wrong, or change it in the panel, and I will build on your version." }); }} />
          ))}
          {/* Anything that is not a sentence lands on a beat rather than
              reporting for itself. A line the creator typed needs no
              beat at all — they know what it says. */}
          {cursor && cursor.kind !== "say" && (
            <Landed key={`landed-${cursor.id}`} after={cursor.kind === "user" ? 0 : 480} onArrived={advance} />
          )}
          {/* ONE LIVE COMPONENT PER RUN, never two reporting the same
              work. The read reports itself: every row names the agent
              filling it (ReadBlock). Building the profile is the roster.
              Matching has nothing else on screen, so it is the line. */}
          {buildRun.status === "running" && <BlockRow><TaskRoster tasks={BUILD_TASKS} done={BUILD_TASKS.slice(0, buildRun.progress.done).map((t) => t.key)} live title={rosterTitle(BUILD_TASKS, "building your profile")} /></BlockRow>}
          {offerRun.status === "running" && <BlockRow><WorkingLine note={offerRun.note} done={offerRun.progress.done} total={offerRun.progress.total} status="running" /></BlockRow>}
          {/* Held back until the thread has finished arriving. It is not
              a thread item, so nothing gated it, and it turned up beside
              a sentence that was still being typed. */}
          {offers.some((o) => o.state === "approved") && landed !== null && landed >= thread.length && (
            <BlockRow>
              <Link href="/creators/dashboard" className="g-button inline-flex h-12 items-center gap-2 rounded-pill px-5 text-body font-semibold text-white">
                Go to your dashboard <ArrowRight size={14} weight="bold" aria-hidden />
              </Link>
            </BlockRow>
          )}
        </div>
      </div>
      <Composer value={text} onChange={setText} onSend={send} chips={chips} onChip={(c) => setText(c)}
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
      <ToastHost onOpen={(id) => { openCampaign(id, "content"); openPanel("offers"); }} />
    </ChatShell>
  );
}

/* ------------------------------------------------------------------ */

/** Reveals whatever comes next, once this one has landed. A safety net
    as much as a beat: if an item never reported, the conversation would
    stop dead, and a thread that stalls is worse than one that hurries. */
function Landed({ after, onArrived }: { after: number; onArrived: () => void }) {
  useEffect(() => {
    const id = setTimeout(onArrived, after);
    return () => clearTimeout(id);
  }, [after, onArrived]);
  return null;
}

function Item({ item, last, readRun, onLooksRight, onSomethingOff, onJoined, instant, onTyped }: {
  item: ReturnType<typeof useThread>[number];
  last: boolean;
  readRun: ReturnType<typeof useStream<CreatorRead>>;
  onLooksRight: () => void;
  onSomethingOff: () => void;
  onJoined: (o: Offer) => void;
  /** Restored from a previous session: render it, do not replay it. */
  instant?: boolean;
  /** Set on the newest sentence. Fires when it has finished typing. */
  onTyped?: () => void;
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
      return (
        <AgentTurn>
          {instant
            ? <p className="whitespace-pre-line text-body text-ink">{item.text}</p>
            : <Typed text={item.text} onDone={onTyped} />}
          {isCheck(item.text) && last && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn size="sm" onClick={onLooksRight}>Yes, that&apos;s me</Btn>
              <Btn size="sm" variant="quiet" onClick={onSomethingOff}>Not quite</Btn>
            </div>
          )}
        </AgentTurn>
      );

    case "read": {
      const read = readRun.partial ?? Object.values(reads)[0] ?? null;
      return <BlockRow><ReadBlock read={read} live={readRun.status === "running"} onOpen={() => openPanel("read")} /></BlockRow>;
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
