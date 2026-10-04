"use client";
/* STUB (WP0). WP1 replaces the body with the CSS odometer morph (§5.1.2). The stub is a static h1,
   so the page carries exactly one <h1> with the audience's sentence. */
import { COPY } from "../copy";
import { useAudience } from "../lib/audience";

export function Headline() {
  const { audience } = useAudience();
  const h1 = COPY[audience].h1;
  return (
    <div data-stub="Headline" className="dawn-fade">
      <h1 id="hero-h1" className="text-center text-display-1 font-book text-white/[.96]">
        <span className="sr-only">{h1.sentence}</span>
        <span aria-hidden className="hidden sm:block">
          {h1.desktop.map((line, i) => (
            <span key={i} className={`block ${i === h1.gradDesktop ? "grad-text-night" : ""}`}>{line}</span>
          ))}
        </span>
        <span aria-hidden className="sm:hidden">
          {h1.phone.map((line, i) => (
            <span key={i} className={`block ${i === h1.gradPhone ? "grad-text-night" : ""}`}>{line}</span>
          ))}
        </span>
      </h1>
    </div>
  );
}
