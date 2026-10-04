/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (CurveProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { CurveProps } from "../contracts";

export function Curve({ className = "" }: CurveProps) {
  return <div data-stub="Curve" aria-hidden className={`grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 ${className || "h-24 w-full"}`}>Curve</div>;
}
