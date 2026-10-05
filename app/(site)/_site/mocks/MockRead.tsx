/* MockRead (SPEC §5.8, C9): the creator read, landed. Header: the title, the sub ("@yourhandle · five
   agents") and the bound count; then the nine rows, each a full Moon, the agent in 10px mono caps and
   the label of what it found (`produces`). No read values, ever: nothing about the person who was read.
   One line per row on a wide card; the agent over the label on a narrow one (a container query).
   It sits centred where it fits. Where it does not (the phone and tablet stacked mounts, the 768 sticky
   panel), the card stops at its mount with its rounded foot and shadow intact and the list runs under
   a fade inside it, the way a sheet that scrolls does; the fade is sticky at the list's end, so it
   only shows when rows are actually hidden. */
import type { MockReadProps } from "../contracts";
import { Moon } from "../ui/Moon";
import { CARD, FIT } from "./parts";
import s from "./mocks.module.css";

export function MockRead({ title, sub, count, rows }: MockReadProps) {
  return (
    <div aria-hidden className={FIT}>
      <div className={`${s.read} my-auto flex shrink-0 flex-col overflow-hidden rounded-[16px] ${CARD}`}>
        <div className={`${s.readHead} flex shrink-0 items-center gap-2.5 border-b border-ink/[0.06] px-4 py-3`}>
          <Moon phase={4} size={15} className="text-brand" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-5 tracking-[-0.005em] text-ink">{title}</p>
            {/* The sub leads with the handle (rule 2.4.5): isolated left to right, so in RTL the "@"
                stays on the handle while the line keeps the card's alignment. */}
            {sub && <p className="truncate text-[11px] leading-4 text-ink/60"><bdi dir="ltr">{sub}</bdi></p>}
          </div>
          <span className="mono-data num shrink-0 text-ink/60">{count}</span>
        </div>
        <div className={s.readList}>
          <ul className="divide-y divide-ink/[0.06]">
            {rows.map((r) => (
              <li key={r.produces} className={s.readRow}>
                <Moon phase={4} size={15} className="text-ink" />
                <span className="truncate font-mono text-[10px] font-medium uppercase leading-4 tracking-[0.08em] text-ink/60">{r.agent}</span>
                <span className="truncate text-[12px] leading-4 text-ink/88">{r.produces}</span>
              </li>
            ))}
          </ul>
          <span className={s.readFade} />
        </div>
      </div>
    </div>
  );
}
