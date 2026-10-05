/* MockPhases (SPEC §5.8, C11): the ladder, one phase funded and two behind it. Each rung is "Phase n"
   and its budget over a bar at its bound width (16 / 53 / 100%, proportional to the budgets). Phase 1's
   bar is the product's gradient rule (mock chrome, §2.4.2); the others are ink/10. `grown` grows the
   bars from the inline start: scaleX 0 to 1, 600ms --ease-out, 120ms apart. */
import type { CSSProperties } from "react";
import type { MockPhasesProps } from "../contracts";
import { LABELS } from "../copy";
import { CARD, FRAME } from "./parts";
import s from "./mocks.module.css";

export function MockPhases({ rungs, grown }: MockPhasesProps) {
  return (
    <div aria-hidden className={FRAME}>
      <div className={`rounded-[16px] px-4 py-3.5 ${CARD}`}>
        {rungs.map((r, i) => {
          const first = i === 0;
          return (
            <div key={r.phaseNo} className={first ? "" : "mt-3"}>
              <div className="flex items-baseline justify-between gap-3">
                <span className={`num text-[12px] font-medium ${first ? "text-ink" : "text-ink/60"}`}>{LABELS.brands.phase(r.phaseNo)}</span>
                <span className={`num text-[12px] font-semibold ${first ? "text-ink" : "text-ink/60"}`}>{r.budget}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.05]">
                <div
                  className={`${s.grow} h-full rounded-full ${first ? "grad-rule" : "bg-ink/10"}`}
                  data-on={grown ? "1" : "0"}
                  style={{ width: `${Math.min(1, Math.max(0, r.width)) * 100}%`, "--d": `${i * 120}ms` } as CSSProperties}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
