/* The shared glyph clock (SPEC §4.3). One frame.update loop that steps every GLYPH.stepMs, and
   only while it has subscribers, the page is visible, and playback is not paused. Every working
   Moon reads it, so all working glyphs stay in phase and cost one callback. */
import { cancelFrame, frame, type FrameData } from "motion/react";
import { GLYPH } from "../tokens";
import { getPaused, subscribePaused } from "./playback";

const subs = new Set<(step: number) => void>();
let step = 0;
let acc = 0;
let running = false;
let wired = false;

const tick = ({ delta }: FrameData) => {
  acc += Math.min(delta, 250);   // a long gap (a dropped frame burst) advances at most one or two steps
  if (acc < GLYPH.stepMs) return;
  acc %= GLYPH.stepMs;
  step = (step + 1) % 8;
  subs.forEach((cb) => cb(step));
};

function sync() {
  const should = subs.size > 0 && !document.hidden && !getPaused();
  if (should && !running) { running = true; frame.update(tick, true); }
  else if (!should && running) { running = false; cancelFrame(tick); }
}

function wire() {
  if (wired || typeof document === "undefined") return;
  wired = true;
  document.addEventListener("visibilitychange", sync);
  subscribePaused(sync);
}

/** Subscribe to the glyph step (0 to 7). Returns the unsubscribe. The callback first fires on the next step. */
export function subscribeGlyph(cb: (step: number) => void): () => void {
  wire();
  subs.add(cb);
  sync();
  return () => {
    subs.delete(cb);
    sync();
  };
}

/** The current step, for a glyph that mounts mid-cycle. */
export const glyphStep = () => step;
