"use client";

/* Where the brand is in getting started, in the conversation's header (Aurora, 11 Nov: "spend more time on the chat
   ui"). The conversation is one long scroll, and nothing in it said how far along it was: five steps, each ticked
   by what is true of the account (the read landed, they signed in, a plan exists, Phase 1 is paid, the brief is
   approved), never by where the scroll happens to be. The step after the last ticked one is the one lit. On a
   phone, one pill: the step and its number. */

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
              {i > 0 && <span aria-hidden className={`h-px w-4 ${steps[i - 1].done ? "bg-good/50" : "bg-brand/15"}`} />}
              <span
                aria-current={now ? "step" : undefined}
                className={`flex h-8 items-center gap-1.5 rounded-full pe-3 ps-1 text-meta font-semibold transition ${
                  now ? "bg-white text-ink shadow-lift" : s.done ? "text-ink-soft" : "text-ink-faint"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                    s.done ? "bg-good text-white" : now ? "grad-tile" : "bg-haze text-ink-faint"
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
        <span aria-hidden className={`num grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${steps[current]?.done ? "bg-good text-white" : "grad-tile"}`}>
          {steps[current]?.done ? <Check size={11} weight="bold" /> : current + 1}
        </span>
        {steps[current]?.label}
        <span className="num text-ink-faint">{current + 1}/{steps.length}</span>
      </p>
    </nav>
  );
}
