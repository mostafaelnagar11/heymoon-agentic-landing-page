# LEAD-B notes

LEAD-B acts for the lead on the shared WP0 files and on WP3's run stage.

Files this round: `shell/Lift.tsx`, `lib/lift.tsx`, `lib/scroll.ts`, `lib/audience.tsx`, `Landing.tsx`, `run/*`, `lab/run/page.tsx`. Of these, `lib/lift.tsx` and `Landing.tsx` did not need changes.

Screenshots and probes: `scratchpad/shots/fix/LEAD-B/`. The probe scripts are `scratchpad/tools/leadb-*.cjs`.

## Fix round (4 Oct)

### 1. Empty lower hero: the sheet now peeks above the fold. FIXED

- **What it does now.** At rest the paper sheet's rounded top edge shows above the fold. It is 64px tall on desktop and 40px on a phone.
- **How.** It is pure layout in `LiftTrack`:
  - The spacer is `calc(100svh - var(--peek))`, so the sheet's top sits at hero height − peek. The Sheet's `-mt-[100svh]` is unchanged.
  - The sentinel is shortened by the same amount and still ends where the sheet arrives. So `heroExit` is 0 at rest, with every binding at its rest value, and 1 when the sheet reaches the viewport top.
  - The hero stays pinned until exactly that moment, as before.
- **When it shows.** CSS decides, because rule 2.4.10 makes the first viewport CSS only:
  - `--peek-want` is 64px when the screen is at least 640 wide and 669 tall.
  - It is 40px when the screen is at most 639 wide and at least 601 tall.
  - Otherwise it is 0.
  - On every short screen the chips end at 525px, so a peek there would leave less than 80px of night.
- **JS safety net.** After hydration, JS measures the real gap between the chips and the edge. It drops the peek (`--peek: 0px` inline) when less than 80px would remain (56px on a phone). It observes the hero, and the chip list across its audience remounts (a MutationObserver follows the replacement list).
  - Test: forcing the chip list taller at 1280x720 moved the sheet from 656 to 720, and it went back to 656 when restored.
- **Moonlight edge.** §5.0.7's white/.7 hairline was invisible on paper: 253 against 252 in a 2x capture. It now uses the horizon's violet (`--v300`, .8), with the same fade at both ends and the same `heroExit` binding. The edge is now visible as a lit rim on the peek (`peek-1440-edge.png`, `peek-1440-edge-zoom.png`).
- **"A SAMPLE RUN" hint: not added.**
  - The work section's first line sits 120px into the sheet (WP2's padding), so it cannot show in a 64px peek.
  - A separate hint would need its own fade binding, plus short-screen, reduced-motion and no-peek states. It would also duplicate the frame label that appears a screen later.
  - The bare lit edge reads as the invitation.
- **Clearance between the chips and the edge** (`leadb-geo.cjs`):

| Viewport | Peek | Chips bottom → sheet top | Clearance |
|---|---|---|---|
| 1280x720 | 64 | 541 → 656 | 115 |
| 1440x900 | 64 | 655 → 836 | 181 |
| 1920x1080 | 64 | 725 → 1016 | 291 |
| 1366x768, 1024x768 | 64 | 571 → 704 | 133 |
| 768x1024 | 64 | — | 235 |
| 640x680, 900x680 | 64 | — | 91 |
| 390x844 | 40 | 545 → 804 | 259 |
| 375x667 | 40 | — | 121 |
| 360x640 | 40 | — | 94 |
| 844x390 | 0 (short) | — | — |
| 1280x600 | 0 | — | — |
| 1366x657 | 0 | — | — |

  Creators gives the same numbers.
- **Lift still correct** (`leadb-lift.cjs`, 1440x900):

| scrollY | heroExit | Sheet top | Dim | Edge | Clip inset | Nav |
|---|---|---|---|---|---|---|
| 0 | 0 | 836 | 0 | 1 | 24 | night |
| 418 | .5 | 418 | .275 | .5 | 12 | night |
| 800 | .957 | 36 | | | | paper |
| 836 | 1 | 0 | .55 | 0 | 0 | |

  - From 836 the hero unpins (900 → hero top −64).
  - The sheet's timeline is still a `ViewTimeline`.
  - The canvas pause (`heroExit ≥ .999` in sky/gl.ts) now falls exactly where the sheet covers the viewport, at 836.
  - At 390x844 the arrival is at 804.
  - Reduced motion keeps the peek: it is layout, with the full-bleed rounded sheet (`peek-1440-creators-rm.png`).
- **Shots:** `geo-1440x900.png`, `geo-390x844.png`, `peek-montage.png` (1440 reduced motion, 1280x720, 1920), `lift-mid-montage.png`.

### 2. Anchor restore (WP6 medium #2, WP6 R3). FIXED

- **Cause, reproduced.** A remounted `content-visibility` section is laid out at its size hint, then renders at its real height for the new audience about 77ms after the deferred commit. That is after the old one-frame re-check.
  - Brands → creators at 1440x900: number 1080 → 1107, agents 528 → 750.
  - Close at 300 before the fix: final **549** (Δ249). Close at 120: final **369**.
- **Fix.** `restoreAnchor` still realigns at once and on the next frame. It then keeps a ResizeObserver on every `[data-slot]` and realigns on each resize. A ResizeObserver runs after layout and before paint, so the correction lands in the same frame as the change.
  - The watch stops 600ms after the last size change, and after 1.5s at most.
  - It stops at once on wheel, touchstart, keydown or pointerdown: the visitor's scroll wins.
  - A new restore cancels the previous watch.
- **After** (`leadb-anchor.cjs`, clicks dispatched from `evaluate`):

| Switch | Viewport | Offsets | Result |
|---|---|---|---|
| Close, brands → creators | 1440x900 | 300 / 120 / 0 / −60 | max Δ 0.4px |
| Close, creators → brands | 1440x900 | 300 / 120 / 500 | max Δ 0.9px |
| Close | 390x844 | 300 / 100 / 400 | max Δ 0.7px |
| Close | 1280x720 | 300 | final 301.1 |
| Nav, anchor under the nav | 1440x900 | number at 0 / −300 / −700, connects at 30, run at −1200 | layout top within 0.5px |

  - The bounding rect moves by the Swap's intended 8px rise. Layout top does not.
- **Painted frames.** Every frame was captured with a CDP screencast (`cast1440/`, `cast1280/`). The close's edge sits at the same y in every frame, with no frame at the old position. This includes the 1280x720 case, where a rAF sample briefly read 172 because RunStage's fit check re-rendered after the restore; the ResizeObserver corrected it before paint.
- **Testing note.** Chrome's layout-shift entries still list the close as shifted in that frame. The tracker does not net out a scroll made inside a ResizeObserver callback. The screencast is the ground truth. For a real click these entries also fall inside the 500ms `hadRecentInput` window.

### 3. Re-renders from above `<Swap>` (WP3 R2). FIXED

- **Before** (instrumented `window.__rr` log, 1440x900 `/brands`):
  - Sheet and Swap rendered **13 times** in the 70ms after hydration: once with the server snapshot, then 12 more with identical values.
  - Fiber walk: Swap's props were unchanged, so it had its own update. It came from `useReducedMotionPref()`, whose server snapshot ("reduced") flips right after hydration.
  - That one re-render rebuilt every section element while their `<Suspense>` boundaries were still dehydrated. React then kept discarding the render to hydrate those boundaries first, and re-rendered Sheet and Swap each time.
- **Fix** (`lib/audience.tsx`):
  - Swap no longer subscribes to reduced motion. It reads `getReducedMotion()` when a switch renders; the value is unused before the first switch, where `initial={false}`.
  - The sections are built with `useMemo(() => children(deferred), [children, deferred])`. So the urgent half of a switch hands React the same elements, and the old sections bail out instead of re-rendering while the new ones wait.
  - The m.div's motion props are module constants.
- **After:**
  - Swap renders once (hydration) on load, on both audiences.
  - Sheet renders twice (hydration, then the reduced flip). That flip no longer reaches Swap or the sections.
  - RunStage gets no render from above. Its remaining renders are its own (`ready`, the media queries).
- **"On sheet arrival":** not a runtime cause.
  - One early run showed Sheet, Swap and RunStage re-rendering near scrollY 800 to 900, in exactly the three modules I had just edited. That was Fast Refresh applying.
  - Another run showed a render cascading from `Landing` itself. Landing has no state and its parent is a server page, so only the dev router or Fast Refresh can do that; parallel agents are editing.
  - Four clean runs since then, wheel-scrolling through the sheet's arrival, show zero renders.
  - Instrumentation removed.

### 4. WP3 low issues (`scratchpad/fix/WP3-verify-issues.json`)

- **Pointer-events on the sticky stage. FIXED.**
  - Change: `.outer { pointer-events: none }`, and `.listWrap, .panel { pointer-events: auto }`.
  - `.inner` alone was not enough: the track itself is pulled up 72px under the head.
  - Hit-testing the sub's and the H2's last lines: false/false before. After: true/true at 1440x900 and 1366x768 (creators), and at 1280x720 and 1440x900 (brands).
  - Step clicks still work: clicking step 03 went from `active,upcoming,upcoming,upcoming` to `done,done,active,upcoming` (`run-click-step3.png`).
- **Transitions inside the reduced-motion query. FIXED.** The `.glyph`, `.num/.title/.body/.credit` color transitions and the `.card` opacity transition now live in one `@media (prefers-reduced-motion: no-preference)` block.
- **`dir="ltr"` on step numbers. FIXED.** `<span className="num" dir="ltr">`.
- **Short-laptop fit slack. FIXED with the 48px breathing-room rule.**
  - `FIT_AIR = 48` keeps at least 24px above and below the centred list.
  - Now stacked: 1280x720, 1366x657 and 1536x730 (creators), and 1366x657 (brands).
  - Still sticky:
    - creators: 1440x900 (list 126 to 870), 1366x768 (117 to 731), 1280x800 (133 to 747), 1920x1080;
    - brands: 1280x720 (123 to 677), 1536x730 (128 to 682), 1440x900 (156 to 840), 1366x768, 1280x800.
  - Shots: `run-*.png`, `d1280x720-creators-stack.png`.
- **Phone stacked mounts cropping the tall creators mocks. FIXED.**
  - `TALL` classes apply to creators steps 01, 03 and 04 in every stacked layout, not only on phone. The desktop stacked layout (reduced motion, short laptops) cropped MockTerms and MockCheck at 300 too.
  - Heights are each card's measured height plus the sheet's padding, plus a few px of air:

| Mock | Up to 639 wide | From 640 | Notes |
|---|---|---|---|
| MockTerms | 412 (468 under 360 wide) | 432 | |
| MockCheck | 380 | 396 | 340 from 1024 |
| MockRead | 440 | 448 | |

  - MockTerms and MockCheck are whole at every width from 320 to 1440 (`leadb-mounts.cjs`: needed height ≤ mount height everywhere). So "what you agree to" and "what you do not" both show in full, with the button, and all three misses show with their fixes (`p390-creators-tall-montage.png`).
  - MockRead is whole wherever its rows fit one line (a mount at least 464 wide). On a phone it now shows the header and 7 of 9 rows under the fade, instead of about 4. Its whole list is 572px at 390 wide, which is too tall for one phone mock, so the remaining crop keeps WP8's crop-with-fade.
- **DEMO read in RunStage (§4.3). FIXED.** MockField now gets §5.3's literal `value="yourstore.com"`.
- **Server-side height reservation for the sticky stage (FYI item). REJECTED for this round.**
  - It needs an `html.js` class set before paint in `app/(site)/layout.tsx`, which is not one of my files.
  - Measured CLS from the run is 0 (it hydrates off screen). See request 3.

### Checks

- `npx tsc --noEmit -p .`: 0 errors.
- `npx next lint --dir "app/(site)"`: clean.
- No console errors on `/brands`, `/creators`, `/lab/hero` or `/lab/run`.

## Requests to the lead

1. **§5.0.7 acceptance numbers move with the peek.**
   - `heroExit` reaches 1.0 at scrollY = innerHeight − peek: 836 at 1440x900 and 804 at 390x844 (was 900 ±2).
   - `useUncovered` on the hero field flips at about scrollY 304 at 1440x900 (was about 368, "about 400" in the spec).
   - Please update the checklist wording, or tell me to make the peek opt-out.
2. **WP8:** MockTerms' side-by-side lists (`@container (min-width: 480px) and (max-height: 360px)`) never trigger in the 524×300 desktop mount. The FIT root is the container, and its content box is 524 − 64 = 460 wide. That is moot for the run now (the mount is taller), but WP8's intent and the lab's 524×300 mount are affected.
3. **Run SSR height (WP3 FYI 7):** if wanted, set `document.documentElement.classList.add("js")` in an inline head script in `app/(site)/layout.tsx`. WP3 can then reserve the sticky height under `html.js` and the sticky media query.
4. **WP7, observation:** at 1440x900 at rest, the fixed promo launcher (bottom right) sits half on the night and half on the peeking sheet's corner. It reads fine to me, but it is the one element that now meets the peek.
5. **WP6:** checklist row 1 ("switching at the close keeps the close top within ±4px") can be re-run on the live page. It holds within 0.9px at 300 / 120 / 0 / −60 / 500, and on phone.
