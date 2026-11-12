"use client";

/* The profile read, as the dashboard draws things (Aurora, 11 Nov: "rethink and redesign the components in the
   chat, it still looks the same as the old version").

   It was a two-column table: a grey label and a sentence, six times, with the one thing a creator came to hear,
   whether brands here want them, as the last line of the card. Now that line leads, and each finding is a tile in
   its own kind: the accounts by platform, the audience as shares with the age and the split as chips, the rhythm as
   the two numbers it is. Every figure still carries its source (Claim), and nothing here is computed except where a
   bar sits. `reach` is still read and still never shown. */

import { useRef, useState, type ReactNode } from "react";
import {
  CalendarCheck, ChatCircleText, CheckCircle, GridFour, SealCheck, SealWarning, SquaresFour, UsersThree, type Icon,
} from "@phosphor-icons/react";
import type { CreatorRead, ReadLayerKey, Sourced } from "../../lib/agent/types";
import { focusReadLayer } from "../../lib/store";
import { READ_TASKS } from "../../lib/agent/tools";
import { TypeOn } from "../../../../_shared/TypeOn";
import { GlassPopover } from "../../../../_shared/GlassPopover";
import { Avatar, Card } from "../ui";
import { Claim, ClaimPlain, EvidenceRow } from "../Evidence";
import { Soc } from "../figma";
import { Flag } from "../Flag";

/* A finding, as the brand's store-read tile: the whole tile opens the read panel on it (to correct it), and its
   evidence is one press away on the pill, without leaving the conversation. */
function Tile({ read, k, icon: I, label, wide, children }: {
  read: CreatorRead; k: ReadLayerKey; icon: Icon; label: string; wide?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pill = useRef<HTMLButtonElement>(null);
  const src = (read as unknown as Record<string, Sourced<unknown> | undefined>)[k];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => focusReadLayer(k)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusReadLayer(k); } }}
      aria-label={`${label}. Open to correct.`}
      className={`group min-w-0 cursor-pointer rounded-[18px] bg-white/80 p-4 ring-1 ring-main/[0.07] transition hover:shadow-lift hover:ring-main/[0.16] focus-visible:outline-none focus-visible:ring-main/40 ${wide ? "@lg:col-span-2" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] bg-haze text-main">
          <I size={14} weight="bold" />
        </span>
        <p className="min-w-0 flex-1 truncate text-meta font-semibold text-ink-60">{label}</p>
        {src && src.evidence.length > 0 && (
          <button
            ref={pill}
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={`shrink-0 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold text-main transition ${open ? "bg-main/[0.12]" : "bg-haze hover:bg-main/[0.1]"}`}
          >
            Evidence · {src.evidence.length}
          </button>
        )}
      </div>
      <div className="mt-3"><ClaimPlain.Provider value={true}>{children}</ClaimPlain.Provider></div>
      {/* Over the thread, not inside the tile, as in the brand's read. */}
      {src && (
        <GlassPopover anchor={pill} open={open} onClose={() => setOpen(false)} label={`${label}: evidence`}>
          <p className="flex items-center gap-2 text-meta font-semibold text-ink">
            {label}
            <span className="num rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold text-main">Evidence · {src.evidence.length}</span>
          </p>
          <p className="mt-1.5 text-meta leading-5 text-ink-60">{`Read off ${src.evidence[0]?.label ?? "your profile"}. `}{src.why}</p>
          <ul className="mt-1.5 divide-y divide-hairline">
            {src.evidence.map((ev) => <EvidenceRow key={ev.id} e={ev} />)}
          </ul>
        </GlassPopover>
      )}
    </div>
  );
}

function Accounts({ read }: { read: CreatorRead }) {
  const v = read.accounts!;
  return (
    <Claim src={v} className="block">
      <span className="grid gap-2.5 @lg:grid-cols-2">
        {v.value.map((a) => (
          <span key={a.platform + a.handle} className="flex items-start gap-2.5">
            <Soc platform={a.platform} size={28} />
            <span className="min-w-0">
              <span className="block truncate text-body font-semibold text-ink" dir="ltr">{a.handle}</span>
              <span className="block text-meta leading-4 text-ink-50">{a.note}</span>
            </span>
          </span>
        ))}
      </span>
    </Claim>
  );
}

function Niche({ read }: { read: CreatorRead }) {
  const v = read.niche!;
  return (
    <Claim src={v} className="block">
      <span className="block text-[17px] font-semibold leading-6 text-ink">{v.value.primary}</span>
      <span className="mt-2 flex flex-wrap gap-1.5">
        {v.value.also.map((x) => (
          <span key={x} className="rounded-pill bg-haze px-2.5 py-1 text-meta font-semibold text-main">{x}</span>
        ))}
        <span className="num rounded-pill bg-amber-soft px-2.5 py-1 text-meta font-semibold text-amber">{v.value.paidShare}% paid</span>
      </span>
    </Claim>
  );
}

function Audience({ read }: { read: CreatorRead }) {
  const v = read.audience!;
  const top = Math.max(...v.value.markets.map((m) => m.share), 1);
  return (
    <Claim src={v} className="block">
      <span className="flex flex-col gap-2.5">
        {v.value.markets.slice(0, 4).map((m) => (
          <span key={m.code} className="flex items-center gap-2.5">
            <Flag code={m.code} size={18} />
            <span className="w-[110px] shrink-0 truncate text-meta font-medium text-ink">{m.name}</span>
            <span className="h-1.5 min-w-0 flex-1 rounded-pill bg-track">
              <span className="block h-full rounded-pill bg-[linear-gradient(90deg,#6848D1,#A65FED)]" style={{ width: `${(m.share / top) * 100}%` }} />
            </span>
            <span className="num w-9 shrink-0 text-end text-meta font-semibold text-ink">{m.share}%</span>
          </span>
        ))}
      </span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        <span className="num rounded-pill bg-haze px-2.5 py-1 text-meta font-semibold text-main">{v.value.age[0]} to {v.value.age[1]}</span>
        <span className="num rounded-pill bg-haze px-2.5 py-1 text-meta font-semibold text-main">{v.value.femaleShare}% women</span>
      </span>
    </Claim>
  );
}

function Voice({ read }: { read: CreatorRead }) {
  const v = read.voice!;
  return (
    <Claim src={v} className="block">
      <span className="block text-body leading-6 text-ink">{v.value.register}</span>
      <span className="grad-ws relative mt-3 block rounded-[14px] px-3.5 pb-3 pt-4 text-body italic leading-6 text-ink">
        <span aria-hidden className="absolute -top-1 start-2.5 font-serif text-[30px] not-italic leading-none text-orchid/60">“</span>
        {v.value.sample}
      </span>
    </Claim>
  );
}

function Rhythm({ read }: { read: CreatorRead }) {
  const v = read.cadence!;
  return (
    <Claim src={v} className="block">
      <span className="grid grid-cols-2 gap-2">
        <span className="rounded-[14px] bg-haze/70 px-3 py-2.5">
          <span className="num block text-[24px] font-bold leading-none tracking-[-0.03em] text-ink">{v.value.perWeek}</span>
          <span className="mt-1 block text-meta text-ink-50">posts a week since {v.value.activeSince}</span>
        </span>
        <span className="rounded-[14px] bg-haze/70 px-3 py-2.5">
          <span className="num block text-[24px] font-bold leading-none tracking-[-0.03em] text-ink">{v.value.turnaroundDays}d</span>
          <span className="mt-1 block text-meta text-ink-50">from brief to delivery</span>
        </span>
      </span>
    </Claim>
  );
}

function Grid({ read }: { read: CreatorRead }) {
  const v = read.conflicts!;
  if (!v.value.length) {
    return (
      <Claim src={v} className="block">
        <span className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-green-10 text-green"><CheckCircle size={17} weight="fill" /></span>
          <span className="text-body font-medium text-ink">Nothing in your grid blocks a campaign.</span>
        </span>
      </Claim>
    );
  }
  return (
    <Claim src={v} className="block">
      <span className="flex flex-col gap-2">
        {v.value.map((c) => (
          <span key={c.brand} className="rounded-[12px] bg-amber-soft px-3 py-2 text-meta text-ink">
            <span className="font-semibold">{c.brand}</span><span className="text-ink-60"> · {c.standing}. Blocks {c.blocks.join(", ")}.</span>
          </span>
        ))}
      </span>
    </Claim>
  );
}

/* THE RESULT (12 Nov: "give the eligibility check result more importance"). It was a green strip a line tall, the
   same weight as the tiles under it; now it is the read's headline: a seal, the line in display type with the count
   in it lifted, and what matching read, in the order it weighs them. The line and the strengths are the read's own
   words, each still one press from its source. Not placed yet is amber, not grey: it says "yet", and what would change
   it follows in the next block. */
const MATCHED_BY = READ_TASKS.find((t) => t.key === "standing")?.agent;

function Standing({ read }: { read: CreatorRead }) {
  const [how, setHow] = useState(false);
  const howRef = useRef<HTMLButtonElement>(null);
  const st = read.standing!;
  /* Everything the result rests on, in one place, as the brand's "How this was checked". */
  const evidence = [...st.line.evidence, ...st.strengths.evidence, ...st.best.evidence].filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i);
  const ok = st.state === "ok";
  const id = `${read.id}-standing`;
  return (
    <section
      aria-labelledby={id}
      className={`verdict-in relative mt-4 overflow-hidden rounded-[22px] p-4 ring-1 @lg:p-5 ${
        ok
          ? "bg-[linear-gradient(140deg,rgba(37,163,51,0.15),rgba(37,163,51,0.04)_58%,rgba(255,255,255,0.7))] ring-green/20"
          : "bg-[linear-gradient(140deg,rgba(178,106,0,0.14),rgba(178,106,0,0.04)_58%,rgba(255,255,255,0.7))] ring-amber/20"
      }`}
    >
      <span aria-hidden className={`pointer-events-none absolute -end-14 -top-20 h-52 w-52 rounded-full blur-3xl ${ok ? "bg-green/20" : "bg-amber/15"}`} />

      {/* Phones: the seal beside the eyebrow, the verdict full width under them. Wider: the seal holds the left edge. */}
      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 @lg:items-start @lg:gap-x-4 @lg:gap-y-1">
        <span
          aria-hidden
          className={`verdict-seal grid h-11 w-11 shrink-0 place-items-center rounded-[14px] @lg:row-span-2 @lg:h-14 @lg:w-14 @lg:rounded-[18px] text-white ${
            ok
              ? "bg-[linear-gradient(150deg,#3FC451,#1C7A26)] shadow-[0_14px_28px_-14px_rgba(28,122,38,0.8)]"
              : "bg-[linear-gradient(150deg,#E39A2E,#B26A00)] shadow-[0_14px_28px_-14px_rgba(178,106,0,0.8)]"
          }`}
        >
          {ok ? <SealCheck className="h-[26px] w-[26px] @lg:h-8 @lg:w-8" weight="fill" /> : <SealWarning className="h-[26px] w-[26px] @lg:h-8 @lg:w-8" weight="fill" />}
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 @lg:self-end">
          <p className={`text-eyebrow font-semibold uppercase tracking-[0.14em] ${ok ? "text-green" : "text-amber"}`}>Eligibility check</p>
          {MATCHED_BY && <p className="text-meta text-ink-50">· {MATCHED_BY}</p>}
        </div>
        <div className="col-span-2 @lg:col-span-1 @lg:col-start-2">
          <h3 id={id} className="text-balance text-[22px] font-bold leading-[1.2] tracking-[-0.02em] text-ink @lg:text-[26px]">
            {st.line.value.split(/(\d+)/).map((part, i) =>
              i % 2 ? (
                <span key={i} className={`num inline-block rounded-[10px] px-1.5 ${ok ? "bg-green/[0.12] text-green" : "bg-amber/[0.12] text-amber"}`}>{part}</span>
              ) : (
                part
              ),
            )}
          </h3>
        </div>
      </div>

      <div className="relative mt-4 rounded-[16px] bg-white/85 px-4 py-3.5 ring-1 ring-black/[0.04]">
        <p className="text-meta font-semibold text-ink-60">What matching reads</p>
        <ClaimPlain.Provider value={true}><Claim src={st.strengths} className="mt-2 block">
          <span className="flex flex-col gap-2.5">
            {st.strengths.value.map((line, i) => (
              <span key={line} className="flex items-start gap-2.5">
                <span aria-hidden className="num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-haze text-[11px] font-bold text-main">{i + 1}</span>
                <span className="min-w-0 text-body leading-6 text-ink">{line}</span>
              </span>
            ))}
          </span>
        </Claim></ClaimPlain.Provider>
      </div>

      {evidence.length > 0 && (
        <div className="relative mt-3">
          <button
            ref={howRef}
            type="button"
            onClick={() => setHow((o) => !o)}
            aria-expanded={how}
            aria-haspopup="dialog"
            className={`rounded-pill px-3 py-1 text-[11px] font-semibold text-main ring-1 ring-black/[0.04] transition ${how ? "bg-white" : "bg-white/70 hover:bg-white"}`}
          >
            How this was checked · {evidence.length}
          </button>
          <GlassPopover anchor={howRef} open={how} onClose={() => setHow(false)} label="How the eligibility check was done">
            <p className="flex items-center gap-2 text-meta font-semibold text-ink">
              How this was checked
              <span className="num rounded-pill bg-haze px-2 py-0.5 text-[11px] font-semibold text-main">Evidence · {evidence.length}</span>
            </p>
            <p className="mt-1.5 text-meta leading-5 text-ink-60">{st.strengths.why} {st.best.why}</p>
            <ul className="mt-1.5 divide-y divide-hairline">{evidence.map((e) => <EvidenceRow key={e.id} e={e} />)}</ul>
          </GlassPopover>
        </div>
      )}
    </section>
  );
}

export function ProfileReadCard({ read, onOpen, notice }: { read: CreatorRead; onOpen?: () => void; notice?: ReactNode }) {
  return (
    <Card edge className="overflow-hidden">
      {notice}
      <div className="p-4 @lg:p-5">
        <div className="flex items-center gap-3.5">
          {/* A sample has no name, so the handle that was typed leads and the avatar is the "You" the dashboard uses
              when there is no name to draw. */}
          <span className="shrink-0 rounded-full bg-white p-[3px] shadow-lift">
            <Avatar src={read.identity?.avatar} name={read.identity?.name?.value ?? "You"} size={48} />
          </span>
          <div className="min-w-0 flex-1">
            {read.identity?.name ? (
              <>
                <p className="truncate text-[18px] font-semibold leading-6 tracking-[-0.015em] text-ink">{read.identity.name.value}</p>
                <p className="truncate text-meta text-ink-50" dir="ltr">{[read.handle, read.identity.location?.value].filter(Boolean).join(" · ")}</p>
              </>
            ) : (
              <p className="truncate text-[18px] font-semibold text-ink" dir="ltr">{read.handle}</p>
            )}
          </div>
          {onOpen && (
            <button onClick={onOpen} className="btn-soft hidden h-8 shrink-0 rounded-pill px-3.5 text-meta font-semibold @lg:inline-flex @lg:items-center">See all</button>
          )}
        </div>

        {read.standing && <Standing read={read} />}

        <div className="mt-3 grid gap-3 @lg:grid-cols-2">
          {read.accounts && <Tile read={read} k="accounts" icon={SquaresFour} label="Accounts" wide><Accounts read={read} /></Tile>}
          {read.niche && <Tile read={read} k="niche" icon={GridFour} label="What you post"><Niche read={read} /></Tile>}
          {read.audience && <Tile read={read} k="audience" icon={UsersThree} label="Audience"><Audience read={read} /></Tile>}
          {read.voice && <Tile read={read} k="voice" icon={ChatCircleText} label="Your voice"><Voice read={read} /></Tile>}
          {read.cadence && <Tile read={read} k="cadence" icon={CalendarCheck} label="Rhythm"><Rhythm read={read} /></Tile>}
          {read.conflicts && <Tile read={read} k="conflicts" icon={CheckCircle} label="Your grid" wide><Grid read={read} /></Tile>}
        </div>
        {onOpen && (
          <button onClick={onOpen} className="mt-3 w-full rounded-pill py-2 text-meta font-semibold text-main transition hover:bg-haze @lg:hidden">
            See everything found
          </button>
        )}
      </div>
    </Card>
  );
}


/* ── While the read runs ─────────────────────────────────────────────

   The brand's store read and this one are the same product, so they load the same way (12 Nov: "both are the same
   platform, they need to look similar"). It was a nine-row table with "Waiting" down the side; now it is the brand's
   live card: the header with a count, and a tile per finding, each saying which agent is on it until it lands and
   then writing the finding out (TypeOn). The tiles are the finished card's own, drawn by the same functions, so when
   the read completes nothing moves except the result arriving on top.

   `identity` lands in the header. `reach` is read and, as in the finished card, never drawn. */
const LIVE_TILES: { k: ReadLayerKey; label: string; icon: Icon; wide?: boolean; draw: (r: CreatorRead) => ReactNode }[] = [
  { k: "accounts", label: "Accounts", icon: SquaresFour, wide: true, draw: (r) => Accounts({ read: r }) },
  { k: "niche", label: "What you post", icon: GridFour, draw: (r) => Niche({ read: r }) },
  { k: "audience", label: "Audience", icon: UsersThree, draw: (r) => Audience({ read: r }) },
  { k: "voice", label: "Your voice", icon: ChatCircleText, draw: (r) => Voice({ read: r }) },
  { k: "cadence", label: "Rhythm", icon: CalendarCheck, draw: (r) => Rhythm({ read: r }) },
  { k: "conflicts", label: "Your grid", icon: CheckCircle, wide: true, draw: (r) => Grid({ read: r }) },
  {
    k: "standing", label: "Eligibility check", icon: SealCheck, wide: true,
    draw: (r) => <span className="block text-[17px] font-semibold leading-6 text-ink">{r.standing!.line.value}</span>,
  },
];

const doing = (note: string) => note.charAt(0).toLowerCase() + note.slice(1);

export function ProfileReadLive({ read, notice }: { read: CreatorRead; notice?: ReactNode }) {
  const has = (k: ReadLayerKey) => read.done.includes(k);
  const landed = LIVE_TILES.filter((t) => has(t.k)).length;
  const task = (k: ReadLayerKey) => READ_TASKS.find((t) => t.key === k)!;
  return (
    <Card edge className="overflow-hidden">
      {notice}
      <div className="p-4 @lg:p-5">
        <div className="flex items-center gap-3.5">
          <span className="shrink-0 rounded-full bg-white p-[3px] shadow-lift">
            <Avatar src={read.identity?.avatar} name={read.identity?.name?.value ?? "You"} size={48} />
          </span>
          <div className="min-w-0 flex-1">
            {read.identity?.name ? (
              <>
                <p className="truncate text-[18px] font-semibold leading-6 tracking-[-0.015em] text-ink">{read.identity.name.value}</p>
                <p className="truncate text-meta text-ink-50" dir="ltr">{[read.handle, read.identity.location?.value].filter(Boolean).join(" · ")}</p>
              </>
            ) : (
              <>
                <p className="truncate text-[18px] font-semibold leading-6 tracking-[-0.015em] text-ink" dir="ltr">{read.handle}</p>
                <p className="truncate text-meta text-ink-50">{read.sample ? "Reading a sample profile" : "Reading your profile"}</p>
              </>
            )}
          </div>
          <span className="num inline-flex h-8 shrink-0 items-center gap-2 rounded-pill bg-haze px-3 text-meta font-semibold text-main">
            <span aria-hidden className="working-ring h-3.5 w-3.5" />
            {landed}/{LIVE_TILES.length}
          </span>
        </div>

        <div className="mt-4 grid gap-3 @lg:grid-cols-2">
          {LIVE_TILES.map(({ k, label, icon: I, wide, draw }) => {
            const done = has(k) && !!(read as unknown as Record<string, unknown>)[k];
            const t = task(k);
            return (
              <div
                key={k}
                className={`min-w-0 rounded-[18px] p-4 ring-1 transition ${wide ? "@lg:col-span-2" : ""} ${
                  done ? "bg-white/80 ring-main/[0.07]" : "bg-haze/60 ring-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] ${done ? "bg-green-10 text-green" : "bg-white text-main"}`}>
                    {done ? <CheckCircle size={15} weight="fill" /> : <I size={14} weight="bold" />}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-meta font-semibold text-ink-60">{label}</p>
                </div>
                <div className="mt-3">
                  {done ? (
                    <ClaimPlain.Provider value={true}><TypeOn id={`${read.id}:${k}`}>{draw(read)}</TypeOn></ClaimPlain.Provider>
                  ) : (
                    <p className="flex items-start gap-2 text-meta text-ink-50">
                      <span aria-hidden className="working-ring mt-0.5 h-3 w-3 shrink-0" />
                      <span className="min-w-0"><span className="font-semibold text-ink-60">{t.agent}</span> is {doing(t.note)}…</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
