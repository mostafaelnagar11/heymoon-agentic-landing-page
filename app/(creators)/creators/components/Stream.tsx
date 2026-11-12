"use client";

/* What a stream looks like while it is open.

   Deliberately NOT a progress bar. A bar implies a known end, and the
   agent does not know one — `total` is the work it has discovered so
   far and it grows. So this shows the note and a count, and nothing
   else: this line reports, it does not offer.

   Stopping lives in the message box, on the send button, the way every
   chat people already use does it. It used to live here, beside the
   line — which meant the way out scrolled down the page as the work
   went on, and a brand had to find it again each time they looked.
   Cancelling is still never destructive: stopping keeps everything
   that arrived. */

import { MoonLoop } from "../../../_shared/MoonLoop";
import { useEffect, useRef, useState } from "react";
import type { StreamStatus } from "../lib/agent/useStream";

export function WorkingLine({
  note, done, total, status, className = "",
}: {
  note: string;
  done: number;
  total: number;
  status: StreamStatus;
  className?: string;
}) {
  if (status === "idle") return null;

  if (status === "cancelled") {
    return (
      <div className={`glass flex flex-wrap items-center gap-3 !rounded-[16px] px-4 py-2.5 ${className}`}>
        <p className="flex-1 text-meta text-ink-60">
          Stopped after {done} of {total}. Everything found so far is below and still usable.
        </p>
      </div>
    );
  }

  if (status === "done") return null;

  /* The brand's working line exactly (12 Nov: "every component in the creator should act similar to its similar one
     in the brand"): a frosted pill, the count in a chip, and how far as a line along its foot. */
  return (
    <div aria-live="polite" className={`glass relative overflow-hidden !rounded-[16px] px-4 py-2.5 ${className}`}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="working-ring h-3.5 w-3.5 shrink-0" />
        <p className="min-w-0 flex-1 truncate text-meta font-semibold text-main">{note || "Working"}</p>
        <span className="num shrink-0 rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold text-main">
          {done}/{total}
        </span>
      </div>
      {/* How far, as a line along the foot of the pill: units done of units found, never a percentage claimed. */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-main/[0.06]">
        <span
          className="block h-full bg-[linear-gradient(90deg,#6848D1,#A65FED,#F4A8D8)] transition-[width] duration-500"
          style={{ width: `${total ? Math.min(100, (done / total) * 100) : 0}%` }}
        />
      </span>
    </div>
  );
}

/** A line of text that is still arriving. */
export function StreamText({ text, streaming, className = "" }: { text: string; streaming?: boolean; className?: string }) {
  return (
    <p className={`whitespace-pre-line text-body text-ink ${streaming ? "stream-caret" : ""} ${className}`}>{text}</p>
  );
}

/* ------------------------------------------------------------------ */
/* Typing                                                              */
/*                                                                     */
/* The agent's prose arrives the way it is produced — a few words at a  */
/* time — rather than landing complete. This is not decoration: text    */
/* from a model does arrive incrementally, and a wall of finished       */
/* paragraph hides the fact that anything was working.                  */
/*                                                                      */
/* It types ONCE. A message that has finished is marked done by the     */
/* caller, so scrolling back through the conversation does not set the  */
/* whole history retyping.                                              */
/* ------------------------------------------------------------------ */

/* How fast the agent appears to write.
 *
 * One number, because "slower" should be one edit rather than three
 * magic pairs. Around 11 words a second reads like someone composing a
 * sentence; past 30 it stops looking like writing and starts looking
 * like a paste, which is the thing the typing was there to avoid.
 *
 * The cap matters as much as the rate. A 200-word answer at 11 words a
 * second is eighteen seconds of watching, so beyond the cap the agent
 * writes more words per tick instead of taking longer — it keeps the
 * texture of typing without holding the brand hostage to it.
 */
const WORDS_PER_SECOND = 11;
const LONGEST_MESSAGE_MS = 6000;

function pace(words: number) {
  const oneWordMs = 1000 / WORDS_PER_SECOND;
  /* Counted in ticks rather than derived from a duration: dividing a
     duration back by the same rate loses a tick to floating point, and
     a short message would then arrive two words at a time. */
  const mostTicks = Math.floor(LONGEST_MESSAGE_MS / oneWordMs);
  const ticks = Math.max(1, Math.min(words, mostTicks));
  return { per: Math.max(1, Math.ceil(words / ticks)), ms: Math.round(oneWordMs) };
}

export function Typed({
  text, onTick, onDone, className = "",
}: {
  text: string;
  /** Passed to the line, for a place that sets its own size (the opening line of a fresh conversation). */
  className?: string;
  /** Fires as the text grows, so the thread can keep the scroll pinned. */
  onTick?: () => void;
  onDone?: () => void;
}) {
  const words = text.split(/(\s+)/);
  const wordCount = text.trim().split(/\s+/).length;
  const [n, setN] = useState(0);
  const reported = useRef(false);

  /* Advance the index on a timer. Nothing else happens in here — the
     parent callbacks fire from the effect below, once the new index has
     committed, so a child never sets parent state during its own render. */
  useEffect(() => {
    const { per, ms } = pace(wordCount);
    const id = setInterval(() => {
      setN((prev) => {
        const next = prev + per * 2; // *2 because the split keeps whitespace
        if (next >= words.length) { clearInterval(id); return words.length; }
        return next;
      });
    }, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (n === 0) return;
    if (n >= words.length) {
      if (!reported.current) { reported.current = true; onDone?.(); }
    } else {
      onTick?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const shown = words.slice(0, n).join("");
  const typing = n < words.length;

  return (
    /* The brand's reading size, 15/26 (its `text-prose`; this config has no such key). */
    <p className={`whitespace-pre-line text-[15px] leading-[26px] text-ink ${typing ? "stream-caret" : ""} ${className}`}>
      {shown}
    </p>
  );
}

/** The agent is composing. Three dots, and nothing claimed about how
    long it will take. */
export function Thinking() {
  return (
    <div className="flex items-start gap-3">
      {/* The agent's mark, running the brand's logo loop while it composes. */}
      <span aria-hidden className="mt-[2px] grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#6848D1,#C2418B)] text-white shadow-[0_6px_14px_-6px_rgba(124,58,190,0.6)]">
        <MoonLoop size={15} />
      </span>
      <span className="glass flex h-8 items-center gap-1 !rounded-full px-3" role="status" aria-label="HeyMoon is replying">
        {[0, 160, 320].map((d) => (
          <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-orchid/60" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    </div>
  );
}
