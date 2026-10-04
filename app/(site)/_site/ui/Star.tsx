/* The four-point AI-core star (RESEARCH C4). The only copy: the window title bar (WP2), the orbit
   core (WP5) and app/icon.tsx all import it. */
import type { StarProps } from "../contracts";

export const STAR_PATH = "M12 1.6c0 5.2 5.2 10.4 10.4 10.4C17.2 12 12 17.2 12 22.4 12 17.2 6.8 12 1.6 12 6.8 12 12 6.8 12 1.6Z";

export function Star({ size = 24, className = "" }: StarProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden focusable="false">
      <path d={STAR_PATH} />
    </svg>
  );
}
