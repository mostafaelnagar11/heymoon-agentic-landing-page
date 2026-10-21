"use client";

/* What a role changes on the page (store.ts, TeamRole and CAN).

   A member sees every page the owner sees. Where the owner would press something that spends, publishes or changes
   what the creators are told, a member gets a line that says who can, or a way to suggest it instead. Nothing is
   hidden, so a member can follow the whole campaign and nobody wonders where a control went. */

import { Eye, LockSimple, ThumbsDown, ThumbsUp, X } from "@phosphor-icons/react";
import {
  ROLE_LABEL, recommendAd, setPreviewRole, useAccount, useAdRecs, useTeamRole, type TeamRole,
} from "../../lib/store";

/** "Only the owner or an admin can approve. Ask Sara." */
export function OnlyAdmins({ what, className = "" }: { what: string; className?: string }) {
  const { owner } = useTeamRole();
  return (
    <p className={`flex items-center gap-1.5 text-meta text-ink-faint ${className}`}>
      <LockSimple size={12} weight="fill" aria-hidden className="shrink-0" />
      <span>Only the owner or an admin can {what}.{owner?.firstName ? ` Ask ${owner.firstName}.` : ""}</span>
    </p>
  );
}

/** A member's call on a draft they can't approve: recommend it, or recommend a re-cut. */
export function MemberCall({ adId, className = "" }: { adId: string; className?: string }) {
  const account = useAccount();
  const rec = useAdRecs()[adId];
  const by = account?.firstName || account?.email || "A member";
  if (rec) {
    return (
      <p className={`text-meta text-ink-soft ${className}`}>
        You recommended {rec.call === "approve" ? "approving it" : "a re-cut"}.{" "}
        <button
          type="button"
          onClick={() => recommendAd(adId, by, rec.call === "approve" ? "recut" : "approve", Date.now())}
          className="font-semibold text-brand hover:underline"
        >
          Change
        </button>
      </p>
    );
  }
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => recommendAd(adId, by, "approve", Date.now())}
        className="inline-flex items-center gap-1.5 rounded-pill bg-lilac px-3 py-1.5 text-meta font-semibold text-main transition hover:bg-main-10"
      >
        <ThumbsUp size={12} weight="fill" aria-hidden /> Recommend approving
      </button>
      <button
        type="button"
        onClick={() => recommendAd(adId, by, "recut", Date.now())}
        className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-meta font-semibold text-ink-soft transition hover:bg-black/[0.04]"
      >
        <ThumbsDown size={12} weight="fill" aria-hidden /> Recommend a re-cut
      </button>
    </div>
  );
}

/** What a member recommended, shown to whoever approves. */
export function RecLine({ adId, className = "" }: { adId: string; className?: string }) {
  const rec = useAdRecs()[adId];
  if (!rec) return null;
  return (
    <p className={`flex items-center gap-1.5 text-tiny font-semibold ${rec.call === "approve" ? "text-good-deep" : "text-danger"} ${className}`}>
      {rec.call === "approve" ? <ThumbsUp size={11} weight="fill" aria-hidden /> : <ThumbsDown size={11} weight="fill" aria-hidden />}
      {rec.by} recommends {rec.call === "approve" ? "approving" : "a re-cut"}
    </p>
  );
}

/** Above every view while the owner or an admin is seeing the dashboard as another role. */
export function PreviewBanner() {
  const { real, role } = useTeamRole();
  if (!real || role === real) return null;
  const a = (r: TeamRole) => (r === "admin" ? "an admin" : r === "member" ? "a member" : "the owner");
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-tile border border-brand/25 bg-brand/[0.06] px-4 py-2.5">
      <Eye size={15} weight="fill" aria-hidden className="shrink-0 text-brand" />
      <p className="min-w-0 flex-1 text-body text-ink">
        You&apos;re seeing what {a(role!)} sees.{" "}
        <span className="text-ink-soft">Anything you press here still counts as you, the {ROLE_LABEL[real].toLowerCase()}.</span>
      </p>
      <button
        type="button"
        onClick={() => setPreviewRole(null)}
        className="inline-flex shrink-0 items-center gap-1 rounded-pill px-3 py-1.5 text-meta font-semibold text-brand transition hover:bg-brand/[0.08]"
      >
        <X size={12} weight="bold" aria-hidden /> Stop previewing
      </button>
    </div>
  );
}
