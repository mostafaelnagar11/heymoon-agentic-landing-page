/* The Eclipse hero's shared contract (docs/redesign/HERO-V2.md §12 and "Wave 2 plan"). The lead owns this file:
   every package imports from it and nobody else edits it (wave 2 delegates no line of it). Pure types, constants
   and functions: no React, no DOM reads, no runtime imports, no shader source and none of measure.cjs's shader
   markers. NO FIRST-LOAD MODULE IMPORTS IT AT RUNTIME (types only): webpack keeps one copy of this module carrying
   every export any chunk uses, so a runtime import from EclipseSky or EclipsePoster put the lazy renderer's and
   Agents' helpers on the first load (+2.9 kB gz, 5 Oct). The few values the first load needs are copied in
   EclipsePoster.tsx, which checks them against this file in dev builds.

   Units. S is the stage box's side in CSS px (the square .stage element; the star's centre is its centre).
   "Stage units" are fractions of S, origin at the stage's top-left, y down. Angles are degrees,
   counter-clockwise from the inline-end (+x) axis with y up, in LTR terms (the scene the shader draws).
   The shader's uv is (fragment − stage centre) / (S/2), y up: a radius of k S is 2k in uv.

   Waves. WAVE 1 (plan item 6, "no flat star, ever") is built (2eab75a). WAVE 2 (HERO-V2 "Wave 2 plan", after
   Mostafa's sketch of the hero's right side, 5 Oct) builds items 1 (agents read: glints on both audiences, the
   agent card on brands only), 2 (focus faces the visitor; the glow behind the field; no spill), 3 (phone), 5
   (performance) and 9 (the creator rings, brands only). DEFERRED (Mostafa: "this is only for brands, for
   influencers we will do something else"): item 4 (the creators material) and item 7's cut wedge. LOCKED: the
   switch animation (SWITCH), exactly as HEAD's eclipse.ts setAud and the prototype. The members wave 2 made
   obsolete (the labels beside the ring, the spill's field rect, setTyped, setCut, BEAD_TARGET_DEG) were deleted at
   integration. Module-level calls carry #__PURE__ so the first load drops what it does not import. */
import type { AgentName, Audience } from "../data/types";

export type { Audience };

const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sstep = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ── Camera and geometry (the prototype's constants; the renderer's GLSL uses the same numbers) ── */

/** Prototype camera: scale S, camera z CZ, eclipse plane depth DZ, eclipse ring radius RM (scene units). */
export const CAM = { scale: 1.12, cz: 7, dz: 3.2, rm: 1.08 } as const;
/** Tip distance from the centre, in S (the glass star's four tips). 0.4464 */
export const TIP = 0.5 / CAM.scale;
/** The eclipse ring's radius on screen, in S. 0.3309. The black disc is everything inside it. */
export const RING = (CAM.rm * CAM.cz) / (CAM.scale * (CAM.cz + CAM.dz)) / 2;
/** Screen radius (S) per eclipse-plane radius (scene units): a point at plane radius ρ is drawn at ρ · PLANE_TO_S. */
export const PLANE_TO_S = RING / CAM.rm;
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
    sweep 0, trail 0, flash 0, energy 0, intro fully lit (the corona never starts dimmed), the glare band at its
    start offset, shader time 0, the bead at BEAD_REST_RAD.
    WAVE 2 adds to the resting frame: the seven glints at REST_AGENTS (all LEVEL.idle, nobody working) on both
    audiences, and the creator rings at drift 0 (ringAngle(slot, 0)) with presence ringsPresence(audience) (1 on
    brands, 0 on creators: the creators frame has no rings). */
export const REST = {
  ...swayAt(0),
  intro: 1,
  glare: -1.3,
  time: 0,
} as const;

/** The bead's resting angle (radians, the renderer's bead uniform): brands upper inline-end (45.8°), creators half a
    turn on (225.8°). WAVE 2 KEEPS IT (the switch is locked): the bead never rests anywhere else. */
export const BEAD_REST_RAD: Readonly<Record<Audience, number>> = { brands: 0.8, creators: 0.8 - Math.PI };

/** The poster fades out over this once the first frame is drawn (the canvas is already opaque under it). */
export const POSTER_FADE_MS = 240;
/** The renderer holds the resting frame until release(); if nobody calls it, it releases itself this long
    after onReady. */
export const RELEASE_FALLBACK_MS = 1200;
/** After release the sway clock's speed eases from 0 to 1 over this (smoothstep), and the pointer's pull
    is scaled by the same factor (review L1), so the star leaves the resting pose with zero velocity. The rings'
    drift runs on the same eased clock, so they too leave REST with zero velocity. */
export const SWAY_IN_S = 2;

/* ── The switch: LOCKED (Mostafa, 5 Oct: "keep the star flip animation", "keep the eclipse animation while
   switching tab") ──

   Exactly HEAD's sky/eclipse.ts setAud (commit 99fd094) and the prototype ($SP/hero-concepts/sculpture/index.html,
   frames in sw-grid.png). On an animated switch, all starting at the same instant:
   - flip: the star turns π about its DIAGONAL axis (√½, √½, 0), applied before the sway (M = R_axis(flip) · R_sway),
     always +π from its current flip, over flipMs, ease-out-quart. It passes edge-on as a liquid sliver at
     EDGE_ON_MS and lands face-on as the other material.
   - soft (the material, 0 slab → 1 liquid): to the target over softMs after softDelayMs, ease-in-out-cubic.
   - aud (the tint: the corona, the core, the studio light, violet → pink and back): over audMs, ease-out-cubic.
   - bead: always −π from its current angle (clockwise, half the rim: upper inline-end → lower inline-start on the way
     to creators, and on round to the start on the way back), over beadMs, ease-out-quart, leaving the light trail
     its angular speed draws.
   - flash: sin²(π · (t / flashMs)^0.7), the dispersion flash and the energy boost.
   A switch while the loop is not running (paused, hidden, offscreen, covered, held) jumps to the end state and
   redraws once. Nothing in wave 2 may shorten, simplify, re-axis or re-time any of this; the rings and the agent
   card fade with it (ringsPresence follows `aud`). One robustness rule (lead ruling, wave 2): the switch's clock
   advances by min(dt, SWITCH_FRAME_CAP_MS) per drawn frame instead of wall time, so a main-thread stall delays the
   rest of the tumble instead of skipping it (identical at 10 fps and above). The copy's morph (globals.css .morph) swaps at the edge-on
   moment; it is not the renderer's. textOutMs and replayAfterMs are the agent card's beats (hero/Agents.tsx). */
export const SWITCH = {
  axis: [Math.SQRT1_2, Math.SQRT1_2, 0] as const,
  flipRad: Math.PI, flipMs: 1700,
  softMs: 1000, softDelayMs: 80,
  audMs: 1200,
  beadDeltaRad: -Math.PI, beadMs: 1800,
  flashMs: 1100, flashPow: 0.7,
  textOutMs: 200, replayAfterMs: 1000,
} as const;
/** The switch clock's largest step per drawn frame (see SWITCH). */
export const SWITCH_FRAME_CAP_MS = 100;
const eo3 = (x: number) => 1 - Math.pow(1 - x, 3);
const eo4 = (x: number) => 1 - Math.pow(1 - x, 4);
const eio3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** When the flip passes π/2 (edge-on): flipMs · (1 − 0.5^¼) ≈ 270 ms. */
export const EDGE_ON_MS = SWITCH.flipMs * (1 - /*#__PURE__*/ Math.pow(0.5, 0.25));
/** The switch's progress `ms` after it started (× slow under ?skyslow): what the renderer's tweens must produce
    and what a verifier compares window.__sky with. flip: radians added since the start (0 → π); soft and aud: 0 → 1
    toward the target (1 − x when the target is brands); bead: radians added (0 → −π); flash: 0..1. */
export function switchAt(ms: number, slow = 1): { flip: number; soft: number; aud: number; bead: number; flash: number } {
  const t = ms / slow, f = t / SWITCH.flashMs;
  return {
    flip: SWITCH.flipRad * eo4(clamp01(t / SWITCH.flipMs)),
    soft: eio3(clamp01((t - SWITCH.softDelayMs) / SWITCH.softMs)),
    aud: eo3(clamp01(t / SWITCH.audMs)),
    bead: SWITCH.beadDeltaRad * eo4(clamp01(t / SWITCH.beadMs)),
    flash: f > 0 && f < 1 ? Math.pow(Math.sin(Math.PI * Math.pow(f, SWITCH.flashPow)), 2) : 0,
  };
}

/* ── Field focus (WAVE 2, item 2) ── */

/** Focus in the hero field turns the star to face the visitor (HERO-V2 §4.5): with f the eased focus (0..1, rate
    per second as HEAD, 1 − e^(−rate·dt)), yaw = YAW0·(1 − f) + (sway.yaw − YAW0)·(1 − swayDamp·f) + pointer·(1 −
    pointerDamp·f) + spin, and the same for pitch with PITCH0; roll × (1 − swayDamp·f). At f = 1 the star is face-on
    within 1° (|M22| ≥ 0.999 with the pointer centred). It also brightens as HEAD does (energy + 0.5 f). No light
    reaches toward the field: the spill and the caustic lobe are deleted (Mostafa: "you can delete this"). */
export const FOCUS = { rate: 3, swayDamp: 0.85, pointerDamp: 0.7, yaw0: -0.12, pitch0: 0.1 } as const;

/* ── The creator rings (WAVE 2, item 9: Mostafa's sketch, 5 Oct; consent in docs/redesign/INPUTS.md). BRANDS ONLY ──

   Two concentric rings of circular creator profile pictures on the eclipse plane, BEHIND the black disc and the
   glass star: the disc covers the inner ring's inner edge, the star's tips pass in front of the inner ring and (on
   the high and mid tiers) refract it. Drawn by the renderer (sky/eclipse.ts) from an atlas it builds at runtime
   from AVATARS, so the canvas stays opaque (the night stays exact) and the brands poster, captured from the
   renderer, already shows them at first paint. Decorative: never a name, handle, link, location or figure beside a
   face; nothing about them reaches the DOM. Quiet: mid opacity, highlights capped, desaturated, tinted toward the
   night, faded out toward the cluster's edge, so the H1 and the field stay the brightest things on the page. The
   target look: $SP/w2b-arch/preview-brands-quiet.png (a 2D composite at these constants; there the rings are
   pasted over the star, in GL they sit behind it). */

/** The ONLY faces the hero may show: the anonymised copies of the 10 consented profile pictures (192 px WebP).
    Fetched by the renderer at low priority with async decoding, never placed in the DOM, never the LCP. */
export const AVATARS = {
  count: 10,
  srcPx: 192,
  src: (i: number): string => `/hero/creators/c${String(i + 1).padStart(2, "0")}.webp`,
} as const;

/** The rings are drawn on this audience only. */
export const RINGS_AUDIENCE: Audience = "brands";
/** The rings' presence (0..1) for the renderer's tint state `aud` (0 brands, 1 creators): they fade out with the
    corona warming on a switch to creators and back in on brands (the same tween, SWITCH.audMs). The renderer
    multiplies it by atlasReady (0 until the atlas is uploaded, then eased to 1 over 400 ms; never at REST). */
export const ringsPresence = (aud: number): number => 1 - clamp01(aud);

/** One ring. count circles of radius a (S) whose centres sit on radius r (S), evenly spaced from phaseDeg; alpha is
    the circle's opacity over the night (sRGB) at the centre of its band, before the radial fade; driftDegPerS is
    its turn per second of the eased sway clock (positive = counter-clockwise). Faces stay upright while it turns. */
export interface RingSpec { count: number; r: number; a: number; alpha: number; driftDegPerS: number; phaseDeg: number }
/** The two rings and their treatment.
    - inner: 14 smaller circles just outside the disc (inner edge 0.32 S: the disc, radius RING 0.3309 S, covers the
      last 0.011 S of each), outer edge 0.46 S. outer: 17 larger circles from 0.475 to 0.629 S (CLUSTER_R).
    - fade: every ring pixel × ringFade(r / S), so the cluster dissolves into the night (visible to about 0.6 S).
    - look, applied to every atlas sample c (sRGB 0..1) in the shader (wave-2 fixes: it was a per-pixel loop over the
      atlas on the main thread, a 100 ms task at CPU x4), in this order:
      c = min(c, highlight) · gain (a white photo background never reads as a bright disc);
      c = mix(luma(c), c, saturation) with Rec. 709 luma; c = mix(c, tint / 255, tintMix). The screen pixel then
      shows α · fade · coverage · presence · c over NIGHT1 (sRGB), coverage being the circle's 1 CSS px anti-aliased
      edge. In the renderer that is the light L = −ln(1 − (α·fade·coverage·presence·c)^2.2) / 1.15 per channel (the
      composite's inverse), added on the eclipse plane before the corona's light, so the rim glow and the haze light
      the faces near them, and the disc replaces them inside RING.
    - The rings live on the eclipse plane at depth DZ: the main view and every refracted ray through the glass
      (env(), on tiers whose ringsInGlass is true) see the same rings. Never in screen space. */
/* Ring opacity pinned by Mostafa (5 Oct, "increase it by 10%"): inner 50%, outer 35%, before the radial fade. */
export const RINGS = {
  inner: { count: 14, r: 0.39, a: 0.07, alpha: 0.5, driftDegPerS: 0.8, phaseDeg: 90 } as RingSpec,
  outer: { count: 17, r: 0.552, a: 0.077, alpha: 0.35, driftDegPerS: -0.6, phaseDeg: 90 + 180 / 17 } as RingSpec,
  fade: [0.52, 0.64] as const,
  look: { highlight: 0.82, gain: 0.78, saturation: 0.5, tint: [26, 20, 77] as const, tintMix: 0.3 },
} as const;
/** The cluster's outer radius, in S: 0.629, so the cluster is 1.9 times the disc's diameter (Mostafa's sketch).
    Every layout rule that keeps the rings off the copy column and inside the viewport uses this radius. */
export const CLUSTER_R = RINGS.outer.r + RINGS.outer.a;
/** Where the faded cluster stops reading (ringFade ≤ 0.36 × the outer alpha, under 9% opacity), in S. */
export const CLUSTER_VISIBLE_R = 0.59;

/** One circle. ring 0 inner, 1 outer; index within its ring; deg its centre's angle at drift 0; img the AVATARS
    index; flip mirrors it horizontally; zoom > 1 crops into its centre (the circle shows 1/zoom of the image's
    width), dy shifts that crop up (−) or down (+) as a fraction of the image. */
export interface RingSlot { ring: 0 | 1; index: number; deg: number; img: number; flip: boolean; zoom: number; dy: number }
/** Image offset of the outer ring: measured, it keeps every face at least 40.8 degrees from the same face in the
    other ring at rest ($SP/w2b-arch/slots.js). Within a ring no two neighbours ever repeat (count ≥ 10). */
const OUTER_IMG_OFFSET = 2;
/** The 31 circles, inner ring first. The u-th use of an image (u = 0, 1, 2, ...) is mirrored when u is odd and
    cropped by CROPS[u % 4], so no repeat ever looks like a copy. */
const CROPS: readonly { zoom: number; dy: number }[] = [{ zoom: 1, dy: 0 }, { zoom: 1.14, dy: -0.04 }, { zoom: 1.08, dy: 0.03 }, { zoom: 1.2, dy: -0.06 }];
export const RING_SLOTS: readonly RingSlot[] = /*#__PURE__*/ (() => {
  const out: RingSlot[] = [], uses = new Array<number>(AVATARS.count).fill(0);
  ([RINGS.inner, RINGS.outer] as const).forEach((spec, ring) => {
    for (let index = 0; index < spec.count; index++) {
      const img = (index + (ring ? OUTER_IMG_OFFSET : 0)) % AVATARS.count, u = uses[img]++;
      out.push({ ring: ring as 0 | 1, index, deg: (spec.phaseDeg + (index * 360) / spec.count) % 360, img, flip: u % 2 === 1, ...CROPS[u % CROPS.length] });
    }
  });
  return out;
})();
/** A circle's centre angle (degrees) after `t` seconds of the eased sway clock (0 at REST). */
export const ringAngle = (slot: RingSlot, t: number): number =>
  slot.deg + (slot.ring ? RINGS.outer : RINGS.inner).driftDegPerS * t;
/** The radial fade at r (S). */
export const ringFade = (r: number): number => 1 - sstep(RINGS.fade[0], RINGS.fade[1], r);
/** The atlas the renderer builds from AVATARS: ONE CELL PER SLOT, so the shader needs only the slot's index (GLSL ES
    1.00 does not promise dynamic indexing of uniform arrays in a fragment shader). Cell i = RING_SLOTS[i] (inner
    ring 0..13, then outer 0..16) at (i % cols, floor(i / cols)), drawn by canvas 2D (imageSmoothingQuality "high")
    already mirrored (flip) and cropped (zoom, dy), upright, and uploaded as it is (no getImageData; no ctx.filter,
    which older Safari lacks); the shader applies RINGS.look to each sample, then multiplies by alpha, the radial
    fade, the presence and the circle's coverage. No mipmaps: the cell is sized to the largest circle's on-screen device px
    (atlasCell), so every sample is close to 1:1 and implicit derivatives inside the glass loop never matter. LINEAR,
    CLAMP_TO_EDGE, NPOT allowed (WebGL1), UNPACK_FLIP_Y false, no premultiplication. */
export const ATLAS = { cols: 8, rows: 4 } as const;
/** The atlas cell side (px) for a stage of s CSS px at a device px ratio of dpr: the outer circle's diameter in
    device px times the largest crop zoom, clamped to [32, AVATARS.srcPx]. Rebuild the atlas when it changes by more
    than 1.5x either way (a resize across bands); the capture uses its own dpr. */
export const atlasCell = (s: number, dpr: number): number =>
  Math.max(32, Math.min(AVATARS.srcPx, Math.round(2 * RINGS.outer.a * s * dpr * Math.max(...CROPS.map((c) => c.zoom)))));

/* ── Layout the renderer, the posters, the card and the DOM agree on (WAVE 2) ── */

/** The eclipse hero's phone layout, as hero.module.css draws it (the DPR cap and the poster band follow it). */
export const PHONE_MQ = "(max-width: 767px)";
/** The agent card exists only here (gate G10's line; below 521 px tall the hero is a short, non-sticky screen). */
export const CARD_MQ = "(min-width: 1024px) and (min-height: 521px)";

/** The hero's fixed edges on the split (CSS px): navBottom = --nav-top 16 + --nav-h 56; padTop / padBottom:
    .hero.eclipse's block padding (88 / 88); peek: the sheet's desktop peek (64, from 669 px tall). */
export const HERO_EDGE = { navBottom: 72, padTop: 88, padBottom: 88, peek: 64 } as const;

/** THE AGENT CARD (Mostafa's sketch, item 1, BRANDS ONLY): one small dark glass card at the hero's bottom right,
    inside the nav's 1120 box. Absolutely positioned in the hero section (the sticky section is its containing
    block): inset-inline-end = the nav box's margin, bottom = HERO_EDGE.padBottom (24 px above the 64 px peek), width
    min(widthPx, the stage column), exactly heightPx tall (one row: the moon-dot glyph, the name, the note). CARD_CSS
    is the CSS AGENTS writes. On shorter viewports the card may sit over the cluster's faded lower edge; its own dark
    glass keeps its text at ≥ 4.5:1 there. widthPx (wave-2 fixes, was 340): the read's landed line, "Whether HeyMoon
    can guarantee sales" beside MOONSCORE AI, needs 397 px (measured in the card's own fonts), so it is never cut
    mid-word; 408 leaves 11 px for other platforms' text rasterisation. At 1024 to 1920 the card still starts right of
    the copy column (1024: 592, column end 529; 1440: 872, column end 662). */
export const CARD = { widthPx: 408, heightPx: 44, padInlinePx: 14, gapPx: 8, radiusPx: 14 } as const;
export const CARD_CSS = {
  insetInlineEnd: "max(var(--gutter), calc((100% - 1120px) / 2))",
  bottom: `${HERO_EDGE.padBottom}px`,
  width: "min(408px, 42vw, 560px)",
} as const;
/** The card is shown on this audience only (on creators it fades out with the switch and stays out). */
export const CARD_AUDIENCE: Audience = "brands";

/** The split (≥ 768 px wide), at scrollY 0, in viewport CSS px: what hero.module.css draws (SPLIT_CSS) and what
    verifiers check. The stage column is the nav box's end, min(560px, 42vw) from 1024 and min(400px, 40vw) below;
    the column gap is clamp(24px, 4vw, 64px). The star is centred in the column and vertically in the hero's content
    box, as today (cy = vh / 2 from 521 px tall). s is the largest side that keeps the cluster (CLUSTER_R):
      - off the copy column (so never over its text or the field): cx − CLUSTER_R·s ≥ copy column end;
      - inside the viewport (nothing past the inline end; no horizontal scroll): cx + CLUSTER_R·s ≤ vw;
      - its visible part under the nav pill: cy − CLUSTER_VISIBLE_R·s ≥ HERO_EDGE.navBottom (binds only on short
        viewports, e.g. 1366x657 → 434.7);
      - and the star box inside the column and ≤ POSTER.stage.desktop.
    No rule against the card (lead ruling, wave 2): where the height is short the card's dark glass may sit over the
    cluster's faded lower edge (from about 800 px tall); at 1440x900 and taller the visible cluster ends above it. */
export function heroSplit(vw: number, vh: number, gutter = 24) {
  const margin = Math.max(gutter, (vw - 1120) / 2), colEnd = vw - margin;
  const col = vw >= 1024 ? Math.min(560, 0.42 * vw) : Math.min(400, 0.4 * vw), colStart = colEnd - col;
  const gap = Math.min(64, Math.max(24, 0.04 * vw)), copyEnd = colStart - gap;
  const cx = colStart + col / 2, cy = vh <= 520 ? (HERO_EDGE.padTop + vh - 48) / 2 : vh / 2;
  const s = Math.max(0, Math.min(POSTER.stage.desktop, col, (col / 2 + gap) / CLUSTER_R, (col / 2 + margin) / CLUSTER_R, (vh / 2 - HERO_EDGE.navBottom) / CLUSTER_VISIBLE_R));
  const card = vw >= 1024 && vh >= 521;
  const cw = Math.min(CARD.widthPx, 0.42 * vw, 560);
  const cardBox = card ? { x: colEnd - cw, y: vh - HERO_EDGE.padBottom - CARD.heightPx, w: cw, h: CARD.heightPx } : null;
  return { margin, col, colStart, colEnd, gap, copyEnd, cx, cy, s, card, cardBox, cluster: { cx, cy, r: CLUSTER_R * s, visible: CLUSTER_VISIBLE_R * s } };
}
/** The CSS that draws heroSplit (hero.module.css, the .stage rule from 768 px; inside the stage's grid area 100% and
    50% are the column's width). justify-self: center and align-self: center stay as today. (100vw counts a classic
    scrollbar, so the viewport term can over-reach by half its width; the copy-column term binds wherever that
    matters, from 1168 px.) */
export const SPLIT_CSS = {
  width: "min(560px, 100%, calc((50% + clamp(24px, 4vw, 64px)) / .629), calc((50% + max(var(--gutter), (100vw - 1120px) / 2)) / .629), calc((50svh - 72px) / .59))",
} as const;
/** The cluster's circle for a stage element's rect (viewport px): what verifiers check against the copy column, the
    field, the chips and the viewport. */
export const clusterOf = (stage: { left: number; top: number; width: number }) =>
  ({ cx: stage.left + stage.width / 2, cy: stage.top + stage.width / 2, r: CLUSTER_R * stage.width, visible: CLUSTER_VISIBLE_R * stage.width });

/** The phone star (W2-2, item 3): stacked BELOW the chips (switch, H1, field, chips, star) on both audiences, centred
    in a last grid row that takes only the height that is left (container-type: size). s is the largest that keeps
    the whole cluster inside the row less clearPx: s = max(min, min(max, vw·100vw, (row − clearPx) / (2·CLUSTER_R)));
    CSS `max(120px, min(240px, 62vw, calc((100cqh - 8px) / 1.258)))`. It never grows the hero; below min it runs
    under the sheet. max equals POSTER.stage.phone. */
export const PHONE_STAGE = { max: 240, min: 120, vw: 0.62, clearPx: 8 } as const;
export const phoneS = (vw: number, row: number): number =>
  Math.max(PHONE_STAGE.min, Math.min(PHONE_STAGE.max, PHONE_STAGE.vw * vw, (row - PHONE_STAGE.clearPx) / (2 * CLUSTER_R)));

/* ── Agents on the ring (WAVE 2, item 1; glints on both audiences) ── */

/** AGENTS order; equals DEMO.agents (assert it where both are in scope). Glint index i is this order. */
export const AGENT_ORDER: readonly AgentName[] = [
  "MoonShot AI", "MoonMatch AI", "MoonSearch AI", "MoonWriter AI", "MoonLive AI", "MoonScore AI", "MoonLearning AI",
];
/** Glint angles on the rim, FIXED (they do not travel with the bead), clockwise from the top in AGENT_ORDER: four in
    the lower inline-end notch (−20 to −71, 17° apart) and three in the upper inline-start notch (160 to 126). Every
    glint is ≥ 19° from an arm's centre (≥ 11° clear of its ±7.8° crossing) and ≥ 65° from the bead's resting
    angles (45.8° brands, 225.8° creators), so the locked switch keeps its bead and every glint stays readable. The
    bead passes over the lower four on the way to creators and over the upper three on the way back. */
export const GLINT_DEG: Readonly<Record<AgentName, number>> = {
  "MoonShot AI": -20, "MoonMatch AI": -37, "MoonSearch AI": -54, "MoonWriter AI": -71,
  "MoonLive AI": 160, "MoonScore AI": 143, "MoonLearning AI": 126,
};
/** Never work in any stream (demo.json), so never shown on the card and never at the working level. */
export const NEVER_WORKS: readonly AgentName[] = ["MoonLive AI", "MoonLearning AI"];

/** A glint's centre in stage units (0..1, y down). */
export function glintPoint(name: AgentName): { x: number; y: number } {
  const t = rad(GLINT_DEG[name]);
  return { x: 0.5 + RING * Math.cos(t), y: 0.5 - RING * Math.sin(t) };
}
/** A glint's centre in the shader's uv (y up, 1 = S/2). The renderer bakes these as GLSL literals: a negative
    literal must be emitted in parentheses, never after a minus (`ph-(-0.349)`, not `ph--0.349`: GLSL reads `--` as
    the decrement operator, which is the compile error that killed WebGL on the stopped wave-2 tree). */
export function glintUv(name: AgentName): [number, number] {
  const t = rad(GLINT_DEG[name]);
  return [2 * RING * Math.cos(t), 2 * RING * Math.sin(t)];
}

/** Glint levels (HERO-V2 §5.3, review M8: typing never reaches the working level). Subtle but visible: idle and
    waiting read as faint points on the rim, working as a lit point with four short spikes (A-A7). */
export const LEVEL = { idle: 0.42, waiting: 0.18, working: 1, landed: 0.55, reduced: 0.55, typingMax: 0.82 } as const;
/** Typing: each keystroke wakes the next glint in ring order (plan item 1); `typed` = the hero field's length. */
export const typingLevel = (i: number, typed: number): number =>
  LEVEL.waiting + (LEVEL.typingMax - LEVEL.waiting) * Math.min(1, Math.max(0, typed - i));
/** levels: 7 values in AGENT_ORDER; working: the index whose agent works now, or −1 (drives spikes and shimmer,
    never inferred from a level). */
export interface AgentStates { levels: readonly number[]; working: number }
const all = (v: number): AgentStates => ({ levels: AGENT_ORDER.map(() => v), working: -1 });
/** The resting frame's glints (first paint, the poster, before the replay arms, no-JS). */
export const REST_AGENTS: AgentStates = /*#__PURE__*/ all(LEVEL.idle);
/** While the visitor types (the hero field focused or holding text): `typed` chars light glints 0..typed−1. */
export const typingAgents = (typed: number): AgentStates => ({ levels: AGENT_ORDER.map((_, i) => typingLevel(i, typed)), working: -1 });
/** A valid submit (and the dawn): every glint at 1. The renderer forces this itself in launch(). */
export const LAUNCH_AGENTS: AgentStates = /*#__PURE__*/ all(1);
/** A DOM glint dot's opacity over the poster while GL is off (W2-5): the poster already bakes REST_AGENTS, so a dot
    only adds light above idle: 0 at idle or below, 1 at working. */
export const dotOpacity = (level: number): number => clamp01((level - LEVEL.idle) / (LEVEL.working - LEVEL.idle));

/* ── The replay: the read at its real pace (WAVE 2, item 1; HERO-V2 §5.1, §5.2) ── */

/** Same values as tokens.ts TOAST (the wave-1 toasts' pace): the opener works 0 to openerMs, unit k works
    startMs + openerMs to endMs + openerMs, the cycle holds holdMs after the last land, rests restMs, loops.
    The first cycle starts firstAtMs into the page's life (performance.now()). resumeMs: after the hero field
    blurs empty, the replay resumes where it stopped this long later (HERO-V2 §5.3). */
export const REPLAY = { openerMs: 900, holdMs: 2400, restMs: 3000, firstAtMs: 2400, resumeMs: 600 } as const;
/** What replayOf reads: DEMO[audience].read (data/types.ts Run), structurally. */
export interface ReplaySource {
  opener: string | null;
  units: readonly { key: string; agent: AgentName; note: string; produces: string; startMs: number; endMs: number }[];
}
/** One item of the cycle. text: what the card shows while it works (the opener's note as-is; a unit's `${note}…`);
    land: what it lands as (a unit's produces; null for the opener). Only the cycle's last item ever shows `land`
    (it holds REPLAY.holdMs): the units are contiguous, so every other item is replaced as it lands. */
export interface ReplayItem { key: string; agent: AgentName; index: number; text: string; land: string | null; startMs: number; landMs: number }
/** items in time order; holdEndMs: the hold's end; cycleMs: holdEndMs + restMs; marks: every crossing (for
    lib/timeline's useTimeline marks). */
export interface Replay { items: readonly ReplayItem[]; holdEndMs: number; cycleMs: number; marks: readonly number[] }

/** The cycle for one audience, from the stream verbatim. The opener "Agent · note" splits on " · " (as Toasts
    did); an opener whose agent is not in AGENT_ORDER is skipped. */
export function replayOf(src: ReplaySource): Replay {
  const o = REPLAY.openerMs, items: ReplayItem[] = [];
  if (src.opener) {
    const [agent, ...note] = src.opener.split(" · ");
    const index = AGENT_ORDER.indexOf(agent as AgentName);
    if (index >= 0) items.push({ key: "opener", agent: agent as AgentName, index, text: note.join(" · "), land: null, startMs: 0, landMs: o });
  }
  for (const u of src.units) {
    items.push({ key: u.key, agent: u.agent, index: AGENT_ORDER.indexOf(u.agent), text: `${u.note}…`, land: u.produces, startMs: u.startMs + o, landMs: u.endMs + o });
  }
  const lastLand = items.length ? items[items.length - 1].landMs : 0;
  const holdEndMs = lastLand + REPLAY.holdMs;
  const marks = items.flatMap((it) => [it.startMs, it.landMs]).concat(holdEndMs)
    .sort((a, b) => a - b).filter((m, i, a) => i === 0 || m !== a[i - 1]);
  return { items, holdEndMs, cycleMs: holdEndMs + REPLAY.restMs, marks };
}
/** The item the card shows at `ms` into the cycle, and whether it has landed (only the last item, in the hold).
    null before the first start and from holdEndMs on (the rest: the card keeps its last text, see AGENTS_DOM). */
export function replayAt(r: Replay, ms: number): { item: ReplayItem; landed: boolean } | null {
  if (ms >= r.holdEndMs) return null;
  let cur: ReplayItem | null = null;
  for (const it of r.items) if (it.startMs <= ms) cur = it;
  return cur ? { item: cur, landed: ms >= cur.landMs } : null;
}
/** The seven levels at `ms` into the cycle: the working agent at LEVEL.working; agents that worked earlier in
    this cycle at landed; the rest (NEVER_WORKS always) at waiting. Through the hold and the rest nobody works and
    the landed set stays; the next cycle starts from waiting again. */
export function statesAt(r: Replay, ms: number): AgentStates {
  const levels: number[] = AGENT_ORDER.map(() => LEVEL.waiting);
  let working = -1;
  for (const it of r.items) {
    if (it.index < 0 || it.startMs > ms) continue;
    if (ms < it.landMs) working = it.index;
    else levels[it.index] = LEVEL.landed;
  }
  if (working >= 0) levels[working] = LEVEL.working;
  return { levels, working };
}

/* ── The poster (WAVE 1): files written by scripts/hero-poster.cjs, shown by sky/EclipsePoster.tsx ── */

/** Poster box side, in S, centred on the stage (CSS: inset −50% on the stage). The cluster (CLUSTER_R 0.629) is
    well inside it. */
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
  /** The stage side S (CSS px) each band is captured at: the largest .stage of that band (phone: PHONE_STAGE.max;
      desktop: the split's cap). Unchanged in wave 2, so the file names stay (960 and 2240 px). */
  stage: { phone: 240, desktop: 560 } as Readonly<Record<PosterBand, number>>,
  /** <picture> order: the first format the browser supports wins. */
  formats: ["avif", "webp"] as readonly PosterFormat[],
  /** Written last by a full run of the script: { rendererHash, files, ... }. sha1 of eclipse.ts + eclipse-api.ts,
      so a stale poster set is detectable. Never imported by the page. */
  manifest: "/hero/poster.json",
} as const;
/** WAVE 2: the posters' byte caps (scripts/hero-poster.cjs CAPS, keyed by file width). With the rings baked into the
    brands files (measured 5 Oct on the committed frames, $SP/w2b-arch/rings_quiet.py: desktop AVIF q50 17.6 → 24.4 kB,
    phone 7.7 → 10.2 kB), AVIF is the critical-path format; WebP is the fallback for browsers without AVIF.
    Wave-2 fixes: 2240 AVIF back to §9's 26 kB (at 28 the encoder filled the cap and the 1440 LCP, which is this
    poster, grew about 110 ms at 1.6 Mbps); 960 raised to 15 / 36 kB, the smallest tried that passes the restored
    p99 ≤ 6 on every row with headroom (max 5.65; 13 / 34 kB still gave 6.05). On phones the LCP is the H1. */
export const POSTER_CAPS: Readonly<Record<number, Readonly<Record<PosterFormat, number>>>> = {
  960: { avif: 15 * 1024, webp: 36 * 1024 },
  2240: { avif: 26 * 1024, webp: 96 * 1024 },
};
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

/** WAVE 2 (W2-3, plan item 3 "the H1 stays the LCP"): how each band paints its poster. desktop: the <picture>'s
    <img> itself. phone (PHONE_MQ): a 2D <canvas> in the same box, painted from the decoded image, while the <img>
    is 1 × 1 px at opacity 0 (or the image is off-DOM), so neither is an LCP candidate and the H1 is. Without JS the
    <img> shows at full size. Verified on the production build (A-P2), never only on the dev server. */
export const POSTER_PAINT: Readonly<Record<PosterBand, "img" | "canvas">> = { phone: "canvas", desktop: "img" };

/** The renderer's capture mode (scripts/hero-poster.cjs only). One frame at REST, read back from the whole
    drawing buffer in the same task as the draw. rgba: straight RGBA, top row first, alpha 255. WAVE 2: on brands the
    draw waits for the rings' atlas, so onFrame may arrive asynchronously (after mountEclipse returns); rings: false
    draws the same frame without the rings (only for the quiet check, never committed). */
export interface CaptureFrame { audience: Audience; width: number; height: number; dpr: number; stage: number; rgba: Uint8Array }
export interface CaptureOptions { dpr: number; onFrame: (f: CaptureFrame) => void; rings?: boolean }

/* ── The stage element's DOM contract (EclipseSky renders it; the poster's CSS keys off it) ── */

/** Attributes on the .stage element. gl: "on" from the first drawn frame (onReady) until a failure or
    teardown, otherwise "off". audience: the urgent audience. tier (WAVE 2): the renderer's current tier, from
    onTier, for verifiers ("high" | "mid" | "low"; absent while GL is off). */
export const STAGE_ATTR = { audience: "data-aud", gl: "data-gl", tier: "data-tier" } as const;
export const DPR_CAP = { desktop: 1.5, phone: 1.25 } as const;
/** WAVE 2 (V4): the canvas is the poster box, 2 S square centred on the stage (CSS inset −50% inside .stage, under
    the poster), no longer the whole hero. The renderer sizes its buffer from the canvas's layout box
    (clientWidth / clientHeight), never from a transformed rect. */
export const CANVAS_BOX = POSTER_BOX;
/** After onFail("lost") the caller may mount a fresh renderer on a fresh canvas at most this many times per page
    (HERO-V2 §4.7, tokens.ts SKY.maxRestores). Never after "nogl", "link", "atlas" or "gaveup". */
export const MAX_REMOUNTS = 2;

/* ── Submit (WAVE 2, item 1) ── */

/** A valid submit (launch()): the full turn (spinMs, ease-in-out-cubic, as HEAD), all seven glints at 1 for allLitMs,
    and the comet once round the ring from the bead, clockwise, over COMET_MS, ease-out-cubic from the press, so it
    lands before the 450 ms dawn navigates (review M2). */
export const COMET_MS = 300;
export const LAUNCH = { spinMs: 2000, allLitMs: 2600 } as const;

/* ── The creators cut (DEFERRED: item 7's wedge is not built in wave 2; the bead and the tumble stay, see SWITCH).
   Kept as the deferred wedge's starting point; nothing reads it. ── */

export const CUT = { startDeg: 270 - ARM_HALF_DEG, stepMs: 1600 } as const;
export interface CutRange { list: readonly number[]; min: number; max: number }

/* ── Quality tiers (WAVE 2, item 5) ── */

export type TierName = "high" | "mid" | "low";
export interface Tier {
  iorSamples: 5 | 3 | 1; marchSteps: number; innerSteps: number; bounces: 1 | 2;
  bevel: "full" | "cheap"; studioBoxes: 4 | 2; coronaOctaves: 2 | 1;
  /** The rings in refracted rays (env()); the main view always draws them. */
  ringsInGlass: boolean;
}
/** high: 5 IOR samples, the full march; mid: 3 samples, 48/24 steps; low: 1 sample and the cheap bevel. Every tier
    uses HEAD's material constants (item 4 is deferred): only sample counts, step counts and the listed terms differ. */
export const TIERS: Readonly<Record<TierName, Tier>> = {
  high: { iorSamples: 5, marchSteps: 72, innerSteps: 36, bounces: 2, bevel: "full", studioBoxes: 4, coronaOctaves: 2, ringsInGlass: true },
  mid: { iorSamples: 3, marchSteps: 48, innerSteps: 24, bounces: 2, bevel: "full", studioBoxes: 4, coronaOctaves: 2, ringsInGlass: true },
  low: { iorSamples: 1, marchSteps: 40, innerSteps: 16, bounces: 1, bevel: "cheap", studioBoxes: 2, coronaOctaves: 1, ringsInGlass: false },
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
/** The ladder a device actually walks: from the init tier's first step, each dpr clamped to min(step, cap,
    deviceDpr), no-op steps dropped (L7). cap = DPR_CAP by band; software renderers pass deviceDpr 1. */
export function tierSteps(start: TierName, deviceDpr: number, phone: boolean): { tier: TierName; dpr: number }[] {
  const cap = Math.min(deviceDpr, phone ? DPR_CAP.phone : DPR_CAP.desktop);
  const out: { tier: TierName; dpr: number }[] = [];
  for (const st of TIER_LADDER.slice(TIER_LADDER.findIndex((x) => x.tier === start))) {
    const step = { tier: st.tier, dpr: Math.min(st.dpr, cap) }, last = out[out.length - 1];
    if (!last || last.tier !== step.tier || last.dpr !== step.dpr) out.push(step);
  }
  return out;
}
/** The tier every poster of a band is captured at, so the held resting frame is drawn by the same program the
    poster came from (W2-4): the renderer compiles this first for REST, then its init tier (if different) in the
    background, swapped in after release. */
export const POSTER_TIER: Readonly<Record<PosterBand, TierName>> = { phone: "mid", desktop: "high" };
/** The watchdog (HERO-V2 §4.8): after any (re)start or step skip skipFrames, then judge windows of windowFrames
    frame deltas: median inside cappedMs → maybe a capped display, maybe a GPU-bound device on the 60 Hz screen's
    33 ms quantum: shed one step (dpr 1, else the next ladder step) and judge one more window; lock only if it is
    still capped and its mean rose by at most capRiseFps (the display is the limit), else go on down the ladder;
    mean below fpsFloor → next step; at the last step below giveUpFps → give up (onFail "gaveup"), locked or not
    (only a forced setTier() turns the give-up off). Software renderers are refused outside debug, ?sky=gl and
    ?sky=soft, and never step unless ?sky=soft (A-P5). The mean leaves out hitches and stalls: the window's
    trimFrames longest deltas and any delta over max(4 x the window's median, stallMs). */
export const WATCHDOG = { skipFrames: 30, windowFrames: 50, fpsFloor: 55.5, giveUpFps: 40, cappedMs: [31.3, 35.3], capRiseFps: 3, stallMs: 250, trimFrames: 2 } as const;

/* ── The renderer ── */

/** Why the poster is back. nogl: no context; link: the program failed; atlas: an avatar failed to load twice on
    brands (the rest frame would differ from the poster, so the poster stays); lost: the context was lost (the
    caller may remount on a fresh canvas, at most twice); gaveup: the watchdog's last step was too slow (never
    remount). */
export type FailReason = "nogl" | "link" | "atlas" | "lost" | "gaveup";

/** window.__sky while ?skydebug is on (and on the dev server): what verifiers read, kept current every frame and on
    every setter. facing: |M22| of the star's rotation (1 face-on, 0 edge-on); flip: radians of the switch flip so far;
    soft, aud: the material and the tint (0 brands, 1 creators); bead: the bead's angle (radians); switchMs: the
    switch clock since the last animated switch (after the 100 ms per-frame cap and before ?skyslow, so a verifier
    compares with switchAt(switchMs)); rings: the rings' presence (0..1) and the inner and outer drift (degrees, 0 at
    REST); comet: 0..1 while it runs. */
export interface EclipseDebug {
  running: boolean; held: boolean; tier: TierName; dpr: number; fps: number; step: number;
  facing: number; flip: number; soft: number; aud: number; bead: number; switchMs: number;
  comet: number; levels: readonly number[]; working: number; rings: readonly [number, number, number];
}
/** The debug globals (the renderer sets them only under ?skydebug or on the dev server, and deletes them on
    destroy). state: window.__sky (EclipseDebug); handle: window.__skyHandle, the live EclipseHandle, so a verifier
    can drive setAgents / setTier / launch before the packages that call them have landed. slow: ?skyslow=N multiplies
    every switch duration and delay (SWITCH) and the launch's (LAUNCH, COMET_MS) by N, for frame captures only. */
export const SKY_DEBUG = { param: "skydebug", state: "__sky", handle: "__skyHandle", slow: "skyslow" } as const;

export interface EclipseOptions {
  audience: Audience;
  /** Once, after the first frame at REST is drawn and presented (one rAF after the draw). WAVE 2: on brands the
      first frame waits for the program AND the rings' atlas. */
  onReady?: () => void;
  /** WebGL missing, compile or link failure, the atlas, a lost context, or the watchdog gave up: the caller shows
      the poster. */
  onFail?: (reason: FailReason) => void;
  /** WAVE 1: poster capture mode (scripts/hero-poster.cjs). No loop, no observers, no listeners. */
  capture?: CaptureOptions;
  /** WAVE 2: force a tier (capture: the band's POSTER_TIER). Otherwise REST uses POSTER_TIER by PHONE_MQ and the
      running loop initialTier() (?tier= wins). */
  tier?: TierName;
  /** WAVE 2: the tier and DPR in use, on start and on every watchdog step. */
  onTier?: (s: { tier: TierName; dpr: number }) => void;
}

export interface EclipseHandle {
  /** instant (or a loop that is not running: paused, hidden, offscreen, covered) jumps material, bead, tint and the
      rings' presence and redraws once; otherwise the locked switch plays (SWITCH; review H4). */
  setAudience(a: Audience, instant?: boolean): void;
  /** Focus 1 turns the star to face the visitor (FOCUS); focus 0 is REST's pose. */
  setFocus(on: boolean): void;
  /** A keystroke: the ripple and the bead kick (the glints come from setAgents). */
  pulse(): void;
  /** A valid submit: the full turn, all seven glints at 1, the comet once round the ring over COMET_MS. */
  launch(): void;
  setPaused(p: boolean): void;
  resize(): void;
  destroy(): void;
  /** WAVE 1: start the clock. Until then the renderer holds the resting frame (the poster's frame). Called by
      the caller when the poster has faded; RELEASE_FALLBACK_MS after onReady it releases itself. Any
      animated input (pulse, launch, setFocus(true), an animated setAudience) releases it first. Wave-2 setters
      called while held are stored and take effect after release (the held frame never changes). */
  release(): void;
  /** WAVE 2 (item 1): the seven glint levels and the working index, from hero/Agents.tsx. The renderer eases each
      level toward its target (1 − e^(−8 dt)); a stopped loop redraws once. */
  setAgents(s: AgentStates): void;
  /** WAVE 2 (item 5): force a tier (debug and tests); the swap happens when the new program has linked. */
  setTier(t: TierName): void;
}

/* ── hero/Agents.tsx (WAVE 2; AGENTS builds it, STAGE mounts it) ── */

/** Agents' props. Refs are plain { current } objects (React's RefObject fits). EclipseSky mounts <Agents> as the
    .stage element's SIBLING (outside .stage, inside the hero section), so the card's containing block is the sticky
    hero section; the DOM glint dots go into the stage through a portal on props.stage. Agents runs its clock on every
    viewport while motion is allowed (the glints light in turn on phones and on creators too) and renders the card
    only under CARD_MQ, on CARD_AUDIENCE, with `card` true. */
export interface AgentsProps {
  /** The .stage element: in view, uncovered and the like are measured on it; the dots are portalled into it. */
  stage: { readonly current: HTMLElement | null };
  /** The live renderer, or null while GL is off (poster only). */
  handle: { readonly current: EclipseHandle | null };
  /** True while the stage says data-gl="on": Agents sends setAgents only then (the poster's glints rest at idle). */
  gl: boolean;
  /** Changes whenever a new renderer is mounted (a remount after a lost context), so Agents re-sends its state. */
  mountKey: number;
  /** Gate G10 (Hero.tsx G10_SIGNED): false renders no card at any size; the glints still light. */
  card: boolean;
}
/** The card's DOM, for verifiers (A-A). The card root carries data-agent-card, aria-hidden, data-agent (the
    AgentName shown, absent before the first item), data-working ("true" while that agent works) and data-landed
    ("true" once the cycle's last item has landed). Its one row: the moon-dot glyph (ui/Moon, working while the agent
    works), the agent name in Geist Mono caps (mono-caps), and the verbatim text (ReplayItem.text, or .land once
    landed) on one line, truncated with an ellipsis. At most one card in the document. Through the rest between
    cycles and while the visitor types it keeps its last text with the glyph at rest; it never moves or resizes, and a
    change of agent or text is a soft crossfade in place (opacity only). */
export const AGENTS_DOM = { card: "data-agent-card", agent: "data-agent", working: "data-working", landed: "data-landed" } as const;
