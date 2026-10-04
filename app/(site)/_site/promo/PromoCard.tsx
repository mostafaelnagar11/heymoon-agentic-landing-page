"use client";
/* STUB (WP0). WP7-internal: the card (§5.7), rendered only while open. WP7 owns these props. */
import type { Audience } from "../data/types";

export interface PromoCardProps { audience: Audience; onClose(): void }

export function PromoCard({ audience }: PromoCardProps) {
  return <div data-stub="PromoCard" className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 h-[420px] w-[360px] bg-white">PromoCard · {audience}</div>;
}
