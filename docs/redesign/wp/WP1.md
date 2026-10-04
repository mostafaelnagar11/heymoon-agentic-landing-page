# WP1: Hero and Sky

4 Oct 2026. Built to SPEC rev 2 §5.1 (with §1.3 S1/S2/S8, §1.4, §1.7, §5.9) and the lead's 4 Oct budget ruling, against WP0 as shipped (WP0-NOTES). Branch `redesign`, nothing committed.

Screenshots: `scratchpad/shots/WP1/` (the `final-*` set is the current state; `par-*` are the CSS/GL parity pairs; `fix1*` is the horizon fix; `scr-*` the scrubbed switch; `dpr*`, `rim-zoom3`, `hair` the rim at DPR 1 and 2). Verification scripts: `scratchpad/wp1/v_*.cjs`, `parity.py`, `scrub.cjs`, `size.cjs`.

## What shipped

| File | What it does |
|---|---|
| `hero/Hero.tsx` | `HeroProps` unchanged. The §5.1.1 section: `<Horizon variant="hero" ignite>` in the field's grid cell (its centre is the apex), `<Sky>`, `.top` (switch, Headline), `.fieldRow` (Field), `.bottom` (Chips), the toast lanes (desktop only), the dim overlay. The lift bindings of §5.1.5 are single array-in/array-out `useTransform`s on `heroExit` (content opacity 1 → .4 and `translateY(0 → -40px)`, dim 0 → .55, horizon sink 0 → 120px, phone 80px); none under reduced motion, so the server HTML is static. Every bound element carries `data-lift` and `data-probe-scroll`; the Horizon root gets both through its ref (HorizonProps has no slot for them). `G10_SIGNED` gates the toasts: false means `<Toasts>` is never mounted or fetched. |
| `hero/Headline.tsx` | The CSS odometer (ruling 2). Both audiences render, stacked in one `.morph` grid cell: the active one is the only `<h1 id="hero-h1">`, the other an `aria-hidden` inert `<div>`; `rise`/`idle` until the first switch, then `in`/`out`. Keyed by audience with the h1/div swap, so React remounts and the CSS restarts. Each holds the sr-only sentence, a desktop line set (`hidden sm:block`) and a phone set (`sm:hidden`), lines and gradient index from `COPY[a].h1`. Zero JS motion. |
| `hero/Chips.tsx` | `<ul data-chips>` keyed by audience. Load: `motion-safe:animate-fade-up` per `<li>` at 420 + 35·i ms. Switch: the remounted list blurs its words in from 200 ms, 35 ms apart (the check icon rides its chip's first word); reduced: a 200 ms fade. Hidden while the field is invalid (`:has()`, module CSS). |
| `hero/Toasts.tsx` | Loaded through `next/dynamic` (`ssr: false`), mounted only at ≥1024 (`useMediaQuery`), so phones never request the chunk. One `useTimeline` over `[opener, ...read.units]` (opener 0 → 900; unit i `startMs+900 → endMs+900`, then `holdMs`), cycle + `restMs`, looping. It renders only on mark crossings. Playing = armed (2.4 s into the page) and not switching and `useActive(hero, .4)` and `useUncovered(lanes)` and not hovered, not dawning, not hidden. Lanes: ≥1200 two, alternating start/end, `AnimatePresence mode="wait"` per lane so "the oldest exits first" and the DOM never holds more than two; 1024 to 1199 one centred lane 40px under the chips, hidden while the hero field is focused. Toast box, rows, enter/exit exactly §5.1.4; working note → `produces` crossfades in one grid cell (no width jump). Switch: a 200 ms exit (AnimatePresence `custom`), the new queue 1,000 ms later. Reduced motion: units 4 and 9, landed, 200 ms fade, no loop. Paused: hidden and stopped. |
| `hero/hero.module.css` | WP0's §5.1.1 layout verbatim, plus the headline out-easing (D2), the chip word blur-in, the lanes, the mask and the crossfade. §2.3 variables only, no `@apply`/`theme()`. |
| `sky/Sky.tsx` | The only static import of the sky: an empty host `<div>` on the server. After `load` + `requestIdleCallback(…, {timeout: 2000})` (fallback 200 ms) it imports `./gl`. Gates: reduced motion, Save-Data, `?sky=css`, and the user's pause (it starts on resume). |
| `sky/gl.ts` | The lazy chunk: a fresh canvas per start (WebGL2, else WebGL1, `failIfMajorPerformanceCaveat`), no mediump path. Geometry measured from the CSS horizon itself in one `frame.read` (apex, 100vw, the halo and sun boxes, `--apex-pref` through a probe), DPR `min(dpr, level, √(2.2e6/area))`, the exact device-pixel box when uncapped. The ignition clock is the `.hz-rim` CSS animation's `currentTime`, eased with the same cubic-bezier. First frame, then a 1.2 s fade, then `data-gl="on"`. `frame.render` loop; stops when covered (`heroExit ≥ .999`), out of view, hidden, paused (one frozen frame), and redraws single frames on input changes while stopped. Dawn: the host's opacity is `1 − dawn` (no frame needed). Watchdog, context loss/restore (×2), teardown, `?sky=gl`, `?skydebug` (DPR levels, GPU ms via `EXT_disjoint_timer_query_webgl2`), `window.__sky` in dev. |
| `sky/shader.ts` | The GLSL. It paints the CSS horizon's own layers with the CSS's own maths, composited as the browser does (premultiplied source-over in sRGB, the two world tints stacked), then adds what CSS cannot: the light's swing toward the thumb and back, its lean to the pointer and the field focus, a breathing halo (±4% / 8 s), a luminous atmosphere band on the limb, hashed twinkling stars (6 to 10 s, fading into the light and toward the limb), ±1 LSB triangular dither. No `pow` at all. The sun's `blur(44px)` is exact: the gradient is fitted by three gaussians (NNLS against the blurred CSS layer at four sun boxes) and a gaussian blurred by σ is a gaussian. Shipped without comments (sections are literals joined at build time). |
| `sky/watchdog.ts` | Skip 30 frames, judge windows of 50: median in 31.3 to 35.3 ms → capped display, DPR 1.0, stop stepping; mean below 55.5 fps → step 1.5 → 1.0 → .75; below 40 at .75 → give up. |
| `lab/hero/page.tsx` | The hero inside the real LiftProvider > LiftTrack > Hero + Sheet (so the lift, the toast freeze and the sky stop are testable), pulled up under the lab toolbar so the geometry is /brands' (apex 570 at 1440x900). Toolbar: audience, `rm`, pause. Panel: sky `auto | css | gl`, `debug`, `bare` (hides the content, for parity), and a live readout (apex Δ, `data-gl`, canvas ratio, running @ level, toasts in the DOM). |
| `shell/Horizon.tsx` | Not edited: the defect was entirely in CSS. |
| `globals.css` (.hz rules only, special grant) | See "The horizon defect". |

## The horizon defect (lead screenshot, y = 570, x 330 to 1100)

Cause: `.hz-sky` stopped at the apex and `.hz-ground` painted an opaque `--deep` outside the planet disc for 150svh below the apex. The halo and sun layers, centred on the apex, sit under the ground layer, so everything of the light below the apex line was painted over by a flat rectangle: a hard horizontal edge from where the limb leaves the apex line to where the halo ends.

Fix (three `.hz` rules): the sky now runs 150svh past the apex (the same `--deep` the ground used to paint there), and the ground paints only the disc (`night-0` → transparent at the limb). The light now shows between the apex line and the limb and falls off around the limb (`fix1.png`, `fix1-zoom.png` at 3x brightness). Also, while there: the halo gradient's 3 stops became 11 samples of `A·(1 − t²)²`, the same .42/.16 at 0/45%, with no slope break and a zero slope where it ends (no ring); and the hair ring is 1.5px at .20 instead of 1px at .30 (the same light) so at DPR 1 it is a line, not dashes (`hair.png`). The shader models the same layers, so both skies agree. The close (WP6) uses the same rules and gets the same fix (`close-check.png`).

## Deviations from SPEC, with reasons

| # | SPEC | Shipped | Why |
|---|---|---|---|
| D1 | §5.1.4 lanes: bottom at `apex + sagitta(488) − 16` | Toasts hug the lane's inner edge (338px from the centre) and rest centred on the apex, level with the field, unless the limb would then cross their inner-bottom corner (wide screens): then 4px above the limb there. The lane runs 12px lower into its mask, so a toast still surfaces out of the horizon. Lane width `min(300px, 50% − 362px)`. | At the SPEC position the limb runs through the toast's text row (25px of overlap at the inner edge, 1440x900; a limb-shaped mask cut the words, tried and rejected). Below 1276 wide, 338 + 300 leaves the screen (at 1200 the outer 38px were clipped). |
| D2 | §1.7 H1 out: `--ease-exit`, 450 ms | Same 450 ms and 30 ms stagger, curve `cubic-bezier(.3,0,.2,1)`, hero only (module CSS, higher specificity). | With the spec's ease-in, the old sentence has moved under 15% when the new one (expo-out from 120 ms) is 70% up its line box: for about 250 ms the two sentences sit on top of each other (scrubbed frames, `scr-grid.png`). The new curve keeps the old line ahead of the new at every frame. See request R1. |
| D3 | §5.1.4 one centred lane at 1024 to 1199, "1 visible" | As SPEC, plus: a landed toast holds 1,200 ms before the next one (already working) replaces it. | Each unit starts the moment the previous lands, so with one slot the `produces` labels were never shown. |
| D4 | Sky gate: "skip entirely if … the user has paused" | Not started while paused; it starts on resume. | Skipping for good would leave a visitor who paused once on the CSS sky for the whole visit. |
| D5 | Paused: frozen frame | A frozen frame (time and pointer stop), but single frames are still drawn when an input changes: a switch, the sink while scrolling, the field focus. | Once `data-gl="on"` the CSS layers are hidden, so a switch while paused would leave the old tint and the limb would not sink. Pause stops motion, not state. |
| D6 | `uPointer` moves apex and centre | It moves the light (halo, sun, rim highlight), never the limb. | The limb must stay on the field at every viewport; a 6px parallax of the limb under a fixed field reads as misalignment. |
| D7 | Dawn: the canvas element's opacity is `1 − dawn` | The host `<div>`'s opacity. | The canvas's own opacity carries the 1.2 s fade-in transition; the two multiply. Same effect, no transition lag on the dawn. |
| D8 | uniforms (§5.1.6 list) | Adds `uCss`, `uVw`, `uSkyLen`, `uHalo`, `uSun`; the shader's geometry is the CSS's (measured boxes). The constants differ from the reference shader (which was linear-light and tone-mapped). | The reference shader does not look like the CSS horizon it crossfades over. This one does: ΔE ≤ 2.3 at the sky, 25% and 75% parity points, ≤ 2.7 at the centre behind the field (below). |
| D9 | Measure `uApex` as `offsetTop + offsetHeight/2` | `round(hzRect.top − sink − hostRect.top) + height/2`. | `offsetTop` rounds the row; and Chrome draws the composited field row and horizon root on whole CSS pixels (measured at DPR 1 and 2: a field row at 531.69 paints at 532..608). Unsnapped, the GL rim sat 0.3 to 0.5px off the CSS rim and the field. |
| D10 | `?sky=gl` skips the gates | Also drops `failIfMajorPerformanceCaveat` and the watchdog's give-up. | Debugging only: it lets software GL (headless SwiftShader) run the real shader to inspection. |
| D11 | Watchdog give-up: `destroy()` | Stop, `data-gl="off"`, a 600 ms canvas fade, then destroy. | The CSS layers are the same picture, but the stars would vanish in one frame. Context loss stays instant (there is nothing left to show). |
| D12 | (not specified) RTL swing | `uDir` is mirrored under `dir="rtl"`. | The light swings toward the thumb (rule 2.4.5). |

## Requests to the lead

- **R1, the shared odometer easing.** `.morph > [data-state="out"] .line > span` uses `--ease-exit`; the close H2 (WP6) overlaps its two sentences the same way (D2). Suggest changing that one rule in globals.css to `cubic-bezier(.3,0,.2,1)`; then `.headline.headline … ` in `hero.module.css` can go.
- **R2, B1 and §5.1.4 lane geometry.** Please confirm D1 (and D3) or say what to change. With D1, at 1440x900 the toasts sit at about y 539 to 601 (the field is 532 to 608), x 82 to 382 and 1058 to 1358 at most.
- **R3, measure.** Estimates (each file transpiled, terser'd and gzipped alone, so slightly high): first-load delta about +1.4 kB gz (Hero 1.0, Headline 0.6, Chips 0.6, Sky loader 0.7, against the stubs' 1.4, and the Toasts stub left first load); Toasts chunk 2.3 kB; sky chunk about 5.9 kB (gl 3.4, shader 2.1, watchdog 0.4) against the 8 kB budget. With `?sky=css`, none of the 12 JS files the page loads contains `precision highp` or `uWorld`. Please confirm with `npm run measure`.
- **R4, devices.** Not checkable here: data-gl within 4 s on a real GPU (headless SwiftShader on the dev server: 4.5 to 5.4 s, of which 1.2 s is the fade), GPU ms at DPR 1.5 on an M1, ANGLE/D3D and Metal (the shader has no `pow` at all), iOS Low Power (watchdog cap path).
- **R5, WP6.** The `.hz` rule changes apply to the close horizon too (an improvement: no hard edge there either). WP6 may want to refresh its screenshots.
- **R6, noise.** "You have Reduced Motion enabled on your device…" in the console under reduced motion is motion's own dev warning; it also appears on `/lab/shell` (WP0) and at 390 wide, where no WP1 motion component mounts.

## Measurements

**CSS/GL parity** (`parity.py`: the lab in `bare` mode, `?sky=css` after the ignition vs `?sky=gl` after `data-gl="on"`, 5x5 median to drop stars, CIE76 ΔE):

| | brands 1440 | creators 1440 | brands 390 | creators 390 |
|---|---|---|---|---|
| sky top / planet / edge below the apex | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| centre, apex − 60 / − 20 | 0.8 / 1.6 | 0.7 / 2.7 | 0.6 / 1.8 | 0.6 / 1.7 |
| 25% and 75% at apex − 8 | 1.5 / 1.4 | 1.1 / 0.8 | 0.7 / 0.5 | 0.5 / 1.4 |
| 25% and 75% at apex − 40 | 2.3 / 1.6 | 0.9 / 0.9 | 0.8 / 1.4 | 1.1 / 0.8 |
| whole frame p95 / p99 | 1.1 / 2.6 | 1.2 / 3.1 | 1.5 / (lab panel text) | 1.2 / (lab panel text) |

The centre is behind the field (the extra is the GL's atmosphere band). **Rim alignment** (centroid of the rim across 9 columns, CSS vs GL): within 0.15px at 1440 and 390, both audiences; after D9 the GL rim lands on the CSS rim's pixel rows at DPR 1 and 2 (`rim-zoom3.png`). **Banding**: contrast-stretched halo crops show the CSS gradient's bands; the GL halo has none (`banding.png`).

## Acceptance checklist

### §5.1.2 Headline
| Line | Result | Evidence |
|---|---|---|
| View-source has exactly one `<h1`, with the brands sentence on /brands, the creators one on /creators | PASS | `curl` grep: 1 each; `check:site` 1 h1 on both |
| After a switch there is still one h1 | PASS | `v_h1.cjs`: brands → creators → brands, 1 h1 each time, states `DIV:out:hidden:inert,H1:in:visible` |
| LCP element inside the h1, within 150 ms of FCP | PASS (unthrottled, dev) | `v_lcp.cjs`: LCP = FCP at 1440 ("A campaign in fifteen seconds.") and 390 ("Sales, guaranteed."); CLS 0.0000 through load. Fast 4G / 4x CPU not reproducible here |
| Reduced motion: a 200 ms crossfade, no transforms | PASS | globals.css `.morph` reduced rules (WP0); the states are wired |
| Line 2's highlight runs once, about 1.7 s after load | PASS | `grad-sweep` on `rise` only (1.6 s + 90 ms); `in` replaces the animation |

### §5.1.4 Toasts
| Line | Result | Evidence |
|---|---|---|
| Never more than 2 toasts in the DOM | PASS | `v_toasts.cjs`: polled every 100 ms for a full cycle, max 2; 1100 wide max 1 |
| First text after 2.4 s is "Opening yourstore.com" | PASS | at 2,447 ms page time |
| Over one cycle the sequence matches §6.3 | PASS | `v_toasts.cjs` log: opener, then the 9 units, each note… then its produces, then the cycle restarts |
| Landed toasts show the `produces` labels | PASS | same log; 1100 wide too (D3) |
| Below 40% visibility, or under the sheet, it freezes; back, it resumes mid-item | PASS | `v_lift.cjs`: frozen at scrollY 420 for 3 s; back at 0 it advances |
| Hovering a toast freezes it | PASS | `v_lift.cjs`: unchanged over 2.5 s with the pointer on a toast |
| At 390 and 768 no toast in the DOM and no timeline | PASS | `v_modes.cjs`: 0 nodes and the Toasts chunk never requested |

### §5.1.5 Lift bindings
| Line | Result | Evidence |
|---|---|---|
| `getAnimations()` on each bound element reports a ViewTimeline | PASS | `v_lift.cjs`: horizon, top, fieldRow, bottom, lanes, dim all `ViewTimeline` |
| At 844x390 the content stays at full opacity and the dim at 0 while it scrolls away | PASS | `v_short.cjs` at scrollY 250: hero `position: relative`, content opacity 1 / transform none, dim 0 |

### §5.1.6 Sky
| Line | Result | Evidence |
|---|---|---|
| `curl -s localhost:3004/brands \| grep -c "<canvas"` prints 0 | PASS | 0 |
| On desktop Chrome, `data-gl="on"` within 4 s | NOT VERIFIABLE HERE | headless SwiftShader + dev server: 4.5 to 5.4 s, including the 1.2 s fade (R4) |
| `canvas.width / clientWidth` ≤ 1.5 | PASS | DPR 2 at 1440x900: 1876 / 1440 = 1.30 (the 2.2e6 cap) |
| Under the sheet `__sky.running` is false; same in a hidden tab | PASS | `v_lift.cjs`: false at scrollY 900, true again at 0; false on `visibilitychange` hidden |
| A switch shifts the tint over 1.2 s and swings the light toward the thumb and back | PASS | `swing-grid.png`: mid-switch the light sits right of centre (toward Creators), then returns |
| No visible banding in the halo (400%) | PASS | `banding.png` (contrast-stretched): GL smooth, triangular dither |
| Centre never black on ANGLE/D3D and Metal | PASS by construction | no `pow` anywhere in the shader; not runnable here (R4) |
| Halo dark at the left and right edges of a 1440 shot | PASS | parity: the edge pixel is the sky's `--deep`, ΔE 0 to the CSS |
| Submitting while paused still turns the hero to #F6F4FC | PASS | `v_pause.cjs`: host opacity 0, `.hz-dawn` 1; five sampled pixels (246, 244, 252) |
| `loseContext()` shows the CSS sky at once, no errors; `restoreContext()` brings it back | PASS | `v_lift.cjs`: `data-gl` off, canvas opacity 0, CSS visible; restored → on, opacity 1; no console errors |
| `?sky=css` shows no canvas, and the ignition still plays | PASS | `v_modes.cjs`: 0 canvases, `hz-rim-in` running |
| Reduced motion: no canvas, the CSS sky lit, no ignition | PASS | `v_modes.cjs`: 0 canvases, 0 rim animations, rim 1 / sun .7 |
| First-load JS contains no `precision highp` | PASS (dev) | with `?sky=css` none of the 12 loaded chunks has `precision highp` or `uWorld`; `measure` is the lead's (R3) |

### §5.0.6 Horizon (the `.hz` rules touched under the grant)
| Line | Result | Evidence |
|---|---|---|
| Rim crisp, about 1.5px; its apex equals the field's centre within ±0.5px | PASS | lab readout and probe: Δ 0.00 at 1440x900 and 390x844 |
| Halo at most 25svh above the apex, fading about 29% of the width out | PASS | box and radii unchanged (`min(50svh, 440px)`, 38% / 75%) |
| A switch cross-fades the tint over 1.2 s | PASS | tints untouched (Horizon.tsx unchanged) |
| No element wider than 2x the viewport | PASS | `.hz-sky` is 100vw × 300svh |
| No hard edge behind the field (the lead's defect) | PASS | `fix1.png`, `fix1-zoom.png`; close: `close-check.png` |

### Also checked
- 1100 wide: one lane, landed labels shown, hidden while the field is focused (`v_single.cjs`).
- Pause: sky stopped with the canvas kept, toasts hidden; a switch while paused re-tints the frozen sky (`paused-switch.png`).
- Watchdog on software GL without `?sky=gl`: steps 1.5 → 1.0 → .75, gives up, `data-gl="off"`, canvas removed, no errors.
- No-JS: the creators hero renders with its tint, rise and ignition (`nojs.png`).
- Console clean on /brands and /creators at 1440 and 390; on every lab state except motion's own reduced-motion warning (R6).

## Checks

1. `npx tsc --noEmit -p .`: clean (whole project at the time of writing).
2. `npx next lint --dir "app/(site)"`: no warnings or errors.
3. `/lab/hero?a=brands|creators`, `&rm=1`, toolbar pause, `&sky=css|gl`, `&bare=1`, at 1440x900 and 390x844: all render, no errors (screens above).
4. `npm run check:site`: ok on /brands and /creators.
