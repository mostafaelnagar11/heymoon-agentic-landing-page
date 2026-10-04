"use client";
/* STUB (WP1). The only static import of the sky: it server-renders an empty host <div> with no
   canvas; WP1 adds the lazy `import("./gl")` after load + idle (§5.1.6). */
export function Sky() {
  return <div data-stub="Sky" aria-hidden className="pointer-events-none absolute inset-0 z-canvas" />;
}
