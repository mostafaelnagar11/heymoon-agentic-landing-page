"use client";

/* The log of what the agents did on their own, as a table rather than
 * as five essays.
 *
 * What this replaces: a card per entry, each carrying the title, the
 * agent, the permission, a "Why" paragraph, a "What changed" paragraph
 * and an undo — six lines of equal weight, five times over. In a panel
 * that is a log you read once. In the dashboard column it is the one
 * screen a brand opens in a hurry, to answer two questions: what did
 * you do behind my back, and can I take it back. So the row states the
 * agent, the act, when, and the undo — and everything that explains it
 * sits behind "Why", one press away and closed until asked for.
 *
 * The stat row at the top is the product's claim in three figures, and
 * the third is the one that matters: money moved without asking, which
 * is zero, permanently, because it is not a setting.
 */

import { useEffect, useState } from "react";
import { ArrowClockwise, ArrowCounterClockwise, ArrowRight, LockSimple, Sliders } from "@phosphor-icons/react";
import { Pill } from "../ui";
import {
  redoActivity, undoActivity, useActivity, useAutonomy,
  type ActivityEntry, type AutonomyLevel,
} from "../../lib/store";
import { useGo } from "../../lib/surface";
import { Detail, Section, Surface, Tile } from "./kit";

/** Which of the seven agents did it. The field is on the log entries
    themselves; an entry without one still renders, because a missing
    attribution is a gap in the data rather than a reason to drop the
    row. */
const agentOf = (a: ActivityEntry): string | null => {
  const v = (a as ActivityEntry & { agent?: unknown }).agent;
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};

/* A column, not a sentence: "41m", not "41 minutes ago".

   `now` is passed in rather than read from the clock, because this runs
   during render: the server stamps one time into the HTML, the client
   stamps another a beat later, and React reports the mismatch. It is
   also the rule this codebase holds everywhere else, that nothing
   deterministic calls Date.now. The caller reads the clock once, in an
   effect, after hydration. */
const ago = (ts: number, now: number) => {
  const m = Math.round((now - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

const LEVEL_WORD: Record<AutonomyLevel, string> = {
  alone: "On its own",
  ask: "Asks first",
  never: "Never",
};

export function ActivityView() {
  /* Read once after mount, never during render. Zero until then, which
     renders every row as "just now" for one frame rather than as a
     time the server and the browser disagree about. */
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); }, []);

  const go = useGo();
  const activity = useActivity();
  const autonomy = useAutonomy();
  const ruleOf = (k: string) => autonomy.find((r) => r.key === k);

  /* Newest first, stated rather than assumed — the log is the one list
     where the order is the information. */
  const rows = [...activity].sort((a, b) => b.at - a.at);

  const undoneCount = rows.filter((a) => a.undone).length;
  const reversible = rows.filter((a) => a.undoable && !a.undone).length;
  const agents = new Set(rows.map(agentOf).filter(Boolean)).size;
  /* The three limits no level of trust turns on. Read from the rules
     themselves, so the log cannot claim a lock the settings do not
     hold. */
  const locked = autonomy.filter((r) => r.locked);

  return (
    <div className="max-w-[880px] space-y-6">
      {/* One figure, which is the one the page is about.

          "Money moved · $0 · never, and not a setting" was a constant
          dressed as a metric: it cannot ever read anything else, so it
          measured nothing, and the Fixed limits row immediately below
          makes the same promise from the actual rules rather than from
          a hardcoded zero. The undo counts fold into the line under the
          figure, because they are about the same log and were two more
          tiles to read to learn one thing. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          tone="hero"
          label="Done on its own"
          value={rows.length}
          sub={agents ? `by ${agents} agents` : "logged here"}
        />
        <Tile
          label="Undone by you"
          value={undoneCount}
          sub={`${reversible} can be undone`}
        />
      </div>

      {/* The fixed limits, kept where they were: above the log, not in a
          settings screen nobody opens. */}
      <Surface className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-faint">
          <LockSimple size={12} weight="fill" className="text-brand" aria-hidden />
          Never
        </span>
        {/* One line: the three things no agent may do. The explanation went; "Never" is the explanation. */}
        <span className="text-meta text-ink-soft">{locked.map((r) => r.label.toLowerCase()).join(" · ")}</span>
        </div>
      </Surface>

      <Section
        title="Log"
        aside={
          <button
            onClick={() => go("autonomy")}
            className="inline-flex items-center gap-1.5 rounded-control border border-hairline bg-white px-3 py-1.5 text-meta font-semibold text-ink-soft transition hover:bg-wash"
          >
            <Sliders size={12} weight="bold" aria-hidden /> Permissions
          </button>
        }
      >
        {/* A list of cards, one under the other (12 Nov: "activity should be a list of cards not a grid"), the same
            shape as the creator's log: who, when and the undo on the card, the reasoning one press away. */}
        {rows.length === 0 ? (
          <Surface className="px-4 py-10 text-center">
            <p className="text-body text-ink-soft">Nothing yet. Anything I do on my own shows up here first.</p>
          </Surface>
        ) : (
          <ol className="flex flex-col gap-3">
            {rows.map((a) => {
              const rule = ruleOf(a.ruleKey);
              const agent = agentOf(a);
              return (
                <li key={a.id} className={`glass p-4 transition ${a.undone ? "opacity-70" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        {agent && <Pill tone={a.undone ? "muted" : "brand"}>{agent}</Pill>}
                        <span className="text-meta tabular-nums text-ink-faint">{ago(a.at, now)}</span>
                        {a.undone && <span className="text-meta font-semibold text-danger">Undone</span>}
                      </div>
                      <p className={`mt-2 text-body font-semibold ${a.undone ? "text-ink-faint line-through" : "text-ink"}`}>{a.title}</p>
                      {rule && <p className="mt-0.5 text-meta text-ink-faint">Allowed by “{rule.label}”</p>}
                      <div className="mt-2">
                        <Detail summary="Why">
                          <p>{a.because}</p>
                          <p className="mt-2 rounded-control bg-rail px-3 py-2">
                            <span className="font-medium text-ink">What changed: </span>
                            {a.effect}
                          </p>
                          {rule && (
                            <p className="mt-2">
                              <span className="font-medium text-ink">Permission: </span>
                              {rule.label}. {LEVEL_WORD[rule.level]}
                            </p>
                          )}
                          {!a.undoable && (
                            <p className="mt-2">
                              {a.undoNote ??
                                "Cannot be undone from here. Some of the held budget has already been deployed. Ask me in the conversation and I will lay out what reversing it would cost."}
                            </p>
                          )}
                          {rule && (
                            <button
                              onClick={() => go("autonomy")}
                              className="mt-2 inline-flex items-center gap-1 text-meta font-semibold text-brand hover:underline"
                            >
                              Stop me doing this
                              <ArrowRight size={11} weight="bold" aria-hidden className="rtl:rotate-180" />
                            </button>
                          )}
                        </Detail>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {a.undoable ? (
                        a.undone ? (
                          <button onClick={() => redoActivity(a.id)} className="btn-soft inline-flex h-8 items-center gap-1.5 rounded-pill px-3.5 text-meta font-semibold">
                            <ArrowClockwise size={12} weight="bold" aria-hidden /> Redo
                          </button>
                        ) : (
                          <button onClick={() => undoActivity(a.id)} className="btn-soft inline-flex h-8 items-center gap-1.5 rounded-pill px-3.5 text-meta font-semibold">
                            <ArrowCounterClockwise size={12} weight="bold" aria-hidden /> Undo
                          </button>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 py-1.5 text-meta font-medium text-ink-faint">
                          <LockSimple size={11} weight="fill" aria-hidden />
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Section>
    </div>
  );
}
