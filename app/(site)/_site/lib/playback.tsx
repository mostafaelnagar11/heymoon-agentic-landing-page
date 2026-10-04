"use client";
/* The user's global pause (nav PauseToggle), and useActive: the one gate every ambient loop uses
   (rule 2.4.8). `paused` is an external store with a server snapshot of false. sessionStorage is
   read only in the client snapshot, never during the server render, so aria-pressed never
   mismatches on hydration. */
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { readSession, writeSession } from "./session";
import { usePageVisible, useReducedMotionPref } from "./prefs";

const KEY = "hm.site.paused";

let paused: boolean | null = null;          // null until the first client read
const listeners = new Set<() => void>();

/** Non-hook read, for frame loops and tickers. */
export function getPaused(): boolean {
  if (paused === null) paused = typeof window !== "undefined" && readSession(KEY) === "1";
  return paused;
}
export function setPaused(v: boolean): void {
  if (getPaused() === v) return;
  paused = v;
  writeSession(KEY, v ? "1" : null);
  listeners.forEach((cb) => cb());
}
export function subscribePaused(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

interface PlaybackApi { paused: boolean; toggle(): void }
const toggle = () => setPaused(!getPaused());
const PlaybackContext = createContext<PlaybackApi | null>(null);

function usePausedStore(): boolean {
  return useSyncExternalStore(subscribePaused, getPaused, () => false);
}

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const isPaused = usePausedStore();
  const api = useMemo<PlaybackApi>(() => ({ paused: isPaused, toggle }), [isPaused]);
  return <PlaybackContext.Provider value={api}>{children}</PlaybackContext.Provider>;
}

/** `{ paused, toggle }`. Works with or without a PlaybackProvider above it (lab pages). */
export function usePlayback(): PlaybackApi {
  const ctx = useContext(PlaybackContext);
  const isPaused = usePausedStore();
  return ctx ?? { paused: isPaused, toggle };
}

/** True while: the element's IntersectionObserver ratio is ≥ `enter` (default .2, with hysteresis
    down to `leave` = .05), the page is visible, playback is not paused, and motion is not reduced. */
export function useActive(ref: RefObject<Element>, o?: { enter?: number; leave?: number }): boolean {
  const enter = o?.enter ?? 0.2;
  const leave = o?.leave ?? 0.05;
  const [inView, setInView] = useState(false);
  const visible = usePageVisible();
  const { paused: isPaused } = usePlayback();
  const reduced = useReducedMotionPref();

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        const r = e.isIntersecting ? e.intersectionRatio : 0;
        setInView((was) => (r >= enter ? true : r <= leave ? false : was));
      },
      { threshold: [0, leave, enter, Math.min(1, enter + 0.1), 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enter, leave]);

  return inView && visible && !isPaused && !reduced;
}
