"use client";
/* The promo (SPEC §5.7, rulings 13 and 14): writer.com's floating card, made honest. A launcher at the
   bottom end opens a card that plays the sample run and takes the visitor to the field.

   Reads the URGENT audience: the card follows the switch. `promoOpen` (lib/signals) is the one source
   of truth for open, so toField() from anywhere (the nav's Start, the window's "Try it…") closes it.

   Visibility (the launcher, and the card with it):
     desktop  appears 4 s after load or on the first scroll; hidden while the close field is in view.
     phone    only while no field is in view and the keyboard is closed; one pulse the first time.
   Whenever the launcher has to hide, an open card closes with it: it never covers a field.

   Auto-open (≥1024 only, once per session): the visitor scrolled past the window with its run under
   60% done, no field is focused or holds text, and the session holds neither "dismissed" nor "auto".
   Then one pulse, 600 ms, open (focus stays where it is), and "auto" is written. Any close after an
   open writes "dismissed", except the forced close when the launcher hides. When sessionStorage is
   blocked the card never auto-opens. */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { PromoProps } from "../contracts";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { useAudience } from "../lib/audience";
import { getSignal, setSignal, useSignal } from "../lib/signals";
import { useIsPhone, useMediaQuery, useReducedMotionPref } from "../lib/prefs";
import { usePlayback } from "../lib/playback";
import { readSession, writeSession } from "../lib/session";
import { toField } from "../lib/scroll";
import { Launcher, type LauncherAnim } from "./Launcher";
import { PromoCard, type CloseReason, type PromoCardHandle } from "./PromoCard";

export const PROMO_KEY = "hm.site.promo";
/** §1.4: the launcher scales in at 4.0 s (from navigation start) or on the first scroll. */
const APPEAR_MS = 4000;
/** §5.7: one pulse, then this long, then the auto-open. */
const AUTO_LEAD_MS = 600;
/** §5.7: auto-open only while the run is under this share done. */
const AUTO_BELOW = 0.6;
const WIDE = "(min-width: 1024px)";

/** sessionStorage that really persists. A blocked store reads null like an empty one, so probe it. */
function storageWorks(): boolean {
  try {
    const k = "hm.site.probe";
    window.sessionStorage.setItem(k, "1");
    const ok = window.sessionStorage.getItem(k) === "1";
    window.sessionStorage.removeItem(k);
    return ok;
  } catch {
    return false;
  }
}

const headlineFor = (a: "brands" | "creators") =>
  (a === "brands" ? COPY.brands.promo.headline(DEMO) : COPY.creators.promo.headline(DEMO));

export function Promo({}: PromoProps) {
  const { audience } = useAudience();
  const open = useSignal("promoOpen");
  const surface = useSignal("surface");
  const heroFieldVisible = useSignal("heroFieldVisible");
  const closeFieldVisible = useSignal("closeFieldVisible");
  const keyboardOpen = useSignal("keyboardOpen");
  const work = useSignal("work");
  const fieldFocus = useSignal("fieldFocus");
  const heroText = useSignal("heroFieldHasText");
  const closeText = useSignal("closeFieldHasText");
  const phone = useIsPhone();
  const wide = useMediaQuery(WIDE);
  const reduced = useReducedMotionPref();
  const { paused } = usePlayback();

  const launcherRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<PromoCardHandle>(null);

  /* ── desktop arming: 4 s after load, or the first scroll ── */
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (armed) return;
    const arm = () => setArmed(true);
    const t = window.setTimeout(arm, Math.max(0, APPEAR_MS - performance.now()));
    window.addEventListener("scroll", arm, { passive: true, once: true });
    return () => { window.clearTimeout(t); window.removeEventListener("scroll", arm); };
  }, [armed]);

  const shown = phone
    ? !heroFieldVisible && !closeFieldVisible && !keyboardOpen
    : armed && !closeFieldVisible;

  /* ── the disc's keyframes: "in" the first time on desktop, one "pulse" the first time on phone,
        and one "pulse" before an auto-open ── */
  const [anim, setAnim] = useState<LauncherAnim>({ kind: null, n: 0 });
  const appeared = useRef(false);
  useEffect(() => {
    if (!shown || appeared.current) return;
    appeared.current = true;
    setAnim((x) => ({ kind: phone ? "pulse" : "in", n: x.n + 1 }));
  }, [shown, phone]);
  const pulse = useCallback(() => setAnim((x) => ({ kind: "pulse", n: x.n + 1 })), []);

  /* ── open and close ── */
  const how = useRef<"user" | "auto">("user");
  const [openId, setOpenId] = useState(0);
  const reason = useRef<CloseReason | null>(null);

  const openCard = useCallback((by: "user" | "auto") => {
    how.current = by;
    setOpenId((n) => n + 1);
    setSignal("promoOpen", true);
  }, []);

  const close = useCallback((why: CloseReason) => {
    if (!getSignal("promoOpen")) return;
    reason.current = why;
    /* Focus inside the card would fall to <body> when it unmounts: hand it to the launcher, except
       when the pill is taking the visitor to the field (toField focuses the input when it lands). */
    const el = cardRef.current?.el;
    const inside = !!el && el.contains(document.activeElement);
    setSignal("promoOpen", false);
    if (why === "esc" || (inside && why !== "cta" && why !== "hidden")) {
      launcherRef.current?.focus({ preventScroll: true });
    }
  }, []);

  /* Any close after an open is the visitor's answer, except the forced one when the launcher hides. */
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) {
      const why = reason.current ?? "external";
      reason.current = null;
      if (why !== "hidden") writeSession(PROMO_KEY, "dismissed");
    }
    wasOpen.current = open;
  }, [open]);

  /* The launcher hides: the card goes with it (a field is coming into view, or the keyboard opened). */
  useEffect(() => {
    if (!shown && open) close("hidden");
  }, [shown, open, close]);

  /* Leaving the page (or the lab) never leaves the signal set. */
  useEffect(() => () => setSignal("promoOpen", false), []);

  /* ── phone: a pointerdown outside the card and the launcher closes it ── */
  useEffect(() => {
    if (!open || !phone) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (cardRef.current?.el?.contains(t) || launcherRef.current?.contains(t)) return;
      close("outside");
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, phone, close]);

  /* ── auto-open ── */
  const autoTimer = useRef<number>();
  const autoBusy = useRef(false);
  useEffect(() => () => window.clearTimeout(autoTimer.current), []);
  useEffect(() => {
    if (autoBusy.current || !wide || !shown || open) return;
    if (!work.passed || work.overall >= AUTO_BELOW) return;
    if (fieldFocus !== null || heroText || closeText) return;
    if (!storageWorks()) return;
    const was = readSession(PROMO_KEY);
    if (was === "dismissed" || was === "auto") return;
    autoBusy.current = true;
    pulse();
    autoTimer.current = window.setTimeout(() => {
      autoBusy.current = false;
      /* Re-check what may have changed in the 600 ms. */
      if (getSignal("promoOpen") || getSignal("fieldFocus") !== null || getSignal("heroFieldHasText")
        || getSignal("closeFieldHasText") || getSignal("closeFieldVisible")) return;
      const now = readSession(PROMO_KEY);
      if (now === "dismissed" || now === "auto") return;
      writeSession(PROMO_KEY, "auto");
      openCard("auto");
    }, AUTO_LEAD_MS);
  }, [wide, shown, open, work, fieldFocus, heroText, closeText, pulse, openCard]);

  const onToggle = () => (open ? close("toggle") : openCard("user"));
  const onCta = () => {
    close("cta");
    toField();
  };

  return (
    <>
      <Launcher
        ref={launcherRef}
        open={open}
        shown={shown}
        label={headlineFor(audience)}
        anim={anim}
        reduced={reduced}
        onToggle={onToggle}
        onEscape={() => close("esc")}
      />
      <AnimatePresence>
        {open && (
          <PromoCard
            key="promo"
            ref={cardRef}
            audience={audience}
            playing={!paused}
            reduced={reduced}
            focusOnOpen={how.current === "user"}
            openId={openId}
            surface={surface}
            swipe={phone}
            onClose={close}
            onCta={onCta}
          />
        )}
      </AnimatePresence>
    </>
  );
}
