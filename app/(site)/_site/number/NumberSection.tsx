"use client";
/* S5, the number (§5.4, B8, B9). Paper, opened by the lunar divider. Brands: the guarantee, then the
   ROAS dial. Creators: when you get paid, then the share. Every number comes from demo.json, through
   DEMO and data/view.ts. */
import { useId } from "react";
import type { NumberSectionProps } from "../contracts";
import { Section } from "../ui/Section";
import { Divider } from "./Divider";
import { Guarantee } from "./Guarantee";
import { Paid } from "./Paid";
import { Roas } from "./Roas";
import { Share } from "./Share";

export function NumberSection({ audience }: NumberSectionProps) {
  const titleId = useId();
  return (
    <Section slot="number" surface="paper" audience={audience} cv labelledBy={titleId} className="py-24 sm:py-[120px]">
      <div className="mx-auto max-w-text px-[var(--gutter)]">
        <Divider />
        <div className="mt-16 sm:mt-24">
          {audience === "brands" ? (
            <>
              <Guarantee titleId={titleId} />
              <Roas className="mt-24 sm:mt-[120px]" />
            </>
          ) : (
            <>
              <Paid titleId={titleId} />
              <Share className="mt-24 sm:mt-[120px]" />
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
