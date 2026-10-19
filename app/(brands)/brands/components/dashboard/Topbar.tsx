"use client";

/* The dashboard's top bar, carried over from the current app.
 *
 * 67px, translucent white over a blur, one hairline underneath, and
 * sticky. Left to right: the hamburger that collapses the rail on a
 * desktop and opens the drawer on a phone, the page title, and a right
 * cluster with the assistant toggle, the alert count and the avatar.
 *
 * The original's centred command palette is not here. It searched
 * across campaigns, creators and settings — three things this
 * prototype does not have — and a search box that finds nothing is a
 * worse promise than no search box. The assistant beside it answers
 * the questions that palette was reached for.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { accessFor, accountName, resetAll, startConversation, useAccount, useActiveCampaign, useStore } from "../../lib/store";
import { ArrowLeft, Bell, List, Plus } from "@phosphor-icons/react";
import { AskBar } from "./HeyMoon";

export function DashboardTopbar({
  title,
  waiting,
  onToggleNav,
  onBack,
}: {
  title: string;
  waiting: number;
  onToggleNav: () => void;
  /** Set on a page that hides the rail. The hamburger has nothing to
      collapse then, so it becomes the way back to where you were. */
  onBack?: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  /* Whoever signed in, and what they are on this brand. It said "Mostafa Elnagar, Admin" to everyone. */
  const account = useAccount();
  const campaign = useActiveCampaign();
  const brands = useStore((s) => s.brands);
  const host = campaign?.url ?? "";
  const access = account && host ? accessFor(host, account.email, brands) : null;
  const who = account ? accountName(account) : "Not signed in";
  const what =
    access === "owner" ? "Owner"
    : access === "member" || access === "invited" ? "Team member"
    : account ? "Not on this brand's team"
    : "HeyMoon asks at the payment";
  const mark = account ? `${account.firstName[0] ?? ""}${account.lastName[0] ?? ""}`.toUpperCase() || "?" : "?";

  /* A menu that only closes by pressing the thing that opened it is a
     menu people leave open. */
  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  return (
    <header className="sticky top-0 z-20 flex h-[67px] shrink-0 items-center gap-3 border-b border-hairline bg-white/80 px-4 backdrop-blur-sm">
      <button
        onClick={onBack ?? onToggleNav}
        aria-label={onBack ? "Back" : "Menu"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-ink-faint transition-colors hover:bg-wash hover:text-ink-soft"
      >
        {onBack
          ? <ArrowLeft size={17} weight="bold" aria-hidden className="rtl:rotate-180" />
          : <List size={18} aria-hidden />}
      </button>

      <h1 className="min-w-0 truncate text-head font-semibold text-ink">{title}</h1>

      <div className="ms-auto flex shrink-0 items-center gap-2">
        {/* HeyMoon, asked in words. It used to be a toggle for a chat rail; the agents work in the page now and
            this is where a request in words goes (HeyMoon.tsx). */}
        <AskBar />

        <Link
          href="/brands/c"
          /* A fresh thread, the same as the rail's. Without it this
             drops the brand back into the conversation that built the
             campaign they are already looking at. */
          onClick={() => startConversation()}
          className="g-button inline-flex h-10 items-center gap-2 rounded-pill border border-white/50 px-4 text-meta font-semibold text-[#FBF8FE] transition"
        >
          <Plus size={13} weight="bold" aria-hidden />
          <span className="hidden sm:inline">Build a campaign</span>
        </Link>

        <span
          className="relative grid h-10 w-10 place-items-center rounded-pill bg-lilac text-main"
          title={waiting ? `${waiting} waiting on you` : "Nothing waiting"}
        >
          <Bell size={17} weight="fill" aria-hidden />
          {waiting > 0 && (
            <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-pill bg-danger px-1 text-tiny font-semibold text-white ring-2 ring-white">
              {waiting}
            </span>
          )}
          <span className="sr-only">{waiting} waiting on you</span>
        </span>

        <div className="relative" ref={wrap}>
          <button
            onClick={() => setMenu((o) => !o)}
            aria-expanded={menu}
            aria-label="Your account"
            className="grid h-9 w-9 place-items-center rounded-full bg-brand text-meta font-medium text-white"
          >
            {mark}
          </button>
          {menu && (
            <div className="absolute end-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-control border border-hairline bg-white shadow-float">
              <div className="border-b border-hairline px-3 py-2.5">
                <p className="truncate text-body font-semibold text-ink">{who}</p>
                <p className="truncate text-[11px] text-ink-faint">{what}</p>
              </div>
              {/* The same sign-out as the rail's: it clears this browser's work. */}
              <a href="/brands" onClick={() => resetAll()} className="block px-3 py-2.5 text-body font-medium text-danger transition hover:bg-danger/[0.06]">
                Sign out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
