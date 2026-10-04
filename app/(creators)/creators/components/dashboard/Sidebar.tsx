"use client";

/* Navigation, from the Figma's tab bar.
 *
 * THE FIGMA'S FOUR TABS, PLUS CALENDAR — Explore, Campaigns, Calendar,
 * Earnings, Profile.
 * Alex: "the left side is going to be taking the settings out." The
 * two pages the agent adds, Activity and what HeyMoon may do alone,
 * are reached from Profile, so the rail says exactly what the file
 * says. Above 768px they sit in a rail; below, in the file's floating
 * pill bar (see MobileTabBar in figma.tsx).
 *
 * IT COLLAPSES, the way the brands rail does: 232px open, 72px shut,
 * a 200ms width transition. Designed shut rather than merely narrowed —
 * every row keeps its icon, its accessible name (the label goes
 * sr-only rather than away) and a tooltip; the Campaigns count rides
 * on the icon; the account tile becomes its avatar. The toggle lives in
 * the rail itself, beside the wordmark open and under the mark shut, so
 * the control that brings the labels back is where the labels were. */

import Link from "next/link";
import { CalendarBlank, House, Megaphone, Money, SidebarSimple, SignOut, User, type Icon } from "@phosphor-icons/react";
import { Wordmark } from "../Wordmark";
import { Avatar } from "../ui";
import { resetAll, useActiveProfile, type PanelView } from "../../lib/store";
import { useWaiting } from "../../lib/usePlans";

export const NAV: { key: PanelView; label: string; icon: Icon }[] = [
  { key: "home", label: "Dashboard", icon: House },
  { key: "campaigns", label: "Campaigns", icon: Megaphone },
  /* Not in the Figma's four. What to post and when is the question a
     creator with live campaigns opens the app with every day, and it
     had no page — only a "next scheduled ad" line on Explore. */
  { key: "calendar", label: "Calendar", icon: CalendarBlank },
  { key: "earnings", label: "Earnings", icon: Money },
  { key: "profile", label: "Profile", icon: User },
];

/** Which rail row a view belongs under. The campaign detail is a
    Campaigns page; autonomy is a Profile page. */
export const sectionOf = (v: PanelView): PanelView =>
  v === "campaign" || v === "work" || v === "drafts" || v === "inbox" ? "campaigns"
  : v === "autonomy" || v === "settings" || v === "activity" ? "profile"
  : v;

export function DashboardSidebar({ view, onView, collapsed = false, onToggle }: {
  view: PanelView;
  onView: (v: PanelView) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const profile = useActiveProfile();
  const counts: Partial<Record<string, number>> = {
    /* The badge is "things waiting on you": a campaign that wants you
       and is unanswered, or an ad to upload, re-cut or report. A
       campaign you are not matched to is not waiting on you. */
    campaigns: useWaiting(),
  };
  const here = sectionOf(view);
  const name = profile?.creatorName ?? "Your account";

  /* Every row is the same width at every state, so a label appearing on
     expand never shoves the icon sideways: the icon column is fixed and
     only the row's right-hand side grows. */
  const row = collapsed ? "justify-center px-0 w-11 mx-auto" : "gap-3 px-3.5";

  return (
    <aside className={`hidden shrink-0 flex-col overflow-hidden border-e border-line bg-white py-5 transition-[width] duration-200 motion-reduce:transition-none md:flex ${collapsed ? "w-[72px] px-2" : "w-[232px] px-3"}`}>
      <div className={`flex ${collapsed ? "flex-col items-center gap-3" : "items-center justify-between ps-2"}`}>
        {collapsed ? (
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-inner bg-main text-body font-semibold text-white">H</span>
        ) : (
          <Wordmark size="sm" />
        )}
        {onToggle && (
          <button type="button" onClick={onToggle} aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand the menu" : "Collapse the menu"} title={collapsed ? "Expand" : "Collapse"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-inner text-ink-50 transition hover:bg-lilac/60 hover:text-main">
            <SidebarSimple size={18} aria-hidden className="rtl:-scale-x-100" />
          </button>
        )}
      </div>

      <div title={collapsed ? `${name} · ${profile?.handle ?? ""}` : undefined}
        className={`mt-5 flex items-center rounded-inner bg-lilac/60 ${collapsed ? "mx-auto justify-center p-1.5" : "gap-2.5 px-3 py-2.5"}`}>
        <Avatar src={profile?.avatar} name={name === "Your account" ? "You" : name} size={32} />
        <span className={collapsed ? "sr-only" : "min-w-0 flex-1"}>
          <span className="block truncate text-body font-semibold text-ink">{name}</span>
          <span className="block truncate text-meta text-ink-50">{profile?.handle}</span>
        </span>
      </div>

      <nav className="mt-6 flex flex-col gap-1" aria-label="Sections">
        {NAV.map((item) => {
          const on = item.key === here;
          const I = item.icon;
          const n = counts[item.key] ?? 0;
          return (
            <button key={item.key} onClick={() => onView(item.key)} aria-current={on ? "page" : undefined}
              title={collapsed ? (n > 0 ? `${item.label} · ${n}` : item.label) : undefined}
              className={`relative flex h-11 items-center rounded-pill text-body font-medium transition ${row} ${on ? "bg-lilac text-main" : "text-ink-60 hover:bg-lilac/50 hover:text-ink"}`}>
              <I size={20} weight={on ? "fill" : "regular"} aria-hidden className="shrink-0" />
              <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate whitespace-nowrap text-start"}>{item.label}</span>
              {n > 0 && (
                <span className={`grid h-5 min-w-5 place-items-center rounded-pill px-1.5 text-tiny font-semibold ${on ? "bg-main text-white" : "bg-main-10 text-main"} ${
                  /* Shut, the count sits on the icon's corner. */
                  collapsed ? "absolute -end-0.5 -top-0.5 ring-2 ring-white" : ""}`}>
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line pt-3">
        <Link href="/creators" onClick={() => resetAll()} title={collapsed ? "Log out" : undefined}
          className={`flex h-11 items-center rounded-pill text-body font-medium text-ink-50 transition hover:bg-danger/[0.06] hover:text-danger ${row}`}>
          <SignOut size={20} aria-hidden className="shrink-0" />
          <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>Log out</span>
        </Link>
      </div>
    </aside>
  );
}
