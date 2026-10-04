"use client";
/* STUB (WP0). WP2 replaces the body (§5.2.1); keep the export name and props (WorkSectionProps). */
import type { WorkSectionProps } from "../contracts";
import { Section } from "../ui/Section";

export function WorkSection({ audience }: WorkSectionProps) {
  return (
    <Section slot="work" surface="paper" audience={audience} cv className="pb-16 pt-[72px] sm:pb-24 sm:pt-[120px]">
      <div data-stub="WorkSection" className="mx-auto max-w-text px-[var(--gutter)]">
        <div className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[170px]">WorkSection · {audience}</div>
      </div>
      <div data-surface="deep" className="mx-auto mt-10 grid h-[660px] w-[calc(100vw-24px)] place-items-center rounded-[24px] bg-deep sm:mt-16 sm:w-[min(1232px,calc(100vw-48px))] sm:rounded-frame lg:h-[720px]">
        <span className="mono-caps text-white/56">WorkingWindow</span>
      </div>
      <div className="mx-auto mt-10 max-w-text px-[var(--gutter)]">
        <div className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[180px]">ActRail</div>
      </div>
    </Section>
  );
}
