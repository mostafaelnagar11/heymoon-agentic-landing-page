/* What HeyMoon would do next, said where the work is.

   The brand team's review (15 Oct) on the assistant rail beside the dashboard: "you will see a chat on the side of
   that dashboard… People didn't use it much… you can go chat with ChatGPT at the end of the day… We want to invent
   the new agentic workflows that actually will help the brands in their work, not just a side chat." So the agents
   stop waiting to be asked. Each page carries the few moves they would make right now, worked out from the same
   figures the page shows, each one a press away; the panel only opens to show something or to answer.

   Pure: state in, moves out. The rules from the rest of the product hold here too. Nothing a move does moves money
   or publishes: "Approve the 4" prepares the request and the brand presses it, "Start Phase 3" opens the phase
   where the Start button is, and an agent's own action can always be undone. */

import type { Phase } from "../mock/campaigns";
import { fmtUSD, phaseTitle, UNLOCK_AT } from "../mock/campaigns";
import type { AdRecord } from "./types";
import type { DashboardView } from "./dashboard";

export type MoveAction =
  /** Prepare an approval for the drafts the agent cleared. The brand confirms it. */
  | { label: string; do: "approve-cleared"; adIds: string[] }
  | { label: string; do: "open"; view: DashboardView }
  | { label: string; do: "open-phase"; phaseId: string }
  | { label: string; do: "undo"; activityId: string; title: string }
  /** Open the panel with the reasoning, for the brand who wants it. */
  | { label: string; do: "why"; q: string; say: string };

export interface Move {
  id: string;
  /** Which agent is proposing it. A move nobody owns is a move a brand cannot question. */
  agent: string;
  text: string;
  tone: "money" | "work" | "done";
  primary: MoveAction;
  secondary?: MoveAction;
}

interface ActivityLike {
  id: string;
  agent: string;
  title: string;
  because: string;
  effect: string;
  undone: boolean;
  undoable: boolean;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function nextMoves(i: {
  ads: AdRecord[];
  live: Phase | null;
  ready: Phase | null;
  activity: ActivityLike[];
}): Move[] {
  const out: Move[] = [];
  const waiting = i.ads.filter((a) => a.state === "waiting");
  const held = waiting.filter((a) => a.compliance.verdict === "hold");
  const cleared = waiting.filter((a) => a.compliance.verdict !== "hold");
  const unlock = Math.round(UNLOCK_AT * 100);

  /* Money first: a phase that is unlocked and not started is the ladder not climbing. */
  if (i.ready) {
    const r = i.ready;
    out.push({
      id: "fund",
      agent: "MoonScore AI",
      tone: "money",
      text:
        `${i.live ? `${phaseTitle(i.live.phaseNo)} crossed ${unlock}% of its target. ` : ""}` +
        `${phaseTitle(r.phaseNo)} is ready: ${fmtUSD(r.budget)} at ${r.guaranteedRoas}x, ` +
        `${fmtUSD(Math.round(r.budget * r.guaranteedRoas))} guaranteed. Starting it is yours.`,
      primary: { label: `See ${phaseTitle(r.phaseNo).split(" · ")[0]}`, do: "open-phase", phaseId: r.id },
    });
  }

  /* The drafts the agent would approve, ready to approve in one press (which prepares, never publishes). */
  if (cleared.length) {
    out.push({
      id: "approve",
      agent: "MoonWriter AI",
      tone: "work",
      text:
        `${cleared.length} ${plural(cleared.length, "draft is", "drafts are")} on brief. I checked ` +
        `${plural(cleared.length, "it", "each one")} against the brief I wrote, and approving is the fastest sales left in this phase.`,
      primary: { label: `Approve the ${cleared.length}`, do: "approve-cleared", adIds: cleared.map((a) => a.id) },
      secondary: { label: "Review them", do: "open", view: "ads" },
    });
  }

  if (held.length) {
    const first = held[0];
    out.push({
      id: "held",
      agent: "MoonWriter AI",
      tone: "work",
      text:
        `${held.length} ${plural(held.length, "draft misses", "drafts miss")} the brief, so I would hold ` +
        `${plural(held.length, "it", "them")} rather than approve. Deciding now gets a re-cut back inside the review window.`,
      primary: { label: "Decide", do: "open", view: "inbox" },
      secondary: {
        label: "Why",
        do: "why",
        q: `Why hold ${first.creatorName}'s draft?`,
        say: first.compliance.reasoning.value,
      },
    });
  }

  /* The newest thing an agent did on its own, with the undo beside it rather than three pages away. */
  const last = i.activity.find((a) => !a.undone && a.undoable);
  if (last) {
    out.push({
      id: `act-${last.id}`,
      agent: last.agent,
      tone: "done",
      text: `${last.title}. ${last.because}`,
      primary: { label: "Undo", do: "undo", activityId: last.id, title: last.title },
      secondary: { label: "All I did", do: "open", view: "activity" },
    });
  }

  return out.slice(0, 3);
}
