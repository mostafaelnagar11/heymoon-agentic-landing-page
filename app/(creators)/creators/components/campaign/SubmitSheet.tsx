"use client";

/* SUBMIT CONTENT FOR REVIEW — the form, and the accounts sheet it opens.
 *
 * The design's own screen, for an ad that is ALREADY UP, in three
 * numbered parts: the accounts it went out on; the live ad's link, or a
 * video of it for a Story or anything else that will not stay up; and
 * the Pre-upload Check, all seven lines, every one ticked before the
 * button will press. The review that follows checks the work was done
 * and carries the brief, so it can be paid. It is not a brand deciding
 * whether the ad may run, and nothing is posted by this form: posting
 * is the creator's, from their own account.
 *
 * WHAT MOONWRITER AI CHECKS HERE IS WHAT IT CAN ACTUALLY READ. The
 * file's shape and length come off the video in the browser, so "this
 * is landscape and a Reel is vertical" is a fact about the file, not a
 * guess. What is in the frame — the product in three seconds, the code
 * on screen — is the creator's to confirm, line by line, because the
 * prototype cannot watch a video and will not pretend to. */

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { CaretDown, Check, CheckCircle, FileVideo, Link as LinkIcon, UploadSimple, Warning, X } from "@phosphor-icons/react";
import { Btn, Sheet } from "../ui";
import { Soc } from "../figma";
import { FORMAT_NAME } from "../../lib/agent/model";
import { tools } from "../../lib/agent/tools";
import type { CheckKey, Offer, Platform } from "../../lib/agent/types";
import type { AdSlot } from "../../lib/content";
import { relDay } from "../../lib/dates";
import { clock, isProfileLink, linkProblem, parseLink, shapeNote, type FileFacts } from "../../lib/proof";
import { pushToast, sendAd } from "../../lib/store";
import { useToday } from "../../lib/usePlans";
import { bytes, useHandles } from "./AdContent";

const MAX_BYTES = 3 * 1024 ** 3;

export function SubmitSheet({ offer, slot, onClose }: { offer: Offer; slot: AdSlot; onClose: () => void }) {
  const today = useToday();
  const handles = useHandles();
  const prev = slot.submission;
  const lines = useMemo(() => tools.pre_upload_check({ offer }), [offer]);
  /* THE ACCOUNTS: the ones this campaign runs on. The row's own platform
     is chosen for you; say so if the same ad went out elsewhere too. */
  const options = useMemo(() => Array.from(new Set([slot.platform, ...offer.platforms])), [slot.platform, offer.platforms]);
  const [accounts, setAccounts] = useState<Platform[]>(prev?.accounts ?? [slot.platform]);
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [facts, setFacts] = useState<FileFacts | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  /* Submitting again keeps what was ticked last time, less the line it
     came back for. */
  const [checked, setChecked] = useState<CheckKey[]>(prev ? prev.checked.filter((k) => k !== prev.missed) : []);
  /* From the latest list, not this render's: two ticks in one frame
     must both land. */
  const toggle = (k: CheckKey) => setChecked((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]));
  const [choosing, setChoosing] = useState(false);
  const inputId = useId();

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!(f.type.startsWith("video/") || /\.(mov|mp4|m4v|hevc)$/i.test(f.name))) { setFileError("That isn't a video. Upload a MOV, MP4 or HEVC file."); return; }
    if (f.size > MAX_BYTES) { setFileError(`That file is ${bytes(f.size)}, and the limit is 3 GB.`); return; }
    setFileError(null);
    setFacts(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const clearFile = () => { setFile(null); setPreview(null); setFacts(null); };

  const problem = linkProblem(link, accounts);
  const hasLink = !!link.trim() && !problem;
  const hasAd = !!file || hasLink;
  const profile = hasLink && isProfileLink(link);
  const shape = file && facts ? shapeNote(slot.format, facts) : null;
  const left = lines.length - checked.length;
  /* ALL SEVEN, OR NO SUBMIT. The check was a link to a sheet, and a
     link reads as optional: nobody could tell it had to be done. It is
     now the form's third step, in full, and the button says what is
     still missing rather than going grey without a reason. */
  const ready = accounts.length > 0 && hasAd && left === 0;
  const missing = accounts.length === 0 ? "Choose where you posted it"
    : !hasAd ? "Add the ad's link, or a video of it"
    : left > 0 ? `Tick all ${lines.length} checks to submit · ${left} to go`
    : null;

  const send = () => {
    if (!ready) return;
    const u = parseLink(link);
    sendAd({
      id: slot.id, offerId: offer.id, n: slot.n, platform: slot.platform, format: slot.format, accounts, checked,
      kind: file ? "file" : "link",
      file: file ? { name: file.name, size: file.size, type: file.type, seconds: facts?.seconds, width: facts?.width, height: facts?.height } : undefined,
      link: file ? undefined : u ? `${u.hostname}${u.pathname}${u.search}` : link.trim(),
    });
    pushToast({ tone: "green", text: "Ad submitted. Once it's accepted, it counts toward your payout." });
    onClose();
  };

  return (
    <>
      <Sheet open onClose={onClose} title="Submit content for review" wide>
        <div className="flex flex-col gap-5 px-4 pb-5 pt-1">
          {/* Which ad this is, so a creator uploading three this week
              knows which one the form is for. */}
          <p className="flex items-center gap-2 text-body text-ink-60">
            <Soc platform={slot.platform} size={20} />
            <span className="font-semibold text-ink">{FORMAT_NAME[slot.format]}</span>
            <span className="num">· {slot.n} of {slot.total} · due {relDay(slot.day, today)}</span>
          </p>

          {slot.state === "rejected" && prev?.note && (
            <div className="-mt-1 rounded-inner border border-danger/20 bg-danger/[0.05] px-4 py-3">
              <p className="text-meta font-semibold text-danger">Why it wasn&apos;t accepted</p>
              <p className="mt-1 text-body leading-5 text-ink">{prev.note}</p>
            </div>
          )}

          <Step n={1} done={accounts.length > 0} title="Where you posted it">
            {/* Choose social accounts: a field that opens the chooser. */}
            <button type="button" onClick={() => setChoosing(true)}
              className="flex min-h-12 w-full items-center gap-2 rounded-inner border border-line bg-paper px-4 py-3 text-start transition hover:border-main/40">
              {accounts.length === 0
                ? <span className="flex-1 text-body text-ink-50">Choose social accounts</span>
                : (
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
                    {accounts.map((p) => (
                      <span key={p} className="flex items-center gap-1.5 text-body text-ink"><Soc platform={p} size={20} /><span dir="ltr">{handles(p)}</span></span>
                    ))}
                  </span>
                )}
              <CaretDown size={16} aria-hidden className="shrink-0 text-ink-50" />
            </button>
          </Step>

          <Step n={2} done={hasAd} title="The ad">
            <label className="block">
              <span className="sr-only">Live ad link</span>
              <span className="relative block">
                <LinkIcon size={16} aria-hidden className="absolute start-4 top-1/2 -translate-y-1/2 text-ink-40" />
                <input value={link} onChange={(e) => setLink(e.target.value)} disabled={!!file} inputMode="url" dir="ltr" autoComplete="off"
                  placeholder="Enter live ad link" aria-invalid={!!problem}
                  className="h-12 w-full rounded-inner border border-line bg-paper pe-4 ps-10 text-body text-ink outline-none transition placeholder:text-ink-50 focus:border-main disabled:opacity-40" />
              </span>
              {problem && <span className="mt-1.5 flex items-start gap-1.5 text-meta leading-4 text-danger"><Warning size={13} weight="fill" aria-hidden className="mt-0.5 shrink-0" />{problem}</span>}
              {/* Knowable before it is submitted, so said now rather than
                  after a check it would fail. Not a block: a link this
                  reads wrongly should still reach a person. */}
              {profile && <span className="mt-1.5 flex items-start gap-1.5 text-meta leading-4 text-amber"><Warning size={13} weight="fill" aria-hidden className="mt-0.5 shrink-0" />This looks like a profile, not a post. The check needs the link to the ad itself.</span>}
              {file && <span className="mt-1.5 block text-meta text-ink-50">Remove the file to send a link instead.</span>}
            </label>

            <p className="text-body text-ink-50">or</p>

            {file ? (
              <div className="rounded-inner border border-line p-3">
                <div className="flex items-center gap-3">
                  {preview && (
                    <video src={preview} muted playsInline preload="metadata" aria-hidden
                      onLoadedMetadata={(e) => { const v = e.currentTarget; setFacts({ seconds: v.duration, width: v.videoWidth, height: v.videoHeight }); }}
                      onError={() => setFacts({ unreadable: true })}
                      className="h-16 w-12 shrink-0 rounded-chip bg-night object-cover" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-body font-semibold text-ink"><FileVideo size={16} aria-hidden className="shrink-0 text-main" /><span className="truncate">{file.name}</span></span>
                    <span className="num mt-0.5 block text-meta text-ink-50">{bytes(file.size)}{facts?.seconds && Number.isFinite(facts.seconds) ? ` · ${clock(facts.seconds)}` : ""}</span>
                  </span>
                  <button type="button" onClick={clearFile} aria-label="Remove the file" className="grid h-9 w-9 shrink-0 place-items-center rounded-pill text-ink-50 transition hover:bg-lilac hover:text-main"><X size={16} weight="bold" aria-hidden /></button>
                </div>
                {shape && (
                  <p className={`mt-3 flex items-start gap-2 rounded-chip px-3 py-2 text-meta leading-4 ${shape.ok ? "bg-lilac/70 text-ink-60" : "bg-amber-soft text-amber"}`}>
                    {shape.ok ? <CheckCircle size={14} weight="fill" aria-hidden className="mt-px shrink-0 text-main" /> : <Warning size={14} weight="fill" aria-hidden className="mt-px shrink-0" />}
                    <span><span className="font-semibold">MoonWriter AI read the file.</span> {shape.text}</span>
                  </p>
                )}
              </div>
            ) : (
              <label htmlFor={inputId}
                onDragOver={(e) => { if (link.trim()) return; e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); if (!link.trim()) pick(e.dataTransfer.files?.[0]); }}
                className={`flex cursor-pointer flex-col items-center rounded-inner border border-dashed px-4 py-7 text-center transition ${link.trim() ? "pointer-events-none border-line opacity-40" : drag ? "border-main bg-lilac" : "border-main/30 bg-lilac/50 hover:bg-lilac"}`}>
                <span aria-hidden className="medallion grid h-12 w-12 place-items-center rounded-pill text-white"><UploadSimple size={22} weight="bold" /></span>
                <span className="mt-5 text-body text-ink"><span className="font-semibold text-main">Click to upload</span> a video of the ad</span>
                <span className="mt-1 text-meta text-ink-50">For a Story, or anything that won&apos;t stay up · MOV, MP4 or HEVC, up to 3 GB</span>
                <input id={inputId} type="file" accept="video/*,.mov,.mp4,.m4v,.hevc" className="sr-only" disabled={!!link.trim()}
                  onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            )}
            {fileError && <p className="flex items-start gap-1.5 text-meta leading-4 text-danger"><Warning size={13} weight="fill" aria-hidden className="mt-0.5 shrink-0" />{fileError}</p>}
          </Step>

          {/* THE DESIGN'S PRE-UPLOAD CHECK, in the form rather than behind
              a link: seven boxes, ticked by the person who made the ad,
              and written from this campaign's brief. */}
          <Step n={3} done={left === 0} title="Pre-upload Check"
            aside={<span className={`num rounded-pill px-2 py-0.5 text-meta font-semibold ${left === 0 ? "bg-green-10 text-green" : "bg-main-10 text-main"}`}>{checked.length} of {lines.length}</span>}>
            <p className="-mt-1 text-meta leading-4 text-ink-60">Tick all seven to confirm your ad has them. Every {offer.brand} ad is checked against the same seven.</p>
            <ul className="flex flex-col divide-y divide-line rounded-inner border border-line">
              {lines.map((l) => {
                const on = checked.includes(l.key);
                return (
                  <li key={l.key}>
                    <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(l.key)}
                      className="flex w-full items-start gap-3 px-3.5 py-3 text-start transition hover:bg-lilac/40">
                      <span aria-hidden className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border ${on ? "border-main bg-main text-white" : "border-main/25 bg-lilac"}`}>
                        {on && <Check size={12} weight="bold" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body font-semibold text-ink">{l.label}</span>
                        <span className="mt-0.5 block break-words text-meta leading-4 text-ink-60">{l.detail}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Step>

          <div className="flex flex-col gap-2">
            {missing && <p aria-live="polite" className="text-center text-meta font-medium text-ink-60">{missing}</p>}
            <Btn full disabled={!ready} onClick={send}>Submit for review</Btn>
            <p className="text-center text-meta text-ink-50">Nothing is submitted until you press it.</p>
          </div>
        </div>
      </Sheet>

      {choosing && (
        <AccountsSheet options={options} handles={handles} value={accounts} required={slot.platform}
          onDone={(v) => { setAccounts(v); setChoosing(false); }} onClose={() => setChoosing(false)} />
      )}
    </>
  );
}

/** A numbered part of the form. The number turns into a tick once the
    part is done, so what is left to do is visible without reading. */
function Step({ n, title, done, aside, children }: { n: number; title: string; done: boolean; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span aria-hidden className={`num grid h-5 w-5 shrink-0 place-items-center rounded-pill text-tiny font-semibold ${done ? "bg-green text-white" : "bg-main-10 text-main"}`}>
          {done ? <Check size={11} weight="bold" /> : n}
        </span>
        <p className="min-w-0 flex-1 text-body font-semibold text-ink">{title}</p>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** The design's Choose social accounts: a checkbox per account, and
    Continue. The row's own platform cannot be unticked — it is the ad
    the bundle is counting. */
function AccountsSheet({ options, handles, value, required, onDone, onClose }: {
  options: Platform[]; handles: (p: string) => string; value: Platform[]; required: Platform;
  onDone: (v: Platform[]) => void; onClose: () => void;
}) {
  const [picked, setPicked] = useState<Platform[]>(value.length ? value : [required]);
  const toggle = (p: Platform) => setPicked((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]));
  return (
    <Sheet open onClose={onClose} title="Choose social accounts">
      <div className="flex flex-col gap-2 px-4 pb-5 pt-1">
        {options.map((p) => {
          const on = picked.includes(p);
          const locked = p === required;
          return (
            <button key={p} type="button" role="checkbox" aria-checked={on} disabled={locked} onClick={() => toggle(p)}
              className={`flex w-full items-center gap-3 rounded-inner border bg-paper px-4 py-3.5 text-start transition ${on ? "border-main" : "border-line hover:border-main/40"} disabled:cursor-default`}>
              <Soc platform={p} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-row text-ink" dir="ltr">{handles(p)}</span>
                {locked && <span className="block text-meta text-ink-50">This ad is for {p}</span>}
              </span>
              <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-[6px] border ${on ? "border-main bg-main text-white" : "border-main/20 bg-lilac"}`}>
                {on && <Check size={14} weight="bold" />}
              </span>
            </button>
          );
        })}
        <Btn full className="mt-2" onClick={() => onDone(picked)}>Continue</Btn>
      </div>
    </Sheet>
  );
}
