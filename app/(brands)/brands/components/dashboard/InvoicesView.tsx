"use client";

/* Settings → Invoices (21 Oct). One invoice per paid phase, from the payment itself: the subtotal, the VAT the
   brand's UAE answer set (billing.ts) and the total. Billed to the legal entity, TRN and office from the business
   profile once it is complete; until then, the name given at payment, with a pointer to the profile. */

import { useState } from "react";
import { CaretDown, Receipt } from "@phosphor-icons/react";
import { accountContact, profileSections, useAccount, useProfile, useStore } from "../../lib/store";
import { vatRateFor } from "../../lib/agent/billing";
import { fmtUSD, phaseTitle } from "../../lib/mock/campaigns";
import { hash } from "../../lib/agent/rng";

const day = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function InvoicesView({ onOpenProfile }: { onOpenProfile: () => void }) {
  const account = useAccount();
  const profile = useProfile();
  const funding = useStore((s) => s.funding);
  const campaigns = useStore((s) => s.campaigns);
  const [open, setOpen] = useState<string | null>(null);

  const invoices = Object.values(funding)
    .filter((f) => f.state === "confirmed")
    .map((f) => {
      const camp = Object.values(campaigns).find((c) => c.planId === f.planId);
      const at = camp?.launch?.paidAt ?? 0;
      return { f, camp, at, no: `HM-${new Date(at || Date.now()).getFullYear()}-${String(hash(f.id) % 100000).padStart(5, "0")}` };
    })
    .sort((a, b) => b.at - a.at);

  const s = profileSections(profile);
  const profileReady = s.tax && s.office;
  const email = account ? accountContact(account) : "";

  if (!invoices.length) {
    return (
      <div className="rounded-card bg-white p-6 text-center shadow-card">
        <Receipt size={22} className="mx-auto text-ink-faint" aria-hidden />
        <p className="mt-2 text-body font-semibold text-ink">No invoices yet</p>
        <p className="mt-1 text-meta text-ink-soft">Your first one is issued when you pay for Phase 1.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!profileReady && (
        <div className="flex flex-col gap-3 rounded-card bg-lilac/70 p-4 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 text-meta leading-5 text-brand">
            Invoices carry your legal name, TRN and office address once your business profile is complete.
          </p>
          <button type="button" onClick={onOpenProfile} className="shrink-0 text-meta font-semibold text-brand underline-offset-2 hover:underline">
            Complete business profile
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="hidden grid-cols-[1.1fr_0.9fr_1.4fr_0.8fr_0.7fr_0.8fr_auto] gap-3 border-b border-hairline px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint sm:grid">
          <span>Invoice</span><span>Date</span><span>For</span><span className="text-end">Amount</span><span className="text-end">VAT</span><span className="text-end">Total</span><span className="w-5" />
        </div>
        <ul className="divide-y divide-hairline">
          {invoices.map(({ f, camp, at, no }) => {
            const isOpen = open === f.id;
            const pct = f.billing ? Math.round(vatRateFor(f.billing.uaeRegistered) * 100) : Math.round((f.vat.value / Math.max(1, f.amount.value)) * 100);
            const billedName = (profileReady && profile.legalName?.trim()) || f.billing?.brandName || camp?.brandName || "";
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : f.id)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-2 gap-x-3 gap-y-1 px-5 py-3.5 text-start text-body transition hover:bg-wash/50 sm:grid-cols-[1.1fr_0.9fr_1.4fr_0.8fr_0.7fr_0.8fr_auto] sm:items-center"
                >
                  <span className="font-semibold text-ink tabular-nums">{no}</span>
                  <span className="text-ink-soft">{at ? day(at) : "—"}</span>
                  <span className="col-span-2 min-w-0 truncate text-ink-soft sm:col-span-1">
                    {camp?.brandName ? `${camp.brandName} · ` : ""}{phaseTitle(f.phaseNo)}
                  </span>
                  <span className="text-ink-soft tabular-nums sm:text-end">{fmtUSD(f.amount.value)}</span>
                  <span className="text-ink-soft tabular-nums sm:text-end">{fmtUSD(f.vat.value)} <span className="text-ink-faint">({pct}%)</span></span>
                  <span className="font-semibold text-ink tabular-nums sm:text-end">{fmtUSD(f.total.value)}</span>
                  <CaretDown size={14} className={`justify-self-end text-ink-faint transition ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {isOpen && (
                  <div className="grid gap-4 bg-wash/40 px-5 py-4 text-meta sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">Billed to</p>
                      <p className="mt-1 font-semibold text-ink">{billedName}</p>
                      {profileReady && profile.vat && <p className="text-ink-soft" dir="ltr">TRN {profile.vat.replace(/\s+/g, "")}</p>}
                      {profileReady
                        ? <p className="text-ink-soft">{[profile.street, profile.area, profile.city, profile.country].filter(Boolean).join(", ")}</p>
                        : f.billing && <p className="text-ink-soft">{f.billing.country}</p>}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">Line</p>
                      <p className="mt-1 text-ink">{phaseTitle(f.phaseNo)}, {fmtUSD(f.amount.value)}</p>
                      <p className="text-ink-soft">VAT {pct}%{f.billing ? (f.billing.uaeRegistered ? ", registered in the UAE" : ", not registered in the UAE") : ""}: {fmtUSD(f.vat.value)}</p>
                      <p className="font-semibold text-ink">Total {fmtUSD(f.total.value)} · Paid</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">Sent</p>
                      <p className="mt-1 text-ink-soft">{email ? <>Emailed to <span dir="ltr">{email}</span></> : "Kept on this campaign"}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
