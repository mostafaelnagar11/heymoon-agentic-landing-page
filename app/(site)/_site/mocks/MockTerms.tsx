/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (MockTermsProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { MockTermsProps } from "../contracts";

export function MockTerms({ brand }: MockTermsProps) {
  return <div data-stub="MockTerms" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[300px] w-full">MockTerms · {brand}</div>;
}
