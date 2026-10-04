/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockPicksProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockPicksProps } from "../contracts";

export function MockPicks({ title, layout }: MockPicksProps) {
  return <div data-stub="MockPicks" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[280px] w-full">MockPicks · {layout} · {title}</div>;
}
