"use client";
/* STUB (WP0). WP2-internal: the three act cards under the frame (§5.2.4). WP2 owns these props and may change them. */
import type { Audience } from "../data/types";

export interface ActRailProps { audience: Audience }

export function ActRail({ audience }: ActRailProps) {
  return <div data-stub="ActRail" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 min-h-[52px]">ActRail · {audience}</div>;
}
