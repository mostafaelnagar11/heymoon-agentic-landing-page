"use client";
/* STUB (WP0). WP4 replaces the body (§5.4); keep the export name and props (NumberSectionProps). */
import type { NumberSectionProps } from "../contracts";
import { Section } from "../ui/Section";

export function NumberSection({ audience }: NumberSectionProps) {
  return (
    <Section slot="number" surface="paper" audience={audience} cv className="py-[120px]">
      <div data-stub="NumberSection" className="mx-auto max-w-text px-[var(--gutter)]">
        <div className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[910px]">NumberSection · {audience}</div>
      </div>
    </Section>
  );
}
