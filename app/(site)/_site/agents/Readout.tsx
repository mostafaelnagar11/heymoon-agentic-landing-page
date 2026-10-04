"use client";
/* WP5 · The live readout under the copy (SPEC §5.5). The agent on show (its icon, its name in Geist
   Mono, its stage), what it is doing in its own words (the unit's `note`, verbatim) or "Waiting",
   then one white glyph per agent in AGENTS order: waiting new, working cycling, done full. This row is
   the glyph system, so it does cycle; the orbit's nodes never do (ruling 35). It cycles only while the
   band is active (rule 2.4.8); otherwise a working glyph rests at phase 2, as under reduced motion.

   It is described by every orbit node (aria-describedby) and is not a live region (aria-live off):
   the orbit is ambient, so nothing is announced on its own. When the agent or the note changes it
   cross-fades over 300 ms: the outgoing line stays on top, fading, while the new one fades in under
   it, both in one grid cell so the height never moves. */
import { useState } from "react";
import type { AgentName, AgentRole, Audience } from "../data/types";
import {
  Brain, ChartLineUp, Handshake, Megaphone, PenNib, ShieldCheck, Storefront, UserFocus, UsersThree,
} from "../ui/icons";
import { useReducedMotionPref } from "../lib/prefs";
import { Moon } from "../ui/Moon";
import type { AgentState } from "./Orbit";
import s from "./orbit.module.css";

type IconCmp = typeof Storefront;

/** In AGENTS order (§5.5 icons). */
export const AGENT_ICONS: Record<Audience, IconCmp[]> = {
  brands: [Storefront, UsersThree, ShieldCheck, PenNib, Megaphone, ChartLineUp, Brain],
  creators: [UserFocus, Handshake, ShieldCheck, PenNib, Megaphone, ChartLineUp, Brain],
};

export interface ReadoutShown { index: number; name: AgentName; role: AgentRole; note: string }

export interface ReadoutProps {
  audience: Audience;
  shown: ReadoutShown;
  /** Per agent, AGENTS order. */
  states: AgentState[];
  /** The band is active (or user-paused): a working glyph may follow the shared ticker. Otherwise it
      sits still at the working glyph's static phase and the ticker loses this subscriber. */
  ticking: boolean;
  className?: string;
}

function Line({ audience, shown }: { audience: Audience; shown: ReadoutShown }) {
  const Icon = AGENT_ICONS[audience][shown.index];
  return (
    <>
      <span className="flex items-center gap-2.5">
        <Icon size={18} className="flex-none text-white/56" aria-hidden />
        <span className="mono-caps text-white/92">{shown.name}</span>
        <span className="text-micro text-white/56">{shown.role}</span>
      </span>
      <span className={`mt-2 block text-small text-white/88 ${s.note}`}>{shown.note}</span>
    </>
  );
}

export function Readout({ audience, shown, states, ticking, className = "" }: ReadoutProps) {
  const key = `${shown.index}|${shown.note}`;
  /* Derived state: on a new key, the current line becomes the outgoing one. */
  const [layers, setLayers] = useState<{ key: string; cur: ReadoutShown; prev: ReadoutShown | null; n: number }>(
    { key, cur: shown, prev: null, n: 0 },
  );
  const reduced = useReducedMotionPref();
  if (layers.key !== key) setLayers({ key, cur: shown, prev: reduced ? null : layers.cur, n: layers.n + 1 });
  /* The outgoing line leaves the DOM when its fade ends, so the readout only ever holds one line. */
  const drop = () => setLayers((l) => (l.prev ? { ...l, prev: null } : l));

  return (
    <div id="agent-readout" aria-live="off" className={`${s.readout} ${className}`}>
      <div className={s.fade}>
        {layers.prev && (
          <div key={`p${layers.n}`} className={s.out} aria-hidden onAnimationEnd={drop}>
            <Line audience={audience} shown={layers.prev} />
          </div>
        )}
        <div key={`c${layers.n}`} className={layers.n > 0 && !reduced ? s.in : undefined}>
          <Line audience={audience} shown={layers.cur} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-white" aria-hidden>
        {states.map((st, i) => (
          <Moon key={i} phase={st === "done" ? 4 : st === "working" ? 2 : 0} working={st === "working" && ticking} size={11} />
        ))}
      </div>
    </div>
  );
}
