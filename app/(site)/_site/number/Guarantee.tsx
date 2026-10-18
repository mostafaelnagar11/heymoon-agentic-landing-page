"use client";
/* Brands row 1, the guarantee (§5.4, S5). Left: the H2, the body, the gradient rule and the
   signature. Right: "Guaranteed sales", $25,000 counting up critically damped (never above the
   figure), the budget and the multiple, and the curve at v1's GuaranteePanel proportion (the
   column's width × 96px; figure chrome, ruling 36), drawn as the count starts. There is no ladder
   line here (C14): Phases 2 and 3 are indicative and never stated beside "Guaranteed sales". */
import { useRef } from "react";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { Curve } from "../mocks/Curve";
import { CountUp } from "../ui/CountUp";
import { WordReveal } from "../ui/WordReveal";
import { COPY_COL, FIGURE_COL, Pledge, ROW, useEntry, withNums } from "./parts";
import s from "./number.module.css";

export function Guarantee({ titleId }: { titleId?: string }) {
  const n = COPY.brands.number;
  const { revenue, budget } = DEMO.brands.guarantee;
  /* "1x, 2x and 3x": the phases' own multiples, not one blended figure (Mostafa, 18 Oct). */
  const m = DEMO.brands.ladder.map((r) => r.multipleText);
  const multiples = `${m.slice(0, -1).join(", ")} and ${m[m.length - 1]}`;
  /* The curve starts with the count: same element box, same 50% threshold as CountUp's own trigger.
     The same entry keeps the figure line unseen while armed (.count), so whatever CountUp holds before
     it starts (its start value, "$0") is never on screen: the line comes in as the count starts. */
  const figure = useRef<HTMLParagraphElement>(null);
  const entry = useEntry(figure, { threshold: 0.5 });
  const counting = entry !== "armed";

  return (
    <div className={ROW}>
      <div className={COPY_COL}>
        <WordReveal as="h2" id={titleId} text={n.h2} className="max-w-[16ch] text-balance text-h2 text-ink" />
        <p className="mt-5 max-w-[48ch] text-body text-ink/72">{n.body}</p>
        <Pledge />
      </div>

      <div className={`${FIGURE_COL} ${s.capLine}`}>
        <p className="mono-caps text-ink/60">{n.eyebrow}</p>
        <p ref={figure} data-entry={entry} className={`${s.count} mt-3`}>
          <CountUp to={revenue.value} format="usd" className={`${s.figureUsd} ${s.fit} block text-figure text-ink`} />
        </p>
        <p className="mt-4 text-lead text-ink/72">{withNums(n.figureNote(budget.text, multiples), [budget.text, ...m])}</p>
        <Curve drawn={counting} className="mt-8 block h-24 w-full" />
      </div>
    </div>
  );
}
