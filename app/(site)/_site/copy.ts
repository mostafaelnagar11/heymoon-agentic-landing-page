/* Copy functions share one (d: DemoData) signature; a function that needs no data names it `_`. */
/* eslint @typescript-eslint/no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
import type { Audience, DemoData, Rung } from "./data/types";

const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const secs = (ms: number) => (ms / 1000).toFixed(1);

export const SHARED = {
  metaDescription: "Seven AI agents run creator campaigns end to end, for brands and for creators.",       // [A7]
  switchLabel: "Who HeyMoon is for",                                                                        // [A1]
  switchOptions: { brands: "Brands", creators: "Creators" },                                                // [A1]
  announce: { brands: "Showing HeyMoon for brands.", creators: "Showing HeyMoon for creators." },           // [NEW]
  skip: "Skip to content",                                                                                  // [NEW]
  pause: "Pause animations",                                                                                // [NEW] aria-label; state via aria-pressed
  sampleRun: "A sample run",                                                                                // [NEW] frame label, region name, promo eyebrow
  runAgain: "Run it again",                                                                                 // [NEW]
  close: "Close",                                                                                           // [NEW] launcher name while open
  reading: "Reading",                                                                                       // [A1][A5]
  waiting: "Waiting",                                                                                       // [PRODUCT]
  signature: "HeyMoon.AI, a Saudi company",                                                                 // [A4][A7] gate G1
  credit: "Built by AI. Backed by HeyMoon.AI, a Saudi company.",                                            // [A4][A7] gate G1
  stages: ["Intake", "Matching", "Safety", "Creative", "Activation", "Optimization", "Learning"],            // [A4]
  footerNav: "Site",                                                                                        // [v1]
  footerLinks: { brands: "Brands", creators: "Creators", dashboard: "Login" },                              // [CHANGE] Mostafa 5 Oct: "Login", as in the nav
  /* The login dialog (Mostafa, 6 Oct: "login by country code + phone number and OTP"). [NEW] throughout, in the
     product's own words where it has them (the creators AccountSheet). */
  login: {
    title: "Log in",
    sub: "Your phone number is your account. HeyMoon texts a code to confirm it is you.",
    country: "Country code",
    phone: "Phone number",
    send: "Send code",
    invalid: (digits: number) => `Enter the ${digits} digits of your number.`,
    codeTitle: "Enter the code",
    sentTo: (num: string) => `Sent to ${num}.`,
    change: "Change number",
    resendIn: (t: string) => `Send a new code in ${t}`,
    resend: "Send a new code",
    demo: (code: string) => `Prototype: your code is ${code}.`,
    wrong: "That code does not match. Try again.",
    verify: "Log in",
    done: "You are in. Opening your dashboard.",
    close: "Close",
    digit: (n: number) => `Digit ${n} of 6`,
  },
} as const;

export const COPY = {
  shared: SHARED,
  brands: {
    meta: {
      title: "HeyMoon.AI for brands",                                                                       // [NEW]
      description: "Paste your store link. HeyMoon builds a complete creator campaign around what you sell, and guarantees the sales.", // [A4]
    },
    h1: {                                                                                                   // [A1]
      sentence: "A campaign in fifteen seconds. Sales, guaranteed.",
      desktop: ["A campaign in fifteen seconds.", "Sales, guaranteed."], gradDesktop: 1,
      phone: ["A campaign in", "fifteen seconds.", "Sales, guaranteed."], gradPhone: 2,
    },
    field: {                                                                                                // [A1]
      label: "Your store link", placeholder: "yourstore.com", cta: "Start", going: "Reading",
      invalid: "Paste a store link, like yourstore.com.", icon: "globe", action: "/brands/c", param: "read", inputMode: "url",
    },
    chips: ["No forms to fill in", "No brief to write", "No agency to manage"],                              // [A1]
    nav: { dashboard: "Login", dashboardHref: "/brands/dashboard", start: "Start" },                          // [CHANGE] Mostafa 5 Oct: "Login"; Start [NEW on brands]
    work: {
      h2: "One link. The whole campaign.",                                                                  // [A2]
      sub: "Paste your store link. HeyMoon builds a complete creator campaign around what you sell, and guarantees the sales.", // [A2]
      acts: [                                                                                               // [A2] cards, as the act rail
        { title: "HeyMoon reads your store", body: (_: DemoData) => "Catalogue, prices, voice and markets. In about fifteen seconds." },
        { title: "See everything. Before you pay anything.", body: (_: DemoData) => "The whole campaign, built and priced before you approve it: the markets, the creators, the budget and the brief." },
        { title: "Start small. Scale on results.", body: (d: DemoData) => `Your first campaign is ${d.brands.plan.pay.text}, the same for every brand. The next is offered only when this one reaches ${d.brands.unlockPct}% of its target.` },
      ],
      stamp: "Store details in",                                                                            // [NEW] + read.totalText
      try: "Try it with your store",                                                                        // [INPUTS]
      summary: (d: DemoData) =>                                                                             // [NEW] sr-only; one idea per sentence, no "·" read aloud
        `A sample run on ${d.brands.shownUrl}. ${cap(d.brands.read.agentWord)} agents read the store in ${secs(d.brands.read.totalMs)} seconds, then ${d.brands.build.agentWord} agents build the plan. ${LABELS.brands.phase(d.brands.ladder[0].phaseNo)} is ${d.brands.plan.pay.text}. Markets: ${list(d.brands.plan.markets)}. ${cap(d.brands.plan.creatorWord)} creators.`,
    },
    run: {
      h2: "From a link to a live campaign.",                                                                // [A3]
      sub: "Four steps. You decide at one of them, and it ends on the number HeyMoon guaranteed.",          // [A3]
      creditLabel: "Done by",                                                                               // [CHANGE C2]
      steps: [                                                                                              // [A3]
        { title: "Paste your store link", body: "HeyMoon reads the catalogue, the prices, the voice and the markets it already ships to.", credit: (_: DemoData) => "MoonShot AI" },
        { title: "The plan arrives, priced", body: "Markets, creators, products and the brief, with the sales figure it guarantees. Change anything.", credit: (_: DemoData) => "MoonMatch AI" },
        { title: "You start Phase 1", body: "One payment, the same for every brand. Nothing after it is charged or committed.", credit: (_: DemoData) => "You" }, // [CHANGE C2] gate G9
        { title: "The sales land on the number", body: "Three phases run to the sales HeyMoon guaranteed on your budget, at the multiple you signed.", credit: (_: DemoData) => "MoonScore AI" },
      ],
    },
    number: {
      h2: "Every campaign is built to generate sales.",                                                     // [CHANGE] Mostafa 5 Oct: no "HeyMoon pays the difference"
      body: "Before you pay, you see the sales figure the plan is built around. Then the agents run every phase toward it.", // [CHANGE] Mostafa 5 Oct: talk about generating sales, no shortfall promise
      eyebrow: "Guaranteed sales",                                                                          // [A4]
      figureNote: (budget: string, roas: string) => `${budget} across three phases, at ${roas}`,            // [A4]
      // No ladderLine (C14): Phases 2 and 3 are indicative (D4) and never stated beside "Guaranteed sales".
      roasH2: "You set the ROAS. HeyMoon signs it.",                                                        // [A4]
      roasBody: "Pick the multiple you want on the whole campaign. HeyMoon prices the phases to reach it, or tells you it cannot and offers the number it can stand behind.", // [A4]
      climb: "It climbs as the campaign earns it",                                                          // [A4]
      chip: (r: Rung) => `P${r.phaseNo} ${r.multipleText}`,                                                 // [A4]
      dialLabel: "Guaranteed ROAS", dialNote: "blended across all three phases",                            // [A4]
    },
    agents: { h2: "Seven agents run the campaign.", body: "Each one owns a stage, and each one signs the work it did." }, // [A4]
    connects: { h2: "Connects to the store you already have.", body: "One tap, after you pay. It reads the orders that use a creator's code, and nothing else." }, // [A4] gate G4
    close: {
      h2: "Paste your store link.", h2Phone: ["Paste your", "store link."],                                // [A4]
      note: "Nothing is charged. Nothing is published. Not until you say so.",                              // [A4]
    },
    promo: {
      headline: (d: DemoData) => `Watch ${d.brands.promoAgentWord} agents build a campaign`,                // [CHANGE C1] PROPOSED: INPUTS says "seven"; Q1 blocks WP-F
      cta: "Try it with your store",                                                                        // [INPUTS]
    },
  },
  creators: {
    meta: {
      title: "HeyMoon.AI for creators",                                                                     // [PRODUCT] existing creators layout title
      description: "Paste your handle. HeyMoon tells you which live campaigns want somebody like you, and each one pays you a share of the orders your posts bring in.", // [A7]
    },
    h1: {                                                                                                   // [A5]
      sentence: "Your posts already sell. Take a cut of it.",
      desktop: ["Your posts already sell.", "Take a cut of it."], gradDesktop: 1,
      phone: ["Your posts", "already sell.", "Take a cut of it."], gradPhone: 2,
    },
    field: {                                                                                                // [A5]
      label: "Your Instagram or TikTok handle", placeholder: "yourhandle", cta: "Start", going: "Reading",
      invalid: "Paste your Instagram or TikTok handle, or the link to your profile.", icon: "at", action: "/creators/c", param: "h", inputMode: "text",
    },
    chips: ["No sign-up to start", "No agency in the middle", "Paid on time"],                              // [A5]
    nav: { dashboard: "Login", dashboardHref: "/creators/login", start: "Start" },                            // [CHANGE] Mostafa 5 Oct: "Login"
    work: {
      h2: "One handle. Every campaign that fits.",                                                          // [A5]
      sub: "Paste your Instagram or TikTok handle. HeyMoon reads your work and brings the live campaigns that fit. Each pays a share of every order you bring in.", // [A5]
      acts: [                                                                                               // [A5] cards
        { title: "HeyMoon reads your grid", body: (_: DemoData) => "What you post, where your audience is and how you sound on camera. In about fifteen seconds." },
        { title: "Matched on influence. Not on size.", body: (_: DemoData) => "Where your audience is, how much of your grid is your own work, how steadily you post and who the brand asked for." },
        { title: "Up to three, Pre-qualified.", body: (_: DemoData) => "Those you join outright, with no brand review. Every other campaign is a request the brand answers." },
      ],
      stamp: "Your grid in",                                                                                // [NEW] + read.totalText
      try: "Try it with your handle",                                                                       // [INPUTS]
      summary: (d: DemoData) =>                                                                             // [NEW] sr-only
        `A sample run on ${d.creators.shownHandle}. ${cap(d.creators.readerWord)} agents read the profile in ${secs(d.creators.read.totalMs)} seconds. ${cap(d.creators.picks.countWord)} campaigns come back ${d.creators.match.levelWord}: ${list(d.creators.picks.items.map((p) => `${p.brand} at ${p.sharePct}%`))} of every order.`,
    },
    run: {
      h2: "From a handle to a live post.",                                                                  // [A6]
      sub: "Four steps. The agents read, match and check. Joining and reporting are yours.",                // [A6]
      creditLabel: "Done by",                                                                               // [A6]
      steps: [                                                                                              // [A6]
        { title: "Paste your handle", body: "Five agents read your last thirty posts, where your audience is, how you talk on camera and which brands are already in your grid.", credit: (d: DemoData) => `You, then ${d.creators.readerWord} agents` },
        { title: "Your matches arrive", body: "Each shows where it runs and the share of every order it pays. Up to three you join outright.", credit: (_: DemoData) => "MoonMatch AI" },
        { title: "You join the campaign", body: "Choose how often you can post, then read what you agree to and, in the same weight, what you do not.", credit: (_: DemoData) => "You" },
        { title: "Post it, then report it", body: "You post from your own account, then submit the ad. MoonWriter AI checks it against the brief and names anything missing. Once it's accepted, it counts toward your payout.", credit: (_: DemoData) => "You, then MoonWriter AI" },
      ],
    },
    number: {
      h2: "When do you get paid?",                                                                          // [A7]
      body: "Each brand funds its phase before the brief is written, and HeyMoon holds it. Orders on your code and link are counted weekly, and your share of the ones that cleared is paid that week.", // [A7]
      eyebrow: "Your payout is paid", figure: "Weekly",                                                     // [A7]
      note: "On the orders your code and link carried, once they cleared.",                                 // [A7]
      rail: ["Funded", "Held for you", "Orders counted", "Paid"],                                           // [A7]
      shareH2: "The brand sets the payout. You bring the orders.",                                          // [A7]
      shareBody: "Each campaign's share of the order value is set by its brand before anyone joins. Nothing to negotiate: a quiet week pays less, and a good one pays more.", // [A7]
      counted: "Every order is counted through", chips: ["Your code", "Your tracking link"],                // [A7]
      shareFigure: (min: number, max: number) => `${min} to ${max}%`,                                       // [CHANGE C4]
      shareLabel: "Payout on every order",                                                                  // [A7]
      // Gate G3 covers BOTH the visible note and the spoken label: they make the same "live" claim.
      // If G3 is refused, view.share() switches both to their fallbacks together.
      shareNote: (n: number) => `One dot for each of the ${n} campaigns live today.`,                       // [A7] gate G3
      shareNoteFallback: "One dot for each campaign in this example.",                                      // [NEW] gate G9; used if G3 is refused
      shareSpoken: (total: number, min: number, max: number, counts: { pct: number; count: number }[]) =>   // [A7 v1 aria-label] gate G3
        `Shares of every order across ${total} live campaigns, from ${min}% to ${max}%: ${counts.map((c) => `${c.count} at ${c.pct}%`).join(", ")}.`,
      shareSpokenFallback: (min: number, max: number, counts: { pct: number; count: number }[]) =>          // [NEW] gate G9; used if G3 is refused
        `Shares of every order across the campaigns in this example, from ${min}% to ${max}%: ${counts.map((c) => `${c.count} at ${c.pct}%`).join(", ")}.`,
    },
    agents: {
      h2: "Seven agents. None of them can act as you.",                                                     // [A7]
      body: "Each one owns a stage and puts its name to what it did.",                                      // [A7]
      locked: "Locked for every agent", never: "Never",                                                     // [A7]
    },
    connects: { h2: "Your handle is all it needs.", body: "Instagram or TikTok. Nothing to connect to start, and HeyMoon holds no password to any account you have." }, // [A7]
    close: {
      h2: "Paste your handle.", h2Phone: ["Paste your", "handle."],                                         // [A7]
      note: "No agent posts for you. No agent signs for you. No screen changes that.",                      // [A7]
    },
    promo: { headline: (_: DemoData) => "Watch HeyMoon read a grid", cta: "Try it with your handle" },      // [INPUTS]
  },
} as const;

export const LABELS = {                                                                                     // [A8] product chrome, verbatim
  brands: {
    guaranteed: "Guaranteed", youPay: "You pay", markets: "Markets", creators: "Creators",
    dueToday: "Due today", vat: (budget: string, vat: string) => `${budget} + ${vat} VAT`,
    card: (last4: string) => `•••• ${last4}`, pay: (total: string) => `Pay ${total}`,
    salesGuaranteed: "Sales, guaranteed", phase: (n: number) => `Phase ${n}`, start: "Start",
  },
  creators: {
    readingProfile: "Reading your profile", why: "Why HeyMoon matched you", requestToJoin: "Request to join",
    tiersRest: (n: number) => `${n} more, each a request to join`,                                          // [A5]
    ofEveryOrder: "of every order", ofEveryOrderYou: "of every order you bring in",
    join: (brand: string) => `Join ${brand}`, prequalifiedJoins: "You're Pre-qualified. Pressing it joins you.",
    agreeing: "You're agreeing to", notAgreeing: "You're not", joinCta: "Join Campaign",
    preUpload: "Pre-upload Check",
    checkLine: (product: string, brand: string, dueIn: string) => `${product} · ${brand} · due in ${dueIn}`,
    fix: "Fix:", toFix: (n: number) => `${n} to fix`, start: "Start",
  },
} as const;

/** One audience's copy. COPY[audience] has this type. */
export type AudienceCopy = (typeof COPY)[Audience];
