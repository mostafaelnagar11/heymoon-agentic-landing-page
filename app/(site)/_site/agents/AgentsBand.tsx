"use client";
/* STUB (WP0). WP5 replaces the body (§5.5); keep the export name and props (AgentsBandProps). */
import type { AgentsBandProps } from "../contracts";
import { Section } from "../ui/Section";

export function AgentsBand({ audience }: AgentsBandProps) {
  return (
    <Section slot="agents" surface="paper" audience={audience} cv>
      <div data-surface="deep" data-stub="AgentsBand" className="relative mx-3 grid min-h-[600px] place-items-center overflow-hidden rounded-[28px] bg-deep sm:mx-6 sm:min-h-[820px] sm:rounded-sheet">
        <span className="mono-caps text-white/56">AgentsBand · {audience}</span>
      </div>
    </Section>
  );
}
