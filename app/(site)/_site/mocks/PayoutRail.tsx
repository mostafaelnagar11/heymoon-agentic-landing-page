/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (PayoutRailProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { PayoutRailProps } from "../contracts";

export function PayoutRail({ steps }: PayoutRailProps) {
  return <div data-stub="PayoutRail" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[72px] w-full">PayoutRail · {steps.length}</div>;
}
