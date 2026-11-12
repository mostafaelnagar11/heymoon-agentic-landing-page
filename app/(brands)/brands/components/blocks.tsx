"use client";

/* The typed blocks a thread can contain.

   A conversation in this product is not a list of strings. Each turn is
   one of these, and each is the same component the rest of the app uses
   — the plan card in the thread IS the plan card on the proposal screen,
   reading the same object. */

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, Check, CheckCircle, EnvelopeSimple, Lightning, LockSimple, Path, TrendUp,
  ShieldCheck, Ticket, UsersThree, WarningCircle,
} from "@phosphor-icons/react";
import type { ApprovalRequest, BrandRead, Eligibility, FundingRequest, Plan, PlanChange, ReadLayerKey, Report } from "../lib/agent/types";
import { UNLOCK_AT, fmtUSD, phaseTitle } from "../lib/mock/campaigns";
import { confirmFunding, cancelFunding, openPanel, usePhaseRequested, setAdState, setApprovalState, useAds, useCan, usePaid, useStore } from "../lib/store";
import { Btn, Card, Eyebrow, Pill } from "./ui";
import { Figure } from "./Evidence";
import { PHASE1_BUDGET, PHASE1_ROAS, PHASE_BUDGETS, PHASE_MULTIPLES, READ_TASKS } from "../lib/agent/tools";
import { shortfallLine } from "../lib/agent/guarantee";
import { BILLING_COUNTRIES, invoiceNo, vatOnBudget, vatRateFor } from "../lib/agent/billing";
import {
  CONFIDENCE_HIGH_RATIO, CONFIDENCE_MEDIUM_RATIO, getConfidence, type ConfidenceLevel,
} from "../lib/agent/model";
import { PlanCard, ConfidenceMeter } from "./PlanCard";
import { CreatorNames, CreatorSummary } from "./CreatorCard";
import { ApprovalCard } from "./AdCards";
import { StoreReadCard, StoreReadLive } from "./chat/StoreRead";
import { Emblem } from "../../../_shared/Emblem";
import { OnlyAdmins } from "./dashboard/Roles";
import { useT } from "../lib/i18n";

/* ------------------------------------------------------------------ */
/* Attribution                                                         */
/* ------------------------------------------------------------------ */

export function ChangesBlock({ changes }: { changes: PlanChange[] }) {
  /* Anything that names a person lives in `detail`, apart from `to`. So
     a change to the crew reads as counts before payment — "4 matched · 3
     out" — and only says who came in and who went out once Phase 1 is
     paid, which is when names are allowed at all. */
  const paid = usePaid();
  if (!changes.length) {
    return (
      <Card className="p-3">
        <p className="text-meta text-ink-faint">Nothing moved. The plan already said that.</p>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <p className="border-b border-hairline px-3 py-2 text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-faint">
        What moved
      </p>
      <ul className="divide-y divide-hairline">
        {changes.map((c) => (
          <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2.5">
            <span className="text-meta font-semibold text-ink">{c.label}</span>
            <span className="text-meta text-ink-faint line-through">{c.from}</span>
            <ArrowRight size={11} weight="bold" className="text-ink-faint rtl:rotate-180" aria-hidden />
            <span className="text-meta font-semibold text-brand">{c.to}</span>
            {paid && c.detail && (
              <span className="w-full text-meta leading-4 text-ink-soft">{c.detail}</span>
            )}
            <span className="w-full text-meta leading-4 text-ink-faint">{c.because}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Starting a phase — the payment confirmation, inside the thread      */
/* ------------------------------------------------------------------ */

/* What a brand must know before it pays (Roula, 29 Oct, agreed with Alex and Phill): the ROAS path is fixed,
   every creator gets a unique code that has to beat any site-wide discount, and HeyMoon chooses the creators.
   On the payment card, above Pay, because every way to start a phase ends here: the "Start Phase 1" chip opens
   this card without the phases card ever being shown. One line each. The landing says the same three things in
   "Before you start" (app/(site)/_site/proof/BeforeYouStart.tsx). The path is read from the fixed phases. */
function BeforeYouPay() {
  const path = PHASE_BUDGETS.map((b, i) => `${fmtUSD(b)} at ${PHASE_MULTIPLES[i]}x`).join(", then ");
  const rows: { icon: typeof Path; title: string; body: string }[] = [
    { icon: Path, title: "A fixed ROAS path", body: `${path}. The same for every brand; you don't set the ROAS.` },
    { icon: Ticket, title: "A unique code per creator", body: "It tracks every sale, so it has to beat any site-wide discount you run." },
    { icon: UsersThree, title: "HeyMoon chooses the creators", body: "You don't select them. That is what lets the return be guaranteed." },
  ];
  return (
    <div>
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-orchid">Before you start</p>
      <ul className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
        {rows.map(({ icon: I, title, body }) => (
          <li key={title} className="rounded-[16px] bg-haze/70 p-3.5">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-[10px] bg-white text-brand shadow-edge">
              <I size={15} weight="bold" />
            </span>
            <p className="mt-2.5 text-meta font-semibold leading-4 text-ink">{title}</p>
            <p className="mt-1 text-[11.5px] leading-4 text-ink-soft">{body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FundingBlock({ req, onConfirmed, onCancelled }: {
  req: FundingRequest;
  onConfirmed: (id: string) => void;
  onCancelled?: () => void;
}) {
  const live = useStore((s) => s.funding[req.id]) ?? req;
  const [busy, setBusy] = useState(false);
  /* Billed to (21 Oct): three answers before Pay, in place of a saved card. The VAT follows the UAE question. */
  const [brandName, setBrandName] = useState("");
  const [country, setCountry] = useState("");
  const [uae, setUae] = useState<boolean | null>(null);

  /* Once paid, this block steps aside. The thread pushes the receipt as
     its own block straight after it, so a receipt here as well would
     show the same payment twice in a row. */
  if (live.state === "confirmed") {
    return (
      <Card className="flex items-center gap-2.5 !rounded-full px-3 py-2">
        <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-good text-white"><Check size={12} weight="bold" /></span>
        <p className="text-meta font-medium text-ink-soft">Paid. The receipt is below.</p>
      </Card>
    );
  }
  if (live.state === "cancelled") {
    return (
      <Card className="p-4">
        <p className="text-body text-ink-soft">Not started. Nothing was charged, and the plan is unchanged.</p>
      </Card>
    );
  }

  /* The guaranteed figure, worked out the same way the quote works it
     out: the phase budget at the warm-up multiple. Taken from `amount`
     rather than read out of the prose in `commits`, so the two can
     never drift apart. */
  const guaranteed = live.amount.value * PHASE1_ROAS;
  const amount = live.amount.value;
  const vat = uae === null ? null : vatOnBudget(amount, uae);
  const total = amount + (vat ?? 0);
  const pct = uae === null ? null : Math.round(vatRateFor(uae) * 100);
  const ready = !!brandName.trim() && !!country && uae !== null;
  const field = "h-11 w-full rounded-[14px] border border-transparent bg-haze/70 px-3.5 text-body text-ink outline-none transition placeholder:text-ink-faint hover:bg-haze focus:border-brand/30 focus:bg-white";

  return (
    <Card className="overflow-hidden">
      {/* The sum, said once and large, on the gradient: this is the one card in the product that moves money. */}
      <div className="grad-promo relative overflow-hidden px-5 pb-5 pt-4 sm:px-6">
        <span aria-hidden className="pointer-events-none absolute -end-12 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-2.5">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/15 ring-1 ring-inset ring-white/25">
            <ShieldCheck size={16} weight="fill" />
          </span>
          <p className="text-body font-semibold">{phaseTitle(live.phaseNo)}</p>
          <span className="ms-auto rounded-pill bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ring-white/25">
            Phase {live.phaseNo} only
          </span>
        </div>
        <p className="num relative mt-4 flex items-baseline gap-2">
          <span className="text-[40px] font-bold leading-none tracking-[-0.035em]">{fmtUSD(total)}</span>
          <span className="text-body font-medium text-white/80">today</span>
        </p>
        <p className="num relative mt-1.5 text-meta text-white/80">
          {vat === null ? "+ VAT, depending on where the company is registered" : vat ? `${fmtUSD(amount)} + ${fmtUSD(vat)} VAT (${pct}%)` : `${fmtUSD(amount)} · no VAT (0%)`}
        </p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1 text-meta font-semibold ring-1 ring-inset ring-white/25">
            <CheckCircle size={13} weight="fill" aria-hidden /> {fmtUSD(guaranteed)} in sales guaranteed
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1 text-meta font-semibold ring-1 ring-inset ring-white/25">
            <CheckCircle size={13} weight="fill" aria-hidden /> Committed: Phase {live.phaseNo} only
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <p className="flex items-start gap-2.5 rounded-[14px] bg-good/[0.07] px-3.5 py-3 text-meta leading-5 text-good-deep">
          <ShieldCheck size={15} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
          <span><span className="font-semibold">Guaranteed:</span> {fmtUSD(guaranteed)} in sales. {shortfallLine(live.amount.value, guaranteed)}</span>
        </p>

        <BeforeYouPay />

        {/* Who it is billed to. All three are needed before Pay, and the UAE answer sets the VAT (billing.ts). */}
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-orchid">Billed to</p>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-meta font-medium text-ink-60">
              Brand name
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name"
                autoComplete="organization"
                className={field}
              />
            </label>
            <label className="grid gap-1.5 text-meta font-medium text-ink-60">
              Country
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={`${field} ${country ? "" : "text-ink-faint"}`}>
                <option value="" disabled>Choose a country</option>
                {BILLING_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-meta font-medium text-ink-60">Is your company registered in the UAE?</legend>
              <div role="radiogroup" aria-label="Is your company registered in the UAE?" className="mt-1.5 inline-flex gap-1 rounded-full bg-haze/70 p-1">
                {([["Yes", true], ["No", false]] as const).map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={uae === value}
                    onClick={() => setUae(value)}
                    className={`h-9 min-w-[96px] rounded-full px-4 text-body font-semibold transition ${
                      uae === value ? "bg-white text-ink shadow-lift" : "text-ink-60 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* The arithmetic, as lines: what the phase costs, the VAT the answer above set, and the total. */}
        <dl className="num rounded-[16px] bg-white/80 px-4 py-3 text-body ring-1 ring-brand/[0.07]">
          <div className="flex justify-between py-1"><dt className="text-ink-soft">Phase {live.phaseNo} budget</dt><dd className="text-ink">{fmtUSD(amount)}</dd></div>
          <div className="flex justify-between py-1">
            <dt className="text-ink-soft">VAT{pct !== null ? ` (${pct}%)` : ""}</dt>
            <dd className={vat === null ? "text-ink-faint" : "text-ink"}>{vat === null ? "—" : fmtUSD(vat)}</dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-dashed border-brand/15 pt-2 font-semibold">
            <dt className="text-ink">Total today</dt><dd className="text-ink">{fmtUSD(total)}</dd>
          </div>
        </dl>

        <div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {/* Cancelling hands the turn back to the agent through
                `onCancelled`, so declining is a step in the conversation
                and not a dead card. */}
            <Btn variant="ghost" className="sm:w-auto" onClick={() => { cancelFunding(live.id); onCancelled?.(); }}>
              Cancel
            </Btn>
            <Btn
              className="h-12 sm:flex-1"
              disabled={busy || !ready}
              onClick={() => {
                if (!ready) return;
                setBusy(true);
                confirmFunding(live.id, { brandName: brandName.trim(), country, uaeRegistered: uae! });
                onConfirmed(live.id);
              }}
            >
              <LockSimple size={15} weight="fill" aria-hidden /> Pay {fmtUSD(total)}
            </Btn>
          </div>
          {!ready && <p className="mt-2 text-center text-meta leading-4 text-ink-faint sm:text-end">Add the brand name, country and UAE registration to pay.</p>}
          <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-4 text-ink-faint">
            <LockSimple size={12} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Paying starts Phase {live.phaseNo}. Nothing else is committed. This is the only action in the product that
              moves money, and only you can take it. HeyMoon can prepare this block. It can never press the button.
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}

/* The receipt says what was paid, and nothing else. What is still open
   lives on the checklist below it: one list of where the brand is, not
   a next step repeated on every card it passes. No dashboard link
   either, because the one step left is connecting the store and a way
   out here would invite the brand to leave before it. */
export function ReceiptBlock({ req }: { req: FundingRequest }) {
  const { t, tf, locale } = useT();
  /* Drawn as the invoice it is (Mostafa, 11 Nov: "let's be creative, this one can look like an invoice"): a sheet
     of paper with the letterhead, the number Settings → Invoices files it under, who it is billed to, the line and
     the VAT the payment card worked out, a total, and the stamp. The paper tears off at the bottom like a till
     receipt. Every figure is the payment's own. */
  const camp = useStore((s) => Object.values(s.campaigns).find((c) => c.planId === req.planId) ?? null);
  const paidAt = camp?.launch?.paidAt ?? null;
  const no = invoiceNo(req.id, paidAt);
  const date = new Date(paidAt ?? Date.now()).toLocaleDateString(locale === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  const pct = req.billing ? Math.round(vatRateFor(req.billing.uaeRegistered) * 100) : Math.round((req.vat.value / Math.max(1, req.amount.value)) * 100);
  const guaranteed = req.amount.value * PHASE1_ROAS;
  const label = (k: string) => (
    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{t(k).replace(/:$/, "")}</p>
  );

  return (
    <div className="drop-shadow-[0_22px_36px_rgba(77,47,176,0.14)]">
      <article className="relative overflow-hidden rounded-t-[20px] bg-white px-5 pb-5 pt-6 sm:px-7 sm:pt-7" aria-label={tf("receipt.title", { n: req.phaseNo })}>
        <span aria-hidden className="hm-grad-rule absolute inset-x-0 top-0 h-1" />

        {/* Letterhead */}
        <div className="flex items-start justify-between gap-4">
          <span className="flex items-center gap-2 text-ink">
            <Emblem size={18} />
            <span className="font-logo text-[15px] font-semibold tracking-[-0.01em]">HeyMoon<span className="text-brand">.AI</span></span>
          </span>
          <div className="text-end">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orchid">{t("receipt.invoice")}</p>
            <p className="num mt-1 font-mono text-meta font-semibold text-ink">{no}</p>
            <p className="num text-meta text-ink-faint">{date}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-dashed border-ink/10 pt-4">
          <div className="min-w-0">
            {label("receipt.billed")}
            <p className="mt-1 truncate text-body font-semibold text-ink">{req.billing?.brandName ?? camp?.brandName ?? "—"}</p>
            {req.billing && <p className="truncate text-meta text-ink-soft">{req.billing.country}</p>}
          </div>
          <div className="min-w-0">
            {label("receipt.from")}
            <p className="mt-1 truncate text-body font-semibold text-ink">HeyMoon.AI</p>
          </div>
        </div>

        {/* The lines */}
        <div className="mt-5">
          <div className="flex items-center justify-between border-b border-ink/10 pb-2">
            {label("receipt.item")}
            {label("receipt.amount")}
          </div>
          <div className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-body font-semibold text-ink">{req.phaseNo === 1 ? t("plan.phase1") : phaseTitle(req.phaseNo)}</p>
              <p className="num text-meta text-ink-faint">{tf("receipt.guaranteed", { amount: fmtUSD(guaranteed), n: req.phaseNo })}</p>
            </div>
            <p className="num shrink-0 text-body font-medium text-ink">{fmtUSD(req.amount.value)}</p>
          </div>
          <div className="flex items-start justify-between gap-4 border-t border-ink/[0.06] py-3">
            <div className="min-w-0">
              <p className="num text-body text-ink">{tf("receipt.vat", { pct })}</p>
              {req.billing && <p className="text-meta text-ink-faint">{req.billing.uaeRegistered ? t("receipt.uae") : t("receipt.notUae")}</p>}
            </div>
            <p className="num shrink-0 text-body font-medium text-ink">{fmtUSD(req.vat.value)}</p>
          </div>
          <div className="flex items-end justify-between gap-4 border-t-2 border-dashed border-ink/15 pt-3.5">
            <p className="text-body font-semibold text-ink">{t("receipt.total")}</p>
            <Figure src={req.total} render={fmtUSD(req.total.value)} size="display" />
          </div>
        </div>

        <p className="mt-5 flex items-center gap-2 rounded-[12px] bg-haze/60 px-3 py-2 text-meta text-ink-soft">
          <EnvelopeSimple size={14} weight="fill" className="shrink-0 text-brand" aria-hidden />
          {t("receipt.emailed")}
        </p>

        {/* The stamp: inked, a little crooked, never in the way of a figure. */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[132px] start-[46%] -rotate-[12deg] rounded-[10px] border-[2.5px] border-good/70 px-3 py-1 text-center text-good/80 mix-blend-multiply"
        >
          <span className="block text-[17px] font-black uppercase leading-5 tracking-[0.22em]">{t("receipt.paid")}</span>
          <span className="num block text-[9.5px] font-bold uppercase tracking-[0.14em]">{date}</span>
        </span>
        <p className="sr-only">{t("receipt.paid")}</p>
      </article>
      {/* The torn edge. */}
      <div
        aria-hidden
        className="h-3"
        style={{
          background:
            "linear-gradient(-45deg, transparent 8px, #fff 0) 0 0 / 16px 12px repeat-x, linear-gradient(45deg, transparent 8px, #fff 0) 0 0 / 16px 12px repeat-x",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

export function ReportBlock({ report }: { report: Report }) {
  const p = report.pace.value;
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-hairline px-4 py-3">
        <Eyebrow>Report</Eyebrow>
        <p className="mt-1 text-body font-semibold text-ink">{report.headline || "Reading the phase…"}</p>
      </div>
      <div className="p-4">
        {report.figures.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {report.figures.map((f) => (
              <div key={f.key} className="rounded-control border border-hairline p-3">
                <dt className="text-meta text-ink-faint">{f.label}</dt>
                <dd className="mt-1">
                  <Figure src={f.value} render={String(f.value.value)} size="sm" />
                </dd>
                <a href={`#${f.cardRef}`} className="mt-1.5 block text-meta font-medium text-brand hover:underline">
                  See the card
                </a>
              </div>
            ))}
          </dl>
        )}
        {report.pace.evidence.length > 0 && (
          <div className="mt-3 rounded-control border border-hairline p-3">
            <p className="flex items-center gap-1.5 text-meta font-semibold text-ink">
              {p.onPace
                ? <Lightning size={12} weight="fill" className="text-brand" aria-hidden />
                : <WarningCircle size={12} weight="fill" className="text-danger" aria-hidden />}
              {p.pctNow}% now, {p.pctForecast}% forecast
            </p>
            <p className="mt-1 text-meta leading-5 text-ink-soft">{report.pace.why}</p>
          </div>
        )}
        {report.narrative && <p className="mt-3 text-body leading-6 text-ink-soft">{report.narrative}</p>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Ads and approvals                                                   */
/* ------------------------------------------------------------------ */

export function AdCardBlock({ adId }: { adId: string }) {
  const ads = useAds();
  const ad = ads.find((a) => a.id === adId);
  if (!ad) return null;
  return <ApprovalCard ad={ad} compact />;
}

export function ApprovalBlock({ req }: { req: ApprovalRequest }) {
  const live = useStore((s) => s.approvals[req.id]) ?? req;
  const ads = useAds();
  const [sel, setSel] = useState<string[]>(live.adIds);
  const canApprove = useCan("approve");
  const rows = ads.filter((a) => live.adIds.includes(a.id));
  const open = rows.filter((a) => a.state === "waiting");

  if (live.state !== "pending" || open.length === 0) {
    return (
      <Card className="p-4">
        <p className="flex items-center gap-2 text-body text-good-deep">
          <CheckCircle size={15} weight="fill" aria-hidden />
          Every draft here is decided. Nothing else is waiting on you.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-danger/25">
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-danger/[0.04] px-4 py-3">
        <p className="text-body font-semibold text-ink">
          {open.length === 1 ? "One draft needs a decision" : `${open.length} drafts need a decision`}
        </p>
        <Pill tone="danger" className="ms-auto">Needs you</Pill>
      </div>
      <ul className="divide-y divide-hairline">
        {open.map((a) => {
          const on = sel.includes(a.id);
          const v = a.compliance.verdict;
          return (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => setSel((s) => (e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id)))}
                aria-label={`Include ${a.creatorName}'s draft in the batch`}
                className="h-4 w-4 shrink-0 accent-[#4D2FB0]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.img} alt="" className="h-10 w-8 shrink-0 rounded object-cover object-top" loading="lazy" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-meta font-semibold text-ink">{a.creatorName}</span>
                <span className="block truncate text-meta text-ink-faint">{a.product}</span>
              </span>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                v === "hold" ? "bg-danger/[0.1] text-danger" : v === "approve" ? "bg-good/[0.1] text-good-deep" : "bg-brand/[0.08] text-brand"
              }`}>
                {v === "hold" ? "Hold" : v === "approve" ? "Approve" : "Approve with a note"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2 border-t border-hairline p-3 sm:flex-row">
        <Btn variant="quiet" size="sm" className="sm:flex-1" onClick={() => setSel(open.filter((a) => a.compliance.verdict !== "hold").map((a) => a.id))}>
          Select every draft without a hold
        </Btn>
        {canApprove ? (
          <Btn
            size="sm"
            className="sm:flex-[1.4]"
            disabled={!sel.length}
            onClick={() => {
              sel.forEach((id) => setAdState(id, "live"));
              setApprovalState(live.id, "approved");
            }}
          >
            Approve {sel.length} and publish
          </Btn>
        ) : (
          <OnlyAdmins what="approve and publish" className="sm:flex-[1.4] sm:justify-center" />
        )}
      </div>
      <p className="px-3 pb-3 text-meta leading-4 text-ink-faint">
        Approving publishes, and that is always your action. HeyMoon can rank these and recommend. That is all.
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export function PlanBlock({ plan, onOpenCreators }: { plan: Plan; onOpenCreators?: () => void }) {
  /* The card in the conversation is a summary; the panel is where the
     whole campaign lives. With no rail, this is how a brand gets there
     without having to think of the words. */
  return (
    <div>
      <PlanCard plan={plan} dense onOpenCreators={onOpenCreators} />
      {/* "Open the whole campaign" read as a viewer. Alex pointed out
          that nothing on this card says the plan is editable, and the
          brand has to read the placeholder in the message box to find
          that out. The label now says what the panel is for. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          onClick={() => openPanel("plan")}
          className="text-meta font-semibold text-brand hover:underline"
        >
          Change anything
        </button>

      </div>
    </div>
  );
}


export function CreatorBlock({ plan }: { plan: Plan }) {
  const paid = usePaid();
  const crew = plan.creators.value.length;
  const pool = plan.pool.value;
  /* Identities are the one thing held back until Phase 1 starts. Before
     that the brand sees how many were matched, how many the warm-up
     briefs, how much reach they have and how much of it is in their
     markets: everything needed to judge the plan, and nothing they
     could take elsewhere. */
  return (
    <div>
      <p className="text-body font-semibold text-ink">Your creators</p>
      <p className="mb-2 mt-0.5 text-meta text-ink-faint">Matched on what they sell, not who they are</p>
      {!paid ? (
        <CreatorSummary creators={plan.creators.value} matched={pool} />
      ) : (
        /* Paid: names are allowed, full profiles are still not what a
           thread is for. Face, name, platform, niche. */
        <>
          <p className="mb-2 text-meta text-ink-faint">
            {pool && pool > crew
              ? `Your warm-up crew: ${crew} of the ${pool} creators matched for these markets.`
              : `${crew} matched for these markets.`}
          </p>
          <CreatorNames creators={plan.creators.value} />
        </>
      )}
    </div>
  );
}

export function ConfidenceBlock({ plan }: { plan: Plan }) {
  return <ConfidenceMeter plan={plan} />;
}

/** A brief line's first sentence. The rest is the agent's evidence, which belongs behind the line, not in it. */
export const briefLine = (l: string) => l.split(/(?<=[.!?])\s+/)[0].replace(/\.$/, "");

export function BriefBlock({ plan }: { plan: Plan }) {
  const b = plan.brief.value;
  return (
    <Card className="p-4">
      <Eyebrow>The brief</Eyebrow>
      <p className="mt-2 text-body font-semibold text-ink">{b.headline.value}</p>
      <div className="mt-3 space-y-2.5">
        <div>
          <p className="text-meta font-semibold uppercase tracking-wide text-good-deep">Must</p>
          <ul className="mt-1 space-y-1">{b.mustSay.value.map((l, i) => <li key={i} className="text-meta text-ink-soft">· {briefLine(l)}</li>)}</ul>
        </div>
        <div>
          <p className="text-meta font-semibold uppercase tracking-wide text-danger">Must not</p>
          <ul className="mt-1 space-y-1">{b.mustNotSay.value.map((l, i) => <li key={i} className="text-meta text-ink-soft">· {briefLine(l)}</li>)}</ul>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* What is being worked on                                             */
/*                                                                     */
/* A progress bar says something is happening. A stated piece of work   */
/* that ticks says WHAT is happening, and that is the difference        */
/* between a page that looks like it is loading and a screen that looks */
/* like it is working for you. The same roster serves the read          */
/* (READ_TASKS) and the plan build (BUILD_TASKS).                       */
/*                                                                     */
/* One row per AGENT, not per task. Each name appears once, with the    */
/* tasks it owns collapsed behind it, so the card reads as a crew       */
/* working rather than as a checklist ticking.                          */
/* ------------------------------------------------------------------ */

export interface RosterTask {
  key: string;
  agent: string;
  role: string;
  note: string;
  produces: string;
}

/** Who is actually in a task list. HeyMoon runs seven agents, but only
    the ones a given stage needs are put to work, so no heading may say
    how many there are — it asks the list. */
export const agentsIn = (tasks: RosterTask[]) => Array.from(new Set(tasks.map((t) => t.agent)));

/** Which agent owns a layer of the read. Read off READ_TASKS rather
    than typed, so moving a layer to another agent moves every line
    that names it — the progress row here and the evidence attribution
    in the panel. */
export const agentForLayer = (k: ReadLayerKey) => READ_TASKS.find((t) => t.key === k)?.agent ?? "An agent";

const NUMBER_WORD = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** Small counts read better as words in a sentence than as digits. */
export const countWord = (n: number) => NUMBER_WORD[n] ?? String(n);

/** "Four agents on your store" — the count is derived, never typed, so
    adding an agent to READ_TASKS or BUILD_TASKS moves the heading with
    it rather than leaving a number that used to be true. */
export function rosterTitle(tasks: RosterTask[], tail: string) {
  const n = agentsIn(tasks).length;
  const w = countWord(n);
  return `${w[0].toUpperCase()}${w.slice(1)} agent${n === 1 ? "" : "s"} ${tail}`;
}

export function TaskRoster({ tasks, done, live, title, framed = true }: {
  tasks: RosterTask[];
  done: string[];
  live: boolean;
  title: string;
  /** Off when the roster sits inside another card, as it does in the read. */
  framed?: boolean;
}) {
  const finished = new Set(done);
  /* Tasks are listed in the order the work runs, so the first one not yet
     done is the one being worked on right now. Everything after it is
     waiting, however many agents that spans. */
  const activeKey = live ? tasks.find((t) => !finished.has(t.key))?.key : undefined;
  /* One row per agent, not per task — each name once, with the tasks it
     owns collapsed into a count. */
  const byAgent = tasks.reduce<Record<string, { role: string; tasks: RosterTask[] }>>((acc, t) => {
    (acc[t.agent] ??= { role: t.role, tasks: [] }).tasks.push(t);
    return acc;
  }, {});

  const body = (
    <>
      <p className="flex items-center gap-2 px-4 pt-4 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-orchid sm:px-5">
        {live ? <span aria-hidden className="working-ring h-3.5 w-3.5" /> : <Check size={12} weight="bold" aria-hidden />}
        {title}
        <span className="num ms-auto rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-brand">
          {done.length}/{tasks.length}
        </span>
      </p>
      <ul className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4">
        {Object.entries(byAgent).map(([name, a]) => {
          const doneHere = a.tasks.filter((t) => finished.has(t.key));
          const current = a.tasks.find((t) => t.key === activeKey);
          const allDone = doneHere.length === a.tasks.length;
          const line = allDone
            ? a.tasks.map((t) => t.produces).join(" · ")
            : current
            ? `${current.note}…`
            : doneHere.length > 0
            ? doneHere.map((t) => t.produces).join(" · ")
            : live
            ? "Waiting to start"
            : "Did not get to this";
          return (
            <li key={name} className={`flex items-start gap-3 rounded-[16px] px-3.5 py-3 transition ${
              current ? "bg-white shadow-lift ring-1 ring-brand/20" : allDone ? "bg-white/70 ring-1 ring-brand/[0.06]" : "bg-haze/50"
            }`}>
              {/* State, not identity. The initial in this circle was
                  the same letter for six of the seven agents, so it
                  identified nothing and read as an avatar for a person
                  who does not exist. What a brand wants from this
                  column is which row is moving: a ring that turns while
                  an agent works, a tick when it is finished, and an
                  empty outline for the ones still queued. */}
              <span
                aria-hidden
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] ${
                  allDone ? "bg-good text-white" : current ? "bg-haze" : "border border-dashed border-black/15"
                }`}
              >
                {allDone ? <Check size={13} weight="bold" /> : current ? <span className="working-ring h-4 w-4" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-meta font-semibold text-ink">{name}</span>
                  <span className="text-meta text-ink-faint">{a.role}</span>
                </span>
                <span className="mt-0.5 block truncate text-meta text-ink-soft">{line}</span>
              </span>
              <span className="num shrink-0 pt-0.5 text-[11px] font-semibold text-ink-faint">
                {doneHere.length}/{a.tasks.length}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );

  if (!framed) return <div className="border-b border-hairline bg-brand/[0.02]">{body}</div>;
  return <Card className="overflow-hidden">{body}</Card>;
}

/* ------------------------------------------------------------------ */
/* The read, in the conversation                                       */
/*                                                                     */
/* The first thing the agent does is read the store, so it happens in   */
/* the thread rather than on a page the chat comes after. Layers land   */
/* as they are found; a layer that has not arrived is a pending row,    */
/* not an empty one.                                                    */
/* ------------------------------------------------------------------ */

/* The four things the brand watches arrive while the read is running.
   Each row is one sentence about work in progress — the agent doing it,
   and what it is doing to THIS store — and the moment the layer lands
   that sentence is replaced by the finding, written out rather than
   pasted in. See `TypeOn`.

   `doing` is the predicate only. The subject is the agent that owns the
   layer, looked up from READ_TASKS, so a row can never name an agent
   that is not the one working. */

export function ReadBlock({ read, live }: { read: BrandRead | null; live: boolean }) {
  if (!read) return null;
  /* Drawn as tiles now (chat/StoreRead.tsx): while it runs, the four agents' tiles filling in as their layers land;
     when it lands, the verdict first and each finding in its own kind. A tile still opens in the panel to be
     corrected, and its evidence is still one press away. */
  if (live) return <StoreReadLive read={read} agentFor={agentForLayer} />;
  return <StoreReadCard read={read} verdict={read.eligibility ? eligibilityLine(read.eligibility) : undefined} />;
}

/* The eligibility row, said to the brand rather than filed about them.

   The figure in it is bound, never typed. On a store that is short the
   read already holds it as data, in `missing`. On a store that
   qualifies there is no field for it: the count exists only inside the
   traffic evidence, so it is lifted out of there, and the sentence
   stands on its own when it cannot be lifted. Nothing is decided by
   that match — `state` decides everything, and this only chooses which
   of two sentences that say the same thing is shown. A
   `visitors: Sourced<number>` on `Eligibility` would retire it. */
const VISITORS = /([\d,]+)\s+monthly\s+(?:unique\s+)?visitors/i;

function eligibilityLine(e: Eligibility): string {
  if (e.state === "ok") {
    const visitors = e.line.evidence
      .map((x) => x.detail)
      .concat(e.line.value)
      .map((s) => VISITORS.exec(s)?.[1])
      .find(Boolean);
    return visitors
      ? `You qualify for a guarantee. About ${visitors} visitors a month, well above the minimum.`
      : "You qualify for a guarantee. Your traffic is well above the minimum.";
  }
  /* No store at all: the read's own line ("No online store at …"). The traffic sentence below would read
     "None found monthly visitors against the Required". */
  if (e.missing?.some((m) => /online store/i.test(m.label))) return e.line.value;
  const gap = e.missing?.[0];
  return gap
    ? `Not eligible yet. ${gap.have.value} monthly visitors against the ${gap.need} a guarantee needs.`
    : "Not eligible yet. Your traffic is below what a guarantee needs.";
}


/* ------------------------------------------------------------------ */
/* Below the traffic floor                                             */
/* ------------------------------------------------------------------ */

export function RejectedBlock({ read }: { read: BrandRead }) {
  const e = read.eligibility;
  if (!e || e.state !== "short") return null;
  return (
    <div className="space-y-2.5">
      {/* What is missing, with the store's figure against the floor, is the verdict at the top of the read now
          (StoreRead), so it is not said twice. */}
      {(e.learned?.length ?? 0) > 0 && <Card className="p-4">
        <Eyebrow tone="good">What I learned anyway</Eyebrow>
        <ul className="mt-2 space-y-1.5">
          {(e.learned ?? []).map((l, i) => (
            <li key={i} className="flex gap-2 text-meta leading-5 text-ink-soft">
              <CheckCircle size={12} weight="fill" className="mt-1 shrink-0 text-good" aria-hidden />{l}
            </li>
          ))}
        </ul>
      </Card>}
      <Card className="p-4">
        <Eyebrow>The way back</Eyebrow>
        <ul className="mt-2 space-y-2.5">
          {(e.wayBack ?? []).map((w) => (
            <li key={w.label}>
              <p className="flex items-center gap-1.5 text-meta font-semibold text-ink">
                <Lightning size={11} weight="fill" className="shrink-0 text-brand" aria-hidden />{w.label}
              </p>
              <p className="mt-0.5 ps-4 text-meta leading-5 text-ink-soft">{w.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The three phases                                                    */
/*                                                                     */
/* The whole campaign is three phases, shown together, because the      */
/* sales a brand is buying come from all three and not from the first   */
/* alone. All three rows are visible from the start: a fold over the    */
/* two the brand is not paying for today made the plan look like one    */
/* phase with a footnote, and the shape of the offer IS the three. Only */
/* Phase 1 carries full weight; the other two sit faded, because they   */
/* are offered on results rather than sold now. The same block serves   */
/* the thread and, in `compact`, the plan pane beside it.               */
/* ------------------------------------------------------------------ */

/** The rung the ladder's own start button pays for: the first one. */
const rungs0PhaseNo = (p: Plan) => p.ladder.value[0]?.phaseNo ?? 1;

export function LadderBlock({ plan, onStart, paid = false, compact = false }: {
  plan: Plan;
  onStart?: () => void;
  paid?: boolean;
  compact?: boolean;
}) {
  const requested = usePhaseRequested(plan.id, rungs0PhaseNo(plan));
  const rungs = plan.ladder.value;
  const count = countWord(rungs.length);

  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="grad-tile grid h-10 w-10 shrink-0 place-items-center rounded-[12px] shadow-pri">
          <TrendUp size={19} weight="bold" />
        </span>
        <div className="min-w-0">
          {/* The count is derived, so a plan that ever carries two rungs or
              four says so rather than keeping a number that used to be
              true. */}
          <p className="text-[16px] font-semibold leading-6 text-ink">
            {`${count[0].toUpperCase()}${count.slice(1)} phases.`} {paid ? "You started one." : "You start one."}
          </p>
          {/* The offer is the price, so the price leads. There is nothing
              to size and nothing to negotiate: the warm-up is the same
              figure for every brand, and the two phases behind it are what
              it earns rather than what it commits you to. */}
          <p className={`mt-0.5 text-ink-soft ${compact ? "text-meta leading-5" : "text-body leading-6"}`}>
            {compact
              ? paid ? "Phase 1 has started. The others open as it reaches 80%." : "You start Phase 1. The others open as it reaches 80%."
              : paid
              ? `Phase 1 has started, at the ${fmtUSD(PHASE1_BUDGET)} it costs every brand. Phases 2 and 3 are what it leads to, and you decide on each one only when it is offered.`
              : `Start at ${fmtUSD(PHASE1_BUDGET)}. Phases 2 and 3 are what it leads to. The warm-up is ${fmtUSD(PHASE1_BUDGET)} for every brand and whichever of the three plans you pick, so there is no budget to agree before you begin, and nothing beyond Phase 1 is charged or committed.`}
          </p>
        </div>
      </div>

      {/* The staircase itself: each rung a step higher than the last, the one being bought lit and the two behind it
          locked until the one before reaches the unlock line. */}
      <ol className="mt-4 grid items-end gap-2.5 sm:grid-cols-3">
        {rungs.map((r, i) => {
          const first = i === 0;
          return (
            <li
              key={r.phaseNo}
              className={`flex flex-col rounded-[18px] p-4 ${first ? "grad-ws shadow-lift ring-2 ring-brand/25" : "bg-haze/70"}`}
              style={{ minHeight: (compact ? 128 : 150) + i * 22 }}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-[12px] font-bold ${first ? "grad-tile" : "bg-white text-ink-faint"}`}>
                  {first ? r.phaseNo : <LockSimple size={12} weight="fill" />}
                </span>
                <p className={`min-w-0 truncate text-meta font-semibold ${first ? "text-ink" : "text-ink-soft"}`}>{phaseTitle(r.phaseNo)}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                {/* The first rung's figures are the plan's own values, so "why this number" opens the same arithmetic
                    the plan card shows; the rungs behind it read off the ladder. */}
                <Figure src={first ? plan.budget : plan.ladder} render={fmtUSD(r.budget)} size="md" />
                <span className="text-meta text-ink-faint">at</span>
                <span className="num rounded-pill bg-white/80 px-2 py-0.5 text-meta font-semibold text-brand">
                  <Figure src={first ? plan.price.revenueTarget : plan.ladder} render={`${r.multiple}x`} size="sm" />
                </span>
              </div>
              <p className="num mt-1 text-meta text-ink-faint">{fmtUSD(Math.round(r.budget * r.multiple))} guaranteed</p>
              {!compact && <p className="mt-2 text-[11.5px] leading-4 text-ink-faint">{r.note}</p>}
              <p className={`mt-auto pt-3 text-[11.5px] font-semibold leading-4 ${first ? "text-brand" : "text-ink-faint"}`}>
                {first ? (paid ? "Paid" : "Due today") : `Offered when Phase ${r.phaseNo - 1} reaches ${Math.round(UNLOCK_AT * 100)}% of target`}
              </p>
            </li>
          );
        })}
      </ol>

      {!compact && (
        /* No three-phase totals here. Summing budgets the brand is not
           being charged for, against guarantees that are not yet
           priced, put the biggest pair of numbers on the card under
           the one phase that is actually due. What is true today is
           the only thing this footer says. The refund rule is said once,
           on Phase 1's own figures (lib/agent/guarantee.ts). */
        <div className="mt-3 space-y-2">
          <p className="flex items-start gap-2.5 rounded-[14px] bg-good/[0.07] px-3.5 py-2.5 text-meta leading-5 text-good-deep">
            <ShieldCheck size={14} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
            {shortfallLine(rungs[0].budget, Math.round(rungs[0].budget * rungs[0].multiple))}
          </p>
          <p className="text-meta leading-5 text-ink-soft">
            Only Phase 1 is due today. Each phase after it is offered on results, and you decide then. Every phase carries
            the same guarantee: fall short and the same share of that phase&apos;s budget comes back to you.
          </p>
        </div>
      )}

      {/* Stood down once the payment card is on screen below. The
          brand reached it by pressing this, so leaving it live offers
          the same action twice, and the one further up the thread is
          the stale one. */}
      {onStart && !paid && !requested && (
        <div className="mt-4">
          <Btn className="w-full sm:w-auto" onClick={onStart}>
            Start Phase 1 for {fmtUSD(plan.price.total.value)}
          </Btn>
          {!compact && (
            <p className="mt-2 text-meta leading-4 text-ink-faint">
              You are committing to Phase 1 only. Nothing after it is charged, promised or scheduled, and you decide
              phase by phase whether to continue.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}


/* ------------------------------------------------------------------ */
/* Integration, after payment                                          */
/*                                                                     */
/* This runs AFTER the phase is paid for, because it exists to measure  */
/* the guarantee rather than to qualify the brand — the plan was built   */
/* from the public read and needed nothing from the store to be priced. */
/* A platform we support is one button and a visible handoff; anything  */
/* else is a person, and the form is built so the call can be planned   */
/* before it is made: phone first, then what the store is built on.     */
/* ------------------------------------------------------------------ */

export type StorePlatform = "salla" | "zid" | "shopify" | "magento";

interface IntegrationStep { label: string; detail: string }

interface Platform {
  key: StorePlatform;
  name: string;
  note: string;
  /** The button label. Salla, Zid and Shopify authorise; Magento connects. */
  cta: string;
  /** The platform's own mark, the same files the landing uses. */
  src: string;
  /** Optical height, not a common one. These are wordmarks of very
      different proportions, and setting them all to the same number
      makes Salla loom and Shopify vanish. The same four values the
      landing page balances them at, scaled for a tile. */
  h: number;
  steps: IntegrationStep[];
}

/* The handoff, shown as steps. Same shape as authorising Slack into
   another tool: you leave, you sign in where your store lives, you
   approve a read-only scope, you come back. Shown rather than hidden
   behind a spinner, because a brand handing over store access should
   see exactly what it is handing over. */
const authSteps = (name: string): IntegrationStep[] => [
  { label: `Opening ${name}`, detail: `A ${name} window opens. HeyMoon never sees what you type there.` },
  { label: `Sign in on ${name}`, detail: `Your own store login, on the ${name} page.` },
  { label: "Authorise HeyMoon, read-only", detail: "Orders and catalogue, nothing else. No payments, no edits, no customer details." },
  { label: "Back in HeyMoon", detail: "Sales against each creator's code start flowing in." },
];

/* Magento has no sign-in handoff. It connects the way its own
   extensions do: install, paste a scoped key, done. */
const MAGENTO_STEPS: IntegrationStep[] = [
  { label: "Install the HeyMoon extension", detail: "From the Magento Marketplace, inside your own admin. It reads orders and catalogue and nothing else." },
  { label: "Paste the read-only API key", detail: "Magento issues a key scoped to orders and catalogue. HeyMoon never sees your admin login." },
  { label: "Back in HeyMoon · connected", detail: "Sales against each creator's code start flowing in." },
];

const SUPPORTED: Platform[] = [
  { key: "salla", name: "Salla", note: "One tap", cta: "Connect Salla", src: "/platforms/salla.png", h: 21, steps: authSteps("Salla") },
  { key: "zid", name: "Zid", note: "One tap", cta: "Connect Zid", src: "/platforms/zid.png", h: 20, steps: authSteps("Zid") },
  { key: "shopify", name: "Shopify", note: "Shopify and Shopify Plus", cta: "Connect Shopify", src: "/platforms/shopify.png", h: 15, steps: authSteps("Shopify") },
  { key: "magento", name: "Magento", note: "Read-only API key", cta: "Connect Magento", src: "/platforms/magento.png", h: 15, steps: MAGENTO_STEPS },
];
const platformOf = (k: StorePlatform) => SUPPORTED.find((p) => p.key === k) ?? SUPPORTED[0];

/* What a store we do not support out of the box might be built on. A
   chip, not a free-text field, so an engineer knows what they are
   walking into before the call. Magento is not here because it has its
   own button above. */
const SYSTEMS = [
  "Custom build",
  "Open source, such as PrestaShop or OpenCart",
  "WordPress or WooCommerce",
  "Something else",
] as const;

export function IntegrationBlock({ onConnect, compact = false }: {
  onConnect: (k: StorePlatform) => void;
  /** Inside the dashboard's alert, which already carries the heading
      and the reason. The block keeps only the part you act on. */
  compact?: boolean;
}) {
  const connected = useStore((s) => (s.activeCampaignId ? s.campaigns[s.activeCampaignId]?.connectedStore ?? null : null));
  const [other, setOther] = useState(false);
  const [sent, setSent] = useState(false);
  const [auth, setAuth] = useState<{ key: StorePlatform; step: number } | null>(null);
  const [form, setForm] = useState({ phone: "", system: "", detail: "", name: "", email: "" });
  /* Enough to plan the call: what the store runs on, and one way to
     reach the brand. A name helps and is not required. */
  const ready = !!form.system && !!(form.phone.trim() || form.email.trim());

  /* Advance the handoff one step at a time. Cancelling stops it where it
     is — nothing was authorised until the last step completes. */
  useEffect(() => {
    if (!auth) return;
    const steps = platformOf(auth.key).steps;
    if (auth.step >= steps.length) { onConnect(auth.key); setAuth(null); return; }
    const t = setTimeout(() => setAuth((a) => (a ? { ...a, step: a.step + 1 } : a)), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.step, auth?.key]);

  if (connected) {
    const name = SUPPORTED.find((p) => p.key === connected)?.name ?? connected;
    /* A system line, not a card and not a bubble. Nothing happened here
       that the brand did not just do, so confirming it at the volume of
       a card would be the product congratulating itself. The dashboard
       is offered underneath it and nowhere earlier: this is the first
       moment there is nothing left to do in the thread. */
    return (
      <div>
        <p className="flex items-center gap-1.5 text-meta text-ink-faint">
          <CheckCircle size={13} weight="fill" className="shrink-0" aria-hidden />
          {name} connected
        </p>
        {/* The last step in the whole flow, and the way out of it.
            Everything after this belongs to a running phase, which
            lives on its own surface rather than beside a conversation
            that is finished. */}
        <Link href="/brands/dashboard" className="mt-2 inline-block text-body font-semibold text-brand hover:underline">
          Go to the dashboard
        </Link>
      </div>
    );
  }

  if (auth) {
    const platform = platformOf(auth.key);
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="working-ring h-3.5 w-3.5" />
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-ink">Connect {platform.name}</p>
            <p className="text-meta text-ink-faint">One tap. Disconnect any time.</p>
          </div>
          <button onClick={() => setAuth(null)} className="ms-auto text-meta font-semibold text-ink-faint hover:text-danger">
            Cancel
          </button>
        </div>
        <ol className="mt-3 space-y-2.5">
          {platform.steps.map((st, i) => {
            const done = i < auth.step;
            const now = i === auth.step;
            return (
              <li key={st.label} className={`flex items-start gap-3 ${!done && !now ? "opacity-45" : ""}`}>
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                    done ? "bg-good text-white" : now ? "bg-brand text-white" : "bg-neutral-100 text-ink-faint"
                  }`}
                >
                  {done ? <Check size={10} weight="bold" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-meta font-semibold ${now ? "text-brand" : "text-ink"}`}>{st.label}</span>
                  <span className="block text-meta leading-4 text-ink-faint">{st.detail}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </Card>
    );
  }

  if (sent) {
    const system = form.system + (form.detail.trim() ? `, ${form.detail.trim()}` : "");
    const lead = form.name.trim() ? `${form.name.trim()}, HeyMoon` : "HeyMoon";
    const phone = form.phone.trim();
    return (
      <Card className="border-good/25 bg-good/[0.04] p-4">
        <p className="flex items-center gap-2 text-body font-semibold text-good-deep">
          <CheckCircle size={15} weight="fill" aria-hidden />
          {phone ? "Logged. An engineer is calling you." : "Logged. An engineer will write to you."}
        </p>
        <p className="mt-1.5 text-meta leading-5 text-ink-soft">
          {phone
            ? `Your request is with ${lead}, with your ${system} details and ${phone} to reach you on.`
            : `Your request is with ${lead}, with your ${system} details and ${form.email.trim()} to reach you on.`}{" "}
          {/* No date, follow-up or reply is promised for a store HeyMoon can't connect (PRD v0.2 v3, O7). */}
          Your phase is paid. The campaign launches once the connection is in place.
        </p>
      </Card>
    );
  }

  const Shell = compact
    ? ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    : ({ children }: { children: React.ReactNode }) => <Card className="p-4">{children}</Card>;

  return (
    <Shell>
      {!compact && (
        <>
          <p className="text-body font-semibold text-ink">Connect your store</p>
          <p className="text-meta text-ink-faint">One tap. Disconnect any time.</p>
          <p className="mt-2 text-meta leading-5 text-ink-soft">
            Your plan was built from what is public about your store, so this step does not decide whether you qualify. The{" "}
            {fmtUSD(PHASE1_BUDGET)} warm-up is already yours. Connecting is how HeyMoon counts the sales each creator earns
            you, which is what the guarantee is measured against.
          </p>
        </>
      )}

      {!other ? (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SUPPORTED.map((p) => (
              <button
                key={p.key}
                onClick={() => setAuth({ key: p.key, step: 0 })}
                className="flex items-center gap-3 rounded-control border border-hairline bg-white p-3 text-start transition hover:border-brand/40 hover:shadow-card"
              >
                {/* The platform's own mark rather than a generic shop
                    icon beside its name in our type. A brand recognises
                    Salla's logo faster than it reads the word, and the
                    button beside it already says the name. */}
                <span className="min-w-0 flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.name} style={{ height: p.h }} className="w-auto max-w-[120px] object-contain object-left rtl:object-right" />
                  <span className="mt-1.5 block text-meta text-ink-faint">{p.note}</span>
                </span>
                <span className="shrink-0 rounded-control bg-brand px-2.5 py-1.5 text-meta font-semibold text-white">{p.cta}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setOther(true)} className="mt-3 text-meta font-semibold text-brand hover:underline">
            Connect a different platform
          </button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-meta leading-5 text-ink-soft">
            HeyMoon connects anything with an orders API by hand. Leave a number and an engineer calls you within the
            hour. Say what the store is built on and they arrive with a plan for it rather than with questions.
          </p>

          <label className="block">
            <span className="mb-1 block text-meta font-semibold text-ink">Phone or WhatsApp, for a call within the hour</span>
            <input
              type="tel"
              dir="ltr"
              value={form.phone}
              placeholder="+971…"
              onChange={(e) => setForm((st) => ({ ...st, phone: e.target.value }))}
              className="w-full rounded-control border border-black/[0.1] bg-white px-3 py-2 text-body text-ink outline-none transition focus:border-ink/25"
            />
          </label>

          <div>
            <p className="mb-1 text-meta font-semibold text-ink-soft">What is your store built on?</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="What your store is built on">
              {SYSTEMS.map((s) => {
                const on = form.system === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setForm((st) => ({ ...st, system: s }))}
                    className={`rounded-pill border px-2.5 py-1 text-meta font-medium transition ${
                      on ? "border-brand bg-brand text-white" : "border-black/[0.09] bg-white text-ink-soft hover:border-brand/40"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {([
            { k: "detail" as const, label: "Anything that helps the engineer (optional)", ph: "The framework, the theme, the checkout, whatever you know", type: "text" },
            { k: "name" as const, label: "Your name (optional)", ph: "", type: "text" },
            { k: "email" as const, label: "Work email, if you would rather be written to first", ph: "you@yourstore.com", type: "email" },
          ]).map((f) => (
            <label key={f.k} className="block">
              <span className="mb-1 block text-meta font-semibold text-ink-soft">{f.label}</span>
              <input
                type={f.type}
                dir={f.k === "email" ? "ltr" : undefined}
                value={form[f.k]}
                placeholder={f.ph}
                onChange={(e) => setForm((st) => ({ ...st, [f.k]: e.target.value }))}
                className="w-full rounded-control border border-black/[0.09] bg-white px-3 py-2 text-body text-ink outline-none transition focus:border-ink/25"
              />
            </label>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            <Btn size="sm" disabled={!ready} onClick={() => setSent(true)}>Send this to an engineer</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setOther(false)}>Go back to the platforms</Btn>
          </div>
          {!ready && (
            <p className="text-meta leading-4 text-ink-faint">
              Pick what your store is built on and leave a phone number or an email, and the button unlocks.
            </p>
          )}
        </div>
      )}

      {/* The scope, said as two sentences that answer the two questions
          a brand actually has: what does this thing do, and what can it
          reach. Both are on the card where the decision is made, not
          behind a link. */}
      <p className="mt-3 flex items-start gap-1.5 text-meta leading-4 text-ink-faint">
        <LockSimple size={11} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Read-only: one code per creator. Never your customers, prices or products. HeyMoon.AI is a Saudi company.
        </span>
      </p>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/* Confidence, as a thing you can see                                  */
/*                                                                     */
/* The agent says the number in words; this is the same number with a  */
/* colour on it, so a brand can tell at a glance whether they are      */
/* being agreed with or warned. It has no controls — the two numbers   */
/* are set in the conversation — and it carries the pair it was drawn  */
/* for, so scrolling back shows what was true at the time.             */
/* ------------------------------------------------------------------ */

export function ConfidenceBar({ planBudget, roas }: { planBudget: number; roas: number }) {
  const conf = getConfidence(planBudget, roas);
  const tone: Record<ConfidenceLevel, { bar: string; text: string; ring: string }> = {
    high: { bar: "bg-good", text: "text-good-deep", ring: "border-good/25 bg-good/[0.05]" },
    medium: { bar: "bg-amber-500", text: "text-amber-700", ring: "border-amber-500/25 bg-amber-500/[0.07]" },
    low: { bar: "bg-danger", text: "text-danger", ring: "border-danger/25 bg-danger/[0.05]" },
  };
  const t = tone[conf.level];

  return (
    <div className={`rounded-control border px-3.5 py-3 ${t.ring}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`text-body font-semibold ${t.text}`} role="status">{conf.label}</p>
        <p className="text-meta tabular-nums text-ink-faint">
          {fmtUSD(planBudget)} ÷ {roas}x = {Math.round(conf.ratio).toLocaleString("en-US")}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-pill bg-black/[0.07]">
        <div className={`h-full rounded-pill transition-all duration-500 ${t.bar}`} style={{ width: `${conf.pct}%` }} />
      </div>
      {/* The two thresholds, drawn where they actually sit, so the bar
          reads as a scale rather than as a mood. */}
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-ink-faint">
        <span>Low</span>
        <span>{CONFIDENCE_MEDIUM_RATIO.toLocaleString("en-US")} · medium</span>
        <span>{CONFIDENCE_HIGH_RATIO.toLocaleString("en-US")} · HeyMoon commits</span>
      </div>
    </div>
  );
}
