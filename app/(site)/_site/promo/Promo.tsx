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
              On top of that (polish round), it tucks away while the visitor scrolls down, since it sat
              over the end of body lines and figure rows (ShareScale's 16% dot), and comes back on a
              scroll up or once the page has rested 1 s. Never while the card is open or the launcher
              holds focus. Reduced motion: the tuck is instant both ways.
   Whenever the launcher has to hide, an open card closes with it: it never covers a field. (A tuck is
   not a hide: the card is never open while tucked.)

   Auto-open (≥1024 only, once per session): the visitor scrolled past the window with its run under
   60% done, no field is focused or holds text, the session holds neither "dismissed" nor "auto", and
   it is a calm moment: the page has rested 600 ms with the card's spot and the middle of the screen
   inside the window's own sections (work, run), never over the number or the agents. Then one pulse,
   600 ms (a scroll in them calls it off until the next calm moment), open (focus stays where it is),
   and "auto" is written.

   Auto-close: an auto-opened card folds back into the launcher once the visitor has scrolled 0.6 of a
   viewport since it opened, or once it has sat untouched for 12 s AND its thumbnail has stamped the read
   and held the stamp about 2.5 s (final round: at a flat 12 s it always folded mid-count, before the
   payoff; about 18 s brands, 19 s creators; both clocks stop while the page is paused or hidden),
   whichever comes first. Moving the pointer over it, pressing it or focusing in it makes it the
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

const PROMO_KEY = "hm.site.promo";
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
/** …or this long untouched (the lead's 12 s), and not before the thumbnail has stamped its read ("Store
    details in 15.0s", "Your grid in 16.2s") and held the stamp: the card reports the run reaching its
    build, 1.1 s after the stamp, and STAMP_HOLD_MS more makes about 2.5 s on screen. Read from the run
    itself, not from the data's times, so a slow first frame or a re-timed demo still shows the payoff. */
const AUTO_CLOSE_MS = 12000;
const STAMP_HOLD_MS = 1400;

/** A one-shot clock that runs only while `running`, keeps what is left across stops, and is re-armed by
    `key`. Returns true once it has run out. */
function useClock(running: boolean, ms: number, key: number): boolean {
  const [up, setUp] = useState(false);
  const left = useRef(ms);
  useEffect(() => { left.current = ms; setUp(false); }, [key, ms]);
  useEffect(() => {
    if (!running || up) return;
    const t0 = performance.now();
    const t = window.setTimeout(() => setUp(true), left.current);
    return () => {
      window.clearTimeout(t);
      left.current = Math.max(0, left.current - (performance.now() - t0));
    };
  }, [running, up]);
  return up;
}
/** R1: the clearance kept between the card's spot and the hero field. */
const FIELD_CLEAR = 8;
/** The launcher catches the card as it arrives: 180 ms into the 240 ms close, 300 ms into the 380 ms
    fold of an auto-close (whose X-to-Moon swap runs 200 to 420 ms). */
const CATCH_AT_MS = { close: 180, auto: 300 } as const;
const WIDE = "(min-width: 1024px)";
/** Phone tuck: back once the page has rested this long… */
const TUCK_REST_MS = 1000;
/** …and only a scroll of more than this in one direction tucks it or brings it back (no jitter). */
const TUCK_SLOP_PX = 12;
/** A scroll event that moves less than this is the page settling, not the visitor scrolling. */
const TUCK_STILL_PX = 2;
/** How long "back" holds the instant transition under reduced motion, past the return's paint. */
const TUCK_BACK_MS = 300;

/** "tucked" while the visitor scrolls down; "back" for a moment after it returns (so a reduced-motion
    return is as instant as the tuck); "none" otherwise. `keep()` vetoes a tuck (the launcher has focus). */
type Tuck = "none" | "tucked" | "back";
function useScrollTuck(enabled: boolean, keep: () => boolean): Tuck {
  const [tuck, setTuck] = useState<Tuck>("none");
  useEffect(() => {
    setTuck("none");
    if (!enabled) return;
    let lastY = window.scrollY, turnY = lastY, dir = 0, rest = 0, back = 0;
    const show = () => {
      window.clearTimeout(rest);
      setTuck((t) => (t === "tucked" ? "back" : t));
      window.clearTimeout(back);
      back = window.setTimeout(() => setTuck((t) => (t === "back" ? "none" : t)), TUCK_BACK_MS);
    };
    const onScroll = () => {
      const y = window.scrollY, dy = y - lastY;
      lastY = y;
      /* Under 2px a frame is the page settling (Lenis's lerp tail after a wheel, the end of a fling):
         at rest, so it neither tucks nor restarts the rest clock. */
      if (Math.abs(dy) < TUCK_STILL_PX) return;
      const d = Math.sign(dy);
      if (d !== dir) { dir = d; turnY = y - dy; }
      if (dir > 0 && y - turnY > TUCK_SLOP_PX && !keep()) { window.clearTimeout(back); setTuck("tucked"); }
      else if (dir < 0 && turnY - y > TUCK_SLOP_PX) { show(); return; }
      window.clearTimeout(rest);
      rest = window.setTimeout(show, TUCK_REST_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.clearTimeout(rest); window.clearTimeout(back); };
  }, [enabled, keep]);
  return enabled ? tuck : "none";
}

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

  /* Phone: tucked while scrolling down. It tracks the scroll even while a field hides the launcher, so
     leaving the hero field on a downward scroll does not flash the launcher before it tucks. */
  const keepOut = useCallback(() => !!launcherRef.current && launcherRef.current === document.activeElement, []);
  const tuck = useScrollTuck(phone && !open, keepOut);
  /** What the visitor sees: shown, and not tucked. `shown` alone still drives the card's forced close. */
  const visible = shown && tuck !== "tucked";

  /* ── the disc's keyframes: "in" the first time on desktop, one "pulse" the first time on phone,
        one "pulse" before an auto-open, and a "catch" when the card comes back in ── */
  const [anim, setAnim] = useState<LauncherAnim>({ kind: null, n: 0 });
  const appeared = useRef(false);
  useEffect(() => {
    if (!visible || appeared.current) return;
    appeared.current = true;
    setAnim((x) => ({ kind: phone ? "pulse" : "in", n: x.n + 1 }));
  }, [visible, phone]);
  const pulse = useCallback(() => setAnim((x) => ({ kind: "pulse", n: x.n + 1 })), []);
  const catchTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(catchTimer.current), []);

  /* ── open and close ── */
  /** Who the card is open for. Read in render (it decides the focus), so it is set before the signal. */
  const how = useRef<"user" | "auto" | "kept">("user");
  /** An auto-opened card still on its own clock (no hover, press or focus yet). */
  const [autoLive, setAutoLive] = useState(false);
  const autoY0 = useRef(0);
  /** The thumbnail has stamped its read (PromoCard onRead), for the auto-close. */
  const [readIn, setReadIn] = useState(false);
  const onRead = useCallback(() => setReadIn(true), []);
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
    setReadIn(false);
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

  /* Leaving the page never leaves the signal set. */
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

  /* Untouched: 12 s, and the stamp held (STAMP_HOLD_MS from the thumbnail's onRead). Both clocks stop
     while the page is paused or in a background tab. Reduced motion: the thumbnail does not play, so the
     12 s alone decides. */
  const clockOn = open && autoLive && !paused && pageVisible;
  const minUp = useClock(clockOn, AUTO_CLOSE_MS, openId);
  const holdUp = useClock(clockOn && readIn, STAMP_HOLD_MS, openId);
  useEffect(() => {
    if (clockOn && minUp && (holdUp || reduced)) close("auto");
  }, [clockOn, minUp, holdUp, reduced, close]);

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
        shown={visible}
        tuck={tuck}
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
            onRead={onRead}
          />
        )}
      </AnimatePresence>
    </>
  );
}
