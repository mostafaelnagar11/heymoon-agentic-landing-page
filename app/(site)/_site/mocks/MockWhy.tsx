/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockWhyProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockWhyProps } from "../contracts";

export function MockWhy({ levelWord }: MockWhyProps) {
  return <div data-stub="MockWhy" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[200px] w-full">MockWhy · {levelWord}</div>;
}
