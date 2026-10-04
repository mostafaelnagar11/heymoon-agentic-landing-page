"use client";

/* Marks an element the first time a fifth of it is on screen.

   The landing's motion is all opacity and transform, driven by one
   attribute: `.reveal` and `.rule-draw` in globals.css read `data-in`
   and nothing else. The hook sets it once and disconnects, so scrolling
   back up never replays anything, and a user who has asked the system
   to stop moving things gets the finished state from the stylesheet's
   reduced-motion block without this hook knowing. */

import { useEffect, useRef, useState } from "react";

export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.setAttribute("data-in", ""); return; }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { el.setAttribute("data-in", ""); io.disconnect(); }
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/* The same trigger as a value rather than as an attribute, for the few
   places where the reveal has to run JavaScript: a figure that counts
   up cannot be expressed in a stylesheet. Fires once, then disconnects. */
export function useInView<T extends Element>(threshold = 0.4) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, seen]);
  return [ref, seen] as const;
}

/* Counts to a number once, easing out so it slows into place rather
   than stopping dead. Reduced motion gets the number, not the count. */
export function useCountUp(to: number, go: boolean, ms = 1100) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!go) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, go, ms]);
  return n;
}

/* ──────────────────────────────────────────────────────────────────
   The three above are the brands app's, byte for byte. The three
   below are this landing's: it has a nav pill that must come and go,
   and mocks that stream, and neither can be driven by a stylesheet.
   ────────────────────────────────────────────────────────────────── */

/* Whether the visitor has asked the system to stop moving things, kept
   current if they change it with the page open.

   False on the server and on the first client render, on purpose: both
   renders have to agree or hydration fails, and the server cannot know.
   So a reduced-motion visitor gets one frame of the moving state before
   this flips. That is fine for a schedule that has not started yet, and
   wrong for anything already painted differently on the server, which
   is why the typed hint in the field keeps its own check instead. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const sync = () => setReduced(mq.matches);
    sync();
    /* Safari before 14 has only the older listener pair. */
    if (mq.addEventListener) {
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }
    mq.addListener(sync);
    return () => mq.removeListener(sync);
  }, []);
  return reduced;
}

/* Whether an element is on screen right now, both ways. `useInView`
   fires once and forgets, which is right for a reveal and wrong for the
   nav's Start pill: that has to leave again when the field it stands in
   for scrolls back into view.

   It starts at `initial`, so the server and the first client render
   agree; for the pill that is "the field is visible", which is true on
   load and keeps the pill hidden until the observer says otherwise.
   `rootMargin` exists for the sticky header: a field sliding under the
   64px bar is covered, not visible, and '-64px 0px 0px 0px' says so.
   Without IntersectionObserver it stays at `initial`. */
export function useVisible<T extends Element>(
  threshold = 0,
  initial = true,
  rootMargin = "0px"
): readonly [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) setVisible(e.isIntersecting); },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  return [ref, visible] as const;
}

/* How many of a list of moments have passed since `run` last turned
   true. This is how a mock streams: `at` is the product's own pacing
   (costOf, scaled into the step), so rows land unevenly the way the
   real read does, not on a metronome.

   Each time `run` turns true the count goes back to 0 and the moments
   are scheduled afresh, so reopening a step replays it from the top.
   When `run` turns false the timers stop and the count holds where it
   was, so a panel fading out does not snap back to empty mid-fade.
   Under reduced motion nothing is scheduled and the answer is always
   the finished count: the mock shows its end state and stays there.

   The effect keys on `at.join(",")` rather than on `at`, because a
   caller that builds the array inline hands over a new one on every
   render, and that would restart the schedule each time. The moments
   are read back out of that key so the effect depends on nothing it
   does not name. */
export function useSchedule(run: boolean, at: readonly number[]): number {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const key = at.join(",");
  useEffect(() => {
    if (reduced || !run) return;
    setN(0);
    const moments = key === "" ? [] : key.split(",").map(Number);
    const timers = moments.map((ms) => window.setTimeout(() => setN((c) => c + 1), ms));
    return () => { for (const t of timers) window.clearTimeout(t); };
  }, [run, key, reduced]);
  return reduced ? at.length : n;
}
