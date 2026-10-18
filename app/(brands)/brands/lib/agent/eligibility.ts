/* Who HeyMoon can run a guaranteed campaign for, in ONE place.

   The brand team changes these criteria often ("even yesterday we changed it"), so nothing in the flow hard-codes
   them: the read judges every store against ELIGIBILITY, the rejection card lists each criterion that failed with
   what the store has and what it needs, and changing a number here changes all of it. In the real product this is
   the configurable eligibility in NASA; here it is a constant.

   Two kinds of "no":
   - No online store at all (a social profile, a link page). There is nothing for creators to sell into, so the read
     stops early and says so, instead of reading a catalogue that does not exist and pushing towards a plan.
   - A store that misses a criterion. Everything read is kept, and each miss is listed with the way back. */

import { sourced, type BrandRead, type Eligibility } from "./types";

export const ELIGIBILITY = {
  /** Monthly unique visitors. Below this, per-creator attribution is too noisy to carry a guarantee. */
  minMonthlyVisitors: 5_000,
  /** An online store with a checkout: creators sell into it, and its orders are what the guarantee counts. */
  needsCheckout: true,
} as const;

/** Links that are a profile or a link page, not a store. normaliseUrl has already reduced the link to its host. */
const NOT_A_STORE = new Set([
  "instagram.com", "tiktok.com", "facebook.com", "fb.com", "x.com", "twitter.com", "snapchat.com", "youtube.com",
  "linktr.ee", "wa.me", "whatsapp.com", "t.me", "threads.net", "linkedin.com",
]);
export const isStoreLink = (host: string) => !NOT_A_STORE.has(host);

/** The figures a fixture's eligibility prose is written from. A store HeyMoon has not read before is read off the
    same base as Ounass (see fixtureFor), so it carries Ounass's traffic. */
const VISITORS: Record<string, number> = { "ounass.com": 280_000, "lunabeauty.ae": 41_000, "freshgrocer.ae": 3_200 };
const visitorsFor = (host: string) => VISITORS[host] ?? VISITORS["ounass.com"];

const fmt = (n: number) => n.toLocaleString("en-US");

/** The read's eligibility, judged against ELIGIBILITY. The fixture's own prose (what we learned, the way back) is
    kept; the verdict and the list of what is missing are derived here, so they follow the config. */
export function judge(read: BrandRead): Eligibility | undefined {
  const base = read.eligibility;
  if (!base) return base;
  const host = read.url;
  const visitors = visitorsFor(host);
  const missing: NonNullable<Eligibility["missing"]> = [];
  if (visitors < ELIGIBILITY.minMonthlyVisitors) {
    const have = base.missing?.find((m) => /visitor/i.test(m.label))?.have ?? { ...base.line, value: fmt(visitors) };
    missing.push({ label: "Monthly unique visitors", have, need: fmt(ELIGIBILITY.minMonthlyVisitors) });
  }
  const state: Eligibility["state"] = missing.length ? "short" : "ok";
  return { ...base, state, missing: missing.length ? missing : undefined };
}

/** The read of a link that is not a store: identity only, and a "short" verdict whose one miss is the store itself. */
export function notAStore(read: BrandRead): Eligibility {
  return {
    state: "short",
    line: sourced(
      `No online store at ${read.url}. HeyMoon needs one with a checkout to guarantee sales.`,
      "Creators send their audience to a store, and the guarantee is counted in that store's orders. A profile or a link page has no checkout to count.",
      [],
    ),
    learned: [],
    missing: [
      {
        label: "An online store with a checkout",
        have: sourced("None found", `${read.url} is a profile or a link page.`, []),
        need: "Required",
      },
    ],
    wayBack: [
      { label: "Paste your store's link instead", detail: "Your website, or your Salla, Zid or Shopify store. The read starts again from there." },
      { label: "No store yet?", detail: "HeyMoon is built for brands that sell online. When your store is live, paste its link and the campaign starts from it." },
    ],
  };
}
