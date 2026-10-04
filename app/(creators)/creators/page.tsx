"use client";

/* The landing, in the brands register.
 *
 * Section for section, the brands landing: the claim and the field, three
 * cards that each hold a picture of the product, the run in four steps,
 * one dark panel for the money question, a band for the share, the seven
 * agents, the platforms, and the field again. The chrome, the clamp sizes
 * and the reveal timings are the brands page's, so the two sides of
 * HeyMoon read as one company. The ground is `ground` (the brands paper,
 * not this app's Figma `paper`), and the face is Geist, scoped to this
 * root so that no product screen changes font.
 *
 * THIS REVERSES REVIEW ITEM 13, at Mostafa's request; he made the call
 * in the review and asked for this page to match the brands landing. So
 * it is a full page again. What item 13 protected still holds: there is
 * no money figure on it, no arithmetic, no payment-model table and no
 * rate. The only numbers near pay are the shares brands set, from 10% to
 * 16%, and the word "Weekly".
 *
 * EVERY MOCK IS BOUND, NOT DRAWN. useDemo builds their props once, from
 * the product's own demo creator (PEOPLE[0]) through the same functions
 * the conversation calls, the way brands binds planFor(ounass):
 *
 *   how     MockField   the read's platforms
 *           MockWhy     the lead pick's match.signals, as CampaignDetail
 *                       shows them under "Why HeyMoon matched you"
 *           MockTiers   chatPicks, then the first request to join
 *   run     MockRead    READ_TASKS, held at 5/9 with Performance working
 *           MockPicks   the real CampaignCard for each of chatPicks
 *           MockTerms   request_accept on the lead pick
 *           MockCheck   the three misses on draft d-2
 *   paid    MoneyPanel  ANSWERS.payment and the PAYOUTS gate, not a payout
 *   share   ShareScale  every live campaign's perOrderPct
 *   agents  the three DEFAULT_AUTONOMY rows locked at Never
 *
 * The streams are paced by costOf, the product's own cost for each unit
 * of work, scaled into the Run's 7s step. That keeps README's "streaming,
 * not timers": the rhythm is uneven because the real read's is.
 *
 * WHAT OF A REAL PERSON IT SHOWS. PEOPLE[0] is a real influencer, so no
 * mock shows her name, avatar, location, discount code, voice register or
 * any payout, and the handle reads "@yourhandle" everywhere. What does
 * come from her read, with nothing to name her by: her platforms (TikTok,
 * Instagram), her niche (Lifestyle, then Fashion and Motherhood), the
 * first sentence of her voice sample, two market shares (AE 39%, SA 22%),
 * the share of her audience in the lead campaign's markets (61%), her paid
 * share (20%), her cadence (4 a week since 2021), and her draft d-2 for
 * Maison Dune: the product, that it is due in 4 days, and that it misses
 * the price, the code and the link, each with its fix. The lead
 * campaign's own target (24 to 45, any gender) is the brand's. That list,
 * and Nabati Home as the first pick, need a yes before this page goes
 * outside the team. The first pick was Ounass until 24 Sep, when tied
 * scores stopped being broken by the order of BRANDS (see the note
 * beside PREQUALIFIED_CAP).
 *
 * WHAT IT SHOWS IS NOT ALL IT SHIPS. The redaction above is of what is
 * drawn. This module, figma.tsx (through model.ts) and the store (through
 * tools.ts) all import the fixtures as values, so the browser downloads
 * people.ts, brands.ts and tools.ts whole on this route, as it does on
 * every product route. Building the demo on the server would not change
 * that while those imports stand, so it is flagged rather than half done.
 *
 * Mock chrome copies the product's labels as they are ("Join Campaign",
 * "Pre-upload Check", "Request to join"), because a likeness that renames
 * the button is a drawing of some other product. Every landing sentence
 * is sentence case, and all of them live in COPY, for the Arabic pass.
 *
 * There is no demo affordance: no Try chips and no fallback handle, as on
 * brands, which dropped its sample store. An empty or unusable handle gets
 * the invalid line. A usable handle that is not seeded is read in /c as
 * a sample: PEOPLE[0]'s figures under the handle that was typed, with no
 * name, avatar or location of hers, and a line on the read saying it is
 * not theirs (personFor).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GeistSans } from "geist/font/sans";
import { At, Check, Lock } from "@phosphor-icons/react";
import { Wordmark } from "./components/Wordmark";
import { Soc } from "./components/figma";
import { countWord } from "./components/blocks";
import {
  MockCheck, MockField, MockPicks, MockRead, MockTerms, MockTiers, MockWhy, MoneyPanel, ShareScale,
  type MockCheckRow, type MockReadRow, type MockReadValue, type MockSignal,
} from "./components/landing/Mocks";
import { Run, type Step } from "./components/landing/Run";
import { Constellation } from "./components/landing/Constellation";
import { PEOPLE } from "./lib/mock/people";
import { BRANDS } from "./lib/mock/brands";
import { DRAFTS, READ_TASKS, fullReadFor, offersFor, profileFor, readIdFor, tools } from "./lib/agent/tools";
import { CADENCES, chatPicks, wantsYou, type CreatorRead, type Platform } from "./lib/agent/types";
import { bundleLine, MATCH_WORD } from "./lib/agent/model";
import { costOf } from "./lib/agent/stream";
import { chatCampaigns, chatCampaignsTitle } from "./lib/join";
import { AGENTS } from "./lib/agent/agents";
import { DEFAULT_AUTONOMY, useAccount, useActiveProfile } from "./lib/store";
import { AccountSheet, dialFor } from "./components/AccountSheet";
import { signIn } from "./lib/session";
import { displayHandle, handleKey } from "./lib/handle";
import { useReducedMotion, useReveal, useVisible } from "./lib/useReveal";
import { AudienceSwitch } from "@/app/_shared/AudienceSwitch";

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

/* Every sentence on the page, in one place, so the Arabic pass edits a
   dictionary rather than a layout. Strings rather than JSX text, which
   also keeps apostrophes out of react/no-unescaped-entities. Mock chrome
   that copies product UI is not here: it stays in Mocks.tsx in the
   product's own English, as the product's does. A sentence a mock draws
   that no product screen prints is the landing's, so it lives here and
   goes in as a prop (tiersRest, shareSpoken). */
const COPY = {
  navFor: "for creators",
  navDashboard: "Dashboard",
  navStart: "Start",

  h1a: "Your posts already sell.",
  h1b: "Take a cut of it.",
  placeholder: "yourhandle",
  cta: "Start",
  going: "Reading",
  invalid: "Paste your Instagram or TikTok handle, or the link to your profile.",
  fieldLabel: "Your Instagram or TikTok handle",
  checks: ["No sign-up to start", "No agency in the middle", "Paid on time"],

  howH2: "One handle. Every campaign that fits.",
  howSub: "Paste your Instagram or TikTok handle. HeyMoon reads your work and brings the live campaigns that fit. Each pays a share of every order you bring in.",
  cards: [
    { title: "HeyMoon reads your grid", body: "What you post, where your audience is and how you sound on camera. In about fifteen seconds." },
    { title: "Matched on influence. Not on size.", body: "Where your audience is, how much of your grid is your own work, how steadily you post and who the brand asked for." },
    { title: "Up to three, Pre-qualified.", body: "Those you join outright, with no brand review. Every other campaign is a request the brand answers." },
  ],

  runH2: "From a handle to a live post.",
  runSub: "Four steps. The agents read, match and check. Joining and reporting are yours.",
  steps: [
    { title: "Paste your handle", body: "Five agents read your last thirty posts, where your audience is, how you talk on camera and which brands are already in your grid." },
    { title: "Your matches arrive", body: "Each shows where it runs and the share of every order it pays. Up to three you join outright." },
    { title: "You join the campaign", body: "Choose how often you can post, then read what you agree to and, in the same weight, what you do not." },
    { title: "Post it, then report it", body: "You post from your own account, then submit the ad. MoonWriter AI checks it against the brief and names anything missing. Once it's accepted, it counts toward your payout." },
  ],
  doneBy: "Done by",
  you: "You",
  /* Step 1 is pasted by you and read by the agents, and step 4 is
     posted and reported by you and then checked, so both credits name
     the two, in the order they happen. */
  youThen: (who: string) => `You, then ${who}`,
  agentsWord: (n: string) => `${n} agents`,
  /* The foot of the tiers card. The product prints no such line, so it
     is the landing's sentence and lives here, not in the mock. */
  tiersRest: (n: number) => `${n} more, each a request to join`,

  paidH2: "When do you get paid?",
  paidSub: "Each brand funds its phase before the brief is written, and HeyMoon holds it. Orders on your code and link are counted weekly, and your share of the ones that cleared is paid that week.",
  signature: "HeyMoon.AI, a Saudi company",
  paidLabel: "Your payout is paid",
  paidFigure: "Weekly",
  paidNote: "On the orders your code and link carried, once they cleared.",
  paidSteps: ["Funded", "Held for you", "Orders counted", "Paid"],

  shareH2: "The brand sets the payout. You bring the orders.",
  shareSub: "Each campaign's share of the order value is set by its brand before anyone joins. Nothing to negotiate: a quiet week pays less, and a good one pays more.",
  countedThrough: "Every order is counted through",
  chips: ["Your code", "Your tracking link"],
  shareLabel: "Payout on every order",
  shareNote: (n: number) => `One dot for each of the ${n} campaigns live today.`,
  /* What a screen reader hears for the scale. The scale counts, and
     this says the count, so the words and the dots cannot drift. */
  shareSpoken: ({ total, min, max, counts }: { total: number; min: number; max: number; counts: { p: number; count: number }[] }) =>
    `Shares of every order across ${total} live campaigns, from ${min}% to ${max}%: ${counts
      .map((c) => `${c.count} at ${c.p}%`)
      .join(", ")}.`,

  agentsH2: "Seven agents. None of them can act as you.",
  agentsSub: "Each one owns a stage and puts its name to what it did.",
  lockedEyebrow: "Locked for every agent",
  never: "Never",

  platformsH2: "Your handle is all it needs.",
  platformsSub: "Instagram or TikTok. Nothing to connect to start, and HeyMoon holds no password to any account you have.",

  closeH2: "Paste your handle.",
  lockNote: "No agent posts for you. No agent signs for you. No screen changes that.",
  credit: "Built by AI. Backed by HeyMoon.AI, a Saudi company.",
};

/* Only these two, because every campaign ask in brands.ts is one or the
   other. The band claims nothing about connecting either. */
const PLATFORMS: Platform[] = ["Instagram", "TikTok"];

/* ------------------------------------------------------------------ */
/* The demo, built once                                                */
/* ------------------------------------------------------------------ */

/* Computed on, never shown. Every mock prints SHOWN where a handle goes. */
const DEMO = PEOPLE[0].handle;
const SHOWN = "@yourhandle";

/* blocks.tsx's LAYER_LABEL, which is not exported, for the seven rows
   the landing's read shows. */
type Shown = "identity" | "accounts" | "niche" | "voice" | "audience" | "reach" | "cadence";
const LABEL: Record<Shown, string> = {
  identity: "You", accounts: "Accounts", niche: "What you post", voice: "Your voice",
  audience: "Audience", reach: "Performance", cadence: "Rhythm",
};

/** Up to the first full stop that ends a sentence. The product writes
    its terms as a claim and then the reason, and a mock has room for the
    claim. */
const firstSentence = (s: string) => {
  const i = s.indexOf(". ");
  return i < 0 ? s : s.slice(0, i + 1);
};

/** A match signal's detail without its ", which is where this campaign
    sells" tail, which only makes sense beside the campaign. */
const firstClause = (s: string) => {
  const w = s.indexOf(", which");
  return w < 0 ? firstSentence(s) : `${s.slice(0, w)}.`;
};

/** The product's own unit costs, scaled so the whole run lands inside
    `span` ms after a short lead. Each moment is when that unit finishes,
    so the gaps stay as uneven as the real stream's. */
const paced = (costs: number[], span: number, lead = 300) => {
  let c = 0;
  const cum = costs.map((x) => (c += x));
  return cum.map((x) => Math.round(lead + (x * span) / c));
};


/* ONE RULE: every mock's props are built here, once, and the mocks never
   touch a fixture. The evidence ids tools.ts mints from its module
   counter differ between the server and the client, so none of them is
   ever rendered, and the markup the two produce is the same. */
function useDemo() {
  return useMemo(() => {
    const id = readIdFor(DEMO);
    const read: CreatorRead = { ...fullReadFor(DEMO, id), done: READ_TASKS.map((t) => t.key) };
    const profile = profileFor(read);
    const offers = offersFor(profile);
    const picks = chatPicks(offers);
    const lead = picks[0];
    const requests = offers.filter((o) => o.state === "open" && wantsYou(o) && o.match.level !== "prequalified");
    const req = tools.request_accept({ offer: lead, cadence: "3pw" });
    const cadence = CADENCES.find((c) => c.key === req.cadence)!;
    const draft = DRAFTS.find((d) => d.id === "d-2")!;
    const live = BRANDS.filter((b) => !b.ended);

    const task = (k: Shown) => READ_TASKS.find((t) => t.key === k)!;
    const row = (key: Shown, value: MockReadValue | null): MockReadRow =>
      ({ key, label: LABEL[key], agent: task(key).agent, note: task(key).note, value });

    const signals: MockSignal[] = lead.match.signals.map((s) => ({
      label: s.label, detail: firstClause(s.detail), strong: s.strong,
    }));

    /* No location on the You row and one handle on Accounts: with the
       niche, the markets and the cadence beside them, a city is what
       would start to name the person. Performance and Rhythm are never
       reached (the read stops at 5/9), so they carry no value at all. */
    const rows: MockReadRow[] = [
      row("identity", { kind: "text", text: SHOWN }),
      row("accounts", { kind: "accounts", accounts: read.accounts!.value.map((a) => ({ platform: a.platform, handle: SHOWN })) }),
      row("niche", { kind: "text", text: `${read.niche!.value.primary}, then ${read.niche!.value.also.join(" and ")}.` }),
      row("voice", { kind: "quote", text: firstSentence(read.voice!.value.sample) }),
      row("audience", {
        kind: "markets",
        markets: read.audience!.value.markets.slice(0, 2).map(({ code, name, share }) => ({ code, name, share })),
      }),
      row("reach", null),
      row("cadence", null),
    ];

    /* THE BUNDLE, not the re-cut. The line is request_accept's first
       commit, built with the same bundleLine, without its "About N
       weeks of posting" tail. Its re-cut line is
       left out: alone it read as the only obligation, and it would put
       "cut" on the page as a video edit beside the hero's other "cut".
       The brief line is left out for height, so all four not-commits
       stay above the fade. */
    const bundle = bundleLine(req.deliverables);

    /* The misses only, each with its fix: the product never says just
       "failed". Paced by each check's own unit key (`${id}:c${index}`,
       as check_draft does), and one last moment for the chip. */
    const misses = draft.check.checks
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !c.clean);
    const checkRows: MockCheckRow[] = misses.map(({ c }) => ({
      label: c.label,
      clean: c.clean,
      line: c.clean ? c.detail : undefined,
      fix: !c.clean && c.fix ? firstSentence(c.fix) : undefined,
    }));
    const checkAt = paced(misses.map(({ i }) => costOf(`${draft.id}:c${i}`, 2)), 4800);

    const readers = countWord(new Set(READ_TASKS.map((t) => t.agent)).size);

    return {
      readers,
      field: { handle: SHOWN, platforms: read.accounts!.value.map((a) => a.platform) },
      why: { level: MATCH_WORD[lead.match.level], signals },
      tiers: { picks, next: requests[0] ?? null, rest: Math.max(0, requests.length - 1) },
      read: {
        sub: `${SHOWN} · ${readers} agents`,
        total: READ_TASKS.length,
        rows,
        /* Five moments, so the count stops at 5/9 with Performance
           working: a true live state, and the only one in which that
           row says nothing it should not. */
        at: paced(READ_TASKS.slice(0, 5).map((t) => costOf(`${id}:${t.key}`, t.weight)), 5600),
      },
      picks: { title: chatCampaignsTitle(chatCampaigns(offers, [], {}), countWord), offers: picks },
      terms: {
        brand: req.brand,
        needsApproval: req.needsApproval,
        commissionPct: req.commissionPct,
        commits: [`${bundle}, at ${cadence.label.toLowerCase()}.`],
        notCommits: req.notCommits.map(firstSentence),
      },
      check: {
        product: draft.product,
        brand: draft.brand,
        dueIn: draft.dueIn,
        rows: checkRows,
        misses: draft.check.checks.filter((c) => !c.clean).length,
        at: [...checkAt, checkAt[checkAt.length - 1] + 450],
      },
      shares: live.map((b) => b.perOrderPct),
      liveCount: live.length,
      locks: DEFAULT_AUTONOMY.filter((r) => r.locked && r.level === "never").map((r) => r.label),
    };
  }, []);
}

/* ------------------------------------------------------------------ */
/* The field                                                           */
/* ------------------------------------------------------------------ */

const TYPE_MS = 85;
const DELETE_MS = 35;
const HOLD_MS = 1700;
const GAP_MS = 320;

/** Types a word out, holds it, deletes it, moves to the next. Brands'
    hook, verbatim.
 *
 * It runs only while the field is empty, and with one word it types it
 * once and holds, the way a placeholder does. No timestamps and no
 * randomness: the cycle is an index, which keeps it deterministic and
 * keeps server and client markup identical. */
function useTypedHint(words: string[], active: boolean) {
  const [text, setText] = useState("");
  const [at, setAt] = useState(0);
  const [phase, setPhase] = useState<"type" | "hold" | "delete">("type");

  useEffect(() => {
    if (!active) return;
    const word = words[at % words.length];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "type") {
      t = text.length < word.length
        ? setTimeout(() => setText(word.slice(0, text.length + 1)), TYPE_MS)
        : setTimeout(() => setPhase("hold"), 0);
    } else if (phase === "hold") {
      /* One example, written once. With nothing to cycle to there is
         nothing to erase for, so it stays on the field the way a
         placeholder does. */
      if (words.length < 2) return;
      t = setTimeout(() => setPhase("delete"), HOLD_MS);
    } else {
      t = text.length > 0
        ? setTimeout(() => setText(text.slice(0, -1)), DELETE_MS)
        : setTimeout(() => { setAt((n) => n + 1); setPhase("type"); }, GAP_MS);
    }
    return () => clearTimeout(t);
  }, [text, phase, at, active, words]);

  /* Reset when it stops, so it starts cleanly rather than mid-word. */
  useEffect(() => {
    if (!active) { setText(""); setPhase("type"); }
  }, [active]);

  return text;
}

/* The placeholder is the thing that gets written. A real handle in the
   field would read as somebody else's account. Module scope, so the
   hook is handed the same array on every render. */
const HINTS = [COPY.placeholder];

/* What a handle can be. handleKey already reduces a pasted profile link
   to the handle it names, so what is left to refuse is what it cannot
   reduce: stray punctuation, and a bare site with no profile on it
   ("instagram.com", "https://www.tiktok.com"), which would otherwise
   reach the conversation as "@www.instagram.com". */
const HANDLE = /^[a-z0-9._]{1,30}$/;
const BARE_SITE = /^([a-z0-9-]+\.)?(instagram|tiktok)\.com$/;

const usableHandle = (raw: string): string | null => {
  const key = handleKey(raw);
  return HANDLE.test(key) && !BARE_SITE.test(key) ? displayHandle(raw) : null;
};

function HandleField({ id, autoFocus = false }: { id: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [going, setGoing] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [focused, setFocused] = useState(false);
  const [still, setStill] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* Reduced motion gets the plain placeholder and no typing at all.
     `still` starts true, as on brands, so the server and the first paint
     show the real placeholder rather than an empty field with a caret. */
  useEffect(() => {
    setStill(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    /* The server HTML carries `autofocus`, so the browser focuses the
       hero field before React is listening, and hydration never calls
       onFocus. Read the real state once, or the hint draws its caret
       beside the input's own. */
    if (document.activeElement === input.current) setFocused(true);
  }, []);

  /* It keeps typing while the field is focused and empty, because the
     hero field takes focus on load and a hint that stopped there would
     be a hint nobody ever saw. What it drops on focus is its caret: the
     field has a real one by then. */
  const hinting = !still && !value;
  const hint = useTypedHint(HINTS, hinting);

  const submit = () => {
    const h = usableHandle(value);
    if (!h) {
      setInvalid(true);
      input.current?.focus();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setInvalid(false), 4000);
      return;
    }
    setGoing(true);
    router.push(`/creators/c?h=${encodeURIComponent(h)}`);
  };

  return (
    <div className="w-full max-w-[580px]">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        noValidate
        /* No focus ring on the card. A text input matches :focus-visible
           on a mouse click too, so a ring here fires for everyone. The
           caret is the input's focus affordance, and the button keeps
           the global outline from globals.css. */
        className={`relative w-full overflow-hidden rounded-[24px] bg-white text-start shadow-hm-field ring-1 transition duration-150 ${
          invalid ? "ring-danger" : "ring-ink/[0.08]"
        }`}
      >
        <label htmlFor={id} className="sr-only">{COPY.fieldLabel}</label>
        {/* The one element that never mirrors: a handle is typed left to
            right in every language. The @ is the icon's, so the
            placeholder carries none. */}
        <div dir="ltr" className="relative h-[76px]">
          <At size={19} aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            ref={input}
            id={id}
            value={value}
            onChange={(e) => { setValue(e.target.value); if (invalid) setInvalid(false); }}
            placeholder={hinting ? "" : COPY.placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="go"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="h-full w-full bg-transparent pe-[108px] ps-[52px] text-left text-[18px] tracking-[-0.01em] text-ink outline-none focus-visible:outline-none placeholder:text-ink/35 sm:text-[19px]"
          />
          {/* Over the input rather than in its placeholder, so it can
              carry a caret. It never takes a click. */}
          {hinting && (
            <p aria-hidden className="pointer-events-none absolute inset-y-0 left-[52px] flex items-center text-[18px] tracking-[-0.01em] text-ink/35 sm:text-[19px]">
              <span className="num">{hint}</span>
              {!focused && <span className="ms-[2px] inline-block h-[22px] w-px motion-safe:animate-caret bg-ink/45" />}
            </p>
          )}
          <button
            type="submit"
            className="absolute end-2.5 top-1/2 h-11 shrink-0 -translate-y-1/2 rounded-[12px] bg-ink px-5 text-[14px] font-semibold text-white transition-colors hover:bg-ink/85"
          >
            {going ? COPY.going : COPY.cta}
          </button>
        </div>
      </form>

      {/* Only when something is wrong, and under the field rather than
          in it, so a clean field stays a clean field. */}
      {invalid && (
        <p role="alert" className="mt-3 text-center text-[13px] text-danger">{COPY.invalid}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A card: a picture of the product, then two lines about it.          */
/* ------------------------------------------------------------------ */

function Card({ title, body, delay = 0, children }: { title: string; body: string; delay?: number; children: React.ReactNode }) {
  return (
    <li style={{ transitionDelay: `${delay}ms` }} className="reveal overflow-hidden rounded-[24px] bg-white p-3 ring-1 ring-ink/[0.06] shadow-hm-card">
      {/* The media area. Each mock places itself in it: centred when it
          is short, anchored to the top when it is tall. */}
      <div className="hm-media relative h-[228px] overflow-hidden rounded-[18px]">{children}</div>
      <div className="px-4 pb-4 pt-6">
        <h3 className="text-[19px] font-semibold leading-[1.25] tracking-[-0.02em] text-ink">{title}</h3>
        <p className="mt-2.5 text-[15px] leading-[1.6] text-ink/60">{body}</p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */

export default function Landing() {
  const demo = useDemo();
  const reduced = useReducedMotion();
  /* THE DASHBOARD IS ALWAYS ONE PRESS AWAY, behind a login. Signed in on
     this device — an account and the profile the conversation built —
     it opens straight away. Otherwise the press opens the log-in sheet:
     the phone, then the code, then the dashboard (see lib/session.ts
     for a device that holds no profile). Hydration-safe, because the
     store's server snapshot has neither. */
  const router = useRouter();
  const profile = useActiveProfile();
  const signedIn = useAccount() !== null && profile !== null;
  const [login, setLogin] = useState(false);
  const toDashboard = () => (signedIn ? router.push("/creators/dashboard") : setLogin(true));

  const reveal1 = useReveal<HTMLElement>(0.1);
  const reveal3 = useReveal<HTMLElement>(0.08);
  const reveal2 = useReveal<HTMLElement>(0.1);
  const reveal6 = useReveal<HTMLElement>(0.15);
  const reveal4 = useReveal<HTMLElement>(0.1);
  const reveal5 = useReveal<HTMLElement>(0.2);
  const reveal7 = useReveal<HTMLElement>(0.15);

  /* THE START PILL stands in for a field when neither is on screen. The
     hero field counts as gone once it slides under the 64px header, not
     once it leaves the viewport, or there is a stretch with neither; and
     while the close field is in view there is a field right there, so a
     pill that scrolled back to the top would be a detour. */
  const [heroField, heroInView] = useVisible<HTMLDivElement>(0, true, "-64px 0px 0px 0px");
  const [closeField, closeInView] = useVisible<HTMLDivElement>(0, false);
  const pill = !heroInView && !closeInView;

  const toField = () => {
    const el = document.getElementById("handle-top");
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  };

  const rise = (ms: number) => ({
    className: "motion-safe:animate-rise",
    style: { animationDelay: `${ms}ms` } as const,
  });

  const step = (ms: number) => ({
    className: "reveal",
    style: { transitionDelay: `${ms}ms` } as const,
  });

  /* The four steps of the journey the review agreed, qualify, match and
     activate, with the join between the last two. Each credit names
     only who did that part. Step 3 is "You" alone, because no agent can
     take it: DEFAULT_AUTONOMY locks joining at Never and request_accept
     only ever returns a request. Step 1 is you and then the read's own
     agents, since you paste and they read. Step 4 is MoonWriter and then
     you, because the report after the check is locked at Never for
     every agent, two sections down, and a credit that gave it to
     MoonWriter would say otherwise. */
  const steps: Step[] = [
    { key: "read", ...COPY.steps[0], agent: COPY.youThen(COPY.agentsWord(demo.readers)), panel: (active: boolean) => <MockRead {...demo.read} active={active} /> },
    { key: "match", ...COPY.steps[1], agent: AGENTS[1], panel: (active: boolean) => <MockPicks {...demo.picks} active={active} /> },
    { key: "join", ...COPY.steps[2], agent: COPY.you, panel: <MockTerms {...demo.terms} /> },
    { key: "check", ...COPY.steps[3], agent: COPY.youThen(AGENTS[3]), panel: (active: boolean) => <MockCheck {...demo.check} active={active} /> },
  ];

  return (
    /* Geist is scoped here rather than on <html>: the variable resolves
       on this element, and the font preloads on "/" only. `clip`, not
       `hidden`, so the sticky header keeps working. */
    <div className={`${GeistSans.variable} min-h-[100dvh] overflow-x-clip bg-ground font-geist text-ink`}>
      {/* ── Nav ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-ground/85 backdrop-blur-md">
        <div {...rise(0)} className={`${rise(0).className} mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-5 sm:px-8`}>
          <div className="flex items-center">
            <Wordmark size="md" />
            <span className="ms-3 border-s border-ink/10 ps-3 text-[13px] font-medium text-ink/60">{COPY.navFor}</span>
          </div>
          <nav aria-label="Site" className="flex items-center gap-2">
            {/* Start stands in for the field once it has scrolled away,
                and is quieter than Dashboard so the two never compete.
                While hidden it is out of the tab order and out of the
                accessibility tree. A signed-in creator does not need it. */}
            {!signedIn && (
              <button
                type="button"
                onClick={toField}
                aria-hidden={pill ? undefined : true}
                tabIndex={pill ? undefined : -1}
                className={`rounded-[10px] px-3.5 py-2 text-[13px] font-semibold text-ink ring-1 ring-ink/15 transition-[background-color,opacity] duration-200 hover:bg-ink/[0.04] motion-reduce:transition-none ${
                  pill ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {COPY.navStart}
              </button>
            )}
            <button
              type="button"
              onClick={toDashboard}
              className="rounded-[10px] bg-ink px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-ink/85"
            >
              {COPY.navDashboard}
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero. Two lines and the field, centred. ────────────────── */}
      <section className="relative">
        {/* The nav is 64px and sits in the flow, so the hero takes what
            is left of the viewport and centres in it. `svh`, so a phone's
            collapsing address bar cannot crop the field. */}
        <div className="mx-auto flex min-h-[calc(100svh-64px)] w-full max-w-[1120px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
          {/* Brands or creators, as on the brands landing. */}
          <div {...rise(0)} className={`${rise(0).className} mb-10 sm:mb-12`}>
            <AudienceSwitch current="creators" />
          </div>
          <h1 className="max-w-[20ch] text-balance text-[clamp(40px,6.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.038em] text-ink rtl:leading-[1.2] rtl:tracking-normal">
            <span {...rise(70)} className={`${rise(70).className} block`}>{COPY.h1a}</span>
            <span {...rise(140)} className={`${rise(140).className} hm-grad-text block`}>{COPY.h1b}</span>
          </h1>

          <div ref={heroField} {...rise(210)} className={`${rise(210).className} relative mt-11 flex w-full justify-center`}>
            <div aria-hidden className="hm-glow pointer-events-none absolute inset-x-0 -inset-y-10" />
            <HandleField id="handle-top" autoFocus />
          </div>

          <ul {...rise(280)} className={`${rise(280).className} mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-ink/60`}>
            {COPY.checks.map((c) => (
              <li key={c} className="flex items-center gap-1.5">
                <Check size={12} weight="bold" aria-hidden className="text-main/70" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Three cards, each one a picture of the product. ────────── */}
      <section id="how" ref={reveal1} className="mx-auto w-full max-w-[1120px] px-5 pb-8 sm:px-8">
        <div {...step(0)} className="reveal mx-auto mb-12 max-w-[720px] text-center">
          <h2 className="text-balance text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.035em] text-ink rtl:leading-[1.25] rtl:tracking-normal">
            {COPY.howH2}
          </h2>
          <p className="mx-auto mt-4 max-w-[50ch] text-[16px] leading-[1.6] text-ink/60">{COPY.howSub}</p>
        </div>
        <ul className="grid gap-5 lg:grid-cols-3">
          <Card delay={0} {...COPY.cards[0]}>
            <MockField {...demo.field} />
          </Card>
          <Card delay={90} {...COPY.cards[1]}>
            <MockWhy {...demo.why} />
          </Card>
          <Card delay={180} {...COPY.cards[2]}>
            <MockTiers {...demo.tiers} restLine={COPY.tiersRest} />
          </Card>
        </ul>
      </section>

      {/* ── How it runs: four steps, one panel, on a timer. ───────── */}
      <section ref={reveal3} className="mx-auto w-full max-w-[1120px] px-5 py-24 sm:px-8 sm:py-32">
        <div {...step(0)} className="reveal max-w-[620px]">
          <h2 className="text-balance text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.035em] text-ink rtl:leading-[1.25] rtl:tracking-normal">
            {COPY.runH2}
          </h2>
          <p className="mt-4 max-w-[50ch] text-[16px] leading-[1.6] text-ink/60">{COPY.runSub}</p>
        </div>
        <div {...step(120)} className="reveal mt-14">
          <Run creditLabel={COPY.doneBy} steps={steps} />
        </div>
      </section>

      {/* ── When you get paid. The one dark object before the agents. ─
          The creator's own first question (REVIEW item 15), answered
          with the product's funding sentence and its weekly payout, and
          no figure: the share has no ceiling and a phase pot does, so
          any number here would be a promise nobody made. */}
      <section id="paid" ref={reveal2} className="mx-auto w-full max-w-[1120px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div {...step(0)}>
            <h2 className="max-w-[16ch] text-balance text-[clamp(30px,3.6vw,44px)] font-semibold leading-[1.1] tracking-[-0.035em] text-ink rtl:leading-[1.25] rtl:tracking-normal">
              {COPY.paidH2}
            </h2>
            <p className="mt-5 max-w-[48ch] text-[16px] leading-[1.65] text-ink/60">{COPY.paidSub}</p>
            <div className="mt-9">
              <span aria-hidden className="hm-grad-rule rule-draw block h-[2px] w-[200px] rounded-full [transition-duration:500ms]" />
              <p className="mt-3 text-[13px] text-ink/60">{COPY.signature}</p>
            </div>
          </div>
          <div {...step(130)}>
            <MoneyPanel label={COPY.paidLabel} figure={COPY.paidFigure} note={COPY.paidNote} steps={COPY.paidSteps} />
          </div>
        </div>
      </section>

      {/* ── The share, on its scale. ─────────────────────────────────
          Every live campaign's share as a dot. It never says "the same
          for everyone": five of them add an early-bird bonus, and the
          card says so. */}
      <section ref={reveal6} className="border-y border-ink/[0.06] bg-white/60">
        <div className="mx-auto grid w-full max-w-[1120px] items-center gap-12 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-16">
          <div {...step(0)}>
            <h2 className="max-w-[17ch] text-balance text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.035em] text-ink rtl:leading-[1.25] rtl:tracking-normal">
              {COPY.shareH2}
            </h2>
            <p className="mt-4 max-w-[48ch] text-[16px] leading-[1.6] text-ink/60">{COPY.shareSub}</p>
            {/* The only two ways an order is attributed (Offer.code and
                Offer.trackingLink), in CodeBadge's own words. Two ways,
                not a sequence, so a list rather than brands' ladder. */}
            <p className="mt-8 text-[13px] font-medium text-ink/60">{COPY.countedThrough}</p>
            <ul className="mt-3 flex flex-wrap items-center gap-2">
              {COPY.chips.map((c, i) => (
                <li
                  key={c}
                  className={`rounded-[10px] px-3 py-2 text-[14px] ${
                    i === 0 ? "bg-main/[0.08] font-semibold text-main" : "bg-ink/[0.04] text-ink/60"
                  }`}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div {...step(130)}>
            <ShareScale shares={demo.shares} label={COPY.shareLabel} note={COPY.shareNote(demo.liveCount)} spoken={COPY.shareSpoken} />
          </div>
        </div>
      </section>

      {/* ── The seven, and the three things none of them can do. ───── */}
      <section ref={reveal4} className="mx-auto w-full max-w-[1120px] px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="overflow-hidden rounded-[26px] bg-deep px-6 py-14 ring-1 ring-white/[0.08] sm:px-12 sm:py-16">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div {...step(0)}>
              <h2 className="max-w-[16ch] text-balance text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.035em] text-white rtl:leading-[1.25] rtl:tracking-normal">
                {COPY.agentsH2}
              </h2>
              <p className="mt-4 max-w-[42ch] text-[16px] leading-[1.6] text-white/55">{COPY.agentsSub}</p>
              {/* Read off DEFAULT_AUTONOMY, so this list and the autonomy
                  page cannot disagree. The eyebrow says whom they lock,
                  so "Report a post as live" does not read as a ban on
                  the creator. */}
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{COPY.lockedEyebrow}</p>
              <ul className="mt-3 max-w-[380px] divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {demo.locks.map((l) => (
                  <li key={l} className="flex items-center gap-3 py-3">
                    <Lock size={14} weight="fill" aria-hidden className="shrink-0 text-white/45" />
                    <span className="flex-1 text-[14px] text-white/80">{l}</span>
                    <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-white/60">{COPY.never}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div {...step(130)}><Constellation /></div>
          </div>
        </div>
      </section>

      {/* ── What it takes: a handle. ─────────────────────────────────
          No claim about where the read comes from and none about
          connecting TikTok: only that nothing is connected to start
          and that HeyMoon holds no password (store.ts). */}
      <section ref={reveal5} className="border-y border-ink/[0.06] bg-white/60">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div {...step(0)} className="reveal max-w-[520px]">
            <h2 className="text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.2] tracking-[-0.03em] text-ink rtl:tracking-normal">
              {COPY.platformsH2}
            </h2>
            <p className="mt-2.5 text-[15px] leading-[1.6] text-ink/60">{COPY.platformsSub}</p>
          </div>
          <ul {...step(120)} className="reveal flex flex-wrap items-center gap-x-12 gap-y-7">
            {PLATFORMS.map((p) => (
              <li key={p} className="flex h-9 items-center gap-2.5">
                {/* The square is decoration: the name beside it is what
                    a screen reader should say, once. */}
                <span aria-hidden className="flex"><Soc platform={p} size={36} /></span>
                <span className="text-[19px] font-semibold tracking-[-0.02em] text-ink/70">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── The close: the same field, now that each part is shown. ── */}
      <section ref={reveal7} className="border-t border-ink/[0.06]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
          <h2 {...step(0)} className="reveal text-balance text-[clamp(30px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.038em] text-ink rtl:leading-[1.2] rtl:tracking-normal">
            {COPY.closeH2}
          </h2>
          <div ref={closeField} {...step(110)} className="reveal relative mt-10 flex w-full justify-center">
            <div aria-hidden className="hm-glow pointer-events-none absolute inset-x-0 -inset-y-10 opacity-70" />
            <HandleField id="handle-bottom" />
          </div>
          <p {...step(200)} className="reveal mt-8 flex items-center gap-2 text-[13px] text-ink/60">
            <Lock size={12} weight="fill" aria-hidden />
            {COPY.lockNote}
          </p>
          <p {...step(240)} className="reveal mt-2 text-[12px] text-ink/60">{COPY.credit}</p>
        </div>
      </section>

      {/* ── Colophon. ─────────────────────────────────────────────── */}
      <footer className="border-t border-ink/[0.06]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          {/* The mark, not a roster: the constellation already shows the
              system, and the run credits each agent at its step. */}
          <Wordmark size="md" />
          <button type="button" onClick={toDashboard} className="self-start text-[13px] font-medium text-ink/60 transition hover:text-ink md:self-auto">
            {COPY.navDashboard}
          </button>
        </div>
      </footer>

      {/* Logging in: the number, the code, the dashboard. */}
      <AccountSheet open={login} mode="signin" name={profile?.creatorName}
        dial={dialFor(PEOPLE.find((x) => x.handle === profile?.handle)?.location ?? PEOPLE[0].location)}
        onClose={() => setLogin(false)}
        onVerified={(a) => { signIn(a); setLogin(false); router.push("/creators/dashboard"); }} />
    </div>
  );
}
