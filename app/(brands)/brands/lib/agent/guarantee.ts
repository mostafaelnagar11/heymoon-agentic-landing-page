/* The guarantee, as the brand team explains it ("Getting to know our brands", 15 Oct).

   It is a PRO-RATA REFUND of what the brand paid for the phase, never a payout of the sales gap. Reach a share of
   the guaranteed sales and the missing share of the phase's budget comes back:

       refund = budget × (1 − sales ÷ guaranteed sales)

   $2,000 in for $4,000 guaranteed, $2,000 sold: half the target, so $1,000 back, not $2,000. It holds because
   creators are paid only out of the sales they bring in; a shortfall leaves budget unspent, and that is what is
   refunded. At 1x, which is Phase 1, the refund and the sales gap are the same number, which is why the $1,000
   example never showed the difference and the team believed the guarantee paid the gap. Every screen and every agent
   sentence that explains the guarantee goes through here, so the rule can only be stated one way. */

import { fmtUSD } from "../mock/campaigns";

/** What comes back when a phase of `budget`, guaranteed at `guaranteed` in sales, closes on `sales`. */
export function refundFor(budget: number, guaranteed: number, sales: number): number {
  if (budget <= 0 || guaranteed <= 0) return 0;
  const reached = Math.max(0, Math.min(1, sales / guaranteed));
  return Math.round(budget * (1 - reached));
}

/** The worked example every explanation uses: the phase closing at 80% of its guarantee. */
export const EXAMPLE_REACH = 0.8;

/** "Fall short and you get back the same share of the $1,000: reach $800 of it and $200 comes back." */
export function shortfallLine(budget: number, guaranteed: number): string {
  const at = Math.round(guaranteed * EXAMPLE_REACH);
  return (
    `Fall short and you get back the same share of the ${fmtUSD(budget)}: reach ${fmtUSD(at)} ` +
    `and ${fmtUSD(refundFor(budget, guaranteed, at))} comes back.`
  );
}

/** The whole rule, for the plan card and the payment card. */
export function guaranteeLine(budget: number, guaranteed: number): string {
  return `Sell more than the guarantee and every sale is yours. ${shortfallLine(budget, guaranteed)}`;
}

/** The agent's answer to "what if it misses?" and "how does the guarantee work?". */
export function guaranteeExplained(budget: number, guaranteed: number): string {
  return (
    `The guarantee is a refund of what you paid, in proportion to how far the phase falls short. ` +
    `${shortfallLine(budget, guaranteed)}\n\n` +
    `It is the share of your budget that comes back, not the missing sales: on a later phase, ${fmtUSD(2000)} in for ` +
    `${fmtUSD(4000)} guaranteed and ${fmtUSD(2000)} sold is half the target, so ${fmtUSD(1000)} comes back. ` +
    `It works because creators are only paid out of the sales they bring in.`
  );
}
