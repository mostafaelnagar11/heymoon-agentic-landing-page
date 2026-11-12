"use client";

/* What the brand confirms BEFORE it pays (brand team, "Getting to know our brands", 15 Oct).

   "How am I going to pay 1,000 if I don't understand what you're going to promote for me?" Three blocks answer it,
   in the thread, before Pay:
   - MarketsPick: which markets this campaign runs in, from the markets the read found, with a way to point HeyMoon
     at a regional store instead (sephora.me rather than sephora.com).
   - ProductsPick: what it pushes: the bestsellers, a new launch, or products the brand picks.
   - IncludesBlock: what the $1,000 buys, whether anything else is charged, whether they can choose their creators,
     and the guarantee as the refund it is.
   The pickers are answered once and then show what was chosen; changing it later is a sentence, as every plan edit
   is. */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, CheckCircle, Circle, EnvelopeSimple, Globe, MagnifyingGlass, Package, ShieldCheck, Sparkle, Storefront, Star,
  Ticket,
} from "@phosphor-icons/react";
import type { BrandRead, Plan, ProductFocus } from "../lib/agent/types";
import { marketName, PHASE1_BUDGET } from "../lib/agent/tools";
import { fmtUSD } from "../lib/mock/campaigns";
import { Btn, Card, DonePill } from "./ui";
import { Emblem } from "../../../_shared/Emblem";

const listOf = (parts: string[]) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

/* ------------------------------------------------------------------ */
/* Markets                                                             */
/* ------------------------------------------------------------------ */

const FLAGS = new Set(["ae", "bh", "eg", "jo", "kw", "om", "qa", "sa"]);
const FlagDot = ({ code, size = 20 }: { code: string; size?: number }) => {
  const c = code.toLowerCase();
  return FLAGS.has(c) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/flags/${c}.svg`} alt="" className="shrink-0 rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full bg-haze text-[8px] font-bold text-ink-soft ring-2 ring-white" style={{ width: size, height: size }}>{code}</span>
  );
};

/* The head every picker opens with: what it asks, on a lit tile. */
function PickHead({ icon: I, title, sub }: { icon: typeof Star; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="grad-tile grid h-10 w-10 shrink-0 place-items-center rounded-[12px] shadow-pri">
        <I size={19} weight="fill" />
      </span>
      <div className="min-w-0">
        <p className="text-[16px] font-semibold leading-6 text-ink">{title}</p>
        {sub && <p className="text-meta leading-5 text-ink-soft">{sub}</p>}
      </div>
    </div>
  );
}

export function MarketsPick({ read, chosen, onConfirm }: {
  read: BrandRead;
  chosen: string[] | null;
  onConfirm: (codes: string[]) => void;
}) {
  const markets = useMemo(() => [...(read.markets?.value ?? [])].sort((a, b) => b.share - a.share), [read]);
  const [on, setOn] = useState<Set<string>>(() => new Set(markets.map((m) => m.code)));
  const toggle = (c: string) => setOn((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const picked = markets.filter((m) => on.has(m.code)).map((m) => m.code);
  const top = Math.max(...markets.map((m) => m.share), 1);

  if (chosen) {
    return (
      <DonePill lead={<span className="flex -space-x-1.5 rtl:space-x-reverse">{chosen.map((c) => <FlagDot key={c} code={c} size={18} />)}</span>}>
        Runs in {listOf(chosen.map(marketName))}, from {read.url}.
      </DonePill>
    );
  }

  return (
    <Card className="p-5">
      <PickHead
        icon={Globe}
        title="Where should this campaign run?"
        sub={`These are the markets ${read.url} sells into, by share of its traffic. Keep the ones this store serves for you.`}
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="group" aria-label="Markets">
        {markets.map((m) => {
          const sel = on.has(m.code);
          return (
            <button
              key={m.code}
              type="button"
              aria-pressed={sel}
              onClick={() => toggle(m.code)}
              className={`flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-start transition ${
                sel ? "bg-white shadow-lift ring-1 ring-brand/25" : "bg-haze/60 opacity-70 hover:opacity-100"
              }`}
            >
              <FlagDot code={m.code} size={26} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-body font-semibold text-ink">{m.name}</span>
                  <span className="num shrink-0 text-meta font-semibold text-ink-soft">{m.share}%</span>
                </span>
                <span className="mt-1.5 block h-1 rounded-pill bg-track">
                  <span className={`block h-full rounded-pill ${sel ? "bg-[linear-gradient(90deg,#6848D1,#A65FED)]" : "bg-ink/20"}`} style={{ width: `${(m.share / top) * 100}%` }} />
                </span>
              </span>
              <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${sel ? "grad-tile" : "bg-white ring-1 ring-ink/10"}`}>
                {sel && <CheckCircle size={14} weight="fill" />}
              </span>
            </button>
          );
        })}
      </div>
      {/* The sephora.com vs sephora.me case: the same brand, a different store per region, and not always the same
          owner. HeyMoon reads the link it was given, so the way to the right store is to give it that link. */}
      <p className="mt-3 flex items-start gap-2.5 rounded-[14px] bg-haze/70 px-3.5 py-3 text-meta leading-5 text-ink-soft">
        <Storefront size={14} weight="fill" className="mt-0.5 shrink-0 text-brand" aria-hidden />
        <span>
          Selling a country from a different site, like sephora.me rather than sephora.com? Paste that store&apos;s link
          in the message box and I&apos;ll read it instead.
        </span>
      </p>
      <div className="mt-4">
        <Btn disabled={!picked.length} onClick={() => onConfirm(picked)}>
          {/* Two words: the tiles above already say where (Mostafa, 20 Oct: "only Run it or confirm"). */}
          {picked.length ? "Run it" : "Pick a market"}
        </Btn>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   What it pushes
   ══════════════════════════════════════════════════════════════════ */

export function focusText(f: ProductFocus | undefined, bestsellers: string[]): string {
  if (!f || f.kind === "bestsellers") return bestsellers.length ? `Your bestsellers: ${listOf(bestsellers)}` : "Your bestsellers";
  if (f.kind === "launch") return `Your new launch: ${f.note}`;
  return listOf(f.products);
}

export function ProductsPick({ read, chosen, onConfirm }: {
  read: BrandRead;
  chosen: ProductFocus | null;
  onConfirm: (f: ProductFocus) => void;
}) {
  const all = read.bestsellers?.value ?? [];
  const top = all.slice(0, 3).map((p) => p.name);
  const [kind, setKind] = useState<ProductFocus["kind"]>("bestsellers");
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (n: string) => setPicked((s) => { const x = new Set(s); if (x.has(n)) x.delete(n); else x.add(n); return x; });

  if (chosen) {
    const thumbs = (chosen.kind === "specific" ? all.filter((p) => chosen.products.includes(p.name)) : chosen.kind === "bestsellers" ? all.slice(0, 3) : [])
      .filter((p) => p.img).slice(0, 3);
    return (
      <DonePill
        lead={thumbs.length ? (
          <span className="flex -space-x-1.5 rtl:space-x-reverse">
            {thumbs.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.name} src={p.img} alt="" className="h-[22px] w-[22px] rounded-[7px] object-cover ring-2 ring-white" />
            ))}
          </span>
        ) : undefined}
      >
        Pushes {focusText(chosen, top).replace(/^Your/, "your")}.
      </DonePill>
    );
  }

  const ready = kind === "bestsellers" || (kind === "launch" && note.trim().length > 1) || (kind === "specific" && picked.size > 0);
  const confirm = () => {
    if (!ready) return;
    if (kind === "bestsellers") onConfirm({ kind });
    else if (kind === "launch") onConfirm({ kind, note: note.trim() });
    else onConfirm({ kind, products: all.map((p) => p.name).filter((n) => picked.has(n)) });
  };

  const opt = (k: ProductFocus["kind"], Icon: typeof Star, title: string, sub: string, extra?: React.ReactNode) => {
    const on = kind === k;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => setKind(k)}
        className={`flex w-full flex-col rounded-[18px] p-4 text-start transition ${
          on ? "bg-white shadow-lift ring-2 ring-brand/30" : "bg-haze/60 hover:bg-haze"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${on ? "grad-tile" : "bg-white text-ink-soft"}`}>
            <Icon size={16} weight="fill" />
          </span>
          <span className="text-body font-semibold text-ink">{title}</span>
        </span>
        <span className="mt-2 block text-meta leading-5 text-ink-soft">{sub}</span>
        {extra}
      </button>
    );
  };

  return (
    <Card className="p-5">
      <PickHead icon={Package} title="What should the campaign push?" sub="The creators and the brief are built around it." />
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Product focus">
        {opt("bestsellers", Star, "Your bestsellers", top.length ? listOf(top) : "What sells most on your store today",
          all.some((p) => p.img) ? (
            <span className="mt-3 flex gap-1.5" aria-hidden>
              {all.slice(0, 3).filter((p) => p.img).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.name} src={p.img} alt="" className="h-11 w-11 rounded-[10px] object-cover" />
              ))}
            </span>
          ) : undefined)}
        {opt("launch", Sparkle, "A new launch", "A product that is new or about to drop")}
        {opt("specific", Package, "Specific products", "Pick them from your catalogue")}
      </div>
      {kind === "launch" && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Name the product, or paste its link"
          aria-label="The new launch"
          className="mt-3 h-11 w-full rounded-[14px] border border-transparent bg-haze/70 px-3.5 text-body text-ink outline-none placeholder:text-ink-faint focus:border-brand/30 focus:bg-white"
        />
      )}
      {kind === "specific" && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {all.map((p) => {
            const sel = picked.has(p.name);
            return (
              <button
                key={p.name}
                type="button"
                aria-pressed={sel}
                onClick={() => toggle(p.name)}
                className={`flex items-center gap-2.5 rounded-[14px] p-2 text-start transition ${sel ? "bg-white shadow-lift ring-1 ring-brand/30" : "bg-haze/60 hover:bg-haze"}`}
              >
                {p.img
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.img} alt="" className="h-9 w-9 shrink-0 rounded-[9px] object-cover" />
                  : <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-white text-ink-faint"><Package size={14} /></span>}
                <span className="min-w-0 flex-1 truncate text-meta font-semibold text-ink">{p.name}</span>
                {sel ? <CheckCircle size={16} weight="fill" className="shrink-0 text-brand" aria-hidden /> : <Circle size={16} className="shrink-0 text-ink-faint" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-4">
        <Btn disabled={!ready} onClick={confirm}>Use this</Btn>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   What the $1,000 buys
   ══════════════════════════════════════════════════════════════════ */

export function IncludesBlock({ plan, salesFirst = false }: {
  plan: Plan;
  salesFirst?: boolean;
}) {
  const budget = plan.budget.value || PHASE1_BUDGET;
  const target = plan.price.revenueTarget.value;
  const tile = (Icon: typeof Star, title: string, body: string, lit = false) => (
    <li key={title} className={`rounded-[16px] p-3.5 ${lit ? "col-span-2 grad-ws sm:col-span-1 ring-1 ring-inset ring-brand/[0.1]" : "bg-haze/60"}`}>
      <span aria-hidden className={`grid h-8 w-8 place-items-center rounded-[10px] ${lit ? "grad-tile" : "bg-white text-brand shadow-edge"}`}>
        <Icon size={15} weight="fill" />
      </span>
      <p className="mt-2.5 text-meta font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-[11.5px] leading-4 text-ink-soft">{body}</p>
    </li>
  );
  const guarantee = tile(ShieldCheck, "The guarantee", `${fmtUSD(target)} in sales, or the missed share back.`, true);
  return (
    <Card className="p-5">
      <PickHead icon={ShieldCheck} title={`What your ${fmtUSD(budget)} includes`} />
      {/* One line each (19 Oct: "no one is reading this much"). No creator fees: what creators are paid is never
          shown to a brand, as a total or otherwise (12 Nov). On a phone the guarantee takes the full row. */}
      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {salesFirst && guarantee}
        {tile(MagnifyingGlass, "The work", "Matching, vetting and the brief.")}
        {tile(Ticket, "Tracking", "A code per creator, so every order counts.")}
        {!salesFirst && guarantee}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-white/80 px-4 py-3 ring-1 ring-brand/[0.07]">
        <p className="text-meta font-semibold text-ink">Any other fees?</p>
        <p className="num text-meta text-ink-soft">Only VAT, {fmtUSD(plan.price.vat.value)}.</p>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   The plan, by email
   ══════════════════════════════════════════════════════════════════

   The card is the email, drawn as one: who it is from, who it went to, the subject, the plan in it, and its button,
   which is the way back that the return visit starts from. */
export function EmailSentBlock({ to, plan }: { to: string; plan: Plan }) {
  const crew = plan.creators.value.length;
  const budget = plan.budget.value || PHASE1_BUDGET;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-brand/[0.07] bg-haze/60 px-4 py-2.5">
        <EnvelopeSimple size={14} weight="fill" className="shrink-0 text-brand" aria-hidden />
        <span className="text-meta font-semibold text-ink-soft">Inbox</span>
        <span className="ms-auto rounded-pill bg-white px-2 py-0.5 text-[11px] font-semibold text-good-deep shadow-edge">Sent</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#6848D1,#C2418B)] text-white">
            <Emblem size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-ink">HeyMoon.AI</p>
            <p className="truncate text-meta text-ink-faint" dir="ltr">to {to}</p>
          </div>
        </div>
        <p className="mt-4 text-[17px] font-semibold leading-6 text-ink">Your HeyMoon plan for {plan.brandName}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { k: "Phase 1", v: fmtUSD(budget) },
            { k: "Guaranteed", v: fmtUSD(plan.price.revenueTarget.value) },
            { k: "Creators", v: String(crew) },
          ].map((f) => (
            <div key={f.k} className="rounded-[14px] bg-haze/60 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{f.k}</p>
              <p className="num mt-0.5 text-[17px] font-bold text-ink">{f.v}</p>
            </div>
          ))}
          <div className="rounded-[14px] bg-haze/60 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Markets</p>
            <span className="mt-1.5 flex -space-x-1.5 rtl:space-x-reverse">{plan.markets.value.map((c) => <FlagDot key={c} code={c} size={20} />)}</span>
          </div>
        </div>
        <p className="mt-3 text-meta leading-5 text-ink-soft">
          Phase 1: {fmtUSD(budget)}, with {fmtUSD(plan.price.revenueTarget.value)} in sales
          guaranteed. {crew} creator{crew === 1 ? "" : "s"} in {listOf(plan.markets.value.map(marketName))}.
        </p>
        <Link
          href="/brands/c?back=1"
          className="btn-pri mt-4 inline-flex h-10 items-center gap-1.5 rounded-pill px-4 text-meta font-semibold"
        >
          Pick up where you left off
          <ArrowRight size={13} weight="bold" aria-hidden className="rtl:rotate-180" />
        </Link>
      </div>
    </Card>
  );
}
