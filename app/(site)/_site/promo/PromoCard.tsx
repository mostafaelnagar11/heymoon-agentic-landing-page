"use client";
/* The card (SPEC §5.7): writer.com's floating promo, made honest. A lilac band with the eyebrow ("A
   sample run") and the headline, then the media: WP2's compact working window playing the sample run
   at the product's real pace, on a floor of the frame's own deep where the white pill floats. The pill
   takes the visitor to the field.

   A non-modal dialog (no focus trap, the page keeps scrolling), rendered only while open; the caller
   wraps it in AnimatePresence. It never decides when it opens or closes: every close goes through
   onClose with its reason, and Promo owns focus return and the session record. */
import {
  forwardRef, useEffect, useImperativeHandle, useRef, useState,
  type KeyboardEvent, type MouseEvent, type PointerEvent,
} from "react";
import { AnimatePresence, animate, useIsPresent, useMotionValue, type Variants } from "motion/react";
import * as m from "motion/react-m";
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { EASE } from "../tokens";
import { useIsoLayoutEffect } from "../lib/iso";
import { WorkingWindow } from "../window/WorkingWindow";
import s from "./promo.module.css";

export type CloseReason = "toggle" | "esc" | "outside" | "swipe" | "cta" | "hidden" | "external";

export interface PromoCardProps {
  audience: Audience;
  /** The caller's gate: open and not paused. The card adds its own +500 ms lead before the loop starts. */
  playing: boolean;
  reduced: boolean;
  /** A user-initiated open moves focus to the headline; an auto-open never moves focus. */
  focusOnOpen: boolean;
  /** Bumped on every open, so a reopen during the exit (the same element comes back) refocuses too. */
  openId?: number;
  surface: "night" | "paper";
  /** Phone: a swipe down of 64px or more on the card closes it. */
  swipe: boolean;
  onClose(reason: CloseReason): void;
  onCta(): void;
  /** Lab only: in flow, never fixed. */
  inline?: boolean;
}

export interface PromoCardHandle { el: HTMLDivElement | null }

/** §5.7 choreography: the loop starts 500 ms after the open. */
const LOOP_LEAD_MS = 500;
/** A swipe closes past this many px; below it the card springs back. */
const SWIPE_PX = 64;
/** Space kept clear above the card when a short viewport scales it down. */
const FIT_MARGIN = 12;

const headline = (a: Audience) => (a === "brands" ? COPY.brands.promo.headline(DEMO) : COPY.creators.promo.headline(DEMO));

/* ── the headline: crossfades on a switch; the first one rises in its mask ── */
function Headline({ text, rise }: { text: string; rise: boolean }) {
  const present = useIsPresent();
  return (
    <m.span
      className={s.headText}
      aria-hidden={present ? undefined : true}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE.out }}
    >
      <span className={s.mask}>
        <span className={`${s.maskIn} ${rise ? s.rise : ""}`}>{text}</span>
      </span>
    </m.span>
  );
}

/* ── the thumbnail: remounts on a switch; the new one fades in over the old ── */
function Thumb({ audience, playing }: { audience: Audience; playing: boolean }) {
  const present = useIsPresent();
  return (
    <m.div
      className={s.thumb}
      style={{ zIndex: present ? 1 : 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      /* The old one holds, fully drawn, under the new one's 200 ms fade, then goes (an exit to the value
         it already has would resolve at once and flash the deep floor through the fade). */
      exit={{ opacity: 0, transition: { delay: 0.2, duration: 0 } }}
      transition={{ duration: 0.2, ease: EASE.out }}
      aria-hidden
    >
      <WorkingWindow variant="compact" audience={audience} playing={playing && present} loop />
    </m.div>
  );
}

export const PromoCard = forwardRef<PromoCardHandle, PromoCardProps>(function PromoCard(
  { audience, playing, reduced, focusOnOpen, openId = 0, surface, swipe, onClose, onCta, inline = false },
  ref,
) {
  const dockRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  useImperativeHandle(ref, () => ({ get el() { return cardRef.current; } }), []);

  /* The headline that was there at the open rises; a switch later only crossfades. */
  const [firstAudience] = useState(audience);

  /* +500 ms: the loop starts. */
  const [lead, setLead] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLead(true), reduced ? 0 : LOOP_LEAD_MS);
    return () => window.clearTimeout(t);
  }, [reduced]);

  /* A user-initiated open: focus the headline, never scrolling. */
  useEffect(() => {
    if (focusOnOpen) headRef.current?.focus({ preventScroll: true });
  }, [focusOnOpen, openId]);

  /* Short viewports: scale the dock so the whole card fits between its bottom and the top edge. The
     card's layout height ignores transforms, so the open animation never feeds back into this. */
  useIsoLayoutEffect(() => {
    if (inline) return;
    const dock = dockRef.current, card = cardRef.current;
    if (!dock || !card) return;
    const fit = () => {
      const bottom = parseFloat(getComputedStyle(dock).bottom) || 0;
      const h = card.offsetHeight;
      const f = h > 0 ? Math.min(1, (window.innerHeight - bottom - FIT_MARGIN) / h) : 1;
      dock.style.setProperty("--fit", String(Math.max(0.5, Math.round(f * 1000) / 1000)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [inline]);

  /* Swipe down to close (phone). The pointer is captured only once it has moved, so a tap on the pill
     stays a click on the pill. Upward drags resist; a drag that moved swallows the click that follows. */
  const dragY = useMotionValue(0);
  const drag = useRef<{ id: number; y0: number; moved: boolean } | null>(null);
  const swallow = useRef(false);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!swipe || e.pointerType === "mouse" || !e.isPrimary) return;
    drag.current = { id: e.pointerId, y0: e.clientY, moved: false };
    swallow.current = false;
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dy) > 6) {
      d.moved = true;
      swallow.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (d.moved) dragY.set(dy > 0 ? dy : dy * 0.2);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (!d.moved) return;
    if (dragY.get() >= SWIPE_PX) onClose("swipe");
    else animate(dragY, 0, reduced ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.4 });
  };
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!swallow.current) return;
    swallow.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    onClose("esc");
  };

  /* Open: scale .92, y 12, blur 6 → rest over 420 ms outExpo, from the launcher's centre. Close: 240 ms
     exit to scale .96, y 8, opacity 0 (a swipe keeps going down from where the finger let go).
     Reduced motion: a 150 ms opacity fade both ways. Variant functions resolve when they run, so the
     exit reads the drag at that moment. */
  const variants: Variants = reduced
    ? { from: { opacity: 0 }, at: { opacity: 1, transition: { duration: 0.15 } }, gone: { opacity: 0, transition: { duration: 0.15 } } }
    : {
        from: { opacity: 0, scale: 0.92, y: 12, filter: "blur(6px)" },
        /* The filter is dropped once sharp, so the resting card keeps no filter layer. */
        at: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.42, ease: EASE.outExpo }, transitionEnd: { filter: "none" } },
        gone: () => ({
          opacity: 0, scale: 0.96, y: Math.max(8, dragY.get() + 24),
          transition: { duration: 0.24, ease: EASE.exit },
        }),
      };

  const a = COPY[audience].promo;

  return (
    <div ref={dockRef} className={`${s.dock} ${inline ? s.dockInline : ""}`}>
      <m.div
        ref={cardRef}
        id={inline ? undefined : "promo-card"}
        role="dialog"
        aria-modal="false"
        aria-labelledby={inline ? `promo-h-${audience}` : "promo-h"}
        data-lenis-prevent=""
        data-promo-card=""
        data-motion={reduced ? "reduced" : "full"}
        className={`${s.card} dawn-fade ${surface === "night" ? "shadow-promo-night" : "shadow-promo"}`}
        style={{ y: dragY }}
        variants={variants}
        initial="from"
        animate="at"
        exit="gone"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <div className={s.band}>
          <p className={`${s.eyebrow} mono-caps text-brand`}>{COPY.shared.sampleRun}</p>
          <h2
            ref={headRef}
            id={inline ? `promo-h-${audience}` : "promo-h"}
            tabIndex={-1}
            className={`${s.head} text-h3 text-ink`}
          >
            <AnimatePresence initial={false}>
              <Headline key={audience} text={headline(audience)} rise={audience === firstAudience} />
            </AnimatePresence>
          </h2>
        </div>

        <div className={s.media}>
          <div className={s.reveal}>
            <div className={s.stack}>
              <AnimatePresence initial={false}>
                <Thumb key={audience} audience={audience} playing={playing && lead} />
              </AnimatePresence>
            </div>
            <div className={s.scrim} aria-hidden />
          </div>
          <div className={s.ctaRow}>
            <span className={s.ctaRise}>
              <button type="button" className={s.cta} onClick={onCta}>{a.cta}</button>
            </span>
          </div>
        </div>
      </m.div>
    </div>
  );
});
