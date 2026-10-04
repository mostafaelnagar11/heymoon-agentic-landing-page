/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockFieldProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockFieldProps } from "../contracts";

export function MockField({ kind, value }: MockFieldProps) {
  return <div data-stub="MockField" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[64px] w-full">MockField · {kind} · {value}</div>;
}
