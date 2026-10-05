/* The Eclipse hero's shared contract (docs/redesign/HERO-V2.md §12). The lead owns this file: every package
   imports from it and nobody else edits it. Pure types, constants and functions: no React, no DOM reads,
   no shader source and none of measure.cjs's shader markers. EclipseSky and the poster import a few
   constants on the first load; webpack drops the exports nobody imports.

   Units. S is the stage box's side in CSS px (the square .stage element; the star's centre is its centre).
   "Stage units" are fractions of S, origin at the stage's top-left, y down. Angles are degrees,
   counter-clockwise from the inline-end (+x) axis with y up, in LTR terms (the scene the shader draws).
   The shader's uv is (fragment − stage centre) / (S/2), y up: a radius of k S is 2k in uv.

   Waves. Wave 1 (plan item 6, "no flat star, ever") builds the members marked WAVE 1. The members marked
   RESERVED are the agreed shapes for plan items 1, 2, 5 and 7; they stay optional until their wave lands. */
import type { AgentName, Audience } from "../data/types";

export type { Audience };

/* ── Camera and geometry (the prototype's constants; the renderer's GLSL uses the same numbers) ── */

/** Prototype camera: scale S, camera z CZ, eclipse plane depth DZ, eclipse ring radius RM (scene units). */
export const CAM = { scale: 1.12, cz: 7, dz: 3.2, rm: 1.08 } as const;
/** Tip distance from the centre, in S (the glass star's four tips). 0.4464 */
export const TIP = 0.5 / CAM.scale;
/** The eclipse ring's radius on screen, in S. 0.3309 */
export const RING = (CAM.rm * CAM.cz) / (CAM.scale * (CAM.cz + CAM.dz)) / 2;
/** Half-width of an arm where it crosses the ring, in degrees (from the star path). */
export const ARM_HALF_DEG = 7.8;

/** The hero background, `--night-1` (#010317). Where the renderer draws no light it writes exactly this. */
export const NIGHT1 = [1, 3, 23] as const;

/** All light is multiplied by 1 − smoothstep(LIGHT_FADE[0], LIGHT_FADE[1], r / S), r = distance from the
    star's centre in CSS px: exactly NIGHT1 beyond 0.98 S, so a poster box of 2 S holds every lit pixel. */
export const LIGHT_FADE = [0.8, 0.98] as const;

/* ── Rest pose and the handover (WAVE 1) ── */

/** The prototype's idle sway at t seconds of the sway clock (radians, before focus damping and pointer). */
export function swayAt(t: number): { yaw: number; pitch: number; roll: number } {
  return {
    yaw: -0.12 + 0.2 * Math.sin(t * 0.23) + 0.07 * Math.sin(t * 0.61 + 1),
    pitch: 0.1 + 0.13 * Math.sin(t * 0.19 + 1.7),
    roll: 0.05 * Math.sin(t * 0.13),
  };
}

/** The resting frame: the renderer's first frame and every poster are exactly this state.
    Pose = swayAt(0) (yaw −0.0611, pitch 0.2289, roll 0), no flip or spin, focus 0, pointer 0, pulse 0,
    glints 0, sweep 0, trail 0, flash 0, energy 0, intro fully lit (the corona never starts dimmed),
    the glare band at its start offset, shader time 0. The bead angle per audience is BEAD_REST_RAD. */
export const REST = {
  ...swayAt(0),
  intro: 1,
  glare: -1.3,
  time: 0,
} as const;

/** WAVE 1: the bead's resting angle (radians, the renderer's A.z), as the fast track ships it
    (brands upper inline-end, creators half a turn on). Plan item 1 moves it to BEAD_TARGET_DEG and the
    posters are captured again (scripts/hero-poster.cjs). */
export const BEAD_REST_RAD: Readonly<Record<Audience, number>> = { brands: 0.8, creators: 0.8 - Math.PI };
/** RESERVED (item 1, review M1): 14 degrees clear of the arms, 180 apart, travelling through 180 (the field side). */
export const BEAD_TARGET_DEG: Readonly<Record<Audience, number>> = { brands: 112, creators: 292 };

/** The poster fades out over this once the first frame is drawn (the canvas is already opaque under it). */
export const POSTER_FADE_MS = 240;
/** The renderer holds the resting frame until release(); if nobody calls it, it releases itself this long
    after onReady. */
export const RELEASE_FALLBACK_MS = 1200;
/** After release the sway clock's speed eases from 0 to 1 over this (smoothstep), and the pointer's pull
    is scaled by the same factor (review L1), so the star leaves the resting pose with zero velocity. */
export const SWAY_IN_S = 2;

/* ── The poster (WAVE 1): files written by scripts/hero-poster.cjs, shown by sky/EclipsePoster.tsx ── */

/** The eclipse hero's phone layout, as hero.module.css draws it (the DPR cap and the poster band follow it). */
export const PHONE_MQ = "(max-width: 767px)";

/** Poster box side, in S, centred on the stage (CSS: inset −50% on the stage). */
export const POSTER_BOX = 2;
/** The poster's alpha ramps 1 → 0 over this radius band (S). Pixels there are NIGHT1 anyway; the ramp only
    hides codec drift at the box edge. The corners are transparent. */
export const POSTER_FEATHER = [0.98, 1] as const;
export type PosterBand = "phone" | "desktop";
export type PosterFormat = "avif" | "webp";
export const POSTER = {
  /** Public path prefix: `${base}-${audience}-${width}.${format}`. */
  base: "/hero/poster",
  /** Device px per CSS px of every capture. */
  dpr: 2,
  /** The stage side S (CSS px) each band is captured at: the largest .stage of that band in hero.module.css
      (phone: min(240px, 62vw, 28svh); desktop: min(560px, 42vw)). Change them together, then re-run the script. */
  stage: { phone: 240, desktop: 560 } as Readonly<Record<PosterBand, number>>,
  /** <picture> order: the first format the browser supports wins. */
  formats: ["avif", "webp"] as readonly PosterFormat[],
  /** Written last by the script: { rendererHash, files, ... }. sha1 of eclipse.ts + eclipse-api.ts, so a stale
      poster set is detectable. Never imported by the page. */
  manifest: "/hero/poster.json",
} as const;
/** Pixel width (= height) of a band's file: 960 (phone) and 2240 (desktop). */
export const posterWidth = (band: PosterBand): number => Math.round(POSTER_BOX * POSTER.stage[band] * POSTER.dpr);
export const posterSrc = (a: Audience, band: PosterBand, f: PosterFormat): string => `${POSTER.base}-${a}-${posterWidth(band)}.${f}`;
/** The <picture> sources, in order, then the <img> fallback. The band is chosen by media query, not by
    srcset width, so a 3x phone still gets the phone file: phone AVIF, desktop AVIF, phone WebP, then
    <img src> = desktop WebP. Tablets (768 to 1023) take the desktop file. */
export function posterSources(a: Audience): { sources: { media?: string; type: string; srcSet: string }[]; fallback: string } {
  const sources: { media?: string; type: string; srcSet: string }[] = [];
  for (const f of POSTER.formats) {
    sources.push({ media: PHONE_MQ, type: `image/${f}`, srcSet: posterSrc(a, "phone", f) });
    if (f !== "webp") sources.push({ type: `image/${f}`, srcSet: posterSrc(a, "desktop", f) });
  }
  return { sources, fallback: posterSrc(a, "desktop", "webp") };
}

/** The renderer's capture mode (scripts/hero-poster.cjs only). One frame at REST, read back from the whole
    drawing buffer in the same task as the draw. rgba: straight RGBA, top row first, alpha 255. */
export interface CaptureFrame { audience: Audience; width: number; height: number; dpr: number; stage: number; rgba: Uint8Array }
export interface CaptureOptions { dpr: number; onFrame: (f: CaptureFrame) => void }

/* ── The stage element's DOM contract (EclipseSky renders it; the poster's CSS keys off it) ── */

/** Attributes on the .stage element. gl: "on" from the first drawn frame (onReady) until a failure or
    teardown, otherwise "off". audience: the urgent audience. */
export const STAGE_ATTR = { audience: "data-aud", gl: "data-gl" } as const;
export const DPR_CAP = { desktop: 1.5, phone: 1.25 } as const;

/* ── Agents on the ring (RESERVED, item 1) ── */

/** AGENTS order; equals DEMO.agents (assert it where both are in scope). */
export const AGENT_ORDER: readonly AgentName[] = [
  "MoonShot AI", "MoonMatch AI", "MoonSearch AI", "MoonWriter AI", "MoonLive AI", "MoonScore AI", "MoonLearning AI",
];
/** Glint angles on the ring, clockwise from the top in AGENTS order, all on the inline-end half and at least
    8 degrees clear of the arms (HERO-V2 V5, review M1). */
export const GLINT_DEG: Readonly<Record<AgentName, number>> = {
  "MoonShot AI": 70, "MoonMatch AI": 52, "MoonSearch AI": 34, "MoonWriter AI": 16,
  "MoonLive AI": -20, "MoonScore AI": -36, "MoonLearning AI": -52,
};
/** Never work in any stream (demo.json), so never labelled and never at the working level. */
export const NEVER_WORKS: readonly AgentName[] = ["MoonLive AI", "MoonLearning AI"];

const rad = (deg: number) => (deg * Math.PI) / 180;
/** A glint's centre in stage units (0..1, y down). */
export function glintPoint(name: AgentName): { x: number; y: number } {
  const t = rad(GLINT_DEG[name]);
  return { x: 0.5 + RING * Math.cos(t), y: 0.5 - RING * Math.sin(t) };
}
/** A glint's centre in the shader's uv (y up, 1 = S/2). */
export function glintUv(name: AgentName): [number, number] {
  const t = rad(GLINT_DEG[name]);
  return [2 * RING * Math.cos(t), 2 * RING * Math.sin(t)];
}
/** Desktop label metrics (HERO-V2 §3.1, §6.1). */
export const LABEL = { gapPx: 16, widthPx: 176, maxHeightPx: 62 } as const;
/** Where a glint's label hangs, in stage-local CSS px (origin the stage's top-left, y down), for a stage of
    side s px. open "up": the label's bottom-start corner sits on the anchor; "down": its top-start corner.
    Under RTL mirror x (s − x) and the inline direction together. */
export function labelAnchor(name: AgentName, s: number): { x: number; y: number; open: "up" | "down" } {
  const t = rad(GLINT_DEG[name]), r = RING * s + LABEL.gapPx;
  return { x: s / 2 + r * Math.cos(t), y: s / 2 - r * Math.sin(t), open: GLINT_DEG[name] >= 0 ? "up" : "down" };
}

/** Glint levels (HERO-V2 §5.3, review M8: typing never reaches the working level). */
export const LEVEL = { idle: 0.42, waiting: 0.18, working: 1, landed: 0.55, reduced: 0.55, typingMax: 0.82 } as const;
/** Typing: each keystroke wakes the next glint in ring order (plan item 1); `typed` = the hero field's length. */
export const typingLevel = (i: number, typed: number): number =>
  LEVEL.waiting + (LEVEL.typingMax - LEVEL.waiting) * Math.min(1, Math.max(0, typed - i));
/** levels: 7 values in AGENT_ORDER; working: the index whose agent works now, or −1 (drives spikes and shimmer,
    never inferred from a level). */
export interface AgentStates { levels: readonly number[]; working: number }

/* ── The creators cut (RESERVED, item 7) ── */

/** The wedge starts at the bottom arm's start-side edge and opens clockwise into the lower-start notch
    (review L11). Fractions of the full circle, from DEMO.creators.shares (percent / 100). */
export const CUT = { startDeg: 270 - ARM_HALF_DEG, stepMs: 1600 } as const;
export interface CutRange { list: readonly number[]; min: number; max: number }

/* ── Field and label rectangles (RESERVED, items 1 and 2) ── */

/** A rectangle in stage units (origin the stage's top-left, y down). */
export interface RelRect { x: number; y: number; w: number; h: number }
export function toStageRect(r: { left: number; top: number; width: number; height: number },
  stage: { left: number; top: number; width: number }): RelRect {
  const s = stage.width || 1;
  return { x: (r.left - stage.left) / s, y: (r.top - stage.top) / s, w: r.width / s, h: r.height / s };
}

/* ── Quality tiers (RESERVED, item 5) ── */

export type TierName = "high" | "mid" | "low";
export interface Tier {
  iorSamples: 5 | 3 | 1; marchSteps: number; innerSteps: number; bounces: 1 | 2;
  bevel: "full" | "cheap"; studioBoxes: 4 | 2; coronaOctaves: 2 | 1;
}
export const TIERS: Readonly<Record<TierName, Tier>> = {
  high: { iorSamples: 5, marchSteps: 72, innerSteps: 36, bounces: 2, bevel: "full", studioBoxes: 4, coronaOctaves: 2 },
  mid: { iorSamples: 3, marchSteps: 48, innerSteps: 24, bounces: 2, bevel: "full", studioBoxes: 4, coronaOctaves: 2 },
  low: { iorSamples: 1, marchSteps: 40, innerSteps: 16, bounces: 1, bevel: "cheap", studioBoxes: 2, coronaOctaves: 1 },
};
/** The watchdog's two-axis ladder; skip a step whose effective {tier, dpr} equals the current one (review L7). */
export const TIER_LADDER: readonly { tier: TierName; dpr: number }[] = [
  { tier: "high", dpr: 1.5 }, { tier: "mid", dpr: 1.5 }, { tier: "mid", dpr: 1 }, { tier: "low", dpr: 1 }, { tier: "low", dpr: 0.75 },
];
/** Init tier: ?tier= wins; else mid on phones, integrated or older mobile GPUs, ≤ 4 cores or ≤ 4 GB; else high. */
export function initialTier(i: { query?: string | null; phone: boolean; renderer: string; cores?: number; memory?: number }): TierName {
  if (i.query === "high" || i.query === "mid" || i.query === "low") return i.query;
  const weak = /Intel|UHD|Iris|Mali|Adreno \(TM\) [1-6]\d\d|PowerVR/i.test(i.renderer);
  return i.phone || weak || (i.cores ?? 8) <= 4 || (i.memory ?? 8) <= 4 ? "mid" : "high";
}

/* ── The renderer ── */

export interface EclipseOptions {
  audience: Audience;
  /** Once, after the first frame at REST is drawn and presented (one rAF after the draw). */
  onReady?: () => void;
  /** WebGL missing, compile or link failure, or a lost context: the caller shows the poster. */
  onFail?: () => void;
  /** WAVE 1: poster capture mode (scripts/hero-poster.cjs). No loop, no observers, no listeners. */
  capture?: CaptureOptions;
}

export interface EclipseHandle {
  /** instant (or a loop that is not running: paused, hidden, offscreen, covered) jumps material, bead and
      tint and redraws once; otherwise the switch tumble plays (review H4). */
  setAudience(a: Audience, instant?: boolean): void;
  setFocus(on: boolean): void;
  pulse(): void;
  /** A valid submit: full turn, all seven glints, the comet once round the ring. */
  launch(): void;
  setPaused(p: boolean): void;
  resize(): void;
  destroy(): void;
  /** WAVE 1: start the clock. Until then the renderer holds the resting frame (the poster's frame). Called by
      the caller when the poster has faded; RELEASE_FALLBACK_MS after onReady it releases itself. Any
      animated input (pulse, launch, setFocus(true), an animated setAudience) releases it first. */
  release(): void;
  /** RESERVED (item 1). */
  setAgents?(s: AgentStates): void;
  /** RESERVED (item 1): the hero field's length; drives typingLevel. */
  setTyped?(n: number): void;
  /** RESERVED (item 7): creators only; null hides the wedge. */
  setCut?(c: CutRange | null): void;
  /** RESERVED (item 2): where the field is, so the light bends toward it. */
  setFieldRect?(r: RelRect | null): void;
  /** RESERVED (item 1, review H2): the active label's box; the corona is dimmed under it for contrast. */
  setLabelRect?(r: RelRect | null): void;
  /** RESERVED (item 5): the watchdog's tier step (the renderer swaps programs when the new one is compiled). */
  setTier?(t: TierName): void;
}
