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
  ArrowRight, CaretLeft, CaretRight, Check, CheckCircle, CreditCard, Info, Lock, Minus, Plus, Sparkle, X,
} from "@phosphor-icons/react";
import { Btn, Callout, Card, Chip, Avatar, Skeleton, KV } from "./ui";
import { Figure, Claim, EvidenceRow } from "./Evidence";
import { CampaignCard, DeliverablesCard, Soc } from "./figma";
import { CodeBadge } from "./CodeBadge";
import { Flag } from "./Flag";
import { longDate } from "../lib/dates";
import {
  CADENCES,
  type AcceptRequest, type Cadence, type CreatorRead, type Decision,
  type Offer, type Profile, type ReadLayerKey,
} from "../lib/agent/types";
import { READ_TASKS, tools } from "../lib/agent/tools";
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

export function TaskRoster({ tasks, done, live, title }: { tasks: RosterTask[]; done: string[]; live: boolean; title: string }) {
  const finished = new Set(done);
  const activeKey = live ? tasks.find((t) => !finished.has(t.key))?.key : undefined;
  const byAgent = tasks.reduce<Record<string, { role: string; tasks: RosterTask[] }>>((acc, t) => {
    (acc[t.agent] ??= { role: t.role, tasks: [] }).tasks.push(t); return acc;
  }, {});
  return (
    <Card className="overflow-hidden">
      <p className="flex items-center gap-2 px-4 pt-3 text-tiny font-bold uppercase tracking-widest text-main">
        {live ? <span aria-hidden className="working-ring h-3 w-3" /> : <Check size={11} weight="bold" aria-hidden />}
        {title}
      </p>
      <ul className="divide-y divide-line">
        {Object.entries(byAgent).map(([name, a]) => {
          const doneHere = a.tasks.filter((t) => finished.has(t.key));
          const current = a.tasks.find((t) => t.key === activeKey);
          const allDone = doneHere.length === a.tasks.length;
          const line = allDone ? a.tasks.map((t) => t.produces).join(" · ")
            : current ? `${current.note}…`
            : doneHere.length > 0 ? doneHere.map((t) => t.produces).join(" · ")
            : live ? "Waiting to start" : "Did not get to this";
          return (
            <li key={name} className="flex items-start gap-3 px-4 py-2.5">
              <span aria-hidden className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-pill ${
                allDone ? "bg-green-10 text-green" : current ? "" : "border border-dashed border-black/15"}`}>
                {allDone ? <Check size={12} weight="bold" /> : current ? <span className="working-ring h-4 w-4" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-meta font-semibold text-ink">{name}</span>
                  <span className="text-brand text-ink-50">{a.role}</span>
                </span>
                <span className="mt-0.5 block truncate text-brand text-ink-60">{line}</span>
              </span>
              <span className="num shrink-0 pt-0.5 text-brand text-ink-50">{doneHere.length}/{a.tasks.length}</span>
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

/* While it works, a row per thing being read, and none of them is a
   follower count. Rasha: "we don't focus on the followers... views,
   followers, reach. We focus more on their influence — authenticity,
   consistency." Performance is read, and its row says so without a
   number in it. */

const LAYER_LABEL: Record<ReadLayerKey, string> = {
  identity: "You", accounts: "Accounts", reach: "Performance", audience: "Audience",
  niche: "What you post", voice: "Your voice", cadence: "Rhythm", conflicts: "Your grid",
  standing: "Campaigns",
};

/* WHAT THE READ SHOWS, and what it deliberately does not.
   `reach` is read — matching needs it — and never displayed. */
const SHOWN_LAYERS: ReadLayerKey[] = ["accounts", "niche", "audience", "voice", "cadence", "conflicts"];

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
    const done = new Set(read.done);
    const active = READ_TASKS.find((t) => !done.has(t.key))?.key;
    const agents = new Set(READ_TASKS.map((t) => t.agent)).size;
    return (
      <Card className="overflow-hidden">
        {read.sample && <SampleNotice className="border-b border-line" />}
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <span aria-hidden className="working-ring h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold text-ink">{read.sample ? "Reading a sample profile" : "Reading your profile"}</p>
            <p className="truncate text-brand text-ink-50"><span dir="ltr">{read.handle}</span> · {countWord(agents)} agents</p>
          </div>
          <span className="num shrink-0 text-meta font-semibold text-main">{read.done.length}/{READ_TASKS.length}</span>
        </div>
        <dl className="divide-y divide-line">
          {READ_TASKS.map((t) => {
            const state = done.has(t.key) ? "done" : t.key === active ? "working" : "waiting";
            const agent = (
              <span className={`inline-flex shrink-0 items-center gap-1 text-brand font-semibold ${state === "working" ? "text-main" : state === "done" ? "text-ink-50" : "text-ink-40"}`}>
                {state === "done" && <Check size={11} weight="bold" aria-hidden className="text-green" />}
                {t.agent}
              </span>
            );
            return (
              <div key={t.key} className={`flex flex-col gap-1 px-4 py-2.5 transition-colors @lg:flex-row @lg:items-start @lg:gap-3 ${state === "working" ? "bg-lilac/50" : ""}`}>
                <dt className="flex items-center justify-between gap-2 text-brand font-semibold text-ink-50 @lg:w-[92px] @lg:shrink-0 @lg:pt-0.5">
                  {LAYER_LABEL[t.key]}
                  <span className="@lg:hidden">{agent}</span>
                </dt>
                <dd className="min-w-0 flex-1 text-body text-ink">
                  {state === "done" ? <LiveValue read={read} layer={t.key} />
                    : state === "working" ? (
                      <span className="flex items-center gap-2 text-meta text-ink-60">
                        <span aria-hidden className="working-ring h-3 w-3 shrink-0" />{t.note}…
                      </span>
                    ) : <span className="text-meta text-ink-40">Waiting</span>}
                </dd>
                <span className="hidden @lg:block @lg:w-[104px] @lg:shrink-0 @lg:pt-0.5 @lg:text-end">{agent}</span>
              </div>
            );
          })}
        </dl>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {read.sample && <SampleNotice className="border-b border-line" />}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        {/* A sample has no name, so the handle that was typed leads and
            the avatar is the "You" the dashboard uses when there is no
            name to draw. */}
        <Avatar src={read.identity?.avatar} name={read.identity?.name?.value ?? "You"} size={40} />
        <div className="min-w-0 flex-1">
          {read.identity?.name ? (
            <>
              <p className="truncate text-row font-semibold text-ink">{read.identity.name.value}</p>
              <p className="truncate text-meta text-ink-50" dir="ltr">{[read.handle, read.identity.location?.value].filter(Boolean).join(" · ")}</p>
            </>
          ) : (
            <p className="truncate text-row font-semibold text-ink" dir="ltr">{read.handle}</p>
          )}
        </div>
        {onOpen && (
          <button onClick={onOpen} className="shrink-0 rounded-pill bg-lilac px-3 py-1.5 text-meta font-semibold text-main">
            See all
          </button>
        )}
      </div>
      <dl className="divide-y divide-line">
        {SHOWN_LAYERS.map((k) => (
          <div key={k} className="flex flex-col gap-1 px-4 py-2.5 @lg:flex-row @lg:items-start @lg:gap-3">
            <dt className="text-brand font-semibold text-ink-50 @lg:w-[92px] @lg:shrink-0 @lg:pt-0.5">{LAYER_LABEL[k]}</dt>
            <dd className="min-w-0 flex-1 text-body text-ink"><ReadValue read={read} layer={k} /></dd>
          </div>
        ))}
      </dl>
      {read.standing && (
        <div className={`flex items-start gap-2.5 border-t px-4 py-3 ${read.standing.state === "ok" ? "border-green/20 bg-green-10" : "border-line bg-lilac/60"}`}>
          {read.standing.state === "ok"
            ? <CheckCircle size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-green" />
            : <Info size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-ink-50" />}
          <p className={`flex-1 text-body leading-5 ${read.standing.state === "ok" ? "text-green" : "text-ink-60"}`}>{read.standing.line.value}</p>
        </div>
      )}
    </Card>
  );
}

/** A layer as it lands in the live read: the short form, plus the two
    layers the finished read does not list as rows of their own. */
function LiveValue({ read, layer }: { read: CreatorRead; layer: ReadLayerKey }) {
  if (layer === "identity") {
    const v = read.identity;
    if (!v) return null;
    /* The sample's You row is the handle that was typed, and nothing
       else: there is no name or location that would be theirs. */
    if (!v.name) return <span dir="ltr">{read.handle}</span>;
    return <>{v.name.value}{v.location && <span className="text-ink-50"> · {v.location.value}</span>}</>;
  }
  /* Read for the orders forecast (expectedOrders), not for the match —
     matchFor has no reach term — and its number is not shown here. */
  if (layer === "reach") return <span className="text-meta text-ink-50">Used to forecast orders, not to match you. Not shown here.</span>;
  return <ReadValue read={read} layer={layer} short />;
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

export function ProfileBlock({ profile, onOpen }: { profile: Profile; onOpen?: () => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Avatar src={profile.avatar} name={profile.creatorName ?? "You"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-ink">Your profile</p>
          <p className="truncate text-brand text-ink-50" dir="ltr">{profile.handle}</p>
        </div>
        {onOpen && <button onClick={onOpen} className="shrink-0 rounded-pill bg-lilac px-3 py-1.5 text-meta font-semibold text-main">Open</button>}
      </div>

      <div className="space-y-3 p-3">
        <div className="rounded-inner border border-line p-3">
          <p className="text-brand font-semibold text-main">Known for</p>
          <Claim src={profile.authority} className="mt-1 block text-body leading-5 text-ink">
            <span className="font-semibold text-ink">{profile.authority.value.primary}</span>
            {profile.authority.value.also.length > 0 && <span className="text-ink-60">, then {profile.authority.value.also.join(" and ")}</span>}
          </Claim>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {profile.platforms.value.map((pl) => <Soc key={pl} platform={pl} size={20} />)}
          </div>
        </div>

        {/* THE FOUR SIGNALS. This is what replaced the rate table, and
            not one of them is a count of an audience. */}
        <div className="rounded-inner border border-line p-3">
          <p className="text-brand font-semibold text-main">What matching reads</p>
          <Claim src={profile.influence}>
            <ul className="mt-1.5 space-y-1.5">
              {profile.influence.value.map((line) => (
                <li key={line} className="flex items-start gap-2 text-body leading-5 text-ink-60">
                  <Check size={13} weight="bold" aria-hidden className="mt-1 shrink-0 text-green" />{line}
                </li>
              ))}
            </ul>
          </Claim>
        </div>

        <div className="rounded-inner border border-line p-3">
          <p className="text-brand font-semibold text-main">You will not take</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {profile.noList.value.categories.map((c) => <Chip key={c} tone="ink">{c}</Chip>)}
          </div>
          {profile.noList.value.note && <p className="mt-2 text-meta leading-4 text-ink-60">{profile.noList.value.note}</p>}
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
    <Card className="overflow-hidden">
      <div className="px-4 pt-4">
        <p className="text-row font-semibold text-ink">What {offer.brand} could pay you</p>
        <p className="mt-1 text-body leading-5 text-ink-60">Move the slider to set how many orders your code brings in, and see your share of them.</p>
      </div>
      <div className="px-4 pb-4 pt-3">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <Figure src={offer.orders} render={money(month)} size="xl" label="You earn" />
          <span className="pb-1 text-row text-ink">for <span className="num font-semibold">{orders}</span> order{orders === 1 ? "" : "s"}</span>
        </div>

        {/* The slider between a minus and a plus, so it reads as a
            control on a phone as well as with a mouse. */}
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => set(orders - step)} disabled={orders <= 0} aria-label="Fewer orders"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-lilac text-main transition hover:bg-main-10 disabled:opacity-40"><Minus size={16} weight="bold" aria-hidden /></button>
          <input type="range" min={0} max={ceiling} step={step} value={orders} onChange={(e) => set(Number(e.target.value))}
            aria-label="Orders your code brings in" aria-valuetext={`${orders} orders, ${money(month)}`}
            className="hm-range min-w-0 flex-1" style={{ background: `linear-gradient(to right, #4D2FB0 ${fill}%, #E7E0FA ${fill}%)` }} />
          <button type="button" onClick={() => set(orders + step)} disabled={orders >= ceiling} aria-label="More orders"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-lilac text-main transition hover:bg-main-10 disabled:opacity-40"><Plus size={16} weight="bold" aria-hidden /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.label} type="button" onClick={() => set(p.n)} aria-pressed={orders === p.n}
              className={`rounded-pill border px-3 py-1.5 text-body transition ${orders === p.n ? "border-main bg-main-10 font-semibold text-main" : "border-line text-ink-60 hover:border-main/40 hover:text-ink"}`}>
              {p.label} · <span className="num">{p.n}</span>
            </button>
          ))}
        </div>

        <p className="num mt-4 rounded-inner bg-paper px-3 py-2.5 text-body text-ink-60">
          {orders} orders × {money(each)} median order × {offer.commissionPct}% = <span className="font-semibold text-ink">{money(month)}</span>
        </p>

        <div className="mt-3 rounded-inner bg-lilac px-4 py-3">
          <p className="text-body font-semibold text-main">Where consistency gets you</p>
          <p className="mt-0.5 text-body leading-5 text-ink-60">
            Three campaigns like this one come to about{" "}
            <span className="num font-semibold text-ink">{money(afterThreeMonths(month))}</span>, because an audience that has bought from you once buys again more readily.
          </p>
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
    <Card className="overflow-hidden">
      <div className="px-4 pt-4">
        <p className="text-row font-semibold text-ink">A little about HeyMoon</p>
        <p className="mt-1 text-body leading-5 text-ink-60">
          Brands in the Gulf pay creators a share of every order they bring in. There is no agency in the middle and nothing to pay to join.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {stats.map((s) => (
          <div key={s.key} className="relative rounded-inner bg-lilac/60 px-3 py-2.5">
            {s.sample && <span className="absolute end-2 top-2 rounded-chip bg-white/80 px-1.5 text-tiny font-semibold text-ink-50">Sample</span>}
            <p className="num text-section font-semibold text-ink">{s.value}</p>
            <p className="mt-0.5 text-meta leading-4 text-ink-60">{s.label}</p>
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
    <div className={`relative flex w-full flex-col ${footer ? "md:overflow-hidden md:rounded-card md:border md:border-hairline md:bg-white md:shadow-edge" : ""}`}>
      <CampaignCard offer={offer} onOpen={onOpen} className={`h-full ${footer ? "md:border-0 md:shadow-none" : ""}`} />
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
    <Card className="overflow-hidden">
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

const CreditIcon = () => <CreditCard size={20} weight="fill" aria-hidden />;

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

  if (settled) {
    return (
      <Card className="flex items-center gap-3 px-4 py-3">
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-green-10 text-green"><Check size={14} weight="bold" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold text-ink">{CADENCES.find((c) => c.key === settled)?.label}</span>
          <span className="block text-meta text-ink-50">{total} deliverable{total === 1 ? "" : "s"}, about {weeks} week{weeks === 1 ? "" : "s"} of posting.</span>
        </span>
      </Card>
    );
  }

  const Wrap = bare ? "div" : Card;
  return (
    <Wrap className="overflow-hidden">
      <div className={bare ? "px-4" : "px-4 pb-2 pt-4"}>
        {!bare && <p className="text-section font-semibold text-ink">Scheduling preference</p>}
        <p className={`text-body text-ink-60 ${bare ? "" : "mt-1"}`}>Please select your preferred posting schedule</p>
      </div>
      <div className="space-y-4 p-4 pt-2">
        {/* The design's own line, and on a performance campaign it is
            literally true rather than encouragement: more posting is
            more orders, and orders are what pays. */}
        <Callout title="Consistent posting means higher earnings" icon={<CreditIcon />}>
          You earn {offer.commissionPct}% of every order your code brings in, so the schedule you can actually keep
          matters more than the fastest one.
        </Callout>
        <div className="space-y-2">
          {CADENCES.map((c) => (
            <button key={c.key} onClick={() => setPicked(c.key)} aria-pressed={picked === c.key}
              className={`flex w-full items-center gap-3 rounded-inner border px-4 py-3.5 text-start transition ${picked === c.key ? "border-main bg-white" : "border-transparent bg-lilac/60 hover:bg-lilac"}`}>
              <span className="min-w-0 flex-1 text-body font-medium text-ink">{c.label}</span>
              <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-pill border-2 ${picked === c.key ? "border-main" : "border-black/10 bg-white"}`}>
                {picked === c.key && <span className="h-2.5 w-2.5 rounded-pill bg-main" />}
              </span>
            </button>
          ))}
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
  const Wrap = bare ? "div" : Card;
  return (
    <Wrap className="overflow-hidden">
      {bare
        ? <p className="px-4 text-body text-ink-60">{line}</p>
        : (
          <div className="border-b border-line px-4 py-3">
            <p className="text-body font-semibold text-ink">Join {req.brand}</p>
            <p className="mt-0.5 text-brand text-ink-50">{line}</p>
          </div>
        )}
      <div className="p-4">
        {/* No money figure here. The share is the terms; what it comes
            to is the calculator's job, and that is after joining. */}
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="num text-display font-semibold text-ink">{req.commissionPct}%</span>
          <span className="text-body text-ink-50">of every order you bring in</span>
        </div>
        <p className="mt-4 text-brand font-semibold text-main">You&apos;re agreeing to</p>
        <ul className="mt-1.5 space-y-1.5">{req.commits.map((c) => <li key={c} className="flex items-start gap-2 text-body leading-5 text-ink-60"><Check size={14} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-ink-50" />{c}</li>)}</ul>
        <p className="mt-4 text-brand font-semibold text-main">You&apos;re not</p>
        <ul className="mt-1.5 space-y-1.5">{req.notCommits.map((c) => <li key={c} className="flex items-start gap-2 text-body leading-5 text-ink-60"><Lock size={14} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-green" />{c}</li>)}</ul>
        {settled ? (
          <p className="mt-4 flex items-center gap-2 text-body font-semibold text-green"><CheckCircle size={16} weight="fill" aria-hidden />{
            req.state !== "confirmed" ? "Not sent. Nothing was agreed."
              : req.needsApproval ? "Request sent. It is with the brand."
              : "You're on the campaign."
          }</p>
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
    <Wrap className="overflow-hidden">
      <div className={`flex flex-col items-center px-6 pb-6 pt-8 text-center ${yes ? "bg-lilac/70" : "bg-paper"}`}>
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
    <Card className="overflow-hidden">
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
    <Card className="overflow-hidden">
      <div className="border-b border-line bg-paper px-4 py-3"><p className="text-body font-semibold text-ink">HeyMoon cannot place you yet</p></div>
      <div className="space-y-3 p-4 text-body leading-5 text-ink-60">
        <Claim src={st.line}>{st.line.value}</Claim>
        <Claim src={st.strengths}>
          <span className="flex flex-col gap-1">
            {st.strengths.value.map((line) => <span key={line}>{line}</span>)}
          </span>
        </Claim>
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
