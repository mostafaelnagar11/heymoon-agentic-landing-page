"use client";
/* The giant dotted HeyMoon (SPEC §5.6, B13, S7): set in dots in the planet's dark side and cropped by
   the page bottom. As the footer enters, it rises 24% and un-blurs from 8px to 0.
   The binding is the "entry" preset on the footer (["start end", "end end"]), and each property is one
   array-in, array-out useTransform on a style key motion accelerates (transform, filter, opacity), so
   it runs as a ViewTimeline animation on the compositor. The server and reduced motion render no
   binding at all: the static final state (§5.9: no-JS and reduced show it sharp and in place). */
import type { RefObject } from "react";
import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useReducedMotionPref } from "../lib/prefs";
import s from "./close.module.css";

/** WP6-internal. `target` is the footer: the scroll binding tracks it entering the viewport. */
export function GiantWordmark({ target }: { target: RefObject<HTMLElement> }) {
  const reduced = useReducedMotionPref();
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end end"] });
  const transform = useTransform(scrollYProgress, [0, 1], ["translateY(24%)", "translateY(0%)"]);
  const filter = useTransform(scrollYProgress, [0, 1], ["blur(8px)", "blur(0px)"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.4, 1]);

  return (
    <div aria-hidden className={s.wmBox} data-wordmark="">
      <m.div
        dir="ltr"
        data-probe-scroll=""
        className={s.wm}
        style={reduced ? undefined : { transform, filter, opacity }}
      >
        HeyMoon
      </m.div>
    </div>
  );
}
