"use client";

/* The dashboard's left rail, carried over from the current app.
 *
 * Same proportions and same behaviour: 210px open, 60px collapsed, a
 * 200ms width transition, white against the canvas, and a hairline on
 * the right. Below 768px the aside is gone and a 240px drawer takes
 * over, always expanded, over a blurred scrim.
 *
 * Two things are deliberately different from the original.
 *
 * The active item is derived from the CURRENT VIEW rather than held in
 * a `useState("Dashboard")` that each page seeds for itself. In the
 * current app that state is a label string, so reaching a page any way
 * other than clicking its own nav item leaves the highlight pointing
 * at the wrong row until the page remounts.
 *
 * The brand switcher is a brand TILE. The original switches between
 * three brands from a fixture; this prototype has the one campaign the
 * agent just built, and a switcher with one row is furniture.
 */

import { Wordmark } from "../Wordmark";
import { Emblem } from "../../../../_shared/Emblem";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CaretDown,
  Check,
  Plus,
  PencilSimple,
  Megaphone,
  Gear,
  SignOut,
  SquaresFour,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { useT } from "../../lib/i18n";
import type { DashboardView } from "../../lib/agent/dashboard";
import { adOfCampaign,
  campaignLabel, isLaunching, openCampaign, openPhase, renameCampaign, resetAll, setActiveCampaign, showCampaignList,
  startConversation, useAds, useCampaigns, useReadyPhase, useStore, type Campaign,
} from "../../lib/store";
import { useGo } from "../../lib/surface";
import { fmtUSD, phaseTitle } from "../../lib/mock/campaigns";
import { getRead } from "../../lib/agent/registry";

/* Two rows, and then the brands.

   Creators, Needs you, Ads and Activity used to sit here as four more
   destinations. They are not destinations, they are four faces of one
   campaign: switch the brand above and every one of them changes
   underneath you. They are tabs inside the campaign now, where the
   thing they describe is.

   What takes their place is the campaigns themselves, indented under
   Campaigns, because THAT is the list a brand actually navigates by.
   Somebody running three brands wants the three brands one press away,
   not four ways to slice whichever one happens to be active. */
export const NAV: { key: DashboardView; label: string; icon: Icon }[] = [
  { key: "home", label: "Dashboard", icon: SquaresFour },
  { key: "campaign", label: "Campaigns", icon: Megaphone },
];

/* Settings sits at the foot of the rail rather than in the list above,
   because the list is the work and this is the account behind it.
   Autonomy used to be the last row up there, which ranked a table of
   preferences alongside Campaigns and Ads; it is inside settings now. */
export const FOOT: { key: DashboardView; label: string; icon: Icon } = {
  key: "settings", label: "Settings", icon: Gear,
};

interface Props {
  collapsed: boolean;
  view: DashboardView;
  onView: (v: DashboardView) => void;
  waiting: number;
  brandName: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/** A brand's own logo where the read found one, its initial where it
    did not. Never a stock avatar: an invented face for a shop is worse
    than a letter. */
function BrandMark({ campaign, size, radius = 8 }: { campaign: Campaign | null; size: number; radius?: number }) {
  const logo = campaign?.readId ? getRead(campaign.readId).identity?.logo : undefined;
  const label = campaign?.brandName ?? "";
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center overflow-hidden bg-brand font-semibold text-white"
      style={{ height: size, width: size, fontSize: Math.round(size * 0.42), borderRadius: radius }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-full bg-white object-cover" />
      ) : (
        label[0]?.toUpperCase() ?? "?"
      )}
    </span>
  );
}

function Content({ collapsed, view, onView, brandName, onMobileClose }: Props) {
  const { t } = useT();
  /* The rail's words in the brand's language (PRD v0.2, H6): the tracker page sits inside it. */
  const L: Record<string, string> = { home: t("dash.title"), campaign: t("dash.campaigns"), settings: t("dash.settings") };
  const [switcher, setSwitcher] = useState(false);
  const campaigns = useCampaigns();
  const ads = useAds();
  const activeId = useStore((s) => s.activeCampaignId);
  const active = campaigns.find((c) => c.id === activeId) ?? null;
  const switcherWrap = useRef<HTMLDivElement>(null);
  const [campMenu, setCampMenu] = useState(false);
  const campWrap = useRef<HTMLElement>(null);
  const ready = useReadyPhase();
  const go = useGo();

  /* A menu that only closes by pressing the thing that opened it is a
     menu people leave open, the same rule the top bar's avatar uses. */
  useEffect(() => {
    if (!campMenu) return;
    const away = (e: MouseEvent) => {
      if (campWrap.current && !campWrap.current.contains(e.target as Node)) setCampMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setCampMenu(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [campMenu]);

  /* Expanding the rail puts the real rows back, so the flyout that
     stood in for them has nothing left to do. */
  useEffect(() => { if (!collapsed) setCampMenu(false); }, [collapsed]);

  useEffect(() => {
    if (!switcher) return;
    const away = (e: MouseEvent) => {
      if (switcherWrap.current && !switcherWrap.current.contains(e.target as Node)) setSwitcher(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setSwitcher(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [switcher]);
  /* One row shape for the rail: an icon on its own small tile, lit with the gradient when the row is where you
     are (Aurora, 11 Nov). Collapsed, the tile is the row. */
  const row = (on: boolean) =>
    `group flex h-[42px] items-center rounded-row text-body font-medium transition ${
      collapsed ? "w-[42px] justify-center self-center" : "gap-3 px-2"
    } ${on ? "bg-white text-ink shadow-lift" : "text-ink-60 hover:bg-white/70 hover:text-ink"}`;
  const tile = (on: boolean) =>
    `grid h-7 w-7 shrink-0 place-items-center rounded-[9px] transition ${
      on ? "grad-tile" : "bg-haze text-ink-60 group-hover:text-ink"
    }`;

  return (
    <div
      className={`flex h-full flex-col py-4 ${
        collapsed ? "items-center overflow-visible px-2" : "overflow-y-auto px-3"
      }`}
    >
      <div className={`mb-4 flex items-center ${collapsed ? "justify-center" : "justify-between px-2 pt-1"}`}>
        {collapsed ? (
          /* The emblem alone where the rail is too narrow for the name. */
          <span aria-hidden className="grid h-8 w-8 place-items-center text-ink">
            <Emblem size={20} />
          </span>
        ) : (
          <Wordmark size="sm" />
        )}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            aria-label="Close the menu"
            className="grid h-8 w-8 place-items-center rounded-control text-ink-faint transition hover:bg-black/[0.05] md:hidden"
          >
            <X size={15} aria-hidden />
          </button>
        )}
      </div>

      {/* The brand switcher: the mark, the name and the store under it, a caret, and the list with a tick on the
          one you are looking at and a way to add another. Collapsed, the mark alone is the trigger and the menu
          opens beside the rail. */}
      <div className={`relative mb-4 ${collapsed ? "" : "w-full"}`} ref={switcherWrap}>
          <button
            onClick={() => setSwitcher((o) => !o)}
            aria-expanded={switcher}
            aria-haspopup="menu"
            aria-label={collapsed ? `Brand: ${brandName}. Switch brand` : undefined}
            title={collapsed ? brandName : undefined}
            className={`grad-ws flex items-center rounded-[16px] transition hover:brightness-[0.98] ${
              collapsed ? "justify-center p-1.5" : "w-full gap-2.5 p-2.5 text-start"
            }`}
          >
            <span className="grid shrink-0 place-items-center rounded-[11px] bg-white p-[3px] shadow-edge">
              <BrandMark campaign={active} size={collapsed ? 26 : 28} radius={9} />
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-ink">{brandName}</span>
                  {active?.url && <span className="block truncate text-meta text-ink-faint">{active.url}</span>}
                </span>
                <CaretDown
                  size={11}
                  weight="bold"
                  aria-hidden
                  className={`shrink-0 text-ink-faint transition ${switcher ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>

          {switcher && (
            <div
              role="menu"
              className={`absolute z-50 overflow-hidden rounded-[16px] border border-hairline bg-white p-1 shadow-float ${
                collapsed ? "start-full top-0 ms-3 w-[240px]" : "inset-x-0 top-full mt-1.5"
              }`}
            >
              <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                Switch brand
              </p>
              {campaigns.map((c) => (
                <div key={c.id} className={`group flex items-center rounded-[12px] ${c.id === activeId ? "bg-haze" : ""}`}>
                  <button
                    role="menuitem"
                    onClick={() => { setActiveCampaign(c.id); setSwitcher(false); onMobileClose?.(); }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-start transition hover:bg-haze"
                  >
                    <BrandMark campaign={c} size={26} radius={8} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-meta font-semibold text-ink">{c.brandName}</span>
                      <span className="block truncate text-[11px] text-ink-faint">
                        {c.paid ? (isLaunching(c) ? "Launching" : "Running") : "Not started"}
                      </span>
                    </span>
                    {c.id === activeId && <Check size={12} weight="bold" aria-hidden className="shrink-0 text-brand" />}
                  </button>
                  {/* Renaming stays. The current app cannot do it, and a
                      workspace of campaigns all called by their domain
                      is a workspace you cannot navigate. */}
                  <button
                    onClick={() => { const n = window.prompt("Name this campaign", campaignLabel(c)); if (n !== null) renameCampaign(c.id, n); }}
                    aria-label={`Rename ${campaignLabel(c)}`}
                    className="me-1.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-faint opacity-0 transition hover:bg-black/[0.06] hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <PencilSimple size={11} aria-hidden />
                  </button>
                </div>
              ))}
              <div className="mt-1 border-t border-hairline pt-1">
                {/* Adding a brand IS building a campaign for it, so this
                    is the same fresh conversation the top bar opens. */}
                <Link
                  href="/brands/c"
                  role="menuitem"
                  onClick={() => { startConversation(); setSwitcher(false); onMobileClose?.(); }}
                  className="flex items-center gap-2 rounded-[12px] px-2.5 py-2 text-meta font-semibold text-brand transition hover:bg-haze"
                >
                  <Plus size={12} weight="bold" aria-hidden />
                  Add brand
                </Link>
              </div>
            </div>
          )}
      </div>

      <nav className={`relative mb-6 flex w-full flex-col gap-1 ${collapsed ? "items-center" : ""}`} aria-label="Dashboard" ref={campWrap}>
        {NAV.map((item) => {
          const active = item.key === view;
          const I = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => {
                /* Collapsed, Campaigns opens the list of names beside
                   the rail instead of navigating, because the rows that
                   would have carried those names cannot exist at 72px.
                   Expanded, it does what it always did. */
                if (collapsed && item.key === "campaign") { setCampMenu((o) => !o); return; }
                onView(item.key);
                if (item.key === "campaign") showCampaignList();
                onMobileClose?.();
              }}
              title={collapsed ? L[item.key] ?? item.label : undefined}
              aria-expanded={collapsed && item.key === "campaign" ? campMenu : undefined}
              aria-haspopup={collapsed && item.key === "campaign" ? "menu" : undefined}
              aria-current={active ? "page" : undefined}
              className={row(active)}
            >
              <span className={tile(active)}>
                <I size={15} weight={active ? "fill" : "regular"} aria-hidden />
              </span>
              {!collapsed && <span className="min-w-0 flex-1 truncate text-start">{L[item.key] ?? item.label}</span>}
            </button>
          );
        })}

        {/* The collapsed rail's campaign list, by name, where names fit. */}
        {collapsed && campMenu && (
          <div
            role="menu"
            className="absolute start-full top-8 z-50 ms-3 w-[240px] overflow-hidden rounded-[16px] border border-hairline bg-white p-1 shadow-float"
          >
            <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
              Campaigns
            </p>
            {campaigns.map((c) => {
              const here = view !== "home" && view !== "settings" && c.id === activeId;
              const owed = ads.filter((a) => a.state === "waiting" && adOfCampaign(c, a)).length;
              return (
                <button
                  key={c.id}
                  role="menuitem"
                  onClick={() => { openCampaign(c.id); setCampMenu(false); onMobileClose?.(); }}
                  className={`flex w-full items-center gap-2 rounded-[12px] px-2.5 py-2 text-start text-meta font-medium transition hover:bg-haze ${
                    here ? "bg-haze text-ink" : "text-ink-soft"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{campaignLabel(c)}</span>
                  {owed > 0 && (
                    <span className="shrink-0 rounded-pill bg-blush-deep px-1.5 text-[11px] font-semibold text-white">
                      {owed}
                    </span>
                  )}
                  {here && <Check size={12} weight="bold" aria-hidden className="shrink-0 text-brand" />}
                </button>
              );
            })}
          </div>
        )}

        {/* The campaigns, indented under Campaigns on a guide line: a shortcut straight into one, each with its
            own count of drafts waiting, because the point of seeing three at once is seeing which needs you. */}
        {!collapsed && campaigns.length > 0 && (
          <div className="mb-1 ms-[22px] flex flex-col gap-0.5 border-s-[1.5px] border-[#ECE8F8] ps-2.5">
            {campaigns.map((c) => {
              const here = view !== "home" && view !== "settings" && c.id === activeId;
              const owed = ads.filter((a) => a.state === "waiting" && adOfCampaign(c, a)).length;
              return (
                <button
                  key={c.id}
                  onClick={() => { openCampaign(c.id); onMobileClose?.(); }}
                  aria-current={here ? "page" : undefined}
                  className={`flex h-9 items-center gap-2.5 rounded-[12px] px-2.5 text-start text-[13.5px] font-medium transition ${
                    here ? "bg-white text-ink shadow-lift" : "text-ink-60 hover:bg-white/70 hover:text-ink"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{campaignLabel(c)}</span>
                  {owed > 0 && (
                    <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-pill bg-blush-deep px-1.5 text-[11px] font-semibold text-white">
                      {owed}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Pinned to the bottom, and only things that lead somewhere. */}
      <div className={`mt-auto flex w-full flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
        {/* The one move only the brand can make, wherever they are: a phase that is paid for nowhere until they
            start it. Opening it lands on the phase, where the price and the start are. */}
        {/* Only once a campaign is running: before payment the way on is the conversation, and while launching
            Phase 1 is paid for already. */}
        {!collapsed && ready && active?.paid && !isLaunching(active) && (
          <div className="grad-promo relative mb-2 overflow-hidden rounded-[18px] p-3.5">
            <span aria-hidden className="pointer-events-none absolute -end-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
            <p className="text-body font-semibold"><bdi>{phaseTitle(ready.phaseNo).split(" · ")[0]} is ready</bdi></p>
            <p className="mt-0.5 text-meta text-white/80"><bdi>
              {fmtUSD(ready.budget)} at {ready.guaranteedRoas}×, {fmtUSD(ready.budget * ready.guaranteedRoas)} guaranteed
            </bdi></p>
            <button
              type="button"
              onClick={() => { openPhase(ready.id); go("campaign"); onMobileClose?.(); }}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-pill bg-white/[0.18] px-3 text-meta font-semibold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/[0.26]"
            >
              <bdi>Open {phaseTitle(ready.phaseNo).split(" · ")[0]}</bdi>
              <ArrowRight size={12} weight="bold" aria-hidden className="rtl:rotate-180" />
            </button>
          </div>
        )}
        <button
          onClick={() => { onView(FOOT.key); onMobileClose?.(); }}
          aria-current={view === FOOT.key ? "page" : undefined}
          title={collapsed ? L[FOOT.key] ?? FOOT.label : undefined}
          className={row(view === FOOT.key)}
        >
          <span className={tile(view === FOOT.key)}>
            <FOOT.icon size={15} weight={view === FOOT.key ? "fill" : "regular"} aria-hidden />
          </span>
          {!collapsed && <span className="text-start">{L[FOOT.key] ?? FOOT.label}</span>}
        </button>
        {/* Signing out clears the account and the work with it: both survive a reload now. */}
        <Link
          href="/brands"
          onClick={() => resetAll()}
          title={collapsed ? t("dash.signOut") : undefined}
          className={`group flex h-[42px] items-center rounded-row text-body font-medium text-ink-60 transition hover:bg-danger/[0.06] hover:text-danger ${
            collapsed ? "w-[42px] justify-center self-center" : "gap-3 px-2"
          }`}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-haze transition group-hover:bg-danger/[0.08]">
            <SignOut size={15} weight="regular" aria-hidden className="rtl:rotate-180" />
          </span>
          {!collapsed && <span>{t("dash.signOut")}</span>}
        </Link>
      </div>
    </div>
  );
}

export function DashboardSidebar(props: Props) {
  return (
    <>
      {/* Floating on the ground rather than ruled off it: a frosted card with the page's light behind it. */}
      <aside
        className={`glass relative z-[1] my-3.5 ms-3.5 hidden shrink-0 flex-col transition-[width] duration-200 md:flex ${
          props.collapsed ? "w-[72px]" : "w-[248px]"
        }`}
      >
        <Content {...props} onMobileClose={undefined} />
      </aside>

      {props.mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-[#141229]/25 backdrop-blur-sm"
            onClick={props.onMobileClose}
            aria-hidden
          />
          <aside className="absolute inset-y-2 start-2 w-[260px] overflow-hidden rounded-glass bg-[#FBFAFE] shadow-pop" aria-label="Menu">
            <Content {...props} collapsed={false} />
          </aside>
        </div>
      )}
    </>
  );
}
