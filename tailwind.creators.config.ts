import type { Config } from "tailwindcss";
import containerQueries from "@tailwindcss/container-queries";

/* ------------------------------------------------------------------ */
/* The design system, as tokens — read off the Figma (Moontech-INF,    */
/* page NEW UI) rather than inherited from the brands app.             */
/*                                                                     */
/* Every value here was pulled from a real node in that file with      */
/* get_design_context: the tile fill, the chip tints, the countdown    */
/* bar's alpha, the one shadow. Where the file uses an image for a     */
/* gradient (the header, the CTA) the nearest CSS gradient stands in   */
/* and says so in globals.css.                                         */
/* ------------------------------------------------------------------ */

const config: Config = {
  /* THIS SIDE ONLY, plus the switch both heroes share. The two apps
     give the same class names different values (`text-brand` is a
     colour on brands and a size on creators), so each side is built
     from its own files by its own config, which its globals.css names
     with @config. A route group's parentheses are written as
     character classes: bare they are a glob group, and Tailwind drops a
     backslash-escaped pair. */
  content: ["./app/[(]creators[)]/**/*.{js,ts,jsx,tsx,mdx}", "./app/_shared/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        /* Figtree is the file's only UI face. Numbers stay tabular. */
        sans: ["var(--font-figtree)", "system-ui", "sans-serif"],
        /* THE LANDING'S FACE, and only the landing's. The brands landing
           is set in Geist, and its -0.038em headings are tuned to it:
           Figtree sets wider and was never drawn at that tracking. The
           variable is defined by GeistSans.variable on the landing root
           in app/page.tsx, not on <html>, so the font preloads on `/`
           alone. On any other route the variable is undefined and this
           stack falls through to system-ui, which is why nothing but the
           landing root may carry `font-geist`. */
        geist: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        /* Black: #12151B. Body text runs on alpha over it. */
        ink: {
          DEFAULT: "#12151B",
          90: "rgba(0,0,0,0.9)",
          60: "rgba(0,0,0,0.6)",
          50: "rgba(0,0,0,0.5)",
          40: "rgba(0,0,0,0.4)",
        },
        /* Main: #4D2FB0, the only purple a control is painted in. */
        main: {
          DEFAULT: "#4D2FB0",
          10: "rgba(77,47,176,0.10)",
          80: "rgba(77,47,176,0.80)",
          mid: "#6848D1",
          light: "#7A47CE",
          glow: "#A65FED",
        },
        /* Surfaces. `lilac` is the stat tile and the medallion; `paper`
           the payment card and the back button. */
        lilac: "#F3EFFC",
        paper: "#FAFAFA",
        canvas: "#F6F4FC",
        /* THE LANDING'S TWO GROUNDS, from the brands landing. `ground` is
           the brands app's paper, warm rather than grey. It is a new key
           and not a new value for `paper`, because `paper` is the Figma's
           #FAFAFA and the payment card and back button still mean that.
           `deep` is the one dark: the paid panel and the agents block. */
        ground: "#FCFBF8",
        deep: "#141229",
        line: { DEFAULT: "#EBEBEB", soft: "#EEEEEE" },
        /* Semantic tints, exactly as the file mixes them. */
        orange: { DEFAULT: "#FF8400", 20: "rgba(255,132,0,0.20)" },
        green: { DEFAULT: "#25A333", 10: "rgba(37,163,51,0.10)" },
        lime: "#4FEA57",
        sun: "#FFE538",
        night: "#161722",
        amber: { DEFAULT: "#B26A00", soft: "#FFF4E5", line: "#FFE0B2" },
        danger: "#D70015",
      },
      borderRadius: {
        chip: "8px",
        inner: "12px",
        card: "16px",
        tile: "24px",
        sheet: "32px",
        pill: "100px",
      },
      boxShadow: {
        card: "0 4px 4px rgba(17,17,17,0.04)",
        /* A SIBLING OF `card`, not a replacement for it. `card`'s 4px
           float IS the Figma's phone card and eleven call sites depend
           on it. A desktop surface is a keyline plus a 1px contact
           shadow, which is what this is. */
        edge: "0 1px 2px rgba(18,21,27,0.05)",
        float: "0 8px 24px rgba(18,21,27,0.08)",
        pop: "0 24px 60px -20px rgba(18,21,27,0.35)",
        /* THE LANDING'S THREE LIFTS, copied from the brands landing to
           the digit, which is why they are cast in the brands ink
           (25,18,52) and not this app's. The `hm-` prefix keeps them
           apart from the Figma's shadows above: the field sits highest,
           a card lower, and a product likeness inside a card lowest. */
        "hm-field": "0 2px 4px rgba(25,18,52,0.04), 0 20px 44px -18px rgba(25,18,52,0.22), 0 56px 90px -48px rgba(25,18,52,0.30)",
        "hm-card": "0 1px 2px rgba(25,18,52,0.04), 0 24px 48px -32px rgba(25,18,52,0.22)",
        "hm-mock": "0 2px 4px rgba(25,18,52,0.05), 0 20px 40px -16px rgba(25,18,52,0.22)",
      },
      /* AN ALPHA HAIRLINE, because `line` is opaque #EBEBEB and is
         visibly wrong the moment it sits on lilac, canvas or amber —
         which is why three improvised black alphas were already in the
         tree. 0.07 of this app's own ink. Extending `borderColor` also
         generates `divide-hairline`, since Tailwind's divideColor
         defaults to it. */
      borderColor: { hairline: "rgba(18,21,27,0.07)" },
      fontSize: {
        /* The file's scale, named. */
        tiny: ["10px", { lineHeight: "14px" }],
        /* The tracked micro-label. A NEW key rather than tracking added
           to `brand`, which has forty-odd untracked call sites. */
        eyebrow: ["11px", { lineHeight: "14px", letterSpacing: "0.08em" }],
        brand: ["11px", { lineHeight: "16px" }],
        meta: ["12px", { lineHeight: "16px" }],
        body: ["14px", { lineHeight: "20px" }],
        row: ["16px", { lineHeight: "22px" }],
        /* THE DESKTOP REGISTER'S TWO STEPS, and the scale is closed at
           these. Desktop rank is added ABOVE and BELOW the 14px body,
           never by shrinking it: `body` is the Figma's reading size at
           every width. A 20px head over 14px body is a phone's ratio. */
        head: ["17px", { lineHeight: "24px" }],
        greet: ["18px", { lineHeight: "24px" }],
        section: ["20px", { lineHeight: "26px" }],
        title: ["24px", { lineHeight: "30px" }],
        /* THE TERMS FIGURE: the share on the join card (AcceptBlock),
           the one number a creator agrees to. blocks.tsx used this key
           before it existed, so the share was drawn at its parent's 14px.
           The size is the one the landing's likeness of that card
           (MockTerms) was drawn at while the key was missing. */
        display: ["30px", { lineHeight: "30px", letterSpacing: "-0.03em" }],
        hero: ["40px", { lineHeight: "44px" }],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-end": { from: { opacity: "0", transform: "translateX(24px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "sheet-up": { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "live-pulse": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
        skeleton: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.45" } },
        caret: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "layer-in": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        /* The landing's load-in, as brands has it. Every use is behind
           `motion-safe:`, so a reduced-motion visitor never sees it. */
        rise: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease both",
        "slide-in-end": "slide-in-end 0.32s cubic-bezier(0.22,1,0.36,1) both",
        "sheet-up": "sheet-up 0.32s cubic-bezier(0.22,1,0.36,1) both",
        live: "live-pulse 1.4s ease-in-out infinite",
        skeleton: "skeleton 1.3s ease-in-out infinite",
        caret: "caret 1s step-end infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        "layer-in": "layer-in 0.42s cubic-bezier(0.22,1,0.36,1) both",
        /* `both` so the element holds at opacity 0 through its stagger
           delay rather than showing, vanishing and rising. */
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  /* CONTAINER QUERIES, for the conversation. A thread block's layout
     has to follow the width the THREAD has, and that depends on whether
     the panel is open — at 768px with the panel beside it the chat is
     361px, narrower than a phone once a card's gutter comes back. A
     viewport breakpoint cannot see that; `@container` can. */
  plugins: [containerQueries],
};
export default config;
