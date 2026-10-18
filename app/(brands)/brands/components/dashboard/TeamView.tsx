"use client";

/* Team, and who owns the brand (brand team, 15 Oct).
 *
 * "If someone pays, they become the owner of the brand. And they only can invite others… I only can be invited or
 * I request access. But the admin who paid initially is the owner of this and no one else can claim." So this page
 * has three parts, in the order a brand needs them: who owns the account and why, the people on it (the owner
 * invites by work email), and the requests from people who signed in with an address nobody invited.
 *
 * Everything on it is the owner's to change. A member sees the same page with nothing to press, and is told who
 * to ask. Before anyone has paid there is no owner, and the page says what will make one.
 */

import { useState } from "react";
import { CheckCircle, Crown, EnvelopeSimple, UserPlus, X } from "@phosphor-icons/react";
import { Btn } from "../ui";
import { Section, Surface } from "./kit";
import {
  accessFor, accountName, answerRequest, inviteMember, removeMember, useAccount, useBrandAccount,
  type BrandMember,
} from "../../lib/store";
import { isPersonal, looksLikeEmail } from "../../lib/email";

const day = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const initials = (first?: string, last?: string, email = "") =>
  ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || email.slice(0, 1).toUpperCase();

function Person({ first, last, email, children }: { first?: string; last?: string; email: string; children?: React.ReactNode }) {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lilac text-meta font-semibold text-main">
        {initials(first, last, email)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold text-ink">{name || email}</p>
        {name && <p dir="ltr" className="truncate text-[11px] text-ink-faint">{email}</p>}
      </div>
      {children}
    </div>
  );
}

const pill = (tone: "brand" | "good" | "muted", text: string) => (
  <span
    className={`shrink-0 rounded-pill border px-2.5 py-1 text-[11px] font-semibold ${
      tone === "brand" ? "border-brand/25 bg-brand/[0.07] text-brand"
      : tone === "good" ? "border-good/25 bg-good/[0.07] text-good-deep"
      : "border-hairline bg-wash text-ink-faint"
    }`}
  >
    {text}
  </span>
);

export function TeamView({ host, brandName }: { host: string; brandName: string }) {
  const account = useAccount();
  const brand = useBrandAccount(host);
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);

  if (!host) {
    return (
      <Section title="Team">
        <Surface className="p-5">
          <p className="text-body text-ink-soft">Build a campaign first. The team belongs to the brand it was built for.</p>
        </Surface>
      </Section>
    );
  }

  /* No owner yet: nobody has paid for this store. */
  if (!brand) {
    return (
      <Section title="Team">
        <Surface className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wash text-ink-faint">
              <Crown size={16} weight="fill" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-body font-semibold text-ink">Nobody owns {brandName} on HeyMoon yet</p>
              <p className="mt-1 max-w-[62ch] text-meta leading-5 text-ink-soft">
                Whoever pays for Phase 1 owns the brand account. From then on they invite the rest of the team, and
                anyone else who signs in with a {brandName} email can only ask them for access.
              </p>
            </div>
          </div>
        </Surface>
      </Section>
    );
  }

  const me = account ? accessFor(host, account.email, { [host]: brand }) : "outsider";
  const isOwner = me === "owner";
  const value = email.trim().toLowerCase();
  const problem =
    !looksLikeEmail(value) ? "Enter a full email address."
    : isPersonal(value) ? "Use their work email. Personal addresses like Gmail can't join a brand account."
    : value === brand.owner.email ? "That's the owner's address."
    : brand.members.some((m) => m.email === value) ? "They're already on the team."
    : "";
  const invite = () => {
    setTried(true);
    if (problem) return;
    inviteMember(host, value, Date.now());
    setEmail("");
    setTried(false);
  };

  const memberState = (m: BrandMember) =>
    m.joinedAt ? pill("good", `Joined ${day(m.joinedAt)}`) : pill("muted", `Invited ${day(m.invitedAt)}`);

  return (
    <div className="space-y-6">
      <Section title={`Who owns ${brandName}`}>
        <Surface className="p-5">
          <Person first={brand.owner.firstName} last={brand.owner.lastName} email={brand.owner.email}>
            {pill("brand", isOwner ? "Owner · you" : "Owner")}
          </Person>
          <div className="mt-4 border-t border-hairline pt-3">
            <p className="max-w-[70ch] text-[11px] leading-4 text-ink-faint">
              Paid for Phase 1 on {day(brand.owner.since)}, which made them the owner. Ownership can&apos;t be claimed
              by signing in with the same company&apos;s email: the owner invites people, and anyone else can only ask.
            </p>
          </div>
        </Surface>
      </Section>

      <Section title="Team">
        <Surface>
          {isOwner && (
            <form
              onSubmit={(e) => { e.preventDefault(); invite(); }}
              noValidate
              className="border-b border-hairline p-5"
            >
              <label htmlFor="team-invite" className="mb-1.5 block text-meta font-medium text-ink-60">
                Invite by work email
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="team-invite"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  aria-invalid={(tried && !!problem) || undefined}
                  aria-describedby="team-invite-note"
                  className={`min-w-0 flex-1 rounded-control border bg-white px-3.5 py-2.5 text-body text-ink outline-none transition placeholder:text-ink-faint ${
                    tried && problem ? "border-danger" : "border-black/[0.09] focus:border-ink/25"
                  }`}
                />
                <Btn type="submit" size="sm" className="shrink-0">
                  <UserPlus size={13} weight="bold" aria-hidden />
                  Send invite
                </Btn>
              </div>
              <p id="team-invite-note" className="mt-1.5 text-[11px] leading-4" role={tried && problem ? "alert" : undefined}>
                {tried && problem ? (
                  <span className="font-semibold text-danger">{problem}</span>
                ) : (
                  <span className="text-ink-faint">
                    They get an email, and sign in with that address to join. Any company address works, including
                    your agency&apos;s.
                  </span>
                )}
              </p>
            </form>
          )}

          <ul className="divide-y divide-hairline">
            {brand.members.length === 0 && (
              <li className="p-5 text-meta text-ink-soft">
                {isOwner ? "Just you so far." : `Nobody else has been invited yet.`}
              </li>
            )}
            {brand.members.map((m) => (
              <li key={m.email} className="px-5 py-3.5">
                <Person first={m.firstName} last={m.lastName} email={m.email}>
                  {memberState(m)}
                  {account && m.email === account.email.toLowerCase() && pill("brand", "You")}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => removeMember(host, m.email)}
                      aria-label={`Remove ${m.email}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-ink-faint transition hover:bg-danger/[0.07] hover:text-danger"
                    >
                      <X size={14} weight="bold" aria-hidden />
                    </button>
                  )}
                </Person>
              </li>
            ))}
          </ul>

          {!isOwner && (
            <p className="border-t border-hairline p-5 text-[11px] leading-4 text-ink-faint">
              Only {brand.owner.firstName} can invite people or answer requests to join.
            </p>
          )}
        </Surface>
      </Section>

      {isOwner && (
        <Section title="Requests to join">
          <Surface>
            {brand.requests.length === 0 ? (
              <div className="flex items-start gap-3 p-5">
                <EnvelopeSimple size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-ink-faint" />
                <p className="max-w-[66ch] text-meta leading-5 text-ink-soft">
                  Nobody is waiting. When someone signs in to {brandName} with an address you haven&apos;t invited,
                  HeyMoon offers them a request to you, never the account, and it shows up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {brand.requests.map((r) => (
                  <li key={r.email} className="px-5 py-3.5">
                    <Person first={r.firstName} last={r.lastName} email={r.email}>
                      <span className="hidden shrink-0 text-[11px] text-ink-faint sm:inline">Asked {day(r.at)}</span>
                      <Btn size="sm" className="shrink-0" onClick={() => answerRequest(host, r.email, true, Date.now())}>
                        <CheckCircle size={13} weight="fill" aria-hidden />
                        Let in
                      </Btn>
                      <Btn size="sm" variant="ghost" className="shrink-0" onClick={() => answerRequest(host, r.email, false, Date.now())}>
                        Decline
                      </Btn>
                    </Person>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </Section>
      )}

      {account && !isOwner && me !== "member" && (
        <p className="text-meta text-ink-soft">
          You&apos;re signed in as {accountName(account)}, who isn&apos;t on this team yet.
        </p>
      )}
    </div>
  );
}
