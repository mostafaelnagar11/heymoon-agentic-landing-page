/* What pressing Join Campaign in the conversation does, in one place.
 *
 * Two things start a join — the campaign panel, and the sign-in popup
 * once its code is verified — and both have to end on the same
 * scheduling question in the same words, so neither owns the sentence. */

import { chatPicks, type AcceptRequest, type Offer } from "./agent/types";
import { askSignIn, hasAccount, push, type ThreadItem } from "./store";

/** The scheduling question, which is the first step of every join. */
export function askCadence(o: Offer) {
  const n = o.deliverables.reduce((m, d) => m + d.count, 0);
  push({ kind: "say", text: `${o.brand} wants ${n} deliverable${n === 1 ? "" : "s"}. How often do you want to post ${n === 1 ? "it" : "them"}?` });
  push({ kind: "cadence", offerId: o.id });
}

/** Join Campaign. Without an account, making one comes first — a
    campaign is joined by a person, and the brief, the code and the
    weekly payout are all addressed to them — and it happens in a popup,
    not in the thread (see AccountSheet). With one, straight on. */
export function beginJoin(o: Offer) {
  if (hasAccount()) { askCadence(o); return; }
  askSignIn(o.id);
}

/** WHAT THE CONVERSATION SHOWS AS CAMPAIGNS, given where the creator is.
 *
 * Before a join: the three strongest pre-qualified (chatPicks). Once a
 * join has started — Join Campaign pressed, and not backed out of at
 * the terms — or once any campaign is active or requested, the thread's
 * campaigns are only those. The carousel was a question, which one, and
 * a creator who has answered it should not keep being offered the other
 * two beside the one they chose; the rest are on the dashboard. The
 * carousel and the side panel both call this, so they cannot disagree.
 * `joining` is the campaigns mid-join, still open, for the card to say
 * so. */
export function chatCampaigns(offers: Offer[], thread: ThreadItem[], accepts: Record<string, AcceptRequest>) {
  const started = new Set(thread.flatMap((i) => (i.kind === "cadence" ? [i.offerId] : [])));
  const joining = new Set(offers
    .filter((o) => o.state === "open" && started.has(o.id) && accepts[`acc-${o.id}`]?.state !== "cancelled")
    .map((o) => o.id));
  const taken = offers.filter((o) => o.state === "approved" || o.state === "applied" || joining.has(o.id));
  return taken.length
    ? { list: taken, taken: true, joining }
    : { list: chatPicks(offers), taken: false, joining };
}

/** The carousel's and the panel's title for that list. */
export const chatCampaignsTitle = (c: ReturnType<typeof chatCampaigns>, countWord: (n: number) => string) =>
  c.taken
    ? (c.list.length === 1 ? "Your campaign" : "Your campaigns")
    : c.list.length && c.list.every((o) => o.match.level === "prequalified")
      ? `Your top ${countWord(c.list.length)}, Pre-qualified`
      : "Matched to you";
