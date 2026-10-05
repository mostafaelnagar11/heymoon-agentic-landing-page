"use client";
/* Word blur-in for section H2s and chips (SPEC §5.0.10). Splits on spaces, keeping them; words are
   the smallest split (rule 2.4.5). Once, at 60% in view. Keep it to 20 words at most.
   Each word carries data-word: check:site unwraps those spans before its badge-word rule, so a heading
   that contains "live" is not read as a "live" badge (WP3 R1, WP4 R4). */
import { useRef } from "react";
import type { WordRevealProps } from "../contracts";
import s from "./WordReveal.module.css";
import { useArmed } from "./useArmed";

export function WordReveal({ as: Tag = "h2", text, className = "", id }: WordRevealProps) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  useArmed(ref, 0.6);
  const parts = text.split(/(\s+)/);
  let i = 0;
  return (
    /* dir="auto": each word is an inline-block, and bidi orders those blocks by the paragraph's direction,
       so English copy on an rtl page read backwards (final round, RTL smoke). The heading now takes its
       direction from its own first strong letter: ltr for English, rtl for Arabic. */
    <Tag ref={ref} id={id} dir="auto" className={`${s.root} ${className}`}>
      {parts.map((p, k) =>
        /^\s+$/.test(p) || p === "" ? p : (
          <span key={k} data-word="" className={s.word} style={{ "--i": i++ } as React.CSSProperties}>{p}</span>
        ),
      )}
    </Tag>
  );
}
