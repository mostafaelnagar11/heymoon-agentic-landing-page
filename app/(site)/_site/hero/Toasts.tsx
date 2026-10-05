"use client";
/* The hero toasts (SPEC §5.1.4): the read, replayed at its real pace on the horizon, either side of the
   field. Client only (next/dynamic, ssr: false), aria-hidden, desktop only (≥1024: Hero never mounts this
   below that, so the chunk is never requested), behind gate G10 (ruling 34).

   One timeline drives it (lib/timeline): the opener lands at TOAST.openerMs, then each unit works from
   startMs + opener to endMs + opener, then holds TOAST.holdMs. The cycle rests TOAST.restMs and repeats.
   At most two toasts are ever in the DOM: one per lane, and a lane's next toast waits for its last to leave
   (AnimatePresence mode="wait"), so "the oldest exits first". Every visibility decision changes only on a
   mark, so the component renders on crossings and never per frame. */
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnimatePresence, useMotionValueEvent, type MotionStyle } from "motion/react";
import * as m from "motion/react-m";
import { DEMO } from "../data/demo";
import type { Audience } from "../data/types";
import { EASE, SKY, TOAST } from "../tokens";
import { useAudience, useWorld } from "../lib/audience";
import { useUncovered } from "../lib/lift";
import { useActive, usePlayback } from "../lib/playback";
import { useMediaQuery, useReducedMotionPref } from "../lib/prefs";
import { useSignal } from "../lib/signals";
import { useTimeline } from "../lib/timeline";
import { Moon } from "../ui/Moon";
import s from "./hero.module.css";

interface Item { key: string; agent: string; work: string; land: string | null; start: number; landAt: number; until: number }

/* Lane geometry. Each lane is 300 wide with its inner edge 338px from the centre (the field's 290 half-width
   + 48), and toasts hug that inner edge. A toast (62px) rests centred on the apex, level with the field,
   unless that would put the limb through its inner-bottom corner (wide screens, where the limb is flatter):
   then it rests 4px above the limb there. The lane runs `rise` px lower: its 14px mask (§5.1.4) sits under
   the resting toast, so an entering toast (y 12 → 0) surfaces out of the horizon. `rise` = the lane's
   padding-bottom in hero.module.css. */
const LANE = { inner: 338, toast: 62, clear: 4, rise: 14, height: 96 } as const;
const TWO_LANES = "(min-width: 1200px)";
/** One lane (1024 to 1199): a landed toast holds this long before the next one (already working) replaces it,
    so its produces label is read; with two lanes the other lane carries the overlap instead. */
const SINGLE_HOLD = 1200;

function itemsFor(a: Audience): Item[] {
  const read = DEMO[a].read;
  const items: Item[] = [];
  const o = TOAST.openerMs;
  if (read.opener) {
    const [agent, ...note] = read.opener.split(" · ");
    items.push({ key: "opener", agent, work: note.join(" · "), land: null, start: 0, landAt: o, until: o + TOAST.holdMs });
  }
  for (const u of read.units) {
    items.push({ key: u.key, agent: u.agent, work: `${u.note}…`, land: u.produces, start: u.startMs + o, landAt: u.endMs + o, until: u.endMs + o + TOAST.holdMs });
  }
  return items;
}

/** The two static landed toasts under reduced motion: units 4 and 9 (§5.1.4). */
const staticOf = (items: Item[]) => items.filter((it) => it.key !== "opener").filter((_, i) => i === 3 || i === 8);

/** offsetTop of `el` inside `root`, through the offsetParent chain (transforms ignored, as layout is). */
function topIn(el: HTMLElement, root: HTMLElement): number {
  let y = 0;
  for (let n: HTMLElement | null = el; n && n !== root; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y;
}

export function Toasts({ heroRef, liftStyle }: { heroRef: RefObject<HTMLElement>; liftStyle?: MotionStyle }) {
  const { audience } = useAudience();
  const { dawn } = useWorld();
  const reduced = useReducedMotionPref();
  const { paused } = usePlayback();
  const two = useMediaQuery(TWO_LANES);
  const fieldFocus = useSignal("fieldFocus");
  const laneRef = useRef<HTMLDivElement>(null);
  const active = useActive(heroRef, { enter: 0.4, leave: 0.35 });
  const uncovered = useUncovered(laneRef);

  /* The audience on show. A switch clears the lanes (a 200 ms exit), then swaps the queue 1,000 ms later. */
  const [shown, setShown] = useState<Audience>(audience);
  const switching = shown !== audience;
  const items = useMemo(() => itemsFor(shown), [shown]);
  const endMs = items[items.length - 1].until;
  const marks = useMemo(() => items.flatMap((it) => [it.start, it.landAt, it.landAt + SINGLE_HOLD, it.until]), [items]);
  const sorted = useMemo(() => [...marks].sort((a, b) => a - b), [marks]);

  /* The first toast surfaces TOAST.firstAtMs into the page's life (§1.4), not into this chunk's. */
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), Math.max(0, TOAST.firstAtMs - performance.now()));
    return () => window.clearTimeout(id);
  }, []);

  const [hovered, setHovered] = useState(false);
  const [dawning, setDawning] = useState(() => dawn.get() > 0);
  useMotionValueEvent(dawn, "change", (v) => setDawning(v > 0));

  const hidden = paused || (!two && fieldFocus === "hero");
  const playing = armed && !switching && active && uncovered && !hovered && !dawning && !hidden;
  const tl = useTimeline({ endMs, marks, playing, loopGapMs: TOAST.restMs });
  const { restart } = tl;

  /* The clock rewinds in the same batched update as the queue swap: restart() sets mark 0 synchronously
     (t.set → sync), so the new queue's first render shows only its opener, never the old mark's items. */
  useEffect(() => {
    if (!switching) return;
    setHovered(false);
    const id = window.setTimeout(() => { restart(); setShown(audience); }, 1000);
    return () => window.clearTimeout(id);
  }, [switching, audience, restart]);
  /* Mount, and a motion-preference change (restart's identity): play from the opener. A no-op after a swap. */
  useEffect(() => { restart(); }, [restart]);

  /* Geometry: the lanes' bottom sits 16px above the limb at the lane's centre, recomputed on resize.
     1024 to 1199: one centred lane, 40px below the chips. */
  const [top, setTop] = useState<number | null>(null);
  useEffect(() => {
    const hero = heroRef.current;
    const hz = hero?.querySelector<HTMLElement>("[data-horizon='hero']");
    const chips = hero?.querySelector<HTMLElement>("[data-chips]");
    if (!hero || !hz || !chips) return;
    const measure = () => {
      if (window.matchMedia(TWO_LANES).matches) {
        const apex = topIn(hz, hero) + hz.offsetHeight / 2;
        const r = SKY.limbRadiusVw * window.innerWidth;
        const sagitta = r - Math.sqrt(r * r - LANE.inner * LANE.inner);
        const bottom = apex + Math.min(LANE.toast / 2, sagitta - LANE.clear);
        setTop(Math.round(bottom + LANE.rise - LANE.height));
      } else {
        setTop(Math.round(topIn(chips, hero) + chips.offsetHeight + 40));
      }
    };
    const ro = new ResizeObserver(measure);
    ro.observe(hero);
    ro.observe(chips);
    window.addEventListener("resize", measure);
    measure();
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [heroRef, two]);

  /* What is on screen at the last crossed mark. */
  let visible: Item[];
  let at = Infinity;
  if (switching || hidden) visible = [];
  else if (reduced) visible = staticOf(items).slice(two ? 0 : 1);
  else if (!armed) visible = [];
  else {
    at = tl.mark < 0 ? -1 : sorted[tl.mark];
    const live = items.filter((it) => it.start <= at && at < it.until);
    if (two) visible = live.slice(-2);
    else {
      const last = live[live.length - 1], prev = live[live.length - 2];
      const holding = prev && prev.land !== null && at < prev.landAt + SINGLE_HOLD;
      visible = last ? [holding ? prev : last] : [];
    }
  }
  const lanes: (Item | null)[] = two ? [null, null] : [null];
  visible.forEach((it) => { lanes[two ? items.indexOf(it) % 2 : 0] = it; });
  if (reduced && two) { lanes[0] = visible[0] ?? null; lanes[1] = visible[1] ?? null; }

  return (
    <m.div
      ref={laneRef}
      aria-hidden
      data-lift=""
      data-probe-scroll=""
      data-toasts={two ? "2" : "1"}
      className={`${s.lanes} dawn-fade max-lg:hidden`}
      style={{ ...liftStyle, top: top ?? 0, visibility: top === null ? "hidden" : undefined }}
    >
      {lanes.map((it, i) => (
        <div key={i} className={s.lane} data-lane={two ? (i === 0 ? "start" : "end") : "center"}>
          <AnimatePresence mode="wait" initial custom={switching}>
            {it && (
              <Toast
                key={`${shown}-${it.key}`}
                item={it}
                landed={at >= it.landAt || reduced}
                reduced={reduced}
                onHover={setHovered}
              />
            )}
          </AnimatePresence>
        </div>
      ))}
    </m.div>
  );
}

const variants = {
  hidden: (reduced: boolean) => (reduced ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(4px)" }),
  shown: (reduced: boolean) => (reduced
    ? { opacity: 1, transition: { duration: 0.2, ease: EASE.out } }
    : { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: TOAST.inMs / 1000, ease: EASE.outExpo } }),
  /* `fast` is AnimatePresence's custom: a switch clears the lanes in 200 ms. */
  gone: (fast: boolean) => ({ opacity: 0, y: -6, filter: "blur(2px)", transition: { duration: fast ? 0.2 : TOAST.outMs / 1000, ease: EASE.exit } }),
};

function Toast({ item, landed, reduced, onHover }: { item: Item; landed: boolean; reduced: boolean; onHover: (h: boolean) => void }) {
  /* A hovered toast that leaves (a switch, the pause) must not keep the queue frozen. */
  useEffect(() => () => onHover(false), [onHover]);
  const land = landed && item.land !== null;
  return (
    <m.div
      data-toast={item.key}
      data-landed={landed ? "true" : "false"}
      custom={reduced}
      variants={variants}
      initial="hidden"
      animate="shown"
      exit="gone"
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      className={`pointer-events-auto min-w-[min(248px,100%)] max-w-full rounded-toast bg-[rgb(20_18_41/.62)] pb-3 pe-[14px] ps-3 pt-[11px] shadow-toast`}
    >
      <div className="flex items-center gap-2">
        <Moon working={!landed} phase={4} size={15} className="text-white" />
        <span className="mono-caps text-white/56">{item.agent}</span>
      </div>
      <div className={`${s.swap} mt-1.5 text-small text-white/92`} data-land={land ? "true" : "false"}>
        <span className={s.work}>{item.work}</span>
        {item.land !== null && <span className={s.land}>{item.land}</span>}
      </div>
    </m.div>
  );
}
