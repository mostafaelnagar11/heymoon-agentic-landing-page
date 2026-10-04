/* DEMO to mock props: the only binding layer (SPEC §4.3). Sections call these; mocks never read DEMO. */
import { DEMO } from "./demo";
import { COPY, LABELS } from "../copy";
import type {
  MockCheckProps, MockCurveProps, MockPayProps, MockPhasesProps, MockPicksProps, MockPlanProps, MockReadProps,
  MockTermsProps, MockTiersProps, MockWhyProps, PayoutRailProps, RoasDialProps, ShareScaleProps,
} from "../contracts";

const { brands, creators } = DEMO;

/** Gate G3: the "16 campaigns live" claim. Refused → both the visible note and the spoken label switch
    to their fallbacks together (SPEC §6.1 C5, §8 G3). */
const G3_SIGNED: boolean = true;

export const view = {
  plan: (): Pick<MockPlanProps, "phaseLabel" | "pay" | "markets" | "creatorCount"> => ({
    phaseLabel: brands.plan.phaseLabel, pay: brands.plan.pay.text, markets: brands.plan.markets, creatorCount: brands.plan.creatorCount,
  }),
  phases: (): MockPhasesProps["rungs"] => brands.ladder.map((r) => ({ phaseNo: r.phaseNo, budget: r.budget.text, width: r.width })),
  pay: (): MockPayProps => ({
    total: brands.checkout.total.text, vat: brands.checkout.vat.text, budget: brands.checkout.budget.text, last4: brands.checkout.last4,
  }),
  curve: (): MockCurveProps["rungs"] => brands.ladder.map((r) => ({ phaseNo: r.phaseNo, multiple: r.multiple, multipleText: r.multipleText })),
  dial: (): Pick<RoasDialProps, "value" | "min" | "max"> => ({ value: brands.guarantee.roas, min: brands.roasScale.min, max: brands.roasScale.max }),
  read: (): MockReadProps => ({
    title: LABELS.creators.readingProfile,
    sub: creators.read.sub ?? "",
    count: `${creators.read.units.length}/${creators.read.sizes.at(-1)?.total ?? creators.read.units.length}`,
    rows: creators.read.units.map((u) => ({ agent: u.agent, produces: u.produces })),
  }),
  why: (): Pick<MockWhyProps, "levelWord" | "reasons"> => ({
    levelWord: creators.match.levelWord, reasons: creators.match.reasons.map((r) => ({ label: r.label, lit: r.lit })),
  }),
  picks: (): Pick<MockPicksProps, "title" | "picks"> => ({ title: creators.picks.title, picks: creators.picks.items }),
  tiers: (): Pick<MockTiersProps, "picks" | "next" | "restLine"> => ({
    picks: creators.picks.items, next: creators.requests.next, restLine: LABELS.creators.tiersRest(creators.requests.rest),
  }),
  terms: (): MockTermsProps => ({ ...creators.terms }),
  check: (): Omit<MockCheckProps, "shown"> & { checkCount: number } => ({ ...creators.check }),
  share: (): Omit<ShareScaleProps, "lit"> => {
    const { min, max, counts, liveCount } = creators.shares;
    const n = COPY.creators.number;
    return {
      figure: n.shareFigure(min, max), counts, min, max, label: n.shareLabel,
      note: G3_SIGNED ? n.shareNote(liveCount) : n.shareNoteFallback,
      spoken: G3_SIGNED ? n.shareSpoken(liveCount, min, max, counts) : n.shareSpokenFallback(min, max, counts),
    };
  },
  payout: (): Pick<PayoutRailProps, "steps"> => ({ steps: [...COPY.creators.number.rail] }),
};
