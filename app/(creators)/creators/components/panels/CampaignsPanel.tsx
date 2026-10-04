"use client";

/* The campaigns, in the panel beside the conversation.
 *
 * A list of the file's cards, and one campaign at full length when a
 * card is pressed. Joining from here does exactly what joining from the
 * thread does — it puts the scheduling step into the conversation — so
 * there is one path through an application however you reach it. */

import { Sparkle } from "@phosphor-icons/react";
import { CampaignRow } from "../figma";
import { Chip } from "../ui";
import { CampaignDetail } from "./CampaignDetail";
import { STATE_WORD, countWord } from "../blocks";
import { closePanel, push, selectOffer, setOfferState, useOffers, useSelectedOfferId, useStore, useThread } from "../../lib/store";
import { beginJoin, chatCampaigns, chatCampaignsTitle } from "../../lib/join";

/** Whether the panel sits BESIDE the conversation (768px and up) or
    covers it. The same test the conversation uses before it opens the
    panel unasked. */
const besideChat = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

export function CampaignsPanel() {
  const offers = useOffers();
  const thread = useThread();
  const accepts = useStore((s) => s.accepts);
  const selectedId = useSelectedOfferId();
  const selected = offers.find((o) => o.id === selectedId) ?? null;

  if (selected) {
    return (
      <CampaignDetail
        key={selected.id}
        offer={selected}
        onBack={() => selectOffer(null)}
        /* BOTH OF THESE ANSWER IN THE CONVERSATION.
         *
         * JOIN CLOSES THE PANEL, at every width. Once a campaign is
         * picked, the list of the others has nothing left to offer, and
         * leaving it open beside the scheduling question put a choice
         * that had already been made next to the one being asked. On a
         * phone it mattered twice over: the panel covers the thread, so
         * the question landed where nobody could see it.
         *
         * "Not this one" closes it only on a phone. Beside the chat the
         * list is still the point — the creator passed on one and may
         * want another. */
        /* The first join also makes the account — see beginJoin. */
        onJoin={() => {
          beginJoin(selected);
          selectOffer(null);
          closePanel();
        }}
        onDecline={() => {
          setOfferState(selected.id, "declined");
          push({ kind: "say", text: `Turned down ${selected.brand}. MoonMatch AI will ease off campaigns like that one.` });
          selectOffer(null);
          if (!besideChat()) closePanel();
        }}
      />
    );
  }

  /* THE SAME THREE THE THREAD SHOWS — see chatPicks. This list used to
     be every campaign, weak matches and history included, which put
     sixteen back into the conversation through its side door. Every
     other campaign lives on the dashboard. A campaign joined or passed
     on stays in the list with its state, the way it does in the row.
     Once a join starts, the list is the campaign being joined, exactly as
     the row in the thread is — see chatCampaigns. */
  const shown = chatCampaigns(offers, thread, accepts);
  const picks = shown.list;

  return (
    <div className="space-y-5 p-4">
      {picks.length === 0 && <p className="text-body leading-5 text-ink-60">Nothing matched yet.</p>}
      {picks.length > 0 && (
        <section>
          <p className="mb-3 flex items-center gap-1.5 text-row font-semibold text-ink">
            <Sparkle size={16} weight="fill" aria-hidden className="shrink-0 text-main" />
            {chatCampaignsTitle(shown, countWord)}
          </p>
          {/* The file's list view, not its card view. In a 360-560px
              panel a 160px-image card shows one campaign; a 120px row
              shows three, which is what a list is for. */}
          <div className="flex flex-col gap-2">
            {picks.map((o) => (
              <CampaignRow key={o.id} offer={o} onOpen={() => selectOffer(o.id)}
                trailing={o.state !== "open" ? <Chip tone={o.state === "approved" ? "green" : o.state === "applied" ? "main" : "ink"}>{STATE_WORD[o.state]}</Chip>
                  : shown.joining.has(o.id) ? <Chip tone="main">Joining</Chip> : undefined} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
