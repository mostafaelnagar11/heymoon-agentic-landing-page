/* MockTerms (SPEC §5.8): joining, cut at the button. "Join {brand}", the pre-qualified line, the share
   as the figure with "of every order you bring in", then what you agree to and what you do not, in the
   same type at the same weight, which is the whole point of the product's sheet. The button is drawn,
   never a control. No money figure: the share is the terms. */
import type { ReactNode } from "react";
import type { MockTermsProps } from "../contracts";
import { LABELS } from "../copy";
import { Check, Lock } from "../ui/icons";
import { CARD, FIT } from "./parts";
import s from "./mocks.module.css";

const L = LABELS.creators;

function Terms({ head, items, icon }: { head: string; items: string[]; icon: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold leading-4 text-brand">{head}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-[12px] leading-[18px] text-ink/72">
            <span className="mt-[3px] shrink-0">{icon}</span>
            <span className="min-w-0">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MockTerms({ brand, needsApproval, sharePct, commits, notCommits }: MockTermsProps) {
  return (
    <div aria-hidden className={FIT}>
      <div className={`my-auto shrink-0 overflow-hidden rounded-[16px] ${CARD}`}>
        <div className="border-b border-ink/[0.06] px-4 py-3">
          <p className="truncate text-[13px] font-semibold leading-5 tracking-[-0.005em] text-ink">{L.join(brand)}</p>
          {!needsApproval && <p className="text-[11px] leading-4 text-ink/60">{L.prequalifiedJoins}</p>}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="num text-[34px] font-semibold leading-none tracking-[-0.035em] text-ink">{`${sharePct}%`}</span>
            <span className="text-[12px] text-ink/60">{L.ofEveryOrderYou}</span>
          </div>
          <div className={`${s.termsLists} mt-4`}>
            <Terms head={L.agreeing} items={commits} icon={<Check size={12} weight="bold" className="text-ink/60" aria-hidden />} />
            <Terms head={L.notAgreeing} items={notCommits} icon={<Lock size={12} weight="bold" className="text-good" aria-hidden />} />
          </div>
          <span className="mt-4 flex h-10 items-center justify-center rounded-full bg-brand text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_6px_14px_-8px_rgba(77,47,176,.7)]">
            {needsApproval ? L.requestToJoin : L.joinCta}
          </span>
        </div>
      </div>
    </div>
  );
}
