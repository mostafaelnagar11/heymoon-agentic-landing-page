/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockPlanProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockPlanProps } from "../contracts";

export function MockPlan({ phaseLabel }: MockPlanProps) {
  return <div data-stub="MockPlan" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[260px] w-full">MockPlan · {phaseLabel}</div>;
}
