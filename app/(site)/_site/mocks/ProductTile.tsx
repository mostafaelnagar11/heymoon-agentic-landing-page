/* STUB (WP0). WP8 replaces the body (§5.8); keep the export name and props (ProductTileProps).
   Mocks take props only, may import copy.ts LABELS, and never import DEMO. */
import type { ProductTileProps } from "../contracts";

export function ProductTile({ product, className = "" }: ProductTileProps) {
  return <div data-stub="ProductTile" aria-hidden className={`hm-media grid size-28 place-items-center rounded-[12px] text-[12px] font-semibold text-ink/72 ${className}`}>{product}</div>;
}
