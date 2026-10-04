/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockCurveProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockCurveProps } from "../contracts";

export function MockCurve({ label }: MockCurveProps) {
  return <div data-stub="MockCurve" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[240px] w-full">MockCurve · {label}</div>;
}
