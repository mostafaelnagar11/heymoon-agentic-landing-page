"use client";

/* The page title, the bell, and the way to the assistant. The Figma's
   screens carry a centred title with a back circle on the left; on a
   desktop the rail already says where you are, so the title sits left
   and the back circle appears only when there is somewhere to go back
   to. */

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
    /* A keyline under the chrome above 768px, so the white frame reads
       as a frame against the canvas the page now sits on. */
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 bg-white/85 px-4 backdrop-blur-sm sm:px-6 md:border-b md:border-line lg:px-8">
      {onBack && <BackButton onClick={onBack} />}
      {/* Centred with a back circle on a phone, the way the file draws
          every screen; left-aligned and one step down on a desktop,
          where the rail already says where you are. */}
      <h1 className={`min-w-0 flex-1 truncate text-section font-semibold text-ink md:text-row ${onBack ? "text-center pe-10 md:pe-0 md:text-start" : ""}`}>{title}</h1>
      <button onClick={onToggleAssistant} aria-pressed={assistantOpen}
        className={`inline-flex h-10 items-center gap-2 rounded-pill px-3.5 text-body font-semibold transition md:h-9 ${assistantOpen ? "bg-lilac text-main" : "text-ink-60 hover:bg-lilac/60 hover:text-main"}`}>
        <Sparkle size={16} weight="fill" aria-hidden /><span className="hidden sm:inline">Ask Moon</span>
      </button>
      <button type="button" onClick={onBell} aria-label={waiting ? `${waiting} waiting on you` : "Nothing waiting"}
        className="relative grid h-10 w-10 place-items-center rounded-pill bg-lilac text-main md:h-9 md:w-9">
        <Bell size={18} weight="fill" aria-hidden />
        {waiting > 0 && <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-pill bg-danger px-1 text-tiny font-semibold text-white">{waiting}</span>}
      </button>
    </header>
  );
}
