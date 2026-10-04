/* The frame-time watchdog (SPEC §5.1.6), inside the lazy sky chunk.
   After any (re)start it skips SKY.skipFrames deltas, then judges each window of SKY.sampleFrames:
   - median delta within SKY.capped33Ms: the display is capped at 30 fps (iOS Low Power). Use DPR 1.0 and
     stop stepping: a lower DPR cannot buy frames the display will not show;
   - mean below SKY.fpsFloor: step the DPR level down (1.5 → 1.0 → 0.75);
   - already at the lowest level and still below SKY.giveUpFps: give up (the caller keeps the CSS sky). */
import { SKY } from "../tokens";

export type Verdict = "keep" | "down" | "cap" | "give-up";
export interface Watchdog {
  /** One frame's delta (ms). Returns what the caller should do; anything but "keep" resets the window. */
  sample(deltaMs: number): Verdict;
  reset(): void;
  readonly level: number;
}

export function createWatchdog(o: { giveUp: boolean }): Watchdog {
  const levels = SKY.dprLevels;
  let index = 0;
  let locked = false;
  let skip: number = SKY.skipFrames;
  const win: number[] = [];

  const reset = () => { skip = SKY.skipFrames; win.length = 0; };

  return {
    get level() { return levels[index]; },
    reset,
    sample(delta) {
      if (locked) return "keep";
      if (skip > 0) { skip--; return "keep"; }
      win.push(delta);
      if (win.length < SKY.sampleFrames) return "keep";
      const sorted = [...win].sort((a, b) => a - b);
      const median = sorted[sorted.length >> 1];
      const fps = 1000 / (win.reduce((s, d) => s + d, 0) / win.length);
      win.length = 0;
      if (median >= SKY.capped33Ms[0] && median <= SKY.capped33Ms[1]) {
        locked = true;
        const one = levels.indexOf(1);
        if (one >= 0 && one !== index) { index = one; reset(); return "cap"; }
        return "keep";
      }
      if (fps >= SKY.fpsFloor) return "keep";
      if (index < levels.length - 1) { index++; reset(); return "down"; }
      if (fps < SKY.giveUpFps && o.giveUp) return "give-up";
      return "keep";
    },
  };
}
