"use client";
/* WP5 lab: the agents band (§5.5). Calls notFound() in production; WP-F deletes lab/.

   Every state is reachable from the toolbar or the URL:
   - audience: the toolbar switch, or ?a=brands | ?a=creators
   - reduced motion (JS side): the toolbar's rm, or &rm=1; the CSS side needs DevTools emulation (§7.2)
   - paused: the toolbar's pause
   - &gap=1 puts a viewport of paper above the band, so it mounts below the fold (rule 2.4.7: the
     static circle tilts into the orbit on first sight). There is always a viewport of paper below it,
     so scrolling past shows the frame callback cancelled offscreen. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { AgentsBand } from "../../_site/agents/AgentsBand";

type Search = LabSearch & { gap?: string };

function Spacer({ label }: { label: string }) {
  return (
    <div className="grid h-[110svh] place-items-center">
      <span className="mono-caps text-ink/60">{label}</span>
    </div>
  );
}

export default function Page({ searchParams }: { searchParams?: Search }) {
  if (process.env.NODE_ENV === "production") notFound();
  const gap = searchParams?.gap === "1";
  return (
    <LabFrame initial={labAudience(searchParams)} title="agents" surface="paper">
      {(a) => (
        <>
          {gap && <Spacer label="scroll down: the band mounts below the fold" />}
          <div className="py-10">
            <AgentsBand key={a} audience={a} />
          </div>
          <Spacer label="offscreen: the orbit's frame callback is cancelled here" />
        </>
      )}
    </LabFrame>
  );
}
