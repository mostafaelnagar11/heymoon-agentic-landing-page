"use client";

/* One phase, on its own.
 *
 * The campaign view answers "how is it going". This answers "how did
 * THIS rung go", which is a different question and the one a brand
 * asks when deciding whether to fund the next one. A closed phase is
 * the entire argument for the phase above it, so it gets a page rather
 * than a row.
 *
 * What it must never do is imply a phase that has not run has results.
 * A locked rung shows what it would cost and what it would guarantee,
 * and says plainly that everything else is priced when it opens.
 */

import { ArrowRight, CheckCircle, CreditCard, LockSimple } from "@phosphor-icons/react";
import {
  fmtUSD, pace, phaseTitle, UNLOCK_AT, vatOn, withVat, type Phase,
} from "../../lib/mock/campaigns";
import { queuePhase, useAds, useCan, type Campaign } from "../../lib/store";
import { OnlyAdmins } from "./Roles";
import { useGo } from "../../lib/surface";
import { RevenueChart } from "./RevenueChart";
import { DataRow, Section, Surface, Tile } from "./kit";

export function PhaseDetail({ campaign, phase }: { campaign: Campaign; phase: Phase }) {
  const go = useGo();
  const ads = useAds().filter((a) => a.campaignId === phase.id);
  const waiting = ads.filter((a) => a.state === "waiting").length;
  const live = ads.filter((a) => a.state === "live").length;
  const p = pace(phase);
  const ran = phase.status === "live" || phase.status === "ended";
  const target = phase.revTarget ?? 0;

  return (
    <div className="space-y-6">
      {phase.status === "ready" || phase.status === "queued" ? (
        <StartPhase campaign={campaign} phase={phase} />
      ) : !ran ? (
        <Surface className="p-5">
          <p className="flex items-center gap-2 text-body font-semibold text-ink">
            <LockSimple size={14} weight="fill" aria-hidden className="text-ink-faint" />
            {phaseTitle(phase.phaseNo)} has not opened
          </p>
          <p className="mt-1.5 text-meta leading-5 text-ink-soft">
            It opens when the phase before it reaches {Math.round(UNLOCK_AT * 100)}% of its target. Nothing here is
            charged, promised or scheduled until you start it.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label="Budget" value={fmtUSD(phase.budget)} sub="the same for every brand" />
            <Tile label="Guarantee" value={`${phase.guaranteedRoas}x`} sub={`${fmtUSD(phase.budget)} at ${phase.guaranteedRoas}x`} />
            <Tile label="Would guarantee" value={fmtUSD(Math.round(phase.budget * phase.guaranteedRoas))} />
          </div>
        </Surface>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Tile
              tone="hero"
              label="Attributed"
              value={fmtUSD(phase.rev)}
              sub={target ? `${Math.round((phase.rev / target) * 100)}% of ${fmtUSD(target)}` : undefined}
            />
            <Tile
              label="Guaranteed"
              value={fmtUSD(target)}
              sub={`${phase.guaranteedRoas}x on ${fmtUSD(phase.budget)}`}
            />
            <Tile label="Ads live" value={live} sub={waiting ? `${waiting} waiting on you` : "nothing waiting"} />
            <Tile
              /* "Forecast at close · $19,895 · 133% of target" stood
                 here. It is the same projected figure CampaignView
                 deleted a level up, with the ten-line explanation for
                 why still sitting in that file: a forecast beside a
                 guarantee reads as a second, softer promise, and the
                 brand remembers the forecast. A closed phase states
                 what it closed at, which is a fact. A running one
                 states how long it has, which is the thing you can
                 still act on. */
              label={phase.status === "ended" ? "Closed at" : "Days to the unlock line"}
              value={
                phase.status === "ended"
                  ? fmtUSD(phase.rev)
                  : p ? p.daysToUnlock : "—"
              }
              sub={
                phase.status === "ended"
                  ? `${Math.round((phase.rev / (target || 1)) * 100)}% of the guarantee`
                  : p ? `${p.daysLeft} days left` : undefined
              }
            />
          </div>

          {phase.status === "live" && (
            <Section title="Sales against target">
              <Surface className="p-4">
                <RevenueChart phase={phase} />
              </Surface>
            </Section>
          )}
        </>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="What it costs">
          <Surface>
            <DataRow label="Phase budget" value={fmtUSD(phase.budget)} />
            <DataRow label="VAT (5%)" value={fmtUSD(vatOn(phase.budget))} />
            <DataRow label={phase.status === "ready" ? "Due to start" : "Paid"} value={fmtUSD(withVat(phase.budget))} />
          </Surface>
        </Section>

        <Section title="What it promises">
          <Surface>
            <DataRow label="Guarantee" value={`${phase.guaranteedRoas}x`} />
            <DataRow label="Sales guaranteed" value={fmtUSD(Math.round(phase.budget * phase.guaranteedRoas))} />
            <DataRow label="Creators briefed" value={phase.creators ?? "—"} />
          </Surface>
        </Section>
      </div>

      {ran && waiting > 0 && (
        <Surface className="flex flex-wrap items-center gap-3 p-4">
          <span className="min-w-0 flex-1 text-body text-ink">
            {waiting} drafts wait on you.
          </span>
          <button
            onClick={() => go("ads")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-danger px-3 py-1.5 text-meta font-semibold text-white transition hover:bg-danger-deep"
          >
            Review <ArrowRight size={12} weight="bold" aria-hidden className="rtl:rotate-180" />
          </button>
        </Surface>
      )}

      <p className="text-[11px] text-ink-faint">
        {campaign.brandName} · {phaseTitle(phase.phaseNo)}
        {phase.start ? ` · started ${phase.start}` : ""}
        {phase.end ? ` · closed ${phase.end}` : ""}
      </p>
    </div>
  );
}

/* Starting a later phase (the campaign page's Start, 20 Oct). It is paid now and runs the day the live phase closes,
   so two phases never run at once. Paying is the brand's press, here as everywhere; no agent can make it. */
function StartPhase({ campaign, phase }: { campaign: Campaign; phase: Phase }) {
  const prev = campaign.phases.find((p) => p.phaseNo === phase.phaseNo - 1);
  const live = campaign.phases.find((p) => p.status === "live");
  const name = phaseTitle(phase.phaseNo).split(" · ")[0];
  const prevName = prev ? phaseTitle(prev.phaseNo).split(" · ")[0] : "the phase before";
  const vat = withVat(phase.budget) - phase.budget;
  const paid = phase.status === "queued";
  const canPay = useCan("pay");
  return (
    <Surface className="p-5">
      <p className="flex items-center gap-2 text-body font-semibold text-ink">
        {paid
          ? <CheckCircle size={15} weight="fill" aria-hidden className="text-good" />
          : <span aria-hidden className="h-2 w-2 rounded-full bg-amber" />}
        {paid ? `${name} is paid` : `${name} is ready`}
      </p>
      <p className="mt-1 text-meta text-ink-soft">
        {paid
          ? `It starts the day ${prevName} closes${live?.plannedDays && live.dayOfPhase ? `, in ${live.plannedDays - live.dayOfPhase} days` : ""}.`
          : `${prevName} passed ${Math.round(UNLOCK_AT * 100)}% of its target. Start it now and it begins the day ${prevName} closes.`}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Tile label="Budget" value={fmtUSD(phase.budget)} />
        <Tile label="Guarantee" value={`${phase.guaranteedRoas}x`} />
        <Tile tone="hero" label="Sales guaranteed" value={fmtUSD(Math.round(phase.budget * phase.guaranteedRoas))} />
      </div>
      {!paid && !canPay && <OnlyAdmins what="pay and start phases" className="mt-4" />}
      {!paid && canPay && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-control border border-hairline bg-rail px-4 py-3">
          <CreditCard size={16} weight="fill" aria-hidden className="text-ink-faint" />
          <p className="min-w-0 flex-1 text-meta text-ink-soft">
            <span className="num font-semibold text-ink">{fmtUSD(phase.budget)}</span> + {fmtUSD(vat)} VAT · Visa ••••4629
          </p>
          <button
            type="button"
            onClick={() => queuePhase(phase.id)}
            className="g-button inline-flex h-10 items-center rounded-pill border border-white/50 px-5 text-body font-semibold text-[#FBF8FE]"
          >
            Pay {fmtUSD(withVat(phase.budget))}
          </button>
        </div>
      )}
    </Surface>
  );
}
