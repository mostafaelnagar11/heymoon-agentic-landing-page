/* MockCheck (SPEC §5.8): the pre-upload check, cut to what it found. "Pre-upload Check", the draft line
   (product · brand · due in), then each miss with its "Fix:" line, arriving as `shown` grows. A tile
   stands in for the draft's picture, which belongs to another creator. While misses are still landing,
   the header carries a progress Moon (phase round(4·shown/n), a glyph that waxes as work lands, ruling
   35); once all have landed it becomes the "3 to fix" chip in the same slot. The card has its final
   height from the first frame, so a centred card never re-centres. */
import type { MockCheckProps, Phase } from "../contracts";
import { LABELS } from "../copy";
import { Moon } from "../ui/Moon";
import { X } from "../ui/icons";
import { CARD, Chip, FIT } from "./parts";
import s from "./mocks.module.css";

const L = LABELS.creators;

/** The draft line from its label, with the due-in figure set in .num (rule 2.4.4). */
function CheckLine({ product, brand, dueIn }: { product: string; brand: string; dueIn: string }) {
  const line = L.checkLine(product, brand, dueIn);
  const at = dueIn ? line.lastIndexOf(dueIn) : -1;
  if (at < 0) return <>{line}</>;
  return <>{line.slice(0, at)}<span className="num">{dueIn}</span>{line.slice(at + dueIn.length)}</>;
}

export function MockCheck({ product, brand, dueIn, misses, shown }: MockCheckProps) {
  const n = misses.length;
  const k = Math.max(0, Math.min(n, shown));
  const done = k >= n;
  const phase = (n ? Math.round((4 * k) / n) : 4) as Phase;
  return (
    <div aria-hidden className={FIT}>
      <div className={`my-auto shrink-0 overflow-hidden rounded-[16px] ${CARD}`}>
        <div className="flex items-center gap-3 border-b border-ink/[0.06] px-4 py-3">
          <span className="hm-media grid size-10 shrink-0 place-items-center rounded-[10px] ring-1 ring-inset ring-ink/[0.05]">
            <span className="block h-[18px] w-[11px] rounded-[3px] bg-white/70 ring-1 ring-ink/[0.14]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-5 tracking-[-0.005em] text-ink">{L.preUpload}</p>
            <p className="line-clamp-2 text-[11px] leading-4 text-ink/60"><CheckLine product={product} brand={brand} dueIn={dueIn} /></p>
          </div>
          <span className={`${s.swap} shrink-0`}>
            <span data-on={done ? "0" : "1"} className="flex justify-end"><Moon phase={phase} size={15} className="text-brand" /></span>
            <span data-on={done ? "1" : "0"} className="flex"><Chip tone="danger">{L.toFix(n)}</Chip></span>
          </span>
        </div>
        <ul className="divide-y divide-ink/[0.06]">
          {misses.map((m, i) => (
            <li key={m.label} className={`${s.arrive} ${s.checkRow} flex items-start gap-3 px-4`} data-on={i < k ? "1" : "0"}>
              <span className="mt-px grid size-5 shrink-0 place-items-center rounded-[6px] bg-danger/8 text-danger ring-1 ring-inset ring-danger/20">
                <X size={11} weight="bold" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold leading-5 text-ink">{m.label}</span>
                <span className={`${s.fix} block rounded-[8px] bg-lilac px-2.5 py-1.5 text-[11px] leading-4 text-ink/72`}>
                  <span className="font-semibold text-brand">{L.fix}</span> {m.fix}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
