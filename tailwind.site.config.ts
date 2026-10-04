import type { Config } from "tailwindcss";
import { C, EASE_CSS } from "./app/(site)/_site/tokens";

/* The marketing site's own tokens. Selected by app/(site)/globals.css via @config.
   Single source: _site/tokens.ts. Editing either file needs a dev-server restart. */
const config: Config = {
  content: ["./app/[(]site[)]/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        night: { 0: C.night0, 1: C.night1, 2: C.night2 },
        deep: C.deep,
        paper: C.paper,
        canvas: C.canvas,
        lilac: C.lilac,
        ink: C.ink,
        brand: {
          DEFAULT: C.v700, 700: C.v700, 600: C.v600, 500: C.v500, 400: C.v400, 300: C.v300,
          glow: C.glow, pink: C.pink, blush: C.blush,
        },
        good: { DEFAULT: C.good, deep: C.goodDeep },
        danger: C.danger,
      },
      opacity: {
        6: ".06", 7: ".07", 8: ".08", 12: ".12", 14: ".14", 16: ".16", 28: ".28", 32: ".32",
        56: ".56", 64: ".64", 72: ".72", 88: ".88", 92: ".92", 94: ".94",
      },
      fontSize: {
        "display-1": ["clamp(38px, min(8svh, 5.2vw), 80px)", { lineHeight: "1", letterSpacing: "-0.045em", fontWeight: "480" }],
        "display-2": ["clamp(36px, min(6.6svh, 4.4vw), 64px)", { lineHeight: "1.02", letterSpacing: "-0.042em", fontWeight: "480" }],
        figure: ["clamp(64px, 9vw, 132px)", { lineHeight: "0.92", letterSpacing: "-0.055em", fontWeight: "500" }],
        h2: ["clamp(30px, 3.3vw, 48px)", { lineHeight: "1.06", letterSpacing: "-0.038em", fontWeight: "500" }],
        h3: ["20px", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        lead: ["clamp(17px, 1.25vw, 18px)", { lineHeight: "1.55", letterSpacing: "-0.011em" }],
        body: ["16px", { lineHeight: "1.6", letterSpacing: "-0.006em" }],
        small: ["14px", { lineHeight: "1.45", letterSpacing: "-0.003em" }],
        micro: ["13px", { lineHeight: "1.45", letterSpacing: "0" }],
        "mono-label": ["11px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "500" }],
        "mono-data": ["13px", { lineHeight: "1.3", letterSpacing: "0", fontWeight: "500" }],
        "mono-timer": ["clamp(17px, 1.4vw, 20px)", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "500" }],
      },
      fontWeight: { book: "480" },
      letterSpacing: {
        figure: "-0.055em", display: "-0.045em", h2: "-0.038em", tight: "-0.02em",
        snug: "-0.011em", label: "0.08em", eyebrow: "0.12em",
      },
      borderRadius: {
        chip: "8px", receipt: "10px", control: "12px", toast: "14px", window: "18px",
        card: "20px", field: "24px", frame: "28px", sheet: "32px", pill: "100px",
      },
      boxShadow: {
        glass: "inset 0 0 0 1px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.06), 0 12px 32px -12px rgba(0,0,0,.6)",
        "glass-paper": "inset 0 0 0 1px rgba(18,21,27,.08), 0 8px 24px -12px rgba(25,18,52,.18)",
        track: "inset 0 1px 10px rgba(255,255,255,.05), inset 0 0 0 1px rgba(255,255,255,.08)",
        "track-paper": "inset 0 0 0 1px rgba(18,21,27,.06)",
        thumb: "inset 0 .6px .6px -1.25px rgba(0,0,0,.72), inset 0 2.29px 2.29px -2.5px rgba(0,0,0,.64), inset 0 10px 10px -3.75px rgba(0,0,0,.25), 0 10px 30px -10px rgba(0,0,0,.6), 0 0 24px -4px rgba(255,255,255,.18)",
        "thumb-paper": "0 1px 2px rgba(18,21,27,.08), 0 8px 20px -8px rgba(18,21,27,.28)",
        field: "0 0 0 1px rgba(255,255,255,.7), 0 24px 64px -24px rgba(0,0,0,.8)",
        toast: "inset 0 1px 0 rgba(255,255,255,.07), inset 0 0 0 1px rgba(255,255,255,.09), 0 18px 40px -18px rgba(0,0,0,.7)",
        window: "0 0 0 1px rgba(255,255,255,.06), 0 40px 100px -30px rgba(0,0,0,.8)",
        card: "0 1px 2px rgba(25,18,52,.04), 0 24px 48px -32px rgba(25,18,52,.22)",
        mock: "0 2px 4px rgba(25,18,52,.05), 0 20px 40px -16px rgba(25,18,52,.22)",
        promo: "0 1px 2px rgba(25,18,52,.06), 0 24px 64px -16px rgba(25,18,52,.35)",
        "promo-night": "0 0 0 1px rgba(255,255,255,.08), 0 32px 80px -16px rgba(0,0,0,.7)",
        launcher: "0 0 0 2px #9B7BF0, 0 0 0 6px rgba(155,123,240,.16), 0 12px 28px -8px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.10)",
        float: "0 8px 24px -6px rgba(0,0,0,.35)",
      },
      transitionTimingFunction: {
        "out-expo": EASE_CSS.outExpo, out: EASE_CSS.out, "in-out": EASE_CSS.inOut, exit: EASE_CSS.exit,
      },
      transitionDuration: { micro: "200ms", ui: "350ms", reveal: "600ms", world: "1200ms" },
      maxWidth: { text: "1120px", frame: "1232px" },
      zIndex: { sky: "0", canvas: "1", content: "2", close: "5", sheet: "20", nav: "50", promo: "60", skip: "70" },
      keyframes: {
        caret: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)", filter: "blur(4px)" }, to: { opacity: "1", transform: "none", filter: "blur(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "nav-in": { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "none" } },
        "field-in": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        "launcher-in": { from: { opacity: "0", transform: "scale(.8)" }, to: { opacity: "1", transform: "none" } },
        "launcher-pulse": { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.08)" } },
      },
      animation: {
        caret: "caret 1s step-end infinite",
        "fade-up": `fade-up .5s ${EASE_CSS.outExpo} both`,
        "fade-in": `fade-in .3s ${EASE_CSS.out} both`,
        "nav-in": `nav-in .5s ${EASE_CSS.out} both`,
        "field-in": `field-in .7s ${EASE_CSS.outExpo} .3s both`,
        "launcher-in": `launcher-in .4s ${EASE_CSS.outExpo} both`,
        "launcher-pulse": `launcher-pulse .6s ${EASE_CSS.out} 1`,
      },
    },
  },
  plugins: [],
};

export default config;
