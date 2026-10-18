"use client";
/* Brands row 3, the shortfall (Mostafa, 6 Oct: "add a new section here for we pay the difference of the
   guaranteed ROAS if not achieved"). Left: the H2 and the body. Right, centred on the copy like the ROAS dial
   (no eyebrow, so no cap line; the "Paid by HeyMoon" eyebrow and its $9,300 figure went the same day:
   "remove this and bring this bar above"): one bar as wide as the guaranteed sales, the campaign's own sales in
   ink, then HeyMoon's part in the brand gradient filling the gap after it, its legend, and the sentence it
   illustrates. The figures are an example close under the signed multiple (SHORT_ROAS), worked from DEMO's
   guarantee and labelled an example, never a forecast.
   18 Oct, the brand team's rule (15 Oct): the guarantee REFUNDS the share of the budget the campaign missed, it
   does not pay the sales gap. The gradient is still the missed share of the sales, so it is labelled as a share,
   and the sentence turns it into the refund. Worked on the second phase since the multiples became 1x, 2x, 3x
   (Mostafa, 18 Oct): $2,000 at 2x is $4,000 guaranteed; close at $3,200 and 20% of the $2,000 comes back, $400. Built from utilities the site already ships plus inline
   styles: the CSS budget (measure.cjs, css) has no room for new rules. */
import { useRef, type CSSProperties } from "react";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { formatUSD } from "../lib/format";
import { WordReveal } from "../ui/WordReveal";
import { COPY_COL, FIGURE_COL, ROW, useEntry, withNums, type Entry } from "./parts";

/** The example close: 80% of the phase's guarantee, the line the next phase unlocks at. */
const SHORT_REACH = 0.8;
/** ease-out-expo, as --ease-out-expo. */
const EXPO = "cubic-bezier(.16, 1, .3, 1)";

/** A bar part grows from the start edge once the bar enters: the ink first, HeyMoon's part after it. */
const grow = (entry: Entry, delayMs: number): CSSProperties => ({
  transformOrigin: "0 50%",
  transform: entry === "armed" ? "scaleX(0)" : undefined,
  transition: entry === "in" ? `transform .9s ${EXPO} ${delayMs}ms` : undefined,
});
const DOT: CSSProperties = { width: 8, height: 8 };

export function Shortfall({ className = "" }: { className?: string }) {
  const n = COPY.brands.number;
  /* The second phase (Mostafa, 18 Oct: phase 2 is 2x). refund = budget × (1 − sales ÷ guaranteed), refundFor. */
  const phase = DEMO.brands.ladder[1];
  const revenue = { value: Math.round(phase.budget.value * phase.multiple), text: formatUSD(Math.round(phase.budget.value * phase.multiple)) };
  const made = Math.round(revenue.value * SHORT_REACH);
  const pays = revenue.value - made;
  const missedPct = Math.round((pays / revenue.value) * 100);
  const missedText = `${missedPct}%`;
  const reachedText = `${100 - missedPct}%`;
  const madeText = formatUSD(made);
  const refundText = formatUSD(Math.round(phase.budget.value * (pays / revenue.value)));
  const noteNums = [phase.budget.text, phase.multipleText, revenue.text, madeText, reachedText, missedText, refundText];
  const bar = useRef<HTMLDivElement>(null);
  const entry = useEntry(bar, { threshold: 0.5 });

  return (
    <div className={`${ROW} ${className}`}>
      <div className={COPY_COL}>
        <WordReveal as="h2" text={n.shortH2} className="max-w-[16ch] text-balance text-h2 text-ink" />
        <p className="mt-5 max-w-[48ch] text-body text-ink/72">{n.shortBody}</p>
      </div>

      <div className={`${FIGURE_COL} md:self-center`}>
        <div ref={bar} aria-hidden dir="ltr" className="flex h-4 w-full overflow-hidden rounded-full" style={{ background: "rgb(18 21 27 / .06)" }}>
          <span className="block bg-ink" style={{ width: `${(made / revenue.value) * 100}%`, ...grow(entry, 0) }} />
          <span className="grad-rule block" style={{ width: `${(pays / revenue.value) * 100}%`, ...grow(entry, 650) }} />
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-small text-ink/72">
          <li className="flex items-center gap-2">
            <i aria-hidden className="block shrink-0 rounded-full bg-ink" style={DOT} />
            {n.shortMade} <span className="num font-medium text-ink">{formatUSD(made)}</span>
          </li>
          <li className="flex items-center gap-2">
            <i aria-hidden className="grad-rule block shrink-0 rounded-full" style={DOT} />
            {n.shortPays} <span className="num font-medium text-ink">{missedText}</span>
          </li>
        </ul>
        <p className="mt-6 text-lead text-ink/72">{withNums(n.shortNote(phase.budget.text, phase.multipleText, revenue.text, madeText, reachedText, missedText, refundText), noteNums)}</p>
        <p className="mt-4 text-micro text-ink/60">{n.shortExample}</p>
      </div>
    </div>
  );
}
