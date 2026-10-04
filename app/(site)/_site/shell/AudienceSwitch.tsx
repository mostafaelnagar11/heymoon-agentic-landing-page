"use client";
/* The audience switch (SPEC §5.0.3): a radiogroup of two real anchors, so no-JS navigates and a
   modified click opens a new tab. One Tab stop; the arrows switch and move focus. Three of these
   exist (hero, nav, close) and each has its own pill: no shared layoutId (ruling 4). */
import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import * as m from "motion/react-m";
import type { AudienceSwitchProps } from "../contracts";
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { SPRING } from "../tokens";
import { PATHS, useAudience, useWorld } from "../lib/audience";
import { useDir } from "../lib/prefs";
import { setSignal } from "../lib/signals";
import { useUncovered } from "../lib/lift";
import { inertProp } from "../lib/iso";

const ORDER: Audience[] = ["brands", "creators"];

const SIZE = {
  big: "w-[280px] h-11 sm:w-[300px] sm:h-12 text-[15px]",        // hero, close
  nav: "w-[168px] h-[34px] sm:w-[200px] sm:h-9 text-[13px]",
} as const;

const SKIN = {
  night: {
    track: "bg-white/5 shadow-track",
    thumb: "bg-white shadow-thumb",
    on: "text-night-0",
    off: "text-white/64 hover:text-white/90",
  },
  paper: {
    track: "bg-ink/5 shadow-track-paper",
    thumb: "bg-white shadow-thumb-paper",
    on: "text-ink",
    off: "text-ink/60 hover:text-ink/80",
  },
} as const;

export function AudienceSwitch({ placement, surface, hidden = false }: AudienceSwitchProps) {
  const { audience } = useAudience();
  const { select } = useWorld();
  const dirSign = useDir();
  const rootRef = useRef<HTMLDivElement>(null);
  const links = useRef<Record<Audience, HTMLAnchorElement | null>>({ brands: null, creators: null });
  const skin = SKIN[surface];

  /* The hero switch reports whether it can be seen: IO visible AND not under the sheet (the hero is
     sticky, so IO alone keeps reporting "visible" while the sheet covers it). */
  const uncovered = useUncovered(rootRef);
  const inView = useRef(true);
  useEffect(() => {
    if (placement !== "hero") return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      inView.current = e.isIntersecting;
      setSignal("heroSwitchVisible", inView.current && uncovered);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [placement, uncovered]);
  useEffect(() => {
    if (placement === "hero") setSignal("heroSwitchVisible", inView.current && uncovered);
  }, [placement, uncovered]);

  const choose = (a: Audience, focus: boolean) => {
    select(a, placement);
    if (focus) links.current[a]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = ORDER.indexOf(audience);
    const fwd = dirSign === 1 ? "ArrowRight" : "ArrowLeft";
    const back = dirSign === 1 ? "ArrowLeft" : "ArrowRight";
    let next: Audience | null = null;
    if (e.key === fwd || e.key === "ArrowDown") next = ORDER[(i + 1) % ORDER.length];
    else if (e.key === back || e.key === "ArrowUp") next = ORDER[(i - 1 + ORDER.length) % ORDER.length];
    else if (e.key === "Home") next = ORDER[0];
    else if (e.key === "End") next = ORDER[ORDER.length - 1];
    else if (e.key === " ") {
      e.preventDefault();
      const a = (e.target as HTMLElement).dataset.option as Audience | undefined;
      if (a) choose(a, true);
      return;
    }
    if (!next) return;
    e.preventDefault();
    choose(next, true);
  };

  const onClick = (a: Audience) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // browser default
    e.preventDefault();
    select(a, placement);
  };

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={COPY.shared.switchLabel}
      aria-hidden={hidden || undefined}
      {...inertProp(hidden)}
      onKeyDown={onKey}
      data-switch={placement}
      className={`relative flex rounded-pill p-0 transition-[opacity,transform,background-color,box-shadow] duration-200 ease-out ${SIZE[placement === "nav" ? "nav" : "big"]} ${skin.track} ${hidden ? "pointer-events-none scale-[.96] opacity-0" : "opacity-100"}`}
    >
      <m.span
        aria-hidden
        className={`absolute inset-y-0 start-0 w-1/2 rounded-pill transition-[background-color,box-shadow] duration-[250ms] ${skin.thumb}`}
        initial={false}
        animate={{ x: audience === "brands" ? "0%" : `${100 * dirSign}%` }}
        transition={SPRING.pill}
      />
      {ORDER.map((a) => {
        const on = a === audience;
        return (
          <a
            key={a}
            ref={(el) => { links.current[a] = el; }}
            href={PATHS[a]}
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            data-option={a}
            onClick={onClick(a)}
            className={`relative z-[1] grid flex-1 place-items-center rounded-pill font-medium tracking-[-0.01em] transition-colors duration-[250ms] ${on ? skin.on : skin.off}`}
          >
            {COPY.shared.switchOptions[a]}
          </a>
        );
      })}
    </div>
  );
}
