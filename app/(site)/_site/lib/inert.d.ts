/* React 18 and `inert` (SPEC §4.1).
   Next 14 loads `react/experimental` types, which already declare `inert?: boolean` on every HTML
   element (React 19 semantics), so no augmentation of HTMLAttributes is needed (one that disagreed
   would be silently ignored under skipLibCheck). The RUNTIME is React 18.3, which knows no `inert`
   prop: `inert={true}` is dropped with a warning, while the string "" renders `inert=""`.
   So never write `inert={bool}`: spread `inertProp(on)` from lib/iso.ts, which passes "" or nothing. */
export {};
