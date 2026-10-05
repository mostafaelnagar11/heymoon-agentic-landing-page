"use client";
/* The hero H1 (SPEC §5.1.2): the CSS odometer morph (ruling 2). Zero JS motion: the line rise plays from
   the server HTML before hydration, and a switch only flips data-state. Both audiences render, stacked
   in one grid cell (globals.css .morph), so the box never changes height:
   - the active one is the page's only <h1>; the other is an inert, aria-hidden <div>;
   - server and before the first switch: active "rise", other "idle";
   - after a switch: new active "in", old active "out" (it hides itself after its exit, .morph rules).
   Each child is keyed by audience and changes element type (h1 ↔ div) on a switch, so React remounts it
   and the CSS animations restart. */
import { COPY } from "../copy";
import type { Audience } from "../data/types";
import { useAudience } from "../lib/audience";
import { inertProp } from "../lib/iso";
import s from "./hero.module.css";

const ORDER: Audience[] = ["brands", "creators"];

function Lines({ lines, grad, className }: { lines: readonly string[]; grad: number; className: string }) {
  return (
    <span aria-hidden className={className}>
      {lines.map((text, i) => (
        <span key={i} className="line" style={{ "--i": i } as React.CSSProperties}>
          <span className={i === grad ? "grad-text-night" : undefined}>{text}</span>
        </span>
      ))}
    </span>
  );
}

function LineSets({ a, stacked }: { a: Audience; stacked: boolean }) {
  const h1 = COPY[a].h1;
  /* Stacked (the eclipse hero's narrow copy column): the three-line phone set at every width. */
  if (stacked) return (
    <>
      <span className="sr-only">{h1.sentence}</span>
      <Lines lines={h1.phone} grad={h1.gradPhone} className="block" />
    </>
  );
  return (
    <>
      <span className="sr-only">{h1.sentence}</span>
      <Lines lines={h1.desktop} grad={h1.gradDesktop} className="hidden sm:block" />
      <Lines lines={h1.phone} grad={h1.gradPhone} className="sm:hidden" />
    </>
  );
}

export function Headline({ stacked = false, className = "" }: { stacked?: boolean; className?: string }) {
  const { audience, switches } = useAudience();
  return (
    <div className={`morph ${s.headline} dawn-fade text-center text-display-1 font-book text-white/[.96] ${className}`}>
      {ORDER.map((a) => {
        const active = a === audience;
        const state = switches === 0 ? (active ? "rise" : "idle") : active ? "in" : "out";
        return active ? (
          <h1 key={a} id="hero-h1" data-state={state}><LineSets a={a} stacked={stacked} /></h1>
        ) : (
          <div key={a} aria-hidden {...inertProp(true)} data-state={state}><LineSets a={a} stacked={stacked} /></div>
        );
      })}
    </div>
  );
}
