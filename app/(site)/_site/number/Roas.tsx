"use client";
/* Brands row 2, the ROAS (§5.4). Left: the H2, the body, the climb label and the P1 to P3 chips
   (approved A4 copy; P1 is the phase that runs first). Right: the RoasDial at 360px (phone 300),
   sweeping to the guaranteed multiple once it enters. */
import { useRef } from "react";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { view } from "../data/view";
import { RoasDial } from "../mocks/RoasDial";
import { WordReveal } from "../ui/WordReveal";
import { COPY_COL, FIGURE_COL, ROW, useEntry } from "./parts";

export function Roas({ className = "" }: { className?: string }) {
  const n = COPY.brands.number;
  const dial = useRef<HTMLDivElement>(null);
  const drawn = useEntry(dial, { threshold: 0.45 }) !== "armed";

  return (
    <div className={`${ROW} ${className}`}>
      <div className={COPY_COL}>
        <WordReveal as="h2" text={n.roasH2} className="max-w-[16ch] text-balance text-h2 text-ink" />
        <p className="mt-5 max-w-[48ch] text-body text-ink/72">{n.roasBody}</p>
        <p className="mt-8 text-micro text-ink/60">{n.climb}</p>
        <ol className="mt-3 flex flex-wrap gap-2">
          {DEMO.brands.ladder.map((r, i) => (
            <li
              key={r.phaseNo}
              className={`num rounded-receipt px-3 py-2 text-small ${i === 0 ? "bg-brand/8 font-semibold text-brand" : "bg-ink/[0.04] text-ink/72"}`}
            >
              {n.chip(r)}
            </li>
          ))}
        </ol>
      </div>

      <div className={`${FIGURE_COL} md:self-center`}>
        <div ref={dial} className="mx-auto w-full max-w-[300px] [container-type:inline-size] sm:max-w-[360px]">
          <RoasDial {...view.dial()} label={n.dialLabel} note={n.dialNote} drawn={drawn} />
        </div>
      </div>
    </div>
  );
}
