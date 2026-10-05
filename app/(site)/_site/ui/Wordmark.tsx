"use client";
/* The emblem, then "HeyMoon" plus a ".AI" span. Text only: callers wrap it in their own plain <a> (rule 2.4.11).
   The emblem is the page's own thread, the 5x5 moon-phase dot glyph (ui/Moon.tsx). At rest it is the full
   moon, static. Pointing at the logo (or focusing its link) runs one lunar cycle, full to full in about a
   second, then it rests again (Mostafa: "when hover only"). Under reduced motion it never moves. It takes the
   wordmark's colour, so it re-skins with the nav. */
import { useEffect, useRef } from "react";
import { MOON_BITMAPS } from "./Moon";
import { useReducedMotionPref } from "../lib/prefs";

const SIZE = { sm: "text-[15px]", md: "text-[17px]", lg: "text-[19px]" } as const;
/* Emblem side in px per size: above the cap height, so the round mark reads as tall as the H.
   md is the navbar's, 2px larger than the first cut at Mostafa's request (16 to 18); sm (the footer) and
   lg keep the first cut. */
const EMBLEM = { sm: 14, md: 18, lg: 18 } as const;
const TONE = {
  night: { base: "text-white", ai: "text-brand-300" },   // ".AI" #A78BFA
  paper: { base: "text-ink", ai: "text-brand-700" },     // ".AI" #4D2FB0
} as const;

/* The 21 dot positions (corners empty), and per phase which are lit. */
const DOTS: { r: number; c: number }[] = [];
MOON_BITMAPS[0].forEach((row, r) => row.split("").forEach((ch, c) => { if (ch !== ".") DOTS.push({ r, c }); }));
const LIT: boolean[][] = MOON_BITMAPS.map((rows) => DOTS.map(({ r, c }) => rows[r][c] === "#"));
const FULL = 4;
/* One cycle that starts and ends on the resting full moon: wane, new, wax, full. */
const CYCLE = [5, 6, 7, 0, 1, 2, 3, FULL];
const STEP_MS = 120;

export function Emblem({ size = 16, className = "" }: { size?: number; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotionPref();

  useEffect(() => {
    const el = svg.current;
    if (!el || reduced) return;
    const host = (el.closest("a") as HTMLElement | null) ?? el.parentElement;
    if (!host) return;
    const dots = Array.from(el.querySelectorAll("circle"));
    const paint = (p: number) => dots.forEach((d, i) => d.setAttribute("data-lit", LIT[p][i] ? "1" : "0"));
    let timer = 0;
    let running = false;
    const run = () => {
      if (running) return;
      running = true;
      let i = 0;
      const tick = () => {
        paint(CYCLE[i]);
        i += 1;
        if (i < CYCLE.length) timer = window.setTimeout(tick, STEP_MS);
        else running = false;
      };
      tick();
    };
    host.addEventListener("pointerenter", run);
    host.addEventListener("focus", run);
    return () => {
      host.removeEventListener("pointerenter", run);
      host.removeEventListener("focus", run);
      window.clearTimeout(timer);
      paint(FULL);
    };
  }, [reduced]);

  return (
    <svg ref={svg} viewBox="0 0 5 5" width={size} height={size} className={`moon flex-none ${className}`} aria-hidden focusable="false">
      {DOTS.map(({ r, c }, i) => (
        <circle key={`${r}${c}`} cx={c + 0.5} cy={r + 0.5} r=".36" data-lit={LIT[FULL][i] ? "1" : "0"} />
      ))}
    </svg>
  );
}

export function Wordmark({ size = "md", tone = "night", className = "" }: {
  size?: keyof typeof SIZE; tone?: keyof typeof TONE; className?: string;
}) {
  const t = TONE[tone];
  return (
    <span dir="ltr" className={`inline-flex select-none items-center gap-[0.42em] whitespace-nowrap font-semibold tracking-[-0.03em] transition-colors duration-[250ms] ${SIZE[size]} ${t.base} ${className}`}>
      <Emblem size={EMBLEM[size]} />
      <span>
        HeyMoon<span className={`transition-colors duration-[250ms] ${t.ai}`}>.AI</span>
      </span>
    </span>
  );
}
