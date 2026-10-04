/* ProductTile (SPEC §5.8): what a campaign card shows where a product photograph would go. Never an
   image: the hm-media tint, a soft light in one corner, and the product named, centred (12px/600 ink/72).
   The brand, when passed, sits over it in 10px mono caps. Size comes from `className` (default 112px). */
import type { ProductTileProps } from "../contracts";

const LIGHT = "radial-gradient(70% 60% at 88% 8%, rgb(255 255 255 / .75), rgb(255 255 255 / 0) 70%)";

export function ProductTile({ product, brand, className = "" }: ProductTileProps) {
  return (
    <div aria-hidden className={`hm-media relative grid place-items-center overflow-hidden rounded-[12px] px-4 text-center ${className || "size-28"}`}>
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-ink/[0.04]" style={{ background: LIGHT }} />
      <span className="relative block max-w-[18ch]">
        {brand && <span className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink/60">{brand}</span>}
        <span className="line-clamp-2 block text-balance text-[12px] font-semibold leading-4 text-ink/72">{product}</span>
      </span>
    </div>
  );
}
