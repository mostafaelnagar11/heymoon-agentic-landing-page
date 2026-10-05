"use client";
/* The promo (SPEC §5.7, rulings 13 and 14, the lead's fix-round rulings of 4 Oct): writer.com's
   floating card, made honest. A launcher at the bottom end opens a card that plays the sample run and
   takes the visitor to the field.

   Reads the URGENT audience: the card follows the switch. `promoOpen` (lib/signals) is the one source
   of truth for open, so toField() from anywhere (the nav's Start, the window's "Try it…") closes it.

   Visibility (the launcher, and the card with it):
     desktop  appears 4 s after load or on the first scroll; hidden while the close field is in view,
              and while the card, opened now, would cover the hero field (R1: below about 1348px wide
              the card's spot overlaps the hero field's Start; the launcher waits until the field has
              cleared it, which takes one scroll).
     phone    only while no field is in view and the keyboard is closed; one pulse the first time.
   Whenever the launcher has to hide, an open card closes with it: it never covers a field.

   Auto-open (≥1024 only, once per session): the visitor scrolled past the window with its run under
   60% done, no field is focused or holds text, the session holds neither "dismissed" nor "auto", and
   it is a calm moment: the page has rested 600 ms with the card's spot and the middle of the screen
   inside the window's own sections (work, run), never over the number or the agents. Then one pulse,
   600 ms (a scroll in them calls it off until the next calm moment), open (focus stays where it is),
   and "auto" is written.

   Auto-close: an auto-opened card folds back into the launcher once the visitor has scrolled 0.6 of a
   viewport since it opened, or after 12 s of it untouched (the clock stops while the page is paused or
   hidden), whichever comes first. Moving the pointer over it, pressing it or focusing in it makes it the
   visitor's: from then on it stays until they close it, like a card they opened. The launcher stays;
   "auto" stays written, so it never opens by itself again this session.

   Any other close after an open writes "dismissed", except the forced close when the launcher hides.
   When sessionStorage is blocked the card never auto-opens. */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { PromoProps } from "../contracts";
import { COPY } from "../copy";
import { DEMO } from "../data/demo";
import { useAudience } from "../lib/audience";
import { useIsoLayoutEffect } from "../lib/iso";
import { els, getSignal, setSignal, useSignal } from "../lib/signals";
import { useIsPhone, useMediaQuery, usePageVisible, useReducedMotionPref } from "../lib/prefs";
import { usePlayback } from "../lib/playback";
import { readSession, writeSession } from "../lib/session";
import { toField } from "../lib/scroll";
import { CARD_H, dockRect, intersects, overSlots } from "./dock";
import { Launcher, type LauncherAnim } from "./Launcher";
import { PromoCard, type CloseReason, type PromoCardHandle } from "./PromoCard";

export const PROMO_KEY = "hm.site.promo";
/** §1.4: the launcher scales in at 4.0 s (from navigation start) or on the first scroll. */
const APPEAR_MS = 4000;
/** §5.7: one pulse, then this long, then the auto-open. */
const AUTO_LEAD_MS = 600;
/** §5.7: auto-open only while the run is under this share done. */
const AUTO_BELOW = 0.6;
/** The calm moment: the page has not scrolled for this long (a pause to look, not a breath between
    two flicks of the wheel). */
const SETTLE_MS = 600;
/** A scroll of more than this during the 600 ms lead means the visitor moved on: no open this time. */
const LEAD_DRIFT_PX = 48;
/** Where the auto-open may happen: the window's own sections (its subject), never a figure. */
const CALM_SLOTS: ReadonlySet<string> = new Set(["work", "run"]);
/** Auto-close: after this share of a viewport scrolled since the open… */
const AUTO_CLOSE_SCROLL = 0.6;
/** …or this long untouched. */
const AUTO_CLOSE_MS = 12000;
/** R1: the clearance kept between the card's spot and the hero field. */
const FIELD_CLEAR = 8;
/** The launcher catches the card as it arrives: 180 ms into the 240 ms close, 300 ms into the 380 ms
    fold of an auto-close (whose X-to-Moon swap runs 200 to 420 ms). */
const CATCH_AT_MS = { close: 180, auto: 300 } as const;
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

/** The session already holds the visitor's answer, or the one auto-open. */
const autoSpent = () => {
  const was = readSession(PROMO_KEY);
  return was === "dismissed" || was === "auto";
};

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
  const pageVisible = usePageVisible();
  const { paused } = usePlayback();

  const launcherRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<PromoCardHandle>(null);
  /** The card's real layout height, refreshed on every open (dock.ts sizes the unopened card by it). */
  const cardH = useRef(CARD_H);

  /* ── desktop arming: 4 s after load, or the first scroll ── */
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (armed) return;
    const arm = () => setArmed(true);
    const t = window.setTimeout(arm, Math.max(0, APPEAR_MS - performance.now()));
    window.addEventListener("scroll", arm, { passive: true, once: true });
    return () => { window.clearTimeout(t); window.removeEventListener("scroll", arm); };
  }, [armed]);

  /* ── R1: would the card, opened now, cover the hero field? Measured only while that field is on
        screen, outside phone (where any field in view already hides the launcher). A layout effect,
        so the answer is in before the 4 s arming can show the launcher for a frame. ── */
  const [heroCovered, setHeroCovered] = useState(false);
  useIsoLayoutEffect(() => {
    if (phone || !heroFieldVisible) { setHeroCovered(false); return; }
    const check = () => {
      const f = els.heroField;
      setHeroCovered(!!f && intersects(dockRect(cardH.current), f.getBoundingClientRect(), FIELD_CLEAR));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [phone, heroFieldVisible, armed]);

  const shown = phone
    ? !heroFieldVisible && !closeFieldVisible && !keyboardOpen
    : armed && !closeFieldVisible && !(heroFieldVisible && heroCovered);

  /* ── the disc's keyframes: "in" the first time on desktop, one "pulse" the first time on phone,
        one "pulse" before an auto-open, and a "catch" when the card comes back in ── */
  const [anim, setAnim] = useState<LauncherAnim>({ kind: null, n: 0 });
  const appeared = useRef(false);
  useEffect(() => {
    if (!shown || appeared.current) return;
    appeared.current = true;
    setAnim((x) => ({ kind: phone ? "pulse" : "in", n: x.n + 1 }));
  }, [shown, phone]);
  const pulse = useCallback(() => setAnim((x) => ({ kind: "pulse", n: x.n + 1 })), []);
  const catchTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(catchTimer.current), []);

  /* ── open and close ── */
  /** Who the card is open for. Read in render (it decides the focus), so it is set before the signal. */
  const how = useRef<"user" | "auto" | "kept">("user");
  /** An auto-opened card still on its own clock (no hover, press or focus yet). */
  const [autoLive, setAutoLive] = useState(false);
  const autoY0 = useRef(0);
  const autoLeft = useRef(AUTO_CLOSE_MS);
  const [openId, setOpenId] = useState(0);
  /** The close reason, for the session record (cleared once recorded). */
  const reason = useRef<CloseReason | null>(null);
  /** The close reason, for the card's exit (kept until the next close). */
  const exitWhy = useRef<CloseReason | null>(null);

  const openCard = useCallback((by: "user" | "auto") => {
    window.clearTimeout(catchTimer.current);
    launcherRef.current?.removeAttribute("data-lag");
    how.current = by;
    autoY0.current = window.scrollY;
    autoLeft.current = AUTO_CLOSE_MS;
    setAutoLive(by === "auto");
    setOpenId((n) => n + 1);
    setSignal("promoOpen", true);
  }, []);

  const close = useCallback((why: CloseReason) => {
    if (!getSignal("promoOpen")) return;
    reason.current = why;
    exitWhy.current = why;
    /* Focus inside the card would fall to <body> when it unmounts: hand it to the launcher, except
       when the pill is taking the visitor to the field (toField focuses the input when it lands). */
    const el = cardRef.current?.el;
    const inside = !!el && el.contains(document.activeElement);
    /* An auto-close holds the launcher's X until the card is nearly in, so the Moon comes back as the
       card arrives, not before it leaves. Set on the DOM, ahead of the signal: the CSS delay has to be
       there when data-open flips (a React state could land a render later). The visitor's own close
       keeps the instant swap: it is the feedback for their press. */
    launcherRef.current?.toggleAttribute("data-lag", why === "auto");
    setAutoLive(false);
    setSignal("promoOpen", false);
    if (why === "esc" || (inside && why !== "cta" && why !== "hidden")) {
      launcherRef.current?.focus({ preventScroll: true });
    }
    /* The launcher catches the card as it arrives. Not when the visitor is on the way to the field, nor
       when the launcher hides too. */
    if (why !== "cta" && why !== "hidden" && why !== "external") {
      window.clearTimeout(catchTimer.current);
      catchTimer.current = window.setTimeout(
        () => setAnim((x) => ({ kind: "catch", n: x.n + 1 })),
        why === "auto" ? CATCH_AT_MS.auto : CATCH_AT_MS.close,
      );
    }
  }, []);

  /* Any close after an open is the visitor's answer, except the forced one when the launcher hides and
     the auto-close (the visitor said nothing; "auto" stays written either way). */
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) {
      const why = reason.current ?? "external";
      reason.current = null;
      if (why !== "hidden" && why !== "auto") writeSession(PROMO_KEY, "dismissed");
    }
    wasOpen.current = open;
  }, [open]);

  /* The launcher hides: the card goes with it (a field is coming into view, or the keyboard opened). */
  useEffect(() => {
    if (!shown && open) close("hidden");
  }, [shown, open, close]);

  /* Leaving the page (or the lab) never leaves the signal set. */
  useEffect(() => () => setSignal("promoOpen", false), []);

  /* The card's real height, once it is open (a short viewport scales it, but its layout height holds). */
  useEffect(() => {
    if (!open) return;
    const h = cardRef.current?.el?.offsetHeight;
    if (h) cardH.current = h;
  }, [open]);

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

  /* ── auto-open: wait for a calm moment over the window's own sections ── */
  const autoAllowed = wide && shown && !open && work.passed && work.overall < AUTO_BELOW
    && fieldFocus === null && !heroText && !closeText;
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    if (!autoAllowed || !storageWorks() || autoSpent()) { setCalm(false); return; }
    let t = 0;
    const settle = () => {
      setCalm(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setCalm(overSlots(CALM_SLOTS, cardH.current)), SETTLE_MS);
    };
    settle();
    window.addEventListener("scroll", settle, { passive: true });
    window.addEventListener("resize", settle);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", settle);
      window.removeEventListener("resize", settle);
    };
  }, [autoAllowed]);

  const autoTimer = useRef<number>();
  const autoBusy = useRef(false);
  useEffect(() => () => window.clearTimeout(autoTimer.current), []);
  useEffect(() => {
    if (!calm || autoBusy.current || autoSpent()) return;
    autoBusy.current = true;
    pulse();
    const y0 = window.scrollY;
    autoTimer.current = window.setTimeout(() => {
      autoBusy.current = false;
      /* Re-check what may have changed in the 600 ms. The visitor scrolled on, or off the window's
         sections: wait for the next calm moment (nothing is written), so the card never opens into a
         scroll that would close it again at once. */
      const w = getSignal("work");
      if (getSignal("promoOpen") || getSignal("fieldFocus") !== null || getSignal("heroFieldHasText")
        || getSignal("closeFieldHasText") || getSignal("closeFieldVisible")
        || !w.passed || w.overall >= AUTO_BELOW || Math.abs(window.scrollY - y0) > LEAD_DRIFT_PX
        || !overSlots(CALM_SLOTS, cardH.current)) return;
      if (autoSpent()) return;
      writeSession(PROMO_KEY, "auto");
      openCard("auto");
    }, AUTO_LEAD_MS);
  }, [calm, pulse, openCard]);

  /* ── auto-close ── */
  /* Hover (a pointer the visitor MOVED over the card, not one the card opened under), a press, a key
     or focus inside: the card is the visitor's now. */
  useEffect(() => {
    if (!open || !autoLive) return;
    const el = cardRef.current?.el;
    if (!el) return;
    const keep = () => { how.current = "kept"; setAutoLive(false); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.movementX !== 0 || e.movementY !== 0) keep();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", keep);
    el.addEventListener("focusin", keep);
    el.addEventListener("keydown", keep);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", keep);
      el.removeEventListener("focusin", keep);
      el.removeEventListener("keydown", keep);
    };
  }, [open, autoLive]);

  /* Scrolled on: more than 0.6 of a viewport from where the card opened, either way. */
  useEffect(() => {
    if (!open || !autoLive) return;
    const onScroll = () => {
      if (Math.abs(window.scrollY - autoY0.current) > AUTO_CLOSE_SCROLL * window.innerHeight) close("auto");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open, autoLive, close]);

  /* 12 s untouched. The clock stops while the page is paused or in a background tab. */
  useEffect(() => {
    if (!open || !autoLive || paused || !pageVisible) return;
    const t0 = performance.now();
    const t = window.setTimeout(() => close("auto"), autoLeft.current);
    return () => {
      window.clearTimeout(t);
      autoLeft.current = Math.max(0, autoLeft.current - (performance.now() - t0));
    };
  }, [open, autoLive, paused, pageVisible, close]);

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
            by={how.current}
            closing={exitWhy}
            onClose={close}
            onCta={onCta}
          />
        )}
      </AnimatePresence>
    </>
  );
}
