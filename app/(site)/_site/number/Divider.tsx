"use client";
/* The lunar divider that opens the number section (§5.4, B8): nine Moons at 11px, gap 16, centred,
   new to full to new. Once in view they wax from all-new to their phases in sequence, 60 ms apart.
   Static by default (2.4.7) and under reduced motion. The only decorative crescents on the page
   (ruling 35, gate G7c). */
import { useRef } from "react";
import type { Phase } from "../contracts";
import { Moon } from "../ui/Moon";
import { useEntry, useStepper } from "./parts";
import s from "./number.module.css";

const PHASES: readonly Phase[] = [0, 1, 2, 3, 4, 5, 6, 7, 0];

export function Divider({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const entry = useEntry(ref, { threshold: 1, rootMargin: "0px 0px -12% 0px" });
  const lit = useStepper(entry, PHASES.length, 60, 0);
  return (
    <div ref={ref} aria-hidden className={`${s.divider} flex items-center justify-center gap-4 text-ink ${className}`}>
      {PHASES.map((p, i) => <Moon key={i} phase={i < lit ? p : 0} size={11} />)}
    </div>
  );
}
