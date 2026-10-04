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
import { Sparkle } from "@phosphor-icons/react";

export function AgentTurn({ children, mark = true }: { children: ReactNode; mark?: boolean }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="w-7 shrink-0">
        {mark && (
          <span className="mt-[3px] grid h-7 w-7 place-items-center rounded-full bg-main text-white">
            <Sparkle size={14} weight="fill" />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function UserTurn({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[80%] whitespace-pre-line rounded-[18px] bg-lilac px-4 py-2.5 text-body text-ink">
        {text}
      </p>
    </div>
  );
}

/** A card in the conversation. From 640px it lines up with the agent's
    prose rather than with the gutter, so a block reads as part of what
    it just said.
 *
 * IN A NARROW THREAD IT TAKES THE WHOLE COLUMN — below 512px of THREAD,
 * which is a phone, and also a tablet with the panel open beside it.
 * The indent is 28px of gutter
 * plus a 12px gap — 40px, which on a 360px phone is 11% of the width
 * gone before a card has started, and every block in the thread is a
 * card with its own padding and often a label column inside that. The
 * alignment is worth having where there is room for it; on a phone it
 * was the reason a read row's note came out 38px wide. */
export function BlockRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex @lg:gap-3">
      <span aria-hidden className="hidden w-7 shrink-0 @lg:block" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
