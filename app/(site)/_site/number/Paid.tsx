"use client";
/* Creators row 1, when you get paid (§5.4, S5). Left: the H2, the body, the gradient rule and the
   signature. Right: "Your payout is paid", the word "Weekly" set in at figure size (no count: the
   creators side carries no money figure, D4), the note, and the PayoutRail, whose glyphs wax one
   by one, 300 ms apart, once it enters. */
import { useRef } from "react";
import { COPY } from "../copy";
import { view } from "../data/view";
import { PayoutRail } from "../mocks/PayoutRail";
import { WordReveal } from "../ui/WordReveal";
import { COPY_COL, FIGURE_COL, Pledge, ROW, useEntry, useStepper } from "./parts";
import s from "./number.module.css";

export function Paid({ titleId }: { titleId?: string }) {
  const n = COPY.creators.number;
  const { steps } = view.payout();
  const rail = useRef<HTMLDivElement>(null);
  const entry = useEntry(rail, { threshold: 1, rootMargin: "0px 0px -10% 0px" });
  const lit = useStepper(entry, steps.length, 300);
  const word = useRef<HTMLParagraphElement>(null);
  const setIn = useEntry(word, { threshold: 0.6 });

  return (
    <div className={ROW}>
      <div className={COPY_COL}>
        <WordReveal as="h2" id={titleId} text={n.h2} className="max-w-[16ch] text-balance text-h2 text-ink" />
        <p className="mt-5 max-w-[48ch] text-body text-ink/72">{n.body}</p>
        <Pledge />
      </div>

      <div className={`${FIGURE_COL} ${s.capLine}`}>
        <p className="mono-caps text-ink/60">{n.eyebrow}</p>
        <p ref={word} data-entry={setIn} className={`${s.figure} ${s.fit} ${s.weekly} mt-3 text-figure text-ink`}>{n.figure}</p>
        <p className="mt-4 max-w-[40ch] text-lead text-ink/72">{n.note}</p>
        <div ref={rail} className="mt-8">
          <PayoutRail steps={steps} lit={lit} />
        </div>
      </div>
    </div>
  );
}
