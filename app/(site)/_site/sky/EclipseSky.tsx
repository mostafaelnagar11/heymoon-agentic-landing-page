"use client";
/* The eclipse hero's sky (Hero.tsx HERO_VARIANT "eclipse"). Server-renders the static twin (an inline SVG
   of the eclipse, ring, bead and translucent glass star) in the stage box: it is the first paint, the
   reduced-motion and no-WebGL render, and what shows while the GL chunk loads. After load plus idle it
   imports ./eclipse (its own chunk), mounts the WebGL canvas over the whole hero (the stage's rect sets
   where the star is drawn) and crossfades it in on the first drawn frame. Gates: reduced motion, Save-Data,
   ?sky=css. Wiring: audience, hero field focus, keystrokes (pulse), a valid submit (launch), the user's
   pause, page visibility, the sheet covering the hero, resize. */
import { useEffect, useRef, useState } from "react";
import { useAudience } from "../lib/audience";
import { useHeroExit } from "../lib/lift";
import { getPaused, subscribePaused } from "../lib/playback";
import { usePageVisible, useReducedMotionPref } from "../lib/prefs";
import { useSignal } from "../lib/signals";
import type { EclipseHandle } from "./eclipse";
import s from "./eclipse.module.css";

type Idle = (cb: () => void, o?: { timeout: number }) => number;

export function EclipseSky({ stageClassName = "" }: { stageClassName?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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

  /* Mount: after load plus idle, never under reduced motion. */
  useEffect(() => {
    const canvas = canvasRef.current, stage = stageRef.current;
    if (!canvas || !stage || reduced) return;
    const query = new URLSearchParams(window.location.search);
    if (query.get("sky") === "css") return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData && query.get("sky") !== "gl") return;

    let dead = false, idleId = 0, timer = 0;
    const offs: (() => void)[] = [];
    const w = window as Window & { requestIdleCallback?: Idle; cancelIdleCallback?: (id: number) => void };

    const start = async () => {
      let mod: typeof import("./eclipse");
      try { mod = await import("./eclipse"); } catch { return; }
      if (dead) return;
      const h = mod.mountEclipse(canvas, stage, {
        audience: live.current.audience,
        onReady: () => { if (!dead) setReady(true); },
        onFail: () => { if (!dead) setReady(false); },
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
    const idle = () => {
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => void start(), { timeout: 1500 });
      else timer = window.setTimeout(() => void start(), 200);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });

    return () => {
      dead = true;
      window.removeEventListener("load", idle);
      if (idleId) w.cancelIdleCallback?.(idleId);
      window.clearTimeout(timer);
      offs.forEach((off) => off());
      handleRef.current?.destroy();
      handleRef.current = null;
      setReady(false);
    };
  }, [reduced]);

  useEffect(() => { handleRef.current?.setAudience(audience); }, [audience]);
  useEffect(() => { handleRef.current?.setFocus(focus); }, [focus]);
  const stop = paused || covered || !visible;
  useEffect(() => { handleRef.current?.setPaused(stop); }, [stop]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`${s.canvas} pointer-events-none absolute inset-0 z-canvas h-full w-full`}
        data-on={ready ? "true" : "false"}
      />
      <div ref={stageRef} aria-hidden data-aud={audience} data-gl={ready ? "on" : "off"} className={`${s.stage} ${stageClassName}`}>
        <svg className={s.still} viewBox="-192 -192 384 384" focusable="false">
        <defs>
          <radialGradient id="ec-corB" cx="0" cy="0" r="192" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#050419"/><stop offset=".511" stopColor="#0a0920"/>
            <stop offset=".517" stopColor="#fff"/><stop offset=".524" stopColor="#ddd3ff"/>
            <stop offset=".55" stopColor="#a68af5" stopOpacity=".55"/><stop offset=".62" stopColor="#7c5ce0" stopOpacity=".26"/>
            <stop offset=".78" stopColor="#4d2fb0" stopOpacity=".1"/><stop offset="1" stopColor="#4d2fb0" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="ec-corC" cx="0" cy="0" r="192" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#070419"/><stop offset=".511" stopColor="#0e0920"/>
            <stop offset=".517" stopColor="#fff"/><stop offset=".524" stopColor="#ffd9ec"/>
            <stop offset=".55" stopColor="#e88bc4" stopOpacity=".5"/><stop offset=".62" stopColor="#a65fed" stopOpacity=".26"/>
            <stop offset=".78" stopColor="#4d2fb0" stopOpacity=".1"/><stop offset="1" stopColor="#4d2fb0" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="ec-flare"><stop offset="0" stopColor="#fff"/><stop offset=".1" stopColor="#f1ebff" stopOpacity=".9"/><stop offset=".35" stopColor="#b9a2ff" stopOpacity=".35"/><stop offset="1" stopColor="#7c5ce0" stopOpacity="0"/></radialGradient>
          <radialGradient id="ec-flareC"><stop offset="0" stopColor="#fff"/><stop offset=".1" stopColor="#ffe9f4" stopOpacity=".9"/><stop offset=".35" stopColor="#f590c4" stopOpacity=".35"/><stop offset="1" stopColor="#f0559d" stopOpacity="0"/></radialGradient>
          <linearGradient id="ec-spk" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0"/><stop offset=".5" stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
          <linearGradient id="ec-bodyB" x1="120" y1="-120" x2="-110" y2="110" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#d8ccff" stopOpacity=".95"/><stop offset=".45" stopColor="#7f66dc" stopOpacity=".75"/><stop offset="1" stopColor="#3a2a90" stopOpacity=".7"/></linearGradient>
          <linearGradient id="ec-bodyC" x1="-110" y1="110" x2="120" y2="-120" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#ffd0e6" stopOpacity=".95"/><stop offset=".45" stopColor="#c46aa6" stopOpacity=".72"/><stop offset="1" stopColor="#4d2a80" stopOpacity=".7"/></linearGradient>
          <linearGradient id="ec-winB" x1="70" y1="-70" x2="-70" y2="70" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#4a3a9a" stopOpacity=".7"/><stop offset="1" stopColor="#120d34" stopOpacity=".8"/></linearGradient>
          <linearGradient id="ec-winC" x1="-70" y1="70" x2="70" y2="-70" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#7a3f80" stopOpacity=".7"/><stop offset="1" stopColor="#1c0f34" stopOpacity=".8"/></linearGradient>
          <linearGradient id="ec-hiL" x1="0" y1="-110" x2="-110" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff" stopOpacity="0"/><stop offset=".45" stopColor="#fff" stopOpacity=".9"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
          <linearGradient id="ec-prism" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0559d"/><stop offset=".5" stopColor="#fff"/><stop offset="1" stopColor="#7c5ce0"/></linearGradient>
          <radialGradient id="ec-core"><stop offset="0" stopColor="#fff"/><stop offset=".12" stopColor="#e6dcff" stopOpacity=".9"/><stop offset=".45" stopColor="#9b7bf0" stopOpacity=".3"/><stop offset="1" stopColor="#7c5ce0" stopOpacity="0"/></radialGradient>
          <clipPath id="ec-starClip"><path d="M0-134A195.1 195.1 0 0 0 134 0A195.1 195.1 0 0 0 0 134A195.1 195.1 0 0 0-134 0A195.1 195.1 0 0 0 0-134Z"/></clipPath>
          <clipPath id="ec-winClip"><path d="M0-69.1A221.9 221.9 0 0 0 69.1 0A221.9 221.9 0 0 0 0 69.1A221.9 221.9 0 0 0-69.1 0A221.9 221.9 0 0 0 0-69.1Z"/></clipPath>
          <filter id="ec-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>
          <filter id="ec-blur4" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5"/></filter>
          <filter id="ec-blur8" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>
        <circle className={s.cb} r="192" fill="url(#ec-corB)"/>
        <circle className={s.cc} r="192" fill="url(#ec-corC)"/>
        <circle r="99.3" fill="none" stroke="#fff" strokeWidth="1.1" opacity=".85"/>
        <g className={s.bead}>
          <g transform="translate(69.2 -71.2)">
            <circle className={s.cb} r="70" fill="url(#ec-flare)" opacity=".55" filter="url(#ec-blur8)"/>
            <circle className={s.cc} r="70" fill="url(#ec-flareC)" opacity=".55" filter="url(#ec-blur8)"/>
            <rect x="-70" y="-.55" width="140" height="1.1" fill="url(#ec-spk)" opacity=".8"/>
            <rect x="-70" y="-.55" width="140" height="1.1" fill="url(#ec-spk)" opacity=".8" transform="rotate(90)"/>
            <circle r="16" fill="url(#ec-flare)"/><circle r="3.4" fill="#fff"/>
          </g>
          <g fill="#ece6ff" opacity=".5"><circle r="1.6" cx="98.8" cy="9.7"/><circle r="1.6" cx="54.1" cy="83.3"/><circle r="1.6" cx="-31.4" cy="94.2"/><circle r="1.6" cx="-93.2" cy="34.2"/><circle r="1.6" cx="-84.8" cy="-51.6"/><circle r="1.6" cx="-12.6" cy="-98.5"/></g>
        </g>
        <g>
          <path d="M0-134A195.1 195.1 0 0 0 134 0A195.1 195.1 0 0 0 0 134A195.1 195.1 0 0 0-134 0A195.1 195.1 0 0 0 0-134Z" fill="#2a2068" fillOpacity=".55"/>
          <g clipPath="url(#ec-starClip)">
            <path className={s.cb} d="M0-134A195.1 195.1 0 0 0 134 0A195.1 195.1 0 0 0 0 134A195.1 195.1 0 0 0-134 0A195.1 195.1 0 0 0 0-134Z" fill="none" stroke="url(#ec-bodyB)" strokeWidth="30" strokeOpacity=".8" filter="url(#ec-blur4)"/>
            <path className={s.cc} d="M0-134A195.1 195.1 0 0 0 134 0A195.1 195.1 0 0 0 0 134A195.1 195.1 0 0 0-134 0A195.1 195.1 0 0 0 0-134Z" fill="none" stroke="url(#ec-bodyC)" strokeWidth="30" strokeOpacity=".8" filter="url(#ec-blur4)"/>
            <rect x="-220" y="-14" width="440" height="28" fill="#fff" opacity=".055" transform="rotate(-37) translate(0 -26)" filter="url(#ec-soft)"/>
            <rect x="-220" y="-1.2" width="440" height="2.4" fill="#fff" opacity=".07" transform="rotate(-37) translate(0 -2)"/>
          </g>
          <path d="M0-126A198 198 0 0 1-126 0" fill="none" stroke="url(#ec-hiL)" strokeWidth="1.8" filter="url(#ec-soft)"/>
          <path d="M0-122A199 199 0 0 0 122 0" fill="none" stroke="#efe9ff" strokeOpacity=".5" strokeWidth="2.2" filter="url(#ec-soft)"/>
          <path d="M0 124A198.5 198.5 0 0 0-124 0" fill="none" stroke="url(#ec-prism)" strokeOpacity=".45" strokeWidth="1.3" filter="url(#ec-soft)"/>
          <path d="M0-134A195.1 195.1 0 0 0 134 0A195.1 195.1 0 0 0 0 134A195.1 195.1 0 0 0-134 0A195.1 195.1 0 0 0 0-134Z" fill="none" stroke="#f6f2ff" strokeOpacity=".55" strokeWidth=".9"/>
          <circle r="34" fill="url(#ec-core)"/>
          <rect x="-46" y="-.5" width="92" height="1" fill="url(#ec-spk)" opacity=".9"/>
          <rect x="-46" y="-.5" width="92" height="1" fill="url(#ec-spk)" opacity=".9" transform="rotate(90)"/>
        </g>
              </svg>
      </div>
    </>
  );
}
