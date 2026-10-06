"use client";
/* Brands row 3, the shortfall (Mostafa, 6 Oct: "add a new section here for we pay the difference of the
   guaranteed ROAS if not achieved"). Left: the H2 and the body. Right, on the copy column's cap line like the
   guarantee: "Paid by HeyMoon", the difference it pays on an example close under the signed multiple
   (SHORT_ROAS) counting up, and one bar as wide as the guaranteed sales: the campaign's own sales in ink, then
   HeyMoon's part in the brand gradient, filling the gap after it. The figures are worked from DEMO's guarantee and labelled an
   example, never a forecast. Built from utilities the site already ships plus inline styles: the CSS budget
   (measure.cjs, css) has no room for new rules. */
import { useRef, type CSSProperties } from "react";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { formatUSD } from "../lib/format";
import { CountUp } from "../ui/CountUp";
import { WordReveal } from "../ui/WordReveal";
import { COPY_COL, FIGURE_COL, ROW, useEntry, withNums, type Entry } from "./parts";
import s from "./number.module.css";

/** The example close: under the signed 5x, where a campaign could plausibly land. */
const SHORT_ROAS = 4.3;
/** ease-out-expo, as --ease-out-expo. */
const EXPO = "cubic-bezier(.16, 1, .3, 1)";

/** A bar part grows from the start edge once the figure enters: the ink first, HeyMoon's part after it. */
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
  /* Same entry as the guarantee's figure: the line stays unseen while armed, then counts as the bar fills. */
  const figure = useRef<HTMLParagraphElement>(null);
  const entry = useEntry(figure, { threshold: 0.5 });

  return (
    <div className={`${ROW} ${className}`}>
      <div className={COPY_COL}>
        <WordReveal as="h2" text={n.shortH2} className="max-w-[16ch] text-balance text-h2 text-ink" />
        <p className="mt-5 max-w-[48ch] text-body text-ink/72">{n.shortBody}</p>
      </div>

      <div className={`${FIGURE_COL} ${s.capLine}`}>
        <p className="mono-caps text-ink/60">{n.shortEyebrow}</p>
        <p ref={figure} data-entry={entry} className={`${s.count} mt-3`}>
          <CountUp to={pays} format="usd" className={`${s.figureUsd} ${s.fit} block text-figure text-ink`} />
        </p>
        {/* The multiples sit here, not in the eyebrow, whose mono caps would set them as "4.3X". */}
        <p className="mt-4 text-lead text-ink/72">{withNums(n.shortNote(revenue.text, roasText, signedText), [revenue.text, roasText, signedText])}</p>

        <div aria-hidden dir="ltr" className="mt-8 flex h-4 w-full overflow-hidden rounded-full" style={{ background: "rgb(18 21 27 / .06)" }}>
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
        <p className="mt-6 text-micro text-ink/60">{n.shortExample}</p>
      </div>
    </div>
  );
}
