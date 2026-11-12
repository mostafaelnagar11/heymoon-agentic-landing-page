"use client";

/* The pieces the campaign's Ads tab is drawn from (12 Nov: "the ads page is the weakest screen in our design").

   A draft is a piece of social video, so it is shown as one: on a phone, in the platform's own frame, with the
   creator, the caption, the paid-partnership label and the shop bar where a viewer would meet them. A review of
   creative is a review of what the audience will see, and a 4:5 crop beside a form was not that.

   HeyMoon's call is drawn like the eligibility result in the conversation: a seal, the call as the headline, and every
   check signed by the agent that ran it. Approve is green, approve-with-a-note is the brand's purple, and a hold is
   amber, because a hold is "not yet", not a failure. */

import {
  ChatCircle, CheckCircle, Heart, InstagramLogo, PaperPlaneTilt, SealCheck, SealWarning, ShoppingBag, TiktokLogo,
  Warning, YoutubeLogo,
} from "@phosphor-icons/react";
import type { AdRecord } from "../../lib/agent/types";
import { Avatar } from "../ui";

export const PLATFORM_ICON = { Instagram: InstagramLogo, TikTok: TiktokLogo, YouTube: YoutubeLogo };

export const CALL = {
  approve: {
    word: "Approve",
    chip: "Approve",
    ink: "text-good-deep",
    chipSkin: "bg-good/10 text-good-deep",
    dot: "bg-good",
    tint: "bg-[linear-gradient(140deg,rgba(37,163,51,0.13),rgba(37,163,51,0.03)_58%,rgba(255,255,255,0.65))] ring-good/20",
    glow: "bg-good/20",
    seal: "bg-[linear-gradient(150deg,#3FC451,#1C7A26)] shadow-[0_14px_28px_-14px_rgba(28,122,38,0.8)]",
    Icon: SealCheck,
  },
  "approve-with-note": {
    word: "Approve, with a note",
    chip: "With a note",
    ink: "text-brand",
    chipSkin: "bg-brand/10 text-brand",
    dot: "bg-brand",
    tint: "bg-[linear-gradient(140deg,rgba(104,72,209,0.13),rgba(104,72,209,0.03)_58%,rgba(255,255,255,0.65))] ring-brand/20",
    glow: "bg-brand/15",
    seal: "bg-[linear-gradient(150deg,#8B6BE8,#4D2FB0)] shadow-[0_14px_28px_-14px_rgba(77,47,176,0.8)]",
    Icon: SealCheck,
  },
  hold: {
    word: "Hold for a re-cut",
    chip: "Re-cut",
    ink: "text-amber",
    chipSkin: "bg-amber-soft text-amber",
    dot: "bg-amber",
    tint: "bg-[linear-gradient(140deg,rgba(178,106,0,0.13),rgba(178,106,0,0.03)_58%,rgba(255,255,255,0.65))] ring-amber/20",
    glow: "bg-amber/15",
    seal: "bg-[linear-gradient(150deg,#E39A2E,#B26A00)] shadow-[0_14px_28px_-14px_rgba(178,106,0,0.8)]",
    Icon: SealWarning,
  },
} as const;

/** What the viewer sees at the top of the feed, by platform and format. */
const surfaceName = (ad: AdRecord) =>
  ad.format === "Story" ? "Stories" : ad.platform === "TikTok" ? "For You" : ad.platform === "YouTube" ? "Shorts" : "Reels";

/** The draft on a phone, in the platform's frame. Video plays muted when the draft has one. */
export function PhonePreview({ ad, className = "" }: { ad: AdRecord; className?: string }) {
  const P = PLATFORM_ICON[ad.platform];
  return (
    <div className={`relative mx-auto w-full max-w-[290px] rounded-[44px] bg-[#0F0C1C] p-[9px] shadow-[0_40px_70px_-34px_rgba(40,20,90,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)] ${className}`}>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[36px] bg-black">
        {ad.video ? (
          <video key={ad.id} src={ad.video} poster={ad.img} autoPlay muted loop playsInline className="h-full w-full object-cover" aria-label={`${ad.creatorName}'s ${ad.format.toLowerCase()}`} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.img} alt={`${ad.creatorName}'s ${ad.format.toLowerCase()} for ${ad.product}`} className="h-full w-full object-cover object-top" />
        )}
        <span aria-hidden className="absolute left-1/2 top-2.5 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-black" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/55 to-transparent px-4 pb-8 pt-10 text-white">
          <span className="ad-shadow flex items-center gap-1.5 text-[12.5px] font-semibold"><P size={14} weight="fill" aria-hidden /> {surfaceName(ad)}</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">Sponsored</span>
        </div>

        <div aria-hidden className="absolute bottom-[136px] end-3 flex flex-col items-center gap-4 text-white">
          <Heart size={24} weight="fill" className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" />
          <ChatCircle size={23} weight="fill" className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" />
          <PaperPlaneTilt size={22} weight="fill" className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" />
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3.5 pb-4 pt-20 text-white">
          <div className="flex items-center gap-2">
            <Avatar src={ad.avatar} name={ad.creatorName} size={26} className="ring-2 ring-white/80" />
            <span className="ad-shadow min-w-0 truncate text-[13px] font-semibold">{ad.creatorName}</span>
          </div>
          <p className="ad-shadow mt-0.5 text-[10.5px] text-white/80">Paid partnership</p>
          <p className="ad-shadow mt-1.5 line-clamp-2 pe-9 text-[12px] leading-4">{ad.caption}</p>
          <div className="mt-2.5 flex items-center gap-2 rounded-[12px] bg-white/95 px-2.5 py-2 text-ink">
            <ShoppingBag size={14} weight="fill" aria-hidden className="shrink-0 text-brand" />
            <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold">{ad.product}</span>
            <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[10.5px] font-semibold text-white">Shop</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Each check against the brief, signed by the agent that ran it ("MoonShot AI · …" in the check's detail). */
export function Checks({ ad, className = "" }: { ad: AdRecord; className?: string }) {
  return (
    <ul className={`divide-y divide-hairline ${className}`}>
      {ad.compliance.checks.map((c) => {
        const [who, ...rest] = c.detail.split(" · ");
        const signed = /\bAI$/.test(who);
        return (
          <li key={c.label} className="flex items-start gap-3 py-2.5">
            <span aria-hidden className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${c.clean ? "bg-good" : "bg-amber"}`}>
              {c.clean ? <CheckCircle size={12} weight="fill" /> : <Warning size={12} weight="fill" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-body leading-5 ${c.clean ? "text-ink" : "font-semibold text-amber"}`}>{c.label}</span>
              <span className="mt-0.5 block text-meta leading-4 text-ink-faint">{signed ? rest.join(" · ") : c.detail}</span>
            </span>
            {signed && <span className="shrink-0 rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold text-brand">{who}</span>}
          </li>
        );
      })}
    </ul>
  );
}
