"use client";
/* Connects (SPEC §5.6, B11): the last row on the sheet. Text on the start side, the marks on the end
   side, one hairline above, no box. Brands: the four store marks from public/platforms, grey, at
   their optical heights. Creators: the two platform squares, bound to DEMO.creators.platforms.
   Plays once on entry (the hairline draws, the H2's words blur in, the rest rises); static by
   default, so no-JS and in-view-at-mount show the final state (rule 2.4.7). */
import { useRef, type CSSProperties } from "react";
import type { ConnectsProps } from "../contracts";
import type { Platform } from "../data/types";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { Section } from "../ui/Section";
import { WordReveal } from "../ui/WordReveal";
import { useArmed } from "../ui/useArmed";
import { InstagramLogo, TiktokLogo } from "../ui/icons";
import s from "./close.module.css";

/* Natural size 96px tall, transparent PNGs. Heights are optical (§5.6): the two marks with a tall
   icon beside a short word sit taller than the two long wordmarks. Width is set exactly from the
   natural aspect, so nothing reflows when the lazy image arrives. */
const STORES = [
  { key: "salla", name: "Salla", w: 228, h: 34 },
  { key: "zid", name: "Zid", w: 163, h: 32 },
  { key: "shopify", name: "Shopify", w: 334, h: 24 },
  { key: "magento", name: "Magento", w: 329, h: 24 },
] as const;
const NATURAL_H = 96;

const PLATFORM_ICON: Record<Platform, typeof InstagramLogo> = { Instagram: InstagramLogo, TikTok: TiktokLogo };

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

function StoreMarks() {
  return (
    <ul className={s.marks} data-kind="stores">
      {STORES.map((m, i) => (
        <li key={m.key} className={`${s.mark} ${s.rise}`} style={rise(i + 1)}>
          {/* A plain, lazy <img>: next/image would add its runtime to this chunk for four static PNGs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/platforms/${m.key}.png`}
            alt={m.name}
            loading="lazy"
            decoding="async"
            width={Math.round((m.w * m.h) / NATURAL_H)}
            height={m.h}
            className={`${s.store} block`}
            style={{ width: (m.w * m.h) / NATURAL_H, height: m.h }}
          />
        </li>
      ))}
    </ul>
  );
}

function PlatformMarks() {
  return (
    <ul className={s.marks} data-kind="platforms">
      {DEMO.creators.platforms.map((p, i) => {
        const Icon = PLATFORM_ICON[p];
        return (
          <li key={p} className={`${s.mark} ${s.rise}`} style={rise(i + 1)}>
            <span role="img" aria-label={p} className={s.square}>
              <Icon size={22} weight="regular" aria-hidden />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Connects({ audience }: ConnectsProps) {
  const c = COPY[audience].connects;
  const rowRef = useRef<HTMLDivElement>(null);
  useArmed(rowRef, 0.3);
  return (
    <Section slot="connects" surface="paper" audience={audience} cv labelledBy="connects-h2" className="py-16 sm:py-24">
      <div className="mx-auto max-w-text px-[var(--gutter)]">
        <div ref={rowRef} className={s.row}>
          <span aria-hidden className={s.rule} />
          <div className={s.copy}>
            <WordReveal as="h2" id="connects-h2" text={c.h2} className={`${s.connectsH2} text-h2 text-ink`} />
            <p className={`${s.rise} ${s.body} mt-3 text-body text-ink/72`} style={rise(0)}>{c.body}</p>
          </div>
          {audience === "brands" ? <StoreMarks /> : <PlatformMarks />}
        </div>
      </div>
    </Section>
  );
}
