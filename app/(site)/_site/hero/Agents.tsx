"use client";
/* The agents (HERO-V2 "Wave 2 plan" W2c-3, W2c-4, §5; plan item 1). Lazy and client-only: EclipseSky mounts it as the
   .stage element's sibling inside the hero section, with the contract's AgentsProps (sky/eclipse-api.ts).

   One agent clock (V11): the audience's read (DEMO[a].read, verbatim, through replayOf) replayed at its real pace on
   lib/timeline, which renders on mark crossings only. It drives THE AGENT CARD (Mostafa's sketch, gate G10,
   CARD_MQ): one dark glass row at the hero's bottom right on the nav box's end edge: the moon-dot glyph, the working
   agent's name in Geist Mono caps and its stream note, verbatim, cut with an ellipsis. It changes in place by an
   opacity crossfade and never moves or resizes. On Creators (7 Oct) the card holds MoonScore AI's payout line at rest,
   and the payout track's four labels are portalled into the stage (TrackLabels). (The seven glints the clock also lit
   on the rim were removed on 6 Oct: Mostafa, "keep only the big shiny one".)
   Nothing here is announced: the card is aria-hidden and there is no live region. */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, useMotionValueEvent, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import type { Audience } from "../data/types";
import { EASE, LIFT } from "../tokens";
import { useAudience, useWorld } from "../lib/audience";
import { useIsoLayoutEffect } from "../lib/iso";
import { useHeroExit, useUncovered } from "../lib/lift";
import { useActive } from "../lib/playback";
import { useMediaQuery, useReducedMotionPref } from "../lib/prefs";
import { els, useSignal } from "../lib/signals";
import { useTimeline } from "../lib/timeline";
import { Moon } from "../ui/Moon";
import {
  AGENT_ORDER, AGENTS_DOM, CARD2, CARD_MQ, REPLAY, SWITCH, TRACK, replayAt, replayOf,
  type AgentsProps, type Replay, type ReplayItem,
} from "../sky/eclipse-api";
import s from "./agents.module.css";

if (process.env.NODE_ENV !== "production" && DEMO.agents.some((a, i) => a.name !== AGENT_ORDER[i])) {
  console.error("Agents: AGENT_ORDER (eclipse-api.ts) differs from DEMO.agents");
}

/** The run each item belongs to (consecutive items of one agent share a run): the card's row crossfades only when the
    run changes, and inside a run only the note does. */
const runsOf = (r: Replay): number[] =>
  r.items.reduce<number[]>((acc, it, k) => { acc.push(k === 0 ? 0 : acc[k - 1] + (it.agent !== r.items[k - 1].agent ? 1 : 0)); return acc; }, []);
/** The card's in-place crossfade: opacity only, never a transform. */
const FADE = { duration: 0.2, ease: EASE.out };
/** The card's presence: in with the opener, out on a switch to creators, both over SWITCH.textOutMs. */
const PRESENCE = { duration: SWITCH.textOutMs / 1000, ease: EASE.out };
const NONE = { duration: 0 };
const SHOW = { opacity: 1 };
const HIDE = { opacity: 0 };

/** True for `ms` after `on` turns off: the replay resumes REPLAY.resumeMs after the hero field blurs empty. The
    tail starts in the same render as the blur (derived state), so the replay never shows for a frame in between. */
function useTail(on: boolean, ms: number): boolean {
  const [prev, setPrev] = useState(on);
  const [tail, setTail] = useState(false);
  if (prev !== on) { setPrev(on); setTail(!on); }
  useEffect(() => {
    if (!tail) return;
    const id = window.setTimeout(() => setTail(false), ms);
    return () => window.clearTimeout(id);
  }, [tail, ms]);
  return tail && !on;
}

export function Agents({ stage, mountKey, card }: AgentsProps) {
  const { audience } = useAudience();
  const { dawn } = useWorld();
  const reduced = useReducedMotionPref();
  const wide = useMediaQuery(CARD_MQ);

  /* The audience whose read is replayed. It lags the urgent one on a switch, as the toasts did: the card fades out,
     and SWITCH.replayAfterMs later the new queue starts from its opener (Brands) or MoonScore AI's line comes in
     with the track's labels (Creators). */
  const [shown, setShown] = useState<Audience>(audience);
  const switching = shown !== audience;
  const replay = useMemo(() => replayOf(DEMO[shown].read), [shown]);
  const marks = useMemo(() => [...replay.marks], [replay]);
  const runs = useMemo(() => runsOf(replay), [replay]);

  /* The first item starts REPLAY.firstAtMs into the page's life, not into this chunk's. */
  const [armed, setArmed] = useState(() => performance.now() >= REPLAY.firstAtMs);
  useEffect(() => {
    if (armed) return;
    const id = window.setTimeout(() => setArmed(true), Math.max(0, REPLAY.firstAtMs - performance.now()));
    return () => window.clearTimeout(id);
  }, [armed]);

  const active = useActive(stage, { enter: 0.4, leave: 0.35 });
  const uncovered = useUncovered(stage);
  const heroFocus = useSignal("fieldFocus") === "hero";
  const hasText = useSignal("heroFieldHasText");
  const typingNow = heroFocus || hasText;
  const tail = useTail(typingNow, REPLAY.resumeMs);
  const typing = typingNow || tail;
  const [dawning, setDawning] = useState(() => dawn.get() > 0);
  useMotionValueEvent(dawn, "change", (v) => setDawning(v > 0));

  /* The hero field's valid submit (data-going): the clock freezes. */
  const [going, setGoing] = useState(false);
  useEffect(() => {
    const field = els.heroField ?? document.querySelector<HTMLElement>('[data-field="hero"]');
    if (!field) return;
    const onAttr = () => setGoing(field.dataset.going === "true");
    onAttr();
    const mo = new MutationObserver(onAttr);
    mo.observe(field, { attributes: true, attributeFilter: ["data-going"] });
    return () => mo.disconnect();
  }, []);

  /* The clock. It freezes off screen, in a hidden tab, under the nav pause (useActive), under the sheet, while the
     visitor types, during a switch, on a submit and on the dawn; it resumes where it stopped. */
  const playing = armed && !switching && active && uncovered && !typing && !dawning && !going;
  const { mark, restart } = useTimeline({ endMs: replay.holdEndMs, marks, playing, loopGapMs: REPLAY.restMs });
  useEffect(() => {
    if (!switching) return;
    /* restart() sets mark 0 synchronously, so the new queue's first render shows only its opener. */
    const id = window.setTimeout(() => { restart(); setShown(audience); }, reduced ? 0 : SWITCH.replayAfterMs);
    return () => window.clearTimeout(id);
  }, [switching, audience, reduced, restart]);
  /* Mount and a motion-preference change: play from the opener (a no-op after a swap). */
  useEffect(() => { restart(); }, [restart]);
  const at = mark < 0 ? -1 : marks[Math.min(mark, marks.length - 1)];

  /* The card's content: the item at the clock; from the hold's end through the rest, the cycle's last item landed
     (its produces). Reduced motion: that landed item, static. Frozen (typing, the pause, a submit), the clock is
     too, so the text holds and only the glyph comes to rest. */
  const last = replay.items[replay.items.length - 1];
  const cur = shown === "creators" ? { item: PAID_ITEM, landed: true }
    : reduced || at >= replay.holdEndMs ? (last ? { item: last, landed: true } : null) : replayAt(replay, at);
  const cardOn = card && wide && !switching && (reduced || armed) && cur !== null;

  /* The stage, which the card is placed against (the ref is set before this lazy chunk mounts). */
  const [host, setHost] = useState<HTMLElement | null>(null);
  useIsoLayoutEffect(() => { setHost(stage.current); }, [stage, mountKey]);

  return (
    <>
      <AnimatePresence initial={!reduced}>
        {cardOn && cur && (
          <AgentCard
            key="card"
            stage={host}
            item={cur.item}
            landed={cur.landed}
            working={playing && !cur.landed}
            row={shown === "creators" ? "creators:paid" : `${shown}:${runs[replay.items.indexOf(cur.item)]}`}
            reduced={reduced}
          />
        )}
      </AnimatePresence>
      {host && createPortal(
        <AnimatePresence initial={!reduced}>
          {audience === "creators" && shown === "creators" && <TrackLabels key="track" host={host} dim={typingNow} reduced={reduced} />}
        </AnimatePresence>,
        host,
      )}
    </>
  );
}

/** The Creators card: MoonScore AI's payout line, at rest (the payout track beside it carries the motion). */
const PAID_ITEM: ReplayItem = {
  key: "paid", agent: "MoonScore AI", index: AGENT_ORDER.indexOf("MoonScore AI"),
  text: COPY.creators.heroCard, land: null, startMs: 0, landMs: 0,
};

/* The payout track's labels (TRACK), portalled into the stage on Creators: COPY.creators.track on the four diagonals,
   each label's inner corner TRACK.label S in from the stage's nearer edges, so its box sits about 26 px off its arc.
   Paid is the bright one, with the pink check. Sized from the stage: smaller below TRACK.phoneS px, only Paid below
   TRACK.labelMinS. Opacity only, dimmed while the visitor types as the track is. Inline styles: the layer exists only
   after hydration, so none of it is first-paint CSS. */
const FAR = `${(1 - TRACK.label) * 100}%`;
const CORNERS: CSSProperties[] = [{ right: FAR, bottom: FAR }, { left: FAR, bottom: FAR }, { left: FAR, top: FAR }, { right: FAR, top: FAR }];
const LABEL_FADE = { duration: 0.4, ease: EASE.out };
const CHECK = (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden style={{ flex: "none" }}>
    <path d="M3 8.5l3 3 7-7" stroke="#F25FA6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
function TrackLabels({ host, dim, reduced }: { host: HTMLElement; dim: boolean; reduced: boolean }) {
  const [side, setSide] = useState(() => host.getBoundingClientRect().width);
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setSide(host.getBoundingClientRect().width));
    ro.observe(host);
    return () => ro.disconnect();
  }, [host]);
  const small = side < TRACK.phoneS;
  return (
    <m.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 1 }}
      initial={HIDE}
      animate={{ opacity: dim ? TRACK.focusDim : 1 }}
      exit={HIDE}
      transition={reduced ? NONE : LABEL_FADE}
    >
      {COPY.creators.track.map((word, i) => {
        const paid = i === 3;
        if (!paid && side < TRACK.labelMinS) return null;
        return (
          <span
            key={word}
            style={{
              position: "absolute", ...CORNERS[i], display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
              font: `500 ${(small ? 11 : 13) + (paid ? 1 : 0)}px/1 var(--font-geist-sans), system-ui, sans-serif`,
              color: paid ? "rgb(255 255 255 / .96)" : "rgb(255 255 255 / .52)",
            }}
          >
            {paid && CHECK}
            {word}
          </span>
        );
      })}
    </m.div>
  );
}

/** The card. The outer box is placed in the hero section (its containing block) and carries the presence fade (in
    with the opener, out on a switch to creators) and the dawn fade (dawn-fade's 300 ms transition: Chrome starts no
    transition on a property a running animation drives, so on the card itself, under the heroExit binding, the dawn
    would cut instead of fade). The card fills the box: the dark glass and the heroExit fade (data-lift,
    ViewTimeline-accelerated), so its own backdrop blur is never under a fading ancestor while the sheet lifts. Two lines (CARD2): glyph and name, then the note. A new run crossfades the whole row (each layer is laid
    out on its own, so nothing slides); inside a run only the note crossfades. */
function AgentCard({ stage, item, landed, working, row, reduced }: {
  stage: HTMLElement | null; item: ReplayItem; landed: boolean; working: boolean; row: string; reduced: boolean;
}) {
  const heroExit = useHeroExit();
  const opacity = useTransform(heroExit, [0, 1], [1, LIFT.contentOpacity]);
  const fade = reduced ? NONE : FADE;
  const text = landed && item.land !== null ? item.land : item.text;
  /* The star's bottom-right corner (CARD2): the card's right and bottom edges sit on the stage box's, measured
     against the hero section that holds the card, and kept there on every resize. Hidden until measured. */
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ right: number; bottom: number } | null>(null);
  useIsoLayoutEffect(() => {
    const el = box.current, hero = el?.offsetParent as HTMLElement | null;
    if (!el || !hero || !stage) return;
    /* Shifted right by CARD2.shiftRight of the stage's width (Mostafa: "bring it more to the right"), into the empty
       space beside the star's lower-right edge, but never closer than the page gutter to the screen's edge. */
    const place = () => {
      const h = hero.getBoundingClientRect(), r = stage.getBoundingClientRect();
      const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gutter")) || 24;
      const right = Math.max(gutter + h.right - window.innerWidth, h.right - r.right - CARD2.shiftRight * r.width);
      setAt({ right: Math.round(right), bottom: Math.round(h.bottom - r.bottom) });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(stage); ro.observe(hero);
    window.addEventListener("resize", place);
    return () => { ro.disconnect(); window.removeEventListener("resize", place); };
  }, [stage]);
  return (
    <m.div
      ref={box}
      aria-hidden
      className="dawn-fade pointer-events-none absolute z-content"
      style={{ right: at?.right ?? 0, bottom: at?.bottom ?? 0, width: `min(${CARD2.widthPx}px, 40vw)`, visibility: at ? "visible" : "hidden" }}
      initial={HIDE}
      animate={SHOW}
      exit={HIDE}
      transition={reduced ? NONE : PRESENCE}
    >
      <m.div
        {...{
          [AGENTS_DOM.card]: "", [AGENTS_DOM.agent]: item.agent,
          [AGENTS_DOM.working]: working ? "true" : "false", [AGENTS_DOM.landed]: landed ? "true" : "false",
        }}
        aria-hidden
        data-lift=""
        data-probe-scroll=""
        className={`${s.card} relative grid grid-cols-1`}
        style={{ padding: `${CARD2.padBlockPx}px ${CARD2.padInlinePx}px`, borderRadius: CARD2.radiusPx, ...(reduced ? null : { opacity }) }}
      >
        <AnimatePresence initial={false}>
          <m.div key={row} className="flex min-w-0 flex-col" style={{ gridArea: "1 / 1", gap: CARD2.lineGapPx }} initial={HIDE} animate={SHOW} exit={HIDE} transition={fade}>
            <span className="flex items-center" style={{ gap: CARD2.gapPx }}>
              <Moon working={working} size={13} className="text-white" />
              <span className="mono-caps whitespace-nowrap text-white/80">{item.agent}</span>
            </span>
            <span className="grid min-w-0 grid-cols-1">
              <AnimatePresence initial={false}>
                <m.span key={`${item.key}:${landed ? "land" : "work"}`} className="truncate text-small text-white/88" style={{ gridArea: "1 / 1" }} initial={HIDE} animate={SHOW} exit={HIDE} transition={fade}>
                  {text}
                </m.span>
              </AnimatePresence>
            </span>
          </m.div>
        </AnimatePresence>
      </m.div>
    </m.div>
  );
}
