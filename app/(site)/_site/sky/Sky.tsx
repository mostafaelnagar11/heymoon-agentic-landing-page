"use client";
/* The sky canvas host (SPEC §5.1.6). The only static import of the sky: it server-renders an empty host
   <div> (no canvas, no shader), and after `load` plus idle it imports the WebGL chunk (./gl), which creates
   a fresh canvas inside this host. Until then, and whenever the canvas is gone, the CSS horizon is the sky.
   Gates: reduced motion, Save-Data, the user's pause (it starts on resume), and ?sky=css. ?sky=gl skips the
   gates (WebGL must still exist), ?skydebug logs. */
import { useEffect, useRef, type RefObject } from "react";
import { useWorld } from "../lib/audience";
import { useHeroExit } from "../lib/lift";
import { getPaused, subscribePaused } from "../lib/playback";
import { useReducedMotionPref } from "../lib/prefs";
import type { SkyHandle } from "./gl";

type Idle = (cb: () => void, o?: { timeout: number }) => number;

export function Sky({ hzRef }: { hzRef: RefObject<HTMLDivElement> }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { world, dir, focus, dawn } = useWorld();
  const heroExit = useHeroExit();
  const reduced = useReducedMotionPref();

  useEffect(() => {
    const host = hostRef.current, hz = hzRef.current;
    if (!host || !hz) return;
    const query = new URLSearchParams(window.location.search);
    const mode = query.get("sky");
    if (mode === "css") return;
    const force = mode === "gl";
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!force && (reduced || saveData)) return;

    let handle: SkyHandle | null = null;
    let dead = false;
    let idleId = 0, timer = 0;
    let offPaused: (() => void) | null = null;
    const w = window as Window & { requestIdleCallback?: Idle; cancelIdleCallback?: (id: number) => void };

    const start = async () => {
      const { startSky } = await import("./gl");
      if (dead) return;
      handle = startSky(host, hz, { world, dir, focus, dawn, heroExit, force, debug: query.has("skydebug") });
    };
    /* The user's pause is a gate too: never start while paused, start on resume. */
    const whenUnpaused = () => {
      if (force || !getPaused()) { void start(); return; }
      offPaused = subscribePaused(() => {
        if (getPaused()) return;
        offPaused?.(); offPaused = null;
        void start();
      });
    };
    const idle = () => {
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(whenUnpaused, { timeout: 2000 });
      else timer = window.setTimeout(whenUnpaused, 200);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });

    return () => {
      dead = true;
      window.removeEventListener("load", idle);
      if (idleId) w.cancelIdleCallback?.(idleId);
      window.clearTimeout(timer);
      offPaused?.();
      handle?.destroy();
    };
  }, [reduced, hzRef, world, dir, focus, dawn, heroExit]);

  return <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 z-canvas" />;
}
