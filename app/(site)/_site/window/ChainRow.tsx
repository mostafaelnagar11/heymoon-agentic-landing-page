"use client";
/* STUB (WP0). WP2-internal: one 52px row: waiting, working, done (§5.2.3). WP2 owns these props and may change them. */
import type { Audience } from "../data/types";

export interface ChainRowProps { audience: Audience }

export function ChainRow({ audience }: ChainRowProps) {
  return <div data-stub="ChainRow" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 min-h-[52px]">ChainRow · {audience}</div>;
}
