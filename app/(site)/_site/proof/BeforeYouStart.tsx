"use client";
/* "Before you start" (29 Oct): the three things a brand must know before paying, agreed by Roula with Alex and Phill:
   the fixed three-phase ROAS path, the unique creator discount code (higher than any site-wide discount), and that
   brands don't select creators. Brands only; it sits after the ROAS ladder and the shortfall, before the store
   connection. The chat says the same three things beside "Start Phase 1" (brands/components/blocks.tsx). */
import { useId } from "react";
import { COPY } from "../copy";
import { Section } from "../ui/Section";
import { WordReveal } from "../ui/WordReveal";

export function BeforeYouStart() {
  const id = useId();
  const c = COPY.brands.before;
  return (
    <Section slot="before" surface="paper" audience="brands" labelledBy={id} className="py-20 sm:py-24">
      <div className="mx-auto max-w-text px-[var(--gutter)]">
        <p className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.14em] text-brand">
          <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />{c.eyebrow}
        </p>
        <WordReveal as="h2" id={id} text={c.h2} className="mt-4 max-w-[20ch] text-balance text-h2 text-ink" />
        <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {c.items.map((it, i) => (
            <li key={it.title} className="rounded-[24px] bg-white p-6 shadow-[0_0_0_1px_rgba(18,21,27,.06),0_22px_44px_-30px_rgba(25,18,52,.25)] sm:p-7">
              <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-brand/[0.08] text-[15px] font-semibold text-brand">{i + 1}</span>
              <h3 className="mt-5 text-[21px] font-semibold leading-snug tracking-[-0.015em] text-ink">{it.title}</h3>
              <p className="mt-2.5 text-body text-ink/72">{it.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
