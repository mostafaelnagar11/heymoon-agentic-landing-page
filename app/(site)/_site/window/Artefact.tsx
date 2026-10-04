"use client";
/* STUB (WP0). WP2-internal: the store or handle card, then the plan or the tiers (§5.2.3). WP2 owns these props and may change them. */
import type { Audience } from "../data/types";

export interface ArtefactProps { audience: Audience }

export function Artefact({ audience }: ArtefactProps) {
  return <div data-stub="Artefact" aria-hidden className="grid place-items-center rounded-[20px] border border-dashed border-ink/16 mono-caps text-ink/60 min-h-[52px]">Artefact · {audience}</div>;
}
