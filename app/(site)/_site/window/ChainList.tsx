"use client";
/* The read and build rows (SPEC §5.2.3).

   Page: a header (a progress glyph, the roster title and its counter), the read rows (4, then 9 as the
   read finds more to do), then the fold: the rows collapse into the header, which becomes the summary
   row (a full moon, the title, 9/9 and the read's own time). Then the build header and its rows. One lilac
   highlight glides to the working row and stretches over two rows when two agents work in parallel
   (brands: creators and safety).

   Below 1024 the list is a viewport of the header plus five rows, and it slides so the working row
   sits in the fourth slot. Every position is derived from the frame's state and the row heights in
   window.module.css (the same numbers are mirrored here for the slide), never measured, so a fold or
   an unfold and the slide always agree.

   Compact (the promo thumbnail): the last four rows of the read, sliding up as rows start. */
import { useEffect, useRef, type CSSProperties } from "react";
import { Moon } from "../ui/Moon";
import type { Phase } from "../contracts";
import type { Schedule, Snap } from "./useRun";
import { ChainRow } from "./ChainRow";
import s from "./window.module.css";

/* Below 1024 (window.module.css .list): row 48, read header 48 (one row, so the slide always lands on
   row boundaries), summary 48, divider 8, build header 40 (summary + divider + header = two rows),
   viewport = header + 5 rows. */
const NARROW = { row: 48, rh: 48, sum: 48, gap: 8, bh: 40 } as const;
/** A run header's glyph: its progress, round(4·done/total), so it is full when the run lands. */
const progress = (done: number, total: number): Phase => (total > 0 ? Math.round((4 * done) / total) : 0) as Phase;
/** Compact: 34px rows, four at a time. */
const C_ROW = 34;

export interface ChainListProps {
  s: Schedule;
  snap: Snap;
  live: boolean;
  variant?: "page" | "compact";
}

function useWas<T>(v: T): T | undefined {
  const r = useRef<T>();
  const prev = r.current;
  useEffect(() => { r.current = v; });
  return prev;
}

export function ChainList(p: ChainListProps) {
  return p.variant === "compact" ? <CompactList {...p} /> : <PageList {...p} />;
}

function PageList({ s: sch, snap, live }: ChainListProps) {
  const { read, build, folded, buildOn } = snap;
  const workingRead = read.filter((r) => r.state === "working").map((r) => r.u.i);
  const workingBuild = build.filter((r) => r.state === "working").map((r) => r.u.i);

  /* The highlight: where, and over how many rows. */
  let hl: { top: string; n: number } | null = null;
  if (!buildOn && workingRead.length) {
    const i = workingRead[0];
    hl = { top: `calc(var(--rh) + ${i} * var(--row))`, n: workingRead.length };
  } else if (buildOn && workingBuild.length) {
    const i = workingBuild[0];
    hl = { top: `calc(var(--sum) + var(--gap) + var(--bh) + ${i} * var(--row))`, n: workingBuild.length };
  }
  /* Appearing from nowhere jumps into place; only a move between rows glides. */
  const wasOn = useWas(hl !== null);
  const jump = hl !== null && !wasOn;

  /* The narrow slide: keep the LAST working row at or above slot 4 (so two parallel rows both show). */
  const rh = NARROW.rh;
  const view = rh + 5 * NARROW.row;
  const slot4 = rh + 3 * NARROW.row;
  let y = 0, content = rh + snap.readTotal * NARROW.row;
  if (!buildOn && workingRead.length) {
    y = rh + workingRead[workingRead.length - 1] * NARROW.row - slot4;
  } else if (buildOn) {
    const head = NARROW.sum + NARROW.gap + NARROW.bh;
    content = head + build.length * NARROW.row;
    if (workingBuild.length) y = head + workingBuild[workingBuild.length - 1] * NARROW.row - slot4;
  }
  y = Math.max(0, Math.min(y, content - view));
  const fadeTop = y > 0;
  const fadeBottom = content - y > view + 1;

  const readCounter = `${snap.readDone}/${snap.readTotal}`;
  const buildCounter = `${snap.buildDone}/${build.length}`;

  return (
    <div
      className={s.list}
      data-a={sch.audience}
      data-folded={folded ? "1" : "0"}
      data-build={buildOn ? "1" : "0"}
      data-fade-top={fadeTop ? "1" : "0"}
      data-fade-bottom={fadeBottom ? "1" : "0"}
      style={{ "--list-y": `${-y}px` } as CSSProperties}
    >
      <div className={s.listInner}>
        <div
          className={s.hl}
          data-on={hl ? "1" : "0"}
          data-jump={jump ? "1" : "0"}
          style={hl ? ({ "--hl-top": hl.top, "--hl-n": hl.n } as CSSProperties) : undefined}
        />

        {/* The read header, which folds into the summary row. */}
        <div className={s.readHead}>
          <span className={s.headGlyph}><Moon phase={progress(snap.readDone, snap.readTotal)} size={15} /></span>
          <span className={s.headTitle}>
            <span className={s.headTitleText}>{sch.readTitle}</span>
            {sch.readSub && <span className={s.headSub} dir="auto">{sch.readSub}</span>}
          </span>
          <span className={s.headMeta} dir="ltr">
            <span className={`${s.headCount} mono-data num`}>{readCounter}</span>
            <span className={s.headTime}><span className="mono-data num">{sch.totalText}</span></span>
          </span>
        </div>

        <div className={s.readRows}>
          {read.map((r) => (
            <ChainRow
              key={r.u.key}
              row={r}
              live={live}
              k={Math.max(0, r.u.i - (sch.sizes[0]?.total ?? 0))}
              hidden={folded || !r.shown}
            />
          ))}
        </div>

        {/* The build: a hairline, its header, its rows. */}
        <div className={s.buildHead} data-on={buildOn ? "1" : "0"}>
          <div className={s.buildRule} />
          <div className={s.buildHeadRow}>
            <span className={s.headGlyph}><Moon phase={progress(snap.buildDone, build.length)} size={15} /></span>
            <span className={s.headTitle}><span className={s.headTitleText}>{sch.buildTitle}</span></span>
            <span className={s.headMeta} dir="ltr"><span className={`${s.headCount} mono-data num`}>{buildCounter}</span></span>
          </div>
        </div>
        <div className={s.buildRows}>
          {build.map((r) => (
            <ChainRow key={r.u.key} row={r} live={live} k={r.u.i} hidden={!buildOn} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── compact: the last four rows of the read ── */
function CompactList({ snap, live }: ChainListProps) {
  const { read } = snap;
  let front = -1;
  read.forEach((r) => { if (r.state !== "waiting") front = r.u.i; });
  const first = Math.max(0, Math.min(front, snap.readTotal - 1) - 3);
  return (
    <div className={s.cList} data-folded={snap.folded ? "1" : "0"}>
      <div className={s.cListInner} style={{ "--c-y": `${-first * C_ROW}px` } as CSSProperties}>
        {read.map((r) => (
          <ChainRow key={r.u.key} row={r} live={live} variant="compact" hidden={!r.shown} />
        ))}
      </div>
    </div>
  );
}
