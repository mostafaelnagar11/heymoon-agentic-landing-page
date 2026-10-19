"use client";

/* Revenue against the line that matters.
 *
 * One series, not two. The attributed revenue is the data; the pace a
 * straight run at target would have kept is a dashed REFERENCE, drawn
 * in ink rather than in a second hue, and the 80% unlock is a marked
 * gridline. That keeps the chart to a single colour, which means there
 * is no categorical palette to get wrong and no legend to read — the
 * title names the series and the reference is labelled where it ends.
 *
 * The last point of the line is the same figure as the tile above it,
 * to the dollar, because `revenueSeries` normalises onto the phase
 * total rather than accumulating its own rounding.
 *
 * Hover is not decoration here. A cumulative line without a crosshair
 * asks the reader to estimate from an axis, which is the thing an axis
 * is bad at.
 */

import { useState } from "react";
import { fmtUSD, revenueSeries, UNLOCK_AT, type Phase } from "../../lib/mock/campaigns";

const W = 720;
const PAD = { t: 14, r: 16, b: 24, l: 56 };

/** Where the line is heading (B · Grow the lead): at the current rate, and with the campaign's moves made. */
export interface Projection { onPace: number; withMoves?: number }

const MOVES_HUE = "#A21CAF";

export function RevenueChart({ phase, projection, height = 360 }: {
  phase: Phase;
  projection?: Projection;
  /** The viewBox height against a 720 width: 360 on the phase page, shorter on the campaign overview. */
  height?: number;
}) {
  const H = height;
  const [at, setAt] = useState<number | null>(null);
  const pts = revenueSeries(phase);
  if (!pts.length || !phase.revTarget) return null;

  const days = phase.plannedDays ?? pts.length;
  const target = phase.revTarget;
  const unlock = target * UNLOCK_AT;
  const top = Math.max(target, pts[pts.length - 1].rev, projection?.onPace ?? 0, projection?.withMoves ?? 0) * 1.08;

  const x = (d: number) => PAD.l + ((d - 1) / Math.max(1, days - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);

  const line = pts.map((p) => `${x(p.day)},${y(p.rev)}`).join(" ");
  const area = `${PAD.l},${y(0)} ${line} ${x(pts[pts.length - 1].day)},${y(0)}`;
  const paceLine = `${x(1)},${y(pts[0].pace)} ${x(days)},${y(target)}`;

  const hovered = at !== null ? pts[at] : null;
  /* Ticks the reader can name: zero, the unlock line, the target. */
  const ticks = [0, unlock, target];

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`Attributed sales by day. ${fmtUSD(phase.rev)} of a ${fmtUSD(target)} target after ${pts.length} days.`}
        onMouseLeave={() => setAt(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * W;
          const d = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (days - 1)) + 1;
          const i = Math.min(pts.length - 1, Math.max(0, d - 1));
          setAt(i);
        }}
      >
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4D2FB0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#4D2FB0" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Recessive grid. Three lines, each one a number worth naming. */}
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)}
              stroke={v === target ? "rgba(77,47,176,0.25)" : "rgba(0,0,0,0.07)"}
              strokeWidth="1"
              strokeDasharray={v === unlock ? "3 3" : undefined}
            />
            <text x={PAD.l - 8} y={y(v) + 3.5} textAnchor="end" className="fill-ink-faint text-[10px] tabular-nums">
              {v === 0 ? "0" : fmtUSD(Math.round(v))}
            </text>
          </g>
        ))}

        {/* What a straight run at target looks like. A reference, in ink. */}
        <polyline points={paceLine} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" strokeDasharray="4 4" />

        <polygon points={area} fill="url(#rev-fill)" />
        <polyline points={line} fill="none" stroke="#4D2FB0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* The two endings, from today to the last day: dashed at the current rate, solid with the moves made. */}
        {projection && pts.length < days && (() => {
          const end = pts[pts.length - 1];
          const lift = projection.withMoves && projection.withMoves > projection.onPace ? projection.withMoves : null;
          return (
            <g>
              <line x1={x(end.day)} y1={y(end.rev)} x2={x(days)} y2={y(projection.onPace)} stroke="#4D2FB0" strokeOpacity="0.55" strokeWidth="1.75" strokeDasharray="5 5" />
              <circle cx={x(days)} cy={y(projection.onPace)} r="3.5" fill="#4D2FB0" fillOpacity="0.55" />
              <text x={x(days) - 8} y={y(projection.onPace) + 15} textAnchor="end" className="fill-main text-[10px] tabular-nums">
                on pace · {fmtUSD(projection.onPace)}
              </text>
              {lift && (
                <>
                  <line x1={x(end.day)} y1={y(end.rev)} x2={x(days)} y2={y(lift)} stroke={MOVES_HUE} strokeWidth="2.25" strokeLinecap="round" />
                  <circle cx={x(days)} cy={y(lift)} r="4" fill={MOVES_HUE} />
                  <text x={x(days) - 8} y={y(lift) - 9} textAnchor="end" fill={MOVES_HUE} className="text-[10px] font-semibold tabular-nums">
                    with the moves · {fmtUSD(lift)}
                  </text>
                </>
              )}
            </g>
          );
        })()}

        {/* The end of the line, ringed so it reads over the fill. */}
        <circle cx={x(pts[pts.length - 1].day)} cy={y(pts[pts.length - 1].rev)} r="4.5" fill="#4D2FB0" stroke="#fff" strokeWidth="2" />

        {hovered && (
          <g>
            <line x1={x(hovered.day)} x2={x(hovered.day)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(77,47,176,0.3)" strokeWidth="1" />
            <circle cx={x(hovered.day)} cy={y(hovered.rev)} r="4" fill="#4D2FB0" stroke="#fff" strokeWidth="2" />
          </g>
        )}

        <text x={PAD.l} y={H - 7} className="fill-ink-faint text-[10px]">Day 1</text>
        <text x={W - PAD.r} y={H - 7} textAnchor="end" className="fill-ink-faint text-[10px]">Day {days}</text>
        <text x={PAD.l + 4} y={y(target) - 6} className="fill-ink-faint text-[10px]">target</text>
        <text x={PAD.l + 4} y={y(unlock) - 6} className="fill-ink-faint text-[10px]">80% unlock</text>
      </svg>

      <figcaption className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded bg-brand" /> Attributed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-0 w-4 border-t-[1.5px] border-dashed border-black/25" /> Straight run at target
        </span>
        {projection?.withMoves && projection.withMoves > projection.onPace && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-4 rounded" style={{ background: MOVES_HUE }} /> With the moves
          </span>
        )}
        <span className="ms-auto tabular-nums" aria-live="polite">
          {hovered ? `Day ${hovered.day} · ${fmtUSD(hovered.rev)}` : `Day ${pts.length} · ${fmtUSD(phase.rev)}`}
        </span>
      </figcaption>
    </figure>
  );
}
