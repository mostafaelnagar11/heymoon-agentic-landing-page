"use client";
/* The sheet lift (SPEC §5.0.7): native sticky structure, plus the clip-path inset and the moonlight
   edge as accelerated cosmetic bindings on heroExit. Both read LiftProvider (lib/lift.tsx), which
   must wrap LiftTrack AND Sheet. Every bound element carries data-lift, so the short-screen block in
   globals.css switches the bindings off with !important. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTransform } from "motion/react";
import * as m from "motion/react-m";
import { LIFT } from "../tokens";
import { useHeroExit, useLiftRefs } from "../lib/lift";
import { useIsPhone, useReducedMotionPref } from "../lib/prefs";

/** The hero's track: the sentinel (always exactly one viewport tall, ending where the sheet arrives),
    the sticky hero, then a one-viewport spacer the sheet slides over. */
export function LiftTrack({ children }: { children: ReactNode }) {
  const { sentinelRef } = useLiftRefs();
  const trackRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(0);

  /* A hero taller than the viewport scrolls until its bottom meets the viewport bottom, and only then
     pins, so its lower content is never stuck out of sight: stick = min(0, innerHeight − hero height). */
  useEffect(() => {
    const track = trackRef.current;
    const hero = track?.children[1] as HTMLElement | undefined;
    if (!hero || typeof ResizeObserver === "undefined") return;
    const measure = () => setStick(Math.min(0, window.innerHeight - hero.offsetHeight));
    const ro = new ResizeObserver(measure);
    ro.observe(hero);
    window.addEventListener("resize", measure);
    measure();
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  return (
    <div ref={trackRef} className="relative" style={{ "--hero-stick": `${stick}px` } as React.CSSProperties}>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[100svh] h-[100svh]" />
      {children /* <Hero/>: its root is sticky, top: var(--hero-stick, 0px) */}
      <div aria-hidden className="h-[100svh] [@media(max-height:520px)]:h-0" />
    </div>
  );
}

const clip = (inset: number, radius: number): [string, string] => [
  `inset(0px ${inset}px 0px ${inset}px round ${radius}px)`,
  `inset(0px 0px 0px 0px round ${radius}px)`,
];

/** The paper sheet that rises over the pinned night. No box-shadow: the clip-path would clip it. */
export function Sheet({ children }: { children: ReactNode }) {
  const heroExit = useHeroExit();
  const { sheetRef } = useLiftRefs();
  const reduced = useReducedMotionPref();
  const isPhone = useIsPhone();
  /* Two bindings, chosen by width: each is a single array-in, array-out useTransform on a scroll
     progress, so motion accelerates it as a ViewTimeline animation with its own keyframes. */
  const clipDesktop = useTransform(heroExit, [0, 1], clip(LIFT.insetDesktop, LIFT.radiusDesktop));
  const clipPhone = useTransform(heroExit, [0, 1], clip(LIFT.insetPhone, LIFT.radiusPhone));
  const edge = useTransform(heroExit, [0, 1], [1, 0]);

  return (
    <m.div
      ref={sheetRef}
      data-lift="sheet"
      data-surface="paper"
      data-probe-scroll=""
      className="dawn-fade relative z-sheet -mt-[100svh] rounded-sheet bg-paper pb-8 max-sm:rounded-[28px] [@media(max-height:520px)]:mt-0"
      style={reduced ? undefined : { clipPath: isPhone ? clipPhone : clipDesktop }}
    >
      <m.div
        aria-hidden
        data-lift="edge"
        data-probe-scroll=""
        className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(255_255_255/.7),transparent)]"
        style={reduced ? undefined : { opacity: edge }}
      />
      {children}
    </m.div>
  );
}
