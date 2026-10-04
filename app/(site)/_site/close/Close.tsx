"use client";
/* STUB (WP0). WP6 replaces the body (§5.6): the fork, with the close switch, the H2 morph, the close
   Field on its own Horizon. Keep the export name and props (CloseProps: urgent audience). */
import type { CloseProps } from "../contracts";
import { useAudience } from "../lib/audience";

export function Close({}: CloseProps) {
  const { audience } = useAudience();
  return (
    <section data-slot="close" data-surface="night" data-stub="Close" className="relative z-close -mt-8 grid min-h-svh place-items-center overflow-clip bg-night-1">
      <div className="grid place-items-center rounded-[20px] border border-dashed border-white/16 mono-caps text-white/56 h-[50svh] w-[min(1120px,calc(100vw-32px))]">Close · {audience}</div>
    </section>
  );
}
