import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Figtree, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { DirSync } from "./brands/components/DirSync";

/* IBM Plex Sans Arabic, loaded the same way Geist is so nothing is
   fetched from a third-party origin at run time. It fills the
   `--font-ar` slot that globals.css has always pointed at and that
   nothing had ever defined, so until now the Arabic build fell through
   to Geist.

   There is no display serif. One was added for an editorial cut of the
   landing page and removed with it: headings are the interface
   grotesque, which is what makes the page read as software. */
/* Figtree, the creator app's only UI face, adopted here so the two
   products read as one. It is the interface face everywhere inside the
   app: the conversation, the dashboard, every panel.

   Geist stays, and stays only on the landing. That page's headings are
   tuned to it at -0.038em, and Figtree sets wider and was never drawn
   at that tracking. The creator app carries the same pair for the same
   reason, in the same direction: its app is Figtree, its landing keeps
   the brands landing's Geist. */
const figtree = Figtree({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500"],
  subsets: ["arabic"],
  variable: "--font-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HeyMoon.AI",
  description:
    "Paste your store link. HeyMoon builds a complete creator campaign around what you sell, and guarantees the sales.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${figtree.variable} ${GeistSans.variable} ${arabic.variable}`}>
      <body className="font-sans antialiased">
        <DirSync />
        {children}
      </body>
    </html>
  );
}
