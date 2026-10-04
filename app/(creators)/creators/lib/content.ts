/* THE ADS A JOINED CAMPAIGN STILL OWES, one row per ad.
 *
 * The mobile design's Submit content for review, as data. A campaign's
 * bundle is dealt into single ads, each dated by the cadence the
 * creator picked when they joined — the brand sees that cadence, so the
 * dates are a promise rather than a suggestion — starting one
 * turnaround after the day they joined, the profile's "3 days from
 * brief to delivery". The Calendar, the campaign page and the counts on
 * the rail all read this, so they cannot disagree about what is due.
 *
 * The creator posts each ad from their own account and then submits
 * it — its live link, or a video of it — so it can be checked and paid.
 * Where a row stands comes from that submission and, before one, from
 * the date:
 *
 *   upcoming   more than a week out. Submitting early is fine
 *   due        inside the next seven days, nothing submitted — "Upload the ad"
 *   overdue    its day has passed with nothing submitted
 *   review     submitted, being checked
 *   accepted   it is up and carries the brief. It counts toward the payout
 *   rejected   something the brief asks for is missing, and it says which */

import { CADENCES, type Decision, type Format, type Offer, type Platform, type Submission } from "./agent/types";
import { addDays, dayKey, fromKey, mondayOf, startOfDay } from "./dates";

export type AdState = "upcoming" | "due" | "overdue" | "review" | "accepted" | "rejected";

export interface AdSlot {
  id: string;
  offerId: string;
  /** Which ad of the bundle, from 1, and of how many. */
  n: number;
  total: number;
  platform: Platform;
  format: Format;
  /** The day it is due to go up, YYYY-MM-DD. */
  day: string;
  state: AdState;
  submission?: Submission;
}

/** An ad shows as due a week before its day, so the week it goes up in
    is the week it is asked for. Anything ready sooner can go sooner. */
export const UPLOAD_WINDOW_DAYS = 7;

export const slotId = (offerId: string, n: number) => `ad-${offerId}-${n}`;

/** The bundle, one unit per ad, dealt round-robin across its lines, so
    three In-Feed Videos and two Reels do not arrive as a TikTok week and
    then a Reel week. */
export function units(o: Offer): { platform: Platform; format: Format }[] {
  const left = o.deliverables.map((d) => ({ ...d }));
  const out: { platform: Platform; format: Format }[] = [];
  while (left.some((d) => d.count > 0)) {
    for (const d of left) if (d.count > 0) { out.push({ platform: d.platform, format: d.format }); d.count -= 1; }
  }
  return out;
}

export function planFor({ offer, decision, submissions, turnaroundDays, today }: {
  offer: Offer;
  decision?: Decision;
  submissions: Record<string, Submission>;
  turnaroundDays: number;
  today: Date;
}): AdSlot[] {
  if (offer.state !== "approved") return [];
  const t0 = startOfDay(today);
  const perWeek = CADENCES.find((c) => c.key === decision?.cadence)?.perWeek ?? 3;
  const start = startOfDay(new Date(decision?.decidedAt ?? t0.getTime()));
  const horizon = addDays(t0, UPLOAD_WINDOW_DAYS - 1);
  const bundle = units(offer);
  const gap = 7 / perWeek;
  return bundle.map((u, i) => {
    const n = i + 1;
    const id = slotId(offer.id, n);
    const day = addDays(start, Math.max(1, turnaroundDays) + Math.round(i * gap));
    const sub = submissions[id];
    const state: AdState = sub ? sub.state : day < t0 ? "overdue" : day <= horizon ? "due" : "upcoming";
    return { id, offerId: offer.id, n, total: bundle.length, platform: u.platform, format: u.format, day: dayKey(day), state, submission: sub };
  });
}

/** Whether a row is waiting on the creator rather than on the check or
    the date. The count on the rail is these. */
export const needsYou = (s: AdSlot) => s.state === "due" || s.state === "overdue" || s.state === "rejected";

/* What to do first. Late work, then an ad that was not accepted, then
   whatever is due soonest. */
const URGENCY: Partial<Record<AdState, number>> = { overdue: 0, rejected: 1, due: 2 };

export interface PlanSummary {
  total: number;
  review: number;
  /** Checked and counting — the design's Completed Ads. */
  accepted: number;
  rejected: number;
  /** The one thing to press next, if anything is waiting on the creator. */
  action?: AdSlot;
  /** The next ad that is not due yet. */
  upcoming?: AdSlot;
}

export function summarize(slots: AdSlot[]): PlanSummary {
  const count = (st: AdState) => slots.filter((s) => s.state === st).length;
  const action = slots.filter(needsYou)
    .sort((a, b) => (URGENCY[a.state]! - URGENCY[b.state]!) || a.day.localeCompare(b.day) || a.n - b.n)[0];
  return {
    total: slots.length, review: count("review"), accepted: count("accepted"), rejected: count("rejected"),
    action, upcoming: slots.find((s) => s.state === "upcoming"),
  };
}

export interface AdWeek { key: string; start: Date; end: Date; slots: AdSlot[] }

/** The rows by the week they are due, Monday first, oldest week first. */
export function weeksOf(slots: AdSlot[]): AdWeek[] {
  const m = new Map<string, AdWeek>();
  for (const s of slots) {
    const start = mondayOf(fromKey(s.day));
    const key = dayKey(start);
    const w = m.get(key) ?? { key, start, end: addDays(start, 6), slots: [] };
    w.slots.push(s);
    m.set(key, w);
  }
  return Array.from(m.values()).sort((a, b) => a.key.localeCompare(b.key));
}
