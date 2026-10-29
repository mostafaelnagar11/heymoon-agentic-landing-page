"use client";
/* The brand references under the hero (29 Oct review: "There's no brand references, we should show these. It gives
   credibility and shows HM is leading"). Brands only. The nine brands Mostafa chose (29 Oct), served from
   public/site/logos. The source files were white for a dark band; these are recoloured to the page ink and
   trimmed to the mark.
   `h` is each logo's display height, set by eye so the row reads even: a long wordmark (Touché Privé, about 10:1)
   sits low, a square mark (Hype, Right Bite) stands tall. Roughly 40px ÷ aspect^0.45.
   A ticker (Mostafa, 29 Oct: "make it carousel"; proof.module.css has the loop and its gates). The first set is
   the list a screen reader hears; the copies are aria-hidden with empty alts. All eager: the copies sit off to the
   side inside an overflow:hidden strip, where lazy loading would leave them blank as they slide in. */
import { useId, useRef } from "react";
import { COPY } from "../copy";
import { useActive } from "../lib/playback";
import { Section } from "../ui/Section";
import s from "./proof.module.css";

const COPIES = 4; // keep in step with the -25% in proof.module.css

const LOGOS: { name: string; file: string; h: number; ar: number }[] = [
  { name: "Anfasic", file: "anfasic", h: 19, ar: 5.0 },
  { name: "Smallable", file: "smallable", h: 15, ar: 9.8 },
  { name: "Wafeq", file: "wafeq", h: 20, ar: 4.66 },
  { name: "LC50", file: "lc50", h: 27, ar: 2.46 },
  { name: "Golden Scent", file: "golden-scent", h: 23, ar: 3.52 },
  { name: "Hype", file: "hype", h: 34, ar: 1.02 },
  { name: "Touché Privé", file: "touche-prive", h: 14, ar: 10.21 },
  { name: "Right Bite", file: "right-bite", h: 34, ar: 1.16 },
  { name: "YaHala", file: "yahala", h: 22, ar: 3.81 },
];

function Set({ copy }: { copy: number }) {
  const hidden = copy > 0;
  return (
    <ul className={s.set} aria-hidden={hidden || undefined}>
      {LOGOS.map((l) => (
        <li key={l.file} className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- nine small static PNGs; next/image would add its runtime */}
          <img
            src={`/site/logos/${l.file}.png`}
            alt={hidden ? "" : l.name}
            width={Math.round(l.h * l.ar)}
            height={l.h}
            decoding="async"
            draggable={false}
            className="block w-auto max-w-none opacity-56"
            style={{ height: l.h }}
          />
        </li>
      ))}
    </ul>
  );
}

export function LogoStrip() {
  const id = useId();
  const c = COPY.brands.logos;
  const strip = useRef<HTMLDivElement>(null);
  const on = useActive(strip, { enter: 0.1, leave: 0 });
  return (
    <Section slot="logos" surface="paper" audience="brands" labelledBy={id} className="pb-6 pt-16 sm:pb-10 sm:pt-20">
      <div className="mx-auto max-w-text px-[var(--gutter)]">
        <h2 id={id} className="text-center text-[13px] font-medium uppercase tracking-[0.14em] text-ink/56">{c.eyebrow}</h2>
      </div>
      <div ref={strip} className={`${s.marquee} mt-8`} data-on={on ? "" : undefined}>
        <div className={s.track}>
          {Array.from({ length: COPIES }, (_, i) => <Set key={i} copy={i} />)}
        </div>
      </div>
    </Section>
  );
}
