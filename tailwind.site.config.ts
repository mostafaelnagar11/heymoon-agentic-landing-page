import type { Config } from "tailwindcss";

/* The redesigned marketing site's own tokens. It sits beside the two
   product apps rather than on top of either, because their configs give
   the same class names different values; see tailwind.brands.config.ts.
   The site group's globals.css selects this file with @config. */
const config: Config = {
  content: ["./app/[(]site[)]/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
