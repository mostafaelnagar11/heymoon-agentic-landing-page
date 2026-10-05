"use client";
/* The nav (SPEC §5.0.5): a fixed glass pill that re-skins per surface. Its arrangement is CSS only,
   on data-at-hero plus breakpoints; it never calls useIsPhone() (rule 2.4.10), so the SSR HTML is
   already the phone arrangement on a phone. Centred with inset-x-0 + mx-auto, never a translate:
   the nav-in animation's fill would wipe a transform. */
import { useEffect, useRef, useState, type RefObject } from "react";
import { COPY } from "../copy";
import { useAudience, useAudienceLink } from "../lib/audience";
import { els, setSignal, useSignal } from "../lib/signals";
import { toField } from "../lib/scroll";
import { inertProp } from "../lib/iso";
import { Wordmark } from "../ui/Wordmark";
import { AudienceSwitch } from "./AudienceSwitch";
import { PauseToggle } from "./PauseToggle";

type Kind = "night" | "deep" | "paper";
const kindOf = (el: Element | null): Kind | null => {
  const k = (el as HTMLElement | null)?.dataset.surface;
  return k === "night" || k === "deep" || k === "paper" ? k : null;
};

/** The pill's surface (SPEC §5.0.5, fix round). Two parts, both read from what is PAINTED under the pill:
    a hit test at the centre x (the first [data-surface] under the point, outside the nav), not DOM order,
    so where the sheet's rounded bottom overlaps the close (§5.6's -mt-8) the sheet wins (WP6 R6).
    - The GLASS follows the pill's rows: if the top and bottom rows sit on different kinds, a 7-step
      bisection finds the edge (under 0.5px) and the glass splits there, with an 8px feathered seam
      (polish round: a hard split read as a line through the pill). The part over the night sky stays
      night (no blur over the canvas, ruling 6); the part over a deep band or paper gets its own blurred
      skin. So the pill is never a grey mix of two skins while a sheet edge passes under it.
    - The TEXT skin (the "surface" signal) is the kind at the pill's centre line.
    The same pass sets data-yield while the close field sits under the pill (see measure()).
    It measures on scroll (one rAF per frame: two hit tests, nine while an edge is inside the pill), when
    a surface crosses the pill's band (IntersectionObserver, for layout that moves without a scroll), when
    a content-visibility section renders its contents, on resize, and after every swapCommit (Swap
    remounts the sections). */
function useSurfaceWatch(navRef: RefObject<HTMLElement>, aRef: RefObject<HTMLSpanElement>, bRef: RefObject<HTMLSpanElement>) {
  const swapCommit = useSignal("swapCommit");
  useEffect(() => {
    const nav = navRef.current, a = aRef.current, b = bRef.current;
    if (!nav || !a || !b) return;
    let io: IntersectionObserver | null = null;
    let top = 16, h = 56, raf = 0, shown = "";

    const kindAt = (y: number): Kind | null => {
      for (const el of document.elementsFromPoint(window.innerWidth / 2, y)) {
        if (nav.contains(el)) continue;
        const k = kindOf(el.closest("[data-surface]"));
        if (k) return k;
      }
      return null;
    };

    const measure = () => {
      raf = 0;
      const y0 = top + 0.5, y1 = top + h - 0.5;
      const kt = kindAt(y0) ?? kindAt(y1) ?? "night";
      const kb = kindAt(y1) ?? kt;
      let split = h;
      if (kt !== kb) {
        let lo = y0, hi = y1;
        for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; if (kindAt(mid) === kt) lo = mid; else hi = mid; }
        split = (lo + hi) / 2 - top;
      }
      const key = `${kt}|${kb}|${split.toFixed(1)}`;
      if (key !== shown) {
        shown = key;
        a.dataset.kind = kt;
        b.dataset.kind = kt === kb ? "" : kb;
        /* The glass's parts overlap across the split and feather into each other there (globals
           .nav-glass[data-split]), so a still frame shows a soft seam, not a hard line through the pill. */
        const glass = a.parentElement;
        if (glass) {
          glass.style.setProperty("--split", `${split}px`);
          glass.toggleAttribute("data-split", kt !== kb);
        }
      }
      const centre = split > h / 2 ? kt : kb;
      setSignal("surface", centre === "paper" ? "paper" : "night");
      /* The yield (final round): where a short screen leaves the close field resting under the pill at
         max scroll, the nav fades out of its way, so a tap on the field's Start never lands on Pause or
         Dashboard. close.module.css already lifts the field clear on short landscape screens; this is
         the net for any screen it misses. */
      const cf = els.closeField?.getBoundingClientRect();
      nav.toggleAttribute("data-yield", !!cf && cf.height > 0 && cf.top < top + h + 8 && cf.bottom > top);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };

    const build = () => {
      io?.disconnect();
      const cs = getComputedStyle(document.documentElement);
      top = parseFloat(cs.getPropertyValue("--nav-top")) || 16;
      h = parseFloat(cs.getPropertyValue("--nav-h")) || 56;
      if (typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver(schedule, { rootMargin: `-${top}px 0px -${Math.max(0, window.innerHeight - top - h)}px 0px` });
        document.querySelectorAll("[data-surface]").forEach((el) => io!.observe(el));
      }
      schedule();
    };

    build();
    window.addEventListener("resize", build);
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("contentvisibilityautostatechange", schedule, true);
    return () => {
      window.removeEventListener("resize", build);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("contentvisibilityautostatechange", schedule, true);
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [swapCommit, navRef, aRef, bRef]);
}

export function Nav() {
  const { audience } = useAudience();
  const heroSwitchVisible = useSignal("heroSwitchVisible");
  const closeSwitchVisible = useSignal("closeSwitchVisible");
  const heroFieldVisible = useSignal("heroFieldVisible");
  const closeFieldVisible = useSignal("closeFieldVisible");
  const surface = useSignal("surface");
  const home = useAudienceLink(audience, "nav");
  const navRef = useRef<HTMLElement>(null);
  const glassA = useRef<HTMLSpanElement>(null);
  const glassB = useRef<HTMLSpanElement>(null);
  useSurfaceWatch(navRef, glassA, glassB);
  /* nav-in fills `both`, and while a filled opacity animation is attached Chrome makes the header a
     backdrop root: the glass's backdrop-filter then sees nothing behind the nav and never blurs (measured:
     crisp section type through the paper glass). The class goes once the entrance has finished; the end
     keyframe equals the base style (opacity 1, no transform), so nothing moves. */
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof el.getAnimations !== "function") return;
    let live = true;
    const done = () => { if (live) setEntered(true); };
    Promise.all(el.getAnimations().map((x) => x.finished)).then(done, done);
    return () => { live = false; };
  }, []);

  const startShown = !heroFieldVisible && !closeFieldVisible;
  /* A big switch (the hero's or the close's) is on screen: the nav keeps quiet. Desktop hides its own
     switch; below md it takes the hero arrangement (Wordmark, Pause, Dashboard), at the close too, so
     the pill never empties down to a lone Pause there (final round). */
  const quiet = heroSwitchVisible || closeSwitchVisible;
  const night = surface === "night";
  const copy = COPY[audience].nav;

  return (
    <header
      ref={navRef}
      data-at-hero={quiet ? "true" : "false"}
      data-skin={surface}
      className={`group fixed inset-x-0 top-[var(--nav-top)] z-nav mx-auto flex h-[var(--nav-h)] w-[calc(min(1120px,100%)_-_2*var(--gutter))] items-center rounded-pill pe-2 ps-5 transition-[box-shadow,opacity,visibility] duration-[250ms] data-[yield]:pointer-events-none data-[yield]:invisible data-[yield]:opacity-0 ${entered ? "" : "motion-safe:animate-nav-in"} dawn-fade ${
        night ? "shadow-[0_12px_32px_-12px_rgba(0,0,0,.6)]" : "shadow-[0_8px_24px_-12px_rgba(25,18,52,.18)]"
      }`}
    >
      {/* The glass (globals .nav-glass): A is the part above the split, B the part below it. Server: one
          night part, which is what sits under the nav at the top of every page. */}
      <span aria-hidden className="nav-glass">
        <span ref={glassA} data-kind="night" />
        <span ref={glassB} data-kind="" />
      </span>
      <a
        {...home}
        className="flex-none rounded-pill max-md:group-data-[at-hero=false]:hidden"
        aria-label="HeyMoon.AI"
      >
        <Wordmark size="md" tone={night ? "night" : "paper"} />
      </a>

      <div className="max-md:group-data-[at-hero=true]:hidden md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 max-md:-ms-3">
        {/* Hidden while the hero's switch or the close's is on screen: one switch at a time (WP6 R5). Each
            big switch reports itself, up to the line where its tuck starts (AudienceSwitch), so the
            handoff holds both ways: in as the close switch comes up, back as it tucks under the pill. */}
        <AudienceSwitch placement="nav" surface={night ? "night" : "paper"} hidden={quiet} />
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
