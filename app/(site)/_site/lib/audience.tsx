"use client";
/* The audience: urgent state for the switch and everything above the fold, a deferred value for the
   sections below (via <Swap>), and the MotionValues that carry the switch into the sky (SPEC §4.3).
   Never read the audience from usePathname(). Never call router.refresh(). Never link to /brands or
   /creators with next/link (rule 2.4.11). */
import {
  createContext, useCallback, useContext, useDeferredValue, useMemo, useRef, useState,
  type MouseEvent, type ReactNode,
} from "react";
import { animate, motionValue, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { DUR, EASE, WORLD } from "../tokens";
import { announce } from "../ui/SrStatus";
import { getReducedMotion } from "./prefs";
import { anchorOf, captureAnchor, restoreAnchor, scrollToY, type Anchor } from "./scroll";
import { getSignal, setSignal } from "./signals";
import { useIsoLayoutEffect } from "./iso";

export const PATHS = { brands: "/brands", creators: "/creators" } as const;
export const other = (a: Audience): Audience => (a === "brands" ? "creators" : "brands");
export type SwitchSource = "hero" | "nav" | "close";
export interface AudienceState { audience: Audience; switches: number; source: SwitchSource | null }
export interface WorldApi {                          // stable identity: never causes a render
  select(next: Audience, from: SwitchSource): void;
  world: MotionValue<number>;                        // 0 brands → 1 creators
  dir: MotionValue<number>;                          // +1 if the last switch went to creators, -1 to brands
  focus: MotionValue<number>;                        // 0..1 field-focus lean (600 ms --ease-out)
  dawn: MotionValue<number>;                         // 0..1 (S8)
  startDawn(): Promise<void>;                        // sets data-dawn on the Landing root; 450 ms (0 when reduced)
  resetDawn(): void;
}

const StateContext = createContext<AudienceState | null>(null);
const WorldContext = createContext<WorldApi | null>(null);
/** The anchor captured by the last select(), consumed by <Swap> after the deferred commit. */
const AnchorContext = createContext<{ current: Anchor | null } | null>(null);

const audienceOfPath = (p: string): Audience | null =>
  p === PATHS.creators || p.startsWith(`${PATHS.creators}/`) ? "creators"
    : p === PATHS.brands || p.startsWith(`${PATHS.brands}/`) ? "brands" : null;

/** The Landing root carries data-dawn (globals.css). */
const landingRoot = () => (typeof document === "undefined" ? null : document.querySelector<HTMLElement>(".landing-root"));

/** A switch rewrites the path to /brands or /creators (query and hash kept). */
export function AudienceProvider({ initial, children }: { initial: Audience; children: ReactNode }) {
  const [state, setState] = useState<AudienceState>({ audience: initial, switches: 0, source: null });
  const current = useRef<Audience>(initial);
  const anchor = useRef<Anchor | null>(null);

  const api = useMemo<WorldApi>(() => {
    const world = motionValue(initial === "creators" ? 1 : 0);
    const dir = motionValue(initial === "creators" ? 1 : -1);
    const focus = motionValue(0);
    const dawn = motionValue(0);
    return {
      world, dir, focus, dawn,
      select(next, from) {
        // 1. Already there.
        if (next === current.current) return;
        // 2. Keep the section under the nav (or the close) where it is.
        anchor.current = from === "close" ? anchorOf("close") : from === "nav" ? captureAnchor() : null;
        current.current = next;
        // 3. Urgent state.
        setState((s) => ({ audience: next, switches: s.switches + 1, source: from }));
        // 4. The sky. Imperative animate ignores MotionConfig, so pass the reduced transition here.
        const reduced = getReducedMotion();
        animate(world, next === "creators" ? 1 : 0,
          reduced ? { duration: WORLD.reducedDuration } : { duration: WORLD.duration, ease: EASE.inOut });
        dir.set(next === "creators" ? 1 : -1);
        // 5. The URL. `null` so Next 14.2's patched replaceState re-syncs its router.
        window.history.replaceState(null, "", PATHS[next] + window.location.search + window.location.hash);
        // 6. Title and the polite announcement.
        document.title = COPY[next].meta.title;
        announce(COPY.shared.announce[next]);
      },
      startDawn() {
        landingRoot()?.setAttribute("data-dawn", "");
        const reduced = getReducedMotion();
        if (reduced) { dawn.set(1); return Promise.resolve(); }
        /* A timer backs the animation: motion's frame loop does not run in a hidden tab, and the
           navigation must still happen 450 ms after the press. */
        return new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => { if (settled) return; settled = true; window.clearTimeout(timer); resolve(); };
          const controls = animate(dawn, 1, { duration: DUR.dawn, ease: EASE.inOut, onComplete: finish });
          const timer = window.setTimeout(() => { controls.stop(); dawn.jump(1); finish(); }, DUR.dawn * 1000 + 100);
        });
      },
      resetDawn() {
        landingRoot()?.removeAttribute("data-dawn");
        dawn.jump(0);
      },
    };
  }, [initial]);

  /* A remount after a switch (Fast Refresh re-running this module, a bfcache restore) gets the page's
     `initial` again while the URL says the other audience. The URL is the truth: sync to it, without
     animating. On a normal hydration the two agree and nothing happens. */
  useIsoLayoutEffect(() => {
    const fromUrl = audienceOfPath(window.location.pathname);
    if (fromUrl && fromUrl !== current.current) {
      current.current = fromUrl;
      setState((s) => ({ ...s, audience: fromUrl }));
      api.world.jump(fromUrl === "creators" ? 1 : 0);
      api.dir.set(fromUrl === "creators" ? 1 : -1);
      document.title = COPY[fromUrl].meta.title;
    }
  }, [api]);

  return (
    <WorldContext.Provider value={api}>
      <AnchorContext.Provider value={anchor}>
        <StateContext.Provider value={state}>{children}</StateContext.Provider>
      </AnchorContext.Provider>
    </WorldContext.Provider>
  );
}

/* Outside a provider (never on the Landing) these fail loud. */
function need<T>(v: T | null, name: string): T {
  if (!v) throw new Error(`${name} needs an <AudienceProvider> above it`);
  return v;
}

/** URGENT: the switch, the hero, the close and the promo. */
export function useAudience(): AudienceState {
  return need(useContext(StateContext), "useAudience");
}
/** useDeferredValue(audience): what <Swap> passes to the sections below the fold. */
export function useDeferredAudience(): Audience {
  return useDeferredValue(useAudience().audience);
}
export function useWorld(): WorldApi {
  return need(useContext(WorldContext), "useWorld");
}

/** Renders the sections below the fold for the DEFERRED audience, keyed by it, so a switch remounts
    them with a 300 ms fade (none on first render, opacity only when reduced). No exit animation, so
    there is never double DOM. After each deferred commit it restores the captured anchor, then bumps
    the swapCommit signal so the Nav re-observes the new [data-surface] nodes. */
export function Swap({ children }: { children: (a: Audience) => ReactNode }) {
  const { switches } = useAudience();
  const deferred = useDeferredAudience();
  const anchor = need(useContext(AnchorContext), "Swap");
  const first = useRef(true);

  useIsoLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    const a = anchor.current;
    anchor.current = null;
    if (a) restoreAnchor(a);
    const id = requestAnimationFrame(() => setSignal("swapCommit", getSignal("swapCommit") + 1));
    return () => cancelAnimationFrame(id);
  }, [deferred]);

  /* The sections are built once per deferred audience. A render of <Swap> that is not a deferred
     commit (the urgent half of a switch) hands React the same elements, so the old sections bail out
     instead of re-rendering while the new ones wait. (`children` is Landing's inline function, stable
     because Landing never re-renders.) */
  const sections = useMemo(() => children(deferred), [children, deferred]);

  /* Reduced motion is read when a switch renders, not subscribed to: a subscription's server snapshot
     ("reduced") flips right after hydration, and that one re-render reached every section while their
     Suspense boundaries were still hydrating, which made React retry the hydration about a dozen
     times (WP3 R2). Before the first switch the value is unused (initial={false}). */
  const reduced = switches > 0 && getReducedMotion();
  return (
    <m.div
      key={deferred}
      initial={switches === 0 ? false : reduced ? SWAP_FADE : SWAP_RISE}
      animate={SWAP_SHOWN}
      transition={reduced ? SWAP_REDUCED : SWAP_EASE}
    >
      {sections}
    </m.div>
  );
}

/* Swap's motion props are constants, so a render of <Swap> never hands its m.div new objects. */
const SWAP_SHOWN = { opacity: 1, y: 0 };
const SWAP_RISE = { opacity: 0, y: 8 };
const SWAP_FADE = { opacity: 0 };
const SWAP_EASE = { duration: 0.3, ease: EASE.out };
const SWAP_REDUCED = { duration: 0.15 };

/** Props for a plain <a> to an audience route (rule 2.4.11). A plain click: preventDefault, then
    select(to, source), or a Lenis scroll to the top when `to` is already the audience. Modified and
    middle clicks keep the browser default. */
export function useAudienceLink(to: Audience, source: SwitchSource): { href: string; onClick: (e: MouseEvent<HTMLAnchorElement>) => void } {
  const { audience } = useAudience();
  const { select } = useWorld();
  const onClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (to === audience) scrollToY(0, { immediate: getReducedMotion() });
    else select(to, source);
  }, [to, source, audience, select]);
  return { href: PATHS[to], onClick };
}
