/* What the agents would do next, worked out from the figures the dashboard already shows.

   The brand team's review (15 Oct): "We want to invent the new agentic workflows that actually will help the brands
   in their work, not just a side chat." Mostafa picked three of six concepts (20 Oct), and this file is the arithmetic
   behind all three, so the three never disagree about a number:

     catchUp      (A, the Dashboard)  what changed since the last visit, each line with its one action
     leadMoves    (B, the campaign)   where the phase is heading and the moves that add the most by its last day
     draftEstimate / draftNote (D, Ads) HeyMoon's call on each draft, what it should sell, the note for a re-cut

   Pure: state in, results out. The figures are ESTIMATES from the phase's own rate (sales per live ad per day), and
   every screen that shows one says "about". Nothing here moves money or publishes: an approval is a request the
   brand presses, a re-cut is a note to the creator, and a budget move stays inside a phase already paid for and can
   be undone. */

import type { Phase } from "../mock/campaigns";
import { fmtUSD, pace, phaseTitle } from "../mock/campaigns";
import { CREATORS, creatorById } from "../mock/creators";
import { CREATOR_SHARE } from "./model";
import type { AdRecord } from "./types";
import type { DashboardView } from "./dashboard";

export type MoveAction =
  /** Prepare an approval for the drafts the agent cleared. The brand confirms it. */
  | { label: string; do: "approve-cleared"; adIds: string[] }
  | { label: string; do: "open"; view: DashboardView }
  | { label: string; do: "open-phase"; phaseId: string }
  | { label: string; do: "undo"; activityId: string; title: string }
  /** Send the creator the drafted note; the draft stays out of publishing until she re-cuts it. */
  | { label: string; do: "recut"; adId: string; note: string; creator: string }
  /** Shift budget between two live ads inside the running phase. Logged, and undoable. */
  | { label: string; do: "rebalance"; from: string; to: string; amount: number; fromName: string; toName: string; adds: number }
  /** Open the panel with the reasoning, for the brand who wants it. */
  | { label: string; do: "why"; q: string; say: string };

interface ActivityLike {
  id: string;
  agent: string;
  title: string;
  because: string;
  effect: string;
  ruleKey?: string;
  undone: boolean;
  undoable: boolean;
  adds?: number;
}

const round10 = (n: number) => Math.round(n / 10) * 10;
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const first = (name: string) => name.split(" ")[0];
/** "Noon Reviews' video", "Paola El Sitt's video". */
const owns = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

/* ------------------------------------------------------------------ */
/* The rate everything is estimated from                               */
/* ------------------------------------------------------------------ */

/** A new ad takes days to find its audience, so it earns about this share of a running ad's rate. */
export const RAMP = 0.6;
/** Days a re-cut takes to come back and go live. */
export const RECUT_DAYS = 4;

/** Sales per live ad per day, in this phase so far. */
export function perAdDay(phase: Phase, ads: AdRecord[]): number {
  const live = ads.filter((a) => a.campaignId === phase.id && a.state === "live").length;
  if (!live || !phase.dayOfPhase) return 0;
  return phase.rev / live / phase.dayOfPhase;
}

const daysLeft = (phase: Phase) => Math.max(0, (phase.plannedDays ?? 0) - (phase.dayOfPhase ?? 0));

/* ------------------------------------------------------------------ */
/* D · Review with HeyMoon                                             */
/* ------------------------------------------------------------------ */

/** What a draft should sell in its first week live: the phase's rate per ad, scaled by how many people the creator
    usually reaches against the roster's median, held between 0.6x and 1.6x. */
export function draftEstimate(ad: AdRecord, phase: Phase, ads: AdRecord[]): number {
  const views = [...CREATORS.map((c) => c.avgViews)].sort((a, b) => a - b);
  const median = views[Math.floor(views.length / 2)] || 1;
  const reach = Math.min(1.6, Math.max(0.6, (creatorById(ad.creatorId)?.avgViews ?? median) / median));
  return round10(perAdDay(phase, ads) * 7 * RAMP * reach);
}

/** The note to the creator for a re-cut, written from what the draft misses. Empty when it misses nothing: the brand
    is asking for a change HeyMoon did not, so the brand writes it. */
export function draftNote(ad: AdRecord): string {
  const miss = ad.compliance.checks.filter((c) => !c.clean);
  if (ad.compliance.verdict !== "hold" || !miss.length) return "";
  const fix = miss.map((c) => c.label.charAt(0).toLowerCase() + c.label.slice(1)).join("; ");
  return (
    `Hi ${first(ad.creatorName)}, thanks for the ${ad.product.split(",")[0].toLowerCase()} draft. One thing before it ` +
    `goes out: ${fix}. Could you re-cut it with that fixed? Everything else is on brief.`
  );
}

/* ------------------------------------------------------------------ */
/* B · Grow the lead                                                   */
/* ------------------------------------------------------------------ */

export interface LeadMove {
  id: string;
  title: string;
  why: string;
  /** Estimated sales this adds by the phase's last day. */
  adds: number;
  action: MoveAction;
}

export function leadMoves(i: { phase: Phase; ads: AdRecord[]; activity: ActivityLike[] }): {
  moves: LeadMove[];
  /** Where the phase lands at its current rate. */
  onPace: number;
  /** And with every move below made. */
  withMoves: number;
} {
  const { phase } = i;
  const p = pace(phase);
  const mine = i.ads.filter((a) => a.campaignId === phase.id);
  const rate = perAdDay(phase, i.ads);
  const left = daysLeft(phase);
  const moves: LeadMove[] = [];

  const waiting = mine.filter((a) => a.state === "waiting");
  const cleared = waiting.filter((a) => a.compliance.verdict !== "hold");
  const held = waiting.filter((a) => a.compliance.verdict === "hold");

  if (cleared.length && left > 0) {
    moves.push({
      id: "approve",
      title: `Approve the ${cleared.length} ${plural(cleared.length, "draft", "drafts")} on brief`,
      why: `Each live ad sells about ${fmtUSD(Math.round(rate))} a day in this phase; a new one starts slower.`,
      adds: round10(cleared.length * rate * left * RAMP),
      action: { label: `Approve ${cleared.length}`, do: "approve-cleared", adIds: cleared.map((a) => a.id) },
    });
  }

  /* The weakest and the strongest live ad, on the same spend each (the phase's creator budget split evenly). */
  const live = mine.filter((a) => a.state === "live" && a.performance).sort(
    (a, b) => (b.performance?.revenue.value ?? 0) - (a.performance?.revenue.value ?? 0)
  );
  const moved = i.activity.some((a) => !a.undone && a.id.startsWith("act-lead-"));
  if (live.length >= 2 && !moved && left > 0) {
    const top = live[0];
    const weak = live[live.length - 1];
    const spend = (phase.budget * CREATOR_SHARE) / live.length;
    const gain = ((top.performance!.revenue.value - weak.performance!.revenue.value) / spend);
    const amount = Math.max(100, Math.round((spend * 0.75) / 50) * 50);
    const adds = round10(amount * gain * (left / (phase.plannedDays || 30)));
    if (adds > 0) {
      moves.push({
        id: "rebalance",
        title: `Move ${fmtUSD(amount)} to ${owns(top.creatorName)} ${top.format.toLowerCase()}`,
        why: `It has sold ${fmtUSD(top.performance!.revenue.value)}, against ${fmtUSD(weak.performance!.revenue.value)} for ${owns(weak.creatorName)}, on the same spend.`,
        adds,
        action: {
          label: `Move ${fmtUSD(amount)}`, do: "rebalance", from: weak.id, to: top.id, amount, adds,
          fromName: `${owns(weak.creatorName)} ${weak.format.toLowerCase()}`, toName: `${owns(top.creatorName)} ${top.format.toLowerCase()}`,
        },
      });
    }
  }

  for (const h of held) {
    const note = draftNote(h);
    if (!note || left <= RECUT_DAYS) continue;
    moves.push({
      id: `recut-${h.id}`,
      title: `Ask ${first(h.creatorName)} for a re-cut`,
      why: `The ${h.product.split(",")[0].toLowerCase()} draft only misses ${h.compliance.checks.filter((c) => !c.clean).length === 1 ? "one thing" : "a few things"}. Fixed, it can be live within ${RECUT_DAYS} days.`,
      adds: round10(rate * (left - RECUT_DAYS) * RAMP),
      action: { label: "Send note", do: "recut", adId: h.id, note, creator: first(h.creatorName) },
    });
  }

  moves.sort((a, b) => b.adds - a.adds);
  /* What has already been done counts toward the pace, so making a move never lowers the forecast: drafts approved
     here are live with no figures of their own yet, and a budget move carries its estimate in the log. */
  const fresh = mine.filter((a) => a.state === "live" && !a.performance).length;
  const made = i.activity.filter((a) => !a.undone && a.id.startsWith("act-lead-")).reduce((n, a) => n + (a.adds ?? 0), 0);
  const onPace = Math.round((p?.atEnd ?? phase.rev) + round10(fresh * rate * left * RAMP) + made);
  return { moves: moves.slice(0, 3), onPace, withMoves: onPace + moves.slice(0, 3).reduce((n, m) => n + m.adds, 0) };
}

/* ------------------------------------------------------------------ */
/* A · Catch me up                                                     */
/* ------------------------------------------------------------------ */

export interface CatchUpRow {
  id: string;
  /** The figure the row leads with. */
  figure: string;
  title: string;
  detail: string;
  actions: MoveAction[];
}

/** What changed in the last `days` days, and the one thing that needs the brand. */
export function catchUp(i: {
  phase: Phase | null;
  ready: Phase | null;
  ads: AdRecord[];
  activity: ActivityLike[];
  days: number;
  /** The sales actually added since the last visit, when the dashboard knows them (CatchUp keeps a note of what the
      brand last saw). Without it the figure is estimated from the pace, which is only right on an older phase. */
  sales?: number;
}): { rows: CatchUpRow[]; ready: CatchUpRow | null } {
  const rows: CatchUpRow[] = [];
  const { phase } = i;

  if (phase && phase.dayOfPhase) {
    const p = pace(phase);
    /* An estimate that reaches the whole phase is the phase's own total, exactly, so it agrees with the figure below. */
    const est = Math.min(phase.rev, (p?.perDay ?? 0) * i.days);
    const since = i.sales !== undefined ? Math.min(phase.rev, i.sales) : est >= phase.rev ? phase.rev : round10(est);
    const live = i.ads.filter((a) => a.campaignId === phase.id && a.state === "live" && a.performance)
      .sort((a, b) => (b.performance?.revenue.value ?? 0) - (a.performance?.revenue.value ?? 0));
    const top = live[0];
    if (since > 0) {
      const share = top && phase.rev ? round10(since * ((top.performance?.revenue.value ?? 0) / phase.rev)) : 0;
      rows.push({
        id: "sales",
        figure: `+${fmtUSD(since)}`,
        title: "In sales",
        detail: top ? `Most from ${owns(top.creatorName)} ${top.format.toLowerCase()}, about +${fmtUSD(share)}.` : `${phaseTitle(phase.phaseNo)} only.`,
        actions: [{ label: "See it", do: "open", view: "ads" }],
      });
    }
    const waiting = i.ads.filter((a) => a.campaignId === phase.id && a.state === "waiting");
    const cleared = waiting.filter((a) => a.compliance.verdict !== "hold");
    const held = waiting.length - cleared.length;
    if (waiting.length) {
      rows.push({
        id: "drafts",
        figure: String(waiting.length),
        title: `${plural(waiting.length, "Draft", "Drafts")} waiting`,
        detail: `${cleared.length} on brief${held ? `, ${held} ${plural(held, "misses", "miss")} it` : ""}.`,
        actions: [
          { label: "Review", do: "open", view: "ads" },
          ...(cleared.length ? [{ label: `Approve ${cleared.length}`, do: "approve-cleared" as const, adIds: cleared.map((a) => a.id) }] : []),
        ],
      });
    }
  }

  const last = i.activity.find((a) => !a.undone && a.undoable);
  if (last) {
    rows.push({
      id: `act-${last.id}`,
      figure: "✓",
      title: last.title,
      detail: `${last.agent}, on its own.`,
      actions: [
        { label: "Why", do: "why", q: `Why: ${last.title.toLowerCase()}?`, say: `${last.because}\n\n${last.effect}` },
        { label: "Undo", do: "undo", activityId: last.id, title: last.title },
      ],
    });
  }

  const r = i.ready;
  const ready: CatchUpRow | null = r
    ? {
        id: "ready",
        figure: "",
        title: `${phaseTitle(r.phaseNo).split(" · ")[0]} is ready`,
        detail: `${fmtUSD(r.budget)} at ${r.guaranteedRoas}x, ${fmtUSD(Math.round(r.budget * r.guaranteedRoas))} guaranteed. Only you can start it.`,
        actions: [{ label: `Open ${phaseTitle(r.phaseNo).split(" · ")[0]}`, do: "open-phase", phaseId: r.id }],
      }
    : null;

  return { rows, ready };
}
