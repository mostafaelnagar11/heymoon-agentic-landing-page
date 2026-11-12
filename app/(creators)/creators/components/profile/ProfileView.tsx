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
  Bank, CaretRight, FileText, Info, Lightning, PencilSimple, Phone, Question, SignOut,
} from "@phosphor-icons/react";
import { Avatar, Btn, Chip } from "../ui";
import { AutonomyView } from "../dashboard/views";
import { Soc } from "../figma";
import { Flag } from "../Flag";
import { AccountSheet, dialFor } from "../AccountSheet";
import type { Platform } from "../../lib/agent/types";
import { mediumDate } from "../../lib/dates";
import { personFor } from "../../lib/mock/people";
import { useGo } from "../../lib/surface";
import {
  pushToast, resetAll, setAccount, useAccount, useAccountHandles, useActiveProfile, useConnected, usePayout, useRead,
} from "../../lib/store";
import { PayoutSheet } from "./PayoutSheet";
import { CONNECTION_OF, ConnectSheet, HelpSheet, PLATFORMS, ProfileEditSheet, StatementsSheet, TermsSheet } from "./ProfileSheets";

type Open = null | "edit" | "phone" | "email" | "payout" | "statements" | "help" | "terms" | { connect: Platform };

/** "50 000 0000" — a Gulf mobile in the groups it is read out in. */
const grouped = (d: string) => (d.length === 9 ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : d.replace(/(\d{3})(?=\d)/g, "$1 "));

/* The page, as the brand's Settings (12 Nov: "make sure it behaves and looks like the brand settings"): a row of tabs in
   a glass bar, and under each a titled section of glass panels. Settings is the one page you arrive at knowing what you
   came to change, so it is split by what the setting belongs to rather than run as one long scroll. The read's
   findings sit in the brand's read-only field boxes, because they are evidence and are changed through Edit, never
   typed over. */
/* Account leads, and what campaigns are matched on is Preferences (12 Nov: "account and a profile look the same
   word"), so no two tabs read alike. */
const TABS = [
  { key: "account", label: "Account" },
  { key: "profile", label: "Preferences" },
  { key: "accounts", label: "Connected accounts" },
  { key: "payouts", label: "Payouts" },
  { key: "autonomy", label: "Autonomy" },
] as const;
export type ProfileTab = (typeof TABS)[number]["key"];

const LABEL = "mb-1.5 block text-meta font-medium text-ink-60";
const BOX = "rounded-[12px] border border-hairline bg-haze/40 px-3.5 py-2.5 text-body text-ink";
const FIELD = "w-full rounded-[12px] border border-black/[0.09] bg-white px-3.5 py-2.5 text-body text-ink outline-none transition placeholder:text-ink-50 focus:border-ink/25";

export function ProfileView({ initialTab = "account" }: { initialTab?: ProfileTab }) {
  const go = useGo();
  const profile = useActiveProfile();
  const account = useAccount();
  const payout = usePayout();
  const connected = useConnected();
  const handles = useAccountHandles();
  const read = useRead(profile?.readId ?? null);
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [open, setOpen] = useState<Open>(null);
  if (!profile) return null;

  const person = personFor(profile.handle);
  const name = profile.creatorName ?? (account ? `${account.firstName} ${account.lastName}`.trim() : "Your account");
  /* The handle for a platform: the read's, or the one added here. */
  const handleOf = (p: Platform) => person.accounts.find((a) => a.platform === p)?.handle ?? handles[CONNECTION_OF[p]];
  const aud = profile.audience.value;
  const close = () => setOpen(null);
  /* The read's finding, not a badge awarded here, and only when the read made it. */
  const eligible = read?.standing?.state === "ok";

  return (
    /* Laid out by this column's width, not the window's: Ask Moon takes up to 400px of it. */
    <div className="@container mx-auto w-full max-w-[1100px] space-y-6">
      <div role="tablist" aria-label="Profile" className="glass inline-flex max-w-full flex-wrap gap-1 !rounded-[22px] p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-pill px-3.5 py-1.5 text-body transition ${
              tab === t.key ? "bg-white font-semibold text-ink shadow-lift" : "font-normal text-ink-50 hover:bg-white/60 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <Section title="Your preferences" aside={<Btn dense size="sm" variant="quiet" onClick={() => setOpen("edit")}><PencilSimple size={14} weight="bold" aria-hidden />Edit</Btn>}>
          <div className="grid gap-4 @3xl:grid-cols-[280px_minmax(0,1fr)]">
            <Surface className="p-6 text-center">
              <Avatar src={profile.avatar} name={name === "Your account" ? "You" : name} size={68} className="mx-auto" />
              <p className="mt-3 text-[17px] font-semibold text-ink">{name}</p>
              <p className="mt-0.5 text-body text-ink-50"><span dir="ltr">{profile.handle}</span>{person.location ? ` · ${person.location}` : ""}</p>
              <p className="mt-1 text-meta text-ink-50">{account ? `On HeyMoon since ${mediumDate(new Date(account.verifiedAt))}` : "No account yet: your first Join makes one"}</p>
              {read?.standing && (
                <p className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-meta font-semibold ${eligible ? "border-green/25 bg-green-10 text-green" : "border-hairline bg-haze/60 text-ink-50"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${eligible ? "bg-green" : "bg-ink-40"}`} />
                    {eligible ? "Eligible creator" : "Not placed yet"}
                  </span>
                </p>
              )}
            </Surface>

            <Surface className="p-5">
              <div className="grid gap-4 @lg:grid-cols-2">
                <div>
                  <span className={LABEL}>Known for</span>
                  <p className={BOX}><span className="font-semibold">{profile.authority.value.primary}</span>{profile.authority.value.also.length > 0 && <span className="text-ink-60">, then {profile.authority.value.also.join(" and ")}</span>}</p>
                </div>
                <div>
                  <span className={LABEL}>Platforms</span>
                  <p className={`${BOX} flex flex-wrap items-center gap-x-3 gap-y-1`}>{profile.platforms.value.map((p) => <span key={p} className="inline-flex items-center gap-1.5"><Soc platform={p} size={18} />{p}</span>)}</p>
                </div>
                <div>
                  <span className={LABEL}>Audience</span>
                  <p className={`${BOX} flex flex-wrap items-center gap-x-3 gap-y-1`}>
                    {aud.markets.slice(0, 3).map((m) => <span key={m} className="inline-flex items-center gap-1.5"><Flag code={m} size={16} />{m}</span>)}
                    <span className="num text-ink-60">{aud.age[0]}–{aud.age[1]}, {aud.femaleShare}% women</span>
                  </p>
                </div>
                <div>
                  <span className={LABEL}>You won&apos;t take</span>
                  <div className={`${BOX} flex flex-wrap gap-1.5`}>
                    {profile.noList.value.categories.length
                      ? profile.noList.value.categories.map((c) => <Chip key={c} tone="ink">{c}</Chip>)
                      : <span className="text-ink-50">Nothing ruled out</span>}
                  </div>
                </div>
                <div className="@lg:col-span-2">
                  <span className={LABEL}>What matching reads</span>
                  <ul className={`${BOX} space-y-1.5`}>
                    {profile.influence.value.map((l) => <li key={l} className="text-body leading-5 text-ink">{l}</li>)}
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-meta leading-4 text-ink-50">What campaigns are matched on. Nothing here is a price. Edit changes it, and matches you again.</p>
            </Surface>
          </div>
        </Section>
      )}

      {/* All four platforms HeyMoon reads, not only the ones the read found: a creator with a YouTube channel the read
          missed can still connect it. */}
      {tab === "accounts" && (
        <Section title="Connected accounts" line="Read-only. HeyMoon counts what a post did and can't post from them.">
          <Surface className="px-5 py-1">
            <div className="divide-y divide-hairline">
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
          </Surface>
        </Section>
      )}

      {tab === "payouts" && (
        <Section title="Payouts" line="Every Friday, on the orders that cleared that week.">
          <Surface className="px-5 py-1">
            <div className="divide-y divide-hairline">
              <Row icon={<Bank size={18} weight="fill" />} label="Where you're paid"
                sub={payout ? <>{payout.bank ?? "Bank account"} ending <span className="num">{payout.last4}</span></> : "Not set yet: Friday's run needs somewhere to go"}
                trailing={payout ? <Chip tone="green">Ready</Chip> : <Chip tone="orange">Add</Chip>}
                onClick={() => setOpen("payout")} />
              <Row icon={<FileText size={18} weight="fill" />} label="Statements" sub="What has been paid, and what is held" onClick={() => setOpen("statements")} />
            </div>
          </Surface>
        </Section>
      )}

      {tab === "account" && (
        <>
          <Section title="You">
            <Surface className="p-5">
              {account ? (
                <>
                  <div className="grid gap-4 @lg:grid-cols-2">
                    <label className="block">
                      <span className={LABEL}>First name</span>
                      <input value={account.firstName} onChange={(e) => setAccount({ ...account, firstName: e.target.value })} className={FIELD} />
                    </label>
                    <label className="block">
                      <span className={LABEL}>Last name</span>
                      <input value={account.lastName} onChange={(e) => setAccount({ ...account, lastName: e.target.value })} className={FIELD} />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 @lg:grid-cols-2">
                    <div>
                      <span className={LABEL}>Phone</span>
                      <div className={`${BOX} flex items-center justify-between gap-3`}>
                        <span dir="ltr" className="num text-ink-60">{account.dialCode} {grouped(account.phone)}</span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="text-meta font-semibold text-green">Verified</span>
                          <button onClick={() => setOpen("phone")} className="text-meta font-semibold text-main hover:underline">Change</button>
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className={LABEL}>Email</span>
                      <div className={`${BOX} flex items-center justify-between gap-3`}>
                        <span dir={account.email ? "ltr" : undefined} className="min-w-0 truncate text-ink-60">{account.email ?? "For statements and receipts"}</span>
                        <span className="flex shrink-0 items-center gap-3">
                          {account.email && <span className="text-meta font-semibold text-green">Verified</span>}
                          <button onClick={() => setOpen("email")} className="text-meta font-semibold text-main hover:underline">{account.email ? "Change" : "Add"}</button>
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-body text-ink-60">No account yet. Your first Join makes one, with your phone number.</p>
                  <Btn size="sm" variant="quiet" onClick={() => setOpen("phone")}><Phone size={13} weight="fill" aria-hidden />Add your phone</Btn>
                </div>
              )}
            </Surface>
          </Section>

          <Section title="Help">
            <Surface className="px-5 py-1">
              <div className="divide-y divide-hairline">
                <Row icon={<Question size={18} weight="fill" />} label="Help" sub="Pay, ads, accounts" onClick={() => setOpen("help")} />
                <Row icon={<Info size={18} weight="fill" />} label="Terms" sub="What you agree to, in plain words" onClick={() => setOpen("terms")} />
              </div>
            </Surface>
          </Section>

          {/* The brand's danger zone. On a phone the rail, and its Log out, is not there. */}
          <Section title="Danger zone">
            <Surface className="border border-danger/25 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-body font-semibold text-ink">Log out</p>
                  <p className="mt-0.5 max-w-[60ch] text-meta leading-4 text-ink-50">Clears this browser. Your profile and campaigns come back when you sign in with your phone.</p>
                </div>
                <Link href="/creators" onClick={() => resetAll()}
                  className="inline-flex h-9 items-center gap-2 rounded-pill bg-danger/[0.08] px-4 text-meta font-semibold text-danger transition hover:bg-danger/[0.12]">
                  <SignOut size={14} weight="bold" aria-hidden />Log out
                </Link>
              </div>
            </Surface>
          </Section>
        </>
      )}

      {/* What HeyMoon may do alone, a tab here as in the brand's settings, with the log of what it did. */}
      {tab === "autonomy" && (
        <div className="space-y-6">
          <AutonomyView />
          <Surface className="px-5 py-1">
            <Row icon={<Lightning size={18} weight="fill" />} label="Activity" sub="Everything an agent did on its own" onClick={() => go("activity")} />
          </Surface>
        </div>
      )}

      {open === "edit" && <ProfileEditSheet profile={profile} onClose={close} />}
      <AccountSheet open={open === "phone"} mode="phone" name={name} dial={account?.dialCode ?? dialFor(person.location)} onClose={close}
        onVerified={(a) => {
          setAccount(account ? { ...account, dialCode: a.dialCode, phone: a.phone, verifiedAt: account.verifiedAt } : a);
          pushToast({ tone: "green", text: account ? "Number changed. Codes go to it from now on." : "Phone added." });
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

/* The brand's Section and Surface (dashboard/kit.tsx there): a 17px title with an optional line and aside, over glass. */
function Section({ title, line, aside, children }: { title: string; line?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          {line && <p className="mt-0.5 text-meta text-ink-50">{line}</p>}
        </div>
        {aside && <div className="ms-auto shrink-0">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass overflow-hidden ${className}`}>{children}</div>;
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

