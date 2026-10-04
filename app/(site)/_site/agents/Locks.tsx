"use client";
/* STUB (WP0). WP5-internal: creators only: the three Never locks (§5.5). WP5 owns these props and may change them. */
import type { Audience } from "../data/types";

export interface LocksProps { audience: Audience }

export function Locks({ audience }: LocksProps) {
  return <div data-stub="Locks" className="grid place-items-center rounded-[20px] border border-dashed border-white/16 mono-caps text-white/56 h-[160px]">Locks · {audience}</div>;
}
