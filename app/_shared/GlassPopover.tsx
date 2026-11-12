"use client";

/* A frosted card that opens from the control that asked for it, for both apps (12 Nov: "when I click on evidence,
   instead of expanding, show a glassy tooltip with the info in it").

   Evidence used to open inside the tile, pushing everything under it down the conversation. Now it floats over the
   thread beside its pill and leaves the layout where it was.

   It is drawn at the end of <body>, not inside the card: every card in the conversation is glass, and glass is a
   backdrop-filter, which makes the card the frame a `position: fixed` child is measured from and clipped by. So it is
   placed from the pill's own rectangle: centred under it, kept 12px inside the window, and above the pill when there
   is no room below. It follows the pill when anything scrolls.

   Escape, or a press anywhere outside it, closes it, and Escape returns focus to the pill. A press inside it stays
   inside: React carries events from a portal back through the component tree, and the tile under the pill opens the
   read panel on a click, so the popover stops its own clicks and keys from reaching it. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

const GAP = 8;
const EDGE = 12;

export function GlassPopover({ anchor, open, onClose, label, width = 360, children }: {
  /** The control it opens from. */
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  /** Its name for a screen reader. */
  label: string;
  width?: number;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; w: number; above: boolean } | null>(null);

  const place = useCallback(() => {
    const a = anchor.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const w = Math.min(width, window.innerWidth - EDGE * 2);
    const h = box.current?.offsetHeight ?? 0;
    const left = Math.min(Math.max(EDGE, r.left + r.width / 2 - w / 2), window.innerWidth - w - EDGE);
    const below = r.bottom + GAP;
    const above = h > 0 && below + h > window.innerHeight - EDGE && r.top - GAP - h > EDGE;
    setPos({ top: above ? r.top - GAP - h : below, left, w, above });
  }, [anchor, width]);

  /* Placed before it paints, then again once its own height is known. */
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    place();
    const id = requestAnimationFrame(place);
    return () => cancelAnimationFrame(id);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (box.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
      anchor.current?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, onClose, place, anchor]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: pos?.w ?? width }}
      className={`glass glass-pop fixed z-[90] max-h-[min(420px,70vh)] overflow-y-auto !rounded-[18px] p-3.5 shadow-[0_28px_60px_-24px_rgba(40,20,90,0.45)] ${pos?.above ? "origin-bottom" : "origin-top"}`}
    >
      {children}
    </div>,
    document.body,
  );
}
