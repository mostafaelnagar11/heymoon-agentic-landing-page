"use client";
/* STUB (WP0). WP2-internal: the read and build rows, with the fold (§5.2.3). WP2 owns these props and may change them. */
import type { Audience } from "../data/types";

export interface ChainListProps { audience: Audience }

export function ChainList({ audience }: ChainListProps) {
  return <div data-stub="ChainList" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 min-h-[52px]">ChainList · {audience}</div>;
}
