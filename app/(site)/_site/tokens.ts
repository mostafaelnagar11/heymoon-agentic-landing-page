export const C = {
  night0: "#000211", night1: "#010317", night2: "#0A0C1E", deep: "#141229",
  paper: "#FCFBF8", canvas: "#F6F4FC", lilac: "#F3EFFC", ink: "#12151B",
  v700: "#4D2FB0", v600: "#6848D1", v500: "#7C5CE0", v400: "#9B7BF0", v300: "#A78BFA", glow: "#A65FED",
  pink: "#F0559D", blush: "#F4A8D8", good: "#25A333", goodDeep: "#1C7A26", danger: "#D70015",
} as const;

export const EASE = {
  outExpo: [0.16, 1, 0.3, 1], out: [0.22, 1, 0.36, 1], inOut: [0.65, 0, 0.35, 1], exit: [0.7, 0, 0.84, 0],
} as const;
const bez = (e: readonly number[]) => `cubic-bezier(${e.join(",")})`;
export const EASE_CSS = {
  outExpo: bez(EASE.outExpo), out: bez(EASE.out), inOut: bez(EASE.inOut), exit: bez(EASE.exit),
} as const;

/** Seconds, for motion. */
export const DUR = {
  micro: 0.2, ui: 0.35, out: 0.45, pill: 0.5, reveal: 0.6, in: 0.8, hero: 1.1,
  draw: 1.2, world: 1.2, ignite: 1.6, dawn: 0.45, reduced: 0.2,
} as const;
export const SPRING = {
  pill: { type: "spring", bounce: 0.18, duration: 0.5 },
  // Critically damped (ζ ≈ 1.004, mass 1): $63,049 at 1.3 s, rest at about 1.44 s, never above the target.
  // ({damping: 60, stiffness: 100} was ζ = 3 and took 6.9 s to rest.)
  number: { stiffness: 120, damping: 22, restDelta: 0.5 },
} as const;

/** The two media queries every package shares. Never write another breakpoint for these. */
export const MQ = { phone: "(max-width: 639px)", short: "(max-height: 520px)" } as const;

export const GLYPH = { stepMs: 160, launcherStepMs: 90 } as const;
export const TYPE = { typeMs: 85, deleteMs: 35, errorMs: 4000, retypeBeforeMs: 580 } as const;
export const TOAST = { inMs: 500, holdMs: 2400, outMs: 400, restMs: 3000, firstAtMs: 2400, openerMs: 900, minWidth: 1024 } as const;
export const RUN = { startAt: 0.55, pauseBelow: 0.2, foldDelayMs: 600, foldMs: 500, holdMs: 4000, compactGapMs: 2000, picksLeadMs: 300 } as const;
export const ORBIT = { revS: 120, beamMs: 900, pulseMs: 600, restMs: 2000 } as const;
export const LIFT = { insetDesktop: 24, insetPhone: 12, radiusDesktop: 32, radiusPhone: 28, liftPx: 40, dim: 0.55, contentOpacity: 0.4 } as const;
export const SKY = {
  dprLevels: [1.5, 1.0, 0.75], maxPixels: 2.2e6, fpsFloor: 55.5, giveUpFps: 40,
  skipFrames: 30, sampleFrames: 50, capped33Ms: [31.3, 35.3], maxRestores: 2,
  sinkPx: { desktop: 120, phone: 80 }, pointerPx: { x: 12, y: 6 }, pointerLerp: 0.06,
  limbRadiusVw: 1.1, igniteDelayMs: 400, igniteMs: 1600, canvasFadeMs: 1200,
} as const;
export const WORLD = { duration: 1.2, reducedDuration: 0.2 } as const;
