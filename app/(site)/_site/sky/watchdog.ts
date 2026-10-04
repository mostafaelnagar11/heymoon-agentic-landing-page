/* STUB (WP1). The frame-time watchdog (§5.1.6): DPR steps, the iOS 30 fps cap, give-up. */
export interface Watchdog { sample(deltaMs: number): void; reset(): void }

export function createWatchdog(): Watchdog {
  return { sample() {}, reset() {} };
}
