"use client";

/* THE LINE ALONG THE TOP — the design's green "Ad submitted" bar.
 *
 * For news that lands while the creator is looking at something else:
 * an ad sent, a brand's answer, a request approved. Each says what
 * happened in one line and, when there is somewhere to go from it,
 * goes there. It leaves on its own after a few seconds, and never
 * carries the only copy of anything — the campaign page says the same
 * thing for as long as it is true. */

import { useEffect } from "react";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { dropToast, useToasts, type Toast } from "../../lib/store";

const TONE: Record<Toast["tone"], { box: string; icon: typeof CheckCircle }> = {
  green: { box: "border-green/25 bg-[#EEF8EF] text-green", icon: CheckCircle },
  main: { box: "border-main/20 bg-lilac text-main", icon: Info },
  danger: { box: "border-danger/20 bg-[#FDEFF0] text-danger", icon: WarningCircle },
};

const STAY_MS = 6_000;

export function ToastHost({ onOpen }: {
  /** Where a toast's action goes. The surface decides: the dashboard
      opens the campaign, the conversation opens it in the panel. */
  onOpen: (offerId: string) => void;
}) {
  const toasts = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-4">
      {toasts.slice(-3).map((t) => <ToastRow key={t.id} t={t} onOpen={onOpen} />)}
    </div>
  );
}

function ToastRow({ t, onOpen }: { t: Toast; onOpen: (offerId: string) => void }) {
  useEffect(() => {
    const id = setTimeout(() => dropToast(t.id), STAY_MS);
    return () => clearTimeout(id);
  }, [t.id]);
  const { box, icon: I } = TONE[t.tone];
  return (
    <div role="status" className={`animate-fade-in pointer-events-auto flex w-full max-w-[520px] items-start gap-2.5 rounded-card border px-4 py-3 shadow-float ${box}`}>
      <I size={20} weight="fill" aria-hidden className="mt-px shrink-0" />
      <p className="min-w-0 flex-1 text-body font-medium leading-5">{t.text}</p>
      {t.offerId && t.action && (
        <button type="button" onClick={() => { onOpen(t.offerId!); dropToast(t.id); }}
          className="shrink-0 rounded-pill px-2 py-0.5 text-body font-semibold underline-offset-2 hover:underline">
          {t.action}
        </button>
      )}
      <button type="button" onClick={() => dropToast(t.id)} aria-label="Dismiss" className="-me-1 grid h-6 w-6 shrink-0 place-items-center rounded-pill opacity-70 transition hover:opacity-100">
        <X size={14} weight="bold" aria-hidden />
      </button>
    </div>
  );
}
