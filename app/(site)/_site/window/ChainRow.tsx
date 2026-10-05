"use client";
/* One row of an agent run (SPEC §5.2.3): the moon glyph, the agent in Geist Mono caps, and the
   product's own words: `note` while waiting and working, then `produces` once it lands. Rows never
   show read values. The state lives in data-state; every change is a CSS transition (window.module.css),
   so a row costs no JS between marks.

   A read row the read has not reached yet (rows 5 to 9 before the read finds them) holds its place as
   a skeleton: two bars the width of its own words, and a faint glyph. When the read finds it, the row
   cross-fades in (40ms a row), so the list is whole from the first frame and never grows. */
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
  /** Page read rows only: true while the read has not found this unit yet; undefined for rows that
      are never skeletons (no skeleton bars are rendered). */
  skeleton?: boolean;
}

export function ChainRow({ row, live, variant = "page", k = 0, hidden = false, skeleton }: ChainRowProps) {
  const { u, state } = row;
  const working = state === "working";
  const compact = variant === "compact";
  const skel = skeleton !== undefined;
  return (
    <div className={s.rowWrap} data-shown={hidden ? "0" : "1"} style={{ "--k": k } as CSSProperties}>
      <div className={compact ? s.cRow : s.row} data-state={state} data-skel={skeleton ? "1" : "0"}>
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
        {skel && (
          <>
            <span className={`${s.skBar} ${s.skAgent}`}>{u.agent}</span>
            <span className={`${s.skBar} ${s.skText}`}>{u.note}</span>
          </>
        )}
      </div>
    </div>
  );
}
