"use client";

/* The Profile page's popups: edit the profile, connect an account, the
 * payout statements, help and the terms. Each is one job, opened from
 * the row that names it, and each says what it changes before it does. */

import { useState } from "react";
import { Check, DownloadSimple, Plus, ShieldCheck } from "@phosphor-icons/react";
import { Btn, Chip, Sheet } from "../ui";
import { Soc } from "../figma";
import { money } from "../../lib/agent/model";
import { DEFAULT_NO, PAYOUTS, offersFor, platformsAsked, tools } from "../../lib/agent/tools";
import type { Platform, Profile, ProfilePatch } from "../../lib/agent/types";
import { personFor } from "../../lib/mock/people";
import { connect, disconnect, pushToast, putOffers, putProfile, useConnected, type Connection } from "../../lib/store";

/* ══════════════════════════════════════════════════════════════════
   Edit your profile
   ══════════════════════════════════════════════════════════════════ */

/* Every category the no-list knows by name: the defaults the read
   starts from, the two the conversation understands, and whatever this
   creator has added. */
const NO_CHOICES = [...DEFAULT_NO, "Alcohol", "Diet and weight loss"];

/** THE PROFILE, EDITED THE WAY THE CONVERSATION EDITS IT. The same tool
    (`edit_profile`), so every change is recorded against the creator
    with the page as its reason, and the same consequence: campaigns are
    matched again on the new profile, because that is what the profile
    is for. */
export function ProfileEditSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [platforms, setPlatforms] = useState<Platform[]>(profile.platforms.value);
  const [no, setNo] = useState<string[]>(profile.noList.value.categories);
  /* EVERY PLATFORM HEYMOON READS, not only the ones the read found an
     account on: a creator can add YouTube or Snapchat, and matching
     counts what they add (formatsFor). */
  const found = personFor(profile.handle).accounts.map((a) => a.platform);
  const asked = platformsAsked();
  /* Chosen, but no campaign running today is on it — said, so adding it
     does not read as a promise of campaigns. */
  const quiet = platforms.filter((p) => !asked.includes(p));
  /* Added here, and not connected yet: its posts cannot be counted. */
  const connected = useConnected();
  const unlinked = platforms.filter((p) => !found.includes(p) && !connected.includes(CONNECTION_OF[p]));
  const choices = Array.from(new Set([...NO_CHOICES, ...profile.noList.value.categories]));
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

  const save = () => {
    const was = profile.noList.value.categories;
    const patch: ProfilePatch = {
      ...(platforms.length !== profile.platforms.value.length || platforms.some((p) => !profile.platforms.value.includes(p)) ? { platforms } : {}),
      ...(no.some((c) => !was.includes(c)) ? { addNo: no.filter((c) => !was.includes(c)) } : {}),
      ...(was.some((c) => !no.includes(c)) ? { dropNo: was.filter((c) => !no.includes(c)) } : {}),
    };
    if (!Object.keys(patch).length) { onClose(); return; }
    const { profile: next } = tools.edit_profile({ profile, patch, because: "You changed it on your profile page", by: "creator" });
    putProfile(next);
    putOffers(offersFor(next));
    pushToast({ tone: "green", text: "Saved. Your campaigns were matched again on it." });
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title="Edit your profile" wide>
      <div className="flex flex-col gap-6 px-4 pb-5 pt-1">
        <p className="text-body text-ink-60">What campaigns are matched on. Saving matches them again; anything you have joined stays yours.</p>

        <div>
          <p className="text-body font-semibold text-ink">Platforms you post on</p>
          <p className="mt-0.5 text-meta text-ink-50">Add any you post on, and campaigns there can find you. A campaign only on one you switch off stops being brought to you.</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = platforms.includes(p);
              const last = on && platforms.length === 1;
              return (
                <button key={p} type="button" aria-pressed={on} disabled={last} title={last ? "Keep at least one" : undefined}
                  onClick={() => setPlatforms((v) => toggle(v, p))}
                  className={`inline-flex items-center gap-2 rounded-pill border px-3 py-2 text-body font-medium transition disabled:cursor-not-allowed ${on ? "border-main bg-white text-ink" : "border-line bg-paper text-ink-50 hover:border-main/40"}`}>
                  <Soc platform={p} size={20} />{p}
                  {on ? <Check size={14} weight="bold" aria-hidden className="text-main" /> : <Plus size={14} weight="bold" aria-hidden className="text-ink-40" />}
                </button>
              );
            })}
          </div>
          {quiet.length > 0 && (
            <p className="mt-2 text-meta leading-4 text-ink-50">
              No campaign running today is on {quiet.join(" or ")}. You&apos;ll be matched to the first one that is.
            </p>
          )}
          {unlinked.length > 0 && (
            <p className="mt-1 text-meta leading-4 text-ink-50">
              Connect {unlinked.join(" and ")} under Connected accounts too, so the posts there can be counted.
            </p>
          )}
        </div>

        <div>
          <p className="text-body font-semibold text-ink">You won&apos;t take work in</p>
          <p className="mt-0.5 text-meta text-ink-50">Whatever it pays. A campaign in one of these never reaches you.</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {choices.map((c) => {
              const on = no.includes(c);
              return (
                <button key={c} type="button" aria-pressed={on} onClick={() => setNo((v) => toggle(v, c))}
                  className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-meta font-semibold transition ${on ? "border-ink/15 bg-ink/[0.06] text-ink" : "border-line bg-white text-ink-50 hover:border-main/40"}`}>
                  {on && <Check size={12} weight="bold" aria-hidden />}{c}
                </button>
              );
            })}
          </div>
        </div>

        <Btn full onClick={save}>Save</Btn>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Connect an account
   ══════════════════════════════════════════════════════════════════ */

export const CONNECTION_OF: Record<Platform, Connection> = { Instagram: "instagram", TikTok: "tiktok", YouTube: "youtube", Snapchat: "snapchat" };

/** Every platform HeyMoon reads, in the order the rows list them. */
export const PLATFORMS: Platform[] = ["TikTok", "Instagram", "YouTube", "Snapchat"];

/* "@name", from whatever was typed: a bare name, an @name, or the
   profile's address with or without its https:// — "youtube.com/@name",
   "snapchat.com/add/name". */
export const asHandle = (raw: string) => {
  const t = raw.trim()
    .replace(/^(https?:\/\/)?(www\.|m\.)?([a-z0-9-]+\.)+[a-z]{2,}\//i, "")
    .replace(/^add\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "");
  return /^[a-z0-9._-]{2,30}$/i.test(t) ? `@${t}` : null;
};

/** Read-only, and it says so before anything is pressed. In the product
    this is the platform's own sign-in, which says which account it is;
    here it is a press, because a prototype has no Instagram to hand a
    token to — so for an account the read did not find, it asks. */
export function ConnectSheet({ platform, handle, connected, onClose }: {
  platform: Platform;
  /** The account's handle, when the read found it or it was added before. */
  handle?: string;
  connected: boolean;
  onClose: () => void;
}) {
  const key = CONNECTION_OF[platform];
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const asked = !handle;
  const chosen = handle ?? asHandle(typed);
  const go = () => {
    if (!chosen) return;
    setBusy(true);
    setTimeout(() => {
      connect(key, asked ? chosen : undefined);
      pushToast({ tone: "green", text: `${platform} connected, read-only.` });
      onClose();
    }, 900);
  };
  return (
    <Sheet open onClose={onClose} title={connected ? `${platform} is connected` : `Connect ${platform}`}>
      <div className="px-4 pb-5 pt-1">
        {asked && !connected ? (
          <label className="block">
            <span className="mb-1.5 block text-meta font-medium text-ink-60">Your {platform} {platform === "YouTube" ? "channel" : "handle"}</span>
            <span className="flex items-center gap-3 rounded-inner border border-black/10 bg-white px-3 py-2 transition focus-within:border-main/50">
              <Soc platform={platform} size={28} />
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus dir="ltr" spellCheck={false} autoComplete="off"
                placeholder="@yourname" className="min-w-0 flex-1 bg-transparent py-1.5 text-body text-ink outline-none placeholder:text-ink-40" />
            </span>
            <span className="mt-1.5 block text-meta leading-4 text-ink-50">Your read didn&apos;t find one, so say which it is.</span>
          </label>
        ) : (
          <div className="flex items-center gap-3 rounded-inner border border-line px-4 py-3">
            <Soc platform={platform} size={32} />
            <span className="min-w-0 flex-1 truncate text-body font-semibold text-ink" dir="ltr">{handle}</span>
            {connected && <Chip tone="green">Connected</Chip>}
          </div>
        )}
        <ul className="mt-4 space-y-2.5 text-body leading-5 text-ink-60">
          <li className="flex items-start gap-2.5"><ShieldCheck size={18} weight="fill" aria-hidden className="mt-px shrink-0 text-green" />Read-only. HeyMoon can&apos;t post, edit, delete or message anyone from it.</li>
          <li className="flex items-start gap-2.5"><Check size={18} weight="bold" aria-hidden className="mt-px shrink-0 text-main" />It reads what your posts did, so an ad can be checked and counted without you screenshotting it.</li>
        </ul>
        <div className="mt-5 flex flex-col gap-2">
          {connected
            ? <Btn full variant="danger" onClick={() => { disconnect(key); pushToast({ tone: "main", text: `${platform} disconnected. Nothing you've submitted is affected.` }); onClose(); }}>Disconnect {platform}</Btn>
            : <Btn full disabled={busy || !chosen} onClick={go}>{busy ? "Connecting" : `Connect ${platform}`}</Btn>}
        </div>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Statements
   ══════════════════════════════════════════════════════════════════ */

/** WHAT HAS BEEN PAID, AND WHAT IS HELD, line by line — the ledger
    Earnings reads, as something to keep. The download is the same
    lines as a spreadsheet, made in the browser. */
export function StatementsSheet({ onClose }: { onClose: () => void }) {
  const paid = PAYOUTS.filter((p) => p.state === "paid").reduce((n, p) => n + p.amount.value, 0);
  const held = PAYOUTS.filter((p) => p.state === "escrow").reduce((n, p) => n + p.amount.value, 0);
  const download = () => {
    const rows = [["Campaign", "Orders", "Earned (USD)", "Status", "When"],
      ...PAYOUTS.map((p) => [p.brand, String(p.orders), String(p.amount.value), p.state === "paid" ? "Paid" : "Held", p.at])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "heymoon-statement.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Sheet open onClose={onClose} title="Statements">
      <div className="px-4 pb-5 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-inner bg-green-10 px-3 py-2.5">
            <p className="text-meta text-green">Paid to you</p>
            <p className="num mt-0.5 text-row font-semibold text-ink">{money(paid)}</p>
          </div>
          <div className="rounded-inner bg-lilac px-3 py-2.5">
            <p className="text-meta text-main">Held for Friday</p>
            <p className="num mt-0.5 text-row font-semibold text-ink">{money(held)}</p>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-line rounded-inner border border-line">
          {PAYOUTS.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-semibold text-ink">{p.brand}</span>
                <span className="num block text-meta text-ink-50">{p.orders} orders · {p.at}</span>
              </span>
              <span className="num text-body font-semibold text-ink">{money(p.amount.value)}</span>
              <Chip tone={p.state === "paid" ? "green" : "main"}>{p.state === "paid" ? "Paid" : "Held"}</Chip>
            </li>
          ))}
        </ul>
        <Btn full variant="quiet" className="mt-4" onClick={download}><DownloadSimple size={16} weight="bold" aria-hidden />Download as a spreadsheet</Btn>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Help and terms
   ══════════════════════════════════════════════════════════════════ */

const HELP: { q: string; a: string }[] = [
  { q: "When do I get paid?", a: "Every Friday, on the orders that cleared that week. The brand funds each phase before the brief is written, so your share is already with HeyMoon rather than waiting on the brand." },
  { q: "How is my share worked out?", a: "Each campaign pays a share of every order your code or your tracking link brings in. The brand sets the share and it is the same for everybody on the campaign, so there is nothing for you to price." },
  { q: "What do I do once an ad is up?", a: "Submit it on the campaign's Ad Content tab: the live link, or a video of it for a Story. It is checked against the brief, and once it is accepted it counts toward your payout. If something is missing, it comes back saying what." },
  { q: "Can HeyMoon post for me?", a: "No. HeyMoon holds no password to any of your accounts, and a connected account is read-only: nothing is posted, edited or deleted from it." },
  { q: "How do I get different campaigns?", a: "Edit your profile: the platforms you post on, how much work a month, and what you won't take. Campaigns are matched again as soon as you save." },
];

export function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title="Help">
      <div className="px-4 pb-5 pt-1">
        <div className="divide-y divide-line rounded-inner border border-line">
          {HELP.map((h, i) => (
            <details key={h.q} open={i === 0} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-body font-semibold text-ink">
                {h.q}
                <Plus size={14} weight="bold" aria-hidden className="shrink-0 text-ink-50 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-2 text-body leading-5 text-ink-60">{h.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-center text-meta text-ink-50">Anything else, ask Moon from the top of any page.</p>
      </div>
    </Sheet>
  );
}

const TERMS: { h: string; lines: string[] }[] = [
  { h: "When you join a campaign, you agree to", lines: [
    "Post the ads it asks for, at the schedule you picked.",
    "Follow the brief, including the code and the link the orders are counted through.",
    "One re-cut if the brand asks for changes, inside 48 hours.",
  ] },
  { h: "You never agree to", lines: [
    "Anything exclusive. You can take other work in the same category tomorrow.",
    "Your ads being used past 90 days without the brand asking you again.",
    "Any say over your other posts, paid or not, or any minimum.",
  ] },
  { h: "Your accounts and your money", lines: [
    "Connected accounts are read-only. Nothing is posted, edited or deleted from them.",
    "Your share is paid every Friday, on the orders that cleared, to the account you add.",
  ] },
];

export function TermsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title="Terms">
      <div className="flex flex-col gap-5 px-4 pb-5 pt-1">
        {TERMS.map((t) => (
          <section key={t.h}>
            <p className="text-body font-semibold text-ink">{t.h}</p>
            <ul className="mt-2 space-y-1.5">
              {t.lines.map((l) => (
                <li key={l} className="flex items-start gap-2 text-body leading-5 text-ink-60">
                  <Check size={14} weight="bold" aria-hidden className="mt-1 shrink-0 text-main" />{l}
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-meta leading-4 text-ink-50">The terms in plain words, for the prototype. The legal version will sit beside them.</p>
      </div>
    </Sheet>
  );
}
