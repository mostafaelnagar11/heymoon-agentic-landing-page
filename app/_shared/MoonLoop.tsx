/* The HeyMoon emblem running the brand's official logo loop (brand/heymoon/logo-loop): 2.88 s a cycle, the moon held
   full for 2.04 s, then a shadow sweeping in from the right in hard 0.12 s steps, dark dots at 0.16, and the moon
   re-lit from the right. Keyframes and the dot map are the official SVG's, renamed so they cannot collide. Never a
   fade, never a colour. It is for the agent at work (composing, typing); the mark at rest stays the static Emblem.
   Still under reduced motion. It takes the colour of the text around it. */

/* 5x5, corners empty. Top and bottom rows: m0 m1 m2. The three middle rows: m3 m4 m5 m6 m7. */
const MAP: (string | null)[][] = [
  [null, "m0", "m1", "m2", null],
  ["m3", "m4", "m5", "m6", "m7"],
  ["m3", "m4", "m5", "m6", "m7"],
  ["m3", "m4", "m5", "m6", "m7"],
  [null, "m0", "m1", "m2", null],
];

/* fill-opacity at each 1/24 step of the cycle, from the official file (1 lit, .16 dark). */
const STEPS: Record<string, [number, number]> = {
  m0: [83.333, 95.833], m1: [79.167, 91.667], m2: [75.0, 87.5], m3: [83.333, 100],
  m4: [79.167, 95.833], m5: [75.0, 95.833], m6: [75.0, 91.667], m7: [70.833, 87.5],
};
const CSS =
  Object.entries(STEPS)
    .map(([k, [from, to]]) =>
      `@keyframes hmloop-${k}{0%{fill-opacity:1}${from}%{fill-opacity:.16}${to}%{fill-opacity:1}100%{fill-opacity:1}}` +
      `.hmloop-${k}{animation:hmloop-${k} 2.88s step-end infinite}`,
    )
    .join("") + "@media (prefers-reduced-motion:reduce){.hmloop-m0,.hmloop-m1,.hmloop-m2,.hmloop-m3,.hmloop-m4,.hmloop-m5,.hmloop-m6,.hmloop-m7{animation:none}}";

export function MoonLoop({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 5 5" width={size} height={size} className={`inline-block flex-none ${className}`} aria-hidden focusable="false">
      <style>{CSS}</style>
      {MAP.flatMap((row, r) =>
        row.map((k, c) => (k ? <circle key={`${r}${c}`} className={`hmloop-${k}`} cx={c + 0.5} cy={r + 0.5} r=".36" fill="currentColor" /> : null)),
      )}
    </svg>
  );
}
