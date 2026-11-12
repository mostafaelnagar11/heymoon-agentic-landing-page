"use client";

/* B · Grow the lead (Mostafa picked it, 20 Oct). On the campaign, beside the sales chart: the moves that would add
   the most by the phase's last day, each with what it adds and one press to make it. The chart beside it draws the
   same two endings (on pace, and with every move), so the card and the line can never disagree. The arithmetic is
   lib/agent/moves (leadMoves), the presses go through HeyMoon's `run`. */

import { Sparkle } from "@phosphor-icons/react";
import type { Phase } from "../../lib/mock/campaigns";
import { fmtUSD } from "../../lib/mock/campaigns";
import type { LeadMove } from "../../lib/agent/moves";
import { useHeyMoon } from "./HeyMoon";

export function LeadMoves({ phase, moves }: { phase: Phase; moves: LeadMove[] }) {
  const { run } = useHeyMoon();
  return (
    <section
      aria-label="Grow the lead"
      className="glass p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Sparkle size={16} weight="fill" aria-hidden className="text-orchid" />
        <h2 className="text-[15px] font-semibold text-ink">
          {moves.length ? `What adds most by day ${phase.plannedDays}` : "Nothing left to add"}
        </h2>
      </div>

      {moves.length ? (
        <ul className="mt-2">
          {moves.map((m, i) => (
            <li key={m.id} className="flex items-center gap-3.5 border-t border-brand/[0.07] py-3.5 first:border-t-0">
              <span className="num grid h-10 min-w-[64px] shrink-0 place-items-center rounded-[13px] bg-good/[0.09] px-2 text-[13px] font-bold text-good-deep">
                +{fmtUSD(m.adds)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-ink">{m.title}</p>
                <p className="mt-0.5 text-meta text-ink-faint">{m.why}</p>
              </div>
              <button
                type="button"
                onClick={() => run(m.action)}
                className={`inline-flex h-8 shrink-0 items-center rounded-pill px-3.5 text-meta font-semibold ${
                  i === 0 ? "btn-pri" : "btn-soft"
                }`}
              >
                {m.action.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-meta text-ink-soft">Every draft is decided and the budget sits where it sells best.</p>
      )}

      <p className="mt-3 border-t border-brand/[0.07] pt-3 text-meta text-ink-faint">Estimates from this phase&apos;s own rate. Budget stays inside the phase.</p>
    </section>
  );
}
