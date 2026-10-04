"use client";
/* STUB (WP0). WP3 replaces the body (§5.3); keep the export name and props (RunStageProps).
   Never `cv` on the run stage (it holds a sticky stage). */
import type { RunStageProps } from "../contracts";
import { Section } from "../ui/Section";

export function RunStage({ audience }: RunStageProps) {
  return (
    <Section slot="run" surface="paper" audience={audience} className="pt-24 sm:pt-[140px]">
      <div data-stub="RunStage" className="mx-auto max-w-text px-[var(--gutter)]">
        <div className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[calc(170px+280svh)]">RunStage · {audience}</div>
      </div>
    </Section>
  );
}
