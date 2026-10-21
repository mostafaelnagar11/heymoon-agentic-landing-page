/* The assistant that sits beside a RUNNING campaign.

   A different agent from the one at `/c`, on purpose. That one knows a
   store and builds a campaign from it, and its job is finished the
   moment the store is connected. This one knows a phase in flight:
   what has been attributed, what is waiting on approval, what the
   agents did on their own overnight.

   It obeys the same two rules as the builder, and they are what make
   it safe to put a text box next to live money:

     1. Nothing irreversible happens in here. Asking it to approve
        every waiting draft produces a REQUEST, which the brand
        confirms with a press. The assistant cannot publish, cannot
        move money and cannot sign.
     2. Every number it says traces back to the same `Sourced` figures
        the panels render. It never computes a second version of a
        figure that is already on screen.

   `interpretDashboard` is regexes, and says so. Swap in a model and
   this file is the only thing that changes: the panel talks to
   `DashboardIntent` and nothing else. */

import type { Phase } from "../mock/campaigns";
import { fmtUSD, pace, phaseTitle } from "../mock/campaigns";
import type { AdRecord } from "./types";

/** The five things the dashboard can show. Mirrors the panel keys so
    an intent can be handed straight to the view switcher. */
export type DashboardView =
  | "home" | "campaign" | "creators" | "inbox" | "ads" | "activity"
  /* "autonomy" is kept as a key even though the rail no longer offers
     it: the activity log and the inbox both link straight to a rule,
     and settings is where that rule now lives. Both keys open the same
     page; autonomy scrolls it to the table. */
  | "autonomy" | "settings"
  /* Settings on its Business profile tab: where the launch tracker's profile step is done (21 Oct). */
  | "business";

export type DashboardIntent =
  /** Open a view. The assistant answers in a sentence and the page moves. */
  | { kind: "open"; view: DashboardView; say: string }
  /** Answer a question in prose, from figures already on screen. */
  | { kind: "answer"; say: string }
  /** Prepare an approval. Nothing publishes until the brand presses. */
  | { kind: "approve-all"; say: string }
  /** Undo the most recent thing an agent did on its own. */
  | { kind: "undo"; say: string }
  /** Understood nothing. Says what it CAN do rather than apologising. */
  | { kind: "unknown"; say: string };

const VIEW_WORDS: { view: DashboardView; re: RegExp; say: string }[] = [
  {
    view: "creators",
    re: /\b(creators?|influencers?|talent|roster|who (are|is)|shortlist)\b/,
    say: "Everyone MoonMatch AI has brought you, with why each one was matched. A like or a pass shapes the next batch; nobody is booked or told.",
  },
  {
    view: "ads",
    re: /\b(ads?|drafts?|creatives?|approvals?|approval queue|what.s waiting|review)\b/,
    say: "Here is the queue. Every draft carries MoonWriter AI's check against the brief it wrote, and nothing goes out until you decide on it.",
  },
  {
    view: "inbox",
    re: /\b(needs me|needs you|inbox|to.?do|what should i do|what do you need|outstanding)\b/,
    say: "Everything waiting on you, ordered by what it costs to leave it: money first, then work that is blocking sales, then things that only need acknowledging.",
  },
  {
    view: "activity",
    re: /\b(activity|on your own|what did you do|autonomous|by yourself|overnight|undo)\b/,
    say: "Everything I did without asking, newest first. Each one carries the permission it used, why I did it, what changed, and an undo.",
  },
  {
    view: "autonomy",
    re: /\b(autonomy|permissions?|allowed|may you|can you do|rules|settings)\b/,
    say: "These are the agents and what each may do alone. Moving money, publishing and signing are fixed at never and cannot be turned on. Not by you, not by me.",
  },
  {
    view: "campaign",
    re: /\b(campaign|phase|dashboard|overview|home|how.s it going|how is it going|how are we doing|pace|forecast|revenue|target|performance|report|numbers)\b/,
    say: "",
  },
];

/** How the phase is doing, in the assistant's own words, from the same
    figures the monitor above it renders. */
export function paceSentence(phase: Phase | null, ads: AdRecord[]): string {
  if (!phase) return "Nothing is running yet, so there is nothing to report on.";
  const p = pace(phase);
  const waiting = ads.filter((a) => a.state === "waiting").length;
  if (!p) return `${phaseTitle(phase.phaseNo)} has not started.`;
  /* Short: the figure, where the pace takes it, and the one thing that moves it (Mostafa, 19 Oct: less words). */
  const head = `${fmtUSD(phase.rev)} of ${fmtUSD(phase.revTarget ?? 0)}, day ${phase.dayOfPhase} of ${phase.plannedDays}.`;
  const rate = `On pace for ${fmtUSD(Math.round(p.atEnd))} (${Math.round(p.pctForecast)}%).`;
  const gate = p.daysToUnlock === 0 ? "Next phase unlocked." : `${p.daysToUnlock} days to the 80% line.`;
  const you = waiting ? `\n\n${waiting} drafts wait on you. Approving them moves this most.` : "";
  return `${head} ${rate} ${gate}${you}`;
}

/** What the assistant understood. Regexes, deliberately — the same
    honest fake as the builder's `interpret`, and the same seam. */
export function interpretDashboard(i: {
  text: string;
  phase: Phase | null;
  ads: AdRecord[];
  undoable: boolean;
}): DashboardIntent {
  const lower = i.text.trim().toLowerCase();
  const waiting = i.ads.filter((a) => a.state === "waiting");

  /* Approving is the only thing here that touches the outside world,
     so it is checked first and it never completes on its own. */
  if (/\b(approve|publish|push|send)\b.*\b(all|everything|them|the drafts?|the queue)\b|\bapprove all\b|\bbatch approve\b/.test(lower)) {
    if (!waiting.length) {
      return { kind: "answer", say: "Nothing is waiting on you." };
    }
    const held = waiting.filter((a) => a.compliance.verdict === "hold").length;
    return {
      kind: "approve-all",
      say: `${waiting.length} drafts${held ? `, ${held} I'd hold` : ""}. Ready for you to approve.`,
    };
  }

  if (/\bundo\b|\bput (that|it) back\b|\brevert\b|\broll ?back\b/.test(lower)) {
    return i.undoable
      ? { kind: "undo", say: "Undone." }
      : { kind: "answer", say: "Nothing left to undo." };
  }

  /* A question about the numbers is answered rather than navigated to.
     Checked before the view words, because "how is it going" contains
     none of them and "revenue" would otherwise just open a tab. */
  if (/\bhow (is|are|.s)\b|\bhow much\b|\bon track\b|\bwill (we|it)\b|\bwhat.s the (number|revenue|pace)\b|\bpace\b|\bforecast\b|\bon pace\b/.test(lower)) {
    return { kind: "answer", say: paceSentence(i.phase, i.ads) };
  }

  for (const v of VIEW_WORDS) {
    if (!v.re.test(lower)) continue;
    if (v.view === "campaign") {
      return { kind: "open", view: "campaign", say: paceSentence(i.phase, i.ads) };
    }
    return { kind: "open", view: v.view, say: v.say };
  }

  return {
    kind: "unknown",
    say: "I can tell you how the phase is doing, show or approve the drafts, or undo what I did on my own.",
  };
}

/** The chips under the composer, chosen from what is actually true of
    the phase right now rather than from a fixed list. */
export function dashboardChips(phase: Phase | null, ads: AdRecord[], undoable: boolean): string[] {
  const waiting = ads.filter((a) => a.state === "waiting").length;
  const out: string[] = [];
  if (waiting) out.push("Approve all", "Show me the drafts");
  out.push(phase ? "How is it doing?" : "What happens next?");
  if (undoable) out.push("What did you do on your own?");
  return out.slice(0, 4);
}
