"use client";
/* STUB (WP0). WP2-internal: the labelled stamp, data-stopwatch (§5.2.3). WP2 owns these props and may change them. */
import type { Audience } from "../data/types";

export interface StopwatchProps { audience: Audience }

export function Stopwatch({ audience }: StopwatchProps) {
  return <div data-stub="Stopwatch" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 min-h-[52px]">Stopwatch · {audience}</div>;
}
