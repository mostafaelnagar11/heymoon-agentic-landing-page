import localFont from "next/font/local";

/* The logo's face (Mostafa, 6 Oct: "use sora"), for both product apps: Sora
   SemiBold, cut down to the ten glyphs of "HeyMoon.AI" (1.2 kB, from Google
   Fonts' text= subset; SIL Open Font Licence). The landing loads its own copy
   (app/(site)/layout.tsx), since the site never imports product code.

   `block` and preloaded, so the wordmark never paints in the interface face
   first and then jumps. Each app's `font-logo` stack falls through to the
   interface face for any glyph the subset lacks. */
export const logoFont = localFont({
  src: "./fonts/Sora-SemiBold-HeyMoon.woff2",
  variable: "--font-logo",
  weight: "600",
  display: "block",
  adjustFontFallback: false,
});
