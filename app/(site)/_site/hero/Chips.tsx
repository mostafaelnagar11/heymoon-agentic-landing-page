"use client";
/* STUB (WP0). WP1 replaces the body (§5.1.3). The stub lists the chips statically, at their real size. */
import { COPY } from "../copy";
import { useAudience } from "../lib/audience";
import { Check } from "../ui/icons";

export function Chips({ className = "" }: { className?: string }) {
  const { audience } = useAudience();
  return (
    <ul data-stub="Chips" className={`flex max-w-[580px] flex-wrap justify-center gap-x-5 gap-y-2 px-4 ${className}`}>
      {COPY[audience].chips.map((c) => (
        <li key={c} className="flex items-center gap-1.5 text-micro text-white/56">
          <Check size={12} weight="bold" className="text-brand-300" aria-hidden />
          {c}
        </li>
      ))}
    </ul>
  );
}
