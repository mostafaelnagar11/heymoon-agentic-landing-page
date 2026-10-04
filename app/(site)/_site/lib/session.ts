/* sessionStorage, wrapped: it throws in some private windows and when site data is blocked.
   Every read and write fails closed (null / no-op). */

export function readSession(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string | null): void {
  try {
    if (typeof window === "undefined") return;
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    /* storage blocked: nothing persists, nothing breaks */
  }
}
