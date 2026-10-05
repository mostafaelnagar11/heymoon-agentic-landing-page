# ECLIPSE-W2-STAGE: the Eclipse hero's stage, wave 2

5 Oct 2026. These are the STAGE package's notes for wave 2 (HERO-V2 "Wave 2 plan", rulings W2c-1 to W2c-9). The captures and scripts are in `$SP/w2c-stage/`, where `$SP` is `/private/tmp/claude-501/-Users-mostafaaelnagar-Documents-moontech/d50da6c8-1e72-439f-9d55-d7ba5aef42c4/scratchpad`. Nothing is committed; the lead commits.

## Files changed

| File | What |
|---|---|
| `sky/EclipseSky.tsx` | **Agents mount:** `next/dynamic`, sibling of the star-row wrapper inside the hero, so the sticky section is the card's containing block. Props: `stage`, `handle`, `gl`, `mountKey`, `card`. **Canvas box (V4):** the canvas is the stage's first child, `<canvas key={mountKey}>`. **Lifecycle (ported from the stash):** `onFail` commits with `flushSync`. `"lost"` remounts on a fresh canvas, at most `MAX_REMOUNTS` per page (a module counter). `"gaveup"` removes the canvas and destroys the renderer after its stack unwinds. `"nogl"`, `"link"` and `"atlas"` leave the poster. `onTier` sets `data-tier` while GL is on. Phones also pause while the sheet covers the star (`useUncovered(stageRef)`). **Kept from HEAD unchanged:** the early chunk load, `glAllowed()`, hold/release on the poster's `transitionend` (or 320 ms), urgent `setAudience` (never instant), `setFocus`, input → `pulse`, `data-going` → `launch`, resize observers. Field listeners now sit in their own effect, so they survive a remount. **Nothing from the stash's spill, field measure, cut loader or labels.** |
| `sky/eclipse.module.css` | `.canvas { position: absolute; inset: -50%; width: 200%; height: 200%; opacity: 0 }`, `[data-on="true"]` opacity 1, no transition. The full-hero canvas is gone. |
| `sky/EclipsePoster.tsx` | Keeps the stopped run's W2-3 phone painter. **New:** first-load copies of the five contract values it and EclipseSky need, plus a dev-only parity check against the contract (see "Request to the lead"). |
| `sky/poster.module.css` | Unchanged from the kept stopped-run version. |
| `hero/Hero.tsx` | `EclipseSky` gets `rowClassName={s.starRow}` and `card={G10_SIGNED}`; the G10 comment is updated (the card replaces the toasts on the eclipse hero). `Glow` is ported from the stash **without the pool**. |
| `hero/hero.module.css` | **Split (W2c-5):** from 768 px, `.stage` width is `SPLIT_CSS.width` verbatim. **Phone stack (W2c-6):** see below. **Glow:** `.glow` and `.core` (see Deviations). `.eTop` is `position: relative; z-index: 1`. `.eField` is `relative; isolation: isolate`. `.eBottom` is now `relative`, so the chips paint over the glow even under reduced motion, when they have no transform. The nav-box padding, the columns, the gap, `.copy`, `.eHeadline` and `.eField` sizing are untouched. |

**Phone CSS.** The stash's bug was that `.hero.eclipse { align-items: center }` centred the star row, and a `container-type: size` box centred that way has no height, so `100cqh` was 0. The row now has `align-self: stretch`. The stage is `--s: max(120px, min(240px, 62vw, calc((100cqh - 8px) / 1.258)))` with `margin-top: max((100cqh - S)/2, .129 S + 4px)`. That centres it, and at the 120 px floor it keeps the cluster 4 px under the chips and runs under the sheet.

`grep -rn "spill\|Spill\|pool\|fieldAim\|setFieldRect\|--aim-" sky hero` finds only the contract's obsolete-member comments.

## Request to the lead (contract structure; worked around, not edited)

`eclipse-api.ts` must not be imported at runtime by first-load modules. Webpack keeps one copy of a module, and that copy carries every export any chunk uses. Once Agents (lazy) and RENDERER's new `eclipse.ts` (lazy) imported the contract's helpers, the copy the first-load EclipseSky and EclipsePoster pulled in grew to 2.9 kB gz. First load went to **160.5 kB (FAIL)** with no change in what the first load uses (`$SP/w2c-stage/measure-2.txt`). The header claim that "webpack drops the exports nobody imports" holds only when no chunk imports them.

**Workaround (my files only):** EclipsePoster holds first-load copies of `PHONE_MQ`, `POSTER_FADE_MS`, `STAGE_ATTR`, `MAX_REMOUNTS`, `posterSources` and `posterWidth`, and EclipseSky imports them from it. A dev-only `import("./eclipse-api")` compares them with the contract on every page load and logs `console.error` on drift. Webpack drops that branch in production: the first-load chunks hold no contract strings (checked). First load is back to **158.1 kB**.

**Proper fix (lead):** add a tiny first-load module, for example `sky/eclipse-base.ts`, holding those values. The contract re-exports it, the two first-load files import the base, and my copies are deleted.

## Measure (`npm run measure`)

| | first load | site | css | html (b / c) | lazy site | sky line |
|---|---|---|---|---|---|---|
| before (`measure-before.txt`) | 158.0 kB | 27.9 | 25.2 | 20.2 / 23.4 | 79.6 (12) | 5.7 (HEAD renderer) |
| after (`measure-after.txt`) | **158.1 kB** (headroom 1.9) | 28.0 | **25.5** | 20.3 / 23.5 | 81.7 (13) | 10.7 (RENDERER, budget 12) — **measure ok** |

Mine: about +0.1 kB of first-load JS (budget +1.8). CSS +0.3 kB for STAGE and AGENTS together (budget +0.6 and +0.3).

## Regress (`$SP/w2c-arch/regress.cjs`)

- **Without GL, all nine sizes, both audiences:** `regress: all checks pass` (`regress-final.txt`). NAVBOX, COLEND, H1x3, FIELDY, STAR, CLUSTER, FOLD and HSCROLL all pass. STAR matches `heroSplit` within ±0.1 (1440: 536.7 at 1000, 450). CARD lines are notes only; they belong to AGENTS.
- **With GL (`--gl`):** one FAIL in the full run, `FIELDY 390x844: brands 279.8 vs creators 281.7`. The rerun at that size passes (279.8 on both). It is the flake regress.cjs already notes: the field's rise-in transform is caught under SwiftShader load.
- **The baseline's 32 FAILs** (STAR and CLUSTER at the split sizes and both phones) are all gone.

## Phone geometry (`regress-phone5.json`, `?sky=css`; identical on both audiences)

| size | stage S (= phoneS) | star row (top..bottom, height) | field y | chips bottom | sheet top | cluster y |
|---|---|---|---|---|---|---|
| 390x844 | 240 | 413.5..768 (354.5) | 279.8..343.8 | 409.5 | 804 | 439.8..741.7 |
| 360x740 | 200.3 | 404..664 (260) | 270.3..334.3 | 400 | 700 | 408..660 |
| 390x660 | 129.2 | 413.5..584 (170.5) | 279.8..343.8 | 409.5 | 620 | 417.5..580 |
| 360x660 | 136.7 | 404..584 (180) | 270.3..334.3 | 400 | 620 | 408..580 |
| 375x548 | 120 (floor) | 408.8..472 (63.2) | 275.1..339.1 | 404.8 | 548 | 412.7..563.7 |

At 375x548, regress FOLD reports "sheet top 548 > innerHeight − 40". That is Lift.tsx's rule: no phone peek below 601 px tall. The field bottom (339) is still above the sheet top − 8.

## LCP (A-P2, production build on 3005)

Warm contexts (`lcp-3005.txt`, `lcp2.cjs`):

| size | brands | creators |
|---|---|---|
| 390x844 | **H1**, 216 to 293 ms | **H1**, 254 to 352 ms |
| 360x740 | **H1**, 261 to 283 ms | **H1**, 209 ms |
| 1440x900 | poster `<img>` (878,400 px²), 287 to 530 ms | poster `<img>`, 305 ms |

The first context of a freshly launched SwiftShader browser has FCP 4 to 5 s. It does the same with `?sky=css` (no GL at all), so it is browser cold start, not the page. The W2-3 painter works on the production build: the phone `<img>` is never the LCP.

One trap while measuring: another package's `npm run measure` rebuilt `.next-measure` under my running 3005 server (BUILD_ID 17:05:41). Its chunks then returned 400 and GL never started. I restarted only my own server and reran.

## A-F3 handover (dev server; with RENDERER's current posters, poster.json rendererHash `50a44e8…` = current)

`ho-cast.cjs` uses a CDP screencast, which records every frame the compositor actually produced, plus page timestamps for `load` and the `data-gl` flip. A warm-up `?sky=css` visit runs first and leaves the shader cache cold. Each sheet shows load +0/100/300/600/1000/2000 ms and flip −1 frame, +0, +120, +240 and +400 ms, then every frame:

- `$SP/w2c-stage/ho/v2-brands-1440x900/sheet.png`: glass star and rings in every frame from the first paint (266 ms). dE76 in the 2 S box from flip −1 to +240 ms is 0.02; at +400 ms it is 0.34, which is the copy animating in. Background (1, 3, 23).
- `…/v2-brands-390x844/sheet.png`: glass and rings in every frame; flip −1 to +400 ms dE ≤ 0.01; background (1, 3, 23).
- `…/v2-creators-1440x900/sheet.png`: glass star in every frame; flip ±: 0.00 to 0.32; background (1, 3, 23).
- `…/v2-creators-390x844/sheet.png`: glass star in every frame; flip: ≤ 0.38; background (1, 3, 23).

There is never a flat star, an empty stage after the first paint, or a second silhouette. The only white tile is Chromium before the document's first paint (≤ 54 ms). Earlier runs with the wave-1 posters are in `ho/dev-*`: same result, but there the brands rings faded in about 2.4 s after the handover, because those posters had no rings.

Timed `page.screenshot` cannot resolve this on SwiftShader: one screenshot blocked for 11.5 s during the compile.

## The switch (locked; proof on the page, both directions, 1440x900 and 390x844)

`switch-probe.cjs --q "?skydebug" --ms 26000` with grabs. Each drawn frame advances the switch clock by at most 100 ms on SwiftShader, so the grabs land about every 100 ms of switch time. Each strip has 12 frames labelled with the switch clock; `draws.txt` has every row.

| run | facing (switchMs) | soft, tint | bead | rings |
|---|---|---|---|---|
| b→c 1440 (`sw/grab-creators-1440x900-strip.png`) | .684 (100), **.206 (200)**, .240 (300), .568, .775, .891, **.948 (700)**, .972 (800) | 0 → 1, 0 → 1 | 0.800 → −2.342 (−π) | 1 → 0 |
| b→c 390 (`…-creators-390x844-strip.png`) | .897 (41), .493 (141), **.008 (241)**, .395, .672, .837, **.950 (691)** | 0 → 1 | −π | 1 → 0 |
| c→b 1440 (`…-brands-1440x900-strip.png`) | .684 (100), **.206 (200)**, .240, .567, .775, .891, **.948 (700)** | 1 → 0 | −2.342 → −5.483 (−π) | 0 → 1 |
| c→b 390 (`…-brands-390x844-strip.png`) | .881 (44), .455 (144), **.036 (244)**, .377, .737, .861, .942 (644), **.977 (744)** | 1 → 0 | −π | 0 → 1 |

The frames read like `sculpture/sw-grid.png`. On the way to creators: tilted slab, edge-on liquid sliver with the flash at 200 to 300 ms, face-on pink liquid glass by about 700 ms. The bead swings clockwise from upper right to lower left with its trail, the corona warms violet to pink, and the brands rings fade out with it. The way back is the mirror and lands as the violet bevelled slab, with the rings back. Nothing in STAGE touches the switch: `setAudience(audience)` runs on the urgent audience, and the canvas is never hidden, delayed or remounted by a switch.

Wall-clock note for RENDERER and the lead: on SwiftShader the new renderer draws about 1 frame/s at the 1073² box (HEAD drew about 3.6/s at the full hero), so a switch takes about 8 s of wall time there. Frame by frame it is intact.

## Fallbacks and lifecycle (`checks.cjs`, `checks/result.txt`)

| check | 1440x900 | 390x844 |
|---|---|---|
| A-F4 reduced motion | PASS: no WebGL `getContext` ever; the creators poster shows at 129 ms, opacity 1, brands 0, no transition | PASS: (only `2d`, the poster painter); shown at 15 ms |
| A-F5 no-JS | PASS: each route shows its own poster `<img>` at full size (1073 = 2 S), no `data-paint`; the GET form submits to `/brands/c?read=example.com`, `/creators/c?h=examplehandle` | PASS: 480 = 2 S, same |
| A-F6 `?sky=css` and Save-Data | PASS: no context; crossfade coverage ≥ 0.999 both ways, ends on the target | PASS |
| A-F7 `loseContext()` | PASS: `data-gl` off and the poster at opacity 1, visible in the frame after `webglcontextlost` (the event arrives 1 to 2 s after the call on SwiftShader); 2 remounts on fresh canvases bring `data-gl="on"` back; the 3rd loss leaves the poster; no console errors | PASS (event 0.2 to 0.3 s) |
| A-G2 | PASS: `__sky.running` true → false (hidden tab) → true | PASS: also false at scrollY 390 (sheet top 414 < stage top 471), true again at 0 |
| A-P4 | PASS: canvas 1073 = 2 × 537 − 1; buffer/client 1.0 (SwiftShader: software renderers use DPR 1); tier high | PASS: 480 = 2 × 240; 1.0; tier mid |

## A-C5 (the glow behind the field), `ac5.cjs`, 1440x900, GL on

| | end edge + 24 px | start edge − 24 px | 24 px above the field |
|---|---|---|---|
| brands rest / focus | L* 4.4 / 4.5 | 1.3 / 1.3 | 12.7 / 13.4 |
| creators rest / focus | 10.3 / 10.5 | 1.4 / 1.4 | 15.8 / 16.5 |

**A-C5's ≥ 21 at the end edge is not met, and cannot be met without the deleted light.** The threshold was set for the spill's pool, which put light on the field's end edge. With the pool deleted ("you can delete this"), a halo centred on the field fades out before its ends. Reaching L* 21 there needs a halo near its peak (alpha .42) 24 px past the end, and that is the pool again. I propose that the lead retunes A-C5 once (the brief allows it) to: L* 24 px above the field ≥ 12 at rest on both audiences, and higher with focus. Focus does raise it (+0.7 L*).

## Deviations

1. **The glow is larger than §3.4's 1.5 × field by 240 px.** At that size the halo's ramp (75% of a 38% radius) ends inside the field's own ends, and only 7 px of the core shows above and below the field. Measured, the glow was invisible (L* 3.7 above the field). It is now `width: 200%; height: min(50svh, 440px)` on the split, with the same height as the old horizon hero's halo and the phone rule. The core is the field + 20 px a side by 140 px. Looked at on both audiences (`$SP/w2c-stage/glow-pair.png`): a soft violet or pink halo behind the field, with the H1 still the brightest thing.
2. **The contract's first-load values are copied into EclipsePoster** (see the request).
3. **The `.eBottom` positioning** (chips over the glow under reduced motion) is a one-line addition not in the brief.
4. **Phone stage margin rule** at the 120 px floor (see "Phone CSS").

## A-U

- **A-U1** (`u1.cjs`, `u1cmp.py`; `u1-before/` vs `u1-after/`). The footer is identical in every case; the only difference is the blinking caret, 22 px. The close under reduced motion has 0 differing pixels on both audiences at 1440 and 390, after aligning Lenis' landing offset (1 to 57 px). Under motion, the 390 shots are identical after alignment. The 1440 differences are the nav caught mid-transition at a different scroll position; the close itself is identical.
- **A-U2** (`tour/*-sheet.png`, 11 to 12 shots each, no console errors). Sections, the nav's night-glass split over the hero, the sheet, the promo launcher, the close and the footer are as before.

## Checks

`npx tsc --noEmit -p .` clean. `npx next lint --dir "app/(site)" --dir scripts` clean. `npm run check:site` ok (1 h1 per route, the deny lists). `npm run measure` ok.

## Open questions for the lead

1. The contract split (request above).
2. Retune A-C5 (above).
3. On SwiftShader the renderer runs at about 1 fps at the 2 S box. That is RENDERER's march-region and tier work; the watchdog does not step on software renderers.
4. For AGENTS: the card's root must stay `position: absolute`. `<Agents>` is a direct child of the hero grid, so any in-flow root would take a grid cell. At 1306x800 and 1024x768 the card sits over the cluster's faded lower edge, which the contract allows (no height rule).
