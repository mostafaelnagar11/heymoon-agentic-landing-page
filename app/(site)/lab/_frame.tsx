"use client";
/* LabFrame (WP0): the dev harness every /lab/<wp> page renders inside. A toolbar with the real
   audience switch, the reduced-motion toggle (?rm=1 forces the JS side; use DevTools > Rendering for
   the CSS side, §7.2) and the global pause. The switch keeps the lab URL (?a=) instead of rewriting
   the path. Every lab page calls notFound() in production; WP-F deletes lab/. */
import type { MouseEvent, ReactNode } from "react";
import type { Audience } from "../_site/data/types";
import { AudienceProvider, useAudience, useDeferredAudience } from "../_site/lib/audience";
import { PlaybackProvider } from "../_site/lib/playback";
import { useReducedMotionPref } from "../_site/lib/prefs";
import { AudienceSwitch } from "../_site/shell/AudienceSwitch";
import { PauseToggle } from "../_site/shell/PauseToggle";
import { SrStatus } from "../_site/ui/SrStatus";

export type LabSearch = { a?: string; rm?: string };
export const labAudience = (q: LabSearch | undefined): Audience => (q?.a === "creators" ? "creators" : "brands");

function Toolbar({ title }: { title: string }) {
  const { audience } = useAudience();
  const reduced = useReducedMotionPref();
  /* Reload with ?rm toggled (motion's MotionConfig and the JS prefs read it at load). */
  const toggleRm = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const q = new URLSearchParams(window.location.search);
    if (q.get("rm") === "1") q.delete("rm"); else q.set("rm", "1");
    q.set("a", audience);
    window.location.search = q.toString();
  };
  return (
    <div className="fixed inset-x-2 top-2 z-[80] flex h-14 items-center gap-3 rounded-pill bg-night-0/90 pe-2 ps-5 text-white shadow-glass">
      <span className="mono-caps text-white/72">lab / {title}</span>
      <span className="ms-auto" />
      <AudienceSwitch placement="nav" surface="night" />
      <a href="?rm=1" onClick={toggleRm} className="mono-caps rounded-pill bg-white/8 px-3 py-2 text-white/72 hover:text-white">
        rm {reduced ? "on" : "off"}
      </a>
      <PauseToggle surface="night" />
    </div>
  );
}

function Body({ children }: { children: (a: Audience) => ReactNode }) {
  const deferred = useDeferredAudience();
  return <>{children(deferred)}</>;
}

export function LabFrame({ initial, title, children, surface = "night" }: {
  initial: Audience; title: string; children: (a: Audience) => ReactNode; surface?: "night" | "paper";
}) {
  return (
    <AudienceProvider initial={initial} syncUrl={false}>
      <PlaybackProvider>
        <div className={`landing-root relative isolate min-h-svh pt-20 ${surface === "night" ? "bg-night-1 text-white" : "bg-paper text-ink"}`}>
          <Toolbar title={title} />
          <Body>{children}</Body>
          <SrStatus />
        </div>
      </PlaybackProvider>
    </AudienceProvider>
  );
}
