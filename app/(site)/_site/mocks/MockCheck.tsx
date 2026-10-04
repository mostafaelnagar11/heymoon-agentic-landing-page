/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockCheckProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockCheckProps } from "../contracts";

export function MockCheck({ product }: MockCheckProps) {
  return <div data-stub="MockCheck" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[240px] w-full">MockCheck · {product}</div>;
}
