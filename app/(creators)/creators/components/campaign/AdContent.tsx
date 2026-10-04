"use client";

/* SUBMIT CONTENT FOR REVIEW — the mobile design's list, on the
 * campaign's Ad Content tab.
 *
 * Every ad the campaign asks for is a row, grouped by the week it is
 * due (Monday to Sunday, the calendar's weeks), and each row says the
 * one thing about it that matters, in the design's words: Upload the
 * ad, Upcoming, In review, Accepted, Rejected. The ad is posted first;
 * what is uploaded here is the proof — its link, or a video of it — so
 * it can be checked against the brief and paid. A row waiting on the
 * creator is the button that does it, so there is no second control to
 * find. A row in review, or accepted, opens to what was submitted. */

import { useState } from "react";
import { CaretDown, Check, FileVideo, ImageSquare, Link as LinkIcon, PlusCircle, VideoCamera, ArrowSquareOut } from "@phosphor-icons/react";
import { Card, Chip, H } from "../ui";
import { Soc } from "../figma";
import { FORMAT_NAME } from "../../lib/agent/model";
import { tools } from "../../lib/agent/tools";
import type { Format, Offer } from "../../lib/agent/types";
import { needsYou, summarize, weeksOf, type AdSlot } from "../../lib/content";
import { dayKey, fromKey, relDay, shortDay, weekLabel } from "../../lib/dates";
import { clock } from "../../lib/proof";
import { useActiveProfile } from "../../lib/store";
import { personFor } from "../../lib/mock/people";
import { useToday } from "../../lib/usePlans";

const FORMAT_ICON: Record<Format, typeof ImageSquare> = {
  Post: ImageSquare, Story: PlusCircle, Reel: VideoCamera, TikTok: VideoCamera, YouTube: VideoCamera,
};

export const bytes = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB` : n >= 1024 ** 2 ? `${Math.round(n / 1024 ** 2)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/** The handle each platform's account carries, for "On: @you". */
export function useHandles(): (p: string) => string {
  const profile = useActiveProfile();
  const person = profile ? personFor(profile.handle) : null;
  return (p) => person?.accounts.find((a) => a.platform === p)?.handle ?? profile?.handle ?? "";
}

export function AdContentList({ offer, slots, onUpload }: {
  offer: Offer;
  slots: AdSlot[];
  /** Submit an ad, or submit it again after a rejection. */
  onUpload: (s: AdSlot) => void;
}) {
  const today = useToday();
  const weeks = weeksOf(slots);
  const sum = summarize(slots);
  const thisWeek = dayKey(weeks.find((w) => w.start <= today && today <= w.end)?.start ?? new Date(0));
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <H aside={<span className="num text-meta font-semibold text-ink-50">{sum.accepted} of {sum.total} accepted</span>}>Submit content for review</H>
        <p className="mt-1 max-w-[62ch] text-body text-ink-60">
          Post each ad from your account, then submit it here. It&apos;s checked against {offer.brand}&apos;s brief, and once it&apos;s accepted it counts toward your payout.
        </p>
      </div>
      {weeks.map((w) => (
        <div key={w.key}>
          <p className="mb-2 flex items-center gap-2 text-body text-ink-50">
            <span className="num">{weekLabel(w.start, w.end)}</span>
            {w.key === thisWeek && <Chip tone="main">This week</Chip>}
          </p>
          <ul className="flex flex-col gap-2">
            {w.slots.map((s) => (
              <AdRow key={s.id} offer={offer} slot={s} today={today} expanded={open === s.id}
                onPress={() => {
                  if (s.state === "review" || s.state === "accepted") setOpen(open === s.id ? null : s.id);
                  else onUpload(s);
                }} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function AdRow({ offer, slot: s, today, expanded, onPress }: {
  offer: Offer; slot: AdSlot; today: Date; expanded: boolean; onPress: () => void;
}) {
  const I = FORMAT_ICON[s.format];
  const handles = useHandles();
  const sub = s.submission;
  const opens = s.state === "review" || s.state === "accepted";
  const when = (ms?: number) => (ms ? relDay(dayKey(new Date(ms)), today) : "");
  const meta: { text: string; tone?: string } =
    s.state === "overdue" ? { text: `Was due ${shortDay(fromKey(s.day))}`, tone: "text-danger" }
    : s.state === "due" ? { text: `Due ${relDay(s.day, today)}` }
    : s.state === "upcoming" ? { text: `Due ${shortDay(fromKey(s.day))} · submit early if it's up` }
    : s.state === "review" ? { text: `Submitted ${when(sub?.sentAt)} · being checked` }
    : s.state === "accepted" ? { text: `Accepted ${when(sub?.answeredAt)} · counts toward your payout`, tone: "text-green" }
    : { text: sub?.note ?? "Something the brief asks for is missing", tone: "text-danger" };

  return (
    <li className={`overflow-hidden rounded-card border bg-white ${needsYou(s) ? "border-main/25" : "border-hairline"}`}>
      <button type="button" onClick={onPress} aria-expanded={opens ? expanded : undefined}
        className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-lilac/30">
        <Soc platform={s.platform} size={28} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-body font-medium text-ink">
            <I size={16} aria-hidden className="shrink-0 text-ink-60" />
            <span className="truncate">{FORMAT_NAME[s.format]}</span>
            <span className="num shrink-0 text-meta font-normal text-ink-50">{s.n} of {s.total}</span>
          </span>
          <span className={`mt-0.5 block truncate text-meta ${meta.tone ?? "text-ink-50"}`}>{meta.text}</span>
        </span>
        <AdStatus slot={s} />
        {opens && <CaretDown size={14} aria-hidden className={`shrink-0 text-ink-50 transition-transform ${expanded ? "rotate-180" : ""}`} />}
      </button>

      {expanded && sub && (
        <div className="border-t border-hairline bg-paper/70 px-4 py-3 text-body text-ink-60">
          {sub.kind === "file" && sub.file ? (
            <p className="flex min-w-0 items-center gap-2">
              <FileVideo size={16} aria-hidden className="shrink-0 text-main" />
              <span className="min-w-0 truncate text-ink">{sub.file.name}</span>
              <span className="num shrink-0 text-meta text-ink-50">
                {bytes(sub.file.size)}{sub.file.seconds ? ` · ${clock(sub.file.seconds)}` : ""}
              </span>
            </p>
          ) : null}
          {sub.link && (
            <a href={/^https?:\/\//.test(sub.link) ? sub.link : `https://${sub.link}`} target="_blank" rel="noreferrer"
              className="mt-1 flex min-w-0 items-center gap-2 text-main hover:underline first:mt-0">
              <LinkIcon size={16} aria-hidden className="shrink-0" />
              <span className="min-w-0 truncate" dir="ltr">{sub.link.replace(/^https?:\/\//, "")}</span>
              <ArrowSquareOut size={13} aria-hidden className="shrink-0" />
            </a>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-ink-50">
            <span>On</span>
            {sub.accounts.map((p) => (
              <span key={p} className="flex items-center gap-1 text-ink-60"><Soc platform={p} size={16} /><span dir="ltr">{handles(p)}</span></span>
            ))}
          </p>
          <p className="mt-2 text-meta leading-4 text-ink-50">
            {s.state === "accepted"
              ? `It counts toward your payout, paid every Friday, and every order on ${offer.code} counts to you.`
              : `Being checked against ${offer.brand}'s brief: that it's up, and carries the code, the link and the tag.`}
          </p>
        </div>
      )}
    </li>
  );
}

/** The right-hand end of a row, in the design's words: the press that
    moves it when nothing has been submitted, and otherwise where it
    stands. A Rejected row is still the button for its next step — the
    line under the format says what that is. */
function AdStatus({ slot: s }: { slot: AdSlot }) {
  if (s.state === "due" || s.state === "overdue") {
    return (
      <span className="g-button inline-flex h-8 shrink-0 items-center rounded-pill border border-white/50 px-3.5 text-meta font-semibold text-[#FBF8FE]">
        Upload the ad
      </span>
    );
  }
  if (s.state === "accepted") return <Chip tone="green">Accepted</Chip>;
  if (s.state === "rejected") return <Chip tone="danger">Rejected</Chip>;
  if (s.state === "review") return <Chip tone="orange">In review</Chip>;
  return <Chip tone="main">Upcoming</Chip>;
}

/** WHAT EVERY AD IS CHECKED AGAINST, on the page, so the seven lines
    can be read before anything is shot — not only from inside the
    upload form. The same seven the form's check ticks. */
export function CheckCard({ offer }: { offer: Offer }) {
  const lines = tools.pre_upload_check({ offer });
  return (
    <Card edge className="overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <p className="text-body font-semibold text-ink">Pre-upload Check</p>
        <p className="mt-0.5 text-brand text-ink-50">What every ad is checked against · written from {offer.brand}&apos;s brief by MoonWriter AI</p>
      </div>
      <ul className="divide-y divide-line">
        {lines.map((l) => (
          <li key={l.key} className="flex items-start gap-3 px-4 py-3">
            <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] bg-lilac text-main"><Check size={12} weight="bold" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink">{l.label}</span>
              <span className="mt-0.5 block break-words text-meta leading-4 text-ink-60">{l.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
