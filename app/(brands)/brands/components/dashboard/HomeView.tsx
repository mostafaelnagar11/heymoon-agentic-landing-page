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

import { useEffect, useState } from "react";
import { ArrowRight, Check, Images, LockSimple, TrendUp, Wallet } from "@phosphor-icons/react";
import {
  fmtUSD, phasePct, phaseTitle, revenueSeries, UNLOCK_AT, type Phase,
} from "../../lib/mock/campaigns";
import { adOfCampaign,
  campaignLabel, openPhase, useAccount, useActiveCampaign, useActivity, useAds, useCampaignPhases, useCampaigns,
  useLivePhase, useReadyPhase, type Campaign,
} from "../../lib/store";
import { useGo } from "../../lib/surface";
import { AskChip } from "./HeyMoon";
import { CatchUp, isReturning, lastVisit } from "./CatchUp";
import { paceSentence } from "../../lib/agent/dashboard";
import { leadMoves } from "../../lib/agent/moves";

/* ------------------------------------------------------------------ */
/* Ladder arithmetic                                                   */
/* ------------------------------------------------------------------ */

const isFunded = (p: Phase) => p.status === "live" || p.status === "ended" || p.status === "queued";
const sumBy = (rows: Phase[], pick: (p: Phase) => number) => rows.reduce((n, p) => n + pick(p), 0);
const nameOf = (p: Phase) => phaseTitle(p.phaseNo).split(" · ")[1] ?? phaseTitle(p.phaseNo);
const x = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}×`;

/* ------------------------------------------------------------------ */
/* The phase running now: a ring against its guarantee                */
/*                                                                     */
/* The ring carries the 80% notch, which is the whole mechanic: the    */
/* next phase opens there. Grey ahead of the fill, a white cut once    */
/* the fill has crossed it.                                            */
/* ------------------------------------------------------------------ */

function GuaranteeRing({ pct }: { pct: number }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setDrawn(true)); return () => cancelAnimationFrame(id); }, []);
  const R = 70, C = 84;
  const fill = Math.min(pct, 100) / 100;
  const a = (UNLOCK_AT * 360 - 90) * (Math.PI / 180);
  const crossed = pct >= UNLOCK_AT * 100;
  return (
    <svg viewBox="0 0 168 168" className="h-[148px] w-[148px] shrink-0 sm:h-[168px] sm:w-[168px]" role="img" aria-label={`${Math.round(pct)}% of the guarantee`}>
      <defs>
        <linearGradient id="hm-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6848D1" />
          <stop offset=".6" stopColor="#A65FED" />
          <stop offset="1" stopColor="#F4A8D8" />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r={R} fill="none" stroke="#F1EEFB" strokeWidth="14" />
      <circle
        cx={C} cy={C} r={R} fill="none" stroke="url(#hm-ring)" strokeWidth="14" strokeLinecap="round"
        pathLength={1} strokeDasharray={`${drawn ? fill : 0} 1`} transform={`rotate(-90 ${C} ${C})`}
        className="transition-[stroke-dasharray] duration-[1100ms] ease-[cubic-bezier(.22,.8,.2,1)] motion-reduce:transition-none"
      />
      <line
        x1={C + (R - 10) * Math.cos(a)} y1={C + (R - 10) * Math.sin(a)} x2={C + (R + 10) * Math.cos(a)} y2={C + (R + 10) * Math.sin(a)}
        stroke={crossed ? "#fff" : "#C9C6D6"} strokeWidth="2.5" strokeLinecap="round"
      />
      <text x={C} y={C - 2} textAnchor="middle" className="fill-ink text-[30px] font-bold tabular-nums" style={{ letterSpacing: "-0.03em" }}>
        {Math.round(pct)}%
      </text>
      <text x={C} y={C + 20} textAnchor="middle" className="fill-ink-faint text-[12.5px]">of guarantee</text>
    </svg>
  );
}

/** Exported for the campaign overview, which opens on the same card (12 Nov); there it has no "View", being the view. */
export function LivePhaseCard({ live, onOpen }: { live: Phase; onOpen?: () => void }) {
  const ads = useAds();
  const activity = useActivity();
  const pct = phasePct(live) ?? 0;
  const { onPace, withMoves } = leadMoves({ phase: live, ads, activity });
  return (
    <section className="glass relative flex flex-wrap items-center gap-6 p-6 sm:p-7">
      <GuaranteeRing pct={pct} />
      <div className="min-w-[250px] flex-1">
        <div className="flex items-start gap-3">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-orchid">
            {phaseTitle(live.phaseNo)} · {live.guaranteedRoas}× guaranteed
          </p>
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className="ms-auto inline-flex shrink-0 items-center gap-1 text-meta font-semibold text-ink-60 transition hover:text-brand"
            >
              View <ArrowRight size={12} weight="bold" aria-hidden className="rtl:rotate-180" />
            </button>
          )}
        </div>
        <p className="num mt-2.5 text-[44px] font-bold leading-none tracking-[-0.035em] text-ink">{fmtUSD(live.rev)}</p>
        <p className="mt-2 text-body text-ink-60"><bdi>
          of {fmtUSD(live.revTarget ?? live.budget * live.guaranteedRoas)} guaranteed
          {live.dayOfPhase && live.plannedDays ? ` · day ${live.dayOfPhase} of ${live.plannedDays}` : ""}
        </bdi></p>
        <AskChip q="Will it land?" say={paceSentence(live, ads)} className="mt-3.5" />
        <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 border-t border-brand/[0.08] pt-4">
          <div>
            <p className="text-meta text-ink-faint">On pace for</p>
            <p className="num mt-0.5 text-[18px] font-semibold text-ink">{fmtUSD(onPace)}</p>
          </div>
          {withMoves > onPace && (
            <div>
              <p className="text-meta text-ink-faint">With the moves</p>
              <p className="num grad-text mt-0.5 text-[18px] font-semibold">{fmtUSD(withMoves)}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Three tiles: the money, the drafts, the ladder paid for             */
/* ------------------------------------------------------------------ */

/** The live phase's own days, drawn small, and dashed on to its last day at the current pace. Its series, not an
    account history: the caption says which. */
function Spark({ phase, onPace }: { phase: Phase; onPace: number }) {
  const pts = revenueSeries(phase);
  if (pts.length < 2) return null;
  const W = 360, H = 76;
  const days = Math.max(phase.plannedDays ?? pts.length, pts.length);
  const top = Math.max(phase.revTarget ?? 0, pts[pts.length - 1].rev, onPace) * 1.05 || 1;
  const xy = pts.map((p) => [((p.day - 1) / Math.max(1, days - 1)) * W, H - 3 - (p.rev / top) * (H - 8)] as const);
  const line = xy.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)} ${b.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];
  return (
    <figure className="m-0 mt-auto pt-3">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[76px] w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="hm-spark" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#7A47CE" stopOpacity=".28" />
            <stop offset="1" stopColor="#7A47CE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${last[0]} ${H} L0 ${H} Z`} fill="url(#hm-spark)" />
        <path d={line} fill="none" stroke="#7A47CE" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {days > pts.length && (
          <path
            d={`M${last[0]} ${last[1]} L${W} ${H - 3 - (onPace / top) * (H - 8)}`}
            fill="none" stroke="#A65FED" strokeWidth="1.8" strokeDasharray="4 5" strokeLinecap="round" vectorEffect="non-scaling-stroke"
          />
        )}
        <circle cx={last[0]} cy={last[1]} r="3.5" fill="#fff" stroke="#7A47CE" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-[11.5px] text-ink-faint">
        <bdi>{phaseTitle(phase.phaseNo)}, by day</bdi>
        {days > pts.length && <bdi>On pace for {fmtUSD(onPace)} by day {days}</bdi>}
      </figcaption>
    </figure>
  );
}

export function TileHead({ icon: I, label }: { icon: typeof TrendUp; label: string }) {
  return (
    <p className="flex items-center gap-2 text-[13px] font-medium text-ink-60">
      <I size={15} aria-hidden />
      {label}
    </p>
  );
}

function Ladder({ phases }: { phases: Phase[] }) {
  return (
    <div className="mt-auto flex gap-1.5 pt-5">
      {phases.map((p) => {
        const pct = Math.min(phasePct(p) ?? 0, 100);
        const bar =
          p.status === "ended" ? { background: "#25A333" }
          : p.status === "live" ? { background: `linear-gradient(90deg,#6848D1 ${pct}%,#F1EEFB ${pct}%)` }
          : p.status === "queued" ? { background: "#B9A8EE" }
          : { background: "#F1EEFB" };
        const note =
          p.status === "ended" ? x(p.rev / p.budget)
          : p.status === "live" ? `${nameOf(p)} ${Math.round(pct)}%`
          : p.status === "ready" ? `${nameOf(p)} · ready`
          : p.status === "queued" ? `${nameOf(p)} · next`
          : nameOf(p);
        return (
          <div key={p.id} className="min-w-0" style={{ flex: p.phaseNo }}>
            <div className="h-2 rounded-pill" style={bar} />
            <p className="mt-1.5 truncate text-[11.5px] text-ink-faint"><bdi>{note}</bdi></p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The ladder, one card a rung                                         */
/*                                                                     */
/* A rung that has not been paid for has no sales of its own, so it    */
/* states its guarantee instead of a $0 that reads like a failure.     */
/* Locked is not openable: it has nothing to look at, and no start     */
/* until its predecessor crosses the 80% line.                         */
/* ------------------------------------------------------------------ */

export function PhaseCard({ p, onOpen }: { p: Phase; onOpen: () => void }) {
  const target = p.revTarget ?? p.budget * p.guaranteedRoas;
  const status =
    p.status === "ended" ? `Done${p.start && p.end ? ` · ${p.start.replace(/ \d{4}$/, "")} – ${p.end.replace(/ \d{4}$/, "")}` : ""}`
    : p.status === "live" ? `Running${p.dayOfPhase && p.plannedDays ? ` · day ${p.dayOfPhase} of ${p.plannedDays}` : ""}`
    : p.status === "ready" ? `Ready · ${fmtUSD(p.budget)} at ${p.guaranteedRoas}×`
    : p.status === "queued" ? "Paid · starts next"
    : "Locked";
  const badge =
    p.status === "ended" ? <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-good/10 text-good"><Check size={16} weight="bold" aria-hidden /></span>
    : p.status === "live" ? <span className="grad-tile grid h-[34px] w-[34px] place-items-center rounded-[11px] text-[14px] font-bold">{p.phaseNo}</span>
    : p.status === "locked" ? <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-haze text-ink-faint"><LockSimple size={14} weight="fill" aria-hidden /></span>
    : <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-haze text-[14px] font-bold text-brand">{p.phaseNo}</span>;
  const figure =
    p.status === "ended" ? { v: fmtUSD(p.rev), s: `${x(p.rev / p.budget)} of ${x(p.guaranteedRoas)}` }
    : p.status === "live" ? { v: fmtUSD(p.rev), s: `of ${fmtUSD(target)}` }
    : { v: fmtUSD(target), s: "guaranteed" };
  const inner = (
    <>
      {badge}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold text-ink">{nameOf(p)}</span>
        <span className="block truncate text-meta text-ink-faint"><bdi>{status}</bdi></span>
      </span>
      <span className="shrink-0 text-end">
        <span className={`num block text-[17px] font-bold tracking-[-0.02em] ${p.status === "locked" ? "text-ink-faint" : "text-ink"}`}>{figure.v}</span>
        <span className="block text-meta text-ink-faint"><bdi>{figure.s}</bdi></span>
      </span>
    </>
  );
  const skin = `glass flex items-center gap-3.5 px-5 py-4 text-start ${p.status === "ready" ? "glass-edge" : ""}`;
  if (p.status === "locked") return <div className={`${skin} opacity-80`}>{inner}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${phaseTitle(p.phaseNo)}`}
      className={`${skin} transition hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0`}
    >
      {inner}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

export function HomeView() {
  const go = useGo();
  const account = useAccount();
  /* "Welcome back" only to someone who was here before, not to a brand whose first sale just landed. Known after
     mount (the last visit is in this browser), so the line holds its height until then. */
  const [back, setBack] = useState<boolean | null>(null);
  useEffect(() => { setBack(isReturning(lastVisit(), Date.now())); }, []);
  const campaigns = useCampaigns();
  const camp = useActiveCampaign();
  const phases = useCampaignPhases();
  const live = useLivePhase();
  const ready = useReadyPhase();
  const ads = useAds();
  const activity = useActivity();

  /* Home is the ACCOUNT's page, so the money totals every ladder in it. The phase, the drafts and the ladder
     below are the active campaign's and say so. */
  const allPhases = campaigns.flatMap((c: Campaign) => c.phases);
  const funded = allPhases.filter(isFunded);
  const revenue = sumBy(funded, (p) => p.rev);
  const spend = sumBy(funded, (p) => p.budget);
  const waiting = camp ? ads.filter((a) => a.state === "waiting" && adOfCampaign(camp, a)) : [];
  const onBrief = waiting.filter((a) => a.compliance.verdict !== "hold").length;

  const open = (id: string) => {
    /* Opening a rung moves the drill AND the surface: `openPhase` sets
       which phase is open, and the phase lives in the Campaign view. */
    openPhase(id);
    go("campaign");
  };

  /* Where the active campaign is, in one line under the greeting. */
  const where = [
    camp ? campaignLabel(camp) : null,
    live ? `${phaseTitle(live.phaseNo).split(" · ")[0]} of ${phases.length}` : ready ? `${phaseTitle(ready.phaseNo).split(" · ")[0]} is ready` : null,
    live?.dayOfPhase && live.plannedDays ? `day ${live.dayOfPhase} of ${live.plannedDays}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <header className="pb-1 pt-1">
        <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[30px]">
          {back === null ? " " : `${back ? "Welcome back" : "Welcome"}${account?.firstName ? `, ${account.firstName}` : ""}`}
        </h2>
        {where && <p className="mt-1 text-[15px] text-ink-60">{where}</p>}
      </header>

      {/* The phase running now beside what changed since the last visit, each line with its one action. Every
          grid on this page is sized by the column rather than the window, because the assistant can take 400px of
          it. */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,470px),1fr))]">
        {live && live.revTarget !== null ? (
          <LivePhaseCard live={live} onOpen={() => open(live.id)} />
        ) : (
          <section className="glass p-7">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-orchid">No phase running</p>
            <p className="mt-2 text-body text-ink-60">
              {ready ? `${phaseTitle(ready.phaseNo).split(" · ")[0]} is ready to start.` : "Start a phase and its guarantee shows here."}
            </p>
          </section>
        )}
        <CatchUp />
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
        <section className="glass flex min-h-[188px] flex-col p-5 sm:p-6">
          <TileHead icon={TrendUp} label="Sales to date" />
          <p className="mt-2.5 flex items-baseline gap-2">
            <span className="num text-[30px] font-bold leading-none tracking-[-0.03em] text-ink">{fmtUSD(revenue)}</span>
            <span className="text-meta text-ink-faint"><bdi>{campaigns.length === 1 ? "all phases" : `across ${campaigns.length} campaigns`}</bdi></span>
          </p>
          {live && <Spark phase={live} onPace={leadMoves({ phase: live, ads, activity }).onPace} />}
        </section>

        <section className="glass flex min-h-[188px] flex-col p-5 sm:p-6">
          <div className="flex items-center">
            <TileHead icon={Images} label="Drafts waiting" />
            {waiting.length > 0 && (
              <button type="button" onClick={() => go("ads")} className="ms-auto inline-flex items-center gap-1 text-meta font-semibold text-ink-60 transition hover:text-brand">
                Review <ArrowRight size={12} weight="bold" aria-hidden className="rtl:rotate-180" />
              </button>
            )}
          </div>
          <p className="mt-2.5 flex items-baseline gap-2">
            <span className="num text-[30px] font-bold leading-none tracking-[-0.03em] text-ink">{waiting.length}</span>
            <span className="text-meta text-ink-faint"><bdi>{waiting.length ? `${onBrief} on brief` : "nothing waiting on you"}</bdi></span>
          </p>
          {waiting.length > 0 && (
            <button type="button" onClick={() => go("ads")} className="mt-auto flex gap-2 overflow-hidden pt-4" aria-label="Review the drafts">
              {waiting.slice(0, 4).map((a) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={a.id} src={a.img} alt="" className="h-[84px] w-[62px] rounded-[12px] object-cover shadow-[0_6px_14px_-8px_rgba(25,18,52,0.45)] ring-1 ring-inset ring-white/40" />
              ))}
              {waiting.length > 4 && (
                <span className="num grid h-[84px] w-[62px] place-items-center rounded-[12px] bg-haze text-body font-semibold text-brand">+{waiting.length - 4}</span>
              )}
            </button>
          )}
        </section>

        <section className="glass flex min-h-[188px] flex-col p-5 sm:p-6">
          <TileHead icon={Wallet} label="Paid so far" />
          <p className="mt-2.5 flex items-baseline gap-2">
            <span className="num text-[30px] font-bold leading-none tracking-[-0.03em] text-ink">{fmtUSD(spend)}</span>
            <span className="text-meta text-ink-faint"><bdi>{funded.length} phase{funded.length === 1 ? "" : "s"}</bdi></span>
          </p>
          {phases.length > 0 && <Ladder phases={phases} />}
        </section>
      </div>

      {/* The active campaign's ladder, in phase order. */}
      {phases.length > 0 && (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))]">
          {phases.map((p) => <PhaseCard key={p.id} p={p} onOpen={() => open(p.id)} />)}
        </div>
      )}

      {/* Nothing here is invented: a twelve-month chart, a "how you compare" panel and a ladder average once stood
          on this page with fixture numbers, and they are gone. The only comparison HeyMoon has standing to make
          is the brand against its own guarantee. */}
    </div>
  );
}
