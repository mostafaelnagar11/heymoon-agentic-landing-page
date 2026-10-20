"use client";

/* MoonConnect in the conversation, after payment (PRD v0.2, steps 6a to 6d).

   Four cards, one per step, each answered once and then folded to a line that says what was done:
     ConnectBlock      the route for the platform the read found; a team route for Shopify (app in review) and custom
     DiscountBlock     the code's discount and limits, what this platform can't enforce, the best-offer confirmation,
                       then a preview to Confirm or Cancel
     StoreCheckBlock   a test order: test code, free order, about two minutes, cancel, delete; one retry, then the team
     BriefReviewBlock  MoonWriter's brief, files, Approve. Approving sets direction, not content
   The conversation says one short line before each, and nothing else (19 Oct: "no one is reading this much"). The
   buttons are the ones Orbit sends: the route, RUN_TEST, TRY_AGAIN, NOT_NOW, Approve. */

import { useEffect, useRef, useState } from "react";
import {
  ArrowSquareOut, CheckCircle, CircleNotch, FileArrowUp, LockSimple, Paperclip, Warning,
} from "@phosphor-icons/react";
import {
  LIMITS, PLATFORMS, PLATFORM_ORDER, enforces, platformFor, siteOfferFor,
  type CouponRules, type LimitKey, type PlatformKey,
} from "../../lib/agent/connect";
import { MARKET_AR, useT, type Locale } from "../../lib/i18n";
import { patchLaunch, useAccount, useCan, type Campaign } from "../../lib/store";
import { track } from "../../lib/track";
import { marketName } from "../../lib/agent/tools";
import type { Plan } from "../../lib/agent/types";
import { briefLine } from "../blocks";
import { Btn, Card } from "../ui";
import { OnlyAdmins } from "../dashboard/Roles";

/** hm_step_viewed, once per card (PRD v0.2, Tracking, Layer 2). */
function useStepViewed(camp: Campaign, step: string, open: boolean) {
  useEffect(() => {
    if (open) track("hm_step_viewed", { brand: camp.url, campaign: camp.id, step });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
const clicked = (camp: Campaign, id: string, step: string) => track("hm_button_clicked", { brand: camp.url, campaign: camp.id, id, step });

type Tf = (k: string, vars: Record<string, string | number>) => string;

/** The platform's name as the brand says it (H6). */
const pname = (k: PlatformKey, locale: Locale) => (locale === "ar" ? PLATFORMS[k].ar.name : PLATFORMS[k].name);

/** "35% off · min order 200 AED · one per customer", in the brand's language. */
export function couponText(c: Pick<CouponRules, "discount" | "limits" | "minOrder">, currency: string, t: (k: string) => string, tf: Tf) {
  return [
    tf("mc.line.off", { n: c.discount }),
    c.limits.minOrder && c.minOrder ? tf("mc.line.min", { n: c.minOrder.toLocaleString("en-US"), cur: currency }) : "",
    c.limits.onePerCustomer ? t("mc.line.one") : "",
    c.limits.excludeSale ? t("mc.line.sale") : "",
    c.limits.endsWithPhase ? t("mc.line.ends") : "",
  ].filter(Boolean).join(" · ");
}

const Done = ({ children }: { children: React.ReactNode }) => (
  <Card className="flex items-center gap-2 px-3.5 py-2.5">
    <CheckCircle size={14} weight="fill" className="shrink-0 text-good-deep" aria-hidden />
    <p className="text-meta text-ink-soft">{children}</p>
  </Card>
);

/* ── 6a · Connect the store ───────────────────────────────────────── */

export function ConnectBlock({ camp, onConnected, onTeam, onNotNow }: {
  camp: Campaign;
  onConnected: (p: PlatformKey) => void;
  onTeam: () => void;
  onNotNow: () => void;
}) {
  const { t, tf, locale } = useT();
  const detected = platformFor(camp.url);
  const [picked, setPicked] = useState<PlatformKey | null>(detected);
  /* The read names the platform and MoonConnect offers that route and Not now, nothing else (H2). Only a store the
     read couldn't place is asked where it runs. */
  const [choosing, setChoosing] = useState(!detected);
  useStepViewed(camp, "6a", !camp.connectedStore && !camp.launch?.legacyAt);
  const [step, setStep] = useState<number | null>(null);
  const p = picked ? PLATFORMS[picked] : null;
  const pn = p ? pname(p.key, locale) : "";
  const pc = p ? (locale === "ar" ? p.ar : p) : null;
  const steps = p ? [t("mc.step.open"), tf("mc.step.signin", { name: pn }), t("mc.step.approve"), t("mc.step.back")] : [];

  /* The handoff, shown rather than hidden: the brand leaves for the platform and comes back to the thread. */
  useEffect(() => {
    if (step === null || !picked) return;
    if (step >= steps.length) {
      setStep(null);
      track("hm_platform_redirect", { brand: camp.url, campaign: camp.id, platform: picked, direction: "back" });
      onConnected(picked);
      return;
    }
    const t = setTimeout(() => setStep((s) => (s === null ? s : s + 1)), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, picked]);

  if (camp.connectedStore) return <Done>{tf("mc.connected", { name: pname(camp.connectedStore, locale) })}</Done>;
  if (camp.launch?.legacyAt) return <Done>{t("mc.teamDone")}</Done>;

  if (choosing || !p) {
    return (
      <Card className="p-4">
        <p className="text-body font-semibold text-ink">{t("mc.where")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORM_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setPicked(k); setChoosing(false); }}
              className="rounded-pill border border-hairline bg-white px-3 py-1.5 text-meta font-semibold text-ink transition hover:border-brand/40"
            >
              {k === "custom" ? (locale === "ar" ? PLATFORMS.custom.ar.name : "Something else") : pname(k, locale)}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  if (step !== null) {
    return (
      <Card className="p-4">
        <p className="text-body font-semibold text-ink">{tf("mc.connecting", { name: pn })}</p>
        <ol className="mt-2.5 space-y-1.5">
          {steps.map((label, i) => (
            <li key={label} className={`flex items-center gap-2 text-meta ${i <= step ? "text-ink" : "text-ink-faint"}`}>
              {i < step
                ? <CheckCircle size={14} weight="fill" className="text-good" aria-hidden />
                : i === step
                  ? <CircleNotch size={14} className="animate-spin text-brand motion-reduce:animate-none" aria-hidden />
                  : <span aria-hidden className="h-3.5 w-3.5 rounded-full border border-black/15" />}
              {label}
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-body font-semibold text-ink">{tf("mc.connectTitle", { name: pn })}</p>
      <p className="mt-0.5 text-meta leading-5 text-ink-soft">{pc!.how}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-faint">
        <LockSimple size={11} weight="fill" aria-hidden />
        {p.route === "legacy" ? t("mc.lockTeam") : tf("mc.lock", { name: pn })}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn
          size="sm"
          onClick={() => {
            clicked(camp, p.route === "legacy" ? "TEAM_ROUTE" : "CONNECT", "6a");
            if (p.route === "legacy") { onTeam(); return; }
            track("hm_platform_redirect", { brand: camp.url, campaign: camp.id, platform: p.key, direction: "out" });
            setStep(0);
          }}
        >
          {pc!.cta}
          {p.route !== "legacy" && <ArrowSquareOut size={12} weight="bold" aria-hidden className="rtl:-scale-x-100" />}
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => { clicked(camp, "NOT_NOW", "6a"); onNotNow(); }}>{t("mc.notNow")}</Btn>
      </div>
    </Card>
  );
}

/* ── 6b · Discount rules ──────────────────────────────────────────── */

const PRESETS = [10, 15, 20, 25, 35];
const chipOn = (on: boolean) => (on ? "border-brand/40 bg-brand/[0.06] text-ink" : "border-hairline bg-white text-ink-soft hover:bg-wash");

export function DiscountBlock({ camp, currency, onConfirmed, onCancel }: {
  camp: Campaign;
  currency: string;
  onConfirmed: (rules: CouponRules) => void;
  onCancel: () => void;
}) {
  const { t, tf, locale } = useT();
  const account = useAccount();
  const canSet = useCan("pay");
  const platform: PlatformKey = camp.connectedStore ?? "custom";
  const name = pname(platform, locale);
  const siteOffer = siteOfferFor(camp.url);
  const start = siteOffer ? Math.min(50, siteOffer + 5) : 15;
  const [discount, setDiscount] = useState(start);
  /* The "Other" field holds only a custom number: a preset clears it, and focusing or typing in it selects it. */
  const [custom, setCustom] = useState(!PRESETS.includes(start));
  const [customText, setCustomText] = useState(PRESETS.includes(start) ? "" : String(start));
  const [limits, setLimits] = useState<Partial<Record<LimitKey, boolean>>>({ minOrder: true, onePerCustomer: true, endsWithPhase: true });
  const [minOrder, setMinOrder] = useState(200);
  const [best, setBest] = useState(false);
  const [preview, setPreview] = useState(false);
  useStepViewed(camp, "6b", !camp.launch?.coupon);

  if (camp.launch?.coupon) return <Done>{tf("mc.codeDone", { line: couponText(camp.launch.coupon, currency, t, tf) })}</Done>;
  if (!canSet) return <OnlyAdmins what="set the discount" />;

  const typed = Math.min(90, Number(customText) || 0);
  const value = custom && typed ? typed : discount;
  const rules = { discount: value, limits, minOrder };
  const low = siteOffer !== null && value <= siteOffer;

  if (preview) {
    return (
      <Card className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{t("mc.preview")}</p>
        <p className="mt-1 text-body font-semibold text-ink">{couponText(rules, currency, t, tf)}</p>
        {/* What the platform will hold at checkout, and what creators are told instead (H3). */}
        <ul className="mt-2 space-y-1">
          {LIMITS.filter((x) => limits[x.key]).map((x) => (
            <li key={x.key} className={`flex items-start gap-1.5 text-meta ${enforces(platform, x.key) ? "text-good-deep" : "text-amber"}`}>
              {enforces(platform, x.key)
                ? <CheckCircle size={13} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                : <Warning size={13} weight="fill" className="mt-0.5 shrink-0" aria-hidden />}
              {t(`mc.limit.${x.key}`)}: {enforces(platform, x.key) ? tf("mc.enforces", { name }) : tf("mc.cantShort", { name })}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-meta text-ink-soft">{t("mc.oneCode")}</p>
        <div className="mt-3 flex gap-2">
          <Btn size="sm" onClick={() => { clicked(camp, "CONFIRM", "6b"); onConfirmed({ ...rules, bestOfferBy: account?.email ?? "the brand", at: Date.now() }); }}>{t("mc.confirm")}</Btn>
          <Btn size="sm" variant="ghost" onClick={() => { clicked(camp, "CANCEL", "6b"); setPreview(false); }}>{t("mc.cancel")}</Btn>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-body font-semibold text-ink">{t("mc.codeTitle")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t("mc.codeTitle")}>
        {PRESETS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={!custom && discount === d}
            onClick={() => { setCustom(false); setCustomText(""); setDiscount(d); setBest(false); }}
            className={`rounded-pill border px-3 py-1.5 text-meta font-semibold transition ${chipOn(!custom && discount === d)}`}
          >
            {d}%
          </button>
        ))}
        <label className="ms-1 flex items-center gap-1.5 text-meta text-ink-soft">
          {t("mc.other")}
          <input
            aria-label={t("mc.otherDiscount")}
            type="text" inputMode="numeric" value={customText}
            onFocus={() => setCustom(true)}
            onChange={(e) => { setCustom(true); setCustomText(e.target.value.replace(/\D/g, "").slice(0, 2)); setBest(false); }}
            onBlur={() => { if (Number(customText) > 90) setCustomText("90"); }}
            className={`h-8 w-16 rounded-control border px-2 text-meta text-ink outline-none focus:border-brand/50 ${
              custom ? "border-brand/40 bg-brand/[0.06]" : "border-hairline bg-white"
            }`}
          />
          %
        </label>
      </div>
      {low && (
        <p className="mt-2 flex items-start gap-1.5 text-meta text-amber">
          <Warning size={13} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
          {tf("mc.siteOffer", { n: siteOffer ?? 0 })}
        </p>
      )}

      <ul className="mt-3 space-y-1.5">
        {LIMITS.map((l) => {
          const on = !!limits[l.key];
          const ok = enforces(platform, l.key);
          return (
            <li key={l.key} className="flex flex-col gap-1 rounded-control border border-hairline px-3 py-2">
              <label className="flex min-w-0 flex-wrap items-center gap-2 text-meta text-ink">
                <input
                  type="checkbox" checked={on}
                  onChange={(e) => setLimits((x) => ({ ...x, [l.key]: e.target.checked }))}
                  className="h-4 w-4 accent-[#4D2FB0]"
                />
                {t(`mc.limit.${l.key}`)}
                {l.key === "minOrder" && on && (
                  <span className="flex items-center gap-1 text-ink-soft">
                    <input
                      type="number" min={0} value={minOrder} aria-label={t("mc.limit.minOrder")}
                      onChange={(e) => setMinOrder(Math.max(0, Number(e.target.value) || 0))}
                      className="h-7 w-20 rounded-control border border-hairline bg-white px-2 text-meta text-ink outline-none"
                    />
                    {currency}
                  </span>
                )}
              </label>
              {on && (
                <span className={`ps-6 text-[11px] font-semibold ${ok ? "text-good-deep" : "text-amber"}`}>
                  {ok ? tf("mc.enforces", { name }) : tf("mc.cant", { name })}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <label className="mt-3 flex items-start gap-2 rounded-control bg-lilac px-3 py-2.5 text-meta text-ink">
        <input type="checkbox" checked={best} onChange={(e) => setBest(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#4D2FB0]" />
        <span>{custom && !typed ? t("mc.bestOfferAny") : tf("mc.bestOffer", { n: value })}</span>
      </label>

      <div className="mt-3 flex gap-2">
        <Btn size="sm" disabled={!best || (custom && !typed)} onClick={() => setPreview(true)}>{t("mc.preview")}</Btn>
        <Btn size="sm" variant="ghost" onClick={() => { clicked(camp, "NOT_NOW", "6b"); onCancel(); }}>{t("mc.notNow")}</Btn>
      </div>
    </Card>
  );
}

/* ── 6c · Store check ─────────────────────────────────────────────── */

export function StoreCheckBlock({ camp, onResult, onNotNow }: {
  camp: Campaign;
  onResult: (passed: boolean) => void;
  onNotNow: () => void;
}) {
  const { t, tf, locale } = useT();
  const platform: PlatformKey = camp.connectedStore ?? "custom";
  const name = pname(platform, locale);
  const zid = platform === "zid";
  const [step, setStep] = useState<number | null>(null);
  const [fail, setFail] = useState(false);
  const code = useRef(`HM-TEST-${(camp.id.length * 977) % 9000 + 1000}`).current;
  const steps = [
    tf("mc.check.code", { code }),
    t("mc.check.order"),
    t("mc.check.wait"),
    zid ? t("mc.check.zid") : t("mc.check.cancelled"),
    t("mc.check.deleted"),
  ];
  useStepViewed(camp, "6c", !camp.launch?.checkPassedAt && !camp.launch?.checkToTeamAt);

  /* On Zid the brand cancels the test order on Zid; Orbit sees the cancellation, so that step simply takes longer. */
  useEffect(() => {
    if (step === null) return;
    /* The demo failure stops where a real one would: the test order never arrives. */
    if (fail && step === 3) { setStep(null); setFail(false); onResult(false); return; }
    if (step >= steps.length) { setStep(null); onResult(true); return; }
    const t = setTimeout(() => setStep((s) => (s === null ? s : s + 1)), step === 2 ? 2400 : zid && step === 3 ? 3500 : 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const l = camp.launch;
  if (l?.checkPassedAt) return <Done>{tf("mc.checkDone", { name })}</Done>;
  if (l?.checkToTeamAt) return <Done>{t("mc.checkTeam")}</Done>;
  const failedOnce = !!l && l.checkAttempts === 1;

  return (
    <Card className="p-4">
      <p className="text-body font-semibold text-ink">{t("mc.checkTitle")}</p>
      {step === null && (
        <p className="mt-0.5 text-meta leading-5 text-ink-soft">
          {failedOnce ? t("mc.checkFailed") : tf("mc.checkDesc", { name })}
        </p>
      )}
      <ol className="mt-2.5 space-y-1.5">
        {steps.map((label, i) => {
          const done = step !== null && i < step;
          const now = step === i;
          return (
            <li key={label} className={`flex items-center gap-2 text-meta ${step === null ? "text-ink-faint" : done || now ? "text-ink" : "text-ink-faint"}`}>
              {done
                ? <CheckCircle size={14} weight="fill" className="text-good" aria-hidden />
                : now
                  ? <CircleNotch size={14} className="animate-spin text-brand motion-reduce:animate-none" aria-hidden />
                  : <span aria-hidden className="h-3.5 w-3.5 rounded-full border border-black/15" />}
              {label}
            </li>
          );
        })}
      </ol>
      {step === null && (
        <div className="mt-3 flex gap-2">
          <Btn size="sm" onClick={() => { clicked(camp, failedOnce ? "TRY_AGAIN" : "RUN_TEST", "6c"); setStep(0); }}>{failedOnce ? t("mc.retry") : t("mc.run")}</Btn>
          <Btn size="sm" variant="ghost" onClick={() => { clicked(camp, "NOT_NOW", "6c"); onNotNow(); }}>{t("mc.notNow")}</Btn>
          {/* The prototype's check always passes; this shows the retry and the hand-off to the team (6c). */}
          <button
            type="button"
            onClick={() => { setFail(true); setStep(0); }}
            className="ms-auto rounded-pill border border-dashed border-brand/40 px-3 py-1.5 text-meta font-semibold text-brand hover:bg-brand/[0.04]"
          >
            {t("mc.demoFail")}
          </button>
        </div>
      )}
    </Card>
  );
}

/* ── 6d · The brief ───────────────────────────────────────────────── */

export function BriefReviewBlock({ camp, plan, onApprove }: { camp: Campaign; plan: Plan; onApprove: () => void }) {
  const { t, tf, locale } = useT();
  const canApprove = useCan("brief");
  const l = camp.launch;
  const b = plan.brief.value;
  const files = l?.briefFiles ?? [];
  const f = plan.focus;
  useStepViewed(camp, "6d", !l?.briefApprovedAt);
  const platforms = Array.from(new Set(plan.creators.value.map((c) => c.platform))).join(", ");
  const products =
    f?.kind === "launch" ? tf("mc.launch", { x: f.note })
    : f?.kind === "specific" ? f.products.join(", ")
    : t("mc.bestsellers");
  const markets = plan.markets.value.map((m) => (locale === "ar" ? MARKET_AR[m] ?? marketName(m) : marketName(m))).join(locale === "ar" ? "، " : ", ");

  if (l?.briefApprovedAt) {
    return (
      <Done>
        {t("mc.briefDone")}{l.briefApprovedBy ? tf("mc.briefBy", { name: l.briefApprovedBy }) : ""}{files.length ? tf("mc.briefFiles", { n: files.length }) : ""}.
      </Done>
    );
  }

  const row = (label: string, value: React.ReactNode) => (
    <div className="grid gap-1 border-t border-hairline py-2 sm:grid-cols-[120px_minmax(0,1fr)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      <div className="min-w-0 text-meta text-ink">{value}</div>
    </div>
  );

  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-500">{t("mc.briefEyebrow")}</p>
      {/* The brief's own lines are MoonWriter's content, in the language it drafted them; `dir="auto"` keeps an English
          line reading left to right inside an Arabic card. */}
      <p dir="auto" className="mt-1 text-body font-semibold text-ink">{b.headline.value}</p>
      <div className="mt-2">
        {row(t("mc.row.say"), <ul className="space-y-0.5">{b.mustSay.value.map((x, i) => <li key={i} dir="auto" className="text-start">· {briefLine(x)}</li>)}</ul>)}
        {row(t("mc.row.dont"), <ul className="space-y-0.5">{b.mustNotSay.value.map((x, i) => <li key={i} dir="auto" className="text-start">· {briefLine(x)}</li>)}</ul>)}
        {row(t("mc.row.products"), products)}
        {row(t("mc.row.markets"), markets)}
        {platforms && row(t("mc.row.platforms"), platforms)}
        {row(t("mc.row.languages"), t("mc.languages"))}
        {files.length > 0 && row(t("mc.row.files"), <ul className="space-y-0.5">{files.map((x) => <li key={x} dir="auto" className="flex items-center gap-1.5"><Paperclip size={11} aria-hidden />{x}</li>)}</ul>)}
      </div>
      <p className="mt-2 text-[11px] leading-4 text-ink-faint">{t("mc.briefNote")}</p>
      {canApprove ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Btn size="sm" onClick={() => { clicked(camp, "APPROVE", "6d"); onApprove(); }}>{t("mc.approve")}</Btn>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill px-3 py-2 text-meta font-semibold text-ink-soft transition hover:bg-black/[0.04] focus-within:ring-2 focus-within:ring-brand/30">
            <FileArrowUp size={13} weight="fill" aria-hidden />
            {t("mc.addFiles")}
            <input
              type="file" multiple className="sr-only"
              onChange={(e) => {
                const names = Array.from(e.target.files ?? []).map((x) => x.name);
                if (names.length && camp.launch) {
                  patchLaunch(camp.id, { briefFiles: [...files, ...names.filter((n) => !files.includes(n))] });
                  track("hm_file_uploaded", { brand: camp.url, campaign: camp.id, count: names.length });
                }
              }}
            />
          </label>
        </div>
      ) : (
        <OnlyAdmins what="approve the brief" className="mt-3" />
      )}
    </Card>
  );
}
