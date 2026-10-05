"use client";
/* The count-up (SPEC §5.0.10). The server renders the final formatted value, visible: no-JS, reduced
   motion and in-view-at-mount all show it and nothing else.
   Below the viewport at mount it is ARMED: the final value stays laid out but unseen (opacity 0), so
   the box never changes and the start value is never on screen (fix round: a "$0" sat under
   "Guaranteed sales" until the 50% trigger). In view (once, 50%), a critically damped spring
   (SPRING.number, no overshoot) drives it from 0 and writes textContent, while the figure fades in
   over 240ms: the 0 frame is painted at opacity ~0 and the first value seen is already rising.
   A hidden sizer holds the final value's width, so the count never reflows its line as digits arrive.
   The visible span is aria-hidden beside an sr-only final value. It never shows a value above `to`. */
import { useEffect, useRef } from "react";
import { useMotionValueEvent, useSpring } from "motion/react";
import type { CountUpProps } from "../contracts";
import { SPRING } from "../tokens";
import { formatUSD } from "../lib/format";
import { useReducedMotionPref } from "../lib/prefs";

const FADE_MS = 240;

export function CountUp({ to, format, className = "" }: CountUpProps) {
  const fmt = (v: number) => (format === "usd" ? formatUSD(Math.min(v, to)) : String(Math.round(Math.min(v, to))));
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(to, SPRING.number);
  const reduced = useReducedMotionPref();

  useMotionValueEvent(spring, "change", (v) => {
    if (ref.current) ref.current.textContent = fmt(v);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top <= window.innerHeight) return;   // in view at mount: stay final
    el.style.opacity = "0";                                              // armed: final value, unseen
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || e.intersectionRatio < 0.5) return;
      io.disconnect();
      spring.jump(0);
      el.textContent = fmt(0);                                           // painted at opacity ~0 only
      el.style.transition = `opacity ${FADE_MS}ms var(--ease-out)`;
      el.style.opacity = "1";
      spring.set(to);
    }, { threshold: [0, 0.5] });
    io.observe(el);
    return () => {
      io.disconnect();
      spring.jump(to);
      el.textContent = fmt(to);
      el.style.opacity = "";
      el.style.transition = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fmt is derived from to/format
  }, [to, format, reduced, spring]);

  return (
    <span className={className}>
      <span aria-hidden className="num inline-grid">
        <span className="invisible [grid-area:1/1]">{fmt(to)}</span>
        <span ref={ref} className="[grid-area:1/1]">{fmt(to)}</span>
      </span>
      <span className="sr-only">{fmt(to)}</span>
    </span>
  );
}
