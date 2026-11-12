"use client";

/* THE NOTE AT THE FOOT OF THE PAGE — the brand dashboard's (HeyMoon.tsx).
 *
 * For news that lands while the creator is looking at something else:
 * an ad sent, a brand's answer, a request approved. Each says what
 * happened in one line and, when there is somewhere to go from it,
 * goes there. It leaves on its own after a few seconds, and never
 * carries the only copy of anything — the campaign page says the same
 * thing for as long as it is true.
 *
 * The brand's shape exactly: a dark pill, bottom centre, rising in. The
 * tone is only the icon's colour, never the pill's, so a good answer and
 * a bad one are the same object read the same way. On a phone it sits
 * above the floating tab bar. */

import { useEffect } from "react";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { dropToast, useToasts, type Toast } from "../../lib/store";

/* Colours that hold up on the ink pill: the app's green, Main's glow
   (Main itself is too dark to read on ink), and the danger red. */
const TONE: Record<Toast["tone"], { ink: string; icon: typeof CheckCircle }> = {
  green: { ink: "text-green", icon: CheckCircle },
  main: { ink: "text-main-glow", icon: Info },
  danger: { ink: "text-danger", icon: WarningCircle },
};

const STAY_MS = 3_600;

export function ToastHost({ onOpen, offset = "bottom-24 md:bottom-6" }: {
  /** Where a toast's action goes. The surface decides: the dashboard
      opens the campaign, the conversation opens it in the panel. */
  onOpen: (offerId: string) => void;
  /** How far up from the foot of the screen. The default clears the
      dashboard's floating tab bar on a phone. */
  offset?: string;
}) {
  const toasts = useToasts();
  return (
    <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 z-[90] flex flex-col items-center gap-2 px-4 ${offset}`}>
      {toasts.slice(-3).map((t) => <ToastRow key={t.id} t={t} onOpen={onOpen} />)}
    </div>
  );
}

function ToastRow({ t, onOpen }: { t: Toast; onOpen: (offerId: string) => void }) {
  useEffect(() => {
    const id = setTimeout(() => dropToast(t.id), STAY_MS);
    return () => clearTimeout(id);
  }, [t.id]);
  const { ink, icon: I } = TONE[t.tone];
  return (
    <div role="status" className="animate-rise pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-pill bg-ink px-4 py-2.5 text-meta font-semibold text-white shadow-pop">
      <I size={14} weight="fill" aria-hidden className={`shrink-0 ${ink}`} />
      <p className="min-w-0">{t.text}</p>
      {t.offerId && t.action && (
        <button type="button" onClick={() => { onOpen(t.offerId!); dropToast(t.id); }}
          className="shrink-0 rounded-pill px-1.5 text-white/75 underline-offset-2 transition hover:text-white hover:underline">
          {t.action}
        </button>
      )}
      <button type="button" onClick={() => dropToast(t.id)} aria-label="Dismiss" className="-me-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white">
        <X size={11} weight="bold" aria-hidden />
      </button>
    </div>
  );
}
