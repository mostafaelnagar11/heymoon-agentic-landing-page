"use client";
/* The section shell (SPEC §5.0.10): <section data-slot data-surface aria-labelledby>, plus cv-auto
   when `cv` is set (never on the run stage or any sticky ancestor). With `cv` it records its rendered
   content-box height per slot and audience, and sets containIntrinsicSize on mount from that record
   (own audience, else the other audience's height for the same slot, else 900px), so a remount after
   a switch never makes scroll anchoring fight Lenis (§5.0.4 size hints). Callers pass the deferred
   audience. The first child must have a box (not display: contents): it is the skip-state probe. */
import { useEffect, useRef } from "react";
import type { SectionShellProps } from "../contracts";
import { other } from "../lib/audience";
import { useIsoLayoutEffect } from "../lib/iso";

const heights = new Map<string, number>();

export function Section({ slot, surface, audience, cv = false, className = "", labelledBy, children }: SectionShellProps) {
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!cv || !el) return;
    const h = heights.get(`${slot}:${audience}`) ?? heights.get(`${slot}:${other(audience)}`) ?? 900;
    el.style.containIntrinsicSize = `auto ${Math.round(h)}px`;
  }, [cv, slot, audience]);

  useEffect(() => {
    const el = ref.current;
    if (!cv || !el || typeof ResizeObserver === "undefined") return;
    const key = `${slot}:${audience}`;
    /* Record the CONTENT box: contain-intrinsic-size sizes the content box, so a border-box record
       would add the vertical padding on top (work: 216px) and the page would jump when the section
       renders again. A placeholder never counts. A skipped section (content-visibility: auto, away
       from the viewport) reports its last rendered size (the `auto` remembered size, a real one) or,
       if it never rendered, exactly the placeholder we set. So record when the section is rendered,
       or when its size differs from the placeholder. checkVisibility({contentVisibilityAuto}) on the
       first child gives the real skip state (Chrome renders up to 150% of a viewport away, yet skips a
       section sitting exactly on the bottom edge at load); without it, fall back to "near the viewport". */
    const rendered = () => {
      const probe = el.firstElementChild;
      if (probe && typeof probe.checkVisibility === "function") return probe.checkVisibility({ contentVisibilityAuto: true });
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.bottom > -window.innerHeight && r.top < 2 * window.innerHeight;
    };
    const record = (contentBox?: number) => {
      if (contentBox === undefined) {
        const cs = getComputedStyle(el);
        contentBox = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      }
      if (!(contentBox > 0)) return;
      const placeholder = parseFloat(el.style.containIntrinsicSize.replace("auto", "")) || 900;
      if (Math.abs(contentBox - placeholder) > 0.5 || rendered()) heights.set(key, contentBox);
    };
    /* A resize records the new size. The skip-state event records a section that starts rendering at
       exactly its placeholder size, where no resize fires. */
    const ro = new ResizeObserver(([e]) => record(e.contentBoxSize?.[0]?.blockSize ?? e.contentRect.height));
    const onState = () => record();
    ro.observe(el);
    el.addEventListener("contentvisibilityautostatechange", onState);
    return () => { ro.disconnect(); el.removeEventListener("contentvisibilityautostatechange", onState); };
  }, [cv, slot, audience]);

  return (
    <section
      ref={ref}
      data-slot={slot}
      data-surface={surface}
      aria-labelledby={labelledBy}
      className={`${cv ? "cv-auto " : ""}${className}`}
    >
      {children}
    </section>
  );
}
