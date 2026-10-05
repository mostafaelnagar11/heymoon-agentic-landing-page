"use client";
/* WP5 · The orbit stage (SPEC §5.5, S6). Seven FULL moon glyphs on a tilted orbit around the
   four-point star. A node never shows a phase (ruling 35): its state is the glyph's brightness, and
   the agent at work sends a white beam into the star. SVG and CSS plus motion's frame loop, never a
   second canvas.

   One picture in every mode: the server, no-JS, reduced motion and the live orbit all draw the same
   tilted ellipse, so the stage is only as tall as the orbit needs and the band has no empty sky
   (§5.5 asks for a face-on circle when static; a circle needs a stage almost as tall as it is
   wide, and the tilted orbit then floats in a quarter-screen of nothing above and below it).
   - static (the server, no-JS, reduced motion, and until the band is first seen): the orbit at its
     starting angle, every glyph full size at white/56, every label shown. Pure CSS: positions are
     custom properties in container units (cqw of the stage), one set per geometry, so the server
     HTML is right at every width with no JS.
   - live: the first time the band is active, depth settles in (1.8 s: the back of the orbit shrinks
     and dims, its labels step down to names) and the orbit starts to revolve. At depth 0 and angle 0
     the positions are the static layout exactly, so the hand-off never jumps. Every position is
     written straight to style.transform from one frame.update callback, keyed on `running`: there is
     no React state per frame and nothing runs while the band is offscreen, paused or held.

   Labels sit on the side of their glyph away from the core (below a front node, above a back one),
   so they never cross a beam, the core or its corona. Near the ends of the ellipse they lean inward,
   so they never reach past the orbit toward the fence's side locks or the stage edge. A label changes
   side only while it is faded out.

   Geometry is in design units (desktop 640 wide, phone 358; the height per audience): the SVG
   scales through its viewBox and the HTML through cqw, so the stage needs no measuring to lay out. */
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
  /** false: the static picture (no depth, no motion). true: the revolving orbit. */
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
  frx: number; fry: number;        // creators: the fence
  core: number;                    // core diameter
  bow: number;                     // the beam's control-point offset
}
/* The stage is the orbit's extent plus a little air, never more. Brands (desktop): the back labels
   above (two lines when static) and the front labels below. Creators: the fence. It is rounder than
   the orbit on purpose: it is the boundary around every agent, not a second ring in the orbit's
   plane, and its top lock clears the back labels by a full line. The phone draws no labels. */
const DESK_B: Geo = { w: 640, h: 336, rx: 250, ry: 96, frx: 0, fry: 0, core: 96, bow: 40 };
const DESK_C: Geo = { ...DESK_B, h: 482, frx: 300, fry: 220 };
const PHONE_B: Geo = { w: 358, h: 184, rx: 150, ry: 58, frx: 0, fry: 0, core: 60, bow: 24 };
const PHONE_C: Geo = { ...PHONE_B, h: 286, frx: 172, fry: 126 };
const geoOf = (phone: boolean, creators: boolean) => (phone ? (creators ? PHONE_C : PHONE_B) : creators ? DESK_C : DESK_B);

const N = 7;
const LOCK_DEG = [200, 270, 340];
const DEPTH_MS = 1800;           // depth settles in on first sight, eased in and out
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
/** θi = 2π((i + ½)/7 + θt/120 000) − π/2, clockwise. Half a step on from §5.5's start, so no node
    sits dead at the top: MoonShot starts at the back right (its beam a clear diagonal into the
    star), MoonWriter at the front centre, and the fence's top lock sits in the gap between the two
    back labels instead of on one. */
const angle = (i: number, ms: number) => 2 * Math.PI * ((i + 0.5) / N + ms / (ORBIT.revS * 1000)) - Math.PI / 2;
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

/** The static custom properties for one point, in both geometries (the orbit is the same for both
    audiences; only creators has a fence). */
function staticVars(deg: number | null, i: number, kind: "node" | "lock"): CSSProperties {
  const a = deg === null ? angle(i, 0) : (deg * Math.PI) / 180;
  const d = kind === "node" ? DESK_B : DESK_C;
  const p = kind === "node" ? PHONE_B : PHONE_C;
  const [dx, dy] = kind === "node" ? [d.rx, d.ry] : [d.frx, d.fry];
  const [px, py] = kind === "node" ? [p.rx, p.ry] : [p.frx, p.fry];
  return {
    "--dx": r2(cq(dx * Math.cos(a), d)), "--dy": r2(cq(dy * Math.sin(a), d)),
    "--px": r2(cq(px * Math.cos(a), p)), "--py": r2(cq(py * Math.sin(a), p)),
    ...(kind === "node" ? { "--lean": r2(lean(Math.cos(a))) } : null),
  } as CSSProperties;
}
const NODE_VARS = Array.from({ length: N }, (_, i) => staticVars(null, i, "node"));
/** Static (and live at θ 0): the label sits above the glyph on the back half (MoonShot, MoonMatch,
    MoonScore, MoonLearning). */
const UP0 = Array.from({ length: N }, (_, i) => Math.sin(angle(i, 0)) < 0);
const LOCK_VARS = LOCK_DEG.map((d, j) => staticVars(d, j, "lock"));
/** The stage's aspect ratio per geometry: CSS picks desktop or phone, so the server is right too. */
const stageVars = (creators: boolean) => {
  const d = geoOf(false, creators), p = geoOf(true, creators);
  return { "--ar-desk": `${d.w} / ${d.h}`, "--ar-phone": `${p.w} / ${p.h}` } as CSSProperties;
};

interface BeamEls { g: SVGGElement | null; tether: SVGPathElement | null; comets: (SVGPathElement | null)[] }
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
  const beamEls = useRef<BeamEls[]>(Array.from({ length: N }, () => ({ g: null, tether: null, comets: [] })));
  const core = useRef<HTMLDivElement>(null);
  const ripple = useRef<HTMLDivElement>(null);

  /* Everything the frame callback reads, kept current without re-subscribing it. */
  const theta = useRef(0);         // accumulated revolution ms: resumes exactly where it stopped
  const depth = useRef(0);         // 0 flat (the static picture) → 1 full depth
  const k = useRef(1);             // stage px per design unit (the comet's start radius only)
  const view = useRef({ phone, dir, beams, held, creators, states });
  view.current = { phone, dir, beams, held, creators, states };
  const cache = useRef<{
    z: string[]; hidden: boolean[]; beamOn: boolean[];
    /** The side each label is drawn on, its role faded (a back label shows the name only), the ms
        left of a pending side change (-1: none), and which fence locks a label covers. */
    up: boolean[]; far: boolean[]; flip: number[]; under: boolean[];
  }>({
    z: Array(N).fill(""), hidden: Array(N).fill(false), beamOn: Array(N).fill(false),
    up: [...UP0], far: Array(N).fill(false), flip: Array(N).fill(-1), under: LOCK_DEG.map(() => false),
  });
  /** Per label, in px: width, the name line's height, the whole label's height (layout sizes, read on
      resize and once fonts load, never in the frame loop). */
  const metrics = useRef<{ w: number; name: number; full: number }[]>([]);

  /** Per node, 0..1: how much it is lit as the agent at work (eased, so a landing never pops). */
  const lit = useRef<number[]>(Array(N).fill(0));

  /** Write every position for the current revolution and depth. Cheap: about 30 style writes.
      `dt` (ms) eases the lit factors; 0 when called outside the frame loop. */
  const place = useCallback((dt = 0) => {
    const { phone: ph, dir: sx, beams: bs, held: hd, creators: cr, states: st } = view.current;
    const g = geoOf(ph, cr);
    const e = inOutCubic(depth.current);
    const { rx, ry } = g;
    const cx = g.w / 2, cy = g.h / 2;
    const pts: { x: number; y: number; a: number; sc: number; L: number; sn: number }[] = [];
    const c = cache.current;
    const kk = k.current, ms = metrics.current;

    for (let i = 0; i < N; i++) {
      const a = angle(i, theta.current);
      const sn = Math.sin(a), cs = Math.cos(a);
      const x = rx * cs * sx, y = ry * sn;
      const f = smooth(-0.25, 0.25, sn);
      const sc = 1 + (0.74 + 0.26 * f - 1) * e;           // scale .74 + .26f at full depth
      /* Opacity .45 + .55f at full depth. The agent at work is a light, so depth never dims it. */
      const want = st[i] === "working" ? 1 : 0;
      lit.current[i] += (want - lit.current[i]) * (1 - Math.exp(-dt / 180));
      const depthOp = 1 + (0.45 + 0.55 * f - 1) * e;
      const op = depthOp + (1 - depthOp) * lit.current[i];
      pts.push({ x, y, a, sc, L: lean(cs) * sx, sn });

      const node = nodes.current[i];
      if (!node) continue;
      node.style.transform = `translate3d(${cq(x, g).toFixed(3)}cqw, ${cq(y, g).toFixed(3)}cqw, 0)`;
      const z = sn > 0 ? "3" : "1";
      if (c.z[i] !== z) { node.style.zIndex = z; c.z[i] = z; }
      const gl = glyphs.current[i];
      if (gl) { gl.style.transform = `scale(${sc.toFixed(4)})`; gl.style.opacity = op.toFixed(3); }
    }

    /* Beams: a quadratic from the glyph's edge to the core's edge, bowed off the midpoint on the side
       the node is leaving, so the light trails the motion. Built before the labels, which give way to
       them. */
    const curves: { agent: number; startMs: number; s: [number, number]; q: [number, number]; e: [number, number] }[] = [];
    for (const b of bs) {
      const pt = pts[b.agent];
      if (!pt) continue;
      const px = cx + pt.x, py = cy + pt.y;
      let dx = cx - px, dy = cy - py;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const r0 = ((GLYPH / 2) * pt.sc + 3) / kk;
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
      curves.push({ agent: b.agent, startMs: b.startMs, s: [sxp, syp], q: [(sxp + exp) / 2 + nx * bow, (syp + eyp) / 2 + ny * bow], e: [exp, eyp] });
    }

    /** A label's text box in stage px, on the side and in the form it is drawn now (labels are fixed
        px, so this needs the measured sizes and k). */
    const labelBox = (i: number, far: boolean) => {
      const m = ms[i], pt = pts[i];
      if (!m || !m.w) return null;
      const nx = (cx + pt.x) * kk, ny = (cy + pt.y) * kk;
      const l = nx - m.w / 2 - pt.L * (m.w / 2 - LEAN_PX);
      const gap = (GLYPH / 2) * pt.sc;
      const top = c.up[i] ? ny - gap - LABEL_ABOVE - (far ? m.name : m.full) : ny + gap + LABEL_BELOW;
      const bottom = c.up[i] ? ny - gap - LABEL_ABOVE : top + m.full;
      return { l, r: l + m.w, t: top, b: bottom };
    };
    /** Another agent's beam runs through this label (on a small stage a neighbour's beam can). */
    const crossed = (i: number, far: boolean) => {
      if (ph || !curves.length) return false;
      const bx = labelBox(i, far);
      if (!bx) return false;
      for (const cv of curves) {
        if (cv.agent === i) continue;
        for (let n = 0; n <= 12; n++) {
          const u = n / 12, v = 1 - u;
          const X = (v * v * cv.s[0] + 2 * v * u * cv.q[0] + u * u * cv.e[0]) * kk;
          const Y = (v * v * cv.s[1] + 2 * v * u * cv.q[1] + u * u * cv.e[1]) * kk;
          if (X > bx.l && X < bx.r && Y > bx.t + 1 && Y < bx.b - 1) return true;
        }
      }
      return false;
    };

    for (let i = 0; i < N; i++) {
      const lb = labels.current[i];
      if (!lb) continue;
      const { sn, sc, L } = pts[i];
      /* With depth in, a back label shows the name only: a depth cue, and it keeps the label under
         the fence's top lock. */
      const farNow = c.up[i] && e > 0.25;
      /* A label steps out (250 ms) deep at the back of the orbit, where the far agents are dim and
         small and the readout names whoever works, and while another agent's beam runs through it:
         the light always reads, never a name with a line through it. The agent at work and a held
         node always keep theirs. */
      const keep = hd === i || st[i] === "working";
      const hide = !keep && ((e > 0.25 && sn < -0.62) || crossed(i, farNow));
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
      const far = c.up[i] && e > 0.25;
      if (c.far[i] !== far) { lb.toggleAttribute("data-far", far); c.far[i] = far; }
      lb.style.transform = labelTransform(L, c.up[i], sc);
    }

    /* The plane, the fence and its locks never move: the static CSS draws them once. */
    const { frx, fry } = g;

    /* Creators: the fence runs behind the orbit, so a label passing over one of its locks draws in
       front and the lock steps back (data-under) until it has passed. Labels are off on phone. */
    if (cr && !ph) {
      LOCK_DEG.forEach((d, j) => {
        const a = (d * Math.PI) / 180;
        const lx = (cx + frx * Math.cos(a) * sx) * kk, ly = (cy + fry * Math.sin(a)) * kk;
        let under = false;
        for (let i = 0; i < N && !under; i++) {
          if (c.hidden[i] || c.flip[i] >= 0) continue;
          const bx = labelBox(i, c.far[i]);
          if (bx) under = bx.r > lx - LOCK_R && bx.l < lx + LOCK_R && bx.b > ly - LOCK_R && bx.t < ly + LOCK_R;
        }
        if (c.under[j] !== under) { lockEls.current[j]?.toggleAttribute("data-under", under); c.under[j] = under; }
      });
    }

    /* Draw the beams: the comet runs from the node into the star over ORBIT.beamMs; the tether holds. */
    const now = t.get();
    const on = Array(N).fill(false) as boolean[];
    for (const cv of curves) {
      const el = beamEls.current[cv.agent];
      if (!el?.g || !el.tether) continue;
      on[cv.agent] = true;
      const d = `M${cv.s[0].toFixed(1)} ${cv.s[1].toFixed(1)}Q${cv.q[0].toFixed(1)} ${cv.q[1].toFixed(1)} ${cv.e[0].toFixed(1)} ${cv.e[1].toFixed(1)}`;
      el.tether.setAttribute("d", d);
      const since = now - cv.startMs;
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
      k.current = w / geoOf(view.current.phone, view.current.creators).w || 1;
      measure();
    });
    ro.observe(el);
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) measure(); });
    return () => { alive = false; ro.disconnect(); };
  }, []);

  /* Mode changes. Going live: start flat (depth 0 at θ 0 is exactly the static layout) and write
     before paint, so the hand-off never shows a frame out of place. Going static: drop every inline
     write and let the CSS layout take over again. */
  useIsoLayoutEffect(() => {
    const c = cache.current;
    if (live) {
      /* θ 0 and depth 0 are the static layout exactly, labels included. */
      theta.current = 0;
      depth.current = 0;
      lit.current.fill(0);
      /* The cache mirrors the DOM as the static branch (or the server) left it: no beam on, no label
         hidden, labels on their static sides. */
      c.z.fill(""); c.hidden.fill(false); c.beamOn.fill(false);
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
    lockEls.current.forEach((l) => l?.removeAttribute("data-under"));
    beamEls.current.forEach((b) => b.g?.removeAttribute("data-on"));
    c.z.fill(""); c.hidden.fill(false); c.beamOn.fill(false);
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
      if (depth.current < 1) depth.current = Math.min(1, depth.current + d / DEPTH_MS);
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

  /* The orbital plane, per geometry: the fence (creators), the lit disc, the inner ring, the ring.
     Drawn once; it never moves. */
  const svgPlane = (g: Geo, which: "desk" | "phone") => {
    const gid = `${uid}-${which}`;
    const { rx, ry } = g;
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
          <ellipse className={s.fence} cx={g.w / 2} cy={g.h / 2} rx={g.frx} ry={g.fry} />
        )}
        <ellipse fill={`url(#${gid}-disc)`} cx={g.w / 2} cy={g.h / 2} rx={rx} ry={ry} />
        <ellipse className={s.inner} cx={g.w / 2} cy={g.h / 2} rx={rx * INNER} ry={ry * INNER} />
        <ellipse className={s.ring} stroke={`url(#${gid}-ring)`} cx={g.w / 2} cy={g.h / 2} rx={rx} ry={ry} />
      </svg>
    );
  };
  const g = geoOf(phone, creators);

  return (
    <div
      ref={stage}
      className={s.stage}
      style={stageVars(creators)}
      data-live={live ? "" : undefined}
      data-audience={audience}
      role="group"
      aria-labelledby={labelledBy}
    >
      <div className={s.coreGlow} aria-hidden />
      {svgPlane(geoOf(false, creators), "desk")}
      {svgPlane(geoOf(true, creators), "phone")}

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
