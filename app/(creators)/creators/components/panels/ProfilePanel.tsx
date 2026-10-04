"use client";

/* YOUR PROFILE — the file's "Socials & AD Rates" screen, with the rates
 * taken out of it.
 *
 * v0.1 priced every format off its own reach and put a floor under the
 * listing. Both went in the review:
 *
 *   Rasha  "'your rate is set to 500' — this is also confusing."
 *   Mostafa "delete."
 *   Alex   "we don't want to go with ad rates now. We want to stick to
 *           [ROAS]. That's going to be the MVP."
 *
 * So there is no price on this screen at all. A campaign pays a share
 * of the orders it drives, the share is the brand's, and it is the same
 * for everybody on that campaign. What is left here is the thing
 * matching actually reads — influence — and what the creator has said
 * they will take. */

import { Card, Chip } from "../ui";
import { Claim } from "../Evidence";
import { Soc } from "../figma";
import { openPanel, useActiveProfile, useOffers } from "../../lib/store";
import { chatPicks, wantsYou } from "../../lib/agent/types";
import { countWord } from "../blocks";

export function ProfilePanel() {
  const profile = useActiveProfile();
  const offers = useOffers();
  if (!profile) return <p className="text-body text-ink-60">No profile yet.</p>;

  /* What WANTS this profile, not everything that is running. */
  const open = offers.filter((o) => o.state === "open" && wantsYou(o));
  const pre = open.filter((o) => o.match.level === "prequalified").length;
  const picks = chatPicks(offers).length;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="text-row font-medium text-ink" dir="ltr">{profile.handle}</span>
          <span className="ms-auto flex items-center gap-1.5">
            {profile.platforms.value.map((pl) => <Soc key={pl} platform={pl} size={22} />)}
          </span>
        </div>
        <div className="px-4 py-3">
          <p className="text-brand font-semibold text-main">Known for</p>
          <Claim src={profile.authority} className="mt-1 block text-row leading-6 text-ink">
            <span className="font-semibold">{profile.authority.value.primary}</span>
            {profile.authority.value.also.length > 0 && <span className="text-ink-60">, then {profile.authority.value.also.join(" and ")}</span>}
          </Claim>
        </div>
      </Card>

      {/* WHAT REPLACED THE RATE TABLE. Four rows, and not one of them
          is a count of an audience — Rasha: "even with a million
          followers they might not be the right fit." */}
      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <p className="text-row font-medium text-ink">What brands are matched on</p>
          <p className="mt-0.5 text-brand text-ink-50">Your influence, not your size.</p>
        </div>
        <ul className="divide-y divide-line">
          {profile.influence.value.map((line) => (
            <li key={line} className="px-4 py-3 text-body leading-5 text-ink-60">{line}</li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-3"><Claim src={profile.influence} /></div>
      </Card>

      <Card className="p-4">
        <p className="text-body font-medium text-main">You will not take</p>
        <div className="mt-2 flex flex-wrap gap-1.5">{profile.noList.value.categories.map((c) => <Chip key={c} tone="ink">{c}</Chip>)}</div>
        <div className="mt-3"><Claim src={profile.noList} /></div>
      </Card>

      {open.length > 0 && (
        <>
          <p className="text-meta text-ink-50">
            {/* The same three the thread hands over, not everything
                running — see the match sentence in c/page.tsx. */}
            {pre > 0
              ? `You're Pre-qualified for ${pre} ${pre === 1 ? "campaign" : "campaigns"}.`
              : `${picks} ${picks === 1 ? "campaign matches" : "campaigns match"} this profile.`}
          </p>
          {/* Opens the same three the thread shows, so the button says
              that rather than a count the list will not contain. */}
          <button onClick={() => openPanel("offers")} className="g-button flex h-12 w-full items-center justify-center gap-2 rounded-pill text-body font-semibold text-white">
            {picks === 1 ? "See your top campaign" : `See your top ${countWord(picks)}`}
          </button>
        </>
      )}
    </div>
  );
}
