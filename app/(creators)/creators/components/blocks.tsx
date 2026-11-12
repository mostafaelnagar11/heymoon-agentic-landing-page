"use client";

/* The typed blocks the conversation is made of, in the Figma's language.
 *
 * The thread is not a list of strings. Every turn is a typed block, so
 * the campaign card in the conversation is the same component as the
 * one on Explore, reading the same object. Nothing here owns data.
 *
 * ONE RULE THAT EVERY INTERACTIVE BLOCK HERE FOLLOWS: once it has been
 * answered it becomes a record of the answer. A conversation is a
 * transcript, and a control that stays live in one lets somebody
 * re-answer a question the thread has already moved past — which is
 * how a cadence card once read "3 posts per week" above terms that
 * read 2. Settled, a block renders from what was actually submitted.
 * Changing your mind is done in the message box, and the agent builds
 * a new block. */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight, CalendarCheck, CaretLeft, CaretRight, Check, Handshake, Info, Lock, Minus, Plus, Sparkle,
  TrendUp, X,
} from "@phosphor-icons/react";
import { ProfileReadCard, ProfileReadLive } from "./chat/ProfileRead";
import { Emblem } from "../../../_shared/Emblem";
import { Btn, Card, Chip, Avatar, Skeleton, KV, DonePill } from "./ui";
import { Figure, Claim, ClaimPlain, EvidenceRow } from "./Evidence";
import { TypeOn } from "../../../_shared/TypeOn";
import { CampaignCard, DeliverablesCard, Soc } from "./figma";
import { CodeBadge } from "./CodeBadge";
import { Flag } from "./Flag";
import { longDate } from "../lib/dates";
import {
  CADENCES,
  type AcceptRequest, type Cadence, type CreatorRead, type Decision,
  type Offer, type Profile, type ReadLayerKey,
} from "../lib/agent/types";
import { BUILD_TASKS, READ_TASKS, tools } from "../lib/agent/tools";
import {
  afterThreeMonths, earningsFor, money, orderValue,
} from "../lib/agent/model";

/* ══════════════════════════════════════════════════════════════════
   Who is working
   ══════════════════════════════════════════════════════════════════ */

export interface RosterTask { key: string; agent: string; role: string; note: string; produces: string }

export const agentsIn = (tasks: RosterTask[]) => Array.from(new Set(tasks.map((t) => t.agent)));
export const agentForLayer = (k: ReadLayerKey) => READ_TASKS.find((t) => t.key === k)?.agent ?? "An agent";

const NUMBER_WORD = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const countWord = (n: number) => NUMBER_WORD[n] ?? String(n);

export function rosterTitle(tasks: RosterTask[], tail: string) {
  const n = agentsIn(tasks).length;
  const w = countWord(n);
  return `${w[0].toUpperCase()}${w.slice(1)} agent${n === 1 ? "" : "s"} ${tail}`;
}

/* The brand's roster (12 Nov: "every component in the creator should act similar to its similar one in the brand"):
   a tile per agent in two columns, the one at work lifted with its ring turning, the finished ones ticked, the
   queued ones an empty outline, and the count in a chip on the title. */
export function TaskRoster({ tasks, done, live, title }: { tasks: RosterTask[]; done: string[]; live: boolean; title: string }) {
  const finished = new Set(done);
  const activeKey = live ? tasks.find((t) => !finished.has(t.key))?.key : undefined;
  const byAgent = tasks.reduce<Record<string, { role: string; tasks: RosterTask[] }>>((acc, t) => {
    (acc[t.agent] ??= { role: t.role, tasks: [] }).tasks.push(t); return acc;
  }, {});
  return (
    <Card edge className="overflow-hidden">
      <p className="flex items-center gap-2 px-4 pt-4 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-orchid @lg:px-5">
        {live ? <span aria-hidden className="working-ring h-3.5 w-3.5" /> : <Check size={12} weight="bold" aria-hidden />}
        {title}
        <span className="num ms-auto rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-main">
          {done.length}/{tasks.length}
        </span>
      </p>
      <ul className="grid gap-2 p-3 @lg:grid-cols-2 @lg:p-4">
        {Object.entries(byAgent).map(([name, a]) => {
          const doneHere = a.tasks.filter((t) => finished.has(t.key));
          const current = a.tasks.find((t) => t.key === activeKey);
          const allDone = doneHere.length === a.tasks.length;
          const line = allDone ? a.tasks.map((t) => t.produces).join(" · ")
            : current ? `${current.note}…`
            : doneHere.length > 0 ? doneHere.map((t) => t.produces).join(" · ")
            : live ? "Waiting to start" : "Did not get to this";
          return (
            <li key={name} className={`flex items-start gap-3 rounded-[16px] px-3.5 py-3 transition ${
              current ? "bg-white shadow-lift ring-1 ring-main/20" : allDone ? "bg-white/70 ring-1 ring-main/[0.06]" : "bg-haze/50"
            }`}>
              <span aria-hidden className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] ${
                allDone ? "bg-green text-white" : current ? "bg-haze" : "border border-dashed border-black/15"}`}>
                {allDone ? <Check size={13} weight="bold" /> : current ? <span className="working-ring h-4 w-4" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-meta font-semibold text-ink">{name}</span>
                  <span className="text-meta text-ink-50">{a.role}</span>
                </span>
                <span className="mt-0.5 block truncate text-meta text-ink-60">{line}</span>
              </span>
              <span className="num shrink-0 pt-0.5 text-[11px] font-semibold text-ink-50">{doneHere.length}/{a.tasks.length}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   The read
   ══════════════════════════════════════════════════════════════════ */

/* None of what the read shows is a follower count. Rasha: "we don't focus on the followers... views, followers,
   reach. We focus more on their influence — authenticity, consistency." */

/* WHAT THE READ SHOWS, and what it deliberately does not: chat/ProfileRead.tsx draws accounts, niche, audience,
   voice, cadence and conflicts. `reach` is read — matching needs it — and never displayed. */

/* WHAT A SAMPLE READ SAYS FIRST. Any handle that is not seeded is read
   off the sample creator's figures (personFor), and every row under
   this would otherwise say "you" about somebody else's audience. It
   opens the card while it streams as well as once it has finished,
   because the figures start arriving before the read is done. */
export function SampleNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2.5 bg-lilac/60 px-4 py-3 text-body leading-5 text-ink-60 ${className}`}>
      <Info size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-ink-50" />
      This prototype reads three sample creators. What follows is a sample read, not yours.
    </p>
  );
}

export function ReadBlock({ read, live, onOpen }: { read: CreatorRead | null; live: boolean; onOpen?: () => void }) {
  if (!read) return null;

  /* ONE COMPONENT WHILE IT READS. This used to be three: these rows
     loading, a roster of the five agents under them, and a progress
     line under that — the same work reported three times, and the
     roster's "Finding where your audience actually is" sat a block away
     from the "Where they are" row it was filling. Now every row is one
     thing being pulled, with the agent pulling it beside it: waiting,
     working, then the answer. The header carries the count. */
  if (live) {
    /* The brand's live store read, in the creator's tokens (chat/ProfileRead.tsx): a tile per finding, the agent on
       it until it lands, then the finding written out. */
    return <ProfileReadLive read={read} notice={read.sample ? <SampleNotice className="border-b border-line" /> : undefined} />;
  }

  /* Drawn as tiles now (chat/ProfileRead.tsx): the standing first, then each finding in its own kind. */
  return <ProfileReadCard read={read} onOpen={onOpen} notice={read.sample ? <SampleNotice className="border-b border-line" /> : undefined} />;
}

export function ReadValue({ read, layer, short }: { read: CreatorRead; layer: ReadLayerKey; short?: boolean }) {
  const Pending = () => <Skeleton w="62%" h={12} />;
  switch (layer) {
    case "accounts": {
      const v = read.accounts; if (!v) return <Pending />;
      return (
        <Claim src={v}>
          <span className="flex flex-col gap-1">
            {v.value.map((a) => (
              <span key={a.platform + a.handle} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Soc platform={a.platform} size={18} />
                <span className="font-medium text-ink">{a.handle}</span>
                {/* Wraps as a unit onto its own line when it does not fit
                    beside the handle, instead of being crushed to one
                    word per line in whatever width was left. */}
                <span className="min-w-0 text-brand text-ink-50">{a.note}</span>
              </span>
            ))}
          </span>
        </Claim>
      );
    }
    /* READ, NEVER SHOWN. Matching needs how a post performs; a creator
       being told their view-through is what they are worth is the thing
       the review cut. Returning null rather than deleting the layer
       keeps that decision visible. */
    case "reach": return null;
    case "audience": {
      const v = read.audience; if (!v) return <Pending />;
      return (
        <Claim src={v}>
          <span className="flex flex-col gap-0.5">
            {v.value.markets.slice(0, short ? 2 : 4).map((m) => (
              <span key={m.code} className="flex items-baseline gap-2">
                <Flag code={m.code} size={16} className="translate-y-[3px]" />
                <span className="flex-1 text-ink">{m.name}</span>
                <span className="num text-ink-50">{m.share}%</span>
              </span>
            ))}
            {!short && <span className="text-brand text-ink-50">Mostly {v.value.age[0]} to {v.value.age[1]}, {v.value.femaleShare}% women.</span>}
          </span>
        </Claim>
      );
    }
    case "niche": { const v = read.niche; if (!v) return <Pending />;
      return <Claim src={v}>{v.value.primary}, then {v.value.also.join(" and ")}. {v.value.paidShare}% of your last thirty were paid.</Claim>; }
    case "voice": { const v = read.voice; if (!v) return <Pending />;
      return <Claim src={v}><span className="flex flex-col gap-1"><span className="text-ink">{v.value.register}</span><span className="text-brand italic text-ink-50">“{v.value.sample}”</span></span></Claim>; }
    case "cadence": { const v = read.cadence; if (!v) return <Pending />;
      return <Claim src={v}>{v.value.perWeek} posts a week since {v.value.activeSince}. About {v.value.turnaroundDays} days from brief to delivery.</Claim>; }
    case "conflicts": { const v = read.conflicts; if (!v) return <Pending />;
      if (!v.value.length) return <Claim src={v}>Nothing in your grid blocks a campaign.</Claim>;
      return <Claim src={v}><span className="flex flex-col gap-0.5">{v.value.map((c) => (
        <span key={c.brand}><span className="font-medium text-ink">{c.brand}</span><span className="text-brand text-ink-50"> · {c.standing}. Blocks {c.blocks.join(", ")}.</span></span>))}</span></Claim>; }
    case "standing": { const v = read.standing; if (!v) return <Pending />;
      return (
        <Claim src={v.line}>
          <span className="flex flex-col gap-1">
            <span className="text-ink">{v.line.value}</span>
            {!short && v.strengths.value.map((line) => (
              <span key={line} className="text-brand text-ink-50">{line}</span>
            ))}
          </span>
        </Claim>
      ); }
    default: { const v = read.identity; if (!v) return <Pending />; return v.bio ? <Claim src={v.bio} /> : null; }
  }
}

/* ══════════════════════════════════════════════════════════════════
   YOUR PROFILE — was the rate card, and carries no rates
   ══════════════════════════════════════════════════════════════════

     Alex   "we no longer want to use the word card. What is a card?
             It's not an intuitive concept."
     Rasha  "the concept of card, also rate card — we don't really use
             it."

   And nothing in it is a price. A creator does not price themselves
   here; the campaign's share is the price and it is the brand's. What
   this shows is what brands will come to them for, the influence
   signals matching reads, and what they have said they will not take. */

/* WHILE IT IS BEING BUILT (12 Nov: the brand's plan fills in under its roster as it is built, so this does too). The
   card is drawn from the build's first chunk, and each section shows the agent on it until that agent's task has
   landed, then writes itself out, as the live read's tiles do. Nothing is shown before its task is done: the stream
   carries the whole profile from the start, and `landed` is what decides what may be seen. Availability is set by
   MoonShot AI and lands without a section of its own, as in the finished card. */
const BUILD_SECTION = { authority: "authority", influence: "match", noList: "safety" } as const;
const doingNote = (note: string) => note.charAt(0).toLowerCase() + note.slice(1);

export function ProfileBlock({ profile, onOpen, building }: {
  profile: Profile;
  onOpen?: () => void;
  /** While the build runs: the BUILD_TASKS keys that have landed. */
  building?: { landed: string[] };
}) {
  const has = (k: string) => !building || building.landed.includes(k);
  const write = (k: string, node: ReactNode) =>
    building ? <ClaimPlain.Provider value={true}><TypeOn id={`${profile.id}:build:${k}`}>{node}</TypeOn></ClaimPlain.Provider> : node;
  const working = (k: string) => {
    const t = BUILD_TASKS.find((x) => x.key === k)!;
    return (
      <p className="mt-2 flex items-start gap-2 text-meta text-ink-50">
        <span aria-hidden className="working-ring mt-0.5 h-3 w-3 shrink-0" />
        <span className="min-w-0"><span className="font-semibold text-ink-60">{t.agent}</span> is {doingNote(t.note)}…</span>
      </p>
    );
  };
  const landedCount = building ? building.landed.length : 0;
  return (
    <Card edge className="overflow-hidden p-4 @lg:p-5">
      <div className="flex items-center gap-3.5">
        <span className="shrink-0 rounded-full bg-white p-[3px] shadow-lift">
          <Avatar src={profile.avatar} name={profile.creatorName ?? "You"} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold leading-6 text-ink">Your profile</p>
          <p className="truncate text-meta text-ink-50" dir="ltr">{profile.handle}</p>
        </div>
        {building ? (
          <span className="num inline-flex h-8 shrink-0 items-center gap-2 rounded-pill bg-haze px-3 text-meta font-semibold text-main">
            <span aria-hidden className="working-ring h-3.5 w-3.5" />
            {landedCount}/{BUILD_TASKS.length}
          </span>
        ) : onOpen && <button onClick={onOpen} className="btn-soft h-8 shrink-0 rounded-pill px-3.5 text-meta font-semibold">Open</button>}
      </div>

      {/* What brands will come to them for, lit: the one line of this card a creator would say about themselves. */}
      <div className={`mt-4 rounded-[18px] p-4 transition ${has(BUILD_SECTION.authority) ? "grad-ws ring-1 ring-inset ring-main/[0.08]" : "bg-haze/60"}`}>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-orchid">Known for</p>
        {has(BUILD_SECTION.authority) ? write(BUILD_SECTION.authority, (
          <div>
            <Claim src={profile.authority} className="mt-1.5 block leading-6">
              <span className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{profile.authority.value.primary}</span>
              {profile.authority.value.also.length > 0 && <span className="text-body text-ink-60">, then {profile.authority.value.also.join(" and ")}</span>}
            </Claim>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {profile.platforms.value.map((pl) => <Soc key={pl} platform={pl} size={24} />)}
            </div>
          </div>
        )) : working(BUILD_SECTION.authority)}
      </div>

      <div className="mt-3 grid gap-3 @lg:grid-cols-[1.4fr_1fr]">
        {/* THE FOUR SIGNALS. This is what replaced the rate table, and
            not one of them is a count of an audience. */}
        <div className={`rounded-[18px] p-4 transition ${has(BUILD_SECTION.influence) ? "bg-white/80 ring-1 ring-main/[0.07]" : "bg-haze/60"}`}>
          <p className="text-meta font-semibold text-ink-60">What matching reads</p>
          {has(BUILD_SECTION.influence) ? write(BUILD_SECTION.influence, (
            <Claim src={profile.influence}>
              <ul className="mt-2.5 space-y-2">
                {profile.influence.value.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-body leading-5 text-ink">
                    <span aria-hidden className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-green text-white"><Check size={10} weight="bold" /></span>
                    {line}
                  </li>
                ))}
              </ul>
            </Claim>
          )) : working(BUILD_SECTION.influence)}
        </div>
        <div className={`rounded-[18px] p-4 transition ${has(BUILD_SECTION.noList) ? "bg-white/80 ring-1 ring-main/[0.07]" : "bg-haze/60"}`}>
          <p className="text-meta font-semibold text-ink-60">You will not take</p>
          {has(BUILD_SECTION.noList) ? write(BUILD_SECTION.noList, (
            <div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {profile.noList.value.categories.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-pill bg-danger/[0.07] px-2.5 py-1 text-meta font-semibold text-danger">
                    <X size={11} weight="bold" aria-hidden />{c}
                  </span>
                ))}
              </div>
              {profile.noList.value.note && <p className="mt-2.5 text-meta leading-4 text-ink-60">{profile.noList.value.note}</p>}
            </div>
          )) : working(BUILD_SECTION.noList)}
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ORDERS → EARNINGS
   ══════════════════════════════════════════════════════════════════

     Alex  "we want to calculate when you join a campaign, not before."
     Alex  "if I make that many sales for this brand I expect this much
            money... a scroll — if I make these many orders, I make this
            much money — like a bar."

   So it appears AFTER joining, it is dragged rather than read, and the
   unit is orders. Never views: Rasha, "we don't pay per view."

   It stays interactive when the thread moves past it, unlike every
   answering block in this file. Nothing was asked here — the creator
   is doing arithmetic, and taking the slider away after one drag would
   be taking away the tool rather than recording an answer. */

export function EarningsBlock({ offer }: { offer: Offer }) {
  const { low, mid, high } = offer.orders.value;
  const ceiling = Math.max(high, mid * 2, 10);
  const step = Math.max(1, Math.round(ceiling / 60));
  const [orders, setOrders] = useState(mid);
  const set = (n: number) => setOrders(Math.max(0, Math.min(ceiling, n)));
  const each = orderValue(offer.family);
  const month = earningsFor(orders, offer.family, offer.commissionPct);
  const fill = (orders / ceiling) * 100;
  /* THREE PLACES TO START FROM, off the campaign's own forecast, so the
     first press already shows what a quiet and a strong month look like
     — the slider alone left it unclear that it moved orders at all. */
  const presets = [
    { label: "A quiet month", n: low },
    { label: "Expected", n: mid },
    { label: "A strong month", n: high },
  ];

  return (
    <Card edge className="overflow-hidden">
      <div className="grad-ws px-4 pb-4 pt-4 @lg:px-5">
        <p className="text-[17px] font-semibold leading-6 text-ink">What {offer.brand} could pay you</p>
        <p className="mt-1 text-body leading-5 text-ink-60">Move the slider to set how many orders your code brings in, and see your share of them.</p>
        <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
          <Figure src={offer.orders} render={money(month)} size="xl" label="You earn" />
          <span className="pb-1 text-row text-ink">for <span className="num font-semibold">{orders}</span> order{orders === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="px-4 pb-4 pt-4 @lg:px-5">
        {/* The slider between a minus and a plus, so it reads as a
            control on a phone as well as with a mouse. */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => set(orders - step)} disabled={orders <= 0} aria-label="Fewer orders"
            className="btn-soft grid h-10 w-10 shrink-0 place-items-center rounded-pill text-main disabled:opacity-40"><Minus size={16} weight="bold" aria-hidden /></button>
          <input type="range" min={0} max={ceiling} step={step} value={orders} onChange={(e) => set(Number(e.target.value))}
            aria-label="Orders your code brings in" aria-valuetext={`${orders} orders, ${money(month)}`}
            className="hm-range min-w-0 flex-1" style={{ background: `linear-gradient(to right, #6848D1, #A65FED ${fill}%, #F1EEFB ${fill}%)` }} />
          <button type="button" onClick={() => set(orders + step)} disabled={orders >= ceiling} aria-label="More orders"
            className="btn-soft grid h-10 w-10 shrink-0 place-items-center rounded-pill text-main disabled:opacity-40"><Plus size={16} weight="bold" aria-hidden /></button>
        </div>
        <div className="mt-3 inline-flex max-w-full flex-wrap gap-1 rounded-[18px] bg-haze/70 p-1">
          {presets.map((p) => (
            <button key={p.label} type="button" onClick={() => set(p.n)} aria-pressed={orders === p.n}
              className={`rounded-pill px-3 py-1.5 text-body transition ${orders === p.n ? "bg-white font-semibold text-ink shadow-lift" : "text-ink-60 hover:text-ink"}`}>
              {p.label} · <span className="num">{p.n}</span>
            </button>
          ))}
        </div>

        <p className="num mt-4 rounded-[14px] bg-white/80 px-3.5 py-2.5 text-body text-ink-60 ring-1 ring-main/[0.07]">
          {orders} orders × {money(each)} median order × {offer.commissionPct}% = <span className="font-semibold text-ink">{money(month)}</span>
        </p>

        <div className="mt-3 flex items-start gap-3 rounded-[16px] bg-white/80 px-4 py-3.5 ring-1 ring-main/[0.07]">
          <span aria-hidden className="grad-tile grid h-9 w-9 shrink-0 place-items-center rounded-[11px]"><TrendUp size={17} weight="bold" /></span>
          <span className="min-w-0">
            <span className="block text-body font-semibold text-ink">Where consistency gets you</span>
            <span className="mt-0.5 block text-body leading-5 text-ink-60">
              Three campaigns like this one come to about{" "}
              <span className="num grad-text font-bold">{money(afterThreeMonths(month))}</span>, because an audience that has bought from you once buys again more readily.
            </span>
          </span>
        </div>
        <p className="mt-3 text-meta leading-4 text-ink-60">
          There is no ceiling and no floor: a quiet month pays less and a good one more. It is not a guarantee.
        </p>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HeyMoon, in a few numbers
   ══════════════════════════════════════════════════════════════════

     Alex  "imagine you are talking to a creator in person... you look
            at their profile in your phone... you're a good fit for Moon
            Tech... at Moon Tech we are this great one, two, three, four."

   So after the read, before the check: what HeyMoon is, in a sentence,
   and two figures about other creators. Both are samples until
   HeyMoon's real ones are in, and each one says so. */

export function IntroBlock() {
  const stats = tools.platform_stats();
  return (
    <Card edge className="overflow-hidden p-4 @lg:p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#6848D1,#C2418B)] text-white shadow-pri">
          <Emblem size={20} />
        </span>
        <p className="text-[17px] font-semibold leading-6 text-ink">A little about HeyMoon</p>
      </div>
      <p className="mt-3 text-body leading-6 text-ink-60">
        Brands in the Gulf pay creators a share of every order they bring in. There is no agency in the middle and nothing to pay to join.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.key} className="relative rounded-[18px] bg-white/80 px-4 py-3.5 ring-1 ring-main/[0.07]">
            {s.sample && <span className="absolute end-2.5 top-2.5 rounded-pill bg-haze px-2 py-0.5 text-tiny font-semibold text-ink-50">Sample</span>}
            <p className="num grad-text text-[26px] font-bold leading-none tracking-[-0.03em]">{s.value}</p>
            <p className="mt-1.5 text-meta leading-4 text-ink-60">{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   A row of campaigns
   ══════════════════════════════════════════════════════════════════ */

export function OfferCarousel({ offers, render, title }: {
  offers: Offer[];
  render: (o: Offer) => ReactNode;
  title?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const measure = useCallback(() => {
    const el = rail.current; if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  }, []);
  useEffect(() => {
    measure(); const el = rail.current; if (!el) return;
    const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, [measure, offers.length]);
  const page = (dir: -1 | 1) => {
    const el = rail.current; if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 12), behavior: "smooth" });
  };
  const scrollable = !(edge.start && edge.end);
  return (
    <section aria-label="Campaigns you can join">
      <div className="mb-2 flex items-center gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-body font-semibold text-ink"><Sparkle size={14} weight="fill" aria-hidden className="shrink-0 text-main" />{title ?? `${offers.length} ${offers.length === 1 ? "campaign" : "campaigns"}`}</p>
        {scrollable && (
          <div className="ms-auto flex gap-1">
            <button onClick={() => page(-1)} disabled={edge.start} aria-label="Previous campaigns" className="grid h-7 w-7 place-items-center rounded-pill bg-lilac text-main transition disabled:opacity-30"><CaretLeft size={12} weight="bold" aria-hidden /></button>
            <button onClick={() => page(1)} disabled={edge.end} aria-label="More campaigns" className="grid h-7 w-7 place-items-center rounded-pill bg-lilac text-main transition disabled:opacity-30"><CaretRight size={12} weight="bold" aria-hidden /></button>
          </div>
        )}
      </div>
      <div ref={rail} onScroll={measure} tabIndex={0} className="no-bar -mx-1 flex snap-x snap-proximity items-stretch gap-3 overflow-x-auto px-1 pb-1">
        {offers.map((o) => <div key={o.id} data-card className="flex w-[290px] shrink-0 snap-start">{render(o)}</div>)}
      </div>
    </section>
  );
}

/** A campaign card with its state on it. Open → the detail, whatever
    state it is in: an approved campaign is where the work lives, so
    making a decided card inert would put the brief behind nothing. The
    badge says what happened; the press still opens it. */
export function CampaignBlockCard({ offer, onOpen, footer, pill }: {
  offer: Offer;
  onOpen: () => void;
  /** A state the offer does not carry yet — "Joining" while the join is
      under way. The offer's own state wins once it has one. */
  pill?: string;
  /** Three labelled numbers under a rule, above 768px. Opt-in: the
      conversation's 290px carousel passes nothing and renders exactly
      as it did before. */
  footer?: ReactNode;
}) {
  return (
    /* With a footer (the dashboard's Active cards) the frosted card is the surface, as the brand's campaign cards are,
       and the card inside it goes clear so the two read as one object. */
    <div className={`relative flex w-full flex-col ${footer ? "md:glass md:overflow-hidden" : ""}`}>
      <CampaignCard offer={offer} onOpen={onOpen} className={`h-full ${footer ? "md:bg-transparent md:shadow-none" : ""}`} />
      {offer.state !== "open" && (
        <span className="absolute end-3 top-3 rounded-pill bg-white/95 px-2.5 py-1 text-meta font-semibold text-ink shadow-card">
          {STATE_WORD[offer.state]}
        </span>
      )}
      {/* An OPEN card still carries its early-bird bar and its
          Pre-qualified badge, so this sits under the bar on the other
          side from the badge rather than on top of either. */}
      {offer.state === "open" && pill && (
        <span className={`absolute start-2 inline-flex h-6 items-center rounded-[6px] bg-main px-1.5 text-meta font-semibold text-white shadow-card ${offer.bonus ? "top-9" : "top-2"}`}>
          {pill}
        </span>
      )}
      {footer && <div className="hidden md:mx-3 md:mb-3 md:mt-1 md:grid md:border-t md:border-hairline md:pt-4">{footer}</div>}
    </div>
  );
}

export const STATE_WORD: Record<string, string> = {
  open: "Open", applied: "Requested", approved: "Active", rejected: "Not this time", declined: "You passed", expired: "Expired",
  completed: "Completed",
};

/* ══════════════════════════════════════════════════════════════════
   The brief
   ══════════════════════════════════════════════════════════════════ */

export function BriefBlock({ offer, showCode = true }: {
  offer: Offer;
  /** False where the campaign already pins the code above this. Two
      copies of the one string on one screen is not emphasis. */
  showCode?: boolean;
}) {
  return (
    <Card edge className="overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <p className="text-body font-semibold text-ink">{offer.brief.headline.value}</p>
        <p className="mt-0.5 text-brand text-ink-50">{offer.brand} · written in your register by MoonWriter AI</p>
      </div>
      <div className="space-y-4 p-4">
        <BriefList title="Say these" items={offer.brief.mustSay.value} tone="green" />
        <BriefList title="Do not" items={offer.brief.mustNotSay.value} tone="danger" />
        <DeliverablesCard deliverables={offer.deliverables} />
        <div>
          <p className="text-brand font-semibold text-main">Tone</p>
          <p className="mt-1 text-body leading-5 text-ink-60">{offer.brief.tone.value}</p>
        </div>
        {showCode && <CodeBadge code={offer.code} link={offer.trackingLink} />}
      </div>
    </Card>
  );
}

function BriefList({ title, items, tone }: { title: string; items: string[]; tone: "green" | "danger" }) {
  return (
    <div>
      <p className="text-brand font-semibold text-main">{title}</p>
      <ul className="mt-1 space-y-1">
        {items.map((s) => (
          <li key={s} className="flex items-start gap-2 text-body leading-5 text-ink-60">
            {tone === "green" ? <Check size={14} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-green" /> : <X size={14} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-danger" />}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Scheduling preference
   ══════════════════════════════════════════════════════════════════ */

export function CadenceBlock({ offer, onPick, settled, initial, bare }: {
  offer: Offer; onPick: (c: Cadence) => void; settled?: Cadence;
  /** Picked to start with — the last choice, when the creator comes back. */
  initial?: Cadence;
  /** Inside a popup, which carries the title and is already the surface. */
  bare?: boolean;
}) {
  const [picked, setPicked] = useState<Cadence>(initial ?? "3pw");
  const chosen = settled ?? picked;
  const total = offer.deliverables.reduce((n, d) => n + d.count, 0);
  const weeks = Math.ceil(total / (CADENCES.find((c) => c.key === chosen)?.perWeek ?? 3));

  /* Answered: folded to the brand's DonePill, the one shape every answered card in both apps takes. */
  if (settled) {
    return (
      <DonePill>
        <span className="font-semibold text-ink">{CADENCES.find((c) => c.key === settled)?.label}</span>
        {" · "}{total} deliverable{total === 1 ? "" : "s"}, about {weeks} week{weeks === 1 ? "" : "s"} of posting.
      </DonePill>
    );
  }

  const Wrap = bare ? "div" : Card;
  return (
    <Wrap {...(bare ? {} : { edge: true })} className="overflow-hidden">
      <div className={bare ? "px-4" : "flex items-center gap-3 px-4 pb-1 pt-4 @lg:px-5 @lg:pt-5"}>
        {!bare && (
          <span aria-hidden className="grad-tile grid h-10 w-10 shrink-0 place-items-center rounded-[12px] shadow-pri"><CalendarCheck size={19} weight="fill" /></span>
        )}
        <div className="min-w-0">
          {!bare && <p className="text-[17px] font-semibold leading-6 text-ink">Scheduling preference</p>}
          <p className="text-body text-ink-60">Please select your preferred posting schedule</p>
        </div>
      </div>
      <div className="space-y-4 p-4 @lg:px-5 @lg:pb-5">
        {/* The design's own line, and on a performance campaign it is
            literally true rather than encouragement: more posting is
            more orders, and orders are what pays. */}
        <div className="grad-ws flex items-start gap-3 rounded-[16px] px-4 py-3 ring-1 ring-inset ring-main/[0.08]">
          <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-white text-main shadow-edge"><TrendUp size={16} weight="bold" /></span>
          <span className="min-w-0">
            <span className="block text-body font-semibold text-ink">Consistent posting means higher earnings</span>
            <span className="mt-0.5 block text-meta leading-5 text-ink-60">
              You earn {offer.commissionPct}% of every order your code brings in, so the schedule you can actually keep
              matters more than the fastest one.
            </span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CADENCES.map((c) => {
            const on = picked === c.key;
            const w = Math.ceil(total / c.perWeek);
            return (
              <button key={c.key} onClick={() => setPicked(c.key)} aria-pressed={on}
                className={`rounded-[18px] px-4 py-3.5 text-start transition ${on ? "grad-promo shadow-pri" : "bg-white/85 ring-1 ring-main/[0.08] hover:shadow-lift hover:ring-main/20"}`}>
                <span className={`num block text-[24px] font-bold leading-none tracking-[-0.03em] ${on ? "text-white" : "text-ink"}`}>{c.perWeek}×</span>
                <span className={`mt-1.5 block text-body font-semibold ${on ? "text-white" : "text-ink"}`}>{c.label}</span>
                <span className={`num mt-0.5 block text-meta ${on ? "text-white/80" : "text-ink-50"}`}>about {w} week{w === 1 ? "" : "s"}</span>
              </button>
            );
          })}
        </div>
        <p className="text-meta leading-4 text-ink-50">
          {total} deliverable{total === 1 ? "" : "s"} at this cadence is about {weeks} week{weeks === 1 ? "" : "s"} of posting
          {offer.duration ? `, inside the ${offer.duration} ${offer.brand} is running it for.` : ". This one has no end date."}
        </p>
        <Btn full onClick={() => onPick(picked)}>Continue</Btn>
      </div>
    </Wrap>
  );
}

/* ══════════════════════════════════════════════════════════════════
   The application — a request, and a press
   ══════════════════════════════════════════════════════════════════ */

export function AcceptBlock({ req, onConfirm, onCancel, bare }: {
  req: AcceptRequest; onConfirm: () => void; onCancel: () => void;
  /** Inside a popup, which carries the "Join" title and is already the
      surface. */
  bare?: boolean;
}) {
  const settled = req.state !== "pending";
  const line = req.needsApproval ? "A request to join. Nothing is agreed until the brand answers." : "You're Pre-qualified. Pressing it joins you.";
  const outcome = req.state !== "confirmed" ? "Not sent. Nothing was agreed."
    : req.needsApproval ? "Request sent. It is with the brand."
    : "You're on the campaign.";
  /* Answered, in the conversation: folded to the DonePill, as the brand's checkout folds once it is paid. In a popup
     the full card stays, because the popup closes on its own. */
  /* A cancelled request is not a done step, so it gets no green tick: a plain card, as the brand's checkout is when
     it was not paid. */
  if (settled && !bare && req.state !== "confirmed") {
    return <Card edge className="p-4"><p className="text-body text-ink-60"><span className="font-semibold text-ink">{req.brand}</span>{" · "}{outcome}</p></Card>;
  }
  if (settled && !bare) {
    return <DonePill><span className="font-semibold text-ink">{req.brand}</span>{" · "}{outcome}</DonePill>;
  }
  const Wrap = bare ? "div" : Card;
  return (
    <Wrap {...(bare ? {} : { edge: true })} className="overflow-hidden">
      {bare
        ? <p className="px-4 text-body text-ink-60">{line}</p>
        : (
          <div className="flex items-center gap-3 px-4 pt-4 @lg:px-5 @lg:pt-5">
            <span aria-hidden className="grad-tile grid h-10 w-10 shrink-0 place-items-center rounded-[12px] shadow-pri"><Handshake size={20} weight="fill" /></span>
            <div className="min-w-0">
              <p className="text-[17px] font-semibold leading-6 text-ink">Join {req.brand}</p>
              <p className="text-meta text-ink-50">{line}</p>
            </div>
          </div>
        )}
      <div className="p-4 @lg:p-5">
        {/* No money figure here. The share is the terms; what it comes
            to is the calculator's job, and that is after joining. */}
        <div className="grad-ws flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-[18px] px-4 py-3.5 ring-1 ring-inset ring-main/[0.08]">
          <span className="num grad-text text-[40px] font-bold leading-none tracking-[-0.035em]">{req.commissionPct}%</span>
          <span className="text-body text-ink-60">of every order you bring in</span>
        </div>
        <div className="mt-3 grid gap-3 @lg:grid-cols-2">
          <div className="rounded-[18px] bg-white/85 p-4 ring-1 ring-main/[0.07]">
            <p className="text-meta font-semibold text-ink-60">You&apos;re agreeing to</p>
            <ul className="mt-2.5 space-y-2">{req.commits.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-body leading-5 text-ink">
                <span aria-hidden className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-main text-white"><Check size={10} weight="bold" /></span>{c}
              </li>
            ))}</ul>
          </div>
          <div className="rounded-[18px] bg-green-10 p-4">
            <p className="text-meta font-semibold text-green">You&apos;re not</p>
            <ul className="mt-2.5 space-y-2">{req.notCommits.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-body leading-5 text-ink">
                <span aria-hidden className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-green text-white"><Lock size={10} weight="bold" /></span>{c}
              </li>
            ))}</ul>
          </div>
        </div>
        {settled ? (
          <p className="mt-4 flex items-center gap-2.5 rounded-pill bg-green-10 px-3 py-2 text-body font-semibold text-green">
            <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-green text-white"><Check size={12} weight="bold" /></span>{outcome}</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <Btn full onClick={onConfirm}>{req.needsApproval ? "Send request" : "Join Campaign"}</Btn>
            <Btn full variant="ghost" onClick={onCancel}>Not yet</Btn>
          </div>
        )}
      </div>
    </Wrap>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Application status — the file's own screen
   ══════════════════════════════════════════════════════════════════ */

export function DecisionBlock({ offer, decision, onGo, goLabel = "Go to campaign", firstDue, bare }: {
  offer: Offer; decision: Decision; onGo?: () => void;
  goLabel?: string;
  /** When the first ad is due, once there is a schedule to say it from. */
  firstDue?: string;
  /** Inside a sheet, which is already the surface: no card of its own. */
  bare?: boolean;
}) {
  const yes = decision.outcome === "approved";
  const cadence = CADENCES.find((c) => c.key === decision.cadence)?.label ?? "";
  /* A PRE-QUALIFIED CAMPAIGN WAS NEVER AN APPLICATION, so it cannot be
     congratulated on being approved. HeyMoon cleared it before the
     creator pressed anything and the brand was never asked — saying
     otherwise invents a decision to take credit for. */
  const pre = offer.match.level === "prequalified";
  /* The day it was answered, from the stamp the store put on it. "Today"
     is only true on the day. */
  const on = decision.decidedAt ? longDate(new Date(decision.decidedAt)) : decision.at;
  const due = firstDue ? ` Your first ad is due ${firstDue}.` : "";
  const Wrap = bare ? "div" : Card;
  return (
    <Wrap {...(bare ? {} : { edge: true })} className="overflow-hidden">
      <div className={`flex flex-col items-center px-6 pb-6 pt-8 text-center ${yes ? "grad-ws" : "bg-paper"}`}>
        <span aria-hidden className={`grid h-16 w-16 place-items-center rounded-pill text-white ${yes ? "medallion" : "bg-ink/20"}`}>
          {yes ? <Check size={28} weight="bold" /> : <X size={28} weight="bold" />}
        </span>
        <p id={bare ? "application-status" : undefined} className="mt-6 text-title font-semibold leading-7 text-ink">
          {!yes ? `${offer.brand} passed on your request`
            : pre ? `You're on ${offer.brand}`
            : `${offer.brand} approved your request`}
        </p>
        <p className="mt-3 max-w-[38ch] text-body leading-5 text-ink-60">
          {!yes ? decision.because
            : pre ? `You were Pre-qualified, so there was nothing for ${offer.brand} to review. Your code and tracking link are ready.${due}`
            : `${offer.brand} reviewed your request and said yes. Your code and tracking link are ready, and the campaign is yours to start.${due}`}
        </p>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="min-w-0">
            <p className="truncate text-row font-semibold text-ink">{offer.title}</p>
            <p className="text-body text-ink-60">{offer.brand} Brand Collaboration</p>
          </div>
          <Avatar name={offer.brand} src={offer.brandLogo} size={32} />
        </div>
        <KV k="Status" v={<Chip tone={yes ? "green" : "ink"}>{!yes ? "Not this time" : pre ? "Active" : "Approved"}</Chip>} />
        <KV k={!yes ? "Answered" : pre ? "Joined" : "Approved Date"} v={on} />
        <KV k="Scheduling" v={cadence} />
        <KV k="Campaign Duration" v={decision.duration ?? "No end date"} last={!yes} />
        {yes && <KV k="Pays" v={`${offer.commissionPct}% of every order`} last />}
        {onGo && <Btn full className="mt-4" onClick={onGo}>{goLabel}</Btn>}
      </div>
    </Wrap>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Odds and ends
   ══════════════════════════════════════════════════════════════════ */

export function ChangesBlock({ changes }: { changes: { id: string; label: string; from: string; to: string; because: string; detail?: string }[] }) {
  if (!changes.length) return null;
  return (
    <Card edge className="overflow-hidden">
      <p className="px-4 pt-3 text-brand font-semibold text-main">What changed</p>
      <ul className="divide-y divide-line">
        {changes.map((c) => (
          <li key={c.id} className="px-4 py-2.5">
            <p className="flex flex-wrap items-baseline gap-x-2 text-body text-ink">
              <span className="font-semibold">{c.label}</span>
              <span className="num text-ink-50 line-through">{c.from}</span>
              <ArrowRight size={11} weight="bold" aria-hidden className="text-ink-50" />
              <span className="num font-semibold">{c.to}</span>
            </p>
            <p className="mt-0.5 text-meta text-ink-50">{c.because}</p>
            {c.detail && <p className="mt-1 text-meta leading-4 text-ink-60">{c.detail}</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** THE THIN CASE, and it is no longer about a price being too high.
    HeyMoon has nothing for this person because no brand running today
    wants somebody like them — so what it owes them is which signal is
    short, in the language it actually matches on. */
export function RejectedBlock({ read }: { read: CreatorRead }) {
  const st = read.standing; if (!st) return null;
  return (
    <Card edge className="overflow-hidden">
      <div className="border-b border-line bg-paper px-4 py-3"><p className="text-body font-semibold text-ink">HeyMoon cannot place you yet</p></div>
      <div className="space-y-3 p-4 text-body leading-5 text-ink-60">
        {/* The line and what matching read are the result at the top of the read now (ProfileRead), so this block
            carries only what would change it. */}
        {st.wouldChangeIt && (
          <div>
            <p className="text-brand font-semibold text-main">What would change it</p>
            <ul className="mt-1.5 space-y-1.5">
              {st.wouldChangeIt.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <ArrowRight size={12} weight="bold" aria-hidden className="mt-1 shrink-0 text-ink-50" />{line}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-meta text-ink-50">Nothing here is a judgement on the work, and none of it is about how many people follow you. It is what the brands running today asked for, and it is checked again whenever you ask.</p>
      </div>
    </Card>
  );
}

export { EvidenceRow };
