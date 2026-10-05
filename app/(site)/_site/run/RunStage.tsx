"use client";
/* WP3 Run stage (SPEC §5.3, ruling 9): a scroll-linked sticky stage, no timer.
 *
 * Two layouts.
 * - Stacked (the server render, the first client render, no JS, phone, reduced motion, short
 *   screens): each step, then its mock in a 300px hm-media mount (taller for creators' three tall
 *   sheets, so they show whole: TALL). Mocks that draw do so on entry.
 * - Sticky (≥768 wide, motion allowed, innerHeight ≥ 600, and the list fits the stage with 24px of
 *   air above and below): a
 *   100svh + 3 × 60svh track around a sticky 12-column stage. The step list (cols 1 to 5) with its
 *   rail, and the panel (cols 7 to 12) that swaps one mock at a time. Scroll progress decides the
 *   active step (it changes only at the quarters); the rail fill is an accelerated ViewTimeline
 *   binding (data-probe-scroll).
 * The switch to sticky happens in a layout effect after hydration (§5.9), so SSR and hydration agree
 * and nothing paints in between. Later mounts (a <Swap> remount) start in the right layout.
 *
 * Copy: COPY[a].run (A3 / A6). Credits: "Done by · …" with brands step 03 credited to "You"
 * (ruling 28, C2, gate G9). Never `cv` on this section: it holds a sticky stage. */
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, cubicBezier, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import type { RunStageProps } from "../contracts";
import type { Audience, DemoData } from "../data/types";
import { DEMO } from "../data/demo";
import { view } from "../data/view";
import { COPY, LABELS } from "../copy";
import { EASE } from "../tokens";
import { Section } from "../ui/Section";
import { useArmed } from "../ui/useArmed";
import wr from "../ui/WordReveal.module.css";
import { useIsoLayoutEffect } from "../lib/iso";
import { useMediaQuery, useReducedMotionPref } from "../lib/prefs";
import { scrollToY } from "../lib/scroll";
import { MockField } from "../mocks/MockField";
import { MockPlan } from "../mocks/MockPlan";
import { MockPay } from "../mocks/MockPay";
import { MockCurve } from "../mocks/MockCurve";
import { MockRead } from "../mocks/MockRead";
import { MockPicks } from "../mocks/MockPicks";
import { MockTerms } from "../mocks/MockTerms";
import { MockCheck } from "../mocks/MockCheck";
import { RunStep, type RunStepState } from "./RunStep";
import s from "./run.module.css";

/** §5.3: sticky at ≥768 wide and innerHeight ≥ 600 (plus: motion allowed, and the list fits). */
const STICKY_MQ = "(min-width: 768px) and (min-height: 600px)";
const STEPS = 4;
/** Rail segment k (glyph k to glyph k + 1) fills through step k's quarter of the scroll, so the fill
    reaches a glyph exactly when its step becomes active, and the rail is full through the last
    quarter. Constant keyframes spanning 0 to 1, so every binding stays accelerated. */
const E = "scaleY(0)", F = "scaleY(1)";
const SEG: [number[], string[]][] = [
  [[0, 0.25, 1], [E, F, F]],
  [[0, 0.25, 0.5, 1], [E, E, F, F]],
  [[0, 0.5, 0.75, 1], [E, E, F, F]],
];
/** A step click is a guided scroll, like toField's: in-out, so it starts and lands gently. */
const easeInOut = cubicBezier(...EASE.inOut);
/** Misses appear 120 ms apart (§5.3), after the panel has started to arrive. */
const MISS_STEP_MS = 120;
const PANEL_LEAD_MS = 160;
/** The sticky list needs this much spare height in the stage (24px above and below), or it stacks. */
const FIT_AIR = 48;

interface StepModel { title: string; body: string; credit: string }
type StepCopy = { title: string; body: string; credit: (d: DemoData) => string };

function stepsFor(a: Audience): StepModel[] {
  const steps: readonly StepCopy[] = COPY[a].run.steps;
  return steps.map((st) => ({ title: st.title, body: st.body, credit: st.credit(DEMO) }));
}

/* ── Mocks ──
   "final": drawn, all shown (server, no JS, reduced, in view at mount). "hidden": the start state
   while unseen. "play": from the start state to final, once. */
type Play = "final" | "hidden" | "play";

function useDrawn(play: Play, leadMs: number): boolean {
  const [on, setOn] = useState(play === "final");
  useEffect(() => {
    if (play === "final") { setOn(true); return; }
    setOn(false);
    if (play === "hidden") return;
    const id = window.setTimeout(() => setOn(true), leadMs);
    return () => window.clearTimeout(id);
  }, [play, leadMs]);
  return on;
}

function useStagger(total: number, play: Play, stepMs: number, leadMs: number): number {
  const [n, setN] = useState(play === "final" ? total : 0);
  useEffect(() => {
    if (play === "final") { setN(total); return; }
    setN(0);
    if (play === "hidden") return;
    const ids = Array.from({ length: total }, (_, k) => window.setTimeout(() => setN(k + 1), leadMs + k * stepMs));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [play, total, stepMs, leadMs]);
  return n;
}

function CurvePanel({ play }: { play: Play }) {
  const drawn = useDrawn(play, PANEL_LEAD_MS);
  return <MockCurve rungs={view.curve()} label={LABELS.brands.salesGuaranteed} drawn={drawn} />;
}

function CheckPanel({ play }: { play: Play }) {
  const { product, brand, dueIn, misses } = view.check();
  const shown = useStagger(misses.length, play, MISS_STEP_MS, PANEL_LEAD_MS);
  return <MockCheck product={product} brand={brand} dueIn={dueIn} misses={misses} shown={shown} />;
}

/** The mock for step `i`. Only step 04 moves (MockCurve draws, MockCheck's misses arrive). */
function Mock({ a, i, play }: { a: Audience; i: number; play: Play }) {
  if (a === "brands") {
    switch (i) {
      case 0: return <MockField kind="url" value="yourstore.com" /* §5.3's literal; §4.3: sections never read DEMO for mocks */ />;
      case 1: return <MockPlan {...view.plan()} />;
      case 2: return <MockPay {...view.pay()} />;
      default: return <CurvePanel play={play} />;
    }
  }
  switch (i) {
    case 0: return <MockRead {...view.read()} />;
    case 1: return <MockPicks {...view.picks()} shown={3} layout="cards" />;
    case 2: return <MockTerms {...view.terms()} />;
    default: return <CheckPanel play={play} />;
  }
}

/* ── Head: matches WorkSection's (from 1024: H2 cols 1 to 6, sub cols 8 to 12 on its last baseline;
      stacked below, as WP2 does). ──
   The H2 is WordReveal's blur-in (its CSS module and arming rule), with one difference: "live" never
   stands alone in an element. Both run H2s say "a live campaign" / "a live post", and a span whose
   whole text is "live" is what check:site's badge rule rejects (§7.2). So "live" shares its span
   with the word after it; words stay the smallest split (rule 2.4.5). */
const LONE = /^live$/i;
function words(text: string): string[] {
  const out: string[] = [];
  const parts = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    out.push(LONE.test(parts[i]) && i + 1 < parts.length ? `${parts[i]} ${parts[++i]}` : parts[i]);
  }
  return out;
}

function RunH2({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useArmed(ref, 0.6);
  const ws = words(text);
  return (
    <h2 ref={ref} id="run-h2" className={`${wr.root} max-w-[16ch] text-balance text-h2 text-ink lg:col-span-6`}>
      {ws.map((w, i) => (
        <Fragment key={i}>
          <span className={wr.word} style={{ "--i": i } as CSSProperties}>{w}</span>
          {i < ws.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h2>
  );
}

function Head({ a }: { a: Audience }) {
  const c = COPY[a].run;
  return (
    <div className="mx-auto max-w-text px-[var(--gutter)]">
      <div className={`grid gap-4 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0 ${s.head}`}>
        <RunH2 text={c.h2} />
        <p className="text-pretty text-lead text-ink/72 lg:col-span-5 lg:col-start-8">{c.sub}</p>
      </div>
    </div>
  );
}

/* ── Stacked ── */

/** Rule 2.4.7 for a mock that draws: final unless it is below the viewport at mount (with motion
    allowed); then the start state while unseen, and it plays once at 35% in view. */
function useEntry(ref: React.RefObject<HTMLElement>, enabled: boolean): Play {
  const [play, setPlay] = useState<Play>("final");
  useEffect(() => {
    const el = ref.current;
    if (!enabled) { setPlay("final"); return; }
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top <= window.innerHeight) return;   // in view (or above): stay final
    setPlay("hidden");
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || e.intersectionRatio < 0.35) return;
      setPlay("play");
      io.disconnect();
    }, { threshold: [0, 0.35] });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled]);
  return play;
}

/** Creators' tall sheets get taller stacked mounts (run.module.css); every other mount is 300px. */
const TALL: Record<Audience, readonly string[]> = {
  brands: [],
  creators: [s.tallRead, "", s.tallTerms, s.tallCheck],
};

function StackMount({ a, i, motionOk }: { a: Audience; i: number; motionOk: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const play = useEntry(ref, motionOk && i === STEPS - 1);
  return (
    <div ref={ref} aria-hidden className={`${s.mount} ${TALL[a][i] ?? ""} hm-media ring-1 ring-[var(--hair)]`}>
      <span className={`${s.dots} halftone`} />
      <div className={s.slot}><Mock a={a} i={i} play={play} /></div>
    </div>
  );
}

/* Memoised, like Stage: a re-render above the section never reaches the mocks. */
const Stack = memo(function Stack({ a, steps, motionOk }: { a: Audience; steps: StepModel[]; motionOk: boolean }) {
  const label = COPY[a].run.creditLabel;
  return (
    <div className="mx-auto mt-12 max-w-text px-[var(--gutter)] sm:mt-20">
      <ol className={s.stack}>
        {steps.map((st, i) => (
          <li key={i} className={s.pair}>
            <RunStep index={i} title={st.title} body={st.body} creditLabel={label} credit={st.credit} state="done" mode="static" />
            <StackMount a={a} i={i} motionOk={motionOk} />
          </li>
        ))}
      </ol>
    </div>
  );
});

/* ── Sticky ── */

/* Memoised: its props are stable (the audience, the memoised steps, a stable callback), so the only
   renders across a full scroll are the first and the three step changes (§5.3: at most 4). */
const Stage = memo(function Stage({ a, steps, onOverflow }: { a: Audience; steps: StepModel[]; onOverflow: () => void }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const label = COPY[a].run.creditLabel;

  /* The contain preset ("start start" → "end end"), which motion maps to a ViewTimeline. */
  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  const seg0 = useTransform(scrollYProgress, SEG[0][0], SEG[0][1]);
  const seg1 = useTransform(scrollYProgress, SEG[1][0], SEG[1][1]);
  const seg2 = useTransform(scrollYProgress, SEG[2][0], SEG[2][1]);
  const segs = [seg0, seg1, seg2];

  /* The one piece of React state: it changes only when the scroll crosses a quarter. */
  const [active, setActive] = useState(0);
  const current = useRef(0);
  const sync = useCallback((p: number) => {
    const next = Math.min(STEPS - 1, Math.max(0, Math.floor(p * STEPS)));
    if (next === current.current) return;
    current.current = next;
    setActive(next);
  }, []);
  useMotionValueEvent(scrollYProgress, "change", sync);
  useEffect(() => { sync(scrollYProgress.get()); }, [scrollYProgress, sync]);   // a reload mid-stage

  /* The list must fit the stage below the nav (pt-24) with real air: at least 24px above and below it
     (the list is centred), so a short laptop never runs it edge to edge. If it cannot, hand back to
     the stacked layout before paint rather than crowd or clip a step. */
  useIsoLayoutEffect(() => {
    const o = inner.current, l = list.current;
    if (!o || !l || typeof ResizeObserver === "undefined") return;
    const check = () => {
      const room = o.clientHeight - parseFloat(getComputedStyle(o).paddingTop) - FIT_AIR;
      if (l.offsetHeight > room) onOverflow();
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(o);
    ro.observe(l);
    return () => ro.disconnect();
  }, [onOverflow]);

  /* Click: a 0.8 s scroll to the middle of the step's quarter. Keyboard focus: the same, at once. */
  const go = useCallback((i: number, immediate: boolean) => {
    const o = outer.current, n = inner.current;
    if (!o || !n) return;
    const top = window.scrollY + o.getBoundingClientRect().top;
    const y = top + ((i + 0.5) / STEPS) * (o.offsetHeight - n.offsetHeight);
    scrollToY(y, immediate ? { immediate: true } : { duration: 0.8, easing: easeInOut });
  }, []);

  const stateOf = (i: number): RunStepState => (i < active ? "done" : i === active ? "active" : "upcoming");

  return (
    <div ref={outer} className={s.outer}>
      <div ref={inner} className={s.inner}>
        <div className="mx-auto grid h-full max-w-text grid-cols-12 items-center gap-x-8 px-[var(--gutter)] lg:gap-x-6">
          <div ref={list} className={`${s.listWrap} col-span-6 lg:col-span-5`}>
            <ol className={s.list}>
              {steps.map((st, i) => (
                <li key={i} className={s.item}>
                  <RunStep
                    index={i} title={st.title} body={st.body} creditLabel={label} credit={st.credit}
                    state={stateOf(i)} mode="button" onActivate={go}
                  />
                  {i < STEPS - 1 && (
                    <span aria-hidden className={s.seg}>
                      <m.span data-probe-scroll="" className={s.fill} style={{ transform: segs[i] }} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div aria-hidden className={`${s.panel} hm-media col-span-6 col-start-7 ring-1 ring-[var(--hair)]`}>
            <span className={`${s.dots} halftone`} />
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={active}
                className={s.slot}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.35, ease: EASE.out } }}
                exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE.exit } }}
              >
                <Mock a={a} i={active} play="play" />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

/* Set after the first hydration: a later mount (a <Swap> remount after a switch) is a client render
   and may start in its real layout, so the anchor <Swap> restores is measured on the final layout. */
let hydrated = false;

export function RunStage({ audience }: RunStageProps) {
  const steps = useMemo(() => stepsFor(audience), [audience]);
  const reduced = useReducedMotionPref();
  const roomy = useMediaQuery(STICKY_MQ);
  const [ready, setReady] = useState(hydrated);
  useIsoLayoutEffect(() => { hydrated = true; setReady(true); }, []);

  /* The viewport at which the list did not fit. Cleared when the viewport changes, so a resize to a
     size that fits brings the stage back. */
  const [tooSmall, setTooSmall] = useState<string | null>(null);
  const onOverflow = useCallback(() => setTooSmall(`${window.innerWidth}x${window.innerHeight}`), []);
  useEffect(() => {
    if (!tooSmall) return;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (`${window.innerWidth}x${window.innerHeight}` !== tooSmall) setTooSmall(null);
      });
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [tooSmall]);

  const sticky = ready && roomy && !reduced && !tooSmall;

  return (
    <Section slot="run" surface="paper" audience={audience} labelledBy="run-h2" className="pt-24 sm:pt-[140px]">
      <Head a={audience} />
      {sticky
        ? <Stage a={audience} steps={steps} onOverflow={onOverflow} />
        : <Stack a={audience} steps={steps} motionOk={ready && !reduced} />}
    </Section>
  );
}
