"use client";
/* STUB (WP0). WP3-internal: one step of the run (§5.3). WP3 owns these props and may change them. */
export interface RunStepProps { index: number; title: string; body: string; credit: string; state: "upcoming" | "active" | "done" }

export function RunStep({ index, title }: RunStepProps) {
  return <div data-stub="RunStep" className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[120px]">RunStep {index + 1} · {title}</div>;
}
