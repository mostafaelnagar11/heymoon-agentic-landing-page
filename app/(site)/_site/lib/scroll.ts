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

/* After a switch the sections above the anchor keep changing height for a moment: a remounted
   content-visibility section is laid out at its size hint, then renders at its real height for the
   new audience one or more frames later (the number section +27px and the agents band +222px going
   brands → creators at 1440x900), long after a one-frame re-check. So restoreAnchor keeps watching. */
const SETTLE_MS = 600;     // stop this long after the last size change…
const CAP_MS = 1500;       // …and never watch longer than this
const USER_INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
let stopWatching: (() => void) | null = null;

/** Puts a.slot's top back at a.top, and keeps it there while the page settles: lenis.resize() first
    each time (Lenis debounces its dimensions by 250 ms and clamps scrollTo to a stale limit), then an
    immediate scroll. It re-checks on the next frame and on every resize of a [data-slot] (a
    ResizeObserver runs after layout and before paint, so a correction lands in the same frame as the
    change and never shows), until 600 ms pass without one (1.5 s at most). The visitor's own input
    (wheel, touch, key, pointer) ends the watch at once: their scroll wins. */
export function restoreAnchor(a: Anchor): void {
  stopWatching?.();
  const fix = () => { lenis?.resize(); realign(a); };
  fix();
  if (typeof ResizeObserver === "undefined") { requestAnimationFrame(fix); return; }

  let settle = 0;
  const ro = new ResizeObserver(() => { fix(); arm(); });
  const raf = requestAnimationFrame(fix);
  const cap = window.setTimeout(() => stop(), CAP_MS);
  function arm() { window.clearTimeout(settle); settle = window.setTimeout(() => stop(), SETTLE_MS); }
  function stop() {
    ro.disconnect();
    cancelAnimationFrame(raf);
    window.clearTimeout(settle); window.clearTimeout(cap);
    USER_INPUT.forEach((t) => window.removeEventListener(t, stop, true));
    if (stopWatching === stop) stopWatching = null;
  }
  document.querySelectorAll("[data-slot]").forEach((el) => ro.observe(el));
  USER_INPUT.forEach((t) => window.addEventListener(t, stop, { capture: true, passive: true }));
  arm();
  stopWatching = stop;
}
