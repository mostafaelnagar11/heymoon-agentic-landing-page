"use client";

/* Direction and language, on the document itself.

   The current app has two dead `العربية` buttons and a third that flips
   its own label. Switching here sets `dir` and `lang` on <html>, which
   is what makes every logical property in the stylesheet mirror — the
   sidebar moves to the right, the unlock notch lands on the correct end
   of the track, and the Arabic font stack takes over. */

import { useEffect } from "react";
import { useLocale } from "../lib/store";

export function DirSync() {
  const locale = useLocale();
  /* `lang` is global, `dir` is not. Only the translated surfaces set `dir="rtl"` on their own root: the landing, the
     Brand Read, and (20 Oct, PRD v0.2 H6) the conversation and the dashboard, whose launch flow is in Arabic.
     Mirroring a screen whose copy is still English produces right-aligned English, which is worse than leaving it
     alone. The rest of the app follows when it is translated. */
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
  }, [locale]);
  return null;
}

/** The toggle itself, used on the landing page, the read and the thread. */
export function LangToggle({ className = "", plain = false }: { className?: string; plain?: boolean }) {
  const locale = useLocale();
  return (
    <button
      onClick={() => {
        const next = locale === "ar" ? "en" : "ar";
        import("../lib/track").then((m) => m.track("hm_language_switched", { to: next }));
        import("../lib/store").then((m) => m.setLocale(next));
      }}
      className={
        plain
          /* A text link, for the landing's masthead: no box, no border. */
          ? `text-[14px] font-medium text-ink/70 transition hover:text-ink ${className}`
          : `inline-flex items-center gap-2 rounded-control border border-hairline bg-white px-3 py-2 text-meta font-medium text-ink-soft transition hover:bg-wash ${className}`
      }
      lang={locale === "ar" ? "en" : "ar"}
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
