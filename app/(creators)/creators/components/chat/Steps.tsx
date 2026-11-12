"use client";

/* Where the creator is in getting started, in the conversation's header (Aurora, 11 Nov), the brands chat's own
   stepper: four steps, each ticked by what is true (the read landed, the profile is built, campaigns are matched, one
   is joined), never by where the scroll happens to be. On a phone, one pill: the step and its number. */

import { Check } from "@phosphor-icons/react";

export interface Step { key: string; label: string; done: boolean }

export function OnboardingSteps({ steps }: { steps: Step[] }) {
  const at = steps.findIndex((s) => !s.done);
  const current = at === -1 ? steps.length - 1 : at;
  return (
    <nav aria-label="Getting started" className="pointer-events-auto">
      <ol className="glass hidden items-center gap-1 !rounded-full py-1 pe-1.5 ps-1 lg:flex">
        {steps.map((s, i) => {
          const now = i === current && !s.done;
          return (
            <li key={s.key} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden className={`h-px w-4 ${steps[i - 1].done ? "bg-green/50" : "bg-main/15"}`} />}
              <span
                aria-current={now ? "step" : undefined}
                className={`flex h-8 items-center gap-1.5 rounded-full pe-3 ps-1 text-meta font-semibold transition ${
                  now ? "bg-white text-ink shadow-lift" : s.done ? "text-ink-60" : "text-ink-50"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                    s.done ? "bg-green text-white" : now ? "grad-tile" : "bg-haze text-ink-50"
                  }`}
                >
                  {s.done ? <Check size={11} weight="bold" /> : i + 1}
                </span>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="glass flex h-8 items-center gap-2 !rounded-full pe-3 ps-1 text-meta font-semibold text-ink lg:hidden">
        <span aria-hidden className={`num grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${steps[current]?.done ? "bg-green text-white" : "grad-tile"}`}>
          {steps[current]?.done ? <Check size={11} weight="bold" /> : current + 1}
        </span>
        {steps[current]?.label}
        <span className="num text-ink-50">{current + 1}/{steps.length}</span>
      </p>
    </nav>
  );
}
