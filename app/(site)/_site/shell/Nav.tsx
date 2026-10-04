"use client";
/* The nav (SPEC §5.0.5): a fixed glass pill that re-skins per surface. Its arrangement is CSS only,
   on data-at-hero plus breakpoints; it never calls useIsPhone() (rule 2.4.10), so the SSR HTML is
   already the phone arrangement on a phone. Centred with inset-x-0 + mx-auto, never a translate:
   the nav-in animation's fill would wipe a transform. */
import { useEffect } from "react";
import { COPY } from "../copy";
import { useAudience, useAudienceLink } from "../lib/audience";
import { setSignal, useSignal } from "../lib/signals";
import { toField } from "../lib/scroll";
import { inertProp } from "../lib/iso";
import { Wordmark } from "../ui/Wordmark";
import { AudienceSwitch } from "./AudienceSwitch";
import { PauseToggle } from "./PauseToggle";

/** One IntersectionObserver over every [data-surface], on a 1px line at the nav's centre. The deepest
    intersecting surface wins (one that contains no other intersecting surface), ties by later DOM
    order; "deep" maps to the night skin. Re-observes on every swapCommit (Swap remounts the sections). */
function useSurfaceWatch() {
  const swapCommit = useSignal("swapCommit");
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    const hits = new Set<Element>();

    const decide = () => {
      const list = Array.from(hits);
      const deepest = list.filter((el) => !list.some((o) => o !== el && el.contains(o)));
      deepest.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      const top = deepest[deepest.length - 1] as HTMLElement | undefined;
      if (!top) return;
      setSignal("surface", top.dataset.surface === "paper" ? "paper" : "night");
    };

    const build = () => {
      io?.disconnect();
      hits.clear();
      const cs = getComputedStyle(document.documentElement);
      const navTop = parseFloat(cs.getPropertyValue("--nav-top")) || 16;
      const navH = parseFloat(cs.getPropertyValue("--nav-h")) || 56;
      const line = navTop + navH / 2;
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) hits.add(e.target);
          else hits.delete(e.target);
        }
        decide();
      }, { rootMargin: `-${line}px 0px -${Math.max(0, window.innerHeight - line - 1)}px 0px` });
      document.querySelectorAll("[data-surface]").forEach((el) => io!.observe(el));
    };

    build();
    window.addEventListener("resize", build);
    return () => { window.removeEventListener("resize", build); io?.disconnect(); };
  }, [swapCommit]);
}

export function Nav() {
  const { audience } = useAudience();
  const heroSwitchVisible = useSignal("heroSwitchVisible");
  const heroFieldVisible = useSignal("heroFieldVisible");
  const closeFieldVisible = useSignal("closeFieldVisible");
  const surface = useSignal("surface");
  const home = useAudienceLink(audience, "nav");
  useSurfaceWatch();

  const startShown = !heroFieldVisible && !closeFieldVisible;
  const night = surface === "night";
  const copy = COPY[audience].nav;

  return (
    <header
      data-at-hero={heroSwitchVisible ? "true" : "false"}
      data-skin={surface}
      className={`group fixed inset-x-0 top-[var(--nav-top)] z-nav mx-auto flex h-[var(--nav-h)] w-[calc(100vw-24px)] items-center rounded-pill pe-2 ps-5 transition-[background-color,box-shadow] duration-[250ms] motion-safe:animate-nav-in dawn-fade sm:w-[min(1120px,calc(100vw-48px))] ${
        night ? "bg-[rgb(1_3_23/.62)] shadow-glass" : "bg-[rgb(252_251_248/.72)] shadow-glass-paper backdrop-blur-[20px] backdrop-saturate-[1.8]"
      }`}
    >
      <a
        {...home}
        className="flex-none rounded-pill max-md:group-data-[at-hero=false]:hidden"
        aria-label="HeyMoon.AI"
      >
        <Wordmark size="md" tone={night ? "night" : "paper"} />
      </a>

      <div className="max-md:group-data-[at-hero=true]:hidden md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 max-md:-ms-3">
        <AudienceSwitch placement="nav" surface={night ? "night" : "paper"} hidden={heroSwitchVisible} />
      </div>

      <div className="ms-auto flex items-center gap-2">
        <PauseToggle surface={night ? "night" : "paper"} />
        <a
          href={copy.dashboardHref}
          className={`inline-flex h-10 items-center rounded-pill text-small font-medium transition-colors duration-[250ms] max-md:group-data-[at-hero=false]:hidden ${
            startShown
              ? `px-2 ${night ? "text-white/72 hover:text-white" : "text-ink/72 hover:text-ink"}`
              : `px-4 ${night ? "bg-white/8 text-white/92 hover:bg-white/12" : "bg-ink text-white hover:bg-ink/85"}`
          }`}
        >
          {copy.dashboard}
        </a>
        <span
          className={`grid overflow-hidden transition-[grid-template-columns,opacity,transform] duration-200 ease-out max-md:group-data-[at-hero=true]:hidden ${
            startShown ? "grid-cols-[1fr] opacity-100" : "pointer-events-none grid-cols-[0fr] scale-[.96] opacity-0"
          }`}
          {...inertProp(!startShown)}
          aria-hidden={startShown ? undefined : true}
        >
          <button
            type="button"
            onClick={() => toField()}
            className={`h-10 min-w-0 whitespace-nowrap rounded-pill px-[18px] text-small font-semibold transition-colors duration-[250ms] ${
              night ? "bg-white text-ink hover:bg-white/90" : "bg-ink text-white hover:bg-ink/85"
            }`}
          >
            {copy.start}
          </button>
        </span>
      </div>
    </header>
  );
}
