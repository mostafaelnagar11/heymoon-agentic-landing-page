"use client";
/* The sheet and the hero share one scroll source, so it lives above both (SPEC §4.3, §5.0.7).
   LiftProvider owns sentinelRef and sheetRef, and heroExit =
   useScroll({ target: sentinelRef, offset: ["start start", "end start"] }).scrollYProgress (the
   "exit" preset, so it is ViewTimeline-accelerated). motion's useScroll waits for a pending ref
   (isRefPending in use-scroll.mjs), so LiftTrack may attach it after the provider renders. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { frame, motionValue, useScroll, type MotionValue } from "motion/react";

interface LiftApi {
  heroExit: MotionValue<number>;
  sentinelRef: RefObject<HTMLDivElement>;
  sheetRef: RefObject<HTMLDivElement>;
}
const LiftContext = createContext<LiftApi | null>(null);

/* Outside a LiftProvider (lab pages) heroExit is a constant 0 and nothing is covered. */
const NO_EXIT = motionValue(0);
const NO_REF: RefObject<HTMLDivElement> = { current: null };

export function LiftProvider({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sentinelRef, offset: ["start start", "end start"] });
  const api = useRef<LiftApi>({ heroExit: scrollYProgress, sentinelRef, sheetRef }).current;
  return <LiftContext.Provider value={api}>{children}</LiftContext.Provider>;
}

/** 0 to 1 as the sheet rises over the hero; ViewTimeline-accelerated. */
export function useHeroExit(): MotionValue<number> {
  return useContext(LiftContext)?.heroExit ?? NO_EXIT;
}

export function useLiftRefs(): { sentinelRef: RefObject<HTMLDivElement>; sheetRef: RefObject<HTMLDivElement> } {
  const ctx = useContext(LiftContext);
  return { sentinelRef: ctx?.sentinelRef ?? NO_REF, sheetRef: ctx?.sheetRef ?? NO_REF };
}

/** True while any part of the element is above the sheet's top edge (rect.top < sheetRect.top).
    Both rects are read in frame.read on every scroll event (Lenis moves the real document, so each
    of its frames fires one) and on resize; state changes only on a crossing. The server value is
    true (the hero is uncovered at scrollY 0). */
export function useUncovered(ref: RefObject<Element>): boolean {
  const { sheetRef } = useLiftRefs();
  const [uncovered, setUncovered] = useState(true);
  const pending = useRef(false);

  const measure = useCallback(() => {
    pending.current = false;
    const el = ref.current, sheet = sheetRef.current;
    if (!el || !sheet) { setUncovered(true); return; }
    setUncovered(el.getBoundingClientRect().top < sheet.getBoundingClientRect().top);
  }, [ref, sheetRef]);

  useEffect(() => {
    const schedule = () => {
      if (pending.current) return;
      pending.current = true;
      frame.read(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [measure]);

  return uncovered;
}
