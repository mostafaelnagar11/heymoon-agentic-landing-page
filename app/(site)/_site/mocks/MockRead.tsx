/* MockRead (SPEC §5.8, C9): the creator read, landed. Header: the title, the sub ("@yourhandle · five
   agents") and the bound count; then the nine rows, each a full Moon, the agent in 10px mono caps and
   the label of what it found (`produces`). No read values, ever: nothing about the person who was read.
   One line per row on a wide card; the agent over the label on a narrow one (a container query).
   It sits centred where it fits and runs off a short fade where it does not (the 300px stacked mounts). */
import type { MockReadProps } from "../contracts";
import { Moon } from "../ui/Moon";
import { CARD, FIT } from "./parts";
import s from "./mocks.module.css";

export function MockRead({ title, sub, count, rows }: MockReadProps) {
  return (
    <div aria-hidden className={FIT}>
      <div className={`${s.read} my-auto shrink-0 overflow-hidden rounded-[16px] ${CARD}`}>
        <div className={`${s.readHead} flex items-center gap-2.5 border-b border-ink/[0.06] px-4 py-3`}>
          <Moon phase={4} size={15} className="text-brand" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-5 tracking-[-0.005em] text-ink">{title}</p>
            {sub && <p className="truncate text-[11px] leading-4 text-ink/60">{sub}</p>}
          </div>
          <span className="mono-data num shrink-0 text-ink/60">{count}</span>
        </div>
        <ul className="divide-y divide-ink/[0.06]">
          {rows.map((r) => (
            <li key={r.produces} className={s.readRow}>
              <Moon phase={4} size={15} className="text-ink" />
              <span className="truncate font-mono text-[10px] font-medium uppercase leading-4 tracking-[0.08em] text-ink/60">{r.agent}</span>
              <span className="truncate text-[12px] leading-4 text-ink/88">{r.produces}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
