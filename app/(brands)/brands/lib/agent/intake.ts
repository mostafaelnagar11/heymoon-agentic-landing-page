/* What a brand types BEFORE there is a store to read (brand flows, P0, 19 Oct review).

   The landing field used to take a store link and nothing else, so a brand who typed "Ounass" or "what is this?" was
   told to paste a link. Now three things can arrive first:
   - a store link: read it, as before;
   - only a brand name: find its store, and ask which one when there are several ("ounass.com or ounass.ae?");
   - a question: answer it in two lines, then offer to look at their store.
   Everything here is pure, so the conversation and the landing can share it. */

import { fmtUSD } from "../mock/campaigns";
import { PHASE_BUDGETS, PHASE_MULTIPLES } from "./tools";

/** The brands HeyMoon can find by name, and the stores each one sells from. A real build asks a search index; the
    prototype knows these, and says so when a name is not among them. */
const DIRECTORY: { names: string[]; domains: string[]; enterprise: boolean }[] = [
  { names: ["ounass"], domains: ["ounass.com", "ounass.ae"], enterprise: true },
  { names: ["luna beauty", "luna", "lunabeauty"], domains: ["lunabeauty.ae"], enterprise: false },
  { names: ["freshgrocer", "fresh grocer"], domains: ["freshgrocer.ae"], enterprise: false },
  { names: ["sephora"], domains: ["sephora.ae", "sephora.me"], enterprise: true },
  { names: ["namshi"], domains: ["namshi.com"], enterprise: true },
];

const clean = (s: string) => s.trim().toLowerCase().replace(/[.!?,'’]+$/g, "").replace(/\s+/g, " ");

/** The stores a brand name points at. Empty when HeyMoon does not know the name. */
export function lookupBrand(name: string): string[] {
  const n = clean(name);
  return DIRECTORY.find((d) => d.names.includes(n))?.domains ?? [];
}

/** Something to answer rather than a name to look up. */
export function isQuestion(text: string): boolean {
  const t = clean(text);
  return /\?\s*$/.test(text.trim()) ||
    /^(what|how|why|who|is|are|can|could|do|does|will|would|where|when|which|tell me|explain|i want to know)\b/.test(t) ||
    t.split(" ").length > 5;
}

/** A brand name is short: one to four words. Anything longer is a sentence. */
export const looksLikeName = (text: string) => {
  const t = clean(text);
  return !!t && t.split(" ").length <= 4 && /^[a-z0-9&' -]+$/i.test(t);
};

const [b1, b2, b3] = PHASE_BUDGETS;
const [m1, m2, m3] = PHASE_MULTIPLES;

/** Two lines at most, then the agent offers to look at the store. Matched on what people actually ask first. */
export function firstAnswer(text: string): string {
  const t = clean(text);
  if (/cost|price|how much|pay|fee|expensive|cheap|\$/.test(t))
    return `You start with Phase 1: ${fmtUSD(b1)}, with ${fmtUSD(b1 * m1)} in sales guaranteed. ` +
      `Phase 2 is ${fmtUSD(b2)} at ${m2}x and Phase 3 is ${fmtUSD(b3)} at ${m3}x, and nothing after the first is charged until you choose it.`;
  if (/guarantee|refund|money back|risk|fall short|miss/.test(t))
    return `Every phase guarantees sales: ${m1}x, then ${m2}x, then ${m3}x what you pay for it. ` +
      `If a phase falls short, you get back the same share of what you paid.`;
  if (/creator|influencer|who (will|would)|choose|pick/.test(t))
    /* The brand doesn't choose creators (PRD v0.2): MoonMatch builds the list and staff review it. */
    return `Creators whose audience lives in your markets and buys what you sell, matched by HeyMoon and reviewed by ` +
      `the HeyMoon team. You see what kind before you pay, and their progress once you start.`;
  if (/how long|when|fast|time|days|weeks/.test(t))
    return `The plan takes about fifteen seconds once I've read your store. ` +
      `After you pay, HeyMoon launches within 14 days: wave 1 goes to your creators, and the phase starts six days ` +
      `later. Content isn't approved before it goes live; you set the direction in the brief.`;
  return `HeyMoon reads your store, builds a creator campaign around what you sell, and guarantees the sales. ` +
    `You start with ${fmtUSD(b1)}, and if it sells less than that, you get the missed share back.`;
}

/** What the brand is hoping for, asked after their role (brand flows, P0: "their goal, in their words"). */
export const GOALS = ["More sales overall", "Launch something new", "Try creators for the first time"] as const;

/** What held a returning brand back (brand flows, P1). */
export const HELD = ["The $1,000", "The creators", "Someone else decides", "A different store"] as const;

/** The questions most brands ask between the plan and paying (brand flows, P0 "talk it through"). */
export const TALK = ["What does the $1,000 include?", "How does the refund work?", "How are creators chosen?", "Someone else decides"] as const;

export const CREATORS_ANSWER =
  "HeyMoon matches creators whose audience lives in your markets and buys what you sell, and checks each one for fit " +
  "and conflicts. You see the kinds of creators now. Names and profiles come the moment Phase 1 starts, and you can " +
  "swap any of them before they post.";
