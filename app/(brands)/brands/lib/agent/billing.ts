/* Who Phase 1 is billed to, and the VAT that follows from it.

   The payment card asks three things before Pay (21 Oct): the brand name, the country, and whether the company is
   registered in the UAE. The VAT, and so the amount on the Pay button, follows the third answer.

   The rule is as Mostafa set it on 21 Oct: registered in the UAE, 0%; not registered, 5%. Under UAE VAT law it is
   usually the other way round (a UAE-registered business is charged 5%, and one outside the UAE is zero-rated as an
   export of services), so it is kept here, in one place, to confirm with finance and flip if needed. */

import { sourced, type FundingRequest } from "./types";

export interface Billing {
  brandName: string;
  country: string;
  uaeRegistered: boolean;
}

/** VAT rate on the phase budget, by the UAE-registration answer. */
export const VAT_RATE_FOR = { uaeRegistered: 0, notUaeRegistered: 0.05 } as const;
export const vatRateFor = (uaeRegistered: boolean) =>
  uaeRegistered ? VAT_RATE_FOR.uaeRegistered : VAT_RATE_FOR.notUaeRegistered;

export const vatOnBudget = (amount: number, uaeRegistered: boolean) => Math.round(amount * vatRateFor(uaeRegistered));

/** The countries the card offers, the region's first. "Another country" keeps anyone from being stuck. */
export const BILLING_COUNTRIES = [
  "United Arab Emirates", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman",
  "Egypt", "Jordan", "Lebanon", "Morocco", "United Kingdom", "United States", "Another country",
];

/** The request as paid: the brand's billing details on it, and the VAT and total worked out from them. */
export function withBilling(r: FundingRequest, b: Billing): FundingRequest {
  const rate = vatRateFor(b.uaeRegistered);
  const vat = vatOnBudget(r.amount.value, b.uaeRegistered);
  const pct = `${Math.round(rate * 100)}%`;
  const why = b.uaeRegistered
    ? `VAT at ${pct}: the company is registered in the UAE.`
    : `VAT at ${pct}: the company is not registered in the UAE.`;
  return {
    ...r,
    billing: b,
    vat: sourced(vat, why, r.vat.evidence, { computedFrom: `budget x ${pct}` }),
    /* The same evidence as the quoted total: a figure with none renders as "unsourced" (Evidence.tsx). */
    total: sourced(r.amount.value + vat, `Budget plus VAT at ${pct}.`, r.total.evidence.length ? r.total.evidence : r.vat.evidence, { computedFrom: "budget + VAT" }),
  };
}
