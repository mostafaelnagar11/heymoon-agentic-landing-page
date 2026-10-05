"use client";
/* Shared pieces of the WP8 mocks (SPEC §5.8). Props only: nothing here reads DEMO. Every piece is
   drawn inside a mock root that is aria-hidden, so none of it takes focus or speaks. */
import { useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Platform } from "../data/types";
import { useIsoLayoutEffect } from "../lib/iso";
import { InstagramLogo, TiktokLogo } from "../ui/icons";
import s from "./mocks.module.css";

/** v1's placement in an hm-media mount (§5.8). WP2's window mounts key on the `absolute` class to bring
    a root into flow, so the default placement keeps it. */
export const FRAME = "absolute inset-x-6 top-1/2 -translate-y-1/2 sm:inset-x-8";
/** Tall mocks: centred while they fit, pinned to the top with a short fade where they do not.
    The child carries `my-auto shrink-0`. */
export const FIT = `absolute inset-0 flex flex-col overflow-hidden px-6 py-6 sm:px-8 sm:py-8 ${s.fit}`;
/** Every mock surface: white, the mock shadow, a hairline (§5.8). */
export const CARD = "bg-white shadow-mock ring-1 ring-ink/[0.06]";

export type ChipTone = "good" | "brand" | "ink" | "line" | "danger" | "float";
const TONE: Record<ChipTone, string> = {
  good: "bg-good/10 text-good-deep",
  brand: "bg-brand/8 text-brand",
  ink: "bg-ink/[0.05] text-ink/72",
  line: "ring-1 ring-inset ring-ink/12 text-ink/72",
  danger: "bg-danger/8 text-danger",
  float: "bg-white text-good-deep shadow-[0_1px_2px_rgba(18,21,27,.08),0_0_0_1px_rgba(18,21,27,.05)]",
};

/** The product's small status chip: 20px tall, 11px semibold. `pill` is the round variant the plan
    card's "Guaranteed" pill uses (v1 `rounded-full`); every other chip is the 6px tag. */
export function Chip({ tone, icon, pill = false, children, className = "" }: {
  tone: ChipTone; icon?: ReactNode; pill?: boolean; children: ReactNode; className?: string;
}) {
  return (
    <span className={`inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold leading-none ${pill ? "rounded-full px-2" : "rounded-[6px] px-1.5"} ${TONE[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

/** A 1.5px tick, drawn rather than an icon so it sits on the chip's optical centre at 10px. */
export function Tick({ size = 10, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} className={`flex-none ${className}`} aria-hidden focusable="false">
      <path d="M2 5.2 4.1 7.3 8 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const IG = "linear-gradient(135deg, #F9CE34 0%, #EE2A7B 50%, #6228D7 100%)";

/** The platform mark, the only logos a creators mock carries (§6.5). */
export function PlatformSquare({ platform, size = 20 }: { platform: Platform; size?: number }) {
  const box: CSSProperties = { width: size, height: size, borderRadius: Math.round(size * 0.3) };
  const glyph = Math.round(size * 0.7);
  return platform === "Instagram" ? (
    <span className="grid shrink-0 place-items-center text-white" style={{ ...box, background: IG }}>
      <InstagramLogo size={glyph} weight="bold" aria-hidden />
    </span>
  ) : (
    <span className="grid shrink-0 place-items-center bg-ink text-white" style={box}>
      <TiktokLogo size={glyph} weight="fill" aria-hidden />
    </span>
  );
}

/** A brand's monogram: the product's BrandMark without a logo. The brands are fictional. */
export function BrandDot({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-ink font-semibold leading-none text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {name.charAt(0)}
    </span>
  );
}

/** A value and its skeleton bar in one cell: the reveal cross-fades and never moves the row. */
export function Swap({ on, align = "end", skeleton, children, className = "" }: {
  on: boolean; align?: "start" | "end"; skeleton?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <span className={`${s.swap} ${className}`} data-align={align}>
      <span data-on={on ? "0" : "1"} className="flex">{skeleton ?? <span className={s.skel} />}</span>
      <span data-on={on ? "1" : "0"} className="flex min-w-0">{children}</span>
    </span>
  );
}

/** Chevrons for the carousel's two round buttons (drawn, so no new icon ships). */
export function Chevron({ dir }: { dir: "start" | "end" }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden focusable="false" className={dir === "start" ? "rtl:-scale-x-100" : "-scale-x-100 rtl:scale-x-100"}>
      <path d="M7.5 2.5 4 6l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Inline style for every `.draw` stroke (MockCurve, Curve, RoasDial). globals.css draws with
    `stroke-dasharray: 1; stroke-dashoffset: 1`, which leaves a zero-length dash exactly on the path's
    end; a round cap turns it into a dot on 2x screens before the line draws. A "1 2" pattern puts a gap
    after the one dash, and while the stroke is undrawn the offset sits just past 1, so no dash touches
    either end. Drawn, the inline offset goes and the globals rule (0, with its 1.2s transition) takes
    over; reduced motion's `stroke-dashoffset: 0 !important` still beats both and shows the full line. */
export const drawStroke = (drawn: boolean): CSSProperties =>
  drawn ? { strokeDasharray: "1 2" } : { strokeDasharray: "1 2", strokeDashoffset: "1.02" };

/** useId() returns ":r1:"; strip the colons so it is safe inside url(#…). */
export const svgId = (id: string) => `mk${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

/** The element's rendered size in CSS px, so a chart can set its viewBox 1:1 and keep its strokes,
    dots and labels at true size at every width. `fallback` is the server (and first) render. Read in
    a layout effect, so the corrected viewBox is in place before the first client paint. */
export function useBox<T extends Element>(ref: RefObject<T>, fallback: [number, number]): [number, number] {
  const [box, setBox] = useState(fallback);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const w = Math.round(r.width * 2) / 2, h = Math.round(r.height * 2) / 2;
      setBox((b) => (b[0] === w && b[1] === h ? b : [w, h]));
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}
