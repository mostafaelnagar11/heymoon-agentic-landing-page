/* MockPay (SPEC §5.8): checkout. "Due today", the amount, the card on file by its bound last four, and the Pay
   button. The amount is the bound Phase 1 budget, $1,000, with no VAT line (Mostafa, 5 Oct: "remove this and make
   it $1,000 instead of $1,050"); the bound total and VAT stay in the props, unused here. Bound texts (§2.4.4). */
import type { MockPayProps } from "../contracts";
import { LABELS } from "../copy";
import { CARD, FRAME } from "./parts";

const L = LABELS.brands;

export function MockPay({ budget, last4 }: MockPayProps) {
  return (
    <div aria-hidden className={FRAME}>
      <div className={`overflow-hidden rounded-[16px] p-4 ${CARD}`}>
        <p className="text-[12px] text-ink/60">{L.dueToday}</p>
        <p className="num mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink">{budget}</p>
        <div className="mt-4 flex h-10 items-center gap-2.5 rounded-[10px] bg-ink/[0.04] px-3">
          {/* A card, drawn: no network mark (§6.5 allows no logos but the store and platform marks). */}
          <span className="relative h-4 w-6 shrink-0 overflow-hidden rounded-[3px] bg-ink/[0.14]">
            <span className="absolute inset-x-0 top-[4px] h-[3px] bg-ink/[0.16]" />
          </span>
          <span className="num text-[12px] font-medium tracking-[0.02em] text-ink/72">{L.card(last4)}</span>
        </div>
        <div className="mt-3 flex h-10 items-center justify-center rounded-[10px] bg-ink text-[12px] font-semibold text-white">
          {L.pay(budget)}
        </div>
      </div>
    </div>
  );
}
