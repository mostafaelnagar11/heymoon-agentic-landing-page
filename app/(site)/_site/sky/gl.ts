/* STUB (WP1). The lazy sky chunk's entry: reached only through `await import("./gl")` from Sky.tsx.
   WP1 owns this module and its API. */
export interface SkyHandle { destroy(): void }

/** Starts the WebGL sky in `host`, measuring the apex from `hz`. Returns null to stay on the CSS sky. */
export function startSky(host: HTMLElement, hz: HTMLElement): SkyHandle | null {
  void host; void hz;
  return null;
}
