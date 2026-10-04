"use client";

/* THE DISCOUNT CODE.
 *
 * The most consequential string in the product, and it was a quiet
 * lilac box two thirds of the way down a scrolling brief.
 *
 * Everything about a campaign runs through this code. A postpaid one
 * pays a share of the orders it carries, so without the code on screen
 * the creator earns nothing at all; a prepaid one is measured by it, so
 * without it the work cannot be credited and the brand has no reason to
 * approve the next brief. It is not a detail of the brief. It is the
 * instrument the creator is paid by, and the Pre-upload Check argues
 * harder about it than about anything else for exactly that reason.
 *
 * So it is pinned rather than placed: on a campaign being worked on it
 * sticks to the top of the scroll and stays there while the brief, the
 * deliverables and the draft checks move underneath it. And it is
 * copyable in one press, because the alternative is a creator
 * transcribing it by eye into a caption, which is the one place a typo
 * costs them the entire fee.
 *
 * THE TRACKING LINK SITS WITH IT, for the same reason and in the same
 * card. Alex: "it's all about the coupons. Now it's about the tracking
 * links. That would be the next step they do in the dashboard." They
 * are two halves of one thing — the code attributes an order somebody
 * typed it into, the link attributes one where nobody did — and a
 * creator setting up a post needs both in the same reach.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link as LinkIcon, Warning } from "@phosphor-icons/react";

type Status = "idle" | "copied" | "manual";

/* ONE COPY BUTTON, used twice. The code's was a 44px pill and the
   link's a 32px one, which read as a primary and a lesser action —
   but copying either is the same act, and the two sit one above the
   other in the same card. */
const COPY_BTN = "inline-flex h-10 shrink-0 items-center gap-2 rounded-pill border border-white/30 bg-white/15 px-4 text-body font-semibold text-white backdrop-blur-[2px] transition hover:bg-white/25 active:scale-[0.98]";

export function CodeBadge({ code, link, pinned, why }: {
  code: string;
  /** The tracking link for the same campaign, when there is one. */
  link?: string;
  /** Sticks to the top of the scrolling column. For a campaign the
      creator is actually working on. */
  pinned?: boolean;
  /** Override the standing explanation. */
  why?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [mod, setMod] = useState("Ctrl");
  const field = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    /* Read on the client only: `navigator` does not exist while this
       renders on the server, and a bare reference to it there is a
       ReferenceError rather than an undefined. */
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMod("Cmd");
    return () => clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      /* `navigator.clipboard` is unavailable on an insecure origin and
         can be refused by permission policy, and both throw rather than
         returning false. The fallback is not another API — it is
         SELECTING the code so the creator can copy it with the keyboard,
         which always works and tells them what to do next. */
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      const el = field.current;
      if (el && typeof window !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setStatus("manual");
      timer.current = setTimeout(() => setStatus("idle"), 6000);
    }
  };

  const line = why ?? "Every order is attributed through this code. Without it on screen the sale is not counted to you.";

  return (
    <div className={pinned ? "sticky top-0 z-20 -mx-4 bg-white/80 px-4 pb-2 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6" : ""}>
      {/* A COUPON, NOT A LINE OF TEXT (28 Sep review: "it looks like a
          normal text"). The code sits in the dashed box a printed coupon
          puts it in, and the tracking link is the stub below a tear line
          with a notch cut out of each edge. The notches are the white
          the badge sits on, so they read as cut-outs. */}
      <div className="g-bonus g-sheen relative overflow-hidden rounded-inner border border-white/50 text-white shadow-[0_10px_24px_-14px_rgba(77,47,176,0.7)]">
        <div className="flex items-center gap-3 px-3.5 pt-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-brand font-semibold uppercase tracking-[0.12em] text-white/70">Your code</p>
            {/* Wide tracking and a mono face, because this string is
                read character by character and then typed. */}
            <span
              ref={field}
              className="num mt-1.5 inline-block max-w-full select-all truncate rounded-chip border-2 border-dashed border-white/60 bg-white/10 px-3 py-1 font-mono text-section font-bold tracking-[0.14em] text-white"
            >
              {code}
            </span>
          </div>
          <button
            onClick={copy}
            aria-label={`Copy the code ${code}`}
            className={COPY_BTN}
          >
            {status === "copied"
              ? <><Check size={16} weight="bold" aria-hidden />Copied</>
              : <><Copy size={16} weight="bold" aria-hidden />Copy</>}
          </button>
        </div>

        {/* The status line is polite rather than an alert: nothing has
            gone wrong for the creator, the browser simply would not
            hand over the clipboard. */}
        <p aria-live="polite" className="flex items-start gap-1.5 px-3.5 pb-3.5 pt-2 text-meta leading-4 text-white/85">
          {status === "manual"
            ? <><Warning size={13} weight="fill" aria-hidden className="mt-0.5 shrink-0" />Selected it for you. Press {mod}+C to copy.</>
            : status === "copied"
              ? <>On your clipboard. Paste it into the caption before you post.</>
              : line}
        </p>

        {link && (
          <>
            <div aria-hidden className="relative h-4">
              <span className="absolute -start-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-pill bg-white" />
              <span className="absolute -end-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-pill bg-white" />
              <span className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-white/40" />
            </div>
            <div className="px-3.5 pb-3.5 pt-1.5">
              <p className="text-brand font-semibold uppercase tracking-[0.12em] text-white/70">Your tracking link</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 select-all truncate font-mono text-body text-white" dir="ltr">{link}</span>
                <CopyLink value={link} mod={mod} />
              </div>
              <p className="mt-1.5 text-meta leading-4 text-white/85">
                For your bio and your story sticker. It attributes an order even when nobody types the code.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The link's own copy button. Same fallback as the code: if the
    clipboard is refused, select the text and say which keys to press. */
function CopyLink({ value, mod }: { value: string; mod: string }) {
  const [state, setState] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    clearTimeout(timer.current);
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("manual");
    }
    timer.current = setTimeout(() => setState("idle"), 3000);
  };
  return (
    <button onClick={copy} aria-label={`Copy the tracking link ${value}`} className={COPY_BTN}>
      {state === "copied" ? <><Check size={16} weight="bold" aria-hidden />Copied</>
        : state === "manual" ? <>Press {mod}+C</>
        : <><LinkIcon size={16} weight="bold" aria-hidden />Copy</>}
    </button>
  );
}
