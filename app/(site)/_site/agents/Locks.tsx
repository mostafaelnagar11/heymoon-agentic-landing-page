"use client";
/* WP5 · Creators only: the three Never locks (SPEC §5.5). The rows are the product's own
   DEFAULT_AUTONOMY rows locked at "never" (DEMO.creators.locks, bound). Hovering or focusing a row
   brightens its lock on the orbit's fence, so the list and the picture read as one thing. */
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { Lock } from "../ui/icons";
import s from "./orbit.module.css";

export interface LocksProps {
  audience: Audience;
  labels: string[];
  hi: number | null;
  onHi: (i: number | null) => void;
  className?: string;
}

export function Locks({ audience, labels, hi, onHi, className = "" }: LocksProps) {
  if (audience !== "creators") return null;
  const c = COPY.creators.agents;
  return (
    <div className={className}>
      <p className="mono-caps text-white/56" id="agent-locks">{c.locked}</p>
      <ul className={`mt-4 ${s.locks}`} aria-labelledby="agent-locks">
        {labels.map((label, i) => (
          <li
            key={label}
            tabIndex={0}
            className={`${s.lockRow} flex min-h-11 items-center gap-3 border-t border-white/8 py-2`}
            data-hi={hi === i ? "" : undefined}
            onPointerEnter={() => onHi(i)}
            onPointerLeave={() => onHi(null)}
            onFocus={() => onHi(i)}
            onBlur={() => onHi(null)}
          >
            <Lock size={14} className={`flex-none ${s.lockIcon}`} aria-hidden />
            {/* A product label is never cut: below about 375 px the longest row wraps instead. */}
            <span className={`min-w-0 text-small text-white/88 ${s.lockLabel}`}>{label}</span>
            <span className="mono-caps ms-auto inline-flex h-6 flex-none items-center rounded-pill px-2.5 text-white/72 ring-1 ring-white/16">
              {c.never}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
