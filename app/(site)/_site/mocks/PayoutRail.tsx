/* PayoutRail (SPEC §5.8): the path a payout takes, as four 24px Moons on a dotted line, each labelled
   with the product's own word for the step. Their final phases are new, first quarter, gibbous, full:
   the moon fills as the money comes to you. A glyph past `lit` stays new; the caller steps `lit` 0 to 4
   (WP4: 300ms apart, on entry) and each glyph waxes over 320ms (fill-opacity, mocks.module.css).

   The end glyphs sit flush with the rail's ends and the middle ones on the even spacing between those
   centres. Every position is logical, so the rail mirrors in RTL. The dots stop short of each glyph. */
import type { CSSProperties } from "react";
import type { PayoutRailProps, Phase } from "../contracts";
import { Moon } from "../ui/Moon";
import s from "./mocks.module.css";

const FINAL: Phase[] = [0, 2, 3, 4];
const G = 24;          // glyph size
const CLEAR = 7;       // gap between a glyph and the dots

const DOTS: CSSProperties = {
  backgroundImage: "radial-gradient(circle, rgb(18 21 27 / .16) 1px, transparent 1.3px)",
  backgroundSize: "6px 2px",
  backgroundPosition: "center",
  backgroundRepeat: "repeat-x",
};

/** Inline-start offset of node i of n, as a CSS length: from 0 to (100% − G). */
const at = (i: number, n: number) => {
  const f = n > 1 ? i / (n - 1) : 0;
  return `calc(${(f * 100).toFixed(4)}% - ${(f * G).toFixed(4)}px)`;
};

export function PayoutRail({ steps, lit }: PayoutRailProps) {
  const n = steps.length;
  return (
    <div aria-hidden className={`${s.payout} relative w-full pb-1`}>
      <div className="relative h-6">
        {steps.slice(0, -1).map((_, i) => (
          <span
            key={i}
            className="absolute top-[11px] h-0.5"
            style={{
              ...DOTS,
              insetInlineStart: `calc(${at(i, n)} + ${G + CLEAR}px)`,
              insetInlineEnd: `calc(100% - ${at(i + 1, n)} + ${CLEAR}px)`,
            }}
          />
        ))}
        {steps.map((step, i) => (
          <span key={step} className="absolute top-0 block" style={{ insetInlineStart: at(i, n) }}>
            <Moon phase={i < lit ? FINAL[i] ?? 4 : 0} size={G} className="block text-brand" />
          </span>
        ))}
      </div>
      <div className="relative mt-3 h-9">
        {steps.map((step, i) => {
          const edge = i === 0 ? "start" : i === n - 1 ? "end" : "mid";
          return (
            <span
              key={step}
              className={`absolute top-0 block max-w-[104px] text-micro leading-[18px] text-ink/72 ${
                edge === "start" ? "text-start" : edge === "end" ? "text-end" : "-translate-x-1/2 text-center rtl:translate-x-1/2"
              }`}
              style={
                edge === "start" ? { insetInlineStart: 0 }
                  : edge === "end" ? { insetInlineEnd: 0 }
                  : { insetInlineStart: `calc(${at(i, n)} + ${G / 2}px)`, width: "max-content" }
              }
            >
              {step}
            </span>
          );
        })}
      </div>
    </div>
  );
}
