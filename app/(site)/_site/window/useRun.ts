/* The window's schedule (SPEC §5.2.2), built from DEMO only, and the one clock that drives it.

   Every visible change in the window happens on a MARK: a unit's start or end, the size change of the
   read (4, then 9), the fold, the build start, and (creators) the MockWhy fills, the picks and the foot.
   React renders only when the clock crosses a mark, and the frame it renders is a pure function of
   that mark (`snapAt`). Everything that moves between marks (the stopwatch, the act-rail fills) is
   written per frame from the MotionValue `t`, never through React state.

   Static by default (rule 2.4.7): a timeline first rendered on the server starts at END, so the HTML,
   no-JS and the hydrated first paint all show the final state. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { DEMO } from "../data/demo";
import { COPY, LABELS } from "../copy";
import type { Audience, Run } from "../data/types";
import type { Phase, RunProgress } from "../contracts";
import { RUN } from "../tokens";
import { useTimeline, type Timeline } from "../lib/timeline";
import { useReducedMotionPref } from "../lib/prefs";

export type Act = 0 | 1 | 2;

/** §5.2.2: "Foot at P0 + 911 + 400" and "MockWhy fills (120ms stagger)". */
const FOOT_LEAD_MS = 400;
const WHY_STAGGER_MS = 120;
/** The run starts at 1 ms, not 0: at t = 0 the window is "ready" (opener, every row waiting). */
const START_MS = 1;

export interface Unit {
  i: number;
  key: string;
  agent: string;
  note: string;
  produces: string;
  start: number;          // absolute ms on the window's clock
  end: number;
}

export interface Schedule {
  audience: Audience;
  R: number;              // read ends; the stopwatch freezes
  F: number;              // fold starts
  B0: number;             // build starts
  read: Unit[];
  build: Unit[];
  sizes: { at: number; total: number }[];
  readTitle: string;
  readSub: string | null;
  buildTitle: string;
  readOpener: string | null;
  buildOpener: string | null;
  totalText: string;      // read.totalText: the only time the window ever stamps
  stamp: string;          // "Store details in" / "Your grid in"
  shown: string;          // yourstore.com / @yourhandle
  ladder: Unit | null;    // brands
  W: number | null;       // creators: the build lands, MockWhy fills
  P0: number | null;      // creators: picks lead
  picks: number[];        // creators: absolute pick entry times
  foot: number | null;    // creators
  acts: [number, number, number];
  END: number;
  marks: number[];        // sorted, unique
}

const units = (run: Run, offset: number): Unit[] =>
  run.units.map((u, i) => ({
    i, key: u.key, agent: u.agent, note: u.note, produces: u.produces,
    start: offset + u.startMs, end: offset + u.endMs,
  }));

function build(audience: Audience): Schedule {
  const d = audience === "brands" ? DEMO.brands : DEMO.creators;
  const R = d.read.totalMs;
  const F = R + RUN.foldDelayMs;
  const B0 = F + RUN.foldMs;
  const read = units(d.read, 0);
  const buildUnits = units(d.build, B0);
  const sizes = d.read.sizes.map((x) => ({ at: x.atMs, total: x.total }));

  let W: number | null = null, P0: number | null = null, foot: number | null = null;
  let picks: number[] = [];
  let ladder: Unit | null = null;
  let acts: [number, number, number];
  let END: number;
  const extra: number[] = [];

  if (audience === "brands") {
    ladder = buildUnits.find((u) => u.key === "ladder") ?? buildUnits[buildUnits.length - 1];
    END = B0 + DEMO.brands.build.totalMs + RUN.holdMs;
    acts = [0, B0, ladder.start];
  } else {
    const items = DEMO.creators.picks.items;
    W = B0 + DEMO.creators.build.totalMs;
    P0 = W + RUN.picksLeadMs;
    picks = items.map((p) => P0! + p.enterMs);
    foot = P0 + (items.at(-1)?.enterMs ?? 0) + FOOT_LEAD_MS;
    END = foot + RUN.holdMs;
    acts = [0, B0, P0];
    const reasons = DEMO.creators.match.reasons.length;
    for (let k = 0; k < reasons; k++) extra.push(W + k * WHY_STAGGER_MS);
    extra.push(P0, ...picks, foot);
  }

  const raw = [
    START_MS,
    ...read.flatMap((u) => [u.start, u.end]),
    ...sizes.map((x) => x.at),
    F, B0,
    ...buildUnits.flatMap((u) => [u.start, u.end]),
    ...extra,
    END,
  ].map((v) => Math.max(START_MS, v));
  const marks = Array.from(new Set(raw)).sort((a, b) => a - b);

  return {
    audience, R, F, B0, read, build: buildUnits, sizes,
    readTitle: d.read.title ?? LABELS.creators.readingProfile,
    readSub: d.read.sub,
    buildTitle: d.build.title ?? "",
    readOpener: d.read.opener,
    buildOpener: d.build.opener,
    totalText: d.read.totalText,
    stamp: COPY[audience].work.stamp,
    shown: audience === "brands" ? DEMO.brands.shownUrl : DEMO.creators.shownHandle,
    ladder, W, P0, picks, foot, acts, END, marks,
  };
}

const cache = new Map<Audience, Schedule>();
/** The schedule for an audience. Pure and memoised: DEMO never changes at runtime. */
export function scheduleFor(a: Audience): Schedule {
  let s = cache.get(a);
  if (!s) { s = build(a); cache.set(a, s); }
  return s;
}

/* ── the frame at a mark ── */

export type RowState = "waiting" | "working" | "done";
export interface RowSnap { u: Unit; state: RowState; shown: boolean }

export interface BrandsArt {
  kind: "brands";
  folded: boolean;                       // the read tags collapse (F)
  planOn: boolean;                       // B0
  reveal: { header: boolean; pay: boolean; markets: boolean; creators: boolean };
  checks: string[];
  phasesOn: boolean;                     // the ladder row is working or done (act 2)
  grown: boolean;                        // the ladder landed
}
export interface CreatorsArt {
  kind: "creators";
  folded: boolean;
  buildOn: boolean;                      // the profile card collects the build's products (B0 to W)
  whyOn: boolean;                        // W
  filled: number;                        // 0 to 4
  tiersOn: boolean;                      // P0
  shown: number;                         // picks entered
  foot: boolean;
}

export interface Snap {
  tm: number;
  idle: boolean;                         // t = 0: the opener, every row waiting
  act: Act;
  read: RowSnap[];
  readTotal: number;
  readDone: number;
  stamped: boolean;                      // t ≥ R: "Store details in 15.0s"
  folded: boolean;                       // t ≥ F
  buildOn: boolean;                      // t ≥ B0
  build: RowSnap[];
  buildDone: number;
  counter: string;                       // title bar counter
  moon: Phase;                           // title bar progress glyph: round(4·done/total)
  status: string;
  art: BrandsArt | CreatorsArt;
}

const line = (u: Unit) => `${u.agent} · ${u.note}`;
const stateOf = (u: Unit, tm: number): RowState =>
  tm >= u.end ? "done" : tm > 0 && tm >= u.start ? "working" : "waiting";
const progressPhase = (done: number, total: number): Phase =>
  (total > 0 ? Math.round((4 * done) / total) : 0) as Phase;

export function actAt(s: Schedule, t: number): Act {
  return t < s.acts[1] ? 0 : t < s.acts[2] ? 1 : 2;
}

function snapAt(s: Schedule, tm: number): Snap {
  let readTotal = s.sizes[0]?.total ?? s.read.length;
  for (const x of s.sizes) if (tm >= x.at) readTotal = x.total;
  const read = s.read.map((u) => ({ u, state: stateOf(u, tm), shown: u.i < readTotal }));
  const build = s.build.map((u) => ({ u, state: stateOf(u, tm), shown: true }));
  const readDone = read.filter((r) => r.state === "done").length;
  const buildDone = build.filter((r) => r.state === "done").length;
  const stamped = tm >= s.R;
  const folded = tm >= s.F;
  const buildOn = tm >= s.B0;

  let counter: string, moon: Phase;
  if (!buildOn) { counter = `${readDone}/${readTotal}`; moon = progressPhase(readDone, readTotal); }
  else { counter = `${buildDone}/${build.length}`; moon = progressPhase(buildDone, build.length); }

  let status: string;
  const working = (rows: RowSnap[]) => rows.find((r) => r.state === "working");
  if (tm <= 0) status = s.readOpener ?? line(s.read[0]);
  else if (!stamped) status = line((working(read) ?? read[readDone - 1] ?? read[0]).u);
  else if (!buildOn) status = s.buildOpener ?? line(s.read[s.read.length - 1]);
  else status = line((working(build) ?? build[Math.max(0, buildDone - 1)]).u);

  const doneKey = (k: string) => build.some((r) => r.u.key === k && r.state === "done");
  let art: BrandsArt | CreatorsArt;
  if (s.audience === "brands") {
    const checks: string[] = [];
    for (const k of ["safety", "brief"]) {
      const r = build.find((x) => x.u.key === k);
      if (r && r.state === "done") checks.push(r.u.produces);
    }
    art = {
      kind: "brands", folded, planOn: buildOn,
      reveal: { header: doneKey("pricing"), pay: doneKey("pricing"), markets: doneKey("markets"), creators: doneKey("creators") },
      checks,
      phasesOn: s.ladder !== null && tm >= s.ladder.start,
      grown: s.ladder !== null && tm >= s.ladder.end,
    };
  } else {
    const W = s.W ?? Infinity, P0 = s.P0 ?? Infinity;
    const reasons = DEMO.creators.match.reasons.length;
    art = {
      kind: "creators", folded,
      buildOn,
      whyOn: tm >= W,
      filled: tm >= W ? Math.min(reasons, Math.floor((tm - W) / WHY_STAGGER_MS) + 1) : 0,
      tiersOn: tm >= P0,
      shown: s.picks.filter((p) => tm >= p).length,
      foot: s.foot !== null && tm >= s.foot,
    };
  }

  return {
    tm, idle: tm <= 0, act: actAt(s, tm), read, readTotal, readDone, stamped, folded, buildOn, build, buildDone,
    counter, moon, status, art,
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** The act and its progress at any t (continuous: the act rail reads it per frame). */
function progressAt(s: Schedule, t: number): RunProgress {
  const act = actAt(s, t);
  const a0 = s.acts[act];
  const a1 = act === 2 ? s.END : s.acts[act + 1];
  return { act, actProgress: clamp01((t - a0) / (a1 - a0)), overall: clamp01(t / s.END), done: t >= s.END };
}

/** Per act: 0 upcoming, 1 done, else the act's progress. */
export function actFill(s: Schedule, t: number, k: Act): number {
  const p = progressAt(s, t);
  if (p.done) return 1;
  return k < p.act ? 1 : k > p.act ? 0 : p.actProgress;
}

/** Where a seek lands. With motion: the act's start (earlier acts complete instantly). Reduced motion
    never plays, so it lands on the act's END: a static step through the three states. */
export function seekTarget(s: Schedule, act: Act, reduced: boolean): number {
  if (!reduced) return s.acts[act];
  return act === 2 ? s.END : s.acts[act + 1];
}

/* ── the clock the page variant shares with the act rail (inside WP2 only) ── */

/** WorkSection provides a MotionValue; the page window mirrors its timeline into it, and the act rail
    reads it per frame. The compact variant never mirrors. */
export const RunClock = createContext<MotionValue<number> | null>(null);

export interface UseRunOpts {
  audience: Audience;
  variant: "page" | "compact";
  playing: boolean;
  loop?: boolean;
  seek?: { act: Act; nonce: number } | null;
  restartNonce?: number;
  onProgress?: (p: RunProgress) => void;
}

export interface RunApi { s: Schedule; tl: Timeline; snap: Snap }

export function useRun(o: UseRunOpts): RunApi {
  const s = scheduleFor(o.audience);
  const reduced = useReducedMotionPref();
  const tl = useTimeline({
    endMs: s.END, marks: s.marks, playing: o.playing,
    loopGapMs: o.loop ? RUN.compactGapMs : undefined,
  });
  const tm = tl.mark < 0 ? 0 : s.marks[tl.mark] ?? s.END;
  const snap = useMemo(() => snapAt(s, tm), [s, tm]);

  /* onProgress: throttled to act changes, 10% steps and done. */
  const cb = useRef(o.onProgress);
  useEffect(() => { cb.current = o.onProgress; });
  const last = useRef("");
  const report = useCallback((v: number) => {
    const p = progressAt(s, v);
    const key = `${p.act}:${Math.floor(p.overall * 10)}:${p.done ? 1 : 0}`;
    if (key === last.current) return;
    last.current = key;
    cb.current?.(p);
  }, [s]);
  useMotionValueEvent(tl.t, "change", report);
  useEffect(() => { last.current = ""; report(tl.t.get()); }, [report, tl.t]);

  /* Mirror into the shared clock (page variant only). */
  const clock = useContext(RunClock);
  const mirror = o.variant === "page" ? clock : null;
  const toClock = useCallback((v: number) => { mirror?.set(v); }, [mirror]);
  useMotionValueEvent(tl.t, "change", toClock);
  useEffect(() => { toClock(tl.t.get()); }, [toClock, tl.t]);

  /* Seek and restart, by nonce. The first values are not commands. */
  const seekNonce = useRef(o.seek?.nonce ?? 0);
  const { seek: seekTo, restart } = tl;
  useEffect(() => {
    if (!o.seek || o.seek.nonce === seekNonce.current) return;
    seekNonce.current = o.seek.nonce;
    seekTo(seekTarget(s, o.seek.act, reduced));
  }, [o.seek, s, reduced, seekTo]);
  const restartNonce = useRef(o.restartNonce ?? 0);
  useEffect(() => {
    const n = o.restartNonce ?? 0;
    if (n === restartNonce.current) return;
    restartNonce.current = n;
    restart();
  }, [o.restartNonce, restart]);

  return { s, tl, snap };
}
