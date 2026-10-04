"use client";
/* WP6 lab: Connects, the close and the footer, in page order. Calls notFound() in production; WP-F
   deletes lab/.
   - The toolbar (LabFrame) switches the audience (?a=), forces the JS side of reduced motion (?rm=1)
     and pauses playback. For the CSS side of reduced motion use DevTools > Rendering.
   - The paper block stands in for the end of the sheet: the close slides 32px under its rounded
     bottom, as on the page, and its content renders through the real <Swap>, so a switch at the close
     exercises the same anchor restore as the Landing. The lead-in is taller for brands (120svh) than
     for creators (100svh), so every switch changes the height above the close, as the real sections
     do. ?spacer=0 drops it, so Connects and the close are in view at mount (the static-by-default
     path); with it, both are armed and play on entry.
   - "Dawn" runs the S8 fade (startDawn/resetDawn) without submitting, so the close and the footer
     area can be checked going light. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { Swap, useWorld } from "../../_site/lib/audience";
import { Connects } from "../../_site/close/Connects";
import { Close } from "../../_site/close/Close";
import { Footer } from "../../_site/close/Footer";

function DawnToggle() {
  const { startDawn, resetDawn } = useWorld();
  const toggle = () => {
    const root = document.querySelector(".landing-root");
    if (root?.hasAttribute("data-dawn")) resetDawn();
    else void startDawn();
  };
  return (
    <button
      type="button"
      onClick={toggle}
      data-lab-dawn=""
      className="mono-caps fixed bottom-4 start-4 z-[80] h-9 rounded-pill bg-night-0/90 px-4 text-white/72 shadow-glass hover:text-white"
    >
      Dawn
    </button>
  );
}

export default function Page({ searchParams }: { searchParams?: LabSearch & { spacer?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  const spacer = searchParams?.spacer !== "0";
  return (
    <LabFrame initial={labAudience(searchParams)} title="close" surface="paper">
      {() => (
        <>
          <div data-surface="paper" className="relative z-sheet rounded-b-sheet bg-paper pb-8 max-sm:rounded-b-[28px]">
            <Swap>{(a) => (
              <>
                {spacer && (
                  <div data-lab-spacer="" className={`mx-auto grid max-w-text place-items-center px-[var(--gutter)] ${a === "brands" ? "h-[120svh]" : "h-[100svh]"}`}>
                    <p className="mono-caps text-ink/60">The sheet · scroll to the close</p>
                  </div>
                )}
                <Connects audience={a} />
              </>
            )}</Swap>
          </div>
          <Close />
          <Footer />
          <DawnToggle />
        </>
      )}
    </LabFrame>
  );
}
