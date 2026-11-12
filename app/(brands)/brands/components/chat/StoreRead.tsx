"use client";

/* The store read, as the dashboard draws things (Aurora, 11 Nov: "rethink and redesign the components in the chat,
   it still looks the same as the old version").

   It was a two-column table: a grey label, a line of text, a "Show the evidence" link, nine times. Every finding
   weighed the same, so the one a brand came to see, whether HeyMoon can guarantee them, was the last line of the
   card. Now the verdict leads, and each finding is a tile drawn in its own kind: the median price on a range bar,
   the bestsellers as the products themselves, the markets as shares, the accounts by platform. A tile still opens
   in the panel to be corrected, and its evidence is still one press away.

   The figures are the read's own; nothing here is computed except where a bar sits. */

import { useRef, useState, type ReactNode } from "react";
import {
  CalendarBlank, ChatCircleText, Check, CheckCircle, Globe, Package, SealCheck, SealWarning, ShoppingBag, Tag,
  UsersThree, X, type Icon,
} from "@phosphor-icons/react";
import type { BrandRead, Eligibility, ReadLayerKey } from "../../lib/agent/types";
import { ELIGIBILITY } from "../../lib/agent/eligibility";
import { READ_TASKS } from "../../lib/agent/tools";
import { fmtCount } from "../../lib/mock/campaigns";
import { focusReadLayer, openPanel } from "../../lib/store";
import { EvidenceRow } from "../Evidence";
import { srcFor, readValueTree } from "../ReadValue";
import { TypeOn } from "../TypeOn";
import { Card } from "../ui";
import { GlassPopover } from "../../../../_shared/GlassPopover";

/* The platform marks the landing already ships, and the flags. Anything without one falls back to a letter. */
const PLATFORM_ICON: Record<string, string> = {
  instagram: "/hero/platforms/instagram.webp", tiktok: "/hero/platforms/tiktok.webp",
  snapchat: "/hero/platforms/snapchat.webp", youtube: "/hero/platforms/youtube.webp",
  facebook: "/hero/platforms/facebook.webp",
};
const FLAGS = new Set(["ae", "bh", "eg", "jo", "kw", "om", "qa", "sa"]);

/* ── One finding ─────────────────────────────────────────────────── */

function Tile({ read, k, icon: I, label, wide, children }: {
  read: BrandRead; k: ReadLayerKey; icon: Icon; label: string; wide?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pill = useRef<HTMLButtonElement>(null);
  const src = srcFor(read, k);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => focusReadLayer(k)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusReadLayer(k); } }}
      aria-label={`${label}. Open to correct.`}
      className={`group min-w-0 cursor-pointer rounded-[18px] bg-white/80 p-4 ring-1 ring-brand/[0.07] transition hover:shadow-lift hover:ring-brand/[0.16] focus-visible:outline-none focus-visible:ring-brand/40 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] bg-haze text-brand">
          <I size={14} weight="bold" />
        </span>
        <p className="min-w-0 flex-1 truncate text-meta font-semibold text-ink-60">{label}</p>
        {src && src.evidence.length > 0 && (
          <button
            ref={pill}
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={`shrink-0 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold text-brand transition ${open ? "bg-brand/[0.12]" : "bg-haze hover:bg-brand/[0.1]"}`}
          >
            Evidence · {src.evidence.length}
          </button>
        )}
      </div>
      <div className="mt-3">{children}</div>
      {/* Over the thread, not inside the tile: the conversation under it stays where it was. */}
      {src && (
        <GlassPopover anchor={pill} open={open} onClose={() => setOpen(false)} label={`${label}: evidence`}>
          <EvidencePop title={label} count={src.evidence.length} why={`Read off ${src.evidence[0]?.label ?? "your store"}. ${src.why}`}>
            {src.evidence.map((ev) => <EvidenceRow key={ev.id} e={ev} />)}
          </EvidencePop>
        </GlassPopover>
      )}
    </div>
  );
}

/** What the evidence popover holds: what it is, why the agent believes it, and each source it was read off. */
function EvidencePop({ title, count, why, children }: { title: string; count: number; why: string; children: ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-meta font-semibold text-ink">
        {title}
        <span className="num rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold text-brand">Evidence · {count}</span>
      </p>
      <p className="mt-1.5 text-meta leading-5 text-ink-soft">{why}</p>
      <ul className="mt-1.5 divide-y divide-hairline">{children}</ul>
    </div>
  );
}

/* ── The findings, each in its own kind ──────────────────────────── */

function Prices({ read }: { read: BrandRead }) {
  const p = read.priceBand!.value;
  const at = p.high > p.low ? ((p.median - p.low) / (p.high - p.low)) * 100 : 50;
  return (
    <>
      <p className="flex items-baseline gap-1.5">
        <span className="num text-[26px] font-bold leading-none tracking-[-0.03em] text-ink">{p.median.toLocaleString()}</span>
        <span className="text-meta font-medium text-ink-faint">{p.currency} median</span>
      </p>
      <div className="relative mt-4 h-2 rounded-pill bg-[linear-gradient(90deg,#E4DCFA,#7A47CE_55%,#F4A8D8)]">
        <span
          aria-hidden
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-brand shadow-lift rtl:translate-x-1/2"
          style={{ insetInlineStart: `${at}%` }}
        />
      </div>
      <p className="num mt-2 flex justify-between text-[11.5px] text-ink-faint">
        <span>{p.low.toLocaleString()} {p.currency}</span>
        <span>{p.high.toLocaleString()} {p.currency}</span>
      </p>
    </>
  );
}

function Bestsellers({ read }: { read: BrandRead }) {
  return (
    <ol className="grid grid-cols-3 gap-3">
      {read.bestsellers!.value.slice(0, 3).map((b, i) => (
        <li key={b.name} className="min-w-0">
          <span className="relative block aspect-[4/5] overflow-hidden rounded-[14px] bg-haze">
            {b.img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.img} alt="" className="h-full w-full object-cover" loading="lazy" />
            )}
            <span className="absolute start-2 top-2 grid h-6 min-w-6 place-items-center rounded-pill bg-white/90 px-1.5 text-[11px] font-bold text-ink shadow-edge">
              {i + 1}
            </span>
            <span className="num absolute bottom-2 start-2 rounded-pill bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink shadow-edge backdrop-blur">
              {b.price}
            </span>
          </span>
          <p className="mt-2 line-clamp-2 text-meta font-semibold leading-4 text-ink">{b.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-[15px] text-ink-faint">{b.note}</p>
        </li>
      ))}
    </ol>
  );
}

function Markets({ read }: { read: BrandRead }) {
  const rows = read.markets!.value;
  const top = Math.max(...rows.map((m) => m.share), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((m) => {
        const code = m.code.toLowerCase();
        return (
          <li key={m.code} className="flex items-center gap-2.5">
            {FLAGS.has(code) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/flags/${code}.svg`} alt="" className="h-[18px] w-[18px] shrink-0 rounded-full object-cover ring-1 ring-black/[0.06]" />
            ) : (
              <span aria-hidden className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-haze text-[8px] font-bold text-ink-soft">{m.code}</span>
            )}
            <span className="w-[118px] shrink-0 truncate text-meta font-medium text-ink">{m.name}</span>
            <span className="h-1.5 min-w-0 flex-1 rounded-pill bg-track">
              <span className="block h-full rounded-pill bg-[linear-gradient(90deg,#6848D1,#A65FED)]" style={{ width: `${(m.share / top) * 100}%` }} />
            </span>
            <span className="num w-9 shrink-0 text-end text-meta font-semibold text-ink">{m.share}%</span>
          </li>
        );
      })}
    </ul>
  );
}

function Socials({ read }: { read: BrandRead }) {
  return (
    <ul className="space-y-2.5">
      {read.socials!.value.map((a) => {
        const icon = PLATFORM_ICON[a.platform.toLowerCase()];
        return (
          <li key={a.platform + a.handle} className="flex items-center gap-2.5">
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="h-7 w-7 shrink-0 rounded-[8px] object-cover" />
            ) : (
              <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-haze text-meta font-bold text-brand">{a.platform[0]}</span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-meta font-semibold text-ink" dir="ltr">{a.handle}</span>
              <span className="block truncate text-[11px] text-ink-faint">{a.platform}</span>
            </span>
            {a.followers > 0 && <span className="num shrink-0 text-[15px] font-bold tracking-[-0.01em] text-ink">{fmtCount(a.followers)}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function Voice({ read }: { read: BrandRead }) {
  const v = read.voice!.value;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {v.words.map((w) => (
          <span key={w} className="rounded-pill bg-haze px-2.5 py-1 text-[11.5px] font-semibold text-brand">{w}</span>
        ))}
      </div>
      <blockquote className="grad-ws relative mt-3 rounded-[14px] px-3.5 pb-3 pt-4 text-body italic leading-6 text-ink">
        <span aria-hidden className="absolute -top-1 start-2.5 font-serif text-[30px] not-italic leading-none text-orchid/60">“</span>
        {v.sample}
      </blockquote>
    </>
  );
}

function Moments({ read }: { read: BrandRead }) {
  return (
    <ul className="space-y-2">
      {read.seasonality!.value.map((sn) => (
        <li key={sn.label} className="flex items-center gap-2.5">
          <span aria-hidden className="h-8 w-1 shrink-0 rounded-pill bg-[linear-gradient(180deg,#6848D1,#F4A8D8)]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-meta font-semibold text-ink">{sn.label}</span>
            <span className="block truncate text-[11px] text-ink-faint">{sn.window}</span>
          </span>
          <span className="shrink-0 rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold text-brand">{sn.lift}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── The verdict ─────────────────────────────────────────────────── */

/* The eligibility check is the one finding a brand came to hear (12 Nov: "give the eligibility check result more
   importance"), so it is the card's headline rather than a strip under it: a seal, the verdict in display type, and
   each criterion it was judged on, with what the store has against what it needs. The criteria are ELIGIBILITY's
   own, so changing the floor there changes this. Not eligible is amber, not red: it says "yet", and the way back
   sits under it.

   The traffic meter is on a log scale, labelled 1K to 1M a month, because the floor and a large store are two orders
   of magnitude apart and a linear bar would draw the floor as nothing. */

const VISITORS_RE = /([\d,]+)\s+monthly\s+(?:unique\s+)?visitors/i;

/** The store's monthly visitors as the read states them: the miss when it fell short, the evidence when it cleared. */
export function visitorsOf(e: Eligibility): number | undefined {
  const miss = e.missing?.find((m) => /visitor/i.test(m.label));
  const raw = miss
    ? String(miss.have.value)
    : e.line.evidence.map((x) => x.detail).concat(e.line.value).map((s) => VISITORS_RE.exec(s)?.[1]).find(Boolean);
  const n = raw ? Number(raw.replace(/,/g, "")) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

const fmtN = (n: number) => n.toLocaleString("en-US");
const AXIS = [1_000, 10_000, 100_000, 1_000_000];
const onAxis = (n: number) => Math.min(100, Math.max(0, ((Math.log10(Math.max(n, 1)) - 3) / 3) * 100));
const axisLabel = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1_000}K`);
const CHECKED_BY = READ_TASKS.find((t) => t.key === "eligibility")?.agent;

function TrafficMeter({ visitors, ok }: { visitors: number; ok: boolean }) {
  const floor = ELIGIBILITY.minMonthlyVisitors;
  const x = onAxis(visitors);
  const f = onAxis(floor);
  return (
    /* A numeric scale reads left to right in both languages. */
    <div dir="ltr" className="mt-2.5">
      <div className="relative h-4">
        <span className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-ink-soft" style={{ left: `${f}%` }}>
          Minimum <span className="num">{fmtN(floor)}</span>
        </span>
      </div>
      <div className="relative mt-1.5 h-2.5 rounded-full bg-track">
        <span aria-hidden className="absolute inset-y-0 left-0 rounded-l-full bg-amber/[0.12]" style={{ width: `${f}%` }} />
        <span
          aria-hidden
          className={`verdict-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${ok ? "from-good/45 to-good" : "from-amber/40 to-amber"}`}
          style={{ width: `${x}%` }}
        />
        <span aria-hidden className="absolute -inset-y-1 w-0.5 rounded-full bg-ink/55" style={{ left: `calc(${f}% - 1px)` }} />
        <span
          aria-hidden
          className={`verdict-dot absolute top-1/2 -mt-2 h-4 w-4 rounded-full border-[3px] border-white shadow-lift ${ok ? "bg-good" : "bg-amber"}`}
          style={{ left: `calc(${x}% - 8px)` }}
        />
      </div>
      <div aria-hidden className="num relative mt-1.5 h-4 text-[11px] text-ink-faint">
        {AXIS.map((a, i) => (
          <span
            key={a}
            className={`absolute ${i === 0 ? "" : i === AXIS.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: `${onAxis(a)}%` }}
          >
            {axisLabel(a)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Criterion({ ok, label, value, children }: { ok: boolean; label: string; value?: ReactNode; children?: ReactNode }) {
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${ok ? "bg-good" : "bg-amber"}`}>
          {ok ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
        </span>
        <p className="min-w-0 flex-1 text-body font-medium text-ink">
          <span className="sr-only">{ok ? "Met: " : "Not met: "}</span>
          {label}
        </p>
        {value}
      </div>
      {children && <div className="ps-[34px]">{children}</div>}
    </li>
  );
}

function Verdict({ read, e, line }: { read: BrandRead; e: Eligibility; line: string }) {
  const [open, setOpen] = useState(false);
  const how = useRef<HTMLButtonElement>(null);
  const ok = e.state === "ok";
  const noStore = e.missing?.some((m) => /online store/i.test(m.label)) ?? false;
  const visitors = noStore ? undefined : visitorsOf(e);
  const trafficOk = !e.missing?.some((m) => /visitor/i.test(m.label));
  /* The verdict's first sentence is the headline and the rest stands under it; the words are the line's own. */
  const cut = line.search(/\.\s/);
  const head = cut > 0 ? line.slice(0, cut + 1) : line;
  const rest = cut > 0 ? line.slice(cut + 2) : "";
  const id = `${read.id}-verdict`;
  return (
    <section
      aria-labelledby={id}
      className={`verdict-in relative overflow-hidden rounded-[22px] p-4 ring-1 sm:p-5 ${
        ok
          ? "bg-[linear-gradient(140deg,rgba(37,163,51,0.15),rgba(37,163,51,0.04)_58%,rgba(255,255,255,0.7))] ring-good/20"
          : "bg-[linear-gradient(140deg,rgba(178,106,0,0.14),rgba(178,106,0,0.04)_58%,rgba(255,255,255,0.7))] ring-amber/20"
      }`}
    >
      <span aria-hidden className={`pointer-events-none absolute -end-14 -top-20 h-52 w-52 rounded-full blur-3xl ${ok ? "bg-good/20" : "bg-amber/15"}`} />

      {/* Phones: the seal beside the eyebrow, the verdict full width under them. Wider: the seal holds the left edge. */}
      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 sm:items-start sm:gap-x-4 sm:gap-y-1">
        <span
          aria-hidden
          className={`verdict-seal grid h-11 w-11 shrink-0 place-items-center rounded-[14px] sm:row-span-2 sm:h-14 sm:w-14 sm:rounded-[18px] text-white ${
            ok
              ? "bg-[linear-gradient(150deg,#3FC451,#1C7A26)] shadow-[0_14px_28px_-14px_rgba(28,122,38,0.8)]"
              : "bg-[linear-gradient(150deg,#E39A2E,#B26A00)] shadow-[0_14px_28px_-14px_rgba(178,106,0,0.8)]"
          }`}
        >
          {ok ? <SealCheck className="h-[26px] w-[26px] sm:h-8 sm:w-8" weight="fill" /> : <SealWarning className="h-[26px] w-[26px] sm:h-8 sm:w-8" weight="fill" />}
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:self-end">
          <p className={`text-eyebrow font-semibold uppercase tracking-[0.14em] ${ok ? "text-good-deep" : "text-amber"}`}>
            Eligibility check
          </p>
          {CHECKED_BY && <p className="text-meta text-ink-faint">· {CHECKED_BY}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1 sm:col-start-2">
          <h3 id={id} className="text-balance text-[22px] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[26px]">
            {head}
          </h3>
          {rest && <p className="mt-1.5 text-body leading-6 text-ink-soft">{rest}</p>}
        </div>
      </div>

      <ul className="relative mt-4 divide-y divide-hairline rounded-[16px] bg-white/85 px-4 py-3.5 ring-1 ring-black/[0.04]">
        <Criterion
          ok={!noStore}
          label="An online store with a checkout"
          value={
            <span className={`max-w-[45%] shrink-0 truncate text-meta font-semibold ${noStore ? "text-amber" : "hidden text-ink-soft sm:block"}`} dir="ltr">
              {noStore ? "None found" : read.url}
            </span>
          }
        />
        {visitors !== undefined && (
          <Criterion
            ok={trafficOk}
            label="Monthly unique visitors"
            value={<span className={`num shrink-0 text-[17px] font-bold tracking-[-0.01em] ${trafficOk ? "text-ink" : "text-amber"}`}>{fmtN(visitors)}</span>}
          >
            <TrafficMeter visitors={visitors} ok={trafficOk} />
          </Criterion>
        )}
      </ul>

      {e.line.evidence.length > 0 && (
        <div className="relative mt-3">
          <button
            ref={how}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={`rounded-pill px-3 py-1 text-[11px] font-semibold text-brand ring-1 ring-black/[0.04] transition ${open ? "bg-white" : "bg-white/70 hover:bg-white"}`}
          >
            How this was checked · {e.line.evidence.length}
          </button>
          <GlassPopover anchor={how} open={open} onClose={() => setOpen(false)} label="How the eligibility check was done">
            <EvidencePop title="How this was checked" count={e.line.evidence.length} why={e.line.why}>
              {e.line.evidence.map((ev) => <EvidenceRow key={ev.id} e={ev} />)}
            </EvidencePop>
          </GlassPopover>
        </div>
      )}
    </section>
  );
}

/* ── The card ────────────────────────────────────────────────────── */

function Header({ read, children }: { read: BrandRead; children?: ReactNode }) {
  const name = read.identity?.name.value ?? read.url;
  return (
    <div className="flex items-center gap-3.5">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-white p-1 shadow-lift">
        {read.identity?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={read.identity.logo} alt="" className="h-full w-full rounded-[10px] object-cover" />
        ) : (
          <span aria-hidden className="text-[17px] font-bold text-brand">{name[0]?.toUpperCase() ?? "?"}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-semibold leading-6 tracking-[-0.015em] text-ink">{name}</p>
        <p className="truncate text-meta text-ink-faint" dir="ltr">{read.url}</p>
      </div>
      {children}
    </div>
  );
}

export function StoreReadCard({ read, verdict }: { read: BrandRead; verdict?: string }) {
  const has = (k: ReadLayerKey) => read.done.includes(k);
  return (
    <Card className="overflow-hidden p-4 sm:p-5">
      <Header read={read}>
        <button
          type="button"
          onClick={() => openPanel("read")}
          className="btn-soft hidden h-8 shrink-0 items-center rounded-pill px-3.5 text-meta font-semibold sm:inline-flex"
        >
          See everything
        </button>
      </Header>

      {read.eligibility && verdict && <div className="mt-4"><Verdict read={read} e={read.eligibility} line={verdict} /></div>}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {has("category") && (
          <Tile read={read} k="category" icon={ShoppingBag} label="Catalogue">
            <p className="text-[15px] font-semibold leading-6 text-ink">{read.category!.value}</p>
          </Tile>
        )}
        {has("priceBand") && <Tile read={read} k="priceBand" icon={Tag} label="Prices"><Prices read={read} /></Tile>}
        {has("bestsellers") && <Tile read={read} k="bestsellers" icon={Package} label="Bestsellers" wide><Bestsellers read={read} /></Tile>}
        {has("markets") && <Tile read={read} k="markets" icon={Globe} label="Markets"><Markets read={read} /></Tile>}
        {has("socials") && <Tile read={read} k="socials" icon={UsersThree} label="Social"><Socials read={read} /></Tile>}
        {has("voice") && <Tile read={read} k="voice" icon={ChatCircleText} label="Voice"><Voice read={read} /></Tile>}
        {has("seasonality") && <Tile read={read} k="seasonality" icon={CalendarBlank} label="Moments"><Moments read={read} /></Tile>}
      </div>

      <button
        type="button"
        onClick={() => openPanel("read")}
        className="mt-3 w-full rounded-pill py-2 text-meta font-semibold text-brand transition hover:bg-haze sm:hidden"
      >
        See everything found
      </button>
    </Card>
  );
}

/* While the read runs: the same header, and the four agents' tiles filling in as their layers land. */
const LIVE_ROWS: { k: ReadLayerKey; label: string; icon: Icon; doing: string }[] = [
  { k: "category", label: "Catalogue", icon: ShoppingBag, doing: "is extracting your catalogue" },
  { k: "priceBand", label: "Prices", icon: Tag, doing: "is calculating your median price" },
  { k: "voice", label: "Voice", icon: ChatCircleText, doing: "is learning how you write" },
  { k: "markets", label: "Markets", icon: Globe, doing: "is finding your markets" },
];

export function StoreReadLive({ read, agentFor }: { read: BrandRead; agentFor: (k: ReadLayerKey) => string }) {
  const has = (k: ReadLayerKey) => read.done.includes(k);
  const landed = LIVE_ROWS.filter((r) => has(r.k)).length;
  return (
    <Card className="overflow-hidden p-4 sm:p-5">
      <Header read={read}>
        <span className="num inline-flex h-8 shrink-0 items-center gap-2 rounded-pill bg-haze px-3 text-meta font-semibold text-brand">
          <span aria-hidden className="working-ring h-3.5 w-3.5" />
          {landed}/{LIVE_ROWS.length}
        </span>
      </Header>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {LIVE_ROWS.map(({ k, label, icon: I, doing }) => (
          <div key={k} className={`min-w-0 rounded-[18px] p-4 ring-1 transition ${has(k) ? "bg-white/80 ring-brand/[0.07]" : "bg-haze/60 ring-transparent"}`}>
            <div className="flex items-center gap-2">
              <span aria-hidden className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] ${has(k) ? "bg-good/[0.12] text-good-deep" : "bg-white text-brand"}`}>
                {has(k) ? <CheckCircle size={15} weight="fill" /> : <I size={14} weight="bold" />}
              </span>
              <p className="min-w-0 flex-1 truncate text-meta font-semibold text-ink-60">{label}</p>
            </div>
            <div className="mt-3">
              {has(k) ? (
                <TypeOn id={`${read.id}:${k}`}>{readValueTree(read, k, true)}</TypeOn>
              ) : (
                <p className="flex items-start gap-2 text-meta text-ink-faint">
                  <span aria-hidden className="working-ring mt-0.5 h-3 w-3 shrink-0" />
                  <span className="min-w-0"><span className="font-semibold text-ink-soft">{agentFor(k)}</span> {doing}…</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
