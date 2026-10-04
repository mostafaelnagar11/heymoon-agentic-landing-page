/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (RoasDialProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { RoasDialProps } from "../contracts";

export function RoasDial({ value, min, max, label }: RoasDialProps) {
  return <div data-stub="RoasDial" role="img" aria-label={`${label}: ${value}x`} data-min={min} data-max={max} className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 size-[300px] sm:size-[360px]">RoasDial · {value}</div>;
}
