"use client";
/* The site's client root (SPEC §5.0.1): MotionConfig, LazyMotion (domAnimation, strict), the root
   Lenis instance driven from motion's frame loop (one rAF for Lenis, motion, the sky and the clocks),
   and the keyboard watcher. Components use `import * as m from "motion/react-m"`; hooks come from
   "motion/react". Every useLenis(cb) callback must be stable. Imperative animate(mv, …) ignores
   MotionConfig, so pass the reduced transition yourself. */
import { useEffect, type ReactNode } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import type { LenisOptions } from "lenis";
import { LazyMotion, MotionConfig, domAnimation, frame, cancelFrame } from "motion/react";
import { setLenis } from "./scroll";
import { setSignal } from "./signals";

const LENIS_OPTIONS = {                         // module constant: ReactLenis rebuilds when the JSON changes
  autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false,
  anchors: false,                               // its handler never preventDefaults, and element targets double-count scroll-padding (§4.3 scroll.ts)
  stopInertiaOnNavigate: true,                  // respectReducedMotion defaults to true
} satisfies LenisOptions;

function LenisFrameDriver() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    setLenis(lenis);
    const tick = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp);
    frame.update(tick, true);                     // one rAF for Lenis, motion, the sky and the clocks
    return () => { cancelFrame(tick); setLenis(null); };
  }, [lenis]);
  return null;
}

/** visualViewport → setSignal("keyboardOpen"): the on-screen keyboard takes over a quarter of the screen. */
function KeyboardWatcher() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const check = () => setSignal("keyboardOpen", vv.height < 0.75 * window.innerHeight);
    check();
    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <ReactLenis root options={LENIS_OPTIONS} />
        <LenisFrameDriver />
        <KeyboardWatcher />{/* visualViewport → setSignal("keyboardOpen") */}
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
