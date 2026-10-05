"use client";
/* WP8 lab: every mock, both audiences, every state, in the mounts the sections give them. Calls
   notFound() in production; WP-F deletes lab/.
   ?a=brands|creators      audience (the toolbar switch flips it in place)
   ?s=final (default)      every mock in its final state (what the server renders)
   ?s=start                every mock in its start state (reveal off, not grown, not drawn, none shown)
   ?s=play                 a looping run through every state at the consumers' real timings
   ?rm=1                   the JS side of reduced motion (toolbar "rm"): play shows final
   ?dir=rtl                mirror the page (logical properties and RTL motion)
   Pause is in the toolbar: it freezes the play clock. */
import { notFound } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { Audience } from "../../_site/data/types";
import { view } from "../../_site/data/view";
import { COPY, LABELS } from "../../_site/copy";
import { usePlayback } from "../../_site/lib/playback";
import { useReducedMotionPref } from "../../_site/lib/prefs";
import { MockField } from "../../_site/mocks/MockField";
import { MockPlan } from "../../_site/mocks/MockPlan";
import { MockPhases } from "../../_site/mocks/MockPhases";
import { MockPay } from "../../_site/mocks/MockPay";
import { MockCurve } from "../../_site/mocks/MockCurve";
import { Curve } from "../../_site/mocks/Curve";
import { RoasDial } from "../../_site/mocks/RoasDial";
import { MockRead } from "../../_site/mocks/MockRead";
import { MockWhy } from "../../_site/mocks/MockWhy";
import { MockPicks } from "../../_site/mocks/MockPicks";
import { MockTiers } from "../../_site/mocks/MockTiers";
import { MockTerms } from "../../_site/mocks/MockTerms";
import { MockCheck } from "../../_site/mocks/MockCheck";
import { ShareScale } from "../../_site/mocks/ShareScale";
import { PayoutRail } from "../../_site/mocks/PayoutRail";
import { ProductTile } from "../../_site/mocks/ProductTile";
import { Discs } from "../../_site/mocks/Discs";
import { LabFrame, labAudience, type LabSearch } from "../_frame";

type Mode = "final" | "start" | "play";
type Search = LabSearch & { s?: string; dir?: string };

export default function Page({ searchParams }: { searchParams?: Search }) {
  if (process.env.NODE_ENV === "production") notFound();
  const mode: Mode = searchParams?.s === "start" ? "start" : searchParams?.s === "play" ? "play" : "final";
  const rtl = searchParams?.dir === "rtl";
  return (
    <LabFrame initial={labAudience(searchParams)} title="mocks" surface="paper">
      {(a) => <Lab audience={a} mode={mode} rtl={rtl} search={searchParams} />}
    </LabFrame>
  );
}

/* ── the play clock: ms since the cycle began; frozen by pause, final under reduced motion ── */
const CYCLE = 6400;
const REST = 1600;

function useClock(mode: Mode): number {
  const { paused } = usePlayback();
  const reduced = useReducedMotionPref();
  const [t, setT] = useState(mode === "start" ? 0 : Infinity);
  useEffect(() => {
    if (mode !== "play") { setT(mode === "start" ? 0 : Infinity); return; }
    if (reduced) { setT(Infinity); return; }
    if (paused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(100, now - last);
      last = now;
      setT((v) => {
        const base = Number.isFinite(v) ? v : 0;
        const next = base + dt;
        return next > CYCLE + REST ? 0 : next;
      });
    }, 40);
    return () => window.clearInterval(id);
  }, [mode, paused, reduced]);
  return t;
}
const count = (t: number, at: number[]) => at.filter((ms) => t >= ms).length;

/* ── mounts ── */
function Label({ children }: { children: ReactNode }) {
  return <p className="mono-caps mb-3 text-ink/60">{children}</p>;
}
/** The run stage's sticky panel (524 × 480 at 1440), a stacked mount (100% × 300), or one of WP3's
    taller stacked mounts for the creators' sheets (run.module.css .tallRead/.tallTerms/.tallCheck),
    passed as its height classes. */
const TALL = {
  read: "h-[440px]",
  terms: "h-[412px] max-[359px]:h-[468px] sm:h-[432px]",
  check: "h-[380px] sm:h-[396px] lg:h-[340px]",
} as const;
function Panel({ h, label, children }: { h: 300 | 480 | (typeof TALL)[keyof typeof TALL]; label: string; children: ReactNode }) {
  const size = h === 480 ? "h-[480px] max-w-[524px]" : h === 300 ? "h-[300px]" : h;
  return (
    <div>
      <Label>{label}</Label>
      <div data-lab={label} className={`hm-media relative w-full overflow-hidden rounded-[24px] ring-1 ring-[var(--hair)] ${size}`}>
        {children}
      </div>
    </div>
  );
}
/** WP2's artefact pane: canvas, a 360px stage, mocks brought into flow the way WP2's mount does. */
function Pane({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div data-lab={label} className="grid min-h-[420px] place-items-center rounded-[18px] bg-canvas p-4 ring-1 ring-[var(--hair)] sm:p-8">
        <div className="grid w-[min(360px,100%)] gap-3 [&>div>.absolute]:!relative [&>div>.absolute]:!inset-auto [&>div>.absolute]:!transform-none">
          {children}
        </div>
      </div>
    </div>
  );
}
function Column({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div data-lab={label} className="w-full max-w-[520px]">{children}</div>
    </div>
  );
}

function Lab({ audience, mode, rtl, search }: { audience: Audience; mode: Mode; rtl: boolean; search?: Search }) {
  const t = useClock(mode);
  useEffect(() => {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    return () => { document.documentElement.dir = "ltr"; };
  }, [rtl]);

  /* Built from the page's searchParams, which are the same on the server and the client, so the
     links hydrate as rendered and keep every other parameter (&rm=1, &dir=rtl). Never window.location. */
  const href = (s: Mode) => {
    const q = new URLSearchParams(
      Object.entries(search ?? {}).filter((e): e is [string, string] => typeof e[1] === "string"),
    );
    q.set("a", audience); q.set("s", s);
    return `?${q.toString()}`;
  };

  return (
    <>
      <div className="fixed bottom-3 start-1/2 z-[80] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-pill bg-night-0/90 p-1 text-white shadow-glass rtl:translate-x-1/2">
        {(["final", "start", "play"] as const).map((m) => (
          <a key={m} href={href(m)} className={`mono-caps rounded-pill px-3 py-2 ${mode === m ? "bg-white text-ink" : "text-white/72 hover:text-white"}`}>{m}</a>
        ))}
        <span className="mono-data num w-16 px-2 text-end text-white/56">{mode === "play" && Number.isFinite(t) ? `${(t / 1000).toFixed(1)}s` : ""}</span>
      </div>
      <div className="mx-auto max-w-[1180px] px-[var(--gutter)] pb-28 pt-6">
        <h1 className="text-h3 text-ink">Mocks · {audience} · {mode}{rtl ? " · rtl" : ""}</h1>
        <p className="mt-1 text-small text-ink/60">Every mock in the mount its section gives it. Window mocks first, then run mocks, then number mocks.</p>
        {audience === "brands" ? <Brands t={t} /> : <Creators t={t} />}
      </div>
    </>
  );
}

/* ── brands ── */
const PLAN = view.plan();
const PHASES = view.phases();
const CHECKS = ["Competitors excluded, overlaps declared", "What every creator must say, and must not say"];

function Brands({ t }: { t: number }) {
  const reveal = { markets: t >= 600, creators: t >= 1200, header: t >= 1800, pay: t >= 1800 };
  const checks = CHECKS.slice(0, count(t, [1200, 2400]));
  const grown = t >= 3000;
  const drawn = t >= 300;
  return (
    <div className="mt-10 grid gap-x-8 gap-y-12 lg:grid-cols-2">
      <Pane label="window · MockPlan (reveal + checks), MockPhases (grown)">
        <div><MockPlan {...PLAN} reveal={reveal} checks={checks} /></div>
        <div><MockPhases rungs={PHASES} grown={grown} /></div>
      </Pane>
      <Pane label="compact thumbnail · MockPlan at zoom .72">
        <div className="[zoom:.72]"><MockPlan {...PLAN} /></div>
      </Pane>

      <Panel h={480} label="run 01 · MockField url · panel 524×480">
        <MockField kind="url" value="yourstore.com" />
      </Panel>
      <Panel h={480} label="run 02 · MockPlan">
        <MockPlan {...PLAN} />
      </Panel>
      <Panel h={480} label="run 03 · MockPay">
        <MockPay {...view.pay()} />
      </Panel>
      <Panel h={480} label="run 04 · MockCurve (drawn)">
        <MockCurve rungs={view.curve()} label={LABELS.brands.salesGuaranteed} drawn={drawn} />
      </Panel>
      <Panel h={300} label="stacked 300 · MockPay">
        <MockPay {...view.pay()} />
      </Panel>
      <Panel h={300} label="stacked 300 · MockCurve">
        <MockCurve rungs={view.curve()} label={LABELS.brands.salesGuaranteed} drawn={drawn} />
      </Panel>

      <Column label="number · Curve (column × 96)">
        <p className="mono-caps text-ink/60">{COPY.brands.number.eyebrow}</p>
        <div className="mt-4"><Curve drawn={drawn} className="h-24 w-full" /></div>
      </Column>
      <Column label="number · RoasDial (360, phone 300)">
        <div className="mx-auto max-w-[300px] sm:max-w-[360px]">
          <RoasDial {...view.dial()} label={COPY.brands.number.dialLabel} note={COPY.brands.number.dialNote} drawn={drawn} />
        </div>
      </Column>

      <Column label="Discs · 3 at 20, 4 at 24">
        <div className="flex items-center gap-6 rounded-[16px] bg-white p-5 ring-1 ring-ink/[0.06]">
          <Discs count={PLAN.creatorCount} />
          <Discs count={4} size={24} />
        </div>
      </Column>
    </div>
  );
}

/* ── creators ── */
const WHY = view.why();
const TIERS = view.tiers();
const PICKS = view.picks();
const CHECK = view.check();
const SHARE = view.share();
const PAYOUT = view.payout();
const P0 = 1000;

function Creators({ t }: { t: number }) {
  const filled = count(t, WHY.reasons.map((_, i) => 300 + i * 120));
  const tiersShown = count(t, TIERS.picks.map((p) => P0 + p.enterMs));
  const foot = t >= P0 + (TIERS.picks.at(-1)?.enterMs ?? 0) + 400;
  const picksShown = count(t, PICKS.picks.map((p) => p.enterMs));
  const misses = count(t, CHECK.misses.map((_, i) => 600 + i * 120));
  const lit = t >= 300;
  const rail = count(t, PAYOUT.steps.map((_, i) => 300 + i * 300));
  return (
    <div className="mt-10 grid gap-x-8 gap-y-12 lg:grid-cols-2">
      <Pane label="window · MockWhy (filled 0 → 4)">
        <div><MockWhy {...WHY} filled={filled} /></div>
      </Pane>
      <Pane label="window · MockTiers (shown 1, 2, 3, then the foot)">
        <div><MockTiers {...TIERS} shown={tiersShown} showFoot={foot} /></div>
      </Pane>
      <Pane label="compact thumbnail · MockTiers at zoom .72">
        <div className="[zoom:.72]"><MockTiers {...TIERS} shown={TIERS.picks.length} showFoot /></div>
      </Pane>
      <Panel h={480} label="field · MockField handle">
        <MockField kind="handle" value="@yourhandle" platforms={["Instagram", "TikTok"]} />
      </Panel>

      <Panel h={480} label="run 01 · MockRead · panel 524×480">
        <MockRead {...view.read()} />
      </Panel>
      <Panel h={480} label="run 02 · MockPicks cards">
        <MockPicks {...PICKS} shown={picksShown} layout="cards" />
      </Panel>
      <Panel h={480} label="run 03 · MockTerms">
        <MockTerms {...view.terms()} />
      </Panel>
      <Panel h={480} label="run 04 · MockCheck (misses at 120ms)">
        <MockCheck {...CHECK} shown={misses} />
      </Panel>
      <Panel h={TALL.read} label="stacked · MockRead (WP3 tall mount 440)">
        <MockRead {...view.read()} />
      </Panel>
      <Panel h={300} label="short 300 · MockRead (clips in its card)">
        <MockRead {...view.read()} />
      </Panel>
      <Panel h={300} label="stacked 300 · MockPicks cards">
        <MockPicks {...PICKS} shown={picksShown} layout="cards" />
      </Panel>
      <Panel h={TALL.terms} label="stacked · MockTerms (WP3 tall mount 412 to 468)">
        <MockTerms {...view.terms()} />
      </Panel>
      <Panel h={TALL.check} label="stacked · MockCheck (WP3 tall mount 340 to 396)">
        <MockCheck {...CHECK} shown={misses} />
      </Panel>
      <Panel h={480} label="MockPicks rows">
        <MockPicks {...PICKS} shown={picksShown} layout="rows" />
      </Panel>
      <Column label="ProductTile · 112, and with brand">
        <div className="flex flex-wrap gap-4">
          {PICKS.picks.map((p) => <ProductTile key={p.brand} product={p.product} />)}
          <ProductTile product={CHECK.product} brand={CHECK.brand} className="h-28 w-44" />
        </div>
      </Column>

      <Column label="number · PayoutRail (lit 0 → 4, 300ms)">
        <p className="mono-caps text-ink/60">{COPY.creators.number.eyebrow}</p>
        <p className="mt-3 text-figure text-ink">{COPY.creators.number.figure}</p>
        <div className="mt-8"><PayoutRail {...PAYOUT} lit={rail} /></div>
      </Column>
      <Column label="number · ShareScale (lit)">
        <ShareScale {...SHARE} lit={lit} />
      </Column>
    </div>
  );
}
