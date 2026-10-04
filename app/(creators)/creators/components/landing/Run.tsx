"use client";

/* How a creator gets from a handle to a live post, as four steps that
 * advance on their own.
 *
 * Ported from the brands landing's Run, so the two pages move the same
 * way. The list on one side, one picture of the product on the other,
 * and a gradient rule under the open step that fills as its time runs
 * out. The rule is the honest part of the pattern: a panel that changes
 * by itself with nothing to explain why feels broken, and a progress bar
 * that is really the timer tells the reader exactly what is happening
 * and how long they have.
 *
 * It only advances while it is on screen, the tab is visible, nobody is
 * pointing at it and nothing inside it has keyboard focus. Pressing a
 * step takes it over and the timer stops, because a reader who has
 * chosen a step is reading it. Under prefers-reduced-motion it never
 * advances at all: the first step is open, and the other three are one
 * press away.
 *
 * TWO BEHAVIOURAL CHANGES FROM BRANDS. There, a single `running` flag
 * was set by the observer and by the pointer alike, and leaving the Run
 * always set it back to true. So a reader with reduced motion who moved
 * the pointer across it started the timer, and so did anyone whose
 * pointer left while the Run was mostly off screen. Here the reasons to
 * stand still are kept apart and only combined at render: in view, not
 * hovered, not focused, not reduced. Focus is the second change: on
 * brands a keyboard or screen-reader user tabbing through the steps
 * had the open step, its aria-expanded and the credit change under them
 * every seven seconds. Brands needs both fixes on its own.
 *
 * Each step's name is its number and title only. The body sits inside
 * the button, and a collapsed body hidden by opacity and a zero row is
 * still in the accessibility tree, so without this every closed step
 * read out its whole description and then "collapsed". The open body is
 * the button's description instead.
 *
 * The credit line's label comes in as a prop because this app has no
 * i18n yet. The creators page passes "Done by", since the creator does
 * one step alone and part of two others.
 */

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "../../lib/useReveal";

const STEP_MS = 7000;

export interface Step {
  key: string;
  title: string;
  body: string;
  agent: string;
  /* A function when the panel has to know it is the open one: the read,
     the matches and the check stream in, and a stream that ran while
     its step was hidden would be over before anyone saw it. */
  panel: React.ReactNode | ((active: boolean) => React.ReactNode);
}

export function Run({ steps, creditLabel = "Agents" }: { steps: Step[]; creditLabel?: string }) {
  const [at, setAt] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [taken, setTaken] = useState(false);
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const uid = useId();

  /* Only while it is on screen. The observer keeps reporting for as
     long as the Run is mounted, so scrolling away and back picks the
     timer up again. It runs for every reader: the reduced-motion case
     is `reduced` below, which also follows the setting if it changes
     while the page is open. */
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = inView && !hovered && !focusIn && !reduced;
  const live = running && !taken;

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setAt((n) => (n + 1) % steps.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [live, steps.length]);

  return (
    <div
      ref={box}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusIn(true)}
      /* Only when focus leaves the Run, not when it moves from one step
         to the next inside it. */
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false); }}
      className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
    >
      <ol className="order-last lg:order-first">
        {steps.map((s, i) => {
          const open = i === at;
          return (
            <li key={s.key} className="border-t border-ink/[0.09] last:border-b">
              <button
                type="button"
                onClick={() => { setAt(i); setTaken(true); }}
                aria-expanded={open}
                aria-labelledby={`${uid}-${i}-t`}
                aria-describedby={open ? `${uid}-${i}-b` : undefined}
                className="w-full py-5 text-start"
              >
                {/* A closed step is dimmed to ink/60 and no further, the
                    AA floor on this ground; brands' ink/30 and ink/45
                    read at 2 and 3 to 1. */}
                <span id={`${uid}-${i}-t`} className="flex items-baseline gap-3">
                  {/* `main`, not `brand`: in this app `brand` is the
                      11px type size, and a colour class that names it
                      paints nothing. */}
                  <span className={`num text-[12px] font-semibold ${open ? "text-main" : "text-ink/60"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-[17px] font-semibold tracking-[-0.02em] transition-colors ${open ? "text-ink" : "text-ink/60"}`}>
                    {s.title}
                  </span>
                </span>
                {/* The body and the timer belong to the open step only.
                    A grid that animates to zero height keeps the rows
                    from jumping as the panel changes. */}
                <span
                  aria-hidden={open ? undefined : true}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <span className="overflow-hidden">
                    {/* The indent belongs to the group, not to the
                        track: padding on the track itself pushed the
                        fill in by 26px and the bar started short. */}
                    <span className="block ps-[26px]">
                    <span id={`${uid}-${i}-b`} className="mt-2.5 block max-w-[46ch] text-[15px] leading-[1.6] text-ink/60">{s.body}</span>
                    <span className="mt-4 block h-[2px] w-full rounded-full bg-ink/[0.07]">
                      {/* `run-timer` is what the reduced-motion rule in
                          globals.css holds full. Brands held every
                          `.hm-grad-rule` full instead, which also
                          stretched the short signature rules. */}
                      <span
                        key={`${s.key}-${at}-${live}`}
                        className="hm-grad-rule run-timer block h-full rounded-full"
                        style={
                          live
                            ? { animation: `run-fill ${STEP_MS}ms linear forwards` }
                            : { width: "100%" }
                        }
                      />
                    </span>
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        <li className="pt-5 text-[13px] text-ink/60">
          {creditLabel} · <span className="text-ink/80">{steps[at].agent}</span>
        </li>
      </ol>

      {/* The panel. One media surface, the mock inside it swapped with
          the step, so the eye has somewhere fixed to look. */}
      <div className="hm-media relative h-[340px] overflow-hidden rounded-[22px] ring-1 ring-ink/[0.06] sm:h-[380px]">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
              i === at ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {typeof s.panel === "function" ? s.panel(i === at) : s.panel}
          </div>
        ))}
      </div>
    </div>
  );
}
