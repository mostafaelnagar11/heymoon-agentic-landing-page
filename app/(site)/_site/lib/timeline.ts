/* The one clock for the window, the toasts and the orbit (SPEC §4.3).

   - `t` is elapsed ACTIVE ms. It advances on frame.update by frameData.delta, clamped to 40 ms, so a
     resume never jumps. Write text from it with useMotionValueEvent, never through React state.
   - `mark` is the index of the last mark ≤ t (-1 before the first), and `done` is t ≥ endMs. Both are
     React state and change only on a crossing.
   - Under reduced motion the timeline sits at endMs with done = true.
   - Static by default (rule 2.4.7): a timeline first rendered on the server (whose snapshot is
     "reduced") starts at endMs, so the server HTML and the first client render show the final state.
     The section decides when to play from the start: call restart() (for example, at mount when the
     element is below the viewport). A timeline first mounted on the client while motion is allowed
     starts at 0.
   - With loopGapMs, a finished run waits that much active time, then restarts from 0. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cancelFrame, frame, useMotionValue, useMotionValueEvent, type FrameData, type MotionValue } from "motion/react";
import { useReducedMotionPref } from "./prefs";

export interface TimelineOpts { endMs: number; marks: number[]; playing: boolean; loopGapMs?: number }
export interface Timeline {
  t: MotionValue<number>;        // elapsed ACTIVE ms; write text from it via useMotionValueEvent, never via state
  mark: number;                  // index of the last mark ≤ t (React state; changes only on crossings)
  done: boolean;
  seek(ms: number): void; restart(): void;
}

export function useTimeline({ endMs, marks, playing, loopGapMs }: TimelineOpts): Timeline {
  const reduced = useReducedMotionPref();
  const [startReduced] = useState(reduced);
  const t = useMotionValue(startReduced ? endMs : 0);

  const marksKey = marks.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by value, not by array identity
  const sorted = useMemo(() => [...marks].sort((a, b) => a - b), [marksKey]);
  const markOf = useCallback((v: number) => {
    let i = -1;
    for (let k = 0; k < sorted.length && sorted[k] <= v; k++) i = k;
    return i;
  }, [sorted]);

  const [mark, setMark] = useState(() => markOf(t.get()));
  const [done, setDone] = useState(() => t.get() >= endMs);
  const sync = useCallback((v: number) => {
    setMark(markOf(v));
    setDone(v >= endMs);
  }, [markOf, endMs]);
  useMotionValueEvent(t, "change", sync);
  useEffect(() => { sync(t.get()); }, [sync, t]);

  /* Reduced motion: jump to the end and stay there. */
  useEffect(() => { if (reduced) t.set(endMs); }, [reduced, endMs, t]);

  /* The loop. Registered only while there is something to advance. */
  const gap = useRef(0);
  const running = playing && !reduced && (!done || loopGapMs !== undefined);
  useEffect(() => {
    if (!running) return;
    const tick = ({ delta }: FrameData) => {
      const d = Math.min(delta, 40);
      const v = t.get();
      if (v < endMs) { t.set(Math.min(endMs, v + d)); gap.current = 0; return; }
      if (loopGapMs === undefined) return;
      gap.current += d;
      if (gap.current >= loopGapMs) { gap.current = 0; t.set(0); }
    };
    frame.update(tick, true);
    return () => cancelFrame(tick);
  }, [running, endMs, loopGapMs, t]);

  const seek = useCallback((ms: number) => { gap.current = 0; t.set(Math.max(0, Math.min(endMs, ms))); }, [endMs, t]);
  const restart = useCallback(() => { gap.current = 0; t.set(reduced ? endMs : 0); }, [endMs, reduced, t]);

  return { t, mark, done, seek, restart };
}
