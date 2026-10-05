# Eclipse wave 2: RENDERER notes

5 Oct 2026. HERO-V2 "Wave 2 plan" (W2c-1 to W2c-9): the switch proof (A-W1) and its clock cap, item 1's glints,
`setAgents`, the comet, item 2's focus, item 5's tiers and watchdog, item 9's creator rings, the debug state, and the
posters. Built on HEAD's `sky/eclipse.ts` (99fd094 plus the `onFail` reason). Nothing committed; the lead commits.
`$SP` = `/private/tmp/claude-501/-Users-mostafaaelnagar-Documents-moontech/d50da6c8-1e72-439f-9d55-d7ba5aef42c4/scratchpad`;
every capture and script named here is in `$SP/w2c-renderer/` (my copies of the architect's tools: `sp.cjs` from
`switch-probe.cjs`, `harness-tree.cjs` from `harness.cjs`, plus `rh.cjs`, `st.cjs`, `p5.cjs`, `a7.py`, `swcheck.cjs`,
`exp-poster.cjs`).

## Files

| File | Change |
|---|---|
| `app/(site)/_site/sky/eclipse.ts` | Rebuilt on HEAD (below). |
| `scripts/hero-poster.cjs` | Caps from `POSTER_CAPS`, `tier: POSTER_TIER[band]`, the asynchronous `onFrame`, the encoder (AVIF 4:4:4, bisection), the held-frame check rewritten, the A-F1 centroid low-passed (see "Posters"). |
| `public/hero/poster-{brands,creators}-{960,2240}.{avif,webp}` | Re-rendered: brands with the rings and the seven idle glints, creators with the glints and no rings. |
| `public/hero/poster.json` | New (it was never written before). |
| `scripts/measure.cjs` | Only `sky: 8 * KB` → `sky: 12 * KB`. |
| `docs/redesign/wp/ECLIPSE-W2-RENDERER.md` | This file. |

## What the renderer is now

**Kept from HEAD verbatim:** the material (`star2` with its branch, `map`'s `rb .2→.46` and `h .16→.26` + dome,
`glass()`, the body colours, `ex()`'s TIR fallback, `IOR 1.5`), the corona, rim, bead, trail and comet terms, the
studio, the composite and the dither, and **the switch** (`setAud`: flip +π about the diagonal composed as
`mul(rotAxis(D, D, 0, V.flip), Rm)` over 1.7 s ease-out-quart; soft 1.0 s after 80 ms ease-in-out-cubic; aud 1.2 s
ease-out-cubic; bead −π over 1.8 s ease-out-quart from `BEAD_REST_RAD`; the flash `sin²(π (t/1.1)^0.7)`; the jump path
with one redraw). Their numbers now come from `SWITCH`; the values are HEAD's.

**Ported from the stash (`stash@{0}`), and only these:** the per-tier programs (`fsFor()` with `IOR_N`, `MARCH`,
`INNER`, `BOUNCES`, `STUDIO`, `OCT`, `CHEAP_BEVEL`, plus `RINGS_IN_GLASS`; `build`/`done`/`linked`/`use`/`swap` with no
blocking status read; REST at `POSTER_TIER[band]`, the init tier swapped in after `release()`); the watchdog (skip,
windows, capped lock at DPR 1, step, give-up → `onFail("gaveup")`, software renderers step only under `?sky=soft`, the
`[sky]` lines under `?skydebug`); `onTier`/`report`; `SKY_DEBUG`; the layout-box `measure()` (works with STAGE's 2 S
canvas and with a full-hero canvas); `glt()` with the working-only spikes; the `setAgents` easing; the launch comet.
Not ported: the switch rewrite, every material change, the cut wedge, the lobe, the label mask, the notch.

**Added:**
- *Switch clock* (W2c-1): flip, soft, aud, bead and the flash run on a per-switch clock that advances by
  `min(frame delta, SWITCH_FRAME_CAP_MS)` per drawn frame (wall ms; identical to wall time at 10 fps and above). Spin and
  the launch keep wall time. `?skyslow=N` (only under `?skydebug` or the dev server) multiplies every switch duration
  and delay, `LAUNCH.spinMs`, `LAUNCH.allLitMs` and `COMET_MS` by N; `__sky.switchMs` is the switch clock divided by N,
  so a row compares with `switchAt(switchMs)`.
- *Glints* (item 1): seven at `GLINT_DEG`, fixed on the rim, drawn after the glass in CSS px: a 2 px white core, a 5 px
  tint halo, and on the working index only four 0.035 S spikes with a 1.2 Hz shimmer. HEAD's six bead-relative glints,
  `V.glints`, `V.glT` and the typed counter are gone; `pulse()` keeps the ripple, the radius reset and the bead kick.
  Every literal goes through `fl()`, which parenthesises negatives (`(-0.349066)`).
- *`setAgents`*: targets stored; each frame `lv += (target − lv)(1 − e^(−8 dt))`; a stopped (not held) loop applies them
  at once with one redraw; while held they wait for `release()`. REST and every poster use `REST_AGENTS`.
- *Launch*: HEAD's spin; all seven at 1 for `LAUNCH.allLitMs` (set at once, so `__sky.levels` is all 1 at t = 0); the
  comet once round the ring from the bead, clockwise, over `COMET_MS` ease-out-cubic (HEAD's 1.9 s linear sweep is gone).
- *Focus* (item 2): `FOCUS` exactly (yaw0/pitch0 × (1 − f), sway × (1 − 0.85 f), pointer × (1 − 0.7 f) × swayIn, roll
  × (1 − 0.85 f), rate 3, energy + 0.5 f as HEAD). No lobe, no spill; `setFieldRect` is not implemented.
- *The creator rings* (item 9, W2c-2): an atlas built in the chunk from `AVATARS` (new `Image()`, `decoding="async"`,
  `fetchpriority="low"`, one retry, never in the DOM), one cell per `RING_SLOTS` entry (mirrored, cropped by zoom and dy,
  `RINGS.look` per pixel through `getImageData`), uploaded as one RGBA texture (LINEAR, CLAMP, no mips, no flip, no
  premultiplication; a 1×1 black texture until then). In the shader, on the eclipse plane: the ring from the radius
  (the two rings never overlap radially), the slot from the angle minus drift and phase, a 1 CSS px anti-aliased circle,
  the cell sampled upright, light `−ln(1 − (α·fade·coverage·presence·c)^2.2)/1.15` added before the corona's light;
  nothing inside `RM` (the disc), replaced by the glass where the march hits it. `presence = ringsPresence(aud) ×
  atlasReady` (eased over 400 ms when the atlas lands while running; at once otherwise). Drift: `ringAngle` on the
  eased sway clock (0 at REST). Brands waits for program and atlas before REST and `onReady`; creators does not wait.
  A second avatar failure on brands before the first frame → `onFail("atlas")`; later, or on creators, no rings.
  Rebuilt when `atlasCell` changes by more than 1.5x. Capture waits for the atlas; `capture.rings === false` draws none.
- *Tiers* (item 5): `DPR_CAP` (1.5 / 1.25 / 1 on software), `uWorld` (the tint, `= V.aud`) is the measure marker.
- *Debug*: `window.__sky` written in `draw()` before `drawArrays` (the contract's fields plus `bead0`, the bead's
  angle when the switch started), and `window.__skyHandle`; both deleted on destroy.

## Deviations (each with its reason)

| # | Contract / brief | Shipped | Why |
|---|---|---|---|
| D1 | Rings "in env() too where ringsInGlass" | On high and mid the rings are sampled **once per glass pixel along the central refracted ray** (added to the dispersion sum before absorption), not in all eight `env()` calls | In every `env()` call the high tier dropped to 0.17 fps on SwiftShader (HEAD 3.3, 1440-class canvas, `rh.cjs perf`); once per pixel it is 2.4 to 2.6. The faces still refract through the star; only their dispersion fringes are lost, invisible at their opacity. |
| D2 | Glint core `1.6·(.25 + .75·lvl)` (the stash's `glt`) | `1.6·(.4 + .6·lvl)`: the same at working (1.6), brighter at waiting and idle | A-A7: at waiting the old core reached only +13.1 to +13.9 L* over the rim 6° away on MoonMatch and MoonLearning. See A-A7 for what remains. |
| D3 | A-F1 "bright-pixel centroid (L* > 60) within 0.5 CSS px" | Measured on L* low-passed by an 8 CSS px box on both images, weighted by L* − 60 | Raw, a lossless poster misses by 2.3 px (phone) and 4.6 px (desktop) at DPR 1 (`exp-poster.cjs`): 1x point samples and a resampled 2x file render thin bright lines differently. A box blur is shift-equivariant: low-passed, a lossless poster is within 0.28 px, and a deliberate 1 CSS px shift of the poster reads 0.97 to 1.25 px. HEAD failed the raw centroid as well (`check-before.txt`). |
| D4 | Poster encoder (AVIF 4:2:0 speed 4, WebP q steps of 5) | AVIF 4:4:4 speed 0, WebP alpha quality 30, highest quality under the cap by bisection | At the same bytes 4:4:4 halves the error on these frames (brands phone at 11.8 kB: mean ΔE 0.96 / p99 6.2 against 1.51 / 7.45); desktop 4:4:4 q50 is 22.4 kB with mean ΔE 0.83 against 4:2:0 q55's 24.8 kB and 1.41. |
| D5 | Held-frame check by screenshots at +0, +1, +10 rAF | Every draw read back in its own task (hash and centroid): no draw while held, held well inside the fallback, then the centroid over the first 300 ms of the released clock | Screenshots take 1 to 6 s on SwiftShader, so the 1.2 s fallback release always came first (HEAD: INCONCLUSIVE on all four). |
| D6 | `__sky.bead` | As specified (the bead's angle), plus `bead0` | A verifier needs the start angle to compare with `switchAt().bead` (radians added). |

## Evidence

### A-W1: the switch, frame by frame (the integration notes' frames)

The locked switch plays on the live page in both directions at both sizes. Every drawn frame records `__sky` (written
before `drawArrays`) and is checked against `switchAt(__sky.switchMs)` by `swcheck.cjs`; frames are grabbed with
`toDataURL` inside the draw's task, by animation time (every 60 ms of `switchMs`, and every 12 ms while facing < 0.15).
Command: `node sp.cjs --to <creators|brands> --q "?skydebug&skyslow=10" --everysw 60 --w <w> --h <h>` (the probe waits
until `switchMs` passes 1950 instead of a fixed `--ms`: with the 100 ms cap and `skyslow=10` a SwiftShader frame advances
at most 10 ms of animation, so a full slowed switch takes 100 to 140 s).

| Run | Contact sheet | Frames | Mismatches vs `switchAt` (worst) | Edge-on | Landing | Bead | Rings |
|---|---|---|---|---|---|---|---|
| brands → creators, 1440x900 | `sw-b2c-1440/sheet.png` | 236 (a dev-server Fast Refresh from another package remounted the renderer at 1718 ms; rows after it dropped) | 0 (flip 0.003 rad, soft/aud 0.001, bead 0.003 rad) | facing 0.005 at 240 ms; grabbed sliver 0.125 at 213 ms (f004) | facing 0.995, soft 1, aud 1 | 0.8 → −2.342 (−π) | 0.975 → 0 |
| creators → brands, 1440x900 | `sw-c2b-1440/sheet.png` | 262 | 0 (same) | 0.010 at 237 ms (f006, grabbed) | 0.996, soft 0, aud 0 | −2.342 → −5.483 (−π) | 0.025 → 1 |
| brands → creators, 390x844 | `sw-b2c-390/sheet.png` | 446 | 0 | 0.002 at 235 ms (f006, grabbed) | 0.952 (sway), soft 1, aud 1 | 0.8 → −2.342 | 0.975 → 0 |
| creators → brands, 390x844 | `sw-c2b-390/sheet.png` | 408 | 0 | 0.013 at 237 ms (sheet tiles 5121 and 5255 ms at 0.03) | 0.956, soft 0, aud 0 | −2.342 → −5.483 | 0 → 1 |

Soft, aud and the bead move monotonically in every run; facing recovers to ≥ 0.95 after the dip in every run. The
sheets read like `sculpture/sw-grid.png`: the slab tilts, passes edge-on as a thin liquid sliver with the dispersion
flash, and lands face-on as the other material (pink liquid on creators, the bevelled violet slab on brands); the bead
swings clockwise half the rim (upper end → lower start on the way to creators, round over the top on the way back)
with its trail; the corona and core warm violet → pink and cool back; the rings fade out with the warming and back in.

Frame-rate runs (`skyslow` 1, `--grab 0`, so nothing stalls; SwiftShader at about 2.5 to 3 fps at 1440):

| Run | Rows (switchMs: facing) | Check |
|---|---|---|
| `g0-b2c-1440` | 100: 0.684 · 133: 0.532 · **233: 0.047** · 333: 0.363 · 433: 0.649 · 533: 0.822 · 633: 0.915 · 733: 0.959 · 833: 0.976 · 1033: 0.979 | 0 mismatches; each frame advanced ≤ 100 ms of animation (the cap), so the tumble shows at frame rate even at 300 to 1300 ms per frame |
| `g0-c2b-1440` | 39: 0.901 · 139: 0.503 · **239: 0.019** · 339: 0.384 · 439: 0.662 · 539: 0.830 · 639: 0.919 · 739: 0.960 · 839: 0.976 | 0 mismatches |

Baseline before my first edit (HEAD on :3004, `base-b2c/`, `base-c2b/`, wall-time tweens): b2c facing 0.972 → 0.014
(265 ms) → 0.810 (545) → 0.973 (824); c2b 0.972 → 0.213 (218) → 0.715 (485) → 0.966 (780). Under load one HEAD frame
jumped from −78 ms straight to 639 ms (facing 0.90): that is the skip the cap now prevents.

Renderer only (no React): `node harness-tree.cjs --dir tree --to creators` (the architect's harness with a 2 S canvas
box and the avatars served): `harness-tree-b2c/`, facing 0.684 → 0.206 → 0.240 → 0.567 → … → 0.979, A.x and A.y 0 → 1.

### A-A7: glint visibility (2x live frames, `a7.py`; SwiftShader patched to DPR 2 in `rh.cjs --hard`)

Peak L* within 2 CSS px of `glintPoint()`, against the rim's peak L* at the same radius 6° to each side.

| Glint | brands, waiting (`a7-w5.png`) | rim −6° / +6° | Δ (mean side / brighter side) | creators, waiting (`a7-cr-w5.png`) | rim | Δ |
|---|---|---|---|---|---|---|
| MoonShot −20° | 92.7 | 77.7 / 85.0 | **+11.4 / +7.7** | 88.5 | 65.0 / 64.6 | +23.7 / +23.5 |
| MoonMatch −37° | 90.2 | 68.2 / 73.1 | +19.5 / +17.1 | 88.6 | 66.9 / 63.9 | +23.2 / +21.7 |
| MoonSearch −54° | 89.2 | 65.1 / 68.2 | +22.6 / +21.0 | 91.3 | 76.5 / 71.3 | +17.4 / **+14.8** |
| MoonWriter −71° | 88.7 | 63.1 / 67.3 | +23.5 / +21.4 | 94.4 | 85.3 / 82.2 | **+10.7 / +9.1** |
| MoonLive 160° | 88.8 | 66.3 / 65.4 | +23.0 / +22.5 | 93.4 | 79.7 / 85.8 | **+10.7 / +7.6** |
| MoonScore 143° | working 99.1 | 70.9 / 67.7 | +29.8 | working 99.2 | 72.1 / 77.4 | +24.4 |
| MoonLearning 126° | 91.4 | 75.9 / 70.4 | +18.2 / +15.4 | 89.5 | 64.9 / 68.1 | +23.0 / +21.3 |

Working: 99.4 (MoonShot, `a7-w0.png`) and 99.1 to 99.2 (MoonScore) ≥ 85. The bead's peak is 100.0 on both audiences,
so a working glint (99.4 max) is never brighter. **Open (A-A7):** the glints 63 to 66° from the bead sit on HEAD's
bright half of the rim (L* 80 to 86 there; HEAD's rim term `(.22 + 1.7·side^5)`), so at waiting they clear only +8 to
+12: MoonShot on brands, MoonWriter and MoonLive on creators. +15 there needs L* 95 to 100 at waiting, the working
level. I did not dim HEAD's rim (no notch: the stash's notch dims the rim under the glint and lowers its peak, which
does not help this metric). Lead's call: accept, or let the bright side's glints carry a higher waiting level.
At REST (idle 0.42, the posters): +12.6 / +9.4 on MoonShot, +18.9 to +26 elsewhere (`a7-rest.png`).

### A-R: the rings

- Behind the disc and the star: nothing is drawn inside `RM`, the glass replaces them where the march hits
  (`rest-brands-560-2x.png`, `crop-glints-lr.png`: the disc cuts the inner circles, the tips cross in front).
- Absent on creators (`page-creators-1440.png`, the creators posters); fading with the switch (the `rings` column of
  every A-W1 run: 0.975 → 0 to creators, 0 → 1 back, equal to `ringsPresence(aud)` each frame).
- Faces only from `public/hero/creators/c01-c10.webp`; neighbours never repeat and every second use is mirrored or
  cropped (`RING_SLOTS`, used as is). No face `<img>` in the DOM (`st-brands-390.txt`: 0; the ten fetches are
  `new Image()`, initiator "img", never attached).
- Drift: 0 at REST (`__sky.rings` = [1, 0, 0] while held), [1, 5.005, −3.754] → [1, 5.685, −4.264] over 2 s running,
  frozen under the nav pause and in a hidden tab, running again on return (`st-brands-390.txt`).
- Quiet: the brightest pixel the rings change at 1440x900 (S 537, `rh.cjs ringsdiff`) is L* 74.0, under the field's and
  the H1's white (about 99). Against the 2D target (`$SP/w2b-arch/preview-brands-quiet.png`) the faces read a little
  darker: mean L* per circle 30.2 inner / 9.9 outer against 35.3 / 13.3. That is the contract's formula: the face's
  light is added before the corona's and tone-mapped with it (a screen in linear light), where the preview screened
  in sRGB on top of the finished frame. I kept the formula; raising `RINGS.inner.alpha` to about 0.42 would match the
  preview if the lead wants it.

### A-W2, focus, A-G2, A-G3, A-P5 (live page, `st.cjs`, `p5.cjs`)

| Check | Result |
|---|---|
| A-W2 `__skyHandle.launch()` | levels [1,1,1,1,1,1,1] at t = 0; comet 0.087 (13 ms), 0.668 (96), 0.929 (180), 0.985 (240), **1 at 315 ms**; after `allLitMs` the levels ease back to the agent clock |
| Focus | `setFocus(true)`: facing 0.989 → 0.995 (463 ms) → **0.999 at 937 ms**; after blur 0.992 (the sway) |
| A-G2 | nav pause: `running` false, drift frozen; resumed true. Hidden tab: false, frozen; visible: true |
| A-G3 | `WEBGL_lose_context.loseContext()`: `data-gl="off"` and the canvas `data-on="false"` within 2 rAF; STAGE remounted, `data-gl="on"` again after 8 s; **no console errors** |
| A-P5 `?sky=soft&skydebug&tier=high`, 1440x900 | `start tier=high dpr=1.00 webgl2` → `step tier=mid dpr=1.00 (2.0 fps)` → `step tier=low dpr=1.00 (2.7 fps)` → `step tier=low dpr=0.75 (4.1 fps)` → `gave up at tier=low dpr=0.75 (7.8 fps)`; then `data-gl="off"`, the canvas removed, `__sky` deleted, no console errors (`p5-1440.txt`) |
| Every tier links | `rh.cjs links`: high, mid and low × brands and creators on WebGL2 and on WebGL1 (getContext("webgl2") refused): 12 of 12 ready, onTier reported, no console errors |
| Frame cost (SwiftShader, S 560, `rh.cjs perf`) | HEAD high 3.3 / 2.0 fps (brands / creators); tree high 2.4 / 2.6, mid 2.6 / 3.1, low 4.9 / 4.5 |

### Posters (A-F1, A-F2)

`node scripts/hero-poster.cjs` (`poster-gen2.txt`), then `--check` (`check-after3.txt`). Renders read: brands with
the rings and the seven idle glints, creators with the glints and no rings, both bands (`posters-desktop.png`,
`posters-phone.png`).

| File | Before (bytes) | Now (bytes, quality) | Cap |
|---|---|---|---|
| poster-brands-960.avif | 10116 | 12287 (q57, 4:4:4) | 12288 |
| poster-brands-960.webp | 21032 | 28296 (q87) | 28672 |
| poster-creators-960.avif | 10030 | 11810 (q59) | 12288 |
| poster-creators-960.webp | 21436 | 28244 (q88) | 28672 |
| poster-brands-2240.avif | 24980 | 27617 (q54) | 28672 |
| poster-brands-2240.webp | 71800 | 94466 (q89) | 98304 |
| poster-creators-2240.avif | 24981 | 27253 (q57) | 28672 |
| poster-creators-2240.webp | 73000 | 92698 (q90) | 98304 |

`public/hero/poster.json`: rendererHash `50a44e87da29b6e2ab7fb463573042a5390abed4` (sha1 of `eclipse.ts` +
`eclipse-api.ts`). **Integration:** when the lead deletes the obsolete members from `eclipse-api.ts`, the hash changes
and `--check` fails on it until `node scripts/hero-poster.cjs` runs again (the frames themselves will not change).

`--check` now: the hash, all eight files, `outside` 0 bad pixels everywhere, **mean ΔE 0.76 to 0.97 on all 24 rows**
(HEAD 0.93 to 1.55), **the low-passed centroid 0.009 to 0.31 px on all 24**, **A-F2 ok on all four** (no draw while
held, 154 to 175 ms held, centroid moves 0.034 to 0.149 px over the first 300 ms after release). All 12 desktop rows
pass every limit. **Still FAIL, p99 > 6, phone band below DPR 2 only:** brands AVIF DPR 1 6.05; brands WebP 6.30 (1)
/ 6.10 (1.5); creators WebP 6.50 (1) / 6.15 (1.5). At DPR 2 (real phones) every phone row passes (p99 4.75 to 5.40).
These files sit at their caps; a lossless PNG poster already gives p99 4.20 at DPR 1 (resampling alone), so the codec
has 1.8 to play with. Measured (`exp-poster.cjs`): the phone AVIF reaches 5.90 at DPR 1 at 13.8 kB (q60 4:4:4); WebP
reaches 6.20 at 29.9 kB (q88) and about 5.9 near 33 kB. **Request to the lead:** raise `POSTER_CAPS[960]` to AVIF 14 kB
and WebP 34 kB, or accept p99 ≤ 6.5 on the phone band below DPR 2 (only narrow desktop windows use it there).

Note for A-P2 (STAGE's LCP): the desktop AVIF on the critical path grew from 24.4 to 27.0 kB (the rings' detail, inside
the 28 kB cap).

### Measure

| | Before my first edit (`measure-before.txt`) | After (`measure-after.txt`) |
|---|---|---|
| First load /brands, /creators | 158.0 kB | 158.1 kB (+0.1 for all three packages together. Note: the contract module sits in the shared first-load chunk `6205`, so every export the lazy renderer or Agents imports is shipped there too; small today, but worth a split of the renderer-only constants if it grows) |
| Renderer chunk (`8814.*`, found by `uWorld`) | 6.8 kB gz (6,985 bytes), counted under lazy site chunks (no marker) | **10.7 kB gz** (10,823 bytes), on the `sky` line, ≤ 12 kB |
| Old sky chunk (`5604.*`, `Sky.tsx` for the close) | 5.7 kB | 5.7 kB |
| Lazy site chunks | 79.6 of 110 kB | 81.7 of 110 kB |
| Result | ok (sky ≤ 8) | **measure ok** (sky ≤ 12) |

Tier programs: high (IOR 5, march 72/36, 2 bounces, full bevel, 4 studio boxes, 2 octaves, rings in glass), mid
(3, 48/24, 2, full, 4, 2, rings in glass), low (1, 40/16, 1, cheap bevel, 2 boxes, 1 octave, no rings in glass).

`npx tsc --noEmit -p .`: clean. `npx next lint --dir "app/(site)" --dir scripts`: clean. `npm run check:site`: ok.

### `regress.cjs --gl` (after my work; `regress-gl.txt`)

`FAIL (2)`: `FIELDY 900x800: brands 470.3 vs creators 471.6` and `FIELDY 360x740: brands 271 vs creators 270.3`
(STAGE's layout). Notes: `CARD … 0 visible [data-agent-card]` at the five split sizes (AGENTS', enforced only with
`--card`). Nothing in it is the renderer's: NAVBOX, COLEND, H1x3, STAR, CLUSTER, FOLD and HSCROLL pass.

## Open questions for the lead

1. A-A7 on the bright half of the rim (MoonShot on brands, MoonWriter and MoonLive on creators: +8 to +12 at
   waiting). Accept, or raise the waiting level for the glints on the bead's side?
2. The phone poster caps against A-F1 p99 below DPR 2 (above).
3. The A-F1 centroid is low-passed by 16 CSS px (D3). If the lead wants the raw version back, HEAD's own posters fail
   it too (2 to 6 px at DPR 1 and 1.5).
4. The faces read about 15% darker than the 2D preview (A-R). Keep the contract's 0.36 / 0.24, or raise the inner
   alpha to about 0.42?
5. FOCUS reaches |M22| 0.999 in practice (937 ms on the page), but with `swayDamp` 0.85 the worst sway phase at f = 1
   leaves 0.9990 (yaw .041 and pitch .020 rad of residual sway). A damp of 0.9 would give margin; it is the contract's
   number, so I left it.
6. `st.cjs` saw 3 `<canvas>` elements after STAGE's remount on a lost context (the GL one plus the phone poster's two
   canvases at 390): STAGE's to confirm.
