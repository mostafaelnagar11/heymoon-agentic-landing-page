# Eclipse wave 2: integration notes

5 Oct 2026, the integrator, on branch `redesign` after RENDERER, STAGE and AGENTS reported (their notes:
`ECLIPSE-W2-RENDERER.md`, `ECLIPSE-W2-STAGE.md`, `ECLIPSE-W2-AGENTS.md`). Nothing is committed; the lead commits.
`$SP` = `/private/tmp/claude-501/-Users-mostafaaelnagar-Documents-moontech/d50da6c8-1e72-439f-9d55-d7ba5aef42c4/scratchpad`.
Every capture and script named here is in `$SP/w2c-integ/`.

**Result.** The three packages work together on the page. The star flip and the eclipse switch animation are intact
in both directions at 1440x900 and 390x844 (dev server and production build). The brands rings and the agent card fade
with the switch, the glints follow the real stream on both audiences, and the creators hero is wave 1's eclipse with the
pink liquid star plus glints. I found and fixed one regression: on phones a frame painted mid-parse showed the star
171 px too high before it jumped into place. I made two rulings on thresholds. tsc, lint, `check:site`,
`npm run measure`, `hero-poster.cjs --check` and `regress.cjs --gl --card` all pass.

## What I changed

| File | Change | Why |
|---|---|---|
| `sky/eclipse-api.ts` | Deleted the obsolete members: `BEAD_TARGET_DEG`, `LABEL`, `labelAnchor`, and the handle's `setTyped`, `setCut`, `setFieldRect` and `setLabelRect`. Also deleted `RelRect` and `toStageRect`, which only those setters used. `setAgents` and `setTier` are now required. The header now states the rule that no first-load module imports the contract at runtime, with the 2.9 kB reason. `CUT` and `CutRange` stay as the deferred wedge's starting point. | The integration step in "Wave 2 plan". The renderer already implements both setters. |
| `hero/Agents.tsx` | `setAgents?.(…)` became `setAgents(…)`. | It is now required. |
| `hero/agents.module.css` | Fixed the comment: the file loads with the lazy chunk and is not first-paint CSS. | AGENTS measured this (the brief had assumed the opposite). |
| `hero/Hero.tsx` | **The copy now comes before `<EclipseSky>` in the DOM.** Grid areas still place both, so nothing moves on any layout. | Regression fix, below. |
| `scripts/hero-poster.cjs` | `--check` allows p99 ≤ 6.5 for the phone file below DPR 2. Every other row keeps 6. | My ruling on RENDERER's open question 2, below. |
| `public/hero/poster.json` | `node scripts/hero-poster.cjs` re-run, because the contract edit changed `rendererHash` (now `8fc319c…`). | All eight poster files came out byte-identical (sha1 compared); only the hash changed. |

I made no edit to the renderer, the switch, `EclipseSky`, `EclipsePoster` or the CSS. The packages already agreed on the
contract, and the glint schedule, renderer and card were in sync (below).

### The regression I fixed: the phone star jumped at first paint

`ho-cast.cjs` on the dev server showed this on the first painted frame at 390x844 (296 ms after navigation): the
star was centred at y ≈ 420 with no copy on screen, and by 587 ms it was at y ≈ 591.

The cause is the DOM order. `EclipseSky` came before `.copy` in the DOM, but on phones it sits in the grid row under
the copy (W2c-6). A frame painted while the HTML is still parsing has the stage but not yet the copy. Row 1 is then
empty, so the star row starts at 72 px with 696 px of height (`early2.cjs`: stage top 300 → 471).

It also happens on the production build: in 2 of 3 loads a frame at 32 to 40 ms has the stage without the copy. There
it is usually invisible, because the poster has not decoded yet.

With the copy first, the stage is at 471 from the first frame on dev and on production (3 of 3 loads each). On desktop
the order changes nothing visible: explicit z-index and grid areas, and a partial frame only lacks the star. The LCP is
unchanged (below).

## Rulings on the packages' open questions

| Question | Ruling |
|---|---|
| RENDERER 1 / A-A7: the glints on the bright half of the rim are +8 to +12 L* over the rim at waiting (MoonShot on brands, MoonWriter and MoonLive on creators) | **Accepted.** Mostafa asked for glints "subtle but visible": they are visible there, and at working (99 L*) they are clear. I did not touch the rim (the switch lock) or the levels. |
| RENDERER 2: phone poster p99 6.05 to 6.50 at DPR 1 and 1.5 | **Threshold 6.5 for the phone file below DPR 2** (`p99Limit`). Only a desktop window narrower than 768 px shows that file below DPR 2, and every phone passes at DPR 2 (p99 4.75 to 5.40). Raising the caps would add 2 kB AVIF and 6 kB WebP to every phone for no visible gain. `--check: ok`. |
| RENDERER 3: the low-passed centroid | Kept (HEAD fails the raw one too). |
| RENDERER 4: faces about 15% darker than the 2D preview | Kept at the contract's 0.36 / 0.24. Mostafa asked for the rings "quiet", and the H1 and field stay the brightest things on the left. |
| RENDERER 5: focus damp 0.85 | Kept. Measured on the page, focus reaches facing 0.997 at 1440 and 1.0 at 390. |
| RENDERER 6 / STAGE: three `<canvas>` elements at 390 after a remount | Expected: the GL canvas plus the phone poster's two layer canvases (W2-3). |
| STAGE 1: a first-load contract base module | **Not done; the workaround stays.** EclipsePoster's copies are checked against the contract on every dev page load (no error seen in any run). A real base module needs `hero-poster.cjs` to serve and allow a second module and to include it in `rendererHash`. That is a change to the poster pipeline with nothing failing today. It is left to the lead as a follow-up (see "Open"). |
| STAGE 2: A-C5 retune | **Accepted:** L* 24 px above the field ≥ 12 at rest on both audiences, higher with focus. STAGE measured 12.7 / 13.4 brands and 15.8 / 16.5 creators. The old end-edge threshold measured the spill's pool, which was deleted ("you can delete this"). |
| STAGE 3: about 1 to 3 fps on SwiftShader at the 2 S box | A software-renderer number: the march is bounded by the star's sphere (`BR`), and pixels past `LF1` return the night at once. At 390 SwiftShader draws 20 to 25 fps. The watchdog steps on real GPUs only. |
| AGENTS 1: the promo launcher sits 6 to 8 px under the card's end at 1024 to 1280 | Left as is; they do not overlap (1280x720: card 860..1200 × 588..632). The fix belongs to the launcher's position or to the contract. It is in "Open". |
| AGENTS 2: the punchline is cut ("Whether HeyMoon can guar…") | Left as the sketch specifies (one row with an ellipsis, 340 px). The options are in "Open" for Mostafa. |
| AGENTS 3 / 4 | 4 is done (the obsolete members are deleted). 3 is not needed: the sync check reads two animation frames after a crossing. |

## The switch (locked): proof on the page, after integration

These runs are after every integration edit, including the DOM-order fix. I used RENDERER's probe (`w2c-renderer/sp.cjs`,
which wraps `drawArrays`) and checker (`swcheck.cjs`). The checker compares each drawn frame's `__sky` with
`switchAt(switchMs)`.

Command: `node sp.cjs --to <aud> --q "?skydebug&skyslow=10" --everysw 60 --w <w> --h <h>`. That slows every switch
duration 10 times and grabs the canvas with `toDataURL` inside the draw's task every 60 ms of switch time, plus every
edge-on frame. The runner is `sw-final/runs.sh`.

| Run (`sw-final/`) | Frames checked | Mismatches vs `switchAt` (worst) | Edge-on | Lands | Bead | Rings |
|---|---|---|---|---|---|---|
| `slow-b2c-1440` brands → creators, 1440x900 | 278 | **0** (flip 0.003 rad, soft/aud 0.001, bead 0.002 rad) | facing **0.019** at 235 ms | facing 0.996, soft 1, tint 1 | 0.800 → −2.342 (**−π**) | 0.975 → 0 |
| `slow-c2b-1440` creators → brands, 1440x900 | 273 | **0** (0.002 / 0.001 / 0.003) | **0.002** at 238 ms | 0.996, soft 0, tint 0 | −2.342 → −5.483 (−π) | 0.025 → 1 |
| `slow-b2c-390` brands → creators, 390x844 | 514 | **0** | **0.014** at 232 ms | 0.956 (sway), soft 1, tint 1 | −π | 1 → 0 |
| `slow-c2b-390` creators → brands, 390x844 | 519 | **0** | **0.010** at 237 ms | 0.956, soft 0, tint 0 | −π | 0 → 1 |

- In every run soft, tint and bead move monotonically, and facing recovers to ≥ 0.95 after the single dip.
- The run before the DOM-order fix (`sw/`) gave the same: 0 mismatches, edge-on 0.001 to 0.022.

**Frames:** `sw-final/switch-strips.png` has 8 frames per run (switch ms 0, 120, 200, edge-on, 400, 600, 900, 1900). The
full contact sheets are `sw-final/slow-*/sheet.png`, and the individual JPEGs are `sw-final/slow-*/f*.jpg`.

They read like the prototype's `hero-concepts/sculpture/sw-grid.png`, frame for frame:

1. The bevelled slab tilts about the diagonal.
2. It passes edge-on as a thin liquid sliver with the dispersion flash (switch ms about 200 to 240).
3. It lands face-on in the other material: pink liquid glass on creators, the violet bevelled slab on brands.
4. Meanwhile the diamond-ring bead swings clockwise half the rim with its trail: upper right → lower left going to creators, and on round again coming back.
5. The corona and core warm violet → pink and cool back.
6. The brands rings fade out with the warming and back in with the cooling.

**At frame rate** (`?skydebug`, no slowing, no grabs, `sw-final/rt-*`; facing at each switch ms):

| Run | Series (switch ms: facing) | Mismatches |
|---|---|---|
| b2c 1440 (dev) | 100: .684 · **200: .206** · 300: .240 · 400: .568 · 500: .776 · 600: .892 · 700: .949 · 800: .973 | 0 |
| c2b 1440 (dev) | the same series | 0 |
| b2c 390 (dev) | 57: .836 · 124: .550 · 174: .300 · **274: .173** · 341: .428 · 424: .664 · 541: .861 · 641: .942 · 741: .978 | 0 |
| c2b 390 (dev) | 64: .813 · 130: .517 · 180: .266 · **280: .203** · 380: .554 · 514: .828 · 614: .927 · 714: .972 | 0 |
| b2c 1440 (**production build**, 3005, `sw-prod/`) | 113: .627 · **213: .144** · 313: .289 · 413: .601 · 513: .794 · 613: .901 · 713: .953 | 0 |
| c2b 1440 (production build) | 100: .684 · **200: .206** · 300: .240 · 400: .568 · … · 800: .973 | 0 |

- SwiftShader draws 3 to 4 fps at 1440 (250 to 500 ms per frame). Each frame advances the switch clock by the 100 ms cap, so even there the tumble shows over about 20 frames instead of jumping to the end.
- At 390 it draws 20 to 25 fps.
- On a real GPU at 60 fps the clock is wall time and the switch takes HEAD's 1.7 s.
- At frame rate no drawn frame lands exactly on the edge-on instant; the slowed runs prove the dip.

## Item 6: no flat star, the handover invisible (after the fix, dev server)

`ho-cast.cjs`: a CDP screencast of every composited frame, picked at 0, 100, 300, 600, 1000 and 2000 ms after
navigation, plus the `data-gl` flip. Sheets: `ho/<route>-<size>/sheet.png`.

| Route, size | Before first paint | First paint | Frames after | Flip −1f → +400 ms (dE76 in the 2 S box) |
|---|---|---|---|---|
| brands 1440x900 | white ≤ 38 ms (Chromium's pre-paint) | 518 ms: glass star, rings, glints (the copy is still fading in: dE 9.5) | glass in every frame | 0.00 to 0.33 |
| creators 1440x900 | white ≤ 14 ms | 542 ms: glass, pink | glass in every frame | ≤ 0.35 |
| brands 390x844 | white ≤ 39 ms | 242 ms: glass and rings **in the final place** | glass in every frame | ≤ 0.39 |
| creators 390x844 | white ≤ 43 ms | 242 ms: glass in the final place | glass in every frame | ≤ 0.49 |

There is no flat star, no empty stage after the first paint and no jump. The background outside the box is (1, 3, 23)
in every frame. The posters on disk are the renderer's frames: `--check` passes the hash, all 24 parity rows, and A-F2
on all four (0 draws while held, 159 to 172 ms held, centroid ≤ 0.168 px over the first 300 ms).

## Sizes (both routes, GL on; `shots/`, `sizes.cjs`, `shots/facts.json`)

These 14 shots were taken just before the DOM-order fix. The fix moves nothing at rest, and the `regress.cjs --gl --card`
run after it measured the same boxes. Every other capture in these notes is from after the fix.

| Size (`shots/pair-<size>.png`) | Stage (l,t..r,b) | Field | Card on brands | Notes |
|---|---|---|---|---|
| 1920x1080 | 967,267..1513,813 | 400..896 × 644..720 | 1180..1520 × 948..992 | |
| 1440x900 | 732,182..1268,718 | 160..662 × 555..631 | 940..1280 × 768..812 | |
| 1280x720 | 687,116..1175,604 | 80..600 × 451..527 | 860..1200 × 588..632 (`regress`) | |
| 768x1024 | 449,371..732,653 | 24..406 × 559..635 | none (below `CARD_MQ`) | |
| 390x844 | 75,471..315,711 | 16..374 × 280..344 | none | sheet top 804 (40 px peek) |
| 360x740 | 80,434..280,634 | 16..344 × 270..334 | none | sheet top 700 |
| 844x390 | 547,164..755,372 | 24..449 × 329..405 | none (below 521 tall) | MQ.short: the hero is not sticky and scrolls. Its field bottom sits 15 px under the fold. The copy column is untouched since HEAD, and the smaller stage only lowers the row, so this is not a wave-2 regression. |

- Fields are identical on both audiences at every size.
- `hscroll` is 0 everywhere, with 0 face `<img>` elements in the DOM and no console errors or warnings in any of the 14 loads.
- On creators there are no rings and no card.
- The phone sheets (`shots/phones.png`) show switch, H1, field, chips, then the star, with the field fully above the fold at 390x844 and 360x740 with the 40 px peek.

**`regress.cjs --gl --card`** (`regress-gl.txt`), at 1920x1080, 1440x900, 1306x800, 1180x800, 1024x768, 900x800,
800x800, 390x844 and 360x740 on both audiences: **all checks pass**. That covers NAVBOX (the hero shares the nav's
1120 edges, 160..1280 at 1440), COLEND, **H1x3** (three rows on both audiences at every size), **FIELDY** (the same y on
both), STAR, CLUSTER, CARD, FOLD and HSCROLL.

The only note is the contract-allowed one: at 1306x800 the cluster's faded edge reaches the card top. The extra run at
1280x720 and 1366x657 also passes.

## Interactions (dev server, `interact.cjs`, `launch.cjs`)

- **Card and renderer in sync:** 12 of 12 samples agree (brands 1440, two animation frames after each read: `AGENT_ORDER[__sky.working]` equals the card's `data-agent` whenever it works). On creators 390 the working index ran MoonMatch, MoonWriter, MoonScore, MoonShot, never MoonLive or MoonLearning, with no card.
- **Focus:** facing 0.977 → 0.997 at 1440 brands (2.4 s), 0.999 → 1.0 at 390 creators. The glow behind the field stays, and there is no spill (STAGE grep: none left).
- **Typing:** each keystroke wakes the next glint, for example `[.55,.18,.18…]` → `[.70,.53,.18…]` → … → `[.82,.81,.81,.80,.78,.73,.63]` after 8 keys, with working −1. The card holds its text with the glyph at rest.
- **Submit:**
  - `launch()` is called 67 to 86 ms after Enter, and all seven glints go to 1.
  - The comet ran 0.064 → 0.568 → 0.983 within about 230 ms at 390. At 1440, SwiftShader drew one frame in that window.
  - The page navigates to `/brands/c?read=shop.example.com` (1.9 s, dev) and `/creators/c?h=%40examplehandle` (1.0 s).
- **No WebGL** (`nogl.cjs`, `--disable-webgl --disable-webgl2 --disable-3d-apis`): `data-gl="off"` and the poster is at opacity 1. The DOM glints light in turn: MoonMatch was working, with its spikes. The brands card shows at 1440 ("MOONMATCH AI Following the footer links to …"). The switch crossfades to the creators poster and the card goes. There are no console errors at 1440 or 390 (`nogl/pair-crop.png`).
- **Reduced motion** (`shots/rm-pair.png`): no GL and no dots. The poster is the render, and the brands card is static: "MOONSCORE AI Whether HeyMoon can guar…". The creators phone shows no card. There are no console errors.
- **Tours** (`tour-1440-sheet.png` brands, `tour-390-sheet.png` creators): the sections, the sheet, the promo launcher, the close and the footer are as before. There are no console errors.

## LCP (production build, `next start` on 3005 from `.next-measure`; STAGE's `lcp2.cjs`, warm contexts)

| Size | brands | creators |
|---|---|---|
| 390x844 | **H1**, 125 to 154 ms | **H1**, 88 ms |
| 360x740 | **H1**, 76 to 148 ms | **H1**, 135 ms |
| 1440x900 | poster `<img>`, 141 to 176 ms | poster `<img>`, 145 ms |

The first context of a freshly launched SwiftShader browser has FCP 2.2 to 2.5 s on any route. That is browser cold
start, as STAGE found (the same with `?sky=css`). The 3005 server was stopped afterwards; :3004 was never restarted.

## Measure (`npm run measure`, after every edit; `measure-2.txt`)

| route | first load | framework | motion+lenis | site | css | html | font preloads |
|---|---|---|---|---|---|---|---|
| /brands | **158.1 kB** (≤ 160) | 88.5 kB | 41.6 kB | 28.0 kB | 25.5 kB (≤ 26) | 20.3 kB | 1 |
| /creators | **158.1 kB** (≤ 160) | 88.5 kB | 41.6 kB | 28.0 kB | 25.5 kB | 23.5 kB | 1 |

- Lazy site chunks: 13, 81.7 of 110 kB.
- Sky chunks: the renderer `8814.*` **10.7 kB** (≤ 12, off the first load) and the close's `5604.*` 5.7 kB.
- deny-list: 24 handles, 11 names and 4 patterns over 26 site chunks.
- **measure ok.** Before the integration it was the same: 158.1 / 25.5 / 81.7 / 10.7.

## Checks

- `npx tsc --noEmit -p .`: clean.
- `npx next lint --dir "app/(site)" --dir scripts`: no warnings or errors.
- `npm run check:site`: ok (1 h1 per route, 24 handles and 11 names checked).
- `node scripts/hero-poster.cjs --check`: ok.
- `regress.cjs --gl --card`: all checks pass.

## Open (for the lead and Mostafa)

1. **The contract base module.** Move `PHONE_MQ`, `POSTER_FADE_MS`, `STAGE_ATTR`, `MAX_REMOUNTS`, `POSTER_BOX`, `POSTER` and the poster source helpers into `sky/eclipse-base.ts`, and re-export them from `eclipse-api.ts`. `hero-poster.cjs` must then serve and allow `./eclipse-base.js`, require it in its CommonJS loader, and hash it in `rendererHash`. After that, delete EclipsePoster's copies.
2. **The card's punchline.** At 340 px, "Whether HeyMoon can guarantee sales" shows as "…guar…". There are two options: `CARD.widthPx` 400 (the card then starts at 880 at 1440, still clear of the copy column at every split size), or showing the landed line without the agent name. Either way it is Mostafa's call.
3. **The promo launcher at 1024 to 1280.** It sits 6 to 10 px under the card's end edge. They do not overlap, but it is tight.
4. **Glints on the bright half of the rim** read +8 to +12 L* over the rim at waiting. Accepted for now; if Mostafa wants them stronger, raise the waiting level on the bead's side only.
5. **Short landscape phones** (844x390): the field is 15 px under the fold, as since HEAD (the hero scrolls there).

## Fixes (after the verification round)

5 Oct 2026, the fixer. This section answers the ten issues from the verification round. Nothing is committed. Every
capture and script named here is in `$SP/w2c-fix/`. The switch is untouched: `setAud`, `SWITCH`, the switch clock,
the rim, the bead and the corona are byte-for-byte as before. The tumble and the eclipse animation were re-proven
after every renderer edit (see "The switch, re-proven").

### What changed

| File | Change | Issue |
|---|---|---|
| `hero/hero.module.css` | Phone block: `padding-top` is now `nav + 20px` (it was `+ 4px`). | 1 |
| `sky/eclipse-api.ts` | `CARD.widthPx` is 408 and `CARD_CSS.width` is `min(408px, 42vw, 560px)` (both were 340). | 2 |
| `sky/eclipse.ts` | **Glint rim lift.** Each glint's core level is lifted toward 1 by `m = min(.65, 8 · pow(side, 5))`, so `v' = v + (1 − v) · m`. `side` is measured from the audience's *resting* bead and crossfaded by the tint. The order of the levels is kept, working is unchanged, and the moving bead never flares a glint. | 4 |
| `sky/eclipse.ts` + `WATCHDOG` | **Watchdog.** A capped window is now only a suspicion. The watchdog sheds one step (dpr 1, else the next ladder step) and judges one more window. It locks only if that window is still capped and its mean rose by at most `capRiseFps` (3). The give-up sits outside the lock, so only a forced `setTier()` turns it off. The mean now leaves out the window's 2 longest frames (`trimFrames`) and any frame over max(4 × median, `stallMs` 250). | 6 |
| `sky/eclipse.ts` | **Atlas.** `atlasFor()` runs only on brands, on a switch to brands, or on creators in `requestIdleCallback` after `load` (2 s timeout). `RINGS.look` moved into the shader (`look()` on each atlas sample): no `getImageData`, no per-pixel loop, and the canvas is uploaded as it is. | 7 |
| `sky/eclipse-api.ts` | `POSTER_CAPS[2240].avif` is back to 26 kB. `POSTER_CAPS[960]` is now 15 kB AVIF and 36 kB WebP (it was 12 and 28). | 8, 9 |
| `scripts/hero-poster.cjs` | p99 ≤ 6 on every row (`p99Narrow` and `p99Limit` deleted). The harness page loads with `?sky=gl`. | 9, 10 |
| `sky/eclipse.ts` | **Software GL is refused.** `failIfMajorPerformanceCaveat` is set, and a renderer whose name matches swiftshader, llvmpipe or software gets `onFail("nogl")` and the poster. Capture, debug (`?skydebug`, the dev server), `?sky=gl` and `?sky=soft` keep it. | 10 |
| `public/hero/poster-*`, `poster.json` | Re-rendered three times; the last run's `rendererHash` is `478ce63…`. The glint lift changes the resting frame (idle glints near the bead are a little brighter); the other edits leave the frames as they were. | 4, 8, 9 |

### Results per issue

**1. Phone: the switch is glued to the nav. FIXED.** At every phone size and on both audiences, the nav pill ends at
64 and the hero switch starts at 84, a 20 px gap (`navgap.cjs`; close-up `ph-top-390.png`, full page
`ph-390-brands.png`). A-C3, from `regress.cjs` at the five heights (`regress-phones.json`):

| Size | Field bottom (was) | Sheet top | Star S (was) |
|---|---|---|---|
| 390x844 | 359.8 (344) | 804 | 240 (240) |
| 360x740 | 350.3 (334) | 700 | 187.6 (200) |
| 390x660 | 359.8 (344) | 620 | 120 |
| 360x660 | 350.3 | 620 | 124 |
| 375x548 | 355.1 (339) | 548 | 120 |

- At 375x548 regress also reports FOLD "sheet top 548 > innerHeight − 40". This is not caused by the padding change. `Lift.tsx` (shell, not touched) gives phones a 40 px peek only from 601 px tall, so this height has no peek. The field still ends 193 px above the fold.
- Item 6 at 360x740 and 390x844 (`ho-cast.cjs`, sheets `ho/*/sheet.png`):
  - SwiftShader: glass in every frame from the first paint. Flip −1f → +400 ms dE76 is ≤ 0.41 in the 2 S box.
  - Real GPU at 360x740: ≤ 1.09, which includes the sway easing in (`ho/brands-360x740-gpu/sheet.png`).
  - No jump and no flat star. The background is (1, 3, 23) in every frame.

**2. The card cuts "guarantee". FIXED (408, not 400).** In the card's own fonts, "Whether HeyMoon can guarantee sales"
beside MOONSCORE AI needs 397 px (`cardw.cjs`). At 400 that leaves 3 px, too little for other platforms' text
rasterisation, so the width is 408.
- Under reduced motion the landed line is uncut at 1024, 1280, 1306, 1440 and 1920 (scrollWidth equals clientWidth; `cardrm.cjs`, `rm-1440-card.png`).
- The card starts right of the copy column everywhere: at 1024 it starts at 592 and the column ends at 529; at 1440, 872 against 662.
- Contrast over the GL render (real GPU): name 12.5:1, note 15.1:1 or better at 1440, 1306 and 1024.
- Working notes still end in an ellipsis where they are long, as the sketch has them.
- regress `--card` on the real GPU passes CARD at every split size: 1112..1520 at 1920, 872..1280 at 1440, 805..1213 at 1306, 742..1150 at 1180, 592..1000 at 1024.
- W2c-4 in HERO-V2 still says 340 × 44. The lead should update it, or ask Mostafa to choose the other option (no agent name on the landed line).

**3. Creators phone order changed. REJECTED (needs Mostafa).** The current order is the lead's ruling W2c-6
(HERO-V2.md:108). Item 3 and the field-y parity rule need one layout, and FIELDY passes at 390 and 360 (field top
295.8 and 286.3 on both audiences). A fixer cannot give Mostafa's sign-off. The fallback (the star on top with
`(CLUSTER_R − 0.5)·s + 8` px reserved, on both audiences for parity) is still one CSS block and is listed under Open.

**4. Waiting glints near the bright rim. FIXED, except where the target is out of reach.** A-A7 at 2x on the real
GPU, with the rim taken from the brighter of ±6° (`a7.cjs` + `a7.py`; `a7-*` before, `a7b-*` after):

| Glint (waiting) | Before | After |
|---|---|---|
| brands, all six that wait | worst +12.7 (MoonLearning) | worst **+16.3**; 0 of 28 below +15 |
| creators MoonSearch / MoonScore | +13.7 / +13.8 | **+17.1 / +16.8** |
| creators MoonLive / MoonWriter | +6.8 / +7.1 | **+9.9 / +9.5** (peak L* 95.9 / 97.0) |
| working (both) | ≥ 98.8 | ≥ 98.4 |

- On creators the rim beside MoonLive and MoonWriter is itself L* 86.0 and 87.5, so +15 would need a peak above L* 100.
- Only dimming the rim could close that gap, and the rim is locked with the switch. Those two glints are now near white instead of +7.

**5. "The live site lost the switch" was a capture effect. No code change (note added).** All switch proofs below use
the real GPU (ANGLE Metal, M1 Pro). The dev routes were warmed with one switch first (`warm.cjs`).
- SwiftShader composites the page about 2 s behind the main thread, so page screenshots there are not a valid switch test.
- Use `?skyslow` with in-draw `toDataURL` grabs, or a real-GPU screencast.
- With issue 10's fix, a production build on SwiftShader shows the poster crossfade unless `?skydebug` or `?sky=gl` is set.

**6. Watchdog lock and give-up. FIXED.** All runs below are in `$SP/w2c-fix/`.

| Run | Result |
|---|---|
| A-P5, SwiftShader 1440x900 (`wd-1440.txt`) | high → mid → low@1 → low@.75, then "gave up at tier=low dpr=0.75 (12.4 fps)". After it: `data-gl="off"`, the canvas removed, the poster at 1 and visible, no console errors. |
| A-P5, SwiftShader 390x844 (`wd-390.txt`) | high → mid → low@1. Then "capped?" (median 33.3) → low@.75 → "not capped (36.0 → 60.0 fps): the ladder goes on". It then holds at 54 to 60 fps. That is above `giveUpFps` 40 at the last step, so it keeps running by design and never locks. Before the fix it locked at low@1 and never stepped again. |
| Real GPU at 60 Hz (`wd-gpu-*.txt`) | 1440: high@1.5. 390: mid@1.25. Every window "keep". |
| A 30 Hz display, emulated with rAF on every 2nd vsync (`wd-cap30-*.txt`) | "capped?" → dpr 1 → "capped … locked (mean 30.0 → 30.0 fps)" at 1440 (high@1) and 390 (mid@1), with no give-up. |
| A switch at frame rate (`sw/rt-*`) | The tier holds (high → high at 1440, mid → mid at 390). Before the trim, the switch's two dev-mode frames of 70 to 85 ms stepped 1440 from high to mid at +845 ms. |

Also found while verifying: every 2x page screenshot stalls the page about 1 s. Before the stall rule, 5 screenshots
walked an M1 down to the give-up (`a7.cjs`, first runs).

**7. Atlas on creators. FIXED.** Measured on the production build (3005), real GPU, with `atlas2.cjs`, `load2.cjs` and
`early.cjs` (`atlas-after.txt`, `load-after.txt`, `early.txt`).

| | Before (the issue) | After |
|---|---|---|
| /creators: faces requested | before `load` | after `load`: 450 ms against load 263 (CPU x1); 3620 to 3752 ms against load 3125 to 3236 (1.6 Mbps, CPU x4) |
| /creators: window `load`, 1.6 Mbps, CPU x4 | 4718 to 4774 ms (SwiftShader) | 3125 to 3236 ms (real GPU) |
| /creators: the other poster | requested 0.4 to 1.7 s after `load` | requested at `load` (3160, 3273), before the faces |
| Atlas build | `getImageData` 8 ms + loop 45 ms (x1); 34 + 183 ms inside a 303 ms task (x4) | no `getImageData` and no loop. Upload 4 to 6 ms (x1), 17 to 18 ms (x4). No long task of 50 ms or more contains it at x4, on brands (at 713 ms) or creators (at 986 ms). |
| /brands: window `load`, 1.6 Mbps, CPU x4 | 3474 to 3519 ms | 3338 to 3388 ms |

- The look did not change. In the rings' bands the brands 2240 poster's mean level is 79.1 → 79.0 (inner) and 33.9 → 33.9 (outer).
- A switch to brands made at GL start or after the idle build fades the rings in with the switch: presence 0.16 to 0.24 at the first sample, 1 by about 1.2 s.
- An intermediate step (the loop inlined with a lookup table) only halved the loop to 22 ms (x1) and 104 ms (x4). That is why the look moved into the shader.

**8. Poster AVIF cap and LCP. FIXED.**
- The 2240 AVIFs are brands 26,081 B (q53) and creators 26,000 B (q56); they were 27,617 and 27,253.
- LCP, measured with `lcp3.cjs` on the production build (3005), real GPU, cache off, CPU x4, one warm-up, 5 runs each (`lcp-after.txt`):

| Size | Profile | brands LCP (median, max) | creators LCP (median, max) | Element |
|---|---|---|---|---|
| 1440x900 | 9 Mbps / 60 ms | 544, 558 | 608, 609 | poster |
| 1440x900 | 1.6 Mbps / 150 ms | 1341, 1374 | 1333, 1342 | poster |
| 390x844 | 9 Mbps / 60 ms | 508, 536 | 575, 597 | H1 |
| 390x844 | 1.6 Mbps / 150 ms | 799, 837 | 780, 856 | H1 |

- An A/B against the HEAD build, alternating, real GPU, 1440 brands at the slow profile, 8 runs each (`lcp-ab-1440.txt`): HEAD median 1314 (max 1327), tree 1366 (max 1454). The gap was +110 ms; it is now +52 ms.
- Every run is under 1.8 s.
- Observation, not new: at 1440 on the slow profile the FCP-to-LCP gap is about 520 ms. A-P2 wants it ≤ 350 ms, but HEAD shows the same gap (808 → 1320).

**9. Phone poster p99. FIXED (6 restored, caps raised).** Trial encodes at the phone band:
- 13 / 34 kB still gave p99 6.05 (brands phone, DPR 1, AVIF).
- 16 / 38 kB gave a maximum of 5.65.
- 15 / 36 kB also gave a maximum of 5.65, so it is the cap (`phone-trial-*.txt`).

The final `--check` (`poster-check3.txt`) passes all 24 rows at p99 ≤ 6; the maximum is 5.85 (creators phone DPR 1
WebP). The phone files are 15,208 / 15,157 B AVIF and 36,428 / 35,506 B WebP. That is +3 kB AVIF and +8 kB WebP over
the integration, and over §9's 10 / 16 kB, which wave 2 already exceeded at 12 / 28. On phones the LCP is the H1
(table above). If the lead prefers the bytes, the alternative is a recorded ruling for 6.5.

**10. Software renderers. FIXED.** On the production build with SwiftShader (`soft.cjs`, `soft2.txt`):
- Without parameters: `data-gl="off"`, the poster at 1, no console errors.
- `?skydebug` and `?sky=gl`: GL on.
- The card runs at the real pace in a warm context: the opener at 2403 ms, the next note at 3296 to 3311 ms. That is the same as `?sky=css` (3299 ms), against about 7.5 s before.
- The first context of a cold SwiftShader browser is slower on every route, `?sky=css` included (2.2 s to 3.6 s).
- The dev server keeps software GL (debug), so `regress.cjs` and the A-P5 runs still work there.

### The switch, re-proven (after the last renderer edit)

- **Slowed, frame by frame.** RENDERER's probe on the real GPU (`sp-gpu.cjs`, `?skydebug&skyslow=10`, `toDataURL` inside the draw's task every 60 ms of switch time plus the edge-on frame), checked by `swcheck.cjs` (`sw/slow-*/check.txt`).
  - In all four runs, 1440x900 and 390x844, brands → creators and back: 1222 to 1226 frames each and **0 mismatches** against `switchAt`. The worst differences are flip 0.004 rad, soft 0.002, tint 0.002 and bead 0.003 rad.
  - Edge-on: facing 0.000 to 0.003 at switch ms 238.
  - The bead moves −π (0.8 → −2.342 → −5.483). Soft and tint are monotonic. Facing recovers to ≥ 0.95. The rings go 1 → 0 and 0 → 1.
  - The strip is `sw/switch-strips.png`: 8 frames per run at 0, 120, 200 ms, edge-on, 400, 600, 900 and 1900 ms. The tilted slab becomes an edge-on liquid sliver with the flash, then lands face-on in the other material. The bead swings half the rim with its trail, and the corona warms violet → pink and back.
- **At frame rate.** A CDP screencast of the composited page on the real GPU at DPR 2, with a per-rAF `__sky` log (`swcast.cjs --gpu`, `sw/rt-*`, sheet `sw/rt-sheet.png`):

| Run | Facing at switch ms 100 / 200 / 300 / 400 / 500 / 700 / 900 | Min facing | Tier |
|---|---|---|---|
| b2c 1440 | .665 / .177 / .267 / .588 / .788 / .951 / .977 | .018 | high → high |
| c2b 1440 | .666 / .185 / .254 / .572 / .773 / .939 / .970 | .027 | high → high |
| b2c 390 | .585 / .013 (229) / .378 / .685 / .864 / .985 / .985 | .013 | mid → mid |
| c2b 390 | .658 / .163 / .286 / .607 / .803 / .956 / .975 | .002 | mid → mid |

- In every capture the H1 swaps, and the page lands on the other audience: `/creators`, "Your posts already sell. Take a cut of it.", or `/brands`, "A campaign in fifteen seconds. Sales, guaranteed.".
- There are no console errors.
- The only frames over 25 ms are the click's two dev-mode React frames (68 to 92 ms).

### Checks (final tree)

- `npx tsc --noEmit -p .`: clean.
- `npx next lint --dir "app/(site)" --dir scripts`: no warnings or errors.
- `npm run check:site`: ok.
- `node scripts/hero-poster.cjs --check`: ok, with `rendererHash 478ce63…`, all 24 parity rows at p99 ≤ 5.85, and A-F2 on all four posters.
- `npm run measure`: ok.
  - First load is 158.1 kB on both routes.
  - CSS is 25.5 kB and the lazy site chunks are 81.6 kB.
  - The renderer chunk is **11.1 kB** (≤ 12; it was 10.7).
- `regress.cjs --gl --card` on the real GPU, at the nine sizes on both audiences: **all checks pass**, with only the contract-allowed note at 1306x800.
  - On SwiftShader, CARD at 1440x900 brands failed 1 run in 3 (`regress-gl.txt`). There, the init tier's compile stalls the main thread around the card's 2.4 s fade-in (the card sat at opacity 0 from 2.1 to 3.6 s in `cardt.cjs`). It is a SwiftShader timing effect; production now refuses SwiftShader.
- The 3005 and 3006 servers I started are stopped. :3004 was never restarted.
- The LCP, atlas, load and software-GL probes ran on the build before the last watchdog-only edit (the trim). That edit changes neither the network nor the first paint.

### Open (added)

6. **Creators phone order** (issue 3): Mostafa's call. The W2c-6 fallback is ready as one CSS block.
7. **The card's width** is 408 (issue 2). W2c-4 in HERO-V2 still says 340.
8. **MoonLive and MoonWriter on creators** read +9.5 to +9.9 L* over a rim that is itself L* 86 to 87.5. A-A7's +15 needs a dimmer rim there, and the rim is locked.
9. **Phone poster bytes** (issue 9): 15 / 36 kB for p99 ≤ 6, or the lead records 6.5 and goes back to 12 / 28.
