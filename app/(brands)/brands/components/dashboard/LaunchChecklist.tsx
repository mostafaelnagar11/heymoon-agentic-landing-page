"use client";

/* The cold start (brand flows, P2, 19 Oct review).

   A brand who has just paid for Phase 1 used to land on a running dashboard: sales, a pace, a staircase of phases,
   all of it someone else's numbers or zero. Yousef: start them cold, like Stripe's onboarding. So until the first ad
   is live the dashboard is this, a list of what is left, in order, with the current step open:

     1 Connect the store        the guarantee is measured on its orders
     2 Tracking codes           made on connection, one per creator
     3 Meet the creators        names and faces now visible; keep or swap each one
     4 Approve the brief        the one from the conversation; changes in words
     5 Launch requirements      enterprise brands only: legal, products, sign-off
     6 Invite the team          optional
     7 First drafts             review with HeyMoon; approving the first one takes Phase 1 live

   No sales figure appears until there are sales. Approving the first draft ends the checklist, and the dashboard
   becomes the running one. */

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowsClockwise, Barcode, CaretDown, Check, CheckCircle, FileText, FilmSlate, Lock, PlugsConnected,
  ShieldCheck, Sparkle, UserPlus, UsersThree,
} from "@phosphor-icons/react";
import {
  PASS_REASONS, clearCreatorSignal, connectStore, deliverDrafts, goLive, inviteMember, passCreator, patchLaunch,
  putPlan, setAdState, trackingCode, useAccount, useActiveCampaign, useAds, useBrandAccount, useStore,
  type Campaign, type Launch,
} from "../../lib/store";
import { marketName, poolFor, tools } from "../../lib/agent/tools";
import { getRead } from "../../lib/agent/registry";
import { creatorById } from "../../lib/mock/creators";
import { fmtUSD } from "../../lib/mock/campaigns";
import { isPersonal, looksLikeEmail } from "../../lib/email";
import type { AdRecord, Plan } from "../../lib/agent/types";
import { IntegrationBlock } from "../blocks";
import { Avatar, Btn } from "../ui";
import { useHeyMoon } from "./HeyMoon";

const PLATFORM: Record<string, string> = { salla: "Salla", zid: "Zid", shopify: "Shopify", magento: "Magento" };

const listOf = (parts: string[]) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));

interface Step {
  key: string;
  icon: ReactNode;
  title: string;
  detail: string;
  done: boolean;
  /** Waiting on an earlier step; it says which. */
  locked?: boolean;
  optional?: boolean;
  body?: ReactNode;
}

export function LaunchChecklist() {
  const camp = useActiveCampaign();
  const plan = useStore((s) => (camp?.planId ? s.plans[camp.planId] ?? null : null));
  if (!camp?.launch || !plan) return null;
  return <Checklist camp={camp} launch={camp.launch} plan={plan} />;
}

function Checklist({ camp, launch, plan }: { camp: Campaign; launch: Launch; plan: Plan }) {
  const ads = useAds();
  const brand = useBrandAccount(camp.url);
  const account = useAccount();
  const { show } = useHeyMoon();
  const crew = plan.creators.value;
  const connected = camp.connectedStore;
  const drafts = ads.filter((a) => camp.adIds.includes(a.id) && a.id.startsWith(`${camp.id}-draft-`));
  const teamDone = launch.teamDone || (brand?.members.length ?? 0) > 0;
  const enterpriseDone = Object.values(launch.enterpriseSteps).every(Boolean);
  /* What the creators need before they can film: the store (so their codes count), the crew and the brief. */
  const readyToFilm = !!connected && launch.creatorsKept && launch.briefApproved && (!launch.enterprise || enterpriseDone);

  const steps: Step[] = [
    {
      key: "store",
      icon: <PlugsConnected size={16} weight="fill" />,
      title: "Connect your store",
      detail: connected
        ? `${PLATFORM[connected] ?? connected} connected. Every order through a creator's code counts.`
        : "So every order through a creator's code counts toward the guarantee.",
      done: !!connected,
      body: connected ? undefined : (
        <div className="space-y-3">
          <IntegrationBlock compact onConnect={(k) => connectStore(k, camp.id)} />
          <button
            type="button"
            onClick={() =>
              show({
                q: "I can't connect my store",
                say:
                  "Tell me what you see and I'll walk you through it. Most often the store login lacks admin rights: " +
                  "ask whoever owns the store account to connect, or invite them in step 6. If it still won't connect, " +
                  "pick Something else above and a person from the team calls you within a working day.",
              })
            }
            className="inline-flex items-center gap-1.5 text-meta font-semibold text-brand hover:underline"
          >
            <Sparkle size={12} weight="fill" aria-hidden /> Stuck? Ask HeyMoon
          </button>
        </div>
      ),
    },
    {
      key: "codes",
      icon: <Barcode size={16} weight="bold" />,
      title: "Tracking codes",
      detail: connected
        ? `${crew.length} codes made, one per creator.`
        : "Made the moment your store connects, one per creator.",
      done: !!connected,
      locked: !connected,
      body: connected ? (
        <div className="flex flex-wrap gap-2">
          {crew.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-control border border-hairline bg-wash px-2.5 py-1.5 text-meta">
              <Avatar src={c.avatar} name={c.name} size={18} />
              <span className="font-mono text-[12px] font-semibold tracking-wide text-ink">{trackingCode(c.name, plan.brandName)}</span>
            </span>
          ))}
        </div>
      ) : undefined,
    },
    {
      key: "creators",
      icon: <UsersThree size={16} weight="fill" />,
      title: "Meet your creators",
      detail: launch.creatorsKept
        ? launch.swapping?.length
          ? `${crew.length - launch.swapping.length} kept. MoonMatch is finding ${launch.swapping.length === 1 ? "a replacement" : `${launch.swapping.length} replacements`}.`
          : `${crew.length} creators kept.`
        : `${crew.length} creators matched to ${listOf(plan.markets.value.map(marketName))}. Keep each one, or swap.`,
      done: launch.creatorsKept,
      body: <Creators camp={camp} plan={plan} launch={launch} />,
    },
    {
      key: "brief",
      icon: <FileText size={16} weight="fill" />,
      title: "Approve the brief",
      detail: launch.briefApproved
        ? "Approved. The creators have it."
        : plan.brief.setBy === "brand" ? "The one you wrote in the conversation." : "Drafted from your store. Change anything in words.",
      done: launch.briefApproved,
      body: <Brief camp={camp} plan={plan} approved={launch.briefApproved} />,
    },
    ...(launch.enterprise
      ? [{
          key: "enterprise",
          icon: <ShieldCheck size={16} weight="fill" />,
          title: "Launch requirements",
          detail: enterpriseDone ? "All three signed off." : `${plan.brandName}'s own steps before anything is filmed.`,
          done: enterpriseDone,
          body: <Enterprise camp={camp} launch={launch} owner={brand?.owner.firstName ?? account?.firstName ?? "the owner"} />,
        }]
      : []),
    {
      key: "team",
      icon: <UserPlus size={16} weight="fill" />,
      title: "Invite your team",
      detail: teamDone
        ? brand?.members.length ? `${brand.members.length} invited.` : "Skipped. Invite anyone later from Settings."
        : "Whoever runs this day to day.",
      done: teamDone,
      optional: true,
      body: <Team camp={camp} />,
    },
    {
      key: "drafts",
      icon: <FilmSlate size={16} weight="fill" />,
      title: "Review the first drafts",
      detail: !readyToFilm
        ? "Creators start filming once the steps above are done."
        : !launch.draftsAt
          ? "Creators are filming. First drafts arrive within 48 hours, and we email you."
          : `${drafts.filter((d) => d.state === "waiting").length} waiting. Approve one and Phase 1 goes live.`,
      done: !!launch.liveAt,
      locked: !readyToFilm,
      body: readyToFilm ? (
        <Drafts camp={camp} plan={plan} drafts={drafts} arrived={!!launch.draftsAt}
          filming={crew.filter((c) => !(launch.swapping ?? []).includes(c.id)).length}
          onLive={(ad) => show({
            say:
              `Phase 1 is live. ${ad.creatorName}'s ${ad.format} is out, and every order through ${ad.track} counts ` +
              `toward the ${fmtUSD(plan.price.revenueTarget.value)} guaranteed. Sales show on the dashboard as they land.`,
          })}
        />
      ) : undefined,
    },
  ];

  const required = steps.filter((s) => !s.optional);
  const doneCount = required.filter((s) => s.done).length;
  const current = steps.find((s) => !s.done && !s.locked)?.key ?? null;
  const [openKey, setOpenKey] = useState<string | null>(null);
  /* A finished step folds away and the next one opens, whatever was opened by hand before. */
  useEffect(() => { setOpenKey(null); }, [current]);
  const isOpen = (k: string) => (openKey === null ? k === current : openKey === k);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-[22rem]">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-brand-500">Launch checklist</p>
          <h2 className="mt-1.5 text-greet font-semibold text-ink sm:text-section">
            Phase 1 is paid.{" "}
            {required.length - doneCount === 1 ? "One step to go live." : `${required.length - doneCount} steps to go live.`}
          </h2>
          <p className="mt-1 text-body text-ink-soft">
            Sales show here from the first live ad. {fmtUSD(plan.price.revenueTarget.value)} in sales is guaranteed.
          </p>
        </div>
        <Link href="/brands/c" className="inline-flex items-center gap-1.5 text-body font-semibold text-brand hover:underline">
          Your plan and brief
          <ArrowRight size={13} weight="bold" aria-hidden className="rtl:rotate-180" />
        </Link>
      </header>

      <div
        role="progressbar"
        aria-label="Launch checklist"
        aria-valuemin={0}
        aria-valuemax={required.length}
        aria-valuenow={doneCount}
        className="flex gap-1"
      >
        {required.map((s) => (
          <span key={s.key} className={`h-1.5 flex-1 rounded-full ${s.done ? "bg-good" : s.key === current ? "bg-brand/40" : "bg-black/[0.07]"}`} />
        ))}
      </div>

      <ol className="overflow-hidden rounded-card border border-hairline bg-white shadow-card">
        {steps.map((s, i) => {
          const open = isOpen(s.key) && !!s.body;
          const here = s.key === current;
          return (
            <li key={s.key} className={`border-hairline ${i ? "border-t" : ""} ${here ? "bg-brand/[0.025]" : ""}`}>
              <button
                type="button"
                onClick={() => setOpenKey(open ? (s.key === current ? "" : null) : s.key)}
                disabled={!s.body}
                aria-expanded={s.body ? open : undefined}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-start disabled:cursor-default sm:px-5"
              >
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                    s.done ? "bg-good text-white"
                    : s.locked ? "bg-black/[0.05] text-ink-faint"
                    : here ? "bg-brand text-white"
                    : "border border-hairline bg-white text-ink-soft"
                  }`}
                >
                  {s.done ? <Check size={13} weight="bold" /> : s.locked ? <Lock size={12} weight="fill" /> : s.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`text-body font-semibold ${s.done ? "text-ink-soft" : "text-ink"}`}>{s.title}</span>
                    {s.optional && !s.done && <span className="text-tiny font-semibold text-ink-faint">Optional</span>}
                    {here && <span className="rounded-pill bg-main-10 px-2 py-0.5 text-tiny font-semibold text-main">Next</span>}
                  </span>
                  <span className="mt-0.5 block text-meta leading-5 text-ink-faint">{s.detail}</span>
                </span>
                {s.body && (
                  <CaretDown
                    size={13}
                    weight="bold"
                    aria-hidden
                    className={`mt-2 shrink-0 text-ink-faint transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                  />
                )}
              </button>
              {open && <div className="px-4 pb-5 sm:ps-[60px] sm:pe-5">{s.body}</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── 3 · The creators ─────────────────────────────────────────────── */

function Creators({ camp, plan, launch }: { camp: Campaign; plan: Plan; launch: Launch }) {
  const [note, setNote] = useState<string | null>(null);
  /* The creator whose swap is being asked about. A swap says why, in the matcher's own words (PASS_REASONS), because
     a reason is what makes the next match better. */
  const [why, setWhy] = useState<number | null>(null);
  const crew = plan.creators.value;
  const kept = launch.creatorsKept;
  const swapping = launch.swapping ?? [];

  /* MoonMatch's next best: the first creator in the matched pool who is not on the crew and fits the fee the swap
     frees, tried through the same edit the conversation uses so it obeys the same rules. When nobody fits yet, the
     creator is marked and MoonMatch keeps looking; the replacement is offered before anyone is briefed. */
  const swap = (id: number, reason: string) => {
    setWhy(null);
    passCreator(id, [reason]);
    const read = getRead(plan.readId);
    const inCrew = new Set(crew.map((c) => c.id));
    for (const cand of poolFor(read, plan.markets.value)) {
      if (inCrew.has(cand.id)) continue;
      const { plan: next } = tools.edit_plan({
        plan, patch: { dropCreatorIds: [id], addCreatorIds: [cand.id] }, because: "because you swapped a creator", by: "brand",
      });
      const ids = next.creators.value.map((c) => c.id);
      if (ids.includes(cand.id) && ids.length === crew.length) {
        putPlan(next);
        setNote(`${creatorById(id).name} is out. MoonMatch found ${cand.name}.`);
        return;
      }
    }
    patchLaunch(camp.id, { swapping: [...swapping, id] });
    setNote(`MoonMatch is finding someone for ${creatorById(id).name}'s fee. You approve them before they're briefed.`);
  };

  const undo = (id: number) => {
    clearCreatorSignal(id);
    patchLaunch(camp.id, { swapping: swapping.filter((x) => x !== id) });
    setNote(null);
  };

  return (
    <div className="space-y-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {crew.map((c) => {
          const out = swapping.includes(c.id);
          return (
            <li key={c.id} className={`min-w-0 rounded-control border border-hairline p-2.5 ${out ? "bg-wash" : ""}`}>
              <div className="flex items-center gap-3">
                <Avatar src={c.avatar} name={c.name} size={40} className={out ? "opacity-50" : ""} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-body font-semibold ${out ? "text-ink-faint line-through" : "text-ink"}`}>{c.name}</span>
                  <span className="block truncate text-meta text-ink-faint">
                    {out ? "Being replaced" : `${c.handle} · ${compact(c.followers)} · ${Math.round(c.gulfShare)}% in the Gulf`}
                  </span>
                </span>
                {out ? (
                  <button type="button" onClick={() => undo(c.id)} className="shrink-0 rounded-pill px-2.5 py-1.5 text-meta font-semibold text-brand hover:bg-brand/[0.05]">
                    Undo
                  </button>
                ) : !kept && why !== c.id ? (
                  <button
                    type="button"
                    onClick={() => setWhy(c.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1.5 text-meta font-semibold text-ink-soft transition hover:bg-black/[0.04]"
                  >
                    <ArrowsClockwise size={12} weight="bold" aria-hidden /> Swap
                  </button>
                ) : null}
              </div>
              {why === c.id && (
                <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label={`Why swap ${c.name}?`}>
                  {PASS_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => swap(c.id, r.id)}
                      className="rounded-pill border border-hairline px-2.5 py-1 text-tiny font-semibold text-ink-soft transition hover:border-brand/40 hover:text-ink"
                    >
                      {r.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => setWhy(null)} className="px-1.5 text-tiny font-semibold text-ink-faint hover:text-ink">
                    Cancel
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {note && <p role="status" className="text-meta text-ink-soft">{note}</p>}
      {!kept && (
        <Btn size="sm" onClick={() => patchLaunch(camp.id, { creatorsKept: true })}>
          {swapping.length ? `Keep the other ${crew.length - swapping.length}` : `Keep all ${crew.length}`}
        </Btn>
      )}
    </div>
  );
}

/* ── 4 · The brief ────────────────────────────────────────────────── */

function Brief({ camp, plan, approved }: { camp: Campaign; plan: Plan; approved: boolean }) {
  const b = plan.brief.value;
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);

  /* A change in words lands as a line every creator must follow. The brief is the brand's to word. */
  const change = (e: FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    const { plan: next } = tools.edit_plan({
      plan, patch: { brief: { mustSay: [...b.mustSay.value, v] } }, because: "because you changed the brief", by: "brand",
    });
    putPlan(next);
    setText("");
    setNote("Added. Every creator gets it.");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-control border border-hairline p-3.5">
        <p className="text-body font-semibold text-ink">{b.headline.value}</p>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-good-deep">Must</p>
            <ul className="mt-1 space-y-1">{b.mustSay.value.map((l, i) => <li key={i} className="text-meta text-ink-soft">· {l}</li>)}</ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">Must not</p>
            <ul className="mt-1 space-y-1">{b.mustNotSay.value.map((l, i) => <li key={i} className="text-meta text-ink-soft">· {l}</li>)}</ul>
          </div>
        </div>
        <p className="mt-2.5 text-meta text-ink-faint">{b.formats.value.join(", ")}</p>
      </div>
      {!approved && (
        <>
          <form onSubmit={change} className="flex gap-2">
            <label htmlFor={`brief-${camp.id}`} className="sr-only">Change the brief</label>
            <input
              id={`brief-${camp.id}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Change it in words, like “show the tote in daylight”"
              className="h-9 min-w-0 flex-1 rounded-pill border border-hairline bg-white px-3.5 text-meta text-ink outline-none focus:border-brand/50"
            />
            <Btn size="sm" variant="quiet" type="submit" disabled={!text.trim()}>Add</Btn>
          </form>
          {note && <p role="status" className="text-meta text-ink-soft">{note}</p>}
          <Btn size="sm" onClick={() => patchLaunch(camp.id, { briefApproved: true })}>Approve the brief</Btn>
        </>
      )}
    </div>
  );
}

/* ── 5 · Enterprise ───────────────────────────────────────────────── */

function Enterprise({ camp, launch, owner }: { camp: Campaign; launch: Launch; owner: string }) {
  const items: { key: keyof Launch["enterpriseSteps"]; label: string }[] = [
    { key: "legal", label: "Legal has reviewed the brief" },
    { key: "products", label: "The approved product list is confirmed" },
    { key: "signoff", label: `Signed off by ${owner}` },
  ];
  return (
    <ul className="space-y-1.5">
      {items.map((it) => {
        const on = launch.enterpriseSteps[it.key];
        return (
          <li key={it.key}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => patchLaunch(camp.id, { enterpriseSteps: { ...launch.enterpriseSteps, [it.key]: !on } })}
              className="flex w-full items-center gap-2.5 rounded-control border border-hairline px-3 py-2.5 text-start text-body text-ink transition hover:bg-wash"
            >
              {on
                ? <CheckCircle size={18} weight="fill" className="shrink-0 text-good" aria-hidden />
                : <span aria-hidden className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-black/15" />}
              {it.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ── 6 · The team ─────────────────────────────────────────────────── */

function Team({ camp }: { camp: Campaign }) {
  const brand = useBrandAccount(camp.url);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const invite = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!looksLikeEmail(v)) { setErr("That doesn't look like an email address."); return; }
    if (isPersonal(v)) { setErr("Use their work email. Personal addresses can't join a brand."); return; }
    inviteMember(camp.url, v, Date.now());
    patchLaunch(camp.id, { teamDone: true });
    setEmail("");
    setErr(null);
  };

  return (
    <div className="space-y-2.5">
      {!!brand?.members.length && (
        <ul className="space-y-1">
          {brand.members.map((m) => (
            <li key={m.email} className="flex items-center gap-2 text-meta text-ink-soft">
              <CheckCircle size={13} weight="fill" className="text-good" aria-hidden /> {m.email} · invited
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={invite} className="flex flex-wrap gap-2">
        <label htmlFor={`invite-${camp.id}`} className="sr-only">Work email</label>
        <input
          id={`invite-${camp.id}`}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(null); }}
          placeholder="name@yourbrand.com"
          className="h-9 min-w-0 flex-1 basis-56 rounded-pill border border-hairline bg-white px-3.5 text-meta text-ink outline-none focus:border-brand/50"
        />
        <Btn size="sm" type="submit" disabled={!email.trim()}>Invite</Btn>
        {!brand?.members.length && (
          <Btn size="sm" variant="ghost" type="button" onClick={() => patchLaunch(camp.id, { teamDone: true })}>Skip</Btn>
        )}
      </form>
      {err && <p role="alert" className="text-meta text-danger">{err}</p>}
    </div>
  );
}

/* ── 7 · The first drafts ─────────────────────────────────────────── */

const VERDICT: Record<AdRecord["compliance"]["verdict"], { label: string; tone: string }> = {
  approve: { label: "On brief", tone: "text-good-deep" },
  "approve-with-note": { label: "On brief, one note", tone: "text-good-deep" },
  hold: { label: "Misses the brief", tone: "text-danger" },
};

function Drafts({ camp, plan, drafts, arrived, filming, onLive }: {
  camp: Campaign; plan: Plan; drafts: AdRecord[]; arrived: boolean; filming: number; onLive: (ad: AdRecord) => void;
}) {
  if (!arrived) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-control border border-dashed border-black/15 px-3.5 py-3">
        <span aria-hidden className="working-ring h-3.5 w-3.5 shrink-0" />
        <p className="min-w-0 flex-1 basis-56 text-meta text-ink-soft">
          {filming} creator{filming === 1 ? " is" : "s are"} filming. Nothing goes live until you approve it.
        </p>
        {/* The prototype cannot wait 48 hours. Marked as what it is. */}
        <button
          type="button"
          onClick={() => deliverDrafts(camp.id, plan.creators.value.map((c) => c.id).filter((id) => !(camp.launch?.swapping ?? []).includes(id)), Date.now())}
          className="shrink-0 rounded-pill border border-dashed border-brand/40 px-3 py-1.5 text-meta font-semibold text-brand hover:bg-brand/[0.04]"
        >
          Demo: drafts arrive
        </button>
      </div>
    );
  }

  const approve = (ad: AdRecord) => {
    setAdState(ad.id, "approved");
    goLive(camp.id, ad.id, Date.now());
    onLive(ad);
  };

  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {drafts.map((ad) => {
        const v = VERDICT[ad.compliance.verdict];
        const done = ad.state !== "waiting";
        return (
          <li key={ad.id} className="flex min-w-0 flex-col overflow-hidden rounded-control border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.img} alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" />
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <p className="text-meta font-semibold text-ink">{ad.creatorName} · {ad.format}</p>
              <p className={`text-tiny font-semibold ${v.tone}`}>{v.label}</p>
              <p className="line-clamp-3 text-meta leading-5 text-ink-soft">{ad.compliance.reasoning.value}</p>
              <div className="mt-auto flex gap-2 pt-1.5">
                {done ? (
                  <p className="text-meta font-semibold text-ink-faint">{ad.state === "declined" ? "Re-cut asked" : "Approved"}</p>
                ) : (
                  <>
                    <Btn size="sm" className="flex-1" onClick={() => approve(ad)}>Approve</Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() => setAdState(ad.id, "declined", `Please re-cut against the brief: ${plan.brief.value.mustSay.value[0] ?? "show the product clearly"}.`)}
                    >
                      Re-cut
                    </Btn>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
