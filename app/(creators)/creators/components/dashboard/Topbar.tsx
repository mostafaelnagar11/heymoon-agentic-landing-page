"use client";

/* The page title, the bell, and the way to the assistant — the brand
   dashboard's top bar (brands Topbar.tsx): 72px, no bar and no rule, a
   bare back arrow when there is somewhere to go back to, and the title
   at 15px on the left at every width. */

import { Bell, Sparkle } from "@phosphor-icons/react";
import { BackButton } from "../figma";
import { useWaiting } from "../../lib/usePlans";

export function DashboardTopbar({ title, onBack, assistantOpen, onToggleAssistant, onBell }: {
  title: string; onBack?: () => void; assistantOpen: boolean; onToggleAssistant: () => void;
  /** Where the bell goes. It was a `<span>` with a tooltip — a count
      nobody could press, which on a desktop reads as decoration. */
  onBell?: () => void;
}) {
  const waiting = useWaiting();
  return (
    /* No bar, no rule: the controls sit on the page's light. */
    <header className="relative z-20 flex h-[72px] shrink-0 items-center gap-2.5 px-4 sm:px-6 lg:px-8">
      {onBack && <BackButton onClick={onBack} />}
      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink-60">{title}</h1>
      <button onClick={onToggleAssistant} aria-pressed={assistantOpen}
        className={`inline-flex h-[42px] items-center gap-2 rounded-pill pe-4 ps-1.5 text-body font-semibold transition ${assistantOpen ? "bg-white text-ink shadow-lift" : "glass !rounded-full text-ink-60 hover:text-ink"}`}>
        <span aria-hidden className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[linear-gradient(135deg,#6848D1,#C2418B)] text-white">
          <Sparkle size={13} weight="fill" />
        </span>
        <span className="hidden sm:inline">Ask Moon</span>
      </button>
      <button type="button" onClick={onBell} aria-label={waiting ? `${waiting} waiting on you` : "Nothing waiting"}
        className="glass relative grid h-[42px] w-[42px] place-items-center !rounded-full text-ink-60 transition hover:text-ink">
        <Bell size={18} aria-hidden />
        {waiting > 0 && <span className="absolute -end-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-blush-deep px-1 text-[10px] font-semibold text-white ring-2 ring-white">{waiting}</span>}
      </button>
    </header>
  );
}
