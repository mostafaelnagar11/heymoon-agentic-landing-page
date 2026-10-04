/* User and device preferences, all through useSyncExternalStore with explicit server values
   (SPEC §4.3). The server snapshot is "reduced", so SSR, no-JS and the first client render all
   show the static state. Never use these to decide above-the-fold layout (rule 2.4.10). */
import { useSyncExternalStore } from "react";
import { MQ } from "../tokens";

/* ── media queries ── */
const mqls = new Map<string, MediaQueryList>();
function mql(q: string): MediaQueryList | null {
  if (typeof window === "undefined" || !window.matchMedia) return null;
  let m = mqls.get(q);
  if (!m) { m = window.matchMedia(q); mqls.set(q, m); }
  return m;
}
const mqSubscribers = new Map<string, (cb: () => void) => () => void>();
function subscribeMq(q: string) {
  let fn = mqSubscribers.get(q);
  if (!fn) {
    fn = (cb: () => void) => {
      const m = mql(q);
      if (!m) return () => {};
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    };
    mqSubscribers.set(q, fn);
  }
  return fn;
}
const matches = (q: string) => mql(q)?.matches ?? false;

/** `false` on the server. Never decides above-the-fold layout (rule 2.4.10). */
export function useMediaQuery(q: string, server = false): boolean {
  return useSyncExternalStore(subscribeMq(q), () => matches(q), () => server);
}
export const useIsPhone = () => useMediaQuery(MQ.phone);
export const useIsShort = () => useMediaQuery(MQ.short);
export const useFinePointer = () => useMediaQuery("(pointer: fine)");

/* ── reduced motion ── */
const RM = "(prefers-reduced-motion: reduce)";

/** Lab pages only: `?rm=1` forces the JS side of reduced motion. Read from location after hydration
    (the client snapshot), never via useSearchParams, so static routes stay static. */
function forcedNow(): boolean {
  if (typeof location === "undefined") return false;
  return /^\/lab(\/|$)/.test(location.pathname) && new URLSearchParams(location.search).get("rm") === "1";
}
function subscribeLocation(cb: () => void) {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}
export function useForcedReducedMotion(): boolean {
  return useSyncExternalStore(subscribeLocation, forcedNow, () => false);
}

/** Non-hook read, for imperative code (select(), toField(), animate calls). */
export function getReducedMotion(): boolean {
  return forcedNow() || matches(RM);
}
function subscribeReduced(cb: () => void) {
  const off1 = subscribeMq(RM)(cb);
  const off2 = subscribeLocation(cb);
  return () => { off1(); off2(); };
}
/** `true` on the server. Updates live. Use this, never motion's useReducedMotion (null on the server, not live). */
export function useReducedMotionPref(): boolean {
  return useSyncExternalStore(subscribeReduced, getReducedMotion, () => true);
}

/* ── page visibility ── */
function subscribeVisible(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}
export const getPageVisible = () => (typeof document === "undefined" ? true : !document.hidden);
export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribeVisible, getPageVisible, () => true);
}

/* ── direction ── */
function subscribeDir(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
  return () => mo.disconnect();
}
export const getDir = (): 1 | -1 =>
  typeof document !== "undefined" && document.documentElement.dir === "rtl" ? -1 : 1;
/** `1` (LTR) or `-1` (RTL): the sign every motion `x` multiplies by (rule 2.4.5). */
export function useDir(): 1 | -1 {
  return useSyncExternalStore(subscribeDir, getDir, () => 1);
}
