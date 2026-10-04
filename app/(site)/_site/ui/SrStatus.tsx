"use client";
/* The polite live region. select() announces the audience here (SPEC §4.3 step 6). */
import { useSyncExternalStore } from "react";

let text = "";
const listeners = new Set<() => void>();

/** Set the polite status text. */
export function announce(next: string): void {
  if (next === text) return;
  text = next;
  listeners.forEach((cb) => cb());
}
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };

export function SrStatus() {
  const value = useSyncExternalStore(subscribe, () => text, () => "");
  return <div className="sr-only" role="status" aria-live="polite">{value}</div>;
}
