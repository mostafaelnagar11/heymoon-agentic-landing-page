"use client";

/* Team, roles, and who owns the brand (brand team, 15 Oct; roles, Mostafa 19 Oct).
 *
 * "If someone pays, they become the owner of the brand. And they only can invite others… I only can be invited or
 * I request access. But the admin who paid initially is the owner of this and no one else can claim." Then roles:
 * an admin does what the owner does, paying included, except handing the brand on; a member sees everything and
 * suggests (store.ts, CAN). So the page is: who owns it, the people and their roles, requests to join, and what
 * each role can do, with a way for the owner or an admin to see the dashboard as a teammate would.
 *
 * Before anyone has paid there is no owner, and the page says what will make one.
 */

import { useState } from "react";
import { ArrowsLeftRight, CaretDown, Check, CheckCircle, Crown, EnvelopeSimple, Eye, Minus, PaperPlaneTilt, UserPlus, X } from "@phosphor-icons/react";
import { Btn } from "../ui";
import { Section, Surface } from "./kit";
import {
  CAN, ROLE_LABEL, ROLE_NOTE, accountName, answerRequest, inviteMember, removeMember, resendInvite, setMemberRole,
  setPreviewRole, transferOwnership, useAccount, useBrandAccount, useTeamRole,
  type BrandMember, type TeamAction, type TeamRole,
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

const ACTIONS: { key: TeamAction; label: string }[] = [
  { key: "pay", label: "Pay and start phases" },
  { key: "approve", label: "Approve drafts" },
  { key: "brief", label: "Change the brief" },
  { key: "team", label: "Manage the team" },
  { key: "transfer", label: "Hand the brand on" },
];

function RoleSelect({ value, onChange, id, label }: { value: "admin" | "member"; onChange: (r: "admin" | "member") => void; id: string; label: string }) {
  return (
    <>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as "admin" | "member")}
        className="h-8 shrink-0 rounded-control border border-black/[0.09] bg-white px-2 text-meta font-semibold text-ink outline-none focus:border-ink/25"
      >
        <option value="admin">Admin</option>
        <option value="member">Member</option>
      </select>
    </>
  );
}

export function TeamView({ host, brandName }: { host: string; brandName: string }) {
  const account = useAccount();
  const brand = useBrandAccount(host);
  const { real, role } = useTeamRole(host);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "member">("member");
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [handing, setHanding] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

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
              <p className="mt-1 text-meta leading-5 text-ink-soft">Whoever pays for Phase 1 owns it and invites the team.</p>
            </div>
          </div>
        </Surface>
      </Section>
    );
  }

  const can = (a: TeamAction) => !!role && CAN[a].includes(role);
  const manages = can("team");
  const isOwner = role === "owner";
  const me = account?.email.toLowerCase();
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
    inviteMember(host, value, Date.now(), newRole);
    setNote(`Invited ${value} as ${newRole === "admin" ? "an admin" : "a member"}.`);
    setEmail("");
    setNewRole("member");
    setTried(false);
  };

  const joined = brand.members.filter((m) => m.joinedAt);
  const memberState = (m: BrandMember) =>
    m.joinedAt ? pill("good", `Joined ${day(m.joinedAt)}`) : pill("muted", `Invited ${day(m.invitedAt)}`);

  return (
    <div className="space-y-6">
      <Section title={`Who owns ${brandName}`}>
        <Surface className="p-5">
          <Person first={brand.owner.firstName} last={brand.owner.lastName} email={brand.owner.email}>
            {pill("brand", brand.owner.email === me ? "Owner · you" : "Owner")}
          </Person>
          <p className="mt-3 border-t border-hairline pt-3 text-[11px] leading-4 text-ink-faint">
            Owner since {day(brand.owner.since)}. The owner can hand the brand to someone on the team.
          </p>
          {isOwner && (
            handing ? (
              <div className="mt-3 rounded-control border border-hairline bg-wash p-3">
                {joined.length ? (
                  <>
                    <p className="text-meta font-semibold text-ink">Hand {brandName} to</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {joined.map((m) => (
                        <li key={m.email}>
                          <button
                            type="button"
                            onClick={() => { transferOwnership(host, m.email, Date.now()); setHanding(false); setNote(`${m.firstName ?? m.email} owns ${brandName} now. You're an admin.`); }}
                            className="rounded-pill border border-hairline bg-white px-3 py-1.5 text-meta font-semibold text-ink transition hover:border-brand/40"
                          >
                            {`${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] leading-4 text-ink-faint">They become the owner and you stay on as an admin.</p>
                  </>
                ) : (
                  <p className="text-meta text-ink-soft">Only someone who has joined can take it. Invite them first.</p>
                )}
                <button type="button" onClick={() => setHanding(false)} className="mt-2 text-meta font-semibold text-ink-faint hover:text-ink">Cancel</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setHanding(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-meta font-semibold text-brand hover:underline"
              >
                <ArrowsLeftRight size={12} weight="bold" aria-hidden /> Hand the brand to someone else
              </button>
            )
          )}
        </Surface>
      </Section>

      <Section title="Team">
        <Surface>
          {manages && (
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
                  onChange={(e) => { setEmail(e.target.value); setNote(null); }}
                  placeholder="name@company.com"
                  aria-invalid={(tried && !!problem) || undefined}
                  aria-describedby="team-invite-note"
                  className={`min-w-0 flex-1 basis-56 rounded-control border bg-white px-3.5 py-2.5 text-body text-ink outline-none transition placeholder:text-ink-faint ${
                    tried && problem ? "border-danger" : "border-black/[0.09] focus:border-ink/25"
                  }`}
                />
                <label htmlFor="team-invite-role" className="sr-only">Their role</label>
                <select
                  id="team-invite-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "member")}
                  className="h-[46px] shrink-0 rounded-control border border-black/[0.09] bg-white px-3 text-body text-ink outline-none focus:border-ink/25"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Btn type="submit" size="sm" className="h-[46px] shrink-0">
                  <UserPlus size={13} weight="bold" aria-hidden />
                  Send invite
                </Btn>
              </div>
              <p id="team-invite-note" className="mt-1.5 text-[11px] leading-4" role={tried && problem ? "alert" : "status"}>
                {tried && problem ? (
                  <span className="font-semibold text-danger">{problem}</span>
                ) : note ? (
                  <span className="font-semibold text-good-deep">{note}</span>
                ) : (
                  <span className="text-ink-faint">Any company address, including your agency&apos;s. {ROLE_LABEL[newRole]}: {ROLE_NOTE[newRole].toLowerCase()}.</span>
                )}
              </p>
            </form>
          )}

          <ul className="divide-y divide-hairline">
            {brand.members.length === 0 && (
              <li className="p-5 text-meta text-ink-soft">
                {manages ? "Just you so far." : "Nobody else has been invited yet."}
              </li>
            )}
            {brand.members.map((m) => (
              <li key={m.email} className="px-5 py-3.5">
                <Person first={m.firstName} last={m.lastName} email={m.email}>
                  <span className="hidden sm:inline-flex">{memberState(m)}</span>
                  {me && m.email === me && pill("brand", "You")}
                  {manages && m.email !== me ? (
                    <RoleSelect
                      id={`role-${m.email}`}
                      label={`Role for ${m.email}`}
                      value={m.role ?? "member"}
                      onChange={(r) => setMemberRole(host, m.email, r)}
                    />
                  ) : (
                    pill("muted", ROLE_LABEL[m.role ?? "member"])
                  )}
                  {manages && !m.joinedAt && (
                    <button
                      type="button"
                      onClick={() => { resendInvite(host, m.email, Date.now()); setNote(`Sent ${m.email} the invite again.`); }}
                      aria-label={`Resend the invite to ${m.email}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-ink-faint transition hover:bg-black/[0.04] hover:text-ink"
                    >
                      <PaperPlaneTilt size={14} weight="fill" aria-hidden />
                    </button>
                  )}
                  {manages && m.email !== me && (
                    <button
                      type="button"
                      onClick={() => removeMember(host, m.email)}
                      aria-label={m.joinedAt ? `Remove ${m.email}` : `Cancel the invite to ${m.email}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-ink-faint transition hover:bg-danger/[0.07] hover:text-danger"
                    >
                      <X size={14} weight="bold" aria-hidden />
                    </button>
                  )}
                </Person>
              </li>
            ))}
          </ul>

          {!manages && (
            <p className="border-t border-hairline p-5 text-[11px] leading-4 text-ink-faint">
              Only {brand.owner.firstName} or an admin can invite people, change roles or answer requests to join.
            </p>
          )}
        </Surface>
      </Section>

      {manages && (
        <Section title="Requests to join">
          <Surface>
            {brand.requests.length === 0 ? (
              <div className="flex items-start gap-3 p-5">
                <EnvelopeSimple size={16} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-ink-faint" />
                <p className="text-meta leading-5 text-ink-soft">No requests.</p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {brand.requests.map((r) => (
                  <li key={r.email} className="px-5 py-3.5">
                    <Person first={r.firstName} last={r.lastName} email={r.email}>
                      <span className="hidden shrink-0 text-[11px] text-ink-faint sm:inline">Asked {day(r.at)}</span>
                      <Btn size="sm" className="shrink-0" onClick={() => answerRequest(host, r.email, true, Date.now())}>
                        <CheckCircle size={13} weight="fill" aria-hidden />
                        Let in as member
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

      {/* Folded by default (21 Oct): the table is reference, not something a brand reads every visit. */}
      <Section
        title={
          <button
            type="button"
            onClick={() => setRolesOpen((o) => !o)}
            aria-expanded={rolesOpen}
            aria-controls="roles-table"
            className="inline-flex items-center gap-2 text-section font-semibold text-ink"
          >
            What each role can do
            <CaretDown size={14} weight="bold" aria-hidden className={`text-ink-faint transition ${rolesOpen ? "rotate-180" : ""}`} />
          </button>
        }
      >
        {rolesOpen && (
        <div id="roles-table">
        <Surface className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-start">
            <thead>
              <tr className="border-b border-hairline">
                <th className="px-5 py-2.5 text-start text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Role</th>
                {ACTIONS.map((a) => (
                  <th key={a.key} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{a.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {(["owner", "admin", "member"] as TeamRole[]).map((r) => (
                <tr key={r} className={r === role ? "bg-brand/[0.03]" : ""}>
                  <td className="px-5 py-3">
                    <p className="text-body font-semibold text-ink">{ROLE_LABEL[r]}{r === real ? " · you" : ""}</p>
                    <p className="text-[11px] leading-4 text-ink-faint">{ROLE_NOTE[r]}</p>
                  </td>
                  {ACTIONS.map((a) => (
                    <td key={a.key} className="px-3 py-3 text-center">
                      {CAN[a.key].includes(r)
                        ? <Check size={14} weight="bold" className="mx-auto text-good" aria-label="Yes" />
                        : <Minus size={14} weight="bold" className="mx-auto text-ink-faint/60" aria-label="No" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {/* The owner or an admin checking what a teammate can do, without signing in as them. */}
          {(real === "owner" || real === "admin") && (
            <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-5 py-3">
              <Eye size={14} weight="fill" aria-hidden className="text-ink-faint" />
              <p className="me-auto text-meta text-ink-soft">See the dashboard the way a teammate does</p>
              {(["admin", "member"] as TeamRole[]).filter((r) => r !== real).map((r) => (
                <Btn key={r} size="sm" variant={role === r ? "primary" : "quiet"} onClick={() => setPreviewRole(role === r ? null : r)}>
                  {role === r ? "Stop previewing" : `As ${r === "admin" ? "an admin" : "a member"}`}
                </Btn>
              ))}
            </div>
          )}
        </Surface>
        </div>
        )}
      </Section>

      {account && !real && (
        <p className="text-meta text-ink-soft">
          You&apos;re signed in as {accountName(account)}, who isn&apos;t on this team yet.
        </p>
      )}
    </div>
  );
}
