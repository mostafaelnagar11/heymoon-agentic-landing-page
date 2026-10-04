"use client";
/* One row of an agent run (SPEC §5.2.3): the moon glyph, the agent in Geist Mono caps, and the
   product's own words: `note` while waiting and working, then `produces` once it lands. Rows never
   show read values. The state lives in data-state; every change is a CSS transition (window.module.css),
   so a row costs no JS between marks. */
import type { CSSProperties } from "react";
import { Moon } from "../ui/Moon";
import type { RowSnap } from "./useRun";
import s from "./window.module.css";

export interface ChainRowProps {
  row: RowSnap;
  /** The window is playing: a working glyph cycles. Paused, it holds the static working phase. */
  live: boolean;
  variant?: "page" | "compact";
  /** Stagger index for the unfold (40ms a row). */
  k?: number;
  /** Collapsed (folded away, or beyond the read's current size). */
  hidden?: boolean;
}

export function ChainRow({ row, live, variant = "page", k = 0, hidden = false }: ChainRowProps) {
  const { u, state } = row;
  const working = state === "working";
  const compact = variant === "compact";
  return (
    <div className={s.rowWrap} data-shown={hidden ? "0" : "1"} style={{ "--k": k } as CSSProperties}>
      <div className={compact ? s.cRow : s.row} data-state={state}>
        <Moon
          phase={state === "done" ? 4 : working ? 2 : 0}
          working={working && live}
          size={compact ? 11 : 15}
          className={s.glyph}
        />
        <span className={s.agent}>{u.agent}</span>
        <span className={s.text}>
          <span className={s.note}>{u.note}</span>
          <span className={s.produces}>{u.produces}</span>
        </span>
      </div>
    </div>
  );
}
