"use client";
/* STUB (WP0). WP2 replaces the body (§5.2.3); keep the export name and props (WorkingWindowProps).
   WP7's promo thumbnail renders variant="compact" (360x210). */
import type { WorkingWindowProps } from "../contracts";

export function WorkingWindow({ audience, variant }: WorkingWindowProps) {
  return (
    <div
      data-stub="WorkingWindow"
      aria-hidden
      className={`grid place-items-center bg-deep mono-caps text-white/56 ${variant === "compact" ? "aspect-video w-full sm:h-[210px] sm:w-[360px]" : "h-full w-full rounded-t-window"}`}
    >
      WorkingWindow · {variant} · {audience}
    </div>
  );
}
