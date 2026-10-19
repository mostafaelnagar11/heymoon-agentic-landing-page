"use client";

/* The dashboard home — the current app's `/dashboard` main column,
 * rebuilt on this project's store.
 *
 * Two things changed in the port, and only two.
 *
 * THE TOP OF THE PAGE IS THE ACCOUNT'S, NOT ONE CAMPAIGN'S. The current
 * app has one brand and one ladder, so its five tiles total that ladder
 * and say so. Here a brand can build several campaigns, and the home of
 * a workspace that holds three of them cannot quietly report one. So
 * the tiles, the ladder averages and the benchmark rows all sum every
 * funded phase of every campaign, and each sub-line says which set it
 * counted. The sections under them — the phase running now, the ladder
 * table — stay scoped to the ACTIVE campaign, because a phase belongs
 * to one campaign and "the phase running now" across three of them is
 * not a thing you can put in one card.
 *
 * EVERY FIGURE IS DERIVED. The current app stores `revLabel`, `roas`
 * and a written-out `threshold` string on each phase; this project
 * stores the inputs and nothing else. So revenue is formatted through
 * `fmtUSD`, the multiple is `rev ÷ budget`, the percentage is
 * `phasePct`, and the unlock line is read off `pace()` rather than
 * typed into a fixture. The one exception is the twelve-month chart,
 * which is fixture data and says so in its own file.
 *
 * FUNDED means paid for — live or ended. A ready phase is unlocked but
 * not bought and a locked one cannot be bought at all, so neither has a
 * dollar committed or a dollar earned, and neither belongs in a total.
 */

import { ArrowRight, Check, Clock, LockSimple } from "@phosphor-icons/react";
import {
  fmtUSD, phasePct, phaseTitle, type Phase, type PhaseStatus,
} from "../../lib/mock/campaigns";
import {
  openPhase, useAccount, useAds, useCampaignPhases, useCampaigns,
  useLivePhase, useReadyPhase, type Campaign,
} from "../../lib/store";
import { useGo } from "../../lib/surface";
import { AskChip } from "./HeyMoon";
import { CatchUp } from "./CatchUp";
import { paceSentence } from "../../lib/agent/dashboard";
import { Surface } from "./kit";
import { RevenueRuler } from "../Ruler";

/* ------------------------------------------------------------------ */
/* Ladder arithmetic                                                   */
/* ------------------------------------------------------------------ */

const isFunded = (p: Phase) => p.status === "live" || p.status === "ended";
const sumBy = (rows: Phase[], pick: (p: Phase) => number) => rows.reduce((n, p) => n + pick(p), 0);


/** This phase's multiple: what it earned against what it cost. Per
    phase, never run-cumulative, and never shown for a rung nobody has
    paid for — a $0 ÷ $6,000 reads like a failure rather than a blank. */
const roasOf = (p: Phase) => (p.budget ? `${(p.rev / p.budget).toFixed(1)}x` : "—");

/** How a phase's window reads. A phase with no start has not been
    funded, so it has no window to state — what it says instead depends
    on whether it is payable. */
const phaseWindow = (p: Phase) => {
  if (!p.start) return p.status === "ready" ? "Starts when funded" : "Not scheduled";
  return p.end ? `${p.start} to ${p.end}` : `Started ${p.start}`;
};


/* ------------------------------------------------------------------ */
/* Status badge                                                        */
/*                                                                     */
/* Every status needs its OWN branch. A fall-through here once labelled */
/* a locked phase — queued, never run — "Completed", which is the most  */
/* misleading word available for it.                                   */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: PhaseStatus }) {
  if (status === "live") return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-brand/20 bg-brand/[0.07] px-2.5 py-1 text-[11px] font-semibold text-brand">
      <span aria-hidden className="h-1.5 w-1.5 animate-live rounded-pill bg-brand" />
      Live
    </span>
  );
  if (status === "ready") return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-danger/25 bg-danger/[0.07] px-2.5 py-1 text-[11px] font-semibold text-danger">
      <Clock size={11} weight="fill" aria-hidden />
      Ready to fund
    </span>
  );
  if (status === "locked") return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-hairline bg-wash px-2.5 py-1 text-[11px] font-semibold text-ink-faint">
      <LockSimple size={11} weight="fill" aria-hidden />
      Queued
    </span>
  );
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-neutral-200 bg-wash px-2.5 py-1 text-[11px] font-semibold text-ink-faint">
      <Check size={11} weight="bold" aria-hidden />
      Completed
    </span>
  );
}

/** The one control that repeats: open a rung. */
function ViewButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-body font-medium text-ink-faint transition-colors hover:bg-brand/[0.06] hover:text-brand"
    >
      View <ArrowRight size={12} weight="bold" aria-hidden className="rtl:rotate-180" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* The current phase                                                   */
/*                                                                     */
/* Singular on purpose. A campaign runs one phase at a time, so this is */
/* one card, never a grid of concurrent programmes.                    */
/* ------------------------------------------------------------------ */



/* ------------------------------------------------------------------ */
/* Phase ladder                                                        */
/*                                                                     */
/* One row per rung, in the order the campaign works through them.     */
/*                                                                     */
/* A rung that has not been paid for has no numbers of its own: ready  */
/* and locked print an em dash rather than a $0 that reads like a      */
/* failure. Locked is not even openable — it has no creators, no ads   */
/* and nothing to look at — so it gets no link and, above all, no fund */
/* button: its predecessor has not crossed the 80% line.               */
/* ------------------------------------------------------------------ */

function PhaseLadder({ phases, onOpen }: { phases: Phase[]; onOpen: (id: string) => void }) {
  return (
    <Surface>
      <div className="p-6 pb-0">
        <h3 className="text-title font-semibold text-ink">Phases</h3>
      </div>

      {phases.length === 0 ? (
        <p className="px-6 py-6 text-body text-ink-faint">
          This campaign has no phases yet. HeyMoon builds the ladder, so the first rung appears here once it is matched.
        </p>
      ) : (
        /* The scroll lives inside the card rather than on it, so the
           rounded corners still clip the table on a narrow screen. */
        <div className="overflow-x-auto px-6 pb-6 pt-4">
          <table className="w-full min-w-[640px] text-body">
            <thead>
              <tr className="border-b border-hairline">
                {["Phase", "Status", "Budget", "Sales", "Multiple", ""].map((h, i) => (
                  <th key={h || i} className="pb-3 text-start text-meta font-medium text-ink-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {phases.map((p) => {
                const funded = isFunded(p);
                const target = p.revTarget ?? p.budget * p.guaranteedRoas;
                const pct = phasePct(p);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-rail">
                    <td className="py-4 pe-4">
                      <p className="font-medium text-ink">{phaseTitle(p.phaseNo)}</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">{phaseWindow(p)}</p>
                    </td>
                    <td className="py-4 pe-3"><StatusBadge status={p.status} /></td>
                    <td className="py-4 pe-3">
                      <p className={`font-medium tabular-nums ${funded ? "text-ink-soft" : "text-ink-faint"}`}>
                        {fmtUSD(p.budget)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {funded
                          ? `${fmtUSD(target)} target`
                          : p.status === "ready" ? "due now" : "not payable yet"}
                      </p>
                    </td>
                    <td className="py-4 pe-3">
                      {funded ? (
                        <>
                          <p className="font-medium tabular-nums text-ink-soft">{fmtUSD(p.rev)}</p>
                          {pct !== null && (
                            <div className="relative mt-1.5 h-1 w-24 rounded-pill bg-track">
                              <div className="h-full rounded-pill bg-brand" style={{ width: `${Math.min(pct, 100)}%` }} />
                              <span aria-hidden className="absolute -inset-y-0.5 start-[80%] w-px bg-brand/40" />
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-ink-faint/60">—</span>
                      )}
                    </td>
                    <td className="py-4 pe-3">
                      {funded ? (
                        <>
                          <p className="font-semibold tabular-nums text-brand">{roasOf(p)}</p>
                          <p className="mt-0.5 text-[11px] text-ink-faint">{p.guaranteedRoas}x guaranteed</p>
                        </>
                      ) : (
                        <span className="text-ink-faint/60">—</span>
                      )}
                    </td>
                    <td className="py-4 text-end">
                      {p.status !== "locked" && (
                        <ViewButton onClick={() => onOpen(p.id)} label={`Open ${phaseTitle(p.phaseNo)}`} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Surface>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

export function HomeView() {
  const go = useGo();
  const account = useAccount();
  const campaigns = useCampaigns();
  const phases = useCampaignPhases();
  const live = useLivePhase();
  const ready = useReadyPhase();
  const ads = useAds();


  /* Home is the ACCOUNT's page, so these total every ladder in it. The
     sections below are the active campaign's and say so. */
  const allPhases = campaigns.flatMap((c: Campaign) => c.phases);
  const funded = allPhases.filter(isFunded);
  const revenue = sumBy(funded, (p) => p.rev);
  const spend = sumBy(funded, (p) => p.budget);
  const livePct = live ? phasePct(live) : null;


  const open = (id: string) => {
    /* Opening a rung moves the drill AND the surface: `openPhase` sets
       which phase is open, and the phase lives in the Campaign view. */
    openPhase(id);
    go("campaign");
  };

  /* Two, under the staircase, not four above it.

     "Current phase" is the band at the top of the page now, said in
     the brand's own money rather than as a percentage. "Sales per $1
     spent" was the figure the invented category average existed to
     judge, and with the benchmark gone it is a ratio with nothing to
     be measured against; the staircase says the same thing per rung,
     against the guarantee, which is the only comparison HeyMoon has
     standing to make. "Committed spend" is renamed: it sums live and
     ended phases, which is money already paid, while the old label
     claimed a forward obligation the brand has not taken on. */
  const stats: { label: string; value: string; sub: string }[] = [
    {
      label: "Sales to date", value: fmtUSD(revenue),
      sub: campaigns.length === 1 ? "All phases" : `Across ${campaigns.length} campaigns`,
    },
    {
      label: "Paid so far", value: fmtUSD(spend),
      sub: `${funded.length} phase${funded.length === 1 ? "" : "s"}`,
    },
  ];


  return (
    <div className="space-y-6">

      {/* THE GUARANTEE BAND.

          HeyMoon sells exactly one thing, a sales figure it will pay
          the difference on, and that figure was nowhere on this page as
          the thing the page is about. So every card had quietly
          nominated itself, and the loudest were the invented ones.

          What stood here: a greeting at 24px, a date, a live pill, a
          date filter that windowed nothing, and four tiles. The
          greeting is one line now, the filter is gone, and the tiles
          that survived are below the staircase where they belong. This
          band is the whole subject of the dashboard, said once, in the
          brand's own numbers, at the top. */}
      <h2 className="text-greet font-semibold text-ink sm:text-section">
        {account ? `Welcome back, ${account.firstName}` : "Welcome back"}
      </h2>

      {/* A · Catch me up: what changed since the last visit, each line with its one action (CatchUp.tsx). */}
      <CatchUp />

      {/* One row, three cards. The two totals used to sit below the
          staircase, which put the money the brand has made two screens
          away from the money it is promised. They are the same
          subject: the band is the phase running now, and the pair
          beside it is what every phase before it has already added up
          to. On a phone they fall under the band side by side; from lg
          the band takes two thirds and they stack in the last third,
          which is exactly its height. */}
      <div className="grid gap-3 lg:grid-cols-3">
      {live && live.revTarget !== null ? (
        <section className="g-header flex flex-col justify-center rounded-tile p-6 sm:p-7 lg:col-span-2">
          {/* Both ranks, in order. A campaign holds phases, and this
              line is the only place on the page where the one you are
              looking at is named inside the one it belongs to. */}
          {/* The phase, the number and what it is against. The refund rule and the pace are one press away, not
              printed here (Mostafa, 19 Oct: "less words, more clear"). */}
          <div className="flex items-center gap-3">
            <p className="text-eyebrow font-semibold uppercase tracking-[0.12em] text-white/70">
              {phaseTitle(live.phaseNo)} · {live.guaranteedRoas}x guaranteed
            </p>
            <button
              type="button"
              onClick={() => open(live.id)}
              className="ms-auto inline-flex items-center gap-1 text-meta font-semibold text-white/80 transition hover:text-white"
            >
              View <ArrowRight size={12} weight="bold" aria-hidden className="rtl:rotate-180" />
            </button>
          </div>
          <p className="num mt-3 text-display font-semibold text-white sm:text-hero">
            {fmtUSD(live.rev)}
          </p>
          <p className="mt-2 text-body text-white/75">of {fmtUSD(live.revTarget)} guaranteed</p>
          <AskChip q="Will it land?" say={paceSentence(live, ads)} tone="onDark" className="mt-4 self-start" />
          {/* The ruler the product already owns, rather than a fifth
              hand-rolled bar. It carries the 80% notch, which is the
              whole mechanic and was drawn as a purple hairline on a
              purple fill, which is to say not drawn at all. */}
          <RevenueRuler
            pct={livePct ?? 0}
            className="mt-8"
            trackClass="bg-white/20"
            srLabel={`${phaseTitle(live.phaseNo)} sales against its guarantee.`}
          />
        </section>
      ) : (
        <section className="rounded-tile border border-hairline bg-white p-6 shadow-card lg:col-span-2">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.12em] text-ink-faint">No phase running</p>
          <p className="mt-2 text-body text-ink-soft">
            {ready ? `${phaseTitle(ready.phaseNo).split(" · ")[0]} is ready to start.` : "Start a phase and its guarantee shows here."}
          </p>
        </section>
      )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {stats.map((st) => (
            <Surface key={st.label} className="flex flex-col justify-center rounded-tile p-5">
              <p className="text-meta font-semibold text-main">{st.label}</p>
              <p className="num mt-2 text-display font-semibold text-ink">{st.value}</p>
              <p className="mt-1.5 text-meta text-ink-60">{st.sub}</p>
            </Surface>
          ))}
        </div>
      </div>

      {/* The ladder itself — the active campaign's, in phase order */}
      <PhaseLadder phases={phases} onOpen={open} />

      {/* Three things stood here and all three were invented.

          A twelve-month series hard-coded in its own file, labelled
          with the brand's own name, whose September read $18,500
          against a headline of $17,800 two hundred pixels above it,
          and whose October, November and December carried sales for
          months that have not happened yet. Beside it "How you
          compare", judging the brand against 4.1x, 84% and $3,200
          "category averages" that were three constants in an array and
          a peer cohort HeyMoon does not have. Above them, an average
          of a $1,000 warm-up and a $3,000 scale phase, which is a mean
          of two numbers chosen to be unlike each other.

          Nothing replaces them, because nothing was under them. The
          only comparison HeyMoon has standing to make is the brand
          against its own guarantee, and the band at the top of this
          page and the staircase below it are both that comparison. */}
    </div>
  );
}
