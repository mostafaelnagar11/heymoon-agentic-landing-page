"use client";

/* A · Catch me up (Mostafa picked it, 20 Oct). The Dashboard opens with what changed since the brand was last here,
   written from the live figures, each line with its one action: the sales and where they came from, the drafts
   waiting and the approval in one press, the last thing an agent did with its undo, and the phase that is ready.
   The arithmetic is lib/agent/moves (catchUp); the presses go through HeyMoon's `run`, so an approval is still a
   request the brand confirms. */

import { useEffect, useRef, useState } from "react";
import { Lightning, Sparkle } from "@phosphor-icons/react";
import { catchUp, type MoveAction } from "../../lib/agent/moves";
import { useActiveCampaign, useActivity, useAds, useLivePhase, useReadyPhase } from "../../lib/store";
import { useHeyMoon } from "./HeyMoon";

const VISIT_KEY = "mtab_last_visit";
/* What each phase had sold when the brand last looked, so "In sales" is the real change since then, not an estimate. */
const SEEN_KEY = "mtab_seen_sales";
const DAY = 86_400_000;

/* This browser's previous visit to the dashboard, read once per page load and then moved to now. Shared, so the
   greeting and the catch-up agree on it whichever reads first. Client-only: call it after mount. */
let previousVisit: number | null = null;
export function lastVisit(): number {
  if (previousVisit === null) {
    let prev = 0;
    try { prev = Number(localStorage.getItem(VISIT_KEY)) || 0; localStorage.setItem(VISIT_KEY, String(Date.now())); } catch {}
    previousVisit = prev;
  }
  return previousVisit;
}
/** Back after more than an hour away. A reload, or the first visit, is not "back". */
export const isReturning = (prev: number, now: number) => !!prev && now - prev > 3_600_000;

/* "Since Tuesday, 4:12 pm" from the last visit. A first visit, or one within the hour, reads the last three days
   instead: there is nothing "since" to speak of. Either window, when it reaches back past the launch, is the whole
   phase and says so: "Last 3 days" on a phase that went live this morning claimed days it was not live for. */
function useSince(liveAt: number | null): { days: number; label: string; returning: boolean; all: boolean } {
  const [since, setSince] = useState({ days: 3, label: "Last 3 days", returning: false, all: false });
  useEffect(() => {
    const now = Date.now();
    const prev = lastVisit();
    const returning = isReturning(prev, now);
    const from = returning ? prev : now - 3 * DAY;
    if (liveAt && liveAt >= from) {
      setSince({ days: Math.max(1 / 24, (now - liveAt) / DAY), label: "Since launch", returning, all: true });
      return;
    }
    if (returning) {
      const d = new Date(prev);
      const day = d.toLocaleDateString("en-GB", { weekday: "long" });
      const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
      setSince({ days: Math.min(14, (now - prev) / DAY), label: `Since ${day}, ${time}`, returning: true, all: false });
    }
  }, [liveAt]);
  return since;
}

export function CatchUp() {
  const { run } = useHeyMoon();
  const ads = useAds();
  const activity = useActivity();
  const phase = useLivePhase();
  const ready = useReadyPhase();
  const liveAt = useActiveCampaign()?.launch?.liveAt ?? null;
  const since = useSince(liveAt);

  /* The sales this brand saw last time, read once before this visit overwrites them. */
  const seenBefore = useRef<Record<string, number> | null>(null);
  const [seenReady, setSeenReady] = useState(false);
  useEffect(() => {
    try { seenBefore.current = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}"); } catch { seenBefore.current = {}; }
    setSeenReady(true);
  }, []);
  useEffect(() => {
    if (!seenReady || !phase) return;
    try {
      const now = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}");
      localStorage.setItem(SEEN_KEY, JSON.stringify({ ...now, [phase.id]: phase.rev }));
    } catch {}
  }, [seenReady, phase?.id, phase?.rev]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Since the last visit: exactly what was added, when the last visit saw this phase; all of it, when the phase is
     younger than the gap and was never seen; otherwise (a first visit to an older phase) the estimate. */
  const seen = phase && seenBefore.current ? seenBefore.current[phase.id] : undefined;
  const sales =
    !phase ? undefined
    : since.all ? phase.rev
    : !since.returning ? undefined
    : seen !== undefined ? Math.max(0, phase.rev - seen)
    : (phase.dayOfPhase ?? 0) <= Math.ceil(since.days) ? phase.rev
    : undefined;
  const { rows, ready: readyRow } = catchUp({ phase, ready, ads, activity, days: since.days, sales });
  if (!rows.length && !readyRow) return null;

  const btn = (a: MoveAction, primary: boolean) => (
    <button
      key={a.label}
      type="button"
      onClick={() => run(a)}
      className={`inline-flex h-8 shrink-0 items-center rounded-pill px-3.5 text-meta font-semibold transition ${
        primary ? "g-button border border-white/50 text-[#FBF8FE]" : "text-ink-60 hover:bg-black/[0.04] hover:text-ink"
      }`}
    >
      {a.label}
    </button>
  );

  return (
    <section
      aria-label="Catch me up"
      className="rounded-tile border border-brand/25 bg-white px-5 pb-4 pt-4 shadow-card ring-4 ring-brand/[0.05]"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
          <Sparkle size={11} weight="fill" />
        </span>
        <h2 className="text-body font-semibold text-main">{since.label}</h2>
      </div>

      <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 border-t border-hairline py-3 sm:flex-row sm:items-center sm:gap-5">
            <span className="num w-[92px] shrink-0 text-[24px] font-semibold tracking-[-0.02em] text-main">{r.figure}</span>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{r.title}</p>
              <p className="text-meta text-ink-soft">{r.detail}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* The last action leads, unless it is an undo or a why: those are offered, not pushed. */}
              {r.actions.map((a, i) => btn(a, i === r.actions.length - 1 && a.do !== "undo" && a.do !== "why"))}
            </div>
          </li>
        ))}
      </ul>

      {readyRow && (
        <div className="mt-1 flex flex-wrap items-center gap-3 rounded-control bg-lilac px-4 py-3">
          <Lightning size={15} weight="fill" aria-hidden className="text-amber-600" />
          <p className="min-w-0 flex-1 text-meta">
            <span className="font-semibold text-ink">{readyRow.title}</span>
            <span className="text-ink-soft"> · {readyRow.detail}</span>
          </p>
          {readyRow.actions.map((a) => btn(a, true))}
        </div>
      )}
    </section>
  );
}
