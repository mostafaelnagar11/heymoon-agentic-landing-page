"use client";

/* Ads, as a creative review (redrawn 12 Nov: "the ads page is the weakest screen in our design").

   What it was: a small pill switch for the three shelves, a 4:5 crop beside a form, and the live ads as a plain grid.
   What it is now:
   - The three shelves as the dashboard's tiles, each with its count, the line that matters about it and the drafts
     themselves as thumbnails, so where things stand is read before anything is opened.
   - Waiting: the review deck (ReviewDeck), the draft on a phone in its platform's frame beside HeyMoon's call; or the
     same drafts as portrait cards, for picking several and approving them together.
   - Live: ranked by what each ad has sold, the top seller marked, sales on the creative and views and sales per 1,000
     views under it, every figure still one press from its source.
   - Declined: the same cards, with the note the creator was sent and the way back into the queue.

   Nothing here publishes. `setAdState` is the only path to live and it is only ever called from a brand's click. */

import { useState, type ReactNode } from "react";
import { ArrowCounterClockwise, CheckCircle, Clock, Images, Prohibit, Rocket, ThumbsDown, ThumbsUp, Trophy } from "@phosphor-icons/react";
import type { AdRecord } from "../../lib/agent/types";
import { REVIEW_WINDOW_DAYS, draftDaysLeft, fmtCount, fmtUSD } from "../../lib/mock/campaigns";
import { setAdState, useAds, useCan, useLivePhase, useStore } from "../../lib/store";
import { MemberCall, RecLine } from "./Roles";
import { ReviewDeck } from "./ReviewDeck";
import { Claim, Figure } from "../Evidence";
import { Btn, Sheet } from "../ui";
import { Detail, Surface } from "./kit";
import { CALL, Checks, PLATFORM_ICON } from "./AdParts";

type Shelf = "waiting" | "live" | "declined";

export function AdsView() {
  const [shelf, setShelf] = useState<Shelf>("waiting");
  /* D · Review with HeyMoon: the queue one draft at a time by default; the cards are a press away. */
  const [deck, setDeck] = useState(true);
  const [sel, setSel] = useState<string[]>([]);
  const ads = useAds();
  const phase = useLivePhase();

  const mine = phase ? ads.filter((a) => a.campaignId === phase.id) : [];
  const waiting = mine.filter((a) => a.state === "waiting");
  const live = mine.filter((a) => a.state === "live").sort((a, b) => (b.performance?.revenue.value ?? 0) - (a.performance?.revenue.value ?? 0));
  const declined = mine.filter((a) => a.state === "declined");
  const held = waiting.filter((a) => a.compliance.verdict === "hold").length;
  const onBrief = waiting.length - held;
  const liveSales = live.reduce((n, a) => n + (a.performance?.revenue.value ?? 0), 0);
  const liveViews = live.reduce((n, a) => n + (a.performance?.views.value ?? 0), 0);
  /* What the agent would sign off on, which is what "select" preselects. Recomputed from the shelf rather than
     stored, so a decision made on a card never leaves a stale id behind in the batch. */
  const wouldApprove = waiting.filter((a) => a.compliance.verdict !== "hold").map((a) => a.id);
  const toggle = (id: string, on: boolean) => setSel((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  const approveSelected = () => { sel.forEach((id) => setAdState(id, "live")); setSel([]); };
  const canApprove = useCan("approve");

  if (!phase) {
    return (
      <Surface className="p-6 text-center">
        <p className="text-body text-ink-soft">No phase is running, so no creator is drafting anything to review.</p>
      </Surface>
    );
  }

  const pick = (s: Shelf) => { setShelf(s); setSel([]); };

  return (
    <div className="space-y-5">
      {/* The three shelves, as the dashboard's tiles. */}
      <div role="tablist" aria-label="Ad shelves" className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
        <ShelfTile
          active={shelf === "waiting"} onClick={() => pick("waiting")} icon={Images} label="Waiting on you"
          value={waiting.length}
          sub={waiting.length ? `${onBrief} on brief${held ? ` · ${held} to re-cut` : ""}` : "nothing waiting"}
          ads={waiting} hot
        />
        <ShelfTile
          active={shelf === "live"} onClick={() => pick("live")} icon={Rocket} label="Live"
          value={live.length}
          sub={live.length ? `${fmtUSD(liveSales)} sold · ${fmtCount(liveViews)} views` : "none live yet"}
          ads={live}
        />
        <ShelfTile
          active={shelf === "declined"} onClick={() => pick("declined")} icon={Prohibit} label="Declined"
          value={declined.length}
          sub={declined.length ? "never published, and can be reopened" : "nothing declined"}
          ads={declined}
        />
      </div>

      {/* The review window, said once, where the queue is. */}
      {shelf === "waiting" && waiting.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="flex items-center gap-2 text-meta text-ink-faint">
            <Clock size={13} weight="fill" aria-hidden className="shrink-0" />
            Undecided drafts publish on their own after {REVIEW_WINDOW_DAYS} days.
          </p>
          <div className="ms-auto inline-flex gap-1 glass !rounded-full p-1" role="group" aria-label="How to review">
            {([["deck", "One by one"], ["grid", "All at once"]] as const).map(([k, t]) => (
              <button key={k} type="button" aria-pressed={(k === "deck") === deck} onClick={() => { setDeck(k === "deck"); setSel([]); }}
                className={`rounded-full px-3.5 py-1.5 text-meta font-semibold transition ${(k === "deck") === deck ? "bg-white text-ink shadow-lift" : "text-ink-faint hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {shelf === "waiting" && waiting.length > 0 && deck && <ReviewDeck drafts={waiting} phase={phase} />}

      {/* All at once: pick, and approve together. */}
      {shelf === "waiting" && waiting.length > 0 && !deck && (
        <>
          {canApprove && (
            <div className="glass flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <span aria-hidden className="grad-tile grid h-7 w-7 shrink-0 place-items-center rounded-full text-meta font-bold">{waiting.length}</span>
              <span className="min-w-0 flex-1 text-body text-ink">{held ? `${wouldApprove.length} to approve, ${held} to re-cut` : "All ready to approve"}</span>
              <Btn variant="quiet" size="sm" onClick={() => setSel(wouldApprove)}>Select the {wouldApprove.length} on brief</Btn>
              <Btn size="sm" disabled={!sel.length} onClick={approveSelected}>
                <ThumbsUp size={13} weight="fill" aria-hidden /> {sel.length ? `Approve ${sel.length} and publish` : "Approve and publish"}
              </Btn>
            </div>
          )}
          <CardGrid>{waiting.map((a) => <DraftCard key={a.id} ad={a} selected={sel.includes(a.id)} onSelect={toggle} />)}</CardGrid>
        </>
      )}

      {shelf === "live" && (live.length ? (
        <CardGrid>{live.map((a, k) => <LiveCard key={a.id} ad={a} rank={k} />)}</CardGrid>
      ) : (
        <Empty icon={Rocket} title="Nothing live yet" line="Drafts you approve publish within the hour and collect here, ranked by what they sell." />
      ))}

      {shelf === "declined" && (declined.length ? (
        <CardGrid>{declined.map((a) => <DraftCard key={a.id} ad={a} />)}</CardGrid>
      ) : (
        <Empty icon={Prohibit} title="Nothing declined" line="A decline never publishes, and it collects here so you can change your mind." />
      ))}

      {shelf === "waiting" && waiting.length === 0 && (
        <Empty icon={CheckCircle} tone="good" title="Nothing waiting on you" line="New drafts land here the moment a creator finishes one." />
      )}
    </div>
  );
}

/* ── The shelves ─────────────────────────────────────────────────── */

function ShelfTile({ active, onClick, icon: I, label, value, sub, ads, hot }: {
  active: boolean; onClick: () => void; icon: typeof Images; label: string; value: number; sub: string; ads: AdRecord[]; hot?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`glass flex min-h-[116px] flex-col px-5 py-4 text-start transition hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0 ${active ? "ring-2 ring-brand/30" : "opacity-90 hover:opacity-100"}`}
    >
      <span className="flex items-center gap-2 text-[13px] font-medium text-ink-60">
        <I size={15} aria-hidden /> {label}
        {hot && value > 0 && <span aria-hidden className="ms-auto h-2 w-2 rounded-full bg-blush-deep" />}
      </span>
      <span className="mt-2.5 flex items-end gap-3">
        <span className="num text-[30px] font-bold leading-none tracking-[-0.03em] text-ink">{value}</span>
        {ads.length > 0 && (
          <span aria-hidden className="ms-auto flex -space-x-3 rtl:space-x-reverse">
            {ads.slice(0, 4).map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.id} src={a.img} alt="" className="h-[46px] w-[30px] rounded-[9px] object-cover object-top shadow-[0_6px_14px_-8px_rgba(25,18,52,0.5)] ring-2 ring-white" />
            ))}
          </span>
        )}
      </span>
      <span className="mt-auto pt-2 text-meta text-ink-faint">{sub}</span>
    </button>
  );
}

function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,232px),1fr))]">{children}</div>;
}

function Empty({ icon: I, title, line, tone }: { icon: typeof Images; title: string; line: string; tone?: "good" }) {
  return (
    <Surface className="px-6 py-10 text-center">
      <span aria-hidden className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${tone === "good" ? "bg-good/10 text-good" : "bg-haze text-brand"}`}>
        <I size={24} weight="fill" />
      </span>
      <p className="mt-3 text-body font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-[42ch] text-meta text-ink-faint">{line}</p>
    </Surface>
  );
}

/* ── A draft, as a portrait card ─────────────────────────────────── */

function DraftCard({ ad, selected, onSelect }: { ad: AdRecord; selected?: boolean; onSelect?: (id: string, on: boolean) => void }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const canApprove = useCan("approve");
  const note = useStore((s) => s.declineNotes[ad.id]);
  const P = PLATFORM_ICON[ad.platform];
  const call = CALL[ad.compliance.verdict];
  const days = draftDaysLeft(ad.submitted);
  const flags = ad.compliance.checks.filter((c) => !c.clean).length;
  const out = ad.state === "declined";

  return (
    <article className={`glass flex min-w-0 flex-col overflow-hidden ${selected ? "ring-2 ring-brand/40" : ""}`}>
      <div className="relative aspect-[4/5] bg-neutral-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.img} alt={`Still from ${ad.creatorName}'s ${ad.format.toLowerCase()} for ${ad.product}`} className={`h-full w-full object-cover object-top ${out ? "grayscale-[60%]" : ""}`} loading="lazy" />
        <span className="absolute start-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-sm">
          <P size={11} weight="fill" aria-hidden /> {ad.format}
        </span>
        {!out && (
          <span className={`absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold ${call.ink}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${call.dot}`} /> {call.chip}
          </span>
        )}
        {onSelect && canApprove && !out && (
          <label className="absolute bottom-2.5 end-2.5 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/95 shadow-lift">
            <input type="checkbox" checked={!!selected} onChange={(e) => onSelect(ad.id, e.target.checked)}
              aria-label={`Select ${ad.creatorName}'s draft for batch approval`} className="h-4 w-4 accent-brand" />
          </label>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-white">
          <p className="ad-shadow truncate text-body font-semibold">{ad.creatorName}</p>
          <p className="ad-shadow truncate text-meta text-white/85">{ad.product}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${flags ? "bg-amber-soft text-amber" : "bg-good/10 text-good-deep"}`}>
            {flags ? `${flags} to fix` : "All checks clean"}
          </span>
          {days !== null && !out && (
            <span className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${days <= 2 ? "bg-danger/10 text-danger" : "bg-haze text-ink-faint"}`}>{days}d left</span>
          )}
          {out && <span className="rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold text-ink-faint">Declined</span>}
        </div>
        <p className="mt-2 line-clamp-2 text-meta leading-4 text-ink-soft">{ad.caption}</p>
        {out && note && <p className="mt-2 rounded-[12px] bg-haze/70 px-3 py-2 text-meta leading-4 text-ink-soft"><span className="font-semibold text-ink">Your note: </span>{note}</p>}
        <div className="mt-2.5">
          <Detail summary="HeyMoon's call">
            <Claim src={ad.compliance.reasoning} />
            <Checks ad={ad} className="mt-1" />
          </Detail>
        </div>

        <div className="mt-auto pt-3">
          {out ? (
            <button type="button" onClick={() => setAdState(ad.id, "waiting")}
              className="btn-soft inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-pill text-meta font-semibold">
              <ArrowCounterClockwise size={13} weight="bold" aria-hidden /> Put it back in the queue
            </button>
          ) : !canApprove ? (
            <MemberCall adId={ad.id} />
          ) : (
            <div className="space-y-2">
              <RecLine adId={ad.id} />
              <div className="flex gap-2">
                <Btn variant="quiet" size="sm" className="flex-1" onClick={() => setDeclining(true)}>
                  <ThumbsDown size={13} weight="fill" aria-hidden /> Decline
                </Btn>
                <Btn size="sm" className="flex-[1.5]" onClick={() => setAdState(ad.id, "live")}>
                  <ThumbsUp size={13} weight="fill" aria-hidden /> Approve
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet open={declining} onClose={() => setDeclining(false)} labelledBy={`dec-${ad.id}`}>
        <div className="p-5">
          <h2 id={`dec-${ad.id}`} className="text-title font-bold text-ink">Why is this not right?</h2>
          <p className="mt-1.5 text-body leading-6 text-ink-soft">
            {ad.creatorName} sees your reason, so they know what to change. A decline never publishes and you can reopen it.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 280))}
            rows={3}
            placeholder="It doesn't follow the brief because…"
            className="mt-3 w-full resize-none rounded-[14px] border border-hairline bg-rail p-3 text-body text-ink outline-none focus:border-ink/25"
          />
          <p className="mt-1 text-end text-meta tabular-nums text-ink-faint">{reason.length}/280</p>
          <div className="mt-4 flex gap-2">
            <Btn variant="quiet" className="flex-1" onClick={() => setDeclining(false)}>Cancel</Btn>
            <Btn className="flex-[1.4]" disabled={!reason.trim()} onClick={() => { setAdState(ad.id, "declined", reason.trim()); setDeclining(false); }}>
              Send the decline
            </Btn>
          </div>
        </div>
      </Sheet>
    </article>
  );
}

/* ── A live ad, ranked by what it has sold ───────────────────────── */

function LiveCard({ ad, rank }: { ad: AdRecord; rank: number }) {
  const P = PLATFORM_ICON[ad.platform];
  const perf = ad.performance;
  const perK = perf ? (perf.revenue.value / Math.max(1, perf.views.value)) * 1000 : 0;
  return (
    <article className={`glass flex min-w-0 flex-col overflow-hidden ${rank === 0 ? "ring-2 ring-brand/25" : ""}`}>
      <div className="relative aspect-[4/5] bg-neutral-200">
        {ad.video ? (
          <video src={ad.video} poster={ad.img} muted loop playsInline autoPlay={rank === 0} className="h-full w-full object-cover" aria-label={`${ad.creatorName}'s ${ad.format.toLowerCase()}`} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.img} alt={`${ad.creatorName}, ${ad.product}`} className="h-full w-full object-cover object-top" loading="lazy" />
        )}
        <span className="absolute start-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-sm">
          <P size={11} weight="fill" aria-hidden /> {ad.format}
        </span>
        <span className={`absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${rank === 0 ? "grad-tile" : "bg-white/95 text-good-deep"}`}>
          {rank === 0 ? <><Trophy size={11} weight="fill" aria-hidden /> Top seller</> : <><span aria-hidden className="h-1.5 w-1.5 animate-live rounded-full bg-good" /> Live</>}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-12 text-white">
          <p className="ad-shadow truncate text-body font-semibold">{ad.creatorName}</p>
          {perf && <p className="ad-shadow num mt-0.5 text-[24px] font-bold leading-none tracking-[-0.03em]">{fmtUSD(perf.revenue.value)}</p>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="truncate text-meta font-medium text-ink-soft">{ad.product}</p>
        {perf && (
          <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-hairline pt-2.5">
            <div><p className="text-[11px] text-ink-faint">Views</p><Figure src={perf.views} render={fmtCount(perf.views.value)} size="sm" /></div>
            <div><p className="text-[11px] text-ink-faint">Sales</p><Figure src={perf.revenue} render={fmtUSD(perf.revenue.value)} size="sm" /></div>
            <div><p className="text-[11px] text-ink-faint">Per 1K views</p><p className="num text-body font-semibold text-ink">${perK.toFixed(1)}</p></div>
          </div>
        )}
        <p className="mt-auto pt-2.5 text-[11px] text-ink-faint"><span className="num">{ad.track}</span> · {ad.submitted}</p>
      </div>
    </article>
  );
}
