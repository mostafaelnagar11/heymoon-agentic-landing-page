"use client";
/* The hero (SPEC §5.1): night, sticky, and the only builder code on the first load.
   The field row is the horizon's origin: <Horizon> sits in the field's grid cell, so its vertical centre
   IS the apex (ruling 21). Everything above the fold is CSS: the line rise, the ignition, the chips'
   fade-up. JS adds the lift bindings (§5.1.5), the WebGL sky (an import() chunk) and, on desktop only,
   the toasts (next/dynamic, gate G10). */
import { useRef } from "react";
import dynamic from "next/dynamic";
import { useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";
import type { HeroProps } from "../contracts";
import type { Audience } from "../data/types";
import { LIFT, SKY, TOAST } from "../tokens";
import { AudienceSwitch } from "../shell/AudienceSwitch";
import { Field } from "../shell/Field";
import { Horizon } from "../shell/Horizon";
import { Sky } from "../sky/Sky";
import { EclipseSky } from "../sky/EclipseSky";
import { useAudience, useWorld } from "../lib/audience";
import { useHeroExit } from "../lib/lift";
import { useIsoLayoutEffect } from "../lib/iso";
import { useIsPhone, useMediaQuery, useReducedMotionPref } from "../lib/prefs";
import { Headline } from "./Headline";
import { Chips } from "./Chips";
import s from "./hero.module.css";

/** Which hero ships. "eclipse": the split layout with the glass star in front of the eclipse (sky/EclipseSky);
    "horizon": the original field-on-the-horizon hero, kept intact so the lead can flip back. */
const HERO_VARIANT = "eclipse" as "eclipse" | "horizon";

/** Gate G10 (ruling 34): the read replayed on the hero. On the eclipse hero that is the agent card (hero/Agents.tsx,
    brands only, at CARD_MQ), which replaces the toasts; on the horizon hero, the toasts. Refused → set false: no
    card and no toast is ever mounted (or loaded) and nothing else changes. */
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

export function Hero(props: HeroProps) {
  return HERO_VARIANT === "eclipse" ? <EclipseHero {...props} /> : <HorizonHero {...props} />;
}

/** The glow behind the field (HERO-V2 §3.4, M9, W2c-7): the global .hz-halo ramps and .hz-tint layers, centred on
    the field, at rest opacity 1. Its tints follow `world`; its core ellipse follows the field's focus (.6 → 1). No
    light reaches toward the field from the star (Mostafa: "you can delete this"). Static under reduced motion and
    without JS (the server render is "reduced"). */
function Glow({ reduced }: { reduced: boolean }) {
  const { audience } = useAudience();
  const { world, focus } = useWorld();
  const core = useTransform(focus, [0, 1], [0.6, 1]);
  const toBrands = useTransform(world, [0, 1], [1, 0]);
  const toCreators = useTransform(world, [0, 1], [0, 1]);
  const tint = (a: Audience, v: MotionValue<number>) => (
    <m.div className="hz-tint" data-tint={a} style={{ opacity: reduced ? +(audience === a) : v }} />
  );
  return (
    <div aria-hidden className={`hz-halo ${s.glow} dawn-fade`}>
      {tint("brands", toBrands)}
      {tint("creators", toCreators)}
      <m.div className={s.core} style={{ opacity: reduced ? 0.6 : core }}>
        {tint("brands", toBrands)}
        {tint("creators", toCreators)}
      </m.div>
    </div>
  );
}

/** The eclipse hero: copy on the left (switch, H1, field, chips), the stage on the right; on a phone the star
    sits under the chips, in the space that is left. No horizon; the agent card replaces the toast lanes (G10). */
function EclipseHero({}: HeroProps) {
  const reduced = useReducedMotionPref();
  const lift = useLift();
  const content = reduced ? undefined : lift.content;
  return (
    <section data-slot="hero" data-surface="night" aria-labelledby="hero-h1" className={`${s.hero} ${s.eclipse}`}>
      {/* The copy comes first in the DOM; grid areas place both on every layout. On phones the star's row (above the
          copy) has a reserved height (hero.module.css), so a frame painted mid-parse never shifts the copy. */}
      <div className={s.copy}>
        <m.div className={s.eTop} data-lift="" data-probe-scroll="" style={content}>
          <div className="dawn-fade motion-safe:animate-nav-in [animation-delay:120ms]">
            <div className={s.tuck}>
              <AudienceSwitch placement="hero" surface="night" />
            </div>
          </div>
          <Headline stacked className={s.eHeadline} />
        </m.div>
        <m.div className={s.eField} data-lift="" data-probe-scroll="" style={content}>
          <Glow reduced={reduced} />
          <Field id="hero" placement="hero" />
        </m.div>
        <m.div className={s.eBottom} data-lift="" data-probe-scroll="" style={content}>
          <Chips className={`${s.chips} ${s.eChips} dawn-fade`} />
        </m.div>
      </div>
      <EclipseSky stageClassName={s.stage} rowClassName={s.starRow} card={G10_SIGNED} />
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

function HorizonHero({}: HeroProps) {
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
          {/* The tuck (hero.module.css, short screens only) owns this wrapper's opacity; the entrance
              animation and dawn-fade own the outer one. */}
          <div className={s.tuck}>
            <AudienceSwitch placement="hero" surface="night" />
          </div>
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
