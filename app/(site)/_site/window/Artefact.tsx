"use client";
/* What the agents are making, beside the rows (SPEC §5.2.3).

   Act 0: the store (or handle) card, centred in the pane. From the first frame every unit the read will
   run holds a skeleton tag; when the unit lands, its `produces` label takes the place. The card never
   grows during the read, and the fold collapses the tags.
   Brands, act 1: MockPlan with every reveal off, its fields flipping as their rows land; act 2: the
   ladder's MockPhases under the card.
   Creators, act 1: the card collects the build's own products while the three agents work, then
   MockWhy fills; act 2: MockTiers, one pick at a time, then the foot.

   No layout ever shifts. All layers share one grid cell, and an invisible GHOST of the largest final
   state sizes that cell, so the plan grows downwards into space that was already there. The cell is
   scaled down to fit the pane when it is too tall (the pane is 380px below 640, 420px to 1023). */
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { At, Globe } from "../ui/icons";
import { view } from "../data/view";
import { MockPlan } from "../mocks/MockPlan";
import { MockPhases } from "../mocks/MockPhases";
import { MockWhy } from "../mocks/MockWhy";
import { MockTiers } from "../mocks/MockTiers";
import { useIsoLayoutEffect } from "../lib/iso";
import type { BrandsArt, CreatorsArt, RowSnap, Schedule, Snap } from "./useRun";
import s from "./window.module.css";

export interface ArtefactProps {
  s: Schedule;
  snap: Snap;
  variant?: "page" | "compact";
  /** Page only: the run is done (the controls are showing). */
  done?: boolean;
}

/* ── fit: scale the stage down (never up) to the box ── */
function Fit({ children, className = "" }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useIsoLayoutEffect(() => {
    const b = box.current, i = inner.current;
    if (!b || !i) return;
    const apply = () => {
      const bh = b.clientHeight, ih = i.offsetHeight;
      const bw = b.clientWidth, iw = i.offsetWidth;
      if (!bh || !ih || !bw || !iw) return;
      const k = Math.min(1, bh / ih, bw / iw);
      i.style.setProperty("--fit", k > 0.995 ? "1" : k.toFixed(4));
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(apply);
    ro.observe(b);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={`${s.fit} ${className}`}>
      <div ref={inner} className={s.fitInner}>{children}</div>
    </div>
  );
}

/* ── mount: WP8 mocks default to v1's placement for a fixed media box (SPEC §5.8: "absolute inset-x-6
      top-1/2 -translate-y-1/2 sm:inset-x-8"), and these four take no className. The window stacks
      them, so a mount brings such a root into flow (window.module.css, .mount > .absolute: SSR and
      no-JS safe). Any other absolutely placed root gets the mount sized to it after layout. ── */
function Mount({ children, kind }: { children: ReactNode; kind: "plan" | "phases" | "why" | "tiers" }) {
  const ref = useRef<HTMLDivElement>(null);
  useIsoLayoutEffect(() => {
    const box = ref.current;
    const child = box?.firstElementChild as HTMLElement | null;
    if (!box || !child) return;
    const sync = () => {
      const abs = getComputedStyle(child).position === "absolute";
      box.style.height = abs ? `${child.offsetHeight}px` : "";
    };
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(sync);
    ro.observe(child);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className={s.mount} data-mock={kind}>{children}</div>;
}

/* ── the source card: the store or the handle, and the tags the agents land in it ── */
function Tags({ rows, open }: { rows: RowSnap[]; open: boolean }) {
  return (
    <div className={s.tagsFold} data-open={open ? "1" : "0"}>
      <div className={s.tagsClip}>
        <div className={s.tags}>
          {rows.map((r) => (
            <span
              key={r.u.key}
              className={s.tag}
              data-landed={r.state === "done" ? "1" : "0"}
              style={{ "--k": r.u.i } as CSSProperties}
            >
              <span className={s.tagFace}><span className={s.tagText}>{r.u.produces}</span></span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceCard({ sch, snap }: { sch: Schedule; snap: Snap }) {
  const Icon = sch.audience === "brands" ? Globe : At;
  const creators = snap.art.kind === "creators";
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <Icon size={14} weight="regular" className={s.cardIcon} aria-hidden />
        <span className="mono-data text-ink/88" dir="ltr">{sch.shown}</span>
      </div>
      <Tags rows={snap.read} open={!snap.folded} />
      {creators && <Tags rows={snap.build} open={snap.buildOn} />}
    </div>
  );
}

/* ── brands: the plan, its checks, and the phases ── */
const PLAN = view.plan();
const PHASES = view.phases();
const ALL_ON = { header: true, pay: true, markets: true, creators: true } as const;
/** window.module.css .planStack gap. */
const PLAN_GAP = 12;

/* Until the phases arrive (act 2) the plan is centred in the stage: the stack sits lower by half the
   phases' reserved space, then glides up as they fade in under it. */
function PlanStack({ art, ghost = false, checks }: { art?: BrandsArt; ghost?: boolean; checks: string[] }) {
  const phases = useRef<HTMLDivElement>(null);
  const [ph, setPh] = useState(0);
  useIsoLayoutEffect(() => {
    const el = phases.current;
    if (ghost || !el) return;
    const read = () => setPh(el.offsetHeight);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ghost]);
  const on = ghost || !!art?.phasesOn;
  const y = on || !ph ? 0 : Math.round((ph + PLAN_GAP) / 2);
  return (
    <div className={s.planStack} style={{ "--plan-y": `${y}px` } as CSSProperties}>
      <Mount kind="plan"><MockPlan {...PLAN} reveal={ghost || !art ? ALL_ON : art.reveal} checks={checks} /></Mount>
      <div ref={phases} className={s.phases} data-on={on ? "1" : "0"}>
        <Mount kind="phases"><MockPhases rungs={PHASES} grown={ghost || !!art?.grown} /></Mount>
      </div>
    </div>
  );
}

/* ── creators: why, then the tiers ── */
const WHY = view.why();
const TIERS = view.tiers();

function MatchStack({ art, ghost = false }: { art?: CreatorsArt; ghost?: boolean }) {
  const whyOn = ghost || !!art?.whyOn;
  const tiersOn = ghost || !!art?.tiersOn;
  return (
    <div className={s.matchStack} data-tiers={tiersOn && !ghost ? "1" : "0"}>
      <div className={s.why} data-on={whyOn ? "1" : "0"}>
        <Mount kind="why"><MockWhy {...WHY} filled={ghost ? WHY.reasons.length : art?.filled ?? 0} /></Mount>
      </div>
      <div className={s.tiers} data-on={tiersOn ? "1" : "0"}>
        <Mount kind="tiers"><MockTiers {...TIERS} shown={ghost ? TIERS.picks.length : art?.shown ?? 0} showFoot={ghost || !!art?.foot} /></Mount>
      </div>
    </div>
  );
}

/** Layer state: 0 not yet, 1 on, 2 past. */
const lay = (on: boolean, past: boolean) => (on ? "1" : past ? "2" : "0");

export function Artefact({ s: sch, snap, variant = "page", done = false }: ArtefactProps) {
  const art = snap.art;
  if (variant === "compact") return <CompactArtefact sch={sch} snap={snap} />;

  const brands = art.kind === "brands";
  const nextOn = brands ? art.planOn : art.whyOn;
  const finalChecks = sch.build.filter((u) => u.key === "safety" || u.key === "brief").map((u) => u.produces);

  return (
    <div className={s.pane} data-done={done ? "1" : "0"}>
      <Fit>
        <div className={s.stage}>
          <div className={s.ghost} aria-hidden>
            {brands ? <PlanStack ghost checks={finalChecks} /> : <MatchStack ghost />}
          </div>
          <div className={s.layer} data-on={lay(!nextOn, nextOn)}>
            <SourceCard sch={sch} snap={snap} />
          </div>
          <div className={`${s.layer} ${s.layerTop}`} data-on={lay(nextOn, false)}>
            {art.kind === "brands"
              ? <PlanStack art={art} checks={art.checks} />
              : <MatchStack art={art} />}
          </div>
        </div>
      </Fit>
    </div>
  );
}

/* ── compact: after the fold, the plan (brands) or the tiers (creators), whole ── */
function CompactArtefact({ snap }: { sch: Schedule; snap: Snap }) {
  const on = snap.buildOn;
  return (
    <div className={s.cArt} data-on={on ? "1" : "0"}>
      <div className={s.cArtInner}>
        {snap.art.kind === "brands"
          ? <Mount kind="plan"><MockPlan {...PLAN} /></Mount>
          : <Mount kind="tiers"><MockTiers {...TIERS} shown={TIERS.picks.length} showFoot /></Mount>}
      </div>
    </div>
  );
}
