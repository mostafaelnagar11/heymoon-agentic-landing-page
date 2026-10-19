"use client";

/* The HeyMoon emblem, for the two product apps: the 5x5 moon-phase dot glyph the marketing site's logo leads with
   (app/(site)/_site/ui/Wordmark.tsx; Mostafa, Oct 2026), so the logo is the same mark everywhere (20 Oct: "logo
   inside the dashboard is wrong, change it everywhere to be the new logo").

   Self-contained on purpose. The site's emblem is styled by its own globals (.moon circle), which the apps do not
   load, so this one carries its fill on the circles: currentColor, unlit dots at .16. At rest it is the full moon.
   Pointing at its link (or focusing it) runs one lunar cycle, full to full in about a second, as on the site, and
   never under reduced motion. It takes the colour of the text around it. */

import { useEffect, useRef } from "react";

/* 5x5, corners empty (21 dots). # lit, o unlit, . empty. The site's MOON_BITMAPS. */
const BITMAPS = [
  [".ooo.", "ooooo", "ooooo", "ooooo", ".ooo."],
  [".oo#.", "oooo#", "oooo#", "oooo#", ".oo#."],
  [".o##.", "ooo##", "ooo##", "ooo##", ".o##."],
  [".###.", "o####", "o####", "o####", ".###."],
  [".###.", "#####", "#####", "#####", ".###."],
  [".###.", "####o", "####o", "####o", ".###."],
  [".##o.", "##ooo", "##ooo", "##ooo", ".##o."],
  [".#oo.", "#oooo", "#oooo", "#oooo", ".#oo."],
] as const;

const DOTS: { r: number; c: number }[] = [];
BITMAPS[0].forEach((row, r) => row.split("").forEach((ch, c) => { if (ch !== ".") DOTS.push({ r, c }); }));
const LIT: boolean[][] = BITMAPS.map((rows) => DOTS.map(({ r, c }) => rows[r][c] === "#"));
const FULL = 4;
const CYCLE = [5, 6, 7, 0, 1, 2, 3, FULL];
const STEP_MS = 120;
const OFF = 0.16;

export function Emblem({ size = 18, className = "" }: { size?: number; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = (el.closest("a, button") as HTMLElement | null) ?? el.parentElement;
    if (!host) return;
    const dots = Array.from(el.querySelectorAll("circle"));
    const paint = (p: number) => dots.forEach((d, i) => d.setAttribute("fill-opacity", LIT[p][i] ? "1" : String(OFF)));
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
  }, []);

  return (
    <svg
      ref={svg}
      viewBox="0 0 5 5"
      width={size}
      height={size}
      className={`inline-block flex-none ${className}`}
      aria-hidden
      focusable="false"
    >
      {DOTS.map(({ r, c }, i) => (
        <circle key={`${r}${c}`} cx={c + 0.5} cy={r + 0.5} r=".36" fill="currentColor" fillOpacity={LIT[FULL][i] ? 1 : OFF} />
      ))}
    </svg>
  );
}
