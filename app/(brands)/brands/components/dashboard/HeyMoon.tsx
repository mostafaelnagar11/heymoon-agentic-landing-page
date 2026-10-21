"use client";

/* HeyMoon inside the dashboard, instead of beside it.
 *
 * It used to be a chat rail, open by default, a third column greeting the brand with a paragraph and four chips.
 * The brand team's review (15 Oct) named why that fails: "a chat on the side of that dashboard… People didn't use
 * it much… you can go chat with ChatGPT… We want to invent the new agentic workflows that actually will help the
 * brands in their work, not just a side chat." And Mostafa, 19 Oct: integrated AI inside the platform to perform
 * the AI capabilities, with the side panel opening "just to show things or reply for things".
 *
 * So there are four pieces, and the rail is the last of them:
 *
 *   On the page  the agents' work where it happens: Catch me up (CatchUp), Grow the lead (LeadMoves), Review with
 *                HeyMoon (ReviewDeck), all from lib/agent/moves and all carried out through `run` below
 *   AskBar       in the top bar, a request in words; a request to go somewhere just goes, nothing opens
 *   AskChip      on a card, the question that card raises, answered about that card
 *   HeyMoonPanel the column, closed until there is an answer to read or a request to confirm
 *
 * The rules are the old rail's and they still hold: approving is a request the brand presses, never a completion,
 * and nothing here can publish, move money or sign.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { ArrowUp, Check, Sparkle, X } from "@phosphor-icons/react";
import { dashboardChips, interpretDashboard, type DashboardView } from "../../lib/agent/dashboard";
import type { MoveAction } from "../../lib/agent/moves";
import {
  logActivity, openPhase, putApproval, setAdState, undoActivity, useActivity, useAds, useCan, useLivePhase,
} from "../../lib/store";
import { fmtUSD } from "../../lib/mock/campaigns";
import { useGo } from "../../lib/surface";
import { tools } from "../../lib/agent/tools";
import type { ApprovalRequest } from "../../lib/agent/types";
import { ApprovalBlock } from "../blocks";
import { Typed } from "../Stream";
import { useT } from "../../lib/i18n";

const VIEW_LABEL: Record<DashboardView, string> = {
  home: "Dashboard", campaign: "Campaign", creators: "Creators", inbox: "Needs you",
  ads: "Ads", activity: "Activity", autonomy: "Settings", settings: "Settings", business: "Business profile",
};

/** One thing the panel shows: what was asked (if anything), the answer, and what it prepared. */
interface Exchange {
  id: string;
  q?: string;
  say: string;
  approval?: ApprovalRequest;
}

interface Ctx {
  open: boolean;
  setOpen: (o: boolean) => void;
  exchanges: Exchange[];
  /** A request in words, from the bar, a chip or the panel's own box. */
  ask: (text: string) => void;
  /** Open the panel on something already worked out (an answer a card knows, a request a move prepared). */
  show: (e: Omit<Exchange, "id">) => void;
  /** Carry out one of the agents' moves. */
  run: (a: MoveAction) => void;
  chips: string[];
}

const HeyMoonCtx = createContext<Ctx | null>(null);
export const useHeyMoon = () => {
  const c = useContext(HeyMoonCtx);
  if (!c) throw new Error("useHeyMoon outside HeyMoonProvider");
  return c;
};

let seq = 0;
const nid = () => `hm-${seq++}`;

export function HeyMoonProvider({ children }: { children: ReactNode }) {
  const ads = useAds();
  const activity = useActivity();
  const phase = useLivePhase();
  const undoable = activity.find((a) => !a.undone && a.undoable) ?? null;
  const go = useGo();

  const [open, setOpen] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  /* The receipt for something done without opening the panel: a page moved to, an undo. It says what happened and
     goes away; it is never the place an answer lives. */
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 3600);
    return () => clearTimeout(t);
  }, [note]);

  const show = useCallback((e: Omit<Exchange, "id">) => {
    setExchanges((xs) => [...xs, { ...e, id: nid() }]);
    setOpen(true);
  }, []);

  const approve = useCallback((adIds: string[], q: string | undefined, say: string) => {
    const req = tools.request_approval({ adIds });
    putApproval(req);
    show({ q, say, approval: req });
  }, [show]);

  const ask = useCallback((raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const intent = interpretDashboard({ text: v, phase, ads, undoable: !!undoable });
    switch (intent.kind) {
      case "open":
        /* A request to go somewhere goes there. Nothing to read, so nothing opens. */
        go(intent.view);
        setNote(`Opened ${VIEW_LABEL[intent.view]}`);
        return;
      case "approve-all":
        go("ads");
        approve(ads.filter((a) => a.state === "waiting").map((a) => a.id), v, intent.say);
        return;
      case "undo":
        if (undoable) {
          undoActivity(undoable.id);
          setNote(`Undid “${undoable.title}”`);
        } else show({ q: v, say: intent.say });
        return;
      default:
        show({ q: v, say: intent.say });
    }
  }, [phase, ads, undoable, go, show, approve]);

  const canApprove = useCan("approve");
  const run = useCallback((a: MoveAction) => {
    /* Approving, re-cutting and moving budget are the owner's and admins' (store.ts, CAN). */
    if (!canApprove && (a.do === "approve-cleared" || a.do === "recut" || a.do === "rebalance" || a.do === "undo")) {
      setNote("Only the owner or an admin can do that");
      return;
    }
    switch (a.do) {
      case "approve-cleared":
        approve(
          a.adIds, undefined,
          `These ${a.adIds.length} are on brief. Press to approve.`
        );
        return;
      case "open":
        go(a.view);
        return;
      case "open-phase":
        openPhase(a.phaseId);
        go("campaign");
        return;
      case "undo":
        undoActivity(a.activityId);
        setNote(`Undid “${a.title}”`);
        return;
      case "recut":
        /* The existing decline-with-a-reason: it never publishes, and the creator gets the note to re-cut it. */
        setAdState(a.adId, "declined", a.note);
        setNote(`Note sent to ${a.creator}`);
        return;
      case "rebalance": {
        const at = Date.now();
        logActivity({
          id: `act-lead-${at}`, at, ruleKey: "rebalance", agent: "MoonScore AI",
          title: `Moved ${fmtUSD(a.amount)} from ${a.fromName} to ${a.toName}`,
          because: `You asked for it from the campaign's moves: ${a.toName} sells more on the same spend.`,
          effect: `Phase spend: −${fmtUSD(a.amount)} from ${a.fromName}, +${fmtUSD(a.amount)} to ${a.toName}. Total phase budget unchanged.`,
          undone: false, undoable: true, adds: a.adds,
        });
        setNote(`Moved ${fmtUSD(a.amount)} to ${a.toName}`);
        return;
      }
      case "why":
        show({ q: a.q, say: a.say });
    }
  }, [approve, go, show, canApprove]);

  const chips = dashboardChips(phase, ads, !!undoable);
  const value = useMemo(() => ({ open, setOpen, exchanges, ask, show, run, chips }), [open, exchanges, ask, show, run, chips]);

  return (
    <HeyMoonCtx.Provider value={value}>
      {children}
      {note && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
        >
          <p className="animate-rise inline-flex items-center gap-2 rounded-pill bg-ink px-4 py-2.5 text-meta font-semibold text-white shadow-float">
            <Check size={13} weight="bold" aria-hidden className="text-good" />
            {note}
          </p>
        </div>
      )}
    </HeyMoonCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* The bar, in the top bar                                             */
/* ------------------------------------------------------------------ */

/** A request in words. On a phone there is no room for a field up here, so it is a button that opens the panel
    with its box, which is the one case where the panel opens empty: the brand asked for it. */
export function AskBar() {
  const { t } = useT();
  const { ask, chips, setOpen } = useHeyMoon();
  const [text, setText] = useState("");
  const [focus, setFocus] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  /* ⌘K / Ctrl K, the way every product with a command bar does it. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); field.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = (v: string) => { ask(v); setText(""); field.current?.blur(); };

  return (
    <>
      <div className="relative hidden w-[clamp(240px,30vw,440px)] md:block">
        <form
          onSubmit={(e) => { e.preventDefault(); send(text); }}
          className="flex h-10 items-center gap-2 rounded-pill border border-black/[0.08] bg-white/90 px-3.5 transition focus-within:border-brand/40 focus-within:shadow-card"
        >
          <Sparkle size={14} weight="fill" aria-hidden className="shrink-0 text-brand" />
          <input
            ref={field}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 120)}
            onKeyDown={(e) => { if (e.key === "Escape") field.current?.blur(); }}
            placeholder={t("dash.ask")}
            aria-label="Ask HeyMoon"
            className="min-w-0 flex-1 bg-transparent text-meta text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="hidden shrink-0 rounded-[6px] border border-hairline px-1.5 py-0.5 text-[10px] font-medium text-ink-faint lg:inline">
            ⌘K
          </kbd>
        </form>
        {/* What it can do right now, offered while the field is empty, from what is true of the phase. */}
        {focus && !text && chips.length > 0 && (
          <ul
            role="listbox"
            aria-label="Suggestions"
            className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-control border border-hairline bg-white py-1 shadow-float"
          >
            {chips.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => { e.preventDefault(); send(c); }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-start text-meta text-ink-soft transition hover:bg-lilac/60 hover:text-ink"
                >
                  <Sparkle size={11} weight="fill" aria-hidden className="shrink-0 text-brand/50" />
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask HeyMoon"
        className="grid h-10 w-10 place-items-center rounded-pill text-main transition hover:bg-lilac/60 md:hidden"
      >
        <Sparkle size={16} weight="fill" aria-hidden />
      </button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* A question a card raises                                            */
/* ------------------------------------------------------------------ */

/** The question this card raises, answered about this card. `say` when the card already knows the answer;
    otherwise the question goes through the same reading as the bar. */
export function AskChip({ q, say, tone = "light", className = "" }: {
  q: string;
  say?: string;
  tone?: "light" | "onDark";
  className?: string;
}) {
  const { ask, show } = useHeyMoon();
  return (
    <button
      type="button"
      onClick={() => (say ? show({ q, say }) : ask(q))}
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-semibold transition ${
        tone === "onDark"
          ? "bg-white/15 text-white hover:bg-white/25"
          : "bg-lilac text-main hover:bg-main-10"
      } ${className}`}
    >
      <Sparkle size={10} weight="fill" aria-hidden />
      {q}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* The panel: closed until there is something to show                 */
/* ------------------------------------------------------------------ */

export function HeyMoonPanel() {
  const { exchanges, setOpen, ask, chips } = useHeyMoon();
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [exchanges.length]);
  /* Opened empty only when the brand asked for the box (the phone's button), so the box takes the focus. */
  useEffect(() => { if (!exchanges.length) box.current?.focus(); }, [exchanges.length]);

  const send = (v: string) => { ask(v); setText(""); };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-4">
        <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
          <Sparkle size={11} weight="fill" />
        </span>
        <p className="min-w-0 flex-1 truncate text-body font-semibold text-ink">HeyMoon</p>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-ink-faint transition hover:bg-black/[0.05] hover:text-ink"
        >
          <X size={15} aria-hidden />
        </button>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {!exchanges.length && (
          <div>
            <p className="text-body leading-6 text-ink-soft">Ask about this phase, or tell me what to do.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-pill border border-black/[0.09] bg-white px-2.5 py-1 text-[11px] font-medium text-ink-soft transition hover:border-brand/40 hover:text-brand"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
        {exchanges.map((x, i) => (
          <div key={x.id} className="space-y-3">
            {x.q && (
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-[16px] bg-black/[0.05] px-3 py-2 text-body leading-5 text-ink">{x.q}</p>
              </div>
            )}
            <div className="text-body leading-6 text-ink">
              {i === exchanges.length - 1 ? <Typed text={x.say} /> : <p className="whitespace-pre-line">{x.say}</p>}
            </div>
            {x.approval && <ApprovalBlock req={x.approval} />}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-hairline px-3 pb-3 pt-2.5">
        <div className="flex items-end gap-2 rounded-[20px] border border-black/[0.1] bg-white px-3 py-2 transition focus-within:border-ink/25">
          <textarea
            ref={box}
            rows={1}
            value={text}
            placeholder={exchanges.length ? "Ask a follow-up" : "Ask, or tell me what to do"}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); }
            }}
            aria-label="Ask HeyMoon"
            className="max-h-[120px] min-h-[22px] flex-1 resize-none bg-transparent py-0.5 text-body leading-5 text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={() => send(text)}
            disabled={!text.trim()}
            aria-label="Send"
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition ${
              text.trim() ? "bg-ink text-white hover:bg-ink/85" : "bg-neutral-200 text-white"
            }`}
          >
            <ArrowUp size={13} weight="bold" aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-ink-faint">I cannot publish, move money or sign.</p>
      </div>
    </div>
  );
}
