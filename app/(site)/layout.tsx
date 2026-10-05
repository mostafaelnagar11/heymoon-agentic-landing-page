import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import { Providers } from "./_site/lib/providers";
import { COPY } from "./_site/copy";
import "./globals.css";

const mono = localFont({
  src: "./_site/fonts/GeistMono-Variable.woff2", variable: "--font-geist-mono", weight: "100 900",
  preload: false, display: "swap", adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
export const metadata: Metadata = { title: "HeyMoon.AI", description: COPY.shared.metaDescription };
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${GeistSans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        {/* No JS (final round): nothing animates that Pause could stop, so the button goes. The nav cannot
            re-skin without JS, so its night glass turns nearly opaque: a solid night pill over the paper
            sections instead of a grey see-through one. No ">" or quotes: React escapes style text. */}
        <noscript><style>{"[data-pause]{display:none}.nav-glass [data-kind=night]{background:rgb(1 3 23/.94)}"}</style></noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
