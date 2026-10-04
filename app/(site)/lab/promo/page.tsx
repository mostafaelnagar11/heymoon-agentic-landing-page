"use client";
/* lab/promo (WP7). Calls notFound() in production; WP-F deletes lab/.

   ?view=page     (default) the real thing on a stand-in page: a night hero with the real hero Field, the
                  real WorkSection (it writes the `work` signal, so the auto-open is real), a paper run of
                  space, a night close with the real close Field, and the real Promo. A readout shows the
                  signals and the session record, with buttons to clear the record, block storage,
                  simulate the phone keyboard, and open the card. The surface under the nav line is
                  written here (there is no Nav in a lab) so the card's shadow follows it.
   ?view=gallery  both audiences side by side, on paper and on night: the launcher closed, hovered-free
                  and open, and the card in flow (it plays its entrance and its thumbnail).
   Every view takes ?a=brands|creators, ?rm=1 and the toolbar's pause. &debug=0 hides the readout. */
import { notFound } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import type { Audience } from "../../_site/data/types";
import { Promo, PROMO_KEY } from "../../_site/promo/Promo";
import { PromoCard } from "../../_site/promo/PromoCard";
import { Launcher } from "../../_site/promo/Launcher";
import { Field } from "../../_site/shell/Field";
import { WorkSection } from "../../_site/window/WorkSection";
import { COPY } from "../../_site/copy";
import { DEMO } from "../../_site/data/demo";
import { getSignal, setSignal, useSignal, type SignalState } from "../../_site/lib/signals";
import { readSession, writeSession } from "../../_site/lib/session";
import { usePlayback } from "../../_site/lib/playback";
import { useReducedMotionPref } from "../../_site/lib/prefs";

type Search = LabSearch & { view?: string; debug?: string };
const VIEWS = ["page", "gallery"] as const;
type View = (typeof VIEWS)[number];

export default function Page({ searchParams }: { searchParams?: Search }) {
  if (process.env.NODE_ENV === "production") notFound();
  const view: View = (VIEWS as readonly string[]).includes(searchParams?.view ?? "") ? (searchParams!.view as View) : "page";
  const debug = searchParams?.debug !== "0";
  const rm = searchParams?.rm === "1";
  return (
    <LabFrame initial={labAudience(searchParams)} title={`promo · ${view}`} surface="paper">
      {(a) => (
        <>
          <Tabs a={a} view={view} rm={rm} />
          {view === "page" ? <PageView a={a} debug={debug} /> : <Gallery />}
        </>
      )}
    </LabFrame>
  );
}

function Tabs({ a, view, rm }: { a: Audience; view: View; rm: boolean }) {
  const href = (v: View) => `?view=${v}&a=${a}${rm ? "&rm=1" : ""}`;
  return (
    <nav className="mx-auto flex max-w-text flex-wrap gap-2 px-[var(--gutter)] pt-6" aria-label="Lab views">
      {VIEWS.map((v) => (
        <a key={v} href={href(v)} className={`mono-caps rounded-pill px-3 py-2 ${v === view ? "bg-ink text-white" : "bg-ink/5 text-ink/72 hover:text-ink"}`}>
          {v}
        </a>
      ))}
    </nav>
  );
}

/* ── page: the real Promo on a stand-in page ── */

/** The Nav's surface rule, without the Nav: the deepest [data-surface] under the nav's centre line. */
function useSurfaceWriter() {
  useEffect(() => {
    const check = () => {
      const cs = getComputedStyle(document.documentElement);
      const y = (parseFloat(cs.getPropertyValue("--nav-top")) || 16) + (parseFloat(cs.getPropertyValue("--nav-h")) || 56) / 2;
      let hit: HTMLElement | null = null;
      document.querySelectorAll<HTMLElement>("[data-surface]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) hit = el;   // later in DOM order (deeper) wins
      });
      const surf = (hit as HTMLElement | null)?.dataset.surface;
      setSignal("surface", surf === "paper" ? "paper" : "night");
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);
}

function Night({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section data-surface="night" className={`relative bg-night-1 text-white ${className}`}>{children}</section>;
}

function PageView({ a, debug }: { a: Audience; debug: boolean }) {
  useSurfaceWriter();
  return (
    <>
      <Night className="mt-6 grid min-h-[calc(100svh-80px)] place-items-center px-[var(--gutter)] py-24">
        <div className="flex w-full flex-col items-center gap-8">
          <p className="mono-caps text-white/56">Stand-in hero · {a}</p>
          <Field id="lab-hero" placement="hero" />
          <p className="max-w-[60ch] text-center text-small text-white/72">
            Desktop: the launcher appears 4s after load or on the first scroll, and hides while the close field is in view.
            Phone: only while no field is in view and the keyboard is closed. Scroll fast past the window (under 60% of its
            run) at 1024 or wider and the card opens by itself, once per session.
          </p>
        </div>
      </Night>
      <WorkSection audience={a} />
      <div data-surface="paper" className="mx-auto grid min-h-[140svh] max-w-text place-items-center px-[var(--gutter)]">
        <p className="mono-caps text-ink/60">Run, number, agents, connects</p>
      </div>
      <Night className="grid min-h-svh place-items-center px-[var(--gutter)] py-24">
        <div className="flex w-full flex-col items-center gap-8">
          <p className="mono-caps text-white/56">Stand-in close</p>
          <Field id="lab-close" placement="close" />
        </div>
      </Night>
      <Night className="h-[40svh]"><span /></Night>
      <Promo />
      {debug && <Readout />}
    </>
  );
}

const yes = (v: boolean) => (v ? "yes" : "no");

function Readout() {
  const open = useSignal("promoOpen");
  const hero = useSignal("heroFieldVisible");
  const close = useSignal("closeFieldVisible");
  const kb = useSignal("keyboardOpen");
  const focus = useSignal("fieldFocus");
  const heroText = useSignal("heroFieldHasText");
  const closeText = useSignal("closeFieldHasText");
  const work = useSignal("work");
  const surface = useSignal("surface");
  const { paused } = usePlayback();
  const reduced = useReducedMotionPref();
  const [session, setSession] = useState<string | null>(null);
  const [launcher, setLauncher] = useState("?");
  const [blocked, setBlocked] = useState(false);
  const restore = useRef<(() => void) | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSession(readSession(PROMO_KEY));
      setLauncher(document.querySelector<HTMLElement>("[data-promo-launcher]")?.dataset.shown ?? "?");
    }, 200);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => () => restore.current?.(), []);

  /* A private window with site data blocked: every storage call throws. */
  const toggleBlock = () => {
    if (restore.current) { restore.current(); restore.current = null; setBlocked(false); return; }
    const proto = Storage.prototype;
    const { getItem, setItem, removeItem } = proto;
    const boom = () => { throw new DOMException("The operation is insecure.", "SecurityError"); };
    proto.getItem = boom; proto.setItem = boom; proto.removeItem = boom;
    restore.current = () => { proto.getItem = getItem; proto.setItem = setItem; proto.removeItem = removeItem; };
    setBlocked(true);
  };

  const rows: [string, string][] = [
    ["launcher shown", launcher],
    ["promoOpen", yes(open)],
    ["session", session ?? "(none)"],
    ["heroFieldVisible", yes(hero)],
    ["closeFieldVisible", yes(close)],
    ["keyboardOpen", yes(kb)],
    ["fieldFocus", focus ?? "null"],
    ["has text", `${yes(heroText)} / ${yes(closeText)}`],
    ["work", `${work.state} ${Math.round(work.overall * 100)}% passed ${yes(work.passed)}`],
    ["surface", surface],
    ["paused · rm", `${yes(paused)} · ${yes(reduced)}`],
  ];
  const btn = "mono-caps rounded-pill bg-white/10 px-2.5 py-1.5 text-white/80 hover:bg-white/16 hover:text-white";
  const set = <K extends keyof SignalState>(k: K, v: SignalState[K]) => setSignal(k, v);
  return (
    <aside className="fixed start-2 top-[72px] z-[75] w-[248px] rounded-[14px] bg-night-0/90 p-3 text-white shadow-glass max-sm:hidden" aria-label="Promo readout">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] leading-[1.35]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-mono text-white/56">{k}</dt>
            <dd className="font-mono text-white/92" data-readout={k}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={() => { writeSession(PROMO_KEY, null); setSession(null); }}>clear session</button>
        <button type="button" className={btn} onClick={toggleBlock}>{blocked ? "unblock" : "block"} storage</button>
        <button type="button" className={btn} onClick={() => set("keyboardOpen", !getSignal("keyboardOpen"))}>keyboard</button>
        <button type="button" className={btn} onClick={() => set("promoOpen", !getSignal("promoOpen"))}>open (no focus)</button>
      </div>
    </aside>
  );
}

/* ── gallery: both audiences, both surfaces, in flow ── */

function GalleryRow({ surface }: { surface: "night" | "paper" }) {
  const { paused } = usePlayback();
  const reduced = useReducedMotionPref();
  const audiences: Audience[] = ["brands", "creators"];
  const headline = (x: Audience) => (x === "brands" ? COPY.brands.promo.headline(DEMO) : COPY.creators.promo.headline(DEMO));
  const noop = () => {};
  const label = surface === "night" ? "text-white/56" : "text-ink/60";
  return (
    <div className={`${surface === "night" ? "bg-night-1" : "bg-paper"} px-[var(--gutter)] py-14`} data-gallery={surface}>
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-end justify-center gap-x-14 gap-y-12">
        <div className="flex flex-col items-center gap-6 pb-1">
          <span className={`mono-caps ${label}`}>launcher</span>
          <div className="flex gap-6">
            <Launcher open={false} shown label={headline("brands")} anim={{ kind: null, n: 0 }} reduced={reduced} onToggle={noop} onEscape={noop} inline />
            <Launcher open shown label={headline("brands")} anim={{ kind: null, n: 0 }} reduced={reduced} onToggle={noop} onEscape={noop} inline />
          </div>
        </div>
        {audiences.map((x) => (
          <div key={x} className="flex flex-col items-center gap-4 max-sm:w-full">
            <span className={`mono-caps ${label}`}>{x}</span>
            <PromoCard
              audience={x} playing={!paused} reduced={reduced} focusOnOpen={false} surface={surface}
              swipe={false} onClose={noop} onCta={noop} inline
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Gallery() {
  return (
    <div className="mt-6">
      <GalleryRow surface="paper" />
      <GalleryRow surface="night" />
    </div>
  );
}
