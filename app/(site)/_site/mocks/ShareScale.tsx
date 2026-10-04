"use client";
/* ShareScale (SPEC §5.8, C4, gate G3): every live campaign's share of an order, one full Moon each, stacked
   over its tick. A count, not a dial: no marker, no control the creator does not have, and no brand named.
   The figure ("10 to 16%", no en dash) at figure size, fitted to its column (23cqi: WP4 request 1); a
   tick per whole percent from min to max (mono-data ink/60); the 11px Moons; the label (mono-caps) and
   the note. `lit` fades the dots in a tick at a time, 40ms apart.

   One of the two mocks that speak: role="img" with `spoken`, which states the same counts the dots are
   drawn from; the note is its description. */
import { useId, type CSSProperties } from "react";
import type { ShareScaleProps } from "../contracts";
import { Moon } from "../ui/Moon";
import s from "./mocks.module.css";

const DOT = 11;
const GAP = 4;

export function ShareScale({ figure, counts, min, max, label, note, spoken, lit }: ShareScaleProps) {
  const id = useId();
  const ticks = Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => {
    const pct = min + i;
    return { pct, count: counts.find((c) => c.pct === pct)?.count ?? 0 };
  });
  const tallest = Math.max(1, ...ticks.map((t) => t.count));
  const stackH = tallest * DOT + (tallest - 1) * GAP;

  return (
    <figure role="img" aria-label={spoken} aria-describedby={`${id}n`} className={`${s.share} w-full`}>
      <span className="mono-caps block text-ink/60">{label}</span>
      <span className={`${s.shareFigure} num mt-3 block whitespace-nowrap text-figure text-ink`}>{figure}</span>

      <span aria-hidden className="relative mt-9 block">
        <span className="grid" style={{ gridTemplateColumns: `repeat(${ticks.length}, minmax(0, 1fr))` }}>
          {ticks.map((t, i) => (
            <span key={t.pct} className="flex flex-col items-center">
              <span className="flex flex-col-reverse items-center" style={{ height: stackH, rowGap: GAP }}>
                {Array.from({ length: t.count }, (_, k) => (
                  <span
                    key={k}
                    className={`${s.dot} block leading-none`}
                    data-on={lit ? "1" : "0"}
                    style={{ "--d": `${i * 40 + k * 20}ms` } as CSSProperties}
                  >
                    <Moon phase={4} size={DOT} className="block text-brand" />
                  </span>
                ))}
              </span>
              <span className="mt-3 block h-1.5 w-px bg-ink/16" />
              <span className="mono-data num mt-2 block text-ink/60">{`${t.pct}%`}</span>
            </span>
          ))}
        </span>
        {/* The baseline the ticks hang from, under the stacks. */}
        <span className="absolute inset-x-0 h-px bg-ink/14" style={{ top: stackH + 12 }} />
      </span>

      <span id={`${id}n`} className="mt-6 block max-w-[44ch] text-small text-ink/60">{note}</span>
    </figure>
  );
}
