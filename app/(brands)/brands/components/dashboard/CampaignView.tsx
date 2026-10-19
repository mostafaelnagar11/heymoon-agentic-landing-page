"use client";

/* The campaign, as a dashboard rather than as a report.
 *
 * What this replaces: four stacked prose blocks of equal weight —
 * "what happened", "what it means", "what I did", "what I need from
 * you" — each a paragraph, with the only figures that matter set in
 * the middle of a sentence. That shape is right in a side panel, which
 * is where it was written. On a wide page it is a wall, and the number
 * a brand opened the page for takes longer to find than it took to
 * load.
 *
 * The order here is the order of the questions people actually arrive
 * with: am I going to hit it, is anything waiting on me, what is the
 * shape of it, what did you do without asking. The reasoning behind
 * each answer is not deleted — it moves behind a disclosure, or to the
 * assistant beside the page, where asking is the whole point.
 */

import { CaretRight, Lightning, Warning } from "@phosphor-icons/react";
import { fmtUSD, pace, phaseTitle, UNLOCK_AT, type Phase } from "../../lib/mock/campaigns";
import {
  campaignLabel, openCampaign, showCampaignList, useActiveCampaign, useActivity, useAds,
  useCampaignPhases, useDrill, useLivePhase, type Campaign,
} from "../../lib/store";
import { CampaignsList } from "./CampaignsList";
import { CreatorsView } from "./CreatorsView";
import { AdsView } from "./AdsView";
import { ActivityView } from "./ActivityView";
import { PhaseDetail } from "./PhaseDetail";
import { RevenueChart } from "./RevenueChart";
import { Surface } from "./kit";
import { LeadMoves } from "./LeadMoves";
import { CampaignHeader, PhaseStepper, TopSellers, WaitingOnYou, WhoSelling } from "./CampaignOverview";
import { leadMoves } from "../../lib/agent/moves";


/** The five faces of one campaign. They were five rows in the rail,
    ranked alongside Campaigns itself, which made them read as five
    places rather than five views of one thing — and they are views of
    one thing: switch the brand and every one of them changes. */
/* Four (20 Oct redesign). "Needs you" went: the moves beside the chart and the review in Ads say the same thing with
   the presses attached. Its key still opens a campaign (as the Overview), so old deep links keep working. */
export const CAMPAIGN_TABS = [
  { key: "campaign", label: "Overview" },
  { key: "ads", label: "Ads" },
  { key: "creators", label: "Creators" },
  { key: "activity", label: "Activity" },
] as const;
export type CampaignTab = (typeof CAMPAIGN_TABS)[number]["key"];

/* Three levels behind one nav item: every campaign, one campaign with
   its phases, one phase. Pressing Campaign in the rail always returns
   to the list, which is the only way a drill-down stays escapable. */
export function CampaignView({ tab = "campaign", onTab }: {
  tab?: CampaignTab;
  /** Set by the dashboard, because the tab IS the dashboard view: the
      assistant and the activity log both deep-link to "ads" and
      "inbox", and those links have to keep working now that the rail
      no longer offers them. */
  onTab?: (t: CampaignTab) => void;
}) {
  const drill = useDrill();
  const campaign = useActiveCampaign();
  const phases = useCampaignPhases();
  const ads = useAds();
  const waiting = campaign
    ? ads.filter((a) => a.state === "waiting" && campaign.adIds.includes(a.id)).length
    : 0;

  /* The list only answers for the Phases tab. Asking for Ads from
     somewhere else — the action bar on the home page, the assistant,
     the activity log — names a face of a campaign, so it opens that
     face of the active one rather than dropping you on the list of
     brands to find it yourself. */
  if (!campaign || (drill.level === "list" && tab === "campaign")) return <CampaignsList />;
  const live = campaign.phases.find((p) => p.status === "live") ?? null;

  const phase = drill.phaseId ? phases.find((p) => p.id === drill.phaseId) ?? null : null;

  return (
    <div className="space-y-5">
      <Crumbs campaign={campaign} phase={phase} />
      {/* Which campaign this is, above every face of it (CampaignOverview.tsx). The tabs belong to the campaign, not
          to the phase: drilling into one rung steps them aside. */}
      {!phase && <CampaignHeader campaign={campaign} />}
      {!phase && (
        <div role="tablist" aria-label="Campaign" className="flex flex-wrap gap-1 border-b border-hairline">
          {CAMPAIGN_TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={on}
                onClick={() => onTab?.(t.key)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-body transition ${
                  on ? "border-main font-semibold text-ink" : "border-transparent text-ink-50 hover:text-ink-90"
                }`}
              >
                {t.label}
                {t.key === "ads" && waiting > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-danger/[0.10] px-1 text-tiny font-semibold text-danger">
                    {waiting}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {phase ? (
        <PhaseDetail campaign={campaign} phase={phase} />
      ) : tab !== "campaign" && tab !== "creators" && !campaign.paid ? (
        /* Phases and Creators read fine before payment: the ladder and
           the crew are about what EXISTS. The other three are about
           what is running, and nothing is. */
        <Surface className="p-6 text-center">
          <p className="text-body text-ink-soft">
            {campaignLabel(campaign)} has not started yet. Start Phase 1 and connect the store, and this fills in.
          </p>
        </Surface>
      ) : tab === "creators" ? (
        <div className="space-y-6">
          {live && <WhoSelling phase={live} />}
          <CreatorsView />
        </div>
      ) : tab === "ads" ? (
        <AdsView />
      ) : tab === "activity" ? (
        <ActivityView />
      ) : (
        <OneCampaign />
      )}
    </div>
  );
}

function Crumbs({ campaign, phase }: { campaign: Campaign; phase: Phase | null }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <button onClick={showCampaignList} className="font-semibold text-brand hover:underline">
        Campaigns
      </button>
      <CaretRight size={9} weight="bold" aria-hidden className="text-ink-faint rtl:rotate-180" />
      {phase ? (
        <>
          <button onClick={() => openCampaign(campaign.id)} className="font-semibold text-brand hover:underline">
            {campaignLabel(campaign)}
          </button>
          <CaretRight size={9} weight="bold" aria-hidden className="text-ink-faint rtl:rotate-180" />
          <span className="text-ink-faint">{phaseTitle(phase.phaseNo)}</span>
        </>
      ) : (
        <span className="text-ink-faint">{campaignLabel(campaign)}</span>
      )}
    </nav>
  );
}

function OneCampaign() {
  const phase = useLivePhase();
  const phases = useCampaignPhases();
  const ads = useAds();
  const activity = useActivity();

  /* Between phases there is no line to draw and nothing selling; the row of phases says where things stand. */
  if (!phase) {
    return (
      <div className="space-y-6">
        <PhaseStepper phases={phases} />
        <Surface className="p-6 text-center">
          <p className="text-body text-ink-soft">No phase is running. Open the next one above to start it.</p>
        </Surface>
      </div>
    );
  }

  const p = pace(phase);
  const crossed = p ? p.pctNow >= UNLOCK_AT * 100 : false;
  /* B · Grow the lead: where the phase lands, and the moves that add the most (lib/agent/moves). */
  const lead = leadMoves({ phase, ads, activity });

  return (
    <div className="space-y-6">
      {/* 1 · The phases as one row: what each sold against what it guarantees, and the next one to start. */}
      <PhaseStepper phases={phases} />

      {/* 2 · Where the running phase is heading, beside the moves that change it. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <Surface className="p-5">
          <div className="flex flex-wrap items-start gap-x-8 gap-y-2">
            {([
              ["Sold", fmtUSD(phase.rev), "text-ink"],
              ["On pace for", fmtUSD(lead.onPace), "text-ink"],
              ...(lead.withMoves > lead.onPace ? [["With the moves", fmtUSD(lead.withMoves), "text-[#A21CAF]"]] : []),
            ] as const).map(([k, v, c]) => (
              <div key={k}>
                <p className="text-[11px] text-ink-faint">{k}</p>
                <p className={`num text-[24px] font-semibold tracking-[-0.02em] ${c}`}>{v}</p>
              </div>
            ))}
            <span className={`ms-auto inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
              crossed ? "bg-good/10 text-good-deep" : "bg-brand/10 text-brand"
            }`}>
              {crossed ? <Lightning size={11} weight="fill" aria-hidden /> : <Warning size={11} weight="fill" aria-hidden />}
              {crossed ? "Next phase unlocked" : `${p?.daysToUnlock ?? 0} days to the unlock line`}
            </span>
          </div>
          <div className="mt-2">
            <RevenueChart phase={phase} projection={{ onPace: lead.onPace, withMoves: lead.withMoves }} height={280} />
          </div>
        </Surface>
        <LeadMoves phase={phase} moves={lead.moves} />
      </div>

      {/* 3 · Who is selling, next to what is waiting on the brand. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <TopSellers phase={phase} />
        <WaitingOnYou phase={phase} />
      </div>
    </div>
  );
}
