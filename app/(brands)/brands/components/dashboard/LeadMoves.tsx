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
      className="rounded-tile border border-brand/25 bg-white p-5 shadow-card ring-4 ring-brand/[0.05]"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
          <Sparkle size={11} weight="fill" />
        </span>
        <h2 className="text-body font-semibold text-main">
          {moves.length ? `What adds most by day ${phase.plannedDays}` : "Nothing left to add"}
        </h2>
      </div>

      {moves.length ? (
        <ul className="mt-2">
          {moves.map((m, i) => (
            <li key={m.id} className="flex items-center gap-3 border-t border-hairline py-3">
              <span className="num inline-flex min-w-[68px] shrink-0 justify-center rounded-pill bg-good/10 px-2 py-1 text-meta font-semibold text-good-deep">
                +{fmtUSD(m.adds)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-ink">{m.title}</p>
                <p className="text-[11px] leading-4 text-ink-faint">{m.why}</p>
              </div>
              <button
                type="button"
                onClick={() => run(m.action)}
                className={`inline-flex h-8 shrink-0 items-center rounded-pill px-3.5 text-meta font-semibold transition ${
                  i === 0 ? "g-button border border-white/50 text-[#FBF8FE]" : "bg-lilac text-main hover:bg-main-10"
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

      <p className="mt-2 text-[11px] text-ink-faint">Estimates from this phase&apos;s own rate. Budget stays inside the phase.</p>
    </section>
  );
}
