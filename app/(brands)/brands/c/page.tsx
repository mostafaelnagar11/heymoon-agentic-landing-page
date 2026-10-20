"use client";

/* The application.

   One surface: a rail of conversations, the conversation itself, and one
   panel beside it. Every screen this product used to have is now either a
   block in this conversation or a view in that panel, so there is no
   navigation to speak of — the only two places a brand can act are the
   message box and the panel.

   The rule this screen exists to demonstrate: free text changes the
   actual plan. Typing "Kuwait only" re-derives the market fit of every
   creator, drops the ones whose audience is not there, rebuilds the
   crew the warm-up can afford and moves the guarantee — and every one
   of those changes is attributed back to the sentence that caused it.

   What free text never changes is the price. Phase 1 is a $1,000
   warm-up for every brand, so there is no budget in this conversation
   to raise, lower or negotiate; where a brand asks, the agent explains
   why it does not move rather than offering a number it will not
   honour. What the brand does choose is what the thousand is pointed
   at, and therefore what we are willing to guarantee on it.

   The order of the whole thing is fixed and the agent says so out loud:
   read the store → propose the campaign → start Phase 1 (pay) → connect
   the store. The connection comes LAST because it measures the guarantee
   rather than qualifying the brand, and the copy explains that rather
   than leaving the brand to wonder why. */

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SignInSheet } from "../components/SignInSheet";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BUILD_TASKS, PHASE1_BUDGET, PHASE_BUDGETS, PHASE_MULTIPLES, ladderTotals, marketName,
  repair, tools, underwriting,
  type Repair,
} from "../lib/agent/tools";
import {
  CREATORS_ANSWER, GOALS, HELD, TALK, firstAnswer, isQuestion, looksLikeName, lookupBrand,
} from "../lib/agent/intake";
import type { BrandRead, Plan, PlanChange, PlanPatch, ProductFocus, Report } from "../lib/agent/types";
import { useStream } from "../lib/agent/useStream";
import {
  activePlanLive, activeThread, claimOnce, correctRead, markPaid, openPanel, useAccount,
  ROLES, accessFor, claimBrand, requestAccess, salesFirst, setRole, useRole,
  push, putApproval, putCampaign, putFunding, putPlan, putRead, threadIsEmpty,
  useActivePlan, useAds, useCampaigns, useActiveThreadId, useCan, useLivePhase, usePaid, usePhaseRequested,
  accountLive, activeCampaignLive, isLaunching, markSent, startConversation, teamRoleFor,
  connectStore, nextBrandStep, patchLaunch, recordCheck, useActiveCampaign, useStore, type Campaign, type PanelView,
} from "../lib/store";
import { fmtUSD } from "../lib/mock/campaigns";
import { getRead, readIdFor } from "../lib/agent/registry";
import { normaliseUrl } from "../lib/mock/reads";
import { looksLikeEmail, maskEmail } from "../lib/email";
import { STR, dayIn, useT } from "../lib/i18n";
import { track } from "../lib/track";
import { Btn, Card } from "../components/ui";
import { Thinking, Typed, WorkingLine } from "../components/Stream";
import { ChatShell } from "../components/chat/ChatShell";
import { Composer } from "../components/chat/Composer";
import { PanelHost } from "../components/chat/PanelHost";
import { AgentTurn, BlockRow, UserTurn } from "../components/chat/Turn";
import {
  AdCardBlock, ApprovalBlock, BriefBlock, ChangesBlock, ConfidenceBar, ConfidenceBlock,
  CreatorBlock, FundingBlock, LadderBlock, PlanBlock, ReadBlock, ReceiptBlock,
  RejectedBlock, ReportBlock, TaskRoster, briefLine, countWord, rosterTitle,
} from "../components/blocks";
import { PlanCard } from "../components/PlanCard";
import { BriefReviewBlock, ConnectBlock, DiscountBlock, StoreCheckBlock } from "../components/chat/MoonConnect";
import { LaunchTracker } from "../components/dashboard/LaunchTracker";
import {
  LAUNCH_BY_DAYS, PHASE_START_DAYS, PLATFORMS, platformFor, plusDays, type CouponRules, type PlatformKey,
} from "../lib/agent/connect";
import { applyBriefChange } from "../lib/agent/briefChange";
import {
  EmailSentBlock, IncludesBlock, MarketsPick, ProductsPick, focusText,
} from "../components/ScopeBlocks";

/* What the Phase 1 payment was made against. After the phase is paid an
   edit to any of these is not applied — the agent carries it into Phase 2
   instead. The brief and the audience can still move, because they change
   what the creators are told, not what the brand was charged. */
const touchesLocked = (p: PlanPatch) =>
  p.budget !== undefined || p.strategy !== undefined ||
  p.markets !== undefined || !!p.dropCreatorIds?.length || !!p.addCreatorIds?.length || !!p.setCrewIds?.length;

/* The chips offered when the agent is not waiting on a specific answer.
   Before payment they are things a brand can actually change; none of
   them names a creator, because names are held back until Phase 1
   starts, and none of them offers to move the budget, because the
   warm-up price is the same for everybody. After payment the plan is
   locked, so they are about what happens now. */
const WHY_CHIP = `Why is it ${fmtUSD(PHASE1_BUDGET)}?`;
/* Starting leads, because it is the only one of these that finishes
   anything. An edit used to leave a brand with four ways to change the
   plan again and no way forward from it: the markets branch of
   `followUp` offered three edits, and every path that fell through to
   this row offered four. A plan on screen can always be started, so the
   way to start it is always on screen. `liveChips` takes it back out
   once the payment card is open, so it is never offered twice. */
const PRE_CHIPS = ["Start Phase 1", "I still want to talk it through", "Email me the plan", "Kuwait only", "See all three phases"];
/* The three ways out of a finished plan (brand flows, P0 "ready?"): start, keep talking, or leave with it saved. The
   second is as plain as the first, because 56% of what a brand asks at kickoff it already asked once (19 Oct). */
const READY_CHIPS = ["Start Phase 1", "I still want to talk it through", "Email me the plan"];
/* Phase 1, explained before any plan (brand flows, P0): the questions brands ask about it, then on. */
const PHASE1_CHIPS = ["Makes sense", "How does the refund work?", "Any other fees?", "Can I choose the creators?"];
/* After payment there is exactly one thing left to do, and it is now
   ON the dashboard: the connect step moved there, because a task with
   no deadline does not belong in a thread that scrolls away. So the
   dashboard leads for a brand who has not connected yet — it is where
   the step is — and sits second once there is a running phase to look
   at instead. */
const POST_CHIPS = ["What happens next?", "Go to the dashboard"];
const POST_CHIPS_UNCONNECTED = ["Go to the dashboard", "What happens next?"];

/* The brand never reads a staffing chart. What the agents are called,
   how many of them there are and which one found what is our business;
   the brand is told the result. The only place a name may appear is a
   roster block, and never in a sentence. */

/** "a, b and c" — the agent speaks, so it does not use a serial comma. */
const listOf = (parts: string[]) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

/** "Three creators" — the count as a word, at the start of a sentence. */
const countUp = (n: number) => {
  const w = countWord(n);
  return `${w[0].toUpperCase()}${w.slice(1)}`;
};

/* The disclaimer is about the decision it sits under, so it only sits
   under that decision. Once Phase 1 is paid there is nothing left to
   check before paying, and a line that repeats a warning about a step
   already taken teaches a brand to stop reading the composer. */
const NOTE = "Check the details before you pay.";

/* A domain, with or without a scheme or a path. Deliberately narrow —
   it only has to beat "Kuwait only" and "guarantee 8x", not validate a
   URL, and `normaliseUrl` does the tidying afterwards. */
const LOOKS_LIKE_STORE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

const ALREADY_PAID = "Phase 1 is already started and paid. Phase 2 opens when Phase 1 reaches 80% of its sales target.";
const LOCKED = "Phase 1 is paid and its plan is locked. I will carry that change into Phase 2 when it is offered.";
const SHOW_PHASES = "All three phases. You're starting the first.";

/* "See all three phases" and the ways a person actually says it. */
const PHASES_RE = /three phases|the phases|later phases|other phases|next phases|further phases|phases? (2|3|two|three)|whole plan|big picture/;

/* Four views a brand may simply name. `interpret` knows about the plan,
   not about the panel, so these are caught here — after everything it
   can answer, and before the agent admits it did not understand. */
const PANEL_INTENT: { re: RegExp; view: PanelView; say: string }[] = [
  {
    re: /\bads?\b|\bcreatives?\b/,
    view: "ads",
    say: "Opening every ad in the panel. Each one shows how it is doing and whether it is waiting on you.",
  },
  {
    re: /\binbox\b|needs (me|you)|waiting on me/,
    view: "inbox",
    say: "Opening what needs you, in the panel. Nothing on it goes out without your approval.",
  },
  {
    re: /\bactivity\b|on your own|what have you done/,
    view: "activity",
    say: "Opening what I did on my own, in the panel. Each one carries its reason and an undo.",
  },
  {
    re: /\bautonomy\b|what (can|may) you do|without asking/,
    view: "autonomy",
    say: "Opening what I may do alone, in the panel. Moving money and publishing are never on that list.",
  },
];

/** What the agent is waiting on (see `wait` below). */
type Wait =
  | null | "store" | "other-store" | "goal" | "focus" | "launch-note" | "products" | "phase1"
  | "email" | "email-them" | "reveal-plan" | "brief-review";

/** What the brand settles before the plan is built (brand flows, P0). */
type Scope = { markets?: string[]; focus?: ProductFocus };

/** "a or b", for the stores a brand name points at. */
const orList = (parts: string[]) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} or ${parts[parts.length - 1]}`;

function ChatInner() {
  const { t, tf, locale } = useT();
  /* After payment the agent speaks the brand's language (PRD v0.2, H6). Platform names as the brand says them. */
  const pnameIn = (p: PlatformKey) => (locale === "ar" ? PLATFORMS[p].ar.name : PLATFORMS[p].name);
  const router = useRouter();
  const plan = useActivePlan();
  const thread = useStore(activeThread);
  const threadId = useActiveThreadId();
  /* The phase this conversation's campaign is running, if any. Read
     from the store rather than from the module fixture, which is one
     ladder for the whole app and returned another campaign's numbers
     the moment there were two. */
  const livePhase = useLivePhase();
  const funding = useStore((s) => s.funding);
  const approvals = useStore((s) => s.approvals);
  const connected = useStore((s) => (s.activeCampaignId ? s.campaigns[s.activeCampaignId]?.connectedStore ?? null : null));
  const account = useAccount();
  /* Paid, no first sale yet: the brand's steps run here, then Moontech's (PRD v0.2). */
  const camp = useActiveCampaign();
  const launching = isLaunching(camp);
  const role = useRole();
  const brands = useStore((s) => s.brands);
  const [signInOpen, setSignIn] = useState(false);
  /* A member can't set the discount or approve the brief: those cards say who can, and the chips give them a way on. */
  const canSetCode = useCan("pay");
  const canBrief = useCan("brief");
  const memberChips = ["Go to the dashboard", "What happens next?"];
  /* What waits on the sign-in: the read of the store the brand just confirmed, or (signed out later) the payment. */
  const gateRef = useRef<{ host: string; go: () => void } | null>(null);
  const [gateHost, setGateHost] = useState<string | null>(null);
  /* The chips the thread offers once Phase 1 is paid for. */
  /* Until the brief is approved the brand's next step leads and the dashboard is the last choice (PRD v0.2, H1). */
  const postChips = launching && nextBrandStep(camp)
    ? ["Continue", "What happens next?", "Go to the dashboard"]
    : connected ? POST_CHIPS : POST_CHIPS_UNCONNECTED;
  const ads = useAds();
  const paid = usePaid();

  const campaignCount = useCampaigns().length;
  /* Whether Phase 1's payment card is already in the thread. Used to
     drop the "Start Phase 1" chip, for the same reason the ladder
     drops its button: the card below is the live one. */
  const requested = usePhaseRequested(plan?.id, 1);
  /* Chips that answer with the same words however many times they are
     pressed. An explainer is not an action: once a brand has been told
     what happens next, offering to tell them again is a button that
     does nothing new, sitting where the button that moves them on
     should be. Asked once, gone.

     Read off the transcript rather than held in state, because that is
     where the question already lives: pressing a chip pushes it as the
     brand's own message. So it survives a reload, and it is per thread
     for free — a second campaign has not asked anything yet. */
  const EXPLAINERS = new Set(["What happens next?", WHY_CHIP]);
  /* Whether this conversation has read a store yet. Before it has, whatever the brand types is a link, a brand name
     or a question (brand flows, P0). */
  const hasRead = thread.some((i) => i.kind === "read");
  const asked = new Set(thread.filter((i) => i.kind === "user").map((i) => (i as { text: string }).text));

  /* "Start Phase 1" comes out of the chip row the moment the card
     asking for it is on screen. Filtered HERE, at render, not where
     each list is written: `setAsking` stores a snapshot, so a list
     filtered when it was asked keeps the chip that was correct then
     and is wrong now. */
  const liveChips = (opts: string[]) =>
    opts.filter(
      (o) =>
        !(requested && o === "Start Phase 1") &&
        !(EXPLAINERS.has(o) && asked.has(o))
    );
  const [text, setText] = useState("");
  /* The connection handler (PRD v0.2, H7): offline blocks the chat with one line and no error page; back online, it
     says so and carries on where it was. */
  const [online, setOnline] = useState(true);
  const [backOnline, setBackOnline] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = () => { setOnline(false); setBackOnline(false); track("hm_error_shown", { kind: "connectivity" }); };
    const on = () => { setOnline(true); setBackOnline(true); clearTimeout(t); t = setTimeout(() => setBackOnline(false), 3000); };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    if (!navigator.onLine) off();
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); clearTimeout(t); };
  }, []);
  const [changes, setChanges] = useState<Record<string, PlanChange[]>>({});
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [fix, setFix] = useState<Repair | null>(null);
  /* Chips the agent is currently waiting on an answer to. A question it
     asks and then forgets is not a conversation. */
  const [asking, setAsking] = useState<{ q: string; options: string[] } | null>(null);
  /* After the read the agent asks whether it looks right before building.
     "Something's off" parks the build until the brand says what — the
     next message is recorded as a correction and the build proceeds. */
  const [pendingRead, setPendingRead] = useState<BrandRead | null>(null);
  /* The one answer the agent is waiting on, when it asked for something specific: a store, the brand's goal, what
     is launching, which products, the questions about Phase 1, the brief, an email address. State rather than a
     sentence matched in the thread, so rewording a question can never switch its answer off. */
  const [wait, setWait] = useState<Wait>(null);
  /* What the brand said it is hoping for, and whether Phase 1 has been explained. Per conversation. */
  const goalRef = useRef<string | null>(null);
  const explainedRef = useRef(false);
  const [awaitingCorrection, setAwaitingCorrection] = useState(false);
  /* The scope the brand confirms before the plan is built (brand team, 15 Oct): which markets, which products. A
     ref beside the state, because the build's completion callback reads it after the closure that started it. */
  const [scope, setScopeState] = useState<Scope>({});
  const scopeRef = useRef(scope);
  /* The build's callback outlives the render that started it, so it reads the role through a ref. */
  const roleRef = useRef(role);
  roleRef.current = role;
  const setScope = (next: Scope) => { scopeRef.current = next; setScopeState(next); };
  /* Which agent messages have finished typing. Held here rather than in
     the store: it is a property of this viewing, not of the thread. */
  const [typedDone, setTypedDone] = useState<Record<string, true>>({});
  const finish = (id: string) => setTypedDone((d) => (d[id] ? d : { ...d, [id]: true }));
  /* Only the newest message types. Everything above it is history and
     renders whole — otherwise coming back to the conversation would set
     the entire transcript retyping. */
  const lastSay = [...thread].reverse().find((i) => i.kind === "say");
  const isTyping = !!lastSay && !typedDone[lastSay.id];
  /* While it types, nothing below it is shown. A card that lands before
     the sentence introducing it reads as two things happening at once. */
  const visible = isTyping
    ? thread.slice(0, thread.findIndex((i) => i.id === lastSay!.id) + 1)
    : thread;
  const qs = useSearchParams();
  const buildFor = qs.get("build");
  /* What the landing field passed when it was not a link: a brand name or a question (brand flows, P0). */
  const firstText = qs.get("q");
  /* From the plan email's link, or the dashboard's "Pick up where you left off" (brand flows, P1). */
  const back = qs.has("back");
  const readUrl = qs.get("read") ? normaliseUrl(qs.get("read")!) : null;
  const build = useStream<Plan>();
  /* The build roster waits for the sentence introducing it. Declared
     after the stream handle, not beside `visible`, which runs first. */
  const rosterReady = build.status === "running" && !isTyping;
  const readRun = useStream<BrandRead>();
  const reads = useStore((s) => s.reads);
  const scroller = useRef<HTMLDivElement>(null);
  const report = useStream<Report>();

  /* Only one run is ever open at a time, so the composer needs one
     handle rather than three. Cancelling from down there is the same
     cancel the thread used to offer beside the progress line — that
     control moved into the message box, where every chat people
     already use keeps it. */
  const stop =
    readRun.status === "running" ? readRun.cancel :
    build.status === "running" ? build.cancel :
    report.status === "running" ? report.cancel :
    null;

  /* The read this conversation is about, if it has already been done —
     by this thread earlier, or before the panel was opened on it. */
  const storedRead = readUrl ? reads[readIdFor(readUrl)] ?? null : null;

  /* Bring the TOP of the newest turn to the top of the column, and
     leave it there.
 
     This used to jump to the bottom of the scroller on every change,
     and then again on every typewriter tick. On a long answer that
     means the brand watches the last line being written and never sees
     the first — you read the end of a paragraph, then scroll back up
     to find out what it was about. Alex caught it on the review call.
 
     Measured against the two rects rather than `offsetTop`, which is
     relative to the nearest positioned ancestor and would silently
     change meaning if anything between here and the turn ever gained
     `position: relative`. `scrollTo` clamps, so a short thread simply
     lands where it can. */
  const park = useCallback((smooth: boolean) => {
    const box = scroller.current;
    if (!box) return;
    const last = box.querySelector<HTMLElement>("[data-last-turn]");
    if (!last) return;
    const top = box.scrollTop + (last.getBoundingClientRect().top - box.getBoundingClientRect().top) - 16;
    box.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => { park(true); }, [thread.length, report.partial, park]);

  /* The build happens HERE, in the conversation, not on a page the
     conversation comes after. The agent narrates what it is doing, the
     plan assembles in front of you, and it ends by asking you something
     — which is what makes the next turn yours. */
  /* A new conversation (New campaign, a fresh arrival) starts with nothing pending from the last one: a brief-review
     wait left over from campaign A turned B's typed words into brief lines. Only an EMPTY thread: the id also changes
     once when the saved session loads after the first render, and resetting then wiped the first question's chips. */
  useEffect(() => {
    if (!threadIsEmpty()) return;
    setWait(null);
    setAsking(null);
    setPendingRead(null);
    goalRef.current = null;
    explainedRef.current = false;
  }, [threadId]);

  useEffect(() => {
    const existing0 = activePlanLive();
    /* Read from the store, not from this render: on a cold load the first render has not seen the saved session yet,
       and a paid brand was welcomed back as if they had never paid. */
    const camp0 = activeCampaignLive();
    const paid0 = !!camp0?.paid;
    if (back) {
      /* Taken off the URL, so a reload does not welcome them back twice. */
      const q = new URLSearchParams(window.location.search);
      q.delete("back");
      window.history.replaceState(null, "", window.location.pathname + (q.toString() ? `?${q}` : ""));
      if (existing0 && !paid0 && claimOnce(`back:${threadId}`)) { welcomeBack(existing0); return; }
    }
    /* The landing's `?read=` or `?q=`, used once per page load. A fresh arrival (not a reload) that finds an older
       conversation starts a new one, or a rehearsal's thread took the demo's store over; and "New campaign" on the
       same URL no longer replays the entry into the new thread. */
    const entry = readUrl || firstText ? window.location.search : null;
    const reload = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload";
    const fresh = !!entry && usedEntry !== entry;
    if (fresh && !threadIsEmpty()) {
      if (!reload) { startConversation(); return; }
      usedEntry = entry;
    }
    if (!threadIsEmpty()) return;
    /* A used entry falls through to the plain new-conversation greeting below. */
    const take = fresh;
    if (take) usedEntry = entry;
    if (take && firstText && !readUrl) {
      push({ kind: "user", text: firstText });
      intake(firstText);
      return;
    }
    if (take && readUrl) {
      /* A read that already finished is shown as it stands, not re-run.
         The agent picks the conversation up at the question it would
         have asked when the read landed. */
      if (storedRead?.eligibility) {
        push({ kind: "say", text: `Already read ${readUrl}.` });
        push({ kind: "read", url: readUrl });
        afterRead(storedRead);
        return;
      }
      if (!accountLive()) { readStore(readUrl); return; }
      push({ kind: "say", text: `Reading ${readUrl}.` });
      push({ kind: "read", url: readUrl });
      return;
    }
    const existing = activePlanLive();
    if (buildFor && !existing) {
      const read = getRead(buildFor);
      push({ kind: "say", text: `${read.url} is read. Building your plan now.` });
      return;
    }
    if (existing) {
      /* Unpaid, it is a return visit (brand flows, P1). Paid, the plan and the brief are what they came back for
         (19 Oct review: "a way back to the plan and brief after paying"). */
      if (!paid0) { welcomeBack(existing); return; }
      /* Paid, and their steps aren't done: the next one, here, where it happens (PRD v0.2). */
      if (isLaunching(camp0)) {
        say(tf("post.welcome", { brand: existing.brandName }));
        resumeLaunch(camp0);
        return;
      }
      push({ kind: "say", text: `Your campaign for ${existing.brandName}. Phase 1 is paid and running.` });
      push({ kind: "plan-card" });
      setAsking({ q: "", options: postChips });
    } else {
      push({
        kind: "say",
        text: campaignCount
          ? "A new campaign, then. Paste the store link, or the brand's name."
          : "Nothing is planned yet. Paste your store link, or tell me the brand's name, and I'll build a campaign from it.",
      });
    }
    /* Keyed on the thread, not on mount. Opening a second conversation
       swaps the thread under this component rather than remounting it,
       so an empty new one has to be greeted the same way the first was.
       `threadIsEmpty` above keeps it from re-greeting one that already
       has a transcript. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  /* What the agent says once a read is complete: the one eligibility line
     that matters, then — if it clears — the question that puts the next
     turn with the brand before anything is built. */
  const afterRead = (v: BrandRead) => {
    const ok = v.eligibility?.state === "ok";
    if (ok) {
      setPendingRead(v);
      /* A reaction, then the question. The agent has just read a whole
         shop in fifteen seconds and used to report it like a form
         submission. Reacting to the work rather than to the shop keeps
         it true for every store: nobody's catalogue is being flattered,
         the agent is just pleased with what it has to work with. */
      ask(`Okay. That is plenty to work with.\n\nHere's what I found. Does it look right?`, ["Looks right", "Something's off"]);
    } else {
      /* What did not clear is on the block below, in the words the
         read itself used. Repeating it here would put someone else's
         punctuation in the middle of the agent's sentence. */
      /* No store at all (a profile, a link page): there is nothing to correct or re-check, only the right link. */
      if (v.eligibility?.missing?.some((m) => /online store/i.test(m.label))) {
        say(`There's no online store at ${v.url}, so I stopped there. HeyMoon needs a store with a checkout to guarantee sales.`);
        push({ kind: "rejected", readId: v.id });
        ask("Paste your store's link, or the brand's name, and I'll read that instead.", []);
        setWait("store");
        return;
      }
      say(`One thing didn't clear. Everything else stands.`);
      push({ kind: "rejected", readId: v.id });
      ask("Tell me what to correct, or I'll log a manual re-check.", ["Log a re-check", "Read a different store"]);
    }
  };

  /* The read runs first, in the conversation. When it lands the agent
     says the one thing that matters about eligibility and then either
     asks whether it looks right or explains the shortfall — both as
     blocks in the thread, not as another screen. A read that already
     finished is not run again. */
  /* Extracted so a brand who stopped a read can ask for it again. The
     completion claim is spent only by a run that FINISHES, so the
     second attempt is free to report. */
  const runRead = (url: string | null = readUrl) => {
    if (!url) return;
    readRun.start(
      (ctx) => tools.read_site({ url }, ctx),
      (v, cancelled) => {
        if (!v) return;
        /* A cancelled read is a SHORTER read, and it must never be
           written over a longer one. `read_site` resolves a cancelled
           run with its own truncated accumulator, which carries the
           same id as the finished read — so storing it unconditionally
           replaced a complete read with a partial one the moment a
           brand pressed stop on a store they had already read. */
        if (!cancelled || !storedRead?.eligibility) putRead(v);
        if (cancelled) {
          /* The claim belongs to the run that FINISHED. Spending it
             here would silence the completed read that follows. */
          say("Stopped there. What I found is above, and I can finish the job if you want it.");
          setAsking({ q: "", options: ["Read it again", "Work with this"] });
          return;
        }
        /* Many runs may START — React tears the first one down and the
           second one begins — but only one may REPORT, or the brand sees
           the same answer twice. The claim is on the result, not on the
           attempt. */
        if (!claimOnce(`read-done:${url}`)) return;
        afterRead(v);
      }
    );
  };

  useEffect(() => {
    if (!readUrl || readRun.status !== "idle") return;
    if (storedRead?.eligibility) return;
    /* Signed out, the read waits for the sign-in sheet, which runs it (readStore). */
    if (!accountLive()) return;
    runRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readUrl]);

  /** Payment, offered as a confirmation the brand presses. Refused once
      the phase is paid: the request id is the same both times, and a
      second one would read as an invitation to pay twice. */
  const openFunding = () => {
    if (!plan) return;
    if (paid) { say(ALREADY_PAID); setAsking({ q: "", options: postChips }); return; }
    /* The card is already open further down. Pushing a second one is
       two identical requests in the thread and two buttons that move
       the same money. */
    if (requested) {
      say("The payment is already open below. Confirm it there, or say “not yet”.");
      return;
    }
    /* Money cannot move for nobody. The brand signed in when they confirmed the store (needAccount), so this only
       catches someone who signed out since: the sheet opens over the thread and the payment card is what it opens onto. */
    if (!account) { needAccount(getRead(plan.readId).url, showFunding); return; }
    /* Signed in, but to a store somebody else already owns: only its owner can add people (brand team, 15 Oct). */
    if (accessFor(getRead(plan.readId).url, account.email, brands) === "outsider") { askForAccess(); return; }
    /* A member can't move money (store.ts, CAN): they're told who can. */
    if (teamRoleFor(getRead(plan.readId).url, account.email, brands) === "member") {
      const b = brands[getRead(plan.readId).url];
      say(`Only the owner or an admin can start a phase${b ? `, like ${b.owner.firstName}` : ""}. Nothing was charged.`);
      ask("", ["Email the plan", "Change something"]);
      return;
    }
    showFunding();
  };

  /** This store's brand account belongs to someone else. Say whose, without their whole address, and offer the
      one thing this person can do about it. */
  const askForAccess = () => {
    if (!plan) return;
    const b = brands[getRead(plan.readId).url];
    if (!b) return;
    say(
      `${b.brandName} already has a HeyMoon account. It belongs to ${maskEmail(b.owner.email)}, who paid for its first ` +
      `campaign, and only the owner can start a campaign for it or add people. Nothing was charged.`
    );
    ask("", ["Request access", "Change something"]);
  };

  /** The payment card itself, split out so the sign-in sheet can call it
      the moment it closes. */
  const showFunding = () => {
    if (!plan) return;
    const req = tools.request_funding({ plan, phaseNo: 1 });
    putFunding(req);
    /* Every figure — the total, the VAT, what Phase 1 guarantees against
       the plan's own multiple — is on the card below. The sentence
       introduces it and gets out of the way. */
    say("Here's what you're agreeing to.");
    push({ kind: "funding", requestId: req.id });
  };

  const revealReady = () => {
    setWait(null);
    ask("Ready to start Phase 1?", READY_CHIPS);
  };

  /** Everything is settled: build the plan. */
  const buildNow = (r: BrandRead) => {
    setPendingRead(null);
    setWait(null);
    say("Building your plan now.");
    startBuild(r);
  };

  /** The read this conversation is about, wherever it came from. */
  const currentRead = () =>
    pendingRead ??
    (readUrl ? getRead(readIdFor(readUrl)) : null) ??
    (buildFor ? getRead(buildFor) : null) ??
    (plan ? getRead(plan.readId) : null);

  const startBuild = (read: BrandRead) => {
    build.start(
      (ctx) => tools.propose_plan({ read, strategy: "balanced" }, ctx),
      (v0, cancelled) => {
        if (!v0) return;
        /* The calculator's two numbers are the brand's, so they win over
           whatever the proposal defaulted to. */
        /* The markets the brand picked come first, so the crew is matched where the campaign runs; the
           calculator's two numbers are the brand's, so they win over whatever the proposal defaulted to; and the
           product focus rides on the plan for the card and the brief. */
        const sc = scopeRef.current;
        let v1 = v0;
        if (sc.markets?.length && sc.markets.join() !== v0.markets.value.join() && !cancelled) {
          v1 = tools.edit_plan({ plan: v0, patch: { markets: sc.markets }, because: "because those are the markets you picked", by: "brand" }).plan;
        }
        /* The agent's own brief tells creators to cover the bestsellers. When the brand chose a launch or named
           products, that line says what they chose instead. */
        const f = sc.focus;
        const lead = f?.kind === "launch" ? `Lead with the launch: ${f.note}` : f?.kind === "specific" ? `Cover one of: ${f.products.join(", ")}` : null;
        const b0 = lead
          ? { ...v1.brief.value, mustSay: { ...v1.brief.value.mustSay, value: v1.brief.value.mustSay.value.map((l) => (/^Cover one of:/.test(l) ? lead : l)) } }
          : v1.brief.value;
        if (lead) v1 = { ...v1, brief: { ...v1.brief, value: b0 } };
        const v: Plan = sc.focus ? { ...v1, focus: sc.focus } : v1;
        /* A half-built plan is not a plan. The build assembles in
           order — markets, audience, crew, price, brief, ladder — so a
           run stopped early has real figures in the fields it reached
           and empty ones in the fields it did not. Committing that as
           the active plan showed a fully priced, guaranteed campaign
           with nobody on it ("0 matched", a $1,000 warm-up guarantee, a
           $0 – $0 expected range) and, worse, permanently closed the
           two-number question, which only opens while there is no plan.

           `budget > 0` used to be the test for "far enough". It is not:
           when the calculator settled a pair, the `edit_plan` above
           re-prices the partial and mints a $1,000 budget however early
           the run was cut. The crew is the honest test, because it is
           the step the price and the ladder are derived from. */
        const wholeEnough = v.creators.value.length > 0 && v.pool.value > 0;
        if (cancelled) {
          if (wholeEnough) putPlan(v);
          say(
            wholeEnough
              ? "Stopped, and what I had is below. Say “build the plan” to finish it as it stands."
              : "Stopped too early to show you anything. Say “build the plan” to run it again."
          );
          if (wholeEnough) push({ kind: "plan-card" });
          setAsking({ q: "", options: ["Build the plan"] });
          return;
        }
        putPlan(v);
        /* The plan is what makes a campaign real. Before there is one
           there is a read and a conversation about it, and nothing to
           put in a rail or a dashboard. */
        putCampaign(v, read.url);
        /* Only a FINISHED build claims the result. A cancelled one must
           not, or the brand could never ask for it to be finished. The
           torn-down first run of a development double-mount never gets
           here at all — useStream only reports the run that is current. */
        if (!claimOnce(`build-done:${read.id}`)) return;
        /* The plan arrives one step at a time, each waiting on the brand (19 Oct: "divided into messages and steps …
           no one is reading this much"). First the plan, then the brief if they wrote one, then the decision. The
           three phases and what the $1,000 includes are a chip away, not printed by default: Phase 1 was explained
           before the build. */
        const crew = v.creators.value.length;
        say(`Done. ${fmtUSD(v.budget.value)} in, ${fmtUSD(v.price.revenueTarget.value)} in sales guaranteed, from ${countWord(crew)} creator${crew === 1 ? "" : "s"}.`);
        push({ kind: "plan-card" });
        ask("Look right?", ["Looks right", "Change something"]);
        setWait("reveal-plan");
      }
    );
  };

  /* The build runs in its own effect, unguarded by the thread contents:
     a development double-mount tears the first run down, and the guard
     that stops the intro repeating would otherwise stop the rebuild too.
     It IS guarded by the plan: coming back to this link with a campaign
     already built must not rebuild over the brand's edits. */
  useEffect(() => {
    if (!buildFor || build.status !== "idle") return;
    if (activePlanLive()?.readId === buildFor) return;
    startBuild(getRead(buildFor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildFor]);

  /* ── Before the plan (brand flows, P0) ────────────────────────────
     Role, then the goal in their words, then what it pushes, said in the conversation rather than picked on a card,
     then where it runs, then Phase 1 explained, then the brief. `nextStep` asks whichever of those is still open,
     so every path in (a chip, a sentence, a stopped build) lands on the same next question. */
  const nextStep = (r: BrandRead) => {
    setPendingRead(r);
    if (!roleRef.current) { askRole(r); return; }
    if (!goalRef.current) { askGoal(r); return; }
    if (!scopeRef.current.focus && (r.bestsellers?.value.length ?? 0) > 0) { askFocus(r, ""); return; }
    if (!scopeRef.current.markets && (r.markets?.value.length ?? 0) > 0) { askMarkets(r); return; }
    if (!explainedRef.current) { askPhase1(); return; }
    /* No brief question here: MoonWriter drafts it after payment, from the read, the plan and this conversation
       (PRD v0.2, step 6d). */
    buildNow(r);
  };

  /** Who the agent is talking to, asked once and remembered (BuyerRole). It decides what the conversation leads with,
      never what the plan is. */
  const askRole = (r: BrandRead) => {
    const name = r.identity?.name.value;
    say(`What do you do${name ? ` at ${name}` : ""}?`);
    setAsking({ q: "", options: ROLES.map((x) => x.label) });
  };

  const onRole = (r: BrandRead, key: (typeof ROLES)[number]["key"]) => {
    setRole(key);
    roleRef.current = key;
    say(salesFirst(key) ? "Then I'll keep this about sales." : "Then I'll show you the creators and what they'll post.");
    nextStep(r);
  };

  /** Their goal, in their words (brand flows, P0). */
  const askGoal = (r: BrandRead) => {
    const name = r.identity?.name.value;
    ask(`What are you hoping this does for ${name ?? "you"}?`, [...GOALS]);
    setWait("goal");
  };

  const onGoal = (r: BrandRead, text: string) => {
    goalRef.current = text;
    setWait(null);
    if (text === GOALS[1] || /\b(launch|new collection|new product|drop|releas)/i.test(text)) {
      ask("What's launching? Name the product or the collection, and roughly when.", []);
      setWait("launch-note");
      return;
    }
    askFocus(r, text === GOALS[2] ? "Then start where it's safest: what already sells." : "Then I'd point it at what already sells.");
  };

  /** What it pushes, asked in words (19 Oct review: "in conversation instead of the picker"). */
  const askFocus = (r: BrandRead, lead: string) => {
    const top = (r.bestsellers?.value ?? []).slice(0, 3).map((p) => p.name);
    if (!top.length) { setScope({ ...scopeRef.current, focus: { kind: "bestsellers" } }); nextStep(r); return; }
    ask(`${lead ? `${lead} ` : ""}Your bestsellers are the ${listOf(top)}. Push those, or something else?`, ["Push the bestsellers", "Something else"]);
    setWait("focus");
  };

  const setFocus = (r: BrandRead, focus: ProductFocus) => {
    setScope({ ...scopeRef.current, focus });
    setWait(null);
    nextStep(r);
  };

  /** Where it runs: the markets the read found (MarketsPick), with the regional-store note. */
  const askMarkets = (r: BrandRead) => {
    say("Where should it run?");
    push({ kind: "pick-markets", readId: r.id });
    setAsking({ q: "", options: [] });
  };

  const onMarkets = (r: BrandRead, codes: string[]) => {
    setScope({ ...scopeRef.current, markets: codes });
    push({ kind: "user", text: `Run it in ${listOf(codes.map(marketName))}` });
    nextStep(r);
  };

  /** A product focus picked on the old card, in a conversation from before the question moved into words. */
  const onProducts = (r: BrandRead, focus: ProductFocus) => {
    const top = (r.bestsellers?.value ?? []).slice(0, 3).map((p) => p.name);
    push({ kind: "user", text: focus.kind === "bestsellers" ? "Push my bestsellers" : `Push ${focusText(focus, top).replace(/^Your/, "my")}` });
    setFocus(r, focus);
  };

  /* Phase 1, explained before any plan (19 Oct review). The pitch keeps the client's own shape (the number, "and the
     best part?") but leads with the step the brand is actually being asked to take, and why it is small. */
  const askPhase1 = () => {
    const t = ladderTotals();
    const k = (n: number) => `$${Math.round(n / 1000)}k`;
    const [b1, b2, b3] = PHASE_BUDGETS;
    const [, m2, m3] = PHASE_MULTIPLES;
    say(
      `How it works, before I build it:\n\n` +
      `• Phase 1: ${fmtUSD(b1)}, with ${fmtUSD(b1)} in sales guaranteed.\n` +
      `• At 80%, Phase 2 opens: ${fmtUSD(b2)} at ${m2}x. Then Phase 3: ${fmtUSD(b3)} at ${m3}x.\n` +
      `• Fall short, and you get back the same share of what you paid.\n\n` +
      `${k(t.budget)} in, ${k(t.revenue)} in guaranteed sales.`
    );
    setAsking({ q: "", options: PHASE1_CHIPS });
    setWait("phase1");
  };

  /** Plan saved and emailed: to the brand leaving for now, or to whoever decides (brand flows, P0 and P1). */
  const emailPlan = (who: "self" | "them") => {
    if (who === "self" && account) { sendPlan(account.email, false); return; }
    ask(who === "self" ? "Where should I send it?" : "What's their email? I'll send them the plan with a link back here.", []);
    setWait(who === "self" ? "email" : "email-them");
  };

  const sendPlan = (to: string, them: boolean) => {
    if (!plan) return;
    markSent(plan.id, to, Date.now());
    setWait(null);
    say(
      them
        ? `Sent to ${to}. The link brings them to this plan, and they can ask me anything.`
        : `Sent to ${to}. The link in it brings you straight back here.`
    );
    push({ kind: "email-sent", to, planId: plan.id });
    setAsking({ q: "", options: ["Start Phase 1", "I still want to talk it through"] });
  };

  /** Back on a plan that was never started (brand flows, P1). Asked, not assumed. */
  const welcomeBack = (p: Plan) => {
    say(`Welcome back. Your plan for ${getRead(p.readId).url} is here.`);
    push({ kind: "plan-card" });
    ask("What held you back last time?", [...HELD, "Start Phase 1"]);
  };

  /* ── After payment: MoonConnect, in this conversation (PRD v0.2, steps 6a to 6d) ──
     One short line and one card per step. The brand can stop at any step ("Not now") and pick it up here later;
     "Go to the dashboard" stays the second choice until the brief is approved (H1). */
  const resumeLaunch = (c: Campaign | null = activeCampaignLive()) => {
    const step = nextBrandStep(c);
    if (step === "store") { startConnect(c); return; }
    if (step === "discount") { startDiscount(); return; }
    if (step === "check") { startCheck(); return; }
    if (step === "brief") { startBrief(); return; }
    say(t("post.allDone"));
    push({ kind: "tracker" });
    setAsking({ q: "", options: ["Go to the dashboard", "What happens next?"] });
  };

  const startConnect = (c: Campaign | null) => {
    const host = c?.url ?? "";
    const p = platformFor(host);
    say(p ? tf("post.storeNext", { host, platform: pnameIn(p) }) : t("post.storeNextPlain"));
    push({ kind: "connect" });
    setWait(null);
    setAsking({ q: "", options: [] });
  };

  const onConnected = (p: PlatformKey) => {
    const c = activeCampaignLive();
    if (!c || p === "custom") return;
    connectStore(p, c.id);
    startDiscount();
  };

  /** Shopify while its app is in review, or a store HeyMoon has no connector for: the team route (legacy). */
  const onTeamRoute = () => {
    const c = activeCampaignLive();
    if (!c) return;
    patchLaunch(c.id, { legacyAt: Date.now() });
    say(t("post.teamToo"));
    startBrief(t("post.briefMeanwhile"));
  };

  const startDiscount = (lead = "") => {
    say(`${lead}${t("post.discount")}`);
    push({ kind: "discount" });
    setAsking({ q: "", options: canSetCode ? [] : memberChips });
  };

  const onCoupon = (rules: CouponRules) => {
    const c = activeCampaignLive();
    if (!c) return;
    patchLaunch(c.id, { coupon: rules });
    startCheck();
  };

  const startCheck = (lead = "") => {
    say(`${lead}${t("post.check")}`);
    push({ kind: "store-check" });
    setAsking({ q: "", options: [] });
  };

  const onCheck = (passed: boolean) => {
    const c = activeCampaignLive();
    if (!c) return;
    recordCheck(c.id, passed, Date.now());
    if (passed) { startBrief(t("post.briefPassed")); return; }
    if ((activeCampaignLive()?.launch?.checkToTeamAt ?? null) !== null) {
      startBrief(t("post.briefTeamCheck"));
    }
  };

  const startBrief = (lead = "") => {
    say(`${lead || t("post.briefLead")}${t("post.briefDrafted")}`);
    push({ kind: "brief-review" });
    setWait("brief-review");
    setAsking({ q: "", options: canBrief ? [] : memberChips });
  };

  const onBriefApproved = () => {
    const c = activeCampaignLive();
    if (!c?.launch) return;
    patchLaunch(c.id, { briefApprovedAt: Date.now(), briefApprovedBy: account ? `${account.firstName} ${account.lastName}`.trim() : null });
    setWait(null);
    /* The team route promises no date (O7): the team sets the store up first. */
    say(c.launch.legacyAt ? t("post.approvedTeam") : tf("post.approved", { date: dayIn(plusDays(c.launch.paidAt, LAUNCH_BY_DAYS), locale) }));
    push({ kind: "tracker" });
    setAsking({ q: "", options: ["Go to the dashboard", "What happens next?"] });
  };

  const notNow = () => {
    const step = nextBrandStep(activeCampaignLive());
    say(step === "store" ? t("post.notNowStore") : t("post.notNow"));
    setWait(null);
    setAsking({ q: "", options: ["Continue", "Go to the dashboard"] });
  };

  /** A different store, from a conversation about this one: a new conversation, read in place. */
  const readOtherStore = (url: string) => {
    startConversation();
    setPendingRead(null);
    setScope({});
    setWait(null);
    goalRef.current = null;
    explainedRef.current = false;
    readStore(url);
  };

  /** A store link: read it, once the brand is signed in. */
  const readStore = (url: string) =>
    needAccount(url, () => {
      setScope({});
      say(`Reading ${url}.`);
      push({ kind: "read", url });
      runRead(url);
    });

  /** The account comes first: right after the brand confirms the store, before anything is read or built for it. */
  const needAccount = (host: string, go: () => void) => {
    if (accountLive()) { go(); return; }
    gateRef.current = { host, go };
    setGateHost(host);
    setSignIn(true);
  };

  /** A brand name: find its store, and ask which when there are several. */
  const lookup = (name: string) => {
    const hits = lookupBrand(name);
    const shown = name.trim().replace(/^\w/, (c) => c.toUpperCase());
    if (!hits.length) ask(`I couldn't find a store called ${shown}. Paste its link and I'll read it.`, []);
    else if (hits.length === 1) ask(`Is this ${hits[0]}?`, [hits[0], "No, a different store"]);
    else ask(`Is this ${orList(hits)}?`, [...hits, "Neither"]);
    setWait("store");
  };

  /** A question before any store: two lines, then the offer (brand flows, P0). */
  const answerFirst = (q: string) => {
    say(firstAnswer(q));
    ask("Want me to look at your store?", ["Yes, read my store", "How does the guarantee work?", "What does it cost?"].filter((c) => c.toLowerCase() !== q.trim().toLowerCase()));
  };

  /** Whatever arrives before there is a store: a link, a name, or a question. */
  const intake = (v: string) => {
    if (LOOKS_LIKE_STORE.test(v)) { setWait(null); readStore(normaliseUrl(v)); return; }
    if (/^(yes,? )?read my store$|^yes$|^sure$/i.test(v.trim())) { ask("Paste your store link, or just the brand's name.", []); setWait("store"); return; }
    if (!isQuestion(v) && looksLikeName(v)) { lookup(v); return; }
    answerFirst(v);
  };

  /** The agent asks, and waits. */
  const ask = (q: string, options: string[]) => {
    /* An empty question is chips only — the sentence was already said,
       or a block above is doing the asking. Pushing an empty turn would
       leave a mark with nothing beside it. */
    if (q.trim()) push({ kind: "say", text: q });
    setAsking({ q, options });
  };

  const say = (s: string) => push({ kind: "say", text: s });

  /* What the agent asks next, chosen from what just changed. A back and
     forth needs the agent to take a turn of its own, not only answer. */
  const followUp = (p: Plan, made: PlanChange[]) => {
    const touched = new Set(made.map((m) => m.field));
    if (touched.has("markets")) {
      /* Two counts, and this sentence used to give the crew's while
         saying "fit those markets" — which is the pool's. */
      ask(
        `The crew is rebuilt around those markets. Do you want the shortlist, or the brief?`,
        ["Show the creators", "Show the brief", "Go more aggressive", "Start Phase 1"]
      );
    } else if (touched.has("strategy") || touched.has("guaranteedRoas") || touched.has("budget")) {
      /* Rebuilt, not repriced. Phase 1 costs what it costs every brand,
         so the only things an edit here can move are what the warm-up
         is pointed at and what we will stand behind on it. */
      ask(
        `The plan is rebuilt around that, and Phase 1 is still ${fmtUSD(PHASE1_BUDGET)}. Do you want the brief before you start?`,
        ["Show the brief", "Show the creators", "Start Phase 1"]
      );
    } else if (touched.has("creators")) {
      ask(`Anything else you want changed on the crew?`, ["That is the crew", "Show the brief", "Start Phase 1"]);
    } else {
      setAsking(null);
    }
  };

  /** The one path an edit takes, whether it came from a sentence or from
      a chip: apply it, attribute it, show what moved, and check the
      guarantee still holds. */
  const applyEdit = (patch: PlanPatch, because: string, sayText: string) => {
    if (!plan) return;
    const { plan: next, changes: made } = tools.edit_plan({ plan, patch, because, by: "brand" });
    putPlan(next);
    putCampaign(next);
    if (sayText) say(sayText);
    const id = push({ kind: "changes", changeIds: made.map((c) => c.id) });
    setChanges((c) => ({ ...c, [id]: made }));
    push({ kind: "plan-card" });
    if (made.some((m) => m.field === "creators" || m.field === "markets")) push({ kind: "creator-grid" });
    if (made.some((m) => m.field === "budget" || m.field === "guaranteedRoas" || m.field === "strategy")) push({ kind: "confidence" });

    /* Unprompted honesty. If the edit made the plan undeliverable, the
       agent says so and offers the two ways out — rather than leaving a
       guarantee on screen that it expects to miss. */
    const u = underwriting(next);
    if (!u.ok) {
      const r = repair(next);
      const where = listOf(next.markets.value.map(marketName));
      say(
        `One thing first. In ${where}${next.markets.value.length === 1 ? " alone" : ""}, I expect about ` +
        `${u.implied.toFixed(1)}x at this budget, not ${u.promised}x. Fewer creators there reach your audience ` +
        `for ${fmtUSD(next.budget.value)}. I won't guarantee a number I expect to miss.`
      );
      setFix(r);
      push({ kind: "confidence" });
    } else {
      setFix(null);
      followUp(next, made);
    }
  };

  /** The answer to "what happens next?", from wherever the brand is. */
  const whatNext = () => {
    if (!paid)
      return "You pay for Phase 1. Then, here: connect your store, set the discount, a quick store check, and the brief. Moontech matches the creators and launches, within 14 days of paying.";
    if (launching) {
      const c = activeCampaignLive();
      const l = c?.launch;
      if (nextBrandStep(c)) return t("post.nextYours");
      if (l?.phaseStartedAt) return t("post.nextPhase");
      if (l?.launchedAt) return tf("post.nextLaunched", { date: dayIn(plusDays(l.launchedAt, PHASE_START_DAYS), locale) });
      return t("post.nextMoontech");
    }
    return "Phase 1 is running. Every order through a creator's code counts toward the guarantee.";
  };

  const runReport = () => {
    const ph = livePhase;
    if (!ph) { say("Nothing is running yet, so there is nothing to report on."); return; }
    report.reset();
    report.start(
      (ctx) => tools.get_report({ phase: ph }, ctx),
      (v, cancelled) => {
        if (!v) return;
        /* A cancelled report is already on screen — the running block
           renders `report.partial` and the cancelled block renders it
           again underneath. Pushing a third copy into the thread, under
           a heading that says the numbers are finished, was two lies in
           one: it is not finished, and it is not new. */
        if (cancelled) {
          say("Stopped there. The figures above are the ones I reached, and I can pull the rest.");
          return;
        }
        const id = push({ kind: "report", campaignId: ph.id });
        setReports((r) => ({ ...r, [id]: v }));
      }
    );
  };

  const send = () => sendText(text);
  /** A chip reads in the brand's language; its value, which the conversation matches on, stays the same. */
  const chipText = (c: string) => (STR[`chip.${c}`] ? t(`chip.${c}`) : c);

  const sendText = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    push({ kind: "user", text: v });
    setText("");
    setAsking(null);
    const lower = v.toLowerCase();
    const r0 = currentRead();

    /* The sheet was closed before signing in: the chip reopens it on the same store. */
    if (/^sign in$/.test(lower) && gateRef.current) { setSignIn(true); return; }

    /* ── The answer the agent asked for ── */
    if (wait === "email" || wait === "email-them") {
      if (!looksLikeEmail(v)) { ask("That doesn't look like an email address. Try again?", []); return; }
      sendPlan(v.toLowerCase(), wait === "email-them");
      return;
    }
    if (wait === "store" || wait === "other-store") {
      if (/^(no|neither|a different store|no, a different store)\b/.test(lower)) { ask("Paste its link and I'll read it.", []); return; }
      if (LOOKS_LIKE_STORE.test(v)) {
        const url = normaliseUrl(v);
        setWait(null);
        if (wait === "other-store") readOtherStore(url);
        else readStore(url);
        return;
      }
      if (isQuestion(v)) { answerFirst(v); setWait(null); return; }
      lookup(v);
      return;
    }
    if (wait === "goal" && r0) { onGoal(r0, v); return; }
    if (wait === "launch-note" && r0) {
      say("Got it. The creators will lead with it.");
      setFocus(r0, { kind: "launch", note: v });
      return;
    }
    if (wait === "focus" && r0) {
      if (/^(push (the|my) bestsellers|bestsellers|yes|yep|sure|those|fine|ok|okay)\b/.test(lower)) { setFocus(r0, { kind: "bestsellers" }); return; }
      if (/^something else$|^(no|other|different)\b/.test(lower)) {
        ask("Which products? Name them, and I'll point the creators at those.", []);
        setWait("products");
        return;
      }
    }
    if ((wait === "products" || wait === "focus") && r0) {
      const products = v.split(/,|\band\b|\n/).map((x) => x.trim()).filter(Boolean);
      say("Got it. The creators will push those.");
      setFocus(r0, { kind: "specific", products });
      return;
    }
    if (wait === "phase1" && r0) {
      if (/^(makes sense|got it|ok|okay|yes|yep|sure|sounds good|continue|go on|next|build|let.?s go)\b/.test(lower)) {
        explainedRef.current = true;
        setWait(null);
        nextStep(r0);
        return;
      }
      const left = PHASE1_CHIPS.filter((c) => c !== v && !asked.has(c));
      if (/fee|cost|vat|charge|extra/.test(lower))
        say(`No. VAT is the only addition, and nothing after Phase 1 is charged unless you choose to continue.`);
      else if (/creator|choose|pick/.test(lower)) say(CREATORS_ANSWER);
      else {
        const out = tools.interpret({ text: v, plan: undefined, paid: false });
        say(out.kind === "question" && out.say ? out.say : firstAnswer(v));
      }
      setAsking({ q: "", options: left });
      return;
    }
    if (wait === "reveal-plan" && /^(looks right|looks good|yes|yep|good|great|perfect|fine|ok|okay)\b/.test(lower)) { revealReady(); return; }
    /* A change to MoonWriter's brief, in plain words (6d). Each clause lands in Say or Don't, and a line it contradicts
       comes out (applyBriefChange). */
    /* Also after a reload, when the waiting state is gone but the brief is still the brand's open step. */
    const onBrief = wait === "brief-review" || (launching && nextBrandStep(camp) === "brief");
    /* A question or a command typed on the brief step is answered, not written into the brief: "When will we be
       live?" used to land in the Say row. */
    const asks = /\?\s*$|؟\s*$/.test(v) || /^(what|when|how|why|who|where|which|can|could|will|would|is|are|does|did|should|ماذا|متى|كيف|لماذا|هل|ما)(\s|$)/i.test(v.trim());
    const command = /^(go to (the )?dashboard|open (the )?dashboard|dashboard|what happens next|approve( the brief)?|continue|carry on|not now|help)\b/.test(lower);
    if (onBrief && plan && !asks && !command) {
      const b = plan.brief.value;
      const change = applyBriefChange({ mustSay: b.mustSay.value, mustNotSay: b.mustNotSay.value }, v);
      const { plan: next } = tools.edit_plan({
        plan, patch: { brief: { mustSay: change.mustSay, mustNotSay: change.mustNotSay } }, because: "because you changed the brief", by: "brand",
      });
      putPlan(next);
      track("hm_brief_change_requested", { brand: camp?.url, campaign: camp?.id });
      say(change.removed.length
        ? tf("post.briefReplaced", { old: change.removed.map(briefLine).join(locale === "ar" ? "» و«" : "” and “") })
        : t("post.briefAdded"));
      return;
    }
    /* ── Before any store: a link, a brand name, or a question (brand flows, P0) ── */
    if (!plan && !hasRead && readRun.status !== "running") { intake(v); return; }

    /* ── A plan that isn't started: talk it through, save it, or say what held them (brand flows, P0 and P1) ── */
    if (plan && !paid) {
      /* "The creators" (a reason they held back) and "How are creators chosen?" get the same answer, so either one
         takes the other off the row. */
      const same = (t: string, said: string) => t === said || (/creators/i.test(t) && /creators/i.test(said));
      const talkChips = (said: string) => ["Start Phase 1", ...TALK.filter((t) => !same(t, said) && !asked.has(t)), "Back to the plan"];
      if (/talk it through|not (ready|yet)|i.?m not sure|need to think/.test(lower)) {
        ask("Of course. What's on your mind? Most brands ask one of these.", ["Start Phase 1", ...TALK]);
        return;
      }
      if (/^email me the plan$|^(send|email) (me )?(it|the plan)|^save (it|the plan)/.test(lower)) { emailPlan("self"); return; }
      if (/^email the plan$|^send it to them$/.test(lower)) { emailPlan("them"); return; }
      if (/^back to the plan$/.test(lower)) { push({ kind: "plan-card" }); setAsking({ q: "", options: READY_CHIPS }); return; }
      if (/^how are (the )?creators (chosen|picked|matched)\??$|^the creators$/.test(lower)) {
        say(CREATORS_ANSWER);
        push({ kind: "creator-grid" });
        setAsking({ q: "", options: talkChips(v) });
        return;
      }
      if (/^someone else decides$/.test(lower)) {
        say("Then let's get it to them. They'll see the plan, and they can ask me anything.");
        emailPlan("them");
        return;
      }
      if (/^the \$1,000$/.test(lower)) {
        const [b1, b2, b3] = PHASE_BUDGETS;
        const [, m2, m3] = PHASE_MULTIPLES;
        say(
          `Fair. Phase 1 is the smallest step: ${fmtUSD(b1)} in, ${fmtUSD(plan.price.revenueTarget.value)} in sales ` +
          `guaranteed, and if it sells less you get the missed share back. If it works, Phase 2 is ${fmtUSD(b2)} at ${m2}x ` +
          `and Phase 3 is ${fmtUSD(b3)} at ${m3}x.`
        );
        setAsking({ q: "", options: ["Start Phase 1", "How does the refund work?", "See all three phases"] });
        return;
      }
      if (/^a different store$/.test(lower)) {
        ask("Paste the other store's link, or its name.", []);
        setWait("other-store");
        return;
      }
      if (/^how does the refund work\??$/.test(lower)) {
        const out = tools.interpret({ text: v, plan, paid });
        if (out.say) say(out.say);
        setAsking({ q: "", options: talkChips(v) });
        return;
      }
    }

    /* A store link, typed. This is the only way into a read for a
       SECOND campaign: the first one arrives with `?read=` on the URL,
       but "build another" opens an empty conversation and the brand
       has nothing to paste it into but the message box. Guarded on
       there being no plan yet, so "ounass.com" said in the middle of
       an edit is still an edit. */
    if (!plan && LOOKS_LIKE_STORE.test(v) && readRun.status !== "running") {
      readStore(normaliseUrl(v));
      return;
    }

    /* A stopped read, picked back up or accepted as it stands. The agent
       offers both in the sentence it says on cancel, so both have to be
       answerable — promising "say the word and I will pick it back up"
       and then having no idea what that word was is worse than not
       offering it. */
    /* Only before a plan: after paying, "Continue" is the brand's next setup step, not the stopped read. */
    if (readRun.status === "cancelled" && readUrl && !plan) {
      if (/^(read it again|read again|pick it back up|finish the read|carry on|keep going|continue)\b/.test(lower)) {
        say(`Picking it back up on ${readUrl}. Starting from the top, so nothing is half read.`);
        runRead();
        return;
      }
      if (/^(work with this|use this|that is enough|good enough|carry on with)/.test(lower)) {
        const partial = readRun.partial;
        if (partial) {
          say("Working with what arrived, then. Anything I did not reach, I treat as unknown rather than guess it.");
          afterRead(partial);
          return;
        }
      }
    }

    /* The answer to "what do you do?", one of the chips it offered. */
    const roleAnswer = !plan && pendingRead ? ROLES.find((x) => x.label.toLowerCase() === lower) : undefined;
    if (roleAnswer && pendingRead) { onRole(pendingRead, roleAnswer.key); return; }

    /* Asking the owner of a store this account doesn't belong to (askForAccess). */
    if (/^request access$/.test(lower) && plan && account) {
      const host = getRead(plan.readId).url;
      const b = brands[host];
      if (b && accessFor(host, account.email, brands) === "outsider") {
        requestAccess(host, { firstName: account.firstName, lastName: account.lastName, email: account.email }, Date.now());
        say(`Sent. ${b.owner.firstName} sees it on the ${b.brandName} team page, and HeyMoon emails you when they answer.`);
        setAsking({ q: "", options: ["Change something"] });
        return;
      }
    }

    /* The brand said something was off and is now telling us what. Record
       it against the read — kept beside the agent's own value, never over
       it — and build. */
    if (awaitingCorrection) {
      const r = pendingRead ?? (readUrl ? getRead(readIdFor(readUrl)) : null);
      if (r) {
        correctRead(r.id, { layer: "category", field: "note", was: "what HeyMoon found", now: v, at: Date.now() }, (x) => x);
        /* Never the brand's own sentence read back at them. The
           correction is free text, so there is no specific field to
           name here — what changed is shown on the read itself. */
        say(`Fixed. Building the plan on that.`);
        setAwaitingCorrection(false);
        setPendingRead(null);
        startBuild(r);
        return;
      }
    }

    /* Chips the agent itself offered about where the brand is in the
       flow. They are answered here rather than sent through `interpret`,
       because they are not requests about the plan. */
    /* Back to the brand's next step after paying. */
    if (launching && /^(continue|carry on|next step|set the discount|connect (my|the) store|run the (test|check)|the brief)$/.test(lower)) {
      /* The step's card is still the newest one in the thread: point at it rather than stacking a second, identical
         card under it (both live, both pressable). */
      const step = nextBrandStep(activeCampaignLive());
      const lastBlock = [...thread].reverse().find((i) => i.kind !== "say" && i.kind !== "user");
      if (step && lastBlock?.kind === STEP_BLOCK[step]) { say(t("post.above")); return; }
      resumeLaunch();
      return;
    }
    if (/go to (the )?dashboard|open the dashboard/.test(lower)) {
      /* A handoff, not another panel, and it says nothing on the way:
         a sentence about a destination you are already being taken to
         is read after it has stopped being true. */
      router.push("/brands/dashboard");
      return;
    }
    if (/what happens next|what.s next|what now/.test(lower)) {
      if (paid) track("hm_help_requested", { brand: camp?.url, campaign: camp?.id, via: "what happens next" });
      say(whatNext());
      setAsking({ q: "", options: paid ? postChips : ["Start Phase 1", "See all three phases"] });
      return;
    }
    if (/read a different store/.test(lower)) {
      say("Back to the first screen. Paste the other store's link there.");
      router.push("/brands");
      return;
    }
    if (/log a re-check/.test(lower)) {
      say("Logged. A person checks your traffic by hand and emails you within two working days.");
      return;
    }
    /* Gated on there BEING a plan. This answer is about Phase 1's price,
       and while the two numbers are still being settled there is no
       Phase 1 to have a price — the brand asking to "raise the budget"
       there means the campaign budget they were just asked for, and
       hijacking it produced the one speech that stage must not make. */
    if (plan && /^lower the budget|^raise the budget|^why is it \$?1,?000|budget slider|move the budget|change the budget/.test(lower)) {
      /* There is nothing to move. The warm-up price is the one number in
         this product that is the same for everybody, and saying so — and
         saying why — is more useful than pretending there is a dial. */
      ask(
        `Phase 1 is ${fmtUSD(PHASE1_BUDGET)} for every brand, and it isn't sized to your store. ` +
        `What you choose is what it's pointed at, and the guarantee moves with it.`,
        ["Kuwait only", "Women 25 to 45", "See all three phases", "Start Phase 1"]
      );
      return;
    }
    /* What the $1,000 buys, asked in words (brand team, 15 Oct: the questions every brand asks before paying). */
    if (plan && /what does (the |your )?(\$?1,?000|1k|it|this|phase 1|the fee|the payment) (include|cover|buy)|what.s included|what do i get|extra fees|hidden fees|other fees|any fees|choose (my )?(own )?creators|pick (my )?(own )?creators/.test(lower)) {
      say("Here's everything it covers.");
      push({ kind: "includes" });
      setAsking({ q: "", options: paid ? postChips : ["Start Phase 1", "How does the refund work?", "How are creators chosen?", "Back to the plan"] });
      return;
    }
    /* "Change something" is a chip this thread offers, and `interpret`
       has no reading for it — left alone it would fall through to "I
       didn't catch that", which is the one answer a chip we wrote must
       never get. Answered here, with the things that actually move. */
    if (plan && !paid && /^change something$/.test(lower)) {
      ask("What should change?", ["Kuwait only", "Women 25 to 45", "Change the brief", "See all three phases"]);
      return;
    }
    if (plan && !paid && /^change the markets/.test(lower)) {
      ask(
        `Phase 1 runs in ${plan.markets.value.map(marketName).join(", ")}. Tell me the markets you want and I'll rebuild ` +
        `the crew and the guarantee around them.`,
        ["Kuwait only", "UAE and Saudi Arabia only", "Add Qatar"]
      );
      return;
    }

    const out = tools.interpret({ text: v.replace(/×/g, "x"), plan: plan ?? undefined, paid });

    if (out.kind === "edit" && plan && out.patch) {
      if (paid && touchesLocked(out.patch)) {
        say(LOCKED);
        setAsking({ q: "", options: postChips });
        return;
      }
      applyEdit(out.patch, out.because ?? `because you said “${v}”`, out.say);
      return;
    }

    if (out.kind === "command") {
      switch (out.command) {
        case "fund": {
          if (!plan) { say("There is no plan to start yet."); return; }
          openFunding();
          return;
        }
        case "build": {
          const r =
            pendingRead ??
            (readUrl ? getRead(readIdFor(readUrl)) : null) ??
            (buildFor ? getRead(buildFor) : null) ??
            (plan ? getRead(plan.readId) : null);
          if (!r) { say("I need to read your store first. Paste the link, or the brand's name."); return; }
          if (paid) { say(ALREADY_PAID); return; }
          /* Before anything is built: whatever is still open (nextStep). A plan that already exists is changed by
             sentences instead. */
          if (!plan) { nextStep(r); return; }
          ask("The plan is built. Start Phase 1 when you're ready, or change anything.", READY_CHIPS);
          return;
        }
        case "correct": {
          setAwaitingCorrection(true);
          ask("What's off? Tell me, and I'll fix it before building the plan.", []);
          return;
        }
        case "approve-all": {
          const waiting = ads.filter((a) => a.state === "waiting");
          if (!waiting.length) { say("Nothing is waiting on you."); return; }
          const req = tools.request_approval({ adIds: waiting.map((a) => a.id) });
          putApproval(req);
          say(out.say);
          push({ kind: "approval", requestId: req.id });
          return;
        }
        case "show-ladder": {
          if (!plan) { say("There is no campaign to show yet. Read a store and I will build one."); return; }
          /* SHOW_PHASES, not the interpreter's own sentence: the whole
             plan is a ladder block, and the line above it names what it
             is and stops. */
          say(SHOW_PHASES);
          push({ kind: "ladder" });
          return;
        }
        /* The crew lives on the plan, and the plan lives in the panel.
           Pushing another card into the conversation would be the same
           information twice, one copy of it already stale. */
        case "show-creators": {
          if (!plan) { say("There is no crew yet. Read a store and I will match one to it."); return; }
          say(out.say);
          openPanel("plan");
          return;
        }
        case "show-brief": say(out.say); push({ kind: "brief-card" }); return;
        /* The numbers assemble in the conversation, where they can be
           stopped; the phase they belong to opens beside it. */
        case "show-report": say(out.say); runReport(); return;
      }
    }

    if (out.kind === "question" && out.say) {
      say(out.say);
      if (out.answerRef === "confirm" && plan) {
        /* An answered question needs the next one, or the conversation
           stalls the moment the brand agrees with something. */
        ask(
          "What would you like to do next?",
          paid ? postChips : ["Show the creators", "Show the brief", "Go more aggressive", "Start Phase 1"]
        );
      }
      /* A brand who just asked about the price has been told it does not
         move. Leaving them with no next step would read as a refusal, so
         they are offered the two things that DO move instead. */
      if (out.answerRef === "budget" && plan && !paid) {
        setAsking({ q: "", options: ["Kuwait only", "Women 25 to 45", "See all three phases", "Start Phase 1"] });
      }
      return;
    }

    /* The three phases, asked for in words `interpret` did not catch. */
    if (plan && PHASES_RE.test(lower)) {
      say(SHOW_PHASES);
      push({ kind: "ladder" });
      return;
    }

    /* A view named out loud. There is no navigation left in the product,
       so naming a screen opens it in the panel. */
    const wants = PANEL_INTENT.find((p) => p.re.test(lower));
    if (wants) {
      say(wants.say);
      openPanel(wants.view);
      return;
    }

    /* Anything it did not understand. It says so plainly and offers the
       things it can actually do, rather than a canned deflection. */
    /* While launching there is no report or panel to offer yet: answer about the setup, and a timing question with the
       one date the brand was promised. */
    if (!out.say && launching && camp?.launch) {
      if (/\b(when|how long|how soon|timeline|go live|live)\b/.test(lower)) {
        say(camp.launch.legacyAt && !camp.launch.launchedAt ? t("post.whenTeam") : tf("post.when", { date: dayIn(plusDays(camp.launch.paidAt, LAUNCH_BY_DAYS), locale) }));
      } else {
        say(nextBrandStep(camp) ? t("post.fallbackSetup") : t("post.fallbackWaiting"));
      }
      setAsking({ q: "", options: postChips });
      return;
    }
    say(
      out.say ||
      (paid
        /* After paying only the budget changes, and a paid phase never does (C3): the audience isn't on offer. */
        ? "I didn't catch that. I can change the brief, pull a report, or open your campaign in the panel."
        : "I didn't catch that. Markets, audience, creators, the brief and the guarantee all move, so say it in plain words.")
    );
  };

  /* What is offered when the agent is not waiting on a specific answer. */
  const defaultChips = plan
    ? paid ? postChips : PRE_CHIPS
    : storedRead?.eligibility?.state === "ok" && !awaitingCorrection && build.status === "idle"
    ? ["Looks right", "Something's off"]
    : [];

  /* ── The transcript ───────────────────────────────────────────────
     Every item becomes one row. Prose and the brand's own words start a
     new group; the cards a sentence produced join the group it belongs
     to. That is the whole rhythm rule: 28px between turns, 20px between
     a turn and the blocks it just introduced. */
  type Row = { id: string; node: ReactNode; block: boolean };
  const rows: Row[] = [];
  visible.forEach((item, i) => {
    const prev = i > 0 ? visible[i - 1] : null;
    const node = renderItem(item, prev?.kind === "say");
    if (node) rows.push({ id: item.id, node, block: item.kind !== "say" && item.kind !== "user" });
  });

  const groups: Row[][] = [];
  for (const r of rows) {
    if (!r.block || !groups.length) groups.push([r]);
    else groups[groups.length - 1].push(r);
  }

  function renderItem(item: (typeof visible)[number], afterSay: boolean): ReactNode {
    switch (item.kind) {
      case "user":
        return <UserTurn key={item.id} text={chipText(item.text)} />;
      case "say":
        return (
          /* Consecutive assistant turns share one mark — the speaker is
             named once and then simply keeps talking. */
          <AgentTurn key={item.id} mark={!afterSay}>
            {typedDone[item.id] || item.id !== lastSay?.id ? (
              <p className="whitespace-pre-line text-prose text-ink">{item.text}</p>
            ) : (
              /* No onTick scroll here any more. The view is parked at
                 the top of this turn and the text grows downward into
                 it, which is the direction people read. */
              <Typed text={item.text} onTick={() => park(false)} onDone={() => finish(item.id)} />
            )}
          </AgentTurn>
        );
      case "changes":
        return <BlockRow key={item.id}><ChangesBlock changes={changes[item.id] ?? []} /></BlockRow>;
      case "plan-card":
        return plan ? <BlockRow key={item.id}><PlanBlock plan={plan} onOpenCreators={() => openPanel("plan")} /></BlockRow> : null;
      case "creator-grid":
        return plan ? <BlockRow key={item.id}><CreatorBlock plan={plan} /></BlockRow> : null;
      case "confidence":
        return plan ? <BlockRow key={item.id}><ConfidenceBlock plan={plan} /></BlockRow> : null;
      case "brief-card":
        return plan ? <BlockRow key={item.id}><BriefBlock plan={plan} /></BlockRow> : null;
      case "funding": {
        const req = funding[item.requestId];
        /* A request id is the plan and the phase, so "Not yet" followed
           by a second Start produces a second block for the SAME request
           — and the moment that request is pending again, the earlier
           card would come back to life as a duplicate payment prompt.
           Only the newest block for a request is live; the earlier ones
           say what happened to them and nothing more. */
        const newest = [...thread].reverse().find((x) => x.kind === "funding" && x.requestId === item.requestId);
        if (newest && newest.id !== item.id) {
          return (
            <BlockRow key={item.id}>
              <Card className="p-4">
                <p className="text-body text-ink-soft">Not started. The plan is unchanged.</p>
              </Card>
            </BlockRow>
          );
        }
        return req ? (
          <BlockRow key={item.id}>
            <FundingBlock
              req={req}
              onConfirmed={() => {
                /* Per campaign, not global. A second campaign is not
                   paid for because the first one was. */
                /* Phase 1 is paid, not live: the brand stays here and MoonConnect leads the store steps (PRD v0.2). */
                markPaid();
                /* The first payment for a store makes the payer its owner (brand team, 15 Oct). */
                if (plan && account) {
                  const r = getRead(plan.readId);
                  claimBrand(r.url, r.identity?.name.value ?? r.url, account, Date.now());
                }
                /* Paid → receipt → the three steps → the last step. No
                   creator cards here: the plan beside the conversation
                   holds the crew, and the full roster belongs on the
                   campaign view, not in the chat. */
                say(t("post.paid"));
                push({ kind: "receipt", requestId: req.id });
                resumeLaunch();
              }}
              onCancelled={() =>
                ask(
                  "No problem. What would make Phase 1 right for you?",
                  [WHY_CHIP, "See all three phases", "Change the markets", "Start Phase 1"]
                )
              }
            />
          </BlockRow>
        ) : null;
      }
      case "receipt": {
        const req = funding[item.requestId];
        return req ? <BlockRow key={item.id}><ReceiptBlock req={req} /></BlockRow> : null;
      }
      case "approval": {
        const req = approvals[item.requestId];
        return req ? <BlockRow key={item.id}><ApprovalBlock req={req} /></BlockRow> : null;
      }
      case "read": {
        const live = readRun.status === "running";
        const r = live ? readRun.partial : reads[readIdFor(item.url)] ?? readRun.partial;
        return (
          <BlockRow key={item.id}>
            <ReadBlock read={r} live={live} />
            {live && (
              <WorkingLine
                className="mt-2"
                note={readRun.note} done={readRun.progress.done} total={readRun.progress.total}
                status={readRun.status}
              />
            )}
            {/* No second way in. What HeyMoon found has more in it than
                a card in a conversation should carry — every layer and
                every piece of evidence — and the card's own header
                already carries the link that opens it beside the
                conversation. A duplicate control directly under it, with
                a second wording, reads as a second destination. */}
          </BlockRow>
        );
      }
      case "ladder":
        /* Startable from here only while unpaid. After payment the block
           marks Phase 1 as started and offers nothing to press — a second
           Start would read as a second payment. */
        return plan ? (
          <BlockRow key={item.id}><LadderBlock plan={plan} compact onStart={paid ? undefined : openFunding} paid={paid} /></BlockRow>
        ) : null;
      case "checklist":
      case "tracker":
        return <BlockRow key={item.id}><LaunchTracker compact /></BlockRow>;
      case "connect":
        return camp ? (
          <BlockRow key={item.id}>
            <ConnectBlock camp={camp} onConnected={onConnected} onTeam={onTeamRoute} onNotNow={notNow} />
          </BlockRow>
        ) : null;
      case "discount":
        return camp ? (
          <BlockRow key={item.id}>
            <DiscountBlock
              camp={camp}
              currency={plan ? getRead(plan.readId).priceBand?.value.currency ?? "AED" : "AED"}
              onConfirmed={onCoupon}
              onCancel={notNow}
            />
          </BlockRow>
        ) : null;
      case "store-check":
        return camp ? <BlockRow key={item.id}><StoreCheckBlock camp={camp} onResult={onCheck} onNotNow={notNow} /></BlockRow> : null;
      case "brief-review":
        return camp && plan ? <BlockRow key={item.id}><BriefReviewBlock camp={camp} plan={plan} onApprove={onBriefApproved} /></BlockRow> : null;
      case "score":
        return (
          <BlockRow key={item.id}>
            <ConfidenceBar planBudget={item.planBudget} roas={item.roas} />
          </BlockRow>
        );
      case "rejected":
        return <BlockRow key={item.id}><RejectedBlock read={getRead(item.readId)} /></BlockRow>;
      case "pick-markets": {
        const r = getRead(item.readId);
        const chosen = scope.markets ?? (plan ? plan.markets.value : null);
        return <BlockRow key={item.id}><MarketsPick read={r} chosen={chosen} onConfirm={(codes) => onMarkets(r, codes)} /></BlockRow>;
      }
      case "pick-products": {
        const r = getRead(item.readId);
        const chosen = scope.focus ?? (plan ? plan.focus ?? { kind: "bestsellers" as const } : null);
        return <BlockRow key={item.id}><ProductsPick read={r} chosen={chosen} onConfirm={(f) => onProducts(r, f)} /></BlockRow>;
      }
      case "includes":
        return plan ? <BlockRow key={item.id}><IncludesBlock plan={plan} salesFirst={salesFirst(role)} /></BlockRow> : null;
      case "email-sent": {
        const p = plan?.id === item.planId ? plan : null;
        return p ? <BlockRow key={item.id}><EmailSentBlock to={item.to} plan={p} /></BlockRow> : null;
      }
      case "ad-card":
        return <BlockRow key={item.id}><AdCardBlock adId={item.adId} /></BlockRow>;
      case "working":
        return (
          <BlockRow key={item.id}>
            <WorkingLine note={item.note} done={item.done} total={item.total} status="running" />
          </BlockRow>
        );
      case "report": {
        const r = reports[item.id];
        return r ? <BlockRow key={item.id}><ReportBlock report={r} /></BlockRow> : null;
      }
      default:
        return null;
    }
  }

  return (
    <ChatShell panel={<PanelHost />}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        {/* Offline (H7), the cards can be read and scrolled but not pressed: a Confirm or Approve made offline used to
            record a step the server never saw. */}
        <div
          aria-disabled={!online || undefined}
          className={`mx-auto w-full max-w-[720px] space-y-7 px-4 pb-8 pt-16 transition-opacity ${online ? "" : "pointer-events-none select-none opacity-60"}`}
        >
          {groups.map((g, i) => (
            <div
              key={g[0].id}
              data-last-turn={i === groups.length - 1 ? "" : undefined}
              className="space-y-5"
            >
              {g.map((r) => r.node)}
            </div>
          ))}

          {/* The dots are for the gap between "I will do that" and the
              first thing appearing. Once the roster is up they are a
              second spinner beside a real one. */}
          {(readRun.status === "running" || build.status === "running") && !isTyping && !rosterReady && <Thinking />}

          {/* The build, as named agents with tasks that tick — the same
              shape as the read, because "the agentic piece" must not be
              the one stream that looks like a page loading. How many
              agents is read off BUILD_TASKS, never typed.

              Gated on the sentence above having finished typing. The
              thread's own blocks are already held back that way — the
              slice in `visible` does it — but this one renders outside
              the thread, so it had nothing holding it and landed under
              a half-written paragraph. */}
          {rosterReady && (
            <BlockRow>
              <TaskRoster
                tasks={BUILD_TASKS}
                done={BUILD_TASKS.slice(0, build.progress.done).map((task) => task.key)}
                live
                title={rosterTitle(BUILD_TASKS, "on your plan")}
              />
              <WorkingLine
                className="mt-2"
                note={build.note} done={build.progress.done} total={build.progress.total}
                status={build.status}
              />
              {build.partial && build.partial.budget.value > 0 && (
                <div className="mt-3"><PlanCard plan={build.partial} dense /></div>
              )}
            </BlockRow>
          )}

          {/* A stream in flight shows partial results, not a spinner. */}
          {report.status === "running" && (
            <BlockRow>
              <WorkingLine
                note={report.note} done={report.progress.done} total={report.progress.total}
                status={report.status}
              />
              {report.partial && <div className="mt-3"><ReportBlock report={report.partial} /></div>}
            </BlockRow>
          )}
          {report.status === "cancelled" && report.partial && (
            <BlockRow>
              <p className="mb-2 text-meta text-ink-faint">Stopped. This is what had arrived.</p>
              <ReportBlock report={report.partial} />
            </BlockRow>
          )}

          {/* The plan cannot be delivered as it stands. The agent has
              already said so above; this is the one press that fixes it,
              and it sits with the sentence rather than under the box. */}
          {fix && plan && !isTyping && (
            <BlockRow>
              <div className="flex flex-wrap items-center gap-2 rounded-control border border-danger/25 bg-danger/[0.05] px-3 py-2.5">
                <p className="min-w-0 flex-1 text-meta leading-5 text-danger">{fix.headline}</p>
                {fix.kind !== "widen" || fix.addMarket ? (
                  <Btn
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      /* One edit, not three. The repair is a whole target
                         state — markets, crew and multiple — so it is
                         applied as one attributed change rather than
                         leaving the plan half-fixed in between. */
                      const { plan: next, changes: made } = tools.edit_plan({
                        plan,
                        patch: {
                          ...(fix.markets ? { markets: fix.markets } : {}),
                          setCrewIds: fix.crewIds,
                        },
                        because: fix.addMarket
                          ? `because adding ${marketName(fix.addMarket)} is what makes this deliverable`
                          : `because that is what makes the warm-up deliverable`,
                        by: "agent",
                      });
                      putPlan(next);
                      const crew = next.creators.value.length;
                      say(
                        `${listOf(next.markets.value.map(marketName))}. ${countUp(crew)} creator${crew === 1 ? "" : "s"}, ` +
                        `still ${fix.multiple}x guaranteed on the warm-up, and I expect about ${fix.implied.toFixed(1)}x.`
                      );
                      const id = push({ kind: "changes", changeIds: made.map((c) => c.id) });
                      setChanges((c) => ({ ...c, [id]: made }));
                      push({ kind: "plan-card" });
                      push({ kind: "confidence" });
                      setFix(null);
                    }}
                  >
                    {fix.addMarket ? `Add ${marketName(fix.addMarket)} and rebuild` : "Rebuild it that way"}
                  </Btn>
                ) : null}
              </div>
            </BlockRow>
          )}
        </div>
      </div>

      {(!online || backOnline) && (
        <div role={online ? "status" : "alert"} className="mx-auto w-full max-w-[720px] px-4 pb-2">
          <p className={`flex items-center gap-2 rounded-control px-3.5 py-2.5 text-meta font-semibold ${online ? "bg-good/[0.08] text-good-deep" : "bg-amber-soft text-amber"}`}>
            <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-good" : "animate-pulse bg-amber"}`} />
            {online ? t("post.online") : t("post.offline")}
          </p>
        </div>
      )}

      <Composer
        disabled={!online}
        value={text}
        onChange={setText}
        onSend={send}
        chips={isTyping || !online ? [] : liveChips(asking?.options ?? defaultChips)}
        chipLabel={chipText}
        onChip={sendText}
        /* A new thread has no plan to change and nothing to pay for,
           so it asked to change a plan that did not exist and warned
           about a payment nobody had been offered. The composer says
           what this conversation is actually for at each of its three
           stages. */
        placeholder={
          paid ? t("post.placeholder")
          : plan ? "Ask anything, or tell me what to change"
          : hasRead ? "Type your answer"
          : "Paste your store link, or ask me anything"
        }
        note={!plan || paid ? undefined : NOTE}
        busy={!!stop}
        onStop={stop ?? undefined}
        stopLabel={t("thread.stop")}
      />

      {/* The gate at the payment, and the only one in the flow. It
          closes onto the card the brand was reaching for. */}
      <SignInSheet
        open={signInOpen}
        host={gateHost ?? (plan ? getRead(plan.readId).url : undefined)}
        brandName={plan ? getRead(plan.readId).identity?.name.value : undefined}
        forPayment={!!plan}
        onClose={() => {
          setSignIn(false);
          /* Closed before signing in: nothing is read, and one chip brings the sheet back. */
          if (gateRef.current && !accountLive()) ask(plan ? "" : `Sign in and I'll read ${gateRef.current.host}.`, ["Sign in"]);
        }}
        onVerified={(name) => {
          setSignIn(false);
          push({ kind: "user", text: `Signed in as ${name}` });
          const g = gateRef.current;
          gateRef.current = null;
          setGateHost(null);
          (g?.go ?? showFunding)();
        }}
      />
    </ChatShell>
  );
}

/** The landing entry (`?read=`/`?q=`) this page load has already used. */
let usedEntry: string | null = null;

/** The card each of the brand's setup steps lives in. */
const STEP_BLOCK = { store: "connect", discount: "discount", check: "store-check", brief: "brief-review" } as const;

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-white" />}>
      <ChatInner />
    </Suspense>
  );
}
