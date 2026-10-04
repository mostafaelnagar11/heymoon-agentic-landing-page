/* The numbers model — creator side, v0.2.
 *
 * WHAT THE 21 SEP REVIEW CHANGED, and why the shape of this file moved:
 *
 * v0.1 priced the creator. It computed what HeyMoon could pay for one
 * deliverable, showed it as a rate, showed the cost per thousand views
 * behind it, and let the creator argue the number up until HeyMoon
 * refused. Three separate comments killed that in one call:
 *
 *   Alex    "we don't want to go with ad rates now. We want to stick to
 *            [ROAS]. That's going to be the MVP."
 *   Rasha   "we don't focus on the followers... views, followers, reach.
 *            We focus more on their influence."
 *   Rasha   "this for example per view. We don't pay per view."
 *   Rasha   "'your rate is set to 500' — this is also confusing."
 *
 * So there is no creator rate in here any more, and no CPM. A campaign
 * pays a SHARE OF THE SALES it drives; that share is the brand's, set on
 * the campaign, and it is the same for everybody on it. What the model
 * now computes is two different things:
 *
 *   1. MATCH — whether this creator and this campaign belong together,
 *      out of influence signals rather than audience size: how much of
 *      their audience is where the brand sells, how much of their grid
 *      is already advertising, how consistently they post, and whether
 *      the audience is who the brand asked for.
 *
 *   2. EARNINGS — orders times order value times the commission. Shown
 *      only AFTER joining, as a calculator the creator drags, because
 *      Alex asked for exactly that: "we want to calculate when you join
 *      a campaign, not before... if I make these many orders, I make
 *      this much money, like a bar."
 *
 * Views still appear here, once, as the input to an expected order
 * count. They are never a figure the creator is shown or judged on. */

import type { PersonSeed } from "../mock/people";
import { mainAccount } from "../mock/people";
import type { Format, Platform } from "./types";

/** AED to USD. The Gulf pegs are fixed, so this is a constant. */
export const AED_USD = 3.6725;

export type CategoryFamily = "luxury" | "beauty" | "grocery" | "general";

/** Orders per view, by category. HeyMoon's own platform benchmark
    across comparable campaigns. The only figure in either app that is
    not derived from somebody's own data, and it is labelled as a
    benchmark everywhere it appears. */
export const ORDERS_PER_VIEW: Record<CategoryFamily, number> = {
  luxury: 0.00085,
  beauty: 0.0011,
  grocery: 0.00175,
  general: 0.00095,
};

/** The median order value of the brands in each category, in AED. */
export const MEDIAN_ORDER_AED: Record<CategoryFamily, number> = {
  luxury: 330,
  beauty: 350,
  grocery: 180,
  general: 300,
};

/** What one order is worth, in dollars. */
export const orderValue = (family: CategoryFamily) => MEDIAN_ORDER_AED[family] / AED_USD;

export function familyFor(niche: string): CategoryFamily {
  const n = niche.toLowerCase();
  if (/food|grocer|restaurant/.test(n)) return "grocery";
  if (/beauty|skincare|fragrance|makeup/.test(n)) return "beauty";
  if (/fashion|luxury|lifestyle|travel|motherhood/.test(n)) return "luxury";
  return "general";
}

/** The markets HeyMoon's brands ship to. An audience outside these is
    real, and there is nothing here to sell it. */
export const SERVED_MARKETS = ["AE", "SA", "KW", "QA", "BH", "OM"];

/** The share of an audience inside a set of markets. */
export function marketFit(p: PersonSeed, markets: string[] = SERVED_MARKETS): number {
  const want = new Set(markets);
  return p.markets.filter((m) => want.has(m.code)).reduce((n, m) => n + m.share, 0) / 100;
}

/* ══════════════════════════════════════════════════════════════════
   INFLUENCE
   ══════════════════════════════════════════════════════════════════

   Rasha's brief, turned into four signals: "even if they have a very
   small circle but they have good influence, they have authenticity,
   they have consistency". None of these is audience size, and a million
   followers moves none of them.

   AUTHENTICITY is the one worth explaining. It is the share of the last
   thirty posts that were NOT paid. A grid that is two thirds
   advertising has an audience that has stopped believing it, and that
   belief is the thing a brand is actually buying. Sixty per cent paid is
   where it stops being worth anything, so the signal is measured
   against that rather than against zero: nobody expects a professional
   creator never to have taken work. */

export const SATURATION_POINT = 60;

export const authenticity = (p: PersonSeed) =>
  Math.max(0, Math.min(1, 1 - p.paidShare / SATURATION_POINT));

/** Posts a week, and how long they have kept it up. Somebody who has
    posted four times a week for four years is a different proposition
    from somebody who started in March. */
export function consistency(p: PersonSeed, thisYear = 2026) {
  const cadence = Math.min(1, p.perWeek / 5);
  const years = Math.min(1, (thisYear - p.activeSince) / 5);
  return cadence * 0.6 + years * 0.4;
}

/** Whether the audience is who the brand asked for. */
export function audienceFit(p: PersonSeed, age: [number, number], gender: "Both" | "Women" | "Men") {
  const overlap = Math.max(0, Math.min(p.age[1], age[1]) - Math.max(p.age[0], age[0]));
  const span = Math.max(1, p.age[1] - p.age[0]);
  const byAge = Math.min(1, overlap / span);
  const byGender = gender === "Both" ? 1 : gender === "Women" ? p.femaleShare / 100 : 1 - p.femaleShare / 100;
  return byAge * 0.5 + byGender * 0.5;
}

export const MATCH_WEIGHTS = { market: 0.35, authenticity: 0.25, consistency: 0.2, audience: 0.2 } as const;

export type MatchLevel = "prequalified" | "strong" | "weak";

export interface Match {
  score: number;
  level: MatchLevel;
  /** Market fit read from both sides, for the tie-break (see
      byStrength): the share of the creator's audience in the campaign's
      markets, and the share of the campaign's markets that hold any of
      that audience. Internal, like the score: never printed as numbers. */
  markets: { audience: number; covered: number };
  /** One line per signal, for the card and the detail. Named in the
      language of influence, never of audience size. */
  signals: { label: string; detail: string; strong: boolean }[];
}

/* Where the two lines sit. Above the first, HeyMoon is confident enough
   to skip the brand's review entirely — Alex's "you are pre-qualified
   for this campaign... just say join". Between them it is an
   application the brand answers. Below the second HeyMoon does not
   bring the campaign at all. */
export const PREQUALIFIED_AT = 0.7;

/* AND ONLY THE THREE STRONGEST OF THOSE. A score of 0.7 is the floor
   for pre-qualified, not the definition of it: a creator is
   pre-qualified for their three strongest matches at or above it, and
   everything else they are brought is a request the brand answers.
   Without the cap Mais was pre-qualified for fifteen campaigns, and a
   status that most campaigns have is not a status. The cap is applied
   where the whole set is known — offersFor and the read — because a
   single match cannot know its rank.

   WHICH THREE, WHEN SCORES TIE. They tie often. The score has four
   signals, and three of them (authenticity, consistency and, for most
   briefs, audience) describe the creator, not the campaign. So any two
   campaigns that want the same category, sell where the same share of
   the audience is and target an audience the creator fully covers get
   the same score. Seven of Mais's live campaigns score 0.756, and until
   this rule existed the order of BRANDS in brands.ts chose her three. A
   tie is now broken in this order (byStrength, below):

     1. Market fit, from both sides. First, more of the creator's
        audience in the campaign's markets. This is the heaviest
        signal, so it decides when the other signals cancel each other
        out. Then more of the campaign's markets holding any of that
        audience: Tide Trace sells in three markets and Mais's audience
        is in two of them, while Ounass sells in five and her audience
        is in the same two.
     2. The share. A higher commission pays more on the same order.
     3. The closing date. The campaign whose window to join closes
        first goes first, because it is the one the creator can miss.
     4. The campaign id, alphabetically. This is not a reason. It only
        makes sure array order can never decide. No seeded creator's
        top three reaches this key.

   Every place that ranks campaigns sorts with this one comparator:
   offersFor (so it decides which three keep pre-qualified), chatPicks
   (the chat carousel and the side panel), Explore's pre-qualified
   section, the join command's "your strongest", and the Pending list
   when its own sort key ties. So they cannot disagree. */
export const PREQUALIFIED_CAP = 3;
export const MATCH_FLOOR = 0.5;

/** Scores closer than this are the same score. Floating-point sums can
    differ in the last bit without either campaign being a better match. */
const SAME = 1e-9;
const desc = (x: number, y: number) => (Math.abs(x - y) > SAME ? y - x : 0);

/** What byStrength reads. An Offer satisfies it. */
export interface Ranked {
  id: string;
  match: Match;
  commissionPct: number;
  /** Days until the window to join closes. Null once it has closed. */
  closesInDays: number | null;
}

/** Strongest first, with the tie-break documented above PREQUALIFIED_CAP. */
export function byStrength(a: Ranked, b: Ranked): number {
  const closes = (r: Ranked) => r.closesInDays ?? Number.MAX_SAFE_INTEGER;
  return desc(a.match.score, b.match.score)
    || desc(a.match.markets.audience, b.match.markets.audience)
    || desc(a.match.markets.covered, b.match.markets.covered)
    || b.commissionPct - a.commissionPct
    || closes(a) - closes(b)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export interface BrandCriteria {
  name: string;
  wants: string[];
  markets: string[];
  targetAge: [number, number];
  targetGender: "Both" | "Women" | "Men";
}

export function matchFor(p: PersonSeed, brand: BrandCriteria): Match {
  const wantsThem = brand.wants.some((w) =>
    w.toLowerCase() === p.niche.toLowerCase() || p.alsoNiche.some((n) => n.toLowerCase() === w.toLowerCase()));
  const primary = brand.wants.some((w) => w.toLowerCase() === p.niche.toLowerCase());

  const mk = marketFit(p, brand.markets);
  const au = authenticity(p);
  const co = consistency(p);
  const ad = audienceFit(p, brand.targetAge, brand.targetGender);

  /* Category is a gate rather than a weight. A brand that does not buy
     this kind of creator is not a weak match, it is not a match. */
  const score = wantsThem
    ? (mk * MATCH_WEIGHTS.market + au * MATCH_WEIGHTS.authenticity
       + co * MATCH_WEIGHTS.consistency + ad * MATCH_WEIGHTS.audience) * (primary ? 1 : 0.85)
    : 0;

  const level: MatchLevel = score >= PREQUALIFIED_AT ? "prequalified" : score >= MATCH_FLOOR ? "strong" : "weak";

  const held = new Set(p.markets.filter((m) => m.share > 0).map((m) => m.code));
  const covered = brand.markets.length ? brand.markets.filter((m) => held.has(m)).length / brand.markets.length : 0;

  return {
    score,
    level,
    markets: { audience: mk, covered },
    signals: [
      {
        label: "Where your audience is",
        detail: `${pct(mk)} of them are in ${brand.markets.slice(0, 3).join(", ")}, which is where this campaign sells.`,
        strong: mk >= 0.5,
      },
      {
        label: "How much of your grid is advertising",
        detail: p.paidShare <= 30
          ? `Only ${p.paidShare}% of your last thirty posts were paid.`
          : `${p.paidShare}% of your last thirty posts were paid. A grid that is mostly advertising converts less, whatever its size.`,
        strong: au >= 0.5,
      },
      {
        label: "How consistently you post",
        detail: `${p.perWeek} a week, every week since ${p.activeSince}.`,
        strong: co >= 0.6,
      },
      {
        label: "Who the brand asked for",
        detail: `${brand.targetAge[0]} to ${brand.targetAge[1]}${brand.targetGender === "Both" ? ", any gender" : `, ${brand.targetGender.toLowerCase()}`}. Yours are ${p.age[0]} to ${p.age[1]}.`,
        strong: ad >= 0.6,
      },
    ],
  };
}

export const MATCH_WORD: Record<MatchLevel, string> = {
  prequalified: "Pre-qualified",
  strong: "Strong match",
  weak: "Worth a look",
};

/* ══════════════════════════════════════════════════════════════════
   EARNINGS
   ══════════════════════════════════════════════════════════════════

   Orders times order value times the commission. Nothing else, and
   never a figure per view. */

export const earningsFor = (orders: number, family: CategoryFamily, commissionPct: number) =>
  orders * orderValue(family) * (commissionPct / 100);

/** REPEAT EXPOSURE, NOT FRESH REACH. Five posts on one account do not
    reach five audiences; they reach roughly one audience five times,
    and the second showing converts a fraction of what the first did.
    A linear multiple here priced a five-deliverable campaign at five
    times a one-deliverable campaign and produced order counts nobody
    would believe. The first post counts in full, each one after it
    counts for 40%. */
const EXPOSURE_DECAY = 0.4;
export const effectiveExposures = (deliverables: number) =>
  1 + Math.max(0, deliverables - 1) * EXPOSURE_DECAY;

/** How many orders a campaign is expected to carry for this creator.
 *
 * Views are the input, once, and they do not leave this function: what
 * comes out is a count of orders, which is the unit the creator is paid
 * in and the only one they are shown. */
export function expectedOrders(
  p: PersonSeed,
  brand: { family: CategoryFamily; markets: string[] },
  deliverables: number
) {
  const reach = mainAccount(p).medianViews * marketFit(p, brand.markets) * effectiveExposures(deliverables);
  const mid = reach * ORDERS_PER_VIEW[brand.family];
  return { low: Math.round(mid * 0.55), mid: Math.round(mid), high: Math.round(mid * 1.8) };
}

/** WHAT KEEPING IT UP IS WORTH. Rasha: "we can mention similar
    creators usually make X with consistency after 3 months."
 *
 * Three campaigns at the rate passed in, plus the 35% lift an audience
 * that already bought from you once gives the next one. Whatever is
 * passed in has to be ONE campaign's earnings, and the sentence around
 * it has to say so — this is three more of the same, not three months
 * of the one on screen. */
export const afterThreeMonths = (perCampaign: number) => Math.round(perCampaign * 3 * 1.35);

/* ══════════════════════════════════════════════════════════════════
   The two campaign models, so the product can explain them
   ══════════════════════════════════════════════════════════════════

   Alex: "you need to explain the difference between [ROAS] and [CPA]
   campaigns... really explain them very very well and then 'hey, we're
   going to now support this'." One place, so no screen invents its own
   version. */

export const CAMPAIGN_MODELS = [
  {
    key: "postpaid" as const,
    name: "Performance",
    line: "You earn a share of every order your code and link bring in.",
    detail:
      "No ceiling on what a post can pay, and no floor either. The brand sets the share, it is the same for everybody on the campaign, and it is paid weekly on the orders that cleared.",
    supported: true,
  },
  {
    key: "prepaid" as const,
    name: "Fixed fee",
    line: "A flat payment for the campaign, whatever the posts do.",
    detail:
      "Safer per post, and capped. HeyMoon does not run these yet: every campaign today pays a share of every order, and the brand sets the share.",
    supported: false,
  },
];

/* ══════════════════════════════════════════════════════════════════
   Formats
   ══════════════════════════════════════════════════════════════════ */

/** What each format is CALLED. "TikTok on TikTok" is what you get from
    using the platform as the format name; the design says In-Feed
    Video, and Feed Post rather than Post. */
export const FORMAT_NAME: Record<Format, string> = {
  TikTok: "In-Feed Video",
  Reel: "Reel",
  Story: "Story",
  Post: "Feed Post",
  YouTube: "Video",
};

/** "Reel" to "Reels", "Story" to "Stories". FORMAT_NAME is singular. */
export const plural = (name: string, n: number) =>
  n === 1 ? name : name.endsWith("y") ? `${name.slice(0, -1)}ies` : `${name}s`;

/** A bundle as a creator reads it: "3 In-Feed Videos, 2 Reels". */
export const bundleLine = (d: { format: Format; count: number }[]) =>
  d.map((x) => `${x.count} ${plural(FORMAT_NAME[x.format], x.count)}`).join(", ");

/** Which account publishes a format. */
export function accountForFormat(p: PersonSeed, format: Format) {
  const want: Record<Format, Platform> = {
    TikTok: "TikTok", Reel: "Instagram", Story: "Instagram", Post: "Instagram", YouTube: "YouTube",
  };
  return p.accounts.find((a) => a.platform === want[format]) ?? mainAccount(p);
}

/** Formats this creator can be booked for: the ones their own accounts
    publish, and the ones on any platform they have added to their
    profile themselves — the read can miss a channel, and the creator's
    word that they post there is enough to be matched on it. There is no
    fee floor any more — a commission campaign pays on orders, so a
    Story that reaches fewer people earns less rather than being
    unsellable. */
export function formatsFor(p: PersonSeed, added: Platform[] = []): Format[] {
  const held: Format[] = [];
  for (const pl of [...p.accounts.map((a) => a.platform), ...added]) {
    if (pl === "TikTok") held.push("TikTok");
    if (pl === "Instagram") held.push("Reel", "Story", "Post");
    if (pl === "YouTube") held.push("YouTube");
  }
  return Array.from(new Set(held));
}

/* ── Display ────────────────────────────────────────────────────── */

export const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}K` : String(Math.round(n));
export const pct = (n: number) => `${Math.round(n * 100)}%`;
