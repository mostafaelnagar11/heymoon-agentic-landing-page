"use client";

/* The small shared pieces, in the Figma's language.
 *
 * Read off the file: a white card with the one 4px shadow, a gradient
 * pill for the single primary action on a screen, chips tinted at 10%
 * of their hue, tabs that underline in Main, and a sheet that rises
 * from the bottom on a phone and sits centred on a desktop. */

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

export function Card({ children, className = "", as: As = "div", edge, ...rest }: {
  children: ReactNode; className?: string; as?: "div" | "section" | "article";
  /** THE DASHBOARD SURFACE: the frosted card, at every width. Opt-in,
      because `shadow-card`'s 4px float IS the Figma's phone card and one
      call site passes its own border, which this must not override. */
  edge?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    /* `edge` is the dashboard's frosted card (Aurora, 11 Nov), the brands app's `.glass`, on a phone as on a desktop:
       the brand's dashboard has no white phone card, so neither does this one. */
    <As className={`${edge ? "glass" : "rounded-card bg-white shadow-card"} ${className}`} {...rest}>
      {children}
    </As>
  );
}

/** Section heading: 17px semibold at every width, the brand dashboard's
    section head (kit.tsx Section), so a heading reads the same in both
    apps. */
export function H({ children, className = "", aside, rule }: {
  children: ReactNode; className?: string; aside?: ReactNode;
  /** Closes the header line with a hairline above 768px, the way a
      desktop region announces itself. */
  rule?: boolean;
}) {
  return (
    /* The rule is gone on the dashboard's glass (Aurora, 11 Nov): a heading sits straight over its card. */
    <div className={`flex items-center justify-between gap-3 ${rule ? "md:pb-0.5" : ""} ${className}`}>
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{children}</h2>
      {aside}
    </div>
  );
}

/* ── Buttons ─────────────────────────────────────────────────────── */

export function Btn({
  children, variant = "primary", size = "md", className = "", full, dense, ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "quiet" | "ghost" | "danger";
  size?: "sm" | "md";
  /** Edge to edge, the way every CTA in the file is. */
  full?: boolean;
  /** Mouse-sized above 768px: 40px instead of 48px, 32px instead of 36.
      Opt-in, so /c and the phone sheets keep the file's CTA. */
  dense?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    /* The one primary: the dashboard's gradient pill (Aurora, 11 Nov), in the chat as on the dashboard; the quiet
       one is its white pill at every size, as the brand's is. */
    primary: "btn-pri disabled:opacity-40",
    quiet: "btn-soft text-ink disabled:text-ink-40",
    ghost: "text-ink-60 hover:bg-black/[0.04] disabled:text-ink-40",
    danger: "bg-danger/[0.08] text-danger hover:bg-danger/[0.12]",
  }[variant];
  const s = (size === "sm" ? "h-9 px-4 text-meta" : "h-11 px-5 text-body")
    + (dense ? (size === "sm" ? " md:h-8 md:px-3" : " md:h-10 md:px-4") : "");
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition disabled:cursor-not-allowed ${v} ${s} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Chips ───────────────────────────────────────────────────────── */

/** A tinted chip: Main at 10%, orange at 20%, green at 10%. A pill, the
    brand's Pill (ui.tsx), sized by its 11px line rather than a fixed
    height. */
export function Chip({ children, tone = "main", className = "", icon }: {
  children: ReactNode; tone?: "main" | "orange" | "green" | "danger" | "ink" | "white"; className?: string; icon?: ReactNode;
}) {
  const c = {
    main: "bg-main-10 text-main",
    orange: "bg-orange-20 text-orange",
    green: "bg-green-10 text-green",
    /* The design's Rejected. */
    danger: "bg-danger/10 text-danger",
    ink: "bg-black/[0.06] text-ink-60",
    white: "bg-white/10 text-white border border-white/10 backdrop-blur-[2px]",
  }[tone];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold leading-[14px] ${c} ${className}`}>
      {icon}{children}
    </span>
  );
}

/* ── Tabs ────────────────────────────────────────────────────────── */

/** The file's tabs: 16px, inactive at 50% black, active semibold Main
    with a 2px underline, each tab an equal column. */
export function Tabs<T extends string>({ tabs, value, onChange, className = "", dense }: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (t: T) => void;
  className?: string;
  /** THE DESKTOP REGISTER: a lilac segmented pill sized to its labels,
      instead of a full-width equal-flex phone screen-header. Three tabs
      spread across a 900px column is the single loudest tell that a
      screen was drawn for a phone. */
  dense?: boolean;
}) {
  return (
    <div className={`flex w-full ${dense ? "md:w-auto md:shrink-0 md:gap-1 md:rounded-pill md:bg-white/[0.72] md:p-1 md:shadow-glass md:backdrop-blur-[18px]" : ""} ${className}`} role="tablist">
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2.5 py-4 text-row transition ${
              dense ? "md:flex-none md:rounded-pill md:border-b-0 md:px-3.5 md:py-1.5 md:text-body" : ""
            } ${
              on
                ? `border-main font-semibold text-main ${dense ? "md:border-transparent md:bg-white md:text-ink md:shadow-lift" : ""}`
                : `border-line font-normal text-ink-50 hover:text-ink-90 ${dense ? "md:border-transparent md:hover:bg-white/60" : ""}`
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`${t.count === 0 ? "hidden md:grid" : "grid"} h-5 min-w-5 place-items-center rounded-pill px-1 text-tiny font-semibold ${on ? (dense ? "bg-blush-deep text-white" : "bg-main text-white") : "bg-black/[0.06] text-ink-60"}`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The small segmented control. Prepaid | Postpaid went with the
    fixed-fee campaign; this is the sort order on Your Campaigns now. */
export function Segmented<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string }[]; value: T; onChange: (t: T) => void;
}) {
  return (
    <div className="inline-flex rounded-pill bg-white/[0.72] p-1 shadow-glass backdrop-blur-[18px]">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          aria-pressed={o.key === value}
          className={`rounded-pill px-4 py-1.5 text-body font-semibold transition md:px-3 md:py-1 md:text-meta ${
            o.key === value ? "bg-white text-ink shadow-lift" : "text-ink-50 hover:text-ink-90"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Sheet ───────────────────────────────────────────────────────── */

/* Open sheets, newest last. A sheet can open over another one — the
   design's Choose social accounts rises over Submit content for review
   — and Escape closes only the one on top. */
const openSheets: (() => void)[] = [];

/** The bottom sheet, the brand's (ui.tsx Sheet): white, 28px radius, a
    grabber, rising from the bottom on a phone and centred on a desktop. */
export function Sheet({ open, onClose, title, children, labelledBy, wide }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; labelledBy?: string;
  /** 512px on a desktop instead of 448, for a form with a drop zone. */
  wide?: boolean;
}) {
  const close = useRef(onClose);
  close.current = onClose;
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const me = () => close.current();
    openSheets.push(me);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || openSheets[openSheets.length - 1] !== me) return;
      e.stopPropagation();
      me();
    };
    window.addEventListener("keydown", onKey);
    /* Into the dialog, unless something inside it already took focus
       (the sign-in sheet puts it on the phone field). */
    if (box.current && !box.current.contains(document.activeElement)) box.current.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      openSheets.splice(openSheets.indexOf(me), 1);
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#141229]/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`animate-fade-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-pop outline-none sm:rounded-[28px] ${wide ? "sm:max-w-lg" : "sm:max-w-md"}`}
      >
        <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-neutral-200 sm:hidden" />
        {title && (
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <p className="text-section font-semibold text-ink">{title}</p>
            <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-[12px] text-ink-50 transition hover:bg-black/[0.05] hover:text-ink">
              <X size={16} weight="bold" aria-hidden />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Odds ────────────────────────────────────────────────────────── */

export function Avatar({ src, name, size = 32, className = "" }: { src?: string; name: string; size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-lilac text-brand font-semibold text-main ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        name.split(" ").map((w) => w[0]).slice(0, 2).join("")
      )}
    </span>
  );
}

/** A pending value. The parts that have arrived stay readable. */
export function Skeleton({ w = "100%", h = 12, className = "" }: { w?: string | number; h?: number; className?: string }) {
  return <span aria-hidden className={`skeleton block ${className}`} style={{ width: w, height: h }} />;
}

/** A key/value row, 16px label and 14px value, hairline underneath — the
    file's Duration / Countries / Target Audience rows. */
export function KV({ k, v, last, dense }: {
  k: ReactNode; v: ReactNode; last?: boolean;
  /** Denser rows above 768px: 40px instead of 56px, and an alpha
      hairline that composites over a tint. */
  dense?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-4 ${dense ? "md:gap-3 md:py-2.5" : ""} ${last ? "" : `border-b border-line ${dense ? "md:border-hairline" : ""}`}`}>
      <span className={`text-row font-medium text-ink-90 ${dense ? "md:text-body" : ""}`}>{k}</span>
      <span className="text-end text-body font-medium text-ink-90">{v}</span>
    </div>
  );
}

/** The amber callout the file uses for an estimate ("$50/post") and for
    "Important". */
export function Callout({ title, children, icon }: { title: ReactNode; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-inner border border-amber-line bg-amber-soft px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-amber">{title}</p>
        {children && <p className="mt-0.5 text-meta leading-4 text-amber/80">{children}</p>}
      </div>
      {icon && <span className="shrink-0 text-amber">{icon}</span>}
    </div>
  );
}

/** A LABELLED FACT AT WIDTH.
 *
 * The whole shared vocabulary for what fills the space that opens up
 * beside a title once a layout stops being a phone column: an 11px
 * tracked term over a tabular value. Never a money figure on a campaign
 * that has not been joined, and never a figure this app has decided not
 * to show — no followers, no views, no reach.
 *
 * `even` keeps them on one line in equal parts, values level, for a
 * card too narrow for the wrap: a long term breaks inside its own part
 * rather than pushing the last fact onto a line of its own. */
export function Facts({ items, even, className = "" }: { items: { k: string; v: ReactNode }[]; even?: boolean; className?: string }) {
  return (
    <dl className={`${even ? "grid auto-cols-fr grid-flow-col items-end gap-x-3" : "flex flex-wrap items-baseline gap-x-6"} gap-y-2 ${className}`}>
      {items.map((f) => (
        <div key={f.k} className="min-w-0">
          <dt className="text-eyebrow font-semibold uppercase text-ink-50">{f.k}</dt>
          <dd className="num mt-0.5 text-body font-semibold text-ink">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A step that has been answered, folded to the line that says what was chosen: a frosted pill with a green tick, the
    brand app's DonePill in this app's tokens, so an answered card folds the same way in both. `lead` sits before the
    words, a logo or a thumbnail. */
export function DonePill({ children, lead }: { children: ReactNode; lead?: ReactNode }) {
  return (
    <div className="glass flex items-center gap-2.5 !rounded-full py-2 pe-4 ps-2">
      <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green text-white">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
      </span>
      {lead}
      <p className="min-w-0 text-meta font-medium text-ink-60">{children}</p>
    </div>
  );
}
