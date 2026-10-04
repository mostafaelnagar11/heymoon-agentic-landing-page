"use client";
/* "Skip to content". The native #main jump is the no-JS path; with JS it focuses main and scrolls
   with Lenis immediately (Lenis's own anchor handling is off, §5.0.1). */
import type { MouseEvent } from "react";
import { COPY } from "../copy";
import { scrollToY, yFor } from "../lib/scroll";

export function SkipLink() {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const main = document.getElementById("main");
    if (!main) return;
    e.preventDefault();
    main.focus({ preventScroll: true });
    scrollToY(yFor(main, 0), { immediate: true });
  };
  return (
    <a
      href="#main"
      onClick={onClick}
      className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-skip focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:text-small focus:font-semibold focus:text-ink"
    >
      {COPY.shared.skip}
    </a>
  );
}
