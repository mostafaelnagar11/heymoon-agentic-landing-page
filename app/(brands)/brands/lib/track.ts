/* HeyMoon.ai behaviour events (PRD v0.2, Tracking, Layer 2).

   UX analytics only: business results come from Orbit's ledger, never from these. Each event is keyed to the brand
   and campaign so the two layers read side by side. The prototype has no tool-event-tracking client, so events go to
   the console and to `window.__hm`, where the data team can check the names and properties against their plan. */

export type HmEvent =
  | "hm_step_viewed"
  | "hm_button_clicked"
  | "hm_platform_redirect"
  | "hm_brief_change_requested"
  | "hm_file_uploaded"
  | "hm_tracker_viewed"
  | "hm_help_requested"
  | "hm_error_shown"
  | "hm_language_switched";

export function track(event: HmEvent, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const e = { event, at: Date.now(), ...props };
  const w = window as unknown as { __hm?: unknown[] };
  (w.__hm ??= []).push(e);
  console.info("[hm]", event, props);
}
