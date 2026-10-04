"use client";
/* WP4 lab: the number section in every state. Calls notFound() in production; WP-F deletes lab/.
   ?a=brands|creators   audience (the toolbar switch flips it in place)
   ?rm=1                the JS side of reduced motion (toolbar "rm"); DevTools emulation for the CSS side
   ?at=below (default)  a viewport of paper above the section, so it mounts below the fold and plays on entry
   ?at=top              the section mounts in view, so it must stay final (rule 2.4.7)
   Pause is in the toolbar. "Replay" remounts the section below the fold and scrolls it in. */
import { notFound } from "next/navigation";
import { useState } from "react";
import type { Audience } from "../../_site/data/types";
import { scrollToY, yFor } from "../../_site/lib/scroll";
import { NumberSection } from "../../_site/number/NumberSection";
import { LabFrame, labAudience, type LabSearch } from "../_frame";

type Search = LabSearch & { at?: string };

export default function Page({ searchParams }: { searchParams?: Search }) {
  if (process.env.NODE_ENV === "production") notFound();
  const at = searchParams?.at === "top" ? "top" : "below";
  return (
    <LabFrame initial={labAudience(searchParams)} title="number" surface="paper">
      {(a) => <Lab audience={a} at={at} rm={searchParams?.rm === "1"} />}
    </LabFrame>
  );
}

function Lab({ audience, at, rm }: { audience: Audience; at: "top" | "below"; rm: boolean }) {
  const [nonce, setNonce] = useState(0);
  const [below, setBelow] = useState(at === "below");

  const replay = () => {
    setBelow(true);
    scrollToY(0, { immediate: true });
    setNonce((v) => v + 1);
    /* Two frames: the remount commits below the fold and arms, then the scroll brings it in. */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.querySelector("[data-slot='number']");
      if (el) scrollToY(yFor(el, 40), { duration: 1.6 });
    }));
  };

  const atHref = (v: "top" | "below") => `?a=${audience}${rm ? "&rm=1" : ""}${v === "top" ? "&at=top" : ""}`;

  return (
    <>
      <div className="fixed bottom-3 start-1/2 z-[80] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-pill bg-night-0/90 p-1 text-white shadow-glass rtl:translate-x-1/2">
        <button type="button" onClick={replay} className="mono-caps rounded-pill bg-white px-3 py-2 text-ink">Replay</button>
        <a href={atHref("below")} className={`mono-caps rounded-pill px-3 py-2 ${at === "below" ? "bg-white/14 text-white" : "text-white/72 hover:text-white"}`}>Below</a>
        <a href={atHref("top")} className={`mono-caps rounded-pill px-3 py-2 ${at === "top" ? "bg-white/14 text-white" : "text-white/72 hover:text-white"}`}>In view</a>
      </div>

      {below && (
        <div className="grid h-[calc(100svh-80px)] place-items-center">
          <p className="mono-caps text-ink/60">Scroll: the section mounted below the fold and plays on entry</p>
        </div>
      )}
      <NumberSection key={`${audience}:${nonce}`} audience={audience} />
      <div className="h-[50svh]" />
    </>
  );
}
