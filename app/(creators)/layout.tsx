import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { logoFont } from "../_shared/logoFont";

/* Figtree is the Figma's only UI face — every text node in the file
   is Figtree Regular, Medium, SemiBold or Bold. Loaded through
   next/font so nothing is fetched from a third-party origin at run
   time, and so the digits in every card render in the same face the
   design was drawn in. */
const figtree = Figtree({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HeyMoon.AI for creators",
  description:
    "Paste your handle. HeyMoon tells you which live campaigns want somebody like you, and each one pays you a share of the orders your posts bring in.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${figtree.variable} ${logoFont.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
