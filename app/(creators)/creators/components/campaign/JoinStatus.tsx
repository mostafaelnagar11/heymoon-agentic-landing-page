"use client";

/* WHERE A JOINED CAMPAIGN STANDS, above its tabs.
 *
 * The design's Application Status card — status, the date, the posting
 * schedule, the duration — kept on the campaign rather than shown once,
 * with the one measure a creator checks every day beside it: how many
 * of the ads are accepted, and what is next. Money is on Stats, because
 * a performance campaign's money moves on Friday and the ads daily. */

import { CADENCES, type Decision, type Offer } from "../../lib/agent/types";
import { summarize, type AdSlot } from "../../lib/content";
import { fromKey, mediumDate, relDay, shortDay } from "../../lib/dates";
import { useToday } from "../../lib/usePlans";
import { Card, Chip, Sheet } from "../ui";
import { DecisionBlock } from "../blocks";

export function JoinStatus({ offer, decision, slots }: { offer: Offer; decision?: Decision; slots: AdSlot[] }) {
  const today = useToday();
  const sum = summarize(slots);
  const pre = offer.match.level === "prequalified";
  const at = decision?.decidedAt ? mediumDate(new Date(decision.decidedAt)) : decision?.at ?? "—";
  const pct = (n: number) => `${sum.total ? (n / sum.total) * 100 : 0}%`;
  const a = sum.action;
  const next: { text: string; tone: string } =
    a?.state === "overdue" ? { text: `Overdue since ${shortDay(fromKey(a.day))}`, tone: "text-danger" }
    : a?.state === "rejected" ? { text: "One wasn't accepted", tone: "text-danger" }
    : a?.state === "due" ? { text: `Next ad due ${relDay(a.day, today)}`, tone: "text-ink" }
    : sum.review ? { text: `${sum.review} being checked`, tone: "text-ink" }
    : sum.upcoming ? { text: `Next ad due ${shortDay(fromKey(sum.upcoming.day))}`, tone: "text-ink" }
    : { text: "Every ad is accepted", tone: "text-green" };

  const facts = [
    { k: "Status", v: <Chip tone="green">Active</Chip> },
    { k: pre ? "Joined" : "Approved", v: at },
    { k: "Scheduling", v: CADENCES.find((c) => c.key === decision?.cadence)?.label ?? "—" },
    { k: "Duration", v: decision?.duration ?? offer.duration ?? "No end date" },
  ];

  return (
    <Card edge className="overflow-hidden">
      {/* Four across once the campaign's own column has room (it is the
          @container), two in the conversation's panel and on a phone. */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3.5 @lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.k} className="min-w-0">
            <dt className="text-eyebrow font-semibold uppercase text-ink-50">{f.k}</dt>
            <dd className="num mt-1 truncate text-body font-semibold text-ink">{f.v}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-hairline px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-body text-ink-60">
            <span className="num font-semibold text-ink">{sum.accepted} of {sum.total}</span> ads accepted
            {sum.review > 0 && <span className="num"> · {sum.review} in review</span>}
          </p>
          <p className={`text-meta font-semibold ${next.tone}`}>{next.text}</p>
        </div>
        {/* Accepted, then being checked; the rest is lilac. */}
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-pill bg-lilac" role="img"
          aria-label={`${sum.accepted} of ${sum.total} ads accepted, ${sum.review} in review`}>
          <span className="bg-green" style={{ width: pct(sum.accepted) }} />
          <span className="bg-orange" style={{ width: pct(sum.review) }} />
        </div>
      </div>
    </Card>
  );
}

/** THE BRAND'S ANSWER, as the design's own screen: over the campaign the
    first time the creator sees it, and never again after that. */
export function ApplicationStatusSheet({ offer, decision, firstDue, onGo, onClose }: {
  offer: Offer; decision: Decision;
  /** When the first ad is due, for the line under the headline. */
  firstDue?: string;
  onGo: () => void; onClose: () => void;
}) {
  return (
    <Sheet open onClose={onClose} labelledBy="application-status">
      <DecisionBlock bare offer={offer} decision={decision} firstDue={firstDue}
        onGo={onGo} goLabel={decision.outcome === "approved" ? "Go to campaign" : "See other campaigns"} />
    </Sheet>
  );
}

