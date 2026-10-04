/* MockTiers (SPEC §5.8): the dashboard's campaign rows, cut to the picks you join outright and the
   first one you ask for. Each pick row ends the way the product's does: the share, then the green
   level chip. Then the `next` row with "Request to join", then the landing's foot line. Rows keep
   their place while they wait and fade up as they arrive, so the card never resizes: picks by `shown`
   (the window times them to match_offers), the next row and the foot together with `showFoot`. */
import type { MockTiersProps } from "../contracts";
import { LABELS } from "../copy";
import { BrandDot, CARD, Chip, FRAME, Tick } from "./parts";
import s from "./mocks.module.css";

export function MockTiers({ picks, shown, next, restLine, showFoot }: MockTiersProps) {
  return (
    <div aria-hidden className={FRAME}>
      <div className={`rounded-[16px] px-3 py-1.5 ${CARD}`}>
        <ul className="divide-y divide-ink/[0.06]">
          {picks.map((p, i) => (
            <li key={p.brand} className={`${s.arrive} flex h-11 items-center gap-2`} data-on={i < shown ? "1" : "0"}>
              <BrandDot name={p.brand} />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink/88">{p.brand}</span>
              <Chip tone="brand"><span className="num">{p.sharePct}%</span></Chip>
              <span className="flex min-w-[94px] justify-end"><Chip tone="good" icon={<Tick />}>{p.levelWord}</Chip></span>
            </li>
          ))}
          {next && (
            <li className={`${s.arrive} flex h-11 items-center gap-2`} data-on={showFoot ? "1" : "0"}>
              <BrandDot name={next.brand} />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink/72">{next.brand}</span>
              <Chip tone="ink"><span className="num">{next.sharePct}%</span></Chip>
              <span className="flex min-w-[94px] justify-end"><Chip tone="line">{LABELS.creators.requestToJoin}</Chip></span>
            </li>
          )}
        </ul>
        <p
          className={`${s.arrive} border-t border-ink/[0.06] pb-1 pt-2 text-micro text-ink/60`}
          data-on={showFoot ? "1" : "0"}
          style={{ transitionDelay: showFoot ? "120ms" : "0ms" }}
        >
          {restLine}
        </p>
      </div>
    </div>
  );
}
