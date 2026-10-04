"use client";
/* The WordReveal mechanism for blocks: opacity plus 8px y, 600 ms, once at 20% in view. */
import { useRef, type ReactNode } from "react";
import s from "./WordReveal.module.css";
import { useArmed } from "./useArmed";

export interface RevealProps { children: ReactNode; className?: string; threshold?: number }

export function Reveal({ children, className = "", threshold = 0.2 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useArmed(ref, threshold);
  return <div ref={ref} className={`${s.block} ${className}`}>{children}</div>;
}
