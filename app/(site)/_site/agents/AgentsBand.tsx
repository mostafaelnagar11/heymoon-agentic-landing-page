"use client";
/* WP5 · S6, the agents band (SPEC §5.5, B10). A deep inset panel on the paper: the copy and the live
   readout on one side, the orbit on the other (stacked below 1024: copy, stage, readout, locks).

   The cycle is one bound run, on the shared timeline (lib/timeline.ts):
   - brands: the plan build, DEMO.brands.build.units (7 rows, "Five agents on your plan"). MoonMatch
     and MoonSearch work at the same time: the safety row rides the creators step.
   - creators: the read, DEMO.creators.read.units (9 rows).
   A unit is working while startMs ≤ t < endMs and done once t ≥ endMs. At the end: rest
   ORBIT.restMs, reset to waiting, repeat. MoonLive AI and MoonLearning AI have no unit on either
   side, so they never work: they stay at "Waiting".

   Hovering or focusing a node holds the cycle and the revolution, and the readout shows that agent's
   latest note in this cycle, or "Waiting". Everything moves only while useActive (in view, page
   visible, not paused, motion allowed). Static by default: the server, no-JS and reduced motion show
   the face-on circle, every glyph full at white/56, and MoonShot's first unit in the readout. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentsBandProps } from "../contracts";
import type { Audience, RunUnit } from "../data/types";
import { COPY, SHARED } from "../copy";
import { DEMO } from "../data/demo";
import { useActive, usePlayback } from "../lib/playback";
import { useReducedMotionPref } from "../lib/prefs";
import { useTimeline } from "../lib/timeline";
import { ORBIT } from "../tokens";
import { Section } from "../ui/Section";
import { WordReveal } from "../ui/WordReveal";
import { Locks } from "./Locks";
import { Orbit, type AgentState, type OrbitBeam } from "./Orbit";
import { Readout, type ReadoutShown } from "./Readout";
import s from "./orbit.module.css";

const AGENTS = DEMO.agents;

interface Cycle {
  units: RunUnit[];
  /** The agent index (AGENTS order) of each unit. */
  who: number[];
  /** Every unit start and end, sorted and unique: the timeline's marks. */
  marks: number[];
  endMs: number;
}

function cycleOf(audience: Audience): Cycle {
  const units = audience === "brands" ? DEMO.brands.build.units : DEMO.creators.read.units;
  const who = units.map((u) => AGENTS.findIndex((a) => a.name === u.agent));
  const marks = units.flatMap((u) => [u.startMs, u.endMs]).sort((a, b) => a - b).filter((v, n, xs) => n === 0 || v !== xs[n - 1]);
  return { units, who, marks, endMs: marks[marks.length - 1] };
}
const CYCLES: Record<Audience, Cycle> = { brands: cycleOf("brands"), creators: cycleOf("creators") };

/** Each agent's state at time `at`. */
function statesAt(c: Cycle, at: number): AgentState[] {
  return AGENTS.map((_, i) => {
    let done = false;
    for (let n = 0; n < c.units.length; n++) {
      if (c.who[n] !== i) continue;
      const u = c.units[n];
      if (u.startMs <= at && at < u.endMs) return "working";
      if (u.endMs <= at) done = true;
    }
    return done ? "done" : "waiting";
  });
}

const shownOf = (i: number, note: string): ReadoutShown => ({ index: i, name: AGENTS[i].name, role: AGENTS[i].role, note });

export function AgentsBand({ audience }: AgentsBandProps) {
  const copy = COPY[audience].agents;
  const cycle = CYCLES[audience];
  const titleId = "agents-title";

  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const active = useActive(stageRef);
  const { paused } = usePlayback();

  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const held = hover ?? focus;
  const onHold = useCallback((i: number | null, how: "hover" | "focus") => (how === "hover" ? setHover : setFocus)(i), []);
  const [lockHi, setLockHi] = useState<number | null>(null);

  /* Orbiting from the first time the band is active; until then (and under reduced motion) it is the
     static face-on circle, exactly as the server drew it. A timeline first rendered on the server
     sits at its end (static by default), so going live restarts it from waiting IN THE SAME EFFECT
     as the flip: t.set(0) notifies the timeline's mark synchronously, React batches both into one
     commit, and no frame ever shows the orbit live on the end-of-cycle state (no stray readout
     line, no pulse for a unit that never landed). Swap keys the band by audience, so a new audience
     is a new mount. */
  const seen = useRef(false);
  const [orbiting, setOrbiting] = useState(false);
  const running = orbiting && active && held === null;
  const tl = useTimeline({ endMs: cycle.endMs, marks: cycle.marks, playing: running, loopGapMs: ORBIT.restMs });
  const { restart } = tl;
  useEffect(() => {
    if (active) seen.current = true;
    const want = seen.current && !reduced;
    if (want === orbiting) return;
    if (want) restart();
    setOrbiting(want);
  }, [active, reduced, orbiting, restart]);

  /* Piecewise constant between marks: `mark` (React state) changes only on a crossing. */
  const at = orbiting ? (tl.mark >= 0 ? cycle.marks[tl.mark] : 0) : cycle.endMs;
  const states = useMemo(() => statesAt(cycle, at), [cycle, at]);

  const beams = useMemo<OrbitBeam[]>(
    () => (orbiting ? cycle.units.flatMap((u, n) => (u.startMs <= at && at < u.endMs ? [{ agent: cycle.who[n], startMs: u.startMs }] : [])) : []),
    [cycle, at, orbiting],
  );
  const pulseAt = orbiting && at > 0 && cycle.units.some((u) => u.endMs === at) ? at : null;

  const shown = useMemo<ReadoutShown>(() => {
    const { units, who } = cycle;
    if (held !== null) {
      /* That agent's latest note in this cycle, or "Waiting". */
      let note: string = SHARED.waiting;
      for (let n = 0; n < units.length; n++) if (who[n] === held && units[n].startMs <= at) note = units[n].note;
      return shownOf(held, note);
    }
    if (!orbiting) {
      const first = units.findIndex((_, n) => who[n] === 0);   // MoonShot's first unit
      return shownOf(0, units[first].note);
    }
    /* The most recently started working unit (a tie goes to the later row: brands' safety row, which
       starts with creators); in the rest between cycles, the last one that started. */
    let pick = -1;
    for (let n = 0; n < units.length; n++) {
      const u = units[n];
      if (u.startMs > at) continue;
      const working = at < u.endMs;
      const best = pick < 0 ? null : units[pick];
      const bestWorking = best !== null && at < best.endMs;
      if (pick < 0 || (working && !bestWorking) || (working === bestWorking && u.startMs >= best!.startMs)) pick = n;
    }
    const n = Math.max(0, pick);
    return shownOf(who[n], units[n].note);
  }, [cycle, at, held, orbiting]);

  return (
    <Section slot="agents" surface="paper" audience={audience} cv labelledBy={titleId}>
      <div
        data-surface="deep"
        className="relative mx-3 overflow-hidden rounded-[28px] bg-deep px-5 py-14 sm:mx-6 sm:flex sm:min-h-[820px] sm:flex-col sm:justify-center sm:rounded-sheet sm:px-20 sm:py-24"
      >
        <div className={s.dust} aria-hidden />
        <div className={s.layout}>
          <div className={s.head}>
            <WordReveal as="h2" id={titleId} text={copy.h2} className={`max-w-[16ch] text-h2 text-white ${s.h2}`} />
            <p className="mt-4 max-w-[40ch] text-body text-white/72">{copy.body}</p>
          </div>

          <div ref={stageRef} className={s.stageCol} data-fence={audience === "creators" ? "" : undefined}>
            <Orbit
              audience={audience}
              agents={AGENTS}
              states={states}
              live={orbiting}
              running={running}
              t={tl.t}
              beams={beams}
              pulseAt={pulseAt}
              held={held}
              lockHi={lockHi}
              locks={audience === "creators" ? DEMO.creators.locks.length : 0}
              labelledBy={titleId}
              onHold={onHold}
            />
          </div>

          {/* The readout's working glyph cycles on the shared ticker only while the band is active, so
              nothing ticks at the footer (rule 2.4.8). Paused, it keeps its subscription and the ticker
              freezes it in place. */}
          <Readout audience={audience} shown={shown} states={states} ticking={active || paused} className={`mt-12 ${s.readoutArea}`} />

          {audience === "creators" && (
            <Locks audience={audience} labels={DEMO.creators.locks} hi={lockHi} onHi={setLockHi} className={`mt-10 ${s.locksArea}`} />
          )}
        </div>
      </div>
    </Section>
  );
}
