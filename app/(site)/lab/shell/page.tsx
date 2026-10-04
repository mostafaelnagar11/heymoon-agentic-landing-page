"use client";
/* lab/shell (WP0): every shell and ui primitive, both audiences. Calls notFound() in production;
   WP-F deletes lab/. Check: the 8 phases at 15, 24 and 11px; a working glyph cycles at 1.28 s per
   loop with no React re-render; the switch skins; the field on its horizon (?sky is not involved:
   this is the CSS horizon); the reveals and the count-up below the fold. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import type { Phase } from "../../_site/contracts";
import { Moon, MoonRing } from "../../_site/ui/Moon";
import { Star } from "../../_site/ui/Star";
import { Wordmark } from "../../_site/ui/Wordmark";
import { WordReveal } from "../../_site/ui/WordReveal";
import { Reveal } from "../../_site/ui/Reveal";
import { CountUp } from "../../_site/ui/CountUp";
import { AudienceSwitch } from "../../_site/shell/AudienceSwitch";
import { Field } from "../../_site/shell/Field";
import { Horizon } from "../../_site/shell/Horizon";
import { PauseToggle } from "../../_site/shell/PauseToggle";
import { COPY } from "../../_site/copy";

const PHASES: Phase[] = [0, 1, 2, 3, 4, 5, 6, 7];

function Row({ label, children, paper = false }: { label: string; children: React.ReactNode; paper?: boolean }) {
  return (
    <section className={`rounded-card p-6 ${paper ? "bg-paper text-ink" : "bg-deep text-white"}`}>
      <h2 className={`mono-caps mb-5 ${paper ? "text-ink/60" : "text-white/56"}`}>{label}</h2>
      <div className="flex flex-wrap items-center gap-6">{children}</div>
    </section>
  );
}

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="shell">
      {(a) => (
        <div className="mx-auto grid max-w-text gap-6 px-[var(--gutter)] pb-24">
          {[15, 24, 11].map((size) => (
            <Row key={size} label={`Moon phases 0 to 7 at ${size}px`}>
              {PHASES.map((p) => (
                <span key={p} className="flex flex-col items-center gap-2" data-moon-phase={p}>
                  <Moon phase={p} size={size} className="text-white" />
                  <span className="mono-caps text-white/56">{p}</span>
                </span>
              ))}
            </Row>
          ))}
          <Row label="Working (cycles 0 to 7, 160ms a phase), ring, star">
            <span data-moon-working><Moon working size={15} className="text-white" /></span>
            <Moon working size={24} className="text-brand-300" />
            <MoonRing size={15} className="text-white" />
            <MoonRing size={24} className="text-brand-300" />
            <Star size={16} className="text-white" />
            <Star size={36} className="text-white" />
          </Row>
          <Row label="Wordmark, night">
            <Wordmark size="sm" /><Wordmark size="md" /><Wordmark size="lg" />
          </Row>
          <Row label="Wordmark, paper" paper>
            <Wordmark size="sm" tone="paper" /><Wordmark size="md" tone="paper" /><Wordmark size="lg" tone="paper" />
          </Row>
          <Row label="AudienceSwitch: close and nav on night, pause">
            <AudienceSwitch placement="close" surface="night" />
            <AudienceSwitch placement="nav" surface="night" />
            <PauseToggle surface="night" />
          </Row>
          <Row label="AudienceSwitch: close and nav on paper, pause" paper>
            <AudienceSwitch placement="close" surface="paper" />
            <AudienceSwitch placement="nav" surface="paper" />
            <PauseToggle surface="paper" />
          </Row>
          <Row label="AudienceSwitch: nav, hidden (inert, opacity 0)">
            <AudienceSwitch placement="nav" surface="night" hidden />
          </Row>
          <section className="relative grid h-[520px] grid-rows-[1fr_76px_1fr] overflow-clip rounded-card bg-night-1 [--apex-pref:260px]" data-surface="night">
            <Horizon variant="close" ignite className="col-start-1 row-start-2" />
            <div className="relative z-content col-start-1 row-start-2 grid place-items-center">
              <Field id="lab" placement="close" />
            </div>
            <p className="mono-caps relative z-content col-start-1 row-start-1 self-start p-6 text-white/56">Field on the close horizon · {a}</p>
          </section>
          <div className="h-[110svh]" aria-hidden />
          <Row label="WordReveal, Reveal, CountUp (armed below the fold)" paper>
            <WordReveal as="h2" text={COPY[a].work.h2} className="text-h2 text-ink" />
            <Reveal className="rounded-card bg-white p-6 shadow-card"><p className="text-body text-ink/72">{COPY[a].work.sub}</p></Reveal>
            <CountUp to={63050} format="usd" className="text-figure text-ink" />
          </Row>
        </div>
      )}
    </LabFrame>
  );
}
