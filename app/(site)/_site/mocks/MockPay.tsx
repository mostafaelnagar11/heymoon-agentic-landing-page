/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockPayProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockPayProps } from "../contracts";

export function MockPay({ total }: MockPayProps) {
  return <div data-stub="MockPay" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[240px] w-full">MockPay · {total}</div>;
}
