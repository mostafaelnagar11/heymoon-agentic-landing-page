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
import { CheckCircle, Circle, Package, ShieldCheck, Sparkle, Storefront, Star } from "@phosphor-icons/react";
import type { BrandRead, Plan, ProductFocus } from "../lib/agent/types";
import { marketName, PHASE1_BUDGET } from "../lib/agent/tools";
import { guaranteeLine } from "../lib/agent/guarantee";
import { fmtUSD } from "../lib/mock/campaigns";
import { Btn, Card } from "./ui";

const listOf = (parts: string[]) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

/* ------------------------------------------------------------------ */
/* Markets                                                             */
/* ------------------------------------------------------------------ */

export function MarketsPick({ read, chosen, onConfirm }: {
  read: BrandRead;
  /** What the brand confirmed, once it has. */
  chosen: string[] | null;
  onConfirm: (codes: string[]) => void;
}) {
  const markets = useMemo(() => [...(read.markets?.value ?? [])].sort((a, b) => b.share - a.share), [read]);
  const [on, setOn] = useState<Set<string>>(() => new Set(markets.map((m) => m.code)));
  const toggle = (c: string) => setOn((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const picked = markets.filter((m) => on.has(m.code)).map((m) => m.code);

  if (chosen) {
    return (
      <Card className="flex items-center gap-2 px-3.5 py-2.5">
        <CheckCircle size={14} weight="fill" className="shrink-0 text-good-deep" aria-hidden />
        <p className="text-meta text-ink-soft">Runs in {listOf(chosen.map(marketName))}, from {read.url}.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-body font-semibold text-ink">Where should this campaign run?</p>
      <p className="mt-0.5 text-meta leading-5 text-ink-soft">
        These are the markets {read.url} sells into, by share of its traffic. Keep the ones this store serves for you.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Markets">
        {markets.map((m) => {
          const sel = on.has(m.code);
          return (
            <button
              key={m.code}
              type="button"
              aria-pressed={sel}
              onClick={() => toggle(m.code)}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-meta font-medium transition ${
                sel ? "border-brand/40 bg-brand/[0.06] text-ink" : "border-hairline bg-white text-ink-soft hover:bg-wash"
              }`}
            >
              {sel ? <CheckCircle size={13} weight="fill" className="text-brand" aria-hidden /> : <Circle size={13} className="text-ink-faint" aria-hidden />}
              {m.name}
              <span className="tabular-nums text-ink-faint">{m.share}%</span>
            </button>
          );
        })}
      </div>
      {/* The sephora.com vs sephora.me case: the same brand, a different store per region, and not always the same
          owner. HeyMoon reads the link it was given, so the way to the right store is to give it that link. */}
      <p className="mt-3 flex items-start gap-2 rounded-control bg-wash px-2.5 py-2 text-[11px] leading-4 text-ink-soft">
        <Storefront size={12} weight="fill" className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
        <span>
          Selling a country from a different site, like sephora.me rather than sephora.com? Paste that store&apos;s link
          in the message box and I&apos;ll read it instead.
        </span>
      </p>
      <div className="mt-3">
        <Btn size="sm" disabled={!picked.length} onClick={() => onConfirm(picked)}>
          {/* Two words: the pills above already say where (Mostafa, 20 Oct: "only Run it or confirm"). */}
          {picked.length ? "Run it" : "Pick a market"}
        </Btn>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

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
    return (
      <Card className="flex items-center gap-2 px-3.5 py-2.5">
        <CheckCircle size={14} weight="fill" className="shrink-0 text-good-deep" aria-hidden />
        <p className="text-meta text-ink-soft">Pushes {focusText(chosen, top).replace(/^Your/, "your")}.</p>
      </Card>
    );
  }

  const ready = kind === "bestsellers" || (kind === "launch" && note.trim().length > 1) || (kind === "specific" && picked.size > 0);
  const confirm = () => {
    if (!ready) return;
    if (kind === "bestsellers") onConfirm({ kind });
    else if (kind === "launch") onConfirm({ kind, note: note.trim() });
    else onConfirm({ kind, products: all.map((p) => p.name).filter((n) => picked.has(n)) });
  };

  const opt = (k: ProductFocus["kind"], Icon: typeof Star, title: string, sub: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={kind === k}
      onClick={() => setKind(k)}
      className={`flex w-full items-start gap-2.5 rounded-control border px-3 py-2.5 text-start transition ${
        kind === k ? "border-brand/40 bg-brand/[0.05]" : "border-hairline bg-white hover:bg-wash"
      }`}
    >
      <Icon size={15} weight={kind === k ? "fill" : "regular"} className={`mt-0.5 shrink-0 ${kind === k ? "text-brand" : "text-ink-faint"}`} aria-hidden />
      <span className="min-w-0">
        <span className="block text-meta font-semibold text-ink">{title}</span>
        <span className="block text-[11px] leading-4 text-ink-soft">{sub}</span>
      </span>
    </button>
  );

  return (
    <Card className="p-4">
      <p className="text-body font-semibold text-ink">What should the campaign push?</p>
      <p className="mt-0.5 text-meta leading-5 text-ink-soft">The creators and the brief are built around it.</p>
      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Product focus">
        {opt("bestsellers", Star, "Your bestsellers", top.length ? listOf(top) : "What sells most on your store today")}
        {opt("launch", Sparkle, "A new launch", "A product that is new or about to drop")}
        {kind === "launch" && (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Name the product, or paste its link"
            aria-label="The new launch"
            className="w-full rounded-control border border-black/[0.1] bg-white px-3 py-2.5 text-meta text-ink outline-none placeholder:text-ink-faint focus:border-ink/25"
          />
        )}
        {opt("specific", Package, "Specific products", "Pick them from your catalogue")}
        {kind === "specific" && (
          <div className="flex flex-wrap gap-2 ps-1">
            {all.map((p) => {
              const sel = picked.has(p.name);
              return (
                <button
                  key={p.name}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => toggle(p.name)}
                  className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[11px] font-medium transition ${
                    sel ? "border-brand/40 bg-brand/[0.06] text-ink" : "border-hairline bg-white text-ink-soft hover:bg-wash"
                  }`}
                >
                  {sel ? <CheckCircle size={12} weight="fill" className="text-brand" aria-hidden /> : <Circle size={12} className="text-ink-faint" aria-hidden />}
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-3">
        <Btn size="sm" disabled={!ready} onClick={confirm}>Use this</Btn>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* What the $1,000 includes                                            */
/* ------------------------------------------------------------------ */

export function IncludesBlock({ plan, salesFirst = false }: {
  plan: Plan;
  /** E-commerce managers and owners: the guarantee leads (brand team, 15 Oct). */
  salesFirst?: boolean;
}) {
  const crew = plan.creators.value.length;
  const budget = plan.budget.value || PHASE1_BUDGET;
  const target = plan.price.revenueTarget.value;
  const row = (title: string, body: string) => (
    <li className="flex gap-2.5">
      <CheckCircle size={14} weight="fill" className="mt-0.5 shrink-0 text-good" aria-hidden />
      <span className="min-w-0 text-meta leading-5 text-ink-soft">
        <span className="font-semibold text-ink">{title}</span> {body}
      </span>
    </li>
  );
  const qa = (q: string, a: string) => (
    <div className="border-t border-hairline pt-2.5">
      <p className="text-meta font-semibold text-ink">{q}</p>
      <p className="mt-0.5 text-meta leading-5 text-ink-soft">{a}</p>
    </div>
  );
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-body font-semibold text-ink">
        <ShieldCheck size={16} weight="fill" className="text-brand" aria-hidden />
        What your {fmtUSD(budget)} includes
      </p>
      <ul className="mt-3 space-y-2">
        {salesFirst && row("The guarantee.", guaranteeLine(budget, target))}
        {row("Your creators.", `The fees for the ${crew} creator${crew === 1 ? "" : "s"} in your warm-up crew, ${fmtUSD(plan.price.crewCost.value)} of it, paid as one sum.`)}
        {row("The work.", "Matching the creators to your products and markets, vetting each one for brand and fraud risk, and writing their brief.")}
        {row("Tracking.", "A code and a link for every creator, so each order they bring in is counted.")}
        {!salesFirst && row("The guarantee.", guaranteeLine(budget, target))}
      </ul>
      <div className="mt-3 space-y-2.5">
        {qa("Any other fees?", `No. VAT is the only addition, ${fmtUSD(plan.price.vat.value)}, and nothing after Phase 1 is charged unless you choose to continue.`)}
        {qa("Can I choose my own creators?", "HeyMoon matches them to what you sell and where. You see who they are the moment Phase 1 starts, and no ad goes out until you approve it.")}
      </div>
    </Card>
  );
}
