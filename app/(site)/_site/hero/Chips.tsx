"use client";
/* The three chips under the field (SPEC §5.1.3). Pure CSS motion:
   - load: each <li> fades up at 420 + 35·i ms (motion-safe, from the server HTML);
   - switch: the list is keyed by audience, so it remounts and its words blur in from 200 ms, 35 ms apart
     (hero.module.css). Words are the smallest split (rule 2.4.5).
   Hidden while the field is invalid (hero.module.css, by :has()). */
import type { CSSProperties } from "react";
import { COPY } from "../copy";
import { useAudience } from "../lib/audience";
import { Check } from "../ui/icons";
import s from "./hero.module.css";

export function Chips({ className = "" }: { className?: string }) {
  const { audience, switches } = useAudience();
  const load = switches === 0;
  let w = 0;
  return (
    <ul
      key={audience}
      data-chips=""
      data-anim={load ? "load" : "switch"}
      className={`${s.chipList} flex max-w-[580px] flex-wrap justify-center gap-x-5 gap-y-2 px-4 ${className}`}
    >
      {COPY[audience].chips.map((chip, i) => {
        const first = w;
        return (
          <li
            key={chip}
            className={`flex items-center gap-1.5 text-micro text-white/56 ${load ? "motion-safe:animate-fade-up" : ""}`}
            style={load ? { animationDelay: `${420 + 35 * i}ms` } : undefined}
          >
            <Check size={12} weight="bold" aria-hidden className={`${s.word} flex-none text-brand-300`} style={{ "--w": first } as CSSProperties} />
            <span>
              {chip.split(/(\s+)/).map((part, k) =>
                /^\s*$/.test(part) ? part : (
                  <span key={k} className={s.word} style={{ "--w": w++ } as CSSProperties}>{part}</span>
                ),
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
