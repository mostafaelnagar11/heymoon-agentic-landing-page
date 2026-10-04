/* Shared contracts (SPEC §4.3). WP0 writes these exactly; changes only through the lead.
   Several section props are deliberately empty: those sections read the urgent audience from context.
   next/typescript's no-empty-object-type would reject them, so it is off for this file only. */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ReactNode } from "react";
import type { MotionStyle } from "motion/react";
import type { Audience, CampaignPick, Platform } from "./data/types";

export type Slot = "hero" | "work" | "run" | "number" | "agents" | "connects" | "close";
export type Surface = "night" | "paper" | "deep";
export type SwitchPlacement = "hero" | "nav" | "close";
export type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** Below the fold, `audience` is ALWAYS the deferred value passed down by <Swap>. */
export interface SectionProps { audience: Audience }

/* ── WP0 shell and ui ── */
export interface AudienceSwitchProps { placement: SwitchPlacement; surface: "night" | "paper"; hidden?: boolean }
export interface FieldProps { id: string; placement: "hero" | "close" }          // reads the URGENT audience
export interface HorizonProps { variant: "hero" | "close"; ignite?: boolean; style?: MotionStyle; className?: string }
export interface MoonProps { phase?: Phase; working?: boolean; size?: number; className?: string }
export interface StarProps { size?: number; className?: string }                   // ui/Star.tsx, fill currentColor
export interface WordRevealProps { as?: "h2" | "h3" | "p"; text: string; className?: string; id?: string }
export interface CountUpProps { to: number; format: "usd" | "int"; className?: string }
export interface SectionShellProps { slot: Slot; surface: Surface; audience: Audience; cv?: boolean; className?: string; labelledBy?: string; children: ReactNode }

/* ── WP1 ── */
export interface HeroProps {}                         // urgent audience from context

/* ── WP2 ── */
export interface RunProgress { act: 0 | 1 | 2; actProgress: number; overall: number; done: boolean }
export interface WorkSectionProps extends SectionProps {}
export interface WorkingWindowProps {
  audience: Audience;
  variant: "page" | "compact";
  playing: boolean;                                   // the caller gates: in view, visible, not paused, not hovered
  loop?: boolean;                                     // compact loops with RUN.compactGapMs; page plays once
  seek?: { act: 0 | 1 | 2; nonce: number } | null;    // jump to an act; earlier acts complete instantly
  restartNonce?: number;                              // "Run it again"
  onProgress?: (p: RunProgress) => void;              // throttled to act changes and 10% steps
}

/* ── WP3 to WP6 ── */
export interface RunStageProps extends SectionProps {}
export interface NumberSectionProps extends SectionProps {}
export interface AgentsBandProps extends SectionProps {}
export interface ConnectsProps extends SectionProps {}
export interface CloseProps {}                        // urgent audience: the close is the fork
export interface FooterProps {}

/* ── WP7 ── */
export interface PromoProps {}                        // urgent audience: the card follows the switch

/* ── WP8 mocks: props only, aria-hidden root, may import copy.ts LABELS, never DEMO ── */
export interface MockFieldProps { kind: "url" | "handle"; value: string; platforms?: Platform[] }
export interface MockPlanProps {
  phaseLabel: string; pay: string; markets: string[]; creatorCount: number;
  reveal?: { header: boolean; pay: boolean; markets: boolean; creators: boolean };  // default: all true
  checks?: string[];                                  // check lines under the card (window only)
}
export interface MockPhasesProps { rungs: { phaseNo: number; budget: string; width: number }[]; grown: boolean }
export interface MockPayProps { total: string; vat: string; budget: string; last4: string }
export interface MockCurveProps { rungs: { phaseNo: number; multiple: number; multipleText: string }[]; label: string; drawn: boolean }
export interface CurveProps { drawn: boolean; className?: string }
export interface RoasDialProps { value: number; min: number; max: number; label: string; note: string; drawn: boolean }
export interface MockReadProps { title: string; sub: string; count: string; rows: { agent: string; produces: string }[] } // view passes sub ?? ""
export interface MockWhyProps { levelWord: string; reasons: { label: string; lit: boolean }[]; filled: number } // rows shown, 0 to 4
export interface MockPicksProps { title: string; picks: CampaignPick[]; shown: number; layout: "cards" | "rows" }
export interface MockTiersProps { picks: CampaignPick[]; shown: number; next: { brand: string; sharePct: number } | null; restLine: string; showFoot: boolean }
export interface MockTermsProps { brand: string; needsApproval: boolean; sharePct: number; commits: string[]; notCommits: string[] }
export interface MockCheckProps { product: string; brand: string; dueIn: string; misses: { label: string; fix: string }[]; shown: number }
export interface ShareScaleProps { figure: string; counts: { pct: number; count: number }[]; min: number; max: number; label: string; note: string; spoken: string; lit: boolean }
export interface PayoutRailProps { steps: string[]; lit: number }                 // glyphs lit, 0 to 4
export interface DiscsProps { count: number; size?: number }
export interface ProductTileProps { product: string; brand?: string; className?: string }
