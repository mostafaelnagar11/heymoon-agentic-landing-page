"use client";

/* Where the work lives, once the agent has finished pricing and
 * matching.
 *
 * The Figma's four tabs, on a desktop: a rail on the left, the page in
 * the middle at a phone-comfortable reading width, and Ask Moon as
 * a column on the right. Below 768px the rail becomes the file's
 * floating tab bar and the assistant becomes a page of its own. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar, NAV, sectionOf } from "../components/dashboard/Sidebar";
import { DashboardTopbar } from "../components/dashboard/Topbar";
import { DashboardAssistant } from "../components/dashboard/Assistant";
import {
  ActivityView, CampaignView, CampaignsView, DashboardView,
} from "../components/dashboard/views";
import { ProfileView } from "../components/profile/ProfileView";
import { EarningsView } from "../components/dashboard/EarningsView";
import { CalendarView } from "../components/dashboard/CalendarView";
import { MobileTabBar, type TabKey } from "../components/figma";
import { ToastHost } from "../components/campaign/Toasts";
import { SurfaceProvider } from "../lib/surface";
import {
  openCampaign, selectOffer, setDashboardView, useActiveProfile, useDashboardView, useHydrated, useOffers, useReviewClock,
  useSelectedOfferId, type PanelView,
} from "../lib/store";

const RAIL_KEY = "mtac_rail_collapsed";

const TITLE: Partial<Record<PanelView, string>> = {
  home: "Dashboard", campaigns: "Your Campaigns", campaign: "Campaign", calendar: "Calendar", earnings: "Earnings",
  /* Autonomy is a tab of Profile now, as it is of the brand's Settings. */
  profile: "Profile", activity: "Activity", autonomy: "Profile",
};

export default function DashboardPage() {
  const stored = useDashboardView();
  const KNOWN: PanelView[] = ["home", "campaigns", "campaign", "calendar", "earnings", "profile", "activity", "autonomy"];
  const view: PanelView = KNOWN.includes(stored) ? stored : "home";
  const profile = useActiveProfile();
  const ready = useHydrated();
  const router = useRouter();
  /* The campaign on screen, so the top bar can name it as the brand's does: the tabs under the hero already say
     which face is open, and "Campaign" named nothing. */
  const offers = useOffers();
  const selectedId = useSelectedOfferId();
  const campaignName = offers.find((o) => o.id === selectedId)?.title;
  /* Closed until asked for, as the brand's panel is. */
  const [assistant, setAssistant] = useState(false);
  /* The rail's width, remembered in this browser only: it is a
     preference about the screen, not something about the work. Read
     after mount so the server's markup (always open) and the first
     client render agree. */
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem(RAIL_KEY) === "1"); } catch {} }, []);
  const toggleRail = () => setCollapsed((c) => {
    try { localStorage.setItem(RAIL_KEY, c ? "0" : "1"); } catch {}
    return !c;
  });
  const scroller = useRef<HTMLElement>(null);
  /* A brand's answer on an ad lands wherever the creator is. */
  useReviewClock();

  /* THERE IS NO DASHBOARD WITHOUT A PROFILE. A creator reaches this page
     from the conversation, and the conversation is what builds the
     profile, so a "No profile yet" state here was a screen nobody on
     the real path could see. Arriving any other way — a typed URL, a
     cleared browser — goes to the front door, where the conversation
     starts. It waits for the saved session, because before that every
     visitor looks like they have no profile. */
  useEffect(() => { if (ready && !profile) router.replace("/creators"); }, [ready, profile, router]);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [view, profile]);

  /* The loaded shell's ground and light, so arriving does not flash white before the page. */
  if (!profile) return (
    <div className="relative h-[100dvh] overflow-clip bg-[#FBFAFE]" aria-busy="true">
      <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
    </div>
  );

  const go = (v: PanelView) => { if (v !== "campaign") selectOffer(null); setDashboardView(v); };
  const back = view === "campaign" ? () => go("campaigns") : view === "activity" ? () => go("profile") : undefined;

  return (
    <SurfaceProvider go={go}>
      <div className="relative flex h-[100dvh] overflow-clip bg-[#FBFAFE]">
        {/* The page's light (Aurora, 11 Nov), the brands dashboard's: a violet and a blush glow at the top. */}
        <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
        <DashboardSidebar view={view} onView={go} collapsed={collapsed} onToggle={toggleRail} />

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <DashboardTopbar title={(view === "campaign" && campaignName) || TITLE[view] || "Dashboard"} onBack={back} assistantOpen={assistant} onToggleAssistant={() => setAssistant((o) => !o)} onBell={() => go("activity")} />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* WIDE, AND SIZED BY THE COLUMN RATHER THAN THE VIEWPORT.
                This was capped at 760px, which turned every screen into
                a phone column with a metre of white either side of it.
                Widening it was not enough on its own: the rail takes
                232px and Ask Moon up to 400px, so a 1600px viewport
                leaves a 904px column, and a `2xl:grid-cols-4` keyed to
                the viewport shrinks a phone card instead of adapting
                it. Card grids are `repeat(auto-fill,minmax(...,1fr))`
                with a max-width ceiling. `dash-measure` caps prose. */}
            {/* THE GROUND IS THE LIGHT AND THE OBJECTS ARE GLASS (Aurora,
                11 Nov): frosted white cards on a near-white ground with a
                glow at the top, the rail and the assistant floating on it
                as cards of their own. */}
            <main ref={scroller} className={`flex-1 overflow-y-auto px-4 pb-28 pt-2 md:px-6 md:pb-10 lg:px-8 ${assistant ? "hidden md:block" : "block"}`}>
              <div className="mx-auto w-full max-w-[1240px]">
                {view === "home" && <DashboardView />}
                {view === "campaigns" && <CampaignsView />}
                {view === "campaign" && <CampaignView />}
                {view === "calendar" && <CalendarView />}
                {view === "earnings" && <EarningsView />}
                {view === "profile" && <ProfileView key="profile" />}
                {view === "activity" && <ActivityView />}
                {view === "autonomy" && <ProfileView key="autonomy" initialTab="autonomy" />}
              </div>
            </main>
            {assistant && (
              <aside className="animate-slide-in-end flex w-full shrink-0 flex-col overflow-hidden max-md:bg-white md:glass md:mb-3.5 md:me-3.5 md:w-[clamp(320px,30vw,400px)]" aria-label="Assistant">
                <DashboardAssistant onClose={() => setAssistant(false)} />
              </aside>
            )}
          </div>
        </div>

        <MobileTabBar
          value={(NAV.some((n) => n.key === sectionOf(view)) ? sectionOf(view) : "home") as TabKey}
          onChange={(k) => go(k as PanelView)}
        />
        <ToastHost onOpen={(id) => { openCampaign(id, "content"); setDashboardView("campaign"); }} />
      </div>
    </SurfaceProvider>
  );
}
