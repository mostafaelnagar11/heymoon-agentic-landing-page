/* MockTiers (SPEC §5.8): the dashboard's campaign rows, cut to the picks you join outright and the
   first one you ask for. Each pick row ends the way the product's does: the share, then the green
   level chip. Then the `next` row with "Request to join", then the landing's foot line. Rows keep
   their place while they wait and fade up as they arrive, so the card never resizes: picks by `shown`
   (the window times them to match_offers), the next row and the foot together with `showFoot`.
   A row that has not arrived shows its skeleton (MockPlan's bar, in the row's own shape) in the same
   cell, and the two cross-fade, so before the first pick lands the card already reads as a list
   being filled, not a blank rectangle. */
import type { CSSProperties, ReactNode } from "react";
import type { MockTiersProps } from "../contracts";
import { LABELS } from "../copy";
import { BrandDot, CARD, Chip, FRAME, Tick } from "./parts";
import s from "./mocks.module.css";

const BLOCK = "block h-5 rounded-[6px] bg-ink/[0.04]";

/** One 44px row: the skeleton and the row in one grid cell. */
function Row({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <li className={`${s.layers} h-11`}>
      <span className={`${s.ghost} flex items-center gap-2`} data-on={on ? "0" : "1"}>
        <span className="block size-5 shrink-0 rounded-full bg-ink/[0.06]" />
        <span className={s.skel} style={{ width: 84 }} />
        <span className="flex-1" />
        <span className={BLOCK} style={{ width: 36 }} />
        <span className="flex min-w-[94px] justify-end"><span className={BLOCK} style={{ width: 70 }} /></span>
      </span>
      <span className={`${s.arrive} flex min-w-0 items-center gap-2`} data-on={on ? "1" : "0"}>{children}</span>
    </li>
  );
}

export function MockTiers({ picks, shown, next, restLine, showFoot }: MockTiersProps) {
  const footDelay: CSSProperties = { transitionDelay: showFoot ? "120ms" : "0ms" };
  return (
    <div aria-hidden className={FRAME}>
      <div className={`rounded-[16px] px-3 py-1.5 ${CARD}`}>
        <ul className="divide-y divide-ink/[0.06]">
          {picks.map((p, i) => (
            <Row key={p.brand} on={i < shown}>
              <BrandDot name={p.brand} />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink/88">{p.brand}</span>
              <Chip tone="brand"><span className="num">{p.sharePct}%</span></Chip>
              <span className="flex min-w-[94px] justify-end"><Chip tone="good" icon={<Tick />}>{p.levelWord}</Chip></span>
            </Row>
          ))}
          {next && (
            <Row on={showFoot}>
              <BrandDot name={next.brand} />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink/72">{next.brand}</span>
              <Chip tone="ink"><span className="num">{next.sharePct}%</span></Chip>
              <span className="flex min-w-[94px] justify-end"><Chip tone="line">{LABELS.creators.requestToJoin}</Chip></span>
            </Row>
          )}
        </ul>
        <div className={`${s.layers} border-t border-ink/[0.06] pb-1 pt-2`}>
          <span className={`${s.ghost} flex`} data-on={showFoot ? "0" : "1"} style={footDelay}>
            <span className={s.skel} style={{ width: "62%" }} />
          </span>
          <p className={`${s.arrive} text-micro text-ink/60`} data-on={showFoot ? "1" : "0"} style={footDelay}>
            {restLine}
          </p>
        </div>
      </div>
    </div>
  );
}
