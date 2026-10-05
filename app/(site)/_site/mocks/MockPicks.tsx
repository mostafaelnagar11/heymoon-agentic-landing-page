/* MockPicks (SPEC §5.8, C6): the conversation's carousel as the matches arrive. `cards`: a PickCard per
   pick (ProductTile 112px, brand, campaign, the share with "of every order", the pace, the level chip),
   on a rail that runs on past the panel's own edge the way a rail that scrolls continues. `rows`: a 44px
   tile, brand and campaign, the share and the chip; in a card under 400px the share and chip drop under
   the names (a container query), so a phone never truncates a brand to a few letters. Picks past `shown` keep their place and arrive over
   400ms. No bonus bar, no countdown, no image, no logo. */
import type { CampaignPick } from "../data/types";
import type { MockPicksProps } from "../contracts";
import { LABELS } from "../copy";
import { Star } from "../ui/Star";
import { ProductTile } from "./ProductTile";
import { CARD, Chevron, Chip, FIT, FRAME, Tick } from "./parts";
import s from "./mocks.module.css";

function Title({ title }: { title: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Star size={13} className="shrink-0 text-brand" />
      <span className="truncate text-[13px] font-semibold leading-5 tracking-[-0.005em] text-ink">{title}</span>
    </span>
  );
}

function PickCard({ pick, on }: { pick: CampaignPick; on: boolean }) {
  return (
    <div className={`${s.rise} ${s.pick} shrink-0 rounded-[16px] p-1 ${CARD}`} data-on={on ? "1" : "0"}>
      <div className="relative">
        <ProductTile product={pick.product} className={`${s.pickTile} w-full`} />
        <Chip tone="float" icon={<Tick />} className="absolute end-2 top-2">{pick.levelWord}</Chip>
      </div>
      <div className="px-2 pb-2 pt-2.5">
        <p className="truncate text-[12px] font-semibold leading-4 text-ink">{pick.brand}</p>
        <p className="mt-0.5 truncate text-[12px] leading-4 text-ink/72">{pick.campaign}</p>
        <div className="mt-2.5 grid grid-cols-2 divide-x divide-ink/[0.06] rounded-[10px] bg-lilac/70 rtl:divide-x-reverse">
          <div className="min-w-0 px-2.5 py-2">
            <p className="flex h-6 items-end"><span className="num text-[22px] font-semibold leading-none tracking-[-0.02em] text-brand">{`${pick.sharePct}%`}</span></p>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-ink/64">{LABELS.creators.ofEveryOrder}</p>
          </div>
          <div className="min-w-0 px-2.5 py-2">
            <p className="flex h-6 items-end"><span className="num truncate text-[15px] font-semibold leading-none tracking-[-0.01em] text-ink">{pick.paceBig}</span></p>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-ink/64">{pick.paceSmall}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MockPicks({ title, picks, shown, layout }: MockPicksProps) {
  if (layout === "rows") {
    return (
      <div aria-hidden className={FRAME}>
        <div className={`${s.rows} rounded-[16px] px-3 pb-1 pt-3 ${CARD}`}>
          <div className="px-1 pb-2"><Title title={title} /></div>
          <ul className="divide-y divide-ink/[0.06]">
            {picks.map((p, i) => (
              <li key={p.brand} className={`${s.arrive} ${s.pickRow} flex gap-3 py-2`} data-on={i < shown ? "1" : "0"} data-slow="">
                <span className="hm-media size-11 shrink-0 rounded-[10px] ring-1 ring-inset ring-ink/[0.04]" />
                <span className={`${s.pickRowBody} min-w-0 flex-1`}>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold leading-4 text-ink">{p.brand}</span>
                    <span className="mt-0.5 block truncate text-[12px] leading-4 text-ink/72">{p.campaign}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="num text-[15px] font-semibold leading-5 tracking-[-0.01em] text-brand">{`${p.sharePct}%`}</span>
                    <Chip tone="good" icon={<Tick />}>{p.levelWord}</Chip>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden className={FIT}>
      <div className="my-auto shrink-0">
        <div className="mb-3 flex items-center gap-3">
          <Title title={title} />
          <span className="ms-auto flex shrink-0 gap-1.5">
            <span className="grid size-7 place-items-center rounded-full bg-white/60 text-ink/30 ring-1 ring-ink/[0.06]"><Chevron dir="start" /></span>
            <span className="grid size-7 place-items-center rounded-full bg-white text-ink/72 shadow-[0_1px_2px_rgba(18,21,27,.08)] ring-1 ring-ink/[0.06]"><Chevron dir="end" /></span>
          </span>
        </div>
        <div className={s.rail}>
          {picks.map((p, i) => <PickCard key={p.brand} pick={p} on={i < shown} />)}
        </div>
      </div>
    </div>
  );
}
