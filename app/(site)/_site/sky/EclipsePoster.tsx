"use client";
/* The eclipse hero's poster (HERO-V2 V3, §8.3): a frame of the real WebGL glass at its resting pose (REST in
   eclipse-api.ts), one per audience, captured at 2x by scripts/hero-poster.cjs into public/hero/. It is the
   first paint (in the server HTML, inside the stage box), and the reduced-motion, no-JS, no-WebGL, Save-Data,
   ?sky=css and context-loss render. EclipseSky renders it inside .stage; nothing here starts or stops GL.

   Geometry: the root is the poster box, 2 S square centred on the stage (inset −50%, POSTER_BOX). The file's
   pixels inside 0.98 S are the renderer's raw drawing buffer on exact night, and its corners are transparent,
   so the box edge never shows on the hero's --night-1.

   Two stacked <picture> layers, brands and creators, each with posterSources(a) (the band by media query, AVIF
   then WebP). The first render's audience has its sources in the HTML at fetchpriority high. The other layer
   gets its sources only after the window load event or the first switch (whichever comes first), at low
   priority; without JS a switch navigates and the other route serves its own poster.

   Decoding: the first layer is decoding="sync", so the poster is in the same frame as the text around it. With
   "async" Chrome painted about 400 ms of frames with an empty stage after the first paint (checker-imaging; the
   capture is in docs/redesign/wp/ECLIPSE-STAGE.md). The other layer counts as loaded only once img.decode() has
   resolved.

   data-shown is the audience on screen. It starts as the first render's (so the server HTML is right) and moves
   on a switch only once the target layer's image is loaded and decoded, so the stage is never empty. CSS
   (poster.module.css) crossfades the layers and hides the whole root while the stage says data-gl="on". */
import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { POSTER_FADE_MS, posterSources, posterWidth, type Audience } from "./eclipse-api";
import s from "./poster.module.css";

const AUDIENCES: readonly Audience[] = ["brands", "creators"];
/** The intrinsic size every layer declares (the desktop file; CSS sizes the img to the box). */
const SIDE = posterWidth("desktop");
const isLoaded = (img: HTMLImageElement | null | undefined): img is HTMLImageElement => !!img && img.complete && img.naturalWidth > 0;

export const EclipsePoster = forwardRef<HTMLDivElement, { audience: Audience }>(function EclipsePoster({ audience }, ref) {
  const [first] = useState(() => audience);
  const [armed, setArmed] = useState(false);
  const [loaded, setLoaded] = useState<Readonly<Record<Audience, boolean>>>({ brands: false, creators: false });
  const [shown, setShown] = useState(first);
  const imgs = useRef<Partial<Record<Audience, HTMLImageElement | null>>>({});

  /* Loaded means decoded: a layer that shows before its pixels are ready would flash the night. */
  const mark = useCallback((a: Audience) => {
    const img = imgs.current[a];
    if (!isLoaded(img)) return;
    const set = () => setLoaded((l) => (l[a] ? l : { ...l, [a]: true }));
    img.decode().then(set, set);
  }, []);

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
    <div
      ref={ref}
      aria-hidden
      data-shown={shown}
      className={s.root}
      style={{ "--fade": `${POSTER_FADE_MS}ms` } as CSSProperties}
    >
      {AUDIENCES.map((a) => {
        const live = a === first || armed;
        const { sources, fallback } = posterSources(a);
        return (
          <picture key={a} data-a={a} className={s.layer}>
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
        );
      })}
    </div>
  );
});
