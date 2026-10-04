/* Scroll helpers (SPEC §4.3). Every helper passes Lenis a NUMBER, never an element or a selector:
   for element targets Lenis 1.3.26 subtracts the root's scroll-padding-top (96px in globals.css) and
   the target's scroll-margin-top itself, which would double any offset computed here.
   scroll-padding-top stays in globals.css for native no-JS anchor jumps only. */
import type Lenis from "lenis";
import { cubicBezier } from "motion/react";
import type { Slot } from "../contracts";
import { EASE, MQ } from "../tokens";
import { els, setSignal } from "./signals";
import { getReducedMotion } from "./prefs";

let lenis: Lenis | null = null;
export function setLenis(l: Lenis | null): void { lenis = l; }
export function getLenis(): Lenis | null { return lenis; }

const easeInOut = cubicBezier(...EASE.inOut);

/** Absolute document y that puts `el`'s top at `desiredTop` px from the viewport top. */
export function yFor(el: Element, desiredTop: number): number {
  return window.scrollY + el.getBoundingClientRect().top - desiredTop;
}

export interface ScrollOpts {
  immediate?: boolean; duration?: number; onComplete?: () => void;
  /** Extras beyond the §4.3 contract, used by toField. */
  easing?: (t: number) => number; lock?: boolean;
}

export function scrollToY(y: number, o: ScrollOpts = {}): void {
  const target = Math.max(0, y);
  if (lenis) {
    lenis.scrollTo(target, {
      immediate: o.immediate, duration: o.duration, easing: o.easing, lock: o.lock, force: true,
      onComplete: o.onComplete ? () => o.onComplete!() : undefined,
    });
    return;
  }
  window.scrollTo({ top: target, behavior: o.immediate ? "auto" : "smooth" });
  o.onComplete?.();
}

const isPhone = () => typeof window !== "undefined" && window.matchMedia(MQ.phone).matches;
const centre = (el: Element) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };

/** Scroll to the nearest field (or the one asked for) and focus its input when the scroll lands. */
export function toField(prefer: "nearest" | "hero" | "close" = "nearest"): void {
  setSignal("promoOpen", false);
  const hero = els.heroField, close = els.closeField;
  let which: "hero" | "close" = "hero";
  if (prefer === "close" && close) which = "close";
  else if (prefer === "nearest" && hero && close) {
    const mid = window.innerHeight / 2;
    which = Math.abs(centre(close) - mid) < Math.abs(centre(hero) - mid) ? "close" : "hero";   // a tie goes to the hero
  } else if (!hero && close) which = "close";

  const input = which === "hero" ? els.heroInput : els.closeInput;
  const opts: ScrollOpts = {
    duration: 1.2, easing: easeInOut, lock: true, immediate: getReducedMotion(),
    onComplete: () => input?.focus({ preventScroll: true }),
  };
  if (which === "hero" || !close) { scrollToY(0, opts); return; }
  const r = close.getBoundingClientRect();
  scrollToY(window.scrollY + r.top + r.height / 2 - window.innerHeight * (isPhone() ? 0.3 : 0.5), opts);
}

const slotEl = (slot: Slot) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);

export function scrollToSlot(slot: Slot, o?: { immediate?: boolean }): void {
  const el = slotEl(slot);
  if (!el) return;
  scrollToY(yFor(el, 0), { immediate: o?.immediate ?? getReducedMotion() });
}

export interface Anchor { slot: Slot; top: number }

/** The nav's centre line, in viewport px (from --nav-top and --nav-h). */
function navCentre(): number {
  const cs = getComputedStyle(document.documentElement);
  return (parseFloat(cs.getPropertyValue("--nav-top")) || 16) + (parseFloat(cs.getPropertyValue("--nav-h")) || 56) / 2;
}

/** An element's LAYOUT top in the viewport: the offsetTop chain, so transforms are ignored. <Swap>
    fades the new sections in from y 8px; a getBoundingClientRect() read during that fade would
    restore the anchor 8px off. */
function layoutTop(el: HTMLElement): number {
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y - window.scrollY;
}

/** The [data-slot] under the nav centre line. */
export function captureAnchor(): Anchor | null {
  const y = navCentre();
  let best: Anchor | null = null;
  document.querySelectorAll<HTMLElement>("[data-slot]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top <= y && r.bottom > y) best = { slot: el.dataset.slot as Slot, top: layoutTop(el) };   // later in DOM order wins
  });
  return best;
}

export function anchorOf(slot: Slot): Anchor {
  const el = slotEl(slot);
  return { slot, top: el ? layoutTop(el) : 0 };
}

function realign(a: Anchor) {
  const el = slotEl(a.slot);
  if (!el) return;
  const delta = layoutTop(el) - a.top;
  if (Math.abs(delta) < 0.5) return;
  scrollToY(window.scrollY + delta, { immediate: true });
}

/** lenis.resize() first (Lenis debounces its dimensions by 250 ms and clamps scrollTo to a stale
    limit), then an immediate scroll so a.slot's top returns to a.top; re-checks on the next frame,
    because content-visibility estimates heights. */
export function restoreAnchor(a: Anchor): void {
  lenis?.resize();
  realign(a);
  requestAnimationFrame(() => { lenis?.resize(); realign(a); });
}
