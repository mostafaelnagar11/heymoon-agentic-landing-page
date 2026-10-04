"use client";
/* STUB (WP0). WP6 replaces the body (§5.6): the footer row and the giant dotted wordmark. Keep the
   export name and props (FooterProps). The footer fades with the dawn (dawn-fade). */
import type { FooterProps } from "../contracts";

export function Footer({}: FooterProps) {
  return (
    <footer data-surface="night" data-stub="Footer" className="dawn-fade bg-night-0">
      <div className="mx-auto flex h-16 max-w-text items-center px-[var(--gutter)]">
        <div className="grid place-items-center rounded-[20px] border border-dashed border-white/16 mono-caps text-white/56 h-10 w-full">Footer</div>
      </div>
      <div className="h-[calc(26vw*.8*.62)] sm:h-[calc(22vw*.8*.62)]" />
    </footer>
  );
}
