"use client";
/* Landing v0 (WP0, SPEC §4.5). WP-F owns the final.
 *
 * THE FIRST LOAD IS THE HERO. Lead ruling, 4 Oct (WP0-NOTES, "Budget
 * ruling"): framework and motion + lenis already take 128 kB of the
 * 160 kB first load, so everything below the hero arrives through
 * next/dynamic. It is still server-rendered: next/dynamic in the app
 * router emits the chunk's stylesheet links in the static HTML, so the
 * sections paint styled and in their final state before their JS lands,
 * and hydrate when it does. React.lazy would not do that, which is why
 * it is next/dynamic and not lazy(). measure.cjs budgets and deny-scans
 * these chunks together ("lazy site chunks"). */
import { Suspense, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { Audience } from "./data/types";
import { AudienceProvider, Swap } from "./lib/audience";
import { PlaybackProvider } from "./lib/playback";
import { LiftProvider } from "./lib/lift";
import { SkipLink } from "./shell/SkipLink";
import { Nav } from "./shell/Nav";
import { LiftTrack, Sheet } from "./shell/Lift";
import { SrStatus } from "./ui/SrStatus";
import { Hero } from "./hero/Hero";

const WorkSection = dynamic(() => import("./window/WorkSection").then((m) => m.WorkSection));
const RunStage = dynamic(() => import("./run/RunStage").then((m) => m.RunStage));
const NumberSection = dynamic(() => import("./number/NumberSection").then((m) => m.NumberSection));
const AgentsBand = dynamic(() => import("./agents/AgentsBand").then((m) => m.AgentsBand));
const Connects = dynamic(() => import("./close/Connects").then((m) => m.Connects));
const Close = dynamic(() => import("./close/Close").then((m) => m.Close));
const Footer = dynamic(() => import("./close/Footer").then((m) => m.Footer));
/* Client-only: the launcher shows after 4s or a first scroll and does nothing without JS, so its markup
   and its stylesheet stay off the first paint (lead ruling 5 Oct, the CSS budget). */
const Promo = dynamic(() => import("./promo/Promo").then((m) => m.Promo), { ssr: false });
/* The login dialog (lib/login.ts opens it): client-only, off the first load. */
const LoginDialog = dynamic(() => import("./login/LoginDialog").then((m) => m.LoginDialog), { ssr: false });

/** div.landing-root: data-dawn is set by startDawn(); relative; isolate. */
function LandingRoot({ children }: { children: ReactNode }) {
  return <div className="landing-root relative isolate">{children}</div>;
}

export function Landing({ initial }: { initial: Audience }) {
  return (
    <AudienceProvider initial={initial}>
      <PlaybackProvider>
        <LandingRoot>
          <SkipLink />
          <Nav />
          {/* Right after the nav in the DOM (final round): fixed and z-promo, so nothing moves on screen, but
              Tab now meets the launcher after the nav's controls and before main. After the footer it came
              last, when the close field was in view and the launcher hidden and inert, so the keyboard
              never reached it. The skip link still jumps past it, and it stays out of the Tab order while
              hidden. */}
          <Promo />
          <LoginDialog />
          <main id="main" tabIndex={-1} className="outline-none">
            <LiftProvider /* owns heroExit: LiftTrack AND Sheet must both be inside it */>
              <LiftTrack>
                <Hero />
              </LiftTrack>
              <Sheet>
                <Swap>{(a) => (
                  <>
                    <Suspense fallback={null}><WorkSection audience={a} /></Suspense>
                    <Suspense fallback={null}><RunStage audience={a} /></Suspense>
                    <Suspense fallback={null}><NumberSection audience={a} /></Suspense>
                    <Suspense fallback={null}><AgentsBand audience={a} /></Suspense>
                    <Suspense fallback={null}><Connects audience={a} /></Suspense>
                  </>
                )}</Swap>
              </Sheet>
            </LiftProvider>
            <Close />
          </main>
          <Footer /* dawn-fade */ />
          <SrStatus />
        </LandingRoot>
      </PlaybackProvider>
    </AudienceProvider>
  );
}
