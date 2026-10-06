"use client";
/* Brands row 3, the shortfall (Mostafa, 6 Oct: "add a new section here for we pay the difference of the
   guaranteed ROAS if not achieved"). Left: the H2 and the body. Right, centred on the copy like the ROAS dial
   (no eyebrow, so no cap line; the "Paid by HeyMoon" eyebrow and its $9,300 figure went the same day:
   "remove this and bring this bar above"): one bar as wide as the guaranteed sales, the campaign's own sales in
   ink, then HeyMoon's part in the brand gradient filling the gap after it, its legend, and the sentence it
   illustrates. The figures are an example close under the signed multiple (SHORT_ROAS), worked from DEMO's
   guarantee and labelled an example, never a forecast. Built from utilities the site already ships plus inline
   styles: the CSS budget (measure.cjs, css) has no room for new rules. */
import { useRef, type CSSProperties } from "react";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { formatUSD } from "../lib/format";
import { WordReveal } from "../ui/WordReveal";
import { COPY_COL, FIGURE_COL, ROW, useEntry, withNums, type Entry } from "./parts";

/** The example close: under the signed 5x, where a campaign could plausibly land. */
const SHORT_ROAS = 4.3;
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
  const { revenue, budget, roasText: signedText } = DEMO.brands.guarantee;
  const made = Math.round(budget.value * SHORT_ROAS);
  const pays = revenue.value - made;
  const roasText = `${SHORT_ROAS}x`;
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
            {n.shortPays} <span className="num font-medium text-ink">{formatUSD(pays)}</span>
          </li>
        </ul>
        <p className="mt-6 text-lead text-ink/72">{withNums(n.shortNote(revenue.text, roasText, signedText), [revenue.text, roasText, signedText])}</p>
        <p className="mt-4 text-micro text-ink/60">{n.shortExample}</p>
      </div>
    </div>
  );
}
