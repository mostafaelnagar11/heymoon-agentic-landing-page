/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (DiscsProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { DiscsProps } from "../contracts";

export function Discs({ count, size = 20 }: DiscsProps) {
  return <div data-stub="Discs" aria-hidden className="inline-flex h-5 items-center rounded-full border border-dashed border-ink/16 px-2 text-[10px] text-ink/60" style={{ minWidth: count * (size - 6) + 6 }}>Discs · {count}</div>;
}
