/* The mock agent.

   THE ONLY FILE IN THIS PROJECT THAT KNOWS IT IS FAKE. Everything above
   it talks to `AgentTools` in types.ts, so replacing this with a real
   model changes no screen. `interpret` is the seam a language model
   replaces first: today it is regexes, and it says so.

   Two rules hold everywhere below.

   No figure without a source. Every number leaves here as a
   `Sourced<T>` with the evidence that produced it, and `<Figure>`
   refuses to draw one without.

   No tool accepts, signs or publishes. `request_accept` and
   `request_send` return a REQUEST. Turning one into an agreement is a
   click, and the click lives in the store. */

import {
  Cancelled, sourced,
  type AcceptRequest, type AdReview, type Cadence, type CheckKey, type CheckLine, type CreatorRead,
  type Decision, type Deliverable, type Draft, type Evidence, type Format, type Interpretation, type MarketRead,
  type Offer, type Platform, type Profile, type ProfileChange, type ProfilePatch,
  type ReadLayerKey, type Report, type RunContext, type SendRequest, type Sourced,
  type Submission, type ToolStream,
  CADENCES,
} from "./types";
import { chunk, costOf, settle } from "./stream";
import { rememberRead } from "./registry";
import { hash } from "./rng";
import {
  authenticity, bundleLine, byStrength, consistency, expectedOrders, FORMAT_NAME, formatsFor,
  MATCH_FLOOR, matchFor, marketFit, MEDIAN_ORDER_AED, money, orderValue, pct,
  PREQUALIFIED_CAP, SERVED_MARKETS,
} from "./model";
import { mainAccount, personFor, type PersonSeed } from "../mock/people";
import { isProfileLink, shapeProblem } from "../proof";
import { BRANDS, brandById, type BrandSeed } from "../mock/brands";

/* ------------------------------------------------------------------ */
/* Evidence helpers                                                    */
/* ------------------------------------------------------------------ */

let ev = 0;
const e = (kind: Evidence["kind"], label: string, detail: string, at?: string): Evidence =>
  ({ id: `e${ev++}`, kind, label, detail, at });

export const readIdFor = (handle: string) => `r-${handle.trim().toLowerCase().replace(/^@/, "")}`;

/* ══════════════════════════════════════════════════════════════════
   THE READ
   ══════════════════════════════════════════════════════════════════

   Nine layers. The order they arrive in is the order the work finishes
   in, not a script: the profile is one page and lands first, the last
   thirty posts need thirty fetches and land late, and the rate lands
   last because it is arithmetic on everything above it.

   Four of HeyMoon's seven agents are on this read, doing the jobs the
   product says they do — read from the creator's side rather than the
   brand's:

     MoonShot AI     Intake        the brief is the person, so it reads them
     MoonMatch AI    Matching      wants the audience, to match briefs to it
     MoonWriter AI   Creative      wants the register, to write a brief in it
     MoonSearch AI   Safety        vets the BRANDS, which is the inversion
     MoonScore AI    Optimization  prices the work

   MoonSearch is the one worth pausing on. On the brand side it vets
   creators for brand risk. Here it vets brands for creator risk: who is
   already in the grid, what that blocks, and which offer would put two
   competitors on one feed. Same agent, same job, and the creator is the
   one being protected. */

export interface ReadTask {
  key: ReadLayerKey;
  agent: string;
  role: string;
  note: string;
  produces: string;
  weight: number;
}

export const READ_TASKS: ReadTask[] = [
  { key: "identity",  agent: "MoonShot AI",   role: "Intake",       note: "Opening the profile",                           produces: "Who you are, in your own words",      weight: 1 },
  { key: "accounts",  agent: "MoonShot AI",   role: "Intake",       note: "Finding every account you hold",                produces: "Where you publish",                   weight: 2 },
  { key: "niche",     agent: "MoonMatch AI",  role: "Matching",     note: "Reading your last thirty posts",                produces: "What you are known for",              weight: 4 },
  { key: "voice",     agent: "MoonWriter AI", role: "Creative",     note: "Learning how you talk on camera",               produces: "The register a brief has to be written in", weight: 4 },
  { key: "audience",  agent: "MoonMatch AI",  role: "Matching",     note: "Finding where your audience actually is",       produces: "The markets you reach",               weight: 3 },
  { key: "reach",     agent: "MoonScore AI",  role: "Optimization", note: "Reading how your posts perform",                produces: "What your posts tend to do",          weight: 3 },
  { key: "cadence",   agent: "MoonShot AI",   role: "Intake",       note: "Timing your posts and your turnarounds",        produces: "How consistent you are",              weight: 2 },
  { key: "conflicts", agent: "MoonSearch AI", role: "Safety",       note: "Vetting your grid, and the brands already in it", produces: "Whether anything blocks a campaign",  weight: 3 },
  { key: "standing",  agent: "MoonMatch AI",  role: "Matching",     note: "Checking which brands want somebody like you",  produces: "Whether HeyMoon can place you",       weight: 3 },
];

/* ------------------------------------------------------------------ */
/* The fixtures                                                        */
/* ------------------------------------------------------------------ */

export function fullReadFor(handle: string, id: string): CreatorRead {
  const p = personFor(handle);
  const main = mainAccount(p);
  const fit = marketFit(p);
  const au = authenticity(p);
  const co = consistency(p);

  /* The best match any brand on the platform offers this person. It is
     what decides whether there is anything to build a profile for, and
     it is computed rather than asserted. */
  /* THE SAME SET THE DASHBOARD WILL SHOW. This counted every brand
     seed, which once finished campaigns existed told Mais nineteen
     campaigns wanted her when sixteen were running — and it always
     counted campaigns a creator cannot be brought at all, because they
     do not post on the platform asked for. Running, and bookable. */
  const live = BRANDS.filter((b) => !b.ended);
  const matches = live.filter((b) => bundleFor(p, b).length > 0).map((b) => matchFor(p, b));
  const best = Math.max(0, ...matches.map((m) => m.score));
  const placeable = best >= MATCH_FLOOR;
  /* Capped here as it is in offersFor, so the read and the dashboard
     say the same number. */
  const prequalified = Math.min(PREQUALIFIED_CAP, matches.filter((m) => m.level === "prequalified").length);

  const profileEv = e("profile", `${p.handle}`, `${p.accounts.length} account${p.accounts.length === 1 ? "" : "s"} under this name.`, "Read just now");
  const postsEv = e("post", "Your last 30 posts", `${p.paidShare}% of them were paid work. ${p.perWeek} a week since ${p.activeSince}.`, "Read just now");

  return {
    id,
    handle: p.handle,
    sample: p.sample,
    done: [],
    corrections: [],
    posts: p.posts,

    /* A sample has no identity to read (see personFor). The layer still
       lands, so the read keeps its nine rows, and holds only what is
       there. */
    identity: {
      name: p.name ? sourced(p.name, "The name on the profile.", [profileEv]) : undefined,
      avatar: p.avatar,
      bio: p.bio ? sourced(p.bio, "Your own bio, unedited.", [profileEv]) : undefined,
      location: p.location ? sourced(p.location, "Where you post from, off your tagged locations.", [
        e("post", "Tagged locations", `${p.location} on most of the last thirty.`),
      ]) : undefined,
    },

    accounts: sourced(
      p.accounts.map((a) => ({ ...a })),
      p.accounts.length > 1
        ? "Every account found under this name. Each one is a different audience, so each is read on its own."
        : "The one account found under this name.",
      [profileEv]
    ),

    /* WHAT A POST TENDS TO DO, not how many people follow.
       Rasha: "we don't focus on the followers... views, followers,
       reach." The layer is kept because matching needs it, and it is
       phrased as behaviour rather than as a size: whether the people
       who see a post act on it. */
    reach: sourced(
      { followers: main.followers, medianViews: main.medianViews, viewThrough: main.followers ? main.medianViews / main.followers : 0 },
      "Your posts get watched to the end and acted on, which is the part a brand can sell. HeyMoon does not match you on how many people follow you.",
      [postsEv, e("benchmark", "Across the platform", "The creators who convert best on HeyMoon are not the largest ones. They are the ones whose audience does something.")]
    ),

    audience: sourced(
      { markets: p.markets.map((m) => ({ ...m })) as MarketRead[], age: p.age, femaleShare: p.femaleShare },
      `${pct(fit)} of your audience is in a market a HeyMoon brand ships to. The rest is real, and there is nothing here to sell it.`,
      [
        e("insights", "Audience by country", p.markets.map((m) => `${m.code} ${m.share}%`).join(", ")),
        e("policy", "Where HeyMoon sells", `Brands on HeyMoon ship to ${SERVED_MARKETS.join(", ")}.`),
      ]
    ),

    niche: sourced(
      { primary: p.niche, also: p.alsoNiche, paidShare: p.paidShare },
      `Counted off your last thirty posts rather than off your bio. ${p.paidShare}% of them were paid.`,
      [postsEv, e("post", "What they are about", `${p.niche} first, then ${p.alsoNiche.join(" and ")}.`)]
    ),

    voice: sourced(
      p.voice,
      "The register a brief has to be written in. A brief that does not sound like you gets read like an ad.",
      [e("post", "Words you repeat", p.voice.words.join(" · ")), e("post", "A line of yours", `“${p.voice.sample}”`)]
    ),

    cadence: sourced(
      { perWeek: p.perWeek, turnaroundDays: p.turnaroundDays, activeSince: p.activeSince },
      `${p.perWeek} posts a week since ${p.activeSince}, and you turn a brief around in about ${p.turnaroundDays} days. Consistency is one of the four things matching actually reads.`,
      [e("post", "Posting rhythm", `${p.perWeek} a week across the last three months.`)]
    ),

    conflicts: sourced(
      p.conflicts.map((c) => ({ ...c })),
      p.conflicts.length
        ? "Brands already in your grid. MoonSearch AI will not send you a campaign that puts a competitor next to one of these."
        : "Nothing in your grid blocks a campaign, and nothing in it fails a brand's safety check.",
      p.conflicts.length
        ? p.conflicts.map((c) => e("post", c.brand, `${c.standing}. Blocks ${c.blocks.join(", ")}.`))
        : [e("post", "Your last 30 posts", "No standing brand relationship, and nothing a brand would refuse to sit beside.")]
    ),

    /* THE QUALIFICATION, in influence terms. */
    standing: {
      best: sourced(best, "The strongest match any brand on the platform has for somebody like you.", [
        e("platform", "Brands live today", "Every campaign running today, read against what matching weighs."),
        e("policy", "What matching reads", "Where your audience is, how much of your grid is already advertising, how consistently you post, and who the brand asked for. Audience size is not one of them."),
      ]),
      strengths: sourced(
        [
          fit >= 0.5 ? `${pct(fit)} of your audience is where HeyMoon's brands sell.` : `${pct(fit)} of your audience is where HeyMoon's brands sell, which is thin.`,
          au >= 0.5 ? `Only ${p.paidShare}% of your grid is advertising.` : `${p.paidShare}% of your grid is already advertising.`,
          co >= 0.6 ? `${p.perWeek} posts a week since ${p.activeSince}.` : `${p.perWeek} posts a week, which is light for a campaign with a schedule.`,
        ],
        "The things carrying you, in the order matching weighs them.",
        [postsEv]
      ),
      state: placeable ? "ok" : "thin",
      line: sourced(
        placeable
          /* The campaigns this person can act on, never the count of
             everything running: the conversation hands over three, and
             a larger number here is the rest of the list by the back
             door. */
          ? prequalified
            ? `You're Pre-qualified for ${prequalified} ${prequalified === 1 ? "campaign" : "campaigns"} running today.`
            : "Campaigns running today fit you. Each one is a request to join that the brand answers."
          : `No campaign running today is a fit for you yet.`,
        placeable ? "The one line that decides whether there is anything to build." : "Said here rather than at the end of it.",
        [e("platform", "Matched against", "Every live campaign.")]
      ),
      wouldChangeIt: placeable ? undefined : [
        `An audience in the Gulf. HeyMoon's brands ship to ${SERVED_MARKETS.length} countries, and ${pct(fit)} of yours is in them.`,
        `Less advertising in the grid. ${p.paidShare}% of your last thirty were paid, and a feed that is mostly ads converts worse than a smaller one that is not.`,
      ],
    },
  };
}

/* ------------------------------------------------------------------ */
/* read_profile                                                        */
/* ------------------------------------------------------------------ */

async function* read_profile(i: { handle: string }, ctx: RunContext): ToolStream<CreatorRead> {
  const id = readIdFor(i.handle);
  const full = fullReadFor(i.handle, id);
  rememberRead(full);
  /* `sample` from the first chunk, because the line saying so has to be
     on screen before any of the sample's figures are. */
  const acc: CreatorRead = { id: full.id, handle: full.handle, sample: full.sample, done: [], corrections: [], posts: full.posts };

  let total = 4;
  let done = 0;
  yield chunk({ ...acc }, `${READ_TASKS[0].agent} · Opening ${full.handle}`, done, total);

  for (let n = 0; n < READ_TASKS.length; n++) {
    const unit = READ_TASKS[n];
    if (ctx.signal.aborted) throw new Cancelled();
    if (n === 3) total = READ_TASKS.length;
    await settle(costOf(`${id}:${unit.key}`, unit.weight), ctx.signal);
    (acc as unknown as Record<string, unknown>)[unit.key] =
      (full as unknown as Record<string, unknown>)[unit.key];
    acc.done = [...acc.done, unit.key];
    done += 1;
    yield chunk({ ...acc }, `${unit.agent} · ${unit.note}`, done, total);
  }
  return acc;
}

/* ══════════════════════════════════════════════════════════════════
   THE PROFILE
   ══════════════════════════════════════════════════════════════════ */

/* ------------------------------------------------------------------ */
/* The welcome — what a person would say, looking at the read          */
/* ------------------------------------------------------------------ */

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** THE LINE AFTER THE READ, said the way somebody would say it with the
    creator's profile open on their phone: you are a fit, and here is
    why, in the two things matching weighs most. Only on a read that can
    be placed, and only the facts that are actually strong. */
function welcome_line(i: { read: CreatorRead }): string {
  const p = personFor(i.read.handle);
  const first = i.read.sample ? undefined : p.name?.split(/\s+/)[0];
  const fit = marketFit(p, SERVED_MARKETS);
  const why: string[] = [];
  if (fit >= 0.5) why.push(`${pct(fit)} of your audience is where the brands here sell`);
  if (p.paidShare <= 40) why.push(`only ${p.paidShare}% of your grid is ads`);
  const reason = why.length ? ` ${cap(why.join(", and "))}.` : "";
  return `${first ? `${first}, you're` : "You're"} a good fit for HeyMoon.${reason} That is exactly what brands here pay for.`;
}

export interface PlatformStat {
  key: string;
  value: string;
  label: string;
  /** Not HeyMoon's own figure yet: shown as a sample in the prototype,
      and marked as one, until the real number replaces it. */
  sample?: true;
}

/** HEYMOON, IN A FEW NUMBERS — the introduction Alex asked for after the
    read (28 Sep review): what somebody would tell a creator about the
    platform in person. Both are about other creators, and both are
    samples until there is a real one. */
function platform_stats(): PlatformStat[] {
  return [
    { key: "paid", value: "2,400+", label: "creators paid through HeyMoon", sample: true },
    { key: "month", value: "$640", label: "a month, the median for creators with an audience like yours", sample: true },
  ];
}

export interface BuildTask {
  key: string;
  agent: string;
  role: string;
  note: string;
  produces: string;
  weight: number;
}

export const BUILD_TASKS: BuildTask[] = [
  { key: "authority", agent: "MoonShot AI",   role: "Intake",       note: "Setting what you are known for",          produces: "Your category",             weight: 3 },
  { key: "avail",     agent: "MoonShot AI",   role: "Intake",       note: "Setting how much work you can take",      produces: "Your availability",         weight: 2 },
  { key: "safety",    agent: "MoonSearch AI", role: "Safety",       note: "Blocking the categories you cannot take", produces: "Your no-list",              weight: 3 },
  { key: "match",     agent: "MoonMatch AI",  role: "Matching",     note: "Matching you to live campaigns",          produces: "The campaigns that fit you", weight: 5 },
];

/** The default no-list. Four categories HeyMoon blocks unless asked,
    because taking one of them makes the others stop offering. */
export const DEFAULT_NO = ["Gambling", "Vaping and tobacco", "Cosmetic surgery", "Crypto and trading"];

export function profileFor(read: CreatorRead, id = `profile-${read.id}`): Profile {
  const p = personFor(read.handle);
  const fit = marketFit(p);
  const postsEv = e("post", "Your last 30 posts", `${p.paidShare}% paid. ${p.perWeek} a week since ${p.activeSince}.`);
  const perMonth = Math.max(1, Math.min(8, Math.round(p.perWeek * 4 * 0.3)));

  return {
    id,
    readId: read.id,
    creatorName: p.name,
    handle: p.handle,
    avatar: p.avatar,

    authority: sourced(
      { primary: p.niche, also: p.alsoNiche },
      `What brands will come to you for. Read off what you actually post, not off your bio.`,
      [postsEv]
    ),

    /* The influence signals, as sentences. No count of anything a
       creator could inflate by buying it. */
    influence: sourced(
      [
        `${pct(fit)} of your audience is in a market HeyMoon's brands sell into.`,
        `${100 - p.paidShare}% of your grid is your own work rather than advertising.`,
        `${p.perWeek} posts a week, every week since ${p.activeSince}.`,
        `About ${p.turnaroundDays} days from a brief to a finished cut.`,
      ],
      "The four things matching reads. Audience size is not one of them, and a larger following moves none of these.",
      [postsEv, e("policy", "How matching works", "Where your audience is, how much of your grid is advertising, how consistently you post, and who the brand asked for.")]
    ),

    availability: sourced(
      { perMonth, turnaroundDays: p.turnaroundDays, based: p.based },
      `${perMonth} paid deliverables a month, at ${p.perWeek} posts a week. Under a third of your grid, so the rest stays yours.`,
      [e("post", "Posting rhythm", `${p.perWeek} posts a week.`),
       e("benchmark", "What a feed carries", "Past about a third paid, the audience stops believing it and the campaigns stop converting.")]
    ),

    noList: sourced(
      { categories: DEFAULT_NO, note: null },
      "Four categories HeyMoon blocks by default. Take work in one of these and other brands stop bringing you campaigns. Say the word and it will match you to them.",
      [e("policy", "The default block", DEFAULT_NO.join(" · "))]
    ),

    platforms: sourced(
      p.accounts.map((a) => a.platform) as Platform[],
      "Where you actually publish.",
      [e("profile", "Accounts", p.accounts.map((a) => `${a.platform} ${a.handle}`).join(" · "))]
    ),

    audience: sourced(
      { markets: p.markets.filter((m) => SERVED_MARKETS.includes(m.code)).map((m) => m.code), age: p.age, femaleShare: p.femaleShare },
      `${pct(fit)} of your audience is somewhere a HeyMoon brand ships to.`,
      [e("insights", "Audience by country", p.markets.map((m) => `${m.code} ${m.share}%`).join(", "))]
    ),

    changes: [],
  };
}

async function* propose_profile(i: { read: CreatorRead }, ctx: RunContext): ToolStream<Profile> {
  const finished = profileFor(i.read);
  const acc: Profile = { ...finished, changes: [] };
  let done = 0;
  for (const task of BUILD_TASKS) {
    if (ctx.signal.aborted) throw new Cancelled();
    await settle(costOf(`${i.read.id}:${task.key}`, task.weight), ctx.signal);
    done += 1;
    yield chunk({ ...acc }, `${task.agent} · ${task.note}`, done, BUILD_TASKS.length);
  }
  return acc;
}

/* ------------------------------------------------------------------ */
/* Building one campaign for one creator                               */
/* ------------------------------------------------------------------ */

function bundleFor(p: PersonSeed, b: BrandSeed, added: Platform[] = []): Deliverable[] {
  const bookable = new Set(formatsFor(p, added));
  return b.asks
    .filter((a) => bookable.has(a.format as Format))
    .map((a) => ({ platform: a.platform as Platform, format: a.format as Format, count: a.count }));
}

const bundleCount = (d: Deliverable[]) => d.reduce((n, x) => n + x.count, 0);

const brandCategory = (b: BrandSeed) =>
  b.family === "beauty" ? "Multi-brand beauty" : b.family === "grocery" ? "Grocery" : "Fashion";

function offerFrom(p: PersonSeed, b: BrandSeed, added: Platform[] = []): Offer | null {
  /* A FINISHED CAMPAIGN IS HISTORY, and only the people who did it have
     it. It is brought to them as completed and to nobody else — there
     is nothing left to join. The sample's history is the sample
     creator's (see personFor). */
  if (b.ended && !b.ended.creators.includes(p.historyOf ?? p.key)) return null;
  const match = matchFor(p, b);
  /* A WEAK MATCH IS STILL A CAMPAIGN, and this used to return null for
     one — which meant Alex's "less matching could be 'see other
     campaigns'" had nothing behind it to see. A weak match is brought,
     listed under every campaign rather than featured, and never counted
     as a campaign that wants this creator.
     A score of zero is different: the brand does not buy this category
     at all, so there is no campaign to bring. */
  if (!b.ended && match.score <= 0) return null;

  const deliverables = bundleFor(p, b, added);
  if (!deliverables.length) return null;

  const count = bundleCount(deliverables);
  const orders = expectedOrders(p, b, count);
  const conflict = p.conflicts.find((c) => (b.clashesWith ?? []).includes(c.brand) || c.blocks.includes(brandCategory(b)));

  const evBrand = e("brand", b.name, `${b.line} Phase ${b.phaseNo}, ${b.phaseName.toLowerCase()}.`);
  const evBench = e("benchmark", "Orders per campaign", `How often ${b.family} campaigns on HeyMoon turn a post into orders, across the creators who have run them. The median order is ${money(orderValue(b.family))}.`);
  const evBundle = e("contract", "What it asks for", deliverables.map((d) => `${d.count} x ${FORMAT_NAME[d.format]}`).join(" · "));

  const tag = b.name.split(/\s+/).length > 1
    ? b.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase()
    : b.name.slice(0, 2).toUpperCase();
  /* The code opens with the creator's first name. A sample has none, so
     its code comes off the handle that was typed: "MAIS-OU" on
     somebody else's campaign would be her name by another route. */
  const first = (p.name ? p.name.split(" ")[0] : p.key.replace(/[^a-z0-9]/g, "")).toUpperCase().slice(0, 4) || "YOU";
  const closes = b.closesInDays ?? (b.phaseNo === 1 ? 4 : 6);

  return {
    id: `o-${b.id}-${p.key}`,
    brand: b.name,
    brandLogo: b.logo,
    title: b.title,
    pitch: b.pitch,
    product: b.product,
    family: b.family,
    image: b.image,
    phaseNo: b.phaseNo,
    phaseName: b.phaseName,

    match,

    platforms: Array.from(new Set(deliverables.map((d) => d.platform))),
    duration: b.duration,
    countries: b.markets,
    targetAge: b.targetAge,
    targetGender: b.targetGender,
    deliverables,

    payKind: "postpaid",
    commissionPct: b.perOrderPct ?? 10,
    orders: sourced(orders, `What HeyMoon expects this campaign to carry for you across ${count} deliverable${count === 1 ? "" : "s"}. A forecast, and the calculator lets you move it.`, [evBench, evBundle, evBrand], {
      computedFrom: `${count} deliverables, ${pct(marketFit(p, b.markets))} of your audience in ${b.name}'s markets, at what ${b.family} campaigns convert at = ${orders.mid} orders expected, ${orders.low} to ${orders.high}`,
    }),
    bonus: b.bonus && !b.ended ? { label: b.bonus.label, within: b.bonus.within, why: b.bonus.why } : undefined,
    code: `${first}-${b.codeTag ?? tag}`,
    trackingLink: `heymoon.ai/${first.toLowerCase()}/${b.id}`,

    brief: {
      headline: sourced(`${b.line.replace(/\.$/, "")}, in your words.`, "What the brief is for.", [evBrand]),
      mustSay: sourced(b.mustSay, "The lines attribution runs through. Miss one and the order is not counted to you, which on a performance campaign means it pays nothing.", [e("contract", "The brief", b.mustSay.join(" · "))]),
      mustNotSay: sourced(b.mustNot, "What the brand will not have in frame.", [e("contract", "The brief", b.mustNot.join(" · "))]),
      formats: sourced(deliverables.map((d) => `${d.count} x ${FORMAT_NAME[d.format]} on ${d.platform}`), "The bundle, as the brand asked for it.", [evBundle]),
      tone: sourced(p.voice.register, "Yours. MoonWriter AI read your last thirty captions for it.", [e("post", "Words you repeat", p.voice.words.join(" · "))]),
    },
    conflict: conflict ? { brand: conflict.brand, detail: `${conflict.standing}. It blocks ${conflict.blocks.join(", ")}, and this campaign is ${brandCategory(b).toLowerCase()}.` } : undefined,
    caveat: !b.ended && match.level === "strong" ? reviewCaveat(b.name) : undefined,

    state: b.ended ? "completed" : "open",
    closesInDays: b.ended ? null : closes,
    expires: b.ended ? `Ended ${b.ended.closed}` : `${closes} day${closes === 1 ? "" : "s"}`,
  };
}

const reviewCaveat = (brand: string) => `${brand} reviews requests to join this one, so it is not an instant yes.`;

/** The campaigns behind a profile, strongest match first — three of
    them pre-qualified at most, every other one a request to join. */
export function offersFor(profile: Profile): Offer[] {
  const p = personFor(profile.handle);
  /* Platforms the creator added themselves count as ones they post on. */
  const added = profile.platforms.value;
  const no = new Set(profile.noList.value.categories.map((c) => c.toLowerCase()));
  const platforms = new Set(profile.platforms.value);
  const all = BRANDS
    .map((b) => offerFrom(p, b, added))
    .filter((o): o is Offer => !!o)
    .filter((o) => !no.has(o.brand.toLowerCase()))
    /* A campaign asking only for platforms the creator has switched off
       is not a campaign for them. */
    .filter((o) => o.platforms.some((pl) => platforms.has(pl)))
    /* Score first, then the tie-break documented beside the cap. The
       order of BRANDS never decides which three keep pre-qualified. */
    .sort(byStrength);

  /* THE CAP (see PREQUALIFIED_CAP). Ranked after the no-list and the
     platform filter, because a campaign the creator cannot be brought
     should not use up one of the three. Finished campaigns are history
     and never rank. Everything past the third keeps its score and its
     signals and becomes a strong match: a request the brand answers,
     which decide() approves as it would any other strong match. */
  let kept = 0;
  return all.map((o) => {
    if (o.state === "completed" || o.match.level !== "prequalified") return o;
    if (kept++ < PREQUALIFIED_CAP) return o;
    return { ...o, match: { ...o.match, level: "strong" as const }, caveat: reviewCaveat(o.brand) };
  });
}

/** The platforms any campaign running today asks for. A platform with
    none is still worth adding — the next campaign on it can find you —
    but the profile says so, rather than implying campaigns will come. */
export const platformsAsked = (): Platform[] =>
  Array.from(new Set(BRANDS.filter((b) => !b.ended).flatMap((b) => b.asks.map((a) => a.platform as Platform))));

async function* match_offers(i: { profile: Profile; limit?: number }, ctx: RunContext): ToolStream<Offer[]> {
  /* No default cap. A limit here silently truncated the weak tail, which
     is the half "All campaigns" exists to show. */
  const all = offersFor(i.profile);
  /* History is not a match, so it is not streamed as one — the working
     line would say "MoonMatch AI · Luna Beauty" about a campaign that
     finished last month. It rides along in the return value instead. */
  const past = all.filter((o) => o.state === "completed");
  const live = all.filter((o) => o.state !== "completed");
  const pool = i.limit ? live.slice(0, i.limit) : live;
  const out: Offer[] = [];
  for (let n = 0; n < pool.length; n++) {
    if (ctx.signal.aborted) throw new Cancelled();
    /* A match is a small unit and there are a lot of them now. At the
       old weight of 2 each one took 1–1.75s, which was fine for five
       campaigns and would be twenty seconds for sixteen. Half a
       weightless unit keeps the whole match at about five seconds. */
    await settle(Math.round(costOf(`${i.profile.id}:offer${n}`, 0) * 0.5), ctx.signal);
    out.push(pool[n]);
    yield chunk([...out], `MoonMatch AI · ${pool[n].brand}`, n + 1, pool.length);
  }
  return [...out, ...past];
}

/* ------------------------------------------------------------------ */
/* edit_profile — the only way the profile changes                     */
/* ------------------------------------------------------------------ */

let changeSeq = 0;
const change = (
  field: ProfileChange["field"], label: string, from: string, to: string,
  because: string, by: "agent" | "creator", detail?: string
): ProfileChange => ({ id: `ch-${changeSeq++}`, field, label, from, to, because, detail, by, at: Date.now() });

/** What a change did to the campaigns on the table. The sentence that
    makes a choice a decision rather than a preference. */
function offersDelta(before: Profile, after: Profile): string | undefined {
  const a = offersFor(before).map((o) => o.brand);
  const b = offersFor(after).map((o) => o.brand);
  const gone = a.filter((x) => !b.includes(x));
  const came = b.filter((x) => !a.includes(x));
  const bits: string[] = [];
  if (gone.length) bits.push(`${gone.join(" and ")} ${gone.length === 1 ? "is" : "are"} no longer on your list.`);
  if (came.length) bits.push(`${came.join(" and ")} came back.`);
  return bits.length ? bits.join(" ") : undefined;
}

function edit_profile(i: { profile: Profile; patch: ProfilePatch; because: string; by: "agent" | "creator" }) {
  const profile: Profile = { ...i.profile };
  const changes: ProfileChange[] = [];

  if (i.patch.perMonth !== undefined) {
    const was = profile.availability.value.perMonth;
    profile.availability = { ...profile.availability, value: { ...profile.availability.value, perMonth: i.patch.perMonth }, setBy: i.by === "creator" ? "creator" : "agent" };
    changes.push(change("availability", "Deliverables a month", String(was), String(i.patch.perMonth), i.because, i.by));
  }

  if (i.patch.turnaroundDays !== undefined) {
    const was = profile.availability.value.turnaroundDays;
    profile.availability = { ...profile.availability, value: { ...profile.availability.value, turnaroundDays: i.patch.turnaroundDays }, setBy: i.by === "creator" ? "creator" : "agent" };
    changes.push(change("availability", "Turnaround", `${was} days`, `${i.patch.turnaroundDays} days`, i.because, i.by));
  }

  if (i.patch.addNo?.length || i.patch.dropNo?.length) {
    const was = profile.noList.value.categories;
    const next = Array.from(new Set([...was, ...(i.patch.addNo ?? [])]))
      .filter((c) => !(i.patch.dropNo ?? []).some((d) => d.toLowerCase() === c.toLowerCase()));
    profile.noList = { ...profile.noList, value: { ...profile.noList.value, categories: next }, setBy: "creator" };
    changes.push(change("noList", "Your no-list", `${was.length} categories`, `${next.length} categories`, i.because, i.by,
      (i.patch.addNo ?? []).length ? `Added ${(i.patch.addNo ?? []).join(", ")}.` : `Removed ${(i.patch.dropNo ?? []).join(", ")}.`));
  }

  if (i.patch.platforms) {
    const was = profile.platforms.value;
    profile.platforms = { ...profile.platforms, value: i.patch.platforms, setBy: "creator" };
    changes.push(change("platforms", "Platforms", was.join(", "), i.patch.platforms.join(", "), i.because, i.by,
      offersDelta(i.profile, profile)));
  }

  profile.changes = [...profile.changes, ...changes];
  return { profile, changes };
}

/* ------------------------------------------------------------------ */
/* Requests — never completions                                        */
/* ------------------------------------------------------------------ */

function request_accept(i: { offer: Offer; cadence?: Cadence }): AcceptRequest {
  const o = i.offer;
  const cadence = i.cadence ?? "3pw";
  const per = CADENCES.find((c) => c.key === cadence)!;
  const total = o.deliverables.reduce((n, d) => n + d.count, 0);
  const weeks = Math.ceil(total / per.perWeek);
  return {
    /* Derived from the campaign, so pressing Join twice produces the
       same id and a fresh pending request cannot land on a confirmed
       one and un-submit an application. */
    id: `acc-${o.id}`,
    offerId: o.id,
    brand: o.brand,
    campaign: o.title,
    commissionPct: o.commissionPct,
    needsApproval: o.match.level !== "prequalified",
    deliverables: o.deliverables,
    cadence,
    duration: o.duration,
    commits: [
      `${bundleLine(o.deliverables)}, at ${per.label.toLowerCase()}. About ${weeks} week${weeks === 1 ? "" : "s"} of posting.`,
      `The brief as written, including the lines attribution runs through.`,
      `One re-cut if ${o.brand} asks for changes, inside 48 hours.`,
    ],
    notCommits: [
      `Nothing exclusive. You can take other work in this category tomorrow.`,
      `No usage past 90 days. ${o.brand} cannot run this as an ad after that without asking you again.`,
      `No say over your other posts, paid or not.`,
      `Nothing about a minimum. This pays ${o.commissionPct}% of every order you bring in, so a quiet week pays less and a good one pays more.`,
    ],
    state: "pending",
  };
}

/** The brand's answer. In a real product this arrives days later from
    the brand's own console; here it is deterministic off the campaign
    id, so the demo can be repeated and a screenshot can be trusted. */
export function decide(o: Offer, cadence: Cadence): Decision {
  /* A pre-qualified campaign has no decision to make: HeyMoon already
     cleared it, and Alex's word for that is "pre-qualified... just say
     join". Only an application reaches a brand. */
  if (o.match.level === "prequalified") {
    return { offerId: o.id, outcome: "approved", at: "Today", cadence, duration: o.duration };
  }
  /* A WEAK MATCH IS REFUSED, and it has to be: bringing a campaign a
     creator can apply to and then approving it anyway would make the
     match levels decoration. The reason names the signal that was
     short rather than going quiet. */
  if (o.match.level === "weak") {
    const short = o.match.signals.filter((sg) => !sg.strong)[0];
    return {
      offerId: o.id,
      outcome: "rejected",
      at: "Today",
      cadence,
      duration: o.duration,
      because: `${o.brand} passed. ${short ? `${short.label.charAt(0).toLowerCase()}${short.label.slice(1)} is the one that did not line up — ${short.detail}` : "The fit was not close enough on what they asked for."} Nothing about it is final: the same campaign is matched again every time your grid changes.`,
    };
  }

  /* Every other seeded campaign approves. A rejection path exists in the
     design and in the type, and inventing a random refusal would make
     the demo unrepeatable — so the one campaign that refuses does it
     for a stated reason rather than by dice. */
  const refuses = o.brand === "FreshGrocer";
  return refuses
    ? {
        offerId: o.id,
        outcome: "rejected",
        at: "Today",
        cadence,
        duration: o.duration,
        because: "FreshGrocer only runs creators who have shot food before, and there is none in your last thirty. It is a gap in your grid rather than a judgement on the work, and MoonMatch AI will stop sending you grocery campaigns unless you tell it otherwise.",
      }
    : { offerId: o.id, outcome: "approved", at: "Today", cadence, duration: o.duration };
}

function request_send(i: { draftIds: string[] }): SendRequest {
  const drafts = DRAFTS.filter((d) => i.draftIds.includes(d.id));
  return {
    id: `send-${i.draftIds.join("-")}`,
    draftIds: i.draftIds,
    summary: drafts.map((d) => ({
      draftId: d.id,
      verdict: d.check.verdict,
      line:
        d.check.verdict === "send" ? `Clean against the brief. I would send it.`
        : d.check.verdict === "send-with-note" ? `One soft miss. Send it with a note, or re-cut.`
        : `${d.check.checks.filter((c) => !c.clean).length} things the brief asks for are missing. Fix first.`,
    })),
    state: "pending",
  };
}

/* ------------------------------------------------------------------ */
/* Work in flight                                                      */
/* ------------------------------------------------------------------ */

const draftEv = (label: string, detail: string) => [e("contract", label, detail)];

/* THE SEVEN CHECKS.

   These are the mobile design's own Pre-upload Check, line for line —
   Product Intro, Quality and Lighting, Review and Styling, Price
   Transparency, Code Visibility, Link Distribution, Brand Tagging.
   There they are seven boxes a creator ticks about their own work.
   Here MoonWriter AI reads the cut against them and says which ones it
   cannot find, with the timecode.

   Four drafts, one in each state that matters. The second is the one
   the product exists for: two misses, both fixable, both caught before
   the brand saw anything. */
export const CHECK_NAMES = [
  "Product intro", "Quality and lighting", "Review and styling",
  "Price transparency", "Code visibility", "Link distribution", "Brand tagging",
] as const;

export const DRAFTS: Draft[] = [
  {
    id: "d-1", offerId: "o-ounass-mais.mustafa", brand: "Ounass",
    product: "Structured leather tote", format: "TikTok", platform: "TikTok",
    img: "/ads/palm-ounass-clutch.jpg", video: "/ads/palm-ounass-clutch.mp4",
    caption: "Three days of carrying this and here is the honest verdict. Code MAIS-OU at checkout, free returns for 14 days.",
    dueIn: "2 days", state: "checking",
    check: {
      checks: [
        { label: "Product intro", detail: "The tote is in frame at 0:02, inside the three seconds the brief asks for.", clean: true },
        { label: "Quality and lighting", detail: "Daylight throughout. No clipping on the leather.", clean: true },
        { label: "Review and styling", detail: "Styled twice, and you say what you would not wear it with. That is the honest take the brief asked for.", clean: true },
        { label: "Price transparency", detail: "Price said at 0:11 and the saving shown against it.", clean: true },
        { label: "Code visibility", detail: "MAIS-OU on screen 0:14 to 0:20. Six seconds against the five the brief asks for.", clean: true },
        { label: "Link distribution", detail: "Tracking link in the caption.", clean: true },
        { label: "Brand tagging", detail: "@ounass tagged, campaign hashtag present.", clean: true },
      ],
      verdict: "send",
      reasoning: sourced(
        "Seven out of seven. I would send this.",
        "Checked against the brief MoonWriter AI wrote for this seat, line by line.",
        draftEv("Ounass brief, Phase 2", "Code five seconds - free returns - nothing competing in frame")
      ),
    },
  },
  {
    id: "d-2", offerId: "o-maison-mais.mustafa", brand: "Maison Dune",
    product: "Linen resort set", format: "TikTok", platform: "TikTok",
    img: "/ads/memz-ounass-story.jpg", video: "/ads/memz-ounass-story.mp4",
    caption: "Wore this three days straight in Ras Al Khaimah. Honestly the fit is the whole thing.",
    dueIn: "4 days", state: "checking",
    check: {
      checks: [
        { label: "Product intro", detail: "The set is on camera at 0:01.", clean: true },
        { label: "Quality and lighting", detail: "Golden hour, clean audio.", clean: true },
        { label: "Review and styling", detail: "Two looks, and your own verdict on the fit.", clean: true },
        { label: "Price transparency", detail: "The price is never said, and the fabric is in the caption rather than on camera. The brief asks for both out loud.", clean: false, fix: "One line to camera: the price, and the word linen. Six seconds anywhere in the first half." },
        { label: "Code visibility", detail: "MAIS-MD is not in the video and not in the caption.", clean: false, fix: "Put it in the caption and hold it on screen once. Every order is attributed through that code, so without it the work is not counted to you and the seat pays nothing." },
        { label: "Link distribution", detail: "No tracking link in the bio or the caption.", clean: false, fix: "Paste the link from the brief into your caption. Ten seconds of work." },
        { label: "Brand tagging", detail: "@maisondune tagged in the caption.", clean: true },
      ],
      verdict: "fix-first",
      reasoning: sourced(
        "Three misses, and one of them is the code. Without the code the sales are not attributed to you, so this is your money rather than their paperwork. Maison Dune has not seen this and will not until you send it.",
        "Run before the brand sees it. A miss caught here costs a re-cut; the same miss caught there is a decline on your record.",
        draftEv("Maison Dune brief, Phase 2", "Fabric by name - the code - the link - nothing sheer")
      ),
    },
  },
  {
    id: "d-3", offerId: "o-luna-mais.mustafa", brand: "Luna Beauty",
    product: "Barrier repair serum", format: "TikTok", platform: "TikTok",
    img: "/ads/cosmo-ounass-story.jpg", video: "/ads/cosmo-ounass-story.mp4",
    caption: "Fourteen days on this one. Skin is calmer, that is all I am claiming. Code MAIS-LB.",
    dueIn: "Sent 2 days ago", state: "sent",
    check: {
      checks: [
        { label: "Product intro", detail: "Bottle in frame at 0:02.", clean: true },
        { label: "Quality and lighting", detail: "Day 1 and day 14 shot in the same light, which is what makes the comparison mean anything.", clean: true },
        { label: "Review and styling", detail: "Fourteen days shown, as the brief asked.", clean: true },
        { label: "Price transparency", detail: "Price and the code saving both said.", clean: true },
        { label: "Code visibility", detail: "MAIS-LB on screen at 0:19.", clean: true },
        { label: "Link distribution", detail: "Link in bio, named in the video.", clean: true },
        { label: "Brand tagging", detail: "@lunabeauty tagged.", clean: true },
      ],
      verdict: "send",
      reasoning: sourced(
        "Sent to Luna Beauty two days ago. Nothing outstanding on your side.",
        "Checked clean before it went. No medical claim anywhere in it, which is the line Luna cares most about.",
        draftEv("Luna Beauty brief, Phase 1", "Fourteen days - no medical claims - the code")
      ),
    },
  },
  {
    /* The finished Luna campaign's post — the one that carried the 19
       orders the ledger paid for. It used to point at Luna's CURRENT
       campaign, which in a fresh session is still open to join. */
    id: "d-4", offerId: "o-luna-diaries-mais.mustafa", brand: "Luna Beauty",
    product: "Barrier repair serum", format: "TikTok", platform: "TikTok",
    img: "/ads/noon-ounass-tiktok.jpg",
    caption: "Day 14 of the serum. Code MAIS-LBD, link in bio.",
    dueIn: "Live", state: "live",
    check: {
      checks: [{ label: "Approved by Luna Beauty", detail: "Approved four days ago, published the same day.", clean: true }],
      verdict: "send",
      reasoning: sourced("Live since Tuesday.", "Published after Luna Beauty approved it.", draftEv("Luna Beauty", "Approved four days ago")),
    },
    performance: {
      /* Read, and not led on. `views` is here because the matching
         model uses it; what the creator is shown is orders. */
      views: sourced(31_400, "Views on the post, from the platform.", [e("insights", "TikTok", "31,400 views, above the 18,900 a post of yours usually does.")]),
      orders: sourced(19, "Orders attributed to your code.", [e("platform", "MAIS-LBD", "19 orders carried the code, against the 7 to 23 MoonScore AI expected.")]),
    },
  },
];

async function* check_draft(i: { draft: Draft }, ctx: RunContext): ToolStream<Draft["check"]> {
  const acc: Draft["check"] = { checks: [], verdict: i.draft.check.verdict, reasoning: i.draft.check.reasoning };
  const all = i.draft.check.checks;
  for (let n = 0; n < all.length; n++) {
    if (ctx.signal.aborted) throw new Cancelled();
    await settle(costOf(`${i.draft.id}:c${n}`, 2), ctx.signal);
    acc.checks = [...acc.checks, all[n]];
    yield chunk({ ...acc }, `MoonWriter AI · ${all[n].label}`, n + 1, all.length);
  }
  return i.draft.check;
}

function list_drafts(i: { state?: Draft["state"] }) {
  return i.state ? DRAFTS.filter((d) => d.state === i.state) : DRAFTS;
}

/* ------------------------------------------------------------------ */
/* Submitting an ad                                                    */
/* ------------------------------------------------------------------ */

/** The brand's handle, the way every brief in the seed tags it:
    "@maisondune", "@ounass". */
export const brandHandle = (brand: string) => `@${brand.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* THE PRE-UPLOAD CHECK, written from this campaign's brief.
 *
 * The design's seven boxes, in its order and under its names, with the
 * brief's own particulars in them — the product, the code, the link,
 * the brand to tag, and whatever else the brand asked to hear. The
 * creator ticks every one before an ad can be submitted: it is their
 * word that the ad carries them, and the check on a submitted ad is
 * against the same seven. */
function pre_upload_check(i: { offer: Offer }): CheckLine[] {
  const o = i.offer;
  /* The brief's must-say lines, less the ones about the code, which has
     its own line below. */
  const say = o.brief.mustSay.value.filter((s) => !/\bcode\b/i.test(s)).map(lower);
  return [
    { key: "intro", label: "Product intro", detail: `Show the ${lower(o.product)} in the first three seconds, before anything else.` },
    { key: "light", label: "Quality and lighting", detail: "Clear, natural light, so the detail reads on a phone." },
    { key: "review", label: "Review and styling", detail: say.length ? `Your honest take, in your words, and what ${o.brand} asked to hear: ${say.join("; ")}.` : "Your honest take, in your words. Styled the way you would actually use it." },
    { key: "price", label: "Price transparency", detail: `Say the price, and show what ${o.code} saves.` },
    { key: "code", label: "Code visibility", detail: `${o.code} on screen, clearly, for five seconds. Every order is counted to you through it.` },
    { key: "link", label: "Link distribution", detail: `Your tracking link in your bio or on a story sticker: ${o.trackingLink}.` },
    { key: "tag", label: "Brand tagging", detail: `Tag ${brandHandle(o.brand)} in the caption.` },
  ];
}

/* WHAT IS CHECKED FIRST, if a line ever arrives unconfirmed. The code
   and the link are how the orders are counted, so an ad without them
   cannot be paid on however good it is; the rest is what the brief
   asked the ad to carry. */
const VERIFY_ORDER: CheckKey[] = ["code", "link", "tag", "intro", "price", "review", "light"];

/** THE CHECK ON A SUBMITTED AD: is it up, and does it carry what the
    brief asks for. Not a brand deciding whether it may run — it already
    has. Deterministic, like `decide`, so the demo can be repeated, and
    it only sends an ad back for something it can actually read: a line
    of the check left unconfirmed, a link that opens a profile rather
    than the post, or a video in the wrong shape or length for its
    format (see lib/proof.ts). Anything else is accepted — this cannot
    watch the ad, and will not pretend to have found something in it. */
function verify_ad(i: { submission: Submission; offer: Offer }): AdReview {
  const s = i.submission, o = i.offer;
  const missed = VERIFY_ORDER.find((k) => !s.checked.includes(k));
  if (missed) {
    const note: Record<CheckKey, string> = {
      code: `${o.code} isn't confirmed in the ad. Put it on screen or in the caption, then submit it again, so the orders are counted to you.`,
      link: "Your tracking link isn't confirmed in your bio or on a sticker. Add it, then submit again.",
      tag: `${o.brand} isn't tagged. Add ${brandHandle(o.brand)} to the caption, then submit again.`,
      intro: `The ${lower(o.product)} has to be in the first three seconds, which the brief asks for.`,
      price: `The brief asks for the price, said, and for what ${o.code} saves.`,
      review: "The brief asks for your own take on it, in your words.",
      light: "The brief asks for clear, natural light, so the product reads.",
    };
    return { outcome: "rejected", note: note[missed], missed };
  }
  if (s.kind === "link" && s.link && isProfileLink(s.link)) {
    return { outcome: "rejected", note: "That link opens a profile, not the ad. Paste the link to the post itself, then submit again." };
  }
  const shape = s.kind === "file" && s.file ? shapeProblem(s.format, s.file) : null;
  if (shape) return { outcome: "rejected", note: shape };
  return { outcome: "accepted" };
}

/* ------------------------------------------------------------------ */
/* get_report                                                          */
/* ------------------------------------------------------------------ */

async function* get_report(i: { question?: string }, ctx: RunContext): ToolStream<Report> {
  const orders = PAYOUTS.reduce((n, p) => n + p.orders, 0);
  const earned = PAYOUTS.reduce((n, p) => n + p.amount.value, 0);

  const figures: Report["figures"] = [
    /* ORDERS AND MONEY. A total view count was the first figure here
       and it is not what anybody is paid on. */
    { key: "earned", label: "Earned so far", cardRef: "earnings",
      value: sourced(money(PAYOUTS.reduce((n, p) => n + p.amount.value, 0)), "Across every campaign of yours that has carried an order.",
        [e("platform", "Your codes", `${orders} orders attributed.`)]) },
    { key: "orders", label: "Orders on your codes", cardRef: "work",
      value: sourced(String(orders), "Attributed through your own codes.", [e("platform", "Your codes", `${orders} orders carried one.`)]) },
    { key: "escrow", label: "Held for you", cardRef: "earnings",
      value: sourced(money(PAYOUTS.filter((p) => p.state === "escrow").reduce((n, p) => n + p.amount.value, 0)),
        "Already paid by the brands and waiting on delivery.", [e("contract", "Escrow", "Funded at the start of each phase.")]) },
  ];

  const total = figures.length;
  const acc: Report = { headline: "", figures: [], pace: undefined as never, narrative: "" } as unknown as Report;
  const out: Report = {
    question: i.question,
    /* ORDERS AND MONEY, and not a rate per thousand views. Rasha:
       "this for example per view. We don't pay per view." */
    headline: `${orders} orders, and ${money(earned)} of your share.`,
    figures: [],
    narrative:
      `Four campaigns have carried an order. ${money(earned)} is your share of them, and ${money(PAYOUTS.filter((p) => p.state === "escrow").reduce((n, p) => n + p.amount.value, 0))} ` +
      `of that is still held and releases with Friday's run. Every one of the four came in inside the range MoonScore AI ` +
      `expected, so there is nothing here to explain away. One draft is with Ounass and one is waiting on you.`,
  };
  void acc;

  for (let n = 0; n < total; n++) {
    if (ctx.signal.aborted) throw new Cancelled();
    await settle(costOf(`report:${figures[n].key}`, 2), ctx.signal);
    out.figures = [...out.figures, figures[n]];
    yield chunk({ ...out }, `MoonScore AI · ${figures[n].label}`, n + 1, total);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

/* WHAT HAS BEEN PAID, and all of it on performance.
 *
 * v0.1 had three fixed fees and one per-order share. Alex: "we don't
 * want to go with ad rates now. We want to stick to [ROAS]. That's
 * going to be the MVP." So every line here is orders x median order x
 * the campaign's share, and `computedFrom` carries the arithmetic so
 * the figure can be opened rather than trusted.
 *
 * THE ARITHMETIC IS DONE HERE, NOT TYPED. Each line used to print its
 * median order rounded to the dollar ("19 orders x $95 x 15%"), but its
 * amount had been worked out on the unrounded median ($95.30). So the
 * sum printed beside the figure did not produce it: 19 x $95 x 15% is
 * $270.75, not $272. Each line also typed its own code, and one was
 * wrong (MAIS-OUN, where the campaign's code is MAIS-OU). Now the median
 * is rounded to the cent once, the amount is worked out from that
 * rounded median, and the share and the offer id come off the campaign
 * itself. Whatever computedFrom prints produces the figure, to the
 * dollar.
 *
 * NO LINE PRINTS A CODE. These are Mais's payouts, and every visitor's
 * dashboard shows them, so a line printing "MAIS-LBD" put her first
 * name under whoever was looking, beside a ledger row that showed their
 * own code. The evidence says "Your code", and the row beside it names
 * the code.
 *
 * PAYDAY IS FRIDAY, everywhere: paid lines were paid on a Friday, and
 * held ones release with the next Friday run. */
function settled(brandId: string, orders: number) {
  const o = offerFrom(personFor("mais.mustafa"), brandById(brandId))!;
  const median = Math.round(orderValue(o.family) * 100) / 100;
  const amount = Math.round((orders * median * o.commissionPct) / 100);
  return {
    offerId: o.id, brand: o.brand, share: o.commissionPct, orders, amount,
    median: `$${median.toFixed(2)} median order (AED ${MEDIAN_ORDER_AED[o.family]})`,
    sum: `${orders} orders x $${median.toFixed(2)} x ${o.commissionPct}% = ${money(amount)}`,
  };
}

const LUNA = settled("luna-diaries", 19);
const TIDE = settled("tidetrace-first", 22);
const OUNASS = settled("ounass", 31);
const MAISON = settled("maison", 14);

export const PAYOUTS: {
  id: string; offerId: string; brand: string; amount: Sourced<number>;
  state: "escrow" | "due" | "paid"; gate: string; at: string;
  /** Orders behind the figure. The unit a creator is paid in. */
  orders: number;
}[] = [
  {
    id: "pay-1", offerId: LUNA.offerId, brand: LUNA.brand,
    amount: sourced(LUNA.amount, `${LUNA.share}% of the order value on every order your code carried.`,
      [e("platform", "Your code", `${LUNA.orders} orders, at a ${LUNA.median}. MoonScore AI expected 7 to 23 on one deliverable.`),
       e("policy", "How a performance campaign settles", "You earn a share of the total order value for every successful order you generate. It is paid every Friday on the orders that cleared.")],
      { computedFrom: LUNA.sum }),
    state: "paid", gate: "Paid every Friday on the orders that cleared.", at: "Friday", orders: LUNA.orders,
  },
  {
    id: "pay-4", offerId: TIDE.offerId, brand: TIDE.brand,
    amount: sourced(TIDE.amount, `${TIDE.share}% of the order value on every order your code carried.`,
      [e("platform", "Your code", `${TIDE.orders} orders so far, at a ${TIDE.median}, across three deliverables.`),
       e("policy", "Still accruing", "A performance campaign keeps earning while the code keeps carrying orders, so this figure is not final.")],
      { computedFrom: `${TIDE.sum} so far` }),
    state: "paid", gate: "Paid every Friday on the orders that cleared.", at: "Still accruing", orders: TIDE.orders,
  },
  {
    id: "pay-2", offerId: OUNASS.offerId, brand: OUNASS.brand,
    amount: sourced(OUNASS.amount, `${OUNASS.share}% of the order value on the orders your code has carried so far.`,
      [e("platform", "Your code", `${OUNASS.orders} orders since Monday, at a ${OUNASS.median}, across five deliverables.`),
       e("contract", "Ounass, Phase 2", "Ounass funded this phase before the brief existed, so the share is not conditional on the brand's cash flow.")],
      { computedFrom: OUNASS.sum }),
    state: "escrow", gate: "Released with Friday's run.", at: "Since Monday", orders: OUNASS.orders,
  },
  {
    id: "pay-3", offerId: MAISON.offerId, brand: MAISON.brand,
    amount: sourced(MAISON.amount, `${MAISON.share}% of the order value on the orders your code has carried so far.`,
      [e("platform", "Your code", `${MAISON.orders} orders since Thursday, at a ${MAISON.median}, across three deliverables.`)],
      { computedFrom: MAISON.sum }),
    state: "escrow", gate: "Released with Friday's run.", at: "Since Thursday", orders: MAISON.orders,
  },
];

/* ------------------------------------------------------------------ */
/* interpret — the seam a language model replaces first                */
/*                                                                     */
/* Regexes, and they say so. Everything else in this file is already    */
/* typed, so this is the one function a real model has to fill.        */
/* ------------------------------------------------------------------ */

const NO_WORDS: Record<string, string> = {
  gambl: "Gambling", casino: "Gambling", bet: "Gambling",
  vape: "Vaping and tobacco", tobacco: "Vaping and tobacco", cigarette: "Vaping and tobacco",
  crypto: "Crypto and trading", trading: "Crypto and trading", forex: "Crypto and trading",
  surgery: "Cosmetic surgery", clinic: "Cosmetic surgery", filler: "Cosmetic surgery",
  alcohol: "Alcohol", diet: "Diet and weight loss", weight: "Diet and weight loss",
};

function interpret(i: { text: string; profile?: Profile; joined?: boolean }): Interpretation {
  const t = i.text.trim().toLowerCase();

  /* THERE IS NO RATE TO SET. v0.1 parsed "$500" here and moved a price;
     the review deleted the whole idea — Rasha: "'your rate is set to
     500' — this is also confusing", and a campaign's commission is the
     brand's number rather than the creator's. So a creator talking
     about money gets an answer about how the money works, not a
     setting. */
  if (/\$|\brate\b|\bfee\b|charge|price|raise|how much|what do i (get|earn|make)|per post/.test(t)) {
    return { kind: "question", say: "", answerRef: "pay" };
  }

  /* Availability. "three a month", "I can do 2 a month". */
  const per = t.match(/(\d+|one|two|three|four|five|six)\s*(?:deliverables?|posts?|videos?)?\s*(?:a|per)\s*month/);
  if (per) {
    const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    const n = words[per[1]] ?? Number(per[1]);
    if (n >= 1 && n <= 12) {
      return { kind: "edit", say: `${n} a month it is.`, patch: { perMonth: n }, because: `because you said ${i.text.trim()}` };
    }
  }

  /* Turnaround. "I need 7 days". */
  const days = t.match(/(\d+)\s*days?/);
  if (days && /need|turnaround|give me|takes? me|deliver/.test(t)) {
    const n = Number(days[1]);
    if (n >= 1 && n <= 30) {
      return { kind: "edit", say: `${n} days from brief to delivery.`, patch: { turnaroundDays: n }, because: `because you said ${i.text.trim()}` };
    }
  }

  /* The no-list. */
  if (/^(no|not|don'?t|never|won'?t|stop)\b|refuse|avoid/.test(t)) {
    const hits = Object.entries(NO_WORDS).filter(([k]) => t.includes(k)).map(([, v]) => v);
    const adding = Array.from(new Set(hits));
    if (adding.length) {
      return {
        kind: "edit",
        say: `${adding.join(" and ")} off the table. Any brief in those categories stops reaching you.`,
        patch: { addNo: adding },
        because: `because you said ${i.text.trim()}`,
      };
    }
  }
  if (/(allow|open to|i (do|will) take|put back|unblock)/.test(t)) {
    const hits = Object.entries(NO_WORDS).filter(([k]) => t.includes(k)).map(([, v]) => v);
    if (hits.length) {
      return { kind: "edit", say: `${Array.from(new Set(hits)).join(" and ")} back on.`, patch: { dropNo: Array.from(new Set(hits)) }, because: `because you said ${i.text.trim()}` };
    }
  }

  /* Platforms. */
  if (/only\s*(instagram|tiktok|youtube)|no more (tiktok|instagram|youtube)|(instagram|tiktok|youtube)\s*only/.test(t)) {
    const only = t.match(/(instagram|tiktok|youtube)/);
    if (only) {
      const pl = (only[1][0].toUpperCase() + only[1].slice(1)) as Platform;
      const keep: Platform[] = /only/.test(t)
        ? [pl]
        : (i.profile?.platforms.value ?? []).filter((x) => x.toLowerCase() !== only[1]);
      return { kind: "edit", say: `${keep.join(" and ")} only.`, patch: { platforms: keep }, because: `because you said ${i.text.trim()}` };
    }
  }

  /* Commands. */
  if (/show|see|open/.test(t) && /campaign|offer|brief|work|job/.test(t)) return { kind: "command", say: "Here they are.", command: "show-offers" };
  if (/show|see|open/.test(t) && /profile|rate/.test(t)) return { kind: "command", say: "Your profile.", command: "show-profile" };
  if (/join|accept|take it|i'?ll do it|yes.*campaign/.test(t)) return { kind: "command", say: "I will put it in front of you. You press it.", command: "join" };
  if (/report|send.*(post|draft)|submit/.test(t)) return { kind: "command", say: "Reporting a post is on the dashboard, where your code and your link are.", command: "report-post" };
  if (/how.*(doing|going)|report|performance|numbers/.test(t)) return { kind: "command", say: "Here is where it stands.", command: "show-report" };
  if (/build|go ahead|do it|looks right/.test(t)) return { kind: "command", say: "Building your profile.", command: "build" };

  /* Questions the agent can actually answer. */
  if (/why.*(match|me|this campaign|pre.?qualified)/.test(t)) {
    return { kind: "question", say: "", answerRef: "match" };
  }
  if (/who.*(pay|paying)|when.*(paid|money)|escrow/.test(t)) {
    return { kind: "question", say: "", answerRef: "payment" };
  }
  if (/exclusiv|sign|contract|rights|usage/.test(t)) {
    return { kind: "question", say: "", answerRef: "terms" };
  }
  if (/follower|view|reach/.test(t)) {
    return { kind: "question", say: "", answerRef: "followers" };
  }

  return {
    kind: "unknown",
    say: "I did not get that. I can change the categories you will not touch or the platforms you are on. Or ask me how the money works, why a campaign matched you, or when you get paid.",
  };
}

/* ------------------------------------------------------------------ */
/* The object the screens talk to                                      */
/* ------------------------------------------------------------------ */

export const tools = {
  decide,
  read_profile,
  propose_profile,
  match_offers,
  edit_profile,
  request_accept,
  get_report,
  list_drafts,
  check_draft,
  request_send,
  pre_upload_check,
  verify_ad,
  welcome_line,
  platform_stats,
  interpret,
};

export { hash };
