"use client";
/* The footer (SPEC §5.6, B13): the planet's ground continued under the close. One row with the
   wordmark and the site links, then the giant dotted wordmark cropped by the page bottom. It fades
   with the dawn (dawn-fade); the Landing root behind it turns #F6F4FC (§1.8). No copyright line
   (ruling 30). Links to /brands and /creators are plain anchors with useAudienceLink (rule 2.4.11):
   a plain click switches in place, or scrolls to the top when it is already the audience. */
import { useRef } from "react";
import type { FooterProps } from "../contracts";
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { useAudience, useAudienceLink } from "../lib/audience";
import { Wordmark } from "../ui/Wordmark";
import { GiantWordmark } from "./GiantWordmark";
import s from "./close.module.css";

const LINK = `${s.link} rounded-[4px] text-micro text-white/72 hover:text-white aria-[current=page]:text-white/92`;

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

  return (
    <footer ref={ref} data-surface="night" className="dawn-fade relative bg-night-0 text-white">
      <div className="mx-auto max-w-text px-[var(--gutter)]">
        <div className="flex h-16 items-center justify-between gap-6 border-t border-white/8">
          <a {...home} className="-mx-1 rounded-[6px] px-1 py-1">
            <Wordmark size="sm" tone="night" />
          </a>
          <nav aria-label={COPY.shared.footerNav} className={s.links}>
            <AudienceLink to="brands" />
            <AudienceLink to="creators" />
            <a href={COPY[audience].nav.dashboardHref} className={LINK}>{COPY.shared.footerLinks.dashboard}</a>
          </nav>
        </div>
      </div>
      <GiantWordmark target={ref} />
    </footer>
  );
}
