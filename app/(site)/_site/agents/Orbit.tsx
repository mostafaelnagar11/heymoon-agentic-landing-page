"use client";
/* WP5 · The orbit stage (SPEC §5.5, S6). Seven FULL moon glyphs on a tilted orbit around the
   four-point star. A node never shows a phase (ruling 35): its state is the glyph's brightness, and
   the agent at work sends a white beam into the star. SVG and CSS plus motion's frame loop, never a
   second canvas.

   Two modes:
   - static (the server, no-JS, reduced motion, and until the band is first seen): a face-on
     near-circle (ry = .9 rx), every glyph at white/56, every label shown. Pure CSS: positions are
     custom properties in container units (cqw of the stage), one set per geometry, so the server
     HTML is right at every width with no JS.
   - live: the first time the band is active, the circle TILTS into the inclined orbit (1.8 s, the
     same positions at tilt 0, so the hand-off never jumps) and starts to revolve. Every position is
     written straight to style.transform from one frame.update callback, keyed on `running`: there is
     no React state per frame and nothing runs while the band is offscreen, paused or held.

   Labels sit on the side of their glyph away from the core (below a front node, above a back one),
   so they never cross a beam, the core or its corona. Near the ends of the ellipse they lean inward,
   so they never reach past the orbit toward the fence's side locks or the stage edge. A label changes
   side only while it is faded out.

   Geometry is in design units (desktop 640x560, phone 358x300): the SVG scales through its viewBox
   and the HTML through cqw, so the stage needs no measuring to lay out. */
import { useCallback, useEffect, useId, useRef, type CSSProperties } from "react";
import { cancelFrame, frame, type FrameData, type MotionValue } from "motion/react";
import type { AgentName, AgentRole, Audience } from "../data/types";
import { useIsoLayoutEffect } from "../lib/iso";
import { useDir, useIsPhone } from "../lib/prefs";
import { ORBIT } from "../tokens";
import { Lock } from "../ui/icons";
import { Moon } from "../ui/Moon";
import { Star } from "../ui/Star";
import s from "./orbit.module.css";

export type AgentState = "waiting" | "working" | "done";
export interface OrbitAgent { name: AgentName; role: AgentRole }
/** A unit at work: whose beam, and when it started (the comet runs from there). */
export interface OrbitBeam { agent: number; startMs: number }

export interface OrbitProps {
  audience: Audience;
  agents: OrbitAgent[];
  /** Per agent, in AGENTS order. Ignored while static (every glyph sits at white/56). */
  states: AgentState[];
  /** false: the static face-on circle. true: the tilted, revolving orbit. */
  live: boolean;
  /** The revolution advances (live, in view, visible, not paused, nothing held). */
  running: boolean;
  /** The cycle clock (elapsed active ms), read per frame for the comets. */
  t: MotionValue<number>;
  beams: OrbitBeam[];
  /** The mark at which a unit just landed (the core pulses once per change), else null. */
  pulseAt: number | null;
  /** The node under the pointer or focus. */
  held: number | null;
  /** Creators: the Locks row under the pointer or focus brightens its fence lock. */
  lockHi: number | null;
  locks: number;
  /** The section heading: the stage is a group of seven buttons named by it. */
  labelledBy?: string;
  onHold: (i: number | null, how: "hover" | "focus") => void;
}

interface Geo {
  w: number; h: number;
  rx: number; ry: number;          // the tilted orbit (§5.5)
  rxS: number; ryS: number;        // the static face-on circle (ry = .9 rx)
  frx: number; fry: number;        // the creators fence, tilted
  frxS: number; fryS: number;      // the fence, face-on
  core: number;                    // core diameter
  bow: number;                     // the beam's control-point offset
}
/* Static (face-on) sizes, scaled to fit. Desktop: fence fryS 264 keeps the 270° lock clear of the
   label above MoonShot down to a 560 px stage. Phone (no labels): the fence's bottom (fryS 128) stays
   above the readout hairline, and the circle (106 x 95) keeps MoonShot's glyph 10 px under the lock. */
const DESK: Geo = { w: 640, h: 560, rx: 250, ry: 96, rxS: 210, ryS: 189, frx: 300, fry: 140, frxS: 276, fryS: 264, core: 96, bow: 40 };
const PHONE: Geo = { w: 358, h: 300, rx: 150, ry: 58, rxS: 106, ryS: 95, frx: 172, fry: 86, frxS: 158, fryS: 128, core: 60, bow: 24 };

const N = 7;
const LOCK_DEG = [200, 270, 340];
const TILT_MS = 1800;            // the face-on circle tilts into the orbit: a camera move, eased in and out
const GLYPH = 24;                  // px, fixed at every width
/* A comet: three dashes with their heads aligned, so the tail fades. Lengths in pathLength units. */
const COMET = [
  { len: 0.34, op: 0.22, w: 1.25 },
  { len: 0.16, op: 0.55, w: 1.25 },
  { len: 0.05, op: 1, w: 1.75 },
] as const;
const COMET_GAP = 3;               // > path length + longest dash: a dash never wraps back in
const TETHER = 0.2;                // the faint line that holds while the agent works
/* Labels (px, fixed at every width). */
const LABEL_BELOW = 8;             // glyph edge to the top of a label below it
const LABEL_ABOVE = 6;             // glyph edge to the bottom of a label above it
const LEAN_PX = 6;                 // a fully leaning label's outer edge, past the glyph centre (side locks clear down to a 400 px stage)
const FLIP_MS = 150;               // a label fades out for this long before it changes side
const LOCK_R = 14;                 // a fence lock's half size plus 1 px of air, for the label test

const outExpo = (x: number) => (x >= 1 ? 1 : x <= 0 ? 0 : 1 - Math.pow(2, -10 * x));
const inOutCubic = (x: number) => (x >= 1 ? 1 : x <= 0 ? 0 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
/** θi = 2π(i/7 + θt/120 000) − π/2: node 0 starts at the top, the orbit turns clockwise. */
const angle = (i: number, ms: number) => 2 * Math.PI * (i / N + ms / (ORBIT.revS * 1000)) - Math.PI / 2;
/** Near the ends of the ellipse a label leans inward: 0 over the middle, ±1 at the ends (cos θ = ±1). */
const lean = (cs: number) => Math.sign(cs) * smooth(0.8, 1, Math.abs(cs));
/** The label's inline transform: lean L (signed, with the direction), side, glyph scale. Matches the
    static CSS exactly at scale 1. */
const labelTransform = (L: number, up: boolean, sc: number) =>
  `translate(calc(${(-50 - 50 * L).toFixed(2)}% + ${(LEAN_PX * L).toFixed(2)}px), ${
    up ? `calc(-100% - ${((GLYPH / 2) * sc + LABEL_ABOVE).toFixed(2)}px)` : `${((GLYPH / 2) * sc + LABEL_BELOW).toFixed(2)}px`
  })`;
/** Design units to cqw of the stage (container query units: no measuring). */
const cq = (v: number, g: Geo) => (v / g.w) * 100;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** The static custom properties for one point, in both geometries. */
function staticVars(deg: number | null, i: number, kind: "node" | "lock"): CSSProperties {
  const a = deg === null ? angle(i, 0) : (deg * Math.PI) / 180;
  const pick = (g: Geo) => (kind === "node" ? [g.rxS, g.ryS] : [g.frxS, g.fryS]);
  const [dx, dy] = pick(DESK);
  const [px, py] = pick(PHONE);
  return {
    "--dx": r2(cq(dx * Math.cos(a), DESK)), "--dy": r2(cq(dy * Math.sin(a), DESK)),
    "--px": r2(cq(px * Math.cos(a), PHONE)), "--py": r2(cq(py * Math.sin(a), PHONE)),
    ...(kind === "node" ? { "--lean": r2(lean(Math.cos(a))) } : null),
  } as CSSProperties;
}
const NODE_VARS = Array.from({ length: N }, (_, i) => staticVars(null, i, "node"));
/** Static (and live at θ 0): the label sits above the glyph on the back half (MoonShot and its two neighbours). */
const UP0 = Array.from({ length: N }, (_, i) => Math.sin(angle(i, 0)) < 0);
const LOCK_VARS = LOCK_DEG.map((d, j) => staticVars(d, j, "lock"));

interface BeamEls { g: SVGGElement | null; tether: SVGPathElement | null; comets: (SVGPathElement | null)[] }
interface PlaneEls { disc?: SVGEllipseElement | null; inner?: SVGEllipseElement | null; ring?: SVGEllipseElement | null; fence?: SVGEllipseElement | null }
const INNER = 0.6;                 // the inner ring, as a share of the orbit

export function Orbit(p: OrbitProps) {
  const { audience, agents, states, live, running, t, beams, pulseAt, held, lockHi, locks, labelledBy, onHold } = p;
  const phone = useIsPhone();
  const dir = useDir();
  const uid = useId().replace(/:/g, "");
  const creators = audience === "creators";

  const stage = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLButtonElement | null)[]>([]);
  const glyphs = useRef<(HTMLSpanElement | null)[]>([]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const lockEls = useRef<(HTMLSpanElement | null)[]>([]);
  /* The orbital plane, per geometry: the lit disc, the inner ring, the orbit ring and (creators) the fence. */
  const planes = useRef<Record<"desk" | "phone", PlaneEls>>({ desk: {}, phone: {} });
  const beamEls = useRef<BeamEls[]>(Array.from({ length: N }, () => ({ g: null, tether: null, comets: [] })));
  const core = useRef<HTMLDivElement>(null);
  const ripple = useRef<HTMLDivElement>(null);

  /* Everything the frame callback reads, kept current without re-subscribing it. */
  const theta = useRef(0);         // accumulated revolution ms: resumes exactly where it stopped
  const tilt = useRef(0);          // 0 face-on → 1 inclined
  const k = useRef(1);             // stage px per design unit (the comet's start radius only)
  const view = useRef({ phone, dir, beams, held, creators, states });
  view.current = { phone, dir, beams, held, creators, states };
  const cache = useRef<{
    z: string[]; hidden: boolean[]; beamOn: boolean[]; plane: string;
    /** The side each label is drawn on, its role faded (a back label shows the name only), the ms
        left of a pending side change (-1: none), and which fence locks a label covers. */
    up: boolean[]; far: boolean[]; flip: number[]; under: boolean[];
  }>({
    z: Array(N).fill(""), hidden: Array(N).fill(false), beamOn: Array(N).fill(false), plane: "",
    up: [...UP0], far: Array(N).fill(false), flip: Array(N).fill(-1), under: LOCK_DEG.map(() => false),
  });
  /** Per label, in px: width, the name line's height, the whole label's height (layout sizes, read on
      resize and once fonts load, never in the frame loop). */
  const metrics = useRef<{ w: number; name: number; full: number }[]>([]);

  /** Per node, 0..1: how much it is lit as the agent at work (eased, so a landing never pops). */
  const lit = useRef<number[]>(Array(N).fill(0));

  /** Write every position for the current revolution and tilt. Cheap: about 30 style writes.
      `dt` (ms) eases the lit factors; 0 when called outside the frame loop. */
  const place = useCallback((dt = 0) => {
    const { phone: ph, dir: sx, beams: bs, held: hd, creators: cr, states: st } = view.current;
    const g = ph ? PHONE : DESK;
    const e = inOutCubic(tilt.current);
    const rx = g.rxS + (g.rx - g.rxS) * e;
    const ry = g.ryS + (g.ry - g.ryS) * e;
    const cx = g.w / 2, cy = g.h / 2;
    const pts: { x: number; y: number; a: number; sc: number; L: number }[] = [];
    const c = cache.current;

    for (let i = 0; i < N; i++) {
      const a = angle(i, theta.current);
      const sn = Math.sin(a), cs = Math.cos(a);
      const x = rx * cs * sx, y = ry * sn;
      const f = smooth(-0.25, 0.25, sn);
      const sc = 1 + (0.74 + 0.26 * f - 1) * e;           // scale .74 + .26f once tilted
      /* Opacity .45 + .55f once tilted. The agent at work is a light, so depth never dims it. */
      const want = st[i] === "working" ? 1 : 0;
      lit.current[i] += (want - lit.current[i]) * (1 - Math.exp(-dt / 180));
      const depthOp = 1 + (0.45 + 0.55 * f - 1) * e;
      const op = depthOp + (1 - depthOp) * lit.current[i];
      const L = lean(cs) * sx;
      pts.push({ x, y, a, sc, L });

      const node = nodes.current[i];
      if (!node) continue;
      node.style.transform = `translate3d(${cq(x, g).toFixed(3)}cqw, ${cq(y, g).toFixed(3)}cqw, 0)`;
      const z = sn > 0 ? "3" : "1";
      if (c.z[i] !== z) { node.style.zIndex = z; c.z[i] = z; }
      const gl = glyphs.current[i];
      if (gl) { gl.style.transform = `scale(${sc.toFixed(4)})`; gl.style.opacity = op.toFixed(3); }
      const lb = labels.current[i];
      if (lb) {
        /* Deep at the back of a tilted orbit a label steps out (250 ms): the far agents are dim and
           small, and the readout names whoever works. The agent at work and a held node always keep
           theirs. */
        const hide = e > 0.25 && sn < -0.62 && hd !== i && st[i] !== "working";
        if (c.hidden[i] !== hide) { lb.toggleAttribute("data-hidden", hide); c.hidden[i] = hide; }
        /* The side away from the core: above a back node, below a front one. It changes at the ends
           of the ellipse, and a visible label never jumps: it fades out (data-flip), changes side,
           then fades back in. */
        const up = sn < 0;
        if (c.up[i] !== up && c.flip[i] < 0) {
          if (hide || hd === i || dt === 0) c.flip[i] = 0;
          else { c.flip[i] = FLIP_MS; lb.setAttribute("data-flip", ""); }
        }
        if (c.flip[i] >= 0) {
          c.flip[i] -= dt;
          if (c.flip[i] <= 0 || hide || hd === i) {
            c.up[i] = up; c.flip[i] = -1;
            lb.toggleAttribute("data-up", up);
            lb.removeAttribute("data-flip");
          }
        }
        /* Once tilted, a back label shows the name only: a depth cue, and it keeps the label under
           the fence's top lock. */
        const far = c.up[i] && e > 0.25;
        if (c.far[i] !== far) { lb.toggleAttribute("data-far", far); c.far[i] = far; }
        lb.style.transform = labelTransform(L, c.up[i], sc);
      }
    }

    const frx = g.frxS + (g.frx - g.frxS) * e;
    const fry = g.fryS + (g.fry - g.fryS) * e;
    /* The plane moves only while it tilts in: written once per change, never every frame. */
    const planeKey = `${ph ? "p" : "d"}${sx}${cr ? "c" : ""}${e.toFixed(4)}`;
    if (c.plane !== planeKey) {
      c.plane = planeKey;
      const pl = planes.current[ph ? "phone" : "desk"];
      const set = (el: SVGEllipseElement | null | undefined, a: number, b: number) => {
        el?.setAttribute("rx", a.toFixed(2));
        el?.setAttribute("ry", b.toFixed(2));
      };
      set(pl.disc, rx, ry);
      set(pl.ring, rx, ry);
      set(pl.inner, rx * INNER, ry * INNER);
      if (cr) {
        set(pl.fence, frx, fry);
        LOCK_DEG.forEach((d, j) => {
          const el = lockEls.current[j];
          if (!el) return;
          const a = (d * Math.PI) / 180;
          el.style.transform = `translate3d(${cq(frx * Math.cos(a) * sx, g).toFixed(3)}cqw, ${cq(fry * Math.sin(a), g).toFixed(3)}cqw, 0)`;
        });
      }
    }

    /* Creators: the fence runs behind the orbit, so a label passing over one of its locks draws in
       front and the lock steps back (data-under) until it has passed. Labels are off on phone. */
    if (cr && !ph) {
      const kk = k.current, ms = metrics.current;
      LOCK_DEG.forEach((d, j) => {
        const a = (d * Math.PI) / 180;
        const lx = (cx + frx * Math.cos(a) * sx) * kk, ly = (cy + fry * Math.sin(a)) * kk;
        let under = false;
        for (let i = 0; i < N && !under; i++) {
          const m = ms[i], pt = pts[i];
          if (!m || !pt || c.hidden[i] || c.flip[i] >= 0) continue;
          const nx = (cx + pt.x) * kk, ny = (cy + pt.y) * kk;
          const left = nx - m.w / 2 - pt.L * (m.w / 2 - LEAN_PX);
          const top = c.up[i] ? ny - (GLYPH / 2) * pt.sc - LABEL_ABOVE - (c.far[i] ? m.name : m.full) : ny + (GLYPH / 2) * pt.sc + LABEL_BELOW;
          const bottom = c.up[i] ? ny - (GLYPH / 2) * pt.sc - LABEL_ABOVE : top + m.full;
          under = left + m.w > lx - LOCK_R && left < lx + LOCK_R && bottom > ly - LOCK_R && top < ly + LOCK_R;
        }
        if (c.under[j] !== under) { lockEls.current[j]?.toggleAttribute("data-under", under); c.under[j] = under; }
      });
    }

    /* Beams: a quadratic from the glyph's edge to the core's edge, bowed off the midpoint on the side
       the node is leaving, so the light trails the motion. */
    const now = t.get();
    const on = Array(N).fill(false) as boolean[];
    for (const b of bs) {
      const el = beamEls.current[b.agent];
      const pt = pts[b.agent];
      if (!el?.g || !el.tether || !pt) continue;
      on[b.agent] = true;
      const px = cx + pt.x, py = cy + pt.y;
      let dx = cx - px, dy = cy - py;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const r0 = ((GLYPH / 2) * pt.sc + 3) / k.current;
      const r1 = g.core / 2 + 3;
      const sxp = px + dx * r0, syp = py + dy * r0;
      const exp = cx - dx * r1, eyp = cy - dy * r1;
      let nx = -dy, ny = dx;
      const tx = -rx * Math.sin(pt.a) * sx, ty = ry * Math.cos(pt.a);    // the node's direction of travel
      if (nx * tx + ny * ty > 0) { nx = -nx; ny = -ny; }
      /* The full 40-unit bow on a normal beam; a short one (a node just above or below the core)
         bows in proportion, so it curves instead of hooking. Near the ends of the ellipse the beam
         runs flat into the core with its label just above or below it, so the bow eases to straight
         there and never lifts the light into the name. */
      const bow = g.bow * Math.min(1, Math.hypot(exp - sxp, eyp - syp) / (g.bow * 4)) * smooth(0, 0.5, Math.abs(Math.sin(pt.a)));
      const qx = (sxp + exp) / 2 + nx * bow, qy = (syp + eyp) / 2 + ny * bow;
      const d = `M${sxp.toFixed(1)} ${syp.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${exp.toFixed(1)} ${eyp.toFixed(1)}`;
      el.tether.setAttribute("d", d);
      const since = now - b.startMs;
      el.tether.style.opacity = (TETHER * smooth(0, 300, since)).toFixed(3);
      const head = outExpo(since / ORBIT.beamMs) * (1 + COMET[0].len);
      el.comets.forEach((cm, n) => {
        if (!cm) return;
        cm.setAttribute("d", d);
        cm.style.strokeDashoffset = (COMET[n].len - head).toFixed(4);
      });
    }
    for (let i = 0; i < N; i++) {
      if (c.beamOn[i] === on[i]) continue;
      beamEls.current[i].g?.toggleAttribute("data-on", on[i]);
      c.beamOn[i] = on[i];
    }
  }, [t]);

  /* Stage size → k (the glyphs and labels are fixed px, the SVG scales), and the label sizes for the
     lock test. Both are layout reads, so they happen here, never in the frame loop. */
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      metrics.current = labels.current.map((lb) => {
        const nm = lb?.firstElementChild as HTMLElement | null | undefined;
        return { w: lb?.offsetWidth ?? 0, name: nm?.offsetHeight ?? 0, full: lb?.offsetHeight ?? 0 };
      });
    };
    const ro = new ResizeObserver(([en]) => {
      const w = en.contentBoxSize?.[0]?.inlineSize ?? en.contentRect.width;
      k.current = w / (view.current.phone ? PHONE.w : DESK.w) || 1;
      measure();
    });
    ro.observe(el);
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) measure(); });
    return () => { alive = false; ro.disconnect(); };
  }, []);

  /* Mode changes. Going live: start face-on (tilt 0 is exactly the static layout) and write before
     paint, so the hand-off never shows a frame out of place. Going static: drop every inline write and
     let the CSS layout take over again. */
  useIsoLayoutEffect(() => {
    const c = cache.current;
    if (live) {
      /* θ 0 and tilt 0 are the static layout exactly, labels included. */
      theta.current = 0;
      tilt.current = 0;
      lit.current.fill(0);
      /* The cache mirrors the DOM as the static branch (or the server) left it: no beam on, no label
         hidden, labels on their static sides. */
      c.z.fill(""); c.hidden.fill(false); c.beamOn.fill(false); c.plane = "";
      c.up = [...UP0]; c.far.fill(false); c.flip.fill(-1); c.under.fill(false);
      place();
      return;
    }
    nodes.current.forEach((n) => { if (n) { n.style.transform = ""; n.style.zIndex = ""; } });
    glyphs.current.forEach((g) => { if (g) { g.style.transform = ""; g.style.opacity = ""; } });
    labels.current.forEach((l, i) => {
      if (!l) return;
      l.style.transform = "";
      l.removeAttribute("data-hidden"); l.removeAttribute("data-flip"); l.removeAttribute("data-far");
      l.toggleAttribute("data-up", UP0[i]);
    });
    lockEls.current.forEach((l) => { if (l) { l.style.transform = ""; l.removeAttribute("data-under"); } });
    beamEls.current.forEach((b) => b.g?.removeAttribute("data-on"));
    c.z.fill(""); c.hidden.fill(false); c.beamOn.fill(false); c.plane = "";
    c.up = [...UP0]; c.far.fill(false); c.flip.fill(-1); c.under.fill(false);
  }, [live, place]);

  /* Re-place when what the frame reads changes while the loop is stopped (a held node, the beams at a
     mark, a resize across the phone breakpoint, a direction change). */
  useIsoLayoutEffect(() => { if (live) place(); }, [live, place, phone, dir, beams, held, creators, states]);

  /* The revolution. Not useAnimationFrame (it never stops and runs on wall-clock time): an effect
     keyed on `running` registers one frame.update callback and its cleanup cancels it, and the angle
     accumulates clamped deltas, so it resumes exactly where it stopped. */
  useEffect(() => {
    if (!live || !running) return;
    const tick = ({ delta }: FrameData) => {
      const d = Math.min(delta, 40);
      theta.current += d;
      if (tilt.current < 1) tilt.current = Math.min(1, tilt.current + d / TILT_MS);
      place(d);
    };
    frame.update(tick, true);
    return () => cancelFrame(tick);
  }, [live, running, place]);

  /* The core pulses when a unit lands: scale 1 → 1.06 → 1 over 600 ms, and one ring goes out. */
  useEffect(() => {
    if (!live || pulseAt === null) return;
    core.current?.animate?.(
      [{ transform: "scale(1)" }, { transform: "scale(1.06)", offset: 0.35 }, { transform: "scale(1)" }],
      { duration: ORBIT.pulseMs, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    ripple.current?.animate?.(
      [{ transform: "scale(1)", opacity: 0.55 }, { transform: "scale(1.85)", opacity: 0 }],
      { duration: 1100, easing: "cubic-bezier(.16,1,.3,1)" },
    );
  }, [pulseAt, live]);

  const svgPlane = (g: Geo, which: "desk" | "phone") => {
    const gid = `${uid}-${which}`;
    const pl = planes.current[which];
    const rx = live ? g.rx : g.rxS, ry = live ? g.ry : g.ryS;
    return (
      <svg className={`${s.svg} ${which === "desk" ? s.onDesk : s.onPhone}`} viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden focusable="false">
        <defs>
          {/* Depth on a tilted ring: the near (lower) arc a little brighter. White only, never the brand gradient. */}
          <linearGradient id={`${gid}-ring`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".07" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".12" />
            <stop offset="1" stopColor="#fff" stopOpacity=".24" />
          </linearGradient>
          {/* The orbital plane catches the star's light: brightest at the core, gone by the ring. */}
          <radialGradient id={`${gid}-disc`}>
            <stop offset="0" stopColor="#fff" stopOpacity=".055" />
            <stop offset=".55" stopColor="#fff" stopOpacity=".022" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {creators && (
          <ellipse
            ref={(el) => { pl.fence = el; }}
            className={s.fence}
            cx={g.w / 2} cy={g.h / 2}
            rx={live ? g.frx : g.frxS} ry={live ? g.fry : g.fryS}
          />
        )}
        <ellipse ref={(el) => { pl.disc = el; }} fill={`url(#${gid}-disc)`} cx={g.w / 2} cy={g.h / 2} rx={rx} ry={ry} />
        <ellipse ref={(el) => { pl.inner = el; }} className={s.inner} cx={g.w / 2} cy={g.h / 2} rx={rx * INNER} ry={ry * INNER} />
        <ellipse ref={(el) => { pl.ring = el; }} className={s.ring} stroke={`url(#${gid}-ring)`} cx={g.w / 2} cy={g.h / 2} rx={rx} ry={ry} />
      </svg>
    );
  };
  const g = phone ? PHONE : DESK;

  return (
    <div ref={stage} className={s.stage} data-live={live ? "" : undefined} data-audience={audience} role="group" aria-labelledby={labelledBy}>
      <div className={s.coreGlow} aria-hidden />
      {svgPlane(DESK, "desk")}
      {svgPlane(PHONE, "phone")}

      {/* The beams: only ever drawn live, so one SVG in the current geometry is enough. */}
      <svg className={s.svg} viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden focusable="false">
        {agents.map((a, i) => (
          <g key={a.name} className={s.beam} ref={(el) => { beamEls.current[i].g = el; }}>
            <path ref={(el) => { beamEls.current[i].tether = el; }} className={s.tether} pathLength={1} />
            {COMET.map((cm, n) => (
              <path
                key={n}
                ref={(el) => { beamEls.current[i].comets[n] = el; }}
                className={s.comet}
                pathLength={1}
                strokeWidth={cm.w}
                strokeOpacity={cm.op}
                strokeDasharray={`${cm.len} ${COMET_GAP}`}
                strokeDashoffset={cm.len}
              />
            ))}
          </g>
        ))}
      </svg>

      {creators && Array.from({ length: locks }, (_, j) => (
        <span
          key={j}
          ref={(el) => { lockEls.current[j] = el; }}
          className={s.lock}
          style={LOCK_VARS[j]}
          data-hi={lockHi === j ? "" : undefined}
          aria-hidden
        >
          <Lock size={14} weight="bold" />
        </span>
      ))}

      <div className={s.coreWrap} aria-hidden>
        <div ref={ripple} className={s.ripple} />
        <div ref={core} className={s.core}>
          <Star size={36} className={s.star} />
        </div>
      </div>

      {agents.map((a, i) => (
        <button
          key={a.name}
          ref={(el) => { nodes.current[i] = el; }}
          type="button"
          className={s.node}
          style={NODE_VARS[i]}
          data-state={live ? states[i] : "idle"}
          data-held={held === i ? "" : undefined}
          aria-label={`${a.name}, ${a.role}`}
          aria-describedby="agent-readout"
          onPointerEnter={() => onHold(i, "hover")}
          onPointerLeave={() => onHold(null, "hover")}
          onFocus={() => onHold(i, "focus")}
          onBlur={() => onHold(null, "focus")}
        >
          <span ref={(el) => { glyphs.current[i] = el; }} className={s.glyph}>
            <Moon phase={4} size={GLYPH} />
          </span>
          <span ref={(el) => { labels.current[i] = el; }} className={s.label} data-up={UP0[i] ? "" : undefined} aria-hidden>
            <span className={`mono-caps ${s.name}`}>{a.name}</span>
            <span className={`text-micro ${s.role}`}>{a.role}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
