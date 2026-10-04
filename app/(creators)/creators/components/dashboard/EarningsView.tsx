"use client";

/* Earnings, rethought around the four questions a creator opens it with.
 *
 *   1. What lands next, and when?   The next payout: the held money, the
 *                                   Friday it goes out, and where to.
 *   2. How much so far?             Paid to date, and the orders behind
 *                                   everything — the unit you are paid in.
 *   3. What is each campaign        One ledger, every campaign once, with
 *      earning?                     its orders, its share, its figure and
 *                                   a status that means one thing. A row
 *                                   opens to its sum: orders x median
 *                                   order x share.
 *   4. How does it work?            Three steps, in the product's words.
 *
 * What it replaced: four equal tiles, one of which added paid and held
 * money into a "total"; an "Earnings by brand" list that repeated the
 * ledger under a lightning bolt; and "Closed ads", which showed only the
 * paid rows, labelled them "Live Performance", and left the $510 waiting
 * for Friday with no row at all.
 *
 * Every figure is the payout ledger's (PAYOUTS in tools.ts). Nothing here
 * estimates what a creator could earn: the calculator is in the
 * conversation, the moment a campaign is joined, and not here. */

import { useMemo, useState } from "react";
import { ArrowRight, Bank, CaretDown, CheckCircle, Info, Lock, ShoppingCart } from "@phosphor-icons/react";
import { Btn, Card, Chip, H } from "../ui";
import { BrandMark, StatTile } from "../figma";
import { Figure } from "../Evidence";
import { PAYOUTS } from "../../lib/agent/tools";
import { money } from "../../lib/agent/model";
import { addDays, campaignOf, startOfDay } from "../../lib/calendar";
import { selectOffer, useConnected, useOffers, usePayout } from "../../lib/store";
import { PayoutSheet } from "../profile/PayoutSheet";
import { useGo } from "../../lib/surface";

type Row = (typeof PAYOUTS)[number];

/** The Friday the next run goes out on — today, if today is Friday. */
function nextFriday(from: Date) {
  const d = startOfDay(from);
  return addDays(d, (5 - d.getDay() + 7) % 7);
}

function status(p: Row): { label: string; tone: "main" | "green" } {
  if (p.state === "escrow") return { label: "Held · Friday", tone: "main" };
  return { label: /accruing/i.test(p.at) ? "Paid · still earning" : "Paid", tone: "green" };
}

export function EarningsView() {
  const go = useGo();
  const offers = useOffers();
  const connected = useConnected().includes("payout");
  const payout = usePayout();
  const [paying, setPaying] = useState(false);
  const friday = useMemo(() => nextFriday(new Date()), []);
  const isToday = friday.getTime() === startOfDay(new Date()).getTime();
  const [open, setOpen] = useState<string | null>(null);

  const held = PAYOUTS.filter((p) => p.state === "escrow");
  const paid = PAYOUTS.filter((p) => p.state === "paid");
  const heldSum = held.reduce((n, p) => n + p.amount.value, 0);
  const paidSum = paid.reduce((n, p) => n + p.amount.value, 0);
  const orders = PAYOUTS.reduce((n, p) => n + p.orders, 0);
  /* Held first, largest first: what is about to move outranks what
     already has. */
  const rows = [...held.sort((a, b) => b.amount.value - a.amount.value), ...paid.sort((a, b) => b.amount.value - a.amount.value)];
  /* By campaign, not by id: the ledger is keyed to the sample creator's
     ids, and a signed-in sample's campaigns end in its own handle. */
  const offerOf = (p: Row) => offers.find((o) => campaignOf(o.id) === campaignOf(p.offerId));
  const names = (ps: Row[]) => ps.map((p) => p.brand).join(" and ");

  return (
    <div className="flex flex-col gap-8 px-4 md:px-0">
      <PayoutSheet open={paying} onClose={() => setPaying(false)} />
      {/* ── 1 and 2: what is next, and what is done ─────────────────── */}
      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-4">
        <Card edge className="flex flex-col p-5 md:p-6">
          <p className="text-eyebrow font-semibold uppercase text-main">Next payout</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="num text-[40px] font-semibold leading-none tracking-[-0.03em] text-ink">{money(heldSum)}</span>
            <span className="text-row font-medium text-ink-60">
              {isToday ? "Today" : friday.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
          <p className="mt-2 max-w-[52ch] text-body text-ink-60">
            {held.length
              ? `Your share of the orders ${names(held)} carried, held by HeyMoon and released with Friday's run.`
              : "Nothing is held right now. Your next orders will land here."}
          </p>

          {/* Where it goes. Without somewhere to send it, a Friday run has
              nowhere to land — said here, where the money is, and not only
              on Explore. */}
          <div className={`mt-5 flex flex-wrap items-center gap-3 rounded-inner px-4 py-3 ${connected ? "bg-green-10" : "bg-amber-soft ring-1 ring-inset ring-amber-line"}`}>
            <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-pill ${connected ? "bg-white text-green" : "bg-white text-amber"}`}>
              {connected ? <CheckCircle size={18} weight="fill" /> : <Bank size={18} weight="fill" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink">{connected ? (payout ? `Paid to the account ending ${payout.last4}` : "Paid to your bank account") : "Add where the money goes"}</span>
              <span className="block text-meta text-ink-60">{connected ? "Every Friday, on the orders that cleared that week." : "A bank account in your name, so Friday's run can reach you."}</span>
            </span>
            {connected
              ? <Btn dense size="sm" variant="quiet" onClick={() => setPaying(true)}>Change</Btn>
              : <Btn dense size="sm" onClick={() => setPaying(true)}>Add</Btn>}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
          <StatTile label="Paid to you so far" icon="payments" value={money(paidSum)}
            delta={paid.length ? `from ${paid.length} ${paid.length === 1 ? "campaign" : "campaigns"}` : undefined} />
          <StatTile label="Orders on your codes" icon="orders" value={String(orders)}
            delta={`across ${PAYOUTS.length} ${PAYOUTS.length === 1 ? "campaign" : "campaigns"}`} />
        </div>
      </section>

      {/* ── 3: every campaign once ─────────────────────────────────── */}
      <section>
        <H rule aside={<span className="hidden text-meta text-ink-50 sm:inline">Open a row to see its sum</span>}>By campaign</H>
        <Card edge className="mt-3 overflow-hidden md:mt-4">
          <div className="hidden grid-cols-[minmax(0,1fr)_80px_72px_96px_140px_24px] items-center gap-3 border-b border-hairline bg-paper px-4 py-2.5 text-eyebrow font-semibold uppercase text-ink-50 md:grid">
            <span>Campaign</span><span className="text-end">Orders</span><span className="text-end">Payout</span><span className="text-end">Earned</span><span>Status</span><span />
          </div>
          <ul className="divide-y divide-hairline">
            {rows.map((p) => {
              const o = offerOf(p);
              const st = status(p);
              const isOpen = open === p.id;
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 text-start transition hover:bg-lilac/30 md:grid-cols-[minmax(0,1fr)_80px_72px_96px_140px_24px]">
                    <span className="min-w-0">
                      <span className="block truncate text-body font-semibold text-ink">{o?.title ?? p.brand}</span>
                      <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
                        <BrandMark name={p.brand} logo={o?.brandLogo} size={16} />
                        {o?.code && <span className="num truncate text-meta text-ink-50">· {o.code}</span>}
                      </span>
                    </span>
                    <span className="num text-end text-row font-semibold text-ink md:hidden">{money(p.amount.value)}</span>
                    {/* Phone: the facts on one line under the name. */}
                    <span className="col-span-2 flex flex-wrap items-center gap-2 text-meta text-ink-60 md:hidden">
                      <span className="num">{p.orders} orders</span>·<span className="num">{o?.commissionPct ?? "—"}% payout</span>
                      <Chip tone={st.tone} className="ms-auto">{st.label}</Chip>
                    </span>
                    <span className="num hidden text-end text-body text-ink md:block">{p.orders}</span>
                    <span className="num hidden text-end text-body text-ink md:block">{o?.commissionPct ?? "—"}%</span>
                    <span className="num hidden text-end text-body font-semibold text-ink md:block">{money(p.amount.value)}</span>
                    <span className="hidden md:block"><Chip tone={st.tone}>{st.label}</Chip></span>
                    <CaretDown size={14} aria-hidden className={`hidden justify-self-end text-ink-50 transition-transform md:block ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="bg-paper/70 px-4 pb-4 pt-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-meta font-semibold text-ink-50">How it adds up</p>
                          <p className="num mt-0.5 text-body text-ink">{p.amount.computedFrom ?? p.amount.why}</p>
                          <p className="mt-1 text-meta text-ink-60">
                            {p.gate}{/accruing/i.test(p.at) ? " The code is still carrying orders, so this figure keeps growing." : ""}
                          </p>
                        </div>
                        {o && (
                          <button type="button" onClick={() => { selectOffer(o.id); go("campaign"); }}
                            className="inline-flex shrink-0 items-center gap-1 self-start rounded-pill px-3 py-1.5 text-meta font-semibold text-main transition hover:bg-lilac">
                            Open campaign <ArrowRight size={12} weight="bold" aria-hidden className="rtl:rotate-180" />
                          </button>
                        )}
                      </div>
                      {/* THE EVIDENCE ON A LINE OF ITS OWN. Its panel opens
                          inline, and beside the sum it widened a shrink-0
                          column until "How it adds up" was one word a line.
                          Here it opens downward, at the row's full width. */}
                      <div className="mt-3 border-t border-hairline pt-3">
                        <Figure src={p.amount} render={money(p.amount.value)} size="sm" label="Where this comes from" />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* ── 4: how it works, once ──────────────────────────────────── */}
      <section>
        <H rule>How you are paid</H>
        <ol className="mt-3 grid gap-3 md:mt-4 md:grid-cols-3 md:gap-4">
          {[
            { icon: ShoppingCart, title: "Orders are counted", body: "Every order that uses your code or your tracking link is counted to you, on every campaign you are on." },
            { icon: Lock, title: "Held for you", body: "The brand funded the phase before the brief was written, so your share is already with HeyMoon, not waiting on the brand." },
            { icon: Bank, title: "Paid every Friday", body: "Your share of the orders that cleared that week goes out in Friday's run. A good week pays more; there is no ceiling." },
          ].map((s, i) => (
            <li key={s.title}>
              <Card edge className="flex h-full gap-3 p-4">
                <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-inner bg-lilac text-main"><s.icon size={18} weight="fill" /></span>
                <span className="min-w-0">
                  <span className="block text-body font-semibold text-ink"><span className="num text-main">{i + 1}.</span> {s.title}</span>
                  <span className="mt-1 block text-meta leading-5 text-ink-60">{s.body}</span>
                </span>
              </Card>
            </li>
          ))}
        </ol>
        <p className="mt-3 flex items-start gap-1.5 text-meta text-ink-50">
          <Info size={14} aria-hidden className="mt-0.5 shrink-0" />
          A performance campaign has no floor either: a quiet week pays less. Nothing on this page is an estimate.
        </p>
      </section>
    </div>
  );
}
