/* The site never formats money itself (rule 2.4.4): every money string comes pre-formatted from
   demo.json. The one exception is CountUp's in-between values, which use formatUSD. The bind
   parity-tests formatUSD against the product's fmtUSD on every run. */

/** Byte-identical to B lib/mock/campaigns.ts fmtUSD. */
export const formatUSD = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Milliseconds as the stopwatch prints them: one decimal, then "s" (15022 → "15.0s"). */
export const seconds = (ms: number) => `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
