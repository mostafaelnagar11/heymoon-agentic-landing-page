"use client";
/* The eclipse hero's poster (HERO-V2 V3, §8.3): a frame of the real WebGL glass at its resting pose (REST in
   eclipse-api.ts), one per audience, captured at 2x by scripts/hero-poster.cjs into public/hero/. It is the
   first paint (in the server HTML, inside the stage box), and the reduced-motion, no-JS, no-WebGL, Save-Data,
   ?sky=css and context-loss render. EclipseSky renders it inside .stage; nothing here starts or stops GL.

   Geometry: the root is the poster box, 2 S square centred on the stage (inset −50%, POSTER_BOX). The file's
   pixels inside 0.98 S are the renderer's raw drawing buffer on exact night, and its corners are transparent,
   so the box edge never shows on the hero's --night-1.

   Two stacked layers, brands and creators, each a <picture> with posterSources(a) (the band by media query, AVIF
   then WebP) and a 2D <canvas>. The first render's audience has its sources in the HTML at fetchpriority high.
   The other layer gets its sources only after the window load event or the first switch (whichever comes
   first), at low priority; without JS a switch navigates and the other route serves its own poster.

   How each band paints (POSTER_PAINT, W2-3 "the H1 stays the LCP"): on desktop (≥ 768) the <img> itself, which is
   the LCP element there. On phones (PHONE_MQ) the layer's <canvas>, painted from the <img> once it has decoded;
   the <img> is then 1 × 1 px at opacity 0, so neither is an LCP candidate and the H1 is. The inline script right
   after the root runs while the HTML is parsed, before the first paint: it marks the root (data-paint="canvas",
   which is what shrinks the <img>) and paints the first layer when its image arrives. After hydration this
   component paints every layer whose image has decoded (the other one once armed). Without JS there is no mark,
   so the <img> shows at full size.

   Decoding: the first layer is decoding="sync", so the poster is in the same frame as the text around it. With
   "async" Chrome painted about 400 ms of frames with an empty stage after the first paint (checker-imaging). The
   other layer counts as loaded only once img.decode() has resolved and, on phones, its canvas is painted.

   data-shown is the audience on screen. It starts as the first render's (so the server HTML is right) and moves
   on a switch only once the target layer is loaded and painted, so the stage is never empty. CSS
   (poster.module.css) crossfades the layers and hides the whole root while the stage says data-gl="on". */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from "react";
import type { Audience, PosterBand, PosterFormat } from "./eclipse-api";
import s from "./poster.module.css";

/* ── First-load copies of the contract (sky/eclipse-api.ts) ──
   This file and EclipseSky are the only first-load modules that need the contract, and they need only these. They
   must not import it at runtime: webpack keeps ONE copy of a module, carrying every export that any chunk uses, so
   an import here put the renderer's and the agents' helpers (2.9 kB gz on 5 Oct) on the first load. The values are
   the contract's, verbatim; dev builds compare them with it on every page load (below) and log an error on drift.
   (Request to the lead, docs/redesign/wp/ECLIPSE-W2-STAGE.md: a first-load base module the contract re-exports.) */
/** eclipse-api PHONE_MQ */
export const PHONE_MQ = "(max-width: 767px)";
/** eclipse-api POSTER_FADE_MS */
export const POSTER_FADE_MS = 240;
/** eclipse-api STAGE_ATTR */
export const STAGE_ATTR = { audience: "data-aud", gl: "data-gl", tier: "data-tier" } as const;
/** eclipse-api MAX_REMOUNTS */
export const MAX_REMOUNTS = 2;
/** eclipse-api posterWidth: POSTER_BOX (2) · POSTER.stage[band] (240 / 560) · POSTER.dpr (2). */
const posterWidth = (band: PosterBand): number => (band === "phone" ? 960 : 2240);
const posterSrc = (a: Audience, band: PosterBand, f: PosterFormat): string => `/hero/poster-${a}-${posterWidth(band)}.${f}`;
/** eclipse-api posterSources: phone AVIF, desktop AVIF, phone WebP, then <img src> = desktop WebP. */
function posterSources(a: Audience): { sources: { media?: string; type: string; srcSet: string }[]; fallback: string } {
  return {
    sources: [
      { media: PHONE_MQ, type: "image/avif", srcSet: posterSrc(a, "phone", "avif") },
      { type: "image/avif", srcSet: posterSrc(a, "desktop", "avif") },
      { media: PHONE_MQ, type: "image/webp", srcSet: posterSrc(a, "phone", "webp") },
    ],
    fallback: posterSrc(a, "desktop", "webp"),
  };
}
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  import("./eclipse-api").then((api) => {
    const auds: Audience[] = ["brands", "creators"], bands: PosterBand[] = ["phone", "desktop"];
    const pack = (x: { PHONE_MQ: string; POSTER_FADE_MS: number; STAGE_ATTR: object; MAX_REMOUNTS: number }, src: typeof posterSources, w: typeof posterWidth) =>
      JSON.stringify([x.PHONE_MQ, x.POSTER_FADE_MS, x.STAGE_ATTR, x.MAX_REMOUNTS, auds.map(src), bands.map(w)]);
    if (pack(api, api.posterSources, api.posterWidth) !== pack({ PHONE_MQ, POSTER_FADE_MS, STAGE_ATTR, MAX_REMOUNTS }, posterSources, posterWidth)) {
      console.error("EclipsePoster: the first-load copies differ from sky/eclipse-api.ts");
    }
  }, () => {});
}

const AUDIENCES: readonly Audience[] = ["brands", "creators"];
/** The intrinsic size every layer declares (the desktop file; CSS sizes the img to the box). */
const SIDE = posterWidth("desktop");
/** The phone canvas's bitmap: the phone file's own size (2 S at 2x). */
const PAINT = posterWidth("phone");
const isLoaded = (img: HTMLImageElement | null | undefined): img is HTMLImageElement => !!img && img.complete && img.naturalWidth > 0;

/* The pre-hydration painter (W2-3). Runs once, during parsing, right after the root it marks. */
const SCRIPT = `(function(){var r=document.currentScript.previousElementSibling;r.setAttribute("data-paint","canvas");if(!matchMedia(${JSON.stringify(PHONE_MQ)}).matches)return;var l=r.querySelector('[data-a="'+r.getAttribute("data-shown")+'"]'),i=l.querySelector("img"),c=l.querySelector("canvas"),p=function(){c.getContext("2d").drawImage(i,0,0,${PAINT},${PAINT})};i.complete&&i.naturalWidth?p():i.addEventListener("load",p)})()`;

export const EclipsePoster = forwardRef<HTMLDivElement, { audience: Audience }>(function EclipsePoster({ audience }, ref) {
  const [first] = useState(() => audience);
  const [armed, setArmed] = useState(false);
  const [loaded, setLoaded] = useState<Readonly<Record<Audience, boolean>>>({ brands: false, creators: false });
  const [shown, setShown] = useState(first);
  const rootRef = useRef<HTMLDivElement>(null);
  const imgs = useRef<Partial<Record<Audience, HTMLImageElement | null>>>({});
  const canvases = useRef<Partial<Record<Audience, HTMLCanvasElement | null>>>({});
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

  /* Phones: copy the decoded image into the layer's canvas (the same pixels the <img> would show). */
  const paint = useCallback((a: Audience) => {
    const img = imgs.current[a], c = canvases.current[a];
    if (!isLoaded(img) || !c || !window.matchMedia(PHONE_MQ).matches) return;
    try { c.getContext("2d")?.drawImage(img, 0, 0, PAINT, PAINT); } catch { /* a broken image: the night shows */ }
  }, []);

  /* Loaded means decoded (and painted on phones): a layer that shows before its pixels are ready would flash
     the night. */
  const mark = useCallback((a: Audience) => {
    const img = imgs.current[a];
    if (!isLoaded(img)) return;
    const set = () => { paint(a); setLoaded((l) => (l[a] ? l : { ...l, [a]: true })); };
    img.decode().then(set, set);
  }, [paint]);

  /* The mark the inline script set (again, in case this root was rendered on the client), and a repaint when
     the viewport crosses into the phone band (the <picture> then loads the phone file and fires load again). */
  useEffect(() => {
    rootRef.current?.setAttribute("data-paint", "canvas");
    const mq = window.matchMedia(PHONE_MQ);
    const on = () => AUDIENCES.forEach(paint);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [paint]);

  /* The other layer's sources: after the window load event, or at once on the first switch. */
  useEffect(() => {
    if (armed) return;
    if (audience !== first || document.readyState === "complete") { setArmed(true); return; }
    const arm = () => setArmed(true);
    window.addEventListener("load", arm, { once: true });
    return () => window.removeEventListener("load", arm);
  }, [armed, audience, first]);

  /* An image that finished before hydration (or from the cache) fired its load event before React listened. */
  useEffect(() => {
    for (const a of AUDIENCES) if (isLoaded(imgs.current[a])) mark(a);
  }, [armed, mark]);

  /* The stage is never empty: the target audience shows only once its image is there. */
  useEffect(() => {
    if (loaded[audience]) setShown(audience);
  }, [audience, loaded]);

  return (
    <>
      <div
        ref={rootRef}
        aria-hidden
        data-shown={shown}
        className={s.root}
        style={{ "--fade": `${POSTER_FADE_MS}ms` } as CSSProperties}
        suppressHydrationWarning
      >
        {AUDIENCES.map((a) => {
          const live = a === first || armed;
          const { sources, fallback } = posterSources(a);
          return (
            <div key={a} data-a={a} className={s.layer}>
              <picture>
                {live && sources.map((x) => <source key={x.srcSet} media={x.media} type={x.type} srcSet={x.srcSet} />)}
                {/* eslint-disable-next-line @next/next/no-img-element -- a plain <picture>: AVIF + WebP by media band, visible to the preload scanner, no optimizer */}
                <img
                  ref={(el) => { imgs.current[a] = el; }}
                  src={live ? fallback : undefined}
                  width={SIDE}
                  height={SIDE}
                  alt=""
                  decoding={a === first ? "sync" : "async"}
                  loading="eager"
                  fetchPriority={a === first ? "high" : "low"}
                  draggable={false}
                  onLoad={() => mark(a)}
                />
              </picture>
              <canvas ref={(el) => { canvases.current[a] = el; }} width={PAINT} height={PAINT} className={s.paint} />
            </div>
          );
        })}
      </div>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  );
});
