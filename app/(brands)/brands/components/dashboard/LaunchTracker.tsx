"use client";

/* The launch tracker (PRD v0.2, H5).

   From payment to the first sale the dashboard shows this instead of results: eight stages, each with who owns it
   and when it is expected, read from the launch facts (store.ts, launchStages). The brand's own four steps happen
   in the conversation, so a stage waiting on them links back there; Moontech's stages show progress, never creator
   names. The first sale switches the dashboard to results.

   The same list, compact, closes the conversation once the brief is approved. */

import { useEffect } from "react";
import Link from "next/link";
import { track } from "../../lib/track";
import { ArrowRight, Check, CircleNotch } from "@phosphor-icons/react";
import {
  advanceLaunch, launchStages, nextBrandStep, recordFirstSale, setDashboardView, useActiveCampaign, type Campaign,
} from "../../lib/store";
import { LAUNCH_BY_DAYS, PHASE_START_DAYS, PROFILE_BY_DAYS, plusDays, type StageKey, type StageOwner } from "../../lib/agent/connect";
import { dayIn, useT } from "../../lib/i18n";

const OWNER_TONE: Record<StageOwner, string> = {
  You: "bg-haze text-brand",
  Moontech: "bg-amber-soft text-amber",
  Creators: "bg-good/[0.09] text-good-deep",
};

const NOTE: Partial<Record<StageKey, string>> = {
  profile: "lt.note.profile",
  matching: "lt.note.matching",
  launched: "lt.note.launched",
  phase: "lt.note.phase",
  sale: "lt.note.sale",
};

export function LaunchTracker({ compact = false, campaign }: { compact?: boolean; campaign?: Campaign | null }) {
  const { t, tf, locale } = useT();
  const day = (ts: number) => dayIn(ts, locale);
  const active = useActiveCampaign();
  const camp = campaign ?? active;
  const stageNow = camp ? launchStages(camp).find((r) => r.doneAt === null)?.stage.key ?? "done" : null;
  useEffect(() => {
    if (camp?.launch && !compact) track("hm_tracker_viewed", { brand: camp.url, campaign: camp.id, stage: stageNow });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camp?.id]);
  if (!camp?.launch) return null;
  const l = camp.launch;
  const rows = launchStages(camp);
  const currentAt = rows.findIndex((r) => r.doneAt === null);
  const brandStep = nextBrandStep(camp);
  const launchBy = plusDays(l.paidAt, LAUNCH_BY_DAYS);
  const team = !!l.legacyAt;
  const doneCount = rows.filter((r) => r.doneAt !== null).length;

  /* PRD v0.2 v3: launched (wave 1 sent, day 0), then the phase starts (day 6), then the first sale. */
  /* After the chat's steps, the business profile in Settings (21 Oct); Moontech's matching waits on it. */
  const profileDue = !brandStep && !l.profileAt;
  const heading = brandStep ? t(`lt.next.${brandStep}`) : profileDue ? t("lt.next.profile") : !l.launchedAt ? t("lt.preparing") : !l.phaseStartedAt ? t("lt.launched") : t("lt.phaseOn");
  const sub =
    profileDue ? tf("lt.profileBy", { date: day(plusDays(l.paidAt, PROFILE_BY_DAYS)), launch: day(launchBy) })
    : !l.launchedAt ? tf("lt.launchBy", { date: day(launchBy) })
    : !l.phaseStartedAt ? tf("lt.launchedOn", { date: day(l.launchedAt), phase: day(plusDays(l.launchedAt, PHASE_START_DAYS)) })
    : tf("lt.phaseSince", { date: day(l.phaseStartedAt) });

  return (
    <div className={compact ? "" : "space-y-5"}>
      {!compact && (
        <header className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-[22rem]">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-orchid">{t("lt.title")}</p>
            <h2 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[30px]">{heading}</h2>
            <p className="mt-1.5 text-[15px] text-ink-60">
              {sub}
              {!camp.connectedStore && !team ? t("lt.refund") : ""}
            </p>
          </div>
          {brandStep && (
            <Link href="/brands/c" className="btn-pri inline-flex h-[42px] items-center gap-1.5 rounded-pill px-5 text-body font-semibold">
              {t("lt.continue")}
              <ArrowRight size={13} weight="bold" aria-hidden className="rtl:rotate-180" />
            </Link>
          )}
          {profileDue && (
            <button
              type="button"
              onClick={() => setDashboardView("business")}
              className="btn-pri inline-flex h-[42px] items-center gap-1.5 rounded-pill px-5 text-body font-semibold"
            >
              {t("lt.openProfile")}
              <ArrowRight size={13} weight="bold" aria-hidden className="rtl:rotate-180" />
            </button>
          )}
        </header>
      )}

      <div className="glass overflow-hidden">
        {compact && (
          <p className="border-b border-brand/[0.07] px-4 py-2.5 text-eyebrow font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {l.launchedAt ? tf("lt.compactLaunched", { date: day(l.launchedAt) }) : tf("lt.compact", { date: day(launchBy) })}
          </p>
        )}
        <div role="progressbar" aria-label="Launch" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={doneCount} className={`flex items-center gap-1.5 ${compact ? "px-4 pt-3" : "px-5 pt-5 sm:px-6"}`}>
          {rows.map((r, i) => (
            <span
              key={r.stage.key}
              className={`h-2 flex-1 rounded-full ${
                r.doneAt !== null ? "bg-good" : i === currentAt ? "animate-live bg-[linear-gradient(90deg,#6848D1,#A65FED)] motion-reduce:animate-none" : "bg-track"
              }`}
            />
          ))}
          {!compact && <span className="num ms-2 shrink-0 text-meta font-semibold text-ink-60">{doneCount}/{rows.length}</span>}
        </div>
        <ol className={compact ? "divide-y divide-brand/[0.07]" : "mt-2 divide-y divide-brand/[0.07] px-2 pb-2"}>
          {rows.map((r, i) => {
            const done = r.doneAt !== null;
            const now = i === currentAt;
            /* On the team route the team connects the store, sets the code and runs the check with the brand. */
            const withTeam = (team && (r.stage.key === "store" || r.stage.key === "discount" || r.stage.key === "check")) || (r.stage.key === "check" && !!l.checkToTeamAt);
            const owner: StageOwner = withTeam ? "Moontech" : r.stage.owner;
            const status = done
              ? tf("lt.done", { date: day(r.doneAt!) })
              : now ? (owner === "You" ? t("lt.waiting") : t("lt.inProgress"))
              : tf("lt.by", { date: day(r.dueAt) });
            return (
              <li key={r.stage.key} className={`flex items-center gap-3 ${compact ? "px-4 py-2.5" : "rounded-[16px] px-3 py-3 sm:px-4"} ${now ? (compact ? "bg-brand/[0.03]" : "my-1 border-0 bg-white shadow-lift") : ""}`}>
                <span
                  aria-hidden
                  className={`grid shrink-0 place-items-center font-bold ${compact ? "h-6 w-6 rounded-full text-meta" : "h-8 w-8 rounded-[10px] text-[13px]"} ${
                    done ? "bg-good/[0.12] text-good-deep" : now ? "grad-tile" : "bg-haze text-ink-faint"
                  }`}
                >
                  {done ? <Check size={12} weight="bold" /> : now && owner !== "You" ? <CircleNotch size={12} weight="bold" className="animate-spin motion-reduce:animate-none" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-body ${done ? "text-ink-soft" : "font-semibold text-ink"}`}>{t(`lt.stage.${r.stage.key}`)}</span>
                  {now && NOTE[r.stage.key] && <span className="block text-meta text-ink-faint">{t(NOTE[r.stage.key]!)}</span>}
                </span>
                <span className={`hidden shrink-0 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] sm:inline ${OWNER_TONE[owner]}`}>{t(`lt.owner.${owner}`)}</span>
                <span className={`w-[104px] shrink-0 text-end text-meta ${now ? "font-semibold text-ink" : "text-ink-faint"}`}>{status}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Moontech's stages are NASA and launchCampaign in the product. The prototype steps them by hand, and says so. */}
      {!compact && !brandStep && !profileDue && !l.firstSaleAt && (
        <div className="flex flex-wrap gap-2">
          {!l.phaseStartedAt ? (
            <button
              type="button"
              onClick={() => advanceLaunch(camp.id, Date.now())}
              className="rounded-pill border border-dashed border-brand/40 bg-white/60 px-3.5 py-1.5 text-meta font-semibold text-brand hover:bg-white"
            >
              {t("lt.demoNext")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => recordFirstSale(camp.id, 242, Date.now())}
              className="rounded-pill border border-dashed border-brand/40 bg-white/60 px-3.5 py-1.5 text-meta font-semibold text-brand hover:bg-white"
            >
              {t("lt.demoSale")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
