/* MockWhy (SPEC §5.8, C7, ruling 26): "Why HeyMoon matched you" and the level chip, then the four
   signal labels, each with a 15px Moon that is full when the bound signal is strong and new when it is
   not. No digits, no detail lines, no meters, no weights. Rows past `filled` keep their place and
   fade up when they arrive (300ms; the window staggers `filled` at 120ms). */
import type { MockWhyProps } from "../contracts";
import { LABELS } from "../copy";
import { Moon } from "../ui/Moon";
import { CARD, Chip, FRAME, Tick } from "./parts";
import s from "./mocks.module.css";

export function MockWhy({ levelWord, reasons, filled }: MockWhyProps) {
  return (
    <div aria-hidden className={FRAME}>
      <div className={`rounded-[16px] px-4 pb-3.5 pt-3 ${CARD}`}>
        <div className="flex min-h-6 items-center justify-between gap-3">
          <p className="truncate text-[12px] font-semibold tracking-[-0.005em] text-ink">{LABELS.creators.why}</p>
          <Chip tone="good" icon={<Tick />}>{levelWord}</Chip>
        </div>
        <ul className="mt-2.5 space-y-2">
          {reasons.map((r, i) => (
            <li key={r.label} className={`${s.arrive} flex items-center gap-2.5`} data-on={i < filled ? "1" : "0"}>
              <Moon phase={r.lit ? 4 : 0} size={15} className="text-brand" />
              <span className="min-w-0 text-[12px] leading-4 text-ink/88">{r.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
