"use client";
/* Curve (SPEC §5.8, §2.4.2, ruling 36): v1's rising line under the guarantee, figure chrome inside the
   figure column at the column's width × 96px. A shape, not a claim: no axis, no scale. The line draws,
   then the .20 area fill comes in behind it; `drawn` sets data-drawn and globals.css does the drawing.

   v1 stretched a 520x260 drawing into 96px with preserveAspectRatio="none", which thinned the stroke
   to under 1px wherever the line ran flat. Here the same path is scaled into a viewBox that matches the
   rendered box 1:1 (useBox), so the stroke is 2.5px everywhere and the round caps sit inside the box.
   The server renders the 520x96 desktop box. In RTL the line mirrors, so it climbs with the reading
   direction (it carries no text). */
import { useId, useRef } from "react";
import type { CurveProps } from "../contracts";
import { svgId, useBox } from "./parts";

/* v1's drawing, in its own 520x260 space: a start point, then three cubic segments. */
const START: [number, number] = [0, 236];
const SEGS: [number, number, number, number, number, number][] = [
  [92, 232, 132, 214, 186, 186],
  [236, 160, 268, 132, 318, 102],
  [368, 72, 432, 36, 520, 12],
];
const SW = 2.5;

function paths(w: number, h: number) {
  const pad = SW / 2;
  const fx = (v: number) => +(pad + (v / 520) * (w - 2 * pad)).toFixed(2);
  const fy = (v: number) => +(pad + (v / 260) * (h - 2 * pad)).toFixed(2);
  const line = `M ${fx(START[0])} ${fy(START[1])} ` + SEGS.map((s) => `C ${fx(s[0])} ${fy(s[1])} ${fx(s[2])} ${fy(s[3])} ${fx(s[4])} ${fy(s[5])}`).join(" ");
  const area = `${line} L ${fx(520)} ${h} L ${fx(0)} ${h} Z`;
  return { line, area };
}

export function Curve({ drawn, className = "" }: CurveProps) {
  const id = svgId(useId());
  const ref = useRef<SVGSVGElement>(null);
  const [w, h] = useBox(ref, [520, 96]);
  const { line, area } = paths(w, h);
  return (
    <svg
      ref={ref}
      aria-hidden
      focusable="false"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      fill="none"
      className={`block rtl:-scale-x-100 ${className || "h-24 w-full"}`}
      {...(drawn ? { "data-drawn": "" } : {})}
    >
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2={w} y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4D2FB0" /><stop offset="0.5" stopColor="#7C5CE0" /><stop offset="1" stopColor="#F0559D" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C5CE0" stopOpacity="0.20" /><stop offset="1" stopColor="#7C5CE0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="draw-fill" d={area} fill={`url(#${id}f)`} />
      <path className="draw" pathLength={1} d={line} stroke={`url(#${id}l)`} strokeWidth={SW} strokeLinecap="round" />
    </svg>
  );
}
