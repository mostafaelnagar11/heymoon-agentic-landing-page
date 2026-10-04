"use client";
/* Creators row 2, the share (§5.4). Left: the H2, the body, "Every order is counted through" and
   the two ways an order is attributed. Right: ShareScale, "10 to 16%" at figure size over one dot
   per live campaign (16), whose dots fade in by tick once it enters. */
import { useRef } from "react";
import { COPY } from "../copy";
import { view } from "../data/view";
import { ShareScale } from "../mocks/ShareScale";
import { WordReveal } from "../ui/WordReveal";
import { COPY_COL, FIGURE_COL, ROW, useEntry } from "./parts";

export function Share({ className = "" }: { className?: string }) {
  const n = COPY.creators.number;
  const scale = useRef<HTMLDivElement>(null);
  const lit = useEntry(scale, { threshold: 0.45 }) !== "armed";

  return (
    <div className={`${ROW} ${className}`}>
      <div className={COPY_COL}>
        <WordReveal as="h2" text={n.shareH2} className="max-w-[16ch] text-balance text-h2 text-ink" />
        <p className="mt-5 max-w-[48ch] text-body text-ink/72">{n.shareBody}</p>
        <p className="mt-8 text-micro text-ink/60">{n.counted}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {n.chips.map((c) => (
            <li key={c} className="rounded-receipt bg-ink/[0.04] px-3 py-2 text-small text-ink/72">{c}</li>
          ))}
        </ul>
      </div>

      <div className={`${FIGURE_COL} md:self-center`}>
        {/* An inline-size container, so ShareScale can fit its figure to the column (cqi). */}
        <div ref={scale} className="w-full [container-type:inline-size]">
          <ShareScale {...view.share()} lit={lit} />
        </div>
      </div>
    </div>
  );
}
