/* The brands on the other side of the glass.

   Every one of these is a brand that has already been through the
   brands app: it pasted a store link, settled a budget and a multiple,
   and PAID for the phase these seats belong to. That is the reason an
   offer in this app can say "already funded" in its first line without
   asking anybody — the money cleared before the creator ever saw the
   brief.

   WHAT THE BRAND WAS GUARANTEED USED TO LIVE HERE, because it set what
   HeyMoon could pay for a seat. It no longer sets anything on this
   side: a campaign pays a share of the orders it drives, the brand
   sets that share, and it is the same for everybody on the campaign.
   The guarantee is still the brands app's business; it is not the
   creator's, so it is not modelled here. */

import type { CategoryFamily } from "../agent/model";

export interface BrandSeed {
  id: string;
  name: string;
  logo?: string;
  /** The hero image, when the brand has supplied real product
      photography. Left unset here: the only images in this project are
      creator portraits and screenshots, assembled for the brands app
      where showing the creator IS the point. A face standing in for a
      product is worse than an honest tile, and a real third-party
      product (there is a YSL palette in the roster) standing in for a
      fictional brand's is worse still. Drop a file in /public and set
      this, and the card uses it. */
  image?: string;
  /** What the campaign is actually selling. The tile names this. */
  product: string;
  /** What the brand called this campaign. */
  title: string;
  family: CategoryFamily;
  /** What the brand sells, in the brand's own words. */
  line: string;
  /** How this campaign pays. NOTHING SEEDS A FIXED FEE. Alex: "we
      don't want to go with ad rates now. We want to stick to [ROAS].
      That's going to be the MVP." The union keeps a fixed-fee campaign
      expressible for when HeyMoon runs one; no brand here is one. */
  pay: "prepaid" | "postpaid";
  /** Points on every order. The brand's number, and the same for
      everybody on the campaign — a creator does not negotiate it. */
  perOrderPct: number;
  /** Set when accepting early is worth something. */
  bonus?: { label: string; within: string; why: string };
  /** Which creator niches this brand's campaign is matched against. */
  wants: string[];
  /** The brand's own description of what it wants, in its words. */
  pitch: string;
  /** THE BUNDLE. A campaign asks for a set of deliverables with counts,
      per platform — the mobile design's Deliverables section. What a
      creator earns is the sum of it, not a rate. */
  asks: { platform: "Instagram" | "TikTok" | "YouTube" | "Snapchat"; format: "Reel" | "TikTok" | "Story" | "Post" | "YouTube"; count: number }[];
  /** "30 days", or null for the design's "No end date". */
  duration: string | null;
  targetAge: [number, number];
  targetGender: "Both" | "Women" | "Men";
  /* No `exclusive` flag. Nothing on HeyMoon is exclusive, and the terms
     say so; how strongly a campaign wants a creator is the match level
     on the offer, which is what replaced the flag. */
  /** The phase this seat belongs to, on the brand's own ladder. */
  phaseNo: number;
  phaseName: string;
  /** This phase's budget, and therefore its creator pot. */
  budget: number;
  /** How many seats the pot briefs. */
  seats: number;
  /** Markets the campaign runs in. */
  markets: string[];
  /** Days from brief to delivery. */
  windowDays: number;
  /** What the brand will not have in the frame. Straight off its brief. */
  mustNot: string[];
  mustSay: string[];
  /** Set when taking this brand clashes with something in the grid. */
  clashesWith?: string[];
  /** Days until the window to join closes. A number rather than
      display text, because the tie-break and the Pending list both sort
      on it. Unset, it falls back to four days for a warm-up and six for
      anything later. */
  closesInDays?: number;
  /** Replaces the brand's initials in the discount code. Two campaigns
      from one brand would otherwise hand a creator the same code, and
      the code is how every order is attributed to a campaign. */
  codeTag?: string;
  /** A CAMPAIGN THAT HAS FINISHED. It is history, not a match: only the
      creators who took part in it have it, and for them it arrives as
      completed rather than open. Nobody else is brought it — there is
      nothing left to join. */
  ended?: { creators: string[]; closed: string };
}

export const BRANDS: BrandSeed[] = [
  {
    id: "ounass",
    name: "Ounass",
    logo: "/ounass-logo.jpeg",
    product: "Structured leather tote",
    title: "The Luxury Unlock",
    family: "luxury",
    line: "Luxury fashion and beauty e-commerce, Gulf-wide.",
    pay: "postpaid",
    perOrderPct: 12,
    bonus: { label: "+3% per order", within: "3d 5h", why: "Ounass wants the first cuts in this week, so the phase has something to optimise on before it scales." },
    pitch: "We are opening the summer edit and looking for fashion creators to show the pieces in daily life. Authentic content, styled your way, with the range's versatility front and centre.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 3 }, { platform: "Instagram", format: "Reel", count: 2 }],
    duration: "30 days",
    targetAge: [18, 50],
    targetGender: "Both",
    wants: ["Fashion", "Luxury", "Lifestyle"],
    phaseNo: 2,
    phaseName: "Scale",
    budget: 19_500,
    seats: 8,
    markets: ["AE", "SA", "KW", "QA", "BH"],
    windowDays: 9,
    mustNot: ["No competing marketplace in frame", "No price comparisons"],
    mustSay: ["The code, held on screen for five seconds", "Free returns inside 14 days"],
    clashesWith: ["Namshi", "Farfetch"],
  },
  {
    id: "luna",
    name: "Luna Beauty",
    logo: "/luna-logo.png",
    product: "Barrier repair serum",
    title: "Fourteen Days Of It",
    family: "beauty",
    line: "Clean skincare, made in the UAE.",
    pay: "postpaid",
    perOrderPct: 15,
    pitch: "Fourteen days on one bottle, filmed honestly. We want the change shown rather than described, and no claim we cannot stand behind.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 1 }],
    duration: "21 days",
    targetAge: [22, 40],
    targetGender: "Women",
    wants: ["Beauty", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 1_000,
    seats: 3,
    markets: ["AE", "SA"],
    windowDays: 7,
    mustNot: ["No before-and-after on skin tone", "No medical claims"],
    mustSay: ["Fourteen days of use, on camera", "The code"],
  },
  {
    id: "fresh",
    name: "FreshGrocer",
    logo: "/freshgrocer-logo.jpg",
    product: "The weekly grocery basket",
    title: "The Weekly Shop",
    family: "grocery",
    line: "Same-day grocery across the UAE and Kuwait.",
    pay: "postpaid",
    perOrderPct: 10,
    pitch: "Show the weekly shop arriving. Basket on the counter, the total said out loud, and what you actually cook with it.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }],
    duration: null,
    targetAge: [25, 45],
    targetGender: "Both",
    wants: ["Food", "Lifestyle", "Motherhood"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 1_000,
    seats: 3,
    markets: ["AE", "KW"],
    windowDays: 5,
    mustNot: ["No delivery times promised on camera"],
    mustSay: ["The basket total", "The code"],
  },
  {
    id: "tidetrace",
    name: "Tide Trace",
    product: "Eau de parfum, six scents",
    title: "Six Scents, No Gift Sets",
    family: "luxury",
    line: "Fragrance, made in Jeddah. Six scents, no gift sets.",
    pay: "postpaid",
    perOrderPct: 12,
    bonus: { label: "+3% per order", within: "5d 2h", why: "Tide Trace is at 62% of its Phase 3 target with eighteen days left. Early cuts are worth more to it than late ones." },
    pitch: "Six scents, no gift sets. We want the one you would actually wear, named twice, and where it is made said on camera.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 3 }, { platform: "Instagram", format: "Reel", count: 2 }],
    duration: null,
    targetAge: [20, 35],
    targetGender: "Both",
    wants: ["Beauty", "Fragrance", "Lifestyle"],
    phaseNo: 3,
    phaseName: "Peak",
    budget: 39_500,
    seats: 11,
    markets: ["SA", "AE", "KW"],
    windowDays: 12,
    mustNot: ["No layering with another house's scent"],
    mustSay: ["The name of the scent, twice", "Where it is made"],
  },
  {
    id: "maison",
    name: "Maison Dune",
    product: "Linen resort set",
    title: "Linen Season",
    family: "luxury",
    line: "Resort and modest wear, Dubai.",
    pay: "postpaid",
    perOrderPct: 14,
    pitch: "Linen season. Two looks, the fabric named on camera, and nothing else on the rail.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Reel", count: 1 }],
    duration: "45 days",
    targetAge: [25, 45],
    targetGender: "Women",
    wants: ["Fashion", "Lifestyle", "Motherhood"],
    phaseNo: 2,
    phaseName: "Scale",
    budget: 12_000,
    seats: 6,
    markets: ["AE", "SA", "KW"],
    windowDays: 10,
    mustNot: ["Nothing sheer on camera", "No other label visible"],
    mustSay: ["The fabric, by name", "The code"],
  },
  {
    id: "sahara",
    name: "Sahara Skin",
    product: "SPF 50 daily fluid",
    title: "Forty Degrees, Every Day",
    family: "beauty",
    line: "Sun care made for Gulf summers.",
    pay: "postpaid",
    perOrderPct: 14,
    pitch: "Show it going on before you leave the house, every day for a week. The heat is the point, so say the temperature out loud.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Story", count: 3 }],
    duration: "30 days",
    targetAge: [20, 40],
    targetGender: "Women",
    wants: ["Beauty", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 2_500,
    seats: 5,
    markets: ["AE", "SA", "KW", "QA"],
    windowDays: 6,
    closesInDays: 2,
    mustNot: ["No claims about preventing skin conditions", "No tanning on camera"],
    mustSay: ["SPF 50, said out loud", "The code"],
  },
  {
    id: "atelier",
    name: "Atelier Noor",
    product: "Occasion abaya, hand-finished",
    title: "Eid Evenings",
    family: "luxury",
    line: "Occasion abayas, finished by hand in Sharjah.",
    pay: "postpaid",
    perOrderPct: 13,
    bonus: { label: "+2% per order", within: "2d 9h", why: "Atelier Noor needs the first looks up before its Eid orders close." },
    pitch: "Three evenings, three ways to wear one piece. Show the finishing up close, and how it moves when you walk.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Reel", count: 2 }],
    duration: "21 days",
    targetAge: [22, 45],
    targetGender: "Women",
    wants: ["Fashion", "Lifestyle", "Modest"],
    phaseNo: 2,
    phaseName: "Scale",
    budget: 14_000,
    seats: 7,
    markets: ["AE", "SA", "KW", "QA", "BH"],
    windowDays: 8,
    closesInDays: 3,
    mustNot: ["Nothing sheer on camera", "No other label in frame"],
    mustSay: ["Finished by hand, said on camera", "The code"],
  },
  {
    id: "petal",
    name: "Petal & Pestle",
    product: "Lip and cheek tint, six shades",
    title: "One Tint, Three Looks",
    family: "beauty",
    line: "Plant-pigment makeup, made in Dubai.",
    pay: "postpaid",
    perOrderPct: 16,
    pitch: "One tint, used three ways: lips, cheeks, and both. Natural light, no filter, and the shade said every time.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Reel", count: 1 }],
    duration: "14 days",
    targetAge: [18, 34],
    targetGender: "Women",
    wants: ["Beauty", "Fashion", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 1_500,
    seats: 4,
    markets: ["AE", "SA"],
    windowDays: 5,
    closesInDays: 5,
    mustNot: ["No filters on skin", "No before-and-after"],
    mustSay: ["The shade name, each time", "The code"],
  },
  {
    id: "littleoasis",
    name: "Little Oasis",
    product: "Organic cotton babywear",
    title: "Softest Thing They Own",
    family: "general",
    line: "Organic cotton for babies and toddlers, Gulf-wide.",
    pay: "postpaid",
    perOrderPct: 12,
    pitch: "A real morning with a small person in it. Show the fabric after a wash, not just out of the bag.",
    asks: [{ platform: "Instagram", format: "Reel", count: 2 }, { platform: "Instagram", format: "Story", count: 4 }],
    duration: "30 days",
    targetAge: [25, 40],
    targetGender: "Women",
    wants: ["Motherhood", "Lifestyle", "Fashion"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 2_000,
    seats: 4,
    markets: ["AE", "SA", "KW"],
    windowDays: 7,
    closesInDays: 8,
    mustNot: ["No child's face on camera", "No safety claims"],
    mustSay: ["Organic cotton, by name", "The code"],
  },
  {
    id: "dunerun",
    name: "Dune Run",
    product: "Running set, breathable knit",
    title: "Before The Heat",
    family: "general",
    line: "Activewear built for six in the morning in the Gulf.",
    pay: "postpaid",
    perOrderPct: 11,
    pitch: "The run you do before it gets hot. Show the set at six and again after: we want the sweat, not the studio.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Reel", count: 1 }],
    duration: null,
    targetAge: [18, 40],
    targetGender: "Both",
    wants: ["Fitness", "Lifestyle", "Fashion"],
    phaseNo: 2,
    phaseName: "Scale",
    budget: 9_000,
    seats: 6,
    markets: ["AE", "SA", "QA"],
    windowDays: 9,
    closesInDays: 10,
    mustNot: ["No gym-mirror selfies", "No other sportswear brand in frame"],
    mustSay: ["The time you went out", "The code"],
  },
  {
    id: "oudamber",
    name: "Oud & Amber",
    product: "Oud perfume oil, 12ml",
    title: "The Evening Oil",
    family: "luxury",
    line: "Perfume oils from Taif roses and aged oud.",
    pay: "postpaid",
    perOrderPct: 13,
    bonus: { label: "+3% per order", within: "4d 1h", why: "Oud & Amber is launching a second oil and wants reviews up before it lands." },
    pitch: "Put it on the way you actually do. Tell us where you wear it and who noticed, and say where the rose is from.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Reel", count: 1 }, { platform: "Instagram", format: "Story", count: 2 }],
    duration: "30 days",
    targetAge: [22, 45],
    targetGender: "Both",
    wants: ["Fragrance", "Beauty", "Lifestyle"],
    phaseNo: 2,
    phaseName: "Scale",
    budget: 16_000,
    seats: 8,
    markets: ["SA", "AE", "KW", "BH"],
    windowDays: 10,
    closesInDays: 4,
    mustNot: ["No comparison to a named house", "No layering with another scent"],
    mustSay: ["Taif rose, said on camera", "The code"],
  },
  {
    id: "silkroad",
    name: "Silk Road Hair",
    product: "Rosemary hair oil",
    title: "The Thirty Night Oil",
    family: "beauty",
    line: "Cold-pressed hair oils, blended in Kuwait.",
    pay: "postpaid",
    perOrderPct: 15,
    pitch: "Thirty nights, one oil. Show the routine, and the ends on night one and night thirty in the same light.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Story", count: 3 }],
    duration: "35 days",
    targetAge: [20, 40],
    targetGender: "Women",
    wants: ["Beauty", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 2_200,
    seats: 5,
    markets: ["KW", "SA", "AE"],
    windowDays: 7,
    closesInDays: 12,
    mustNot: ["No hair-growth claims", "No medical language"],
    mustSay: ["Thirty nights, on camera", "The code"],
  },
  {
    id: "lune",
    name: "Lune Jewellery",
    product: "Gold vermeil stacking rings",
    title: "Stack Them Your Way",
    family: "luxury",
    line: "Gold vermeil jewellery, made in the UAE.",
    pay: "postpaid",
    perOrderPct: 14,
    pitch: "How you actually wear them: one, three, all of them. Close-ups in daylight, and the metal named.",
    asks: [{ platform: "Instagram", format: "Reel", count: 2 }, { platform: "TikTok", format: "TikTok", count: 1 }],
    duration: "30 days",
    targetAge: [20, 40],
    targetGender: "Women",
    wants: ["Fashion", "Luxury", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 3_000,
    seats: 5,
    markets: ["AE", "SA", "KW", "QA"],
    windowDays: 8,
    closesInDays: 5,
    mustNot: ["No 'solid gold' claims", "No other jeweller in frame"],
    mustSay: ["Gold vermeil, by name", "The code"],
  },
  {
    id: "nabati",
    name: "Nabati Home",
    product: "Soy wax candle, oud and fig",
    title: "The Room After Maghrib",
    family: "general",
    line: "Home fragrance, poured in Riyadh.",
    pay: "postpaid",
    perOrderPct: 12,
    pitch: "The room in the evening. Light it, let it burn a while, and tell us what the house smells like an hour later.",
    asks: [{ platform: "Instagram", format: "Reel", count: 1 }, { platform: "Instagram", format: "Story", count: 3 }],
    duration: null,
    targetAge: [24, 45],
    targetGender: "Both",
    wants: ["Lifestyle", "Fragrance", "Home"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 1_800,
    seats: 4,
    markets: ["SA", "AE", "KW"],
    windowDays: 6,
    closesInDays: 3,
    mustNot: ["No flame left unattended on camera"],
    mustSay: ["The scent, by name", "The code"],
  },
  {
    id: "qahwa",
    name: "Qahwa House",
    product: "Specialty coffee subscription",
    title: "Your Morning, Monthly",
    family: "grocery",
    line: "Single-origin coffee, roasted in Dubai and delivered monthly.",
    pay: "postpaid",
    perOrderPct: 10,
    pitch: "Your actual morning cup. The bag arriving, the brew, and what you are doing while you drink it.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Story", count: 2 }],
    duration: null,
    targetAge: [22, 45],
    targetGender: "Both",
    wants: ["Food", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 1_200,
    seats: 3,
    markets: ["AE", "SA", "KW"],
    windowDays: 5,
    closesInDays: 7,
    mustNot: ["No health claims about caffeine"],
    mustSay: ["This month's origin", "The code"],
  },
  {
    id: "marhaba",
    name: "Marhaba Kitchen",
    product: "Weeknight meal kits",
    title: "Dinner In Twenty",
    family: "grocery",
    line: "Meal kits for Gulf homes, box to table in twenty minutes.",
    pay: "postpaid",
    perOrderPct: 11,
    bonus: { label: "+2% per order", within: "6d 4h", why: "Marhaba Kitchen is testing a new family box and wants early cooks on it." },
    pitch: "Cook one on a real weeknight. Show the box, the twenty minutes, and who ate it.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 2 }, { platform: "Instagram", format: "Story", count: 2 }],
    duration: "30 days",
    targetAge: [25, 45],
    targetGender: "Both",
    wants: ["Food", "Lifestyle", "Motherhood"],
    phaseNo: 1,
    phaseName: "Warm-up",
    budget: 2_000,
    seats: 4,
    markets: ["AE", "KW", "SA"],
    windowDays: 6,
    closesInDays: 9,
    mustNot: ["No cooking time promised past twenty minutes"],
    mustSay: ["Twenty minutes, on camera", "The code"],
  },

  /* ── FINISHED CAMPAIGNS ────────────────────────────────────────────
     Earlier campaigns from brands still on the platform. Each one lists
     the creators who took part, and those are the only people it is
     brought to — as completed. Every seeded creator has two, so the
     Completed tab is never a demo of an empty state.
     `luna-diaries` and `tidetrace-first` are the two campaigns the
     payout ledger has already paid Mais for. */
  {
    id: "luna-diaries",
    name: "Luna Beauty",
    logo: "/luna-logo.png",
    product: "Barrier repair serum",
    title: "The Barrier Diaries",
    family: "beauty",
    line: "Clean skincare, made in the UAE.",
    pay: "postpaid",
    perOrderPct: 15,
    pitch: "Two weeks on the serum, told as it happened. The launch campaign.",
    /* One deliverable: the ledger's own evidence for this campaign says
       "7 to 23 on one deliverable". */
    asks: [{ platform: "TikTok", format: "TikTok", count: 1 }],
    duration: "21 days",
    targetAge: [22, 40],
    targetGender: "Women",
    wants: ["Beauty", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Launch",
    budget: 1_000,
    seats: 3,
    markets: ["AE", "SA"],
    windowDays: 7,
    codeTag: "LBD",
    mustNot: ["No before-and-after on skin tone", "No medical claims"],
    mustSay: ["The first week, on camera", "The code"],
    ended: { creators: ["mais.mustafa", "ghalya.mu2"], closed: "12 Sep" },
  },
  {
    id: "tidetrace-first",
    name: "Tide Trace",
    product: "Eau de parfum, the first three",
    title: "First Spray",
    family: "luxury",
    line: "Fragrance, made in Jeddah. Six scents, no gift sets.",
    pay: "postpaid",
    perOrderPct: 12,
    pitch: "The first three scents, worn for a day each. The campaign that opened the house.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 1 }, { platform: "Instagram", format: "Reel", count: 2 }],
    duration: "30 days",
    targetAge: [20, 35],
    targetGender: "Both",
    wants: ["Fragrance", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Launch",
    budget: 4_000,
    seats: 5,
    markets: ["SA", "AE", "KW"],
    windowDays: 10,
    codeTag: "TTF",
    mustNot: ["No layering with another house's scent"],
    mustSay: ["The name of the scent", "Where it is made"],
    ended: { creators: ["mais.mustafa", "asmaalazmii_"], closed: "3 Sep" },
  },
  {
    id: "ounass-edit",
    name: "Ounass",
    logo: "/ounass-logo.jpeg",
    product: "Cashmere wrap",
    title: "The Winter Edit",
    family: "luxury",
    line: "Luxury fashion and beauty e-commerce, Gulf-wide.",
    pay: "postpaid",
    perOrderPct: 12,
    pitch: "The winter edit, styled for evenings that finally cool down.",
    asks: [{ platform: "TikTok", format: "TikTok", count: 1 }, { platform: "Instagram", format: "Reel", count: 2 }],
    duration: "30 days",
    targetAge: [18, 50],
    targetGender: "Both",
    wants: ["Fashion", "Lifestyle"],
    phaseNo: 1,
    phaseName: "Launch",
    budget: 12_000,
    seats: 6,
    markets: ["AE", "SA", "KW", "QA", "BH"],
    windowDays: 9,
    codeTag: "OUW",
    mustNot: ["No competing marketplace in frame"],
    mustSay: ["The code, held on screen", "Free returns inside 14 days"],
    ended: { creators: ["ghalya.mu2", "asmaalazmii_"], closed: "28 Aug" },
  },
];

export const brandById = (id: string) => BRANDS.find((b) => b.id === id)!;
