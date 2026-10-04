"use client";
/* STUB (WP0). WP5-internal: the 640x560 tilted orbit stage (§5.5). WP5 owns these props and may change them. */
import type { Audience } from "../data/types";

export interface OrbitProps { audience: Audience }

export function Orbit({ audience }: OrbitProps) {
  return <div data-stub="Orbit" className="grid place-items-center rounded-[20px] border border-dashed border-white/16 mono-caps text-white/56 h-[160px]">Orbit · {audience}</div>;
}
