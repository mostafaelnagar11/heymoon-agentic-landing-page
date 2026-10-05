"use client";
/* Brands row 2, the ROAS (§5.4). Left: the H2 and the body. Right: the RoasDial at 360px (phone 300),
   sweeping to the guaranteed multiple once it enters. The climb label and the P1 to P3 chips are gone
   (Mostafa, 5 Oct: "no one knows what is P1, P2 or P3, remove this totally"). */
import { useRef } from "react";
import { COPY } from "../copy";
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
      </div>

      <div className={`${FIGURE_COL} md:self-center`}>
        <div ref={dial} className="mx-auto w-full max-w-[300px] sm:max-w-[360px]">
          <RoasDial {...view.dial()} label={n.dialLabel} note={n.dialNote} drawn={drawn} />
        </div>
      </div>
    </div>
  );
}
