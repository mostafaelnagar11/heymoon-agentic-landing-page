"use client";

/* Calendar: the month, and what goes out on each day of it.
 *
 * The posts come from lib/calendar.ts — every ad each joined campaign
 * owes, at the cadence the creator promised, standing wherever their
 * own submissions have got it to: in review, accepted, or not. The grid answers "what do I post this week"; the panel
 * beside it answers "what is on this day" and "what is next", which is
 * the question a creator actually opens a calendar with.
 *
 * Above 768px a day holds its posts as chips (brand, format) and a chip
 * opens its campaign. On a phone a day holds dots, and tapping it puts
 * that day's posts in the list underneath — chips at 48px wide would be
 * two letters each. */

import { useMemo, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Btn, Card } from "../ui";
import { BrandMark, Soc } from "../figma";
import { FORMAT_NAME } from "../../lib/agent/model";
import { addDays, dayKey, scheduleFor, startOfDay, type CalPost, type PostState } from "../../lib/calendar";
import { openCampaign, useActiveProfile, useDecisions, useOffers, useSubmissions } from "../../lib/store";
import { useGo } from "../../lib/surface";

/* The words and colours are the Ad Content list's, so a chip here and
   the row it opens say the same thing. */
const STATE: Record<PostState, { label: string; chip: string; dot: string }> = {
  scheduled: { label: "Scheduled", chip: "bg-main-10 text-main", dot: "bg-main" },
  review: { label: "In review", chip: "bg-orange-20 text-orange", dot: "bg-orange" },
  accepted: { label: "Accepted", chip: "bg-green-10 text-green", dot: "bg-green" },
  rejected: { label: "Rejected", chip: "bg-danger/10 text-danger", dot: "bg-danger/60" },
  overdue: { label: "Overdue", chip: "bg-danger/10 text-danger", dot: "bg-danger" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 3;

const monthTitle = (d: Date) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const dayTitle = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const fromKey = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };

/** "Today", "Tomorrow", "In 3 days", "2 days ago". */
function when(k: string, today: Date) {
  const n = Math.round((fromKey(k).getTime() - today.getTime()) / 86_400_000);
  return n === 0 ? "Today" : n === 1 ? "Tomorrow" : n === -1 ? "Yesterday" : n > 0 ? `In ${n} days` : `${-n} days ago`;
}

export function CalendarView() {
  const go = useGo();
  const offers = useOffers();
  const submissions = useSubmissions();
  const decisions = useDecisions();
  const profile = useActiveProfile();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState(() => dayKey(today));

  const { posts, accepted } = useMemo(() => scheduleFor({
    offers, decisions, submissions, today,
    turnaroundDays: profile?.availability.value.turnaroundDays ?? 3,
  }), [offers, decisions, submissions, today, profile]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalPost[]>();
    for (const p of posts) m.set(p.day, [...(m.get(p.day) ?? []), p]);
    return m;
  }, [posts]);

  /* Six weeks, Monday first, so the grid never changes height between
     months. */
  const cells = useMemo(() => {
    const lead = (month.getDay() + 6) % 7;
    const first = addDays(month, -lead);
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
  }, [month]);

  const inMonth = posts.filter((p) => { const d = fromKey(p.day); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); });
  const upcoming = posts.filter((p) => p.day >= dayKey(today) && p.state !== "accepted" && p.state !== "review").slice(0, 5);
  const onPicked = byDay.get(picked) ?? [];
  /* A post opens its campaign on Ad Content, where the row for it is. */
  const open = (p: CalPost) => { openCampaign(p.offerId, "content"); go("campaign"); };
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const toToday = () => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setPicked(dayKey(today)); };

  if (posts.length === 0) {
    return (
      <Card edge className="mx-4 flex flex-col items-center px-6 py-14 text-center md:mx-0">
        <span aria-hidden className="grid h-12 w-12 place-items-center rounded-inner bg-lilac text-main"><CalendarBlank size={22} weight="fill" /></span>
        <p className="mt-4 text-row font-semibold text-ink">Nothing to post yet</p>
        <p className="mt-1.5 max-w-[42ch] text-body text-ink-60">Join a campaign and every post it asks for lands here, on the days your posting schedule puts it.</p>
        <Btn dense className="mt-5" onClick={() => go("home")}>Find a campaign</Btn>
      </Card>
    );
  }

  /* SIZED BY THE COLUMN, NOT THE WINDOW: with Ask Moon open beside
     it the page is 800px on a 1440 screen, and a viewport breakpoint
     would put the panel beside a grid of 60px days. The panel sits
     beside the month only when the column can hold both. */
  return (
    <div className="@container px-4 md:px-0">
    <div className="flex flex-col gap-4 @4xl:grid @4xl:grid-cols-[minmax(0,1fr)_300px] @4xl:items-start @4xl:gap-6">
      <Card edge className="overflow-hidden">
        {/* The month, its way back and forward, and what it holds. */}
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-3 md:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-head font-semibold tracking-[-0.01em] text-ink">{monthTitle(month)}</h2>
            <p className="text-meta text-ink-50">
              {inMonth.length === 0 ? "Nothing to post this month" : `${inMonth.length} ${inMonth.length === 1 ? "post" : "posts"} this month`}
              {accepted > 0 && ` · ${accepted} accepted`}
            </p>
          </div>
          <button type="button" onClick={toToday} className="h-8 rounded-pill px-3 text-meta font-semibold text-main transition hover:bg-lilac">Today</button>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-pill bg-lilac text-main transition hover:bg-main-10"><CaretLeft size={14} weight="bold" aria-hidden className="rtl:rotate-180" /></button>
            <button type="button" onClick={() => shift(1)} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-pill bg-lilac text-main transition hover:bg-main-10"><CaretRight size={14} weight="bold" aria-hidden className="rtl:rotate-180" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-hairline bg-paper">
          {WEEKDAYS.map((d) => <div key={d} className="px-2 py-2 text-center text-eyebrow font-semibold uppercase text-ink-50 md:text-start">{d}</div>)}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const k = dayKey(d);
            const list = byDay.get(k) ?? [];
            const out = d.getMonth() !== month.getMonth();
            const isToday = k === dayKey(today);
            const isPicked = k === picked;
            return (
              <div key={k} className={`relative min-h-[56px] border-hairline md:min-h-[112px] ${i % 7 !== 6 ? "border-e" : ""} ${i < 35 ? "border-b" : ""} ${out ? "bg-paper/60" : "bg-white"} ${isPicked ? "ring-2 ring-inset ring-main/40" : ""}`}>
                {/* The whole day is the target for picking it; the chips
                    sit above it and open their campaign instead. */}
                <button type="button" onClick={() => setPicked(k)}
                  aria-label={`${dayTitle(d)}${list.length ? `, ${list.length} ${list.length === 1 ? "post" : "posts"}` : ""}`}
                  aria-pressed={isPicked} className="absolute inset-0 transition hover:bg-lilac/30" />
                <div className="pointer-events-none relative flex flex-col gap-1 p-1.5 md:p-2">
                  <span className={`num grid h-6 w-6 place-items-center rounded-pill text-meta font-semibold ${isToday ? "bg-main text-white" : out ? "text-ink-40" : "text-ink"}`}>{d.getDate()}</span>
                  {/* Phone: dots. */}
                  {list.length > 0 && (
                    <span className="flex flex-wrap gap-0.5 px-0.5 md:hidden">
                      {list.slice(0, 4).map((p) => <span key={p.id} className={`h-1.5 w-1.5 rounded-pill ${STATE[p.state].dot}`} />)}
                    </span>
                  )}
                  {/* Desktop: chips that open the campaign. */}
                  <span className="hidden flex-col gap-1 md:flex">
                    {list.slice(0, MAX_CHIPS).map((p) => (
                      <button key={p.id} type="button" onClick={() => open(p)} title={`${p.brand} · ${FORMAT_NAME[p.format]} · ${STATE[p.state].label}`}
                        className={`pointer-events-auto flex min-w-0 items-center gap-1 rounded-[6px] px-1 py-1 text-start text-[11px] font-semibold leading-3 transition hover:brightness-95 ${STATE[p.state].chip}`}>
                        {/* The brand is what a week is scanned for; the
                            platform mark says where, and the format is in
                            the tooltip and the day's list. */}
                        <Soc platform={p.platform} size={14} />
                        <span className="min-w-0 truncate">{p.brand}</span>
                      </button>
                    ))}
                    {list.length > MAX_CHIPS && <span className="px-1.5 text-[11px] font-medium text-ink-50">+{list.length - MAX_CHIPS} more</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-hairline px-4 py-3 md:px-5">
          {(Object.keys(STATE) as PostState[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-meta text-ink-60"><span className={`h-2 w-2 rounded-pill ${STATE[s].dot}`} />{STATE[s].label}</span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @xl:grid-cols-[repeat(2,minmax(0,1fr))] @4xl:grid-cols-[minmax(0,1fr)]">
        <Card edge className="p-4">
          <p className="text-row font-semibold text-ink">{picked === dayKey(today) ? "Today" : dayTitle(fromKey(picked))}</p>
          {onPicked.length === 0
            ? <p className="mt-1 text-body text-ink-50">Nothing to post on this day.</p>
            : <ul className="mt-3 flex flex-col gap-2">{onPicked.map((p) => <PostRow key={p.id} post={p} onOpen={() => open(p)} />)}</ul>}
        </Card>

        <Card edge className="p-4">
          <p className="text-row font-semibold text-ink">Up next</p>
          {upcoming.length === 0
            ? <p className="mt-1 text-body text-ink-50">Nothing coming up.</p>
            : <ul className="mt-3 flex flex-col gap-2">{upcoming.map((p) => <PostRow key={p.id} post={p} when={when(p.day, today)} onOpen={() => open(p)} />)}</ul>}
        </Card>
      </div>
    </div>
    </div>
  );
}

function PostRow({ post: p, when, onOpen }: { post: CalPost; when?: string; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-inner border border-hairline p-2.5 text-start transition hover:bg-lilac/40">
        <Soc platform={p.platform} size={28} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-ink">{FORMAT_NAME[p.format]}{p.n && p.total ? <span className="font-normal text-ink-50"> · {p.n} of {p.total}</span> : null}</span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <BrandMark name={p.brand} logo={p.brandLogo} size={16} />
            <span className="truncate text-meta text-ink-50">· {p.campaign}</span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {when && <span className="text-meta font-semibold text-ink">{when}</span>}
          <span className={`rounded-pill px-2 py-0.5 text-tiny font-semibold ${STATE[p.state].chip}`}>{STATE[p.state].label}</span>
        </span>
      </button>
    </li>
  );
}
