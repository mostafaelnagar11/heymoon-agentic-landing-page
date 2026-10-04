import { useEffect, useLayoutEffect } from "react";

/** useLayoutEffect in the browser, useEffect on the server (no SSR warning). */
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** React 18-safe `inert` (see lib/inert.d.ts): `{...inertProp(on)}` renders `inert=""` when on and
    nothing when off. The cast satisfies the `inert?: boolean` type from react/experimental. */
export const inertProp = (on: boolean): { inert?: boolean } =>
  (on ? { inert: "" as unknown as boolean } : {});
