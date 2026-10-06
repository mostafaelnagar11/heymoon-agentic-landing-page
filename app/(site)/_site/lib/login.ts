/* The login dialog's open state, apart from the dialog itself: the nav and the footer (first load) only need to
   open it, and the dialog (login/LoginDialog.tsx) arrives later through next/dynamic. A tiny external store. */
import { useSyncExternalStore } from "react";

let open = false;
let opener: HTMLElement | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function openLogin(from?: HTMLElement | null): void {
  opener = from ?? (document.activeElement as HTMLElement | null);
  open = true;
  emit();
}
export function closeLogin(): void {
  open = false;
  emit();
  opener?.focus?.();
}
export const useLoginOpen = (): boolean =>
  useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => open, () => false);

/** Where the site hands a verified number to the creators app (/creators/login reads it once, then signs in). */
export const LOGIN_HANDOFF_KEY = "hm_site_login";
