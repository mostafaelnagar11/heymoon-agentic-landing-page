"use client";

/* The application, as one surface: the conversation, and one panel.
 *
 * Every screen this product would otherwise have is either a block in
 * the thread or a view in that panel. There is no rail: onboarding
 * produces one profile, and a list of one is furniture. */

import type { ReactNode } from "react";
import Link from "next/link";
import { CaretLeft, X } from "@phosphor-icons/react";
import { Wordmark } from "../Wordmark";
import { closePanel, selectOffer, setPanelView, useActiveProfile, usePanel, useSelectedOfferId, useStore, type PanelView } from "../../lib/store";

export function ChatShell({ children, panel }: { children: ReactNode; panel: ReactNode }) {
  const { open } = usePanel();
  return (
    <div className="flex h-[100dvh] overflow-clip bg-white">
      <main className={`relative flex min-w-0 flex-1 flex-col ${open ? "hidden md:flex" : "flex"}`} aria-label="Conversation">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-white from-40% to-transparent" />
        <Link href="/creators" aria-label="HeyMoon, start again" className="pointer-events-auto absolute start-5 top-4 z-20 rounded transition hover:opacity-70">
          <Wordmark size="sm" />
        </Link>
        {children}
      </main>
      {open && (
        <aside className="animate-slide-in-end flex w-full shrink-0 flex-col border-s border-line bg-canvas md:w-[clamp(375px,40vw,560px)]" aria-label="Panel">
          {panel}
        </aside>
      )}
    </div>
  );
}

type Gate = "read" | "profile" | "offers";
const VIEWS: { key: PanelView; label: string; needs: Gate }[] = [
  { key: "offers", label: "Campaigns", needs: "offers" },
  { key: "profile", label: "Your profile", needs: "profile" },
  { key: "read", label: "What I found", needs: "read" },
];

/** The panel's chrome. `bare` drops the padding for a view that paints
    its own edges, like the campaign detail with its hero. */
export function PanelFrame({ title, sub, children, bare }: { title: string; sub?: string; children: ReactNode; bare?: boolean }) {
  const { view } = usePanel();
  const selected = useSelectedOfferId();
  /* ONE BACK, AND IT GOES ONE LEVEL UP. Below 768px this header's back
     is the only way out of a full-screen panel, and a campaign opened
     from the list is one level deeper than the list — so it returns to
     the list first and closes the panel second, the way a phone's back
     does. The campaign's own back circle is hidden below 768px so there
     are not two arrows, fifty pixels apart, doing different things. */
  const back = () => (view === "offers" && selected ? selectOffer(null) : closePanel());
  const hasProfile = !!useActiveProfile();
  const hasRead = useStore((s) => Object.keys(s.reads).length > 0);
  const hasOffers = useStore((s) => Object.keys(s.offers).length > 0);
  const available = VIEWS.filter((v) => (v.needs === "profile" ? hasProfile : v.needs === "offers" ? hasOffers : hasRead));

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-4">
        <button onClick={back} aria-label={view === "offers" && selected ? "Back to the campaigns" : "Back to the conversation"} className="-ms-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-pill text-ink-50 transition hover:bg-lilac hover:text-main md:hidden">
          <CaretLeft size={15} weight="bold" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-ink">{title}</p>
          {sub && <p className="truncate text-brand text-ink-50">{sub}</p>}
        </div>
        <button onClick={closePanel} aria-label="Close the panel" className="hidden h-8 w-8 shrink-0 place-items-center rounded-pill text-ink-50 transition hover:bg-lilac hover:text-main md:grid">
          <X size={15} aria-hidden />
        </button>
      </header>
      {available.length > 1 && (
        <div className="no-bar flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2">
          {available.map((v) => (
            <button key={v.key} onClick={() => { setPanelView(v.key); selectOffer(null); }} aria-current={v.key === view}
              className={`shrink-0 rounded-pill px-3 py-1.5 text-meta font-semibold transition ${v.key === view ? "bg-main text-white" : "text-ink-50 hover:bg-lilac hover:text-main"}`}>
              {v.label}
            </button>
          ))}
        </div>
      )}
      <div className={`min-h-0 flex-1 overflow-y-auto ${bare ? "" : "p-4"}`}>{children}</div>
    </>
  );
}
