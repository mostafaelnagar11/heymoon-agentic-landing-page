"use client";
/* STUB (WP0). WP8 owns this lab page: every mock, both audiences, both states. Calls notFound() in
   production; WP-F deletes lab/. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { view } from "../../_site/data/view";
import { LABELS } from "../../_site/copy";
import { MockField } from "../../_site/mocks/MockField";
import { MockPlan } from "../../_site/mocks/MockPlan";
import { MockPhases } from "../../_site/mocks/MockPhases";
import { MockPay } from "../../_site/mocks/MockPay";
import { MockCurve } from "../../_site/mocks/MockCurve";
import { Curve } from "../../_site/mocks/Curve";
import { RoasDial } from "../../_site/mocks/RoasDial";
import { MockRead } from "../../_site/mocks/MockRead";
import { MockWhy } from "../../_site/mocks/MockWhy";
import { MockPicks } from "../../_site/mocks/MockPicks";
import { MockTiers } from "../../_site/mocks/MockTiers";
import { MockTerms } from "../../_site/mocks/MockTerms";
import { MockCheck } from "../../_site/mocks/MockCheck";
import { ShareScale } from "../../_site/mocks/ShareScale";
import { PayoutRail } from "../../_site/mocks/PayoutRail";
import { ProductTile } from "../../_site/mocks/ProductTile";
import { Discs } from "../../_site/mocks/Discs";

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="mocks" surface="paper">
      {(a) => (
        <div className="mx-auto grid max-w-text gap-6 px-[var(--gutter)] pb-24 sm:grid-cols-2">
          {a === "brands" ? (
            <>
              <MockField kind="url" value="yourstore.com" />
              <MockPlan {...view.plan()} />
              <MockPhases rungs={view.phases()} grown />
              <MockPay {...view.pay()} />
              <MockCurve rungs={view.curve()} label={LABELS.brands.salesGuaranteed} drawn />
              <Curve drawn className="h-24 w-full" />
              <RoasDial {...view.dial()} label="Guaranteed ROAS" note="blended across all three phases" drawn />
              <Discs count={3} />
            </>
          ) : (
            <>
              <MockField kind="handle" value="@yourhandle" platforms={["Instagram", "TikTok"]} />
              <MockRead {...view.read()} />
              <MockWhy {...view.why()} filled={4} />
              <MockPicks {...view.picks()} shown={3} layout="cards" />
              <MockTiers {...view.tiers()} shown={3} showFoot />
              <MockTerms {...view.terms()} />
              <MockCheck {...view.check()} shown={3} />
              <ShareScale {...view.share()} lit />
              <PayoutRail {...view.payout()} lit={4} />
              <ProductTile product="Linen resort set" />
            </>
          )}
        </div>
      )}
    </LabFrame>
  );
}
