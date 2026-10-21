"use client";

/* The dashboard: where a campaign LIVES, once the agent has finished
   building it.
 *
 * A different surface from the conversation, and the split is the
 * product's rather than a layout choice. The agent at `/c` has one job
 * — read the store, settle two numbers, build the campaign, take the
 * payment, connect the store — and it ends. What follows is a phase
 * running for weeks: drafts arriving, budget moving, revenue landing
 * against a guarantee. That is not a thread you scroll back through,
 * it is a place you check.
 *
 * The chrome is the current app's, deliberately: a 210px rail that
 * collapses to 60px, a 67px translucent top bar, and a full-bleed main
 * column on the canvas. A brand who uses HeyMoon today should not
 * have to learn a new shell to look at the same numbers. What has
 * changed is the third column.
 *
 * The third column was a chat rail, open by default. It is closed now
 * and the agents work in the page instead (components/dashboard/
 * HeyMoon.tsx): their next moves on the page, a request bar in the top
 * bar, a question on a card, and the column opening only to show an
 * answer or a request to confirm (brand team, 15 Oct: "not just a side
 * chat"). It still cannot publish, move money or sign.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { CampaignView, CAMPAIGN_TABS, type CampaignTab } from "../components/dashboard/CampaignView";
import { HomeView } from "../components/dashboard/HomeView";
import { SettingsView } from "../components/dashboard/SettingsView";
import { DashboardSidebar, NAV } from "../components/dashboard/Sidebar";
import { DashboardTopbar } from "../components/dashboard/Topbar";
import { HeyMoonPanel, HeyMoonProvider, useHeyMoon } from "../components/dashboard/HeyMoon";
import { ConnectAlert } from "../components/dashboard/ConnectAlert";
import { LaunchTracker } from "../components/dashboard/LaunchTracker";
import { PreviewBanner } from "../components/dashboard/Roles";
import {
  campaignLabel, isLaunching, setDashboardView, showCampaignList, useActiveCampaign, useAds, useDashboardView,
  useCampaigns, useDrill,
} from "../lib/store";
import { SurfaceProvider } from "../lib/surface";
import { openSampleAccount } from "../lib/demo";
import { phaseTitle } from "../lib/mock/campaigns";
import { useT } from "../lib/i18n";
import type { DashboardView } from "../lib/agent/dashboard";

/** Nothing built yet, said inside the dashboard rather than instead of
    it. The rail and the top bar stay, so a brand can see what this page
    will hold before they have anything to put in it. */
function EmptyDashboard() {
  return (
    <div className="rounded-card border border-dashed border-black/[0.12] bg-white p-10 text-center">
      <p className="text-row font-semibold text-ink">No campaign yet</p>
      <p className="mx-auto mt-1.5 max-w-[420px] text-body leading-6 text-ink-soft">
        Build one and this fills in: what your creators earn you against the guarantee, the drafts waiting on your
        approval, and everything HeyMoon did on its own.
      </p>
      <Link
        href="/brands/c"
        className="mt-5 inline-flex items-center gap-2 rounded-control bg-brand px-4 py-2 text-body font-semibold text-white transition hover:bg-brand-hover"
      >
        <Sparkle size={14} weight="fill" aria-hidden />
        Build a campaign
        <ArrowRight size={13} weight="bold" aria-hidden className="rtl:rotate-180" />
      </Link>
    </div>
  );
}

/** Built, not started: the plan is saved and waiting (brand flows, P1). The way back is the conversation, which
    welcomes them back with it and asks what held them. */
function PlanWaiting({ brandName }: { brandName: string }) {
  return (
    <div className="rounded-card border border-hairline bg-white p-8 shadow-card">
      <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-brand-500">Not started yet</p>
      <p className="mt-1.5 text-row font-semibold text-ink">Your plan for {brandName} is saved</p>
      <p className="mt-1 max-w-[460px] text-body leading-6 text-ink-soft">
        Phase 1 starts when you&apos;re ready. Ask anything first, or change what you want.
      </p>
      <Link
        href="/brands/c?back=1"
        className="mt-5 inline-flex items-center gap-2 rounded-control bg-brand px-4 py-2 text-body font-semibold text-white transition hover:bg-brand-hover"
      >
        Pick up where you left off
        <ArrowRight size={13} weight="bold" aria-hidden className="rtl:rotate-180" />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  /* The dashboard's own view. It used to share `panel.view` with the
     conversation, which meant moving around here silently repointed
     the panel over there — and, because the cross-links went through
     `openPanel`, armed it open on a surface the brand was not on. Two
     fields, one owner each; the cross-links reach this one through
     the surface context below. */
  const stored = useDashboardView();
  const KNOWN = ["settings", "autonomy", "business", ...NAV.map((v) => v.key), ...CAMPAIGN_TABS.map((t) => t.key)];
  const view: DashboardView = (KNOWN.includes(stored) ? stored : "campaign") as DashboardView;
  const settingsOpen = view === "settings" || view === "autonomy" || view === "business";
  const isCampaignView = CAMPAIGN_TABS.some((t) => t.key === view);
  /* Remembered rather than hardcoded to "home": a brand who opened
     settings from the ads queue expects the back arrow to return them
     to the ads queue. */
  const cameFrom = useRef<DashboardView>("home");
  useEffect(() => { if (!settingsOpen) cameFrom.current = view; }, [view, settingsOpen]);

  const { t, dir } = useT();
  const camp = useActiveCampaign();
  const anyCampaign = useCampaigns().length > 0;
  const launching = isLaunching(camp);
  const drill = useDrill();
  const ads = useAds();
  /* Scoped to the campaign on screen. Counting every ad in the store
     put a "6" on the rail of an account with no campaign at all. */
  const waiting = ads.filter((a) => a.state === "waiting" && camp?.adIds.includes(a.id)).length;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  /* Arriving from the landing's Login (?signin=1): open the sample account when this browser has nothing, so the
     login lands on a dashboard with data (lib/demo.ts). The flag is taken off the URL straight away. */
  /* ?demo=running opens the same brand two phases in, for showing what a running campaign looks like. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    /* From the chat's "Complete business profile": Settings on that tab (21 Oct). */
    if (q.get("view") === "business") {
      setDashboardView("business");
      q.delete("view");
      window.history.replaceState(null, "", window.location.pathname + (q.toString() ? `?${q}` : ""));
    }
    if (!q.has("signin") && q.get("demo") !== "running") return;
    openSampleAccount({ running: q.get("demo") === "running" });
    q.delete("signin");
    q.delete("demo");
    window.history.replaceState(null, "", window.location.pathname + (q.toString() ? `?${q}` : ""));
  }, []);

  /* No early return for an empty account.

     It used to bail out to a centred splash with the logo on it, which
     is a different SCREEN: the rail vanished, the top bar vanished, and
     a brand arriving at their dashboard for the first time could not
     see what the dashboard even was. An empty state belongs INSIDE the
     thing it is empty of. The shell always renders; the main column
     says there is nothing yet. */

  /* The Campaign heading follows the drill: the list, then the
     campaign, then the phase. A page titled "Phase 2 · Scale" while
     you are looking at a list of campaigns is the header disagreeing
     with the body. */
  const drilled =
    drill.level === "list" || !camp
      ? "Campaigns"
      : drill.level === "phase"
        ? (() => {
            const ph = camp.phases.find((x) => x.id === drill.phaseId);
            return ph ? `${campaignLabel(camp)} · ${phaseTitle(ph.phaseNo)}` : campaignLabel(camp);
          })()
        : campaignLabel(camp);

  const TITLE: Record<DashboardView, string> = {
    home: t("dash.title"),
    /* All five campaign tabs are headed by the campaign, not by the
       tab: the tab row directly below already says which face is open,
       and repeating it in the heading left the brand you are looking
       at named nowhere but the breadcrumb. */
    campaign: drilled,
    creators: drilled,
    inbox: drilled,
    ads: drilled,
    activity: drilled,
    autonomy: t("dash.settings"),
    settings: t("dash.settings"),
    business: t("dash.settings"),
  };

  return (
    /* Everything inside moves THIS surface. A panel's cross-link asks
       for `useGo()` and never learns which page it is on. */
    <SurfaceProvider go={setDashboardView}>
    <HeyMoonProvider>
    <Frame>
    {(assistant) => (
    <div dir={dir} className="flex h-[100dvh] overflow-hidden bg-canvas">
      {/* The rail is the work, and settings is not the work. It steps
          aside here and the top bar carries a way back instead, so the
          page you came from is one press away and nothing else on
          screen invites you sideways mid-edit. */}
      {!settingsOpen && (
      <DashboardSidebar
        collapsed={collapsed}
        view={view}
        onView={(v) => { setDashboardView(v); if (v === "campaign") showCampaignList(); }}
        waiting={waiting}
        brandName={camp?.brandName ?? "Campaigns"}
        mobileOpen={mobileNav}
        onMobileClose={() => setMobileNav(false)}
      />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          title={TITLE[view]}
          waiting={waiting}
          /* Where the hamburger goes back to: the view that was open
             before settings, or the dashboard if settings is where the
             session started. */
          onBack={settingsOpen ? () => setDashboardView(cameFrom.current) : undefined}
          /* One control, two jobs, the way the current app does it: it
             collapses the rail where there is room for one and opens
             the drawer where there is not. */
          onToggleNav={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) setMobileNav((o) => !o);
            else setCollapsed((o) => !o);
          }}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Below 768 the two columns cannot both fit, so the open
              assistant takes the width and the dashboard steps aside
              rather than being dimmed behind it. */}
          <main
            className={`flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8 ${
              assistant ? "hidden md:block" : "block"
            }`}
          >
            {/* Above every view, not inside one: the store is connected
                once for the account, so the ask does not belong to the
                page that happens to be open. */}
            <ConnectAlert />
            <PreviewBanner />
            {/* Settings is the account, not the work, so it is the one
                view that does not need a campaign or a payment behind
                it. Both keys land here: the rail sends `settings`, and
                the activity log and the inbox still link to `autonomy`,
                which is a section of this page now. */}
            {settingsOpen ? (
              <SettingsView
                initialTab={view === "autonomy" ? "autonomy" : view === "business" ? "business" : "brand"}
                onBack={() => setDashboardView(cameFrom.current)}
                key={view}
              />
            ) : (
              <>
            {!anyCampaign && <EmptyDashboard />}
            {/* Paid, no first sale yet: the launch tracker stands in for the overview (PRD v0.2, H5). The campaign's
                other tabs stay open. */}
            {launching && (view === "home" || view === "campaign") && <LaunchTracker />}
            {anyCampaign && !launching && camp && !camp.paid && view === "home" && <PlanWaiting brandName={camp.brandName} />}
            {anyCampaign && !launching && (!camp || camp.paid) && view === "home" && <HomeView />}
            {/* One component for five views. Creators, Needs you, Ads
                and Activity are tabs of a campaign now, and the view
                key IS the tab, so every deep link that used to open one
                of them still opens it: the assistant's intents, the
                activity log's cross-links, the action bar's Review. */}
            {anyCampaign && isCampaignView && !(launching && view === "campaign") && (
              <CampaignView tab={view as CampaignTab} onTab={(t) => setDashboardView(t)} />
            )}
              </>
            )}
          </main>

          {/* A column, not an overlay, and closed until it has something
              to show: an answer, or a request to confirm. The dashboard
              reflows beside it, so nothing is dimmed or covered. */}
          {assistant && (
            <aside
              className="animate-slide-in-end flex w-full shrink-0 flex-col border-s border-hairline md:w-[clamp(320px,30vw,400px)]"
              aria-label="HeyMoon"
            >
              <HeyMoonPanel />
            </aside>
          )}
        </div>
      </div>
    </div>
    )}
    </Frame>
    </HeyMoonProvider>
    </SurfaceProvider>
  );
}

/** Hands the panel's open state to the layout, from inside the provider that owns it. */
function Frame({ children }: { children: (open: boolean) => ReactNode }) {
  const { open } = useHeyMoon();
  return <>{children(open)}</>;
}
