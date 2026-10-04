"use client";

/* Which view the panel is showing. The store holds one view name, the
   chat changes it, and closing the panel puts you back where you were. */

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { PanelFrame } from "./ChatShell";
import { ProfilePanel } from "../panels/ProfilePanel";
import { ReadPanel } from "../panels/ReadPanel";
import { CampaignsPanel } from "../panels/CampaignsPanel";
import { useActiveProfile, usePanel, useSelectedOfferId, useStore } from "../../lib/store";

export function PanelHost() {
  const { view } = usePanel();
  const profile = useActiveProfile();
  const handle = useStore((s) => Object.values(s.reads)[0]?.handle ?? "your profile");
  const selected = useSelectedOfferId();

  switch (view) {
    case "profile":
      return <PanelFrame title="Your profile" sub={profile ? [profile.creatorName, profile.handle].filter(Boolean).join(" · ") : undefined}><ProfilePanel /></PanelFrame>;
    case "read":
      return <PanelFrame title="What I found" sub={handle}><ReadPanel /></PanelFrame>;
    case "offers":
      return (
        <PanelFrame title={selected ? "Campaign" : "Campaigns"} sub={selected ? undefined : "Every one pays a share of its orders"} bare>
          <CampaignsPanel />
        </PanelFrame>
      );
    default:
      return (
        <PanelFrame title="This lives in your dashboard">
          <p className="text-body leading-6 text-ink-60">
            That belongs to work in flight, not to this conversation. Once a campaign is approved, everything about delivering it is on its own page.
          </p>
          <Link href="/creators/dashboard" className="g-button mt-4 inline-flex h-11 items-center gap-1.5 rounded-pill px-4 text-body font-semibold text-white">
            Go to the dashboard <ArrowRight size={13} weight="bold" aria-hidden />
          </Link>
        </PanelFrame>
      );
  }
}
