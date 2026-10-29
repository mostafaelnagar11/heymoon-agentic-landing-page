"use client";

/* Settings → Business profile (21 Oct).

   A launch step that happens in the dashboard, not the chat: after the brief is approved, the brand completes its
   business profile within 10 days of paying, and Moontech starts matching creators once it is done (LaunchTracker,
   "Business profile"). Tax registration and office location are required; the trade licence can come later, but is
   needed before the next phase is funded. The country comes from the billing details given at payment. */

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, FileText, ShieldCheck, UploadSimple } from "@phosphor-icons/react";
import {
  profilePending, profileSections, saveBusinessProfile, trnValid, useActiveCampaign, useProfile, useStore,
  type Profile,
} from "../../lib/store";
import { PROFILE_BY_DAYS, plusDays } from "../../lib/agent/connect";
import { BILLING_COUNTRIES } from "../../lib/agent/billing";
import { track } from "../../lib/track";
import { Btn } from "../ui";

const FLAG: Record<string, string> = {
  "United Arab Emirates": "🇦🇪", "Saudi Arabia": "🇸🇦", Kuwait: "🇰🇼", Qatar: "🇶🇦", Bahrain: "🇧🇭", Oman: "🇴🇲",
  Egypt: "🇪🇬", Jordan: "🇯🇴", Lebanon: "🇱🇧", Morocco: "🇲🇦", "United Kingdom": "🇬🇧", "United States": "🇺🇸",
};
const SHORT: Record<string, string> = { "United Arab Emirates": "UAE", "United Kingdom": "UK", "United States": "USA" };
/** Cities to pick from where the list is short and known; anywhere else the city is typed. */
const CITIES: Record<string, string[]> = {
  "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina"],
  Kuwait: ["Kuwait City", "Hawalli", "Farwaniya", "Ahmadi", "Jahra"],
  Qatar: ["Doha", "Al Rayyan", "Al Wakrah", "Lusail"],
  Bahrain: ["Manama", "Muharraq", "Riffa"],
  Oman: ["Muscat", "Sohar", "Salalah"],
};
const isUae = (c: string) => c === "United Arab Emirates";
const day = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function BusinessProfile({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const saved = useProfile();
  const camp = useActiveCampaign();
  /* The country and brand given with the payment (blocks.tsx, FundingBlock), the latest one. */
  const billing = useStore((s) => {
    const paid = Object.values(s.funding).filter((f) => f.state === "confirmed" && f.billing);
    return paid[paid.length - 1]?.billing ?? null;
  });
  const [draft, setDraft] = useState<Profile>(() => ({
    ...saved,
    country: saved.country || billing?.country || "",
  }));
  const [touchedVat, setTouchedVat] = useState(false);
  const set = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));

  const pending = profilePending(camp);
  const due = camp?.launch ? plusDays(camp.launch.paidAt, PROFILE_BY_DAYS) : null;
  const by = due ? `by ${day(due)}` : "before your campaign launches";
  const sections = profileSections(draft);
  const done = [sections.tax, sections.licence, sections.office].filter(Boolean).length;
  const canSave = sections.tax && sections.office;
  const brand = billing?.brandName || camp?.brandName || "Your brand";
  const cities = CITIES[draft.country];
  const vatBad = touchedVat && !!draft.vat.trim() && !trnValid(draft.vat, draft.country);
  const countries = useMemo(() => BILLING_COUNTRIES.filter((c) => c !== "Another country").concat("Another country"), []);

  useEffect(() => {
    if (camp && pending) track("hm_step_viewed", { brand: camp.url, campaign: camp.id, step: "profile" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (complete: boolean) => {
    if (camp) track("hm_button_clicked", { brand: camp.url, campaign: camp.id, step: "profile", button: complete ? "SAVE" : "SAVE_FOR_LATER" });
    saveBusinessProfile(draft, Date.now());
    if (complete) onDone(); else onBack();
  };

  const label = "text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-soft";
  const input = "h-12 w-full rounded-control border border-hairline bg-white px-4 text-body text-ink outline-none transition placeholder:text-ink-faint focus:border-brand/50 focus:ring-4 focus:ring-brand/[0.08]";
  const badge = (state: "done" | "required" | "optional", text: string) => (
    <span
      className={`shrink-0 rounded-pill border px-3 py-1 text-meta font-semibold ${
        state === "done" ? "border-good/25 bg-good/[0.07] text-good-deep"
        : state === "required" ? "border-danger/25 bg-danger/[0.06] text-danger"
        : "border-hairline bg-white font-medium text-ink-soft"
      }`}
    >
      {text}
    </span>
  );
  const section = (n: number, title: string, required: boolean, state: React.ReactNode, body: React.ReactNode) => (
    <section className="rounded-card bg-white p-5 shadow-card sm:p-6" aria-labelledby={`bp-${n}`}>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 id={`bp-${n}`} className="text-[17px] font-semibold text-ink">
          {n} · {title}{required && <span aria-hidden className="ms-1 text-danger">*</span>}
        </h3>
        {state}
      </header>
      <div className="space-y-5">{body}</div>
    </section>
  );

  return (
    <div className="mx-auto w-full max-w-[860px]">
      {/* No back button of its own: the top bar's "← Settings" already goes back, and two arrows read as two places. */}
      <header>
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold text-ink">{pending ? "Complete your business profile" : "Business profile"}</h2>
          <p className="mt-0.5 text-body text-ink-soft">
            We need these details to set up your campaign, issue VAT-compliant invoices, and verify your business.
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-4 rounded-card bg-lilac/70 p-5 sm:flex-row sm:items-start">
        <ShieldCheck size={22} className="shrink-0 text-brand" aria-hidden />
        <p className="min-w-0 flex-1 text-body leading-7 text-brand">
          Your <strong className="font-semibold">VAT number and office location are required {by}</strong>. Trade licence
          can be added any time, but completing it now speeds up campaign setup. Details are encrypted and only used for
          invoicing &amp; compliance.
        </p>
        <div className="shrink-0 text-end">
          <p className="text-[30px] font-bold leading-none text-brand tabular-nums">{done}/3</p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Sections done</p>
        </div>
      </div>

      <div className="mt-5 space-y-5 pb-6">
        {section(1, "Tax registration", true,
          sections.tax ? badge("done", "Done") : badge("required", `Required ${by}`),
          <>
            <label className="block">
              <span className={label}>VAT / TRN number</span>
              <input
                value={draft.vat}
                onChange={(e) => set({ vat: e.target.value })}
                onBlur={() => setTouchedVat(true)}
                inputMode={isUae(draft.country) ? "numeric" : "text"}
                dir="ltr"
                placeholder="e.g. 100123456700003"
                aria-invalid={vatBad || undefined}
                className={`${input} mt-2 ${vatBad ? "border-danger/50" : ""}`}
              />
              <span className={`mt-2 block text-meta ${vatBad ? "text-danger" : "text-ink-faint"}`}>
                {isUae(draft.country) || !draft.country ? "UAE TRN is 15 digits, issued by the Federal Tax Authority." : "Your company's VAT or tax registration number."}
              </span>
            </label>
            <label className="block">
              <span className={label}>Legal entity name <span className="font-normal text-ink-faint">· as registered</span></span>
              <input
                value={draft.legalName ?? ""}
                onChange={(e) => set({ legalName: e.target.value })}
                placeholder={`e.g. ${brand} Trading LLC`}
                autoComplete="organization"
                className={`${input} mt-2`}
              />
            </label>
          </>
        )}

        {section(2, "Trade licence", false,
          sections.licence ? badge("done", "Done") : badge("optional", "Optional now · needed before you fund a phase"),
          <>
            <label className="block">
              <span className={label}>Trade licence number</span>
              <input
                value={draft.tradeLicence}
                onChange={(e) => set({ tradeLicence: e.target.value })}
                dir="ltr"
                placeholder="e.g. CN-1234567"
                className={`${input} mt-2`}
              />
            </label>
            <div>
              <span className={label}>Licence document <span className="font-normal text-ink-faint">· PDF or image</span></span>
              <label className="mt-2 flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed border-hairline bg-wash/40 px-4 text-center transition hover:bg-wash focus-within:ring-4 focus-within:ring-brand/[0.08]">
                {draft.licenceFile ? (
                  <>
                    <FileText size={20} className="text-brand" aria-hidden />
                    <span className="text-body text-ink">{draft.licenceFile}</span>
                    <span className="text-meta font-semibold text-brand">Replace</span>
                  </>
                ) : (
                  <>
                    <UploadSimple size={20} className="text-ink-soft" aria-hidden />
                    <span className="text-body text-ink-soft"><span className="font-semibold text-brand">Click to upload</span> your trade licence</span>
                  </>
                )}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) set({ licenceFile: f.name }); }}
                />
              </label>
            </div>
          </>
        )}

        {section(3, "Office location", true,
          sections.office ? badge("done", "Done") : badge("required", `Required ${by}`),
          <>
            <label className="block">
              <span className={label}>Country {billing?.country && <span className="font-normal text-ink-faint">· from sign-up</span>}</span>
              <select
                value={draft.country}
                onChange={(e) => set({ country: e.target.value, city: "" })}
                className={`${input} mt-2 ${draft.country ? "" : "text-ink-faint"}`}
              >
                <option value="" disabled>Select country…</option>
                {countries.map((c) => <option key={c} value={c}>{FLAG[c] ? `${FLAG[c]}  ` : ""}{SHORT[c] ?? c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={label}>{isUae(draft.country) ? "City / Emirate" : "City"}</span>
              {cities ? (
                <select value={draft.city} onChange={(e) => set({ city: e.target.value })} className={`${input} mt-2 ${draft.city ? "" : "text-ink-faint"}`}>
                  <option value="" disabled>Select city…</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input value={draft.city} onChange={(e) => set({ city: e.target.value })} placeholder="City" className={`${input} mt-2`} />
              )}
            </label>
            <label className="block">
              <span className={label}>Street address</span>
              <input
                value={draft.street}
                onChange={(e) => set({ street: e.target.value })}
                placeholder="Building, street, floor / office no."
                autoComplete="street-address"
                className={`${input} mt-2`}
              />
            </label>
            <label className="block">
              <span className={label}>Area / District <span className="font-normal text-ink-faint">· optional</span></span>
              <input
                value={draft.area ?? ""}
                onChange={(e) => set({ area: e.target.value })}
                placeholder={isUae(draft.country) ? "e.g. Business Bay" : "Area or district"}
                className={`${input} mt-2`}
              />
            </label>
          </>
        )}
      </div>

      {/* Sticky at the bottom of the page, as in the design: what is needed, then the two ways out. */}
      <div className="sticky bottom-0 z-10 pb-4">
        <div className="flex flex-col gap-3 rounded-card border border-hairline bg-white px-5 py-4 shadow-pop sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 text-meta leading-5 text-ink-faint">
            {canSave
              ? <span className="inline-flex items-center gap-1.5 text-good-deep"><CheckCircle size={14} weight="fill" aria-hidden />Ready to save. HeyMoon starts matching your creators once it&apos;s in.</span>
              : `VAT number, legal name, city and street address are the minimum we need, ${by}.`}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Btn variant="ghost" onClick={() => save(false)}>Save for later</Btn>
            <Btn disabled={!canSave} onClick={() => save(true)}>Save details</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
