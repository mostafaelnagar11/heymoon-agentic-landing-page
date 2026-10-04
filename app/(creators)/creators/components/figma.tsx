"use client";

/* The Figma's own components, rebuilt for the web.
 *
 * Each one here is a node in Moontech-INF / NEW UI, read with
 * get_design_context and reproduced at its measured sizes: the 160px
 * image box with 12px radius inside a 4px-padded 16px card, the 28px
 * countdown bar at 80% Main, the 20px platform squares, the tinted
 * chips at 10%, the lilac stat tile with its icon top-right. Where the
 * file used an exported asset for a logo the project's own image or a
 * Phosphor glyph stands in; nothing is hand-drawn.
 */

import { useState, type ReactNode } from "react";
import {
  ArrowUpRight, InstagramLogo, SnapchatLogo, TiktokLogo, YoutubeLogo,
  Wallet, MoneyWavy, ShoppingCart, CreditCard, CheckCircle, Bird, ArrowLeft, Info, SealCheck, Warning,
  ImageSquare, PlusCircle, VideoCamera, House, Megaphone, Money, User, CalendarBlank, Check, X
} from "@phosphor-icons/react";
import type { Deliverable, Format, Offer, Platform } from "../lib/agent/types";
import { CAMPAIGN_MODELS, FORMAT_NAME, MATCH_WORD } from "../lib/agent/model";
import { Chip, Sheet } from "./ui";
import { Flag } from "./Flag";

/* ── Platform squares ────────────────────────────────────────────── */

/** The 20px platform mark. Instagram on its gradient, TikTok on the
    file's #161722, Snapchat on yellow, YouTube on red, "+n" on orange. */
export function Soc({ platform, size = 20, more }: { platform?: Platform; size?: number; more?: number }) {
  const s = { width: size, height: size };
  const r = size <= 20 ? "rounded-[6px]" : "rounded-chip";
  if (more) {
    return (
      <span className={`grid shrink-0 place-items-center ${r} bg-orange-20 text-brand font-medium text-orange`} style={s}>
        +{more}
      </span>
    );
  }
  switch (platform) {
    case "Instagram":
      return (
        <span className={`grid shrink-0 place-items-center ${r} text-white`} style={{ ...s, background: "linear-gradient(135deg,#F9CE34 0%,#EE2A7B 50%,#6228D7 100%)" }}>
          <InstagramLogo size={size * 0.7} weight="bold" aria-label="Instagram" />
        </span>
      );
    case "TikTok":
      return (
        <span className={`grid shrink-0 place-items-center ${r} bg-night text-white`} style={s}>
          <TiktokLogo size={size * 0.7} weight="fill" aria-label="TikTok" />
        </span>
      );
    case "Snapchat":
      return (
        <span className={`grid shrink-0 place-items-center ${r} bg-[#FFFC00] text-ink`} style={s}>
          <SnapchatLogo size={size * 0.7} weight="fill" aria-label="Snapchat" />
        </span>
      );
    case "YouTube":
      return (
        <span className={`grid shrink-0 place-items-center ${r} bg-[#FF0000] text-white`} style={s}>
          <YoutubeLogo size={size * 0.7} weight="fill" aria-label="YouTube" />
        </span>
      );
    default:
      return null;
  }
}

/** A row of platform squares, capped at three with a "+n". */
export function SocRow({ platforms, size = 20, max = 3 }: { platforms: Platform[]; size?: number; max?: number }) {
  const shown = platforms.slice(0, max);
  const rest = platforms.length - shown.length;
  return (
    <span className="flex items-center gap-1">
      {shown.map((p) => <Soc key={p} platform={p} size={size} />)}
      {rest > 0 && <Soc more={rest} size={size} />}
    </span>
  );
}

/* ── Countdown ───────────────────────────────────────────────────── */

/** "3d 5h 02m" the way the file sets it: digits semibold, units a size
    smaller and medium. `within` is display text like "3d 5h". */
export function Countdown({ within, size = "sm" }: { within: string; size?: "sm" | "md" }) {
  const parts = within.split(/\s+/).map((p) => p.match(/^(\d+)([a-z]+)$/i)).filter(Boolean) as RegExpMatchArray[];
  const d = size === "md" ? "text-row" : "text-body";
  const u = size === "md" ? "text-body" : "text-meta";
  return (
    <span className="num inline-flex items-end gap-1.5">
      {parts.map((m, i) => (
        <span key={i} className="inline-flex items-end gap-px">
          <span className={`${d} font-semibold leading-none`}>{m[1]}</span>
          <span className={`${u} font-medium leading-none`}>{m[2]}</span>
        </span>
      ))}
    </span>
  );
}

/** The 28px bar across the top of a card image, or the 48px one at the
    foot of a hero: Main at 80% alpha, the bird, "Early bird bonus", the
    countdown. */
export function CountdownBar({ within, tall }: { within: string; tall?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-2 bg-main-80 px-1.5 text-white ${tall ? "h-12 rounded-t-tile" : "h-7"}`}>
      <Bird size={16} weight="fill" aria-hidden />
      <span className="text-meta font-medium">Early bird bonus</span>
      <Countdown within={within} />
    </div>
  );
}

/* ── Badges and chips ────────────────────────────────────────────── */

/* No "Exclusive for you" badge, though the file has one. Nothing on
   HeyMoon is exclusive, and the terms say so in their first line; the
   match chip took its place. */

/** The campaign's share of an order. Its own terms, so it belongs on
    the card. What that COMES TO is a different question, answered after
    joining — Alex: "we want to calculate when you join a campaign, not
    before." No money figure appears here for that reason. */
export function PayoutChip({ offer, withWord }: { offer: Offer; withWord?: boolean }) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      <Chip tone="main" icon={<ArrowUpRight size={12} weight="bold" aria-hidden />}>{offer.commissionPct}%</Chip>
      {withWord && <span className="text-meta font-semibold text-ink">of every order</span>}
    </span>
  );
}

/** Pre-qualified, or a strong match. Alex: "the highest matching needs
    to be featured, clear, quick — just say join, and it's
    pre-qualified. The other campaigns we need to actually accept." */
export function MatchChip({ offer }: { offer: Offer }) {
  const pre = offer.match.level === "prequalified";
  return (
    <Chip tone={pre ? "green" : "ink"} icon={pre ? <SealCheck size={12} weight="fill" aria-hidden /> : undefined}>
      {MATCH_WORD[offer.match.level]}
    </Chip>
  );
}

/** The brand as a 20px circle and an 11px name at 80%. */
export function BrandMark({ name, logo, size = 20, className = "" }: { name: string; logo?: string; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="grid shrink-0 place-items-center overflow-hidden rounded-pill bg-night text-[9px] font-semibold text-white" style={{ width: size, height: size }}>
        {logo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={logo} alt="" className="h-full w-full bg-white object-cover" />
          : name[0]}
      </span>
      <span className="truncate text-brand font-medium text-ink/80">{name}</span>
    </span>
  );
}

/** Country flags as stacked circles with a "+n". The file uses flag
    art; here the code sits in a lilac disc, which reads at 24px where a
    flag does not. */
export function Flags({ codes, max = 2 }: { codes: string[]; max?: number }) {
  const shown = codes.slice(0, max);
  const rest = codes.length - shown.length;
  return (
    <span className="flex items-center">
      {/* The flag itself, in the same 24px overlapping row the codes
          sat in; the white ring is what separates one from the next. */}
      {shown.map((c) => (
        <Flag key={c} code={c} size={24} className="-me-2 border-2 border-white" />
      ))}
      {rest > 0 && (
        <span className="grid h-6 w-6 place-items-center rounded-pill border-2 border-white bg-main-10 text-[8px] font-semibold text-main">+{rest}</span>
      )}
    </span>
  );
}

/* ── The product tile ───────────────────────────────────────────────
   What a campaign card shows in place of a hero photograph.

   The Figma's cards carry real brand creative — a store interior, a
   coat on a model, a makeup flatlay. This project has no such library:
   its images are creator portraits and phone screenshots, gathered for
   the brands app where the creator IS the subject. Putting a face where
   a product belongs makes a campaign card look like a profile, and
   borrowing a real third-party product for a fictional brand is worse.

   So the tile is composed rather than photographed: the brand's own
   tint, the product named large, and the brand mark. It reads as
   deliberate, it says more than a stranger's face did, and the moment
   real photography exists it is one field away from being replaced. */

const FAMILY_TINT: Record<NonNullable<Offer["family"]>, string> = {
  luxury: "linear-gradient(150deg,#EFE7DD 0%,#E3D6C8 45%,#D8C6B4 100%)",
  beauty: "linear-gradient(150deg,#FBEAF2 0%,#F6D9E6 45%,#EFC6D8 100%)",
  grocery: "linear-gradient(150deg,#E6F3E4 0%,#D3E9D0 45%,#C0DEBC 100%)",
  general: "linear-gradient(150deg,#EDEAFA 0%,#DDD7F4 45%,#CCC3EE 100%)",
};

export function ProductTile({ offer, className = "", inset, hero, titleClass, plain, noBrand }: {
  offer: Offer;
  /** The product alone, where the brand is already named beside the
      tile — a campaign card names it once, under the picture. */
  noBrand?: boolean;
  className?: string;
  /** Override the product name's size. `hero` is drawn for a banner the
      width of a column; a 240px media panel needs the big light disc
      without the 36px type. */
  titleClass?: string;
  /** Keep the words clear of something drawn over the tile's
      bottom-right, which on a campaign card is the platform icons. A
      140px row tile has nothing over it and cannot spare the space. */
  inset?: boolean;
  /** The campaign detail's banner, which is a whole column wide. At
      card type the product name is a caption floating in a field of
      tint; at this size it is the banner. */
  hero?: boolean;
  /** THE TINT ALONE. At 84px there is no room to set a product name —
      "Structured leather tote" truncates to "Structur leathe…", which
      is worse than no label. The row beside it already says the brand
      and the campaign, so the tile is a category-keyed anchor. */
  plain?: boolean;
}) {
  return (
    <div className={`relative flex h-full w-full flex-col justify-end overflow-hidden p-3 ${className}`} style={{ background: FAMILY_TINT[offer.family] ?? FAMILY_TINT.general }}>
      {/* A soft disc behind the words, so the type sits in light rather
          than on a flat panel. */}
      <div aria-hidden className={`absolute -end-6 -top-10 rounded-pill bg-white/45 blur-2xl ${hero ? "h-64 w-64" : "h-32 w-32"}`} />
      {plain ? null : (
      <div className="relative">
        {!noBrand && <p className={`font-semibold uppercase tracking-[0.12em] text-ink/45 ${hero ? "text-body" : "text-brand"}`}>{offer.brand}</p>}
        <p className={`${noBrand ? "" : "mt-1"} line-clamp-2 font-semibold text-ink ${titleClass ?? (hero ? "text-[28px] leading-[1.15] tracking-[-0.01em] sm:text-[36px]" : "text-row leading-5")} ${inset ? "pe-14" : ""}`}>{offer.product}</p>
      </div>
      )}
    </div>
  );
}

/* ── The campaign card (Type=L) ──────────────────────────────────── */

/** HOW OFTEN A CAMPAIGN ASKS YOU TO POST: its ads spread over its
    length, "2 a week", with the count and the length under it. The
    posting schedule itself is the creator's to pick when they join;
    this is the pace the campaign implies. */
export function paceOf(offer: Offer): { big: string; small: string } {
  const ads = offer.deliverables.reduce((n, d) => n + d.count, 0);
  const plural = `${ads} ad${ads === 1 ? "" : "s"}`;
  const m = offer.duration?.match(/(\d+)\s*(day|week)/i);
  if (!m) return { big: plural, small: "at your own pace" };
  const days = Number(m[1]) * (/week/i.test(m[2]) ? 7 : 1);
  return { big: `${Math.max(1, Math.round(ads / (days / 7)))} a week`, small: `${plural} over ${offer.duration}` };
}

/* THE CARD, CUT TO WHAT MAKES A CREATOR PRESS IT (28 Sep review). The
   brand once — it was on the tile and again under it — and no country
   flags: this is a recommendation already matched to where the
   creator's audience is, so the countries told them nothing. What it
   leads on instead are the two things Helina heard creators look for
   first: the share of every order, and how often to post. */
export function CampaignCard({ offer, onOpen, className = "" }: { offer: Offer; onOpen?: () => void; className?: string }) {
  const Root = onOpen ? "button" : "div";
  const pace = paceOf(offer);
  return (
    <Root
      onClick={onOpen}
      className={`flex w-full flex-col gap-2 rounded-card bg-white p-1 text-start shadow-card transition ${onOpen ? "hover:shadow-float" : ""} ${className}`}
    >
      <div className="relative h-36 w-full overflow-hidden rounded-inner bg-lilac">
        {offer.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={offer.image} alt="" className="h-full w-full object-cover" />
          : <ProductTile offer={offer} inset noBrand />}
        {offer.image && <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />}
        {/* A JOIN-EARLY bonus, so only while it can still be joined. */}
        {offer.bonus && offer.state === "open" && <div className="absolute inset-x-0 top-0"><CountdownBar within={offer.bonus.within} /></div>}
        {/* Where it runs, on the end side, clear of the product name. */}
        <div className="absolute bottom-2 end-2"><SocRow platforms={offer.platforms} /></div>
        {offer.match.level === "prequalified" && offer.state === "open" && (
          <span className={`absolute end-2 inline-flex h-6 items-center gap-1 rounded-[6px] bg-white/95 px-1.5 text-meta font-semibold text-green shadow-card ${offer.bonus && offer.state === "open" ? "top-9" : "top-2"}`}>
            <SealCheck size={12} weight="fill" aria-hidden />Pre-qualified
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2.5 px-2 pb-2">
        <div className="min-w-0">
          <BrandMark name={offer.brand} logo={offer.brandLogo} size={16} />
          <p className="mt-1 truncate text-body font-semibold text-ink">{offer.title}</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-hairline rounded-inner bg-lilac/60 rtl:divide-x-reverse">
          <div className="min-w-0 px-3 py-2">
            <p className="num text-section font-semibold leading-6 text-main">{offer.commissionPct}%</p>
            <p className="text-meta leading-4 text-ink-60">of every order</p>
          </div>
          <div className="min-w-0 px-3 py-2">
            <p className="text-section font-semibold leading-6 text-ink">{pace.big}</p>
            <p className="text-meta leading-4 text-ink-60">{pace.small}</p>
          </div>
        </div>
      </div>
    </Root>
  );
}

/** The list row on Your Campaigns: thumbnail, platforms, title, chips. */
/* THE DESKTOP ROW'S TRACK CONTRACT.
 *
 * One constant, so the column heads and the row cells cannot drift
 * apart. A list of many things is rows in one surface under heads —
 * the shape this app had nowhere, which is why four columns of a phone
 * card was the only answer it could give to a wide column. */
export const ROW = {
  thumb: "w-[84px] shrink-0",
  name: "min-w-0 flex-1",
  share: "w-[96px] shrink-0",
  /* 96px, and never wrapped: a finished campaign says "Ended 12 Sep"
     here, which broke over two lines at 80. */
  closes: "w-[96px] shrink-0 whitespace-nowrap",
  state: "w-[112px] shrink-0",
} as const;

/** The 11px tracked heads that turn a list of rows into a table. The
    leading cell is an empty spacer for the row's thumbnail; without it
    every head sits 84px off the cell it names. */
export function RowHeads({ last = "State" }: { last?: string }) {
  return (
    <div aria-hidden className="flex min-w-[540px] items-center gap-3 border-b border-hairline bg-lilac/40 px-4 py-2 text-eyebrow font-semibold uppercase text-ink-50">
      <span className={ROW.thumb} />
      <span className={ROW.name}>Campaign</span>
      <span className={ROW.share}>Payout</span>
      <span className={ROW.closes}>Closes</span>
      <span className={`${ROW.state} text-end`}>{last}</span>
    </div>
  );
}

export function CampaignRow({ offer, onOpen, trailing, dense }: {
  offer: Offer;
  onOpen?: () => void;
  trailing?: ReactNode;
  /** THE DESKTOP ROW. Only ever passed from inside a `hidden lg:block`
      container, so this branch does not exist below 1024px and the
      phone row below stays byte-identical to the Figma. Do not try to
      merge the two: the phone's 140x120 thumbnail is a measured value
      and an md: variant of it cannot be an 84x72 cell. */
  dense?: boolean;
}) {
  const posts = offer.deliverables.reduce((n, d) => n + d.count, 0);

  if (dense) return (
    <button onClick={onOpen} className="group flex w-full min-w-[540px] items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-lilac/30">
      <span className={`relative h-[72px] overflow-hidden rounded-inner bg-lilac ${ROW.thumb}`}>
        {offer.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={offer.image} alt="" className="h-full w-full object-cover" />
          : <ProductTile offer={offer} plain />}
      </span>
      <span className={`flex flex-col ${ROW.name}`}>
        <span className="flex items-center gap-2">
          <span className="min-w-0 truncate text-row font-semibold leading-5 text-ink">{offer.title}</span>
          {offer.conflict && <Chip tone="orange" icon={<Warning size={12} weight="fill" aria-hidden />} className="hidden xl:inline-flex">Clash</Chip>}
        </span>
        <span className="mt-1 flex items-center gap-2">
          <SocRow platforms={offer.platforms} size={16} />
          <span className="truncate text-meta text-ink-50">{offer.brand} · {posts} post{posts === 1 ? "" : "s"} · {offer.duration ?? "No end date"}</span>
        </span>
      </span>
      <span className={ROW.share}><PayoutChip offer={offer} /></span>
      <span className={`num ${ROW.closes} text-body font-medium text-ink`}>{offer.expires}</span>
      <span className={`${ROW.state} flex justify-end`}>{trailing ?? <MatchChip offer={offer} />}</span>
    </button>
  );

  return (
    <button onClick={onOpen} className="flex w-full gap-3 rounded-card bg-white p-2 text-start shadow-card transition hover:shadow-float">
      <span className="relative h-[120px] w-[140px] shrink-0 overflow-hidden rounded-inner bg-lilac">
        {offer.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={offer.image} alt="" className="h-full w-full object-cover" />
          : <ProductTile offer={offer} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col py-1">
        <span className="flex items-start justify-between gap-2">
          <SocRow platforms={offer.platforms} />
          {offer.bonus && offer.state === "open" && (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-chip bg-main px-2 text-white">
              <Bird size={12} weight="fill" aria-hidden /><Countdown within={offer.bonus.within} />
            </span>
          )}
        </span>
        <span className="mt-2 line-clamp-2 text-row font-medium leading-5 text-ink">{offer.title}</span>
        {/* Only when nothing is passed in the trailing slot. A list that
            supplies its own status chip does not want this said twice on
            the same row. */}
        {offer.match.level === "prequalified" && !trailing && (
          <span className="mt-1 inline-flex items-center gap-1 text-meta font-semibold text-green"><SealCheck size={12} weight="fill" aria-hidden />Pre-qualified</span>
        )}
        <span className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Chip tone="main" icon={<Wallet size={12} weight="fill" aria-hidden />}>
            {offer.commissionPct}%<span className="font-normal"> an order</span>
          </Chip>
          {trailing ?? <span className="text-meta font-semibold text-ink-60">{paceOf(offer).big}</span>}
        </span>
      </span>
    </button>
  );
}

/* ── Stat tile ───────────────────────────────────────────────────── */

const TILE_ICON = {
  money: MoneyWavy, orders: ShoppingCart, payments: CreditCard, done: CheckCircle,
} as const;

/** The lilac tile: label in Main with its icon top-right, the figure,
    and a green delta. bg #f3effc, radius 24, padding 16. */
export function StatTile({ label, value, delta, icon = "money", hero, quiet }: {
  label: string; value: ReactNode; delta?: string; icon?: keyof typeof TILE_ICON; hero?: boolean;
  /** The line under the figure is a note rather than a gain — "Counts
      from your first live ad" — so it is grey, not the file's green. */
  quiet?: boolean;
}) {
  const I = TILE_ICON[icon];
  return (
    /* WHITE, with the tint kept for the icon and the label. The lilac
       fill was the Figma's, drawn on a white phone screen where it is
       what separates a tile from the page. On the desktop's canvas
       ground the objects are white and the ground carries the tint, so
       a lilac tile there is the one thing on the page fighting it. */
    <div className={`flex min-w-0 flex-1 flex-col gap-4 rounded-tile p-4 ${hero ? "g-header text-white" : "border border-hairline bg-white shadow-edge"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-body font-medium ${hero ? "text-white/80" : "text-main"}`}>{label}</span>
        <I size={16} weight="fill" aria-hidden className={hero ? "text-white/80" : "text-main"} />
      </div>
      <div className="flex flex-col gap-1">
        <span className={`num text-title font-semibold ${hero ? "text-white" : "text-ink"}`}>{value}</span>
        {delta && <span className={`text-meta font-medium ${hero ? "text-lime" : quiet ? "text-ink-50" : "text-green"}`}>{delta}</span>}
      </div>
    </div>
  );
}

/* ── Early bird card ─────────────────────────────────────────────── */

export function EarlyBirdCard({ label, within, why, joined }: {
  label: string; within: string; why?: string;
  /** On a campaign the creator joined inside the window: the design's
      "You are taking part", in place of the countdown. */
  joined?: boolean;
}) {
  return (
    <div>
      <div className="g-bonus g-sheen relative flex items-center gap-2.5 rounded-inner border border-white/50 py-3.5 pe-3 ps-[15px] text-white">
        <span className="relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-pill border border-main bg-lilac text-main">
          <Bird size={24} weight="fill" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-row font-semibold">Early Bird Bonus</span>
            <span className="num text-body font-semibold">{label}</span>
          </div>
          {joined ? (
            <p className="mt-1.5 text-body text-white/80">You&apos;re taking part</p>
          ) : (
            <div className="mt-2.5 flex items-center gap-1 text-body">
              <span>Apply within</span>
              <Chip tone="white" className="h-6"><Countdown within={within} size="md" /></Chip>
            </div>
          )}
        </div>
      </div>
      {why && <p className="mt-1.5 text-meta leading-4 text-ink-50">{why}</p>}
    </div>
  );
}

/* ── Payment details ─────────────────────────────────────────────── */

/** The purple-bordered card. The share as a Main chip with the ⓘ,
    and the bonus card beneath it. The file labels the row "Payout
    Rate"; the review took "rate" out of pay, because every campaign in
    the MVP is performance and the chip is a share of every order
    rather than a fee somebody negotiated. */
export function PaymentDetails({ offer, why, open, onToggle }: { offer: Offer; why: string; open: boolean; onToggle: () => void }) {
  const [models, setModels] = useState(false);
  return (
    <div className="flex flex-col gap-4 rounded-inner border border-main bg-paper p-4">
      <div className="flex items-center justify-between">
        <span className="text-section font-semibold text-ink-90">Payment Details</span>
        {/* The campaign's model, and behind its ⓘ the two models side by
            side — what this one is, and what HeyMoon does not run yet. */}
        <button type="button" onClick={() => setModels(true)} aria-label="Performance. How campaigns pay"
          className="inline-flex items-center gap-1 rounded-chip px-1.5 py-0.5 text-body text-ink-60 transition hover:bg-lilac hover:text-main">
          performance
          <Info size={14} weight="bold" aria-hidden />
        </button>
      </div>
      <div className="border-b border-line pb-4">
        <div className="flex items-center justify-between">
          <span className="text-row font-medium text-ink-90">Payout</span>
          <button onClick={onToggle} aria-expanded={open} className="inline-flex h-7 items-center gap-1 rounded-chip bg-main-10 px-2 text-meta font-semibold text-main">
            {offer.commissionPct}% of every order
            <Info size={12} weight="bold" aria-hidden />
          </button>
        </div>
        {open && <p className="mt-3 rounded-chip bg-white px-3 py-2.5 text-body leading-5 text-ink-60">{why}</p>}
      </div>
      {offer.bonus && offer.state === "open" && <EarlyBirdCard label={offer.bonus.label} within={offer.bonus.within} why={offer.bonus.why} />}
      {/* Joined while the window was open, so the bonus is theirs. */}
      {offer.bonus && offer.state === "approved" && <EarlyBirdCard label={offer.bonus.label} within={offer.bonus.within} joined />}
      <ModelsSheet open={models} onClose={() => setModels(false)} />
    </div>
  );
}

/* THE TWO MODELS, in one place so no screen invents its own version of
   them, and honest about which one HeyMoon actually runs. Alex: "you
   need to explain the difference between [ROAS] and [CPA] campaigns...
   really explain them very very well and then 'hey, we're going to now
   support this'." Behind the ⓘ on Payment Details, not a card of its
   own on every campaign. */
export function ModelsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="How campaigns pay">
      <ul className="space-y-4 px-4 pb-5 pt-1">
        {CAMPAIGN_MODELS.map((m) => (
          <li key={m.key} className="flex items-start gap-2.5">
            <span aria-hidden className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-pill ${m.supported ? "bg-green-10 text-green" : "bg-lilac text-ink-50"}`}>
              {m.supported ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-body font-semibold text-ink">{m.name}</span>
                <span className="text-meta text-ink-50">{m.supported ? "what this campaign is" : "not on HeyMoon yet"}</span>
              </span>
              <span className="mt-0.5 block text-body leading-5 text-ink-60">{m.line}</span>
              <span className="mt-1 block text-meta leading-4 text-ink-50">{m.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}


/* ── Deliverables ────────────────────────────────────────────────── */

const FORMAT_ICON: Record<Format, typeof ImageSquare> = {
  Post: ImageSquare, Story: PlusCircle, Reel: VideoCamera, TikTok: VideoCamera, YouTube: VideoCamera,
};

/** Per-platform card: platform name and square, then one row per
    format with its icon, name and "3x". The file's exact structure. */
export function DeliverablesCard({ deliverables }: { deliverables: Deliverable[] }) {
  const byPlatform = deliverables.reduce<Record<string, Deliverable[]>>((acc, d) => {
    (acc[d.platform] ??= []).push(d); return acc;
  }, {});
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(byPlatform).map(([platform, rows]) => (
        <div key={platform} className="rounded-inner border border-line p-4">
          <div className="flex items-center justify-between">
            <span className="text-row font-medium text-ink-90">{platform}</span>
            <Soc platform={platform as Platform} size={24} />
          </div>
          <div className="mt-2">
            {rows.map((d, i) => {
              const I = FORMAT_ICON[d.format];
              return (
                <div key={d.format} className={`flex items-center justify-between py-4 ${i < rows.length - 1 ? "border-b border-line" : "pb-0"}`}>
                  <span className="flex items-center gap-1 text-body font-medium text-ink-90">
                    <I size={16} aria-hidden className="text-ink-60" />{FORMAT_NAME[d.format]}
                  </span>
                  <span className="num text-body font-semibold text-black">{d.count}x</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Header and chrome ───────────────────────────────────────────── */

/** The 40px circular back button on #fafafa. */
export function BackButton({ onClick, light }: { onClick: () => void; light?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label="Back"
      className={`grid h-10 w-10 place-items-center rounded-pill border ${light ? "border-white/20 bg-white/90 text-ink" : "border-black/[0.02] bg-paper text-ink"}`}
    >
      <ArrowLeft size={16} weight="bold" aria-hidden />
    </button>
  );
}

/** The file's four tabs plus Calendar, as a floating pill bar below
    768px — the same five the rail carries above it. */
export const TABS = [
  { key: "home", label: "Dashboard", icon: House },
  { key: "campaigns", label: "Campaigns", icon: Megaphone },
  { key: "calendar", label: "Calendar", icon: CalendarBlank },
  { key: "earnings", label: "Earnings", icon: Money },
  { key: "profile", label: "Profile", icon: User },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

export function MobileTabBar({ value, onChange }: { value: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <nav aria-label="Sections" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:hidden">
      <div className="pointer-events-auto flex w-full max-w-[420px] items-center justify-between rounded-pill border border-white/60 bg-white/85 p-1.5 shadow-float backdrop-blur-md">
        {TABS.map((t) => {
          const on = t.key === value;
          const I = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              aria-current={on ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 rounded-pill py-2 text-tiny font-medium transition ${on ? "bg-lilac text-main" : "text-ink-60"}`}
            >
              <I size={20} weight={on ? "fill" : "regular"} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
