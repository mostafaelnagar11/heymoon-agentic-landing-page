"use client";
/* S4, "Fifteen seconds" (SPEC §5.2.1): the H2 and sub, the deep frame with the working window, the
   controls, and the act rail.

   Gating. The run starts the first time the frame is 55% in view (of itself, or of the viewport when
   the frame is taller than it), then plays only while it stays at least 20% in view, the page is
   visible, the visitor has not paused, and the pointer is not over the window (which shows a 1px ring;
   only a pointer moved there counts, never one the page scrolled under).
   It plays once; then "Try it with your store" and "Run it again" fade in.

   Static by default (rule 2.4.7): the server renders the final state. At mount, a frame still below
   the viewport is reset to the start while unseen; a frame already in view stays final. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue } from "motion/react";
import type { RunProgress, WorkSectionProps } from "../contracts";
import { COPY, SHARED } from "../copy";
import { DEMO } from "../data/demo";
import { Section } from "../ui/Section";
import { WordReveal } from "../ui/WordReveal";
import { usePlayback } from "../lib/playback";
import { usePageVisible, useReducedMotionPref } from "../lib/prefs";
import { getSignal, setSignal } from "../lib/signals";
import { toField } from "../lib/scroll";
import { inertProp } from "../lib/iso";
import { RUN } from "../tokens";
import { WorkingWindow, FrameArt } from "./WorkingWindow";
import { ActRail } from "./ActRail";
import { RunClock, scheduleFor, type Act } from "./useRun";
import s from "./window.module.css";

const FINAL: RunProgress = { act: 2, actProgress: 1, overall: 1, done: true };
const START: RunProgress = { act: 0, actProgress: 0, overall: 0, done: false };

export function WorkSection({ audience }: WorkSectionProps) {
  /* Keyed: a new audience is a new run (the Landing's <Swap> remounts anyway). */
  return <Work key={audience} audience={audience} />;
}

function Work({ audience }: WorkSectionProps) {
  const c = COPY[audience].work;
  const sch = scheduleFor(audience);
  const reduced = useReducedMotionPref();
  /* The same rule the timeline uses: a first render with the server's "reduced" snapshot is final. */
  const [startFinal] = useState(reduced);
  const clock = useMotionValue(startFinal ? sch.END : 0);
  const [progress, setProgress] = useState<RunProgress>(startFinal ? FINAL : START);

  const frame = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [inView, setInView] = useState(false);
  const [hover, setHover] = useState(false);
  const [passed, setPassed] = useState(false);
  const [restartNonce, setRestartNonce] = useState(0);
  const [seek, setSeek] = useState<{ act: Act; nonce: number } | null>(null);
  const visible = usePageVisible();
  const { paused } = usePlayback();

  /* Rule 2.4.7: below the viewport at mount → start state while unseen. */
  useEffect(() => {
    const el = frame.current;
    if (!el || !startFinal) return;
    if (el.getBoundingClientRect().top > window.innerHeight) setRestartNonce((n) => n + 1);
  }, [startFinal]);

  /* Visibility: started at 55%, paused below 20%. Measured against the smaller of the frame and the
     viewport, so a frame taller than a short screen can still start. */
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      const vh = e.rootBounds?.height ?? window.innerHeight;
      const seen = e.isIntersecting ? e.intersectionRect.height / Math.max(1, Math.min(e.boundingClientRect.height, vh)) : 0;
      if (seen >= RUN.startAt) setStarted(true);
      setInView(seen >= RUN.pauseBelow);
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* `passed`: the frame's bottom edge has gone above the viewport top. */
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      setPassed(!e.isIntersecting && e.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = started && inView && visible && !paused && !hover && !reduced;
  const done = progress.done;

  /* The cross-package signal (WP7 reads it). Written only when a field changes. */
  const state = done ? "done" : !started ? "idle" : playing ? "playing" : "paused";
  useEffect(() => {
    const was = getSignal("work");
    const overall = Math.round(progress.overall * 10) / 10;
    if (was.state === state && was.overall === overall && was.passed === passed) return;
    setSignal("work", { state, overall, passed });
  }, [state, progress.overall, passed]);

  const onProgress = useCallback((p: RunProgress) => setProgress(p), []);
  const onSeek = useCallback((act: Act) => {
    setStarted(true);
    setSeek((was) => ({ act, nonce: (was?.nonce ?? 0) + 1 }));
  }, []);
  /* The press itself is over the window: it must not count as "hovering to pause". A fresh
     pointerenter (leave, then come back) pauses again. */
  const again = useCallback(() => {
    setStarted(true);
    setHover(false);
    setRestartNonce((n) => n + 1);
  }, []);

  /* Hover is a pointer the visitor MOVED over the window. One the page scrolled under (the pointer
     resting mid-screen while the wheel brings the window up) must not hold the run, so scrolling
     clears it, and a movement over the window sets it again. */
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && (e.movementX !== 0 || e.movementY !== 0)) setHover(true);
  }, []);
  const onPointerLeave = useCallback((e: React.PointerEvent) => { if (e.pointerType === "mouse") setHover(false); }, []);
  useEffect(() => {
    if (!hover) return;
    const off = () => setHover(false);
    window.addEventListener("scroll", off, { passive: true });
    return () => window.removeEventListener("scroll", off);
  }, [hover]);

  return (
    <Section slot="work" surface="paper" audience={audience} cv labelledBy="work-h" className="pb-16 pt-[72px] sm:pb-24 sm:pt-[120px]">
      <div className="mx-auto max-w-text px-[var(--gutter)]">
        <div className={s.head}>
          <WordReveal as="h2" id="work-h" text={c.h2} className={`text-h2 text-ink ${s.h2}`} />
          <p className={`text-lead text-ink/72 ${s.sub}`}>{c.sub}</p>
        </div>
      </div>

      <RunClock.Provider value={clock}>
        <div ref={frame} data-surface="deep" role="region" aria-label={SHARED.sampleRun} className={s.frame}>
          <FrameArt />
          <span className={`mono-caps text-white/56 ${s.frameLabel}`}>{SHARED.sampleRun}</span>
          <p className="sr-only">{c.summary(DEMO)}</p>

          <div
            className={s.winWrap}
            data-hover={hover ? "1" : "0"}
            data-done={done ? "1" : "0"}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            <WorkingWindow
              audience={audience}
              variant="page"
              playing={playing}
              seek={seek}
              restartNonce={restartNonce}
              onProgress={onProgress}
            />
            <div className={s.controls} data-on={done ? "1" : "0"} {...inertProp(!done)}>
              {!reduced && (
                <button type="button" className={`mono-data text-ink/72 ${s.again}`} onClick={again}>
                  {SHARED.runAgain}
                </button>
              )}
              <button type="button" className={s.try} onClick={() => toField()}>{c.try}</button>
            </div>
          </div>
          <div ref={sentinel} aria-hidden className={s.sentinel} />
        </div>

        <div className="mx-auto max-w-text px-[var(--gutter)]">
          <ActRail audience={audience} act={progress.act} done={done} live={playing && !done} onSeek={onSeek} />
        </div>
      </RunClock.Provider>
    </Section>
  );
}
