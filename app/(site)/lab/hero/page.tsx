"use client";
/* WP1 lab: the hero inside the real lift structure (LiftProvider > LiftTrack > Hero, then a Sheet), so
   every state is reachable: both audiences and reduced motion (?rm=1, toolbar), the pause (toolbar),
   the sky modes (?sky=css | gl, ?skydebug), the sheet covering the hero (scroll), and a "bare" view that
   hides the content for CSS/GL parity checks. The hero is pulled up under the lab toolbar (-mt-20) so its
   geometry matches /brands exactly (apex 570 at 1440x900). Calls notFound() in production; WP-F deletes lab/. */
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { Hero } from "../../_site/hero/Hero";
import { LiftProvider } from "../../_site/lib/lift";
import { LiftTrack, Sheet } from "../../_site/shell/Lift";

type Search = LabSearch & { sky?: string; skydebug?: string; bare?: string };

const BARE = "[data-slot=hero] [data-lift]:not(.hz):not([data-lift=dim]){visibility:hidden!important}";

/** Toggle one query flag, keeping the rest (a, rm, sky…). */
function href(search: Search | undefined, key: keyof Search, value: string | null): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(search ?? {})) if (typeof v === "string") q.set(k, v);
  if (value === null) q.delete(key); else q.set(key, value);
  const s = q.toString();
  return s ? `?${s}` : "?";
}

function Readout() {
  const [r, setR] = useState("");
  useEffect(() => {
    const read = () => {
      const f = document.querySelector("[data-field='hero']")?.getBoundingClientRect();
      const hz = document.querySelector<HTMLElement>("[data-horizon='hero']");
      const h = hz?.getBoundingClientRect();
      const c = document.querySelector<HTMLCanvasElement>("[data-slot='hero'] canvas");
      const sky = (window as Window & { __sky?: { running: boolean; level: number } }).__sky;
      const delta = f && h ? (f.top + f.height / 2 - (h.top + h.height / 2)).toFixed(2) : "n/a";
      setR([
        `apex Δ ${delta}`,
        `gl ${hz?.dataset.gl ?? "(css)"}`,
        c ? `canvas ${(c.width / c.clientWidth).toFixed(2)}x` : "no canvas",
        sky ? `${sky.running ? "running" : "stopped"} @${sky.level}` : "",
        `toasts ${document.querySelectorAll("[data-toast]").length}`,
      ].filter(Boolean).join(" · "));
    };
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, []);
  return <span className="text-white/72">{r}</span>;
}

function Panel({ search }: { search?: Search }) {
  const sky = search?.sky ?? "auto";
  const link = (label: string, to: string, on: boolean) => (
    <a key={label} href={to} className={`rounded-pill px-2.5 py-1.5 ${on ? "bg-white text-ink" : "bg-white/8 text-white/72 hover:text-white"}`}>{label}</a>
  );
  return (
    <div className="mono-caps fixed bottom-2 start-2 z-[80] flex max-w-[calc(100vw-16px)] flex-wrap items-center gap-1.5 rounded-[18px] bg-night-0/90 p-1.5 ps-3 text-white shadow-glass">
      <span className="text-white/56">sky</span>
      {link("auto", href(search, "sky", null), sky === "auto")}
      {link("css", href(search, "sky", "css"), sky === "css")}
      {link("gl", href(search, "sky", "gl"), sky === "gl")}
      {link("debug", href(search, "skydebug", search?.skydebug !== undefined ? null : "1"), search?.skydebug !== undefined)}
      {link("bare", href(search, "bare", search?.bare ? null : "1"), !!search?.bare)}
      <span className="px-1.5"><Readout /></span>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams?: Search }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="hero" surface="night">
      {() => (
        <div className="-mt-20">
          {searchParams?.bare && <style>{BARE}</style>}
          <LiftProvider>
            <LiftTrack>
              <Hero />
            </LiftTrack>
            <Sheet>
              <div className="mx-auto max-w-text px-6 pb-[60svh] pt-24 text-ink/60">
                <p className="mono-caps">lab / sheet</p>
                <p className="mt-3 max-w-[520px] text-body">
                  The paper sheet, so the lift can be checked: it rises over the pinned hero, the toasts freeze once
                  it covers their lanes, and the sky stops at heroExit 1.
                </p>
              </div>
            </Sheet>
          </LiftProvider>
          <Panel search={searchParams} />
        </div>
      )}
    </LabFrame>
  );
}
