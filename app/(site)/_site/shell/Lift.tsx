"use client";
/* The sheet lift (SPEC §5.0.7): native sticky structure, plus the clip-path inset and the moonlight
   edge as accelerated cosmetic bindings on heroExit. Both read LiftProvider (lib/lift.tsx), which
   must wrap LiftTrack AND Sheet. Every bound element carries data-lift, so the short-screen block in
   globals.css switches the bindings off with !important. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTransform } from "motion/react";
import * as m from "motion/react-m";
import { LIFT, MQ } from "../tokens";
import { useHeroExit, useLiftRefs } from "../lib/lift";
import { useIsPhone, useReducedMotionPref } from "../lib/prefs";

/* THE PEEK. At rest the sheet's top edge (its rounded corners and the moonlight hairline) shows above
   the fold, so the first screen ends on "there is more" rather than on the planet's dark side: 64px on
   desktop, 40px on a phone. It is the track's spacer, one viewport tall less the peek, so the sheet's
   top sits at (hero height − peek) and the hero pins exactly until the sheet arrives, as before. The
   sentinel is shortened by the same amount and still ends where the sheet arrives, so heroExit runs
   0 (rest, the edge peeking) → 1 (the sheet at the viewport top, the night fully covered: the canvas
   pauses there), and every binding is at its rest value at scrollY 0.

   It never touches the chips under the field. CSS decides it (the first viewport is CSS only, rule
   2.4.10): no peek on short screens, where the chips sit within ~140px of the fold (desktop under
   669px tall, phone under 601px; measured, the chips end at 525px on both there). JS then checks the
   real clearance, since a headline that wraps to an extra line pushes the chips down, and drops the
   peek if fewer than PEEK_CLEAR px of night would be left between the chips and the edge. */
const PEEK_CLEAR = { desktop: 80, phone: 56 } as const;
const PEEK_CSS = [
  "[--peek-want:0px]",
  "[@media(min-width:640px)_and_(min-height:669px)]:[--peek-want:64px]",
  "[@media(max-width:639px)_and_(min-height:601px)]:[--peek-want:40px]",
  "[--peek:var(--peek-want)]",
].join(" ");

/** The hero's track: the sentinel (one viewport tall less the peek, ending where the sheet arrives),
    the sticky hero, then the spacer the sheet slides over (one viewport less the peek). */
export function LiftTrack({ children }: { children: ReactNode }) {
  const { sentinelRef } = useLiftRefs();
  const trackRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(0);
  const [noPeek, setNoPeek] = useState(false);

  /* A hero taller than the viewport scrolls until its bottom meets the viewport bottom, and only then
     pins, so its lower content is never stuck out of sight: stick = min(0, innerHeight − hero height).
     The same pass checks the peek's clearance under the chips. */
  useEffect(() => {
    const track = trackRef.current;
    const hero = track?.children[1] as HTMLElement | undefined;
    if (!track || !hero || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      setStick(Math.min(0, window.innerHeight - hero.offsetHeight));
      const want = parseFloat(getComputedStyle(track).getPropertyValue("--peek-want")) || 0;
      const chips = hero.querySelector("[data-chips]");
      if (!want || !chips) { setNoPeek(false); return; }
      const free = hero.getBoundingClientRect().bottom - chips.getBoundingClientRect().bottom;
      const clear = window.matchMedia(MQ.phone).matches ? PEEK_CLEAR.phone : PEEK_CLEAR.desktop;
      setNoPeek(free - want < clear);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(hero);
    /* The chip list itself (its grid row is 1fr, so only the list changes size when it re-wraps). It
       is keyed by audience, so a switch replaces it: follow the replacement. */
    let chips = hero.querySelector("[data-chips]");
    if (chips) ro.observe(chips);
    const mo = new MutationObserver(() => {
      const next = hero.querySelector("[data-chips]");
      if (next === chips) return;
      if (chips) ro.unobserve(chips);
      chips = next;
      if (next) ro.observe(next);
    });
    if (chips?.parentElement) mo.observe(chips.parentElement, { childList: true });
    window.addEventListener("resize", measure);
    measure();
    return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const style = { "--hero-stick": `${stick}px`, ...(noPeek ? { "--peek": "0px" } : null) } as React.CSSProperties;
  return (
    <div ref={trackRef} className={`relative ${PEEK_CSS}`} style={style}>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[100svh] h-[calc(100svh-var(--peek))]" />
      {children /* <Hero/>: its root is sticky, top: var(--hero-stick, 0px) */}
      <div aria-hidden className="h-[calc(100svh-var(--peek))] [@media(max-height:520px)]:h-0" />
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
      {/* The moonlight edge. §5.0.7 drew it white/.7, which vanishes on paper (#FCFBF8): at rest, in the
          peek, it is the one line that says "a lit edge, more below", so it carries the horizon's own
          violet (--v300), fading out at both ends as the white did. */}
      <m.div
        aria-hidden
        data-lift="edge"
        data-probe-scroll=""
        className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(167_139_250/.8),transparent)]"
        style={reduced ? undefined : { opacity: edge }}
      />
      {children}
    </m.div>
  );
}
