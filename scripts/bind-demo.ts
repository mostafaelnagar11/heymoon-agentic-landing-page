/* The bind: runs the real product functions on a recorded fake clock and writes
   app/(site)/_site/data/demo.json. Typed against _site/data/types.ts, so tsc checks the mapping.
   It is a whitelist: nothing from a product object is ever spread into the output (SPEC §3.2).
   Launched by scripts/bind-demo.cjs, which adds the .tsx transpile hook for jiti. */

import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { isDeepStrictEqual } from "util";
import path from "path";

/* ── Brands product (B) ── */
import { AGENTS as B_AGENTS } from "../app/(brands)/brands/lib/agent/agents";
import {
  BUILD_TASKS as B_BUILD_TASKS, PHASE1_BUDGET, PHASE1_ROAS, READ_TASKS as B_READ_TASKS,
  ladderTotals, planFor, tools as B_tools,
} from "../app/(brands)/brands/lib/agent/tools";
import { ROAS_MAX, ROAS_MIN } from "../app/(brands)/brands/lib/agent/model";
import { UNLOCK_AT, VAT_RATE, fmtUSD, phaseTitle } from "../app/(brands)/brands/lib/mock/campaigns";
import { normaliseUrl as B_normaliseUrl } from "../app/(brands)/brands/lib/mock/reads";
import { CREATORS as B_CREATORS } from "../app/(brands)/brands/lib/mock/creators";
import { SHORT_MARKET } from "../app/(brands)/brands/lib/landing";
import { countWord as B_countWord, rosterTitle as B_rosterTitle } from "../app/(brands)/brands/components/blocks";
import type { BrandRead, Plan } from "../app/(brands)/brands/lib/agent/types";

/* ── Creators product (C) ── */
import { AGENTS as C_AGENTS } from "../app/(creators)/creators/lib/agent/agents";
import {
  BUILD_TASKS as C_BUILD_TASKS, DRAFTS, READ_TASKS as C_READ_TASKS,
  fullReadFor, offersFor, profileFor, readIdFor, tools as C_tools,
} from "../app/(creators)/creators/lib/agent/tools";
import { MATCH_WEIGHTS, MATCH_WORD, PREQUALIFIED_CAP, bundleLine } from "../app/(creators)/creators/lib/agent/model";
import { CADENCES, chatPicks, wantsYou, type CreatorRead, type Offer } from "../app/(creators)/creators/lib/agent/types";
import { PEOPLE } from "../app/(creators)/creators/lib/mock/people";
import { BRANDS } from "../app/(creators)/creators/lib/mock/brands";
import { DEFAULT_AUTONOMY } from "../app/(creators)/creators/lib/store";
import { chatCampaigns, chatCampaignsTitle } from "../app/(creators)/creators/lib/join";
import { displayHandle as C_displayHandle, handleKey as C_handleKey } from "../app/(creators)/creators/lib/handle";
import { paceOf } from "../app/(creators)/creators/components/figma";
import { countWord as C_countWord, rosterTitle as C_rosterTitle } from "../app/(creators)/creators/components/blocks";

/* ── The site ── */
import { COPY } from "../app/(site)/_site/copy";
import { normaliseUrl, usableUrl, handleKey, displayHandle, usableHandle } from "../app/(site)/_site/lib/field";
import { formatUSD } from "../app/(site)/_site/lib/format";
import type {
  AgentName, AgentRole, CampaignPick, CreatorsDemo, BrandsDemo, DemoData, Money, Platform, Run, RunUnit, Rung,
} from "../app/(site)/_site/data/types";

const OUT = path.resolve(__dirname, "../app/(site)/_site/data/demo.json");
const SHOWN_URL = "yourstore.com" as const;
const SHOWN_HANDLE = "@yourhandle" as const;
const READ_URL = "ounass.com";

/* ------------------------------------------------------------------ */
/* Drain on a recorded fake clock                                      */
/* ------------------------------------------------------------------ */

/* Cast through unknown: `as any` fails @typescript-eslint/no-explicit-any (next/typescript), and §7.2 lints scripts/. */
const clock = globalThis as unknown as { setTimeout: (fn: () => void, ms: number) => unknown };
async function drain<T>(gen: AsyncGenerator<{ note: string; progress: { done: number; total: number } }, T>) {
  const real = clock.setTimeout;
  const log: number[] = [];
  clock.setTimeout = (fn, ms) => { log.push(ms); queueMicrotask(fn); return 0; };
  try {
    const chunks: { note: string; done: number; total: number; ms: number }[] = [];
    let r = await gen.next();
    for (; !r.done; r = await gen.next()) {
      chunks.push({ note: r.value.note, done: r.value.progress.done, total: r.value.progress.total, ms: log.at(-1) ?? 0 });
      log.length = 0;
    }
    return { chunks, value: r.value as T };
  } finally { clock.setTimeout = real; }
}
const ctx = () => ({ signal: new AbortController().signal });

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

const money = (n: number): Money => ({ value: n, text: fmtUSD(n) });
const totalText = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
/** Copied from the v1 page: up to the first ". ". */
const firstSentence = (s: string) => {
  const i = s.indexOf(". ");
  return i < 0 ? s : s.slice(0, i + 1);
};

const STAGES = COPY.shared.stages as readonly string[];
const AGENT_NAMES = new Set<string>(B_AGENTS);
function agentName(a: string): AgentName {
  assert(AGENT_NAMES.has(a), `"${a}" is one of AGENTS`);
  return a as AgentName;
}
/** The stage an agent owns, from COPY.shared.stages in AGENTS order. */
const stageOf = (a: AgentName) => STAGES[(B_AGENTS as readonly string[]).indexOf(a)] as AgentRole;
function agentRole(agent: AgentName, role: string, where: string): AgentRole {
  assert(role === stageOf(agent), `${where}: ${agent} has role "${role}", the stage list says "${stageOf(agent)}"`);
  return role as AgentRole;
}

interface Task { key: string; agent: string; role: string; note: string; produces: string }
type Chunks = { note: string; done: number; total: number; ms: number }[];

/** Distinct agents in first-appearance order. */
const agentsOf = (units: RunUnit[]) => Array.from(new Set(units.map((u) => u.agent)));

/** One task row per stream chunk, in stream order, with cumulative ms. */
function unitsFrom(tasks: Task[], chunks: Chunks, where: string): { units: RunUnit[]; sizes: Run["sizes"]; totalMs: number } {
  const units: RunUnit[] = [];
  const sizes: Run["sizes"] = [];
  let t = 0;
  chunks.forEach((c, i) => {
    const task = tasks[i];
    assert(task, `${where}: chunk ${i} has a task row`);
    assert(c.note === `${task.agent} · ${task.note}`, `${where}: chunk ${i} note "${c.note}" is "${task.agent} · ${task.note}"`);
    const startMs = t;
    t += c.ms;
    const agent = agentName(task.agent);
    units.push({
      key: task.key, agent, role: agentRole(agent, task.role, where), note: task.note, produces: task.produces,
      startMs, endMs: t, stream: task.key,
    });
    if (!sizes.length || sizes[sizes.length - 1].total !== c.total) sizes.push({ atMs: t, total: c.total });
  });
  return { units, sizes, totalMs: t };
}

/* ------------------------------------------------------------------ */
/* The product, bound                                                  */
/* ------------------------------------------------------------------ */

async function bindBrands(): Promise<BrandsDemo> {
  /* read_site: opener + 9 units. */
  const read = await drain(B_tools.read_site({ url: READ_URL }, ctx()));
  const [opener, ...readChunks] = read.chunks;
  assert(opener.ms === 0 && opener.done === 0, "brands read: chunk 0 is the opener");
  assert(readChunks.length === B_READ_TASKS.length, `brands read: ${B_READ_TASKS.length} units`);
  const r = unitsFrom(B_READ_TASKS, readChunks, "brands read");
  /* The opener's total is the counter's first denominator (4), at 0 ms. */
  const readSizes = [{ atMs: 0, total: opener.total }, ...r.sizes.filter((s, i) => i > 0 || s.total !== opener.total)];
  const shownUrl = read.value.url;
  const scrubUrl = (s: string) => s.split(shownUrl).join(SHOWN_URL);
  const readAgents = agentsOf(r.units);
  const brandsRead: Run = {
    title: B_rosterTitle(B_READ_TASKS, "read your store"),
    sub: null,
    opener: scrubUrl(opener.note),
    agents: readAgents,
    agentWord: B_countWord(readAgents.length),
    units: r.units,
    sizes: readSizes,
    totalMs: r.totalMs,
    totalText: totalText(r.totalMs),
  };

  /* propose_plan: opener + 6 stream steps for 7 rows. */
  const readValue: BrandRead = read.value;
  const build = await drain(B_tools.propose_plan({ read: readValue }, ctx()));
  const [bOpener, ...buildChunks] = build.chunks;
  assert(bOpener.done === 0 && bOpener.ms === 0, "brands build: chunk 0 is the opener");
  const plan: Plan = planFor(readValue);
  assert(plan.pool.why.includes("MoonSearch AI"), "planFor(read).pool.why names MoonSearch AI (safety rides the creators step)");
  let t = 0;
  const byNote = new Map<string, { startMs: number; endMs: number }>();
  for (const c of buildChunks) { byNote.set(c.note, { startMs: t, endMs: t + c.ms }); t += c.ms; }
  const missing = B_BUILD_TASKS.filter((task) => !byNote.has(`${task.agent} · ${task.note}`));
  assert(missing.length === 1 && missing[0].key === "safety", `brands build: the one row with no stream step is "safety" (got ${missing.map((m) => m.key).join(", ")})`);
  assert(byNote.size === B_BUILD_TASKS.length - 1, "brands build: every stream step maps to a BUILD_TASKS row");
  const creatorsRow = byNote.get(`${B_BUILD_TASKS.find((x) => x.key === "creators")!.agent} · ${B_BUILD_TASKS.find((x) => x.key === "creators")!.note}`);
  assert(creatorsRow, "brands build: the creators row has a stream step");
  const buildUnits: RunUnit[] = B_BUILD_TASKS.map((task) => {
    const slot = task.key === "safety" ? creatorsRow : byNote.get(`${task.agent} · ${task.note}`)!;
    const agent = agentName(task.agent);
    return {
      key: task.key, agent, role: agentRole(agent, task.role, "brands build"), note: task.note, produces: task.produces,
      startMs: slot.startMs, endMs: slot.endMs, stream: task.key === "safety" ? "creators" : task.key,
    };
  });
  const buildAgents = agentsOf(buildUnits);
  const pricing = buildUnits.find((u) => u.key === "pricing");
  assert(pricing && pricing.note.includes(fmtUSD(PHASE1_BUDGET)), `brands build: the pricing note names ${fmtUSD(PHASE1_BUDGET)}`);
  const brandsBuild: Run = {
    title: B_rosterTitle(B_BUILD_TASKS, "on your plan"),
    sub: null,
    opener: scrubUrl(bOpener.note),
    agents: buildAgents,
    agentWord: B_countWord(buildAgents.length),
    units: buildUnits,
    sizes: [{ atMs: 0, total: B_BUILD_TASKS.length }],
    totalMs: t,
    totalText: totalText(t),
  };

  /* The plan. */
  const markets = plan.markets.value.slice(0, 3).map((c) => SHORT_MARKET[c]);
  assert(markets.every((m) => typeof m === "string"), "brands plan: every market has a SHORT_MARKET name");
  const rungs = plan.ladder.value;
  assert(rungs.length === 3, `plan.ladder.value.length is 3 ("three phases"), got ${rungs.length}`);
  const maxBudget = Math.max(...rungs.map((x) => x.budget));
  const ladder: Rung[] = rungs.map((x) => {
    assert(x.phaseNo === 1 || x.phaseNo === 2 || x.phaseNo === 3, `rung phaseNo ${x.phaseNo}`);
    return {
      phaseNo: x.phaseNo, label: phaseTitle(x.phaseNo), budget: money(x.budget),
      multiple: x.multiple, multipleText: `${x.multiple}x`, width: Math.max(0.16, x.budget / maxBudget),
    };
  });
  assert(PHASE1_ROAS === 1, "PHASE1_ROAS is 1 (D4: the warm-up is guaranteed at 1x)");
  assert(plan.budget.value === PHASE1_BUDGET, "plan.budget.value is PHASE1_BUDGET (the same for every brand)");
  const totals = ladderTotals(plan.planBudget.value, plan.guaranteedRoas.value);
  const roas = plan.guaranteedRoas.value;

  /* request_funding: Sourced money fields. */
  const req = B_tools.request_funding({ plan, phaseNo: 1 });
  assert(req.total.value === req.amount.value + req.vat.value, "checkout: total = amount + vat");
  assert(req.vat.value === Math.round(req.amount.value * VAT_RATE), "checkout: vat = round(amount × VAT_RATE)");

  return {
    shownUrl: SHOWN_URL,
    read: brandsRead,
    build: brandsBuild,
    promoAgentWord: B_countWord(new Set([...brandsRead.agents, ...brandsBuild.agents]).size),
    plan: {
      phaseLabel: phaseTitle(rungs[0].phaseNo),
      pay: money(plan.budget.value),
      markets,
      creatorCount: plan.creators.value.length,
      creatorWord: B_countWord(plan.creators.value.length),
    },
    ladder,
    guarantee: { revenue: money(totals.revenue), budget: money(totals.budget), roas, roasText: `${roas}x` },
    checkout: { total: money(req.total.value), vat: money(req.vat.value), budget: money(req.amount.value), last4: req.method.last4 },
    roasScale: { min: ROAS_MIN, max: ROAS_MAX },
    unlockPct: Math.round(UNLOCK_AT * 100),
  };
}

async function bindCreators(): Promise<CreatorsDemo> {
  const handle = PEOPLE[0].handle;
  const readerWord = C_countWord(new Set(C_READ_TASKS.map((x) => x.agent)).size);

  /* read_profile: opener + 9 units. */
  const read = await drain(C_tools.read_profile({ handle }, ctx()));
  const [opener, ...readChunks] = read.chunks;
  assert(opener.ms === 0 && opener.done === 0, "creators read: chunk 0 is the opener");
  assert(readChunks.length === C_READ_TASKS.length, `creators read: ${C_READ_TASKS.length} units`);
  const r = unitsFrom(C_READ_TASKS, readChunks, "creators read");
  const readSizes = [{ atMs: 0, total: opener.total }, ...r.sizes.filter((s, i) => i > 0 || s.total !== opener.total)];
  const scrubHandle = (s: string) => s.split(handle).join(SHOWN_HANDLE);
  const readAgents = agentsOf(r.units);
  const creatorsRead: Run = {
    title: null,
    sub: `${SHOWN_HANDLE} · ${readerWord} agents`,
    opener: scrubHandle(opener.note),
    agents: readAgents,
    agentWord: C_countWord(readAgents.length),
    units: r.units,
    sizes: readSizes,
    totalMs: r.totalMs,
    totalText: totalText(r.totalMs),
  };
  assert(readAgents.length === 5, `the creators read has 5 agents ("Five agents read your last thirty posts"), got ${readAgents.length}`);
  assert(C_READ_TASKS.find((x) => x.key === "niche")?.note.includes("last thirty posts"), `the niche note says "last thirty posts"`);

  /* propose_profile: 4 units, no opener. */
  const readValue: CreatorRead = read.value;
  const build = await drain(C_tools.propose_profile({ read: readValue }, ctx()));
  assert(build.chunks.length === C_BUILD_TASKS.length, `creators build: ${C_BUILD_TASKS.length} units, no opener`);
  const b = unitsFrom(C_BUILD_TASKS, build.chunks, "creators build");
  const buildAgents = agentsOf(b.units);
  const creatorsBuild: Run = {
    title: C_rosterTitle(C_BUILD_TASKS, "building your profile"),
    sub: null,
    opener: null,
    agents: buildAgents,
    agentWord: C_countWord(buildAgents.length),
    units: b.units,
    sizes: [{ atMs: 0, total: C_BUILD_TASKS.length }],
    totalMs: b.totalMs,
    totalText: totalText(b.totalMs),
  };

  /* Matching (gate G5). PEOPLE[0] is v1's DEMO. */
  const full = { ...fullReadFor(handle, readIdFor(handle)), done: C_READ_TASKS.map((x) => x.key) };
  const profile = profileFor(full);
  const offers: Offer[] = offersFor(profile);
  const picks = chatPicks(offers);
  assert(PREQUALIFIED_CAP === 3, `PREQUALIFIED_CAP is 3 ("Up to three"), got ${PREQUALIFIED_CAP}`);
  assert(picks.length === 3, `3 picks ("Up to three"), got ${picks.length}`);

  /* enterMs: only the first three match_offers chunks' ms. Never store a note. */
  const match = await drain(C_tools.match_offers({ profile }, ctx()));
  let enter = 0;
  const items: CampaignPick[] = picks.map((o, i) => {
    const c = match.chunks[i];
    assert(c && c.note === `MoonMatch AI · ${o.brand}`, `match_offers chunk ${i} is pick ${i} (${o.brand})`);
    enter += c.ms;
    const pace = paceOf(o);
    return {
      brand: o.brand, campaign: o.title, product: o.product, sharePct: o.commissionPct,
      levelWord: MATCH_WORD[o.match.level], paceBig: pace.big, paceSmall: pace.small, enterMs: enter,
    };
  });

  const signals = picks[0].match.signals;
  const reasonKeys = Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[];
  assert(signals.length === 4 && reasonKeys.length === 4, `exactly 4 match signals, got ${signals.length}`);

  const requests = offers.filter((o) => o.state === "open" && wantsYou(o) && o.match.level !== "prequalified");
  assert(requests.length > 0, "at least one request to join");

  /* request_accept on the first pick. */
  const acc = C_tools.request_accept({ offer: picks[0], cadence: "3pw" });
  assert(acc.needsApproval === false, `request_accept on the first pick needs no approval ("Pressing it joins you")`);
  const cadence = CADENCES.find((c) => c.key === acc.cadence);
  assert(cadence, `cadence ${acc.cadence} exists`);

  /* The pre-upload check on draft d-2. */
  const draft = DRAFTS.find((d) => d.id === "d-2");
  assert(draft, "DRAFTS has d-2");
  const misses = draft.check.checks.filter((c) => !c.clean).map((c) => ({ label: c.label, fix: firstSentence(c.fix ?? "") }));
  assert(misses.every((m) => m.fix.length > 0), "every missed check has a fix");

  /* Shares across the live roster. */
  const list = BRANDS.filter((x) => !x.ended).map((x) => x.perOrderPct);
  const pcts = Array.from(new Set(list)).sort((x, y) => x - y);

  /* Platforms: the landing constant, asserted against the offers. */
  const platforms: Platform[] = ["Instagram", "TikTok"];
  const offered = new Set(offers.flatMap((o) => o.deliverables.map((d) => d.platform)));
  assert(offered.size === platforms.length && platforms.every((p) => offered.has(p)),
    `platforms equal the offers' deliverable platforms (${Array.from(offered).join(", ")})`);

  return {
    shownHandle: SHOWN_HANDLE,
    platforms,
    read: creatorsRead,
    build: creatorsBuild,
    readerWord,
    match: {
      levelWord: MATCH_WORD.prequalified,
      reasons: reasonKeys.map((key, i) => ({ key, label: signals[i].label, lit: signals[i].strong })),
    },
    picks: {
      title: chatCampaignsTitle(chatCampaigns(offers, [], {}), C_countWord),
      countWord: C_countWord(picks.length),
      items,
    },
    requests: { next: { brand: requests[0].brand, sharePct: requests[0].commissionPct }, rest: requests.length - 1 },
    prequalifiedCap: PREQUALIFIED_CAP,
    terms: {
      brand: acc.brand,
      needsApproval: acc.needsApproval,
      sharePct: acc.commissionPct,
      commits: [`${bundleLine(acc.deliverables)}, at ${cadence.label.toLowerCase()}.`],
      notCommits: acc.notCommits.map(firstSentence),
    },
    check: { product: draft.product, brand: draft.brand, dueIn: draft.dueIn, checkCount: draft.check.checks.length, misses },
    shares: {
      list, min: Math.min(...list), max: Math.max(...list), liveCount: list.length,
      counts: pcts.map((pct) => ({ pct, count: list.filter((x) => x === pct).length })),
    },
    locks: DEFAULT_AUTONOMY.filter((x) => x.locked && x.level === "never").map((x) => x.label),
  };
}

async function build(): Promise<Omit<DemoData, "hash">> {
  /* agents[]: B AGENTS, identical to C's; roles from the tasks and the A4 stage list. */
  assert(B_AGENTS.length === 7, `AGENTS.length is 7 ("Seven agents"), got ${B_AGENTS.length}`);
  assert(isDeepStrictEqual([...B_AGENTS], [...C_AGENTS]), "brands and creators AGENTS are identical");
  assert(STAGES.length === B_AGENTS.length, "COPY.shared.stages has one stage per agent");
  for (const [where, tasks] of [["B READ_TASKS", B_READ_TASKS], ["B BUILD_TASKS", B_BUILD_TASKS], ["C READ_TASKS", C_READ_TASKS], ["C BUILD_TASKS", C_BUILD_TASKS]] as const) {
    for (const task of tasks as readonly Task[]) agentRole(agentName(task.agent), task.role, where);
  }
  const agents = B_AGENTS.map((a) => { const name = agentName(a); return { name, role: stageOf(name) }; });
  const brands = await bindBrands();
  const creators = await bindCreators();
  return { version: 1, agents, brands, creators };
}

/* ------------------------------------------------------------------ */
/* Assertions on the output                                            */
/* ------------------------------------------------------------------ */

/** Every real person in the product fixtures: handles (with and without "@") and names. Shared with
    check-site.cjs and measure.cjs, so the list is never typed by hand. */
export function people(): { handles: string[]; names: string[] } {
  const handles = new Set<string>();
  const names = new Set<string>();
  for (const p of PEOPLE) {
    handles.add(p.handle);
    for (const a of p.accounts) handles.add(a.handle);
    if (p.name) names.add(p.name);
  }
  for (const c of B_CREATORS) { handles.add(c.handle); names.add(c.name); }
  const bare = Array.from(handles).flatMap((h) => [h, h.replace(/^@/, "")]);
  return { handles: Array.from(new Set(bare)), names: Array.from(names) };
}

function invariants(out: Omit<DemoData, "hash">) {
  const b = out.brands, c = out.creators;
  /* 1. Copy-bearing invariants. */
  assert(b.read.totalMs >= 14500 && b.read.totalMs <= 15499, `brands read ${b.read.totalMs} ms is within 14,500 to 15,499 ("fifteen seconds")`);
  assert(c.read.totalMs >= 13500 && c.read.totalMs <= 16499, `creators read ${c.read.totalMs} ms is within 13,500 to 16,499 ("In about fifteen seconds")`);
  assert(out.agents.length === 7, "seven agents");
  assert(c.picks.items.length === 3 && c.prequalifiedCap === 3, "up to three");
  assert(b.ladder.length === 3, "three phases");
  assert(c.terms.needsApproval === false, "the first pick joins outright");

  /* 2. Shares (D4) and fictional brands only. */
  assert(c.shares.min >= 10 && c.shares.max <= 16, `shares ${c.shares.min} to ${c.shares.max} sit inside 10 to 16%`);
  const banned = /^(ounass|luna beauty|freshgrocer)$/i;
  for (const brand of [...c.picks.items.map((p) => p.brand), c.requests.next.brand]) {
    assert(!banned.test(brand), `"${brand}" is not a real retailer`);
  }

  /* 3. Leak guard. */
  const json = JSON.stringify(out);
  const lower = json.toLowerCase();
  const { handles, names } = people();
  for (const h of handles) assert(!lower.includes(h.toLowerCase()), `demo.json leaks the handle "${h}"`);
  for (const n of names) assert(!lower.includes(n.toLowerCase()), `demo.json leaks the name "${n}"`);
  for (const re of [/\bounass\b/i, /\bluna\b/i, /freshgrocer/i]) assert(!re.test(json), `demo.json matches ${re}`);
  for (const s of ["/creators/", ".jpg", ".jpeg", ".png", ".mp4", "heymoon.ai/", "acc-o-"]) assert(!lower.includes(s), `demo.json contains "${s}"`);
  assert(!/\b[A-Z]{3,}-[A-Z]{2,}\b/.test(json), "demo.json carries a discount-code shape");
  const ats = json.match(/@[a-z0-9._]+/gi) ?? [];
  for (const a of ats) assert(a === SHOWN_HANDLE, `demo.json carries the handle "${a}" (only ${SHOWN_HANDLE} is allowed)`);
  for (const k of ["why", "evidence", "expected", "crewCost", "followers", "viewThrough", "avatar", "image", "brandLogo", "bonus", "code", "trackingLink", "orders", "score", "signals", "detail"]) {
    assert(!json.includes(`"${k}":`), `demo.json has the key "${k}"`);
  }
  const strings: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(out);
  for (const s of strings) for (const ch of ["—", "–", "×", "!"]) assert(!s.includes(ch), `the string "${s}" contains "${ch}"`);
  assert(!/\$\s?\d/.test(JSON.stringify(out.creators)), "the creators data carries a dollar amount");
}

/** 5. Field parity, against the product and v1's two regexes (the contract, copied here). */
function fieldParity() {
  const HANDLE = /^[a-z0-9._]{1,30}$/;
  const BARE_SITE = /^([a-z0-9-]+\.)?(instagram|tiktok)\.com$/;
  const v1Usable = (raw: string): string | null => {
    const key = C_handleKey(raw);
    return HANDLE.test(key) && !BARE_SITE.test(key) ? C_displayHandle(raw) : null;
  };
  const samples = [
    "https://www.Ounass.com/en-ae/x", " yourstore.com ", "nodot", "", "instagram.com/some.one/",
    "https://www.tiktok.com/@some_one?lang=en", "instagram.com", "bad handle!", "a".repeat(31), "a".repeat(30),
    "@yourhandle", "YourHandle", "http://shop.example.co.uk/path?q=1", "www.store.ae", "https://tiktok.com",
    "https://www.instagram.com/", "@some.one#top", "  @Mixed.Case_01  ", "store.com/", "m.instagram.com",
    "https://instagram.com/p/xyz", "two words",
  ];
  for (const s of samples) {
    assert(normaliseUrl(s) === B_normaliseUrl(s), `normaliseUrl(${JSON.stringify(s)}) matches the product`);
    const u = B_normaliseUrl(s);
    assert(usableUrl(s) === (u.includes(".") ? u : null), `usableUrl(${JSON.stringify(s)})`);
    assert(handleKey(s) === C_handleKey(s), `handleKey(${JSON.stringify(s)}) matches the product`);
    assert(displayHandle(s) === C_displayHandle(s), `displayHandle(${JSON.stringify(s)}) matches the product`);
    assert(usableHandle(s) === v1Usable(s), `usableHandle(${JSON.stringify(s)}) matches v1`);
  }
  /* The acceptance lines of §5.0.9, pinned. */
  assert(usableUrl(" https://www.YourStore.com/path ") === "yourstore.com", "the store link example");
  assert(usableHandle("instagram.com/some.one/") === "@some.one", "the profile link example");
  assert(usableHandle("instagram.com") === null, "a bare site is refused");
}

/** 6. Format parity. */
function formatParity() {
  for (const n of [0, 1, 999, 1000, 1050, 12500, 63050, 1234567]) {
    assert(formatUSD(n) === fmtUSD(n), `formatUSD(${n}) matches fmtUSD`);
  }
}

/* ------------------------------------------------------------------ */
/* Canonical JSON                                                       */
/* ------------------------------------------------------------------ */

function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, canonical(o[k])]));
  }
  return v;
}

export async function main({ check }: { check: boolean }) {
  fieldParity();
  formatParity();
  const first = await build();
  const second = await build();
  assert(isDeepStrictEqual(first, second), "4. determinism: two builds in one process are deep-equal");
  invariants(first);

  const body = canonical(first) as Record<string, unknown>;
  const hash = createHash("sha1").update(JSON.stringify(body)).digest("hex");
  const out = canonical({ ...body, hash }) as DemoData;
  const text = `${JSON.stringify(out, null, 2)}\n`;

  let current = "";
  try { current = readFileSync(OUT, "utf8"); } catch { /* first run */ }
  const line = `demo.json ok · brands read ${out.brands.read.totalText} · creators read ${out.creators.read.totalText} · ${hash.slice(0, 7)}`;
  if (current === text) { console.log(line); return out; }
  if (check) throw new Error("demo.json is stale: run npm run bind");
  writeFileSync(OUT, text);
  console.log(`${line} (written)`);
  return out;
}
