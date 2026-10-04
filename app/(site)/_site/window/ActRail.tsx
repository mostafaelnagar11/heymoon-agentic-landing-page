"use client";
/* The act rail (SPEC §5.2.4): the three A2 / A5 cards under the frame, synced to the window.

   Desktop: three buttons. Each has a 2px track whose fill follows the window's clock frame by frame
   (scaleX, written straight to the node), "01" with a moon glyph (upcoming new, active working, done
   full), the title and the body. Phone: the three tracks as small buttons, then the active act's
   title and body. A click seeks the window to that act; earlier acts complete instantly. */
import { useCallback, useContext, useEffect, useRef, useState, type CSSProperties } from "react";
import { useMotionValue, useMotionValueEvent } from "motion/react";
import type { Audience } from "../data/types";
import { DEMO } from "../data/demo";
import { COPY } from "../copy";
import { Moon } from "../ui/Moon";
import { RunClock, actFill, scheduleFor, type Act } from "./useRun";
import s from "./window.module.css";

export interface ActRailProps {
  audience: Audience;
  /** The window's act and whether it finished (from onProgress). */
  act: Act;
  done: boolean;
  /** The window is playing: the active glyph cycles. */
  live: boolean;
  onSeek: (act: Act) => void;
}

const ACTS: Act[] = [0, 1, 2];

/** A hyphenated word ("Pre-qualified") never breaks at its hyphen. Words stay whole (rule 2.4.5). */
function Title({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((w, i) => (w.includes("-") ? <span key={i} className={s.keep}>{w}</span> : w))}
    </>
  );
}
const num = (k: number) => String(k + 1).padStart(2, "0");

export function ActRail({ audience, act, done, live, onSeek }: ActRailProps) {
  const sch = scheduleFor(audience);
  const shared = useContext(RunClock);
  const own = useMotionValue(sch.END);
  const clock = shared ?? own;
  const acts = COPY[audience].work.acts;

  /* Fills: desktop 0..2, phone 3..5. */
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const [initial] = useState(() => ACTS.map((k) => actFill(sch, clock.get(), k)));
  const write = useCallback((v: number) => {
    fills.current.forEach((el, j) => {
      if (el) el.style.transform = `scaleX(${actFill(sch, v, (j % 3) as Act).toFixed(4)})`;
    });
  }, [sch]);
  useMotionValueEvent(clock, "change", write);
  useEffect(() => { write(clock.get()); }, [write, clock]);

  const stateOf = (k: Act): "done" | "active" | "upcoming" =>
    done || k < act ? "done" : k === act ? "active" : "upcoming";
  const glyph = (k: Act) => {
    const st = stateOf(k);
    return <Moon phase={st === "done" ? 4 : st === "active" ? 2 : 0} working={st === "active" && live} size={15} />;
  };
  const fillStyle = (k: Act): CSSProperties => ({ transform: `scaleX(${initial[k]})` });
  const shownAct: Act = done ? 2 : act;

  return (
    <div className={s.rail}>
      {/* Desktop and tablet: three columns. */}
      <div className={s.railCols}>
        {ACTS.map((k) => (
          <button
            key={k}
            type="button"
            className={s.railItem}
            data-state={stateOf(k)}
            aria-current={!done && k === act ? "step" : undefined}
            onClick={() => onSeek(k)}
          >
            <span className={s.track}><span ref={(el) => { fills.current[k] = el; }} className={s.fill} style={fillStyle(k)} /></span>
            <span className={s.railMeta}>
              <span className="mono-data num text-ink/60">{num(k)}</span>
              <span className={s.railGlyph}>{glyph(k)}</span>
            </span>
            <span className={s.railTitle}><Title text={acts[k].title} /></span>
            <span className={s.railBody}>{acts[k].body(DEMO)}</span>
          </button>
        ))}
      </div>

      {/* Phone: three small tracks, then the act on stage. */}
      <div className={s.railPhone}>
        <div className={s.railTracks}>
          {ACTS.map((k) => (
            <button
              key={k}
              type="button"
              className={s.railTrackBtn}
              data-state={stateOf(k)}
              aria-current={!done && k === act ? "step" : undefined}
              aria-label={acts[k].title}
              onClick={() => onSeek(k)}
            >
              <span className={s.track}><span ref={(el) => { fills.current[3 + k] = el; }} className={s.fill} style={fillStyle(k)} /></span>
            </button>
          ))}
        </div>
        <div className={s.railStage}>
          <span className={s.railMeta}>
            <span className="mono-data num text-ink/60">{num(shownAct)}</span>
            <span className={s.railGlyph}>{glyph(shownAct)}</span>
          </span>
          <span key={`${audience}-${shownAct}`} className={s.railStageText}>
            <span className={s.railTitle} data-state="active"><Title text={acts[shownAct].title} /></span>
            <span className={s.railBody}>{acts[shownAct].body(DEMO)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
