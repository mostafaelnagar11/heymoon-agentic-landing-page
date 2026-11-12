"use client";

/* A turn in the conversation.
 *
 * The assistant does not speak from a bubble. A bubble is for a message
 * between people; what the agent produces is a document being written
 * in front of you, so it is plain prose in the column with a small mark
 * in the gutter. Consecutive assistant turns share one mark, the way a
 * speaker is named once and then just keeps talking.
 *
 * The brand does get a bubble, because their turns are short and need
 * to be findable when you scroll back. It is a tint, not a solid fill —
 * a saturated purple block reads as a system notification rather than
 * as something you said.
 */

import type { ReactNode } from "react";
import { Emblem } from "../../../../_shared/Emblem";
import { MoonLoop } from "../../../../_shared/MoonLoop";

export function AgentTurn({ children, mark = true, live = false }: {
  children: ReactNode;
  mark?: boolean;
  /** Still being written: the mark runs the brand's logo loop until the line is done. */
  live?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="w-7 shrink-0">
        {mark && (
          /* The HeyMoon emblem on the gradient disc (Mostafa, 11 Nov: "for the chat icon avatar use our heymoon
             emblem"). Pointing at it runs one lunar cycle, as everywhere the mark appears. */
          <span className="mt-[2px] grid h-7 w-7 place-items-center rounded-full bg-[linear-gradient(135deg,#6848D1,#C2418B)] text-white shadow-[0_6px_14px_-6px_rgba(124,58,190,0.6)]">
            {live ? <MoonLoop size={15} /> : <Emblem size={15} />}
          </span>
        )}
      </span>
      <div dir="auto" className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function UserTurn({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p dir="auto" className="grad-ws max-w-[80%] whitespace-pre-line rounded-[20px] rounded-ee-md px-4 py-2.5 text-prose text-ink shadow-[inset_0_0_0_1px_rgba(77,47,176,0.07)]">
        {text}
      </p>
    </div>
  );
}

/** A card in the conversation. It lines up with the agent's prose rather
    than with the gutter, so a block reads as part of what it just said. */
export function BlockRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="w-7 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** A finished agent message. Lines that start with "• " are drawn as a list (the explainer before the plan, the
    answers that list things), so they read as points rather than as a paragraph with dots in it; everything else is
    the message as written. The words are never changed, only how a bullet is drawn. */
export function AgentProse({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const bullet = /^\s*[•·-]\s+/.test(line);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      const item = line.replace(/^\s*[•·-]\s+/, "");
      if (last?.list) last.lines.push(item); else blocks.push({ list: true, lines: [item] });
    } else if (last && !last.list) last.lines.push(line);
    else blocks.push({ list: false, lines: [line] });
  }
  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.list ? (
          <ul key={i} className="space-y-2 rounded-[18px] bg-white/70 px-4 py-3.5 ring-1 ring-brand/[0.07]">
            {b.lines.map((l) => (
              <li key={l} className="flex gap-3 text-prose text-ink">
                <span aria-hidden className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-[linear-gradient(135deg,#6848D1,#C2418B)]" />
                <span className="min-w-0">{l}</span>
              </li>
            ))}
          </ul>
        ) : (
          b.lines.join("\n").trim() && <p key={i} className="whitespace-pre-line text-prose text-ink">{b.lines.join("\n").trim()}</p>
        ),
      )}
    </div>
  );
}
