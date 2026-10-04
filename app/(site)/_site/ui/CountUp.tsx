"use client";
/* The count-up (SPEC §5.0.10). The server renders the final formatted value. Offscreen at mount, it
   shows the start value (0); in view (once, 50%), a critically damped spring (SPRING.number) drives
   it and writes textContent. The visible span is aria-hidden beside an sr-only final value.
   Reduced motion: final value only. It never shows a value above `to`. */
import { useEffect, useRef } from "react";
import { useMotionValueEvent, useSpring } from "motion/react";
import type { CountUpProps } from "../contracts";
import { SPRING } from "../tokens";
import { formatUSD } from "../lib/format";
import { useReducedMotionPref } from "../lib/prefs";

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
    spring.jump(0);
    el.textContent = fmt(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || e.intersectionRatio < 0.5) return;
      spring.set(to);
      io.disconnect();
    }, { threshold: [0, 0.5] });
    io.observe(el);
    return () => { io.disconnect(); spring.jump(to); el.textContent = fmt(to); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fmt is derived from to/format
  }, [to, format, reduced, spring]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden className="num">{fmt(to)}</span>
      <span className="sr-only">{fmt(to)}</span>
    </span>
  );
}
