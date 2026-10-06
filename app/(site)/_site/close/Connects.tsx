"use client";
/* Connects (SPEC §5.6, B11): the last row on the sheet. Text on the start side, the marks on the end
   side, one hairline above, no box. Brands: the four store marks from public/platforms, grey, at
   their optical heights, then a +6 circle. Creators: the platform squares, DEMO.creators.platforms then
   MORE_PLATFORMS.
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
import { FacebookLogo, InstagramLogo, SnapchatLogo, TiktokLogo, XLogo } from "../ui/icons";
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
/* The platforms beyond these four (Mostafa, 6 Oct: "add +6 in a circle after magento"). */
const MORE = 6;

const PLATFORM_ICON: Record<Platform, typeof InstagramLogo> = { Instagram: InstagramLogo, TikTok: TiktokLogo };
/* After the two the demo's live offers deliver on (DEMO.creators.platforms), on Mostafa's call (6 Oct: "add snapchat
   facebook and x"). */
const MORE_PLATFORMS = [
  { name: "Snapchat", Icon: SnapchatLogo },
  { name: "Facebook", Icon: FacebookLogo },
  { name: "X", Icon: XLogo },
] as const;

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
      {/* The +6 takes the marks' own tone: .store's filter and opacity over ink text and an ink ring. The ring is
          inline because the CSS budget has no room for a border-current rule (measure.cjs, css). */}
      <li className={`${s.mark} ${s.rise}`} style={rise(STORES.length + 1)}>
        <span
          role="img"
          aria-label={`and ${MORE} more store platforms`}
          className={`${s.store} grid h-9 w-9 select-none place-items-center rounded-full text-small font-semibold leading-none text-ink`}
          style={{ border: "1.5px solid currentColor" }}
        >
          +{MORE}
        </span>
      </li>
    </ul>
  );
}

function PlatformMarks() {
  return (
    <ul className={s.marks} data-kind="platforms">
      {[...DEMO.creators.platforms.map((p) => ({ name: p, Icon: PLATFORM_ICON[p] })), ...MORE_PLATFORMS].map(({ name, Icon }, i) => (
        <li key={name} className={`${s.mark} ${s.rise}`} style={rise(i + 1)}>
          <span role="img" aria-label={name} className={s.square}>
            <Icon size={22} weight="regular" aria-hidden />
          </span>
        </li>
      ))}
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
