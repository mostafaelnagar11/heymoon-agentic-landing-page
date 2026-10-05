"use client";
/* The eclipse hero's sky (Hero.tsx HERO_VARIANT "eclipse", HERO-V2 §8.3).

   First paint: the poster (EclipsePoster), a frame of the real WebGL glass at its resting pose, server-rendered
   inside the stage box. It is also the whole render under reduced motion, without JS, without WebGL, with
   Save-Data or ?sky=css, and after a lost context. There is no SVG twin any more: the star never looks flat.

   Early start: the renderer chunk (./eclipse) is requested when this module is evaluated, before hydration,
   whenever the gates pass (no reduced motion, no ?sky=css, no Save-Data unless ?sky=gl). After hydration the
   mount effect awaits that same promise and mounts on the next animation frame: no load or idle wait.

   Handover (V14): the renderer draws REST at time zero (the poster's frame), calls onReady and holds that frame.
   onReady flips the canvas to data-on="true" (opaque at once, under the poster) and the stage to data-gl="on"
   in one commit; the poster fades out over POSTER_FADE_MS, and on its transitionend (or POSTER_FADE_MS + 80 ms)
   release() starts the clock. onFail (any time, the compile no longer blocks) flips both back at once, committed
   synchronously, so the poster is there in the next frame.

   Wiring kept from the fast track: audience, hero field focus, keystrokes (pulse), a valid submit (launch), the
   user's pause, page visibility, the sheet covering the hero, resize. */
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useAudience } from "../lib/audience";
import { useHeroExit } from "../lib/lift";
import { getPaused, subscribePaused } from "../lib/playback";
import { usePageVisible, useReducedMotionPref } from "../lib/prefs";
import { useSignal } from "../lib/signals";
import { POSTER_FADE_MS, STAGE_ATTR, type EclipseHandle } from "./eclipse-api";
import { EclipsePoster } from "./EclipsePoster";
import s from "./eclipse.module.css";

/** GL is allowed: no reduced motion, no ?sky=css, and no Save-Data unless ?sky=gl. Client only. */
function glAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  const sky = new URLSearchParams(window.location.search).get("sky");
  if (sky === "css") return false;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !saveData || sky === "gl";
}

/* One request for the renderer chunk, started at module evaluation; a failed request can be retried. */
let modP: Promise<typeof import("./eclipse")> | null = null;
const loadEclipse = () => (modP ??= import("./eclipse").catch((e: unknown) => { modP = null; throw e; }));
if (glAllowed()) loadEclipse().catch(() => {});

export function EclipseSky({ stageClassName = "" }: { stageClassName?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<EclipseHandle | null>(null);
  const [ready, setReady] = useState(false);
  const { audience } = useAudience();
  const focus = useSignal("fieldFocus") === "hero";
  const visible = usePageVisible();
  const reduced = useReducedMotionPref();
  const heroExit = useHeroExit();
  const [covered, setCovered] = useState(false);
  const [paused, setPausedState] = useState(false);

  /* Latest values, read by the async mount so it starts in the current state. */
  const live = useRef({ audience, focus, stop: false });
  live.current.audience = audience;
  live.current.focus = focus;
  live.current.stop = paused || covered || !visible;

  useEffect(() => {
    setPausedState(getPaused());
    return subscribePaused(() => setPausedState(getPaused()));
  }, []);
  useEffect(() => {
    const on = (v: number) => setCovered(v >= 0.999);
    on(heroExit.get());
    return heroExit.on("change", on);
  }, [heroExit]);

  /* Mount: right after hydration, on the next animation frame once the chunk is in. Never under reduced
     motion (the server snapshot is "reduced", so this runs again with the real value after hydration). */
  useEffect(() => {
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!canvas || !stage || reduced || !glAllowed()) return;

    let dead = false, raf = 0;
    const offs: (() => void)[] = [];

    const mount = (mod: typeof import("./eclipse")) => {
      const h = mod.mountEclipse(canvas, stage, {
        audience: live.current.audience,
        onReady: () => { if (!dead) setReady(true); },
        /* Committed in the same task (a lost context, a late compile failure), so the frame after it already
           shows the poster and never the dead canvas. */
        onFail: () => { if (!dead) flushSync(() => setReady(false)); },
      });
      if (!h) return;
      handleRef.current = h;
      h.setFocus(live.current.focus);
      h.setPaused(live.current.stop);

      /* The hero field: keystrokes pulse, a valid submit (data-going flips) launches. */
      const field = document.querySelector<HTMLElement>('[data-field="hero"]');
      if (field) {
        const onInput = (e: Event) => { if ((e.target as Element | null)?.tagName === "INPUT") handleRef.current?.pulse(); };
        let t = 0;
        const onSubmit = () => {
          window.clearTimeout(t);
          t = window.setTimeout(() => { if (field.dataset.going === "true") handleRef.current?.launch(); }, 60);
        };
        field.addEventListener("input", onInput);
        field.addEventListener("submit", onSubmit);
        offs.push(() => { field.removeEventListener("input", onInput); field.removeEventListener("submit", onSubmit); window.clearTimeout(t); });
      }
      const onResize = () => handleRef.current?.resize();
      window.addEventListener("resize", onResize);
      offs.push(() => window.removeEventListener("resize", onResize));
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(onResize);
        ro.observe(stage);
        if (canvas.parentElement) ro.observe(canvas.parentElement);
        offs.push(() => ro.disconnect());
      }
    };

    loadEclipse().then(
      (mod) => { if (!dead) raf = requestAnimationFrame(() => { raf = 0; if (!dead) mount(mod); }); },
      () => { /* the chunk failed: the poster stays */ },
    );

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      offs.forEach((off) => off());
      handleRef.current?.destroy();
      handleRef.current = null;
      setReady(false);
    };
  }, [reduced]);

  /* Release the held resting frame once the poster has faded off it (or a beat after the fade's length).
     A failure flips ready off, which clears both. */
  useEffect(() => {
    if (!ready) return;
    const root = posterRef.current;
    let done = false;
    const release = () => { if (done) return; done = true; handleRef.current?.release(); };
    const onEnd = (e: TransitionEvent) => { if (e.target === root && e.propertyName === "opacity") release(); };
    root?.addEventListener("transitionend", onEnd);
    const timer = window.setTimeout(release, POSTER_FADE_MS + 80);
    return () => { done = true; root?.removeEventListener("transitionend", onEnd); window.clearTimeout(timer); };
  }, [ready]);

  useEffect(() => { handleRef.current?.setAudience(audience); }, [audience]);
  useEffect(() => { handleRef.current?.setFocus(focus); }, [focus]);
  const stop = paused || covered || !visible;
  useEffect(() => { handleRef.current?.setPaused(stop); }, [stop]);

  const stageAttrs = { [STAGE_ATTR.audience]: audience, [STAGE_ATTR.gl]: ready ? "on" : "off" };
  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`${s.canvas} pointer-events-none absolute inset-0 z-canvas h-full w-full`}
        data-on={ready ? "true" : "false"}
      />
      <div ref={stageRef} aria-hidden {...stageAttrs} className={`${s.stage} ${stageClassName}`}>
        <EclipsePoster ref={posterRef} audience={audience} />
      </div>
    </>
  );
}
