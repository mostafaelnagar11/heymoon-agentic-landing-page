/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockTiersProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockTiersProps } from "../contracts";

export function MockTiers({ picks }: MockTiersProps) {
  return <div data-stub="MockTiers" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[240px] w-full">MockTiers · {picks.length}</div>;
}
