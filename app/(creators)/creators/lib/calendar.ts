/* What to post, and on which day.
 *
 * Nothing here is invented. Every post on the calendar is an ad a
 * joined campaign owes, from lib/content.ts: dated by the cadence the
 * creator picked when they joined, starting one turnaround after the
 * day they joined, and standing wherever the creator's own submissions
 * have got it to — in review, accepted, or not accepted.
 *
 * Only campaigns the creator is on. A draft for a campaign they have
 * not joined is not something they owe anybody, so it is not a post on
 * their calendar. */

import type { Decision, Format, Offer, Platform, Submission } from "./agent/types";
import { planFor, type AdState } from "./content";

export { addDays, dayKey, startOfDay } from "./dates";

export type PostState = "scheduled" | "review" | "accepted" | "rejected" | "overdue";

export interface CalPost {
  id: string;
  offerId: string;
  brand: string;
  brandLogo?: string;
  campaign: string;
  format: Format;
  platform: Platform;
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  state: PostState;
  /** Which ad of the campaign's bundle this is. */
  n?: number;
  total?: number;
}

/** The campaign an offer id names, without whose it is. Ids are
    `o-<campaign>-<creator>` and a handle has no hyphen, so the creator is
    the last segment. The fixtures (DRAFTS, PAYOUTS) are keyed to the
    sample creator's ids; matching on the campaign keeps them attached to
    the right campaign whoever is signed in — including a sample read,
    whose ids end in the typed handle. */
export const campaignOf = (offerId: string) => offerId.replace(/-[^-]*$/, "");

const POST_STATE: Record<AdState, PostState> = {
  upcoming: "scheduled", due: "scheduled", overdue: "overdue",
  review: "review", accepted: "accepted", rejected: "rejected",
};

export function scheduleFor({ offers, decisions, submissions, turnaroundDays, today }: {
  offers: Offer[];
  decisions: Record<string, Decision>;
  submissions: Record<string, Submission>;
  turnaroundDays: number;
  today: Date;
}): { posts: CalPost[]; accepted: number } {
  const posts: CalPost[] = offers.flatMap((o) =>
    planFor({ offer: o, decision: decisions[o.id], submissions, turnaroundDays, today }).map((s) => ({
      id: s.id, offerId: o.id, brand: o.brand, brandLogo: o.brandLogo, campaign: o.title,
      format: s.format, platform: s.platform, day: s.day, state: POST_STATE[s.state], n: s.n, total: s.total,
    })));
  posts.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.brand.localeCompare(b.brand)));
  return { posts, accepted: posts.filter((p) => p.state === "accepted").length };
}
