"use client";
/* lab/window (WP2). Calls notFound() in production; WP-F deletes lab/.

   ?view=page     (default) an intro one viewport tall, then the real WorkSection, then room to scroll
                  past it. The section mounts below the viewport, so it arms to the start state and
                  plays at 55% in view, exactly as on the page. A readout shows the `work` signal.
   ?view=top      the WorkSection first: in view at mount, so it stays final (rule 2.4.7).
   ?view=scrub    the window frozen at any instant (&t=ms, or the slider and presets), page and compact,
                  with the act rail on the same clock.
   ?view=compact  WP7's thumbnail, live and looping, with a playing toggle.
   Every view takes ?a=brands|creators and ?rm=1 (the toolbar), and the toolbar's pause. */
import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMotionValue } from "motion/react";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import type { Audience } from "../../_site/data/types";
import { WorkSection } from "../../_site/window/WorkSection";
import { CompactWindow, FrameArt, PageWindow, WorkingWindow } from "../../_site/window/WorkingWindow";
import { ActRail } from "../../_site/window/ActRail";
import { RunClock, progressAt, scheduleFor, snapAt, type Act } from "../../_site/window/useRun";
import { useSignal } from "../../_site/lib/signals";
import { usePlayback } from "../../_site/lib/playback";
import { RUN } from "../../_site/tokens";
import s from "../../_site/window/window.module.css";

type Search = LabSearch & { view?: string; t?: string; readout?: string };
const VIEWS = ["page", "top", "scrub", "compact"] as const;
type View = (typeof VIEWS)[number];

export default function Page({ searchParams }: { searchParams?: Search }) {
  if (process.env.NODE_ENV === "production") notFound();
  const view: View = (VIEWS as readonly string[]).includes(searchParams?.view ?? "") ? (searchParams!.view as View) : "page";
  const t = Number(searchParams?.t);
  return (
    <LabFrame initial={labAudience(searchParams)} title={`window · ${view}`} surface="paper">
      {(a) => (
        <Lab key={a} a={a} view={view} t={Number.isFinite(t) ? t : null} rm={searchParams?.rm === "1"} readout={searchParams?.readout === "1"} />
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

function Lab({ a, view, t, rm, readout }: { a: Audience; view: View; t: number | null; rm: boolean; readout: boolean }) {
  return (
    <>
      <Tabs a={a} view={view} rm={rm} />
      {readout && <Readout />}
      {view === "page" && <PageView a={a} />}
      {view === "top" && <WorkSection audience={a} />}
      {view === "scrub" && <ScrubView a={a} t={t} />}
      {view === "compact" && <CompactView a={a} />}
    </>
  );
}

/* ── page: the real section, below the fold ── */
function PageView({ a }: { a: Audience }) {
  return (
    <>
      <div className="mx-auto flex min-h-[calc(100svh-140px)] max-w-text flex-col justify-end px-[var(--gutter)] pb-16">
        <p className="mono-caps text-ink/60">WP2 · S4 · {a}</p>
        <p className="mt-3 max-w-[56ch] text-body text-ink/72">
          Scroll down. The run starts when the frame is 55% in view, pauses below 20%, on hover (with a ring), when the
          tab is hidden or on the toolbar pause. It plays once; then the controls appear. The act rail seeks.
        </p>
      </div>
      <WorkSection audience={a} />
      <div className="h-[120svh]" />
    </>
  );
}

/** &readout=1: the `work` signal and the stopwatch text, live (lab only). */
function Readout() {
  const work = useSignal("work");
  const [watch, setWatch] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => {
      setWatch(document.querySelector("[data-stopwatch]")?.textContent ?? "");
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div data-lab-readout className="mono-data fixed bottom-3 start-1/2 z-[80] -translate-x-1/2 whitespace-nowrap rounded-control bg-night-0/90 px-3 py-2 text-white/72 shadow-float">
      work {work.state} · {Math.round(work.overall * 100)}% · passed {String(work.passed)} · <span className="text-white">{watch}</span>
    </div>
  );
}

/* ── scrub: any instant, frozen ── */
function ScrubView({ a, t: t0 }: { a: Audience; t: number | null }) {
  const sch = scheduleFor(a);
  const [t, setT] = useState(() => Math.max(0, Math.min(sch.END, t0 ?? sch.END)));
  const clock = useMotionValue(t);
  useEffect(() => { clock.set(t); }, [clock, t]);
  const mt = useMotionValue(t);
  useEffect(() => { mt.set(t); }, [mt, t]);
  const tm = useMemo(() => {
    const ms = sch.marks.filter((m) => m <= t);
    return ms.length ? ms[ms.length - 1] : 0;
  }, [sch, t]);
  const snap = useMemo(() => snapAt(sch, tm), [sch, tm]);
  const p = progressAt(sch, t);

  const presets: [string, number][] = [
    ["idle", 0],
    ["row 2", sch.read[1].start + 300],
    ["3/4", sch.read[3].start + 300],
    ["unfold", (sch.sizes[1]?.at ?? 0) + 120],
    ["4/9", (sch.sizes[1]?.at ?? 0) + 700],
    ["row 9", sch.read[8].start + 400],
    ["stamp", sch.R + 100],
    ["fold", sch.F + 260],
    ["build", sch.B0 + 300],
    ...(a === "brands"
      ? ([["parallel", sch.build[2].start + 600], ["pricing", sch.build[4].end + 100], ["act 3", sch.acts[2] + 200], ["ladder", (sch.ladder?.end ?? 0) + 400]] as [string, number][])
      : ([["build 3", sch.build[2].start + 600], ["why", (sch.W ?? 0) + 250], ["picks", (sch.picks[1] ?? 0) + 50], ["foot", (sch.foot ?? 0) + 200]] as [string, number][])),
    ["end", sch.END],
  ];

  return (
    <RunClock.Provider value={clock}>
      <div className="mx-auto max-w-text px-[var(--gutter)] pt-6">
        <div className="flex flex-wrap items-center gap-2">
          {presets.map(([label, v]) => (
            <button
              key={label}
              type="button"
              data-preset={label}
              onClick={() => setT(Math.min(sch.END, v))}
              className={`mono-caps rounded-pill px-3 py-2 ${Math.abs(t - Math.min(sch.END, v)) < 1 ? "bg-brand text-white" : "bg-ink/5 text-ink/72"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-4">
          <span className="mono-data num w-[120px] text-ink">{(t / 1000).toFixed(2)}s</span>
          <input
            type="range" min={0} max={sch.END} step={10} value={t}
            onChange={(e) => setT(Number(e.target.value))}
            className="w-full accent-[var(--v700)]"
            aria-label="Time"
          />
        </label>
        <p className="mono-data mt-2 text-ink/60">act {p.act + 1} · act {Math.round(p.actProgress * 100)}% · overall {Math.round(p.overall * 100)}% · mark {tm}</p>
      </div>

      <div data-surface="deep" className={s.frame}>
        <FrameArt />
        <span className={`mono-caps text-white/56 ${s.frameLabel}`}>A sample run</span>
        <div className={s.winWrap}>
          <PageWindow sch={sch} snap={snap} t={mt} live={false} done={t >= sch.END} />
        </div>
      </div>
      <div className="mx-auto max-w-text px-[var(--gutter)]">
        <ActRail audience={a} act={p.act as Act} done={p.done} live={false} onSeek={(k) => setT(sch.acts[k])} />
      </div>

      <div className="mx-auto mt-16 max-w-text px-[var(--gutter)] pb-24">
        <p className="mono-caps mb-4 text-ink/60">compact at the same instant</p>
        <div className="max-w-[400px] overflow-hidden rounded-card shadow-promo">
          <CompactWindow sch={sch} snap={snap} t={mt} live={false} />
        </div>
      </div>
    </RunClock.Provider>
  );
}

/* ── compact: live, looping ── */
function CompactView({ a }: { a: Audience }) {
  const [on, setOn] = useState(true);
  const { paused } = usePlayback();
  return (
    <div className="mx-auto max-w-text px-[var(--gutter)] pb-24 pt-8">
      <button type="button" onClick={() => setOn((v) => !v)} className="mono-caps rounded-pill bg-ink px-4 py-2 text-white">
        {on ? "playing" : "stopped"} (toggle)
      </button>
      <div className="mt-8 grid gap-10 sm:grid-cols-[360px_1fr]">
        <div className="w-full max-w-[400px] overflow-hidden rounded-card bg-white shadow-promo">
          <div className="bg-lilac px-6 pb-[22px] pt-5 text-center">
            <p className="mono-caps text-brand">A sample run</p>
            <p className="mt-2 text-h3 text-ink">promo headline here</p>
          </div>
          <WorkingWindow audience={a} variant="compact" playing={on && !paused} loop />
        </div>
        <p className="text-small text-ink/72">
          The thumbnail plays the read at the real pace, stamps it, then shows the plan (brands) or the tiers
          (creators), and loops after {RUN.compactGapMs / 1000}s of rest. The stopwatch group never shows a time without its label.
        </p>
      </div>
    </div>
  );
}
