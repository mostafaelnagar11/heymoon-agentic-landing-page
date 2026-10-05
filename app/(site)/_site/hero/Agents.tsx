"use client";
/* The agents (HERO-V2 "Wave 2 plan" W2c-3, W2c-4, §5; plan item 1). Lazy and client-only: EclipseSky mounts it as the
   .stage element's sibling inside the hero section, with the contract's AgentsProps (sky/eclipse-api.ts).

   One agent clock (V11): the audience's read (DEMO[a].read, verbatim, through replayOf) replayed at its real pace on
   lib/timeline, which renders on mark crossings only. It drives:
   - the seven glints on the rim (statesAt; typingAgents while the visitor types; LAUNCH_AGENTS on a valid submit;
     REST_AGENTS before the clock arms), sent to the renderer (setAgents) while GL draws, or drawn as DOM dots over the
     poster (portalled into the stage) while GL is off and motion is allowed. Both audiences, every viewport.
   - THE AGENT CARD (Mostafa's sketch, BRANDS ONLY, gate G10, CARD_MQ): one dark glass row at the hero's bottom right
     on the nav box's end edge: the moon-dot glyph, the working agent's name in Geist Mono caps and its stream note,
     verbatim, cut with an ellipsis. It changes in place by an opacity crossfade and never moves or resizes.
   Nothing here is announced: the card is aria-hidden and there is no live region. */
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, useMotionValueEvent, useTransform } from "motion/react";
import * as m from "motion/react-m";
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
  AGENT_ORDER, AGENTS_DOM, CARD, CARD_AUDIENCE, CARD_CSS, CARD_MQ, LAUNCH_AGENTS, LEVEL, REPLAY, REST_AGENTS, SWITCH,
  dotOpacity, glintPoint, replayAt, replayOf, statesAt, typingAgents,
  type AgentStates, type AgentsProps, type Replay, type ReplayItem,
} from "../sky/eclipse-api";
import s from "./agents.module.css";

if (process.env.NODE_ENV !== "production" && DEMO.agents.some((a, i) => a.name !== AGENT_ORDER[i])) {
  console.error("Agents: AGENT_ORDER (eclipse-api.ts) differs from DEMO.agents");
}

/** A switch: every glint waits until the new audience's opener (HERO-V2 §7). */
const WAITING: AgentStates = { levels: AGENT_ORDER.map(() => LEVEL.waiting), working: -1 };
/** The DOM glints' halo ("r g b"): the renderer's corona tint on brands and on creators. */
const TINT: Readonly<Record<Audience, string>> = { brands: "158 128 255", creators: "255 115 184" };
/** A level as compared for a re-send ("1", "0.55"): no float noise. */
const fmt = (v: number): string => String(Math.round(v * 1000) / 1000);
/** The run each item belongs to (consecutive items of one agent share a run): the card's row crossfades only when the
    run changes, and inside a run only the note does. */
const runsOf = (r: Replay): number[] =>
  r.items.reduce<number[]>((acc, it, k) => { acc.push(k === 0 ? 0 : acc[k - 1] + (it.agent !== r.items[k - 1].agent ? 1 : 0)); return acc; }, []);
/** The hero field's length: what typingAgents lights. */
const heroLength = (field?: Element | null): number =>
  (els.heroInput ?? field?.querySelector("input") ?? null)?.value.length ?? 0;
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

export function Agents({ stage, handle, gl, mountKey, card }: AgentsProps) {
  const { audience } = useAudience();
  const { dawn } = useWorld();
  const reduced = useReducedMotionPref();
  const wide = useMediaQuery(CARD_MQ);

  /* The audience whose read is replayed. It lags the urgent one on a switch, as the toasts did: every glint waits,
     the card (brands only) fades out, and SWITCH.replayAfterMs later the new queue starts from its opener. */
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

  /* The hero field: its length (each keystroke wakes the next glint) and a valid submit (data-going). */
  const [typed, setTyped] = useState(0);
  const [going, setGoing] = useState(false);
  useEffect(() => {
    const field = els.heroField ?? document.querySelector<HTMLElement>('[data-field="hero"]');
    if (!field) return;
    const onInput = () => setTyped(heroLength(field));
    const onAttr = () => setGoing(field.dataset.going === "true");
    onInput();
    onAttr();
    const mo = new MutationObserver(onAttr);
    mo.observe(field, { attributes: true, attributeFilter: ["data-going"] });
    field.addEventListener("input", onInput);
    return () => { mo.disconnect(); field.removeEventListener("input", onInput); };
  }, []);
  /* A switch swaps the field's draft with no input event: read it again. */
  useEffect(() => { setTyped(heroLength()); }, [audience, hasText]);

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

  /* The seven levels and the working index (HERO-V2 §5.3), sent in the commit (a layout effect), so a verifier's
     MutationObserver on the card already sees the renderer agree. */
  const states: AgentStates = going || dawning ? LAUNCH_AGENTS
    : typing ? typingAgents(typed)
    : !armed ? REST_AGENTS
    : switching ? WAITING
    : statesAt(replay, at);
  const key = `${states.levels.map(fmt).join(",")}|${states.working}`;
  const statesRef = useRef(states);
  statesRef.current = states;
  useIsoLayoutEffect(() => {
    if (gl && !reduced) handle.current?.setAgents(statesRef.current);
  }, [key, gl, mountKey, reduced, handle]);

  /* The card's content: the item at the clock; from the hold's end through the rest, the cycle's last item landed
     (its produces). Reduced motion: that landed item, static. Frozen (typing, the pause, a submit), the clock is
     too, so the text holds and only the glyph comes to rest. */
  const last = replay.items[replay.items.length - 1];
  const cur = reduced || at >= replay.holdEndMs ? (last ? { item: last, landed: true } : null) : replayAt(replay, at);
  const cardOn = card && wide && audience === CARD_AUDIENCE && shown === CARD_AUDIENCE && (reduced || armed) && cur !== null;

  /* The stage, for the DOM glints' portal (the ref is set before this lazy chunk mounts). */
  const [host, setHost] = useState<HTMLElement | null>(null);
  useIsoLayoutEffect(() => { setHost(stage.current); }, [stage, mountKey]);

  return (
    <>
      {host && !gl && !reduced && createPortal(<Dots states={states} tint={TINT[audience]} />, host)}
      <AnimatePresence initial={!reduced}>
        {cardOn && cur && (
          <AgentCard
            key="card"
            item={cur.item}
            landed={cur.landed}
            working={playing && !cur.landed}
            row={`${shown}:${runs[replay.items.indexOf(cur.item)]}`}
            reduced={reduced}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** The card. The outer box is placed in the hero section (its containing block) and carries the presence fade (in
    with the opener, out on a switch to creators) and the dawn fade (dawn-fade's 300 ms transition: Chrome starts no
    transition on a property a running animation drives, so on the card itself, under the heroExit binding, the dawn
    would cut instead of fade). The card fills the box: the dark glass and the heroExit fade (data-lift,
    ViewTimeline-accelerated), so its own backdrop blur is never under a fading ancestor while the sheet lifts. One row: glyph, name, note. A new run crossfades the whole row (each layer is laid
    out on its own, so nothing slides); inside a run only the note crossfades. */
function AgentCard({ item, landed, working, row, reduced }: {
  item: ReplayItem; landed: boolean; working: boolean; row: string; reduced: boolean;
}) {
  const heroExit = useHeroExit();
  const opacity = useTransform(heroExit, [0, 1], [1, LIFT.contentOpacity]);
  const fade = reduced ? NONE : FADE;
  const text = landed && item.land !== null ? item.land : item.text;
  return (
    <m.div
      aria-hidden
      className="dawn-fade pointer-events-none absolute z-content"
      style={{ insetInlineEnd: CARD_CSS.insetInlineEnd, bottom: CARD_CSS.bottom, width: CARD_CSS.width, height: CARD.heightPx }}
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
        className={`${s.card} absolute inset-0 grid grid-cols-1`}
        style={{ paddingInline: CARD.padInlinePx, borderRadius: CARD.radiusPx, ...(reduced ? null : { opacity }) }}
      >
        <AnimatePresence initial={false}>
          <m.div key={row} className="flex min-w-0 items-center" style={{ gridArea: "1 / 1", gap: CARD.gapPx }} initial={HIDE} animate={SHOW} exit={HIDE} transition={fade}>
            <Moon working={working} size={13} className="text-white" />
            <span className="mono-caps flex-none whitespace-nowrap text-white/80">{item.agent}</span>
            <span className="grid min-w-0 flex-1 grid-cols-1">
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

/** The DOM glints while GL is off (motion allowed): one per agent at glintPoint, drawn as the GL glint is (HERO-V2
    §4.4): a white core of about 2 px and a tint halo of about 5 px at dotOpacity(level) (the poster already shows
    REST_AGENTS), and on the working agent four spikes of 0.035 S. Inline styles: the layer exists only after
    hydration, so none of it is first-paint CSS. */
function Dots({ states, tint }: { states: AgentStates; tint: string }) {
  const halo = `radial-gradient(closest-side, #fff 1.2px, rgb(${tint} / .9) 2.4px, rgb(${tint} / .33) 5px, rgb(${tint} / .1) 10px, transparent)`;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
      {AGENT_ORDER.map((name, i) => {
        const p = glintPoint(name), at = { left: `${p.x * 100}%`, top: `${p.y * 100}%` };
        const spike = i === states.working ? 0.85 : 0;
        return (
          <Fragment key={name}>
            <i data-glint={name} data-w={i === states.working ? "" : undefined} style={{ ...DOT, ...at, background: halo, opacity: fmt(dotOpacity(states.levels[i])) }} />
            <i style={{ ...RAY, ...at, opacity: spike, width: SPIKE, height: 1, background: `linear-gradient(90deg, ${RAY_FADE})` }} />
            <i style={{ ...RAY, ...at, opacity: spike, width: 1, height: SPIKE, background: `linear-gradient(${RAY_FADE})` }} />
          </Fragment>
        );
      })}
    </div>
  );
}
const DOT: CSSProperties = { position: "absolute", width: 32, height: 32, margin: -16, transition: "opacity .3s" };
const RAY: CSSProperties = { position: "absolute", translate: "-50% -50%", transition: "opacity .3s" };
const RAY_FADE = "transparent, #fff, transparent";
/** A spike's full length: 2 × 0.035 S, as a percentage of the stage (the layer is the stage's box). */
const SPIKE = "7%";
