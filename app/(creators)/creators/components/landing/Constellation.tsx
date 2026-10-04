"use client";

/* The seven agents, as a system rather than as a table.
 *
 * Ported from the brands landing, where this replaced a seven-row list
 * of name and stage. The list was accurate and completely inert: to
 * learn anything from it you had to read all seven rows, and nobody
 * reads seven rows on a landing page. The shape of the thing is the
 * point, so the shape is what is drawn. One core, seven specialists
 * around it, every one wired back to the middle. A visitor takes that
 * in without reading a word, and the names are there for the one who
 * leans in.
 *
 * The roster is the creators app's own AGENTS, so this and the Autonomy
 * page can never disagree about who is on it. The stage words are
 * inlined because this app has no i18n yet. Two icons differ from
 * brands, because the same agent does a different job for a creator:
 * MoonShot reads a person, so it is UserFocus rather than a storefront,
 * and MoonMatch finds brands for you rather than listing a roster of
 * creators, so it is Handshake rather than a group of people.
 *
 * The geometry is computed, not typed: `RING` places each node on a
 * circle in percentages, so the whole diagram scales with its square
 * container from a phone to a wide display without a single breakpoint.
 * Angles start at the top and run clockwise.
 */

import {
  Brain, ChartLineUp, Handshake, Megaphone, PenNib, ShieldCheck, Sparkle, UserFocus, type Icon,
} from "@phosphor-icons/react";
import { AGENTS } from "../../lib/agent/agents";

const ICONS: Icon[] = [UserFocus, Handshake, ShieldCheck, PenNib, Megaphone, ChartLineUp, Brain];

const STAGES = ["Intake", "Matching", "Safety", "Creative", "Activation", "Optimization", "Learning"] as const;

/** Seven points on a circle, from the top, clockwise. Percent of the
    square so everything scales together. */
const RADIUS = 37;
const RING = AGENTS.map((_, i) => {
  const a = (-90 + i * (360 / AGENTS.length)) * (Math.PI / 180);
  return { x: 50 + RADIUS * Math.cos(a), y: 50 + RADIUS * Math.sin(a) };
});

/* THE MOTION CLASSES ARE BARE. Brands writes `motion-safe:hm-breathe`,
   `motion-safe:hm-ring` and `motion-safe:hm-star`, but those are plain
   classes in globals.css, outside any @layer, so Tailwind generates no
   motion-safe variant for them and none of the three ever ran there:
   the ring stood still, the core never breathed, the star never
   turned. Reduced motion is already handled where the classes are
   defined, by the block that sets all five to `animation: none`, so
   the prefix had nothing to add even if it had worked. Brands needs
   the same fix on its own. */
export function Constellation() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* The wiring. Drawn under everything, faint enough to read as
          structure rather than as decoration. */}
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="hm-core-glow">
            <stop offset="0%" stopColor="#7C5CE0" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#F0559D" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#F0559D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hm-pulse" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F0559D" />
            <stop offset="100%" stopColor="#A98BFF" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="34" fill="url(#hm-core-glow)" className="hm-breathe" />
        <circle
          cx="50" cy="50" r={RADIUS} fill="none"
          stroke="rgba(255,255,255,0.10)" strokeWidth="0.3" strokeDasharray="1.4 1.8"
          className="hm-ring"
        />
        {RING.map((p, i) => (
          <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" />
        ))}
        {/* The dispatch. One pulse per spoke, offset around the ring so
            the core is never idle and never firing all seven at once. */}
        {RING.map((p, i) => (
          <line
            key={`pulse-${i}`}
            x1="50" y1="50" x2={p.x} y2={p.y}
            stroke="url(#hm-pulse)" strokeWidth="0.7" strokeLinecap="round"
            className="hm-spoke"
            style={{ animationDelay: `${(i * 3600) / RING.length}ms` }}
          />
        ))}
      </svg>

      {/* The core. */}
      <div
        className="absolute left-1/2 top-1/2 grid h-[19%] w-[19%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[22%] shadow-[0_10px_40px_-8px_rgba(124,92,224,0.8)]"
        style={{ background: "linear-gradient(140deg, #4D2FB0, #7C5CE0 55%, #F0559D)" }}
      >
        {/* The mark: the four-pointed star, which is what an AI core
            looks like to anyone who has used one — Phosphor's Sparkle,
            the same mark as Ask Moon and the agent's turns. A
            crescent sat here first and read as night, not as
            intelligence. */}
        <Sparkle weight="fill" aria-hidden className="hm-star h-[54%] w-[54%] text-white" />
      </div>

      {/* The seven. */}
      {AGENTS.map((name, i) => {
        const I = ICONS[i];
        const p = RING[i];
        return (
          <div
            key={name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="flex flex-col items-center gap-2">
              <span
                className="hm-node grid h-[44px] w-[44px] place-items-center rounded-[14px] bg-white/[0.07] text-white/75 ring-1 ring-white/[0.12] backdrop-blur-sm sm:h-[52px] sm:w-[52px]"
                style={{ animationDelay: `${(i * 3600) / RING.length}ms` }}
              >
                <I size={20} weight="regular" aria-hidden />
              </span>
              {/* Names are the second read, not the first. The stage
                  under each is dimmer again, but no dimmer than white/50,
                  the AA floor on `deep`: brands' white/30 reads at about
                  2.7 to 1, and these are words, not decoration. */}
              <span className="whitespace-nowrap text-center text-[10px] font-medium leading-tight text-white/75 sm:text-[11px]">
                {name.replace(/ AI$/, "")}
                <span className="block text-white/50">{STAGES[i]}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
