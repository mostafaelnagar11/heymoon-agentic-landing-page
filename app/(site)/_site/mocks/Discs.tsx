/* Discs (SPEC §5.8, C10): the plan's creators as abstract discs, never faces. `count` is bound; the
   colours cycle #A78BFA, #7C5CE0, #4D2FB0. Each has a 2px white ring and overlaps the one before by
   6px at 20px (margin-inline-start, so the stack mirrors in RTL with no extra rule). */
import type { DiscsProps } from "../contracts";

const FILLS = ["var(--v300)", "var(--v500)", "var(--v700)"] as const;

export function Discs({ count, size = 20 }: DiscsProps) {
  const overlap = Math.round(size * 0.3);
  return (
    <span aria-hidden className="inline-flex items-center">
      {Array.from({ length: Math.max(0, count) }, (_, i) => (
        <span
          key={i}
          className="block shrink-0 rounded-full ring-2 ring-white"
          style={{ width: size, height: size, background: FILLS[i % FILLS.length], marginInlineStart: i ? -overlap : 0 }}
        />
      ))}
    </span>
  );
}
