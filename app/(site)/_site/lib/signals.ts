/* Cross-package UI state, as an external store (useSyncExternalStore), so a publisher never
   re-renders a subscriber it does not touch (SPEC §4.3).
   - The server snapshot and the first client render are INITIAL (React 18 throws during SSR
     without a server snapshot, and the root would fall back to client rendering).
   - setSignal replaces the state object and notifies the key's listeners only on a real change.
   - getSnapshot returns the stored reference; it never builds a fresh object. */
import { useSyncExternalStore } from "react";

export interface SignalState {
  heroSwitchVisible: boolean;    // writer: AudienceSwitch placement="hero" (IO visible AND useUncovered; on short screens, top edge below the tuck line)
  closeSwitchVisible: boolean;   // writer: AudienceSwitch placement="close" (IO: in view with its top edge below the tuck line, navTop + navH + 16)
  heroFieldVisible: boolean;     // writer: Field placement="hero" (IO, rootMargin "-64px 0px 0px 0px", AND useUncovered)
  closeFieldVisible: boolean;    // writer: Field placement="close" (IO)
  fieldFocus: "hero" | "close" | null;  // writer: Field. Focus sets its placement; blur clears it only if it still holds it.
  heroFieldHasText: boolean;     // writer: Field placement="hero"
  closeFieldHasText: boolean;    // writer: Field placement="close"
  keyboardOpen: boolean;         // writer: Providers (visualViewport.height < .75 * innerHeight)
  surface: "night" | "paper";    // writer: Nav
  swapCommit: number;            // writer: Swap, after each deferred commit. Reader: Nav (re-observe surfaces)
  work: { state: "idle" | "playing" | "paused" | "done"; overall: number; passed: boolean };  // writer: WP2
  promoOpen: boolean;            // writer: WP7; also cleared by toField()
}

/** The server snapshot and the first client render. Matches what the SSR HTML shows at scrollY 0:
    the hero switch and field visible, so the nav's compact switch and Start render hidden. */
export const INITIAL: SignalState = {
  heroSwitchVisible: true, closeSwitchVisible: false, heroFieldVisible: true, closeFieldVisible: false,
  fieldFocus: null, heroFieldHasText: false, closeFieldHasText: false, keyboardOpen: false,
  surface: "night", swapCommit: 0, work: { state: "idle", overall: 0, passed: false }, promoOpen: false,
};

type Key = keyof SignalState;
let state: SignalState = INITIAL;
const listeners = new Map<Key, Set<() => void>>();
/* One stable subscribe function per key, so useSyncExternalStore never resubscribes on render. */
const subscribers = new Map<Key, (cb: () => void) => () => void>();

function subscribe(k: Key) {
  let fn = subscribers.get(k);
  if (!fn) {
    fn = (cb: () => void) => {
      let set = listeners.get(k);
      if (!set) listeners.set(k, (set = new Set()));
      set.add(cb);
      return () => { set!.delete(cb); };
    };
    subscribers.set(k, fn);
  }
  return fn;
}

export function useSignal<K extends Key>(k: K): SignalState[K] {
  return useSyncExternalStore(subscribe(k), () => state[k], () => INITIAL[k]);
}

export function getSignal<K extends Key>(k: K): SignalState[K] {
  return state[k];
}

export function setSignal<K extends Key>(k: K, v: SignalState[K]): void {
  if (Object.is(state[k], v)) return;
  state = { ...state, [k]: v };
  listeners.get(k)?.forEach((cb) => cb());
}

/** The two fields and their inputs, registered by Field (read by toField and the promo). */
export const els: { heroField: HTMLElement | null; closeField: HTMLElement | null; heroInput: HTMLInputElement | null; closeInput: HTMLInputElement | null } = {
  heroField: null, closeField: null, heroInput: null, closeInput: null,
};
