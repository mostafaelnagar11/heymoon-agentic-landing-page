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
  advanceLaunch, launchStages, nextBrandStep, recordFirstSale, useActiveCampaign, type Campaign,
} from "../../lib/store";
import { LIVE_BY_DAYS, plusDays, type StageKey, type StageOwner } from "../../lib/agent/connect";
import { dayIn, useT } from "../../lib/i18n";

const OWNER_TONE: Record<StageOwner, string> = {
  You: "text-brand",
  Moontech: "text-amber",
  Creators: "text-good-deep",
};

const NOTE: Partial<Record<StageKey, string>> = {
  matching: "lt.note.matching",
  invited: "lt.note.invited",
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
  const liveBy = plusDays(l.paidAt, LIVE_BY_DAYS);
  const team = !!l.legacyAt;
  const doneCount = rows.filter((r) => r.doneAt !== null).length;

  const heading = brandStep ? t(`lt.next.${brandStep}`) : !l.liveAt ? t("lt.preparing") : t("lt.live");

  return (
    <div className={compact ? "" : "space-y-5"}>
      {!compact && (
        <header className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-[22rem]">
            <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-brand-500">{t("lt.title")}</p>
            <h2 className="mt-1.5 text-greet font-semibold text-ink sm:text-section">{heading}</h2>
            <p className="mt-1 text-body text-ink-soft">
              {tf("lt.liveBy", { date: day(liveBy) })}{!camp.connectedStore && !team ? t("lt.refund") : ""}
            </p>
          </div>
          {brandStep && (
            <Link href="/brands/c" className="inline-flex items-center gap-1.5 text-body font-semibold text-brand hover:underline">
              {t("lt.continue")}
              <ArrowRight size={13} weight="bold" aria-hidden className="rtl:rotate-180" />
            </Link>
          )}
        </header>
      )}

      <div className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
        {compact && (
          <p className="border-b border-hairline px-4 py-2.5 text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {tf("lt.compact", { date: day(liveBy) })}
          </p>
        )}
        <div role="progressbar" aria-label="Launch" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={doneCount} className="flex gap-1 px-4 pt-3">
          {rows.map((r, i) => (
            <span key={r.stage.key} className={`h-1.5 flex-1 rounded-full ${r.doneAt !== null ? "bg-good" : i === currentAt ? "bg-brand/40" : "bg-black/[0.07]"}`} />
          ))}
        </div>
        <ol className="divide-y divide-hairline">
          {rows.map((r, i) => {
            const done = r.doneAt !== null;
            const now = i === currentAt;
            /* On the team route the team sets the code and runs the check with the brand. */
            const withTeam = (team && (r.stage.key === "discount" || r.stage.key === "check")) || (r.stage.key === "check" && !!l.checkToTeamAt);
            const owner: StageOwner = withTeam ? "Moontech" : r.stage.owner;
            const status = done
              ? tf("lt.done", { date: day(r.doneAt!) })
              : now ? (owner === "You" ? t("lt.waiting") : t("lt.inProgress"))
              : tf("lt.by", { date: day(plusDays(l.paidAt, r.stage.dueDays)) });
            return (
              <li key={r.stage.key} className={`flex items-center gap-3 ${compact ? "px-4 py-2.5" : "px-4 py-3 sm:px-5"} ${now ? "bg-brand/[0.025]" : ""}`}>
                <span
                  aria-hidden
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    done ? "bg-good text-white" : now ? "bg-brand text-white" : "border border-hairline bg-white text-ink-faint"
                  }`}
                >
                  {done ? <Check size={12} weight="bold" /> : now && owner !== "You" ? <CircleNotch size={12} weight="bold" className="animate-spin motion-reduce:animate-none" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-body ${done ? "text-ink-soft" : "font-semibold text-ink"}`}>{t(`lt.stage.${r.stage.key}`)}</span>
                  {now && NOTE[r.stage.key] && <span className="block text-meta text-ink-faint">{t(NOTE[r.stage.key]!)}</span>}
                </span>
                <span className={`hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] sm:inline ${OWNER_TONE[owner]}`}>{t(`lt.owner.${owner}`)}</span>
                <span className={`w-[104px] shrink-0 text-end text-meta ${now ? "font-semibold text-ink" : "text-ink-faint"}`}>{status}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Moontech's stages are NASA and launchCampaign in the product. The prototype steps them by hand, and says so. */}
      {!compact && !brandStep && !l.firstSaleAt && (
        <div className="flex flex-wrap gap-2">
          {!l.liveAt ? (
            <button
              type="button"
              onClick={() => advanceLaunch(camp.id, Date.now())}
              className="rounded-pill border border-dashed border-brand/40 px-3 py-1.5 text-meta font-semibold text-brand hover:bg-brand/[0.04]"
            >
              {t("lt.demoNext")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => recordFirstSale(camp.id, 242, Date.now())}
              className="rounded-pill border border-dashed border-brand/40 px-3 py-1.5 text-meta font-semibold text-brand hover:bg-brand/[0.04]"
            >
              {t("lt.demoSale")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
