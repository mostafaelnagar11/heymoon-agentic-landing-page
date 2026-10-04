"use client";
/* MockCurve (SPEC §5.8): where the run ends, the climb rather than the cheque. v1's smooth path from the
   floor through each rung's bound multiple, a rule per phase, a point per phase that lands as the line
   reaches it, and one number kept: the last multiple, in a pill on the point where it lands. `drawn`
   sets data-drawn, and the globals.css .draw / .draw-fill rules do the drawing (reduced: drawn).

   The chart is 146px tall at every width and its viewBox follows its rendered width 1:1 (useBox), so
   the labels stay 10.5px and the strokes stay 2.5px in a 280px panel and in a 430px one alike. */
import { useId, useRef } from "react";
import type { MockCurveProps } from "../contracts";
import { LABELS } from "../copy";
import { CARD, FRAME, svgId, useBox } from "./parts";

/** A monotone cubic through the points (Fritsch–Carlson), with its tangents eased to EASE of their
    value. Like v1's path it never overshoots a rung, and it still settles a little at each one, so the
    climb reads phase by phase; unlike v1's flat tangents it never stalls into a step, and unlike the
    plain monotone curve it does not straighten into a polyline when the multiples climb evenly. */
function smoothPath(pts: [number, number][]) {
  const n = pts.length;
  const f = (v: number) => +v.toFixed(2);
  if (n < 2) return `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  for (let i = 0; i < n; i++) m[i] *= EASE;
  let path = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = (x1 - x0) / 3;
    path += ` C ${f(x0 + h)} ${f(y0 + m[i] * h)} ${f(x1 - h)} ${f(y1 - m[i + 1] * h)} ${f(x1)} ${f(y1)}`;
  }
  return path;
}

const EASE = 0.42;
const H = 146;
const FLOOR = 118;

export function MockCurve({ rungs, label, drawn }: MockCurveProps) {
  const id = svgId(useId());
  const ref = useRef<SVGSVGElement>(null);
  const [W] = useBox(ref, [290, H]);
  if (rungs.length === 0) return null;

  /* Room above the top point for the pill, and a floor the curve leaves from. Phase 1 sits a fifth of
     the way in, the last phase a ninth from the end, so its pill and label never touch the edge. */
  const top = Math.max(...rungs.map((r) => r.multiple)) * 1.12;
  const x0 = Math.max(34, W * 0.13), x1 = W - Math.max(40, W * 0.15);
  const x = (i: number) => x0 + i * ((x1 - x0) / Math.max(1, rungs.length - 1));
  const y = (m: number) => 112 - (m / top) * 82;
  const pts: [number, number][] = [[6, FLOOR], ...rungs.map((r, i): [number, number] => [x(i), y(r.multiple)])];
  const line = smoothPath(pts);
  const lastI = rungs.length - 1;
  const last = rungs[lastI];
  const pillW = 16 + last.multipleText.length * 6.6;

  return (
    <div aria-hidden className={FRAME}>
      <div className={`overflow-hidden rounded-[18px] px-4 pb-3 pt-3.5 ${CARD}`}>
        <p className="mono-caps text-ink/60">{label}</p>
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="mt-2 block h-[146px] w-full overflow-visible"
          {...(drawn ? { "data-drawn": "" } : {})}
        >
          <defs>
            <linearGradient id={`${id}l`} x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4D2FB0" /><stop offset="0.55" stopColor="#7C5CE0" /><stop offset="1" stopColor="#F0559D" />
            </linearGradient>
            <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2={FLOOR} gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C5CE0" stopOpacity="0.18" /><stop offset="1" stopColor="#7C5CE0" stopOpacity="0" />
            </linearGradient>
          </defs>

          {rungs.map((r, i) => (
            <line key={r.phaseNo} x1={x(i)} y1="10" x2={x(i)} y2={FLOOR} stroke="rgb(18 21 27 / .06)" strokeWidth="1" shapeRendering="crispEdges" />
          ))}
          <line x1="0" y1={FLOOR + 0.5} x2={W} y2={FLOOR + 0.5} stroke="rgb(18 21 27 / .10)" strokeWidth="1" />

          <path className="draw-fill" d={`${line} L ${x(lastI)} ${FLOOR} L 6 ${FLOOR} Z`} fill={`url(#${id}f)`} />
          <path className="draw" pathLength={1} d={line} fill="none" stroke={`url(#${id}l)`} strokeWidth="2.5" strokeLinecap="round" />

          {rungs.map((r, i) => (
            <circle
              key={r.phaseNo} cx={x(i)} cy={y(r.multiple)} r="3.75"
              fill="#fff" stroke="#7C5CE0" strokeWidth="2"
              className="draw-fill" style={{ transitionDelay: `${360 + i * 300}ms` }}
            />
          ))}

          <g className="draw-fill" style={{ transitionDelay: `${360 + rungs.length * 300}ms` }}>
            <rect x={x(lastI) - pillW / 2} y={y(last.multiple) - 32} width={pillW} height="21" rx="10.5" fill="#12151B" />
            <text x={x(lastI)} y={y(last.multiple) - 17.5} textAnchor="middle" className="num" fill="#fff" style={{ fontSize: 11.5, fontWeight: 600 }}>
              {last.multipleText}
            </text>
          </g>

          {rungs.map((r, i) => (
            <text key={r.phaseNo} x={x(i)} y="139" textAnchor="middle" className="fill-ink/60" style={{ fontSize: 11 }}>
              {LABELS.brands.phase(r.phaseNo)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
