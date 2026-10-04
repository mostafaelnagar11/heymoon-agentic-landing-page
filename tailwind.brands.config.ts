import type { Config } from "tailwindcss";

/* ------------------------------------------------------------------ */
/* The design system, as tokens.                                       */
/*                                                                     */
/* The current app carries these same values as ~400 hex literals      */
/* repeated across components, plus two near-duplicate palettes (a     */
/* brand one and an older Tailwind indigo/violet one). Everything      */
/* below is the brand palette, named once. The indigo layer is not     */
/* ported.                                                             */
/* ------------------------------------------------------------------ */

const config: Config = {
  /* THIS SIDE ONLY, plus the switch both heroes share. The two apps
     give the same class names different values (`text-brand` is a
     colour on brands and a size on creators), so each side is built
     from its own files by its own config, which its globals.css names
     with @config. A route group's parentheses are written as
     character classes: bare they are a glob group, and Tailwind drops a
     backslash-escaped pair. */
  content: ["./app/[(]brands[)]/**/*.{js,ts,jsx,tsx,mdx}", "./app/_shared/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        /* Figtree, the creator app's UI face, now this app's too, so a
           brand and a creator are looking at one product. */
        sans: ["var(--font-figtree)", "system-ui", "sans-serif"],
        /* THE LANDING'S FACE, and only the landing's. Its headings are
           tuned to Geist at -0.038em; Figtree sets wider and was never
           drawn at that tracking. `app/page.tsx` is the only root that
           may carry `font-geist`. */
        geist: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        /* THE CREATOR APP'S PALETTE, adopted whole. Where a key existed
           here already it now holds that app's value rather than a
           near-miss of it, because two products a brand and a creator
           both call HeyMoon cannot be two greys apart.

           Black is #12151B and body text runs on alpha over it, which
           is what replaced this app's three mixed inks (#191234,
           #4A4463, #8B87A0). The old names stay so forty call sites do
           not have to move; `soft` and `faint` are now that scale. */
        ink: {
          DEFAULT: "#12151B",
          90: "rgba(0,0,0,0.9)",
          soft: "rgba(0,0,0,0.6)",
          60: "rgba(0,0,0,0.6)",
          50: "rgba(0,0,0,0.5)",
          faint: "rgba(0,0,0,0.5)",
          40: "rgba(0,0,0,0.4)",
        },
        /* The one purple a control may be painted in. Both apps already
           agreed on #4D2FB0; the ramp is the creator app's. */
        brand: {
          DEFAULT: "#4D2FB0",
          hover: "#3F2596",
          10: "rgba(77,47,176,0.10)",
          80: "rgba(77,47,176,0.80)",
          mid: "#6848D1",
          light: "#7A47CE",
          glow: "#A65FED",
          /* Kept: the landing's gradient stops and its tints. */
          500: "#7C5CE0",
          400: "#9B7BF0",
          300: "#A78BFA",
          100: "#F3EFFC",
          50: "#F6F4FC",
        },
        main: { DEFAULT: "#4D2FB0", 10: "rgba(77,47,176,0.10)", 80: "rgba(77,47,176,0.80)" },
        /* Surfaces. `lilac` is the tinted tile and the active rail row;
           `canvas` the ground a page rests on; `paper` the landing's
           warm ground, which the creator app calls `ground`. */
        lilac: "#F3EFFC",
        wash: "#F3EFFC",
        canvas: "#F6F4FC",
        paper: "#FCFBF8",
        ground: "#FCFBF8",
        rail: "#FFFFFF",
        track: "#EFEBFA",
        deep: "#141229",
        night: "#161722",
        line: { DEFAULT: "#EBEBEB", soft: "#EEEEEE" },
        /* The far end of the landing's keyline gradient. */
        blush: { DEFAULT: "#F4A8D8", deep: "#C2418B" },
        /* Semantic tints, the creator app's exactly. `good` keeps its
           name and takes that app's green. */
        green: { DEFAULT: "#25A333", 10: "rgba(37,163,51,0.10)" },
        good: { DEFAULT: "#25A333", deep: "#1C7A26" },
        orange: { DEFAULT: "#FF8400", 20: "rgba(255,132,0,0.20)" },
        amber: { DEFAULT: "#B26A00", soft: "#FFF4E5", line: "#FFE0B2" },
        lime: "#4FEA57",
        sun: "#FFE538",
        danger: { DEFAULT: "#D70015", deep: "#B00011" },
      },
      /* `hairline` inside cards and between rows; `rule` is the landing's
         heavier line for the masthead and section tops. */
      /* An alpha hairline of this app's ink, the creator app's exactly,
         because an opaque #EBEBEB is visibly wrong the moment it sits
         on lilac, canvas or amber. Extending `borderColor` also gives
         `divide-hairline`, since Tailwind's divideColor defaults to it. */
      borderColor: { hairline: "rgba(18,21,27,0.07)", rule: "rgba(18,21,27,0.14)" },
      boxShadow: {
        /* The creator app's set. `card` is its phone-card float, `edge`
           the desktop keyline-plus-contact, and the three `hm-` lifts
           are the landing's, cast in the landing's own ink. */
        card: "0 4px 4px rgba(17,17,17,0.04)",
        edge: "0 1px 2px rgba(18,21,27,0.05)",
        float: "0 8px 24px rgba(18,21,27,0.08)",
        pop: "0 24px 60px -20px rgba(18,21,27,0.35)",
        dock: "0 12px 40px -12px rgba(18,21,27,0.28)",
        sheet: "0 1px 2px rgba(25,18,52,0.04), 0 24px 48px -28px rgba(25,18,52,0.14)",
        "hm-field": "0 2px 4px rgba(25,18,52,0.04), 0 20px 44px -18px rgba(25,18,52,0.22), 0 56px 90px -48px rgba(25,18,52,0.30)",
        "hm-card": "0 1px 2px rgba(25,18,52,0.04), 0 24px 48px -32px rgba(25,18,52,0.22)",
        "hm-mock": "0 2px 4px rgba(25,18,52,0.05), 0 20px 40px -16px rgba(25,18,52,0.22)",
      },
      borderRadius: {
        chip: "8px",
        control: "12px",
        inner: "12px",
        card: "16px",
        tile: "24px",
        sheet: "32px",
        pill: "100px",
      },
      /* The type scale the app actually uses, named so a rebuild stops
         inventing new pixel values. */
      /* The creator app's scale, named. Body is 14px there and was 13
         here, which is the single biggest reason the two products did
         not feel like one: every row, label and paragraph in the app
         was set a step smaller. Rank is added above and below the body,
         never by shrinking it. */
      fontSize: {
        micro: ["10px", { lineHeight: "14px" }],
        tiny: ["10px", { lineHeight: "14px" }],
        eyebrow: ["11px", { lineHeight: "14px", letterSpacing: "0.08em" }],
        meta: ["12px", { lineHeight: "16px" }],
        body: ["14px", { lineHeight: "20px" }],
        row: ["16px", { lineHeight: "22px" }],
        head: ["17px", { lineHeight: "24px" }],
        title: ["17px", { lineHeight: "24px" }],
        greet: ["18px", { lineHeight: "24px" }],
        section: ["20px", { lineHeight: "26px" }],
        prose: ["15px", { lineHeight: "26px" }],
        figure: ["22px", { lineHeight: "26px" }],
        display: ["30px", { lineHeight: "30px", letterSpacing: "-0.03em" }],
        hero: ["40px", { lineHeight: "44px" }],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-end": { from: { opacity: "0", transform: "translateX(24px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "live-pulse": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
        "bar-reveal": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        "toast-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "layer-in": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        rise: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "skeleton": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.45" } },
        "caret": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
        "dock-in": { from: { opacity: "0", transform: "translateY(16px) scale(0.98)" }, to: { opacity: "1", transform: "translateY(0) scale(1)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease both",
        "slide-in-end": "slide-in-end 0.32s cubic-bezier(0.22,1,0.36,1) both",
        live: "live-pulse 1.4s ease-in-out infinite",
        "toast-up": "toast-up 0.34s cubic-bezier(0.34,1.56,0.64,1) both",
        "layer-in": "layer-in 0.42s cubic-bezier(0.22,1,0.36,1) both",
        skeleton: "skeleton 1.3s ease-in-out infinite",
        rise: "rise 0.5s ease-out both",
        caret: "caret 1s step-end infinite",
        "dock-in": "dock-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
        "spin-slow": "spin-slow 3s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
