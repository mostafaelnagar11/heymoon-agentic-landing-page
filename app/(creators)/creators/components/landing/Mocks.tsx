"use client";

/* The product, drawn small, for a creator.
 *
 * The brands landing's rule, kept: a card that holds a list of labels
 * and values is a page describing itself, so every card and every step
 * on this page holds a picture of the product instead. Each one here is
 * a likeness of a real surface in this app: the read as it streams, the
 * match block on a campaign, the dashboard's campaign rows, the
 * conversation's carousel, the join sheet and the pre-upload check. It
 * uses the product's own components wherever one exists, so a campaign
 * card on the landing and a campaign card in the product are the same
 * card.
 *
 * FOUR RULES EVERY MOCK KEEPS.
 *
 * Props only. Nothing here imports a fixture, a tool, the store or a
 * model function. The page builds every value once from the demo read
 * and hands it in, so this file cannot show a person by accident: what
 * it draws is exactly what the page chose to pass. The same goes for the
 * landing's own sentences: a line a mock draws that no product screen
 * prints comes in from COPY, so the English written here is only chrome:
 * the product's labels, and the Start on the field's own likeness.
 *
 * Decorative, and inert. Every mock root is aria-hidden, because the
 * sentence beside it carries the meaning, so nothing inside may take
 * focus: a button inside an aria-hidden subtree is a tab stop nobody can
 * see. That is why the Join Campaign pill and the carousel's arrows are
 * spans, and why the carousel rail is drawn here rather than reused (the
 * product's takes tabIndex so it can be scrolled by keyboard). The two
 * instruments are the exception, because their numbers are said nowhere
 * else on the page: ShareScale is an image with a full label, and
 * MoneyPanel's words are plain text.
 *
 * The product's labels, verbatim. "Join Campaign", "Pre-upload Check"
 * and "Request to join" are how the product sets them, and a likeness
 * that renamed its buttons would be a drawing of some other product. The
 * landing's own copy around them is sentence case.
 *
 * Inside its media area at every width from 360 to 1440. The frames
 * below are how.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUpRight, CaretLeft, CaretRight, Check, CheckCircle, Lock, Sparkle, VideoCamera, X,
} from "@phosphor-icons/react";
import type { Offer, Platform } from "../../lib/agent/types";
import { BrandMark, CampaignCard, MatchChip, PayoutChip, Soc } from "../figma";
import { Chip, Skeleton } from "../ui";
import { Flag } from "../Flag";
import { useInView, useSchedule } from "../../lib/useReveal";

/* ------------------------------------------------------------------ */
/* Where a mock sits in its media area                                 */
/* ------------------------------------------------------------------ */

/* FRAME centres a short object, as on brands, so the tint reads as a
   mount around it. Centring only works for something that fits and
   does not change height while you watch it. */
const FRAME = "absolute inset-x-6 top-1/2 -translate-y-1/2 sm:inset-x-8";

/* WIDE is FRAME with more room at the sides, for the two card mocks
   whose rows carry a name and two chips. At 1024 three cards share the
   row and a media area is 283px wide: FRAME's 32px insets left a brand
   name in a campaign row no room at all, and a two-line signal label
   pushed the match block past its budget. The inset tightens at lg and
   relaxes at xl, once the cards have stopped growing. */
const WIDE = "absolute inset-x-4 top-1/2 -translate-y-1/2 lg:inset-x-3 xl:inset-x-4";

/* FRAME_TOP pins a tall object to the top, so its header always shows,
   and runs its rows off the fading bottom edge (.hm-crop). The insets
   are padding on a box the size of the media area, not insets on the
   box itself. The mask and the overflow both clip at the box's own
   edge, so a box exactly as wide as the panel cut off the panel's ring
   and shadow on three sides. The geometry and the fade are the same;
   nothing is lost off the edges. */
const FRAME_TOP = "absolute inset-0 overflow-hidden hm-crop px-6 pt-6 sm:px-8 sm:pt-8";

/* FRAME_FIT is for the check: centred where it fits, pinned where it
   does not. Auto margins centre a flex child only while there is space
   to share; once the child is taller than the box they resolve to zero
   and it starts at the top padding instead. So from sm up the check
   sits centred like any other mock, and on a narrow phone, where every
   fix wraps to two lines, its header stays put and the last row's
   padding runs into a short fade. The padding is 16px on a phone so the
   last fix still clears the edge there, and the fade is 16px, no deeper
   than the padding, so on a panel that fits it only lands on tint. */
const FRAME_FIT = "absolute inset-0 flex flex-col overflow-hidden px-6 py-4 sm:p-8";
const FIT_FADE = {
  WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 16px), transparent)",
  maskImage: "linear-gradient(to bottom, #000 calc(100% - 16px), transparent)",
} as const;

/* Every mock's surface: white, the brands mock shadow, a hairline. */
const PANEL = "bg-white shadow-hm-mock ring-1 ring-ink/[0.06]";

/* A layout effect that stays quiet on the server. The read measures a
   row before the browser paints it, so a landed row never flashes in
   the wrong place for a frame. */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* ------------------------------------------------------------------ */
/* Shapes the page fills                                               */
/* ------------------------------------------------------------------ */

export interface MockSignal { label: string; detail: string; strong: boolean }

export type MockReadValue =
  | { kind: "text"; text: string; muted?: string }
  | { kind: "accounts"; accounts: { platform: Platform; handle: string }[] }
  | { kind: "markets"; markets: { code: string; name: string; share: number }[] }
  | { kind: "quote"; text: string };

export interface MockReadRow { key: string; label: string; agent: string; note: string; value: MockReadValue | null }

export interface MockCheckRow { label: string; clean: boolean; line?: string; fix?: string }

/* ------------------------------------------------------------------ */
/* The three cards                                                     */
/* ------------------------------------------------------------------ */

/** The field, as a creator first meets it: a handle typed, a cursor,
    and the two places a handle can come from. */
export function MockField({ handle, platforms }: { handle: string; platforms: Platform[] }): JSX.Element {
  return (
    <div aria-hidden className={FRAME}>
      <div className={`rounded-[18px] p-5 ${PANEL}`}>
        <p dir="ltr" className="flex items-center text-[19px] tracking-[-0.01em] text-ink">
          <span className="num">{handle}</span>
          {/* Static, as on brands: a blinking cursor in a still picture
              of a screen is motion with nothing behind it. */}
          <span className="ms-0.5 inline-block h-[22px] w-px bg-main" />
        </p>
        <div className="mt-6 flex items-center justify-between">
          {/* The platform squares where brands has a grey dot. They are
              the product's own marks, and they say which handles work. */}
          <span className="flex gap-1.5">
            {platforms.map((p) => <Soc key={p} platform={p} size={20} />)}
          </span>
          <span className="rounded-[9px] bg-ink px-3.5 py-2 text-[12px] font-semibold text-white">Start</span>
        </div>
      </div>
    </div>
  );
}

/** A campaign's "Why HeyMoon matched you" block, on white so it lifts
    off the tint. The four signals matching actually weighs, and no
    score and no audience count, because the product shows neither.

    Its budget is 200px at every width from 1024, which leaves the tint
    a margin above and below. Details clamp at two lines; a row is never
    dropped to make room. */
export function MockWhy({ level, signals }: { level: string; signals: MockSignal[] }): JSX.Element {
  return (
    <div aria-hidden className={WIDE}>
      <div className={`rounded-[16px] p-3 ${PANEL}`}>
        <p className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold leading-4 text-main">
          Why HeyMoon matched you
          <span className="text-ink/50">{level}</span>
        </p>
        <ul className="mt-2.5 space-y-2">
          {signals.map((s) => (
            <li key={s.label} className="flex items-start gap-2">
              {s.strong
                ? <CheckCircle size={14} weight="fill" className="mt-px shrink-0 text-green" />
                : <ArrowUpRight size={14} weight="bold" className="mt-px shrink-0 text-ink/50" />}
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] font-semibold leading-[15px] text-ink">{s.label}</span>
                {/* No `block` beside the clamp: both set display, and
                    `block` is generated later and would win, which turns
                    the clamp off. */}
                <span className="line-clamp-2 text-[11px] leading-[15px] text-ink/60">{s.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The dashboard's campaign rows, cut down to the three you join and
    one you ask for. Each row ends the way the product's does: the green
    Pre-qualified chip, or the grey "Request to join". There is no Join
    button on a list row in the product, so there is none here.

    The brand name is the part that gives way when a row is tight; the
    share and the chip never do. The foot line is the landing's own
    sentence, not the product's, so it comes in with the count. */
export function MockTiers({ picks, next, rest, restLine }: {
  picks: Offer[]; next: Offer | null; rest: number; restLine: (n: number) => string;
}): JSX.Element {
  return (
    <div aria-hidden className={WIDE}>
      <div className={`rounded-[16px] p-2.5 ${PANEL}`}>
        <ul className="divide-y divide-ink/[0.06]">
          {picks.map((o) => (
            <li key={o.id} className="flex items-center gap-1 py-1.5">
              <BrandMark name={o.brand} logo={o.brandLogo} size={20} className="min-w-0 flex-1" />
              <PayoutChip offer={o} />
              <MatchChip offer={o} />
            </li>
          ))}
          {/* Behind the three, the way brands dims the phases behind the
              one that is funded: present, and not the point. */}
          {next && (
            <li className="flex items-center gap-1 py-1.5 opacity-[0.45]">
              <BrandMark name={next.brand} logo={next.brandLogo} size={20} className="min-w-0 flex-1" />
              <PayoutChip offer={next} />
              <Chip tone="ink">Request to join</Chip>
            </li>
          )}
        </ul>
        {rest > 0 && (
          <p className="mt-1.5 border-t border-ink/[0.06] pt-2 text-[11px] leading-4 text-ink/45">
            {restLine(rest)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The four steps                                                      */
/* ------------------------------------------------------------------ */

/* How far above the bottom of the read the row being worked on stays.
   The fade is the last 56px, so this keeps the working row whole and
   16px clear of it. */
const ROOM = 72;

/** The read while it works: ReadBlock's live state in its narrow,
    stacked layout, which is what the product renders under 32rem.

    A row per thing being read, the agent reading it beside it, waiting
    then working then landed, and the header counting. It stops at five
    of nine with Performance working, because that is a true state of
    the real read and the next thing that row would say is a number this
    page never shows.

    The rows outgrow the panel by the fourth, so the list scrolls itself:
    it moves up just far enough to keep the working row above the fade.
    The distance is measured, not assumed, because a landed row is taller
    than a waiting one and a wrapped value is taller still. */
export function MockRead({ sub, total, rows, at, active }: {
  sub: string; total: number; rows: MockReadRow[]; at: readonly number[]; active: boolean;
}): JSX.Element {
  const [box, seen] = useInView<HTMLDivElement>(0.35);
  const n = useSchedule(active && seen, at);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDListElement>(null);
  const [shift, setShift] = useState(0);
  const focus = Math.min(n, rows.length - 1);

  useIsoLayoutEffect(() => {
    const w = wrap.current;
    const l = list.current;
    if (!w || !l) return;
    const measure = () => {
      /* The list is positioned, so each row's offsetTop is from the top
         of the list, and the transform on it does not change the sum. */
      const row = l.children[focus] as HTMLElement | undefined;
      setShift(row ? Math.max(0, Math.round(row.offsetTop + row.offsetHeight - (w.clientHeight - ROOM))) : 0);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(w);
    ro.observe(l);
    return () => ro.disconnect();
  }, [focus]);

  return (
    <div ref={box} aria-hidden className={FRAME_TOP}>
      <div className={`flex h-full flex-col overflow-hidden rounded-[18px] ${PANEL}`}>
        <div className="flex shrink-0 items-center gap-2.5 border-b border-ink/[0.06] px-4 py-3">
          <span className="working-ring h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-5 text-ink">Reading your profile</p>
            <p className="truncate text-[11px] leading-4 text-ink/50">{sub}</p>
          </div>
          <span className="num shrink-0 text-[12px] font-semibold text-main">{`${n}/${total}`}</span>
        </div>

        {/* The window the list scrolls in. It fills what the header
            leaves, so its height is the panel's and not the list's. */}
        <div ref={wrap} className="relative min-h-0 flex-1 overflow-hidden">
          <dl
            ref={list}
            style={{ transform: `translateY(${-shift}px)` }}
            className="relative divide-y divide-ink/[0.06] transition-transform duration-500 motion-reduce:transition-none"
          >
            {rows.map((r, i) => {
              const state = i < n ? "done" : i === n ? "working" : "waiting";
              return (
                <div key={r.key} className={`px-4 py-2.5 transition-colors ${state === "working" ? "bg-lilac/50" : ""}`}>
                  <dt className="flex items-center justify-between gap-2 text-[11px] font-semibold leading-4 text-ink/50">
                    {r.label}
                    <span className={`inline-flex shrink-0 items-center gap-1 ${
                      state === "working" ? "text-main" : state === "done" ? "text-ink/50" : "text-ink/40"
                    }`}>
                      {state === "done" && <Check size={11} weight="bold" className="text-green" />}
                      {r.agent}
                    </span>
                  </dt>
                  <dd className="mt-1">
                    {state === "done" ? <Landed value={r.value} />
                      : state === "working" ? (
                        <span className="flex items-center gap-2 text-[12px] leading-5 text-ink/60">
                          <span className="working-ring h-3 w-3 shrink-0" />{`${r.note}…`}
                        </span>
                      ) : <span className="block text-[12px] leading-5 text-ink/40">Waiting</span>}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}

/** A landed value, in the short form the live read uses. A row with no
    value draws nothing, which is how a layer that is read and never
    shown stays that way even if its moment ever comes. */
function Landed({ value }: { value: MockReadValue | null }) {
  if (!value) return null;
  switch (value.kind) {
    case "text":
      return (
        <span className="block text-[13px] leading-5 text-ink">
          {value.text}
          {value.muted && <span className="text-ink/50">{` · ${value.muted}`}</span>}
        </span>
      );
    case "accounts": {
      /* One line: the squares side by side, then the handle once. Two
         rows of the same handle said nothing the squares do not. */
      const handles = Array.from(new Set(value.accounts.map((a) => a.handle)));
      return (
        <span className="flex items-center gap-2 text-[13px] leading-5">
          <span className="flex shrink-0 gap-1">
            {value.accounts.map((a) => <Soc key={a.platform} platform={a.platform} size={16} />)}
          </span>
          <span dir="ltr" className="min-w-0 truncate font-medium text-ink">{handles.join(" · ")}</span>
        </span>
      );
    }
    case "markets":
      return (
        <span className="flex flex-col gap-0.5">
          {value.markets.map((m) => (
            <span key={m.code} className="flex items-baseline gap-2 text-[13px] leading-5">
              <Flag code={m.code} size={16} className="translate-y-[2px]" />
              <span className="min-w-0 flex-1 truncate text-ink">{m.name}</span>
              <span className="num shrink-0 text-ink/50">{`${m.share}%`}</span>
            </span>
          ))}
        </span>
      );
    case "quote":
      return <span className="block text-[12px] italic leading-5 text-ink/50">{`“${value.text}”`}</span>;
  }
}

/** The thread's carousel as the matches arrive: the real CampaignCards,
    with the early-bird bar, the Pre-qualified badge and the share on
    them, and the second card cut by the panel's own edge the way a rail
    that scrolls continues.

    FRAME here has no overflow-hidden on purpose, so the cut is the
    panel's edge and not the frame's. Cards that have not arrived keep
    their place and are only transparent, so the header never moves. */
export function MockPicks({ title, offers, active }: { title: string; offers: Offer[]; active: boolean }): JSX.Element {
  const [box, seen] = useInView<HTMLDivElement>(0.35);
  /* 80, 220 and 360ms for three: close enough to read as one arrival,
     far enough apart to read as three. */
  const k = useSchedule(active && seen, offers.map((_, i) => 80 + i * 140));
  return (
    <div ref={box} aria-hidden className={FRAME}>
      <div className="mb-2 flex items-center gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[14px] font-semibold leading-5 text-ink">
          <Sparkle size={14} weight="fill" aria-hidden className="shrink-0 text-main" />{title}
        </p>
        <span className="ms-auto flex shrink-0 gap-1">
          <span className="grid h-7 w-7 place-items-center rounded-pill bg-lilac text-main opacity-30">
            <CaretLeft size={12} weight="bold" />
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-pill bg-lilac text-main">
            <CaretRight size={12} weight="bold" />
          </span>
        </span>
      </div>
      <div className="flex gap-3">
        {offers.map((o, i) => (
          <div
            key={o.id}
            className={`flex w-[252px] shrink-0 rounded-[16px] shadow-hm-mock transition-[opacity,transform] duration-500 motion-reduce:transition-none sm:w-[290px] ${
              i < k ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0 rtl:-translate-x-3"
            }`}
          >
            {/* No onOpen, so the product renders it as a div, not a
                button. */}
            <CampaignCard offer={o} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Joining: AcceptBlock, cut at the button. The share as the figure,
    then what you agree to and what you do not, in the same weight,
    which is the whole point of the product's version.

    No money figure: the share is the terms. Its budget is the last
    not-commit ending above the fade from sm up, which it does with
    about 10px to spare. The Join Campaign pill below it runs into the
    fade at every width, at about half strength from sm up, which reads
    as the sheet continuing. Below sm the fade reaches the list too: the
    last not-commit sits in it at every phone width, and at 360px, where
    the bundle line and the third not-commit wrap, the fourth is past
    the bottom of the media. Recovering it means setting a phone's
    sheet denser than the brands mocks, which is a choice this file does
    not make on its own. */
export function MockTerms({ brand, needsApproval, commissionPct, commits, notCommits }: {
  brand: string; needsApproval: boolean; commissionPct: number; commits: string[]; notCommits: string[];
}): JSX.Element {
  return (
    <div aria-hidden className={FRAME_TOP}>
      <div className={`overflow-hidden rounded-[16px] ${PANEL}`}>
        <div className="border-b border-ink/[0.06] px-4 py-2.5">
          <p className="text-[13px] font-semibold leading-5 text-ink">{`Join ${brand}`}</p>
          <p className="text-[11px] leading-4 text-ink/50">
            {needsApproval
              ? "A request to join. Nothing is agreed until the brand answers."
              : "You're Pre-qualified. Pressing it joins you."}
          </p>
        </div>
        <div className="p-3.5">
          {/* The product's own terms figure, text-display, as on AcceptBlock. */}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="num text-display font-semibold text-ink">{`${commissionPct}%`}</span>
            <span className="text-[12px] text-ink/50">of every order you bring in</span>
          </div>
          <p className="mt-3 text-[11px] font-semibold leading-4 text-main">You&apos;re agreeing to</p>
          <ul className="mt-1.5 space-y-1">
            {commits.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[12px] leading-5 text-ink/60">
                <Check size={13} weight="bold" className="mt-[3px] shrink-0 text-ink/50" />{c}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] font-semibold leading-4 text-main">You&apos;re not</p>
          <ul className="mt-1.5 space-y-1">
            {notCommits.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[12px] leading-5 text-ink/60">
                <Lock size={13} weight="bold" className="mt-[3px] shrink-0 text-green" />{c}
              </li>
            ))}
          </ul>
          {/* The product's primary is the purple g-button pill, so the
              likeness is too. The landing's own buttons stay ink. */}
          <span className="g-button mt-4 flex h-10 w-full items-center justify-center rounded-pill text-[13px] font-semibold text-white">
            {needsApproval ? "Send request" : "Join Campaign"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** The pre-upload check as it streams: DraftCheckBlock, with a tile in
    place of the draft's image, which belongs to another creator.

    The panel has its final height from the first frame. Every row is
    laid out from the start and the ones still to come are invisible, the
    skeleton is drawn over the first of those rather than added below the
    list, and the ring becomes the chip in the same slot. So a centred
    panel never re-centres, and the header does not climb the frame as
    the rows land. */
export function MockCheck({ product, brand, dueIn, rows, misses, at, active }: {
  product: string; brand: string; dueIn: string; rows: MockCheckRow[]; misses: number; at: readonly number[]; active: boolean;
}): JSX.Element {
  const [box, seen] = useInView<HTMLDivElement>(0.35);
  const n = useSchedule(active && seen, at);
  /* One moment per row, then one more for the verdict. */
  const done = n > rows.length;
  return (
    <div ref={box} aria-hidden className={FRAME_FIT} style={FIT_FADE}>
      <div className={`my-auto shrink-0 overflow-hidden rounded-[16px] ${PANEL}`}>
        <div className="flex items-center gap-3 border-b border-ink/[0.06] px-4 py-2.5 sm:py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-lilac text-main">
            <VideoCamera size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-5 text-ink">Pre-upload Check</p>
            <p className="truncate text-[11px] leading-4 text-ink/50">{`${product} · ${brand} · due in ${dueIn}`}</p>
          </div>
          {done
            ? misses > 0 ? <Chip tone="orange">{`${misses} to fix`}</Chip> : <Chip tone="green">Clean</Chip>
            : <span className="working-ring h-4 w-4 shrink-0" />}
        </div>
        <ul>
          {rows.map((r, i) => {
            const landed = i < n;
            const next = i === n;
            return (
              <li
                key={r.label}
                /* The rule between rows is drawn only once the row below
                   it has arrived, so the space the rest are holding reads
                   as blank panel rather than as empty rows. */
                className={`relative ${i > 0 ? `border-t ${landed || next ? "border-ink/[0.06]" : "border-transparent"}` : ""}`}
              >
                <div className={`flex items-start gap-3 px-4 py-2 sm:py-2.5 ${landed ? "" : "invisible"}`}>
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border ${
                    r.clean ? "border-main bg-main text-white" : "border-danger/40 bg-danger/10 text-danger"
                  }`}>
                    {r.clean ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-5 text-ink">{r.label}</span>
                    {r.line && <span className="mt-0.5 block text-[11px] leading-4 text-ink/60">{r.line}</span>}
                    {r.fix && (
                      <span className="mt-1.5 block rounded-[8px] bg-lilac px-2.5 py-1.5 text-[11px] leading-4 text-ink/60">
                        <span className="font-semibold text-main">Fix: </span>{r.fix}
                      </span>
                    )}
                  </span>
                </div>
                {next && (
                  <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 py-2 sm:py-2.5">
                    <span className="working-ring h-4 w-4 shrink-0" />
                    <Skeleton w="54%" h={11} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The two instruments                                                 */
/* ------------------------------------------------------------------ */

/* Each node lights a beat after the line reaches it, not all at once
   the moment the line starts. The line takes 1.2s; the last node lands
   with it. */
const NODE_DELAY = [150, 450, 800, 1200];
const DOT = "linear-gradient(140deg,#4D2FB0,#7C5CE0 55%,#F0559D)";

/** The paid section's dark panel: when, as the figure, and the path the
    money takes as a rail underneath.

    The rail is a diagram of the flow the product describes, not a
    product screen, and its node names are the product's own words. It
    sits where brands has its curve and draws the same way, once, off
    the panel's own observer.

    The nodes are spaced by their centres. The end nodes sit flush with
    the rail's ends, so their centres are 11px in; the middle ones are
    placed on the same even spacing between those two points rather than
    at a bare 33% and 67%, which would sit them a few pixels off. Every
    position is logical (start and end), so the rail mirrors in RTL. */
export function MoneyPanel({ label, figure, note, steps }: {
  label: string; figure: string; note: string; steps: string[];
}): JSX.Element {
  const [box, seen] = useInView<HTMLDivElement>(0.35);
  const last = steps.length - 1;
  return (
    <div
      ref={box}
      {...(seen ? { "data-drawn": "" } : {})}
      className="relative overflow-hidden rounded-[22px] bg-deep px-8 py-12 ring-1 ring-white/[0.08] sm:px-12 sm:py-16"
    >
      <div aria-hidden className="hm-glow-dark pointer-events-none absolute inset-x-0 bottom-[-30%] h-[80%]" />
      <div className="relative">
        {/* Readable text, not decoration, so both clear AA on `deep`
            with room for the glow behind them: white/45 was 4.5:1 on
            the bare panel and less where the light sits. */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</p>
        <p className="mt-4 text-[clamp(44px,6vw,76px)] font-semibold leading-none tracking-[-0.04em] text-white">{figure}</p>
        <p className="mt-5 max-w-[40ch] text-[14px] leading-[1.55] text-white/60">{note}</p>

        <div aria-hidden className="relative mt-10 h-[64px]">
          <span className="absolute inset-x-[10px] top-[10px] h-[2px] rounded-full bg-white/10" />
          <span className="hm-grad-rule draw-x absolute inset-x-[10px] top-[10px] h-[2px] rounded-full" />
          {steps.map((s, i) => {
            const f = last > 0 ? i / last : 0;
            const edge = i === 0 ? "start" : i === last ? "end" : "mid";
            return (
              <div
                key={s}
                className={`absolute top-0 flex flex-col ${
                  edge === "start" ? "start-0 items-start text-start"
                    : edge === "end" ? "end-0 items-end text-end"
                    : "-translate-x-1/2 items-center text-center rtl:translate-x-1/2"
                }`}
                style={edge === "mid" ? { insetInlineStart: `calc(${(f * 100).toFixed(3)}% + ${(11 - 22 * f).toFixed(3)}px)` } : undefined}
              >
                <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-deep ring-2 ring-white/15">
                  <span
                    className="draw-fill h-2.5 w-2.5 rounded-full"
                    style={{ background: DOT, transitionDelay: `${NODE_DELAY[i] ?? 150 + i * 350}ms` }}
                  />
                </span>
                <span className="mt-2.5 max-w-[80px] text-[11px] font-medium leading-tight text-white/55">{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Every live campaign's share, one dot each, stacked by value.

    The band's answer to "what is my rate": there is none to set, and
    here is what brands actually set, on one scale. It is a count, not a
    dial. A gauge with a floor, a ceiling and a marker implies a control
    the creator does not have, and no brand is named because the point
    is the spread, not who sits where.

    The scale computes its own range and counts, so the label a screen
    reader hears is the same data the dots are drawn from. The sentence
    around those numbers is the page's, so it comes in as `spoken`. */
export function ShareScale({ shares, label, note, spoken }: {
  shares: number[]; label: string; note: string;
  spoken: (s: { total: number; min: number; max: number; counts: { p: number; count: number }[] }) => string;
}): JSX.Element {
  const [box, seen] = useInView<HTMLElement>(0.45);
  const whole = shares.map((s) => Math.round(s));
  const has = whole.length > 0;
  const min = has ? Math.min(...whole) : 0;
  const max = has ? Math.max(...whole) : 0;
  const cols = has
    ? Array.from({ length: max - min + 1 }, (_, c) => ({ p: min + c, count: whole.filter((s) => s === min + c).length }))
    : [];
  /* 13 units a dot, unless a column is tall enough to reach the figure,
     in which case the stack tightens. At four it never does. */
  const tallest = Math.max(1, ...cols.map((c) => c.count));
  const step = Math.min(13, 44 / Math.max(1, tallest - 1));
  const x = (p: number) => (max === min ? 110 : 20 + (p - min) * (180 / (max - min)));
  const range = min === max ? `${min}%` : `${min}–${max}%`;
  const said = spoken({ total: whole.length, min, max, counts: cols.filter((c) => c.count > 0) });

  return (
    <figure ref={box} {...(seen ? { "data-drawn": "" } : {})} className="mx-auto w-full max-w-[420px]">
      {has && (
        <svg viewBox="0 0 220 128" className="w-full" role="img" aria-label={said}>
          <defs>
            <linearGradient id="hm-share" x1="20" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4D2FB0" /><stop offset="0.55" stopColor="#7C5CE0" /><stop offset="1" stopColor="#F0559D" />
            </linearGradient>
          </defs>
          <text x="110" y="38" textAnchor="middle" className="fill-ink num" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em" }}>
            {range}
          </text>
          {/* The creators ink at the same alpha brands uses, so the rule
              and the ticks under it are one colour. */}
          <line x1="14" y1="106" x2="206" y2="106" stroke="rgba(18,21,27,0.09)" strokeWidth="1" />
          {/* The gradient is in user space, so a dot takes its colour
              from where it sits on the scale, not from its own box. They
              fade in a column at a time, bottom first. */}
          {cols.map((c, col) =>
            Array.from({ length: c.count }, (_, k) => (
              <circle
                key={`${c.p}-${k}`}
                cx={x(c.p)} cy={94 - k * step} r="5"
                fill="url(#hm-share)"
                className="draw-fill"
                style={{ transitionDelay: `${150 + col * 90 + k * 50}ms` }}
              />
            ))
          )}
          {cols.map((c) => (
            <text key={c.p} x={x(c.p)} y="122" textAnchor="middle" className="fill-ink/60 num" style={{ fontSize: 10 }}>
              {`${c.p}%`}
            </text>
          ))}
        </svg>
      )}
      <figcaption className="mt-1 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-main">{label}</p>
        <p className="mt-2 text-[14px] text-ink/60">{note}</p>
      </figcaption>
    </figure>
  );
}
