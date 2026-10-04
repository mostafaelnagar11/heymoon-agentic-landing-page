# WP4 Number: notes

4 Oct 2026. SPEC rev 2, §5.4 (S5, B8, B9). Branch `redesign`, nothing committed.

## What I built

| File | What it does |
|---|---|
| `_site/number/NumberSection.tsx` | `<Section slot="number" surface="paper" cv labelledBy>` (labelled by the first H2, `useId`), `py-[120px]` (phone `py-24`), container `mx-auto max-w-text px-[var(--gutter)]`. The lunar divider, then brands: Guarantee + Roas, creators: Paid + Share. Export and props unchanged (`NumberSectionProps`). |
| `_site/number/Divider.tsx` | 9 Moons, 11px, gap 16, centred, `text-ink`, phases `[0,1,2,3,4,5,6,7,0]`. Server HTML is final. Mounted below the fold: all new, then wax to their phases 60 ms apart once fully in view (12% up from the bottom). The dots ease `fill-opacity` over 320 ms so the sequence reads as waxing, not as nine cuts. `aria-hidden`. |
| `_site/number/Guarantee.tsx` | 12-col row. Left (cols 1 to 5): `WordReveal` H2 (`text-h2 max-w-[16ch] text-balance`), body `mt-5 text-body text-ink/72 max-w-[48ch]`, Pledge. Right (cols 7 to 12): `mono-caps text-ink/60` eyebrow, `mt-3` `CountUp to={guarantee.revenue.value} format="usd"` at `text-figure`, `mt-4 text-lead text-ink/72` `figureNote(budget.text, roasText)`, `mt-8 <Curve drawn={counting} className="h-24 w-full">`. No ladder line (C14). |
| `_site/number/Roas.tsx` | Left: H2, body, `mt-8 text-micro text-ink/60` climb label, `<ol class="mt-3 flex gap-2">` of `rounded-receipt px-3 py-2 text-small` chips from `COPY.brands.number.chip(rung)` (P1 `bg-brand/8 text-brand font-semibold`, P2/P3 `bg-ink/[0.04] text-ink/72`). Right: `RoasDial {...view.dial()} label note drawn` in a `max-w-[360px]` (phone 300) wrapper, centred on the copy. |
| `_site/number/Paid.tsx` | Left: H2, body, Pledge. Right: eyebrow "Your payout is paid", "Weekly" at `text-figure` (no count) that sets in once 60% in view (blur 10px to 0, rise .14em, 0.7 to 1 s), the note, `mt-8 <PayoutRail steps lit>` with `lit` 0 to 4 at 300 ms intervals once the rail is fully in view. |
| `_site/number/Share.tsx` | Left: H2, body, `mt-8 text-micro text-ink/60` "Every order is counted through", chips "Your code" / "Your tracking link" (`rounded-receipt bg-ink/[0.04] px-3 py-2 text-small text-ink/72`). Right: `<ShareScale {...view.share()} lit>`, `lit` on entry (45%). |
| `_site/number/parts.tsx` (new, in my folder) | `useEntry(ref, {threshold, rootMargin})`: rule 2.4.7 as state, `"final" \| "armed" \| "in"`. `useStepper(entry, total, everyMs)`: the one-shot 0..n counter for the divider and the rail. `withNums(text, values)`: wraps the bound values inside an approved sentence in `.num` spans without retyping the sentence. `Pledge`: the 2px `.grad-rule` (`w-[200px]`, scaleX 0 to 1, 600 ms `--ease-out`, start origin, RTL-mirrored) plus the signature. `ROW` / `COPY_COL` / `FIGURE_COL` grid classes. |
| `_site/number/number.module.css` | Divider dot easing, rule scaleX states, row stacking, cap-line offset, the figures' optical edge, the "Weekly" set-in, and the reduced-motion overrides. Only §2.3 variables; no `@apply`, no `theme()`, no Tailwind keys added. |
| `lab/number/page.tsx` | Every state: `?a=brands\|creators` (toolbar switch flips in place), `?rm=1` (toolbar), pause (toolbar), `?at=below` (default: a viewport of paper above, so the section mounts below the fold and plays on entry) and `?at=top` (mounts in view, must stay final). A floating "Replay" remounts the section below the fold and scrolls it in over 1.6 s, so the entry can be watched again. |

**Entry rule (2.4.7), one mechanism everywhere.** Every animated part renders its final state on the server (no-JS shows `$63,050`, the drawn curve and dial, the lit rail and divider, the full rule). On mount, only an element whose own top is below the viewport is reset (`armed`); an element in view or above stays final, so a switch made while reading the section (Swap remounts it in view) never replays it. Under `useReducedMotionPref()` (OS setting or lab `?rm=1`) everything stays final. The curve's trigger is the figure `<p>` at the same 50% threshold as `CountUp`'s own observer, so the curve starts with the count.

**Pause.** The section's motion is all one-shot entry (count 1.4 s, draws 1.2 s, divider 0.54 s, rail 1.2 s). §5.9 lists count-up, curve and dial as "n/a" when paused and §5.0.8 does not list the number section among the paused loops, so the pause toggle does not touch it. Nothing here loops or moves for more than 5 s.

## Measured (headless Chromium via the private helper; SwiftShader, so frames are slow)

- 1440x900: section height **1,155 px** brands, **1,112 px** creators (B9 target about 1,150). Copy column 428 px at x 184; figure column **520 px** at x 736; Curve **520 x 96** (exactly the column). Divider at the section top + 120.
- Count probe (MutationObserver on the figure, "Replay"): max value **$63,050**, **0** values above it; first move at +234 ms, first "$63,050" at +1,569 ms, so **1.34 s** from start to final.
- Curve trigger vs count: the curve's `data-entry` flips to `in` one paint before the first count write (148 ms apart in SwiftShader, where a frame is ~100 ms; the two observers watch the same box at the same threshold).
- Cap line: eyebrow top 313 vs H2 top 307 at 1440; the eyebrow's cap top meets the H2's within 1 px (2x crop). The "$" and the "W" sit on the eyebrow's left edge within 1 px (2x crop) after the optical pull.
- 390x844: no horizontal scroll (`scrollWidth` 390), figure 64 px, curve 358 x 96 under the note, dial wrapper 300 px.
- RTL (`dir="rtl"` on `<html>`): layout mirrors, the rule grows from the right, the figure aligns to the right edge (its digits stay LTR through CountUp's `.num`), chips keep LTR digits, `scrollWidth` 1440.
- Swap while in view (lab, brands → creators at the section): every sampled frame reads `final,final` and 87 lit divider dots (the full sequence): no replay.
- Reduced motion, both `--rm` (CSS + JS) and `?rm=1` (JS): figure `$63,050`, all `data-entry="final"`, 87 lit dots, before and after scrolling in.
- Console: no errors or warnings on the lab (both audiences, desktop and phone) or on `/brands` and `/creators` (only motion's own "Reduced Motion enabled" notice under `--rm`).

## Deviations from SPEC (each with its reason)

| # | SPEC | Shipped | Why |
|---|---|---|---|
| 1 | §4.1 lists six files in `number/` | Plus `number/parts.tsx` | The four rows share the entry hook, the stepper, the pledge and the grid. A seventh file in my own folder touches no one else's. |
| 2 | "Phone. Stacked." (nothing for 640 to 1023) | Two columns from **768**, stacked below. At 768 to 1023 the gap is 24 px, from 1024 32 px. | At 640 to 767 cols 1 to 5 would be about 240 px: an H2 of four lines beside a cramped figure. Stacked reads better there. |
| 3 | Box `pt-[120px] pb-[120px]` | Desktop as SPEC; phone `py-24`. Divider to row 1: 96 px (phone 64). Row 1 to row 2: `mt-[120px]` as SPEC (phone 96). | SPEC gives no phone values; 96 matches the run stage's phone `pt-24`. |
| 4 | Figure column, no offset given | In the two figure rows the eyebrow's cap top is set on the H2's cap top (`padding-top: calc(clamp(30px,3.3vw,48px) * .168 - 2px)` from 768); the chart rows (ROAS, share) centre the mock on the copy (`self-center`). | Editorial alignment: the eyebrow and the H2 start on one line. A dial or a dot scale is a figure, so it centres. |
| 5 | none | Optical edge: the count's block is pulled back `-0.06em`, "Weekly" `-0.04em` (LTR only). | At figure size Geist's tabular "$" and the "W" carry side bearing; without the pull the figure sat 5.5 px inside the column edge the eyebrow and the note share. |
| 6 | "Weekly sets in at figure size" (no technique given) | A CSS transition on the word: opacity, blur 10px to 0 (0.8 s), rise .14em to 0 (1 s, `--ease-out-expo`), once 60% in view. Reduced: 200 ms opacity only (and JS keeps it final). | WordReveal's .3em rise is 39 px at this size. A seventh of an em reads as setting in. |
| 7 | figureNote under `.num` | `withNums()` wraps only `$12,500` and `5x` inside the copy sentence in `.num` spans. Chips carry `.num` on the whole token ("P1 1x"). | Rule 2.4.4 without retyping approved copy; `.num` on the whole sentence would force `direction: ltr` on English prose and misalign it under RTL. |
| 8 | The guarantee figure's `className` in §5.4 includes `num` | `num` stays on CountUp's inner span (WP0 already puts it there) and is **not** on the outer block. | `.num` sets `direction: ltr`; on the block it left-aligned the figure under RTL. |
| 9 | none | The RoasDial and ShareScale wrappers are `container-type: inline-size`. | So WP8 can fit the share figure to the column with `cqi` (see request 1). Harmless otherwise. |

## Requests to the lead

1. **WP8 ShareScale figure overflows the figure column from about 1,366 px wide.** "10 to 16%" at `text-figure` measures **548 px** at 1440 (9vw = 129.6 px) and about 558 px at 1920, in a **520 px** column (cols 7 to 12 of the 1,072 px container). At 1280 it is 487 px and fits; at 768 it is 292 in 348; at 390 it is 271 in 358. Suggest ShareScale size its figure `font-size: min(clamp(64px, 9vw, 132px), 23cqi)` (the wrapper is already an inline-size container), which gives 119.6 px and about 506 px at 520. I have not widened the column, because the share row would then disagree with the paid row above it.
2. **WP8 RoasDial should be fluid** (`w-full`, height from the aspect ratio). My wrapper sets the width (`max-w-[360px]`, phone 300). The current stub is a fixed `size-[360px]` and overflows the 348 px column at 768 by 12 px; v1's dial was `w-full max-w-[420px]`, so the real one may already be fine.
3. **WP8 PayoutRail / Curve / RoasDial / ShareScale are still stubs** as I finish. Everything WP4 passes is final (`drawn`, `lit`, `steps`, `view.dial()`, `view.share()`), and the triggers are verified through `data-entry`. The visual pass on the four mocks inside the section needs one more look once WP8 lands; the acceptance lines that depend on them are marked PENDING below.
4. **`check:site` fails today on `/brands` and `/creators`, not from WP4.** The badge-word rule `/>\s*(live|live now|real time)\s*</i` matches WordReveal's word span `<span class="WordReveal_word…">live</span>` in WP3's run H2 ("From a link to a live campaign." / "From a handle to a live post."). The number section produces no match (its H2s have no "live"; ShareScale's note is not split). Either the check should skip `WordReveal_word` spans, or the lead rules on it; it will hit any WordReveal H2 with "live" in it.

## Acceptance (§5.4)

| Line | Result | Evidence |
|---|---|---|
| A MutationObserver on the figure during the count never records a value above "$63,050". It ends on "$63,050" within 1.5 s of starting. | **PASS** | Lab "Replay", 11 recorded writes, max 63,050, 0 above; start +234 ms, final +1,569 ms (1.34 s). WP0 `CountUp` also clamps every write with `Math.min(v, to)`. |
| The curve draws over 1.2 s with the count, inside cols 7 to 12, and is never wider than that column. | **PASS** (trigger and box) / **PENDING WP8** (the draw itself) | `drawn` flips with the count's trigger (same box, same 50%); Curve box 520 x 96 = the figure column at 1440, 358 x 96 at 390. The 1.2 s draw is `.draw` in globals.css, applied by WP8's Curve through `data-drawn`. |
| The guarantee column carries no phase budgets ("$4,000", "$7,500"). P1 to P3 chips stay. | **PASS** | SSR text of the section: "Guaranteed sales $63,050 $12,500 across three phases, at 5x" then the curve; no `$4,000`/`$7,500` anywhere in the guarantee row. Chips present in the ROAS row. |
| On `/creators`, `document.body.innerText` has no match for `/\$\s?\d/`. | **PASS** | Probe on `/creators`: `null`; `check:site` creators money rule did not fire. |
| ShareScale shows exactly 16 dots and the figure text "10 to 16%". `innerText` contains no "–". | **PENDING WP8** (WP4's side PASS) | `view.share()` passes `figure: "10 to 16%"`, `counts` summing to 16, the G3 note and spoken label; the section has no "–" (probe: `false`). The dots are WP8's. Spoken label on the page: "Shares of every order across 16 live campaigns, from 10% to 16%: 2 at 10%, …". |
| Reduced motion: final values, drawn charts, no transitions. | **PASS** | `--rm` and `?rm=1`: `$63,050`, every `data-entry="final"`, 87 lit dots, curve/dial `drawn` and rail `lit=4` from the start; CSS reduced block removes the divider, rule and "Weekly" transitions. H2s use WP0 WordReveal's spec'd 200 ms reduced fade. |
| On `/brands`, the ROAS chips read "P1 1x", "P2 3.7x", "P3 6.3x", and the dial's `aria-label` is "Guaranteed ROAS: 5x". | **PASS** (label via the WP8 stub) | Probe on `/brands`: chips `["P1 1x","P2 3.7x","P3 6.3x"]`, dial `aria-label` "Guaranteed ROAS: 5x" (built from `label` + `value`, which WP4 passes as `COPY.brands.number.dialLabel` and `view.dial().value`). |

Also from the brief and §2.4 / §5.9:

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .`: WP4 files | **PASS**, 0 errors (the whole project was clean on the last run) |
| `npx next lint --dir "app/(site)"` | **PASS**, no warnings or errors |
| Lab `?a=brands`, `?a=creators`, `&rm=1`, pause, `?at=top`, Replay | **PASS**, all reachable, no console errors |
| `npm run check:site` | **FAIL, not WP4** (request 4: WP3's WordReveal "live"). Nothing in the number section matches any rule. |
| Every number from demo.json (§6.4) | **PASS**: `$63,050` = `guarantee.revenue.value`, `$12,500` = `guarantee.budget.text`, `5x` = `guarantee.roasText`, chips from `ladder[]`, dial from `view.dial()` (5, 1, 12), share from `view.share()`. No numeric literal in JSX text. |
| One gradient spend here: the 2px rule (plus the Curve as figure chrome inside its column) | **PASS** |
| No layout shift from any entry state (transforms, opacity and SVG attributes only) | **PASS** |
| 1440x900 and 390x844 | **PASS** for WP4's layout; the mocks inside are stubs (request 3). |

Screenshots: `scratchpad/shots/WP4/` (`b-top.png`, `creators-1440.png`, `brands-390.png`, `creators-390.png`, `b-768.png`, `c-1024.png`, `b-rtl.png`, `page-brands.png`, `page-creators.png`, `phone-play.png`, crops `*-capline.png`, `*-figedge.png`).
