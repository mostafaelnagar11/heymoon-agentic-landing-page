/* MockField (SPEC §5.8, C8): the field as a visitor first meets it, a value typed and a cursor.
   url: the value, a static 1px caret, a 28px blank circle and the Start pill.
   handle: the At icon, the value, the platform squares (from data, never her accounts) and Start.
   The caret is still: a blinking cursor in a still picture of a screen is motion with nothing behind it. */
import type { MockFieldProps } from "../contracts";
import { LABELS } from "../copy";
import { At } from "../ui/icons";
import { CARD, FRAME, PlatformSquare } from "./parts";

export function MockField({ kind, value, platforms = [] }: MockFieldProps) {
  const handle = kind === "handle";
  /* Beside the At icon the value reads without its own "@", as in the real field. */
  const shown = handle ? value.replace(/^@/, "") : value;
  return (
    <div aria-hidden className={FRAME}>
      <div className={`rounded-[18px] p-5 ${CARD}`}>
        <p dir="ltr" className="flex h-7 items-center text-[19px] tracking-[-0.01em] text-ink">
          {handle && <At size={19} className="me-1.5 shrink-0 text-ink/60" aria-hidden />}
          <span className="num truncate">{shown}</span>
          <span className="ms-0.5 inline-block h-[22px] w-px shrink-0 bg-brand" />
        </p>
        <div className="mt-6 flex items-center justify-between">
          {handle ? (
            <span className="flex gap-1.5">
              {platforms.map((p) => <PlatformSquare key={p} platform={p} size={20} />)}
            </span>
          ) : (
            <span className="size-7 rounded-full bg-ink/[0.05]" />
          )}
          <span className="inline-flex h-8 items-center rounded-[9px] bg-ink px-3.5 text-[12px] font-semibold text-white">
            {handle ? LABELS.creators.start : LABELS.brands.start}
          </span>
        </div>
      </div>
    </div>
  );
}
