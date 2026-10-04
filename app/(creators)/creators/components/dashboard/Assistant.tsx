"use client";

/* Ask Moon.
 *
 * A different agent from the one at /c. That one knows a profile and
 * builds a profile; this one knows work in flight. It can move the page,
 * answer from the figures already on it, and open the ad that is next.
 * It cannot submit, post, accept or sign, and the line under the box
 * says so.
 *
 * Every action leaves a card in the thread naming what changed. An
 * assistant that says "done" while something moves off-screen is the
 * thing this product exists not to be.
 */

import { useEffect, useRef, useState } from "react";
import { Sparkle, X } from "@phosphor-icons/react";
import { Composer } from "../chat/Composer";
import { FORMAT_NAME, money } from "../../lib/agent/model";
import { wantsYou } from "../../lib/agent/types";
import { PAYOUTS } from "../../lib/agent/tools";
import { summarize } from "../../lib/content";
import { relDay } from "../../lib/dates";
import { useGo } from "../../lib/surface";
import { openCampaign, useOffers, useActiveProfile } from "../../lib/store";
import { usePlans, useToday } from "../../lib/usePlans";

type Turn = { id: number; who: "you" | "agent"; text: string; did?: string };

let seq = 0;

export function DashboardAssistant({ onClose }: { onClose: () => void }) {
  const go = useGo();
  const offers = useOffers();
  const plans = usePlans();
  const today = useToday();
  const profile = useActiveProfile();
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const list = useRef<HTMLDivElement>(null);

  /* Scroll this list, not its ancestors — see pin() in c/page.tsx for
     what `scrollIntoView` did to the conversation's shell. */
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length]);

  const say = (t: string, did?: string) => setTurns((xs) => [...xs, { id: seq++, who: "agent", text: t, did }]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    setTurns((xs) => [...xs, { id: seq++, who: "you", text: t }]);
    const q = t.toLowerCase();

    const orders = PAYOUTS.reduce((n, p) => n + p.orders, 0);
    const escrow = PAYOUTS.filter((p) => p.state === "escrow").reduce((n, p) => n + p.amount.value, 0);
    /* The joined campaigns' ads — the same rows their pages list. */
    const ads = Array.from(plans.values()).flat();
    const brandOf = (id: string) => offers.find((o) => o.id === id)?.brand ?? "The brand";

    if (/how.*(doing|going)|performance|numbers/.test(q)) {
      /* ORDERS, NOT A RATE PER THOUSAND VIEWS. Rasha: "this for example
         per view. We don't pay per view." */
      const earned = PAYOUTS.reduce((n, p) => n + p.amount.value, 0);
      say(
        `${orders} order${orders === 1 ? "" : "s"} on your codes so far, and ${money(earned)} of your share. ` +
        `${money(escrow)} of it is still held and releases with Friday's run.`
      );
      return;
    }
    if (/draft|check|fix|missing|short|back|reject/.test(q)) {
      const back = ads.filter((a) => a.state === "rejected");
      if (back.length) {
        const a = back[0];
        openCampaign(a.offerId, "content"); go("campaign");
        say(
          `${back.length === 1 ? "One ad wasn't" : `${back.length} ads weren't`} accepted. Your ${FORMAT_NAME[a.format]} for ${brandOf(a.offerId)}: ${a.submission?.note ?? "something the brief asks for is missing."} Opened it.`,
          `Moved you to ${brandOf(a.offerId)}`
        );
        return;
      }
      const due = ads.filter((a) => a.state === "due" || a.state === "overdue").length;
      say(due
        ? `Nothing has come back. ${due === 1 ? "One ad is" : `${due} ads are`} due, and each is checked against its campaign's Pre-upload Check, so tick it before you submit.`
        : "Nothing has come back, and nothing is waiting on you.");
      return;
    }
    if (/send|upload|due|post|next/.test(q)) {
      const a = summarize(ads).action;
      if (!a) { say(ads.length ? "Nothing is due. Every ad so far is in review or accepted." : "You are not on a campaign yet, so nothing is due."); return; }
      openCampaign(a.offerId, "content"); go("campaign");
      say(
        `Your next is the ${FORMAT_NAME[a.format]} for ${brandOf(a.offerId)}, due ${relDay(a.day, today)}. Post it, then submit its link there. Opened it. I have not submitted anything: pressing it is yours.`,
        `Moved you to ${brandOf(a.offerId)}`
      );
      return;
    }
    if (/money|paid|escrow|earn/.test(q)) {
      go("earnings");
      say(`${money(escrow)} of your share is held and pays out with Friday's run. Opened your earnings.`, "Moved you to Earnings");
      return;
    }
    if (/campaign|offer|brief|work/.test(q)) {
      go("campaigns");
      const open = offers.filter((o) => o.state === "open" && wantsYou(o)).length;
      say(open ? `${open} matching you. Opened them.` : "Nothing matching you today.", "Moved you to Campaigns");
      return;
    }
    /* THERE IS NO RATE TO ANSWER WITH. A creator does not price
       themselves here, so the honest answer is what the campaigns pay
       and where to see it — not a number this agent could invent. */
    if (/rate|worth|price|commission|%/.test(q)) {
      const live = offers.filter((o) => o.state === "approved");
      say(live.length
        ? `${live.map((o) => `${o.brand} pays ${o.commissionPct}% of every order`).join(", ")}. The campaign's own page works out what that comes to.`
        : profile
          ? "Each campaign pays you a share of every order you bring in. The brand sets the share and it is the same for everybody on that campaign, so there is nothing for you to price."
          : "Nothing is running yet.");
      return;
    }
    say("I can tell you how the live work is doing, open the ad that is due next, tell you which ads weren't accepted and why, or take you to your money. I cannot submit, post, accept or sign.");
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-[67px] shrink-0 items-center gap-2.5 border-b border-line px-4">
        <span aria-hidden className="g-button grid h-7 w-7 shrink-0 place-items-center rounded-full text-white">
          <Sparkle size={13} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-ink">Ask Moon</p>
          <p className="truncate text-[11px] text-ink-50">About your work, while it runs</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close the assistant"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-inner text-ink-50 transition hover:bg-black/[0.05] hover:text-ink"
        >
          <X size={15} aria-hidden />
        </button>
      </header>

      <div ref={list} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {turns.length === 0 && (
          <div className="space-y-3 text-body leading-6 text-ink-60">
            <p>Nothing is hidden from you here. Ask how the live work is doing, what is due next, or whether any ad wasn&apos;t accepted.</p>
            <p>I cannot submit an ad, post to your accounts, join a campaign or sign anything. Those stay yours.</p>
          </div>
        )}
        {turns.map((t) =>
          t.who === "you" ? (
            <p key={t.id} className="ms-auto max-w-[85%] rounded-[16px] bg-lilac px-3.5 py-2 text-body text-ink">{t.text}</p>
          ) : (
            <div key={t.id}>
              <p className="text-body leading-6 text-ink">{t.text}</p>
              {t.did && <p className="mt-1 text-[11px] text-main">{t.did}</p>}
            </div>
          )
        )}
      </div>

      <Composer
        value={text}
        onChange={setText}
        onSend={send}
        chips={turns.length ? [] : ["How is it doing?", "What's due next?", "Did anything come back?"]}
        onChip={(c) => setText(c)}
        placeholder="Ask, or tell me what to open"
        note="I cannot submit, post, accept or sign."
      />
    </div>
  );
}
