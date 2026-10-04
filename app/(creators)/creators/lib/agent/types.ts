/* ══════════════════════════════════════════════════════════════════
   THE AGENT BOUNDARY — CREATOR SIDE
   ══════════════════════════════════════════════════════════════════

   The mirror of `types.ts` in the brands app, and deliberately the same
   shape: the screens import types and call `AgentTools`, never the mock
   implementation. Swapping in a real model means providing another
   object that satisfies `AgentTools`.

   Two rules are encoded in the types rather than left to discipline,
   and they are the same two — pointed the other way.

   1. EVERY FIGURE CARRIES ITS SOURCE. A number reaches the UI as a
      `Sourced<number>`. On the brand side that stops the agent
      inventing a sales forecast. Here it stops the agent inventing
      what a creator is worth, which is the number this whole product
      is arguing about.

   2. NOTHING IRREVERSIBLE HAPPENS IN A TOOL. On the brand side that is
      "no tool moves money or publishes". Here it is stronger, because
      the irreversible things belong to a person rather than a company:
      NO TOOL ACCEPTS A BRIEF, SIGNS ANYTHING, OR POSTS TO AN ACCOUNT.
      `request_accept` returns a REQUEST. Only a creator's own click,
      through the store, can turn one into an agreement.
   ══════════════════════════════════════════════════════════════════ */

import { byStrength, type Match } from "./model";

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

export type EvidenceKind =
  | "post"        // something read off the creator's own grid
  | "profile"     // the public profile itself
  | "insights"    // the creator's connected platform insights
  | "brand"       // the brand that is offering the work
  | "platform"    // HeyMoon's own records
  | "benchmark"   // other creators, anonymised
  | "contract"    // the terms of a brief
  | "policy";     // a rule of the product

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  /** What it is, short enough for a chip: "Last 30 Reels". */
  label: string;
  /** What it showed: "median 18,900 views, 43% of following". */
  detail: string;
  /** When it was observed, as display text. */
  at?: string;
  href?: string;
}

/** A value the UI is allowed to display, because it can say where it
    came from. `why` is the sentence behind "Why this number". */
export interface Sourced<T> {
  value: T;
  why: string;
  evidence: Evidence[];
  /** Set when the value is arithmetic on other sourced values. */
  computedFrom?: string;
  /** Who put this value here. A creator's edit outranks an agent's
      proposal, and the panel says which it is looking at. */
  setBy: "agent" | "creator";
}

export const sourced = <T,>(
  value: T,
  why: string,
  evidence: Evidence[],
  extra?: { computedFrom?: string; setBy?: "agent" | "creator" }
): Sourced<T> => ({ value, why, evidence, setBy: "agent", ...extra });

/* ------------------------------------------------------------------ */
/* The creator read                                                    */
/*                                                                     */
/* The brand app reads a STORE: catalogue, prices, voice, markets,     */
/* traffic. This reads a PERSON's public work, and the layers are the  */
/* same questions asked of a different subject. Nine of them, arriving */
/* out of order, because the work finishes out of order.               */
/* ------------------------------------------------------------------ */

export type ReadLayerKey =
  | "identity"
  | "accounts"
  | "reach"
  | "audience"
  | "niche"
  | "voice"
  | "cadence"
  | "conflicts"
  | "standing";

export type Platform = "Instagram" | "TikTok" | "YouTube" | "Snapchat";

export interface AccountRead {
  platform: Platform;
  handle: string;
  followers: number;
  /** Median views on this account's last thirty posts. */
  medianViews: number;
  note: string;
}

export interface MarketRead {
  code: "AE" | "SA" | "KW" | "QA" | "BH" | "OM" | "EG" | "JO" | "LB";
  name: string;
  share: number; // % of this creator's audience
  note: string;
}

/** A brand already visible in the grid. Not a verdict: it is a fact a
    creator should be reminded of before they take work next to it. */
export interface ConflictRead {
  brand: string;
  category: string;
  /** "Ambassador", "Two paid posts in 90 days", "Own label". */
  standing: string;
  /** Which categories this rules out while it stands. */
  blocks: string[];
}

export interface PostRead {
  img: string;
  views: number;
  type: string;
  /** Whether this one was paid work. Read off the disclosure. */
  paid: boolean;
}

/** One correction a creator made to the read. The agent's own value is
    kept beside it, so the rate card can always say what HeyMoon
    believed and what it was told. */
export interface Correction {
  layer: ReadLayerKey;
  field: string;
  was: string;
  now: string;
  at: number;
}

/* WHETHER HEYMOON CAN PLACE THIS PERSON, and it is no longer a question
   about price.
 *
 * v0.1 asked "can HeyMoon sell their work at the rate they want" and
 * answered in dollars per deliverable. Rasha: "we don't focus on the
 * followers... we focus more on their influence — authenticity,
 * consistency". So the question is now whether any brand on the
 * platform wants this person, scored on influence, and the answer is
 * the campaigns rather than a number. */
export interface StandingRead {
  /** The best match available across every brand, 0..1. Internal: it is
      never printed as a score. */
  best: Sourced<number>;
  /** What is carrying them, in the language of influence. */
  strengths: Sourced<string[]>;
  /** `ok` has campaigns waiting. `thin` does not, and the read says so
      where it happens rather than at the end. */
  state: "ok" | "thin";
  line: Sourced<string>;
  /** Only on `thin`: what would move it. Never a lecture. */
  wouldChangeIt?: string[];
}

export interface CreatorRead {
  id: string;
  handle: string;
  /** Layers arrive one at a time and out of order. A key absent from
      `done` has not arrived yet — the UI must render that as pending,
      not as empty. */
  done: ReadLayerKey[];
  /** A handle that is not seeded, read off the sample creator's figures
      with none of her identity (personFor). Everything that shows the
      read has to say so. */
  sample?: true;
  /** Name, bio and location are absent on a sample, never on a seed. */
  identity?: { name?: Sourced<string>; avatar?: string; bio?: Sourced<string>; location?: Sourced<string> };
  accounts?: Sourced<AccountRead[]>;
  /** The share of a following that actually watches. The anti-vanity
      figure, carried over from the brands app unchanged, because it is
      the number both sides of this market should be trading on. */
  reach?: Sourced<{ followers: number; medianViews: number; viewThrough: number }>;
  audience?: Sourced<{ markets: MarketRead[]; age: [number, number]; femaleShare: number }>;
  niche?: Sourced<{ primary: string; also: string[]; paidShare: number }>;
  voice?: Sourced<{ words: string[]; sample: string; register: string }>;
  cadence?: Sourced<{ perWeek: number; turnaroundDays: number; activeSince: number }>;
  conflicts?: Sourced<ConflictRead[]>;
  standing?: StandingRead;
  posts?: PostRead[];
  corrections: Correction[];
}

/* ------------------------------------------------------------------ */
/* THE PROFILE                                                         */
/*                                                                     */
/* Was `RateCard`, and the word went in the review:                    */
/*                                                                     */
/*   Alex   "we no longer want to use the word card. What is a card?   */
/*           It's not an intuitive concept."                            */
/*   Rasha  "the concept of card, also rate card — we don't really use  */
/*           it."                                                       */
/*   Mostafa "we can call it building your profile."                    */
/*                                                                     */
/* It also holds no rates. A creator does not price themselves on this */
/* platform: a campaign pays a share of the sales it drives, the share  */
/* is the brand's, and it is the same for everybody on the campaign.    */
/* What the profile carries is who this person is and what they will    */
/* take — the things matching reads and the creator can change.         */
/* ------------------------------------------------------------------ */

export type Format = "Reel" | "TikTok" | "Story" | "Post" | "YouTube";

/** A category this creator will not take work in, whatever it pays. */
export interface NoList {
  categories: string[];
  /** In the creator's own words, if they gave any. */
  note: string | null;
}

export interface Availability {
  /** Deliverables a month they are willing to take. */
  perMonth: number;
  /** Days they need from brief to delivery. */
  turnaroundDays: number;
  based: string;
}

export interface Profile {
  id: string;
  readId: string;
  /** Absent when the read was a sample: its name is not the visitor's. */
  creatorName?: string;
  handle: string;
  avatar?: string;
  /** What they are known for, and what else they cover. */
  authority: Sourced<{ primary: string; also: string[] }>;
  /** The influence signals matching runs on, as sentences rather than
      scores. No follower count, no view count, no reach. */
  influence: Sourced<string[]>;
  availability: Sourced<Availability>;
  noList: Sourced<NoList>;
  platforms: Sourced<Platform[]>;
  audience: Sourced<{ markets: string[]; age: [number, number]; femaleShare: number }>;
  /** Every change since the profile was built, most recent last. */
  changes: ProfileChange[];
}

export type ProfileField = "availability" | "noList" | "platforms" | "audience" | "authority";

export interface ProfileChange {
  id: string;
  field: ProfileField;
  label: string;
  from: string;
  to: string;
  /** The attribution line: "because you said no gambling". */
  because: string;
  detail?: string;
  by: "agent" | "creator";
  at: number;
}

export interface ProfilePatch {
  perMonth?: number;
  turnaroundDays?: number;
  addNo?: string[];
  dropNo?: string[];
  platforms?: Platform[];
}

/* ------------------------------------------------------------------ */
/* Offers — a brief, from a phase a brand has already paid for         */
/*                                                                     */
/* THE JOINT BETWEEN THE TWO APPS. On the brand side a phase is funded  */
/* up front: $1,000 buys $650 of creator fees and briefs three people.  */
/* An offer here IS one of those three seats. So `funded` is not a      */
/* promise HeyMoon is making on a brand's behalf — it is a payment that */
/* has already cleared, and the creator app can say so without asking   */
/* anybody.                                                             */
/* ------------------------------------------------------------------ */

/* ══════════════════════════════════════════════════════════════════
   A CAMPAIGN
   ══════════════════════════════════════════════════════════════════

   Read off the mobile design's Campaign details screen, which is the
   most fully specified thing in that file and which this model was
   wrong about in three ways.

   1. A campaign is not one post. It asks for a BUNDLE: 2 Feed Posts,
      5 Stories, 3 Reels and 3 TikToks, per platform, with counts. So
      what a creator earns is the sum across the bundle, not a rate.

   2. Joining is an APPLICATION, not an acceptance. You press Join
      Campaign, you choose a posting cadence, and then the brand decides.
      The button goes to "You have already submitted an application"
      until it does, and the answer arrives as an Application Status
      screen carrying the cadence and the duration you were approved on.

   3. A campaign has a duration, a country list and a target audience,
      and the creator sees all three before they apply. "No end date" is
      a real value in that design and it is not the same as a long one.
   ══════════════════════════════════════════════════════════════════ */

/* The lifecycle of one campaign, for one creator.

   `open`     matched, not applied to
   `applied`  the application is with the brand
   `approved` the brand said yes. This is when the seat and its money
              become the creator's
   `rejected` the brand said no. Its own screen in the design, and it
              names a reason rather than going quiet
   `declined` the CREATOR passed. A signal, not a rejection
   `expired`  the window closed before either side moved
   `completed` the work was done and the campaign has ended. Its code
              can still carry orders — a performance campaign keeps
              paying after its posting window shuts — so it is not the
              same as closed. */
export type OfferState = "open" | "applied" | "approved" | "rejected" | "declined" | "expired" | "completed";

/* PREPAID vs POSTPAID, and the two sentences are the design's own
   tooltips, verbatim, because they are the clearest statement of the
   product's economics anywhere in it:

     prepaid   "This is the fixed base payment of $100 USD for the
                campaign, paid regardless of performance."
     postpaid  "You will earn 10% of the total order value for every
                successful order you generate."

   Note what each one commits to. Prepaid is per CAMPAIGN and pays
   whatever the posts do. Postpaid is per ORDER and pays nothing if
   nothing sells. HeyMoon can offer prepaid at all because the brand
   funded the phase before the brief existed. */
export type PayKind = "prepaid" | "postpaid";

/** Accept inside the window and the rate goes up. On a prepaid campaign
    that is dollars; on a postpaid one it is points on every order. */
export interface EarlyBird {
  /** "+$60" or "+5% per order". */
  label: string;
  /** How long is left, as display text: "3d 5h". */
  within: string;
  /** Why it exists, in one line. Never just a countdown. */
  why: string;
}

/** One line of the deliverables bundle: how many of what, where. */
export interface Deliverable {
  platform: Platform;
  format: Format;
  count: number;
}

/** How often the creator will post, chosen at the moment they apply.
    The design offers four, and the estimate beside them is the thing a
    prepaid campaign can show and a postpaid one cannot. */
export type Cadence = "daily" | "3pw" | "2pw" | "1pw";

export interface CadenceOption {
  key: Cadence;
  label: string;
  /** Posts a week, for working out how long the bundle takes. */
  perWeek: number;
}

export const CADENCES: CadenceOption[] = [
  { key: "daily", label: "Daily posts", perWeek: 7 },
  { key: "3pw", label: "3 posts per week", perWeek: 3 },
  { key: "2pw", label: "2 posts per week", perWeek: 2 },
  { key: "1pw", label: "1 post per week", perWeek: 1 },
];

export interface Offer {
  id: string;
  brand: string;
  brandLogo?: string;
  /** The campaign's own name, the way the brand named it. */
  title: string;
  /** The brand's own description of what it wants. */
  pitch: string;
  /** What the campaign sells. Named on the product tile. */
  product: string;
  /** Which kind of brand it is, for the tile's tint and the order value. */
  family: "luxury" | "beauty" | "grocery" | "general";
  /** Real product photography, when the brand has supplied any. */
  image?: string;
  /** Which rung of the brand's ladder this campaign belongs to. */
  phaseNo: number;
  phaseName: string;

  /* ── Why you ───────────────────────────────────────────────────────
     Replaces the v0.1 `reasons` array and the `exclusive` flag. Alex:
     "there should be a high match, medium match... the highest matching
     needs to be featured, clear, quick — just say join, and it's
     pre-qualified. The other campaigns we need to actually accept for
     them." So the match decides BOTH how the card is presented and
     whether joining needs the brand's answer at all. */
  match: Match;

  /* ── What it asks for ────────────────────────────────────────────── */
  platforms: Platform[];
  /** "30 days", or null for the design's "No end date". */
  duration: string | null;
  countries: string[];
  targetAge: [number, number];
  targetGender: "Both" | "Women" | "Men";
  deliverables: Deliverable[];

  /* ── What it pays ────────────────────────────────────────────────── */
  /** Performance for every campaign in the MVP. Alex: "we want to stick
      to [ROAS]... there's no fixed fee." */
  payKind: PayKind;
  /** The share of each order's value the creator earns. The brand's
      number, the same for everybody on the campaign, and the only price
      anywhere in this product. */
  commissionPct: number;
  /** How many orders HeyMoon expects, for the calculator's starting
      point. Orders, never views — Rasha: "we don't pay per view." */
  orders: Sourced<{ low: number; mid: number; high: number }>;
  bonus?: EarlyBird;
  /** The discount code every order is attributed through. */
  code: string;
  /** The link that attributes an order with no code typed. Alex: "it's
      all about the coupons. Now it's about the tracking links." */
  trackingLink: string;

  /** The brief MoonWriter AI wrote, in this creator's own register. */
  brief: {
    headline: Sourced<string>;
    mustSay: Sourced<string[]>;
    mustNotSay: Sourced<string[]>;
    formats: Sourced<string[]>;
    tone: Sourced<string>;
  };
  /** Set when the campaign clashes with something already in the grid. */
  conflict?: { brand: string; detail: string };
  /** What would make this a worse fit. Shown, not hidden. */
  caveat?: string;

  state: OfferState;
  /** Days until the window to join closes, or null for a finished
      campaign. The number behind `expires`, so the tie-break and the
      Pending list's "Closing soonest" never parse display text. */
  closesInDays: number | null;
  expires: string;
}

/** WHETHER THIS CAMPAIGN WANTS THIS CREATOR, which is not the same
    question as whether they can apply to it.
 *
 * A weak match is brought — Alex: "less matching could be 'see other
 * campaigns'" — so it appears under every campaign and a creator can
 * apply to it if they want to. It is never counted in "N campaigns want
 * somebody like you", because it does not. Every count in the product
 * goes through here so the two cannot drift apart. */
export const wantsYou = (o: Offer) => o.match.level !== "weak";

/** THE CONVERSATION SHOWS THREE, and the dashboard shows the rest.
 *
 * The creator's pre-qualified campaigns, which offersFor caps at three
 * (PREQUALIFIED_CAP), strongest first by byStrength, the same order
 * offersFor ranked them in. The store does not keep that order: a
 * decided campaign moves to the front of the stored set. So this
 * re-sorts rather than trusting its input. A campaign the
 * creator has already joined or passed on stays among them, so the row
 * in the thread does not reshuffle under them when they act on it —
 * the score does not change with the state. Finished campaigns are
 * history and never picked. If nothing is pre-qualified, the strongest
 * matches stand in, so the thread is never left pointing at nothing.
 * The carousel, the agent's sentence about it and the side panel all
 * call this, so they cannot disagree about which three. */
export const CHAT_PICKS = 3;
export function chatPicks(offers: Offer[], n = CHAT_PICKS): Offer[] {
  const live = offers
    .filter((o) => o.state !== "completed" && wantsYou(o))
    .sort(byStrength);
  const pre = live.filter((o) => o.match.level === "prequalified");
  return (pre.length ? pre : live).slice(0, n);
}

/** The tooltip behind the ⓘ beside Your share — the design's own
    sentence for a performance campaign. */
export const payoutWhyFor = (pct: number) =>
  `You will earn ${pct}% of the total order value for every successful order you generate.`;

/* ------------------------------------------------------------------ */
/* Running — the work, once a campaign is approved                        */
/* ------------------------------------------------------------------ */

export type DraftState = "shooting" | "checking" | "sent" | "changes" | "approved" | "live";

/* THE PRE-UPLOAD CHECK.

   The mobile design has this screen already, and it is a checklist the
   creator ticks by hand: Product Intro, Quality and Lighting, Review
   and Styling, Price Transparency, Code Visibility, Link Distribution,
   Brand Tagging. Seven boxes, and the person who most wants them all
   ticked is the person ticking them.

   Same seven lines here. The difference is who checks: MoonWriter AI
   wrote the brief, so it reads the cut back against it and says which
   ones it cannot find, with the timecode. A checklist tells you what
   the rules were. This tells you which one you missed, and where.

   It runs BEFORE the brand sees anything, which is the whole point — a
   miss caught here costs a re-cut, and the same miss caught by the
   brand is a decline on a record that follows you. */
export interface DraftCheck {
  label: string;
  detail: string;
  clean: boolean;
  /** What to change, when it is not clean. Never just "failed". */
  fix?: string;
}

export interface Draft {
  id: string;
  offerId: string;
  brand: string;
  product: string;
  format: Format;
  platform: Platform;
  img: string;
  video?: string;
  caption: string;
  dueIn: string;
  state: DraftState;
  check: {
    checks: DraftCheck[];
    verdict: "send" | "send-with-note" | "fix-first";
    reasoning: Sourced<string>;
  };
  /** What the brand said, when they asked for changes. Verbatim. */
  brandNote?: string;
  /** Only on a live post, and only ever from platform data. */
  performance?: { views: Sourced<number>; orders: Sourced<number> };
}

export type PayoutState = "escrow" | "due" | "paid";

export interface Payout {
  id: string;
  offerId: string;
  brand: string;
  amount: Sourced<number>;
  state: PayoutState;
  /** What has to happen for this to move. */
  gate: string;
  /** Display text. */
  at: string;
}

export interface Report {
  question?: string;
  headline: string;
  figures: { key: string; label: string; value: Sourced<string>; cardRef: string }[];
  narrative: string;
}

/* AN APPLICATION. Never a completion, and never an acceptance either.
 *
 * The mobile design is clear about this and the first cut of this app
 * was not: pressing Join Campaign does not book the work. It submits an
 * application, with the posting cadence you chose, and the brand
 * decides. Until it does the button reads "You have already submitted
 * an application" and nothing is owed to anybody.
 *
 * `state` here is the state of the REQUEST — has the creator pressed it
 * — not of the application. Whether the brand said yes lives on the
 * campaign, because that is what it is about. */
export interface AcceptRequest {
  id: string;
  offerId: string;
  brand: string;
  campaign: string;
  commissionPct: number;
  /** Whether the brand has to answer at all. A pre-qualified campaign
      is joined outright; Alex: "you are pre-qualified for this
      campaign... the other campaigns we need to actually accept". */
  needsApproval: boolean;
  /** What the creator is joining to deliver. */
  deliverables: Deliverable[];
  /** How often they said they would post. */
  cadence: Cadence;
  /** How long the brand is running it, or null for no end date. */
  duration: string | null;
  /** What the creator is committing to, spelled out. */
  commits: string[];
  /** What they are not committing to. The other half, and the half a
      creator signing with a brand never gets told. */
  notCommits: string[];
  state: "pending" | "confirmed" | "cancelled";
}

/** The brand's answer, which is its own screen in the design: approved
    with the cadence and duration it was approved on, or rejected with a
    reason rather than silence. */
export interface Decision {
  offerId: string;
  outcome: "approved" | "rejected";
  at: string;
  cadence: Cadence;
  duration: string | null;
  /** When the answer was recorded — the day a joined campaign's
      schedule starts from on the Calendar. Stamped by the store. */
  decidedAt?: number;
  /** Only on a rejection, and never left empty. */
  because?: string;
}

export interface SendRequest {
  id: string;
  draftIds: string[];
  /** One line per draft the agent wants a decision on. */
  summary: { draftId: string; line: string; verdict: Draft["check"]["verdict"] }[];
  state: "pending" | "sent" | "held";
}

/* ------------------------------------------------------------------ */
/* Submitting an ad — proof it went up, so it can be paid              */
/*                                                                     */
/* The mobile design's Submit content for review. Every deliverable of */
/* the bundle is a row, grouped by the week it is due. The creator     */
/* posts the ad from their own account first, then submits it: the     */
/* live link, or a video of it where a link will not last (a Story is  */
/* gone in a day). The review is a CHECK THAT THE WORK WAS DONE — that */
/* it is up and carries what the brief asks for — not a brand deciding */
/* whether it may go up. Accepted is what makes it count toward the    */
/* payout. No tool here can post anything to an account.               */
/* ------------------------------------------------------------------ */

/** The Pre-upload Check's seven lines, keyed so a rejection can name
    the one that was missing. */
export type CheckKey = "intro" | "light" | "review" | "price" | "code" | "link" | "tag";

export interface CheckLine {
  key: CheckKey;
  label: string;
  /** Written from this campaign's brief: its code, its link, its tag. */
  detail: string;
}

/* `review`   submitted, being checked
   `accepted` checked: it is up and carries the brief. It counts
   `rejected` something the brief asks for is missing, and it says which */
export type SubmissionState = "review" | "accepted" | "rejected";

export interface Submission {
  /** The slot it covers: `ad-<offer id>-<n>`. */
  id: string;
  offerId: string;
  /** Which deliverable of the bundle, from 1. */
  n: number;
  platform: Platform;
  format: Format;
  /** The accounts the creator posted it on. */
  accounts: Platform[];
  /** The live ad's link, or a video of the ad itself. */
  kind: "file" | "link";
  /** What was read off the file in the browser. Nothing is uploaded
      anywhere in the prototype, so a reload keeps the facts and loses
      the preview. */
  file?: { name: string; size: number; type: string; seconds?: number; width?: number; height?: number };
  link?: string;
  /** Which Pre-upload Check lines the creator ticked. */
  checked: CheckKey[];
  state: SubmissionState;
  /** 1 on the first submission; submitting again after a rejection is 2. */
  attempt: number;
  sentAt: number;
  /** When the check's answer lands. The prototype's clock: a real check
      reads the post itself and takes longer. */
  answerAt: number;
  answeredAt?: number;
  /** Why it was not accepted, when it was not. */
  note?: string;
  /** Which line that is about. */
  missed?: CheckKey;
}

/** The answer on one submitted ad. */
export interface AdReview {
  outcome: "accepted" | "rejected";
  note?: string;
  missed?: CheckKey;
}

/* ------------------------------------------------------------------ */
/* The streaming contract                                              */
/* ------------------------------------------------------------------ */

export type ToolName =
  | "read_profile" | "propose_profile" | "match_offers" | "edit_profile"
  | "request_accept" | "get_report" | "list_drafts" | "check_draft" | "request_send";

/** One piece of a result. `partial` is the whole result so far, not a
    delta — the UI renders it directly and never has to merge. */
export interface Chunk<T> {
  partial: T;
  /** What the agent is doing right now, for the working line. */
  note: string;
  /** Units finished / units known so far. `total` grows as the agent
      discovers work, so this is not a countdown to a fixed end. */
  progress: { done: number; total: number };
}

export interface RunContext {
  signal: AbortSignal;
}

/** Cancelling mid-stream throws this. Whatever was yielded last is
    still valid and the UI keeps it. */
export class Cancelled extends Error {
  constructor() { super("cancelled"); this.name = "Cancelled"; }
}

export type ToolStream<T> = AsyncGenerator<Chunk<T>, T, void>;

export interface AgentTools {
  /** Read a creator's public work. Layers arrive out of order. */
  read_profile(i: { handle: string }, ctx: RunContext): ToolStream<CreatorRead>;

  /** A complete profile. Not a questionnaire, and not a price list. */
  propose_profile(i: { read: CreatorRead }, ctx: RunContext): ToolStream<Profile>;

  /** The campaigns this profile matches, strongest first. */
  match_offers(i: { profile: Profile; limit?: number }, ctx: RunContext): ToolStream<Offer[]>;

  /** The only way the profile changes. Returns the new profile and the
      attributed changes, so the UI never has to guess what moved. */
  edit_profile(i: { profile: Profile; patch: ProfilePatch; because: string; by: "agent" | "creator" }): { profile: Profile; changes: ProfileChange[] };

  /** Produces a request the creator must confirm. Signs nothing. */
  request_accept(i: { offer: Offer }): AcceptRequest;

  /** Answer a question about work in flight, with every figure carrying
      the card it came from. */
  get_report(i: { question?: string }, ctx: RunContext): ToolStream<Report>;

  list_drafts(i: { state?: DraftState }): Draft[];

  /** Check a draft against its brief. This is the creator-side feature
      the brands app cannot have: it runs BEFORE the brand sees it. */
  check_draft(i: { draft: Draft }, ctx: RunContext): ToolStream<Draft["check"]>;

  /** Produces a request the creator must act on. Sends nothing. */
  request_send(i: { draftIds: string[] }): SendRequest;

  /** Free text in, an intent out. This is the seam a language model
      replaces first: everything else is already typed. */
  interpret(i: { text: string; profile?: Profile; joined?: boolean }): Interpretation;
}

/** What the agent understood. `patch` is empty when it understood a
    question rather than an instruction. */
export interface Interpretation {
  kind: "edit" | "question" | "command" | "unknown";
  say: string;
  patch?: ProfilePatch;
  because?: string;
  /** For a question, which card answers it. */
  answerRef?: string;
  command?: "join" | "show-offers" | "show-profile" | "show-brief" | "show-report" | "build" | "correct" | "report-post";
}
