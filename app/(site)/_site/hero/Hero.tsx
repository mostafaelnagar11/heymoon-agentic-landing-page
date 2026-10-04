"use client";
/* STUB (WP0). WP1 replaces the body; keep the export name and props (HeroProps, §4.3).
   The stub uses the real switch, a static h1, the real Field and the real Horizon (§4.2). */
import type { HeroProps } from "../contracts";
import { AudienceSwitch } from "../shell/AudienceSwitch";
import { Field } from "../shell/Field";
import { Horizon } from "../shell/Horizon";
import { Sky } from "../sky/Sky";
import { Headline } from "./Headline";
import { Chips } from "./Chips";
import { Toasts } from "./Toasts";
import s from "./hero.module.css";

export function Hero({}: HeroProps) {
  return (
    <section data-slot="hero" data-surface="night" aria-labelledby="hero-h1" data-stub="Hero" className={s.hero}>
      <Horizon variant="hero" ignite className={s.hzCell} />
      <Sky />
      <div className={s.top}>
        <div className="dawn-fade mb-8 sm:mb-12 motion-safe:animate-nav-in [animation-delay:120ms]">
          <AudienceSwitch placement="hero" surface="night" />
        </div>
        <Headline />
      </div>
      <div className={s.fieldRow}>
        <Field id="hero" placement="hero" />
      </div>
      <div className={s.bottom}>
        <Chips className={`${s.chips} dawn-fade`} />
      </div>
      <Toasts />
    </section>
  );
}
