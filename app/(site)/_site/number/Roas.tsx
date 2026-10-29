"use client";
/* Brands row 2, the ROAS (§5.4). Left: the H2, the body and the fixed-path line. Right: the ladder.
   29 Oct review: the RoasDial (one needle from 1x to 3x reading "2.3x") read as a ROAS you choose ("You set the
   ROAS"), and a lone 1x looks thin to a brand on a 50 to 60% margin. The ladder shows the climb instead: each
   phase is a pair of bars, what the brand pays beside the sales it guarantees, so the gap between them grows from
   1x to 3x. Bars grow in once the ladder enters; under reduced motion they are drawn at once. The dial is kept in
   mocks/RoasDial.tsx, no longer imported here. */
import { useRef } from "react";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { WordReveal } from "../ui/WordReveal";
import { COPY_COL, FIGURE_COL, ROW, useEntry } from "./parts";

const MAX_BAR = 230; // px, the tallest bar (Phase 3's guaranteed sales)

export function Roas({ className = "" }: { className?: string }) {
  const n = COPY.brands.number;
  const ladder = DEMO.brands.ladder;
  const box = useRef<HTMLDivElement>(null);
  const drawn = useEntry(box, { threshold: 0.35 }) !== "armed";
  const top = Math.max(...ladder.map((r) => r.budget.value * r.multiple));
  const usd = (v: number) => `$${v.toLocaleString("en-US")}`;
  const h = (v: number) => Math.max(10, Math.round((v / top) * MAX_BAR));

  return (
    <div className={`${ROW} ${className}`}>
      <div className={COPY_COL}>
        <WordReveal as="h2" text={n.roasH2} className="max-w-[16ch] text-balance text-h2 text-ink" />
        <p className="mt-5 max-w-[48ch] text-body text-ink/72">{n.roasBody}</p>
        <p className="mt-4 max-w-[48ch] border-l-2 border-brand/40 pl-4 text-body text-ink">{n.roasFixed(DEMO.brands.unlockPct)}</p>
      </div>

      <div className={`${FIGURE_COL} md:self-center`}>
        <div ref={box} className="mx-auto w-full max-w-[520px]">
          <ol className="grid grid-cols-3 items-end gap-4 sm:gap-6" aria-label={n.roasH2}>
            {ladder.map((r, i) => {
              const sales = r.budget.value * r.multiple;
              const delay = `${i * 140}ms`;
              return (
                <li key={r.phaseNo} className="flex flex-col items-center">
                  <span className="mb-3 rounded-full bg-brand/[0.08] px-3 py-1 text-[15px] font-semibold text-brand">{r.multipleText} ROAS</span>
                  <div className="flex h-[230px] w-full items-end justify-center gap-2" aria-hidden>
                    <span
                      className="w-[34%] rounded-t-[8px] bg-ink/[0.12] transition-[height] duration-700 ease-out motion-reduce:transition-none"
                      style={{ height: drawn ? h(r.budget.value) : 0, transitionDelay: delay }}
                    />
                    <span
                      className="w-[34%] rounded-t-[8px] bg-gradient-to-t from-brand to-[#A65FED] transition-[height] duration-700 ease-out motion-reduce:transition-none"
                      style={{ height: drawn ? h(sales) : 0, transitionDelay: delay }}
                    />
                  </div>
                  <p className="mt-3 text-[15px] font-semibold text-ink">Phase {r.phaseNo}</p>
                  <p className="mt-1 text-center text-[14px] leading-5 text-ink/64">
                    <span className="block">{n.ladderPay} <span className="font-medium text-ink">{usd(r.budget.value)}</span></span>
                    <span className="block">{n.ladderSales} <span className="font-semibold text-brand">{usd(sales)}</span></span>
                  </p>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 flex items-center justify-center gap-5 text-[13px] text-ink/60" aria-hidden>
            <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-[3px] bg-ink/[0.12]" />{n.ladderPay}</span>
            <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-[3px] bg-brand" />{n.ladderSales}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
