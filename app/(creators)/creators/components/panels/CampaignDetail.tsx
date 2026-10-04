"use client";

/* The campaign, at full length — the Figma's Campaign details screen.
 *
 * Shared by the conversation's panel and the dashboard, so a campaign
 * looks the same wherever it is opened. Measured off the file: a 250px
 * hero with a dark gradient and the countdown bar along its foot, a
 * white 24px-radius sheet lapping 20px up over it, the brand row with
 * its match chip (the file's "Exclusive for you" is gone: nothing on
 * HeyMoon is exclusive), the 24px title, the 14px pitch at 60%, the
 * key/value rows, Deliverables per platform, Payment Details in its
 * purple border, and one gradient pill at the bottom.
 *
 * ONCE IT IS THE CREATOR'S, the same screen becomes where the work
 * lives. The code and the link pin to the top; the design's Application
 * Status card stays above the tabs as where the campaign stands; and
 * the file's three tabs — Details, Stats, Ad Content — split what the
 * campaign is from what it has paid and what is still owed. The pill
 * at the bottom stops being Join and becomes the next thing to do:
 * submit the ad that is due, or submit one again that was not
 * accepted. */

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle, Info } from "@phosphor-icons/react";
import { Btn, Chip, KV, Tabs, H, Avatar, Sheet } from "../ui";
import {
  BackButton, CountdownBar, DeliverablesCard, Flags, MatchChip, PaymentDetails, ProductTile,
  SocRow, StatTile,
} from "../figma";
import { BriefBlock, STATE_WORD } from "../blocks";
import { CodeBadge } from "../CodeBadge";
import { AdContentList, CheckCard } from "../campaign/AdContent";
import { SubmitSheet } from "../campaign/SubmitSheet";
import { JoinStatus } from "../campaign/JoinStatus";
import { money } from "../../lib/agent/model";
import { PAYOUTS } from "../../lib/agent/tools";
import { campaignOf } from "../../lib/calendar";
import { needsYou, summarize } from "../../lib/content";
import { fromKey, shortDay } from "../../lib/dates";
import { clearCampaignTab, useCampaignTab, useDecisions, type CampaignTab } from "../../lib/store";
import { usePlan } from "../../lib/usePlans";
import { CADENCES, payoutWhyFor, type Offer } from "../../lib/agent/types";

export function CampaignDetail({ offer, onBack, onJoin, onDecline, embedded }: {
  offer: Offer;
  onBack?: () => void;
  onJoin?: () => void;
  onDecline?: () => void;
  /** Inside the dashboard column rather than the panel: wider hero,
      no sticky footer. */
  embedded?: boolean;
}) {
  const [why, setWhy] = useState(false);
  const [whyMatch, setWhyMatch] = useState(false);
  const decisions = useDecisions();
  const decision = decisions[offer.id];
  const active = offer.state === "approved";
  /* JOINED, OR JOINED AND FINISHED. Both have a code that still carries
     orders, a post, and figures, so both get the tabs and the pinned
     code. Stats is what the campaign has actually done; what it could
     pay is the calculator's, and that is in the conversation, the moment
     the campaign is joined. */
  const worked = active || offer.state === "completed";
  const slots = usePlan(offer);
  const sum = summarize(slots);
  /* WHICH TAB IT OPENS ON. Whatever sent the creator here, if something
     did (a toast about an ad opens Ad Content); otherwise the ads when
     one is waiting on them, and the numbers when nothing is. */
  const wanted = useCampaignTab();
  const [tab, setTab] = useState<CampaignTab>(() => wanted ?? (offer.state === "completed" ? "stats" : sum.action ? "content" : "stats"));
  useEffect(() => { if (wanted) { setTab(wanted); clearCampaignTab(); } }, [wanted]);
  /* Held as an id, so the sheet always reads the row as it stands now. */
  const [uploading, setUploading] = useState<string | null>(null);
  const upSlot = slots.find((s) => s.id === uploading);

  /* WHEN THE EARLY-BIRD BAR IS THE SHEET'S LIP.
     `CountdownBar tall` is 48px with a 24px top radius — it was drawn
     to BE the top edge of the content sheet, which is why it has a
     radius at all. Sat at the hero's foot with the sheet lapping 20px
     up over it, the sheet ate the bottom half of the bar and put its
     own 24px radius directly under the bar's, which is the broken seam
     in the panel. So when the bar is showing it is the lip, and the
     sheet below it is square-topped and does not lap. */
  const lip = !!offer.bonus && offer.state === "open";
  const total = offer.deliverables.reduce((n, d) => n + d.count, 0);

  /* FROM THE LEDGER, matched by campaign the way Earnings matches it, so
     the two pages cannot disagree about what a campaign has paid. */
  const paid = PAYOUTS.filter((p) => campaignOf(p.offerId) === campaignOf(offer.id));
  const orders = paid.reduce((n, p) => n + p.orders, 0);
  const earned = paid.reduce((n, p) => n + p.amount.value, 0);
  const paidOut = paid.filter((p) => p.state === "paid").reduce((n, p) => n + p.amount.value, 0);
  const held = paid.filter((p) => p.state === "escrow").reduce((n, p) => n + p.amount.value, 0);
  /* A finished campaign delivered everything it asked for; a running
     one has delivered what was checked and accepted. */
  const delivered = offer.state === "completed" ? total : sum.accepted;

  /* THE ONE ACTION, once the campaign is theirs. */
  const act = sum.action;
  const press = act && (() => setUploading(act.id));
  const actLabel = !act ? null : act.state === "rejected" ? "Submit it again" : "Upload the ad";
  const restLabel = sum.review ? `${sum.review === 1 ? "Your ad is" : `${sum.review} ads are`} in review`
    : sum.upcoming ? `All submitted · next ad due ${shortDay(fromKey(sum.upcoming.day))}`
    : "Every ad is accepted";
  /* FLUSH WITH THE FOOT OF THE SCREEN. A sticky bar stops at the edge
     of its scroller's padding, and the dashboard's scroller has 40px of
     it (112px on a phone, for the floating tab bar) — so the bar hung
     that far above the bottom with the page scrolling past beneath it.
     Its offset cancels the padding exactly. On a phone it then runs on
     down behind the tab bar, and its own bottom padding keeps the
     button clear above it. In the panel it is the foot of the screen. */
  const bar = `${embedded ? "sticky -bottom-28 pb-[98px] md:-bottom-10 md:pb-4" : "fixed bottom-0 pb-4 sm:sticky"} inset-x-0 z-10 border-t border-line-soft bg-white/95 px-4 pt-3 backdrop-blur-[2px] sm:px-6`;

  return (
    <div className={`relative flex min-h-full flex-col bg-white ${embedded ? "rounded-tile shadow-card" : ""}`}>
      {/* Hero */}
      <div className={`relative w-full overflow-hidden bg-lilac ${embedded ? "h-[200px] rounded-t-tile lg:h-[240px]" : "h-[250px]"}`}>
        {offer.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={offer.image} alt="" className="h-full w-full object-cover" />
          : <ProductTile offer={offer} hero className="justify-center px-6 sm:px-8 lg:px-10" />}
        {offer.image && <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />}
        {/* Hidden below 768px, where the panel header's back already goes
            to the list — see PanelFrame. Two arrows fifty pixels apart
            that did different things. */}
        {onBack && <div className="absolute start-4 top-4 hidden md:block"><BackButton onClick={onBack} light={!offer.image} /></div>}
        {lip && <div className="absolute inset-x-0 bottom-0"><CountdownBar within={offer.bonus!.within} tall /></div>}
      </div>

      {/* The sheet. It laps 20px up over the hero — unless the
          early-bird bar is already doing that job.
          THE CONTAINER THE TWO-COLUMN SPLITS READ. They were keyed to
          the viewport (`lg:`), and with Ask Moon open beside a
          1440px window the column is 680px, so the split put the ad
          list in 276px. On this box, not the page, because containment
          would trap the sheets and the fixed bar below it. */}
      <div className={`@container relative flex flex-1 flex-col gap-6 bg-white px-4 pt-4 sm:px-6 ${lip ? "" : "-mt-5 rounded-t-tile"} ${embedded ? "pb-8 lg:px-8" : "pb-28"}`}>
        {/* Pinned the moment the campaign is the creator's, so it stays
            on screen while the brief and the ads scroll under it. Before
            approval the code is not theirs to use, and it is not shown:
            a request to join gets its code when the brand says yes. */}
        {worked && <CodeBadge code={offer.code} link={offer.trackingLink} pinned />}

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <Avatar name={offer.brand} src={offer.brandLogo} size={32} />
            <span className="text-row font-medium text-ink/80">{offer.brand}</span>
          </span>
          {/* The match, or where it stands — a joined campaign's status is
              the card under the title, so it keeps the match — and behind
              the ⓘ, why HeyMoon brought it: the four signals matching
              read, as a popup rather than a card on every campaign. */}
          <span className="flex items-center gap-1">
            {offer.state === "open" || active ? <MatchChip offer={offer} />
              : <Chip tone={offer.state === "completed" ? "green" : "ink"}>{STATE_WORD[offer.state]}</Chip>}
            <button type="button" onClick={() => setWhyMatch(true)} aria-label="Why HeyMoon matched you"
              className="grid h-7 w-7 place-items-center rounded-pill text-ink-50 transition hover:bg-lilac hover:text-main">
              <Info size={16} weight="bold" aria-hidden />
            </button>
          </span>
        </div>

        {worked && (
          <div className="-mt-2 flex flex-col gap-4">
            <h1 className="text-title font-semibold leading-7 text-ink">{offer.title}</h1>
            {active && <JoinStatus offer={offer} decision={decision} slots={slots} />}
          </div>
        )}

        {worked && (
          <Tabs<CampaignTab>
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "details", label: "Details" },
              { key: "stats", label: "Stats" },
              { key: "content", label: "Ad Content", count: slots.filter(needsYou).length || undefined },
            ]}
            className="-mx-4 sm:-mx-6"
          />
        )}

        {/* TWO COLUMNS ON THE DASHBOARD, one in the panel.
            This screen is a phone sheet in the Figma, and at 1200px
            wide a single stack of it is a narrow ribbon of content with
            the terms a full scroll below the brief. Embedded it splits:
            what the campaign asks for on the left, what it pays on the
            right. Why it came to you is behind the ⓘ by the match chip.
            The panel keeps the stack, because at 400px that is the right
            answer. */}
        {(!worked || tab === "details") && (
          <div className={embedded && !worked ? "grid grid-cols-[minmax(0,1fr)] gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)] @4xl:items-start" : "flex flex-col gap-6"}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {!worked && <h1 className="text-title font-semibold leading-7 text-ink">{offer.title}</h1>}
              <p className="max-w-[70ch] text-body leading-5 text-ink-60">{offer.pitch}</p>
            </div>

            {/* ONE COLUMN, and `dense` does the work. These were briefly
                two-up on the dashboard, keyed to the viewport — but the
                column these sit in is the narrow half of the detail's
                own two-column layout, so at 1024px it split 324px into
                two 162px tracks and wrapped "No end date" onto three
                lines. Denser rows, not more of them. */}
            <div>
              <KV dense={embedded} k="Platform(s)" v={<SocRow platforms={offer.platforms} size={24} />} />
              <KV dense={embedded} k="Duration" v={offer.duration ?? "No end date"} />
              <KV dense={embedded} k="Countries" v={<span className="flex items-center gap-2"><span>{offer.countries.length >= 5 ? "GCC" : offer.countries.join(", ")}</span><Flags codes={offer.countries} max={3} /></span>} />
              <KV dense={embedded} k="Target Audience" v={<span><span className="num font-semibold">{offer.targetAge[0]}-{offer.targetAge[1]}</span> <span className="text-ink-50">y.o.</span></span>} />
              <KV dense={embedded} k="Target Gender" v={offer.targetGender} last />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-row font-medium text-ink-90">Deliverables</span>
                <span className="num text-body text-ink-50">{total} in total</span>
              </div>
              <DeliverablesCard deliverables={offer.deliverables} />
            </div>

            {offer.conflict && (
              <div className="rounded-inner border border-orange/30 bg-orange-20/40 px-4 py-3 text-body leading-5 text-ink-60">
                <span className="font-semibold text-ink">{offer.conflict.brand} is already in your grid.</span> {offer.conflict.detail}
              </div>
            )}

            {/* A joined campaign's status is the card above the tabs; this
                is the answer on one that did not go through. */}
            {decision && !worked && (
              <div className="rounded-inner border border-line p-4">
                <p className="text-row font-semibold text-ink">Application status</p>
                <KV k="Status" v={<Chip tone={decision.outcome === "approved" ? "green" : "ink"}>{decision.outcome === "approved" ? "Approved" : "Not this time"}</Chip>} />
                <KV k="Scheduling" v={CADENCES.find((c) => c.key === decision.cadence)?.label ?? ""} />
                <KV k="Campaign Duration" v={decision.duration ?? "No end date"} last />
                {decision.because && <p className="pt-3 text-body leading-5 text-ink-60">{decision.because}</p>}
              </div>
            )}
          </div>

          {/* What it pays. On a joined campaign the terms are on Stats,
              beside what they have come to. */}
          {!worked && (
            <div className="flex flex-col gap-6">
              <PaymentDetails offer={offer} why={payoutWhyFor(offer.commissionPct)} open={why} onToggle={() => setWhy((w) => !w)} />
            </div>
          )}
          </div>
        )}

        {worked && tab === "stats" && (
          <div className={embedded ? "grid grid-cols-[minmax(0,1fr)] gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)] @4xl:items-start" : "flex flex-col gap-6"}>
            <div className="flex flex-col gap-4">
              <H>Stats</H>
              {/* Nothing here is a forecast. A campaign joined today reads
                  zero until its code carries an order, and says why. */}
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <StatTile label="Total Earnings" icon="money" value={money(earned)}
                  delta={orders ? `on ${orders} order${orders === 1 ? "" : "s"}` : sum.accepted ? "Your first orders land here" : "Counts from your first accepted ad"} quiet={!orders} />
                <StatTile label="Orders" icon="orders" value={String(orders)}
                  delta={orders ? `on ${offer.code}` : sum.accepted ? `Counting on ${offer.code}` : `Nothing on ${offer.code} yet`} quiet={!orders} />
                <StatTile label="Payments" icon="payments" value={money(paidOut || held)}
                  delta={paidOut ? "Paid to you" : held ? "Held · paid Friday" : "Paid every Friday"} quiet={!paidOut} />
                <StatTile label="Completed Ads" icon="done" value={`${delivered}/${total}`}
                  delta={offer.state === "completed" || delivered === total ? "All accepted" : sum.review ? `${sum.review} in review` : `${total - delivered} to go`}
                  quiet={delivered < total} />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <PaymentDetails offer={offer} why={payoutWhyFor(offer.commissionPct)} open={why} onToggle={() => setWhy((w) => !w)} />
            </div>
          </div>
        )}

        {worked && tab === "content" && (
          <div className={embedded ? "grid grid-cols-[minmax(0,1fr)] gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)] @4xl:items-start" : "flex flex-col gap-6"}>
            {active
              ? <AdContentList offer={offer} slots={slots} onUpload={(s) => setUploading(s.id)} />
              : (
                <div className="flex items-start gap-3 rounded-inner bg-green-10 px-4 py-3">
                  <CheckCircle size={18} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-green" />
                  <p className="text-body leading-5 text-ink-60"><span className="font-semibold text-ink">All {total} ads went live.</span> The campaign has closed, and the code still counts every order it carries.</p>
                </div>
              )}
            <div className="flex flex-col gap-4">
              {active && <CheckCard offer={offer} />}
              {/* The code is already pinned at the top of this column. */}
              <BriefBlock offer={offer} showCode={false} />
            </div>
          </div>
        )}
      </div>

      {/* The one action on the screen. */}
      {offer.state === "open" && onJoin && (
        <div className={bar}>
          {/* A 48px edge-to-edge pill is the file's CTA and stays that
              on a phone. On the dashboard the action sits at its own
              width, at the end of the bar, beside its opt-out. */}
          <div className={embedded ? "mx-auto w-full max-w-[420px] md:mx-0 md:flex md:max-w-none md:items-center md:justify-end md:gap-3" : ""}>
            <Btn dense={embedded} full onClick={onJoin} className={embedded ? "md:w-auto" : ""}>{offer.match.level === "prequalified" ? "Join Campaign" : "Request to join"}</Btn>
            {onDecline && <button onClick={onDecline} className={`w-full text-center text-body font-medium text-ink-50 hover:text-ink ${embedded ? "mt-2 md:mt-0 md:w-auto md:shrink-0 md:px-2" : "mt-2"}`}>Not this one</button>}
          </div>
        </div>
      )}
      {offer.state === "applied" && (
        <div className={bar}>
          <div className={`flex h-12 items-center justify-center rounded-pill bg-main/40 text-body font-semibold text-white ${embedded ? "mx-auto w-full max-w-[420px] md:mx-0 md:ms-auto md:h-10 md:w-auto md:max-w-none md:px-5" : "w-full"}`}>Request sent. Waiting for {offer.brand}</div>
        </div>
      )}
      {active && slots.length > 0 && (
        <div className={bar}>
          <div className={embedded ? "mx-auto w-full max-w-[420px] md:mx-0 md:flex md:max-w-none md:items-center md:justify-end md:gap-3" : ""}>
            {act && press
              ? <>
                  <span className={`hidden min-w-0 flex-1 truncate text-body text-ink-60 ${embedded ? "md:block" : ""}`}>
                    {act.state === "overdue" ? <span className="text-danger">Your {act.n === 1 ? "first" : "next"} ad was due {shortDay(fromKey(act.day))}</span>
                      : act.state === "rejected" ? <span className="text-danger">Ad {act.n} of {act.total} wasn&apos;t accepted</span>
                      : `Ad ${act.n} of ${act.total} is due ${shortDay(fromKey(act.day))}. Post it, then submit it here`}
                  </span>
                  <Btn dense={embedded} full onClick={press} className={embedded ? "md:w-auto" : ""}>{actLabel}</Btn>
                </>
              : <div className={`flex h-12 items-center justify-center rounded-pill bg-main/40 px-5 text-center text-body font-semibold text-white ${embedded ? "md:ms-auto md:h-10" : "w-full"}`}>{restLabel}</div>}
          </div>
        </div>
      )}

      {upSlot && <SubmitSheet key={upSlot.id} offer={offer} slot={upSlot} onClose={() => setUploading(null)} />}
      <WhyMatchedSheet offer={offer} open={whyMatch} onClose={() => setWhyMatch(false)} />
    </div>
  );
}

/* WHY YOU, in the four signals matching actually read — not followers,
   and not reach. Behind the ⓘ beside the match chip. */
function WhyMatchedSheet({ offer, open, onClose }: { offer: Offer; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Why HeyMoon matched you">
      <div className="px-4 pb-5 pt-1">
        <MatchChip offer={offer} />
        <ul className="mt-3 space-y-3">
          {offer.match.signals.map((sig) => (
            <li key={sig.label} className="flex items-start gap-2">
              {sig.strong
                ? <CheckCircle size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-green" />
                : <ArrowUpRight size={16} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-ink-50" />}
              <span className="min-w-0 flex-1 text-body leading-5 text-ink-60">
                <span className="block font-semibold text-ink">{sig.label}</span>
                {sig.detail}
              </span>
            </li>
          ))}
        </ul>
        {offer.match.level === "prequalified" && (
          <p className="mt-4 text-meta leading-4 text-green">
            Enough of them are strong that {offer.brand} does not need to review you. Joining puts you on it.
          </p>
        )}
        {offer.caveat && <p className="mt-3 text-meta leading-4 text-ink-50">{offer.caveat}</p>}
      </div>
    </Sheet>
  );
}
