# HERO-V2: Eclipse Glass, the build brief

5 Oct 2026. Lead architect. One engineer, one package: replace the hero's visual and layout on `/brands` and `/creators` with the "Eclipse Glass" sculpture Mostafa chose, changed as the lead ruled after the three judges' critiques. Nothing else on the page changes. The close (its CSS horizon included) and the footer stay exactly as they are.

**Read first, in this order:** this file; `app/(site)/_site/hero/*`, `sky/*`, `shell/Field.tsx`, `shell/Lift.tsx`, `lib/lift.tsx`, `lib/audience.tsx`, `lib/prefs.ts`, `lib/signals.ts`, `lib/timeline.ts`, `data/types.ts`, `data/demo.json` (the current code, not the SPEC's copy of it; files are being edited by other packages, so read them fresh); the prototype `$SP/hero-concepts/sculpture/index.html`; SPEC §0, §2.4, §5.9, §6.3, §6.5, §7.1 to §7.3 (grep, do not read whole).

`$SP` = `/private/tmp/claude-501/-Users-mostafaaelnagar-Documents-moontech/d50da6c8-1e72-439f-9d55-d7ba5aef42c4/scratchpad`. Every measurement in this file was taken there on 5 Oct; the scripts and images are in `$SP/herov2/` and `$SP/herov2/cap/` (listed in the Appendix).

**Precedence.** INPUTS, then RESEARCH §5, then this file for the hero, then SPEC. This file supersedes SPEC §5.1 (all of it), the hero rows of §1.3 (S1, S2), §1.4, §1.5 B1 and the Sky and Toasts rows of §5.9. The lead folds it into the SPEC after the build. Do not edit SPEC.md.

---

## 0. Rulings for this package

| # | Ruling | Why |
|---|---|---|
| V1 | **Split at `(min-width: 1024px) and (min-height: 521px) and (min-aspect-ratio: 1/1)`**: copy on the inline-start, the sculpture on the inline-end. Below that (phones, tablets, portrait iPads): **stacked, the sculpture below the chips**. Short screens (`max-height: 520px`) at 640 wide or more: a compact split with no labels. | The judges: "on phone the star pushes the H1 and field down" and "the hero turns into a logo above a form". Below the chips the star never moves the field (at 390x844 the field rises from y 407 today to 345). 1024 is gate G10's line, so labels exist exactly where the split exists. |
| V2 | **The field row is the star's axis.** The stage sits in the field's grid row, centred on it (the same trick as ruling 21 for the horizon). The star's inline-start tip points straight at the field's end edge; on stacked layouts its top tip points up at the field. | The light can only bend toward the field if the geometry guarantees where the field is. Layout and light can never disagree. On desktop the field also stays where it is today (1440x900: 180, 531.7, 580 x 76; today 430, 532). |
| V3 | **The fallback is an improved inline SVG twin, rendered by a Server Component.** No poster. | Measured (§8.2): a poster becomes the LCP element in every run, at every size, and adds 14 to 29 kB per audience to the critical path. Inline SVG is never an LCP candidate and, as a Server Component, costs 0 bytes of first-load JS. |
| V4 | **The canvas covers only the aura box** (1.6 S square centred on the star, S = stage side), opaque, and its edges are exactly night (`#010317`). | Prototype: a full-hero canvas, 2.79 M device px at 1440x900 and DPR 1.5. Aura box: 1.58 M at 1440, 0.27 M at 390x844 (DPR 1.25). The edge rule makes the box invisible. |
| V5 | **Seven glints on the ring's inline-end half** (70, 52, 34, 16, −20, −40, −60 degrees, AGENTS order clockwise from the top). Labels open outward to the inline-end, away from the copy. | Measured room: labels on the inline-start half collide with the H1 and field at every split size. An evenly spaced 7-glint ring always puts one glint within 6.4 degrees of an arm (the arms cover about ±8 degrees of the ring), so no even spacing is clean. |
| V6 | **The bead rests at the top (100°, brands) and the bottom (280°, creators) and travels half the rim through the field side** (via 180°). The creators "cut" wedge opens from the bead into the empty lower-start notch. | Half the rim, as grafted, without ever entering the glints' half; and mid-switch the bead's light passes the field. |
| V7 | **The switch tumbles the star around its vertical axis, not the diagonal.** The material changes only while the star is near edge-on. | Measured frames (Appendix, `cap/sheet-flip.png`; A-W1): the diagonal tumble is what reads as crumpled plastic; the vertical tumble reads as a coin turning, with a clean liquid sliver at edge-on. |
| V8 | **Continuous star SDF** `smax(RR − length(p − C), (p.x + p.y − 1)/√2, k)` with a soft fold. | The prototype's branch in `star2()` is discontinuous at its branch line; that line is the straight edge of every "dark cap" (§4.3; numbers in A-M2). |
| V9 | **Hero no longer imports `Horizon`.** `Horizon.tsx` and every `.hz` rule stay for the close, untouched, except the one hero-only rule `.hz[data-gl="on"] …`, which is deleted. | Keep the close exactly as it is. |
| V10 | **Three quality tiers** chosen at init and stepped by the watchdog together with DPR, then the twin. DPR cap 1.5 desktop, 1.25 phone (`MQ.phone`). | Lead requirement 5. |
| V11 | **One agent clock** in a lazy `Agents` component (all viewports while motion is allowed). It writes glint levels to a tiny shared bus that the shader reads and to CSS variables that the twin reads; on the split layout it also renders the label. | Labels and glints can never drift, and the twin's glints light in turn even when WebGL is missing. |
| V12 | The sky chunk budget in `scripts/measure.cjs` becomes **12 kB** (from 8). | Lead requirement 5 ("about 12 kB gz or less"). |

---

## 1. Behaviours today, and what each becomes

| Behaviour today | Where | Becomes |
|---|---|---|
| CSS sky is first paint and fallback; GL crossfades in | `Horizon` + `.hz` layers, `sky/gl.ts` | The SVG twin (`hero/Still.tsx`) is first paint and fallback; GL crossfades over it in 700 ms, then the twin is hidden (`.stage[data-gl="on"]`). |
| Lazy GL: `load` + `requestIdleCallback(…, {timeout: 2000})` (200 ms fallback) then `import("./gl")` | `sky/Sky.tsx` | Same. Same gates: reduced motion, Save-Data, `?sky=css`, the user's pause (start on resume, WP1 D4). |
| CSS ignition at 400 ms (1.6 s expo); GL reads its clock | `.hz[data-ignite]`, `uIgnite` | The twin's corona and ring ignite (opacity .35 → 1, 1.6 s `--ease-out-expo`, 400 ms delay, no-preference only); GL reads that animation's `currentTime` as `uIntro`. |
| `world` 0 brands / 1 creators tints the light over 1.2 s | `Horizon` Tints, `uWorld` | GL `uWorld`; the field glow and spill tints are `useTransform(world)` opacities; the twin crossfades by `data-audience` (CSS, 1.2 s, the same curve). |
| `heroExit`: content opacity 1 → .4, y 0 → −40; dim 0 → .55; horizon sinks 120 / 80 px | `Hero.tsx` | Content and dim unchanged. The stage cell sinks 120 / 80 px (`SKY.sinkPx`) and the labels fade 1 → .4. GL dims its light by `1 − .4·heroExit`. All single array-in/array-out `useTransform`s with `data-lift` and `data-probe-scroll`. |
| Sheet peeks 64 px (40 phone), JS drops it near the chips | `Lift.tsx` | Unchanged. The stage size reads only the CSS `--peek-want`, never the JS `--peek`, so a dropped peek never resizes the star (no CLS). |
| Dawn on submit: `.hz-dawn` fades in, canvas `1 − dawn`, root turns `#F6F4FC`, 450 ms then `location.assign` | `Field`, `audience.tsx`, `Horizon` | The hero gets its own dawn layer (`.dawn`, `opacity: dawn`). Canvas host `1 − dawn`. On the dawn's first change GL lights all seven glints and runs the comet once round the ring in 360 ms. Navigation timing unchanged (450 ms). |
| Pause (nav) and page visibility | `playback.tsx`, `gl.ts` `sync()` | Same rules: frozen frame, single redraws on state changes (WP1 D5). Labels hidden while paused; glints frozen. |
| DPR watchdog (1.5 → 1.0 → .75, capped-30 lock, give-up) | `sky/watchdog.ts` | A two-axis ladder: tier and DPR (§4.8). |
| Context loss: CSS sky at once; restore ≤ 2 | `gl.ts` | Same, the twin shows at once. |
| Desktop-only toasts (G10), next/dynamic, ≥1024 | `hero/Toasts.tsx` | **Deleted.** Replaced by the ring labels in `hero/Agents.tsx` (§5, §6). Same G10 constant, same pace, same verbatim strings. |
| Typed placeholder, per-audience drafts, invalid ring, error | `shell/Field.tsx` | Unchanged. The hero listens to the field's `input` events (they bubble) for the glints and the spill pulse. |
| Reduced motion: static, no canvas | everywhere | Static twin, glints all at "landed", one static label on the split layout (§8.1). |
| No-JS | everywhere | The twin (with the CSS ignition), the GET form, the switch links. No canvas, no labels. |

---

## 2. File plan (a)

Paths are under `app/(site)/_site/` unless they start with `app/` or `scripts/`.

| File | Action | What |
|---|---|---|
| `hero/Hero.tsx` | **Rewrite** | `data-audience={audience}` on the section (the twin's CSS reads it; the server renders the route's audience). Layout (§3), the light layers, the stage cell, `<Sky>`, the dawn layer, the lift bindings, the `input` listener, the bus, the dynamic `Agents`. Props: `HeroProps { still?: ReactNode }`. No `Horizon`, no `Toasts`. |
| `hero/hero.module.css` | **Rewrite** | The §3 layout, the glow, the spill, the twin's CSS (ignition, audience crossfade, bead rotation, glint vars), the labels. Delete every toast and lane rule. §2.3 variables only, no `@apply`/`theme()`. |
| `hero/Still.tsx` | **New, Server Component** (no `"use client"`) | The SVG twin (§8.3). Imports `ring.ts` constants and `DEMO` (server side only, for the wedge's share). |
| `hero/ring.ts` | **New**, tiny, no React, no DEMO | Geometry constants, glint angles, bead angles, level values, label metrics, `MQ_SPLIT`, and `createBus()` (§5.4). Imported by Hero (first load), Still (server), Agents and gl (lazy). Must not contain the string `uWorld` (measure's first-load deny). |
| `hero/Agents.tsx` | **New**, lazy (`next/dynamic`, `ssr: false`) | The agent clock, glint levels (bus + CSS vars), typing mode, and on the split layout the label. Imports `DEMO`. |
| `hero/Headline.tsx` | **Edit** | Line-set classes `s.lines2` (the `desktop` set) and `s.lines3` (the `phone` set) instead of `hidden sm:block` / `sm:hidden`; alignment from the module class, not `text-center`. Copy unchanged. |
| `hero/Chips.tsx` | **Edit** | Drop `justify-center` and `px-4` from its own class list; the hero's `.chips` class sets alignment and padding per layout. |
| `hero/Toasts.tsx` | **Delete** | Replaced by `Agents.tsx`. |
| `sky/Sky.tsx` | **Edit** | Same loader and gates. Renders the canvas host inside the aura box. Passes `stage`, `hero`, `sheet` elements, the bus, `audience`, and the flags to `startSky`; calls `handle.audience(a, animate)` on every audience change. |
| `sky/gl.ts` | **Rewrite** | Lifecycle (§4.7), measurement from the stage's DOM box, the choreography state (§4.5), tiers (§4.6), observers, context loss, debug. Exports `startSky(host, stage, inputs)` (a `SkyHandle`, or null when it stays on the twin) and `SkyHandle { destroy(); audience(a, animate) }`. |
| `sky/shader.ts` | **Rewrite** | The port (§4). Keeps `VERT1/VERT2/HEAD1/HEAD2`, ships GLSL without comments as joined literals, keeps the uniform name `uWorld` (measure finds the sky chunk by it). |
| `sky/watchdog.ts` | **Edit** | Ladder of `{tier, dpr}` steps instead of DPR levels (§4.8). |
| `shell/Horizon.tsx` | **Unchanged** | Used by the close only. `HorizonProps.variant` keeps `"hero"` in its type; harmless. |
| `shell/Field.tsx`, `shell/Lift.tsx`, `lib/*` | **Unchanged** | No new signals. The hero reads `fieldFocus` and `heroFieldHasText` (existing). |
| `tokens.ts` | **Edit** | `TOAST` → `REPLAY = { openerMs: 900, holdMs: 2400, restMs: 3000, firstAtMs: 2400 }` (same values; `inMs`/`outMs`/`minWidth` go). `SKY` becomes `{ dprCap: { desktop: 1.5, phone: 1.25 }, maxPixels: 1.6e6, fpsFloor: 55.5, giveUpFps: 40, skipFrames: 30, sampleFrames: 50, capped33Ms: [31.3, 35.3], maxRestores: 2, sinkPx: { desktop: 120, phone: 80 }, pointerLerp: 0.06, igniteDelayMs: 400, igniteMs: 1600, canvasFadeMs: 700 }` (`dprLevels`, `limbRadiusVw`, `pointerPx` go). Grep for importers after the change. |
| `contracts.ts` | **Edit** | `export interface HeroProps { still?: ReactNode }` (lead change to the §4.3 contract). |
| `Landing.tsx` | **Edit** | `Landing({ initial, still }: { initial: Audience; still?: ReactNode })`, passes `<Hero still={still} />`. Nothing else. |
| `app/(site)/brands/page.tsx`, `app/(site)/creators/page.tsx` | **Edit** | `<Landing initial="…" still={<Still />} />` (import from `../_site/hero/Still`). The pages stay static (○). |
| `app/(site)/globals.css` | **Edit, one rule** | Delete `.hz[data-gl="on"] > :not(.hz-dawn) { visibility: hidden; }` (hero-only). Every other `.hz` rule stays for the close. Add nothing (hero rules live in the module). |
| `scripts/measure.cjs` | **Edit, one line** | `sky: 12 * KB` and its comment. |
| `copy.ts`, `data/*`, `scripts/bind-demo.*` | **Unchanged** | Every string the hero shows is already there. |

---

## 3. Composition (b)

### 3.1 Geometry constants (all in `ring.ts`, shared by CSS comments, Still, Agents and the shader)

The prototype's camera (CZ 7, scale 1.12, eclipse plane at DZ 3.2, ring RM 1.08) fixes these ratios to the stage side S (the stage is an S x S DOM box; the star's centre is its centre):

| Constant | Value | Meaning |
|---|---|---|
| `TIP` | 0.4464 S | tip distance from the centre (`uv = 1/1.12`, half of S) |
| `RING` | 0.3309 S | eclipse ring radius (`1.08·7/(1.12·10.2)`, half of S) |
| `AURA` | 1.6 S | canvas and twin box, centred on the stage; all light is zero beyond 0.78 S |
| Twin units | viewBox `-240 -240 480 480`, 300 units = S | tip 134, ring 99.3 (the prototype's own numbers) |
| `GLINTS` (deg, CCW from the inline-end axis) | MoonShot 70, MoonMatch 52, MoonSearch 34, MoonWriter 16, MoonLive −20, MoonScore −40, MoonLearning −60 | AGENTS order, clockwise from the top; all clear of the arms (±8°) by 8° or more |
| `BEAD` | brands 100°, creators 280° | beside the top and bottom arms, never in the glints' half |
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
.aura     { position: absolute; inset: -30%; }          /* 1.6 S, centred: the twin and the canvas host live here */
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
- z-order: stage cell 1 (twin, canvas, spill, labels), glow 2, dawn 3, content 4, dim overlay 5 (was `z-[3]`, becomes `z-[5]`).
- If the top row's content is taller than `--axis − 38` (a narrow window with a long H1), the field row moves down and the stage moves with it; its size still uses `--axis`. Accepted (R6).

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

Phones shorter than about 700 px overflow the stack: `safe center` then starts it at the top padding. iPhone SE (375x667): S 220, field 307 to 371 (fully visible), the star's lower tip about 34 px under the 40 px peek. Accepted.

### 3.4 The light layers (CSS, in every mode, before and without GL)

**Glow behind the field** (D3 spend 1, "the existing glow behind the field stays"): `.glow` holds two tint layers (brands, creators) with opacities `useTransform(world, [0,1], [1,0])` / `[0,1]`, centred on the field box (split: `inset-inline-start: calc(min(580px, 100%) / 2)`, translate −50%; stacked: centred). Each tint is the current `.hz-halo` ramp verbatim (the eleven `A·(1 − t²)²` samples, `radial-gradient(38% 50% at 50% 50%, …)`), on a box of field width x 1.5 by 240 px (180 phone), plus a core ellipse (90% of the field width by 90 px) of `rgb(255 255 255 / .30)` → tint `.20` at 40% → 0. No `filter: blur` (paint cost). The whole `.glow` has `opacity: useTransform(focus, [0,1], [.78, 1])` and `dawn-fade`.

**Spill (the star's light bending to the field).** A child of `.stage` (so it sinks with the star, above the canvas):
- Split and short: right edge at the start tip plus 0.02 S, left edge 40 px under the field's end (`width: calc(gap + 40px + .02 S)`), height `max(120px, .34 S)`, centred on the axis. Two layers per tint: a streak `radial-gradient(60% 14% at 100% 50%, white .55, tint .35 at 30%, transparent)` brightest at the tip, and a pool `radial-gradient(closest-side at 0% 50%, tint .30, transparent)` landing on the field's end.
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

Never call `pow` on a base that can be negative (ANGLE/D3D and Metal return NaN): every `pow` takes `max(x, 0.)` or a `clamp`.

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
| `uIntro` | float | `B.z` | the twin ignition clock, eased with `--ease-out-expo`; 1 when there is no animation |
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

- **Corona** as the prototype, plus: every term × `1 − smoothstep(1.2, 1.56, length(uv))` (uv: 1 = S/2), so all light is exactly zero inside the aura box's inscribed circle edge. Streamer noise: 2 octaves (high, mid), 1 (low).
- **Bead**: at `uBead` on the ring. Flare `exp(−db·22.)·1.1` (was 14: smaller, so MoonShot's glint 30° away stays distinct); spikes in screen space with e-fold 0.04 S (`L = 1/(.08·uStage.z)`).
- **Cut wedge** (creators): φ = `atan(q.y, q.x)`; in the wedge when `mod(uBead − φ, 6.2831853) < uCut.y·6.2831853` (it opens clockwise from the bead, into the lower-start notch). Inside: an annulus from 0.96 to 1.12 ring radii of `PINK`, soft 1.5 px edges, × `uCut.x · .9`, and the rim there takes `PINK` at 1.4× its brightness. `uCut.y` steps through `DEMO.creators.shares.list` (the 16 live shares, 10 to 16) one value per 1.6 s with an ease-in-out between, looping; before the bus has the list, `shares.max / 100`. No number anywhere.
- **Comet**: head angle `uBead − uComet·6.2831853` (clockwise: it passes the seven glints first, then the field side); the prototype's sweep and head terms with `sin(π·uComet)` envelope.
- **Glints** (screen space, drawn after the glass so they are always visible): for each i, `g = vec2(cos, sin)(uGlintA[i]) · .6618` (ring radius in uv), `d` in CSS px; core `smoothstep(2.2, .6, d)·(.25 + .75·lvl)·1.6` (white), halo `lvl²·.9·exp(−d/5.)` (tint), and for `lvl ≥ .99` four spikes of length 0.035 S with a 1.2 Hz shimmer of ±.12. Level values in §5.3.
- **Composite** (replaces the prototype's tone map of everything): `vec3 lit = pow(max(1. − exp(−Lgt·(1.15 + .5·uFlash)), 0.), vec3(.4545)); col = 1. − (1. − NIGHT1)·(1. − lit);` where `Lgt` is all light × `(1 − .4·uExit)` and the prototype's base colour is dropped. Where there is no light the pixel is exactly `#010317`. Then `col = mix(col, DAWN, uDawn)`, then ±0.5/255 dither seeded by `uTime` (static when frozen).
- **Early out**: `length(uv) > 1.56` → `NIGHT1` + dither, nothing else. The march runs only when the ray meets the bounding sphere (`BR` 1.07, the prototype's test).

### 4.5 Motion state (gl.ts, JS)

| State | Rule |
|---|---|
| Rest pose | Frontal `(0, 0, 0)` at the first frame, so the GL's first frame is the twin's pose (no double image). The prototype's sway (`yaw −.12 + .2 sin .23t + .07 sin(.61t + 1)`, `pitch .1 + .13 sin(.19t + 1.7)`, `roll .05 sin .13t`) is multiplied by `swayIn` = 0 → 1 over 2.4 s after the reveal (ease-out-cubic). |
| Pointer | fine pointers only, lerp `SKY.pointerLerp`: yaw `+ px·.22·(1 − .7·focus)`, pitch `− py·.14·(1 − .7·focus)`; 0 while paused. |
| Focus | sway amplitude × `1 − .85·focus` and the base offsets × `1 − focus`: **at focus 1 the star faces the visitor**; energy `+ .5·focus` (core and bead brighten). The CSS glow and spill rise with the same MotionValue. |
| Switch (`handle.audience(a, true)`) | `flip`: +π about the **vertical axis**, sign `+1` to creators, `−1` to brands (under RTL the mirrored scene turns it toward the thumb by itself), 1700 ms ease-out-quart. `soft`: follows the flip's progress `smoothstep(.30, .62, p)` from the old material to the new (done by about 365 ms, around edge-on at about 270 ms). `bead`: from its rest angle to the other along the field side (100 → 180 → 280, and back the same arc), 1800 ms ease-out-quart. `flash`: 1100 ms `sin²` envelope. `world` is the shared MotionValue (1.2 s). |
| Switch while reduced or `animate = false` | jump: soft, bead and tint set at once (no flip). |
| Keystroke (bus `keyAt` changes) | `pulse = min(1.2, pulse·.5 + .9)`, radius reset if > .35, then radius `+ 1.25/s`, amplitude `× e^(−1.8 dt)`; bead kick `+ .045` rad decaying `e^(−.35 dt)` (prototype). |
| Dawn | first change of `dawn` from 0 while running: all `uGlint` → 1, comet 0 → 1 over 360 ms ease-out-cubic, `flash` envelope 0 → 1 → 0 over 450 ms. Host opacity `1 − dawn` (works while stopped). `dawn` back to 0 (bfcache) clears all three. |
| Intro | `uIntro` = the twin's ignition clock (§1). After the reveal: the glare sweep and an energy flare `.9·exp(−((t − .5)/.35)²)` (t from the reveal). |

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

**Programs**: compile the init tier first. After the reveal, in an idle callback, compile the next tier down; use `KHR_parallel_shader_compile` when present (poll `COMPLETION_STATUS_KHR` once per frame and swap only when complete, so a step-down never stalls a frame). Without it, compile on demand at the step. Cache programs per tier; rebuild all on context restore.

**DPR**: `dpr = min(devicePixelRatio, cap, step.dpr, √(SKY.maxPixels / (w·h)))` with `cap = matchMedia(MQ.phone).matches ? 1.25 : 1.5` and `w·h` the aura box in CSS px. Uncapped, use `devicePixelContentBoxSize` as today.

### 4.7 Lifecycle (gl.ts; keep WP1's proven parts)

- Context: `webgl2`, else `webgl`; `alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: !force`. A fresh canvas per start (StrictMode, lost contexts).
- Reveal: draw, then next frame fade the canvas in over `SKY.canvasFadeMs` (700); on `transitionend` (or a +200 ms timer) set `stage.dataset.gl = "on"` (the twin goes `visibility: hidden`).
- Loop on `frame.render(loop, true)`; it runs only when `built && !lost && inView && !covered && !document.hidden && !paused`. `inView`: an IntersectionObserver on the host. `covered`: `heroExit ≥ .999`, or the sheet's top at or above the host's (aura box's) top, clipped to the hero (checked on scroll in `frame.read`; on phones the sheet covers the star long before `heroExit` reaches 1). Stopped: single redraws on `world`, `focus`, `dawn`, `audience`, `heroExit` and the bus version (WP1 D5). Paused: one frozen frame.
- Context lost: `preventDefault`, `stage.dataset.gl = "off"` at once (the twin shows), stop. Restored: rebuild, re-measure, fade in again, at most `SKY.maxRestores` times.
- Give-up (watchdog): `data-gl="off"`, 600 ms canvas fade, then destroy.
- Teardown: cancel frames, disconnect observers, `WEBGL_lose_context.loseContext()`, remove the canvas.
- Debug: `?sky=css` (never start), `?sky=gl` (skip the gates except WebGL, never give up), `?tier=…`, `?skystill` (one frame at t = 0, rest pose, levels .42, then stop: for twin parity shots), `?skydebug` (logs, GPU time through `EXT_disjoint_timer_query_webgl2`). Dev only: `window.__sky = { running, tier, dpr, fps, step, comet }`.

### 4.8 Watchdog (sky/watchdog.ts)

Ladder (phones clamp each `dpr` to 1.25): `[{high, 1.5}, {mid, 1.5}, {mid, 1.0}, {low, 1.0}, {low, .75}]`; the start index is the init tier's first step. After any (re)start or step: skip 30 frames, judge windows of 50 deltas:
- median in 31.3 to 35.3 ms → capped display (iOS Low Power): go to the current tier at DPR 1.0, lock, stop stepping;
- mean below 55.5 fps → next step (re-measure, swap the program when it is ready);
- at the last step and below 40 fps → give up (unless `?sky=gl`).

Log lines (`?skydebug` only; verifiers grep them): `[sky] start tier=high dpr=1.50 webgl2`, `[sky] window fps=58.7 median=16.7ms verdict=keep`, `[sky] step tier=mid dpr=1.50 (mean 47.2 fps)`, `[sky] capped tier=mid dpr=1.00 locked`, `[sky] gave up at tier=low dpr=0.75 (31.0 fps)`, `[sky] gpu 2.84 ms/frame tier=high dpr=1.50`.

---

## 5. The agents on the ring (d)

### 5.1 Data (demo.json, read through `DEMO`, never copied)

| Field | Use |
|---|---|
| `DEMO.agents[].name` (7, AGENTS order) | glint index i; angle from `ring.ts` `GLINTS[name]` |
| `DEMO[a].read.opener` | item 0: `"MoonShot AI · Opening yourstore.com"` / `"… @yourhandle"`, split on `" · "` into agent and note (as Toasts did) |
| `DEMO[a].read.units[]`: `.agent`, `.note`, `.produces`, `.startMs`, `.endMs` | items 1..9 |
| `DEMO.creators.shares.list`, `.min`, `.max` | the wedge (§4.4); Still uses `.max` |

Timing (from `REPLAY`, the old `TOAST` values): opener works 0 to 900 ms; unit k works `startMs + 900` to `endMs + 900`; the cycle ends `holdMs` (2400) after the last land, rests `restMs` (3000), loops. The first item starts `firstAtMs` (2400) into the page's life. The units are contiguous, so exactly one agent works at a time.

Brands cycle (ms): MoonShot 0 to 1805 (opener, "Reading the homepage…"), 1805 to 3414 ("Walking the navigation and the designer index…"); MoonMatch 3414 to 4883; MoonShot 4883 to 6948; MoonWriter 6948 to 9520; MoonShot 9520 to 14410 (three units); MoonScore 14410 to 15922; hold "Whether HeyMoon can guarantee sales" to 18322; rest to 21322. Creators: MoonShot 0 to 3530 (opener + 2 units); MoonMatch 3530 to 5400; MoonWriter 5400 to 7638; MoonMatch 7638 to 9851; MoonScore 9851 to 11948; MoonShot 11948 to 13452; MoonSearch 13452 to 14954; MoonMatch 14954 to 17142; hold "Whether HeyMoon can place you" to 19542; rest to 22542. MoonLive and MoonLearning never appear in any item, so they never work; MoonSearch works only on creators.

### 5.2 The clock (`hero/Agents.tsx`)

- `useTimeline({ endMs: cycleEnd, marks, playing, loopGapMs: REPLAY.restMs })` (`lib/timeline`); everything renders on mark crossings only.
- `playing = armed && !switching && active && uncovered && !typing && !dawning`, where `armed` = `performance.now() ≥ REPLAY.firstAtMs`, `active = useActive(heroRef, { enter: .4, leave: .35 })` (in view, page visible, not paused, not reduced), `uncovered = useUncovered(stageRef)`, `typing = fieldFocus === "hero" || heroFieldHasText`, `dawning = dawn > 0`.
- Switch: exactly the Toasts pattern: the shown audience lags the urgent one; at the switch the label exits in 200 ms and every level goes to `waiting`; 1000 ms later `restart()` and the new queue (the opener first) in one batch.
- Mount: on every viewport while motion is allowed; under reduced motion only on the split layout (static label, §8.1). `next/dynamic(…, { ssr: false })` from Hero. G10 refused (`G10_SIGNED = false` in Hero): no label is rendered; the glints still light (they carry no words). If design also wants the glints still, `REPLAY_GLINTS = false` in `ring.ts` keeps them at `idle` except while typing.

### 5.3 Glint levels (written at crossings; `ring.ts` `LEVEL`)

| State | Level |
|---|---|
| `idle`: first paint, no-JS, before the clock arms | .42 |
| `waiting`: not yet worked this cycle, or never works | .18 |
| `working`: its item covers the clock | 1.0 (+ shimmer in GL) |
| `landed`: worked earlier this cycle | .55 |
| `reduced`: reduced motion (CSS default there) | .55 |
| typing: glint i in ring order, `n` = chars typed | `.18 + .82·clamp(n/2 − i, 0, 1)` ("each keystroke wakes the next glint", two characters per glint, as the prototype) |
| dawn | 1.0 (GL forces it) |

Agents writes the seven values to the bus (`bus.levels.set(...)`, `bus.bump()`) and to the stage element as `--g0` … `--g6` (the twin's glints read them with a 300 ms opacity transition). On blur with an empty field the replay resumes where it stopped after 600 ms. After a switch the levels use the new audience's draft length (`els.heroInput.value.length` read in an effect on `audience`; a programmatic value change fires no `input` event).

### 5.4 The bus (`ring.ts`)

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

- Rendered by `Agents` when `G10_SIGNED && useMediaQuery(MQ_SPLIT)`; inside `.stage` in a `.labels` layer (`position: absolute; inset: 0; pointer-events: none; aria-hidden`), after the spill, so it sinks with the star. The layer's opacity is `useTransform(heroExit, [0,1], [1, .4])` with `data-lift` and `data-probe-scroll`; `dawn-fade`.
- One label at a time, for the working item. Position in stage-local px, from the stage's own `offsetWidth` S: anchor = `(S/2 + (RING·S + 16)·cos θ, S/2 − (RING·S + 16)·sin θ)`; θ ≥ 0: the box's bottom-start corner at the anchor (opens up and outward); θ < 0: top-start corner (opens down and outward). RTL: mirror x. Re-measure on a ResizeObserver on the stage.
- Markup: `<div data-ring-label data-agent>` → row 1: `<Moon working size={13} className="text-white" />` + `<span className="mono-caps text-white/56">{agent}</span>` (Geist Mono caps through `mono-caps`); row 2 (`mt-1.5`): the note, `text-small text-white/88`, `max-width: 176px`, `text-wrap: pretty`, at most 2 lines (measured: all 22 strings fit at 168 px and up).
- Text: working `${note}…`; the opener's note as-is ("Opening yourstore.com"); the last item of the cycle crossfades to its `produces` on landing and holds `holdMs`. No box, no shadow, no backdrop-filter (ruling 6).

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

**The twin** (before GL, and in every fallback): palettes crossfade 1200 ms (`--ease-in-out`) by `[data-audience]`; the bead's SVG rotates `-180deg` (CSS `rotate`, 1800 ms `cubic-bezier(.25,1,.5,1)`; back to 0 on the reverse, the same arc); the wedge fades in. No flip. **Reduced motion**: palettes 200 ms, bead jumps, no flash, no pulse; GL is not running.

---

## 8. Reduced motion, no-JS, no-WebGL, and the fallback (g)

### 8.1 States

| | Default | Reduced motion | No JS | No WebGL / Save-Data / `?sky=css` / give-up | Paused |
|---|---|---|---|---|---|
| Star | twin, then GL | twin, static, lit | twin + CSS ignition | twin + CSS ignition | GL frozen frame (or twin) |
| Glints | replay / typing / dawn | all `.55` (CSS default) | `.42` | replay via `--g0..6` | frozen |
| Labels (split) | replay | one static label: the last unit's `produces` beside its agent (brands MoonScore at −40°, "Whether HeyMoon can guarantee sales"; creators MoonMatch at 52°, "Whether HeyMoon can place you"), 200 ms fade | none | replay | hidden |
| Switch | §7 | 200 ms crossfade, bead jumps | links navigate | twin's CSS crossfade and bead travel | state applied, one redraw |
| Spill / glow | bound to focus, pulses | static | static | bound, pulses | static |
| Dawn | 450 ms + comet | instant navigate | form GET | dawn layer, no comet | dawn layer (canvas `1 − dawn`) |
| Wedge (creators) | breathes through the shares | static at `shares.max` | static | GL off: static | frozen |

### 8.2 Fallback decision: improved SVG twin, not a poster (measured)

| Measurement (5 Oct) | Poster (WebP from the GL render at 2x) | Inline SVG twin |
|---|---|---|
| Bytes per audience | **28.8 kB** desktop (1341 px, q75), **14.0 to 14.4 kB** phone (666 px); AVIF q60 19.3 to 19.8 / 10.6 to 11.5 kB | prototype twin **1.37 kB gz** (7.3 kB raw), both audiences in one SVG; the improved twin's budget is 4 kB gz |
| Is it an LCP candidate? | yes: 0.52 bpp (desktop), 1.05 bpp (phone), 10 to 20 times Chrome's 0.05 low-content cut-off | never (inline SVG shapes are not candidates) |
| LCP element, probe page (`$SP/herov2/lcp-*.html`, CDP CPU x4) | **the IMG, in all 8 runs** (448,900 px² against the H1 line's 43,180 at 1440; 110,224 against 12,330 at 390) | **the H1 line, in all 4 runs**, at FCP |
| LCP time after FCP, on a page with nothing else to load | +316 ms (1440, 1.6 Mbps / 150 ms RTT), +103 ms (9 Mbps / 60 ms); +238 / +81 ms at 390. `fetchpriority="low" loading="lazy"` changes nothing (in viewport) | 0 |
| On the real page | competes with the CSS, the font and 155 kB of JS for the same connection | in the HTML; as a Server Component, 0 first-load JS |
| Fidelity to the render | identical at its pose; but it needs a request, and the GL must still match it | prototype twin: mean ΔE76 **18.9** (brands) / **20.5** (creators) inside the star disc, p95 41; a first fitting step (corona stops fitted to the GL's radial profile, darker glass body) already gives **11.9 / 13.2** (box 9.5 / 10.1) |

So: the poster would make the H1 stop being the LCP everywhere and add up to 29 kB to the critical path; the twin keeps the H1 the LCP by construction and can be fitted close to the render. **Build the twin; fit it to these targets (A-F1): mean ΔE ≤ 10 inside 0.47 S and ≤ 8 inside 0.64 S, p95 ≤ 32, against `?sky=gl&skystill` at the same box.**

### 8.3 The twin (`hero/Still.tsx`, Server Component)

`<div class={s.still} data-still aria-hidden>` inside `.aura`, holding five absolutely stacked `<svg viewBox="-240 -240 480 480">` (so the ignition, the bead and the glints animate whole layers on the compositor, never repainting the glass):

1. **corona** (`data-ign`): two `<circle r=240>` filled with radialGradients (brands, creators; `.cc`/`.cb` opacity by `[data-audience]`), stops **fitted to the GL render**: sample the frontal GL capture's median colour per 1% of radius in a notch without the bead (method in `$SP/herov2/cap` + `corona-profile.json`; refit after the shader port, since the composite changes). Includes the moon disc (`rgb(14,13,24)` to `rgb(20,19,32)` at r 96.6), the ring peak at 99.3 and the fall-off to transparent at 234 (0.78 S).
2. **wedge**: annular sector 96 to 112 units, from 280° clockwise by `DEMO.creators.shares.max / 100 · 360°`, `PINK`, visible only in creators.
3. **glass**: the star path (`M0-134A195.1 195.1 0 0 0 134 0…`, exact for the SDF silhouette), body at `fill-opacity: .38` of `#1a1440` (creators `#3a1a3a`); a 0.045 S bevel band (the path stroked 27 units wide, clipped to the star, gradient from the key light at the upper start to the deep lower end, `feGaussianBlur` 3.5); the ring seen through the dome (an arc of r 82, white .35, blur 1.2, clipped); prismatic edges (pink and violet strokes 0.6 units either side of a white .55 edge stroke); the prototype's highlights, sheen and core sparkle with its spikes. Creators: wider band (blur 5), lighter body, softer edge highlights.
4. **glints**: seven `<circle r=1.8>` with a glow circle (`r=6`, radial gradient) each at `(99.3 cos θ, −99.3 sin θ)`, `style="opacity: var(--gN)"`, `transition: opacity .3s`. The defaults live on `.stage` in the module CSS (`--g0` … `--g6: .42`, and `.55` inside `@media (prefers-reduced-motion: reduce)`); Agents overrides them inline with `stage.style.setProperty` (Hero never passes a `style` prop to `.stage`, so React never clears them).
5. **bead**: flare, two spike rects and the white core at 100°; the whole `<svg>` rotates `-180deg` in creators (§7).

CSS (module): `.stage[data-gl="on"] .still { visibility: hidden }`; ignition `@keyframes still-in { from { opacity: .35 } }` on the corona and bead layers, `1.6s var(--ease-out-expo) .4s both`, no-preference only.

---

## 9. Performance budgets and how to measure them (h)

| Item | Budget | How |
|---|---|---|
| First load `/brands`, `/creators` | ≤ 160 kB, and **no more than +0.5 kB over today's 158.2** | `npm run measure` (never `next build` into `.next`; stop nothing: measure uses `.next-measure` and a lock) |
| Sky chunk (the chunk holding `uWorld`) | **≤ 12 kB gz**, absent from first load | measure (budget line raised, V12). Expected about 8 to 9.5 kB |
| `Agents` chunk + DEMO | inside "lazy site chunks ≤ 110 kB" (today 72.6) | measure |
| CSS that blocks first paint | ≤ 26 kB (today 24.3): the new hero CSS must net ≤ +1.5 kB after deleting the toast rules | measure |
| HTML | ≤ 60 kB (today 19.4 / 22.6; the twin adds about 4 kB gz twice, HTML + RSC payload) | measure |
| LCP | ≤ 1.8 s (Fast 4G, CPU x4), element inside `#hero-h1` | DevTools Performance + the probe in A-P2 |
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
- A-S2 `curl -s localhost:3004/brands | grep -c "<canvas"` → 0; `grep -c "data-still"` → 1; no `data-ring-label` in the HTML; the section carries `data-audience="brands"` (creators on `/creators`).

**Composition** (A-C, at all seven sizes plus 1024x768, both audiences, scrollY 0, after fonts)
- A-C1 Rects of the switch, `#hero-h1`, `[data-field=hero]`, `[data-chips]`, `.stage` match §3.3 within ±2 px (±1 px for the field).
- A-C2 Split: `|(stage centre y) − (field centre y)| ≤ 0.5`; start tip − field end ≥ 64 px; every label box inside `[0, innerWidth − 24]` and above the sheet top − 8; no label overlaps the copy column.
- A-C3 Stacked: field bottom ≤ sheet top − 8 at 390x844 and 360x740; S in [220, 260]; at 844x390 the field bottom ≤ 390.
- A-C4 No horizontal scroll (`document.documentElement.scrollWidth === innerWidth`).
- A-C5 The field stays the light's destination: L* sampled 24 px outside the field's end edge ≥ 18 and ≥ the start edge's + 4, at rest, both audiences, split; both + 6 on focus. (Initial thresholds: the old halo gave L* about 21 at the field; the lead may retune them once, from the first build's captures.)
- A-C6 Contrast: chip text ≥ 4.5:1 against the spill's lit background (sample the background beside each chip, stacked layouts); label notes ≥ 4.5:1.

**Performance probes** (A-P)
- A-P1 measure table within §9.
- A-P2 LCP, on 3005: `new PerformanceObserver(l => { const e = l.getEntries().at(-1); console.log(e.startTime, e.element?.closest("#hero-h1") !== null); }).observe({ type: "largest-contentful-paint", buffered: true })` → `true`, within 150 ms of FCP, at 1440x900 and 390x844, both routes.
- A-P3 CLS ≤ 0.02 from load to the bottom of the page.
- A-P4 `canvas.width / canvas.clientWidth` ≤ 1.5 desktop, ≤ 1.25 at 390; `canvas.clientWidth ≈ 1.6 × stage.offsetWidth`.
- A-P5 `?skydebug&tier=high` on SwiftShader (no `?sky=gl`): the log shows `step` lines down the ladder, then `gave up`; `data-gl="off"`; the canvas is removed; no console errors.

**GL lifecycle** (A-G)
- A-G1 Desktop Chrome on real hardware: `.stage[data-gl="on"]` within 4 s (R4).
- A-G2 `__sky.running` false once the sheet covers the aura box (390x844: from scrollY 391, aura top 412.6 against the sheet's 804; 1440x900: from scrollY 686, aura top 150 against 836) and in a hidden tab; true again on return.
- A-G3 `loseContext()` shows the twin at once with no errors; `restoreContext()` fades the canvas back.
- A-G4 Paused (nav): one frozen frame; a switch while paused re-tints and redraws once; a submit while paused still turns the hero `#F6F4FC`.

**Agents and labels** (A-A, timings ±150 ms; the dev server adds latency)
- A-A1 A MutationObserver log over one full cycle on `/brands` and `/creators` at 1440: the label sequence and texts equal §5.1 (agent names, `${note}…`, the final `produces`), first text "Opening yourstore.com" / "Opening @yourhandle" at about 2.4 s; never more than one `[data-ring-label]` in the DOM.
- A-A2 The working glint and the label agree: at every crossing, `getComputedStyle(stage).getPropertyValue("--g" + i) === "1"` for the label's agent and no other.
- A-A3 MoonLive and MoonLearning are never labelled and their `--g` never exceeds .18 during the replay; MoonSearch is labelled only on creators.
- A-A4 At 390 and 768: no `[data-ring-label]`, glints still change.
- A-A5 Typing 14 characters: label gone within 250 ms, `--g0..--g6` all `1`; blur with an empty field: replay resumes within 1 s.
- A-A6 `G10_SIGNED = false`: no label DOM at any size; glints still light.
- A-A7 Glint visibility, from a 2x screenshot at the `ring.ts` coordinates: peak L* at `waiting` ≥ corona L* + 15; at `working` ≥ 85.

**Switch and submit** (A-W; scrub with `document.getAnimations()` paused for CSS, `?skydebug` exposes `__sky` for GL)
- A-W1 Frames at 0, 150, 270, 400, 700, 1100, 1800 ms (brands → creators and back, 1440 and 390): edge-on near 270 ms (silhouette width ≤ 15% of S), liquid material by 400 ms, the bead passes the field side and lands at 280°; the wedge present in creators only; one h1 throughout. Reviewer compares with `$SP/herov2/cap/sheet-flip.png` (bottom row = the target).
- A-W2 Submit (valid, 1440): at t = 0 all seven glints at 1; `__sky.comet` goes 0 → 1 within 360 ms; `location.assign` at 450 ms (as today). Reduced motion: no comet, instant navigation.

**Material** (A-M)
- A-M1 Creators at rest, a 2x stage capture: no balloon (tip extent ≥ 0.415 S on all four tips, `tipcheck.py` reports `tip_r`) and it still reads as the four-point glyph.
- A-M2 No dark caps: `python3 $SP/herov2/tipcheck.py <capture>` reports `min ≥ corona` on all four tips, both audiences, at rest and in the A-W1 frames (before: 12 to 15 against 21 to 34 on creators; after: 32 to 52 against 20 to 34).

**Fallback** (A-F)
- A-F1 Twin fidelity: `python3 $SP/herov2/de.py`-style ΔE (5x5 median, CIE76) between `?sky=css` (twin) and `?sky=gl&skystill` at the same 1.28 S box: mean ≤ 10 inside 0.47 S, ≤ 8 inside 0.64 S, p95 ≤ 32, both audiences, 1440 and 390.
- A-F2 Crossfade: frames at 0, 175, 350, 525, 700 ms of the reveal show no second silhouette (the GL's first frame is the twin's pose).
- A-F3 Reduced motion (DevTools emulation and `prefers-reduced-motion`): no canvas, no ignition, glints `.55`, the static label on the split layout only, 200 ms switch crossfade.
- A-F4 No-JS: the twin with its ignition, both audiences; the form submits by GET; no label.
- A-F5 `?sky=css`: no canvas; the replay still lights the twin's glints and (split) the labels.

**Unchanged** (A-U)
- A-U1 The close and the footer: screenshots at 1440 and 390, both audiences, pixel-identical to before the package (`git stash` a baseline first).
- A-U2 Below-the-fold sections, the nav (including its night-glass split over the hero), the promo launcher: no regressions on a full-page tour.

---

## 11. Risks (j)

| # | Risk | Mitigation / owner |
|---|---|---|
| R1 | GPU cost on mid Android and older iPhones is unmeasured: every number here comes from SwiftShader. | Tiers start at mid on phones; the watchdog steps tier before DPR; the aura box cuts pixels 43% (desktop) to 62% (phone). Device pass (Pixel 6a, iPhone 12, Windows ANGLE/D3D, iOS Low Power) before release. |
| R2 | Shader compile stalls on mobile (three tiers). | Compile one tier; precompile the next in idle with `KHR_parallel_shader_compile`. |
| R3 | The fitted twin may stall above the ΔE targets on the glass itself (refraction cannot be drawn exactly). | The corona fit alone took the star-disc mean from 18.9 to 11.9; the glass recipe in §8.3 covers the rest. If A-F1 misses by less than 2, the lead decides; never ship a poster as the fix (§8.2). |
| R4 | Lineage: judges read glass AI-sparkle + eclipse as Vercel-adjacent and generic. | The agent glints, labels, wedge and the field-bound light carry the product story; that is the lead's response, not this package's to reopen. |
| R5 | G7 (b) was signed for the horizon's halo; the light is now the field glow + spill + the eclipse corona. | Re-sign G7 (b) for the new light; G10 now covers the ring labels. Both for Mostafa and design. |
| R6 | Tall content (a narrow split window, a long H1) pushes the field row below `--axis`; the star moves with it but is sized for `--axis`. | Checked at the listed sizes (A-C); outside them the star may run under the peek. Accepted. |
| R7 | `100vw` includes classic scrollbars (Windows): the nav already has the same offset. | Consistent with the nav; the labels' 24 px margin absorbs 17 px scrollbars. |
| R8 | The CSS budget has 1.7 kB of headroom. | Delete the toast/lane rules first; keep the twin's styling in SVG attributes, not CSS. |
| R9 | Passing a Server Component through `Landing` changes a contract and the pages. | Small and explicit (§2); `check:site` and measure confirm the routes stay static (○). |
| R10 | Labels next to a moving star are busier than the old toasts. | One label at a time, all on the outer side, `mode="wait"`; design review on A-A1's recording. |
| R11 | Container query units (`cqw`): Safari 16+, Chrome 105+, Firefox 110+. | Below that the split's `--sw` is invalid and `--stage` falls back to 200 px through `max()`; acceptable. |
| R12 | Headless verification cannot prove 60 fps or the 4 s `data-gl` time (WP1 R4 again). | Real-device checks listed in A-G1 and §9 are the release gate. |

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
