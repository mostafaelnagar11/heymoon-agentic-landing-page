"use client";
/* The audience switch (SPEC §5.0.3): a radiogroup of two real anchors, so no-JS navigates and a
   modified click opens a new tab. One Tab stop; the arrows switch and move focus. Three of these
   exist (hero, nav, close) and each has its own pill: no shared layoutId (ruling 4). */
import { useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import * as m from "motion/react-m";
import type { AudienceSwitchProps } from "../contracts";
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { MQ, SPRING } from "../tokens";
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

  /* The hero and close switches report whether they can be seen, for the nav: one switch on screen at a
     time (WP6 R5, final round).
     - hero: IO visible AND not under the sheet (the hero is sticky, so IO alone keeps reporting
       "visible" while the sheet covers it).
     - close, and the hero on short screens (MQ.short, where the hero is not sticky and scrolls away):
       in view with its top edge below the tuck line, the nav's bottom plus 16px (88px, phone 80px).
       That line is where the .tuck view timeline (close.module.css, hero.module.css) starts fading the
       switch under the pill, so the nav's switch fades in as this one fades out, and fades out the
       moment this one's top edge comes in at the bottom.
     The sticky hero keeps plain IO: its lift transform carries the switch up while it is still plainly
     in view, and a top-edge rule there would hand over far too early. */
  const uncovered = useUncovered(rootRef);
  const uncoveredNow = useRef(uncovered);
  uncoveredNow.current = uncovered;
  const seen = useRef(placement === "hero");
  const report = useCallback(() => {
    if (placement === "hero") setSignal("heroSwitchVisible", seen.current && uncoveredNow.current);
    else if (placement === "close") setSignal("closeSwitchVisible", seen.current);
  }, [placement]);
  useEffect(() => {
    if (placement === "nav") return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const short = window.matchMedia(MQ.short);
    let io: IntersectionObserver | null = null;
    let line = -1;
    const build = () => {
      const tucks = placement === "close" || short.matches;
      const cs = getComputedStyle(document.documentElement);
      const next = tucks ? (parseFloat(cs.getPropertyValue("--nav-top")) || 16) + (parseFloat(cs.getPropertyValue("--nav-h")) || 56) + 16 : 0;
      if (io && next === line) return;
      line = next;
      io?.disconnect();
      io = new IntersectionObserver(([e]) => {
        seen.current = e.isIntersecting && (!tucks || e.boundingClientRect.top >= (e.rootBounds?.top ?? line) - 0.5);
        report();
      }, { rootMargin: `-${line}px 0px 0px 0px`, threshold: [0, 0.5, 0.98, 1] });
      io.observe(el);
    };
    build();
    window.addEventListener("resize", build);
    return () => {
      window.removeEventListener("resize", build);
      io?.disconnect();
      if (placement === "close") setSignal("closeSwitchVisible", false);
    };
  }, [placement, report]);
  useEffect(() => { report(); }, [uncovered, report]);

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
