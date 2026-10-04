"use client";
/* The arming rule behind WordReveal and Reveal (rule 2.4.7): at mount, an element below the viewport
   is reset to its start state while unseen, then plays once on entry; an element in view at mount is
   left final. Attributes are written straight to the node, so the server HTML stays final. */
import { useEffect, type RefObject } from "react";

export function useArmed(ref: RefObject<HTMLElement>, threshold: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top <= window.innerHeight) return;   // in view (or above): stay final
    el.setAttribute("data-armed", "");
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || e.intersectionRatio < threshold) return;
      el.setAttribute("data-in", "");
      io.disconnect();
    }, { threshold: [0, threshold] });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
}
