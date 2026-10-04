"use client";
/* STUB (WP0). WP6 replaces the body (§5.6); keep the export name and props (ConnectsProps). */
import type { ConnectsProps } from "../contracts";
import { Section } from "../ui/Section";

export function Connects({ audience }: ConnectsProps) {
  return (
    <Section slot="connects" surface="paper" audience={audience} cv className="py-16 sm:py-24">
      <div data-stub="Connects" className="mx-auto max-w-text px-[var(--gutter)]">
        <div className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[160px]">Connects · {audience}</div>
      </div>
    </Section>
  );
}
