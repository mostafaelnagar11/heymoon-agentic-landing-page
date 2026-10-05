/* Where the card sits, without rendering it (WP7, fix round). Promo asks two questions of an unopened
   card: would it cover the hero field right now (R1: then the launcher waits), and is the card's spot
   over the window's own sections (the calm moment for the auto-open). Both need the card's rect before
   it exists, so it is computed here from the same numbers as .pm-dock in promo.css: desktop end 24
   and bottom 92, short-and-wide beside the launcher (end 92, bottom 24), RTL mirrored, scaled down by
   the same fit PromoCard applies. Keep the two in step. Never used on phone (its own rules apply). */

/** The card's layout height (band, the 210px thumbnail, the 48px floor). Promo refreshes it from the
    real card on every open. */
export const CARD_H = 371;
const WIDTH = 360;
const DESKTOP = { end: 24, bottom: 92 };
const SHORT = { end: 92, bottom: 24 };
const SHORT_MQ = "(max-height: 520px) and (min-width: 640px)";
/** The card never reaches above the nav: it keeps this far below the nav's bottom edge. */
const BELOW_NAV = 8;

export interface Box { left: number; top: number; right: number; bottom: number }

/** The nav's bottom edge (the nav is fixed at --nav-top, --nav-h tall). */
export function navBottom(): number {
  const cs = getComputedStyle(document.documentElement);
  return (parseFloat(cs.getPropertyValue("--nav-top")) || 16) + (parseFloat(cs.getPropertyValue("--nav-h")) || 56);
}

/** The dock's scale: 1, or less when the card would otherwise reach above the nav. */
export function fitFor(cardH: number, bottomGap: number): number {
  const room = window.innerHeight - bottomGap - navBottom() - BELOW_NAV;
  const f = cardH > 0 ? Math.min(1, room / cardH) : 1;
  return Math.max(0.5, Math.round(f * 1000) / 1000);
}

/** The card's viewport rect if it opened now. */
export function dockRect(cardH = CARD_H): Box {
  const short = window.matchMedia(SHORT_MQ).matches;
  const { end, bottom: gap } = short ? SHORT : DESKTOP;
  const fit = fitFor(cardH, gap);
  const w = WIDTH * fit, h = cardH * fit;
  const bottom = window.innerHeight - gap;
  const rtl = document.documentElement.dir === "rtl";
  const left = rtl ? end : window.innerWidth - end - w;
  return { left, top: bottom - h, right: left + w, bottom };
}

/** Do two rects overlap, with `pad` px of clearance? */
export function intersects(a: Box, b: Box, pad = 0): boolean {
  return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

/** The section (its data-slot) on top at viewport height `y`: later in the DOM wins, so the sheet's
    sections beat the lifted hero behind them. */
function slotAt(y: number): string | null {
  let hit: string | null = null;
  document.querySelectorAll<HTMLElement>("section[data-slot]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top <= y && r.bottom > y) hit = el.dataset.slot ?? null;
  });
  return hit;
}

/** Is everything the card would cover, and the middle of the screen, inside these sections? */
export function overSlots(slots: ReadonlySet<string>, cardH = CARD_H): boolean {
  const r = dockRect(cardH);
  return [window.innerHeight / 2, r.top + 1, r.bottom - 1].every((y) => {
    const s = slotAt(y);
    return s !== null && slots.has(s);
  });
}
