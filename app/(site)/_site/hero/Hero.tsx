"use client";
/* The hero (SPEC §5.1): night, sticky, and the only builder code on the first load.
   The field row is the horizon's origin: <Horizon> sits in the field's grid cell, so its vertical centre
   IS the apex (ruling 21). Everything above the fold is CSS: the line rise, the ignition, the chips'
   fade-up. JS adds the lift bindings (§5.1.5), the WebGL sky (an import() chunk) and, on desktop only,
   the toasts (next/dynamic, gate G10). */
import { useRef } from "react";
import dynamic from "next/dynamic";
import { useTransform } from "motion/react";
import * as m from "motion/react-m";
import type { HeroProps } from "../contracts";
import { LIFT, SKY, TOAST } from "../tokens";
import { AudienceSwitch } from "../shell/AudienceSwitch";
import { Field } from "../shell/Field";
import { Horizon } from "../shell/Horizon";
import { Sky } from "../sky/Sky";
import { useHeroExit } from "../lib/lift";
import { useIsoLayoutEffect } from "../lib/iso";
import { useIsPhone, useMediaQuery, useReducedMotionPref } from "../lib/prefs";
import { Headline } from "./Headline";
import { Chips } from "./Chips";
import s from "./hero.module.css";

/** Gate G10 (ruling 34): the hero toasts replay a sample read beside the field. Refused → set false:
    <Toasts> is never mounted (or loaded) and nothing else changes. */
const G10_SIGNED: boolean = true;
/** The toast lanes exist at ≥1024 only. Below that the chunk is never even requested. */
const TOAST_MQ = `(min-width: ${TOAST.minWidth}px)`;

/* Desktop only, client only, after hydration: its own chunk, off the first load (lead ruling, 4 Oct). */
const Toasts = dynamic(() => import("./Toasts").then((mod) => mod.Toasts), { ssr: false });

/** The lift bindings (§5.1.5). Each is one array-in, array-out useTransform on heroExit, on an HTML
    element, so motion runs it as a ViewTimeline animation on the compositor. */
function useLift() {
  const heroExit = useHeroExit();
  const opacity = useTransform(heroExit, [0, 1], [1, LIFT.contentOpacity]);
  const transform = useTransform(heroExit, [0, 1], ["translateY(0px)", `translateY(-${LIFT.liftPx}px)`]);
  const dim = useTransform(heroExit, [0, 1], [0, LIFT.dim]);
  const sinkDesktop = useTransform(heroExit, [0, 1], ["translateY(0px)", `translateY(${SKY.sinkPx.desktop}px)`]);
  const sinkPhone = useTransform(heroExit, [0, 1], ["translateY(0px)", `translateY(${SKY.sinkPx.phone}px)`]);
  return { content: { opacity, transform }, dim, sinkDesktop, sinkPhone };
}

export function Hero({}: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const hzRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const isPhone = useIsPhone();
  const wide = useMediaQuery(TOAST_MQ);
  const lift = useLift();

  /* Reduced motion: no bindings at all (§5.1.5). The server render is "reduced", so the HTML is static. */
  const content = reduced ? undefined : lift.content;
  const sink = reduced ? undefined : { transform: isPhone ? lift.sinkPhone : lift.sinkDesktop };

  /* The Horizon root (WP0) takes no extra attributes, so the short-screen hook is set through its ref. */
  useIsoLayoutEffect(() => {
    const hz = hzRef.current;
    if (!hz) return;
    hz.dataset.lift = "";
    hz.dataset.probeScroll = "";
  }, []);

  return (
    <section ref={sectionRef} data-slot="hero" data-surface="night" aria-labelledby="hero-h1" className={s.hero}>
      <Horizon ref={hzRef} variant="hero" ignite className={s.hzCell} style={sink} />
      <Sky hzRef={hzRef} />
      <m.div className={s.top} data-lift="" data-probe-scroll="" style={content}>
        <div className="dawn-fade mb-8 motion-safe:animate-nav-in [animation-delay:120ms] sm:mb-12">
          <AudienceSwitch placement="hero" surface="night" />
        </div>
        <Headline />
      </m.div>
      <m.div className={s.fieldRow} data-lift="" data-probe-scroll="" style={content}>
        <Field id="hero" placement="hero" />
      </m.div>
      <m.div className={s.bottom} data-lift="" data-probe-scroll="" style={content}>
        <Chips className={`${s.chips} dawn-fade`} />
      </m.div>
      {G10_SIGNED && wide && <Toasts heroRef={sectionRef} liftStyle={content} />}
      <m.div
        aria-hidden
        data-lift="dim"
        data-probe-scroll=""
        className="pointer-events-none absolute inset-0 z-[3] bg-black opacity-0"
        style={reduced ? undefined : { opacity: lift.dim }}
      />
    </section>
  );
}
