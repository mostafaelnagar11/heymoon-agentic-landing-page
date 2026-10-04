"use client";
/* The 5x5 moon-phase dot glyph: the page's one thread (SPEC §5.0.2).
   A working glyph steps through phases 0 to 7 on the shared ticker (160 ms per phase, 1.28 s per
   loop), writing data-lit straight onto the circles through refs: no React state, no re-render.
   Reduced motion: a working glyph is static at phase 2. Paused: it freezes where it is. */
import { useEffect, useRef } from "react";
import type { MoonProps, Phase } from "../contracts";
import { subscribeGlyph, glyphStep } from "../lib/ticker";
import { useReducedMotionPref } from "../lib/prefs";

export const MOON_BITMAPS = [   // 5x5, corners removed (21 dots). # lit, o unlit, . empty
  [".ooo.", "ooooo", "ooooo", "ooooo", ".ooo."],   // 0 new
  [".oo#.", "oooo#", "oooo#", "oooo#", ".oo#."],   // 1 waxing crescent
  [".o##.", "ooo##", "ooo##", "ooo##", ".o##."],   // 2 first quarter
  [".###.", "o####", "o####", "o####", ".###."],   // 3 waxing gibbous
  [".###.", "#####", "#####", "#####", ".###."],   // 4 full
  [".###.", "####o", "####o", "####o", ".###."],   // 5 waning gibbous
  [".##o.", "##ooo", "##ooo", "##ooo", ".##o."],   // 6 last quarter
  [".#oo.", "#oooo", "#oooo", "#oooo", ".#oo."],   // 7 waning crescent
] as const;

/** The 21 dot positions, in row-major order (the corners are empty in every phase). */
const DOTS: { r: number; c: number }[] = [];
MOON_BITMAPS[0].forEach((row, r) => row.split("").forEach((ch, c) => { if (ch !== ".") DOTS.push({ r, c }); }));
/** Per phase, per dot: lit or not. */
const LIT: boolean[][] = MOON_BITMAPS.map((rows) => DOTS.map(({ r, c }) => rows[r][c] === "#"));

const WORKING_STATIC: Phase = 2;

export function Moon({ phase = 4, working = false, size = 15, className = "" }: MoonProps) {
  const reduced = useReducedMotionPref();
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const shown: Phase = working ? WORKING_STATIC : phase;

  useEffect(() => {
    const paint = (p: number) => {
      const lit = LIT[p];
      dots.current.forEach((el, i) => el?.setAttribute("data-lit", lit[i] ? "1" : "0"));
    };
    if (!working || reduced) { paint(shown); return; }
    paint(glyphStep());
    return subscribeGlyph(paint);
  }, [working, reduced, shown]);

  return (
    <svg viewBox="0 0 5 5" width={size} height={size} className={`moon ${className}`} aria-hidden focusable="false">
      {DOTS.map(({ r, c }, i) => (
        <circle
          key={i}
          ref={(el) => { dots.current[i] = el; }}
          cx={c + 0.5}
          cy={r + 0.5}
          r=".33"
          data-lit={LIT[shown][i] ? "1" : "0"}
        />
      ))}
    </svg>
  );
}

/** A 2px ring at the same size: the step is "yours" (a human presses it). */
export function MoonRing({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={`inline-block flex-none align-middle ${className}`} aria-hidden focusable="false">
      <circle className="moon-ring" cx={size / 2} cy={size / 2} r={size / 2 - 1} strokeWidth={2} />
    </svg>
  );
}
