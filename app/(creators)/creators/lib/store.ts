"use client";

/* Session state.

   One module store behind `useSyncExternalStore`, the same shape as the
   brands app. The work survives a reload — a creator who accepted a
   brief and refreshed must not come back to an empty room — but what
   was on screen does not: which panel was open and what the page was
   scrolled to are not worth restoring, and restoring them puts somebody
   back inside a drill-down they had left.

   The version suffix on the key is a kill switch. Change the shape of
   anything kept and old saved state is dropped rather than half-read. */

import { useEffect, useSyncExternalStore } from "react";
import type {
  AcceptRequest, CreatorRead, Correction, Decision,
  Offer, OfferState, Profile, SendRequest, Submission,
} from "./agent/types";
import { rememberRead } from "./agent/registry";
import { tools } from "./agent/tools";
import { FORMAT_NAME } from "./agent/model";

/* ------------------------------------------------------------------ */
/* Thread blocks                                                       */
/*                                                                     */
/* The conversation is not a list of strings. Every turn is a typed     */
/* block, so the campaign card in the thread is the same component as   */
/* the one on Explore, reading the same object.                          */
/* ------------------------------------------------------------------ */

export type ThreadItem =
  | { id: string; kind: "user"; text: string; at: number }
  | { id: string; kind: "say"; text: string; at: number; streaming?: boolean }
  | { id: string; kind: "read"; handle: string; at: number }
  | { id: string; kind: "profile"; at: number }
  /* HeyMoon, in a few numbers: said after the read, before the check. */
  | { id: string; kind: "intro"; at: number }
  | { id: string; kind: "earnings"; offerId: string; at: number }
  | { id: string; kind: "offers"; at: number }
  | { id: string; kind: "offer"; offerId: string; at: number }
  | { id: string; kind: "brief"; offerId: string; at: number }
  | { id: string; kind: "cadence"; offerId: string; at: number }
  | { id: string; kind: "accept"; requestId: string; at: number }
  | { id: string; kind: "decision"; offerId: string; at: number }
  | { id: string; kind: "connect"; at: number }
  | { id: string; kind: "changes"; changeIds: string[]; at: number }
  | { id: string; kind: "working"; note: string; done: number; total: number; at: number }
  | { id: string; kind: "draft-check"; draftId: string; at: number }
  | { id: string; kind: "report"; at: number }
  /* The creator HeyMoon cannot place. The mirror of the brands app's
     store that comes in under the traffic floor. */
  | { id: string; kind: "rejected"; readId: string; at: number };

/* ------------------------------------------------------------------ */
/* Autonomy                                                            */
/*                                                                     */
/* The brands app locks three things at Never: move money, publish,     */
/* sign. This locks the same three, read from the other side — and      */
/* they matter more here, because what an agent could overreach on      */
/* belongs to a person rather than to a company.                        */
/* ------------------------------------------------------------------ */

export type AutonomyLevel = "alone" | "ask" | "never";

export interface AutonomyRule {
  key: string;
  label: string;
  detail: string;
  level: AutonomyLevel;
  locked?: boolean;
}

export const DEFAULT_AUTONOMY: AutonomyRule[] = [
  { key: "publish", label: "Post to your accounts", detail: "Put anything on your grid. You post from your own account, and no agent can put anything up for you. HeyMoon holds no password to any account you have.", level: "never", locked: true },
  { key: "accept", label: "Join a campaign, or sign anything", detail: "Agree work or terms on your behalf. MoonMatch AI matches you and MoonSearch AI vets the brand, and neither can commit you to a day of work.", level: "never", locked: true },
  /* WAS "change your rate", and there is no rate left to change. The
     third lock is now the other end of the journey: reporting a post as
     live is what starts the money moving, and it is the creator's
     press — an agent that could do it could be paid on work that never
     went up. */
  { key: "report", label: "Report a post as live", detail: "Submit an ad you have posted, so it can be checked and paid. MoonWriter AI checks it against the brief and says what is missing. Pressing submit is yours.", level: "never", locked: true },

  { key: "decline-low", label: "Hide campaigns that are not a fit", detail: "Keep a campaign off your list when the match is under HeyMoon's floor — wrong market, wrong category, wrong audience. MoonMatch AI does this so your list is work rather than a board to sift.", level: "alone" },
  { key: "block-clash", label: "Block a brand that clashes with your grid", detail: "Stop a campaign that would put a competitor next to a brand you already work with. MoonSearch AI vets the brand for your risk, which is the same job it does for brands, pointed at you.", level: "alone" },
  { key: "check-draft", label: "Check a submitted ad against the brief", detail: "Read each ad you submit against the brief MoonWriter AI wrote and say what is missing, so a fixable miss costs an edit and a second submit rather than the payout.", level: "alone" },
  { key: "learn", label: "Learn from finished work", detail: "Feed what your posts actually sold back into how you are matched and how briefs are written for you. This is MoonLearning AI, and it is why the second collab pays better than the first.", level: "alone" },

  { key: "ask-time", label: "Ask a brand for more time", detail: "Request an extension when a deadline is going to be missed. MoonWriter AI writes the note and you read it before it goes.", level: "ask" },
  { key: "reply-note", label: "Answer a revision request", detail: "Reply when a brand asks for a change. You see the reply first.", level: "ask" },
  { key: "swap-format", label: "Suggest a different format on a live brief", detail: "Suggest a Reel where a Story was briefed, when the numbers say it will sell better. MoonScore AI asks, because it changes what you agreed to deliver.", level: "ask" },
];

/* ------------------------------------------------------------------ */
/* Activity — what the agents did on their own                         */
/* ------------------------------------------------------------------ */

export interface ActivityEntry {
  id: string;
  at: number;
  ruleKey: string;
  /** Which of the seven agents did it. An autonomous action nobody owns
      is an action nobody can question, so every entry is signed. */
  agent: string;
  title: string;
  because: string;
  effect: string;
  undone: boolean;
  undoable: boolean;
  undoNote?: string;
}

const now = Date.now();
const mins = (n: number) => now - n * 60_000;

export const SEED_ACTIVITY: ActivityEntry[] = [
  {
    id: "act-1", at: mins(38), ruleKey: "decline-low", agent: "MoonMatch AI",
    title: "Kept a fragrance campaign off your list",
    because: "It sells in Egypt and Jordan, and 14% of your audience is there. The match came out at 0.31, under the floor MoonMatch AI will bring you anything at. A campaign that cannot sell to your audience costs you the posts and pays you nothing.",
    effect: "One campaign never reached your list. The brand was told the audience did not line up rather than that you said no.",
    undone: false, undoable: true,
  },
  {
    id: "act-2", at: mins(96), ruleKey: "check-draft", agent: "MoonWriter AI",
    title: "Checked your Maison Dune ad against the brief",
    because: "The brief asks for the fabric said out loud and for the code on screen, and the ad has neither. MoonWriter AI wrote that brief, so it reads every ad you submit back against it.",
    effect: "Not accepted yet, with the two misses named. Fix them, submit it again, and it counts toward your payout.",
    undone: false, undoable: false,
    undoNote: "Nothing to take back: a check only reads what was submitted. Submitting it again runs it again.",
  },
  {
    id: "act-3", at: mins(260), ruleKey: "block-clash", agent: "MoonSearch AI",
    title: "Blocked a multi-brand beauty retailer",
    because: "They wanted a Reel in the same week your Luna Beauty work goes live. Two beauty brands on one grid in one week costs you both, and Luna is the one you already joined.",
    effect: "The campaign never reached you. It comes back automatically once the Luna deliverable is published.",
    undone: false, undoable: true,
  },
  {
    id: "act-4", at: mins(1_500), ruleKey: "learn", agent: "MoonLearning AI",
    title: "Moved Tide Trace up to Pre-qualified",
    because: "Your first Luna Beauty post carried 19 orders, in the top half of the 7 to 23 MoonScore AI expected. MoonLearning AI feeds a finished result back into matching, so a campaign you had to request became one of your three Pre-qualified ones.",
    effect: "Tide Trace moved from strong match to Pre-qualified, one of your three. It no longer needs a brand review.",
    undone: false, undoable: false,
    undoNote: "Not reversible: this is something the other agents have learned from work that already happened. Nothing about it obliges you to take the campaign.",
  },
  {
    id: "act-5", at: mins(2_700), ruleKey: "check-draft", agent: "MoonWriter AI",
    title: "Rewrote the Ounass brief in your register",
    because: "Ounass sent theirs in ad copy. MoonWriter AI read your last thirty captions and rewrote the brief so it sounds like something you would say, then checked the rewrite against what Ounass actually asked for.",
    effect: "The brief in your queue is the rewritten one. Every requirement Ounass set is still in it.",
    undone: false, undoable: true,
  },
];

/* ------------------------------------------------------------------ */
/* The store                                                           */
/* ------------------------------------------------------------------ */

export type PanelView =
  | "profile" | "read" | "offers"
  /* The dashboard's own views: the Figma's four tabs, the campaign
     detail, and the two agent pages that sit under Profile. */
  | "home" | "campaigns" | "campaign" | "calendar" | "earnings" | "profile" | "activity" | "autonomy"
  /* Kept so old deep links still resolve to something. */
  | "work" | "drafts" | "inbox" | "settings";

export type Connection = "instagram" | "tiktok" | "youtube" | "snapchat" | "payout";

/** A short confirmation along the top of the page — the design's green
    "Ad submitted" bar. Not kept: a reload does not replay news. */
export interface Toast {
  id: string;
  tone: "green" | "main" | "danger";
  text: string;
  /** The campaign it is about, when there is somewhere to go from it. */
  offerId?: string;
  /** The label on the way there: "See why", "Open". */
  action?: string;
}

/** A joined campaign's three tabs. */
export type CampaignTab = "details" | "stats" | "content";

export interface Account {
  firstName: string;
  lastName: string;
  dialCode: string;
  phone: string;
  verifiedAt: number;
  /** Added on the Profile page, confirmed with a code like the phone. */
  email?: string;
  emailVerifiedAt?: number;
}

/** Where Friday's run goes. Only the last four characters of the IBAN
    are kept: the prototype has no bank to send the rest to, and a
    browser's storage is no place for somebody's account number. */
export interface PayoutMethod {
  holder: string;
  /** The IBAN's country, "AE". */
  country: string;
  last4: string;
  bank?: string;
  addedAt: number;
}

export interface State {
  panel: { view: PanelView; open: boolean };
  dashboardView: PanelView;
  /** The campaign whose detail is open, on whichever surface. */
  selectedOfferId: string | null;
  readFocus: string | null;
  reads: Record<string, CreatorRead>;
  profiles: Record<string, Profile>;
  activeProfileId: string | null;
  threads: Record<string, ThreadItem[]>;
  activeThreadId: string;
  /** Offers the agent matched, kept so the dashboard and the panel
      agree about what is on the table. */
  offers: Record<string, Offer>;
  offerStates: Record<string, OfferState>;
  accepts: Record<string, AcceptRequest>;
  /** The brand's answer per campaign, keyed by campaign id. */
  decisions: Record<string, Decision>;
  sends: Record<string, SendRequest>;
  activity: ActivityEntry[];
  autonomy: AutonomyRule[];
  dismissedInbox: string[];
  connected: Connection[];
  /** The handle a connected account goes by, when the read did not find
      that account — a YouTube channel or a Snapchat the creator added on
      the Profile page. The read's own accounts carry theirs. */
  accountHandles: Partial<Record<Connection, string>>;
  account: Account | null;
  /** The campaign whose Join Campaign is waiting on the sign-in popup.
      Not kept: a reload does not reopen a popup nobody asked for. */
  signInFor: string | null;
  payout: PayoutMethod | null;
  /** Every ad the creator has submitted, keyed by the slot it covers. */
  submissions: Record<string, Submission>;
  /** Campaigns whose Application Status the creator has already been
      shown, so it greets them once rather than every visit. */
  seenDecisions: string[];
  toasts: Toast[];
  /** The tab a campaign should open on, when something sent the creator
      to a particular one — a toast saying an ad was not accepted opens
      Ad Content, not Details. Not kept. */
  campaignTab: CampaignTab | null;
}

export const FIRST_THREAD = "t-1";

const AUTONOMY_KEY = "mtac_autonomy";
/* THE KILL SWITCH, and the log of why it has been pulled.
 *
 *   v12 the thread's sentences changed after the 28 Sep review: the
 *       check and its buttons, the welcome after the read, and the edit
 *       hint, which no longer offers "three a month". A v11 thread keeps
 *       the old wording, including a line that was taken out.
 *   v11 tied scores are broken by a stated rule (byStrength) rather than
 *       by BRANDS order, so the three pre-qualified campaigns changed. A
 *       campaign's match gained `markets`, and a campaign gained
 *       `closesInDays`. A v10 session keeps its old three and has
 *       nothing for the tie-break to read.
 *   v10 a handle that is not seeded is read as a sample, with no name,
 *       avatar or location. A v9 session read under somebody's own
 *       handle keeps the first creator's identity on it.
 *   v9  stored sentences broke the review's copy rules: the seeded
 *       activity quoted a view count, a campaign's order forecast gave
 *       orders per thousand people reached, and the thread said
 *       "Building your card". A v8 session would keep all three.
 *   v8  pre-qualified is capped at three campaigns. A v7 session keeps
 *       stored campaigns with fifteen marked pre-qualified, and would
 *       join outright what should now be a request to join.
 *   v7  sixteen live campaigns instead of five, and finished ones with a
 *       `completed` state. A v6 session would keep its five and never
 *       see the rest, since matching only runs in the conversation.
 *   v6  the read's own sentences changed: no account carries a follower
 *       or view count in its note any more.
 *   v5  a campaign gained a tracking link, and no campaign is a fixed
 *       fee. A restored prepaid one renders terms that no longer exist.
 *   v4  the rate card became a profile with no rates on it, and a
 *       campaign gained a match and a commission.
 *   v3  `deliverables` went from a count to the bundle, and
 *       `offerStates` gained applied/approved/rejected. This is the one
 *       that taught the lesson: the suffix was NOT bumped, a restored
 *       campaign put a number where the card calls `.reduce`, and it
 *       was a crash on first render in the browser of anybody who had
 *       used the app before. `looksCurrent` below exists so the guard
 *       no longer depends on somebody remembering.
 *
 * Old writes are garbage-collected rather than migrated: this is
 * session state for a prototype, not somebody's records. */
const STATE_KEY = "mtac_state_v12";
const KEPT = [
  "reads", "profiles", "activeProfileId", "threads", "activeThreadId",
  "offers", "offerStates", "accepts", "decisions", "sends",
  "activity", "dismissedInbox", "connected", "accountHandles", "account", "submissions", "seenDecisions", "payout",
] as const;
type Kept = (typeof KEPT)[number];

function initial(): State {
  return {
    panel: { view: "profile", open: false },
    dashboardView: "home",
    selectedOfferId: null,
    readFocus: null,
    reads: {},
    profiles: {},
    activeProfileId: null,
    threads: { [FIRST_THREAD]: [] },
    activeThreadId: FIRST_THREAD,
    offers: {},
    offerStates: {},
    accepts: {},
    decisions: {},
    sends: {},
    activity: SEED_ACTIVITY,
    autonomy: DEFAULT_AUTONOMY,
    dismissedInbox: [],
    connected: [],
    accountHandles: {},
    account: null,
    signInFor: null,
    payout: null,
    submissions: {},
    seenDecisions: [],
    toasts: [],
    campaignTab: null,
  };
}

let state: State = initial();
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/* Written on a timer rather than on every set: a read streams nine
   layers in and a profile streams its fields, so an unthrottled save
   would serialise the whole store dozens of times during one build. */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function save() {
  if (typeof localStorage === "undefined") return;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const out: Record<string, unknown> = {};
      for (const k of KEPT) out[k] = state[k];
      localStorage.setItem(STATE_KEY, JSON.stringify(out));
    } catch {
      /* A full quota, or a private window that refuses. Losing the
         restore is not worth losing the session over. */
    }
  }, 250);
}

/* Does this restored blob describe the shape THIS code expects?
 *
 * The version suffix on the key is the kill switch, and a kill switch
 * only works if whoever changes the shape remembers to pull it. Once,
 * somebody did not: `deliverables` went from a count to a bundle, the
 * key stayed at v2, and a restored campaign put a number where the card
 * calls `.reduce` — which is a crash on first render, in the browser of
 * anybody who had used the app before.
 *
 * So the restore checks rather than trusts. Anything that fails is
 * dropped whole and the session starts over, which costs a demo its
 * scrollback and never costs it a white screen. */
function looksCurrent(saved: Partial<Pick<State, Kept>>): boolean {
  const offers = saved.offers;
  if (offers && typeof offers === "object") {
    for (const o of Object.values(offers)) {
      const off = o as Offer;
      if (!off || !Array.isArray(off.deliverables)) return false;
      if (typeof off.payKind !== "string") return false;
      /* Added when campaigns stopped borrowing a creator's photograph
         for their hero. A restored offer without these renders an
         undefined tint and falls back to the old image, so it is stale
         rather than merely older. Every field the UI now reads has to
         be checked here — that is the whole job of this function. */
      if (typeof off.product !== "string" || typeof off.family !== "string") return false;
      /* v0.2: a campaign carries a match and a commission, and no fee.
         Anything saved before that renders an undefined match level. */
      if (!off.match || typeof off.match.level !== "string") return false;
      if (typeof off.commissionPct !== "number") return false;
      /* The tracking link sits beside the code now, so an offer without
         one renders an empty half of that card. */
      if (typeof off.trackingLink !== "string") return false;
      /* And no campaign is a fixed fee any more. One saved as prepaid
         would render terms the product no longer runs on. */
      if (off.payKind !== "postpaid") return false;
      /* v11: what the tie-break reads. Without these, byStrength would
         compare undefined and stop being deterministic. */
      if (!off.match.markets || typeof off.match.markets.covered !== "number") return false;
      if (off.closesInDays !== null && typeof off.closesInDays !== "number") return false;
    }
  }
  const profiles = (saved as { profiles?: unknown }).profiles;
  if (profiles && typeof profiles === "object") {
    for (const c of Object.values(profiles as Record<string, unknown>)) {
      if (!c || !Array.isArray((c as Profile).influence?.value)) return false;
    }
  }
  return true;
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Pick<State, Kept>>;
      if (!looksCurrent(saved)) {
        localStorage.removeItem(STATE_KEY);
        throw new Error("stale shape");
      }
      const patch: Partial<State> = {};
      for (const k of KEPT) if (saved[k] !== undefined) (patch as Record<string, unknown>)[k] = saved[k];
      state = { ...state, ...patch };
      /* A profile holds a read id, not a read, so the registry has to
         know the restored reads or every profile comes back without
         evidence. */
      for (const r of Object.values(state.reads)) rememberRead(r);
      /* A submission is one of three states. Anything else was saved by
         an earlier shape of the flow and would draw as nothing at all. */
      state = { ...state, submissions: Object.fromEntries(Object.entries(state.submissions ?? {})
        .filter(([, x]) => x && (x.state === "review" || x.state === "accepted" || x.state === "rejected"))) };

      /* An INTERRUPTED run is not worth restoring. If the tab was closed
         while the read was still streaming, what comes back is a thread
         saying "Reading @you" with nothing under it and no way to
         continue: the effect that starts a read only fires on an empty
         thread, so the stub would sit there forever. A session that
         never settled a read starts over instead. */
      if (Object.keys(state.reads).length === 0) {
        state = { ...state, threads: { [FIRST_THREAD]: [] }, activeThreadId: FIRST_THREAD };
      }
    }
  } catch {
    /* A stale or unreadable blob. The session starts clean rather than
       half-read, which is the whole point of checking. */
    state = { ...state, threads: { [FIRST_THREAD]: [] }, activeThreadId: FIRST_THREAD };
  }
  /* Writes from earlier shapes, swept rather than left to sit in
     somebody's browser forever. */
  try { for (const k of ["mtac_state_v1", "mtac_state_v2", "mtac_state_v3", "mtac_state_v4", "mtac_state_v5", "mtac_state_v6", "mtac_state_v7", "mtac_state_v8", "mtac_state_v9", "mtac_state_v10", "mtac_state_v11"]) localStorage.removeItem(k); } catch {}
  try {
    const a = localStorage.getItem(AUTONOMY_KEY);
    if (a) {
      const saved: Record<string, AutonomyLevel> = JSON.parse(a);
      state = { ...state, autonomy: state.autonomy.map((r) => (r.locked ? r : { ...r, level: saved[r.key] ?? r.level })) };
    }
  } catch {}
}

function subscribe(l: () => void) {
  hydrate();
  listeners.add(l);
  return () => { listeners.delete(l); };
}
const snap = () => state;
const SERVER_STATE: State = initial();
const serverSnap = () => SERVER_STATE;

function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
  save();
}

/** False on the server and on the first client render, true once the
    saved session has been read back. A page that acts on something
    being ABSENT — no profile, so leave — has to wait for this, or it
    acts on the server's empty snapshot and throws a returning creator
    out before their profile has loaded. */
export const useHydrated = () => useSyncExternalStore(subscribe, () => hydrated, () => false);

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => pick(snap()), () => pick(serverSnap()));
}

/** Forget the account and everything under it. Signing out of a
    prototype that then shows you the last person's campaigns is not a
    sign-out. */
export const resetAll = () => {
  try { localStorage.removeItem(STATE_KEY); } catch {}
  const fresh = initial();
  state = { ...fresh, autonomy: state.autonomy };
  claimed.clear();
  emit();
};

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

let seq = 0;
export const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

export const putRead = (r: CreatorRead) => {
  rememberRead(r);
  set((s) => ({ reads: { ...s.reads, [r.id]: r } }));
};

export const correctRead = (readId: string, c: Correction, apply: (r: CreatorRead) => CreatorRead) =>
  set((s) => {
    const r = s.reads[readId];
    if (!r) return {};
    const next = { ...apply(r), corrections: [...r.corrections, c] };
    rememberRead(next);
    return { reads: { ...s.reads, [readId]: next } };
  });

export const putProfile = (c: Profile, makeActive = true) =>
  set((s) => ({ profiles: { ...s.profiles, [c.id]: c }, activeProfileId: makeActive ? c.id : s.activeProfileId }));

/** The matched set REPLACES the open ones.
 *
 * Merging was wrong, and visibly so: drop a platform or add a category
 * to your no-list, watch the agent say a campaign no longer fits, and
 * then scroll down to that campaign still sitting there. A campaign
 * that no longer matches is not history, it is gone.
 *
 * What survives a re-match is anything already DECIDED. A campaign you
 * joined is work, and one you turned down is a signal — neither is
 * re-decided by a change to the profile. */
export const putOffers = (os: Offer[]) =>
  set((s) => {
    const decided = Object.values(s.offers).filter((o) => {
      const st = s.offerStates[o.id] ?? o.state;
      /* Anything the creator or the brand has already ruled on. A price
         change does not re-open an application that is with a brand. */
      return st !== "open";
    });
    const next = [...decided, ...os.filter((o) => !decided.some((d) => d.id === o.id))];
    return {
      offers: Object.fromEntries(next.map((o) => [o.id, o])),
      /* The creator's own decision wins; otherwise the campaign's. This
         was `?? "open"`, which quietly re-opened a finished campaign
         the moment it arrived — history became something to join. */
      offerStates: Object.fromEntries(next.map((o) => [o.id, s.offerStates[o.id] ?? o.state])),
    };
  });

export const setOfferState = (id: string, st: OfferState) =>
  set((s) => ({ offerStates: { ...s.offerStates, [id]: st } }));

/* Omit across a union has to distribute, or every member collapses to
   the fields they share. */
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewThreadItem = DistOmit<ThreadItem, "id" | "at"> & { id?: string };

export const activeThread = (s: State) => s.threads[s.activeThreadId] ?? [];

export const push = (item: NewThreadItem) => {
  const full = { ...item, id: item.id ?? nextId(item.kind), at: Date.now() } as ThreadItem;
  set((s) => ({ threads: { ...s.threads, [s.activeThreadId]: [...(s.threads[s.activeThreadId] ?? []), full] } }));
  return full.id;
};

export const patchThread = (id: string, patch: Partial<ThreadItem>) =>
  set((s) => ({
    threads: {
      ...s.threads,
      [s.activeThreadId]: activeThread(s).map((t) => (t.id === id ? ({ ...t, ...patch } as ThreadItem) : t)),
    },
  }));

export const dropThread = (id: string) =>
  set((s) => ({ threads: { ...s.threads, [s.activeThreadId]: activeThread(s).filter((t) => t.id !== id) } }));

export const resetThread = () =>
  set((s) => { claimed.clear(); return { threads: { ...s.threads, [s.activeThreadId]: [] } }; });

/* ------------------------------------------------------------------ */
/* Run once, and mean it                                               */
/*                                                                     */
/* React invokes an effect twice in development, and the second pass    */
/* re-reads state from the first pass's closure — so a `status !==      */
/* "idle"` check does not stop a second run, and both runs then report  */
/* their result. A module-level claim is outside React's lifecycle, so  */
/* it holds however many times the component mounts.                    */
/* ------------------------------------------------------------------ */
const claimed = new Set<string>();

export function claimOnce(key: string): boolean {
  if (claimed.has(key)) return false;
  claimed.add(key);
  return true;
}

export const threadIsEmpty = () => activeThread(state).length === 0;

/** The thread as it stands, outside React. Used to find the step a
    question interrupted so it can be moved to the end and answered —
    Alex: "they interrupt, we answer them, and we go back to the flow." */
export const liveThread = () => activeThread(state);

export const activeProfileLive = (): Profile | null =>
  state.activeProfileId ? state.profiles[state.activeProfileId] ?? null : null;

/* ------------------------------------------------------------------ */
/* Requests → agreements. The only path, and it is a click.            */
/* ------------------------------------------------------------------ */

/* A request id is derived from the offer, so pressing Accept twice
   produces the SAME id. Letting a fresh "pending" request land on top
   of a confirmed one would un-accept work that is already booked. */
export const putAccept = (r: AcceptRequest) =>
  set((s) => (s.accepts[r.id]?.state === "confirmed" ? {} : { accepts: { ...s.accepts, [r.id]: r } }));

/** The only place an application is SUBMITTED, and it is only ever
    reachable from an explicit press. No tool reaches it.
 *
 * Note what it does not do: it does not make the work the creator's.
 * It puts the application with the brand, which is what pressing Join
 * Campaign does in the design. The brand's answer is `decideOffer`. */
export const confirmAccept = (id: string) =>
  set((s) => {
    const r = s.accepts[id];
    if (!r || r.state !== "pending") return {};
    return {
      accepts: { ...s.accepts, [id]: { ...r, state: "confirmed" } },
      offerStates: { ...s.offerStates, [r.offerId]: "applied" },
    };
  });

/** The brand's answer. Recorded against the campaign, with the decision
    kept whole so the Application Status card can show what it was
    approved ON — the cadence and the duration — rather than just that
    it was. */
export const decideOffer = (d: Decision) =>
  set((s) => ({
    offerStates: { ...s.offerStates, [d.offerId]: d.outcome },
    decisions: { ...s.decisions, [d.offerId]: { ...d, decidedAt: d.decidedAt ?? Date.now() } },
  }));

export const cancelAccept = (id: string) =>
  set((s) => {
    const r = s.accepts[id];
    if (!r || r.state !== "pending") return {};
    return { accepts: { ...s.accepts, [id]: { ...r, state: "cancelled" } } };
  });

export const putSend = (r: SendRequest) => set((s) => ({ sends: { ...s.sends, [r.id]: r } }));
export const setSendState = (id: string, st: SendRequest["state"]) =>
  set((s) => (s.sends[id] ? { sends: { ...s.sends, [id]: { ...s.sends[id], state: st } } } : {}));

/* ------------------------------------------------------------------ */
/* Ads — posted by the creator, submitted, checked                     */
/* ------------------------------------------------------------------ */

/** How long the prototype's check takes. A real one reads the post
    itself and takes longer; a demo that made anybody wait for it would
    not be demonstrating anything. */
export const REVIEW_MS = 6_000;

/** THE ONLY PLACE AN AD IS SUBMITTED, and only ever from a press — the
    review's "report a post", and the step that gets it paid (see the
    `report` lock in DEFAULT_AUTONOMY: no agent can do it). The ad is
    already up; this hands over the proof. Submitting again after a
    rejection is a new attempt on the same slot. */
export const sendAd = (s: Pick<Submission, "id" | "offerId" | "n" | "platform" | "format" | "accounts" | "kind" | "file" | "link" | "checked">) =>
  set((st) => {
    const now = Date.now();
    const sub: Submission = { ...s, state: "review", attempt: (st.submissions[s.id]?.attempt ?? 0) + 1, sentAt: now, answerAt: now + REVIEW_MS };
    return { submissions: { ...st.submissions, [s.id]: sub } };
  });

/** Land every check whose time has come, with a toast for each. Run on
    a clock (useReviewClock) rather than a timeout per ad, so an answer
    that fell due while the tab was closed still lands on the next
    visit. */
export const settleReviews = (now = Date.now()) => {
  const due = Object.values(state.submissions).filter((s) => s.state === "review" && s.answerAt <= now);
  if (!due.length) return;
  const submissions = { ...state.submissions };
  const toasts: Toast[] = [];
  for (const s of due) {
    const o = state.offers[s.offerId];
    if (!o) continue;
    const r = tools.verify_ad({ submission: s, offer: o });
    const what = `${FORMAT_NAME[s.format]} for ${o.brand}`;
    if (r.outcome === "rejected") {
      submissions[s.id] = { ...s, state: "rejected", answeredAt: now, note: r.note, missed: r.missed };
      toasts.push({ id: nextId("toast"), tone: "danger", text: `Your ${what} wasn't accepted.`, offerId: o.id, action: "See why" });
    } else {
      submissions[s.id] = { ...s, state: "accepted", answeredAt: now };
      toasts.push({ id: nextId("toast"), tone: "green", text: `Your ${what} is accepted. It counts toward your payout.`, offerId: o.id, action: "Open" });
    }
  }
  set((st) => ({ submissions, toasts: [...st.toasts, ...toasts] }));
};

/** Keeps the checks landing while a page is open. Idle when nothing is
    in review. */
export function useReviewClock() {
  const waiting = useStore((s) => Object.values(s.submissions).some((x) => x.state === "review"));
  useEffect(() => {
    if (!waiting) return;
    settleReviews();
    const t = setInterval(() => settleReviews(), 1_000);
    return () => clearInterval(t);
  }, [waiting]);
}

export const pushToast = (t: Omit<Toast, "id">) => {
  const id = nextId("toast");
  set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
  return id;
};
export const dropToast = (id: string) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));

export const markDecisionSeen = (offerId: string) =>
  set((s) => (s.seenDecisions.includes(offerId) ? {} : { seenDecisions: [...s.seenDecisions, offerId] }));

/** Open a campaign on a particular tab. */
export const openCampaign = (offerId: string, tab: CampaignTab | null = null) =>
  set({ selectedOfferId: offerId, campaignTab: tab });
export const clearCampaignTab = () => set({ campaignTab: null });
/** Whether the dashboard is showing this campaign right now. For news
    that arrives on a timer: on the page it is the page's to show. */
export const viewingCampaign = (id: string) => state.dashboardView === "campaign" && state.selectedOfferId === id;

export const connect = (c: Connection, handle?: string) =>
  set((s) => ({
    connected: s.connected.includes(c) ? s.connected : [...s.connected, c],
    ...(handle ? { accountHandles: { ...s.accountHandles, [c]: handle } } : {}),
  }));
export const disconnect = (c: Connection) =>
  set((s) => {
    const { [c]: _gone, ...rest } = s.accountHandles;
    void _gone;
    return { connected: s.connected.filter((x) => x !== c), accountHandles: rest, ...(c === "payout" ? { payout: null } : {}) };
  });

/** A payout method is a connection: Explore's alert and Earnings read
    `connected`, so saving one is also connecting "payout". */
export const setPayout = (p: PayoutMethod) =>
  set((s) => ({ payout: p, connected: s.connected.includes("payout") ? s.connected : [...s.connected, "payout"] }));

export const setAccount = (a: Account) => set({ account: a });
/** For an event handler, which cannot call a hook. */
export const hasAccount = () => state.account !== null;
export const activeProfileNow = () => (state.activeProfileId ? state.profiles[state.activeProfileId] ?? null : null);
export const askSignIn = (offerId: string) => set({ signInFor: offerId });
export const closeSignIn = () => set({ signInFor: null });

export const setAutonomy = (key: string, level: AutonomyLevel) =>
  set((s) => {
    const autonomy = s.autonomy.map((r) => (r.key === key && !r.locked ? { ...r, level } : r));
    try {
      localStorage.setItem(AUTONOMY_KEY,
        JSON.stringify(Object.fromEntries(autonomy.filter((r) => !r.locked).map((r) => [r.key, r.level]))));
    } catch {}
    return { autonomy };
  });

export const undoActivity = (id: string) =>
  set((s) => ({ activity: s.activity.map((a) => (a.id === id && a.undoable ? { ...a, undone: true } : a)) }));

export const redoActivity = (id: string) =>
  set((s) => ({ activity: s.activity.map((a) => (a.id === id ? { ...a, undone: false } : a)) }));

export const dismissInbox = (id: string) =>
  set((s) => ({ dismissedInbox: [...s.dismissedInbox, id] }));

/* ------------------------------------------------------------------ */
/* The panel, and the dashboard's own view                             */
/*                                                                     */
/* Two fields, one owner each. They used to be one in the brands app,   */
/* which meant moving around the dashboard silently repointed the       */
/* conversation's panel and armed it open on a surface nobody was on.   */
/* ------------------------------------------------------------------ */

export const openPanel = (view: PanelView) => set({ panel: { view, open: true } });
export const setPanelView = (view: PanelView) => set((s) => ({ panel: { ...s.panel, view } }));
export const closePanel = () => set((s) => ({ panel: { ...s.panel, open: false } }));
export const setDashboardView = (view: PanelView) => set({ dashboardView: view });
export const focusRead = (layer: string | null) => set({ readFocus: layer });
export const selectOffer = (id: string | null) => set({ selectedOfferId: id });
export const useSelectedOfferId = () => useStore((s) => s.selectedOfferId);

export const startConversation = (): string => {
  const id = nextId("t");
  claimed.clear();
  set((s) => ({
    threads: { ...s.threads, [id]: [] },
    activeThreadId: id,
    activeProfileId: null,
    panel: { view: "profile", open: false },
  }));
  return id;
};

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export const usePanel = () => useStore((s) => s.panel);
export const useDashboardView = () => useStore((s) => s.dashboardView);
export const useThread = () => useStore(activeThread);
export const useActiveThreadId = () => useStore((s) => s.activeThreadId);
export const useActiveProfile = () => useStore((s) => (s.activeProfileId ? s.profiles[s.activeProfileId] ?? null : null));
export const useRead = (id: string | null) => useStore((s) => (id ? s.reads[id] ?? null : null));
export const useAutonomy = () => useStore((s) => s.autonomy);
export const useActivity = () => useStore((s) => s.activity);
export const useConnected = () => useStore((s) => s.connected);
export const useAccountHandles = () => useStore((s) => s.accountHandles);
export const useAccount = () => useStore((s) => s.account);
export const usePayout = () => useStore((s) => s.payout);
export const useSignInFor = () => useStore((s) => s.signInFor);
export const useDismissed = () => useStore((s) => s.dismissedInbox);
export const useSubmissions = () => useStore((s) => s.submissions);
export const useSeenDecisions = () => useStore((s) => s.seenDecisions);
export const useToasts = () => useStore((s) => s.toasts);
export const useCampaignTab = () => useStore((s) => s.campaignTab);

/* ------------------------------------------------------------------ */
/* Derived selectors, and why they are memoised                        */
/*                                                                     */
/* `useSyncExternalStore` compares snapshots by identity. A selector    */
/* that maps or filters builds a NEW array on every call, so the store  */
/* looks changed on every render and React re-renders forever — which   */
/* is exactly what happened, as "getServerSnapshot should be cached"    */
/* followed by a maximum-update-depth crash.                            */
/*                                                                     */
/* So each derived list is cached against the state slices it actually  */
/* reads. Same inputs, same array identity, no loop.                    */
/* ------------------------------------------------------------------ */

/* Keyed on the FIRST argument object rather than on a single slot.
 *
 * A single-slot cache is not enough here, and the reason is worth
 * writing down: `useSyncExternalStore` calls the selector against the
 * client snapshot AND the server snapshot, and those are two different
 * state objects. Through one slot they evict each other on every call,
 * so every call returns a fresh array, React sees the store change on
 * every render, and the page dies with "maximum update depth exceeded".
 * A WeakMap gives each state object its own entry and lets them both be
 * stable. */
function memo2<A, B, R>(fn: (a: A, b: B) => R) {
  const cache = new WeakMap<object, { b: B; out: R }>();
  return (a: A, b: B): R => {
    const key = a as unknown as object;
    const hit = cache.get(key);
    if (hit && hit.b === b) return hit.out;
    const out = fn(a, b);
    cache.set(key, { b, out });
    return out;
  };
}

const offersOf = memo2((offers: State["offers"], states: State["offerStates"]): Offer[] =>
  Object.values(offers).map((o) => ({ ...o, state: states[o.id] ?? o.state })));

/** Every offer the agent has matched, with the creator's decision
    applied. One list, so the panel and the dashboard cannot disagree. */
export const useOffers = (): Offer[] => useStore((s) => offersOf(s.offers, s.offerStates));

/** Campaigns the brand has approved. This is the work. */
export const useApproved = () => useOffers().filter((o) => o.state === "approved");

/** Whether anything has been accepted. Before that the dashboard has
    nothing to count, and says so rather than showing somebody else's
    numbers. */
export const useStarted = () => useStore((s) => Object.values(s.offerStates).some((v) => v === "approved"));
export const useDecisions = () => useStore((s) => s.decisions);
