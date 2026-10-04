"use client";
/* The close (SPEC §5.6, B12, S7 moonset): the fork. Night returns under the sheet's rounded bottom
   (-mt-8, beneath the sheet's z), then the glass switch, the H2, the field on the close horizon
   (apex at 56svh), the lock note and the credit. Reads the URGENT audience: a switch here is the fork
   (select(a, "close") keeps the close where it is, via anchorOf("close")).
   - The rim re-ignites once, when the section first reaches 40% visibility. Static by default: only a
     close that is below the viewport at mount is armed to its pre-ignition state (rule 2.4.7).
   - The H2 is the odometer morph (globals .morph): still | in | out | idle. Both children remount on a
     switch (key + h2/div swap). Off screen, a switch swaps them with no animation. */
import { Fragment, useEffect, useRef, useState } from "react";
import type { CloseProps } from "../contracts";
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { useAudience } from "../lib/audience";
import { getReducedMotion } from "../lib/prefs";
import { inertProp } from "../lib/iso";
import { AudienceSwitch } from "../shell/AudienceSwitch";
import { Field } from "../shell/Field";
import { Horizon } from "../shell/Horizon";
import { Lock } from "../ui/icons";
import s from "./close.module.css";

const ORDER: Audience[] = ["brands", "creators"];
/** The note's sentences, each kept whole on a line: a wrap falls between sentences, never inside one. */
const sentences = (t: string) => t.replace(/([.?]) +/g, "$1\n").split("\n");
type MorphState = "still" | "in" | "out" | "idle";

function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="line" style={{ "--i": i } as React.CSSProperties}>
          <span>{line}</span>
        </span>
      ))}
    </>
  );
}

/** The close H2: one line on desktop, COPY[a].close.h2Phone on phone, one sr-only sentence. */
function Headline({ inView }: { inView: boolean }) {
  const { audience } = useAudience();
  /* Derived from the previous render (React's "store information from previous renders" pattern):
     a change of audience animates only if the close is on screen at that moment. */
  const [shown, setShown] = useState<{ a: Audience; animate: boolean }>({ a: audience, animate: false });
  if (shown.a !== audience) setShown({ a: audience, animate: inView });

  return (
    <div className={`${s.closeH2} morph dawn-fade text-center text-display-2 text-white/[.96]`}>
      {ORDER.map((a) => {
        const active = a === audience;
        const state: MorphState = active ? (shown.animate ? "in" : "still") : (shown.animate ? "out" : "idle");
        const copy = COPY[a].close;
        const body = (
          <>
            <span className="sr-only">{copy.h2}</span>
            <span aria-hidden className="hidden sm:block"><Lines lines={[copy.h2]} /></span>
            <span aria-hidden className="sm:hidden"><Lines lines={copy.h2Phone} /></span>
          </>
        );
        return active
          ? <h2 key={a} id="close-h2" data-state={state}>{body}</h2>
          : <div key={a} aria-hidden {...inertProp(true)} data-state={state}>{body}</div>;
      })}
    </div>
  );
}

export function Close({}: CloseProps) {
  const { audience, switches } = useAudience();
  const ref = useRef<HTMLElement>(null);
  /* armed: below the viewport at mount, so the ignition can replay from dark. entered: once, at 40%. */
  const [armed, setArmed] = useState(false);
  const [entered, setEntered] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const arm = !getReducedMotion() && el.getBoundingClientRect().top > window.innerHeight;
    setArmed(arm);
    let lit = !arm;
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
      if (!lit && e.isIntersecting && e.intersectionRatio >= 0.4) {
        lit = true;
        setEntered(true);
      }
    }, { threshold: [0, 0.4] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const copy = COPY[audience].close;

  return (
    <section
      ref={ref}
      data-slot="close"
      data-surface="night"
      aria-labelledby="close-h2"
      data-armed={armed && !entered ? "" : undefined}
      className={`${s.close} relative z-close -mt-8 overflow-clip bg-night-1 text-white`}
    >
      <Horizon variant="close" ignite={entered} className={s.hzCell} />

      <div className={s.top}>
        <div className="dawn-fade mb-10">
          <AudienceSwitch placement="close" surface="night" />
        </div>
        <Headline inView={inView} />
      </div>

      <div className={s.fieldRow}>
        <Field id="close" placement="close" />
      </div>

      <div className={`${s.bottom} dawn-fade`}>
        {/* Keyed by audience after the first switch, so the note crossfades in with the new H2. */}
        <p key={switches > 0 ? audience : "first"} className={`${s.note} ${switches > 0 ? s.swapIn : ""} text-small text-white/72`}>
          <Lock size={12} weight="bold" aria-hidden className={s.noteIcon} />
          {sentences(copy.note).map((t, i) => (
            <Fragment key={i}>{i > 0 && " "}<span className={s.sentence}>{t}</span></Fragment>
          ))}
        </p>
        <p className="mt-2 text-micro text-white/56">{COPY.shared.credit}</p>
      </div>
    </section>
  );
}
