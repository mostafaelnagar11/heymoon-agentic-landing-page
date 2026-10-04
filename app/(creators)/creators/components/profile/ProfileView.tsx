"use client";

/* PROFILE — the account, and everything it holds, each one something
 * that can be done.
 *
 * It was a phone settings list: centred avatar, grouped rows, and half
 * the rows went nowhere — Email and Phone said "Not set" beside an
 * account made with a phone number, Connected accounts opened Explore,
 * and Bank details, Invoices, Help and Terms had no press at all. On a
 * phone there was no way to log out, because only the desktop rail had
 * it.
 *
 * Now: who this is, then the profile campaigns are matched on (with
 * Edit, which matches again), the accounts it
 * reads, how to reach them, where the money goes, what HeyMoon may do,
 * and help. Every row opens the one popup that does its job. Two
 * columns when the page is wide, one when it is not — by the column,
 * not the window, because Ask Moon takes 400px of it. */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bank, CaretRight, EnvelopeSimple, FileText, Info, Lightning, Lock, PencilSimple, Phone, Question, SignOut,
} from "@phosphor-icons/react";
import { Avatar, Btn, Card, Chip } from "../ui";
import { Soc } from "../figma";
import { Flag } from "../Flag";
import { AccountSheet, dialFor } from "../AccountSheet";
import type { Platform } from "../../lib/agent/types";
import { mediumDate } from "../../lib/dates";
import { personFor } from "../../lib/mock/people";
import { useGo } from "../../lib/surface";
import {
  pushToast, resetAll, setAccount, useAccount, useAccountHandles, useActiveProfile, useConnected, usePayout,
} from "../../lib/store";
import { PayoutSheet } from "./PayoutSheet";
import { CONNECTION_OF, ConnectSheet, HelpSheet, PLATFORMS, ProfileEditSheet, StatementsSheet, TermsSheet } from "./ProfileSheets";

type Open = null | "edit" | "phone" | "email" | "payout" | "statements" | "help" | "terms" | { connect: Platform };

/** "50 000 0000" — a Gulf mobile in the groups it is read out in. */
const grouped = (d: string) => (d.length === 9 ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : d.replace(/(\d{3})(?=\d)/g, "$1 "));

export function ProfileView() {
  const go = useGo();
  const profile = useActiveProfile();
  const account = useAccount();
  const payout = usePayout();
  const connected = useConnected();
  const handles = useAccountHandles();
  const [open, setOpen] = useState<Open>(null);
  if (!profile) return null;

  const person = personFor(profile.handle);
  const name = profile.creatorName ?? (account ? `${account.firstName} ${account.lastName}`.trim() : "Your account");
  /* The handle for a platform: the read's, or the one added here. */
  const handleOf = (p: Platform) => person.accounts.find((a) => a.platform === p)?.handle ?? handles[CONNECTION_OF[p]];
  const aud = profile.audience.value;
  const close = () => setOpen(null);

  return (
    <div className="@container mx-auto flex w-full max-w-[1100px] flex-col gap-4 md:gap-5">
      {/* ── Who ──────────────────────────────────────────────────── */}
      <Card edge className="p-5 md:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar src={profile.avatar} name={name === "Your account" ? "You" : name} size={72} className="border-4 border-lilac" />
          <div className="min-w-0">
            <p className="truncate text-title font-semibold tracking-[-0.01em] text-ink">{name}</p>
            <p className="truncate text-body text-ink-50"><span dir="ltr">{profile.handle}</span>{person.location ? ` · ${person.location}` : ""}</p>
            <p className="mt-1 text-meta text-ink-50">{account ? `On HeyMoon since ${mediumDate(new Date(account.verifiedAt))}` : "No account yet: your first Join makes one"}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @3xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] @3xl:items-start md:gap-5">
        <div className="flex flex-col gap-4 md:gap-5">
          {/* ── The profile campaigns are matched on ───────────────── */}
          <Section title="Your profile" line="What campaigns are matched on. Nothing here is a price."
            action={<Btn dense size="sm" variant="quiet" onClick={() => setOpen("edit")}><PencilSimple size={14} weight="bold" aria-hidden />Edit</Btn>}>
            <div className="divide-y divide-line">
              <Fact k="Known for" v={<><span className="font-semibold text-ink">{profile.authority.value.primary}</span>{profile.authority.value.also.length > 0 && <span className="text-ink-60">, then {profile.authority.value.also.join(" and ")}</span>}</>} />
              <Fact k="Platforms" v={<span className="flex flex-wrap items-center gap-1.5">{profile.platforms.value.map((p) => <span key={p} className="inline-flex items-center gap-1.5 text-ink"><Soc platform={p} size={18} />{p}</span>)}</span>} />
              <Fact k="Audience" v={
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
                  {aud.markets.slice(0, 3).map((m) => <span key={m} className="inline-flex items-center gap-1.5"><Flag code={m} size={16} />{m}</span>)}
                  <span className="num text-ink-60">{aud.age[0]}–{aud.age[1]}, {aud.femaleShare}% women</span>
                </span>} />
              <Fact k="You won't take" v={
                profile.noList.value.categories.length
                  ? <span className="flex flex-wrap gap-1.5">{profile.noList.value.categories.map((c) => <Chip key={c} tone="ink">{c}</Chip>)}</span>
                  : <span className="text-ink-50">Nothing ruled out</span>} />
            </div>
            <div className="mt-1 rounded-inner bg-lilac/50 px-4 py-3">
              <p className="text-meta font-semibold text-main">What matching reads</p>
              <ul className="mt-1.5 space-y-1">
                {profile.influence.value.map((l) => <li key={l} className="text-meta leading-4 text-ink-60">{l}</li>)}
              </ul>
            </div>
          </Section>

          {/* ── The accounts it reads ───────────────────────────────── */}
          {/* All four platforms HeyMoon reads, not only the ones the read
              found: a creator with a YouTube channel the read missed can
              still connect it. */}
          <Section title="Connected accounts" line="Read-only. HeyMoon counts what a post did and can't post from them.">
            <div className="divide-y divide-line">
              {PLATFORMS.map((p) => {
                const on = connected.includes(CONNECTION_OF[p]);
                const h = handleOf(p);
                return (
                  <Row key={p} icon={<Soc platform={p} size={28} />} label={p}
                    sub={h ? <span dir="ltr">{h}</span> : "Not connected"}
                    trailing={on ? <Chip tone="green">Connected</Chip> : <span className="text-meta font-semibold text-main">Connect</span>}
                    onClick={() => setOpen({ connect: p })} />
                );
              })}
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-4 md:gap-5">
          {/* ── How to reach them ───────────────────────────────────── */}
          <Section title="Contact">
            <div className="divide-y divide-line">
              <Row icon={<Phone size={18} weight="fill" />} label="Phone number"
                sub={account?.phone ? <span dir="ltr" className="num">{account.dialCode} {grouped(account.phone)}</span> : "Not set"}
                trailing={account?.phone ? <Chip tone="green">Verified</Chip> : undefined}
                action={account?.phone ? "Change" : "Add"} onClick={() => setOpen("phone")} />
              {/* An email hangs off the account, and the account is the
                  phone number, so without one the press starts there. */}
              <Row icon={<EnvelopeSimple size={18} weight="fill" />} label="Email"
                sub={account?.email ? <span dir="ltr">{account.email}</span> : account ? "For statements and receipts" : "Add your phone number first"}
                trailing={account?.email ? <Chip tone="green">Verified</Chip> : undefined}
                action={account?.email ? "Change" : "Add"} onClick={() => setOpen(account ? "email" : "phone")} />
            </div>
          </Section>

          {/* ── Where the money goes ────────────────────────────────── */}
          <Section title="Payouts" line="Every Friday, on the orders that cleared that week.">
            <div className="divide-y divide-line">
              <Row icon={<Bank size={18} weight="fill" />} label="Where you're paid"
                sub={payout ? <>{payout.bank ?? "Bank account"} ending <span className="num">{payout.last4}</span></> : "Not set yet: Friday's run needs somewhere to go"}
                trailing={payout ? <Chip tone="green">Ready</Chip> : <Chip tone="orange">Add</Chip>}
                onClick={() => setOpen("payout")} />
              <Row icon={<FileText size={18} weight="fill" />} label="Statements" sub="What has been paid, and what is held" onClick={() => setOpen("statements")} />
            </div>
          </Section>

          {/* ── What HeyMoon may do ─────────────────────────────────── */}
          <Section title="HeyMoon">
            <div className="divide-y divide-line">
              <Row icon={<Lock size={18} weight="fill" />} label="What HeyMoon may do alone" sub="Three things are locked shut" onClick={() => go("autonomy")} />
              <Row icon={<Lightning size={18} weight="fill" />} label="Activity" sub="Everything an agent did on its own" onClick={() => go("activity")} />
            </div>
          </Section>

          <Section title="Help">
            <div className="divide-y divide-line">
              <Row icon={<Question size={18} weight="fill" />} label="Help" sub="Pay, ads, accounts" onClick={() => setOpen("help")} />
              <Row icon={<Info size={18} weight="fill" />} label="Terms" sub="What you agree to, in plain words" onClick={() => setOpen("terms")} />
            </div>
          </Section>

          {/* On a phone the rail, and its Log out, is not there. */}
          <Link href="/creators" onClick={() => resetAll()}
            className="flex h-12 items-center justify-center gap-2 rounded-card border border-hairline bg-white text-body font-semibold text-ink-60 shadow-edge transition hover:bg-danger/[0.06] hover:text-danger">
            <SignOut size={18} aria-hidden />Log out
          </Link>
        </div>
      </div>

      {open === "edit" && <ProfileEditSheet profile={profile} onClose={close} />}
      <AccountSheet open={open === "phone"} mode="phone" name={name} dial={account?.dialCode ?? dialFor(person.location)} onClose={close}
        onVerified={(a) => {
          setAccount(account ? { ...account, dialCode: a.dialCode, phone: a.phone, verifiedAt: account.verifiedAt } : a);
          pushToast({ tone: "green", text: "Number changed. Codes go to it from now on." });
          close();
        }} />
      <AccountSheet open={open === "email"} mode="email" name={name} email={account?.email} onClose={close}
        onVerified={(a) => {
          if (account) setAccount({ ...account, email: a.email, emailVerifiedAt: a.emailVerifiedAt });
          pushToast({ tone: "green", text: "Email saved. Statements go to it." });
          close();
        }} />
      <PayoutSheet open={open === "payout"} onClose={close} />
      {open === "statements" && <StatementsSheet onClose={close} />}
      {open === "help" && <HelpSheet onClose={close} />}
      {open === "terms" && <TermsSheet onClose={close} />}
      {open && typeof open === "object" && (
        <ConnectSheet platform={open.connect} handle={handleOf(open.connect)}
          connected={connected.includes(CONNECTION_OF[open.connect])} onClose={close} />
      )}
    </div>
  );
}

function Section({ title, line, action, children }: { title: string; line?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card edge className="overflow-hidden">
      <div className="flex items-start gap-3 px-4 pb-1 pt-4 md:px-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-row font-semibold text-ink">{title}</h2>
          {line && <p className="mt-0.5 text-meta text-ink-50">{line}</p>}
        </div>
        {action}
      </div>
      <div className="px-4 pb-3 md:px-5">{children}</div>
    </Card>
  );
}

function Fact({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 @md:flex-row @md:items-baseline @md:gap-4">
      <span className="shrink-0 text-meta font-medium text-ink-50 @md:w-32">{k}</span>
      <span className="min-w-0 flex-1 text-body leading-5">{v}</span>
    </div>
  );
}

/** A row that does something: the whole row is the press, and it says
    what the press does ("Add", "Change") rather than only a chevron. */
function Row({ icon, label, sub, trailing, action, onClick }: {
  icon: ReactNode; label: string; sub?: ReactNode; trailing?: ReactNode; action?: string; onClick?: () => void;
}) {
  const body = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-inner bg-lilac/70 text-main">{icon}</span>
      <span className="min-w-0 flex-1 text-start">
        <span className="block truncate text-body font-medium text-ink">{label}</span>
        {sub && <span className="block truncate text-meta text-ink-50">{sub}</span>}
      </span>
      {trailing}
      {action && <span className="text-meta font-semibold text-main">{action}</span>}
      {onClick && !action && <CaretRight size={14} aria-hidden className="shrink-0 text-ink-40 rtl:rotate-180" />}
    </>
  );
  const cls = "flex w-full items-center gap-3 py-3";
  return onClick
    ? <button type="button" onClick={onClick} className={`${cls} -mx-2 w-[calc(100%+1rem)] rounded-inner px-2 transition hover:bg-lilac/40`}>{body}</button>
    : <div className={cls}>{body}</div>;
}

