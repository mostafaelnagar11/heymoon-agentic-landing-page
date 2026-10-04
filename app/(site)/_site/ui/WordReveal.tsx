"use client";
/* Word blur-in for section H2s and chips (SPEC §5.0.10). Splits on spaces, keeping them; words are
   the smallest split (rule 2.4.5). Once, at 60% in view. Keep it to 20 words at most. */
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
    <Tag ref={ref} id={id} className={`${s.root} ${className}`}>
      {parts.map((p, k) =>
        /^\s+$/.test(p) || p === "" ? p : (
          <span key={k} className={s.word} style={{ "--i": i++ } as React.CSSProperties}>{p}</span>
        ),
      )}
    </Tag>
  );
}
