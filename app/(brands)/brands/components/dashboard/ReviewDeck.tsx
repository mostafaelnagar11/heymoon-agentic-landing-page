"use client";

/* D · Review with HeyMoon (Mostafa picked it, 20 Oct). The drafts one at a time, with HeyMoon's call already made:
   the checks it ran against the brief, what the draft should sell in its first week, and for a draft that misses the
   brief, the note to the creator already written. A to approve, R for a re-cut, arrows to move; "Approve the N on
   brief" clears the queue in one press.

   A re-cut is the existing decline-with-a-reason: it never publishes, and the creator gets the note. Approving is
   still the brand's press, here as everywhere. */

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Sparkle, ThumbsUp, Warning } from "@phosphor-icons/react";
import type { AdRecord } from "../../lib/agent/types";
import type { Phase } from "../../lib/mock/campaigns";
import { fmtUSD } from "../../lib/mock/campaigns";
import { draftEstimate, draftNote } from "../../lib/agent/moves";
import { setAdState, useAds } from "../../lib/store";
import { Avatar, Btn } from "../ui";

const CALL = {
  approve: { word: "Approve", skin: "bg-good/10 text-good-deep" },
  "approve-with-note": { word: "Approve, with a note", skin: "bg-brand/10 text-brand" },
  hold: { word: "Hold for a re-cut", skin: "bg-danger/10 text-danger" },
} as const;

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

  const approve = () => { if (ad) setAdState(ad.id, "live"); };
  const recut = () => {
    if (!ad) return;
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
      <div className="rounded-tile border border-hairline bg-white p-8 text-center shadow-card">
        <CheckCircle size={26} weight="fill" className="mx-auto text-good" aria-hidden />
        <p className="mt-2 text-body font-semibold text-ink">Every draft is decided</p>
      </div>
    );
  }

  const call = CALL[ad.compliance.verdict];
  const hold = ad.compliance.verdict === "hold";
  const estimate = draftEstimate(ad, phase, ads);

  return (
    <div className="space-y-4">
      {/* Where you are in the queue, and the one press that clears the part HeyMoon would approve. */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-body font-semibold text-ink">Review drafts</p>
        <span className="num text-meta text-ink-faint">{at + 1} of {drafts.length}</span>
        <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-pill bg-white">
          <div className="h-full rounded-pill bg-brand transition-all" style={{ width: `${((at + 1) / drafts.length) * 100}%` }} />
        </div>
        {cleared.length > 0 && (
          <Btn size="sm" variant="quiet" onClick={() => cleared.forEach((a) => setAdState(a.id, "live"))}>
            Approve the {cleared.length} on brief
          </Btn>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        {/* The draft. */}
        <article className="overflow-hidden rounded-tile border border-hairline bg-white shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ad.img} alt={`Still from ${ad.creatorName}'s ${ad.format.toLowerCase()}`} className="aspect-[4/5] w-full object-cover object-top" />
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Avatar src={ad.avatar} name={ad.creatorName} size={22} />
              <p className="truncate text-body font-semibold text-ink">{ad.creatorName}</p>
              <span className="ms-auto text-[11px] text-ink-faint">{ad.format}</span>
            </div>
            <p className="mt-1 text-meta font-medium text-ink-soft">{ad.product}</p>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-ink-faint">{ad.caption}</p>
          </div>
        </article>

        {/* HeyMoon's call. */}
        <section className="rounded-tile border border-brand/25 bg-white p-5 shadow-card ring-4 ring-brand/[0.05]">
          <div className="flex items-center gap-2">
            <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
              <Sparkle size={11} weight="fill" />
            </span>
            <h2 className="text-body font-semibold text-main">HeyMoon&apos;s call</h2>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-pill px-3 py-1 text-meta font-semibold ${call.skin}`}>{call.word}</span>
            <span className="text-[11px] text-ink-faint">checked against your brief</span>
          </div>

          <ul className="mt-3 space-y-2">
            {ad.compliance.checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5 text-meta" title={c.detail}>
                <span aria-hidden className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-white ${c.clean ? "bg-good" : "bg-danger"}`}>
                  {c.clean ? <CheckCircle size={10} weight="fill" /> : <Warning size={10} weight="fill" />}
                </span>
                <span className={c.clean ? "text-ink" : "font-semibold text-danger"}>{c.label}</span>
              </li>
            ))}
          </ul>

          {!hold && (
            <p className="mt-4 rounded-control bg-lilac px-3.5 py-2.5 text-meta">
              <span className="font-semibold text-ink">Expected</span>
              <span className="text-ink-soft"> about {fmtUSD(estimate)} in its first week</span>
            </p>
          )}

          {/* The note to the creator: written by HeyMoon for a hold, blank for a change the brand wants. */}
          {note !== null && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-main">
                {hold ? "Note to the creator, drafted for you" : "What should change?"}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder={`Tell ${ad.creatorName.split(" ")[0]} what to change`}
                className="mt-1.5 w-full resize-none rounded-control border border-hairline bg-white p-3 text-meta leading-5 text-ink outline-none focus:border-ink/25"
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hold ? (
              <>
                <Btn size="sm" onClick={recut} disabled={!note?.trim()}>Send note <kbd className="ms-1 text-[10px] opacity-70">R</kbd></Btn>
                <Btn size="sm" variant="ghost" onClick={approve}>Approve anyway</Btn>
              </>
            ) : (
              <>
                <Btn size="sm" onClick={approve}>
                  <ThumbsUp size={13} weight="fill" aria-hidden /> Approve and publish <kbd className="ms-1 text-[10px] opacity-70">A</kbd>
                </Btn>
                <Btn size="sm" variant="quiet" onClick={recut} disabled={note !== null && !note.trim()}>
                  {note === null ? "Ask for changes" : "Send note"} <kbd className="ms-1 text-[10px] opacity-70">R</kbd>
                </Btn>
              </>
            )}
            <span className="ms-auto flex gap-1">
              <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={at === 0} aria-label="Previous draft"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-faint transition hover:bg-black/[0.04] disabled:opacity-30">
                <ArrowLeft size={14} weight="bold" aria-hidden className="rtl:rotate-180" />
              </button>
              <button type="button" onClick={() => setI((n) => Math.min(drafts.length - 1, n + 1))} disabled={at === drafts.length - 1} aria-label="Next draft"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-faint transition hover:bg-black/[0.04] disabled:opacity-30">
                <ArrowRight size={14} weight="bold" aria-hidden className="rtl:rotate-180" />
              </button>
            </span>
          </div>
        </section>
      </div>

      {/* The queue, with HeyMoon's call as a dot on each. */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {drafts.map((d, k) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setI(k)}
            aria-label={`${d.creatorName}, ${d.product}`}
            aria-current={k === at || undefined}
            className={`relative shrink-0 overflow-hidden rounded-control transition ${k === at ? "ring-2 ring-brand ring-offset-2" : "opacity-70 hover:opacity-100"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.img} alt="" className="h-[84px] w-[64px] object-cover object-top" />
            <span aria-hidden className={`absolute bottom-1.5 start-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${d.compliance.verdict === "hold" ? "bg-danger" : "bg-good"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
