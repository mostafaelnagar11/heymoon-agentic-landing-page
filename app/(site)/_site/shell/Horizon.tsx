"use client";
/* The CSS horizon (SPEC §5.0.6): the planet's limb with the light behind the field. Put it in the SAME
   grid cell as the field: its vertical centre IS the apex. Layer order = DOM order.
   Halo, sun and rim are two levels: the outer layer carries the shape and the CSS ignition; one inner
   .hz-tint per audience carries the colour and the opacity bound to `world`. A CSS animation with fill
   `both` overrides an inline style on the same element, so the two never share one.
   WP1 sets data-gl="on" / "off" through the ref and passes the sink transform through `style`. */
import { forwardRef } from "react";
import { useTransform } from "motion/react";
import * as m from "motion/react-m";
import type { HorizonProps } from "../contracts";
import { useWorld } from "../lib/audience";

function Tints() {
  const { world } = useWorld();
  const brands = useTransform(world, [0, 1], [1, 0]);
  const creators = useTransform(world, [0, 1], [0, 1]);
  return (
    <>
      <m.div className="hz-tint" data-tint="brands" style={{ opacity: brands }} />
      <m.div className="hz-tint" data-tint="creators" style={{ opacity: creators }} />
    </>
  );
}

export const Horizon = forwardRef<HTMLDivElement, HorizonProps>(function Horizon({ variant, ignite = false, style, className = "" }, ref) {
  const { dawn } = useWorld();
  return (
    <m.div
      ref={ref}
      aria-hidden
      data-horizon={variant}
      data-ignite={ignite ? "" : undefined}
      className={`hz ${className}`}
      style={style}
    >
      <div className="hz-sky" />
      <div className="hz-halo"><Tints /></div>
      <div className="hz-sun"><Tints /></div>
      <div className="hz-ground" />
      <div className="hz-earth" />
      <div className="hz-rim"><Tints /></div>
      <div className="hz-hair" />
      <m.div className="hz-dawn" style={{ opacity: dawn }} />
    </m.div>
  );
});
