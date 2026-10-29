"use client";
/* The footer (SPEC §5.6, B13): the planet's ground continued under the close. The details block (29 Oct
   review: "can we have some company details, about us... it feels a bit scammy"): what HeyMoon is, contact,
   and the legal pages. HeyMoon only (Mostafa, 29 Oct). Then one row with the site
   links, then the giant dotted wordmark cropped by the page bottom. It fades with the dawn (dawn-fade); the
   Landing root behind it turns #F6F4FC (§1.8). No copyright line (ruling 30; check:site fails on "©").
   Links to /brands and /creators are plain anchors with useAudienceLink (rule 2.4.11): a plain click
   switches in place, or scrolls to the top when it is already the audience. */
import { useRef } from "react";
import { openLogin } from "../lib/login";
import type { FooterProps } from "../contracts";
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { useAudience, useAudienceLink } from "../lib/audience";
import { Wordmark } from "../ui/Wordmark";
import { GiantWordmark } from "./GiantWordmark";
import s from "./close.module.css";

const LINK = `${s.link} rounded-[4px] text-micro text-white/72 hover:text-white aria-[current=page]:text-white/92`;
const COL_LINK = `${s.link} rounded-[4px] text-white/72 hover:text-white`;
const HEAD = "text-[12px] font-medium uppercase tracking-[0.14em] text-white/56";

function AudienceLink({ to }: { to: Audience }) {
  const { audience } = useAudience();
  const link = useAudienceLink(to, "nav");
  return (
    <a {...link} aria-current={to === audience ? "page" : undefined} className={LINK}>
      {COPY.shared.footerLinks[to]}
    </a>
  );
}

export function Footer({}: FooterProps) {
  const { audience } = useAudience();
  const ref = useRef<HTMLElement>(null);
  const home = useAudienceLink(audience, "nav");
  const f = COPY.shared.footer;

  return (
    <footer ref={ref} data-surface="night" className="dawn-fade relative bg-night-0 text-white">
      <div className="mx-auto max-w-text px-[var(--gutter)]">
        <div className="grid gap-10 border-t border-white/8 py-14 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr] lg:gap-12">
          <div className="max-w-[40ch]">
            <a {...home} className="-mx-1 inline-block rounded-[6px] px-1 py-1">
              <Wordmark size="sm" tone="night" />
            </a>
            <p className="mt-4 text-[14px] leading-6 text-white/64">{f.about}</p>
          </div>
          <div>
            <h2 className={HEAD}>{f.contactLabel}</h2>
            <ul className="mt-4 space-y-2 text-[14px] leading-6">
              <li><a href={f.phoneHref} className={COL_LINK} dir="ltr">{f.phone}</a></li>
            </ul>
          </div>
          <div>
            <h2 className={HEAD}>{f.legalLabel}</h2>
            <ul className="mt-4 space-y-2 text-[14px] leading-6">
              <li><a href="/terms" className={COL_LINK}>{f.terms}</a></li>
              <li><a href="/privacy" className={COL_LINK}>{f.privacy}</a></li>
            </ul>
          </div>
        </div>
        <div className="flex min-h-16 flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/8 py-4 sm:justify-end">
          <nav aria-label={COPY.shared.footerNav} className={s.links}>
            <AudienceLink to="brands" />
            <AudienceLink to="creators" />
            <a href={COPY[audience].nav.dashboardHref} onClick={(e) => { e.preventDefault(); openLogin(e.currentTarget); }} aria-haspopup="dialog" className={LINK}>{COPY.shared.footerLinks.dashboard}</a>
          </nav>
        </div>
      </div>
      <GiantWordmark target={ref} />
    </footer>
  );
}
