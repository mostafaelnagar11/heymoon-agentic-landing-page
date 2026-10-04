"use client";
/* The labelled stamp (SPEC §5.2.3, ruling 16): "Reading" while the read runs, then "Store details in"
   / "Your grid in", beside the time, which counts to the read's bound total and freezes there. It never
   times the plan, and a time never shows without its label.

   The time is written straight to the text node from the clock, only when the tenths digit changes.
   React renders it once (the server's final value) and never again, so its writes and React's never
   fight over the node. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { COPY } from "../copy";
import { seconds } from "../lib/format";
import type { Schedule } from "./useRun";
import s from "./window.module.css";

export interface StopwatchProps {
  s: Schedule;
  t: MotionValue<number>;
  /** t ≥ R (a mark): the label is the stamp. */
  stamped: boolean;
  size?: "page" | "compact";
  className?: string;
}

export function Stopwatch({ s: sch, t, stamped, size = "page", className = "" }: StopwatchProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [initial] = useState(() => seconds(Math.min(t.get(), sch.R)));
  const shown = useRef(initial);

  const write = useCallback((v: number) => {
    const text = seconds(Math.min(v, sch.R));
    if (text === shown.current) return;
    shown.current = text;
    if (ref.current) ref.current.textContent = text;
  }, [sch.R]);
  useMotionValueEvent(t, "change", write);
  useEffect(() => { write(t.get()); }, [write, t]);

  const compact = size === "compact";
  return (
    <span data-stopwatch className={`${compact ? s.cWatch : s.watch} ${className}`}>
      <span className={s.watchLabel} data-stamped={stamped ? "1" : "0"}>{stamped ? sch.stamp : COPY.shared.reading}</span>{" "}
      <span ref={ref} className={`${compact ? s.cWatchTime : "mono-timer"} ${s.watchTime} num`} dir="ltr">{initial}</span>
    </span>
  );
}
