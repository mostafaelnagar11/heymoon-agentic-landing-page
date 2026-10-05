# WP4 Number: notes

4 Oct 2026. SPEC rev 2, §5.4 (S5, B8, B9). Branch `redesign`, nothing committed.

## What I built

| File | What it does |
|---|---|
| `_site/number/NumberSection.tsx` | `<Section slot="number" surface="paper" cv labelledBy>` (labelled by the first H2, `useId`), `py-[120px]` (phone `py-24`), container `mx-auto max-w-text px-[var(--gutter)]`. The lunar divider, then brands: Guarantee + Roas, creators: Paid + Share. Export and props unchanged (`NumberSectionProps`). |
| `_site/number/Divider.tsx` | 9 Moons, 11px, gap 16, centred, `text-ink`, phases `[0,1,2,3,4,5,6,7,0]`. Server HTML is final. Mounted below the fold: all new, then wax to their phases 60 ms apart once fully in view (12% up from the bottom). The dots ease `fill-opacity` over 320 ms so the sequence reads as waxing, not as nine cuts. `aria-hidden`. |
| `_site/number/Guarantee.tsx` | 12-col row. Left (cols 1 to 5): `WordReveal` H2 (`text-h2 max-w-[16ch] text-balance`), body `mt-5 text-body text-ink/72 max-w-[48ch]`, Pledge. Right (cols 7 to 12): `mono-caps text-ink/60` eyebrow, `mt-3` `CountUp to={guarantee.revenue.value} format="usd"` at `text-figure` (capped, `.fit`), `mt-4 text-lead text-ink/72` `figureNote(budget.text, roasText)`, `mt-8 <Curve drawn={counting} className="h-24 w-full">`. No ladder line (C14). The figure line is unseen while armed and comes in over 240 ms as the count starts (`.count`), so no start value is ever on screen. |
| `_site/number/Roas.tsx` | Left: H2, body, `mt-8 text-micro text-ink/60` climb label, `<ol class="mt-3 flex gap-2">` of `rounded-receipt px-3 py-2 text-small` chips from `COPY.brands.number.chip(rung)` (P1 `bg-brand/8 text-brand font-semibold`, P2/P3 `bg-ink/[0.04] text-ink/72`). Right: `RoasDial {...view.dial()} label note drawn` in a `max-w-[360px]` (phone 300) wrapper, centred on the copy. |
| `_site/number/Paid.tsx` | Left: H2, body, Pledge. Right: eyebrow "Your payout is paid", "Weekly" at `text-figure` (no count) that sets in once 60% in view (blur 10px to 0, rise .14em, 0.7 to 1 s), the note, `mt-8 <PayoutRail steps lit>` with `lit` 0 to 4 at 300 ms intervals once the rail is fully in view. |
| `_site/number/Share.tsx` | Left: H2, body, `mt-8 text-micro text-ink/60` "Every order is counted through", chips "Your code" / "Your tracking link" (`rounded-receipt bg-ink/[0.04] px-3 py-2 text-small text-ink/72`). Right, on the H2's cap line like the paid row: `<ShareScale {...view.share()} lit>`, `lit` on entry (45%). |
| `_site/number/parts.tsx` (new, in my folder) | `useEntry(ref, {threshold, rootMargin})`: rule 2.4.7 as state, `"final" \| "armed" \| "in"`. `useStepper(entry, total, everyMs)`: the one-shot 0..n counter for the divider and the rail. `withNums(text, values)`: wraps the bound values inside an approved sentence in `.num` spans without retyping the sentence. `Pledge`: the 2px `.grad-rule` (`w-[200px]`, scaleX 0 to 1, 600 ms `--ease-out`, start origin, RTL-mirrored) plus the signature. `ROW` / `COPY_COL` / `FIGURE_COL` grid classes. |
| `_site/number/number.module.css` | Rule scaleX states, row stacking, cap-line offset, the figure column as an inline-size container and the one figure size (`.fit`), the figures' optical edge, the "Weekly" set-in, the guarantee's armed guard (`.count`), then every transition inside `@media (prefers-reduced-motion: no-preference)` and the static reduced overrides. Only §2.3 variables; no `@apply`, no `theme()`, no Tailwind keys added. |
| `lab/number/page.tsx` | Every state: `?a=brands\|creators` (toolbar switch flips in place), `?rm=1` (toolbar), pause (toolbar), `?at=below` (default: a viewport of paper above, so the section mounts below the fold and plays on entry) and `?at=top` (mounts in view, must stay final). A floating "Replay" remounts the section below the fold and scrolls it in over 1.6 s, so the entry can be watched again. |

**Entry rule (2.4.7), one mechanism everywhere.** Every animated part renders its final state on the server (no-JS shows `$63,050`, the drawn curve and dial, the lit rail and divider, the full rule). On mount, only an element whose own top is below the viewport is reset (`armed`); an element in view or above stays final, so a switch made while reading the section (Swap remounts it in view) never replays it. Under `useReducedMotionPref()` (OS setting or lab `?rm=1`) everything stays final. The curve's trigger is the figure `<p>` at the same 50% threshold as `CountUp`'s own observer, so the curve starts with the count.

**Pause.** The section's motion is all one-shot entry (count 1.4 s, draws 1.2 s, divider 0.54 s, rail 1.2 s). §5.9 lists count-up, curve and dial as "n/a" when paused and §5.0.8 does not list the number section among the paused loops, so the pause toggle does not touch it. Nothing here loops or moves for more than 5 s.

## Measured (headless Chromium via the private helper; SwiftShader, so frames are slow)

- 1440x900 (re-measured in the fix round, real WP8 mocks): section height **1,080 px** brands, **1,107 px** creators (B9 target about 1,150); phone 390: 1,541 / 1,539. Copy column 428 px at x 184; figure column **520 px** at x 736; Curve **520 x 96** (exactly the column). Divider at the section top + 120.
- Count probe (rAF sampler on the figure while scrolling in, fix round): max value **$63,050**, **0** values above it; first move ($966) one frame after the trigger, "$63,050" **1.33 to 1.36 s** later.
- Curve vs count (fix round, real Curve): `data-drawn` flips on the trigger frame; `stroke-dashoffset` leaves 1 on the same frame as the count's first move and reaches 0 **1.21 s** later.
- Cap line: eyebrow top 313 vs H2 top 307 at 1440; the eyebrow's cap top meets the H2's within 1 px (2x crop). The "$" and the "W" sit on the eyebrow's left edge within 1 px (2x crop) after the optical pull.
- 390x844: no horizontal scroll (`scrollWidth` 390), figure 64 px, curve 358 x 96 under the note, dial 300 px.
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
| 4 | Figure column, no offset given | Every row whose figure column opens with an eyebrow and a figure (guarantee, paid, share) sets the eyebrow's cap top on the H2's cap top (`padding-top: calc(clamp(30px,3.3vw,48px) * .168 - 2px)` from 768). Only the ROAS row, a dial with no eyebrow, centres its mock on the copy (`self-center`). | Editorial alignment: the eyebrow and the H2 start on one line. WP8's real ShareScale opens with its own eyebrow and figure, so it aligns like the paid row above it (fix round). |
| 5 | none | Optical edge: the count's block is pulled back `-0.06em`, "Weekly" `-0.04em` (LTR only). | At figure size Geist's tabular "$" and the "W" carry side bearing; without the pull the figure sat 5.5 px inside the column edge the eyebrow and the note share. |
| 6 | "Weekly sets in at figure size" (no technique given) | A CSS transition on the word: opacity, blur 10px to 0 (0.8 s), rise .14em to 0 (1 s, `--ease-out-expo`), once 60% in view. Reduced: 200 ms opacity only (and JS keeps it final). | WordReveal's .3em rise is 39 px at this size. A seventh of an em reads as setting in. |
| 7 | figureNote under `.num` | `withNums()` wraps only `$12,500` and `5x` inside the copy sentence in `.num` spans. Chips carry `.num` on the whole token ("P1 1x"). | Rule 2.4.4 without retyping approved copy; `.num` on the whole sentence would force `direction: ltr` on English prose and misalign it under RTL. |
| 8 | The guarantee figure's `className` in §5.4 includes `num` | `num` stays on CountUp's inner span (WP0 already puts it there) and is **not** on the outer block. | `.num` sets `direction: ltr`; on the block it left-aligned the figure under RTL. |
| 9 | none | The figure column itself is `container-type: inline-size` (`.figureCol`); the per-mock wrapper containers are gone. | ShareScale is its own container now (WP8), and the column container lets the guarantee and "Weekly" figures use the same `cqi` cap (deviation 10). |
| 10 | `text-figure` (clamp(64px, 9vw, 132px)) | Every figure in the section is `min(clamp(64px, 9vw, 132px), 23cqi)` of its column: "$63,050", "Weekly" (`.fit`) and WP8's "10 to 16%". | WP8 capped "10 to 16%" at 23cqi so it fits 520 px; from about 1,300 px wide that left "Weekly" (129.6 px) 8% larger than the figure under it (119.6 px). One figure size per section, on both audiences: 119.6 px at 1440, unchanged at 1280 and below. |
| 11 | §5.0.10: CountUp renders the start value offscreen | The guarantee's figure line is `opacity: 0` while its entry is armed and comes in over 240 ms (`--ease-out`) when the count starts. | Rule 2.4.7 ("never a visible jump") and the lead's ruling that a count never shows "$0" before it starts. The line keeps its box, so nothing shifts. Works whatever CountUp holds while armed (see the fix round). |

## Requests to the lead

1. **CLOSED (fix round).** WP8 sizes the share figure `min(clamp(64px, 9vw, 132px), 23cqi)` (`mocks.module.css` `.shareFigure`): 119.6 px in the 520 px column at 1440. (Was: "10 to 16%" overflowed the figure column from about 1,366 px wide.)
2. **CLOSED (fix round).** RoasDial is `mx-auto w-full` with its height from the viewBox: 360 px at 1440, 300 px at 390, inside the 348 px column at 768. (Was: the stub was a fixed 360 px.)
3. **CLOSED (fix round).** All four mocks are real; the visual pass is redone in the fix round below. (Was: they were stubs when WP4 finished.)
4. **CLOSED (fix round).** The verifier ran `npm run check:site`: "check:site ok". (Was: the badge-word rule matched WP3's WordReveal "live".)
5. **Spec conflict on the divider's colour; please rule.** B8 (§1.5, SPEC line 164) says the nine glyphs are "at ink/16"; §5.4 (line 2284) says "centred, ink". WP4 follows §5.4, its own section: `text-ink`, so lit dots are full ink and unlit dots .16 (the Moon glyph's own unlit opacity). If the ruling is ink/16, it is one class in `Divider.tsx` (`text-ink` → `text-ink/16`), but at 11 px the lit and unlit phases would then be nearly indistinguishable and the waxing sequence would be lost. Crop: `shots/WP4v/crop-divider.png`.
6. **Guarantee and LEAD-A's CountUp change.** Guarantee keeps the figure line unseen while its own entry is armed and shows it as the count starts (deviation 11), which relies on CountUp starting at 50% of its box, as §5.0.10 states. If the new CountUp starts at a different threshold, tell WP4 (or change the `threshold: 0.5` in `Guarantee.tsx` to match): otherwise the line would come in a few pixels of scroll before or after the count. It never shows "$0" either way.
7. **Observation for WP8, no action required.** Curve's .20 area fill ends in a hard vertical edge at the column's right side (`crop-curve-end.png`, 3x). It reads as the edge of an area chart and matches v1, so I would leave it; a horizontal fade on the last ~8% would soften it if the lead wants.

## Acceptance (§5.4)

| Line | Result | Evidence |
|---|---|---|
| A MutationObserver on the figure during the count never records a value above "$63,050". It ends on "$63,050" within 1.5 s of starting. | **PASS** | Lab "Replay", 11 recorded writes, max 63,050, 0 above; start +234 ms, final +1,569 ms (1.34 s). WP0 `CountUp` also clamps every write with `Math.min(v, to)`. |
| The curve draws over 1.2 s with the count, inside cols 7 to 12, and is never wider than that column. | **PASS** | Fix round, real Curve: `stroke-dashoffset` leaves 1 on the count's first-move frame and reaches 0 1.21 s later (rAF sampler); on `/brands` after the scroll it rests at `0px` with `data-drawn`. Box 520 x 96 = the figure column at 1440, 358 x 96 at 390. |
| The guarantee column carries no phase budgets ("$4,000", "$7,500"). P1 to P3 chips stay. | **PASS** | SSR text of the section: "Guaranteed sales $63,050 $12,500 across three phases, at 5x" then the curve; no `$4,000`/`$7,500` anywhere in the guarantee row. Chips present in the ROAS row. |
| On `/creators`, `document.body.innerText` has no match for `/\$\s?\d/`. | **PASS** | Probe on `/creators`: `null`; `check:site` creators money rule did not fire. |
| ShareScale shows exactly 16 dots and the figure text "10 to 16%". `innerText` contains no "–". | **PASS** | Fix round, `/creators` at 1440 and 390: 16 `svg.moon` in the ShareScale figure, all 16 `data-on="1"` after entry, figure text "10 to 16%", section `innerText` has no "–". |
| Reduced motion: final values, drawn charts, no transitions. | **PASS** | `--rm` and `?rm=1`: `$63,050`, every `data-entry="final"`, 87 lit dots, curve/dial `drawn` and rail `lit=4` from the start; CSS reduced block removes the divider, rule and "Weekly" transitions. H2s use WP0 WordReveal's spec'd 200 ms reduced fade. |
| On `/brands`, the ROAS chips read "P1 1x", "P2 3.7x", "P3 6.3x", and the dial's `aria-label` is "Guaranteed ROAS: 5x". | **PASS** (fix round, real RoasDial: chips and label re-probed on `/brands` at 1440 and 390) | Probe on `/brands`: chips `["P1 1x","P2 3.7x","P3 6.3x"]`, dial `aria-label` "Guaranteed ROAS: 5x" (built from `label` + `value`, which WP4 passes as `COPY.brands.number.dialLabel` and `view.dial().value`). |

Also from the brief and §2.4 / §5.9:

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .`: WP4 files | **PASS**, 0 errors (the whole project was clean on the last run) |
| `npx next lint --dir "app/(site)"` | **PASS**, no warnings or errors |
| Lab `?a=brands`, `?a=creators`, `&rm=1`, pause, `?at=top`, Replay | **PASS**, all reachable, no console errors |
| `npm run check:site` | **PASS** per the fix-round verifier ("check:site ok"). |
| Every number from demo.json (§6.4) | **PASS**: `$63,050` = `guarantee.revenue.value`, `$12,500` = `guarantee.budget.text`, `5x` = `guarantee.roasText`, chips from `ladder[]`, dial from `view.dial()` (5, 1, 12), share from `view.share()`. No numeric literal in JSX text. |
| One gradient spend here: the 2px rule (plus the Curve as figure chrome inside its column) | **PASS** |
| No layout shift from any entry state (transforms, opacity and SVG attributes only) | **PASS** |
| 1440x900 and 390x844 | **PASS** with the real mocks (fix round). |

Screenshots: `scratchpad/shots/WP4/` (`b-top.png`, `creators-1440.png`, `brands-390.png`, `creators-390.png`, `b-768.png`, `c-1024.png`, `b-rtl.png`, `page-brands.png`, `page-creators.png`, `phone-play.png`, crops `*-capline.png`, `*-figedge.png`).

## Fix round (4 Oct)

Input: `scratchpad/fix/WP4-verify-issues.json` (5 items), the PENDING acceptance lines now that WP8's real mocks have landed, and LEAD-A's CountUp change. Files touched: `number/Share.tsx`, `number/Roas.tsx`, `number/Guarantee.tsx`, `number/Paid.tsx`, `number/number.module.css`, this file. `lab/number/page.tsx` needed no change. Screenshots: `scratchpad/shots/fix/WP4/`.

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Share row's figure column centred while its eyebrow and figure sit beside the H2 (medium) | **FIXED** | `Share.tsx`: the column takes `s.capLine`, `md:self-center` dropped. H2 top to eyebrow top, share row vs paid row: 1440 **5.9 vs 6.0 px**, 1024 **3.7 vs 3.7**, 768 **3.0 vs 3.0** (was 16.3 / 7.1 / 37.3). Only the ROAS dial row still centres. Deviation 4 updated. `crop-share-align-before-after.png` (top: before, bottom: after), `after-creators-1440.png`. |
| 2 | Notes out of date: two PENDING lines, stale heights, requests 1 to 4 open, visual pass on stubs (low) | **FIXED** | Re-measured with the real mocks: section 1,080 px brands / 1,107 px creators at 1440 (1,541 / 1,539 at 390). Curve: dashoffset 1 → 0 over 1.21 s from the count's first-move frame, 520 x 96 / 358 x 96. ShareScale on `/creators`: 16 dots, all lit after entry, "10 to 16%", no "–". Both PENDING lines now PASS; requests 1 to 4 closed with evidence; "Measured" rewritten. |
| 3 | CSS motion declared outside `no-preference` and switched off in a `reduce` block (rule 2.4.6) (low) | **FIXED** | `number.module.css`: the divider dot, rule and "Weekly" transitions (and the new count fade) live only in `@media (prefers-reduced-motion: no-preference)`. The reduce block keeps the static overrides and the deliberate 200 ms "Weekly" opacity fade. Computed `transition-duration` under OS reduce: divider, rule, Weekly, count all `0s`; motion on: 0.32 s / 0.6 s / 0.7-1 s / 0.24 s. Entries `final` under reduce before and after scroll. `rm-brands-1440.png`, `rm-creators-1440.png`. |
| 4 | "Weekly" 129.6 px over "10 to 16%" 119.6 px in one column from about 1,300 px (low, optional) | **FIXED** | The figure column is now the inline-size container and every figure takes `.fit`: `min(clamp(64px, 9vw, 132px), 23cqi)`, WP8's cap. Applied to "$63,050" too, so the section has one figure size on both audiences. 1440: Weekly **119.6**, "10 to 16%" **119.6**, "$63,050" **119.6**; 1024: 92.16 each; 768: 69.12; 390: 64. Redundant wrapper containers in Roas/Share removed. Deviations 9 and 10. `after-creators-1440.png`, `after-brands-1440.png`. |
| 5 | Divider colour: B8 "ink/16" vs §5.4 "ink" (low) | **FIXED (raised)** | Recorded as request 5 for the lead to rule; `text-ink` kept per §5.4, with the one-class change ready if the ruling goes the other way. |
| 6 | Re-check the sections with the real WP8 mocks (Curve, RoasDial, ShareScale, PayoutRail) | **DONE** | Lab and real pages, 1440 and 390, both audiences, motion on and reduced: Curve 520 x 96 in the column, draws with the count; RoasDial 360 px (phone 300), `aria-label` "Guaranteed ROAS: 5x", arc and dot drawn; PayoutRail's four glyphs on the rail at their final phases after entry, each label under its glyph; ShareScale on the cap line, 16 dots. `scrollWidth` = viewport everywhere. Console: clean on the lab and on `/creators` at 390 on three reruns (one `removeChild` pageerror and WP5's "DESK is not defined" came from other packages' HMR while I probed, not from the number section). One observation for WP8 (request 7). `after-*-1440.png`, `after-390-pair.png`, `page-*-*.png`, `c-enter-0.png`. |
| 7 | Guarantee must work with LEAD-A's CountUp change and never show "$0" or any figure other than the bound one | **FIXED** | `Guarantee.tsx` + `.count`: the figure line is `opacity: 0` while armed and fades in over 240 ms on the same 50% trigger as the count, so it is independent of what CountUp holds before it starts. rAF sampler while scrolling in (`ui/CountUp.tsx` unchanged as of 21:45, still writing "$0" when armed): **0** visible frames with "$0", **0** visible frames before the count, first visible frame "$966" at opacity .29, max $63,050, 0 above, count 1.36 s. Simulating a CountUp that holds "$63,050" while armed: the trigger frame paints "$63,050" at opacity 0, then "$966" at .29, so no visible jump either. Held at 45% in view (armed): the eyebrow shows over an empty line, no "$0" (`count-partial-1440-crop.png`). Reduced (OS and `?rm=1`): `final`, opacity 1, "$63,050" from mount. Request 6 records the threshold dependency. |

Checks: `npx tsc --noEmit -p .` 0 errors (project-wide); `npx next lint --dir "app/(site)"` no warnings or errors.
