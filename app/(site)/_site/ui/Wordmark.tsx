/* The emblem, then "HeyMoon" plus a ".AI" span. Text only: callers wrap it in their own plain <a> (rule 2.4.11).
   The emblem is the page's own thread, the 5x5 moon-phase dot glyph (ui/Moon.tsx), drawn here at full and
   static: the mark never animates. It takes the wordmark's colour, so it re-skins with the nav. */
import { MOON_BITMAPS } from "./Moon";

const SIZE = { sm: "text-[15px]", md: "text-[17px]", lg: "text-[19px]" } as const;
/* Emblem side in px per size: a touch above the cap height, so the round mark reads as tall as the H. */
const EMBLEM = { sm: 14, md: 16, lg: 18 } as const;
const TONE = {
  night: { base: "text-white", ai: "text-brand-300" },   // ".AI" #A78BFA
  paper: { base: "text-ink", ai: "text-brand-700" },     // ".AI" #4D2FB0
} as const;

/* The full-moon bitmap's 21 dots (corners empty). */
const FULL: { r: number; c: number }[] = [];
MOON_BITMAPS[4].forEach((row, r) => row.split("").forEach((ch, c) => { if (ch === "#") FULL.push({ r, c }); }));

export function Emblem({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 5 5" width={size} height={size} className={`flex-none ${className}`} aria-hidden focusable="false">
      {FULL.map(({ r, c }) => <circle key={`${r}${c}`} cx={c + 0.5} cy={r + 0.5} r=".36" fill="currentColor" />)}
    </svg>
  );
}

export function Wordmark({ size = "md", tone = "night", className = "" }: {
  size?: keyof typeof SIZE; tone?: keyof typeof TONE; className?: string;
}) {
  const t = TONE[tone];
  return (
    <span dir="ltr" className={`inline-flex select-none items-center gap-[0.42em] whitespace-nowrap font-semibold tracking-[-0.03em] transition-colors duration-[250ms] ${SIZE[size]} ${t.base} ${className}`}>
      <Emblem size={EMBLEM[size]} />
      <span>
        HeyMoon<span className={`transition-colors duration-[250ms] ${t.ai}`}>.AI</span>
      </span>
    </span>
  );
}
