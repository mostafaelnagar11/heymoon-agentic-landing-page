"use client";

/* Session state.

   One module store behind `useSyncExternalStore`, the same shape the
   current app uses for funding and ad decisions. It is deliberately IN
   MEMORY: a hard refresh restarts the demo rather than leaving a
   half-finished campaign in localStorage pretending to be a server.

   Deep links still work, because every tool is deterministic — a plan
   that is not in the store is rebuilt from its read id rather than
   404ing. See `planFor`.

   The two exceptions, both small and both honest about what they are:
   the interface language, and the autonomy settings. Those are
   preferences, and a preference should survive a reload. */

import { useSyncExternalStore } from "react";
import type {
  AdRecord, AdState, ApprovalRequest, BrandRead, Correction,
  FundingRequest, Plan,
} from "./agent/types";
import { rememberRead } from "./agent/registry";
import { withBilling, type Billing } from "./agent/billing";
import { hash } from "./agent/rng";
import { ADS, PHASES, type Phase } from "./mock/campaigns";
import { FIRST_SALE_DAYS, LAUNCH_BY_DAYS, PHASE_START_DAYS, STAGES, plusDays, type CouponRules, type Stage, type StageKey } from "./agent/connect";

/* ------------------------------------------------------------------ */
/* Thread blocks                                                       */
/*                                                                     */
/* The conversation is not a list of strings. Every turn is a typed     */
/* block, so a plan card in the thread is the same component as the     */
/* plan card on the proposal screen, reading the same object.           */
/* ------------------------------------------------------------------ */

export type ThreadItem =
  | { id: string; kind: "user"; text: string; at: number }
  | { id: string; kind: "say"; text: string; at: number; streaming?: boolean }
  | { id: string; kind: "plan-card"; at: number }
  | { id: string; kind: "creator-grid"; at: number }
  | { id: string; kind: "confidence"; at: number }
  | { id: string; kind: "brief-card"; at: number }
  | { id: string; kind: "changes"; changeIds: string[]; at: number }
  | { id: string; kind: "funding"; requestId: string; at: number }
  | { id: string; kind: "receipt"; requestId: string; at: number }
  | { id: string; kind: "report"; campaignId: string; at: number }
  | { id: string; kind: "ad-card"; adId: string; at: number }
  | { id: string; kind: "approval"; requestId: string; at: number }
  | { id: string; kind: "working"; note: string; done: number; total: number; at: number }
  /* The store read, as a card in the conversation. The read is the first
     thing the agent does, so it happens here rather than on a page the
     chat comes after. */
  | { id: string; kind: "read"; url: string; at: number }
  /* The three phases, shown before payment. There is deliberately no
     pre-payment "connect" block any more: the store connection comes
     after payment, because it measures the guarantee rather than
     qualifying the brand. */
  | { id: string; kind: "ladder"; at: number }
  /* Store integration, shown AFTER payment. */
  /* Plan done, payment done, connection next — the three steps as one card. */
  | { id: string; kind: "checklist"; at: number }
  /* The confidence in one budget-and-multiple pair, shown beside the
     sentence that states it. Read-only: it carries the two numbers the
     agent was talking about, so scrolling back shows what was true
     then rather than what is true now. */
  | { id: string; kind: "score"; planBudget: number; roas: number; at: number }
  /* The store that came in under the traffic floor. */
  | { id: string; kind: "rejected"; readId: string; at: number }
  /* The scope the brand confirms before the plan is built (brand team, 15 Oct): which markets, which products. */
  | { id: string; kind: "pick-markets"; readId: string; at: number }
  | { id: string; kind: "pick-products"; readId: string; at: number }
  /* What the $1,000 includes, shown with the plan before Pay. */
  | { id: string; kind: "includes"; at: number }
  /* After payment, MoonConnect's steps in the conversation (PRD v0.2, 6a to 6d), and the launch tracker after them. */
  | { id: string; kind: "connect"; at: number }
  | { id: string; kind: "discount"; at: number }
  | { id: string; kind: "store-check"; at: number }
  | { id: string; kind: "brief-review"; at: number }
  | { id: string; kind: "tracker"; at: number }
  /* The plan, emailed: to the brand leaving for now, or to whoever decides (brand flows, P0 "leaves", P1). */
  | { id: string; kind: "email-sent"; to: string; planId: string; at: number };

/* ------------------------------------------------------------------ */
/* Autonomy                                                            */
/* ------------------------------------------------------------------ */

export type AutonomyLevel = "alone" | "ask" | "never";

export interface AutonomyRule {
  key: string;
  label: string;
  detail: string;
  level: AutonomyLevel;
  /** Rules the brand cannot move. Money and publishing are fixed at
      "never" — that is the product's promise, not a preference. */
  locked?: boolean;
}

/* Every row names the agent it governs, because "the agent did it" is
   not an answer a brand can argue with and "MoonScore AI moved $340
   between two live ads" is. The three locked rows name an agent too —
   there, to say plainly which one is being held back. */
export const DEFAULT_AUTONOMY: AutonomyRule[] = [
  { key: "move-money", label: "Move money", detail: "Start a phase, take a payment, or change your card. No agent does this. MoonScore AI can only move budget you have already paid, inside the phase you paid it for.", level: "never", locked: true },
  { key: "publish", label: "Publish an ad", detail: "Put a creator's draft live on a platform. MoonLive AI is what publishes an ad, and it only ever publishes one you have approved.", level: "never", locked: true },
  { key: "contract", label: "Sign anything on your behalf", detail: "Agree terms with a creator or a platform. MoonMatch AI matches a creator and MoonSearch AI vets them, but neither can commit you to anything.", level: "never", locked: true },
  { key: "rebalance", label: "Shift budget between live creators", detail: "Move spend towards ads that are converting, inside the phase budget you already paid for. This is MoonScore AI, whose whole job is re-allocating budget to what converts.", level: "alone" },
  { key: "brief-tweak", label: "Tighten the brief mid-phase", detail: "Add a rule to the brief when drafts keep missing the same thing. MoonWriter AI wrote the brief, so it is the one that edits it.", level: "alone" },
  { key: "reorder", label: "Re-order the review queue", detail: "Put the drafts that matter most in front of you first. MoonSearch AI pushes anything that looks like a risk to the top; MoonScore AI pushes anything that looks like a sale.", level: "alone" },
  { key: "learn", label: "Learn from a finished phase", detail: "Feed what a phase actually sold back into how creators are matched, how the brief is written and where budget goes. This is MoonLearning AI, and it is why each phase starts better informed than the one before it.", level: "alone" },
  { key: "swap-creator", label: "Swap a creator who drops out", detail: "Replace a creator who cannot deliver with the next best match, inside the same phase budget. MoonMatch AI picks the replacement and MoonSearch AI vets them before they are offered to you.", level: "ask" },
  { key: "pause-ad", label: "Pause a live ad that is underperforming", detail: "Stop spend behind an ad, without unpublishing it. MoonScore AI asks for this when an ad is spending without converting.", level: "ask" },
  { key: "extend", label: "Extend the phase window", detail: "Give the phase more days to reach its target. MoonScore AI asks when the pace says the window was short rather than the work was wrong.", level: "ask" },
  { key: "email-creator", label: "Message a creator directly", detail: "Ask for a re-cut, or chase a late draft. MoonWriter AI writes the note, and you read it before it goes.", level: "ask" },
];

/* ------------------------------------------------------------------ */
/* Activity — what the agents did on their own                         */
/* ------------------------------------------------------------------ */

export interface ActivityEntry {
  id: string;
  at: number;
  /** The autonomy rule that permitted it. */
  ruleKey: string;
  /** Which of the seven agents did it. An autonomous action nobody owns
      is an action a brand cannot question, so every entry is signed. */
  agent: string;
  title: string;
  /** Why it did this, in one sentence. */
  because: string;
  /** What it changed, so undo has something to reverse. */
  effect: string;
  undone: boolean;
  undoable: boolean;
  /** For a move made from the campaign's moves: the sales it was estimated to add, so the forecast keeps it. */
  adds?: number;
  /** Only when `undoable` is false: what reversing it would actually
      take, in the entry's own words rather than one sentence the log
      prints over every irreversible action. */
  undoNote?: string;
}

const now = Date.now();
const mins = (n: number) => now - n * 60_000;

export const SEED_ACTIVITY: ActivityEntry[] = [
  {
    id: "act-1", at: mins(41), ruleKey: "rebalance", agent: "MoonScore AI",
    title: "Moved $340 behind Noon Reviews' haul video",
    because: "Re-allocating budget to whatever is converting is MoonScore AI's entire job, and this was the clearest case in the phase: the haul was converting at 2.4x the phase median and still had budget left to spend, while two Story placements had spent 60% of theirs for a fifth of the sales.",
    effect: "Phase 2 spend: −$180 from two Story placements, +$340 to the TikTok haul. Total phase budget unchanged.",
    undone: false, undoable: true,
  },
  {
    id: "act-2", at: mins(96), ruleKey: "reorder", agent: "MoonScore AI",
    title: "Put Mais Mustafa's trench draft at the top of your queue",
    because: "MoonWriter AI is holding that draft against the brief it wrote: it is the only one in the queue I would not approve, and it is also the oldest. What it is short of is the discount code, and the code is what attributes every order on this phase, so MoonScore AI moved it to the front on sales rather than on tidiness, and deciding it now leaves room for a re-cut while the review window is still open.",
    effect: "Review queue order only. No decision was made on your behalf.",
    undone: false, undoable: true,
  },
  {
    id: "act-3", at: mins(210), ruleKey: "brief-tweak", agent: "MoonWriter AI",
    title: "Added a code-visibility rule to the Phase 2 brief",
    because: "MoonWriter AI wrote this brief and reads every draft back against it. Three of the last nine drafts held the discount code on screen for under three seconds. Attribution runs entirely through that code, so a short hold is lost revenue.",
    effect: "Brief now reads “hold the code on screen for at least five seconds”. Applies to drafts submitted from now on.",
    undone: false, undoable: true,
  },
  {
    id: "act-4", at: mins(1_450), ruleKey: "rebalance", agent: "MoonScore AI",
    title: "Held back $600 of Phase 2 budget",
    because: "Four of the eight creators on this phase had not submitted a draft yet, and MoonScore AI will not spend a creator's share before the work it pays for exists. Doing so would have flattered the early numbers.",
    effect: "$600 reserved, released as drafts arrive. $410 of it has since been deployed.",
    undone: false, undoable: false,
    undoNote: "Not reversible from here: $410 of what was held has already gone out behind live ads. Ask me in the conversation and I will lay out what pulling the rest back would cost you.",
  },
  {
    /* The continuous learning loop, doing something a brand can see.
       MoonLearning AI is the only agent whose output is other agents:
       it reads a finished phase and changes how MoonMatch matches,
       how MoonWriter writes and where MoonScore puts money. */
    id: "act-5", at: mins(2_880), ruleKey: "learn", agent: "MoonLearning AI",
    title: "Stopped MoonMatch AI ranking your creators on follower count",
    because: "Phase 1 and the first weeks of Phase 2 say the same thing about your brand: the drafts that talk through sizing and fabric out-earn the ones that only style the piece, and audience size predicts almost none of it. Feeding a finished result back into the other agents is what MoonLearning AI is for, so the ranking now weights what actually converted on your store.",
    effect: "MoonMatch AI now ranks your matches on view-through and attributed orders rather than following, and MoonWriter AI's brief asks for sizing on camera by name. The ribbed-knit draft in your queue is the first one written to it. Nothing already live changed.",
    undone: false, undoable: false,
    undoNote: "Not reversible: this is something the other agents have learned, not a setting they hold. Setting “Learn from a finished phase” to Never stops the next update; it does not unlearn this one.",
  },
];

/* ------------------------------------------------------------------ */
/* The store                                                           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* The panel                                                          */
/*                                                                     */
/* Every screen that used to be a route is now a view in one panel     */
/* beside the conversation. The chat can open one, the rail can open   */
/* one, and that is the whole navigation model.                        */
/* ------------------------------------------------------------------ */

export type PanelView =
  | "plan" | "read"
  /* The dashboard's own views. `home` is the overview the rail opens on;
     the rest are the running views. */
  | "home" | "campaign" | "creators" | "ads" | "inbox" | "activity" | "autonomy" | "settings";

/* A campaign, and the conversation that built it.

   The product ran on one of each for a while, and the rail that would
   have listed them was removed precisely because a list of one is
   furniture. It comes back the moment there is a second, which is the
   only honest trigger for it.

   A campaign OWNS its phases. They used to be a module-level fixture —
   one ladder for the whole app — which was fine while there was one
   campaign and wrong the instant there were two. */
export interface Campaign {
  id: string;
  /** The conversation that built it. One thread, one campaign. */
  threadId: string;
  brandName: string;
  /** What the brand chose to call this one, if they renamed it. */
  label?: string;
  url: string;
  readId: string | null;
  planId: string | null;
  /** This campaign's own three rungs. */
  phases: Phase[];
  /** Which ad ids belong to it. Empty until drafts arrive. */
  adIds: string[];
  createdAt: number;
  /** Payment and the store connection are per campaign. A second
      campaign is not paid for because the first one was. */
  paid: boolean;
  connectedStore: StorePlatform | null;
  /** Between paying and the first ad going live: the launch checklist (brand flows, P2). Absent on campaigns that
      were running before the checklist existed, and on the running demo. */
  launch?: Launch;
  /** Changes to the brief a member suggested, for the owner or an admin to add or dismiss. */
  suggestions?: { by: string; text: string; at: number }[];
}

/* After payment, until the first sale (PRD: HeyMoon v0.2, from payment to first campaign live, 20 Oct). The brand
   connects its store, sets the discount rules, passes the store check and approves the brief, all in the
   conversation with MoonConnect; then Moontech matches, invites and launches, and the dashboard shows the launch
   tracker until the first redemption. Each field is the fact Orbit records as a ledger event. A connected store is
   the campaign's `connectedStore`; the team route (unsupported platform, or Shopify while its app is in review) is
   `legacyAt`. */
export interface Launch {
  paidAt: number;
  legacyAt: number | null;
  coupon: CouponRules | null;
  checkAttempts: number;
  checkPassedAt: number | null;
  /** Two failed checks: the Moontech team passes it by hand. */
  checkToTeamAt: number | null;
  briefApprovedAt: number | null;
  /** Who approved it (the PRD's "approved by", a Contact). */
  briefApprovedBy?: string | null;
  /** Guidelines or past UGC the brand added to the brief (MNMP-1). */
  briefFiles: string[];
  matchedAt: number | null;
  /** launchCampaign ran: the campaign is active and wave 1 is sent (day 0). "Launched" in the PRD's north star. */
  launchedAt: number | null;
  /** Phase 1 started, day 6 after the launch. */
  phaseStartedAt: number | null;
  firstSaleAt: number | null;
}

/** Paid and no first sale yet: the dashboard shows the launch tracker rather than results. */
export const isLaunching = (c: Campaign | null | undefined) => !!c?.paid && !!c.launch && !c.launch.firstSaleAt;

/** Where each tracker stage stands (H5): when its fact was recorded, or null while it is open. On the team route the
    team sets the code and runs the check with the brand, so those two wait on Moontech rather than on the brand. */
export function launchStages(c: Campaign): { stage: Stage; doneAt: number | null; dueAt: number }[] {
  const l = c.launch;
  if (!l) return [];
  const at: Record<StageKey, number | null> = {
    /* On the team route the brand's part is done when they hand it over, but the store isn't connected until the team
       has done it, which is when the team sets the code (advanceLaunch). Saying "Done" at the handover was false. */
    store: c.connectedStore ? l.paidAt : l.legacyAt ? l.coupon?.at ?? null : null,
    discount: l.coupon?.at ?? null,
    /* Only a pass counts (C13). A check handed to the team stays open until the team passes it by hand. */
    check: l.checkPassedAt,
    brief: l.briefApprovedAt,
    matching: l.matchedAt,
    launched: l.launchedAt,
    phase: l.phaseStartedAt,
    sale: l.firstSaleAt,
  };
  /* The phase starts six days after the actual launch, and the first sale is due a week after the actual start. */
  const launchDue = plusDays(l.paidAt, LAUNCH_BY_DAYS);
  const phaseDue = plusDays(l.launchedAt ?? launchDue, PHASE_START_DAYS);
  const saleDue = plusDays(l.phaseStartedAt ?? phaseDue, FIRST_SALE_DAYS);
  const due = (s: Stage) => (s.key === "launched" ? launchDue : s.key === "phase" ? phaseDue : s.key === "sale" ? saleDue : plusDays(l.paidAt, s.dueDays));
  return STAGES.map((stage) => ({ stage, doneAt: at[stage.key], dueAt: due(stage) }));
}

/** The brand's next step after paying, or null once the brief is approved (their part is done). */
export function nextBrandStep(c: Campaign | null | undefined): "store" | "discount" | "check" | "brief" | null {
  const l = c?.launch;
  if (!c || !l) return null;
  if (!c.connectedStore && !l.legacyAt) return "store";
  if (!l.legacyAt && !l.coupon) return "discount";
  if (!l.legacyAt && !l.checkPassedAt && !l.checkToTeamAt) return "check";
  if (!l.briefApprovedAt) return "brief";
  return null;
}

export type StorePlatform = "salla" | "zid" | "shopify" | "magento";

/** A brand's read on one creator. `passed` carries its reasons, because
    a pass with no reason teaches the matcher nothing. */
export interface CreatorSignal {
  status: "waiting" | "liked" | "passed";
  reasons?: string[];
  note?: string;
}

/** Why a brand passed. The matcher reads these, so they are a fixed
    vocabulary rather than free text — free text would make every pass
    unique and therefore unlearnable. */
export const PASS_REASONS: { id: string; label: string }[] = [
  { id: "audience", label: "Wrong audience for us" },
  { id: "style", label: "Not our style" },
  { id: "competing", label: "Too close to a competitor" },
  { id: "reach", label: "Not enough reach" },
];
export const passReasonLabel = (id: string) => PASS_REASONS.find((r) => r.id === id)?.label ?? id;
export const NOTE_MAX = 280;

export interface State {
  panel: { view: PanelView; open: boolean };
  /* The dashboard's own view, kept apart from the panel's. They used
     to be one field with two owners, which meant moving around one
     surface silently rearranged the other — and armed a panel on it. */
  dashboardView: PanelView;
  /* Which read layer the panel should scroll to and open. Set when a
     brand taps a finding in the conversation; cleared once the panel
     has honoured it. */
  readFocus: string | null;
  /* How deep the Campaign view is: the list of campaigns, one campaign
     with its phases, or one phase. Held in the store rather than in the
     view so the sidebar and the assistant can move it too. */
  drill: { level: "list" | "campaign" | "phase"; phaseId: string | null };
  campaigns: Record<string, Campaign>;
  /** Newest last, so the rail reads in the order they were built. */
  campaignOrder: string[];
  activeCampaignId: string | null;
  reads: Record<string, BrandRead>;
  plans: Record<string, Plan>;
  activePlanId: string | null;
  /** One thread per campaign, keyed by the campaign's threadId. */
  threads: Record<string, ThreadItem[]>;
  activeThreadId: string;
  funding: Record<string, FundingRequest>;
  approvals: Record<string, ApprovalRequest>;
  ads: Record<string, AdState>;
  /** Ad id → the reason a decline carried, sent to the creator verbatim. */
  declineNotes: Record<string, string>;
  activity: ActivityEntry[];
  autonomy: AutonomyRule[];
  locale: "en" | "ar";
  dismissedInbox: string[];
  /* What the brand thinks of each matched creator. A like or a pass is
     a SIGNAL — it shapes who MoonMatch AI brings next — and never a
     hire or a rejection, so nothing here books or cancels anyone. */
  creatorSignals: Record<number, CreatorSignal>;
  /* Who is paying. Null until the brand verifies an email, which is
     asked for at the payment gate and nowhere earlier: everything up
     to that point — the read, the plan, the two numbers — is free and
     needs no account, and asking for one sooner would put a form in
     front of the thing that sells the product. Not a campaign field:
     one account can build several. */
  account: Account | null;
  /* The brand accounts HeyMoon knows, by store host: who owns each, who they invited, who asked to join. In the
     product this is the server, so it is saved under its own key and Sign out (which clears this browser's work)
     does not un-own a brand. Delete everything clears it too. */
  brands: Record<string, BrandAccount>;
  /* What the person building the campaign does, asked once in the conversation (BuyerRole). Null until asked. */
  role: BuyerRole | null;
  /* Plans emailed before paying, by plan id: who it went to and when. The email's link brings them back to it
     (brand flows, P1). */
  sent: Record<string, { to: string; at: number }>;
  /* Drafts made for a campaign after the demo's fixtures: the first drafts of a launch (brand flows, P2 step 7). */
  extraAds: AdRecord[];
  /* What a member recommends on a draft they can't approve themselves, by ad id. */
  adRecs: Record<string, { by: string; call: "approve" | "recut"; at: number }>;
  /* The owner or an admin seeing the dashboard as another role would, to check what a teammate can do. Not saved. */
  previewRole: TeamRole | null;
  /* What the brand tells HeyMoon about itself, as opposed to what
     HeyMoon read off the shop. The read is evidence and cannot be
     typed over; this is the paperwork a campaign needs to be invoiced,
     and it is empty until somebody fills it in. */
  profile: Profile;
}

export interface Profile {
  industry: string;
  country: string;
  /** Billing. All optional, all blank to start: nothing here is
      invented on a brand's behalf. */
  vat: string;
  tradeLicence: string;
  street: string;
  city: string;
  /** One switch, because there is one channel: the work email that
      signed in. Off means HeyMoon only speaks inside the product. */
  notifications: boolean;
}

/** A name and a verified WORK email (brand team, 15 Oct: "any work email will do, as long as it's work email").
    Any company domain is accepted, not only the store's own (Sephora's team signs in from @chalhoub.com); personal
    providers are refused (SignInSheet, PERSONAL). There is no password: the code sent to the address is the proof.
    Whoever pays for Phase 1 owns the brand account and invites the rest of the team. Phone sign-in is parked: the
    team is still deciding whether it becomes the exemption route for owners who only have Gmail (Salla and Zid). */
export interface Account {
  firstName: string;
  lastName: string;
  /** Lower-cased, as verified. */
  email: string;
  /** Kept only for accounts saved before work email (they signed in by phone). */
  dialCode?: string;
  phone?: string;
  /** When the code was accepted. Set by the caller, never by the store,
      so nothing here is non-deterministic. */
  verifiedAt: number;
}

/** "Mostafa Elnagar". */
export const accountName = (a: Account) => `${a.firstName} ${a.lastName}`.trim();
/** "sara@brand.com", or the phone of an account saved before work email. */
export const accountContact = (a: Account) => a.email || (a.phone ? `${a.dialCode ?? ""} ${a.phone}`.trim() : "");

/* Who pays (brand team, 15 Oct). The person who pays for a store's first phase owns its brand account, and nobody
   else can claim it by signing in with the same company's email: the owner invites people, and anyone else can only
   ask. Close to how a workspace works in Claude or Slack. */
export interface BrandMember {
  email: string;
  firstName?: string;
  lastName?: string;
  invitedAt: number;
  /** Set when they first sign in with the invited address. */
  joinedAt?: number;
  /** What they may do (TeamRole). Absent on people invited before roles existed: they are members. */
  role?: "admin" | "member";
}
export interface AccessRequest {
  firstName: string;
  lastName: string;
  email: string;
  at: number;
}
export interface BrandAccount {
  host: string;
  brandName: string;
  owner: { firstName: string; lastName: string; email: string; since: number };
  members: BrandMember[];
  requests: AccessRequest[];
}
export type BrandAccess = "unclaimed" | "owner" | "member" | "invited" | "outsider";

/* Who may do what on a brand (Mostafa, 19 Oct). Three roles, cut along the actions that matter in this product:
   moving money, publishing, and what the creators are told. The owner and admins do all of it; an admin can also
   pay and start phases. A member sees everything and suggests, so an agency or a junior can work in it without
   being able to publish or spend. Only the owner can hand the brand to someone else. */
export type TeamRole = "owner" | "admin" | "member";
export type TeamAction = "pay" | "approve" | "brief" | "team" | "transfer";
export const CAN: Record<TeamAction, TeamRole[]> = {
  pay: ["owner", "admin"],
  approve: ["owner", "admin"],
  brief: ["owner", "admin"],
  team: ["owner", "admin"],
  transfer: ["owner"],
};
export const ROLE_LABEL: Record<TeamRole, string> = { owner: "Owner", admin: "Admin", member: "Member" };
export const ROLE_NOTE: Record<TeamRole, string> = {
  owner: "Everything, and can hand the brand to someone else",
  admin: "Pays and starts phases, approves drafts, changes the brief, manages the team",
  member: "Sees everything and suggests. Can't pay, publish or change the brief",
};

/* Who HeyMoon is talking to (brand team, 15 Oct). Every one of them hears about the guarantee first, because no one
   else guarantees an influencer campaign; e-commerce managers and owners buy on sales and decide fastest, so for them
   the conversation stays on sales, and marketing and social media managers also get the creators and the brief. */
export type BuyerRole = "ecommerce" | "marketing" | "social" | "owner";
export const ROLES: { key: BuyerRole; label: string }[] = [
  { key: "ecommerce", label: "E-commerce manager" },
  { key: "marketing", label: "Marketing manager" },
  { key: "social", label: "Social media manager" },
  { key: "owner", label: "I own the brand" },
];
export const salesFirst = (r: BuyerRole | null) => r === "ecommerce" || r === "owner";

/** The thread a conversation starts on before it has a campaign. */
export const FIRST_THREAD = "t-1";

const LOCALE_KEY = "mtab_locale";
const AUTONOMY_KEY = "mtab_autonomy";

/* The work survives a reload.
 *
 * Everything below used to live in this module and nowhere else, so a
 * refresh, a deep link or a second tab started at "No campaign yet"
 * with a paid phase already behind it. That was survivable while every
 * outstanding step sat in the thread you were already looking at. It
 * stopped being survivable when the store connection moved to the
 * dashboard: the brand navigates there, the navigation clears the
 * campaign, and the step they went looking for is not on the page.
 *
 * Only the work is kept. Which panel is open, which dashboard view,
 * what the page was scrolled to — none of that is worth restoring, and
 * restoring it puts a brand back inside a drill-down they had left.
 *
 * The version suffix is a kill switch: change the shape of anything
 * below and old saved state is dropped rather than half-read. */
/* v3, 18 Oct: the phase multiples became a fixed 1x, 2x, 3x. v4, the same day: the budgets became a fixed $1,000,
   $2,000, $3,000. A plan saved under either carries a ladder that no longer exists ($3,000 / $6,000, 3.7x, 6.3x)
   and would keep showing it, so it is dropped rather than read. */
/* v5, 20 Oct: a paid campaign starts on the launch checklist rather than on the demo's running ladder, so the
   running account a login used to open is dropped and the login opens the cold start instead (19 Oct review). */
/* v6, 20 Oct: the launch follows the v0.2 PRD (store, discount, check and brief in the chat, then Moontech's), so a
   campaign saved with the earlier checklist is dropped rather than half-read. */
const STATE_KEY = "mtab_state_v6";
const KEPT = [
  "campaigns", "campaignOrder", "activeCampaignId",
  "reads", "plans", "activePlanId",
  "threads", "activeThreadId",
  "funding", "approvals",
  "ads", "declineNotes", "creatorSignals", "dismissedInbox",
  "activity", "account", "profile", "role", "sent", "extraAds", "adRecs",
] as const;
/* The brand accounts, apart from the work: see State.brands. */
const BRANDS_KEY = "mtab_brands_v1";
type Kept = (typeof KEPT)[number];

function initial(): State {
  return {
    panel: { view: "plan", open: false },
    /* No seeded campaigns. The first one is the one the brand builds,
       and until then the dashboard says so rather than showing someone
       else's numbers. */
    campaigns: {},
    campaignOrder: [],
    activeCampaignId: null,
    reads: {},
    plans: {},
    activePlanId: null,
    threads: { [FIRST_THREAD]: [] },
    activeThreadId: FIRST_THREAD,
    funding: {},
    approvals: {},
    ads: Object.fromEntries(ADS.map((a) => [a.id, a.state])),
    declineNotes: {},
    /* Empty until something has run. The seeded log belongs to the running demo, which brings it (putCampaign). */
    activity: [],
    autonomy: DEFAULT_AUTONOMY,
    locale: "en",
    dismissedInbox: [],
    /* Nobody is pre-judged. Every matched creator starts waiting. */
    creatorSignals: {},
    dashboardView: "home",
    readFocus: null,
    drill: { level: "list", phaseId: null },
    account: null,
    brands: {},
    role: null,
    sent: {},
    extraAds: [],
    adRecs: {},
    previewRole: null,
    profile: { industry: "", country: "", vat: "", tradeLicence: "", street: "", city: "", notifications: true },
  };
}

let state: State = initial();
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/* Written on a timer rather than on every set: a read streams nine
   layers in and a plan streams its fields, so an unthrottled save would
   serialise the whole store dozens of times during one build. */
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
      localStorage.setItem(BRANDS_KEY, JSON.stringify(state.brands));
    } catch {
      /* A full quota, or a private window that refuses. Losing the
         restore is not worth losing the session over. */
    }
  }, 250);
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Pick<State, Kept>>;
      const patch: Partial<State> = {};
      for (const k of KEPT) if (saved[k] !== undefined) (patch as Record<string, unknown>)[k] = saved[k];
      state = { ...state, ...patch };
      /* A plan holds a read id, not a read, so the registry has to know
         the restored reads or every plan comes back without evidence. */
      for (const r of Object.values(state.reads)) rememberRead(r);
    }
  } catch {}
  try {
    const b = localStorage.getItem(BRANDS_KEY);
    if (b) state = { ...state, brands: JSON.parse(b) };
  } catch {}
  try {
    const l = localStorage.getItem(LOCALE_KEY);
    if (l === "ar" || l === "en") state = { ...state, locale: l };
    const a = localStorage.getItem(AUTONOMY_KEY);
    if (a) {
      const saved: Record<string, AutonomyLevel> = JSON.parse(a);
      state = {
        ...state,
        autonomy: state.autonomy.map((r) => (r.locked ? r : { ...r, level: saved[r.key] ?? r.level })),
      };
    }
  } catch {}
}

function subscribe(l: () => void) {
  hydrate();
  listeners.add(l);
  return () => { listeners.delete(l); };
}
const snap = () => state;
const serverSnap = () => SERVER_STATE;
const SERVER_STATE: State = initial();

function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
  save();
}

/** Forget the account and everything built under it. Signing out of a
    prototype that then shows you the last brand's campaign is not a
    sign-out. Who owns which brand is the server's record, not this
    browser's, so it survives a sign-out; `everything` (Settings, Delete
    everything) clears that too. */
export const resetAll = (opts?: { everything?: boolean }) => {
  try {
    localStorage.removeItem(STATE_KEY);
    if (opts?.everything) localStorage.removeItem(BRANDS_KEY);
  } catch {}
  const fresh = initial();
  state = { ...fresh, locale: state.locale, autonomy: state.autonomy, brands: opts?.everything ? {} : state.brands };
  emit();
};

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => pick(snap()), () => pick(serverSnap()));
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

let seq = 0;
export const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

export const putRead = (r: BrandRead) => {
  rememberRead(r);
  set((s) => ({ reads: { ...s.reads, [r.id]: r } }));
};

export const correctRead = (readId: string, c: Correction, apply: (r: BrandRead) => BrandRead) =>
  set((s) => {
    const r = s.reads[readId];
    if (!r) return {};
    const next = { ...apply(r), corrections: [...r.corrections, c] };
    rememberRead(next);
    return { reads: { ...s.reads, [readId]: next } };
  });

export const putPlan = (p: Plan, makeActive = true) =>
  set((s) => ({ plans: { ...s.plans, [p.id]: p }, activePlanId: makeActive ? p.id : s.activePlanId }));

export const setActivePlan = (id: string | null) => set({ activePlanId: id });

/* Omit across a union has to distribute, or every member collapses to
   the fields they share and a `text` becomes an unknown property. */
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewThreadItem = DistOmit<ThreadItem, "id" | "at"> & { id?: string };

/** The items of whichever conversation is open. */
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
  set((s) => ({
    threads: { ...s.threads, [s.activeThreadId]: activeThread(s).filter((t) => t.id !== id) },
  }));

export const resetThread = () =>
  set((s) => { claimed.clear(); return { threads: { ...s.threads, [s.activeThreadId]: [] } }; });

/* ------------------------------------------------------------------ */
/* Run once, and mean it                                               */
/*                                                                     */
/* React invokes an effect twice in development, and the second pass   */
/* re-reads state from the first pass's closure — so a `status !==      */
/* "idle"` check does not stop a second run, and both runs then report  */
/* their result. That is how one read produced two identical answers.   */
/*                                                                      */
/* A module-level claim is outside React's lifecycle entirely, so it    */
/* holds however many times the component mounts. Cleared when the      */
/* conversation is reset, so starting over genuinely starts over.       */
/* ------------------------------------------------------------------ */
const claimed = new Set<string>();

/** True the first time it is called with a given key, false after. */
export function claimOnce(key: string): boolean {
  if (claimed.has(key)) return false;
  claimed.add(key);
  return true;
}

/** Whether the thread is still empty, read live rather than from a
    captured render value — a mount effect that checks the rendered
    `thread` runs twice in development and opens the conversation twice. */
export const threadIsEmpty = () => activeThread(state).length === 0;

/** The active plan, read live for the same reason as `threadIsEmpty`: a
    mount effect that trusts the rendered value can see the server
    snapshot (no plan) and start a build over a plan that already exists,
    wiping every edit the brand has made to it. */
export const activePlanLive = (): Plan | null =>
  state.activePlanId ? state.plans[state.activePlanId] ?? null : null;

/* A request id is derived from the plan and the phase, so pressing Start
   a second time produces the SAME id. Letting a fresh "pending" request
   land on top of a confirmed one would un-pay the phase — the crew would
   re-hide and the Start button would come back. A payment that has been
   made stays made. */
export const putFunding = (r: FundingRequest) =>
  set((s) => (s.funding[r.id]?.state === "confirmed" ? {} : { funding: { ...s.funding, [r.id]: r } }));

/** The only place a payment is recorded, and it is only ever reachable
    from an explicit click on the confirmation block. */
/** Paid, with the billing details the brand entered on the card: they set the VAT and the total (billing.ts). */
export const confirmFunding = (id: string, billing?: Billing) =>
  set((s) => {
    const r = s.funding[id];
    if (!r || r.state !== "pending") return {};
    const paid = billing ? withBilling(r, billing) : r;
    return { funding: { ...s.funding, [id]: { ...paid, state: "confirmed" } } };
  });

export const cancelFunding = (id: string) =>
  set((s) => {
    const r = s.funding[id];
    if (!r || r.state !== "pending") return {};
    return { funding: { ...s.funding, [id]: { ...r, state: "cancelled" } } };
  });

export const putApproval = (r: ApprovalRequest) =>
  set((s) => ({ approvals: { ...s.approvals, [r.id]: r } }));

export const setApprovalState = (id: string, st: ApprovalRequest["state"]) =>
  set((s) => (s.approvals[id] ? { approvals: { ...s.approvals, [id]: { ...s.approvals[id], state: st } } } : {}));

/** The only place an ad changes state. Approving is what publishes, and
    it is always a brand action — no tool can reach this. */
export const setAdState = (adId: string, st: AdState, note?: string) =>
  set((s) => ({
    ads: { ...s.ads, [adId]: st },
    declineNotes:
      st === "declined" && note
        ? { ...s.declineNotes, [adId]: note }
        : Object.fromEntries(Object.entries(s.declineNotes).filter(([k]) => k !== adId)),
  }));

export const setAutonomy = (key: string, level: AutonomyLevel) =>
  set((s) => {
    const autonomy = s.autonomy.map((r) => (r.key === key && !r.locked ? { ...r, level } : r));
    try {
      localStorage.setItem(
        AUTONOMY_KEY,
        JSON.stringify(Object.fromEntries(autonomy.filter((r) => !r.locked).map((r) => [r.key, r.level])))
      );
    } catch {}
    return { autonomy };
  });

export const undoActivity = (id: string) =>
  set((s) => ({ activity: s.activity.map((a) => (a.id === id && a.undoable ? { ...a, undone: true } : a)) }));

export const redoActivity = (id: string) =>
  set((s) => ({ activity: s.activity.map((a) => (a.id === id ? { ...a, undone: false } : a)) }));

/** Something done in the phase at the brand's press (a budget move from the campaign's moves), logged beside what
    the agents did on their own so the activity log is the one record, with the same undo. */
export const logActivity = (e: ActivityEntry) => set((s) => ({ activity: [e, ...s.activity] }));

/** A ready phase, paid for from its page. It waits for the live one to close rather than running beside it. */
export const queuePhase = (phaseId: string) =>
  set((s) => {
    const id = s.activeCampaignId;
    const c = id ? s.campaigns[id] : null;
    if (!id || !c) return {};
    const phases = c.phases.map((p) => (p.id === phaseId && p.status === "ready" ? { ...p, status: "queued" as const } : p));
    return { campaigns: { ...s.campaigns, [id]: { ...c, phases } } };
  });

/** For code outside React (lib/demo.ts): whether this browser has built anything, and who is signed in. */
export const hasCampaigns = () => { hydrate(); return state.campaignOrder.length > 0; };
export const currentAccount = () => { hydrate(); return state.account; };

export const setLocale = (l: "en" | "ar") => {
  try { localStorage.setItem(LOCALE_KEY, l); } catch {}
  set({ locale: l });
};

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

/** Start a new conversation. It has no campaign yet — the campaign is
    minted when the plan is built — but it has a thread of its own, so
    building a second one never writes into the first one's transcript. */
export const startConversation = (): string => {
  const id = nextId("t");
  claimed.clear();
  set((s) => ({
    threads: { ...s.threads, [id]: [] },
    activeThreadId: id,
    /* A new conversation is not about the campaign you were looking
       at, so nothing from it should be on screen. */
    activePlanId: null,
    activeCampaignId: null,
    panel: { view: "plan", open: false },
  }));
  return id;
};

export const openConversation = (threadId: string) =>
  set((s) => {
    claimed.clear();
    const c = Object.values(s.campaigns).find((x) => x.threadId === threadId) ?? null;
    return {
      activeThreadId: threadId,
      activeCampaignId: c?.id ?? null,
      activePlanId: c?.planId ?? s.activePlanId,
      panel: { view: "plan", open: false },
    };
  });

/** Mint the campaign this conversation is building, or update it. The
    plan is the thing that makes a campaign real — before there is one
    there is only a read and a conversation about it. */
export const putCampaign = (plan: Plan, url?: string, opts?: { running?: boolean }) =>
  set((s) => {
    const existing = Object.values(s.campaigns).find((c) => c.threadId === s.activeThreadId);
    if (existing) {
      const next = { ...existing, planId: plan.id, readId: plan.readId, brandName: plan.brandName };
      return { campaigns: { ...s.campaigns, [existing.id]: next }, activeCampaignId: existing.id };
    }
    const id = nextId("camp");
    /* Every campaign starts where a real one starts: Phase 1 about to run, nothing attributed, no drafts in yet. Only
       the running demo (lib/demo.ts, ?demo=running) adopts the fixture ladder, its ads and its activity log. The
       first campaign used to adopt them too, which is how a brand who had just paid landed on Phase 2 of a campaign
       they had never run (19 Oct review). */
    const first = !!opts?.running;
    const camp: Campaign = {
      id,
      threadId: s.activeThreadId,
      brandName: plan.brandName,
      url: url ?? plan.brandName,
      readId: plan.readId,
      planId: plan.id,
      phases: first ? PHASES : freshLadder(id, plan),
      adIds: first ? ADS.map((a) => a.id) : [],
      createdAt: Date.now(),
      paid: false,
      connectedStore: null,
    };
    return {
      campaigns: { ...s.campaigns, [id]: camp },
      campaignOrder: [...s.campaignOrder, id],
      activeCampaignId: id,
      ...(first ? { activity: SEED_ACTIVITY } : {}),
    };
  });

/** A campaign's own three rungs, taken from its plan's ladder. Nothing
    has run yet, so every figure that measures running is zero. */
function freshLadder(campId: string, plan: Plan): Phase[] {
  return plan.ladder.value.map((r, i) => ({
    id: `${campId}-p${r.phaseNo}`,
    phaseNo: r.phaseNo,
    status: i === 0 ? ("ready" as const) : ("locked" as const),
    start: null,
    end: null,
    budget: r.budget,
    guaranteedRoas: r.multiple,
    rev: 0,
    revTarget: i === 0 ? Math.round(r.budget * r.multiple) : null,
    dayOfPhase: null,
    plannedDays: 30,
    creators: i === 0 ? plan.creators.value.length : null,
  }));
}


/** Phase 1 is paid for. A fresh campaign does not start running here: the brand's four steps and Moontech's launch
    follow (Launch). The running demo's ladder is already in flight. */
export const markPaid = (at: number = Date.now()) =>
  set((s) => {
    const id = s.activeCampaignId;
    const c = id ? s.campaigns[id] : null;
    if (!id || !c) return {};
    const fresh = c.phases[0]?.status === "ready";
    const launch: Launch | undefined = fresh
      ? {
          paidAt: at, legacyAt: null, coupon: null, checkAttempts: 0, checkPassedAt: null, checkToTeamAt: null,
          briefApprovedAt: null, briefFiles: [], matchedAt: null, launchedAt: null, phaseStartedAt: null, firstSaleAt: null,
        }
      : c.launch;
    return { campaigns: { ...s.campaigns, [id]: { ...c, paid: true, ...(launch ? { launch } : {}) } } };
  });

/** One launch fact recorded (or several). */
export const patchLaunch = (campaignId: string, patch: Partial<Launch>) =>
  set((s) => {
    const c = s.campaigns[campaignId];
    if (!c?.launch) return {};
    return patchCampaignIn(s, campaignId, { launch: { ...c.launch, ...patch } });
  });

/** The store check ran (6c). A pass is recorded; a second failure hands it to the Moontech team. */
export const recordCheck = (campaignId: string, passed: boolean, at: number) =>
  set((s) => {
    const c = s.campaigns[campaignId];
    if (!c?.launch) return {};
    const attempts = c.launch.checkAttempts + 1;
    return patchCampaignIn(s, campaignId, {
      launch: {
        ...c.launch, checkAttempts: attempts,
        checkPassedAt: passed ? at : c.launch.checkPassedAt,
        checkToTeamAt: !passed && attempts >= 2 ? at : c.launch.checkToTeamAt,
      },
    });
  });

/** Moontech's next stage. First anything the team owes on the launch conditions (C13): on the team route it sets the
    code and passes the store check with the brand; after two failed checks it passes the check by hand. Then 7 and 8:
    the list is ready, launchCampaign makes the campaign active and sends wave 1 (day 0), and Phase 1 starts (day 6).
    In the product these are NASA and launchCampaign, which refuses while any condition is missing; the prototype steps
    them by hand. */
export const advanceLaunch = (campaignId: string, at: number) =>
  set((s) => {
    const c = s.campaigns[campaignId];
    const l = c?.launch;
    if (!c || !l || !l.briefApprovedAt || (!c.connectedStore && !l.legacyAt)) return {};
    if (!l.coupon) {
      const coupon: CouponRules = { discount: 15, limits: { minOrder: true, onePerCustomer: true, endsWithPhase: true }, minOrder: 200, bestOfferBy: "the Moontech team, with the brand", at };
      return patchCampaignIn(s, campaignId, { launch: { ...l, coupon } });
    }
    if (!l.checkPassedAt) return patchCampaignIn(s, campaignId, { launch: { ...l, checkPassedAt: at } });
    if (!l.matchedAt) return patchCampaignIn(s, campaignId, { launch: { ...l, matchedAt: at } });
    if (!l.launchedAt) return patchCampaignIn(s, campaignId, { launch: { ...l, launchedAt: at } });
    if (!l.phaseStartedAt) {
      const today = new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const phases = c.phases.map((p, i) => (i === 0 ? { ...p, status: "live" as const, dayOfPhase: 1, start: today } : p));
      return patchCampaignIn(s, campaignId, { phases, launch: { ...l, phaseStartedAt: at } });
    }
    return {};
  });

/** The first redemption (9). The dashboard switches from the tracker to results. */
export const recordFirstSale = (campaignId: string, amount: number, at: number) =>
  set((s) => {
    const c = s.campaigns[campaignId];
    const l = c?.launch;
    if (!c || !l?.phaseStartedAt || l.firstSaleAt) return {};
    const phases = c.phases.map((p, i) => (i === 0 ? { ...p, rev: p.rev + amount } : p));
    return patchCampaignIn(s, campaignId, { phases, launch: { ...l, firstSaleAt: at } });
  });

/** A plan emailed before paying (brand flows, P0 "leaves" and P1 "someone else decides"). */
export const markSent = (planId: string, to: string, at: number) =>
  set((s) => ({ sent: { ...s.sent, [planId]: { to, at } } }));

/** The brand verified a number. Called once the code has been
    accepted, with the caller's clock: the store stays deterministic. */
export const signIn = (a: Omit<Account, "verifiedAt">, verifiedAt: number) =>
  set(() => ({ account: { ...a, verifiedAt } }));

/* ---- Brand accounts ---- */

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Where this address stands on this store's brand account. */
export function accessFor(host: string, email: string, brands: Record<string, BrandAccount> = state.brands): BrandAccess {
  const b = brands[host];
  if (!b) return "unclaimed";
  if (sameEmail(b.owner.email, email)) return "owner";
  const m = b.members.find((x) => sameEmail(x.email, email));
  if (m) return m.joinedAt ? "member" : "invited";
  return "outsider";
}

const patchBrand = (host: string, fn: (b: BrandAccount) => BrandAccount) =>
  set((s) => (s.brands[host] ? { brands: { ...s.brands, [host]: fn(s.brands[host]) } } : {}));

/** The first payment for a store makes the payer its owner. A later payment by a member changes nothing. */
export const claimBrand = (host: string, brandName: string, a: Account, at: number) =>
  set((s) =>
    s.brands[host]
      ? {}
      : {
          brands: {
            ...s.brands,
            [host]: {
              host, brandName,
              owner: { firstName: a.firstName, lastName: a.lastName, email: a.email, since: at },
              members: [], requests: [],
            },
          },
        }
  );

export const inviteMember = (host: string, email: string, at: number, role: "admin" | "member" = "member") =>
  patchBrand(host, (b) =>
    b.members.some((m) => sameEmail(m.email, email))
      ? b
      : { ...b, members: [...b.members, { email: email.trim().toLowerCase(), invitedAt: at, role }], requests: b.requests.filter((r) => !sameEmail(r.email, email)) }
  );

/** Where this address stands as a role. Before anyone has paid there is no owner, and whoever pays becomes it, so the
    person building the campaign may do everything. Someone not on the team has no role. */
export function teamRoleFor(host: string, email: string, brands: Record<string, BrandAccount> = state.brands): TeamRole | null {
  const b = brands[host];
  if (!b) return "owner";
  if (sameEmail(b.owner.email, email)) return "owner";
  const m = b.members.find((x) => sameEmail(x.email, email));
  return m ? m.role ?? "member" : null;
}

export const setMemberRole = (host: string, email: string, role: "admin" | "member") =>
  patchBrand(host, (b) => ({ ...b, members: b.members.map((m) => (sameEmail(m.email, email) ? { ...m, role } : m)) }));

/** The invite sent again, dated now. */
export const resendInvite = (host: string, email: string, at: number) =>
  patchBrand(host, (b) => ({ ...b, members: b.members.map((m) => (sameEmail(m.email, email) ? { ...m, invitedAt: at } : m)) }));

/** The owner hands the brand to someone already on the team. They stay on it as an admin. */
export const transferOwnership = (host: string, email: string, at: number) =>
  patchBrand(host, (b) => {
    const next = b.members.find((m) => sameEmail(m.email, email) && m.joinedAt);
    if (!next) return b;
    const was = b.owner;
    return {
      ...b,
      owner: { firstName: next.firstName ?? "", lastName: next.lastName ?? "", email: next.email, since: at },
      members: [
        ...b.members.filter((m) => !sameEmail(m.email, email)),
        { email: was.email, firstName: was.firstName, lastName: was.lastName, invitedAt: was.since, joinedAt: was.since, role: "admin" as const },
      ],
    };
  });

export const setPreviewRole = (r: TeamRole | null) => set({ previewRole: r });

/** A member's call on a draft, for whoever approves. */
export const recommendAd = (adId: string, by: string, call: "approve" | "recut", at: number) =>
  set((s) => ({ adRecs: { ...s.adRecs, [adId]: { by, call, at } } }));

/** A member's suggestion for the brief, and the owner or an admin taking it or not. */
export const suggestBrief = (campaignId: string, by: string, text: string, at: number) =>
  set((s) => {
    const c = s.campaigns[campaignId];
    return c ? patchCampaignIn(s, campaignId, { suggestions: [...(c.suggestions ?? []), { by, text, at }] }) : {};
  });
export const dropSuggestion = (campaignId: string, at: number) =>
  set((s) => {
    const c = s.campaigns[campaignId];
    return c ? patchCampaignIn(s, campaignId, { suggestions: (c.suggestions ?? []).filter((x) => x.at !== at) }) : {};
  });

export const removeMember = (host: string, email: string) =>
  patchBrand(host, (b) => ({ ...b, members: b.members.filter((m) => !sameEmail(m.email, email)) }));

/** An invited address signed in for the first time. */
export const joinBrand = (host: string, who: { firstName: string; lastName: string; email: string }, at: number) =>
  patchBrand(host, (b) => ({
    ...b,
    members: b.members.map((m) => (sameEmail(m.email, who.email) ? { ...m, firstName: who.firstName, lastName: who.lastName, joinedAt: m.joinedAt ?? at } : m)),
  }));

/** One request per address; asking twice refreshes it. */
export const requestAccess = (host: string, who: { firstName: string; lastName: string; email: string }, at: number) =>
  patchBrand(host, (b) => ({ ...b, requests: [...b.requests.filter((r) => !sameEmail(r.email, who.email)), { ...who, at }] }));

/** Approving a request lets them straight in: they already proved the address with a code when they asked. */
export const answerRequest = (host: string, email: string, approve: boolean, at: number, role: "admin" | "member" = "member") =>
  patchBrand(host, (b) => {
    const r = b.requests.find((x) => sameEmail(x.email, email));
    const requests = b.requests.filter((x) => !sameEmail(x.email, email));
    if (!approve || !r) return { ...b, requests };
    return { ...b, requests, members: [...b.members, { email: r.email, firstName: r.firstName, lastName: r.lastName, invitedAt: at, joinedAt: at, role }] };
  });

export const useBrandAccount = (host?: string | null) => useStore((s) => (host ? s.brands[host] ?? null : null));

export const setRole = (role: BuyerRole) => set({ role });
export const useRole = () => useStore((s) => s.role);

export const connectStore = (which: StorePlatform, campaignId?: string) =>
  set((s) => {
    const id = campaignId ?? s.activeCampaignId;
    return id && s.campaigns[id] ? patchCampaignIn(s, id, { connectedStore: which }) : {};
  });

/** The first campaign that is paid for and still not connected, whether
    or not it is the one on screen. The dashboard's alert reads this
    rather than the active campaign: pressing Build a campaign clears
    the active one, and an outstanding step is not finished because the
    brand navigated away from it. */
export const useUnconnected = () =>
  useStore((s) => {
    for (const id of s.campaignOrder) {
      const c = s.campaigns[id];
      /* A launching campaign asks for its store on the checklist, as step 1. */
      /* The team route connects the store for the brand, so there is nothing for them to connect. */
      if (c?.paid && !c.connectedStore && !isLaunching(c) && !c.launch?.legacyAt) return c;
    }
    return null;
  });

const patchCampaignIn = (s: State, id: string, patch: Partial<Campaign>) => ({
  campaigns: { ...s.campaigns, [id]: { ...s.campaigns[id], ...patch } },
});

/** Switching campaign carries the conversation with it. The two
    surfaces read the same campaign or they disagree: picking Luna on
    the dashboard and then opening the chat would otherwise land you in
    the thread that built Ounass. */
export const setActiveCampaign = (id: string) =>
  set((s) => {
    const c = s.campaigns[id];
    if (!c) return {};
    claimed.clear();
    return { activeCampaignId: id, activePlanId: c.planId ?? null, activeThreadId: c.threadId };
  });

/* Cached against the two fields it is built from.

   `useSyncExternalStore` compares snapshots by identity, so a selector
   that maps an array returns a new one every time it is called and the
   store loops forever. This project has been bitten by exactly this
   once before, in `adsWithState`, and the fix is the same: derive
   once, hand back the same reference until an input actually changes. */
let campCache: { order: State["campaignOrder"]; map: State["campaigns"]; value: Campaign[] } | null = null;
function campaignList(s: State): Campaign[] {
  if (campCache && campCache.order === s.campaignOrder && campCache.map === s.campaigns) return campCache.value;
  const value = s.campaignOrder.map((id) => s.campaigns[id]).filter(Boolean);
  campCache = { order: s.campaignOrder, map: s.campaigns, value };
  return value;
}
/** Rename a campaign. Two campaigns built from the same store carry
    the same brand name and are otherwise indistinguishable in a list —
    "Ounass" and "Ounass" — so the name has to be the brand's to set.
    An empty name falls back to the brand rather than leaving a blank
    row. */
export const renameCampaign = (id: string, name: string) =>
  set((s) => {
    const c = s.campaigns[id];
    if (!c) return {};
    const trimmed = name.trim().slice(0, 60);
    return { campaigns: { ...s.campaigns, [id]: { ...c, label: trimmed || undefined } } };
  });

/* Campaign names.
 *
 * A campaign used to be called after the brand that owns it, which was
 * fine while a brand had one. The rail lists campaigns now, and a brand
 * running three had three rows all reading "Ounass" — a list that
 * cannot be navigated by the thing it is a list of.
 *
 * So each one gets a name of its own. Two words, an amber-and-falcon
 * sort of name rather than "Campaign 2", because the row has to be
 * recognisable at a glance six months later and an ordinal never is.
 *
 * Picked by hashing the campaign id, not by Math.random: this whole
 * project has no random in it, so that the same demo run twice reads
 * the same both times and a screenshot can be trusted. The second word
 * is offset by a different hash so the two do not move together, and
 * the pair is 24 x 16, which is more campaigns than this prototype will
 * ever hold. Renaming still wins over the generated name, because
 * `label` is checked first. */
const NAME_FIRST = [
  "Amber", "Cobalt", "Crescent", "Dune", "Ember", "Falcon", "Harbour", "Indigo",
  "Lantern", "Meridian", "Mirage", "Monsoon", "Oasis", "Onyx", "Pearl", "Quartz",
  "Saffron", "Sable", "Solstice", "Tide", "Vermilion", "Zephyr", "Cardamom", "Cinder",
];
const NAME_SECOND = [
  "Run", "Push", "Sprint", "Wave", "Arc", "Drift", "Signal", "Current",
  "Circuit", "Relay", "Ascent", "Trace", "Loop", "Spark", "Bloom", "Surge",
];

/** The generated name for a campaign, stable for the life of its id. */
export const generatedName = (id: string) =>
  `${NAME_FIRST[hash(id) % NAME_FIRST.length]} ${NAME_SECOND[hash(`${id}:2`) % NAME_SECOND.length]}`;

/** What to call it: the name the brand typed, or the one it was given. */
export const campaignLabel = (c: Campaign) => c.label ?? generatedName(c.id);

export const useCampaigns = () => useStore(campaignList);

/* ------------------------------------------------------------------ */
/* Creator signals                                                     */
/* ------------------------------------------------------------------ */

const WAITING: CreatorSignal = { status: "waiting" };
export const useCreatorSignals = () => useStore((st) => st.creatorSignals);
export const signalFor = (m: Record<number, CreatorSignal>, id: number) => m[id] ?? WAITING;

export const likeCreator = (id: number) =>
  set((st) => ({ creatorSignals: { ...st.creatorSignals, [id]: { status: "liked" } } }));

export const passCreator = (id: number, reasons: string[], note?: string) =>
  set((st) => ({ creatorSignals: { ...st.creatorSignals, [id]: { status: "passed", reasons, note } } }));

/** Back to undecided, and the reasons go with it — leaving them behind
    would have the matcher still learning from a pass the brand undid. */
export const clearCreatorSignal = (id: number) =>
  set((st) => {
    const next = { ...st.creatorSignals };
    delete next[id];
    return { creatorSignals: next };
  });

export const useDrill = () => useStore((s) => s.drill);
export const showCampaignList = () => set({ drill: { level: "list", phaseId: null } });
export const openCampaign = (id: string) =>
  set((s) => {
    const c = s.campaigns[id];
    if (!c) return {};
    claimed.clear();
    return {
      activeCampaignId: id,
      activePlanId: c.planId ?? null,
      activeThreadId: c.threadId,
      drill: { level: "campaign" as const, phaseId: null },
      dashboardView: "campaign" as PanelView,
    };
  });
export const openPhase = (phaseId: string) => set({ drill: { level: "phase", phaseId } });
export const useActiveCampaign = () => useStore((s) => (s.activeCampaignId ? s.campaigns[s.activeCampaignId] ?? null : null));
export const useActiveThreadId = () => useStore((s) => s.activeThreadId);
export const accountLive = () => state.account;
export const activeCampaignLive = () => (state.activeCampaignId ? state.campaigns[state.activeCampaignId] ?? null : null);

/** This campaign's phases, and the one running. Everything on the
    dashboard reads through these rather than through the module-level
    fixture, which was one ladder for the whole app — correct while
    there was one campaign, wrong the instant there were two. */
const NO_PHASES: Phase[] = [];
export const useCampaignPhases = () =>
  useStore((s) => (s.activeCampaignId ? s.campaigns[s.activeCampaignId]?.phases ?? NO_PHASES : NO_PHASES));
export const useLivePhase = () =>
  useStore((s) => {
    const c = s.activeCampaignId ? s.campaigns[s.activeCampaignId] : null;
    return c?.phases.find((p) => p.status === "live") ?? null;
  });
export const useReadyPhase = () =>
  useStore((s) => {
    const c = s.activeCampaignId ? s.campaigns[s.activeCampaignId] : null;
    return c?.phases.find((p) => p.status === "ready") ?? null;
  });

export const dismissInbox = (id: string) =>
  set((s) => ({ dismissedInbox: [...s.dismissedInbox, id] }));

/* ------------------------------------------------------------------ */
/* Derived                                                             */
/* ------------------------------------------------------------------ */

/* A `useSyncExternalStore` snapshot has to be referentially stable, or
   React re-renders forever. This derivation builds a new array, so it is
   cached against the identity of the slice it depends on — the cache
   invalidates exactly when a decision changes and never otherwise. */
let adsCache: { key: State["ads"]; value: AdRecord[] } | null = null;
let extraCache: State["extraAds"] | null = null;
export function adsWithState(s: State): AdRecord[] {
  if (adsCache && adsCache.key === s.ads && extraCache === s.extraAds) return adsCache.value;
  const value = [...ADS, ...s.extraAds].map((a) => ({ ...a, state: s.ads[a.id] ?? a.state }));
  adsCache = { key: s.ads, value };
  extraCache = s.extraAds;
  return value;
}

export const useAds = () => useStore(adsWithState);

/* ------------------------------------------------------------------ */
/* Panel actions                                                       */
/* ------------------------------------------------------------------ */

export const usePanel = () => useStore((s) => s.panel);

export const openPanel = (view: PanelView) => set({ panel: { view, open: true } });
export const closePanel = () => set((s) => ({ panel: { ...s.panel, open: false } }));
export const setPanelView = (view: PanelView) => set((s) => ({ panel: { view, open: s.panel.open } }));

/* The dashboard's view. Separate setter, separate field: nothing here
   can open, close or repoint the conversation's panel. */
export const useDashboardView = () => useStore((s) => s.dashboardView);
export const setDashboardView = (view: PanelView) => set({ dashboardView: view });

/* Open the read panel on one layer. Tapping a finding in the thread is
   the fastest correction path there is: the brand is already looking
   at the thing that is wrong. */
/** Is there a live payment request for this plan's Phase 1 — one the
    brand is looking at right now, or has already confirmed? The ladder
    uses it to stand its own "Start Phase 1" button down: two buttons
    for the same payment, one of them above the card that is asking for
    it, is one button too many. */
export const usePhaseRequested = (planId: string | undefined, phaseNo: number) =>
  useStore((s) =>
    !!planId &&
    Object.values(s.funding).some(
      (f) => f.planId === planId && f.phaseNo === phaseNo && f.state !== "cancelled"
    )
  );

export const useReadFocus = () => useStore((s) => s.readFocus);
export const focusReadLayer = (k: string) => set({ panel: { view: "read", open: true }, readFocus: k });
export const clearReadFocus = () => set({ readFocus: null });

/** Has THIS campaign's Phase 1 been paid for? Everything held back
    before payment — creator identities, the integration step — keys
    off it, and it is per campaign: a second one is not paid for
    because the first was. */
export const usePaid = () =>
  useStore((s) => (s.activeCampaignId ? s.campaigns[s.activeCampaignId]?.paid ?? false : false));
export const useActivePlan = () => useStore((s) => (s.activePlanId ? s.plans[s.activePlanId] ?? null : null));
export const useAccount = () => useStore((s) => s.account);
export const useProfile = () => useStore((s) => s.profile);
export const setProfile = (patch: Partial<Profile>) =>
  set((s) => ({ profile: { ...s.profile, ...patch } }));

/** The signed-in person's own details, edited from settings. Null-safe:
    there is nothing to change before anyone has signed in. */
export const setAccountDetails = (patch: Partial<Omit<Account, "verifiedAt">>) =>
  set((s) => (s.account ? { account: { ...s.account, ...patch } } : {}));
export const useLocale = () => useStore((s) => s.locale);
export const useAutonomy = () => useStore((s) => s.autonomy);
export const useActivity = () => useStore((s) => s.activity);

/* ---- Roles ---- */

/** This person's role on the brand on screen, and the one the dashboard acts as: the same, unless the owner or an
    admin is previewing another. `host` defaults to the active campaign's store. */
export const useTeamRole = (host?: string | null) => {
  const h = useStore((s) => host ?? (s.activeCampaignId ? s.campaigns[s.activeCampaignId]?.url ?? null : null));
  /* Not signed in yet, nobody can have taken the brand from them in this browser: the payment gate checks again. */
  const real = useStore((s): TeamRole | null => (h && s.account ? teamRoleFor(h, s.account.email, s.brands) : h ? "owner" : null));
  const preview = useStore((s) => s.previewRole);
  const owner = useStore((s) => (h ? s.brands[h]?.owner ?? null : null));
  const canPreview = real === "owner" || real === "admin";
  return { real, role: canPreview && preview ? preview : real, owner };
};

export const useCan = (action: TeamAction, host?: string | null) => {
  const { role } = useTeamRole(host);
  return !!role && CAN[action].includes(role);
};

export const useAdRecs = () => useStore((s) => s.adRecs);
export const usePreviewRole = () => useStore((s) => s.previewRole);
