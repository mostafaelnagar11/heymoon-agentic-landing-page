"use client";

/* The dashboard's views: the Figma's four tabs, rebuilt for a wide
 * column, plus the two pages the agent adds under Profile.
 *
 * Explore is the file's Main page — the gradient header with this
 * month's earnings, the yellow "Ads completed" bar, the next scheduled
 * ad, then the pre-qualified campaign cards. Campaigns is Your Campaigns
 * with its Active / Pending / Completed tabs. Earnings is the lilac
 * stat tiles, Earnings by Brand, and Closed Ads split by how it paid.
 * Profile has a file of its own (components/profile), with the popups
 * each of its rows opens. */

import { useRef, useState } from "react";
import {
  ArrowCounterClockwise, Bank, CaretRight, CheckCircle, Info, Lock, UploadSimple, WarningCircle,
} from "@phosphor-icons/react";
import { Btn, Card, Chip, Facts, H, Segmented, Sheet } from "../ui";
import { CampaignRow, MatchChip, ProductTile, RowHeads, Soc, paceOf } from "../figma";
import { AcceptBlock, CadenceBlock, CampaignBlockCard, STATE_WORD } from "../blocks";
import { CampaignDetail } from "../panels/CampaignDetail";
import { ApplicationStatusSheet } from "../campaign/JoinStatus";
import { PayoutSheet } from "../profile/PayoutSheet";
import { CONNECTION_OF, ConnectSheet } from "../profile/ProfileSheets";
import { SubmitSheet } from "../campaign/SubmitSheet";
import { AccountSheet, dialFor } from "../AccountSheet";
import { personFor } from "../../lib/mock/people";
import { PAYOUTS, tools } from "../../lib/agent/tools";
import { FORMAT_NAME, byStrength, money } from "../../lib/agent/model";
import type { Offer, Platform } from "../../lib/agent/types";
import { campaignOf } from "../../lib/calendar";
import { needsYou, type AdSlot, type AdState } from "../../lib/content";
import { fromKey, relDay, shortDay } from "../../lib/dates";
import { useGo } from "../../lib/surface";
import { usePlans, useToday } from "../../lib/usePlans";
import {
  cancelAccept, confirmAccept, decideOffer, markDecisionSeen, openCampaign, pushToast, putAccept, redoActivity, selectOffer,
  setAccount, setAutonomy, setOfferState, undoActivity, useAccount, useActiveProfile, useActivity, useAutonomy,
  useConnected, useDecisions, useOffers, useSeenDecisions, useSelectedOfferId, useStore, viewingCampaign,
  type AutonomyLevel,
} from "../../lib/store";

/* ══════════════════════════════════════════════════════════════════
   Dashboard
   ══════════════════════════════════════════════════════════════════

   WHAT TO DO, FIRST. The 28 Sep review: "it's not explore even, it
   could be called dashboard, because this is how we direct the creator
   on what to do... if they have something to do, any tasks, that should
   be at the center of their attention. And then the other things that
   are less important, and then the nice-to-do, like joining a campaign."

   So, in that order: the to-do list — ads due, overdue or sent back,
   and the accounts and bank still to connect, each done from its row —
   then the campaigns already joined, then the money in one row, then
   the Pre-qualified three, as rows rather than cards, because Alex said
   they took too much of the screen. */

/* Late first, then sent back, then soonest due. */
const TASK_ORDER: Partial<Record<AdState, number>> = { overdue: 0, rejected: 1, due: 2 };

export function DashboardView() {
  const go = useGo();
  const profile = useActiveProfile();
  const offers = useOffers();
  const plans = usePlans();
  const today = useToday();
  const connected = useConnected();
  const [uploading, setUploading] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Platform | "payout" | null>(null);

  const person = profile ? personFor(profile.handle) : null;
  const first = profile?.creatorName?.split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const offerOf = (id: string) => offers.find((o) => o.id === id);
  const openCard = (o: Offer) => () => { selectOffer(o.id); go("campaign"); };

  const ads = Array.from(plans.values()).flat();
  const adTasks = ads.filter(needsYou)
    .sort((x, y) => (TASK_ORDER[x.state]! - TASK_ORDER[y.state]!) || x.day.localeCompare(y.day));
  /* The accounts the read found, and the bank: what the work is
     measured by and paid into. Asked here rather than in the
     conversation, on purpose (Rasha and Alex, 21 Sep). */
  const setup: { key: string; platform?: Platform; title: string; line: string; action: string; open: () => void }[] = [
    ...(person?.accounts ?? [])
      .filter((a) => !connected.includes(CONNECTION_OF[a.platform]))
      .map((a) => ({ key: a.platform, platform: a.platform, title: `Connect ${a.platform}`, line: "Read-only, so your ads can be checked and counted", action: "Connect", open: () => setSheet(a.platform) })),
    ...(connected.includes("payout") ? [] : [{ key: "payout", title: "Add where you're paid", line: "Friday's run needs somewhere to go", action: "Add", open: () => setSheet("payout") }]),
  ];
  const count = adTasks.length + setup.length;
  const nextUp = ads.filter((a) => a.state === "upcoming").sort((x, y) => x.day.localeCompare(y.day))[0];

  const active = offers.filter((o) => o.state === "approved");
  const featured = offers.filter((o) => o.state === "open" && o.match.level === "prequalified").sort(byStrength).slice(0, 3);
  const paid = PAYOUTS.filter((p) => p.state === "paid").reduce((n, p) => n + p.amount.value, 0);
  const held = PAYOUTS.filter((p) => p.state === "escrow").reduce((n, p) => n + p.amount.value, 0);
  const orders = PAYOUTS.reduce((n, p) => n + p.orders, 0);

  const upSlot = ads.find((a) => a.id === uploading);
  const upOffer = upSlot ? offerOf(upSlot.offerId) : undefined;

  return (
    <div className="flex flex-col gap-7 md:gap-8">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 px-4 md:px-0">
        <h2 className="text-title font-semibold tracking-[-0.02em] text-ink">{greet}{first ? `, ${first}` : ""}</h2>
        <p className="text-body text-ink-50">{count ? `${count} ${count === 1 ? "thing" : "things"} to do` : "You're all caught up"}</p>
      </div>

      {/* ── To do ─────────────────────────────────────────────────── */}
      <section className="px-4 md:px-0">
        <H rule>To do</H>
        <Card edge className="mt-3 overflow-hidden md:mt-4">
          {count === 0 ? (
            <div className="flex items-start gap-3 px-4 py-4">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-green-10 text-green"><CheckCircle size={20} weight="fill" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-ink">Nothing to do right now</span>
                <span className="mt-0.5 block text-meta text-ink-60">
                  {nextUp && offerOf(nextUp.offerId)
                    ? `Your next ad, the ${FORMAT_NAME[nextUp.format]} for ${offerOf(nextUp.offerId)!.brand}, is due ${shortDay(fromKey(nextUp.day))}.`
                    : active.length ? "Every ad so far is in review or accepted." : "Join a campaign below and its ads land here, on the days they are due."}
                </span>
              </span>
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {adTasks.map((a) => {
                const o = offerOf(a.offerId);
                if (!o) return null;
                const what = `${FORMAT_NAME[a.format]} for ${o.brand}`;
                const late = a.state === "overdue", back = a.state === "rejected";
                return (
                  <TaskRow key={a.id} onClick={() => setUploading(a.id)}
                    icon={<span className={`grid h-10 w-10 place-items-center rounded-inner ${late || back ? "bg-danger/10 text-danger" : "bg-lilac text-main"}`}>
                      {back ? <ArrowCounterClockwise size={18} weight="bold" /> : late ? <WarningCircle size={20} weight="fill" /> : <UploadSimple size={18} weight="bold" />}
                    </span>}
                    title={back ? `Submit your ${what} again` : `Upload your ${what}`}
                    line={back ? a.submission?.note ?? "Something the brief asks for is missing" : `${late ? "Was due" : "Due"} ${late ? shortDay(fromKey(a.day)) : relDay(a.day, today)} · ad ${a.n} of ${a.total}`}
                    tone={late || back ? "danger" : undefined}
                    action={back ? "Submit it again" : "Upload the ad"} short={back ? "Resubmit" : "Upload"} />
                );
              })}
              {setup.map((t) => (
                <TaskRow key={t.key} onClick={t.open}
                  icon={t.platform ? <Soc platform={t.platform} size={40} /> : <span className="grid h-10 w-10 place-items-center rounded-inner bg-amber-soft text-amber"><Bank size={20} weight="fill" /></span>}
                  title={t.title} line={t.line} action={t.action} quiet />
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ── Active campaigns ──────────────────────────────────────── */}
      {active.length > 0 && (
        <section className="px-4 md:px-0">
          <H rule aside={<button onClick={() => go("campaigns")} className="text-body font-medium text-main">All campaigns</button>}>Active campaigns</H>
          <div className="mt-3 grid gap-3 md:mt-4 md:grid-cols-[repeat(auto-fill,minmax(400px,1fr))] md:gap-4">
            {active.map((o) => <CampaignRow key={o.id} offer={o} onOpen={openCard(o)} trailing={<Chip tone="green">Active</Chip>} />)}
          </div>
        </section>
      )}

      {/* ── Your money, in one row ────────────────────────────────── */}
      <section className="px-4 md:px-0">
        <H rule aside={<button onClick={() => go("earnings")} className="text-body font-medium text-main">Earnings</button>}>Your money</H>
        <Card edge className="mt-3 grid grid-cols-3 divide-x divide-hairline md:mt-4 rtl:divide-x-reverse">
          {[
            { k: "Paid to you", v: money(paid) },
            { k: "Held for Friday", v: money(held) },
            { k: "Orders on your codes", v: String(orders) },
          ].map((f) => (
            <div key={f.k} className="min-w-0 px-3 py-3 md:px-5 md:py-4">
              <p className="text-meta leading-4 text-ink-50">{f.k}</p>
              <p className="num mt-1 text-section font-semibold text-ink">{f.v}</p>
            </div>
          ))}
        </Card>
      </section>

      {/* ── Pre-qualified, as rows ────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="px-4 md:px-0">
          <H rule aside={<span className="text-meta text-ink-50">No brand review</span>}>You&apos;re Pre-qualified</H>
          <Card edge className="mt-3 overflow-hidden md:mt-4">
            <ul className="divide-y divide-hairline">
              {featured.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={openCard(o)} className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-lilac/30">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-inner bg-lilac">
                      {o.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={o.image} alt="" className="h-full w-full object-cover" />
                        : <ProductTile offer={o} plain />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-ink">{o.title}</span>
                      <span className="block truncate text-meta text-ink-50">{o.brand} · {paceOf(o).big}</span>
                    </span>
                    <span className="shrink-0 text-end">
                      <span className="num block text-row font-semibold text-main">{o.commissionPct}%</span>
                      <span className="block text-tiny text-ink-50">of every order</span>
                    </span>
                    <CaretRight size={14} aria-hidden className="shrink-0 text-ink-40 rtl:rotate-180" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {upSlot && upOffer && <SubmitSheet key={upSlot.id} offer={upOffer} slot={upSlot} onClose={() => setUploading(null)} />}
      <PayoutSheet open={sheet === "payout"} onClose={() => setSheet(null)} />
      {sheet && sheet !== "payout" && profile && (
        <ConnectSheet platform={sheet} connected={false} onClose={() => setSheet(null)}
          handle={person?.accounts.find((a) => a.platform === sheet)?.handle ?? profile.handle} />
      )}
    </div>
  );
}

/** One thing to do: the whole row is the press, and it says what the
    press does. */
function TaskRow({ icon, title, line, action, short, tone, quiet, onClick }: {
  icon: React.ReactNode; title: string; line: string; action: string;
  /** The button's word on a phone, where the title needs the room. */
  short?: string;
  tone?: "danger"; quiet?: boolean; onClick: () => void;
}) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-lilac/30">
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0 flex-1">
          {/* Two lines on a phone rather than "Upload your Re…": the
              button beside it is the part that cannot shrink. */}
          <span className="line-clamp-2 text-body font-semibold leading-5 text-ink">{title}</span>
          <span className={`mt-0.5 line-clamp-2 text-meta leading-4 ${tone === "danger" ? "text-danger" : "text-ink-50"}`}>{line}</span>
        </span>
        <span className={`inline-flex h-8 shrink-0 items-center rounded-pill px-3.5 text-meta font-semibold ${quiet ? "bg-lilac text-main" : "g-button border border-white/50 text-[#FBF8FE]"}`}>
          {short ? <><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{action}</span></> : action}
        </span>
      </button>
    </li>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Campaigns — sections, not tabs
   ══════════════════════════════════════════════════════════════════

   Alex, 28 Sep: "I'm not a fan of the tabs. I prefer sections, like
   categorize." Every campaign is on one page, in the order a creator
   acts on them — what they are doing, what is waiting on a brand, what
   they can join outright, what they can ask to join, and then the
   archive, folded away. "Pending" is gone: it was two different things
   under one word, and the half that needs the brand's answer is now
   called what it is, Request to join. */

/* The number behind `expires`, so nothing parses display text. A
   finished campaign has no window left and sorts last. */
const daysOf = (o: Offer) => o.closesInDays ?? Number.MAX_SAFE_INTEGER;

/* Strong matches before the long shots. */
const FIT: Record<Offer["match"]["level"], number> = { prequalified: 0, strong: 1, weak: 2 };

export function CampaignsView() {
  const go = useGo();
  const offers = useOffers();
  const plans = usePlans();
  const [sort, setSort] = useState<"fit" | "share" | "soon">("fit");
  const [showDone, setShowDone] = useState(false);
  const open = (o: Offer) => () => { selectOffer(o.id); go("campaign"); };

  const active = offers.filter((o) => o.state === "approved").sort(byStrength);
  const waiting = offers.filter((o) => o.state === "applied").sort(byStrength);
  const pre = offers.filter((o) => o.state === "open" && o.match.level === "prequalified").sort(byStrength);
  /* BEST FIT BY DEFAULT: "pre-qualified first, then highest earning".
     Pre-qualified is its own section above; here, the stronger match
     first and the bigger share within it. A tie falls back to the match
     ranking (byStrength), as everywhere else. */
  const request = offers.filter((o) => o.state === "open" && o.match.level !== "prequalified").sort((a, b) =>
    (sort === "share" ? b.commissionPct - a.commissionPct
    : sort === "soon" ? daysOf(a) - daysOf(b)
    : (FIT[a.match.level] - FIT[b.match.level]) || (b.commissionPct - a.commissionPct)) || byStrength(a, b));
  const done = offers.filter((o) => o.state === "completed" || o.state === "rejected" || o.state === "declined" || o.state === "expired").sort(byStrength);

  return (
    <div className="flex flex-col gap-8">
      <h2 className="hidden px-4 md:block md:px-0 md:text-head md:font-semibold md:tracking-[-0.01em] md:text-ink-90">Your campaigns · {offers.length}</h2>

      {active.length > 0 && (
        <CampaignSection title="Active" count={active.length} line="The work you have taken on.">
          {/* A FEW THINGS YOU OWN AND WANT TO LOOK AT: cards, with what
              each has done so far. The sections below are a queue and an
              archive, so they are rows. */}
          <div className="@container">
            <div className={CARD_GRID}>
              {active.map((o) => (
                <CampaignBlockCard key={o.id} offer={o} footer={<WorkFacts offer={o} slots={plans.get(o.id) ?? []} />} onOpen={open(o)} />
              ))}
            </div>
          </div>
        </CampaignSection>
      )}

      {waiting.length > 0 && (
        <CampaignSection title="Waiting for the brand" count={waiting.length} line="Requests you sent. The answer lands here, and on the campaign.">
          <CampaignList items={waiting} onOpen={open} trailing={(o) => <StateChip offer={o} />} />
        </CampaignSection>
      )}

      {pre.length > 0 && (
        <CampaignSection title="You're Pre-qualified" count={pre.length} line="Join any of these outright, with no brand review.">
          <CampaignList items={pre} onOpen={open} trailing={(o) => <MatchChip offer={o} />} />
        </CampaignSection>
      )}

      {request.length > 0 && (
        <CampaignSection title="Request to join" count={request.length} line="The brand answers each request. Best fit first."
          aside={<div className="hidden md:block md:shrink-0"><Segmented value={sort} onChange={setSort} options={[
            { key: "fit", label: "Best fit" },
            { key: "share", label: "Highest payout" },
            { key: "soon", label: "Closing soonest" },
          ]} /></div>}>
          <CampaignList items={request} onOpen={open} trailing={(o) => <MatchChip offer={o} />} />
        </CampaignSection>
      )}

      {done.length > 0 && (
        <CampaignSection title="Completed" count={done.length} line="Work you finished, and campaigns that closed or that you passed on."
          aside={<button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="text-body font-medium text-main">{showDone ? "Hide" : "Show"}</button>}>
          {showDone && <CampaignList items={done} onOpen={open} trailing={(o) => <StateChip offer={o} />} />}
        </CampaignSection>
      )}

      {offers.length === 0 && <Card edge className="mx-4 p-6 text-center md:mx-0 md:p-8"><p className="text-body text-ink-60">No campaigns yet.</p></Card>}
    </div>
  );
}

function CampaignSection({ title, count, line, aside, children }: {
  title: string; count: number; line: string; aside?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="px-4 md:px-0">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 md:border-b md:border-hairline md:pb-2.5">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-section font-semibold text-ink md:text-head md:tracking-[-0.01em]">
            {title}
            <span className="num grid h-5 min-w-5 place-items-center rounded-pill bg-black/[0.06] px-1.5 text-tiny font-semibold text-ink-60">{count}</span>
          </h3>
          <p className="mt-0.5 text-meta text-ink-50">{line}</p>
        </div>
        {aside}
      </div>
      <div className="mt-3 md:mt-4">{children}</div>
    </section>
  );
}

/* CARDS IN A ROW: three once the column holds three, two before that,
   one on a phone. Read off the column rather than the window, because
   Ask Moon open beside it takes a third of the window away. Goes inside
   an `@container`. */
const CARD_GRID = "grid gap-3 @lg:grid-cols-2 @[720px]:grid-cols-3 md:gap-4";

/** A queue of campaigns: cards on a phone, rows under heads on a wide
    column. One component, two compositions, chosen by the width. */
function CampaignList({ items, onOpen, trailing }: {
  items: Offer[]; onOpen: (o: Offer) => () => void; trailing: (o: Offer) => React.ReactNode;
}) {
  return (
    <>
      <div className="@container lg:hidden">
        <div className={CARD_GRID}>
          {items.map((o) => <CampaignBlockCard key={o.id} offer={o} onOpen={onOpen(o)} />)}
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-card border border-hairline bg-white shadow-edge">
          <div className="overflow-x-auto">
            <RowHeads last="State" />
            <div className="divide-y divide-hairline">
              {items.map((o) => <CampaignRow key={o.id} offer={o} dense trailing={trailing(o)} onOpen={onOpen(o)} />)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* HOW YOU GET ON IT, for a campaign nobody has answered yet. "Open"
   said nothing: it is true of all sixteen. Three of them you join and
   the rest you ask for, and that is the difference a creator scanning
   the queue needs. */
function StateChip({ offer: o }: { offer: Offer }) {
  if (o.state === "open") return o.match.level === "prequalified" ? <MatchChip offer={o} /> : <Chip tone="ink">Request to join</Chip>;
  return <Chip tone={o.state === "applied" ? "main" : o.state === "completed" ? "green" : "ink"}>{STATE_WORD[o.state]}</Chip>;
}

/* THE ACTIVE CARD'S THREE NUMBERS.
 *
 * Post-join, so the rule that nothing before joining carries a money
 * figure is untouched. Orders, never views, and both off the payout
 * ledger, matched by campaign the way the campaign's own Stats tab and
 * Earnings match it — three screens, one answer. The ads are the
 * campaign's own rows: how many of the bundle are accepted. */
function WorkFacts({ offer, slots }: { offer: Offer; slots: AdSlot[] }) {
  const paid = PAYOUTS.filter((p) => campaignOf(p.offerId) === campaignOf(offer.id));
  const orders = paid.reduce((n, p) => n + p.orders, 0);
  const earned = paid.reduce((n, p) => n + p.amount.value, 0);
  return (
    <Facts even items={[
      { k: "Orders", v: String(orders) },
      { k: "Earned", v: money(earned) },
      { k: "Ads accepted", v: `${slots.filter((a) => a.state === "accepted").length}/${slots.length}` },
    ]} />
  );
}

/** One campaign, with the file's join flow inline: cadence, terms, the
    press, and the brand's answer as the design's Application Status
    screen, over the campaign, the first time it lands. */
export function CampaignView() {
  const go = useGo();
  const offers = useOffers();
  const id = useSelectedOfferId();
  const offer = offers.find((o) => o.id === id);
  const accepts = useStore((s) => s.accepts);
  const decisions = useDecisions();
  const seen = useSeenDecisions();
  const account = useAccount();
  const profile = useActiveProfile();
  const plans = usePlans();
  const today = useToday();
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"none" | "cadence" | "terms">("none");
  const [signing, setSigning] = useState(false);
  if (!offer) return <Card className="p-6"><p className="text-body text-ink-60">Pick a campaign.</p></Card>;
  const req = accepts[`acc-${offer.id}`];
  const decision = decisions[offer.id];
  /* Once it is theirs the join flow is finished business, and the page
     is the campaign's work. */
  const joined = offer.state === "approved" || offer.state === "completed";
  const first = plans.get(offer.id)?.[0];
  const toTop = () => root.current?.closest("main")?.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div ref={root} className="-mx-4 flex flex-col gap-4 sm:mx-0">
      {/* No back circle: the topbar already has one, and the page
          title says where you are. */}
      <CampaignDetail key={offer.id} offer={offer} embedded
        /* The same gate as the conversation's: no account, make one
           first. A returning creator who never joined in the chat
           reaches this button without one. */
        onJoin={step === "none" ? () => (account ? setStep("cadence") : setSigning(true)) : undefined}
        onDecline={() => { setOfferState(offer.id, "declined"); go("campaigns"); }} />
      <AccountSheet open={signing} brand={offer.brand}
        name={profile?.creatorName} dial={dialFor(profile ? personFor(profile.handle).location : undefined)}
        onClose={() => setSigning(false)}
        onVerified={(a) => { setAccount(a); setSigning(false); setStep("cadence"); }} />
      {/* JOINING IS A POPUP, over the campaign rather than under it: the
          posting schedule, then the terms, in one sheet. It closes on
          the press — a pre-qualified join is then greeted by the status
          screen, and a request waits for the brand's answer — and
          closing it any other way sends nothing. */}
      <Sheet open={!joined && step !== "none"} wide
        title={step === "cadence" ? "Scheduling preference" : `Join ${offer.brand}`}
        onClose={() => { if (step === "terms" && req?.state === "pending") cancelAccept(req.id); setStep("none"); }}>
        {step === "cadence" && (
          <CadenceBlock bare offer={offer} initial={req?.cadence}
            onPick={(c) => { putAccept(tools.request_accept({ offer, cadence: c })); setStep("terms"); }} />
        )}
        {step === "terms" && req && (
          <AcceptBlock bare req={req}
            onConfirm={() => {
              confirmAccept(req.id);
              setStep("none");
              toTop();
              /* Pre-qualified is not an application, so there is
                 nothing to wait for. */
              if (!req.needsApproval) { setOfferState(offer.id, "approved"); decideOffer(tools.decide(offer, req.cadence)); return; }
              pushToast({ tone: "main", text: `Request sent to ${offer.brand}. Nothing is owed either way until they answer.` });
              const o = offer;
              window.setTimeout(() => {
                const d = tools.decide(o, req.cadence);
                decideOffer(d);
                /* On the campaign, the answer is the status screen over
                   it. Anywhere else, a line at the top that goes there. */
                if (!viewingCampaign(o.id)) {
                  pushToast({ tone: d.outcome === "approved" ? "green" : "main", offerId: o.id, action: "Open",
                    text: d.outcome === "approved" ? `${o.brand} approved your request.` : `${o.brand} answered your request.` });
                }
              }, 2600);
            }}
            onCancel={() => { cancelAccept(req.id); setStep("none"); }} />
        )}
      </Sheet>
      {decision && !seen.includes(offer.id) && (
        <ApplicationStatusSheet offer={offer} decision={decision}
          firstDue={decision.outcome === "approved" && first ? relDay(first.day, today) : undefined}
          onClose={() => markDecisionSeen(offer.id)}
          onGo={() => {
            markDecisionSeen(offer.id);
            if (decision.outcome === "approved") { openCampaign(offer.id, "content"); toTop(); }
            else go("campaigns");
          }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Activity
   ══════════════════════════════════════════════════════════════════ */

export function ActivityView() {
  const activity = useActivity();
  const autonomy = useAutonomy();
  const label = (k: string) => autonomy.find((r) => r.key === k)?.label ?? k;
  /* Each entry is a paragraph, so these go two across rather than one
     wide: a 1200px line of body copy is unreadable however much room
     there is for it. */
  return (
    <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2 xl:items-start">
      <div className="flex items-start gap-3 rounded-inner bg-lilac px-4 py-3 xl:col-span-2">
        <Info size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-main" />
        <p className="dash-measure text-body leading-5 text-ink-60">Everything an agent did without asking, what let it, and the way back. None of it posted anything, joined anything or changed what a campaign pays.</p>
      </div>
      {activity.map((a) => (
        <Card key={a.id} className={`overflow-hidden ${a.undone ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b border-line px-4 py-3">
            <p className="min-w-0 flex-1 text-body font-semibold text-ink">{a.title}</p>
            <Chip tone="ink">{a.agent}</Chip>
          </div>
          <div className="space-y-2.5 px-4 py-3">
            <p className="text-body leading-5 text-ink-60">{a.because}</p>
            <p className="rounded-chip bg-lilac/60 px-3 py-2 text-body leading-5 text-ink-60"><span className="font-semibold text-ink">What changed: </span>{a.effect}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-meta text-ink-50">Allowed by “{label(a.ruleKey)}”</span>
              <span className="ms-auto">
                {a.undoable
                  ? (a.undone ? <Btn variant="quiet" size="sm" onClick={() => redoActivity(a.id)}>Redo</Btn> : <Btn variant="quiet" size="sm" onClick={() => undoActivity(a.id)}>Undo</Btn>)
                  : <span className="text-meta text-ink-50">Cannot be undone</span>}
              </span>
            </div>
            {!a.undoable && a.undoNote && <p className="text-meta leading-4 text-ink-50">{a.undoNote}</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   What HeyMoon may do alone
   ══════════════════════════════════════════════════════════════════ */

const LEVELS: { key: AutonomyLevel; label: string }[] = [
  { key: "alone", label: "On its own" }, { key: "ask", label: "Ask me" }, { key: "never", label: "Never" },
];

export function AutonomyView() {
  const autonomy = useAutonomy();
  return (
    <div className="flex flex-col gap-6">
      <section>
        <H>Locked shut</H>
        <div className="mt-3 grid gap-2 xl:grid-cols-3">
          {autonomy.filter((r) => r.locked).map((r) => (
            <Card key={r.key} className="flex items-start gap-3 p-4">
              <Lock size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-main" />
              <span className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-ink">{r.label}</span>
                <span className="mt-0.5 block text-body leading-5 text-ink-60">{r.detail}</span>
              </span>
              <Chip tone="ink">Never</Chip>
            </Card>
          ))}
        </div>
        <p className="dash-measure mt-2 text-meta leading-4 text-ink-50">Not preferences, and there is no screen that moves them. They are the reason a text box can sit this close to your accounts.</p>
      </section>
      <section>
        <H>Everything else is yours to set</H>
        <div className="mt-3 grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
          {autonomy.filter((r) => !r.locked).map((r) => (
            <Card key={r.key} className="p-4">
              <p className="text-body font-semibold text-ink">{r.label}</p>
              <p className="mt-0.5 text-body leading-5 text-ink-60">{r.detail}</p>
              <div className="mt-3 inline-flex rounded-pill bg-lilac p-1">
                {LEVELS.map((l) => (
                  <button key={l.key} onClick={() => setAutonomy(r.key, l.key)} aria-pressed={r.level === l.key}
                    className={`rounded-pill px-3.5 py-1.5 text-meta font-semibold transition ${r.level === l.key ? "bg-white text-main shadow-card" : "text-ink-50 hover:text-ink"}`}>{l.label}</button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
