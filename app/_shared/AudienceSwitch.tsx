"use client";

/* Brands or creators: the one control both landings share.
 *
 * The old site's hero toggle, redrawn in the landing's register. On a
 * light ground, the white thumb is held up by its shadow and a hairline,
 * where on the old site's dark ground it stood out by colour alone.
 *
 * It is NAVIGATION, not tabs. Each side is a whole page with its own
 * route, its own root layout and its own design tokens (two Tailwind
 * configs that give the same class names different values), so moving
 * between them is a full page load by necessity. Next does that anyway
 * across root layouts. Here the thumb slides first and the page follows,
 * so the press reads as a switch flipping rather than as a link.
 *
 * Every class below means the same thing in both Tailwind configs:
 * stock utilities, `ink` (#12151B on both sides) and arbitrary values.
 * This file is in both configs' `content`, so anything added here must
 * stay that way.
 */

import { useEffect, useRef, useState } from "react";

export type Side = "brands" | "creators";

const ORDER: Side[] = ["brands", "creators"];
const HREF: Record<Side, string> = { brands: "/brands", creators: "/creators" };

/* The slide, and how long the page waits for it before leaving. */
const SLIDE_MS = 240;

export function AudienceSwitch({
  current,
  labels = { brands: "Brands", creators: "Creators" },
  label = "Who HeyMoon is for",
}: {
  current: Side;
  labels?: Record<Side, string>;
  label?: string;
}) {
  const [at, setAt] = useState<Side>(current);
  const leaving = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (leaving.current) clearTimeout(leaving.current); }, []);

  /* Back from the other side can restore this page from the bfcache
     with the thumb still on the side it left for. Put it home. */
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setAt(current); };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [current]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, side: Side) => {
    /* A new tab or window is the browser's business. */
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (side === current || leaving.current) return;
    setAt(side);
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    leaving.current = setTimeout(() => window.location.assign(HREF[side]), still ? 0 : SLIDE_MS);
  };

  return (
    <nav
      aria-label={label}
      className="relative grid h-12 w-[296px] grid-cols-2 rounded-full bg-ink/[0.05] ring-1 ring-inset ring-ink/[0.06]"
    >
      {/* The thumb. It sits flush in the track, as on the old site, and
          moves by transform so the slide never touches layout. In Arabic
          the brands page mirrors, so the second side is to the left. */}
      <span
        aria-hidden
        className={`absolute inset-y-0 start-0 w-1/2 rounded-full bg-white shadow-[0_1px_2px_rgba(18,21,27,0.08),0_8px_20px_-8px_rgba(18,21,27,0.28)] ring-1 ring-ink/[0.06] transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          at === ORDER[1] ? "translate-x-full rtl:-translate-x-full" : "translate-x-0"
        }`}
      />
      {ORDER.map((side) => (
        <a
          key={side}
          href={HREF[side]}
          onClick={(e) => go(e, side)}
          aria-current={side === current ? "page" : undefined}
          className={`relative z-10 flex items-center justify-center rounded-full text-[15px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
            side === at ? "text-ink" : "text-ink/55 hover:text-ink"
          }`}
        >
          {labels[side]}
        </a>
      ))}
    </nav>
  );
}
