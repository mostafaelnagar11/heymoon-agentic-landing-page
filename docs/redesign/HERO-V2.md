# HERO-V2: Eclipse Glass, the build brief

5 Oct 2026, lead architect. **Revised the same day** after the fast track (commit `54b9d09`, "Eclipse Glass hero, fast track for the demo"), the adversarial review (`$SP/eclipse/brief-review.md`, 28 findings) and Mostafa's verdict on the demo: *"the star on the hero looks flat before going to the glass effect, solve this."*

The goal is unchanged: replace the hero's visual and layout on `/brands` and `/creators` with the "Eclipse Glass" sculpture Mostafa chose, changed as the lead ruled after the three judges' critiques. Nothing else on the page changes. The close (its CSS horizon included) and the footer stay exactly as they are.

**How to read this file now.**
- The fast track built a different file layout from the one §2 planned (`sky/eclipse.ts` and `sky/EclipseSky.tsx`, not a rewrite of `gl.ts`, `shader.ts` and `Sky.tsx`). "State after the fast track" says what is live. "Remaining work" maps the full plan (items 1 to 8) onto the files that exist now. Read those two sections first.
- §1 to §11 are the original design, amended in place for every valid review finding. Each amended passage carries the finding's ID in brackets, for example **[H1]**. Each finding's verdict is in "Review findings". File names in §1 to §11 that no longer exist map like this: `gl.ts` + `shader.ts` + `watchdog.ts` → `sky/eclipse.ts`; `Sky.tsx` → `sky/EclipseSky.tsx`; `ring.ts` → `sky/eclipse-api.ts`; `Still.tsx` (the SVG twin) → `sky/EclipsePoster.tsx` (the poster, V3).
- §12 is the shared contract, `app/(site)/_site/sky/eclipse-api.ts`. The lead owns it and no package edits it. Its constants win over any number in §1 to §11.

**Read first, in this order:** this file; `app/(site)/_site/sky/eclipse-api.ts`, `sky/eclipse.ts`, `sky/EclipseSky.tsx`, `sky/eclipse.module.css`, `hero/*`, `shell/Field.tsx`, `shell/Lift.tsx`, `lib/lift.tsx`, `lib/audience.tsx`, `lib/prefs.ts`, `lib/signals.ts`, `lib/playback.tsx`, `lib/timeline.ts`, `data/types.ts`, `data/view.ts`, `data/demo.json`. Read the current code, not the SPEC's copy of it, and read files fresh because other packages are editing them. Then read the prototype `$SP/hero-concepts/sculpture/index.html` (also served at `/preview/eclipse.html` on :3004) and the judges' notes `$SP/hero-concepts/eclipse-judging.txt`. For SPEC §0, §2.4, §5.9, §6.3, §6.5 and §7.1 to §7.3, grep; do not read SPEC.md whole.

`$SP` = `/private/tmp/claude-501/-Users-mostafaaelnagar-Documents-moontech/d50da6c8-1e72-439f-9d55-d7ba5aef42c4/scratchpad`. The measurements in §1 to §11 were taken there on 5 Oct, and their scripts and images are in `$SP/herov2/` and `$SP/herov2/cap/` (Appendix). The fast-track measurements are in `$SP/arch-hv2/`.

**Precedence.** INPUTS, then RESEARCH §5, then this file for the hero, then SPEC. Inside this file, §12 and the contract file come first, then "Wave 2 plan", then "Remaining work", then the §0 rulings, then the body. This file supersedes SPEC §5.1 (all of it), the hero rows of §1.3 (S1, S2), §1.4, §1.5 B1, and the Sky and Toasts rows of §5.9. One exception needs the lead's ruling: SPEC §7 says "the LCP element is the H1", and with the poster (V3) that will probably not hold (§8.2). The lead folds this file into the SPEC after the build. Do not edit SPEC.md.

---

## State after the fast track (54b9d09)

Captured on 5 Oct on the :3004 dev server with SwiftShader. `$SP/arch-hv2/b1440-0.png` shows the first paint, `b1440-1.png` the GL star, `css1440.png` uses `?sky=css`, and `p390-1.png` is the phone.

### What is live

| Area | As built |
|---|---|
| Files | `sky/eclipse.ts`: the renderer, a lazy chunk through `import("./eclipse")`, GLSL ES 1.00 on WebGL2 or WebGL1, no imports except the contract types. `sky/EclipseSky.tsx`: canvas, stage box, inline SVG twin. `sky/eclipse.module.css`. `hero/Hero.tsx`: `HERO_VARIANT = "eclipse"`, with `HorizonHero` kept intact for a flip back. `hero/hero.module.css`: the eclipse layout, appended. `hero/Headline.tsx`: a `stacked` prop. `sky/Sky.tsx`, `gl.ts`, `shader.ts`, `watchdog.ts`, `hero/Toasts.tsx` and `shell/Horizon.tsx` are untouched; they serve `HorizonHero` and the close. |
| Layout, desktop (≥1024) | `.hero.eclipse` is a grid `minmax(0, 1fr) min(560px, 42vw)` inside a 1200 column (`padding-inline: max(24px, (100% − 1200px) / 2)`). Copy is start-aligned on the left, the stage on the right, both centred vertically. At 1440x900 the stage is 760, 170, 560 x 560 (centre 1040, 450) and the field is 120, 560, 520 x 76. This is **not** §3.2's layout, which put the star on the field's axis. |
| Layout, 768 to 1023 | Same split, stage `min(400px, 40vw)`. |
| Layout, phone (<768) | Stacked with the stage **on top**, `min(240px, 62vw, 28svh)`. At 390x844 that is 236.3 px at 77, 115, with the field at y 567 to 631 and the sheet top at 804 (peek 40). §3.2 put the star below the chips. |
| Renderer | The prototype's shader verbatim: diagonal tumble, the branch SDF (dark caps), the balloon creators bevel (.20 → .46), 5 IOR samples, 72/36 march, 2 bounces, one quality level. The canvas is opaque (`alpha: false`) and covers the whole hero (`absolute inset-0 z-canvas`, z 1, before the stage in the DOM, so the stage paints above it). The stage rect sets the star's centre and radius (re-read every 20 frames and on ResizeObserver). DPR is `min(dpr, 1.5)`, 1.25 under 768 wide, and 1 on software renderers. A frame-time watchdog sheds render scale down to .55. The loop is gated by pause, page visibility and an IntersectionObserver, and context loss calls `onFail`. |
| Bead and glints | Bead at 0.8 rad (45.8°) for brands and 0.8 − π for creators (the prototype's angles). Six faint glints sit evenly spaced from the bead; `pulse()` lights one per two keystrokes, and `launch()` lights all seven and runs the full turn and the comet. |
| Start | After `load` plus `requestIdleCallback(…, { timeout: 1500 })` (200 ms timer fallback), gated by reduced motion, Save-Data and `?sky=css`. `onReady` fires one rAF after the first draw and flips `data-on` / `data-gl`. The canvas fades in over 600 ms, and the twin fades out over 500 ms after a 150 ms delay. |
| Measure | The shader has no uniform named `uWorld`, so `measure.cjs` counts the chunk under "lazy site chunks", not under the sky line. |

### Why the first paint looks flat (the defect Mostafa named)

1. **The twin is a different object.** The SVG is a filled lilac cut-out with blurred bevel strokes. The GL star is mostly clear, dark glass with refraction, prism edges and a lens window. Body colour, edge treatment and silhouette pose all differ (the GL's resting yaw and pitch are −0.061 and 0.229 rad; the twin is frontal). The crossfade shows both at once.
2. **The background shifts.** The GL's empty pixels are rgb(6, 9, 21), the prototype's base colour through its tone map. The hero's CSS background is `--night-1`, rgb(1, 3, 23). The whole hero changes colour when the canvas fades in (measured: corners (1, 3, 23) with `?sky=css`, (6, 9, 21) with GL). The GL also draws a faint star field over the whole hero that the CSS state lacks.
3. **The intro starts dim and late.** The corona starts at 60% (`B.z = .6 + .4·intro`). Even on fast hardware GL waits for `load` plus idle, so the flat twin is what a visitor reads first.
4. **The light is wider than any box.** On the bead side the haze is still about 6 levels over the background at 1.0 S, and it fades out by about 1.6 S. A poster of the star alone would leave a seam where it ends.

### Other gaps against the plan

No agent read is on the hero: the eclipse variant mounts neither Toasts nor labels, so G10's beat is gone until item 1. There is no field spill. Focus only damps the sway (`1 − .72·focus`) and brightens. The creators material keeps the balloon look and the dark caps. On submit the copy dawn-fades, but the hero itself stays night, because the eclipse variant has no dawn layer. The latent `pow(negative, 2.)` in the keystroke ripple is still in the glass (review L4).

### Kept, and working

These behaviours stay: the heroExit lift bindings (content and dim) with the 64/40 px peek, the nav pause, page visibility, the typed placeholder, the switch in the hero, nav and close, `select()` and the URL, dawn on submit then `location.assign` to `/brands/c?read=…` or `/creators/c?h=%40…`, reduced motion (no canvas), and no-JS (the GET form, the links, the twin).

---

## Remaining work (the full plan, items 1 to 8)

**Waves.** Wave 1 (item 6, plus the parts of items 5 and 8 it touches) is built (`2eab75a`). Wave 2 was dispatched on Mostafa's "continue" on 5 Oct and re-planned the same day after his sketch and scope: items 1, 2 (focus only), 3, 5 and the new item 9 (the creator rings), with the rings and the agent card on brands only. Item 4 and item 7's wedge are deferred, and the switch is locked. Its rulings, packages and integration are in "Wave 2 plan", which wins over this table where they differ: no labels beside the ring (the card replaces them), no spill or lobe, the bead stays at 45.8° / 225.8°, and `setTyped` is replaced by `typingAgents` through `setAgents`.

| Item | What | Wave | Where it is specified | Files | Acceptance |
|---|---|---|---|---|---|
| **6. No flat star, ever** | The poster: the real WebGL frame at its exact resting pose, per audience, at 2x, at the phone and desktop stage sizes, made by a reproducible script and committed as AVIF and WebP under `public/hero/`. It is shown at first paint in the stage box, and the renderer's first frame is exactly that frame (REST, time zero, exact night background, light inside the poster box, screen-space terms in CSS px). The renderer starts right after hydration with a non-blocking compile, holds the resting frame until the poster has faded, then releases. The poster is also the reduced-motion, no-WebGL, Save-Data, `?sky=css` and context-loss fallback, and it swaps audience on the switch while GL is off. The SVG twin is deleted. | **1** | V3, V13 to V15, §4.4 composite, §4.5 Rest pose, §4.7, §8 (rewritten), §10 A-F, §12 | GLASS: `sky/eclipse.ts`, `scripts/hero-poster.cjs`, `public/hero/**`. STAGE: `sky/EclipseSky.tsx`, `sky/eclipse.module.css`, new `sky/EclipsePoster.tsx`, `hero/*` if needed | A-F1 to A-F8 |
| 5. Performance (the part wave 1 needs) | Non-blocking shader compile (`KHR_parallel_shader_compile`, else compile, link and check status a frame later) **[M6]**. Start after hydration with no idle wait. Pause offscreen, on a hidden tab and on the nav pause. Context-loss fallback to the poster. A single redraw after any buffer resize while stopped. The lazy chunk stays off the first load, at 12 kB gz or less. First load ≤ 160 kB, LCP ≤ 1.8 s. | **1** | §4.7, §9 | GLASS, STAGE | A-S1, A-P1 to A-P4 |
| 8. Keep every behaviour | heroExit fade as the sheet lifts (peek 64 desktop, 40 phone), dawn on submit then navigation, the nav pause, page visibility, the typed placeholder, the switch in hero, nav and close, reduced motion, no-JS. The close and footer stay exactly as they are, and copy stays verbatim. Hard rules: no invented numbers, no faces or real handles, no serif, and the star is a glyph-object, not a crescent logo. | **1** (constraint on every package) | §1, A-U | all | A-U1 to A-U3 |
| 1. Agents read | Seven clearly visible glints at `GLINT_DEG`, lit in turn by the real stream pace: brands `read` on brands and creators `read` on creators (`DEMO[a].read.opener` and `.units`, the READ_TASKS rows), on the TOAST/REPLAY timing. MoonLive and MoonLearning never work. Desktop ≥1024 (G10): the working agent's name in Geist Mono caps (`mono-caps`, `text-white/80` **[H2]**) and its verbatim note beside its glint at `labelAnchor()`, replacing the toast lanes. The corona is dimmed under the label (`setLabelRect`) **[H2]**. Each keystroke wakes the next glint (`typingLevel`, capped at .82 **[M8]**). On submit all seven light and the comet runs once round the ring, faded only once **[M2]**. The bead moves to `BEAD_TARGET_DEG` **[M1]**, and the posters are captured again. With GL off, DOM glint dots over the poster at `glintPoint()` carry the levels **[L2]**. | 2 | §5, §6, §7, A-A | new `hero/Agents.tsx` (lazy) + `eclipse.ts` `setAgents` / `setTyped` / `setLabelRect` + `EclipseSky.tsx` wiring | A-A1 to A-A7 |
| 2. The field is the front door | The star's light visibly reaches toward the field: the CSS spill (§3.4, gradients fixed **[M3]**, RTL **[M10]**) plus a GL caustic lobe from the start tip aimed at the field's centre (`setFieldRect`). The glow behind the field stays at rest opacity 1 **[M9]**. Focus turns the star to face the visitor (§4.5 Focus: base offsets × (1 − focus)). | 2 | §3.4, §4.5, A-C5, A-C6 | `hero/*`, `eclipse.ts`, `EclipseSky.tsx` | A-C5, A-C6 |
| 3. Phone | A smaller sculpture. The field fully above the fold at 390x844 and 360x740 with the 40 px peek, and at real browser heights 390x660, 360x660 and 375x548 **[H3]**. The star never grows the hero (its size comes from the space that is left), and the H1 stays the LCP (on phones this conflicts with an `<img>` poster: see §8.2 and R13). | 2 | §3.2 (phone part), §3.3, A-C3 | `hero/hero.module.css`, then re-capture the phone posters (`POSTER.stage.phone`) | A-C1, A-C3, A-P2 |
| 4. Creators material | No balloon and no dark caps at the tips, and mid-tumble frames never read as crumpled plastic: the continuous SDF and soft fold (V8), the §4.3 constants (validated in `$SP/herov2/proto4.html`) and the vertical tumble (V7). | 2 | V7, V8, §4.3, §4.5 Switch | `eclipse.ts` (then re-capture posters) | A-M1, A-M2, A-W1 |
| 5. Performance (the rest) | Quality tiers chosen at init (`initialTier`) and stepped by the watchdog over `TIER_LADDER` (`setTier`): high has 5 IOR samples and the full march, mid has 3 samples and a 48/24 march, low has 1 sample and the cheap bevel **[M4, L7]**. DPR cap 1.5 desktop, 1.25 phone. The canvas shrinks to the poster box (V4). Context restore at most twice. A measure marker for the chunk, budget 12 kB (V12). `?sky=soft` **[L3]**. | 2 | V4, V10, V12, §4.6, §4.8 | `eclipse.ts`, `EclipseSky.tsx`, `scripts/measure.cjs` (one line) | A-P1, A-P4, A-P5 |
| 7. Graft | Creators draws "your cut" as a pink wedge on the ring, breathing between 10% and 16% of the circle and bound to `DEMO.creators.shares.list` through `setCut`, with no number on screen. It starts at `CUT.startDeg` and opens clockwise **[L11]**. Keep the diamond-ring bead and the slab-to-liquid tumble on the switch, with the bead travelling half the rim through the field side. The wedge's resting value (in the creators poster) is `shares.max / 100`. | 2 | §4.4, §7, V6 | `eclipse.ts`, `EclipseSky.tsx` (passes the shares) | A-W1 (wedge rows) |

**After any wave-2 change that alters the resting frame** (item 1's bead and glints, item 4's material, item 7's wedge, item 3's phone stage), re-run `node scripts/hero-poster.cjs`. `public/hero/poster.json` records the renderer hash, so a stale poster set can be detected.

---

## Wave 2 plan

5 Oct, lead architect, on HEAD `99fd094` (the creator pictures and the consent decision). It replaces the plan of the stopped run, which built toward labels beside the ring. It follows Mostafa's sketch of the hero's right side, his scope ("this is only for brands, for influencers we will do something else"), and two locks: "keep the star flip animation" and "keep the eclipse animation while switching tab". **Required:** item 1 (glints on both audiences, the agent card on brands only), item 2 (focus only), item 3, item 5 and item 9 (the creator rings, brands only). **Deferred, not built:** item 4 (the creators material) and the cut wedge of item 7. **Locked:** the switch, as HEAD's `setAud` draws it (contract `SWITCH`). The creators hero keeps today's look: the eclipse with the pink liquid star, glints only, no rings and no card. The contract, `sky/eclipse-api.ts`, carries every wave-2 shape. This section wins over "Remaining work" and the §0 rulings where they differ: V5, V6, V7 and V8 are overruled, and so are the stopped run's W2-1, W2-6, W2-8 and W2-13. Evidence and tools are in `$SP/w2c-arch/`.

### The stopped run's tree: what was kept

The partial build is preserved in full in `stash@{0}` (the tracked files) and `stash@{0}^3` (the untracked `Agents.tsx` and `agents.module.css`), with copies in `$SP/w2c-arch/partial/`. Read it with `git show 'stash@{0}:<path>'`. Never pop or drop the stash.

| File | Verdict | Why |
|---|---|---|
| `sky/eclipse.ts` | **Reverted to HEAD.** The only change is that `onFail` now passes its reason. | Its fragment shader did not compile, so WebGL never started on the tree (see below). It had also rewritten the locked switch, the deferred material and the deferred wedge, and it added the deleted lobe and label mask. RENDERER ports its tier programs, watchdog, debug globals, `?skyslow`, glint drawing and comet from the stash. |
| `sky/EclipseSky.tsx`, `sky/eclipse.module.css` | **Reverted to HEAD.** | They carried the spill, the field measure, the cut loader and the label wiring. STAGE ports the canvas-in-the-stage box, the remount after `"lost"`, the canvas removal after `"gaveup"`, `data-tier` and the phone pause while the sheet covers the star. |
| `hero/Hero.tsx`, `hero/hero.module.css` | **Reverted to HEAD.** | They used the label geometry (W2-1) and the spill's pool. STAGE ports the glow behind the field (W2-9, `Glow`, `.glow`, `.core`) **without** `.pool`, and the phone stack (W2-2). |
| `sky/EclipsePoster.tsx`, `sky/poster.module.css` | **Kept.** | They implement W2-3, which paints the phone poster on a canvas so that the H1 stays the LCP (item 3). It is unproven: on the dev server the brands route still reported the poster `<img>` as the LCP (57,600 px²). STAGE verifies it on the production build or fixes it. |
| `hero/Agents.tsx`, `hero/agents.module.css` (untracked) | **Kept as AGENTS' draft.** | The clock serves the plan: the replay at the real pace, typing, submit, the switch delay, the dots and `setAgents`. Nothing mounts it yet. AGENTS replaces the ring label with the card. |
| `sky/eclipse-api.ts` | **Rewritten** (this contract). | It now covers the brands-only rings and card, the locked switch, the fixed glints and the tiers. |
| `docs/redesign/INPUTS.md` | Untouched. | It is the lead's record of the consent and scope decisions. |

### Why the switch animation was lost, and that it is back

1. **On the working tree, WebGL never started.** The stopped run baked each glint's notch into the GLSL as `ph-${angle}`. For the glints at negative angles that produced `ph--0.349066`, and GLSL reads `--` as the decrement operator: `ERROR: 0:79: '0.349066' : syntax error`. The link failed, `onFail` fired, and `data-gl` stayed `"off"`. A switch therefore only crossfaded the two posters (900 ms): no tumble, no sliver, no bead travel. This is what Mostafa saw. The probe is `$SP/w2c-arch/state-probe.cjs`, and the cause is in `harness.cjs --dir tree`. The contract's `glintUv` now states the rule: emit a negative literal in parentheses.
2. **The run had also re-timed the switch** (vertical axis, material tied to the flip's progress, the bead +π through the field side, the bead resting at 112°). Even once compiled, it would not have been the locked animation.
3. **At HEAD (and at `79c4367`) the switch is intact.** Measured on the reverted tree on :3004 (`switch-probe.cjs --grab 0`, SwiftShader, full-hero canvas, about 3.6 fps): facing 0.43 at 182 ms, 0.66 at 458 ms, 0.955 at 739 ms, and face-on creators by 1007 ms. With grabs on, the frame at 298 ms is the edge-on liquid sliver (facing 0.159), with the bead at −42.6° on its way round (`frames/page-brands-creators-1440x900/f000-298ms.jpg`). The way back passes edge-on at 256 ms (facing 0.012). The lead's captures looked face-on for two reasons. `shot.cjs --click` waits `--after` 1200 ms by default, and at 1200 ms ease-out-quart has done 99% of the flip. SwiftShader also draws only about 4 frames per second at this size, and a `toDataURL` in the draw's task stalls the main thread on an edge-on frame for 1 to 1.5 s.
4. **Now:** the revert restored the animation on :3004. Wave 2 keeps HEAD's `setAud` verbatim (`SWITCH`, `switchAt`). RENDERER adds `?skyslow=N` (debug only) and makes the switch clock advance by `min(dt, SWITCH_FRAME_CAP_MS)` (100 ms) per frame, so that a main-thread stall delays the rest of the tumble instead of skipping it (identical to today at 10 fps and above).

### Rulings

| # | Ruling | Why |
|---|---|---|
| W2c-1 | **The switch is locked**: HEAD's `setAud` values (`SWITCH`). The flip turns π about the diagonal over 1.7 s with ease-out-quart, edge-on at 270 ms (`EDGE_ON_MS`). Soft runs 1.0 s after an 80 ms delay. The tint runs 1.2 s. The bead travels −π over 1.8 s from `BEAD_REST_RAD` (45.8° / 225.8°, unchanged). The flash is 1.1 s. The only additions are `?skyslow` and the 100 ms clock cap. The rings and the card fade with it. | Mostafa's two "keep" instructions. |
| W2c-2 | **The rings are drawn in the shader from an atlas, and the canvas stays opaque.** They are not DOM images behind an alpha canvas. | (a) The brands poster, captured from the renderer, shows the rings in the first paint as one image already at high priority. 31 DOM images at low priority would pop in after it. (b) The handover stays exact, because one renderer draws both the poster and the first frame. (c) The disc occludes the inner ring, the star's tips pass in front of it and refract it, and the corona lights the faces, which an alpha canvas cannot do. (d) The night stays exact: an alpha canvas needs per-channel alpha for the screen composite, a scalar alpha shifts the pink haze by up to 6/255, and the creators frame would change. (e) No faces reach the DOM, so there is no LCP or hydration risk. The costs are the chunk (≤ 12 kB gz), two texture reads per plane sample, and a first frame that waits for the atlas on brands. |
| W2c-3 | **Glints are fixed on the rim** at `GLINT_DEG`: −20, −37, −54 and −71 (lower inline-end), then 160, 143 and 126 (upper inline-start). They do not travel with the bead. | The bead must stay where it is (W2c-1). These angles keep every glint ≥ 11° clear of an arm and ≥ 65° from both bead rests. |
| W2c-4 | **The agent card** (`CARD`, `CARD_CSS`, `AGENTS_DOM`) is one 340 × 44 dark glass row: the glyph, the name in mono caps and the verbatim note with an ellipsis. It is absolutely positioned in the hero, on the nav box's end edge, 88 px from the bottom. It shows on brands only, under `CARD_MQ`, while G10 is signed, and is aria-hidden. It crossfades in place and never moves. | Mostafa's sketch. |
| W2c-5 | **Split layout: today's columns and centring.** The stage's width becomes `SPLIT_CSS.width`, so the whole cluster (`CLUSTER_R` 0.629 S) stays off the copy column and inside the viewport, and its visible part (`CLUSTER_VISIBLE_R`) stays below the nav. There is no rule against the card. At 1440x900: s 536.7, centre 1000, 450 (today 560), cluster x 662.4 to 1337.6, card 940 to 1280 × 768 to 812. Other sizes are in `heroSplit()` (`node $SP/w2c-arch/geo.cjs`). | The H1, field and copy column do not move, and the star shrinks only 2 to 12% (it shrinks more on short screens through the nav term: 488.1 at 1280x720, 434.7 at 1366x657). A height rule against the card would shrink it by 17 to 39% on common laptops. |
| W2c-6 | **Phone: W2-2 on both audiences.** The order is switch, H1, field, chips, then the star in the last row (`PHONE_STAGE`). | Item 3 and the field-y parity rule need one layout. The H1 and the field move up (field at about 280 px at 390x844). **Lead's call:** if Mostafa wants the creators phone order untouched, the fallback keeps the star on top and reserves `(CLUSTER_R − 0.5)·s + 8` px above and below it (the field moves down about 39 px). That is one CSS block. |
| W2c-7 | **Focus** (`FOCUS`): the star turns face-on and the sway calms. **The glow behind the field** is the stopped run's `Glow` from the global `.hz-halo` and `.hz-tint` ramps, at rest opacity 1, with its focus core. **Deleted:** the spill, the pool, the caustic lobe and `setFieldRect` (it stays in the contract as obsolete and is never called). | Mostafa: "you can delete this". |
| W2c-8 | **Tiers** (`TIERS`, `TIER_LADDER`, `tierSteps`, `POSTER_TIER`, `WATCHDOG`) use HEAD's material constants only. Low draws no rings inside the glass. The posters stay at `POSTER.stage` (240 / 560) under `POSTER_CAPS`. | Item 5. Item 4 is deferred. |
| W2c-9 | **Budgets:** first load ≤ 160 kB (STAGE +1.8 kB gz at most), first-paint CSS ≤ 26 kB (STAGE +0.6, AGENTS +0.3, since `next/dynamic` links `agents.module.css` in the HTML), renderer chunk ≤ 12 kB gz (measure's `sky` line, found by its marker uniform), Agents and DEMO inside the lazy 110 kB. Every package runs `npm run measure` first and last. | W2-12, unchanged. |

### Packages (disjoint; nobody commits, stashes, resets or checks out; nobody edits the contract)

| Package | Owns | Builds |
|---|---|---|
| RENDERER | `sky/eclipse.ts`, `scripts/hero-poster.cjs`, `public/hero/poster-*` and `public/hero/poster.json` (`public/hero/creators/*` is read-only), and the `sky` budget line of `scripts/measure.cjs` | The switch proof and the clock cap, the glints, `setAgents`, the comet, the rings and atlas, focus, the tiers and watchdog, the debug state, and the posters (last) |
| STAGE | `sky/EclipseSky.tsx`, `sky/EclipsePoster.tsx`, `sky/eclipse.module.css`, `sky/poster.module.css`, `hero/Hero.tsx`, `hero/hero.module.css` (and `hero/Headline.tsx` / `hero/Chips.tsx` only if a check needs them) | The canvas box, the lifecycle wiring, the Agents mount, the split width, the phone stack, the glow, and the phone LCP |
| AGENTS | `hero/Agents.tsx`, `hero/agents.module.css` | The clock to `setAgents`, the DOM dots, and the card |

Shared files nobody touches: `lib/*`, `shell/*`, `data/*`, `copy.ts`, `tokens.ts`, `globals.css`, `ui/*`, `hero/Toasts.tsx`, `sky/gl.ts`, `sky/shader.ts`, `sky/watchdog.ts`, `sky/Sky.tsx`, `sky/eclipse-api.ts`, and the product apps. A package that needs a contract change stops and reports to the lead.

### Acceptance additions (on top of §10; A-W1 and A-A are rewritten here)

- **A-W1 (switch, rewritten):** `switch-probe.cjs --q "?skydebug&skyslow=10"` in both directions at 1440x900 and 390x844. The `facing` series dips to ≤ 0.15 once and recovers to ≥ 0.95. `A.x` (soft) and `A.y` (tint) go 0 → 1 (or 1 → 0). The bead angle changes by −π. In each frame, `__sky` agrees with `switchAt(t, 10)` within 0.05 rad and 0.05 of progress. The contact sheet reads like `sculpture/sw-grid.png`: tilted slab, edge-on liquid sliver with the flash, face-on in the other material, the bead swinging clockwise half the rim, and the corona warming. One run at `skyslow=1` with `--grab 0` shows the same phases at frame rate.
- **A-R (rings, brands):** both rings behind the disc and the star, with the faces of `public/hero/creators/c01-c10.webp` only. No two neighbours are the same, and every second use is mirrored or cropped. Opacity is about .36 inner and .24 outer, desaturated, and faded out by `CLUSTER_R`. The rings are absent on creators. They fade with the switch (`ringsPresence`). The drift is 0 at REST and stops when offscreen, in a hidden tab, under the nav pause and under reduced motion. The brands poster shows them; the creators poster does not. `regress.cjs` CLUSTER passes at the nine sizes. No `<img>` of a face is in the DOM, and no name, handle or figure is in the HTML or JS (`check:site`).
- **A-K (card, brands):** `regress.cjs --card` passes CARD at the split sizes. The card shows the opener "Opening yourstore.com" at about 2.4 s, then each working unit's `${note}…` verbatim with its agent. MoonLive and MoonLearning never appear, and MoonSearch never appears on brands. On creators no card is visible. There is never more than one card, no live region, and no transform on it while it updates. Its text is ≥ 4.5:1 at 1440x900 and 1306x800 over the GL render.
- **A-B1** as before (`regress.cjs`: NAVBOX, COLEND, H1x3, FIELDY, STAR, FOLD, HSCROLL at 1920x1080, 1440x900, 1306x800, 1180x800, 1024x768, 900x800, 800x800, 390x844 and 360x740, on both audiences).
- **A-P2:** the LCP element is inside `#hero-h1` at 390x844 and 360x740 on both routes, on the production build (3005). At 1440x900 the LCP is ≤ 1.8 s.

### Integration (the lead)

Tools, all read-only and in `$SP/w2c-arch/`: `regress.cjs` (layout and regressions; `--gl`, `--card`, `--json`), `switch-probe.cjs` (live switch frames, `--grab 0` for timing), `harness.cjs` (the renderer without React, `--dir head|tree`), `lcp.cjs` and `geo.cjs` (the contract's geometry). The three packages run in parallel. STAGE mounts `<Agents>` as its first edit, so AGENTS can see its work. RENDERER captures the posters last and writes `poster.json`, and the handover checks (A-F3, and A-A7 on GL frames) wait for it. When all three report, the lead: makes `setAgents` and `setTier` required, deletes the members marked obsolete (`BEAD_TARGET_DEG`, `LABEL`, `labelAnchor`, `setTyped`, `setCut`, `setFieldRect`, `setLabelRect`), runs tsc, lint, `check:site`, measure, `regress.cjs --gl --card`, `hero-poster.cjs --check`, A-W1 in both directions at both sizes, A-F3, A-R and A-K by eye, and a tour at 1440 and 390 for A-U, then commits.

---

## 0. Rulings for this package

Rows marked *(amended)* changed in the revision. V13 to V15 are new.

| # | Ruling | Why |
|---|---|---|
| V1 | **Split at `(min-width: 1024px) and (min-height: 521px) and (min-aspect-ratio: 1/1)`**: copy on the inline-start, the sculpture on the inline-end. Below that (phones, tablets, portrait iPads): **stacked, the sculpture below the chips**. Short screens (`max-height: 520px`) at 640 wide or more: a compact split with no labels. *(amended: the fast track ships the split centred vertically and the phone star on top. Item 3 decides the phone order. Whichever order it picks, the star must never push the field below the fold **[H3]**.)* | The judges: "on phone the star pushes the H1 and field down" and "the hero turns into a logo above a form". Below the chips the star never moves the field (at 390x844 the field rises from y 407 today to 345). 1024 is gate G10's line, so labels exist exactly where the split exists. |
| V2 | **The field row is the star's axis.** The stage sits in the field's grid row, centred on it (the same trick as ruling 21 for the horizon). The star's inline-start tip points straight at the field's end edge; on stacked layouts its top tip points up at the field. *(amended: target for item 2. The fast track centres the stage vertically instead.)* | The light can only bend toward the field if the geometry guarantees where the field is. Layout and light can never disagree. On desktop the field also stays where it is today (1440x900: 180, 531.7, 580 x 76; today 430, 532). |
| V3 | *(amended, reversed)* **The fallback and first paint is a poster rendered from the real WebGL frame**, not an SVG twin. One per audience and per band (phone, desktop), captured at 2x by `scripts/hero-poster.cjs` at `REST` (eclipse-api.ts), AVIF first and WebP second, sized to the poster box (V13). The SVG twin is deleted. | Mostafa, after the demo: the twin "looks flat before going to the glass effect". §8.2 measured that a twin fitted to the render still misses it by ΔE 12 to 13 in the star, and the prototype twin by 19 to 20. A frame of the renderer is the object itself. The cost (the poster is probably the LCP element, +25 kB desktop and +8 kB phone on the critical path) is measured and bounded in §8.2 and §9. |
| V4 | **The canvas covers only the aura box**, opaque, with edges that are exactly night (`#010317`). *(amended: the aura box is now the poster box, 2 S (V13). Wave 1 keeps the fast track's full-hero canvas, whose pixels beyond 0.98 S are exactly night; item 5 shrinks it.)* | Prototype: a full-hero canvas, 2.79 M device px at 1440x900 and DPR 1.5. The box cuts that by about half. The edge rule makes the box invisible. |
| V5 | **Seven glints on the ring's inline-end half** at `GLINT_DEG` (70, 52, 34, 16, −20, −36, −52 degrees, AGENTS order clockwise from the top). Labels open outward to the inline-end, away from the copy. *(amended **[M1]**: the lower three moved from −20, −40, −60.)* | Measured room: labels on the inline-start half collide with the H1 and field at every split size. An evenly spaced 7-glint ring always puts one glint within 6.4 degrees of an arm (the arms cover about ±8 degrees of the ring), so no even spacing is clean. |
| V6 | **The bead rests at 112° (brands) and 292° (creators) and travels half the rim through the field side** (via 180°). The creators cut wedge starts at the bottom arm's start-side edge (`CUT.startDeg` ≈ 262°) and opens clockwise into the lower-start notch. *(amended **[M1, L11]**: was 100° / 280°, and the wedge opened from the bead. Wave 1 keeps the fast track's 45.8° (`BEAD_REST_RAD`), and item 1 moves it.)* | Half the rim, as grafted, without ever entering the glints' half; and mid-switch the bead's light passes the field. At 100° and 280° the bead sat 2.2° from the arms (M1). |
| V7 | **The switch tumbles the star around its vertical axis, not the diagonal.** The material changes only while the star is near edge-on. | Measured frames (Appendix, `cap/sheet-flip.png`; A-W1): the diagonal tumble is what reads as crumpled plastic; the vertical tumble reads as a coin turning, with a clean liquid sliver at edge-on. |
| V8 | **Continuous star SDF** `smax(RR − length(p − C), (p.x + p.y − 1)/√2, k)` with a soft fold. | The prototype's branch in `star2()` is discontinuous at its branch line; that line is the straight edge of every "dark cap" (§4.3; numbers in A-M2). |
| V9 | **Hero no longer imports `Horizon`.** `Horizon.tsx` and every `.hz` rule stay for the close, untouched, except the one hero-only rule `.hz[data-gl="on"] …`, which is deleted. *(amended: the fast track keeps `HorizonHero` behind `HERO_VARIANT`, so the import stays until the lead removes the flag. Do not delete the rule while the flag exists.)* | Keep the close exactly as it is. |
| V10 | **Three quality tiers** (`TIERS`) chosen at init and stepped by the watchdog together with DPR (`TIER_LADDER`, skipping no-op steps **[L7]**), then the poster. DPR cap 1.5 desktop, 1.25 phone (`DPR_CAP`, `PHONE_MQ`). | Lead requirement 5. |
| V11 | **One agent clock** in a lazy `Agents` component (all viewports while motion is allowed). It sends glint levels and the working index to the renderer (`setAgents`) and, with GL off, to DOM glint dots over the poster. On the split layout it also renders the label. *(amended: the twin's `--g0..6` variables become DOM dots, because the poster is a raster.)* | Labels and glints can never drift, and the glints light in turn even when WebGL is missing. |
| V12 | The sky chunk budget in `scripts/measure.cjs` becomes **12 kB** (from 8). *(amended: measure finds the sky chunk by the `uWorld` marker, which `eclipse.ts` lacks. Item 5 adds the marker (a uniform of that name) or extends `MARK`, so the 12 kB line applies to `eclipse.ts`. Until then the chunk counts in "lazy site chunks", and wave 1 reports its gzip size by hand.)* | Lead requirement 5 ("about 12 kB gz or less"). |
| V13 | *(new)* **The poster box is 2 S square, centred on the star** (`POSTER_BOX`). All light is faded to exactly night between 0.80 and 0.98 S from the centre (`LIGHT_FADE`). The poster's alpha ramps to 0 between 0.98 and 1.0 S (`POSTER_FEATHER`), so the box edge can never show. | The fast track's haze is visible to about 1 S on the bead side (State, point 4). Below 0.80 S nothing changes. 2 S keeps the look at 2240 px (desktop, 2x) and 960 px (phone, 2x). |
| V14 | *(new)* **The first frame is the poster's frame, and the handover happens on a held frame.** The renderer draws REST at time zero, calls `onReady`, and **holds** it (no clock, no sway, no pointer) until `release()`. The caller makes the canvas opaque under the poster at once, fades the poster out over `POSTER_FADE_MS` (240), then calls `release()`. After that the sway clock's speed eases in over `SWAY_IN_S`, and the pointer is scaled by the same factor **[L1]**. | Pose, size, brightness and position cannot jump while the two images overlap, on any GPU speed, SwiftShader included. |
| V15 | *(new)* **Exact night, CSS-px marks.** Where there is no light the renderer writes exactly `NIGHT1` (§4.4 composite). The prototype's sky-wide star field is dropped **[L9]**. Every screen-space width (bead spikes, rim width, the halo's `md`, later the glints and the wedge's edges) is in CSS px through a `uPx` uniform (device px per CSS px) **[M5]**, so a 2x capture and a 1.5x or 1x live frame draw the same marks. | Otherwise the background shifts at the handover (State, point 2), and a 2x poster's spikes come out thinner than the live frame's. |

### Review findings (`$SP/eclipse/brief-review.md`) and where they landed

Every finding was checked against the fast-track code. "Wave 1" means a wave-1 package builds it now.

| ID | Finding (short) | Verdict | Applied in |
|---|---|---|---|
| H1 | The opaque canvas covers the labels and the spill | Valid. In the fast track the stage comes after the canvas in the DOM at the same z 1, so whatever lives inside `.stage` paints above it. Rule: anything that must show over the glass lives in `.stage` with z ≥ 2 (spill 2, labels 3), or is placed above the canvas. | §2 (Sky row), §3.4, §6.1, A-C2 |
| H2 | Label names and notes miss 4.5:1 over the lit corona | Valid. `setLabelRect` dims the corona and bead under the active label's rect (12 px soft edge) by `1 − .7·mask`; names `text-white/80`; A-C6 covers names. | §6.1, A-C6, contract |
| H3 | The phone stack only fits at DevTools heights | Valid. Item 3: the star never grows the hero; tighter gaps under 730 px; 390x660, 360x660 and 375x548 added; the SE line corrected. | V1, §3.3, A-C1, A-C3 |
| H4 | `animate` undefined; switches lost before the chunk; tumbles with nothing drawing | Valid. (b) is already fixed in the fast track (it reads `live.current.audience` after the await). (a) holds: the mount effect depends only on `[reduced]`. (c) is in the contract: the renderer jumps when its loop is not running. | §4.5 Switch, contract `setAudience` |
| M1 | The bead touches the arms at 100° and 280° | Valid. Bead 112° and 292°; lower glints −20, −36, −52. | V5, V6, §3.1, contract |
| M2 | The dawn fades the comet three times | Valid. While the loop runs, fade once (the dawn layer); the comet runs 300 ms ease-out-cubic from the press. | §1 dawn row, §4.5 Dawn |
| M3 | `closest-side at 0% 50%` paints nothing | Valid. `radial-gradient(70% 50% at 0% 50%, …)`; stacked `50% 70% at 50% 0%`. | §3.4 |
| M4 | Defines before `#version 300 es` fail to compile | Valid for a `#version` shader. `eclipse.ts` is ES 1.00 with no `#version`; if a header is ever added, the defines go after it. | §4.1 |
| M5 | No `uDpr`, so CSS-px marks drift with the DPR | Valid; wave 1 needs it for poster parity. `uPx`. | V15, §4.2 |
| M6 | The init program still compiles synchronously | Valid; wave 1 (the early start would otherwise put a long compile in the load path). | §4.6, §4.7 |
| M7 | The hero CSS rewrite has no keep list | Valid. Keep `.tuck` + its `@supports` + `@keyframes tuck`, `.word`, `.chipList[data-anim]`, `chipWord`/`chipFade`, `.swap`/`.work`/`.land`. | §2 (hero.module.css row) |
| M8 | Typing makes MoonLive and MoonLearning look like they work | Valid. Typing caps at .82; spikes and shimmer follow `AgentStates.working`, never a level. | §5.3, A-A5, contract |
| M9 | The field glow is weaker than today's | Valid. Rest opacity 1, focus brightens only the core; stacked height `min(50svh, 440px)`; A-C5 floor L\* 21. | §3.4, A-C5 |
| M10 | RTL mirrors the GL but not the fallback, glow or spill | Valid. The poster mirrors with the GL (`[dir="rtl"]` `scale: -1 1` on the poster and spill; `uDir` in GL), glow `translate: 50%` under RTL. Wave 1 adds no RTL mirroring to GL, so the poster must not mirror either; parity first. | §3.4, §8.3 |
| M11 | No upper bound on wide screens | Resolved by the fast-track layout (1200 column). Still applies to the spill width (field vs column) in item 2. | §3.2 note |
| L1 | Pointer not scaled by `swayIn` | Valid; wave 1 (V14). | §4.5 |
| L2 | `--gN` left behind on unmount | Valid for the DOM glint dots (item 1): remove on unmount, never write under reduced motion. | §5.3 |
| L3 | A-P5 cannot run on SwiftShader | Valid. `?sky=soft`. | A-P5 |
| L4 | `pow(negative, 2.)` in the ripple | Valid; wave 1 (a NaN glass on a GPU that does not fold the pow would break the poster parity). `q = (length(po.xy) − B.y)·7.; rip = exp(−q·q)·B.x`. | §4.1 |
| L5 | `cqw` unsupported breaks the stage | Valid for §3.2's split CSS (item 3); the fast track uses no `cqw`. | §3.2 note |
| L6 | The split floor overrides the sheet limits at 521 to 562 px | Valid for §3.2 (item 3); re-check on the fast-track layout. | §3.2 note |
| L7 | Ladder steps that change nothing | Valid. | V10, §4.8 |
| L8 | `ring.ts` ships its whole surface on the first load | Valid. `eclipse-api.ts` is pure and per-export tree-shaken; first-load importers take only `POSTER*`, `STAGE_ATTR`, `POSTER_FADE_MS`; measure confirms. | §12 |
| L9 | The prototype's star field is unaddressed | Valid; wave 1 drops it. | V15 |
| L10 | Short-screen padding sits on the tuck line | Valid for §3.2 (item 3): `+ 24px` on short screens. | §3.2 note |
| L11 | The wedge's first 16 to 18° hide behind the bottom arm | Valid. `CUT.startDeg`. | V6, §4.4 |
| L12 | Twin SVG ids are document-scoped | Obsolete: the twin is deleted (V3). | |
| L13 | Glint visibility baseline near the bead | Valid. Compare with the rim 6° away; scale the rim by `1 − .6·exp(−(Δθ/3°)²)` round each glint if needed. | A-A7 |

---

## 1. Behaviours today, and what each becomes

| Behaviour today | Where | Becomes |
|---|---|---|
| CSS sky is first paint and fallback; GL crossfades in | `Horizon` + `.hz` layers, `sky/gl.ts` | *(amended, V3, V14)* The poster (`sky/EclipsePoster.tsx`) is first paint and fallback. GL draws the poster's own frame under it, the poster fades out over 240 ms, then GL is released (`.stage[data-gl="on"]`). |
| Lazy GL: `load` + `requestIdleCallback(…, {timeout: 2000})` (200 ms fallback) then `import("./gl")` | `sky/Sky.tsx` | *(amended, item 6c)* The import starts at module evaluation and the mount runs right after hydration, with no `load` or idle wait; the compile does not block (§4.6). Same gates: reduced motion, Save-Data, `?sky=css`, the user's pause (start on resume, WP1 D4). |
| CSS ignition at 400 ms (1.6 s expo); GL reads its clock | `.hz[data-ignite]`, `uIgnite` | *(amended)* No ignition and no dimmed start: the poster is the lit resting frame (`REST.intro = 1`). GL's intro is the glare sweep and the energy flare, played after `release()`. |
| `world` 0 brands / 1 creators tints the light over 1.2 s | `Horizon` Tints, `uWorld` | GL `uWorld`; the field glow and spill tints are `useTransform(world)` opacities; the poster crossfades by the stage's `data-aud` (CSS; 900 ms in wave 1). |
| `heroExit`: content opacity 1 → .4, y 0 → −40; dim 0 → .55; horizon sinks 120 / 80 px | `Hero.tsx` | Content and dim unchanged. The stage cell sinks 120 / 80 px (`SKY.sinkPx`) and the labels fade 1 → .4. GL dims its light by `1 − .4·heroExit`. All single array-in/array-out `useTransform`s with `data-lift` and `data-probe-scroll`. |
| Sheet peeks 64 px (40 phone), JS drops it near the chips | `Lift.tsx` | Unchanged. The stage size reads only the CSS `--peek-want`, never the JS `--peek`, so a dropped peek never resizes the star (no CLS). |
| Dawn on submit: `.hz-dawn` fades in, canvas `1 − dawn`, root turns `#F6F4FC`, 450 ms then `location.assign` | `Field`, `audience.tsx`, `Horizon` | The hero gets its own dawn layer (`.dawn`, `opacity: dawn`). Canvas host `1 − dawn`. On the dawn's first change GL lights all seven glints and runs the comet once round the ring. While the loop runs, the light fades once only (the dawn layer); the comet takes 300 ms ease-out-cubic from the press **[M2]**. Navigation timing unchanged (450 ms). |
| Pause (nav) and page visibility | `playback.tsx`, `gl.ts` `sync()` | Same rules: frozen frame, single redraws on state changes (WP1 D5). Labels hidden while paused; glints frozen. |
| DPR watchdog (1.5 → 1.0 → .75, capped-30 lock, give-up) | `sky/watchdog.ts` | A two-axis ladder: tier and DPR (§4.8). |
| Context loss: CSS sky at once; restore ≤ 2 | `gl.ts` | Same: the poster shows at once (wave 1); restore ≤ 2 (item 5). |
| Desktop-only toasts (G10), next/dynamic, ≥1024 | `hero/Toasts.tsx` | **Deleted.** Replaced by the ring labels in `hero/Agents.tsx` (§5, §6). Same G10 constant, same pace, same verbatim strings. |
| Typed placeholder, per-audience drafts, invalid ring, error | `shell/Field.tsx` | Unchanged. The hero listens to the field's `input` events (they bubble) for the glints and the spill pulse. |
| Reduced motion: static, no canvas | everywhere | The static poster, glint dots at "landed", one static label on the split layout (§8.1). |
| No-JS | everywhere | The poster (the route's audience), the GET form, the switch links. No canvas, no labels. |

---

## 2. File plan (a)

*(Superseded in part by the fast track: see "State after the fast track", the file mapping at the top, and §12.2 for who owns what now. The rows still describe the target behaviour. `Still.tsx` is replaced by `sky/EclipsePoster.tsx` (V3), and `ring.ts` by `sky/eclipse-api.ts`.)*

Paths are under `app/(site)/_site/` unless they start with `app/` or `scripts/`.

| File | Action | What |
|---|---|---|
| `hero/Hero.tsx` | **Rewrite** | *(amended, V3: no `still` prop; the poster renders inside EclipseSky's stage, which already carries `data-aud`)* `data-audience={audience}` on the section (the server renders the route's audience). Layout (§3), the light layers, the stage cell, `<Sky>`, the dawn layer, the lift bindings, the `input` listener, the bus, the dynamic `Agents`. Props: `HeroProps { still?: ReactNode }`. No `Horizon`, no `Toasts`. |
| `hero/hero.module.css` | **Rewrite** | The §3 layout, the glow, the spill, the labels. Delete the toast and lane rules **except the keep list [M7]**: `.tuck`, its `@supports (animation-timeline: view())` block and `@keyframes tuck` (AudienceSwitch's short-screen handover); `.word`, `.chipList[data-anim]`, `@keyframes chipWord` / `chipFade`; `.swap`, `.work`, `.land` (reused by the label crossfade, §6.2). §2.3 variables only, no `@apply`/`theme()`. |
| `hero/Still.tsx` → `sky/EclipsePoster.tsx` | **New** (client component, server-rendered inside EclipseSky) | *(amended, V3)* The poster (§8.3): two `<picture>` layers from `eclipse-api.ts`'s `POSTER` names. The SVG twin is deleted. |
| `hero/ring.ts` → `sky/eclipse-api.ts` | **Done (lead)** | The contract (§12): geometry, glint and bead angles, levels, label metrics, poster names, tiers, the handle. Pure and tree-shaken per export, so the first load carries only what it imports **[L8]**. Must not contain the shader markers. The bus of §5.4 becomes `setAgents` / `setTyped` on the handle (item 1). |
| `hero/Agents.tsx` | **New**, lazy (`next/dynamic`, `ssr: false`) | The agent clock, glint levels (bus + CSS vars), typing mode, and on the split layout the label. Imports `DEMO`. |
| `hero/Headline.tsx` | **Edit** | Line-set classes `s.lines2` (the `desktop` set) and `s.lines3` (the `phone` set) instead of `hidden sm:block` / `sm:hidden`; alignment from the module class, not `text-center`. Copy unchanged. |
| `hero/Chips.tsx` | **Edit** | Drop `justify-center` and `px-4` from its own class list; the hero's `.chips` class sets alignment and padding per layout. |
| `hero/Toasts.tsx` | **Delete** | Replaced by `Agents.tsx`. |
| `sky/Sky.tsx` | **Edit** | Same loader and gates. Renders the canvas host inside the aura box. **[H1]** The host carries no `z-canvas`; inside `.stage`, `.spill { z-index: 2 }` and `.labels { z-index: 3 }`, so they paint over the opaque canvas. Passes `stage`, `hero`, `sheet` elements, the bus, `audience`, and the flags to `startSky`; calls `handle.audience(a, animate)` on every audience change. |
| `sky/gl.ts` | **Rewrite** | Lifecycle (§4.7), measurement from the stage's DOM box, the choreography state (§4.5), tiers (§4.6), observers, context loss, debug. Exports `startSky(host, stage, inputs)` (a `SkyHandle`, or null when it stays on the twin) and `SkyHandle { destroy(); audience(a, animate) }`. |
| `sky/shader.ts` | **Rewrite** | The port (§4). Keeps `VERT1/VERT2/HEAD1/HEAD2`, ships GLSL without comments as joined literals, keeps the uniform name `uWorld` (measure finds the sky chunk by it). |
| `sky/watchdog.ts` | **Edit** | Ladder of `{tier, dpr}` steps instead of DPR levels (§4.8). |
| `shell/Horizon.tsx` | **Unchanged** | Used by the close only. `HorizonProps.variant` keeps `"hero"` in its type; harmless. |
| `shell/Field.tsx`, `shell/Lift.tsx`, `lib/*` | **Unchanged** | No new signals. The hero reads `fieldFocus` and `heroFieldHasText` (existing). |
| `tokens.ts` | **Edit** | `TOAST` → `REPLAY = { openerMs: 900, holdMs: 2400, restMs: 3000, firstAtMs: 2400 }` (same values; `inMs`/`outMs`/`minWidth` go). `SKY` becomes `{ dprCap: { desktop: 1.5, phone: 1.25 }, maxPixels: 1.6e6, fpsFloor: 55.5, giveUpFps: 40, skipFrames: 30, sampleFrames: 50, capped33Ms: [31.3, 35.3], maxRestores: 2, sinkPx: { desktop: 120, phone: 80 }, pointerLerp: 0.06, igniteDelayMs: 400, igniteMs: 1600, canvasFadeMs: 700 }` (`dprLevels`, `limbRadiusVw`, `pointerPx` go). Grep for importers after the change. |
| `contracts.ts` | **Unchanged** *(amended, V3)* | No `still` prop: the poster needs no Server Component. |
| `Landing.tsx` | **Unchanged** *(amended, V3)* | |
| `app/(site)/brands/page.tsx`, `app/(site)/creators/page.tsx` | **Unchanged** *(amended, V3)* | The pages stay static (○). |
| `app/(site)/globals.css` | **Edit, one rule** | Delete `.hz[data-gl="on"] > :not(.hz-dawn) { visibility: hidden; }` (hero-only). Every other `.hz` rule stays for the close. Add nothing (hero rules live in the module). |
| `scripts/measure.cjs` | **Edit, one line** | `sky: 12 * KB` and its comment. |
| `copy.ts`, `data/*`, `scripts/bind-demo.*` | **Unchanged** | Every string the hero shows is already there. |

---

## 3. Composition (b)

### 3.1 Geometry constants (now in `sky/eclipse-api.ts`, §12; shared by CSS comments, the poster, Agents and the shader)

The prototype's camera (CZ 7, scale 1.12, eclipse plane at DZ 3.2, ring RM 1.08) fixes these ratios to the stage side S (the stage is an S x S DOM box; the star's centre is its centre):

| Constant | Value | Meaning |
|---|---|---|
| `TIP` | 0.4464 S | tip distance from the centre (`uv = 1/1.12`, half of S) |
| `RING` | 0.3309 S | eclipse ring radius (`1.08·7/(1.12·10.2)`, half of S) |
| `AURA` = `POSTER_BOX` | **2 S** *(amended, V13)* | poster box and (item 5) canvas box, centred on the stage; all light is faded to exactly night between 0.80 and 0.98 S (`LIGHT_FADE`) |
| Twin units | *(obsolete: the twin is deleted, V3)* | |
| `GLINT_DEG` (deg, CCW from the inline-end axis) | MoonShot 70, MoonMatch 52, MoonSearch 34, MoonWriter 16, MoonLive −20, MoonScore −36, MoonLearning −52 **[M1]** | AGENTS order, clockwise from the top; all clear of the arms (±7.8°) by 8° or more |
| `BEAD_TARGET_DEG` | brands 112°, creators 292° **[M1]** | 14° clear of the top and bottom arms, never in the glints' half (wave 1 keeps `BEAD_REST_RAD`, 45.8°) |
| `LABEL` | offset 16 px outside the ring along the radius; width 176 px; height ≤ 62 px | `text-small` notes fit in 2 lines at 176 px (measured, all 22 strings) |
| Spill gap `G` | ≥ 64 px between the field's end edge and the star's start tip | the length of visible light that bends to the field |

### 3.2 The CSS (hero.module.css, layout part; write it as given)

```css
.hero {
  --h1: clamp(38px, min(8svh, 5.2vw), 80px);           /* = text-display-1's size; geometry only. Change both together. */
  --nav-b: calc(var(--nav-top) + var(--nav-h));         /* 72 (64 phone) */
  --sheet: calc(100svh - var(--peek-want, 0px));       /* CSS-only peek: the JS --peek never resizes the star */
  --field-h: 76px;
  --stage: clamp(260px, min(52vw, 100svh - 560px), 420px);
  position: sticky; top: var(--hero-stick, 0px); z-index: 0; min-height: 100svh;
  display: grid; overflow: clip; isolation: isolate; background: var(--night-1);
  /* stacked (default): switch + H1, field, chips, stage */
  grid-template-columns: 100%;
  grid-template-rows: auto var(--field-h) auto auto;
  align-content: center; align-content: safe center;   /* never centre an overflowing stack up under the nav */
  padding-block: calc(var(--nav-b) + 24px) calc(var(--peek-want, 0px) + 16px);
}
.top      { grid-area: 1 / 1; display: flex; flex-direction: column; align-items: center; padding: 0 16px 40px; z-index: 4; }
.switchWrap { margin-bottom: 48px; }                    /* replaces the wrapper's mb-8 sm:mb-12 */
.headline { width: 100%; text-align: center; }
.fieldRow { grid-area: 2 / 1; display: grid; place-items: center; z-index: 4; }
.bottom   { grid-area: 3 / 1; padding-top: 28px; display: flex; flex-direction: column; align-items: center; z-index: 4; }
.chips    { justify-content: center; padding-inline: 16px; }
.glow     { grid-area: 2 / 1; position: relative; z-index: 2; pointer-events: none; }
.stageCell { grid-area: 4 / 1; position: relative; z-index: 1; height: var(--stage); margin-top: 24px; }
.stage    { position: absolute; top: 0; left: 50%; width: var(--stage); height: var(--stage); translate: -50% 0; }
.aura     { position: absolute; inset: -50%; }          /* 2 S (POSTER_BOX), centred: the poster and (item 5) the canvas host live here */
.dawn     { position: absolute; inset: 0; z-index: 3; background: var(--canvas); opacity: 0; pointer-events: none; }
.hero:has([data-invalid="true"]) .chips { opacity: 0; visibility: hidden; transition: opacity .2s; }

.lines2 { display: block; } .lines3 { display: none; }  /* desktop set / phone set from COPY[a].h1 */

@media (max-width: 639px) {
  .hero { --field-h: 64px; --stage: clamp(220px, 100svh - 540px, 260px); padding-top: calc(var(--nav-b) + 16px); }
  .top { padding-bottom: 28px; } .switchWrap { margin-bottom: 32px; } .bottom { padding-top: 20px; }
  .stageCell { margin-top: 16px; }
  .lines2 { display: none; } .lines3 { display: block; }
}

/* split */
@media (min-width: 1024px) and (min-height: 521px) and (min-aspect-ratio: 1/1) {
  .hero {
    --axis: clamp(440px, 63.3svh, 640px);                /* the field row's centre = the star's centre */
    grid-template-columns: [copy] minmax(min(580px, 100vw - 504px), max-content) [stage] minmax(0, 1fr);
    grid-template-rows: minmax(calc(var(--axis) - var(--field-h) / 2), max-content) var(--field-h) 1fr;
    align-content: stretch;
    padding-block: 0;
    padding-inline: calc((100vw - min(1120px, 100vw - 48px)) / 2 + 20px) 24px;   /* copy starts at the nav wordmark */
  }
  .top { grid-area: 1 / 1; align-self: end; align-items: flex-start; padding: calc(var(--nav-b) + 24px) 0 40px; }
  .headline { text-align: start; }
  .fieldRow { grid-area: 2 / 1; justify-items: start; }
  .bottom { grid-area: 3 / 1; align-items: flex-start; }
  .chips { justify-content: flex-start; padding-inline: 0; }
  .stageCell { grid-area: 2 / 2; height: auto; margin: 0; container-type: inline-size; }
  .stage {
    --sw: calc((100cqw - 255.4px) / .7645);              /* gap 64 + label 176 + 15.4, over TIP + .3181 */
    --stage: max(200px, min(var(--sw),
      calc(min(var(--axis) - 88px, var(--sheet) - 16px - var(--axis)) / .4464),   /* tips clear the nav and the sheet by 16 */
      calc((var(--sheet) - 80.3px - var(--axis)) / .2127),                         /* MoonScore's label clears the sheet by 8 */
      600px));
    top: 50%; left: auto;
    inset-inline-start: calc(64px + (var(--sw) - var(--stage)) * .38225 - var(--stage) * .0536);
    translate: 0 -50%;
  }
  .lines2 { display: none; } .lines3 { display: block; }
}

/* short (MQ.short), 640 wide or more: compact split, no labels, not sticky */
@media (max-height: 520px) and (min-width: 640px) {
  .hero {
    position: relative; top: 0; min-height: 0;
    --axis-s: calc(222px + 2.16 * var(--h1));            /* 88 + 48 + 24 + H1 (2 lines) + 24 + 38 */
    grid-template-columns: [copy] minmax(0, 580px) [stage] minmax(0, 1fr);
    grid-template-rows: auto var(--field-h) auto; align-content: start;
    padding-block: calc(var(--nav-b) + 16px) 32px;
    padding-inline: calc((100vw - min(1120px, 100vw - 48px)) / 2 + 20px) 24px;
  }
  .top { align-items: flex-start; padding: 0 0 24px; } .switchWrap { margin-bottom: 24px; }
  .headline { text-align: start; } .fieldRow { justify-items: start; } .bottom { align-items: flex-start; padding-top: 18px; }
  .chips { justify-content: flex-start; padding-inline: 0; }
  .stageCell { grid-area: 2 / 2; height: auto; margin: 0; container-type: inline-size; }
  .stage { --stage: max(120px, min(100cqw - 16px, calc((100svh - 8px - var(--axis-s)) / .4464), 280px));
           top: 50%; left: 50%; translate: -50% -50%; }
}
@media (max-height: 520px) and (max-width: 639px) { .hero { position: relative; top: 0; } }   /* phone stack, content height */
```

Notes the engineer must not "fix":
- `minmax(min(580px, 100vw - 504px), max-content)`: 520 at 1024, 580 from 1084, and wider only when the H1 needs it (1920: "Sales, guaranteed." is 621 px at 80 px, measured). Both audiences' H1s sit in the `.morph` cell, so the column never changes width on a switch.
- `100cqw` is the stage column's width (`container-type: inline-size` on `.stageCell`).
- The field keeps its own sizing (`sm:w-full max-w-[580px]`): 580 in the split from 1084, 520 at 1024.
- z-order: stage cell 1 (poster, canvas, then spill 2 and labels 3 inside it **[H1]**), glow 2, dawn 3, content 4, dim overlay 5 (was `z-[3]`, becomes `z-[5]`).
- If the top row's content is taller than `--axis − 38` (a narrow window with a long H1), the field row moves down and the stage moves with it; its size still uses `--axis`. Accepted (R6).
- *(review, for item 3)* **[H3]** The star must never grow the phone hero: put `.stageCell` in a last `minmax(0, 1fr)` row with `container-type: size` and `--stage: max(150px, min(260px, 100cqh − 8px))`, and under `(max-width: 639px) and (max-height: 729px)` use switchWrap 24, top padding-bottom 20, bottom padding-top 16, stage margin 12. **[L5]** `@supports not (width: 1cqw) { .stage { --sw: 360px } }` plus a plain fallback for the short-screen `--stage`. **[L6]** Start the split at `min-height: 564px`, or floor `--stage` at 150 px. **[L10]** Short screens: `padding-top: calc(var(--nav-b) + 24px)`, off the tuck line. **[M11]** Cap the stage column with `padding-inline-end: max(24px, calc((100vw − 1440px) / 2 + 24px))` and add the field-to-column difference to the spill width. The fast track's 1200 column already bounds the width, so re-derive these on its layout.

### 3.3 Positions at the seven required sizes (computed from 3.2 with measured text metrics; verify with A-C1)

Text metrics measured on the dev server with Geist: H1 widest 3-line set (brands) 559 / 447 / 621 / 414 px at 1440 / 1280 / 1920 / 1024; chip rows 422 (brands) and 425 (creators) px on one line; phone chips wrap to 2 lines (46 px). `$SP/herov2/m_text.json`, model `$SP/herov2/model.py`.

**Split** (x, y in CSS px from the viewport's top-left at scrollY 0; boxes are x, y, w, h):

| | 1440x900 | 1280x720 | 1920x1080 |
|---|---|---|---|
| H1 size, lines | 72 px, 3 | 57.6 px, 3 | 80 px, 3 |
| Copy column | x 180 to 760 | x 100 to 680 | x 420 to 1041 |
| Switch (300x48) | 180, 162.4 | 100, 96.0 (top row pushed 0.8 px) | 420, 206.8 |
| H1 box y | 258.7 to 492 | 192 to 378.6 | 302.8 to 562 |
| Field | 180, 531.7, 580 x 76 | 100, 418.6, 580 x 76 | 420, 602, 580 x 76 |
| Chips y | 636 to 655 | 523 to 542 | 706 to 725 |
| Sheet top (peek 64) | 836 | 656 | 1016 |
| S (binding limit) | **524** (width) | **410.8** (height) | **600** (cap) |
| Stage box | 796, 308, 524 | 725, 251, 411 | 1143, 340, 600 |
| Star centre = axis | 1058, 570 | 931, 456.6 | 1443, 640 |
| Ring radius | 173 | 136 | 199 |
| Tips W / E / N / S | 824 / 1292 / 336 / 804 | 747 / 1114 / 273 / 640 | 1175 / 1711 / 372 / 908 |
| Spill (field end → W tip) | x 760 to 824 at y 570 | 680 to 747 at 456.6 | 1000 to 1175 at 640 |
| Aura box (canvas) | 639, 150, 838 | 602, 128, 657 | 963, 160, 960 |
| Canvas px at DPR 2 screens | 838² x 1.5² = 1.58 M | 657² x 1.5² = 0.97 M | 960² x 1.32² = 1.6 M (pixel cap) |
| Label extent (workers) | x ≤ 1416, y 330 to 753 | x ≤ 1253, y 252 to 616 | x ≤ 1826, y 376 to 840 |

Glints and label boxes at 1440x900 (boxes: left, top, right, bottom; upper half opens up-right, lower half down-right):

| Agent (deg) | Glint | Label box |
|---|---|---|
| MoonShot AI (70) | 1117, 407 | 1123, 330, 1299, 392 |
| MoonMatch AI (52) | 1165, 433 | 1175, 358, 1351, 420 |
| MoonSearch AI (34) | 1202, 473 | 1215, 402, 1391, 464 |
| MoonWriter AI (16) | 1225, 522 | 1240, 455, 1416, 517 |
| MoonLive AI (−20) | 1221, 629 | never labelled |
| MoonScore AI (−40) | 1191, 681 | 1203, 691, 1379, 753 |
| MoonLearning AI (−60) | 1145, 720 | never labelled |
| Bead brands (100) / creators (280) | 1028, 400 / 1088, 740 | |

The launcher (1366, 826, 45 x 45 at 1440) never meets a label (labels end at y 753). At 1024x768 the split still holds: copy 44 to 564 (field 520), S 236, centre 733, 486, labels x ≤ 1000.

**Stacked and short:**

| | 768x1024 (stacked, tablet) | 390x844 (phone) | 360x740 (phone) | 844x390 (short, compact split) |
|---|---|---|---|---|
| H1 | 39.9 px, 2 lines (`desktop` set), centred | 38 px, 3 lines (`phone` set) | 38 px, 3 lines | 38 px, 2 lines, start-aligned |
| Switch | 234, 135.7 (300x48) | 55, 117.5 (280x44) | 40, 85.5 | 44, 88 |
| H1 box y | 231.7 to 318.0 | 193.5 to 316.6 | 161.5 to 284.6 | 160 to 242.1 |
| Field | 94, 358.0, 580 x 76 | 16, 344.6, 358 x 64 | 16, 312.6, 328 x 64 | 44, 266.1, 580 x 76 |
| Chips y | 462.0 to 481.0 | 428.6 to 474.6 | 396.6 to 442.6 | 360.1 to 379.1 |
| S | 399.4 (52vw) | 260 | 220 | 174.5 (height) |
| Stage box | 184.3, 505.0, 399.4 | 65, 490.6, 260 | 70, 458.6, 220 | 634.8, 216.9, 174.5 |
| Star centre | 384, 704.7 | 195, 620.6 | 180, 568.6 | 722, 304.1 |
| Tips N / S | 526.4 / 883.0 | 504.5 / 736.7 | 470.4 / 666.8 | 226.2 / 382.0 (W 644.1) |
| Spill | field bottom 434 → N tip 526 | 408.6 → 504.5 | 376.6 → 470.4 | field end 624 → W tip 644 |
| Aura box | 64.5, 385.2, 639 | −13, 412.6, 416 | 4, 392.6, 352 | 582.4, 164.5, 279 |
| Sheet top | 960 (peek 64) | 804 (peek 40) | 700 (peek 40) | none (not sticky; hero 411 tall) |
| Fold checks | field and star fully above the sheet | **field 344.6 to 408.6 fully above 804**; star clears the sheet by 54 | **field 312.6 to 376.6 above 700**; star clears it by 21 | **field above the 390 fold** (today it is at 402 to 478, below it) |

Phones shorter than about 700 px overflow the stack: `safe center` then starts it at the top padding. *(corrected **[H3]**: at real browser heights (390x660, 360x660, iPhone SE Safari 375x548) the §3.2 stack is 729 px tall at S 220, so the sheet lands below the fold and there is no peek. Item 3 must size the star from the space that is left.)*

### 3.4 The light layers (CSS, in every mode, before and without GL)

**Glow behind the field** (D3 spend 1, "the existing glow behind the field stays"): `.glow` holds two tint layers (brands, creators) with opacities `useTransform(world, [0,1], [1,0])` / `[0,1]`, centred on the field box (split: `inset-inline-start: calc(min(580px, 100%) / 2)`, translate −50%; stacked: centred). Each tint is the current `.hz-halo` ramp verbatim (the eleven `A·(1 − t²)²` samples, `radial-gradient(38% 50% at 50% 50%, …)`), on a box of field width x 1.5 by 240 px (180 phone), plus a core ellipse (90% of the field width by 90 px) of `rgb(255 255 255 / .30)` → tint `.20` at 40% → 0. No `filter: blur` (paint cost). *(amended **[M9]**)* The glow rests at opacity 1, as today's halo does; focus brightens only the core ellipse (`useTransform(focus, [0,1], [.6, 1])`); on stacked layouts the box is `min(50svh, 440px)` tall. `dawn-fade`. Under RTL `[dir="rtl"] .glow > * { translate: 50% }` **[M10]**.

**Spill (the star's light bending to the field).** A child of `.stage` (so it sinks with the star), `z-index: 2`, above the opaque canvas **[H1]**. Under RTL it mirrors with the scene (`scale: -1 1`) **[M10]**. Item 2 adds a GL caustic lobe aimed at `setFieldRect`'s centre, so the light reaches the field in GL too:
- Split and short: right edge at the start tip plus 0.02 S, left edge 40 px under the field's end (`width: calc(gap + 40px + .02 S)`), height `max(120px, .34 S)`, centred on the axis. Two layers per tint: a streak `radial-gradient(60% 14% at 100% 50%, white .55, tint .35 at 30%, transparent)` brightest at the tip, and a pool `radial-gradient(70% 50% at 0% 50%, tint .30, transparent)` landing on the field's end (*`closest-side` at 0% resolves to zero width and paints nothing* **[M3]**); stacked: `radial-gradient(50% 70% at 50% 0%, …)`.
- Stacked: the same turned upright, from 12 px under the field's bottom down to the top tip, `width: max(160px, .5 S)`. Its alpha in the chips' band is capped at .20 so the chips keep ≥ 4.5:1 (A-C6).
- Box formulas (stage-local, logical): split `inset-inline-end: calc(100% - var(--stage) * .0736); width: calc(64px + (var(--sw) - var(--stage)) * .38225 + 40px + var(--stage) * .02)`; short `width: calc((100cqw - var(--stage)) / 2 + var(--stage) * .0736 + 40px)`; stacked `bottom: calc(100% - var(--stage) * .0736); height: calc(var(--stage) * .0736 + var(--reach))` with `--reach` = stage margin + chips padding + chips + 12: 94 px on phones (16 + 20 + 46 + 12), 83 px on tablets (24 + 28 + 19 + 12).
- `opacity: useTransform(focus, [0,1], [.6, 1])`. A pulse layer inside it is played with WAAPI (`opacity 0 → .45 → 0`, 700 ms, `--ease-out`) on every keystroke and once on a switch at 150 ms (the bead passes the field side). None under reduced motion.

---

## 4. The shader port (c)

### 4.1 Structure (`sky/shader.ts`)

GLSL ES 1.00-compatible source with the existing headers (`HEAD2`: `#version 300 es`, `out vec4 FRAG`; `HEAD1`: `#define FRAG gl_FragColor`), one fullscreen triangle, highp only (keep the precision check: no mediump path). gl.ts prepends the tier defines. Sections, as literals joined at build time:

1. Defines and uniforms; constants `NIGHT1 = vec3(1,3,23)/255`, `DAWN = vec3(246,244,252)/255`, `V500`, `V300`, `PINK`, `BLUSH`; the prototype's `S 1.12, CZ 7.0, DZ 3.2, RM 1.08, BR 1.07, CC 1.4, RR 1.456`.
2. `h21`, `vn`, `smax` (prototype).
3. `star2`, `map`, `nor` (§4.3).
4. `studio`, `glare` (prototype), `corona` with the moon disc, ring, streamers, bead, trail, **cut wedge**, **comet** (§4.4), `env`.
5. `ex`, `glass` (§4.3).
6. Screen-space marks: the seven glints, the bead's spikes, the comet head.
7. `main`: uv, early out, corona, bounding-sphere march, marks, composite.

Never call `pow` on a base that can be negative (ANGLE/D3D and Metal return NaN): every `pow` takes `max(x, 0.)` or a `clamp`. The keystroke ripple is written `float q = (length(po.xy) − uPulse.y)*7.; rip = exp(−q*q)*uPulse.x;` (`max` would cut its inner half) **[L4]**. *(eclipse.ts note **[M4]**: it ships GLSL ES 1.00 with no `#version` line, so tier defines may be prepended; if a `#version 300 es` header is ever added, the defines go after it.)*

### 4.2 Uniforms and what drives them

| Uniform | Type | Prototype | Source (gl.ts, every frame unless noted) |
|---|---|---|---|
| `uRes` | vec2 | `R` | drawing buffer px |
| `uStage` | vec3 | `St` | stage centre (buffer px, origin bottom-left) and S/2 in buffer px, measured from the stage's `getBoundingClientRect()` against the host's, in `frame.read` on resize only (the sink transform moves both, so scrolling never re-measures) |
| `uTime` | float | `T` | active seconds (frozen while paused) |
| `uRot` | mat3 | `M` | §4.5 (passed exactly as the prototype: `uniformMatrix3fv(loc, false, rm)` with its `rotAxis`/`mul`) |
| `uWorld` | float | `A.y` | `world` MotionValue: tint of corona, body, rim, glints |
| `uSoft` | float | `A.x` | material 0 slab … 1 liquid, §4.5 (not `world`: it changes only near edge-on) |
| `uBead` | float | `A.z` | bead angle minus the typing kick, §4.5 |
| `uFocus` | float | `A.w` | `focus` MotionValue |
| `uPulse` | vec2 | `B.xy` | keystroke ripple amplitude and radius |
| `uIntro` | float | `B.z` | *(amended)* 1 from the first frame (`REST.intro`): the poster is the lit frame, so the corona never starts dimmed |
| `uFlash` | float | `B.w` | dispersion flash: switch (1100 ms `sin²` envelope) and dawn |
| `uGlintA[7]` | float[] | (6 implicit) | glint angles in radians, set once (in LTR terms: `uDir` mirrors the whole scene, so never mirror an angle as well) |
| `uGlint[7]` | float[] | `C.x` (a count) | per-agent levels 0..1, the bus lerped `1 − e^(−8·dt)`; all 1 once `dawn > 0` |
| `uComet` | float | `C.y` | 0..1 comet progress, −1 off |
| `uRimW` | float | `C.z` | prototype formula from the measured radius |
| `uEnergy` | float | `C.w` | `.5·focus + .8·flash + launch + introFlare + .25·pulse + .12·sin(1.1t)·sin(.37t)` |
| `uTrail` | float | `E.x` | bead trail from its angular velocity (prototype) |
| `uGlare` | float | `E.y` | glare sweep: −1.3 → 0 over 2.2 s ease-in-out starting at the reveal |
| `uCut` | vec2 | (new) | x: wedge presence `smoothstep(.6, 1, world)`; y: share fraction (§4.4) |
| `uDawn` | float | (new) | `dawn`; the final colour mixes to `DAWN` |
| `uExit` | float | (new) | `heroExit` (0 on short screens); all light × `1 − .4·uExit` |
| `uDir` | float | (new) | +1, or −1 under `dir="rtl"`: `uv.x *= uDir` first thing, so the whole scene mirrors |
| `uPx` | float | (new, wave 1) **[M5]** | device px per CSS px (`dpr × watchdog scale`). Every screen-space width (bead spikes, rim width, halo `md`, glint cores, wedge edges, dither excepted) is written in CSS px through it, so a 2x poster and a 1.5x or 1x live frame draw the same marks (V15) |
| `uWorking` | float | (new, item 1) **[M8]** | index of the working agent or −1: spikes and shimmer only there |
| `uLabel` | vec4 | (new, item 1) **[H2]** | the active label's rect in uv (0 when none): corona and bead × `1 − .7·mask`, 12 px soft edge |

### 4.3 Glass and material (validated in `$SP/herov2/proto4.html`)

```glsl
float star2(vec2 p, float k){ return smax(RR - length(p - vec2(CC)), (p.x + p.y - 1.) * .70710678, k); }   // continuous (V8)
float map(vec3 p){
  p = uRot * p; float sf = uSoft;
  float d2 = star2(sqrt(p.xy * p.xy + mix(2e-5, 4e-4, sf)), .02 + sf * .10);   // soft fold: no seam on the axes
  float rb = mix(.20, .34, sf);                                                 // was .20 → .46 (the balloon)
#ifdef CHEAP_BEVEL
  float h = mix(.16, .19, sf);
#else
  float h = mix(.16, .19, sf) + mix(.13, .07, sf) * smoothstep(.62, 0., length(p.xy));   // was .26 thick, .04 dome
#endif
  vec2 q = vec2(max(d2 + rb, 0.) / rb, abs(p.z) / h);
  return (length(q) - 1.) * min(rb, h) * .85;
}
```

In `glass()`: `float ior = mix(1.5, 1.42, uSoft)` (water-like liquid); `ds = mix(.024, .016, uSoft) + .035 * uFlash` (softer fringes); creators body `mix(vec3(.42,.16,.34), vec3(1.,.62,.82), gx)` (was `.35,.04,.25 → 1,.38,.66`, the hot-pink balloon); rim term `pow(1. − ci, 7.) * mix(.9, .55, uSoft)`; the TIR fallback in `ex()` becomes `mix(env(pe, d), env(pe, reflect(d, −ne)), .35)` (was `.2·reflect + .35·env`, dark); and the result is blended to straight-through for thin glass: `return mix(env(p, rd) + glow * .5, g, smoothstep(0., .08, L));`.

Dispersion samples per tier (each column sums to 1 per channel):

| `IOR_N` | Samples and weights |
|---|---|
| 5 (high) | the prototype's five: `ior − 2ds` (.46,.04,.20), `ior − ds` (.34,.16,.12), `ior` (.10,.62,.16), `ior + ds` (.06,.13,.26), `ior + 2ds` (.04,.05,.26) |
| 3 (mid) | `ior − 1.5ds` (.62,.08,.22), `ior` (.28,.78,.30), `ior + 1.5ds` (.10,.14,.48) |
| 1 (low) | `ior` (1,1,1) |

### 4.4 Eclipse plane: corona, ring, bead, wedge, comet; marks; composite

- **Corona** as the prototype, plus: every light term × `1 − smoothstep(1.6, 1.96, length(uv))` (uv: 1 = S/2; `LIGHT_FADE` 0.80 to 0.98 S, V13), so all light is exactly zero inside the poster box's inscribed circle edge. Nothing inside 0.80 S changes. The prototype's sky-wide star field (`hs > .93`) is dropped **[L9]**. Streamer noise: 2 octaves (high, mid), 1 (low).
- **Bead**: at `uBead` on the ring. Flare `exp(−db·22.)·1.1` (was 14: smaller, so MoonShot's glint 30° away stays distinct); spikes in screen space with e-fold 0.04 S (`L = 1/(.08·uStage.z)`).
- **Cut wedge** (creators): φ = `atan(q.y, q.x)`; in the wedge when `mod(c0 − φ, 6.2831853) < uCut.y·6.2831853` with `c0 = radians(CUT.startDeg)`, the bottom arm's start-side edge (it opens clockwise into the lower-start notch; opening from the bead hid its first 16 to 18° behind the arm **[L11]**). Inside: an annulus from 0.96 to 1.12 ring radii of `PINK`, soft 1.5 px edges, × `uCut.x · .9`, and the rim there takes `PINK` at 1.4× its brightness. `uCut.y` steps through `DEMO.creators.shares.list` (the 16 live shares, 10 to 16) one value per 1.6 s with an ease-in-out between, looping; before the bus has the list, `shares.max / 100`. No number anywhere.
- **Comet**: head angle `uBead − uComet·6.2831853` (clockwise: it passes the seven glints first, then the field side); the prototype's sweep and head terms with `sin(π·uComet)` envelope.
- **Glints** (screen space, drawn after the glass so they are always visible): for each i, `g = vec2(cos, sin)(uGlintA[i]) · .6618` (ring radius in uv), `d` in CSS px; core `smoothstep(2.2, .6, d)·(.25 + .75·lvl)·1.6` (white), halo `lvl²·.9·exp(−d/5.)` (tint), and for `lvl ≥ .99` four spikes of length 0.035 S with a 1.2 Hz shimmer of ±.12. Level values in §5.3.
- **Composite** (replaces the prototype's tone map of everything): `vec3 lit = pow(max(1. − exp(−Lgt·(1.15 + .5·uFlash)), 0.), vec3(.4545)); col = 1. − (1. − NIGHT1)·(1. − lit);` where `Lgt` is all light × `(1 − .4·uExit)` and the prototype's base colour is dropped. Where there is no light the pixel is exactly `#010317`. Then `col = mix(col, DAWN, uDawn)`, then ±0.5/255 dither seeded by `uTime` (static when frozen).
- **Early out**: `length(uv) > 1.96` → `NIGHT1` + dither, nothing else. The march runs only when the ray meets the bounding sphere (`BR` 1.07, the prototype's test).

### 4.5 Motion state (gl.ts, JS)

| State | Rule |
|---|---|
| Rest pose | *(amended, V14)* `REST` = `swayAt(0)` (yaw −0.0611, pitch 0.2289, roll 0: the prototype's own t = 0 pose, which keeps the 3D read), time 0, intro 1, glare −1.3, focus, pointer, pulse, flash and energy 0. The first frame and every poster are this frame. The renderer **holds** it until `release()` (or `RELEASE_FALLBACK_MS` after `onReady`). After release, the sway clock advances at speed `smoothstep(0, SWAY_IN_S, t)`, so the pose leaves REST with zero velocity through the prototype's own sway family (`swayAt`). |
| Pointer | fine pointers only, lerp `SKY.pointerLerp`: yaw `+ px·.22·(1 − .7·focus)·swayIn`, pitch `− py·.14·(1 − .7·focus)·swayIn` **[L1]**; 0 while held or paused. |
| Focus | sway amplitude × `1 − .85·focus` and the base offsets × `1 − focus`: **at focus 1 the star faces the visitor**; energy `+ .5·focus` (core and bead brighten). The CSS glow and spill rise with the same MotionValue. |
| Switch (`handle.audience(a, true)`) | `flip`: +π about the **vertical axis**, sign `+1` to creators, `−1` to brands (under RTL the mirrored scene turns it toward the thumb by itself), 1700 ms ease-out-quart. `soft`: follows the flip's progress `smoothstep(.30, .62, p)` from the old material to the new (done by about 365 ms, around edge-on at about 270 ms). `bead`: from its rest angle to the other along the field side (100 → 180 → 280, and back the same arc), 1800 ms ease-out-quart. `flash`: 1100 ms `sin²` envelope. `world` is the shared MotionValue (1.2 s). |
| Switch while reduced, `instant`, or a loop that is not running (paused, hidden, offscreen, covered) | jump: soft, bead and tint set at once (no flip), and one redraw **[H4]**. The caller keeps the latest audience in a ref and passes it to the mount after the `await`; the mount effect's deps stay `[reduced]`. |
| Keystroke (bus `keyAt` changes) | `pulse = min(1.2, pulse·.5 + .9)`, radius reset if > .35, then radius `+ 1.25/s`, amplitude `× e^(−1.8 dt)`; bead kick `+ .045` rad decaying `e^(−.35 dt)` (prototype). |
| Dawn | first change of `dawn` from 0 while running: all `uGlint` → 1, comet 0 → 1 over **300 ms** ease-out-cubic from the press, `flash` envelope 0 → 1 → 0 over 450 ms. **Fade once [M2]**: while the loop runs, no host `1 − dawn` and no in-shader DAWN mix (the dawn layer alone fades it); the host fade only applies to a stopped or paused GL. `dawn` back to 0 (bfcache) clears all three. |
| Intro | `uIntro` = 1. After `release()`: the glare sweep (from `REST.glare`) and an energy flare `.9·exp(−((t − .5)/.35)²)` (t from the release). |

### 4.6 Quality tiers

| | high (2) | mid (1) | low (0) |
|---|---|---|---|
| `IOR_N` | 5 | 3 | 1 |
| Front march steps | 72 | 48 | 40 |
| Internal march steps | 36 | 24 | 16 |
| Internal bounces | 2 | 2 | 1 |
| Bevel | full (dome, soft fold) | full | `CHEAP_BEVEL` (no dome) |
| Studio | 4 boxes + glare | 4 boxes + glare | 2 boxes (key, rim) + glare |
| Corona noise | 2 octaves | 2 | 1 |

**Init tier**: `?tier=high|mid|low` wins; else `mid` if `MQ.phone`, or the unmasked renderer matches `/Intel|UHD|Iris|Mali|Adreno \(TM\) [1-6]\d\d|PowerVR/i`, or `hardwareConcurrency ≤ 4`, or `deviceMemory ≤ 4`; else `high`. Software renderers are refused by `failIfMajorPerformanceCaveat` (kept; `?sky=gl` drops it, as today).

**Programs**: compile the init tier first, **through `KHR_parallel_shader_compile` too [M6]**: compile, link, poll `COMPLETION_STATUS_KHR` on the program once per frame, and only then read `LINK_STATUS` and the uniform locations (without the extension: compile and link, then check a frame later, so drivers that compile in the background can). After the reveal, in an idle callback, compile the next tier down the same way and swap only when complete, so a step-down never stalls a frame. Uniform locations and constant uniforms (`uGlintA`) are per program: re-query and re-set them after every swap and every context restore. Cache programs per tier; rebuild all on context restore.

**DPR**: `dpr = min(devicePixelRatio, cap, step.dpr, √(SKY.maxPixels / (w·h)))` with `cap = matchMedia(MQ.phone).matches ? 1.25 : 1.5` and `w·h` the aura box in CSS px. Uncapped, use `devicePixelContentBoxSize` as today.

### 4.7 Lifecycle (gl.ts; keep WP1's proven parts)

- Context: `webgl2`, else `webgl`; `alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: !force`. A fresh canvas per start (StrictMode, lost contexts).
- Reveal *(amended, V14)*: draw REST, `onReady` one rAF later; the caller turns the canvas opaque at once under the poster, fades the poster out over `POSTER_FADE_MS`, then `release()`. Any buffer resize while stopped or held is followed by one redraw (a resize clears the drawing buffer, and an opaque canvas would show black).
- Loop on `frame.render(loop, true)`; it runs only when `built && !lost && inView && !covered && !document.hidden && !paused`. `inView`: an IntersectionObserver on the host. `covered`: `heroExit ≥ .999`, or the sheet's top at or above the host's (aura box's) top, clipped to the hero (checked on scroll in `frame.read`; on phones the sheet covers the star long before `heroExit` reaches 1). Stopped: single redraws on `world`, `focus`, `dawn`, `audience`, `heroExit` and the bus version (WP1 D5). Paused: one frozen frame.
- Context lost: `preventDefault`, `onFail` → `data-gl="off"` and `data-on="false"` at once (the poster shows), stop. Restored: rebuild, re-measure, fade in again, at most `SKY.maxRestores` times.
- Give-up (watchdog): `data-gl="off"`, 600 ms canvas fade, then destroy.
- Teardown: cancel frames, disconnect observers, `WEBGL_lose_context.loseContext()`, remove the canvas.
- Debug: `?sky=css` (never start), `?sky=gl` (skip the gates except WebGL, never give up), `?tier=…`, `?skystill` (one frame at REST, then stop: for poster parity shots; the poster script uses the `capture` option instead), `?skydebug` (logs, GPU time through `EXT_disjoint_timer_query_webgl2`). Dev only: `window.__sky = { running, tier, dpr, fps, step, comet }`.

### 4.8 Watchdog (sky/watchdog.ts)

Ladder (phones clamp each `dpr` to 1.25): `TIER_LADDER` = `[{high, 1.5}, {mid, 1.5}, {mid, 1.0}, {low, 1.0}, {low, .75}]`; the start index is the init tier's first step; skip a step whose effective `{tier, dpr}` equals the current one (on DPR-1 screens `{mid, 1.5}` → `{mid, 1.0}` is a no-op) **[L7]**. After any (re)start or step: skip 30 frames, judge windows of 50 deltas:
- median in 31.3 to 35.3 ms → capped display (iOS Low Power): go to the current tier at DPR 1.0, lock, stop stepping;
- mean below 55.5 fps → next step (re-measure, swap the program when it is ready);
- at the last step and below 40 fps → give up (unless `?sky=gl`).

Log lines (`?skydebug` only; verifiers grep them): `[sky] start tier=high dpr=1.50 webgl2`, `[sky] window fps=58.7 median=16.7ms verdict=keep`, `[sky] step tier=mid dpr=1.50 (mean 47.2 fps)`, `[sky] capped tier=mid dpr=1.00 locked`, `[sky] gave up at tier=low dpr=0.75 (31.0 fps)`, `[sky] gpu 2.84 ms/frame tier=high dpr=1.50`.

---

## 5. The agents on the ring (d)

### 5.1 Data (demo.json, read through `DEMO`, never copied)

| Field | Use |
|---|---|
| `DEMO.agents[].name` (7, AGENTS order) | glint index i; angle from `eclipse-api.ts` `GLINT_DEG[name]` |
| `DEMO[a].read.opener` | item 0: `"MoonShot AI · Opening yourstore.com"` / `"… @yourhandle"`, split on `" · "` into agent and note (as Toasts did) |
| `DEMO[a].read.units[]`: `.agent`, `.note`, `.produces`, `.startMs`, `.endMs` | items 1..9 |
| `DEMO.creators.shares.list`, `.min`, `.max` | the wedge (§4.4); the creators poster's resting wedge uses `.max` |

Timing (from `REPLAY`, the old `TOAST` values): opener works 0 to 900 ms; unit k works `startMs + 900` to `endMs + 900`; the cycle ends `holdMs` (2400) after the last land, rests `restMs` (3000), loops. The first item starts `firstAtMs` (2400) into the page's life. The units are contiguous, so exactly one agent works at a time.

Brands cycle (ms): MoonShot 0 to 1805 (opener, "Reading the homepage…"), 1805 to 3414 ("Walking the navigation and the designer index…"); MoonMatch 3414 to 4883; MoonShot 4883 to 6948; MoonWriter 6948 to 9520; MoonShot 9520 to 14410 (three units); MoonScore 14410 to 15922; hold "Whether HeyMoon can guarantee sales" to 18322; rest to 21322. Creators: MoonShot 0 to 3530 (opener + 2 units); MoonMatch 3530 to 5400; MoonWriter 5400 to 7638; MoonMatch 7638 to 9851; MoonScore 9851 to 11948; MoonShot 11948 to 13452; MoonSearch 13452 to 14954; MoonMatch 14954 to 17142; hold "Whether HeyMoon can place you" to 19542; rest to 22542. MoonLive and MoonLearning never appear in any item, so they never work; MoonSearch works only on creators.

### 5.2 The clock (`hero/Agents.tsx`)

- `useTimeline({ endMs: cycleEnd, marks, playing, loopGapMs: REPLAY.restMs })` (`lib/timeline`); everything renders on mark crossings only.
- `playing = armed && !switching && active && uncovered && !typing && !dawning`, where `armed` = `performance.now() ≥ REPLAY.firstAtMs`, `active = useActive(heroRef, { enter: .4, leave: .35 })` (in view, page visible, not paused, not reduced), `uncovered = useUncovered(stageRef)`, `typing = fieldFocus === "hero" || heroFieldHasText`, `dawning = dawn > 0`.
- Switch: exactly the Toasts pattern: the shown audience lags the urgent one; at the switch the label exits in 200 ms and every level goes to `waiting`; 1000 ms later `restart()` and the new queue (the opener first) in one batch.
- Mount: on every viewport while motion is allowed; under reduced motion only on the split layout (static label, §8.1). `next/dynamic(…, { ssr: false })` from Hero. G10 refused (`G10_SIGNED = false` in Hero): no label is rendered; the glints still light (they carry no words). If design also wants the glints still, a `REPLAY_GLINTS = false` flag in `Agents.tsx` keeps them at `idle` except while typing.

### 5.3 Glint levels (written at crossings; `eclipse-api.ts` `LEVEL`)

| State | Level |
|---|---|
| `idle`: first paint, no-JS, before the clock arms | .42 |
| `waiting`: not yet worked this cycle, or never works | .18 |
| `working`: its item covers the clock | 1.0 (+ shimmer in GL) |
| `landed`: worked earlier this cycle | .55 |
| `reduced`: reduced motion (CSS default there) | .55 |
| typing: glint i in ring order, `n` = chars typed | `typingLevel(i, n)` = `.18 + .64·clamp(n − i, 0, 1)` (max .82, never the working level, so MoonLive and MoonLearning never look like they work **[M8]**; one keystroke per glint, as plan item 1 says) |
| dawn | 1.0 (GL forces it) |

Agents sends the seven values and the working index to the renderer (`setAgents`) and, with GL off, to the DOM glint dots over the poster as `--g0` … `--g6` (300 ms opacity transition). It removes those properties on unmount and never writes them under reduced motion **[L2]**. On blur with an empty field the replay resumes where it stopped after 600 ms. After a switch the levels use the new audience's draft length (`els.heroInput.value.length` read in an effect on `audience`; a programmatic value change fires no `input` event).

### 5.4 The bus (`ring.ts`)

*(Superseded by the contract: the handle's optional `setAgents(AgentStates)` and `setTyped(n)` replace the bus, and a stopped loop redraws once on each call. The interface below stays as the reference for what item 1 must carry.)*

```ts
export interface RingBus {
  levels: Float32Array;          // 7, AGENTS order; written by Agents, read by gl every frame
  typed: number; keyAt: number;  // hero field length and performance.now() of the last keystroke (written by Hero's input listener)
  shares: Float32Array | null;   // creators shares as fractions, written once by Agents
  ver: number; bump(): void; on(cb: () => void): () => void;   // a stopped GL loop redraws on bump
}
export function createBus(): RingBus;   // levels filled with LEVEL.idle
```

Hero creates one bus (`useRef`), passes it to `Sky` and `Agents`, and owns the section's `onInput` (React's bubbling `input` from the field; the close field is outside the section): `bus.typed = value.length; bus.keyAt = performance.now(); bus.bump();` plus the spill pulse.

---

## 6. Desktop labels (e), replacing Toasts.tsx

### 6.1 What and where

- Rendered by `Agents` when `G10_SIGNED && useMediaQuery(MQ_SPLIT)`; inside `.stage` in a `.labels` layer (`position: absolute; inset: 0; z-index: 3; pointer-events: none; aria-hidden`) **[H1]**, after the spill, so it sinks with the star. The layer's opacity is `useTransform(heroExit, [0,1], [1, .4])` with `data-lift` and `data-probe-scroll`; `dawn-fade`.
- One label at a time, for the working item. Position in stage-local px, from the stage's own `offsetWidth` S: anchor = `(S/2 + (RING·S + 16)·cos θ, S/2 − (RING·S + 16)·sin θ)`; θ ≥ 0: the box's bottom-start corner at the anchor (opens up and outward); θ < 0: top-start corner (opens down and outward). RTL: mirror x. Re-measure on a ResizeObserver on the stage.
- Markup: `<div data-ring-label data-agent>` → row 1: `<Moon working size={13} className="text-white" />` + `<span className="mono-caps text-white/80">{agent}</span>` (Geist Mono caps through `mono-caps`; /80, not /56, over the lit corona **[H2]**); row 2 (`mt-1.5`): the note, `text-small text-white/88`, `max-width: 176px`, `text-wrap: pretty`, at most 2 lines (measured: all 22 strings fit at 168 px and up).
- Text: working `${note}…`; the opener's note as-is ("Opening yourstore.com"); the last item of the cycle crossfades to its `produces` on landing and holds `holdMs`. No box, no shadow, no backdrop-filter (ruling 6). For contrast the renderer dims the corona and bead under the label's rect (`setLabelRect(toStageRect(labelBox, stageBox))`, `1 − .7·mask`, 12 px soft edge) **[H2]**.

### 6.2 Motion

| Event | Label |
|---|---|
| A new agent starts | `AnimatePresence mode="wait"` keyed by run index: the old exits (opacity 0, x +4 outward, 200 ms `EASE.exit`), then the new enters at its glint (opacity 0 → 1, x −6 → 0 outward, `blur(4px)` → 0, 400 ms `EASE.outExpo`) |
| Same agent, next unit | stays mounted; the note crossfades in one grid cell (200 ms, y 4 px; the old `.swap` pattern) |
| Last unit lands | note → `produces` (the `.swap` crossfade); exits at the hold's end (400 ms) |
| Switch | exits in 200 ms; the new opener enters 1000 ms later |
| Typing, pause, dawn | exits (200 ms); returns with the replay |
| Reduced motion | one static label, 200 ms fade, no loop (§8.1) |

### 6.3 What it replaces

Two toast lanes on the horizon (≥1200) or one lane under the chips (1024 to 1199), boxes, hover-freeze and their geometry (WP1 D1, D3, R2) all go. Unchanged in spirit: the same strings, the same real pace, client-only, aria-hidden, desktop-only, gate G10, frozen when covered, out of view, paused or hidden.

---

## 7. The switch timeline (f) (brands → creators; the reverse mirrors)

| t (ms) | Element | Change |
|---|---|---|
| 0 | state | `select()` as today (URL, title, announcement). Hero sets `data-audience` on the section. |
| 0 to 500 | pill | spring, as today |
| 0 to 320 | H1 out | the shared odometer (globals); in from 200 + 60·i ms, 800 ms |
| 0 to 200 | field icon, placeholder | as today; placeholder retypes 0 to about 1300 |
| 0 to 200 | label | exits; glints fade to `waiting` (300 ms) |
| 0 to 1700 | star (GL) | turns π about its vertical axis toward the thumb, ease-out-quart: **edge-on (a vertical liquid sliver) at about 270 ms**, 90% turned by about 750 ms |
| 145 to 365 | material | slab → liquid while the star is near edge-on |
| 0 to 1100 | dispersion flash | `sin²` envelope |
| 0 to 1200 | tint | `world` 0 → 1 (`[.65,0,.35,1]`): corona, rim, body, glow, spill, glints |
| 0 to 1800 | bead | 100° → 280° through 180° (the field side), ease-out-quart; passes 180° at about 250 ms; light trail behind it |
| 150 to 850 | spill pulse | WAAPI pulse as the bead passes the field side |
| 700 to 1200 | cut wedge | appears with `smoothstep(.6, 1, world)`, opening from the bead; then breathes through the shares |
| 200 to 800 | chips | word blur-in, as today |
| 1000 | replay | creators opener: MoonShot works, its label enters at 70° |
| deferred | sections | as today |

**The poster** *(amended, V3)* (before GL, and in every fallback): the two audiences' posters crossfade in 900 ms by the stage's `data-aud`, and the target shows only once it has loaded. The bead and the wedge change with the image. There is no flip, because a raster cannot tumble. **Reduced motion**: no transition, no flash, no pulse; GL is not running.

---

## 8. Reduced motion, no-JS, no-WebGL, and the fallback (g) *(rewritten for the poster, V3)*

### 8.1 States

| | Default | Reduced motion | No JS | No WebGL / Save-Data / `?sky=css` / give-up / context lost | Paused (nav) |
|---|---|---|---|---|---|
| Star | the poster, then GL taking over on the held resting frame (V14) | the poster, static | the poster | the poster (back at once, with no transition, on a loss) | the poster until the first frame can be drawn; after that, GL's frozen frame |
| Switch | §7 (GL) | the posters cross over with no transition | the links navigate (the other route serves its own poster) | the posters cross over in 900 ms by `[data-aud]`, and the target poster shows only once it has loaded | GL state applied with one redraw (the poster, if GL has not started) |
| Glints (item 1) | replay, typing, dawn | DOM dots at `LEVEL.reduced` | the poster's own (resting) | DOM dots over the poster, replaying | frozen |
| Labels (item 1, split) | replay | one static label (the last unit's `produces`), 200 ms fade | none | replay | hidden |
| Spill and glow (item 2) | bound to focus, pulses | static | static | bound, pulses | static |
| Dawn | as today (§1) | instant navigation | form GET | as today | as today |
| Wedge (item 7) | breathes through the shares | static at `shares.max` | the poster's (`shares.max`) | the poster's | frozen |

### 8.2 Fallback decision: the poster, not the SVG twin (reversed on 5 Oct)

| Measurement (5 Oct) | Poster (a frame of the renderer) | Inline SVG twin |
|---|---|---|
| What the visitor sees before GL | the glass itself, at the pose and lighting GL starts from | a flat cut-out: prototype twin ΔE76 18.9 (brands) / 20.5 (creators) in the star disc; fitted twin 11.9 / 13.2. Mostafa rejected it after the demo |
| Handover | exact: GL draws the same frame and holds it while the poster fades (V14) | a double image is unavoidable: the GL pose is not frontal and refraction cannot be drawn in SVG |
| Bytes | estimated from the fast-track frame: desktop 2240 px AVIF about 16 to 26 kB, phone 960 px about 6 to 10 kB, per audience; only the active audience loads before `load` | 1.4 kB gz in the HTML (7.3 kB raw), counted twice (HTML + RSC payload); deleting it gives those bytes back |
| LCP element | **probably the poster**, on desktop and on phone (448,900 px² against the H1 line's 43,180 at 1440; 110,224 against 12,330 at 390, measured with the 1.28 S box; the 2 S box is larger still). `fetchpriority` cannot change which element is the largest | the H1 |
| LCP time | +316 ms after FCP at 1.6 Mbps / 150 ms RTT and +103 ms at 9 Mbps / 60 ms (desktop, 28.8 kB WebP), +238 / +81 ms at 390 (measured on the probe page, CDP CPU x4). With AVIF and `fetchpriority="high"` the poster is fetched with the CSS and font, ahead of the JS | 0 |

So the poster is the fix, and its cost is bounded: **LCP ≤ 1.8 s** at both profiles, the active audience's AVIF only on the critical path, and the byte caps in §9. SPEC §7.3 says "the LCP element is the H1". The lead must amend that line for the poster, or rule on R13's alternative for phones (item 3). The poster is never lazy-loaded, never faded in, and never placed behind a script, because each of those would reintroduce a moment with no star.

### 8.3 The poster

**Files** (`scripts/hero-poster.cjs`, the GLASS package; names from `eclipse-api.ts`):
- `public/hero/poster-{brands,creators}-{960,2240}.{avif,webp}`, 8 files: `posterSrc(a, band, f)`. Each is `POSTER_BOX · POSTER.stage[band] · POSTER.dpr` px square, a capture at 2x of the renderer's own frame at `REST` with the stage at `POSTER.stage[band]` (240 phone, 560 desktop). The colour inside 0.98 S is the raw drawing buffer, and the alpha ramps to 0 over `POSTER_FEATHER`.
- `public/hero/poster.json`, written last: `{ rendererHash, box, feather, dpr, stage, files: [{ path, width, bytes, sha1 }] }`, where `rendererHash` is the sha1 of `sky/eclipse.ts` + `sky/eclipse-api.ts`. No timestamps.
- The script needs no dev server. It transpiles `eclipse-api.ts` and `eclipse.ts` with the repo's `typescript` and serves them, with a two-line harness page, through Playwright's request routing. The harness is a 2 S canvas with an S stage centred in it, on `NIGHT1`. It calls `mountEclipse(canvas, stage, { audience, capture: { dpr: 2, onFrame } })`, applies the feather in a 2D canvas, and writes a lossless PNG. Python 3 with Pillow (AVIF and WebP, checked by `PIL.features`) encodes the PNG, quality tuned to the §9 caps. Playwright Chromium runs with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. playwright-core resolves from `PLAYWRIGHT_CORE`, then `require.resolve("playwright-core")`, then the npx cache path `shot.cjs` uses. `--check` re-renders and compares without writing anything.

**Component** (`sky/EclipsePoster.tsx`, the STAGE package): two stacked `<picture>` layers inside `.stage` (brands, creators). Each is an absolutely placed box `inset: -50%` (2 S, centred) holding `posterSources(a)`: phone AVIF (`media={PHONE_MQ}`), desktop AVIF, phone WebP, then `<img src={fallback} width={2240} height={2240} alt="" decoding="async">`. The band is chosen by media query, not by srcset width, so a 3x phone still gets the 960 px phone file. The active audience's layer has `fetchPriority="high"` and is in the server HTML. The inactive audience's sources get their `srcSet` only after `load` (or on the first switch, whichever comes first), with `fetchPriority="low"`. Without JS a switch navigates, so the other route serves its own. Visibility comes from CSS on `[data-aud]` and `[data-gl]` (`STAGE_ATTR`, set by EclipseSky): the active layer at opacity 1 and the other at 0 (900 ms crossfade, none under reduced motion). On `data-gl="on"` the whole poster goes `opacity: 0` over `POSTER_FADE_MS`, then `visibility: hidden`. On `"off"` it is visible again at once, with no transition. No dawn fade (parity with the canvas). Under RTL it mirrors only when the GL does (M10).

**Handover** (`sky/EclipseSky.tsx`, STAGE): the chunk import starts at module evaluation (gates: reduced motion, Save-Data, `?sky=css`) and again in the mount effect if needed. It mounts on the next animation frame after hydration, with no `load` or idle wait. Then `onReady` sets `data-on="true"` on the canvas (opacity 1, **no** transition, under the opaque poster) and `data-gl="on"` on the stage in the same commit. `release()` is called on the poster's `transitionend` (or `POSTER_FADE_MS + 80` ms). `onFail`: both flags off at once, so the poster is back.

---

## 9. Performance budgets and how to measure them (h)

| Item | Budget | How |
|---|---|---|
| First load `/brands`, `/creators` | ≤ 160 kB, and **no more than +0.5 kB over the fast track's** (measure it before your first edit) | `npm run measure` (never `next build` into `.next`; stop nothing: measure uses `.next-measure` and a lock) |
| Sky chunk (the chunk holding `uWorld`) | **≤ 12 kB gz**, absent from first load | measure (budget line raised, V12). Expected about 8 to 9.5 kB. *Wave 1: `eclipse.ts` has no `uWorld`, so measure lists it under the lazy site chunks; report its gzip size from `.next-measure/static/chunks` by hand (the chunk containing `precision highp`), ≤ 12 kB* |
| `Agents` chunk + DEMO | inside "lazy site chunks ≤ 110 kB" (today 72.6) | measure |
| CSS that blocks first paint | ≤ 26 kB (today 24.3): the new hero CSS must net ≤ +1.5 kB after deleting the toast rules | measure |
| HTML | ≤ 60 kB (today 19.4 / 22.6). Deleting the SVG twin removes about 1.4 kB gz twice (HTML + RSC payload); the poster markup adds well under 0.5 kB | measure |
| LCP | ≤ 1.8 s at 9 Mbps / 60 ms RTT **and** at 1.6 Mbps / 150 ms RTT, CPU x4, 1440x900 and 390x844, both routes. The element is the H1 or the poster: record which (§8.2, R13) | the probe in A-P2 |
| Poster bytes (per audience) | desktop 2240 px: AVIF ≤ 26 kB, WebP ≤ 40 kB; phone 960 px: AVIF ≤ 10 kB, WebP ≤ 16 kB | `public/hero/poster.json` `bytes` |
| Poster requests before `load` | exactly 1 (the active audience, one format, one width) | the network log |
| CLS | ≤ 0.02, load to bottom | the SPEC's layout-shift probe |
| GPU | ≤ 4 ms/frame at DPR 1.5, tier high, M1 | `?skydebug`: `[sky] gpu … ms/frame` |
| Frame rate | 60 fps steady on iPhone 12-class at tier mid, DPR 1.25 | `?skydebug` window lines show `verdict=keep` for 30 s; no `step` |
| Realtime canvases | 1 | `document.querySelectorAll("canvas").length` |
| Shader compile | no main-thread task over 50 ms from compiling | Performance panel; `KHR_parallel_shader_compile` path |

---

## 10. Acceptance checks (i)

Browser for headless verification: Playwright Chromium with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` (without them headless has no WebGL; see `$SP/wp1v_*.cjs`), against the dev server `localhost:3004` (and `.next-measure` on 3005 for LCP). SwiftShader is slow: GL checks wait for `data-gl="on"` up to 15 s. The lab pages are deleted; check the real routes.

**Static**
- A-S1 `npx tsc --noEmit -p .`, `npx next lint --dir "app/(site)" --dir scripts`, `npm run check:site` (one `<h1`, deny lists), `npm run measure`: all clean, budgets of §9.
- A-S2 `curl -s localhost:3004/brands`: the stage holds the brands poster's `<picture>` with `fetchpriority="high"` and no `<svg>` (the twin is gone: no `ec-corB` id anywhere); the creators route serves the creators poster; the inactive audience's sources have no `srcset` in the HTML; no `data-ring-label` in the HTML. *(The canvas element is server-rendered by the fast track at opacity 0; that stays.)*

**Composition** (A-C, at all seven sizes plus 1024x768, both audiences, scrollY 0, after fonts)
- A-C1 Rects of the switch, `#hero-h1`, `[data-field=hero]`, `[data-chips]`, `.stage` match §3.3 within ±2 px (±1 px for the field). Item 3 adds 390x660, 360x660 and 375x548 **[H3]**.
- A-C2 Split: `|(stage centre y) − (field centre y)| ≤ 0.5`; 64 px ≤ start tip − field end ≤ 120 px **[M11]**; with `data-gl="on"`, a screenshot at each label box shows the label **[H1]**; every label box inside `[0, innerWidth − 24]` and above the sheet top − 8; no label overlaps the copy column.
- A-C3 Stacked: field bottom ≤ sheet top − 8 and sheet top ≤ innerHeight − 40 at 390x844, 360x740, 390x660, 360x660 and 375x548 **[H3]**; at 844x390 the field bottom ≤ 390.
- A-C4 No horizontal scroll (`document.documentElement.scrollWidth === innerWidth`).
- A-C5 The field stays the light's destination: L* sampled 24 px outside the field's end edge ≥ 21 (today's halo) **[M9]** and ≥ the start edge's + 4, at rest, both audiences, split; both + 6 on focus. (Initial thresholds: the old halo gave L* about 21 at the field; the lead may retune them once, from the first build's captures.)
- A-C6 Contrast: chip text ≥ 4.5:1 against the spill's lit background (sample the background beside each chip, stacked layouts); label notes **and names** ≥ 4.5:1 on the GL render, both audiences, at rest, at focus 1 and during the intro flare **[H2]**.

**Performance probes** (A-P)
- A-P1 measure table within §9.
- A-P2 LCP, on 3005: `new PerformanceObserver(l => { const e = l.getEntries().at(-1); console.log(e.startTime, e.element?.closest("#hero-h1") !== null); }).observe({ type: "largest-contentful-paint", buffered: true })` → startTime ≤ 1800 ms at both §9 network profiles, at 1440x900 and 390x844, both routes; log whether the element is inside `#hero-h1` or is the poster `<img>`, and the FCP to LCP gap (≤ 350 ms when the poster is the element). *(Was: `true` within 150 ms of FCP. With the poster that cannot hold; the lead rules, R13.)*
- A-P3 CLS ≤ 0.02 from load to the bottom of the page.
- A-P4 `canvas.width / canvas.clientWidth` ≤ 1.5 desktop, ≤ 1.25 at 390; `canvas.clientWidth ≈ 1.6 × stage.offsetWidth`.
- A-P5 `?sky=soft&skydebug&tier=high` on SwiftShader (`?sky=soft` drops `failIfMajorPerformanceCaveat` but keeps the give-up **[L3]**): the log shows `step` lines down the ladder, then `gave up`; `data-gl="off"`; the canvas is removed; no console errors.

**GL lifecycle** (A-G)
- A-G1 Desktop Chrome on real hardware: `.stage[data-gl="on"]` within 4 s (R4).
- A-G2 `__sky.running` false once the sheet covers the aura box (390x844: from scrollY 391, aura top 412.6 against the sheet's 804; 1440x900: from scrollY 686, aura top 150 against 836) and in a hidden tab; true again on return.
- A-G3 `loseContext()` shows the poster at once with no errors (A-F7); `restoreContext()` fades the canvas back (item 5).
- A-G4 Paused (nav): one frozen frame; a switch while paused re-tints and redraws once; a submit while paused still turns the hero `#F6F4FC`.

**Agents and labels** (A-A, timings ±150 ms; the dev server adds latency)
- A-A1 A MutationObserver log over one full cycle on `/brands` and `/creators` at 1440: the label sequence and texts equal §5.1 (agent names, `${note}…`, the final `produces`), first text "Opening yourstore.com" / "Opening @yourhandle" at about 2.4 s; never more than one `[data-ring-label]` in the DOM.
- A-A2 The working glint and the label agree: at every crossing, `getComputedStyle(stage).getPropertyValue("--g" + i) === "1"` for the label's agent and no other.
- A-A3 MoonLive and MoonLearning are never labelled and their `--g` never exceeds .18 during the replay; MoonSearch is labelled only on creators.
- A-A4 At 390 and 768: no `[data-ring-label]`, glints still change.
- A-A5 Typing 7 characters: label gone within 250 ms, all seven glints at `LEVEL.typingMax` (.82), none with spikes **[M8]**; blur with an empty field: replay resumes within 1 s.
- A-A6 `G10_SIGNED = false`: no label DOM at any size; glints still light.
- A-A7 Glint visibility, from a 2x screenshot at `glintPoint()`: peak L* at `waiting` ≥ the rim's L* at the same radius 6° away + 15 **[L13]**; at `working` ≥ 85.

**Switch and submit** (A-W; scrub with `document.getAnimations()` paused for CSS, `?skydebug` exposes `__sky` for GL)
- A-W1 Frames at 0, 150, 270, 400, 700, 1100, 1800 ms (brands → creators and back, 1440 and 390): edge-on near 270 ms (silhouette width ≤ 15% of S), liquid material by 400 ms, the bead passes the field side and lands at 280°; the wedge present in creators only; one h1 throughout. Reviewer compares with `$SP/herov2/cap/sheet-flip.png` (bottom row = the target).
- A-W2 Submit (valid, 1440): at t = 0 all seven glints at 1; `__sky.comet` goes 0 → 1 within 360 ms; `location.assign` at 450 ms (as today). Reduced motion: no comet, instant navigation.

**Material** (A-M)
- A-M1 Creators at rest, a 2x stage capture: no balloon (tip extent ≥ 0.415 S on all four tips, `tipcheck.py` reports `tip_r`) and it still reads as the four-point glyph.
- A-M2 No dark caps: `python3 $SP/herov2/tipcheck.py <capture>` reports `min ≥ corona` on all four tips, both audiences, at rest and in the A-W1 frames (before: 12 to 15 against 21 to 34 on creators; after: 32 to 52 against 20 to 34).

**Fallback: the poster and the handover** (A-F, *rewritten for wave 1*)
- A-F1 Poster parity (GLASS, no dev server): `node scripts/hero-poster.cjs --check` renders each audience and band again at DPR 1, 1.5 and 2. It decodes the committed AVIF and WebP, resamples them to the same size, and compares inside the 0.98 S disc: mean ΔE76 ≤ 1.5, p99 ≤ 6, mean L\* difference ≤ 0.5, and the bright-pixel centroid (L\* > 60) within 0.5 CSS px. Outside 0.98 S every pixel of the live frame is `NIGHT1` ±1. `poster.json` `rendererHash` equals the current sources.
- A-F2 Held frame (GLASS): with the hold on, frames 1, 2 and 10 after `onReady` are bit-identical to frame 0 (readPixels hash), and after `release()` the first 300 ms move the bright centroid by ≤ 1 px.
- A-F3 Handover on the page (STAGE): on `/brands` and `/creators` at 1440x900 and 390x844 (SwiftShader), screenshots at 0, 100, 300, 600, 1000 and 2000 ms after `load`, plus frames at the `data-gl` flip −1 frame, +0, +120, +240 and +400 ms. In every frame the stage shows the glass star (ΔE76 ≤ 3 against the poster or the following GL frame in the 2 S box). There is never a flat SVG, never an empty stage after `load`, and never a second silhouette. The background outside the box is (1, 3, 23) ±1 throughout. Put the frames side by side in a contact sheet and read them.
- A-F4 Reduced motion (`--rm`): no WebGL context is ever created (`HTMLCanvasElement.prototype.getContext` spy), the poster is static, and a switch shows the creators poster with no transition.
- A-F5 No-JS (`javaScriptEnabled: false`): each route shows its own poster; the form submits by GET.
- A-F6 `?sky=css` and Save-Data: poster only, no context. A switch crosses to the other audience's poster in 900 ms and back, never through an empty stage (if the target has not loaded, the current one stays until it has).
- A-F7 Context loss: `WEBGL_lose_context.loseContext()` after the handover brings the poster back in the next frame, with no console errors and no black hero.
- A-F8 The early start: in a Performance trace of `/brands` at 1440 (CPU x4), the eclipse chunk request starts before `load`, and no main-thread task over 50 ms comes from the shader compile (`KHR_parallel_shader_compile` path).

**Unchanged** (A-U)
- A-U1 The close and the footer: screenshots at 1440 and 390, both audiences, pixel-identical to before the package. Capture the baseline before your first edit; **never `git stash`**, because other packages are editing the tree.
- A-U2 Below-the-fold sections, the nav (including its night-glass split over the hero), the promo launcher: no regressions on a full-page tour.
- A-U3 Wave 1 keeps every hero behaviour (plan item 8): the heroExit fade and dim as the sheet lifts (peek 64 / 40), dawn on submit then `location.assign` to `/brands/c?read=…` / `/creators/c?h=%40…`, the nav pause (no frames while paused; a switch while paused applies at once), page visibility, the typed placeholder, the switch in hero, nav and close, reduced motion, no-JS. Copy verbatim; `npm run check:site` clean.

---

## 11. Risks (j)

| # | Risk | Mitigation / owner |
|---|---|---|
| R1 | GPU cost on mid Android and older iPhones is unmeasured: every number here comes from SwiftShader. | Tiers start at mid on phones; the watchdog steps tier before DPR; the aura box cuts pixels 43% (desktop) to 62% (phone). Device pass (Pixel 6a, iPhone 12, Windows ANGLE/D3D, iOS Low Power) before release. |
| R2 | Shader compile stalls on mobile (three tiers). | Compile one tier; precompile the next in idle with `KHR_parallel_shader_compile`. |
| R3 | *(closed by V3)* The fitted twin could not reach the render; Mostafa rejected the twin's look. | The poster replaces it (§8). |
| R4 | Lineage: judges read glass AI-sparkle + eclipse as Vercel-adjacent and generic. | The agent glints, labels, wedge and the field-bound light carry the product story; that is the lead's response, not this package's to reopen. |
| R5 | G7 (b) was signed for the horizon's halo; the light is now the field glow + spill + the eclipse corona. | Re-sign G7 (b) for the new light; G10 now covers the ring labels. Both for Mostafa and design. |
| R6 | Tall content (a narrow split window, a long H1) pushes the field row below `--axis`; the star moves with it but is sized for `--axis`. | Checked at the listed sizes (A-C); outside them the star may run under the peek. Accepted. |
| R7 | `100vw` includes classic scrollbars (Windows): the nav already has the same offset. | Consistent with the nav; the labels' 24 px margin absorbs 17 px scrollbars. |
| R8 | The CSS budget has 1.7 kB of headroom. | Delete the toast/lane rules first (minus the M7 keep list); the poster needs only a handful of rules. |
| R9 | Passing a Server Component through `Landing` changes a contract and the pages. | Small and explicit (§2); `check:site` and measure confirm the routes stay static (○). |
| R10 | Labels next to a moving star are busier than the old toasts. | One label at a time, all on the outer side, `mode="wait"`; design review on A-A1's recording. |
| R11 | Container query units (`cqw`): Safari 16+, Chrome 105+, Firefox 110+. | Below that the split's `--sw` is invalid and `--stage` falls back to 200 px through `max()`; acceptable. |
| R12 | Headless verification cannot prove 60 fps or the 4 s `data-gl` time (WP1 R4 again). | Real-device checks listed in A-G1 and §9 are the release gate. |
| R13 | The poster is probably the LCP element (desktop and phone), and SPEC §7.3 says "the LCP element is the H1"; plan item 3 also asks for the H1 on phones. | Wave 1 holds LCP ≤ 1.8 s at both profiles with one high-priority AVIF and reports the element. The lead rules: either amend SPEC §7.3 to "LCP ≤ 1.8 s, element H1 or the hero poster", or (phones, item 3) draw the poster into a 2D canvas from a tiny inline script, which is not an LCP candidate, with a `<noscript>` `<img>`, at the cost of a pre-hydration script. |
| R14 | Stale posters: any change to the resting frame (shader, REST, bead, material, wedge, stage size) silently breaks the handover. | `poster.json` `rendererHash`; `node scripts/hero-poster.cjs --check` (A-F1) before every commit that touches `sky/eclipse.ts` or `sky/eclipse-api.ts`. |
| R15 | `LIGHT_FADE` trims the bead-side haze beyond 0.80 S (today +6 to +12 levels between 0.8 and 1.0 S, fading out by about 1.6 S). | GLASS delivers a before/after pair at 1440. If the lead sees the loss, `POSTER_BOX` 2.4 and `LIGHT_FADE` [0.96, 1.18] are the next step (2688 px desktop file); only the contract changes, and the script re-runs. |
| R16 | The background moves from rgb(6, 9, 21) to `--night-1` (1, 3, 23) inside the hero once GL is on: the fast-track hero gets slightly deeper. | Intended: it is the page's night everywhere else, and it makes the poster box invisible. |

---

---

## 12. The shared contract and the wave-1 packages

### 12.1 `app/(site)/_site/sky/eclipse-api.ts`

The lead owns this file, and no package edits it. If a package needs a change, it stops and reports.

| Export | What | Used by |
|---|---|---|
| `CAM`, `TIP`, `RING`, `ARM_HALF_DEG` | The prototype camera and the on-screen geometry, in S | renderer; DOM glints and labels (item 1) |
| `NIGHT1`, `LIGHT_FADE` | The exact background; light × (1 − smoothstep(.80, .98, r/S)) | renderer, poster script |
| `swayAt(t)`, `REST`, `BEAD_REST_RAD` | The resting frame (pose = `swayAt(0)`, intro 1, glare −1.3, time 0, bead per audience) | renderer (first frame, capture), poster script |
| `POSTER_FADE_MS`, `RELEASE_FALLBACK_MS`, `SWAY_IN_S` | The handover timing (V14) | renderer, EclipseSky, EclipsePoster CSS |
| `POSTER_BOX`, `POSTER_FEATHER`, `POSTER`, `posterWidth`, `posterSrc`, `posterSources` | Poster geometry, file names, and the ordered `<picture>` sources (band by media query) | poster script, EclipsePoster |
| `CaptureFrame`, `CaptureOptions` | The renderer's capture mode | renderer, poster script |
| `STAGE_ATTR`, `PHONE_MQ`, `DPR_CAP` | The stage's DOM attributes (`data-aud`, `data-gl`), the eclipse phone breakpoint, the DPR caps | EclipseSky, EclipsePoster, renderer |
| `AGENT_ORDER`, `GLINT_DEG`, `NEVER_WORKS`, `glintPoint`, `glintUv`, `LABEL`, `labelAnchor`, `LEVEL`, `typingLevel`, `AgentStates` | Item 1 (reserved) | renderer, Agents, labels |
| `CUT`, `CutRange` | Item 7 (reserved) | renderer, EclipseSky |
| `RelRect`, `toStageRect` | Items 1 and 2 (reserved): field and label rects in stage units | renderer, Hero/EclipseSky |
| `TierName`, `Tier`, `TIERS`, `TIER_LADDER`, `initialTier` | Item 5 (reserved) | renderer |
| `EclipseOptions`, `EclipseHandle` | The renderer's API. The fast track's seven methods are kept. `release()` is new and required (wave 1); `setAgents`, `setTyped`, `setCut`, `setFieldRect`, `setLabelRect` and `setTier` are optional until their wave lands. `setAudience` jumps when its loop is not running **[H4]** | EclipseSky |

### 12.2 Who owns what in wave 1 (disjoint)

| Package | Owns | Never touches |
|---|---|---|
| GLASS | `sky/eclipse.ts`, `scripts/hero-poster.cjs`, `public/hero/**` | everything else, `eclipse-api.ts` included |
| STAGE | `sky/EclipseSky.tsx`, `sky/eclipse.module.css`, new `sky/EclipsePoster.tsx` (and its `sky/poster.module.css` if wanted), `hero/Hero.tsx` and `hero/hero.module.css` only where the poster needs it (no layout changes) | everything else, `eclipse-api.ts` included |

The handoff is one way: GLASS writes `public/hero/poster.json` last, and STAGE's handover checks wait for that file and for its `rendererHash` to equal the sha1 of the current `eclipse.ts` + `eclipse-api.ts`. The lead commits; packages never commit.

---

## Appendix: evidence in `$SP/herov2/`

| File | What |
|---|---|
| `m_text.mjs`, `m_text.json` | H1 line, chip, note and name widths with Geist on the dev server, today's hero rects at eight sizes |
| `m_wrap.mjs` | label note line counts at 160 to 192 px (`text-small` fits 2 lines from 168) |
| `model.py` | the §3.3 split numbers from the §3.2 formulas |
| `proto.html` | the prototype plus hooks: `?dpr=`, `?t=`, `?front=1`, `?flip=`, `?soft=`, `?audv=`, `?bead=`, `window.__frames` |
| `proto2.html`, `proto4.html` | material v2 (creators constants, TIR fallback, thin-glass blend, IOR, rim), `?yflip=1`; v4 adds the continuous SDF and soft fold (§4.3) |
| `cap/sheet-desk.png`, `cap/sheet-fit.png` | GL against the prototype twin and the corona-fitted twin |
| `cap/sheet-mat4.png` | top: v4 at rest and mid-turn; below: creators tips, prototype (dark caps) against v4 (none) |
| `cap/tips-cmp.png` | creators tips, prototype against v2: the shading fixes alone leave the caps, so the SDF branch was the cause |
| `cap/sheet-flip.png` | diagonal (top) against vertical (bottom) tumble, five phases |
| `cap/poster-*.png`, `poster-*.webp`, `lcp-*.html`, `m_lcp.mjs` | the poster bytes and the LCP probe |
| `de.py`, `tipcheck.py`, `corona-profile.json` | the ΔE and dark-cap checks, the GL corona profile |
| `cdp-gl.mjs` | the CDP driver with SwiftShader flags (`node cdp-gl.mjs ./script.mjs`) |
| `$SP/arch-hv2/b1440-0.png`, `b1440-1.png` | the fast track at 1440x900: the flat SVG twin at first paint (mid-crossfade), then the GL star |
| `$SP/arch-hv2/css1440.png`, `p390-1.png` | `?sky=css` (background exactly (1, 3, 23)); the phone at 390x844 (stage 236 px at 77, 115) |
| `$SP/arch-hv2/HERO-V2.before.md` | this file before the 5 Oct revision |
