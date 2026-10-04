"use client";

/* The ads every joined campaign owes, for the screens. One hook, so the
   rail's count, Explore's next ad, the Calendar and the campaign page
   all read the same rows off the same day. */

import { useMemo } from "react";
import { wantsYou, type Offer } from "./agent/types";
import { needsYou, planFor, type AdSlot } from "./content";
import { startOfDay } from "./dates";
import { useActiveProfile, useDecisions, useOffers, useSubmissions } from "./store";

/** Today, fixed for the life of the page, so a render just after
    midnight does not move half the rows. */
export const useToday = () => useMemo(() => startOfDay(new Date()), []);

/** Every approved campaign's ads, by campaign id. */
export function usePlans(): Map<string, AdSlot[]> {
  const offers = useOffers();
  const decisions = useDecisions();
  const submissions = useSubmissions();
  const turnaround = useActiveProfile()?.availability.value.turnaroundDays ?? 3;
  const today = useToday();
  return useMemo(() => new Map(offers
    .filter((o) => o.state === "approved")
    .map((o) => [o.id, planFor({ offer: o, decision: decisions[o.id], submissions, turnaroundDays: turnaround, today })])),
  [offers, decisions, submissions, turnaround, today]);
}

/** One campaign's ads. Empty for a campaign the creator is not on. */
export function usePlan(offer: Offer): AdSlot[] {
  return usePlans().get(offer.id) ?? [];
}

/** WHAT IS WAITING ON THE CREATOR: campaigns that want them and are
    unanswered, and ads that need them — to upload, re-cut, or report.
    The rail's badge and the bell are this one number. */
export function useWaiting(): number {
  const offers = useOffers();
  const plans = usePlans();
  const ads = Array.from(plans.values()).flat().filter(needsYou).length;
  return offers.filter((o) => o.state === "open" && wantsYou(o)).length + ads;
}
