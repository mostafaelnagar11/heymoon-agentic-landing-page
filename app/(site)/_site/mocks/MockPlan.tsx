/* MockPlan (SPEC §5.8): the plan card a brand sees before paying, cropped to its first phase.
   Header "Phase 1 · Warm-up" and the Guaranteed pill, then You pay, Markets and Creators (discs, never
   avatars: C10). A field whose reveal flag is off shows a skeleton bar in the same cell, and the reveal
   cross-fades over 300ms, so the card never changes size while the window builds it (WP2). `checks`
   are the window's check lines under the card; each new line fades up as it mounts. */
import type { MockPlanProps } from "../contracts";
import { LABELS } from "../copy";
import { Check } from "../ui/icons";
import { Discs } from "./Discs";
import { CARD, Chip, FRAME, Swap } from "./parts";
import s from "./mocks.module.css";

const ALL = { header: true, pay: true, markets: true, creators: true } as const;
const L = LABELS.brands;

export function MockPlan({ phaseLabel, pay, markets, creatorCount, reveal = ALL, checks }: MockPlanProps) {
  return (
    <div aria-hidden className={FRAME}>
      <div className={`overflow-hidden rounded-[16px] ${CARD}`}>
        <div className="flex h-10 items-center justify-between gap-3 border-b border-ink/[0.06] px-4">
          <Swap on={reveal.header} align="start" skeleton={<span className={s.skel} style={{ width: 92 }} />}>
            <span className="truncate text-[12px] font-semibold tracking-[-0.005em] text-ink">{phaseLabel}</span>
          </Swap>
          <Swap on={reveal.header} skeleton={<span className={s.skel} style={{ width: 56 }} />}>
            <Chip tone="good">{L.guaranteed}</Chip>
          </Swap>
        </div>
        <div className="px-4">
          <div className="flex items-center justify-between gap-3 border-b border-ink/[0.06] py-3">
            <span className="text-[12px] text-ink/60">{L.youPay}</span>
            <Swap on={reveal.pay} skeleton={<span className={s.skel} style={{ width: 72, height: 10 }} />}>
              <span className="num text-[26px] font-semibold leading-[30px] tracking-[-0.03em] text-ink">{pay}</span>
            </Swap>
          </div>
          <div className="flex h-10 items-center justify-between gap-3">
            <span className="text-[12px] text-ink/60">{L.markets}</span>
            <Swap on={reveal.markets}>
              <span className="truncate text-[12px] font-medium text-ink/88">{markets.join(", ")}</span>
            </Swap>
          </div>
          <div className="flex h-10 items-center justify-between gap-3 border-t border-ink/[0.06]">
            <span className="text-[12px] text-ink/60">{L.creators}</span>
            <Swap on={reveal.creators} skeleton={<span className={s.skel} style={{ width: 48 }} />}>
              <Discs count={creatorCount} />
            </Swap>
          </div>
        </div>
      </div>
      {checks && checks.length > 0 && (
        <ul className="mt-3 space-y-1.5 px-1">
          {checks.map((c) => (
            <li key={c} className={`${s.enter} flex items-start gap-2 text-micro text-ink/72`}>
              <Check size={12} weight="bold" className="mt-[4px] shrink-0 text-good" aria-hidden />
              <span className="min-w-0">{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
