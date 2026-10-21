/* After payment, in the conversation (PRD: HeyMoon v0.2, from payment to first campaign live, Yousef, 20 Oct).

   The brand stays in the thread and MoonConnect leads four steps, each a ledger event in Orbit:
     6a Connect the store     the route depends on the platform the read found
     6b Set discount rules    with the limits this platform can and cannot enforce, and the best-offer confirmation
     6c Store check           test code, free order, about two minutes, cancel, delete; one retry, then the team
     6d Approve the brief     MoonWriter drafts it; approving sets direction, not content
   Then Moontech prepares and launches, and the dashboard shows the launch tracker until the first sale.

   Everything here is data the screens draw. In the product it comes from Orbit; the prototype keeps it here. */

import type { StorePlatform } from "../store";

export type ConnectRoute = "app" | "approval" | "integration" | "legacy";
export type PlatformKey = StorePlatform | "custom";

export interface PlatformInfo {
  key: PlatformKey;
  name: string;
  route: ConnectRoute;
  /** The one button MoonConnect offers. */
  cta: string;
  /** What happens on the platform's side, in one line. */
  how: string;
  /** The same, in Arabic (H6). */
  ar: { name: string; cta: string; how: string };
}

/* Shopify is an App Store install, but until the app is listed (review waits on the DB-3 ruling, MDAAI-181) staff mark
   Shopify stores as legacy integrations: the team route. */
const SHOPIFY_IN_REVIEW = true;

export const PLATFORMS: Record<PlatformKey, PlatformInfo> = {
  salla: {
    key: "salla", name: "Salla", route: "app", cta: "Install on Salla", how: "Install the HeyMoon app from the Salla App Store.",
    ar: { name: "سلة", cta: "ثبّت على سلة", how: "ثبّت تطبيق HeyMoon من متجر تطبيقات سلة." },
  },
  zid: {
    key: "zid", name: "Zid", route: "approval", cta: "Approve on Zid", how: "Approve HeyMoon on Zid.",
    ar: { name: "زد", cta: "وافق في زد", how: "وافق على HeyMoon في زد." },
  },
  shopify: SHOPIFY_IN_REVIEW
    ? {
        key: "shopify", name: "Shopify", route: "legacy", cta: "Have the team connect it", how: "Our Shopify app isn't listed yet, so the Moontech team sets your store up with you.",
        ar: { name: "Shopify", cta: "اطلب من الفريق ربطه", how: "تطبيقنا على Shopify لم يُدرج بعد، لذا يجهّز فريق مون تك متجرك معك." },
      }
    : {
        key: "shopify", name: "Shopify", route: "app", cta: "Install on Shopify", how: "Install the HeyMoon app on Shopify.",
        ar: { name: "Shopify", cta: "ثبّت على Shopify", how: "ثبّت تطبيق HeyMoon على Shopify." },
      },
  magento: {
    key: "magento", name: "Adobe Commerce", route: "integration", cta: "Connect Adobe Commerce", how: "Add the HeyMoon integration in your Adobe Commerce admin.",
    ar: { name: "Adobe Commerce", cta: "اربط Adobe Commerce", how: "أضف تكامل HeyMoon من لوحة إدارة Adobe Commerce." },
  },
  custom: {
    key: "custom", name: "something else", route: "legacy", cta: "Have the team connect it", how: "HeyMoon has no connector for it yet, so the Moontech team connects it with you.",
    ar: { name: "منصة أخرى", cta: "اطلب من الفريق ربطه", how: "لا يوجد لدى HeyMoon ربط لها بعد، لذا يربطها فريق مون تك معك." },
  },
};
export const PLATFORM_ORDER: PlatformKey[] = ["salla", "zid", "magento", "shopify", "custom"];

/** What the store read found the store runs on. A real read detects it; the prototype knows its fixtures. */
const PLATFORM_OF: Record<string, PlatformKey> = {
  "ounass.com": "magento",
  "ounass.ae": "magento",
  "lunabeauty.ae": "salla",
  "freshgrocer.ae": "zid",
  /* Demo stores for the routes no fixture shows: freshgrocer.ae is the "too small" example, so it never reaches 6a. */
  "zid-demo.sa": "zid",
  "shopify-demo.com": "shopify",
};
export const platformFor = (host: string): PlatformKey | null => PLATFORM_OF[host] ?? null;

/** The biggest discount the store already shows shoppers, when the read saw one. The code has to beat it. */
const SITE_OFFER: Record<string, number> = { "ounass.com": 30, "ounass.ae": 30, "lunabeauty.ae": 20 };
export const siteOfferFor = (host: string): number | null => SITE_OFFER[host] ?? null;

/* ── Discount rules (6b) ── */

export type LimitKey = "minOrder" | "onePerCustomer" | "excludeSale" | "endsWithPhase";
export const LIMITS: { key: LimitKey; label: string }[] = [
  { key: "minOrder", label: "Minimum order" },
  { key: "onePerCustomer", label: "One use per customer" },
  { key: "excludeSale", label: "Not on sale items" },
  { key: "endsWithPhase", label: "Ends with Phase 1" },
];

/** Which limits each platform enforces at checkout (MDAAI-356). Anything it can't, creators are told instead. */
const ENFORCES: Record<PlatformKey, Record<LimitKey, boolean>> = {
  salla: { minOrder: true, onePerCustomer: true, excludeSale: false, endsWithPhase: true },
  zid: { minOrder: true, onePerCustomer: true, excludeSale: false, endsWithPhase: true },
  shopify: { minOrder: true, onePerCustomer: true, excludeSale: true, endsWithPhase: true },
  magento: { minOrder: true, onePerCustomer: true, excludeSale: true, endsWithPhase: true },
  custom: { minOrder: false, onePerCustomer: false, excludeSale: false, endsWithPhase: false },
};
export const enforces = (p: PlatformKey, k: LimitKey) => ENFORCES[p][k];

export interface CouponRules {
  discount: number;
  limits: Partial<Record<LimitKey, boolean>>;
  minOrder?: number;
  /** Who confirmed the code is the best offer on the site (recorded on the ledger event), and when. */
  bestOfferBy: string;
  at: number;
}

export const couponLine = (c: Pick<CouponRules, "discount" | "limits" | "minOrder">, currency = "AED") =>
  [
    `${c.discount}% off`,
    c.limits.minOrder && c.minOrder ? `min order ${c.minOrder.toLocaleString("en-US")} ${currency}` : "",
    c.limits.onePerCustomer ? "one per customer" : "",
    c.limits.excludeSale ? "not on sale items" : "",
    c.limits.endsWithPhase ? "ends with Phase 1" : "",
  ].filter(Boolean).join(" · ");

/* ── The launch tracker (H5) ── */

export type StageKey = "store" | "discount" | "check" | "brief" | "profile" | "matching" | "launched" | "phase" | "sale";
export type StageOwner = "You" | "Moontech" | "Creators";
export interface Stage { key: StageKey; label: string; owner: StageOwner; dueDays: number }

/** In order (PRD v0.2, version 3, H5). `dueDays` is the expected day after payment. Launched means launchCampaign ran:
    the campaign is active and wave 1 is sent (day 0). It is due on the 14-day promise itself (LAUNCH_BY_DAYS), so the
    tracker never shows two dates for the same thing. The phase starts on day 6 after the launch, and the first sale is
    expected within 7 days of that; launchStages dates both from the actual launch once there is one. */
export const STAGES: Stage[] = [
  { key: "store", label: "Store connected", owner: "You", dueDays: 3 },
  { key: "discount", label: "Discount set", owner: "You", dueDays: 3 },
  { key: "check", label: "Store checked", owner: "You", dueDays: 3 },
  { key: "brief", label: "Brief approved", owner: "You", dueDays: 5 },
  /* In the dashboard, not the chat (21 Oct): Settings → Business profile, within 10 days of paying. Matching waits on it. */
  { key: "profile", label: "Business profile", owner: "You", dueDays: 10 },
  { key: "matching", label: "Creators being matched", owner: "Moontech", dueDays: 11 },
  { key: "launched", label: "Launched (wave 1 sent)", owner: "Moontech", dueDays: 14 },
  { key: "phase", label: "Phase started (day 6)", owner: "Moontech", dueDays: 20 },
  { key: "sale", label: "First sale", owner: "Creators", dueDays: 27 },
];

export const LAUNCH_BY_DAYS = 14;
/** The business profile is due within 10 days of paying. */
export const PROFILE_BY_DAYS = 10;
/** Wave 1 goes out on day 0; the phase starts on day 6. */
export const PHASE_START_DAYS = 6;
/** The first sale is expected within 7 days of the phase starting (the PRD's outcome target). */
export const FIRST_SALE_DAYS = 7;
const DAY = 86_400_000;
export const plusDays = (t: number, d: number) => t + d * DAY;
export const dayLabel = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
