/* The people who sign in.

   The brands app holds these same ten as a ROSTER — the creators a
   brand is shown. Here four of them are the account holder, which is
   the whole point of the pair: the person a brand sees as a row in a
   shortlist is, on this side, the person deciding whether to take the
   work.

   Every figure below is the one the brands app already carries for the
   same person. They are not re-typed estimates: the two apps ship from
   one set of numbers so a creator and the brand looking at them are
   never being shown different things.

   WHAT THESE FIGURES ARE NOW FOR. Followers and median views are still
   here, because matching needs to know how far a post travels and how
   much of that audience is somewhere a brand ships to. None of them
   reaches a creator-facing screen any more — Rasha: "we don't focus on
   the followers... views, followers, reach. We focus more on their
   influence — authenticity, consistency." What a creator is shown is
   `paidShare`, `perWeek` and `activeSince`, read as sentences. */

import { handleKey } from "../handle";

export type Platform = "Instagram" | "TikTok" | "YouTube" | "Snapchat";

export interface AccountSeed {
  platform: Platform;
  handle: string;
  followers: number;
  medianViews: number;
  note: string;
}

export interface ConflictSeed {
  brand: string;
  category: string;
  standing: string;
  blocks: string[];
}

export interface PersonSeed {
  /** The handle typed at the front door, without the @. */
  key: string;
  /** Every seed has a name, a bio and a location. Only the sample has
      none of the three — see personFor. */
  name?: string;
  handle: string;
  avatar?: string;
  bio?: string;
  location?: string;
  based: string;
  niche: string;
  alsoNiche: string[];
  /** Share of the last thirty posts that were paid work. */
  paidShare: number;
  accounts: AccountSeed[];
  markets: { code: string; name: string; share: number; note: string }[];
  age: [number, number];
  femaleShare: number;
  perWeek: number;
  turnaroundDays: number;
  activeSince: number;
  conflicts: ConflictSeed[];
  voice: { words: string[]; sample: string; register: string };
  posts: { img: string; views: number; type: string; paid: boolean }[];
  /** What the brands app pays this person for one phase. Nothing on
      this side derives from it — there is no creator rate here any
      more — but it stays so the two apps can be checked against each
      other, and so a fixed-fee campaign has a number to start from if
      HeyMoon ever runs one. */
  brandsAppRate: number;
  /** Set on the sample and never on a seed. See personFor. */
  sample?: true;
  /** Whose finished campaigns are this person's history, when it is not
      their own key. Only the sample has one. */
  historyOf?: string;
}

const posts = (h: string, views: number[], type: string, paidAt: number[]) =>
  views.map((v, i) => ({ img: `/creators/${h}/p${i + 1}.jpg`, views: v, type, paid: paidAt.includes(i) }));

export const PEOPLE: PersonSeed[] = [
  /* ── The case the product is built to win ───────────────────────
     Ninth of ten on the brands app roster by follower count, and first
     on every signal this product matches on: a fifth of the grid is
     paid, four posts a week without a gap since 2021, and three
     quarters of the audience in a market HeyMoon's brands ship to.
     Fifteen of the sixteen live campaigns clear the pre-qualified line
     for her — she is pre-qualified for the three strongest, since
     that is the cap — which no follower-ranked market would ever have
     shown her. */
  {
    key: "mais.mustafa",
    name: "Mais Mustafa",
    handle: "@mais.mustafa",
    avatar: "/creators/mais.mustafa/avatar.jpg",
    bio: "Fashion, lifestyle and motherhood. Short-form that people actually finish.",
    location: "Dubai, UAE",
    based: "UAE",
    niche: "Lifestyle",
    alsoNiche: ["Fashion", "Motherhood"],
    paidShare: 20,
    accounts: [
      { platform: "TikTok", handle: "@mais.mustafa", followers: 43_600, medianViews: 18_900, note: "Where the work is, and where the register is hers." },
      { platform: "Instagram", handle: "@mais.mustafa", followers: 21_400, medianViews: 6_100, note: "Cross-posted from TikTok. The work is made there first." },
    ],
    markets: [
      { code: "AE", name: "United Arab Emirates", share: 39, note: "Where you are, and where most of them are." },
      { code: "SA", name: "Saudi Arabia", share: 22, note: "The market HeyMoon's brands buy hardest." },
      { code: "JO", name: "Jordan", share: 14, note: "Strong, but nobody on HeyMoon ships there yet." },
    ],
    age: [25, 34],
    femaleShare: 88,
    perWeek: 4,
    turnaroundDays: 3,
    activeSince: 2021,
    conflicts: [],
    voice: {
      words: ["honestly", "wear it in", "worth it", "here's the thing", "no filter on this"],
      sample: "Honestly, I wore this three days straight. Here's the thing nobody tells you about the fit.",
      register: "First person, unhurried, and she says the price out loud. A brief written in ad copy will not sound like her.",
    },
    posts: posts("mais.mustafa", [24_000, 17_000, 29_000, 13_000, 11_000], "Video", [1]),
    brandsAppRate: 210,
  },

  /* ── The big account, and why size is not the question ──────────
     1.1M followers, and it buys her nothing extra here. 43% of her grid
     is already advertising, which is most of the way to the point where
     an audience stops believing any of it, and FreshGrocer does not
     want her at all because she has never shot food. She still matches
     four campaigns — on the Saudi audience and the cadence, not on the
     million. */
  {
    key: "ghalya.mu2",
    name: "Ghaliah Alsharif",
    handle: "@ghalya.mu2",
    avatar: "/creators/ghalya.mu2/avatar.jpg",
    bio: "Beauty and fashion out of Jeddah. Sephora ambassador. 570K more on Instagram.",
    location: "Jeddah, KSA",
    based: "KSA",
    niche: "Beauty",
    alsoNiche: ["Fashion", "Fragrance"],
    paidShare: 43,
    accounts: [
      { platform: "TikTok", handle: "@ghalya.mu2", followers: 1_100_000, medianViews: 214_000, note: "The main account, and where a brief would run." },
      { platform: "Instagram", handle: "@ghalya.mu", followers: 570_000, medianViews: 61_000, note: "A different handle, and a different audience. Both are read." },
    ],
    markets: [
      { code: "SA", name: "Saudi Arabia", share: 61, note: "The deepest Saudi audience on HeyMoon's roster." },
      { code: "AE", name: "United Arab Emirates", share: 18, note: "Second, and every HeyMoon brand ships there." },
      { code: "KW", name: "Kuwait", share: 8, note: "Small, but it converts." },
    ],
    age: [20, 30],
    femaleShare: 89,
    perWeek: 5,
    turnaroundDays: 5,
    activeSince: 2018,
    conflicts: [
      { brand: "Sephora", category: "Beauty retail", standing: "Ambassador, running", blocks: ["Beauty retail", "Multi-brand beauty"] },
    ],
    voice: {
      words: ["يا بنات", "swatch", "on my skin", "I'll be honest", "shade"],
      sample: "I'll be honest, the first shade did nothing on my skin. The second one is the whole reason I'm posting.",
      register: "Arabic and English in the same sentence, fast cuts, and a verdict in the first four seconds.",
    },
    posts: posts("ghalya.mu2", [268_000, 195_000, 312_000, 172_000, 148_000], "Video", [0, 2, 3]),
    brandsAppRate: 3400,
  },

  /* ── The small, dense audience ──────────────────────────────────
     18,200 followers in Kuwait, seven posts a week since 2019, and the
     strongest match on the platform: the highest scores on it, ahead
     of the account with sixty times her following. Too small for
     an agency to return a call about. */
  {
    key: "asmaalazmii_",
    name: "Asma Al Azmi",
    handle: "@asmaalazmii_",
    avatar: "/creators/asmaalazmii_/avatar.jpg",
    bio: "Kuwait-based creator. Perfume, restaurants and honest takes on everything she's sent.",
    location: "Kuwait City, Kuwait",
    based: "Kuwait",
    niche: "Lifestyle",
    alsoNiche: ["Fragrance", "Food"],
    paidShare: 33,
    accounts: [
      { platform: "Instagram", handle: "@asmaalazmii_", followers: 18_200, medianViews: 5_400, note: "One account, posted to daily since 2019." },
    ],
    markets: [
      { code: "KW", name: "Kuwait", share: 54, note: "Over half, in a market most rosters cannot reach at all." },
      { code: "SA", name: "Saudi Arabia", share: 21, note: "Second, and growing off the restaurant posts." },
      { code: "AE", name: "United Arab Emirates", share: 14, note: "Third." },
    ],
    age: [24, 34],
    femaleShare: 90,
    perWeek: 7,
    turnaroundDays: 2,
    activeSince: 2019,
    conflicts: [],
    voice: {
      words: ["صراحة", "I'd buy it again", "not sponsored", "the smell", "wallah"],
      sample: "Not sponsored, they just sent it. Wallah the smell lasts till the evening and that is the whole review.",
      register: "Kuwaiti Arabic first, short, and she draws a hard line between gifted and paid.",
    },
    posts: posts("asmaalazmii_", [7_000, 5_000, 8_000, 4_000, 3_000], "Reel", [2]),
    brandsAppRate: 90,
  },

  /* ── The one HeyMoon will not place ─────────────────────────────
     The mirror of `freshgrocer.ae` on the brand side. 260,000
     followers, and it is the only person here HeyMoon has nothing for:
     61% of the grid is advertising, three posts a week with gaps, and
     under a fifth of the audience anywhere a brand ships to. Every one
     of those is a thing she could change, which is why the refusal can
     say what would change it instead of going quiet. A made-up handle,
     deliberately — no real person is used to illustrate a rejection. */
  {
    key: "sara.creates",
    name: "Sara Nassar",
    handle: "@sara.creates",
    bio: "Lifestyle, travel and daily vlogs. Collabs open.",
    location: "Dubai, UAE",
    based: "UAE",
    niche: "Lifestyle",
    alsoNiche: ["Travel"],
    paidShare: 61,
    accounts: [
      { platform: "Instagram", handle: "@sara.creates", followers: 260_000, medianViews: 4_800, note: "Posted to since 2016, and lately about once a week." },
    ],
    markets: [
      { code: "AE", name: "United Arab Emirates", share: 19, note: "Under a fifth, on an account based here." },
      { code: "EG", name: "Egypt", share: 17, note: "Second." },
      { code: "SA", name: "Saudi Arabia", share: 9, note: "Thin, and it is the market the brands want." },
    ],
    age: [18, 45],
    femaleShare: 58,
    perWeek: 3,
    turnaroundDays: 6,
    activeSince: 2016,
    conflicts: [],
    voice: {
      words: ["link in bio", "obsessed", "you guys", "swipe up", "code"],
      sample: "You guys I am obsessed with this. Link in bio, use my code.",
      register: "Caption-led and interchangeable. There is not much here for a brief to write in.",
    },
    posts: [],
    brandsAppRate: 0,
  },
];

/* ANY OTHER HANDLE IS READ AS A SAMPLE, AND THE READ SAYS SO.
 *
 * This used to fall back to PEOPLE[0] whole, and PEOPLE[0] is a real
 * influencer: somebody who typed their own handle was shown her name,
 * her avatar and her read as though they were theirs. The landing has
 * no Try chips any more, so typing your own handle is the likeliest
 * thing a stranger does.
 *
 * The figures are still hers, because the profile, matching and the
 * campaigns need a whole person to run on and this prototype has three.
 * Nothing that says who she is comes with them. There is no name,
 * avatar, bio or location, and no posts, since those are her
 * photographs. Every account carries the handle that was typed, and so
 * does the key, so every campaign id and code is built off that handle
 * rather than hers. `sample` goes onto the read, and the read block
 * opens with a line saying what this is.
 *
 * Her finished campaigns do come with it (`historyOf`). The dashboard's
 * payouts, drafts and activity are her fixtures whoever looks at them,
 * so a sample without her history had paid rows pointing at campaigns
 * it did not have. They arrive completed, under the typed handle's
 * codes, and the conversation never offers a completed campaign.
 *
 * Two of her lines say "she" and "hers", and on a stranger's handle
 * that guesses who typed it. The sample says "you" there instead, as
 * every other row of the read already does. */
const sampleFor = (key: string): PersonSeed => {
  const s = PEOPLE[0];
  const handle = `@${key}`;
  return {
    ...s,
    key,
    handle,
    name: undefined,
    avatar: undefined,
    bio: undefined,
    location: undefined,
    accounts: s.accounts.map((a) => ({
      ...a,
      handle,
      note: a.platform === "TikTok" ? "Where the work is, and where you sound most like yourself." : a.note,
    })),
    voice: {
      ...s.voice,
      register: "First person, unhurried, and you say the price out loud. A brief written in ad copy will not sound like you.",
    },
    posts: [],
    sample: true,
    historyOf: s.key,
  };
};

export const personFor = (handle: string): PersonSeed => {
  const key = handleKey(handle);
  return PEOPLE.find((p) => p.key === key) ?? sampleFor(key);
};

export const isSeeded = (handle: string) => PEOPLE.some((p) => p.key === handleKey(handle));

/** Followers across every account they hold. */
export const totalFollowers = (p: PersonSeed) =>
  p.accounts.reduce((n, a) => n + a.followers, 0);

/** The account that carries the work — the one with the most views,
    not the most followers. Which is the argument, in one function. */
export const mainAccount = (p: PersonSeed) =>
  [...p.accounts].sort((a, b) => b.medianViews - a.medianViews)[0];

/** The share of a following that actually turns up, on the main
    account. Followers are the denominator and nothing else. */
export const viewThrough = (p: PersonSeed) => {
  const a = mainAccount(p);
  return a.followers > 0 ? a.medianViews / a.followers : 0;
};
