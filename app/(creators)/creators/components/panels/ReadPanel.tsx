"use client";

/* Everything HeyMoon found, beside the conversation, as the brand's read panel is (12 Nov: "every component in the
 * creator should act similar to its similar one in the brand").
 *
 * It was the read printed again with every piece of evidence open, and nothing in it could be changed, while the
 * conversation's "Not quite" told the creator to "change it in the panel". Now it is the brand's panel: who did the
 * work, the eligibility line, and each finding with the three things you can do to it, Yes, Fix this and Add
 * something, its evidence one press away. A correction is kept beside the agent's value rather than replacing it
 * silently. A tap on a finding in the conversation opens this on it, with the correction box open.
 *
 * The stakes are higher than for a store: a brand whose median price is read wrong loses a plan, a creator whose
 * audience is read wrong loses money. */

import { useEffect, useRef, useState } from "react";
import { GlassPopover } from "../../../../_shared/GlassPopover";
import {
  CalendarCheck, ChatCircleText, Check, CheckCircle, GridFour, Info, PencilSimple, Plus, SealCheck, SealWarning,
  SquaresFour, UsersThree, type Icon,
} from "@phosphor-icons/react";
import { Btn, Card, Avatar } from "../ui";
import { EvidenceRow, ReadValue, RejectedBlock, SampleNotice, TaskRoster, agentForLayer, rosterTitle } from "../blocks";
import { ClaimPlain } from "../Evidence";
import { READ_TASKS } from "../../lib/agent/tools";
import { clearReadFocus, correctRead, useRead, useReadFocus, useStore } from "../../lib/store";
import type { Correction, CreatorRead, ReadLayerKey, Sourced } from "../../lib/agent/types";

/* The finished card's tiles, in its order, with its labels and icons, so the panel and the card read as one thing. */
const ORDER: { k: ReadLayerKey; label: string; icon: Icon }[] = [
  { k: "accounts", label: "Accounts", icon: SquaresFour },
  { k: "niche", label: "What you post", icon: GridFour },
  { k: "audience", label: "Audience", icon: UsersThree },
  { k: "voice", label: "Your voice", icon: ChatCircleText },
  { k: "cadence", label: "Rhythm", icon: CalendarCheck },
  { k: "conflicts", label: "Your grid", icon: CheckCircle },
];

function LayerIcon({ icon: I }: { icon: Icon }) {
  return (
    <span aria-hidden className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] bg-haze text-main">
      <I size={14} weight="bold" />
    </span>
  );
}

export function ReadPanel() {
  const readId = useStore((s) => Object.keys(s.reads)[0] ?? null);
  const read = useRead(readId);
  if (!read) {
    return (
      <p className="text-body leading-6 text-ink-60">
        Give me your handle in the conversation and the agents will read your profile; everything they find lands here.
      </p>
    );
  }
  const thin = read.standing?.state === "thin";

  return (
    <div className="@container space-y-3">
      {/* The panel is the same read at full length, so it opens the same way: a sample says so before its first "your". */}
      {read.sample && <Card edge className="overflow-hidden"><SampleNotice /></Card>}

      {/* The person, as the first finding. */}
      <Card edge className="flex items-center gap-3.5 p-4">
        <span className="shrink-0 rounded-full bg-white p-[3px] shadow-lift">
          <Avatar src={read.identity?.avatar} name={read.identity?.name?.value ?? "You"} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-ink" dir={read.identity?.name ? undefined : "ltr"}>{read.identity?.name?.value ?? read.handle}</p>
          <p className="mt-0.5 truncate text-meta leading-5 text-ink-60" dir="ltr">{[read.handle, read.identity?.location?.value].filter(Boolean).join(" · ")}</p>
        </div>
      </Card>

      {/* Who did the work, kept after the read finishes. */}
      <TaskRoster tasks={READ_TASKS} done={read.done} live={false} title={rosterTitle(READ_TASKS, "read your profile")} />

      {read.standing && <EligibilityRow read={read} />}

      {ORDER.map((o) => (read.done.includes(o.k) ? <Layer key={o.k} read={read} {...o} /> : <MissedLayer key={o.k} {...o} />))}

      {thin && <RejectedBlock read={read} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One finding, and the three things you can do to it                  */
/* ------------------------------------------------------------------ */

function Layer({ read, k, label, icon }: { read: CreatorRead; k: ReadLayerKey; label: string; icon: Icon }) {
  const [openEv, setOpenEv] = useState(false);
  const evRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<"idle" | "fix" | "add">("idle");
  const [draft, setDraft] = useState("");
  /* Arriving from a tap on this finding in the conversation: scroll to it and open the correction box, so the
     creator lands on the control rather than on the list containing it. */
  const focus = useReadFocus();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus !== k) return;
    box.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    setMode("fix");
    setDraft("");
    clearReadFocus();
  }, [focus, k]);
  const src = (read as unknown as Record<string, Sourced<unknown> | undefined>)[k];
  const mine = read.corrections.filter((c) => c.layer === k);
  const confirmed = mine.some((c) => c.field === "confirmed");
  const corrected = mine.filter((c) => c.field !== "confirmed");

  const record = (field: string, was: string, now: string) => {
    const c: Correction = { layer: k, field, was, now, at: Date.now() };
    correctRead(read.id, c, (r) => r);
  };
  const save = () => {
    if (!draft.trim()) return;
    if (mode === "fix") record("value", "what HeyMoon found", draft.trim());
    else record("note", "—", draft.trim());
    setDraft(""); setMode("idle");
  };

  return (
    <div ref={box}>
      <Card edge className={`p-4 ${focus === k ? "ring-2 ring-main/30" : ""}`}>
        <p className="flex items-center gap-2 text-meta font-semibold text-ink-60"><LayerIcon icon={icon} />{label}</p>
        {/* The value only: its evidence is the pill below, as in the brand's panel. */}
        <div className="mt-2.5"><ClaimPlain.Provider value={true}><ReadValue read={read} layer={k} /></ClaimPlain.Provider></div>

        {corrected.length > 0 && (
          <ul className="mt-2.5 space-y-1">
            {corrected.map((c, i) => (
              <li key={i} className="flex items-start gap-2 rounded-[12px] bg-haze px-3 py-2 text-meta text-main">
                <PencilSimple size={11} className="mt-1 shrink-0" aria-hidden />
                <span><span className="font-semibold">{c.field === "note" ? "Added by you" : "Corrected by you"}:</span> {c.now}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-main/[0.07] pt-3">
          {confirmed ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-green-10 px-3 text-meta font-semibold text-green">
              <Check size={11} weight="bold" aria-hidden /> Confirmed by you
            </span>
          ) : (
            <button
              onClick={() => record("confirmed", "", "confirmed")}
              className="btn-soft inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-meta font-semibold text-ink-60 hover:text-green"
            >
              <Check size={11} weight="bold" aria-hidden /> Yes
            </button>
          )}
          <button
            onClick={() => { setMode("fix"); setDraft(""); }}
            className="btn-soft inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-meta font-semibold text-ink-60 hover:text-main"
          >
            <PencilSimple size={11} aria-hidden /> Fix this
          </button>
          <button
            onClick={() => { setMode("add"); setDraft(""); }}
            className="btn-soft inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-meta font-semibold text-ink-60 hover:text-main"
          >
            <Plus size={11} weight="bold" aria-hidden /> Add something
          </button>
          {src && src.evidence.length > 0 && (
            <button
              ref={evRef}
            onClick={() => setOpenEv((o) => !o)}
              aria-expanded={openEv}
              className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-pill bg-haze px-3 text-meta font-semibold text-main transition hover:bg-main/[0.1]"
            >
              <Info size={12} weight="fill" aria-hidden />
              {`Evidence · ${src.evidence.length}`}
            </button>
          )}
        </div>

        {mode !== "idle" && (
          <div className="mt-2.5">
            <textarea
              autoFocus
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={mode === "fix" ? "What should this say instead?" : "What else should I know about this?"}
              className="w-full resize-none rounded-[14px] border border-transparent bg-haze/70 p-3 text-body text-ink outline-none focus:border-main/30 focus:bg-white"
            />
            <div className="mt-2 flex gap-2">
              <Btn size="sm" onClick={save} disabled={!draft.trim()}>Save</Btn>
              <Btn size="sm" variant="ghost" onClick={() => { setMode("idle"); setDraft(""); }}>Cancel</Btn>
            </div>
          </div>
        )}

        {src && (

          <GlassPopover anchor={evRef} open={openEv} onClose={() => setOpenEv(false)} label="Evidence">
            <p className="text-meta font-semibold text-ink">{agentForLayer(k)} read this off {src.evidence[0]?.label ?? "your profile"}:</p>
            <p className="mt-0.5 text-meta leading-5 text-ink-60">{src.why}</p>
            <ul className="mt-1 divide-y divide-line">
              {src.evidence.map((e) => <EvidenceRow key={e.id} e={e} />)}
            </ul>

          </GlassPopover>

        )}
      </Card>
    </div>
  );
}

/** A finding the read never reached: a stopped read keeps what it had, and says plainly what it did not get to. */
function MissedLayer({ label, icon }: { label: string; icon: Icon }) {
  return (
    <Card edge className="p-4">
      <p className="flex items-center gap-2 text-meta font-semibold text-ink-60"><LayerIcon icon={icon} />{label}</p>
      <p className="mt-1 text-meta leading-5 text-ink-50">The read stopped before this one. Ask me to keep reading and I will finish it.</p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Eligibility, as one line                                            */
/* ------------------------------------------------------------------ */

function EligibilityRow({ read }: { read: CreatorRead }) {
  const [open, setOpen] = useState(false);
  const whyRef = useRef<HTMLButtonElement>(null);
  const st = read.standing!;
  const ok = st.state === "ok";
  return (
    <Card edge className={`p-4 ${ok ? "!bg-green-10" : "!bg-amber-soft"}`}>
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink-50">Eligibility</p>
      <p className={`mt-1.5 flex items-start gap-2 text-body font-semibold leading-6 ${ok ? "text-green" : "text-amber"}`}>
        {ok
          ? <SealCheck size={16} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
          : <SealWarning size={16} weight="fill" className="mt-0.5 shrink-0" aria-hidden />}
        {st.line.value}
      </p>
      <button
        ref={whyRef}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="mt-1.5 inline-flex items-center gap-1.5 text-meta font-medium text-main hover:underline"
      >
        <Info size={12} weight="fill" aria-hidden />
        Why this matters, and how it was worked out
      </button>
      <GlassPopover anchor={whyRef} open={open} onClose={() => setOpen(false)} label="Why this matters">
          <p className="text-meta font-semibold text-ink">{agentForLayer("standing")} worked this out from:</p>
          <p className="mt-0.5 text-meta leading-5 text-ink-60">{st.best.why}</p>
          <ul className="mt-1 divide-y divide-line">
            {st.best.evidence.map((e) => <EvidenceRow key={e.id} e={e} />)}
          </ul>
      </GlassPopover>
    </Card>
  );
}
