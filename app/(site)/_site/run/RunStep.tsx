"use client";
/* One step of the run (SPEC §5.3). WP3 owns these props.
 *
 * Sticky stage: a <button> (the list item's only child) that scrolls the stage to its step. The
 * active step lifts onto a white card (an opacity-only layer, 300 ms). Every line is always shown,
 * so changing the active step never moves anything.
 * Stacked layout: a plain block; agent steps show a full Moon (they are all done).
 *
 * Glyph (ruling 35): an agent step's Moon follows its state, as the act rail does: upcoming 0,
 * active working in brand, done 4. A step whose credit starts with "You" is the visitor's own, so it
 * gets the MoonRing instead, in brand while active. The working cycle runs only while the glyph is
 * on screen (the ticker itself stops when the page is hidden or the user pauses). */
import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { Moon, MoonRing } from "../ui/Moon";
import s from "./run.module.css";

export type RunStepState = "upcoming" | "active" | "done";

export interface RunStepProps {
  index: number;
  title: string;
  body: string;
  creditLabel: string;       // COPY[a].run.creditLabel ("Done by")
  credit: string;            // COPY[a].run.steps[i].credit(DEMO)
  state: RunStepState;
  /** "button" in the sticky stage, "static" in the stacked layout. */
  mode: "button" | "static";
  /** Sticky only: scroll the stage to this step; `immediate` for keyboard focus. */
  onActivate?: (index: number, immediate: boolean) => void;
}

/** The visitor's own step: its credit starts with "You". */
export const isYours = (credit: string) => /^You\b/.test(credit);

/** True while the element is on screen. Local state, so only the glyph re-renders. */
function useOnScreen(ref: React.RefObject<Element>, enabled: boolean): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") { setOn(false); return; }
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled]);
  return on;
}

function Glyph({ state, yours, stacked }: { state: RunStepState; yours: boolean; stacked: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const active = state === "active";
  const onScreen = useOnScreen(ref, active && !yours);
  const tone = active ? "text-brand" : "text-ink";
  return (
    <span ref={ref} className={`${s.glyph} ${tone}`}>
      {yours ? <MoonRing size={15} />
        : stacked ? <Moon phase={4} size={15} />
          /* Off screen, the active glyph rests on phase 2 (the static "working" frame, as under
             reduced motion), so nothing ticks for a stage nobody can see. */
          : <Moon phase={active ? 2 : state === "done" ? 4 : 0} working={active && onScreen} size={15} />}
    </span>
  );
}

export function RunStep({ index, title, body, creditLabel, credit, state, mode, onActivate }: RunStepProps) {
  const uid = useId();
  const yours = isYours(credit);
  const stacked = mode === "static";
  const active = state === "active";
  const lead = stacked || active;
  const n = String(index + 1).padStart(2, "0");

  /* Inside the button everything is phrasing content (spans). Stacked, the step is a block and its
     title an h3, so a screen reader can move from step to step under the section's h2. */
  const Box = stacked ? "div" : "span";
  const Title = stacked ? "h3" : "span";
  const inner = (
    <>
      <Box className={s.glyphCell}><Glyph state={state} yours={yours} stacked={stacked} /></Box>
      <Box className={s.content}>
        {!stacked && <span aria-hidden className={s.card} />}
        {/* The block keeps the step's direction (start-aligned under RTL); the number inside is LTR. */}
        <Box id={`${uid}-n`} className={`${s.num} mono-data text-ink/60`}><span className="num">{n}</span></Box>
        <Title id={`${uid}-t`} className={`${s.title} text-h3 ${lead ? "text-ink" : state === "done" ? "text-ink/72" : "text-ink/60"}`}>
          {title}
        </Title>
        <Box id={`${uid}-b`} className={`${s.body} text-small ${lead ? "text-ink/72" : "text-ink/60"}`}>{body}</Box>
        {/* The "·" is for the eye; a screen reader hears "Done by MoonShot AI". */}
        <Box id={`${uid}-c`} className={`${s.credit} mono-caps text-ink/60`}>
          {creditLabel}<span aria-hidden> ·</span> {credit}
        </Box>
      </Box>
    </>
  );

  if (stacked) return <div className={s.step} data-state="done">{inner}</div>;

  /* Focus scrolls immediately, but only for keyboard focus: Chrome and Firefox also focus a button on
     a mouse click, and an immediate scroll there would cancel the click's 0.8 s scroll (§5.3, B-L3). */
  const onFocus = (e: FocusEvent<HTMLButtonElement>) => {
    if (e.currentTarget.matches(":focus-visible")) onActivate?.(index, true);
  };
  return (
    <button
      type="button"
      className={s.step}
      data-state={state}
      aria-current={active ? "step" : undefined}
      aria-labelledby={`${uid}-n ${uid}-t`}
      aria-describedby={`${uid}-b ${uid}-c`}
      onClick={() => onActivate?.(index, false)}
      onFocus={onFocus}
    >
      {inner}
    </button>
  );
}
