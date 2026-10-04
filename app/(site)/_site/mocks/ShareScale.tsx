/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (ShareScaleProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { ShareScaleProps } from "../contracts";

export function ShareScale({ figure, spoken }: ShareScaleProps) {
  return <div data-stub="ShareScale" role="img" aria-label={spoken} className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[320px]">ShareScale · {figure}</div>;
}
