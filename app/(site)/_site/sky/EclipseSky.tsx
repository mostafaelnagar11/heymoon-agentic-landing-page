"use client";
/* The eclipse hero's sky (Hero.tsx HERO_VARIANT "eclipse", HERO-V2 §8.3, "Wave 2 plan").

   DOM: a wrapper (rowClassName: the phone layout's star row; display: contents on the split) holding .stage, the
   star's box. Inside the stage, in paint order: the GL canvas (the 2 S poster box, CANVAS_BOX, V4) and the poster
   (EclipsePoster, the same box). <Agents> (hero/Agents.tsx, lazy) is the wrapper's SIBLING, so the sticky hero
   section is the agent card's containing block; its glint dots go into the stage through a portal.

   First paint: the poster, a frame of the real WebGL glass at its resting pose, server-rendered inside the stage.
   It is also the whole render under reduced motion, without JS, without WebGL, with Save-Data or ?sky=css, and
   after a lost context. There is no SVG twin: the star never looks flat.

   Early start: the renderer chunk (./eclipse) is requested when this module is evaluated, before hydration,
   whenever the gates pass (no reduced motion, no ?sky=css, no Save-Data unless ?sky=gl). After hydration the
   mount effect awaits that same promise and mounts on the next animation frame: no load or idle wait.

   Handover (V14): the renderer draws REST at time zero (the poster's frame), calls onReady and holds that frame.
   onReady flips the canvas to data-on="true" (opaque at once, under the poster) and the stage to data-gl="on"
   in one commit; the poster fades out over POSTER_FADE_MS, and on its transitionend (or POSTER_FADE_MS + 80 ms)
   release() starts the clock. onFail flips both back at once, committed synchronously, so the poster is there in
   the next frame. "lost" then mounts a fresh renderer on a fresh canvas (a new mountKey), at most MAX_REMOUNTS
   times per page; "gaveup" removes the canvas; "nogl", "link" and "atlas" leave the poster.

   The switch is the renderer's (SWITCH, locked): setAudience on the urgent audience, never instant, and nothing
   here hides, delays or shortens the canvas while it plays. Also wired: the hero field's focus (setFocus), its
   keystrokes (pulse), a valid submit (launch), the tier (data-tier), resize, and the pauses: the user's pause,
   page visibility, the sheet over the hero (heroExit >= .999) and, on phones, the sheet over the star. */
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { flushSync } from "react-dom";
import { useAudience } from "../lib/audience";
import { useHeroExit, useUncovered } from "../lib/lift";
import { getPaused, subscribePaused } from "../lib/playback";
import { useMediaQuery, usePageVisible, useReducedMotionPref } from "../lib/prefs";
import { useSignal } from "../lib/signals";
import type { EclipseHandle, TierName } from "./eclipse-api";
import { EclipsePoster, MAX_REMOUNTS, PHONE_MQ, POSTER_FADE_MS, STAGE_ATTR } from "./EclipsePoster";
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

/* The agents (glints and, on brands at CARD_MQ, the card): client only, its own chunk, off the first load. */
const Agents = dynamic(() => import("../hero/Agents").then((mod) => mod.Agents), { ssr: false });

/* One request for the renderer chunk, started at module evaluation; a failed request can be retried. */
let modP: Promise<typeof import("./eclipse")> | null = null;
const loadEclipse = () => (modP ??= import("./eclipse").catch((e: unknown) => { modP = null; throw e; }));
if (glAllowed()) loadEclipse().catch(() => {});
/** Fresh renderers mounted after a lost context, this page (MAX_REMOUNTS). */
let remounts = 0;

export function EclipseSky({ stageClassName = "", rowClassName = "", card = false }: { stageClassName?: string; rowClassName?: string; card?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<EclipseHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [tier, setTier] = useState<TierName | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [gone, setGone] = useState(false);
  const { audience } = useAudience();
  const focus = useSignal("fieldFocus") === "hero";
  const visible = usePageVisible();
  const reduced = useReducedMotionPref();
  const heroExit = useHeroExit();
  const phone = useMediaQuery(PHONE_MQ);
  const uncovered = useUncovered(stageRef);
  const [covered, setCovered] = useState(false);
  const [paused, setPausedState] = useState(false);
  const stop = paused || covered || !visible || (phone && !uncovered);

  /* Latest values, read by the async mount so it starts in the current state. */
  const live = useRef({ audience, focus, stop });
  live.current.audience = audience;
  live.current.focus = focus;
  live.current.stop = stop;

  useEffect(() => {
    setPausedState(getPaused());
    return subscribePaused(() => setPausedState(getPaused()));
  }, []);
  useEffect(() => {
    const on = (v: number) => setCovered(v >= 0.999);
    on(heroExit.get());
    return heroExit.on("change", on);
  }, [heroExit]);

  /* The hero field: keystrokes pulse, a valid submit (data-going flips) launches. */
  useEffect(() => {
    const field = document.querySelector<HTMLElement>('[data-field="hero"]');
    if (!field || reduced) return;
    const onInput = (e: Event) => { if ((e.target as Element | null)?.tagName === "INPUT") handleRef.current?.pulse(); };
    let t = 0;
    const onSubmit = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => { if (field.dataset.going === "true") handleRef.current?.launch(); }, 60);
    };
    field.addEventListener("input", onInput);
    field.addEventListener("submit", onSubmit);
    return () => { field.removeEventListener("input", onInput); field.removeEventListener("submit", onSubmit); window.clearTimeout(t); };
  }, [reduced]);

  /* Mount: right after hydration, on the next animation frame once the chunk is in. Never under reduced
     motion (the server snapshot is "reduced", so this runs again with the real value after hydration). A new
     mountKey (a lost context) renders a fresh canvas and runs this again. */
  useEffect(() => {
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!canvas || !stage || reduced || !glAllowed()) return;

    let dead = false, raf = 0, retry = 0;
    const offs: (() => void)[] = [];

    const mount = (mod: typeof import("./eclipse")) => {
      const h = mod.mountEclipse(canvas, stage, {
        audience: live.current.audience,
        onReady: () => { if (!dead) setReady(true); },
        onTier: (x) => { if (!dead) setTier(x.tier); },
        /* Committed in the same task (a lost context, a late compile failure), so the frame after it already
           shows the poster and never the dead canvas. */
        onFail: (reason) => {
          if (dead) return;
          flushSync(() => { setReady(false); setTier(null); if (reason === "gaveup") setGone(true); });
          if (reason === "lost" && remounts < MAX_REMOUNTS) {
            remounts++;
            retry = window.setTimeout(() => { if (!dead) setMountKey((k) => k + 1); }, 0);
          } else if (reason === "gaveup") {
            /* after the renderer's own call stack has unwound */
            retry = window.setTimeout(() => { handleRef.current?.destroy(); handleRef.current = null; }, 0);
          }
        },
      });
      if (!h) return;
      handleRef.current = h;
      h.setFocus(live.current.focus);
      h.setPaused(live.current.stop);

      const onResize = () => handleRef.current?.resize();
      window.addEventListener("resize", onResize);
      offs.push(() => window.removeEventListener("resize", onResize));
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(onResize);
        ro.observe(stage);
        ro.observe(canvas);
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
      window.clearTimeout(retry);
      offs.forEach((off) => off());
      handleRef.current?.destroy();
      handleRef.current = null;
      setReady(false);
      setTier(null);
    };
  }, [reduced, mountKey]);

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

  /* A switch: the renderer plays the locked tumble (it jumps only when its loop is stopped). */
  useEffect(() => { handleRef.current?.setAudience(audience); }, [audience]);
  useEffect(() => { handleRef.current?.setFocus(focus); }, [focus]);
  useEffect(() => { handleRef.current?.setPaused(stop); }, [stop]);

  const stageAttrs = {
    [STAGE_ATTR.audience]: audience,
    [STAGE_ATTR.gl]: ready ? "on" : "off",
    [STAGE_ATTR.tier]: ready && tier ? tier : undefined,
  };
  return (
    <>
      <div className={rowClassName}>
        <div ref={stageRef} aria-hidden {...stageAttrs} className={`${s.stage} ${stageClassName}`}>
          {!gone && <canvas key={mountKey} ref={canvasRef} aria-hidden className={s.canvas} data-on={ready ? "true" : "false"} />}
          <EclipsePoster ref={posterRef} audience={audience} />
        </div>
      </div>
      <Agents stage={stageRef} handle={handleRef} gl={ready} mountKey={mountKey} card={card} />
    </>
  );
}
