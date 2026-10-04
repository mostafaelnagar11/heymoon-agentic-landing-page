"use client";
/* lab/run (WP3): the Run stage, both audiences. Calls notFound() in production; WP-F deletes lab/.
 *
 * Every state is reachable from the toolbar: the audience switch, rm (?rm=1 forces the JS side of
 * reduced motion, which shows the stacked layout), and the global pause (freezes the working glyph).
 * Phone width (or a window under 600px tall) shows the stacked layout with motion. The readout at the
 * bottom left is read from the DOM, so it never re-renders the stage: the layout, the active step,
 * the scroll progress through the track and the rail fill's timeline. */
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { RunStage } from "../../_site/run/RunStage";

interface Readout { mode: string; active: string; progress: string; timeline: string; scrollY: number }

function read(): Readout {
  const run = document.querySelector<HTMLElement>('[data-slot="run"]');
  const steps = run ? Array.from(run.querySelectorAll("button[data-state]")) : [];
  const active = steps.findIndex((b) => b.getAttribute("aria-current") === "step");
  const fill = run?.querySelector<HTMLElement>("[data-probe-scroll]");
  const track = fill?.closest("[data-slot] > div:last-child") as HTMLElement | null;
  let progress = "–";
  if (track && fill) {
    const r = track.getBoundingClientRect();
    const span = track.offsetHeight - window.innerHeight;
    progress = span > 0 ? Math.min(1, Math.max(0, -r.top / span)).toFixed(3) : "–";
  }
  const tl = fill?.getAnimations?.()[0]?.timeline?.constructor.name ?? (fill ? "JS" : "–");
  return {
    mode: fill ? "sticky" : "stacked",
    active: active < 0 ? "–" : String(active + 1).padStart(2, "0"),
    progress, timeline: tl, scrollY: Math.round(window.scrollY),
  };
}

function LabReadout() {
  const [r, setR] = useState<Readout | null>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => { setR(read()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!r) return null;
  return (
    <div data-lab-readout className="mono-caps pointer-events-none fixed bottom-3 start-3 z-[80] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 rounded-control bg-night-0/90 px-3 py-2 text-white/72">
      <span>layout</span><span className="text-white">{r.mode}</span>
      <span>step</span><span className="num text-white">{r.active}</span>
      <span>progress</span><span className="num text-white">{r.progress}</span>
      <span>rail</span><span className="text-white">{r.timeline}</span>
      <span>scrollY</span><span className="num text-white">{r.scrollY}</span>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="run" surface="paper">
      {(a) => (
        <>
          <RunStage audience={a} />
          {/* What follows the stage on the page (the number section opens with 120px of padding). */}
          <div className="mx-auto mt-[120px] grid h-[100svh] max-w-text place-items-start px-[var(--gutter)]">
            <span className="mono-caps text-ink/60">After the run</span>
          </div>
          <LabReadout />
        </>
      )}
    </LabFrame>
  );
}
