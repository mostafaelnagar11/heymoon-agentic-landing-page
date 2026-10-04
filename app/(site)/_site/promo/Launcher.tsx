"use client";
/* The launcher (SPEC §5.7): a dark disc with a bright ring, fixed at the bottom end. Closed it holds a
   full Moon (a hover plays one lunar cycle at 90 ms a step); open, a white X. The swap cross-fades with
   a 90° turn over 220 ms.

   Two levels (rule 2.4.6): the <button> shows and hides by a 200 ms opacity and scale transition, and
   only the inner span plays the appear and pulse keyframes (their `both` fill would otherwise pin the
   button visible). Hidden means inert, aria-hidden, opacity 0, scale .8 and no pointer events. */
import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Phase } from "../contracts";
import { GLYPH } from "../tokens";
import { COPY } from "../copy";
import { inertProp } from "../lib/iso";
import { Moon } from "../ui/Moon";
import s from "./promo.module.css";

/** Which keyframe the disc plays, and a nonce so the same one can play again. */
export interface LauncherAnim { kind: "in" | "pulse" | null; n: number }

export interface LauncherProps {
  open: boolean;
  shown: boolean;
  /** The headline: the button's name while closed. */
  label: string;
  anim: LauncherAnim;
  reduced: boolean;
  onToggle(): void;
  onEscape(): void;
  /** Lab only: render in flow instead of fixed. */
  inline?: boolean;
}

/** One lunar cycle from full: 5, 6, 7, 0, 1, 2, 3, then back to 4. */
const CYCLE: Phase[] = [5, 6, 7, 0, 1, 2, 3, 4];

function useHoverCycle(enabled: boolean) {
  const [phase, setPhase] = useState<Phase>(4);
  const timer = useRef<number>();
  const running = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (enabled) return;
    window.clearTimeout(timer.current);
    running.current = false;
    setPhase(4);
  }, [enabled]);
  const play = () => {
    if (!enabled || running.current) return;
    running.current = true;
    let i = 0;
    const step = () => {
      setPhase(CYCLE[i]);
      i += 1;
      if (i < CYCLE.length) timer.current = window.setTimeout(step, GLYPH.launcherStepMs);
      else running.current = false;
    };
    timer.current = window.setTimeout(step, GLYPH.launcherStepMs);
  };
  return { phase, play };
}

export const Launcher = forwardRef<HTMLButtonElement, LauncherProps>(function Launcher(
  { open, shown, label, anim, reduced, onToggle, onEscape, inline = false },
  ref,
) {
  const cycle = useHoverCycle(!open && !reduced);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape" && open) { e.preventDefault(); onEscape(); }
  };
  const animClass = reduced || !anim.kind ? ""
    : anim.kind === "in" ? "motion-safe:animate-launcher-in" : "motion-safe:animate-launcher-pulse";

  return (
    <button
      ref={ref}
      type="button"
      data-promo-launcher=""
      data-shown={shown ? "true" : "false"}
      data-open={open ? "true" : "false"}
      data-rm={reduced ? "true" : "false"}
      aria-expanded={open}
      aria-controls="promo-card"
      aria-label={open ? COPY.shared.close : label}
      aria-hidden={shown ? undefined : true}
      {...inertProp(!shown)}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") cycle.play(); }}
      className={`${s.launcher} ${inline ? s.launcherInline : ""} dawn-fade`}
    >
      <span key={`${anim.kind}-${anim.n}`} className={`${s.anim} ${animClass}`}>
        <span className={`${s.face} shadow-launcher`}>
          <span className={`${s.glyph} ${s.moonG}`}>
            <Moon phase={cycle.phase} size={20} />
          </span>
          <span className={`${s.glyph} ${s.xG}`}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden focusable="false">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </span>
      </span>
    </button>
  );
});
