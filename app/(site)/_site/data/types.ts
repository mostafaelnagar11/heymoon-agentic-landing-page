export type Audience = "brands" | "creators";
export type AgentName =
  | "MoonShot AI" | "MoonMatch AI" | "MoonSearch AI" | "MoonWriter AI"
  | "MoonLive AI" | "MoonScore AI" | "MoonLearning AI";
export type AgentRole =
  | "Intake" | "Matching" | "Safety" | "Creative" | "Activation" | "Optimization" | "Learning";
export type Platform = "Instagram" | "TikTok";

/** A bound amount and the exact text the product prints for it (fmtUSD). */
export interface Money { value: number; text: string }

/** One row of an agent run. */
export interface RunUnit {
  key: string;          // READ_TASKS / BUILD_TASKS key
  agent: AgentName;
  role: AgentRole;
  note: string;         // task.note, verbatim: what the agent is doing
  produces: string;     // task.produces, verbatim: what it has made
  startMs: number;      // ms from run start when the row begins working
  endMs: number;        // ms from run start when the row lands
  stream: string;       // the stream step that did the work: = key, except brands "safety" → "creators"
}

export interface Run {
  title: string | null; // product roster title; null for the creators read (it uses LABELS.readingProfile)
  sub: string | null;   // creators read only: "@yourhandle · five agents"
  opener: string | null;// first stream line, scrubbed, "Agent · note"; null when the stream has none
  agents: AgentName[];  // distinct, in first-appearance order
  agentWord: string;    // countWord(agents.length)
  units: RunUnit[];
  sizes: { atMs: number; total: number }[]; // the counter's denominator over time (read: 4, then 9)
  totalMs: number;
  totalText: string;    // `${(totalMs / 1000).toFixed(1)}s`, e.g. "15.0s"
}

export interface Rung {
  phaseNo: 1 | 2 | 3;
  label: string;        // phaseTitle(phaseNo): "Phase 1 · Warm-up"
  budget: Money;        // $1,000 / $4,000 / $7,500
  multiple: number;     // 1 / 3.7 / 6.3
  multipleText: string; // "1x" / "3.7x" / "6.3x"
  width: number;        // max(.16, budget / max budget): MockPhases bar width (ruling C11)
}

export interface BrandsDemo {
  shownUrl: "yourstore.com";
  read: Run;            // read_site: opener + 9 units, 15,022 ms, "Four agents read your store"
  build: Run;           // propose_plan: opener + 7 rows (safety rides the creators step), 10,768 ms, "Five agents on your plan"
  promoAgentWord: string;          // countWord(|read.agents ∪ build.agents|): "five"
  plan: {
    phaseLabel: string;            // "Phase 1 · Warm-up"
    pay: Money;                    // $1,000
    markets: string[];             // ["UAE", "KSA", "Kuwait"]
    creatorCount: number;          // 3 (count only: no names, handles, avatars)
    creatorWord: string;           // "three"
  };
  ladder: Rung[];
  guarantee: { revenue: Money; budget: Money; roas: number; roasText: string }; // $63,050 / $12,500 / 5 / "5x"
  checkout: { total: Money; vat: Money; budget: Money; last4: string };         // $1,050 / $50 / $1,000 / "4629"
  roasScale: { min: number; max: number };                                      // 1 / 12
  unlockPct: number;                                                            // 80
}

/** Named CampaignPick, not Pick: `Pick` would shadow TypeScript's Pick<> utility in every importing file. */
export interface CampaignPick {
  brand: string;        // fictional campaign brands only (asserted)
  campaign: string;     // offer.title
  product: string;
  sharePct: number;     // commissionPct
  levelWord: string;    // MATCH_WORD[offer.match.level]: "Pre-qualified"
  paceBig: string;      // paceOf(offer).big: "4 ads"
  paceSmall: string;    // paceOf(offer).small: "at your own pace"
  enterMs: number;      // cumulative match_offers ms for this pick: 343 / 667 / 911
}

export interface CreatorsDemo {
  shownHandle: "@yourhandle";
  platforms: Platform[];           // ["Instagram", "TikTok"], asserted equal to the union of live offers' deliverable platforms
  read: Run;                       // read_profile: opener + 9 units, 16,242 ms
  build: Run;                      // propose_profile: 4 units, 7,193 ms, "Three agents building your profile"
  readerWord: string;              // "five"
  match: {
    levelWord: string;             // "Pre-qualified"
    reasons: { key: "market" | "authenticity" | "consistency" | "audience"; label: string; lit: boolean }[];
                                   // label = picks[0].match.signals[i].label; lit = picks[0].match.signals[i].strong (today all true).
                                   // No weights, no quantities (ruling 26). Gate G5.
  };
  picks: { title: string; countWord: string; items: CampaignPick[] }; // "Your top three, Pre-qualified"; countWord "three"
  requests: { next: { brand: string; sharePct: number }; rest: number };   // Dune Run 11 / 12
  prequalifiedCap: number;                                     // 3
  terms: { brand: string; needsApproval: boolean; sharePct: number; commits: string[]; notCommits: string[] };
  check: { product: string; brand: string; dueIn: string; checkCount: number; misses: { label: string; fix: string }[] };
  shares: { list: number[]; min: number; max: number; liveCount: number; counts: { pct: number; count: number }[] };
  locks: string[];                 // the three DEFAULT_AUTONOMY rows locked at never
}

export interface DemoData {
  version: 1;
  hash: string;                    // sha1 of the canonical JSON without `hash`; no timestamps anywhere
  agents: { name: AgentName; role: AgentRole }[];   // AGENTS order; roles asserted against tasks and the A4 stages
  brands: BrandsDemo;
  creators: CreatorsDemo;
}
