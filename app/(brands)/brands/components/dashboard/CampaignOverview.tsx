"use client";

/* The campaign page, redesigned (Mostafa picked Direction 1, "Command center", with the creator table from
   Direction 3, 20 Oct).

   Top to bottom, the questions a sales-first brand brings to a campaign:
     CampaignHeader  which campaign, for which store, what is running, where, since when
     PhaseStepper    the three phases as one row: what each sold against what it guarantees, and the next to start
     (the chart with its two endings beside the moves that add the most, in CampaignView)
     TopSellers      which ads are selling, next to WaitingOnYou: the drafts waiting, and the way through them
   and on the Creators tab, WhoSelling: every live ad ranked by sales, with sales per 1,000 views, and the agents'
   read on which to back and which to replace.

   Every figure is the store's own (the phases, the ads), and every press goes through HeyMoon's `run`. */

import { Check, Images, Lightning, LockSimple, Sparkle, TrendUp } from "@phosphor-icons/react";
import { TileHead } from "./HomeView";
import { fmtUSD, pace, phaseTitle, UNLOCK_AT, withVat, type Phase } from "../../lib/mock/campaigns";
import type { AdRecord } from "../../lib/agent/types";
import { getRead } from "../../lib/agent/registry";
import { marketName } from "../../lib/agent/tools";
import { leadMoves } from "../../lib/agent/moves";
import {
  campaignLabel, openPhase, useActivity, useActivePlan, useAds, type Campaign,
} from "../../lib/store";
import { useGo } from "../../lib/surface";
import { useHeyMoon } from "./HeyMoon";

const short = (p: Phase) => phaseTitle(p.phaseNo).split(" · ")[0];
const stage = (p: Phase) => phaseTitle(p.phaseNo).split(" · ")[1] ?? "";
const guaranteed = (p: Phase) => Math.round(p.budget * p.guaranteedRoas);
const owns = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function CampaignHeader({ campaign }: { campaign: Campaign }) {
  const plan = useActivePlan();
  const read = campaign.readId ? getRead(campaign.readId) : null;
  const logo = read?.identity?.logo;
  const live = campaign.phases.find((p) => p.status === "live");
  const ready = campaign.phases.find((p) => p.status === "ready");
  /* Short names: the chip is a reminder of where, not the read's full list. */
  const SHORT: Record<string, string> = { AE: "UAE", SA: "KSA" };
  const markets = (plan?.markets.value ?? []).map((c) => SHORT[c] ?? marketName(c));
  const since = campaign.phases[0]?.start;

  const status = live
    ? { text: `${short(live)} running · day ${live.dayOfPhase} of ${live.plannedDays}`, skin: "bg-good/10 text-good-deep", dot: true }
    : ready
      ? { text: `${short(ready)} ready to start`, skin: "bg-amber-soft text-amber", dot: false }
      : campaign.paid
        ? { text: "Between phases", skin: "bg-wash text-ink-faint", dot: false }
        : { text: "Not started", skin: "bg-wash text-ink-faint", dot: false };

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-white p-1 shadow-lift">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-body font-semibold text-brand">{campaign.brandName[0]}</span>
        )}
      </span>
      <div className="min-w-0">
        <h2 className="truncate text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink">{campaignLabel(campaign)}</h2>
        <p className="truncate text-meta text-ink-faint">{campaign.brandName} · {campaign.url}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:ms-3">
        <span className={`inline-flex h-7 items-center gap-1.5 rounded-pill px-3 text-[12px] font-semibold ${status.skin}`}>
          {status.dot && <span aria-hidden className="h-1.5 w-1.5 animate-live rounded-full bg-good" />}
          {status.text}
        </span>
        {markets.length > 0 && (
          <span className="glass inline-flex h-7 items-center !rounded-full px-3 text-[12px] text-ink-soft">
            {markets.join(" · ")}
          </span>
        )}
        {since && (
          <span className="glass inline-flex h-7 items-center !rounded-full px-3 text-[12px] text-ink-soft">
            Since {since.replace(/ \d{4}$/, "")}
          </span>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* The phases, as one row                                              */
/* ------------------------------------------------------------------ */

export function PhaseStepper({ phases }: { phases: Phase[] }) {
  const unlock = Math.round(UNLOCK_AT * 100);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {phases.map((p, i) => {
        const prev = phases[i - 1];
        const target = p.revTarget ?? guaranteed(p);
        const pct = target ? Math.round((p.rev / target) * 100) : 0;
        const ran = p.status === "live" || p.status === "ended";
        const skin =
          p.status === "live" ? "ring-2 ring-brand/25"
          : p.status === "locked" ? "opacity-70"
          : "";
        const badge =
          p.status === "ended" ? { t: "Done", c: "bg-good/10 text-good-deep" }
          : p.status === "live" ? { t: "Running", c: "bg-brand/10 text-brand" }
          : p.status === "ready" ? { t: "Ready", c: "bg-amber-soft text-amber" }
          : p.status === "queued" ? { t: "Paid · next", c: "bg-good/10 text-good-deep" }
          : { t: "Locked", c: "bg-wash text-ink-faint" };
        const circle =
          p.status === "ended" ? "bg-good/15 text-good-deep"
          : p.status === "live" ? "grad-tile"
          : "bg-lilac text-main";
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => openPhase(p.id)}
            onKeyDown={(e) => { if (e.key === "Enter") openPhase(p.id); }}
            className={`glass cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0 ${skin}`}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className={`grid h-8 w-8 place-items-center rounded-[10px] text-[13px] font-bold ${circle}`}>
                {p.status === "ended" ? <Check size={11} weight="bold" /> : p.phaseNo}
              </span>
              <span className="text-body font-semibold text-ink">{stage(p)}</span>
              <span className={`ms-auto rounded-pill px-2 py-0.5 text-meta font-semibold ${badge.c}`}>{badge.t}</span>
            </div>

            <p className="num mt-4 text-[26px] font-bold tracking-[-0.03em] text-ink">
              {ran ? fmtUSD(p.rev) : fmtUSD(guaranteed(p))}
            </p>
            <p className="text-meta text-ink-faint">
              {ran ? `of ${fmtUSD(target)}` : "guaranteed"} · {fmtUSD(p.budget)} at {p.guaranteedRoas}x
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-pill bg-track">
              <div
                className={`h-full rounded-pill ${p.status === "ended" ? "bg-good" : "bg-[linear-gradient(90deg,#6848D1,#A65FED)]"}`}
                style={{ width: `${ran ? Math.min(100, pct) : 0}%` }}
              />
            </div>

            <div className="mt-3 flex min-h-8 items-center text-meta text-ink-faint">
              {p.status === "ended" && <>{p.start} to {p.end} · {pct}%</>}
              {p.status === "live" && <>Day {p.dayOfPhase} of {p.plannedDays} · {pct}%</>}
              {p.status === "ready" && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openPhase(p.id); }}
                  className="btn-pri inline-flex h-8 items-center gap-1.5 rounded-pill px-3.5 text-meta font-semibold"
                >
                  <Lightning size={12} weight="fill" aria-hidden /> Start · {fmtUSD(withVat(p.budget))}
                </button>
              )}
              {p.status === "queued" && <>Starts when {prev ? short(prev) : "the phase before"} closes</>}
              {p.status === "locked" && (
                <span className="inline-flex items-center gap-1.5">
                  <LockSimple size={11} weight="fill" aria-hidden /> Opens at {unlock}% of {prev ? short(prev) : "the phase before"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Who is selling, and what is waiting                                 */
/* ------------------------------------------------------------------ */

const liveAds = (ads: AdRecord[], phase: Phase) =>
  ads.filter((a) => a.campaignId === phase.id && a.state === "live" && a.performance)
    .sort((a, b) => (b.performance?.revenue.value ?? 0) - (a.performance?.revenue.value ?? 0));

export function TopSellers({ phase }: { phase: Phase }) {
  const ads = useAds();
  const live = liveAds(ads, phase);
  const top = live[0]?.performance?.revenue.value ?? 1;
  const go = useGo();
  return (
    /* The dashboard's tile (12 Nov): the figure first, then the ads behind it. */
    <section className="glass flex min-h-[188px] flex-col p-5 sm:p-6">
      <div className="flex items-center">
        <TileHead icon={TrendUp} label="Top sellers" />
        {live.length > 0 && (
          <button type="button" onClick={() => go("creators")} className="ms-auto text-meta font-semibold text-ink-60 transition hover:text-brand">
            All {live.length}
          </button>
        )}
      </div>
      <p className="mt-2.5 flex items-baseline gap-2">
        <span className="num text-[30px] font-bold leading-none tracking-[-0.03em] text-ink">{fmtUSD(phase.rev)}</span>
        <span className="text-meta text-ink-faint"><bdi>{live.length ? `from ${live.length} live ad${live.length === 1 ? "" : "s"}` : "no ad live yet"}</bdi></span>
      </p>
      {!live.length && <p className="mt-auto pt-4 text-meta text-ink-soft">Sales show here, by ad, as soon as an ad you approved goes live.</p>}
      <ul className="mt-3">
        {live.slice(0, 5).map((a) => {
          const rev = a.performance?.revenue.value ?? 0;
          return (
            <li key={a.id} className="flex items-center gap-3 border-t border-hairline py-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.img} alt="" className="h-12 w-10 shrink-0 rounded-[10px] object-cover object-top" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold text-ink">{a.creatorName}</p>
                <p className="truncate text-meta text-ink-faint">{a.format} · {a.product}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-track">
                  <div className="h-full rounded-pill bg-[linear-gradient(90deg,#6848D1,#A65FED)]" style={{ width: `${(rev / top) * 100}%` }} />
                </div>
              </div>
              <span className="num w-16 shrink-0 text-end text-body font-semibold text-ink">{fmtUSD(rev)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function WaitingOnYou({ phase }: { phase: Phase }) {
  const ads = useAds();
  const go = useGo();
  const { run } = useHeyMoon();
  const waiting = ads.filter((a) => a.campaignId === phase.id && a.state === "waiting");
  const cleared = waiting.filter((a) => a.compliance.verdict !== "hold");
  const held = waiting.length - cleared.length;
  return (
    <section className="glass flex min-h-[188px] flex-col p-5 sm:p-6">
      <div className="flex items-center">
        <TileHead icon={Images} label="Waiting on you" />
      </div>
      <p className="mt-2.5 flex items-baseline gap-2">
        <span className="num text-[30px] font-bold leading-none tracking-[-0.03em] text-ink">{waiting.length}</span>
        <span className="text-meta text-ink-faint"><bdi>{waiting.length ? `${cleared.length} on brief${held ? ` · ${held} to re-cut` : ""}` : "nothing waiting on you"}</bdi></span>
      </p>
      {waiting.length === 0 ? (
        <p className="mt-auto pt-4 text-meta text-ink-soft">New drafts land here as creators finish them.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {waiting.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => go("ads")}
                aria-label={`${d.creatorName}, ${d.product}`}
                className="relative overflow-hidden rounded-[12px] shadow-[0_6px_14px_-8px_rgba(25,18,52,0.45)] ring-1 ring-inset ring-white/40 transition hover:-translate-y-0.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.img} alt="" className="h-[84px] w-[62px] object-cover object-top" />
                <span aria-hidden className={`absolute bottom-1.5 start-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${d.compliance.verdict === "hold" ? "bg-danger" : "bg-good"}`} />
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => go("ads")} className="btn-pri inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-meta font-semibold">
              <Sparkle size={12} weight="fill" aria-hidden /> Review with HeyMoon
            </button>
            {cleared.length > 0 && (
              <button
                type="button"
                onClick={() => run({ label: "", do: "approve-cleared", adIds: cleared.map((a) => a.id) })}
                className="inline-flex h-9 items-center rounded-pill px-3 text-meta font-semibold text-ink-60 transition hover:bg-black/[0.04] hover:text-ink"
              >
                Approve the {cleared.length} on brief
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Creators tab: who is selling                                        */
/* ------------------------------------------------------------------ */

export function WhoSelling({ phase }: { phase: Phase }) {
  const ads = useAds();
  const activity = useActivity();
  const { run } = useHeyMoon();
  const live = liveAds(ads, phase);
  if (!live.length) return null;

  const perK = (a: AdRecord) => ((a.performance?.revenue.value ?? 0) / Math.max(1, a.performance?.views.value ?? 1)) * 1000;
  const avg = live.reduce((n, a) => n + perK(a), 0) / live.length;
  /* The agents' read: back the best seller with the budget move B offers, and flag what sells far under the phase. */
  const boost = leadMoves({ phase, ads, activity }).moves.find((m) => m.action.do === "rebalance");
  const p = pace(phase);

  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-body font-semibold text-ink">Who&apos;s selling</h3>
        <span className="ms-auto text-meta text-ink-faint">
          Ranked by sales · {short(phase)}{p ? ` · ${fmtUSD(Math.round(p.perDay))} a day` : ""}
        </span>
      </div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-meta">
          <thead>
            <tr className="text-start text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              <th className="py-2 text-start font-semibold">Creator</th>
              <th className="py-2 text-start font-semibold">Format</th>
              <th className="py-2 text-end font-semibold">Views</th>
              <th className="py-2 text-end font-semibold">Sales</th>
              <th className="py-2 text-end font-semibold">Per 1K views</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {live.map((a) => {
              const k = perK(a);
              const isTop = boost && boost.action.do === "rebalance" && boost.action.to === a.id;
              const weak = k < avg * 0.6;
              return (
                <tr key={a.id} className="border-t border-hairline">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.img} alt="" className="h-11 w-9 shrink-0 rounded-[9px] object-cover object-top" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{a.creatorName}</span>
                        <span className="block truncate text-meta text-ink-faint">{a.product}</span>
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 text-ink-soft">{a.format}</td>
                  <td className="num py-2.5 text-end text-ink-soft">{(a.performance?.views.value ?? 0).toLocaleString("en-US")}</td>
                  <td className="num py-2.5 text-end font-semibold text-ink">{fmtUSD(a.performance?.revenue.value ?? 0)}</td>
                  <td className="num py-2.5 text-end text-ink-soft">${k.toFixed(1)}</td>
                  <td className="py-2.5 text-end">
                    {isTop && boost && (
                      <button type="button" onClick={() => run(boost.action)}
                        className="inline-flex items-center gap-1 rounded-pill bg-lilac px-2.5 py-1 text-meta font-semibold text-main transition hover:bg-main-10">
                        <Sparkle size={10} weight="fill" aria-hidden /> Back it · {boost.action.label.replace(/^Move /, "")}
                      </button>
                    )}
                    {weak && (
                      <button type="button"
                        onClick={() => run({
                          label: "", do: "why", q: `Why replace ${owns(a.creatorName)} ${a.format.toLowerCase()}?`,
                          say: `It sells $${k.toFixed(1)} per 1,000 views, against $${avg.toFixed(1)} across this phase. I'd leave it running and brief a matched creator in its place for the next phase.`,
                        })}
                        className="inline-flex items-center gap-1 rounded-pill bg-danger/[0.08] px-2.5 py-1 text-meta font-semibold text-danger transition hover:bg-danger/[0.12]">
                        <Sparkle size={10} weight="fill" aria-hidden /> Replace next phase
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
