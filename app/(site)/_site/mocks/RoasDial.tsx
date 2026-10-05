"use client";
/* RoasDial (SPEC §5.8): v1's dial. A half circle from the bound floor (min) to the ceiling (max); the arc
   sweeps from the floor to the guaranteed multiple and the dot rides it, so the dial reads as set, not
   printed. `drawn` sets data-drawn: the arc draws (.draw) and the dot turns by --sweep (.dial-dot), both
   1.2s in globals.css. --sweep sits on the .dial-dot element itself (@property, inherits: false).

   One of the two mocks that speak: a div with role="img" (axe: the role is not allowed on <figure>), labelled
   "Guaranteed ROAS: 5x", described by the note.
   Fluid: it fills its wrapper's width (WP4 sets 360px, phone 300) and takes its height from the ratio. */
import { useId, type CSSProperties } from "react";
import type { RoasDialProps } from "../contracts";
import { drawStroke, svgId } from "./parts";

/* Radius 80 about (100,100) in a 200x124 box: the sweep runs from (20,100) round to (180,100).
   Angles are the ordinary mathematical ones, 180 at the floor and 0 at the ceiling. */
const R = 80;
const pt = (deg: number): [number, number] => [
  +(100 + R * Math.cos((deg * Math.PI) / 180)).toFixed(3),
  +(100 - R * Math.sin((deg * Math.PI) / 180)).toFixed(3),
];
const angleFor = (v: number, min: number, max: number) =>
  180 - (Math.min(max, Math.max(min, v)) - min) / Math.max(1e-9, max - min) * 180;

export function RoasDial({ value, min, max, label, note, drawn }: RoasDialProps) {
  const id = svgId(useId());
  const a = angleFor(value, min, max);
  const [vx, vy] = pt(a);
  const [sx, sy] = pt(180);
  const [ex, ey] = pt(0);
  return (
    <div
      role="img"
      aria-label={`${label}: ${value}x`}
      aria-describedby={`${id}n`}
      className="mx-auto w-full"
      {...(drawn ? { "data-drawn": "" } : {})}
    >
      <svg viewBox="0 0 200 124" className="block w-full overflow-visible" aria-hidden focusable="false">
        <defs>
          <linearGradient id={`${id}g`} x1="20" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4D2FB0" /><stop offset="0.55" stopColor="#7C5CE0" /><stop offset="1" stopColor="#F0559D" />
          </linearGradient>
        </defs>
        <path d={`M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`} fill="none" stroke="rgb(18 21 27 / .07)" strokeWidth="10" strokeLinecap="round" />
        <path
          className="draw" pathLength={1}
          d={`M ${sx} ${sy} A ${R} ${R} 0 0 1 ${vx} ${vy}`}
          fill="none" stroke={`url(#${id}g)`} strokeWidth="10" strokeLinecap="round" style={drawStroke(drawn)}
        />
        <circle
          className="dial-dot" cx={sx} cy={sy} r="7.5" fill="#fff" stroke="#7C5CE0" strokeWidth="3.5"
          style={{ "--sweep": `${(180 - a).toFixed(2)}deg` } as CSSProperties}
        />
        <text x="100" y="93" textAnchor="middle" className="num" fill="#12151B" style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.04em" }}>
          {`${value}x`}
        </text>
        <text x={sx} y="120" textAnchor="middle" className="num fill-ink/60" style={{ fontSize: 8 }}>{`${min}x`}</text>
        <text x={ex} y="120" textAnchor="middle" className="num fill-ink/60" style={{ fontSize: 8 }}>{`${max}x`}</text>
      </svg>
      <div className="mt-3 text-center">
        <span className="mono-caps block text-brand">{label}</span>
        <span id={`${id}n`} className="mt-2 block text-small text-ink/60">{note}</span>
      </div>
    </div>
  );
}
