/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockReadProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockReadProps } from "../contracts";

export function MockRead({ title }: MockReadProps) {
  return <div data-stub="MockRead" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[300px] w-full">MockRead · {title}</div>;
}
