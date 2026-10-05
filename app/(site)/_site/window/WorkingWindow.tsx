"use client";
/* The working window (SPEC §5.2.3): the agents at the product's real pace, from demo.json only.

   page     the section's window: a title bar (the store or handle, the status line, the counter, the
            labelled stopwatch, the progress glyph), the rows on the left and the artefact on the right.
            Below 1024, one column: the rows' viewport, then the artefact.
   compact  WP7's promo thumbnail, 360x210 (phone: full width at 16:9): the frame art, a small window,
            the stopwatch group exactly as on the page, the last four rows of the read, then the plan or
            the tiers. It loops with RUN.compactGapMs.

   Both are aria-hidden: the section carries the spoken summary. The caller decides `playing`. */
import { useRef, useState, type CSSProperties } from "react";
import type { MotionValue } from "motion/react";
import type { WorkingWindowProps } from "../contracts";
import { Moon } from "../ui/Moon";
import { Star } from "../ui/Star";
import { useIsoLayoutEffect } from "../lib/iso";
import { useRun, type Schedule, type Snap } from "./useRun";
import { ChainList } from "./ChainList";
import { Artefact } from "./Artefact";
import { Stopwatch } from "./Stopwatch";
import s from "./window.module.css";

/** The frame art (§5.2.1): the halftone, and a dotted arc, R = 1.1 × the frame width, its apex 120px
    above the frame's bottom. Static. The arc needs the frame's size, so it draws after mount; it is
    decoration behind the window, so nothing moves when it appears. */
export function FrameArt() {
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth, h = el.clientHeight;
      setBox((b) => (b && b.w === w && b.h === h ? b : { w, h }));
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const R = box ? 1.1 * box.w : 0;
  return (
    <>
      <div className={`halftone ${s.art}`} aria-hidden />
      <svg
        ref={ref}
        aria-hidden
        focusable="false"
        className={s.art}
        width="100%"
        height="100%"
        viewBox={box ? `0 0 ${box.w} ${box.h}` : "0 0 1 1"}
      >
        {box && (
          <circle
            cx={box.w / 2}
            cy={box.h - 120 + R}
            r={R}
            fill="none"
            stroke="#fff"
            strokeOpacity={0.5}
            strokeWidth={2}
            strokeDasharray="0 8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </>
  );
}

/** "Agent · note": the agent a step stronger than what it is doing. One line, ellipsis. */
function StatusLine({ line }: { line: string }) {
  const at = line.indexOf(" · ");
  if (at < 0) return <span className={s.barStatusText}>{line}</span>;
  return (
    <span className={s.barStatusText}>
      <span className={s.barStatusAgent}>{line.slice(0, at)}</span>{line.slice(at)}
    </span>
  );
}

function TitleBar({ sch, snap, t }: { sch: Schedule; snap: Snap; t: MotionValue<number> }) {
  return (
    <div className={s.bar}>
      <span className={s.barBrand}>
        <Star size={16} className="text-ink" />
        <span className="mono-data truncate text-ink/72" dir="ltr">{sch.shown}</span>
      </span>
      <span className={s.barStatus}>
        <StatusLine key={snap.status} line={snap.status} />
      </span>
      <span className={s.barProg}>
        <span className={`${s.barCount} mono-data num text-ink/60`} dir="ltr">{snap.counter}</span>
        <span className={s.barMoon}><Moon phase={snap.moon} size={15} className="text-ink" /></span>
      </span>
      <Stopwatch s={sch} t={t} stamped={snap.stamped} className={s.barWatch} />
    </div>
  );
}

/** The page window at a frame: the state at the current mark, and `t` for the per-frame parts.
    Exported for the lab's frozen views; WorkingWindow is the only production caller. */
export function PageWindow({ sch, snap, t, live, done }: { sch: Schedule; snap: Snap; t: MotionValue<number>; live: boolean; done: boolean }) {
  return (
    <div className={s.win} aria-hidden data-a={sch.audience} data-live={live ? "1" : "0"} style={{ "--read-n": sch.read.length } as CSSProperties}>
      <TitleBar sch={sch} snap={snap} t={t} />
      <div className={s.body}>
        <div className={s.listCol}>
          <ChainList s={sch} snap={snap} live={live} />
        </div>
        <Artefact s={sch} snap={snap} done={done} />
      </div>
    </div>
  );
}

export function CompactWindow({ sch, snap, t, live }: { sch: Schedule; snap: Snap; t: MotionValue<number>; live: boolean }) {
  return (
    <div className={s.compact} aria-hidden data-a={sch.audience}>
      <FrameArt />
      <div className={s.cWin}>
        <div className={s.cBar}>
          <span className={s.cBrand}>
            <Star size={12} className="text-ink" />
            <span className={`${s.cShown} truncate`} dir="ltr">{sch.shown}</span>
          </span>
          <Stopwatch s={sch} t={t} stamped={snap.stamped} size="compact" />
        </div>
        <div className={s.cBody}>
          <ChainList s={sch} snap={snap} live={live} variant="compact" />
          <Artefact s={sch} snap={snap} variant="compact" />
        </div>
      </div>
    </div>
  );
}

export function WorkingWindow({ audience, variant, playing, loop, seek, restartNonce, onProgress }: WorkingWindowProps) {
  const { s: sch, tl, snap } = useRun({
    audience, variant, playing,
    loop: variant === "compact" ? loop : false,
    seek, restartNonce, onProgress,
  });
  const live = playing && !tl.done;
  return variant === "compact"
    ? <CompactWindow sch={sch} snap={snap} t={tl.t} live={live} />
    : <PageWindow sch={sch} snap={snap} t={tl.t} live={live} done={tl.done} />;
}
