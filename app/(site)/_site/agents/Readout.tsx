"use client";
/* STUB (WP0). WP5-internal: the live readout under the copy (§5.5). WP5 owns these props and may change them. */
import type { Audience } from "../data/types";

export interface ReadoutProps { audience: Audience }

export function Readout({ audience }: ReadoutProps) {
  return <div data-stub="Readout" className="grid place-items-center rounded-[20px] border border-dashed border-white/16 mono-caps text-white/56 h-[160px]">Readout · {audience}</div>;
}
