"use client";

/* D · Review with HeyMoon (Mostafa picked it, 20 Oct; redrawn 12 Nov, "the ads page is the weakest screen"). The drafts
   one at a time, with HeyMoon's call already made: the draft on a phone as its audience will see it, and beside it the
   call, every check signed by the agent that ran it, what the draft should sell in its first week, how long until an
   undecided draft publishes on its own, and for a draft that misses the brief, the note to the creator already
   written. A to approve, R for a re-cut, arrows to move; "Approve the N on brief" clears the queue in one press.

   A re-cut is the existing decline-with-a-reason: it never publishes, and the creator gets the note. Approving is
   still the brand's press, here as everywhere. */

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Sparkle, ThumbsUp, TrendUp } from "@phosphor-icons/react";
import type { AdRecord } from "../../lib/agent/types";
import type { Phase } from "../../lib/mock/campaigns";
import { REVIEW_WINDOW_DAYS, draftDaysLeft, fmtUSD } from "../../lib/mock/campaigns";
import { draftEstimate, draftNote } from "../../lib/agent/moves";
import { setAdState, useAds, useCan } from "../../lib/store";
import { Claim } from "../Evidence";
import { MemberCall, RecLine } from "./Roles";
import { Btn } from "../ui";
import { CALL, Checks, PhonePreview } from "./AdParts";

export function ReviewDeck({ drafts, phase }: { drafts: AdRecord[]; phase: Phase }) {
  const ads = useAds();
  const [i, setI] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const at = Math.min(i, Math.max(0, drafts.length - 1));
  const ad = drafts[at];
  const cleared = drafts.filter((a) => a.compliance.verdict !== "hold");

  /* A hold opens with its note already written; anything else opens on the call. */
  useEffect(() => {
    setNote(ad && ad.compliance.verdict === "hold" ? draftNote(ad) : null);
  }, [ad?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A member reviews and recommends; approving and asking for changes are the owner's and admins' (store.ts, CAN). */
  const canApprove = useCan("approve");
  const approve = () => { if (ad && canApprove) setAdState(ad.id, "live"); };
  const recut = () => {
    if (!ad || !canApprove) return;
    if (note === null) { setNote(draftNote(ad)); return; }
    if (note.trim()) setAdState(ad.id, "declined", note.trim());
  };

  /* A, R and the arrows, never while typing the note. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "a" || e.key === "A") { e.preventDefault(); approve(); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); recut(); }
      else if (e.key === "ArrowRight") setI((n) => Math.min(drafts.length - 1, n + 1));
      else if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!ad) {
    return (
      <div className="glass p-10 text-center">
        <span aria-hidden className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-good/10 text-good"><CheckCircle size={26} weight="fill" /></span>
        <p className="mt-3 text-body font-semibold text-ink">Every draft is decided</p>
      </div>
    );
  }

  const call = CALL[ad.compliance.verdict];
  const hold = ad.compliance.verdict === "hold";
  const estimate = draftEstimate(ad, phase, ads);
  const days = draftDaysLeft(ad.submitted);

  return (
    <div className="space-y-4">
      {/* Where you are in the queue: a segment a draft, in the colour of HeyMoon's call, and the one press that clears
          the part HeyMoon would approve. */}
      <div className="glass flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3">
        <p className="text-body font-semibold text-ink">Draft <span className="num">{at + 1}</span> of <span className="num">{drafts.length}</span></p>
        <div className="flex min-w-[140px] flex-1 gap-1" aria-hidden>
          {drafts.map((d, k) => (
            <span key={d.id} className={`h-1.5 flex-1 rounded-pill transition ${k === at ? "bg-ink" : `${CALL[d.compliance.verdict].dot} opacity-40`}`} />
          ))}
        </div>
        {cleared.length > 0 && canApprove && (
          <Btn size="sm" onClick={() => cleared.forEach((a) => setAdState(a.id, "live"))}>
            <ThumbsUp size={13} weight="fill" aria-hidden /> Approve the {cleared.length} on brief
          </Btn>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        {/* The draft, as its audience will see it. */}
        <div className="w-full sm:w-[300px] sm:shrink-0">
          <PhonePreview ad={ad} />
          <p className="mt-3 text-center text-meta text-ink-faint">
            <span className="font-semibold text-ink-soft">{ad.format}</span> · {ad.platform} · {ad.submitted} · <span className="num">{ad.track}</span>
          </p>
        </div>

        {/* HeyMoon's call. */}
        <section className={`relative min-w-[280px] flex-1 overflow-hidden rounded-glass p-5 ring-1 sm:p-6 ${call.tint}`}>
          <span aria-hidden className={`pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full blur-3xl ${call.glow}`} />

          <div className="relative flex items-start gap-3.5">
            <span aria-hidden className={`grid h-12 w-12 shrink-0 place-items-center rounded-[16px] text-white ${call.seal}`}>
              <call.Icon size={28} weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`flex items-center gap-1.5 text-eyebrow font-semibold uppercase tracking-[0.14em] ${call.ink}`}>
                <Sparkle size={11} weight="fill" aria-hidden /> HeyMoon&apos;s call
              </p>
              <h2 className="mt-1 text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-ink">{call.word}</h2>
              <p className="mt-0.5 text-meta text-ink-faint">{ad.creatorName} · {ad.product}</p>
            </div>
          </div>

          <div className="relative mt-3"><Claim src={ad.compliance.reasoning} /></div>
          {canApprove && <RecLine adId={ad.id} className="relative mt-2" />}

          {/* The decision first, where it is seen without scrolling (12 Nov): the drafted note for a hold, then the
              presses. What the call rests on follows. */}
          {/* The note to the creator: written by HeyMoon for a hold, blank for a change the brand wants. */}
          {note !== null && canApprove && (
            <div className="relative mt-4">
              <p className="text-meta font-semibold uppercase tracking-[0.06em] text-brand">
                {hold ? "Note to the creator, drafted for you" : "What should change?"}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder={`Tell ${ad.creatorName.split(" ")[0]} what to change`}
                className="mt-1.5 w-full resize-none rounded-[14px] border border-hairline bg-white p-3 text-meta leading-5 text-ink outline-none focus:border-ink/25"
              />
            </div>
          )}

          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            {!canApprove ? (
              <MemberCall adId={ad.id} />
            ) : hold ? (
              <>
                <Btn onClick={recut} disabled={!note?.trim()}>Send the note <kbd className="ms-1 text-[10px] opacity-70">R</kbd></Btn>
                <Btn variant="quiet" onClick={approve}>Approve anyway</Btn>
              </>
            ) : (
              <>
                <Btn onClick={approve}>
                  <ThumbsUp size={14} weight="fill" aria-hidden /> Approve and publish <kbd className="ms-1 text-[10px] opacity-70">A</kbd>
                </Btn>
                <Btn variant="quiet" onClick={recut} disabled={note !== null && !note.trim()}>
                  {note === null ? "Ask for changes" : "Send the note"} <kbd className="ms-1 text-[10px] opacity-70">R</kbd>
                </Btn>
              </>
            )}
            <span className="ms-auto flex gap-1">
              <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={at === 0} aria-label="Previous draft"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-ink-60 ring-1 ring-black/[0.05] transition hover:bg-white disabled:opacity-30">
                <ArrowLeft size={14} weight="bold" aria-hidden className="rtl:rotate-180" />
              </button>
              <button type="button" onClick={() => setI((n) => Math.min(drafts.length - 1, n + 1))} disabled={at === drafts.length - 1} aria-label="Next draft"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-ink-60 ring-1 ring-black/[0.05] transition hover:bg-white disabled:opacity-30">
                <ArrowRight size={14} weight="bold" aria-hidden className="rtl:rotate-180" />
              </button>
            </span>
          </div>
          <div className="relative mt-4 rounded-[16px] bg-white/85 px-4 py-1.5 ring-1 ring-black/[0.04]">
            <p className="pt-2 text-meta font-semibold text-ink-60">Checked against your brief</p>
            <Checks ad={ad} />
          </div>

          <div className="relative mt-3 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
            <div className="rounded-[16px] bg-white/85 p-4 ring-1 ring-black/[0.04]">
              <p className="flex items-center gap-1.5 text-meta font-medium text-ink-60"><TrendUp size={13} aria-hidden /> First week</p>
              {hold ? (
                <p className="mt-1.5 text-body text-ink-soft">Estimated once it is re-cut.</p>
              ) : (
                <p className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="num text-[26px] font-bold leading-none tracking-[-0.03em] text-ink">{fmtUSD(estimate)}</span>
                  <span className="text-meta text-ink-faint">expected</span>
                </p>
              )}
            </div>
            <div className="rounded-[16px] bg-white/85 p-4 ring-1 ring-black/[0.04]">
              <p className="flex items-center gap-1.5 text-meta font-medium text-ink-60"><Clock size={13} aria-hidden /> Review window</p>
              <p className="mt-1.5 flex items-baseline gap-1.5">
                <span className={`num text-[26px] font-bold leading-none tracking-[-0.03em] ${days !== null && days <= 2 ? "text-danger" : "text-ink"}`}>{days ?? REVIEW_WINDOW_DAYS}d</span>
                <span className="text-meta text-ink-faint">until it publishes on its own</span>
              </p>
            </div>
          </div>

        </section>
      </div>

      {/* The queue as a filmstrip, HeyMoon's call as a dot on each. */}
      {drafts.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {drafts.map((d, k) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setI(k)}
              aria-label={`${d.creatorName}, ${d.product}`}
              aria-current={k === at || undefined}
              className="group shrink-0 text-center"
            >
              <span className={`relative block overflow-hidden rounded-[14px] transition ${k === at ? "ring-2 ring-brand ring-offset-2 ring-offset-[#FBFAFE]" : "opacity-70 group-hover:opacity-100"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.img} alt="" className="h-[104px] w-[60px] object-cover object-top" />
                <span aria-hidden className={`absolute bottom-1.5 start-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${CALL[d.compliance.verdict].dot}`} />
              </span>
              <span className={`mt-1.5 block w-[60px] truncate text-[11px] ${k === at ? "font-semibold text-ink" : "text-ink-faint"}`}>{d.creatorName.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
