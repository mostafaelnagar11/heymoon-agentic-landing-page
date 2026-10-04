/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockPhasesProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockPhasesProps } from "../contracts";

export function MockPhases({ rungs }: MockPhasesProps) {
  return <div data-stub="MockPhases" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[120px] w-full">MockPhases · {rungs.length}</div>;
}
