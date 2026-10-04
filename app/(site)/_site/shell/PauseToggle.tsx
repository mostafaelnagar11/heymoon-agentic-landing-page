"use client";
/* The global pause (ruling 18): it stops the sky, the toasts, the window, the orbit, the glyph ticker
   and the promo thumbnail. aria-pressed carries the state; the server snapshot is "playing". */
import { COPY } from "../copy";
import { usePlayback } from "../lib/playback";
import { Pause, Play } from "../ui/icons";

export function PauseToggle({ surface = "night", className = "" }: { surface?: "night" | "paper"; className?: string }) {
  const { paused, toggle } = usePlayback();
  const skin = surface === "night" ? "bg-white/8 text-white/72 hover:text-white" : "bg-ink/5 text-ink/72 hover:text-ink";
  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label={COPY.shared.pause}
      onClick={toggle}
      className={`grid size-8 flex-none place-items-center rounded-full transition-colors duration-[250ms] ${skin} ${className}`}
    >
      {paused ? <Play size={14} weight="fill" aria-hidden /> : <Pause size={14} weight="fill" aria-hidden />}
    </button>
  );
}
