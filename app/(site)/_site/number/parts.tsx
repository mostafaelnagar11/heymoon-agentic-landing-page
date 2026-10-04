"use client";
/* WP4-internal parts shared by the four rows of the number section (§5.4): the entry rule (2.4.7) as
   React state, a one-shot stepper, the rule-and-signature pledge, the row grid, and a splitter that
   puts bound numbers inside an approved sentence into .num spans without retyping the sentence. */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { COPY } from "../copy";
import { useReducedMotionPref } from "../lib/prefs";
import s from "./number.module.css";

/** "final": the server state, and what stays when the element was in view (or above) at mount, under
    reduced motion, or with no IntersectionObserver. "armed": below the viewport at mount, held at the
    start state while unseen. "in": it entered once; play. Never goes back to "armed". */
export type Entry = "final" | "armed" | "in";

export function useEntry(ref: RefObject<Element>, o: { threshold?: number; rootMargin?: string } = {}): Entry {
  const threshold = o.threshold ?? 0.5;
  const rootMargin = o.rootMargin ?? "0px";
  const reduced = useReducedMotionPref();
  const [entry, setEntry] = useState<Entry>("final");

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") { setEntry("final"); return; }
    if (el.getBoundingClientRect().top <= window.innerHeight) return;   // in view (or above) at mount: stay as is
    setEntry("armed");
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || e.intersectionRatio < threshold) return;
      setEntry("in");
      io.disconnect();
    }, { threshold: [0, threshold], rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, reduced, threshold, rootMargin]);

  return entry;
}

/** A one-shot count from 0 to `total` once `entry` is "in": the first step after `firstMs`, then one
    every `everyMs`. "final" holds `total`, "armed" holds 0. Timers, not frames: it is under 1.3 s and
    never loops, so the global pause does not apply (§5.9: count-ups and draws are "n/a" when paused). */
export function useStepper(entry: Entry, total: number, everyMs: number, firstMs = everyMs): number {
  const [n, setN] = useState(total);
  useEffect(() => {
    if (entry === "final") { setN(total); return; }
    if (entry === "armed") { setN(0); return; }
    const timers = Array.from({ length: total }, (_, k) =>
      window.setTimeout(() => setN(k + 1), firstMs + k * everyMs));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [entry, total, everyMs, firstMs]);
  return n;
}

/** Wraps each bound value found in `text` in a .num span (rule 2.4.4). The sentence itself comes
    from copy.ts untouched; only the bound substrings are isolated. */
export function withNums(text: string, values: string[]): ReactNode {
  const hits = values.filter(Boolean).sort((a, b) => b.length - a.length);
  if (hits.length === 0) return text;
  const re = new RegExp(`(${hits.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return text.split(re).map((part, i) =>
    hits.includes(part) ? <span key={i} className="num">{part}</span> : part);
}

/** The 2px gradient rule (spend 2 of 3, §2.4.2) and the signature under it. The rule grows from the
    start edge once, 600 ms --ease-out, when it is 10% into the viewport. */
export function Pledge() {
  const ref = useRef<HTMLSpanElement>(null);
  const entry = useEntry(ref, { threshold: 1, rootMargin: "0px 0px -10% 0px" });
  return (
    <div className="mt-9">
      <span ref={ref} aria-hidden data-entry={entry} className={`${s.rule} grad-rule block h-[2px] w-[200px] rounded-full`} />
      <p className="mt-3 text-micro text-ink/60">{COPY.shared.signature}</p>
    </div>
  );
}

/** The row grid: copy in cols 1 to 5, the figure in cols 7 to 12. Stacked below 768. */
export const ROW = `${s.row} grid grid-cols-1 md:grid-cols-12 md:gap-x-6 lg:gap-x-8`;
export const COPY_COL = "md:col-span-5 md:col-start-1";
export const FIGURE_COL = `${s.figureCol} min-w-0 md:col-span-6 md:col-start-7`;
