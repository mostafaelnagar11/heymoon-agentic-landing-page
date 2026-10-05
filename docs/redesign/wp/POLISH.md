# Polish notes

The polish agent works alone after the fix round. Scope: `app/(site)` and `scripts/` only. The product apps are untouched, nothing is committed, the lead's dev server on :3004 was never restarted, and `next build` only ran inside `npm run measure`.

Evidence and probes are in `scratchpad/polish/` (the session scratchpad: `/private/tmp/claude-501/-Users-mostafaaelnagar-Documents-moontech/d50da6c8-1e72-439f-9d55-d7ba5aef42c4/scratchpad/polish/`). The probes:

| Probe | What it checks |
|---|---|
| `runlag.cjs` | Run panel lag on a fast scroll |
| `gaps.cjs` | Gaps between sections, measured from the visible content |
| `navseam.cjs` | The nav pill parked across four surface edges, shot at DPR 2. `hard` re-creates the old split for a before/after pair. |
| `tuck.cjs`, `tuck2.cjs`, `tuckshot.cjs` | The phone launcher |
| `promoshot.cjs` | The promo launcher and card |

Files changed:

- `run/RunStage.tsx`, `run/run.module.css`
- `shell/Nav.tsx`, `globals.css`
- `promo/Promo.tsx`, `promo/Launcher.tsx`, `promo/PromoCard.tsx`, `promo/dock.ts`
- `promo/promo.module.css` became `promo/promo.css`, with a new `promo/styles.ts`
- `lib/prefs.ts`, `lib/providers.tsx`, `lib/audience.tsx`, `lib/lift.tsx`, `lib/playback.tsx`
- `window/WorkingWindow.tsx`, `window/useRun.ts`, `window/WorkSection.tsx`
- `scripts/measure.cjs`
- `app/(site)/lab/` is deleted

## 1. Run panel on a fast scroll: FIXED

- **The change.** `AnimatePresence mode="wait"` is now the default sync mode. The new mock enters while the old one leaves, and both sit in the one absolute `.slot` box. The entering mock is later in the DOM, so it is on top.
  - Enter: 300ms. Opacity, y 8 to 0 and blur 4 to 0, ease-out.
  - Exit: 180ms. Opacity only, ease-out. It used to be 200ms ease-in (`EASE.exit`), which held the old mock opaque through most of its exit.
  - The timings are `PANEL_IN_S` and `PANEL_OUT_S`. Each slot carries `data-step` so probes can read it.
- **Measured with `runlag.cjs`.** It logs every frame, then wheels through the whole sticky stage at 1440x900. "Caught" means the time from a step change until that step's mock is the most opaque slot and at least 0.5 opaque.

  | Scroll | Before (`mode="wait"`) | After (cross-fade) |
  |---|---|---|
  | brands, fast (300px every 40ms) | steps 02 and 03 never shown; panel on the wrong step for up to **717ms** | 02 caught at 33ms, 03 skipped (React went straight to 04), 04 at 50ms; worst **100ms** |
  | creators, fast | 02 and 03 never shown; worst **1,033ms** | 02 at 33ms, 04 at 50ms; worst **50ms** |
  | brands, moderate (150px every 80ms) | 267 / 300 / 283ms | 33 / 50 / 33ms; worst **50ms** |

  - **Under heavy load** (load average 27 from other sessions), the headless browser drops to about 10fps. Repeats then read a worst of 83 to 317ms.
  - That remainder is frame and render latency. Nothing structural waits any more: no exit runs before the enter starts.
  - At most three slots overlap, briefly, while a fling crosses two quarters.
- **Reduced motion: unchanged.** The sticky stage never mounts under reduced motion. The stacked layout has no panel and no transitions (`sheet-b1440rm-0.png`).
- **Found while checking the rhythm: FIXED.** `.inner`'s `overflow: clip` cut the active card's shadow.
  - On creators at 1440x900, the list ends 30px above the box, and the shadow reaches 40px below the card.
  - As the stage released, step 04's card left a faint hard edge (pixel 248 jumping to 252 at y 450, `after/gap-1440-1-run.png`).
  - The fix is `overflow-clip-margin: 48px` on `.inner`. The shadow now fades 236 to 252 smoothly (`final/gap-1440-1-run.png`).
  - Browsers without `overflow-clip-margin` keep today's clip.

## 2. Rhythm: work to run tightened. The other gaps checked and left

- **Measurement.** `gaps.cjs` measures the gap from the lowest visible content of one section (text, media, painted boxes and 1px rules) to the highest visible content of the next. Before each measurement it scrolls the boundary to mid-viewport, so content-visibility sections are rendered.
- **The change.** In `RunStage.tsx`, the run section's padding went from `pt-24 sm:pt-[140px]` to `pt-12 sm:pt-16`.

  | Boundary | 1440 brands | 1440 creators | 390 brands | 390 creators |
  |---|---|---|---|---|
  | work act rail to run H2 | 236 → **160** | 236 → **160** | 157 → **109** | 157 → **109** |
  | run to number (lunar divider) | 180 | 150 | 96 | 96 |
  | number to agents band edge | 120 | 129 | 97 | 98 |
  | agents band to connects hairline (to H2) | 96 (154) | 96 (154) | 64 (124) | 64 (124) |
  | connects to sheet end | 130 | 130 | 96 | 96 |

  Before shots are `before/gap-*.png`, after shots `after/gap-*.png`.
- **The other gaps were left on purpose:**
  - **The deep band's edges sit 96 to 129px from paper content.** A dark object's hard edge carries more weight, so it needs less air than a paper-to-paper gap. Below the band, the connects hairline divides 64 + 64 at 390 and 96 + 64 at 1440. That reads as a deliberate split, so it stays (`after/gap-390-3-agents.png`).
  - **Run to number differs by audience at 1440x900 (180 against 150).** This is the sticky list's own height, centred in the pinned 100svh box. It changes with the viewport height, and both values sit around the new 160.

## 3. Nav edge: FIXED, with an 8px feathered seam

- **How it works.** `Nav.tsx` used to set part A's height and part B's top at the split. It now writes `--split` and toggles `data-split` on `.nav-glass`. In `globals.css`, with `data-split` set:
  - A runs 4px past the edge and fades out over 8px: `mask-image: linear-gradient(#000 calc(100% - 8px), transparent)`.
  - B starts 4px above the edge and fades in over the same 8px.
  - The masks also cut each part's backdrop blur, so the blur ramps in with its skin.
- **Without a split, nothing changes.** Part A is full height and has no mask. The server markup is unchanged.
- **Evidence:**
  - `nav-seam-compare.png` (1440; left is the old hard split re-created with `hard`, right is now). It covers the sheet top (night to paper), the window frame top (paper to deep), the agents band bottom (deep to paper) and the sheet bottom (paper to night).
  - `nav-seam-zoom.png` (DPR 2 crop).
  - `nav390-compare.png` (390).
  - At the sheet top, a column through the pill now ramps 1, 7, 48, 90, 211, 229, 240 across the seam, where it used to jump from 1 to 252.
- **Side effect, accepted.** While an edge crosses the pill, the paper half reads slightly greyer (240 against 252). Its blur now samples a few pixels of the dark side, the way frosted glass over an edge looks. It lasts only for the 56px of scroll it takes the edge to cross.

## 4. Phone launcher: FIXED. It tucks away while scrolling down

- **The hook.** `useScrollTuck` in `Promo.tsx` runs on phone (`useIsPhone`, under 640 wide) and only while the card is closed:
  - **Tuck.** It hides the launcher once the page has moved more than 12px down.
  - **Return on scroll up.** The launcher comes back after more than 12px up.
  - **Return at rest.** It also comes back 1s after the last real scroll movement.
  - **Settling is rest.** Movements under 2px per event count as the page settling (Lenis's lerp tail after a wheel, the end of a fling), so they neither tuck nor restart the clock.
  - **Focus vetoes a tuck.** If the launcher holds focus, it does not tuck.
- **Every existing rule is kept:**
  - `shown` is computed exactly as before (no field in view, keyboard closed) and still drives the card's forced close.
  - The launcher gets `shown && !tucked`.
  - The scroll tracking runs even while a field hides the launcher. So leaving the hero field on a downward scroll does not flash the launcher before it tucks.
  - The first-time pulse waits until the launcher is actually visible.
- **Transitions.** The tuck uses the launcher's existing 200ms opacity and scale transition. Under reduced motion `data-tuck` sets `transition: none`, and the `back` phase holds that for 300ms after the return, so both directions are instant.
- **Desktop is unchanged.** At 1440, `data-tuck` never appears (`tuck.cjs` desktop run).
- **Evidence:**
  - `tuck2.cjs` timeline at 390: the launcher tucks 3ms into the scroll and returns 1,004ms after the last real movement. On a scroll up it returns after 18px.
  - Reduced motion: transition duration 0s at both the tuck and the return.
  - `tuck-strip.png` on /creators 390: at rest before, mid-scroll (no launcher, so ShareScale's "16%" dot and label are clear), and at rest after.

## 5. Lab deleted: DONE

**Removed:**

- **`app/(site)/lab/`.** All nine pages and `_frame.tsx` (LabFrame). Its Tailwind arbitrary variants left the site CSS with it. INTEGRATION estimated 0.8 kB of lab-only utilities; the layout's CSS now measures 11.1 kB gzip, against its 11.6.
- **Code that only the lab used:**
  - **`lib/prefs.ts`:** the `?rm=1` forcing on `/lab` paths (`forcedNow`, `subscribeLocation`, `useForcedReducedMotion`). `getReducedMotion` is now the media query alone.
  - **`lib/providers.tsx`:** `MotionConfig reducedMotion="user"`. It was `forced ? "always" : "user"`, and `forced` was false on every non-lab path.
  - **`lib/audience.tsx`:** `AudienceProvider`'s `syncUrl` option. The lab passed `false` to keep `?a=`; the Landing always used the default.
  - **`promo/Launcher.tsx`:** the `inline` prop and `.launcherInline`.
  - **`promo/PromoCard.tsx`:** the `inline` prop, its branches and `.dockInline`.
  - **Export keywords:** `PageWindow` and `CompactWindow` (WP2 R4), `snapAt` and `progressAt` (useRun), `slotAt` (dock) and `PROMO_KEY`. Each is still used inside its own file.
  - **`scripts/measure.cjs`:** `isLab`, so every lazy site chunk is now budgeted.
- **Comments.** Comments that named the lab now describe the real callers: `lift.tsx`, `playback.tsx`, `WorkSection.tsx` and `Promo.tsx`.
- **Generated type stubs.** Stale stubs in `.next/types/app/(site)/lab/` and `.next-measure/types/app/(site)/lab/` were deleted. tsc includes those folders and failed on the missing pages. They are generated files, and deleting them does not affect the running dev server.

**Kept:**

- `useDeferredAudience` and the contract types in `contracts.ts`. The first is a SPEC §4.3 contract, now without a caller.
- Other in-file-only exports that were never lab-related (`navBottom`, `getLenis` and similar).

**Side effect found by `measure`, and fixed: the promo's CSS was back on the first paint.**

- **What happened.**
  - Next's CSS chunking runs in its default loose mode (`css-chunking-plugin.js`). It joins a CSS module to whatever CSS module sits next to it in a chunk.
  - `PromoCard` imports the working window. With the lab gone, nothing kept the two stylesheets apart, so `promo.module.css` was folded into the window's stylesheet.
  - The work section links that stylesheet in the static HTML. Measured CSS went from 22.6 to 25.8 kB, against a 26.0 budget, and the promo's 2 kB was back on the first paint despite `ssr: false` (lead ruling 5 Oct).
- **The fix.**
  - The promo stylesheet is now global: `promo/promo.css`, with every class prefixed `pm-`. `promo/styles.ts` exports the same `s.*` names, so the TSX barely changed.
  - The plugin never merges global CSS into a stylesheet that another chunk group loads, so the promo CSS stays in its own file (`static/css/2541bff1b1e52619.css`), linked only when the promo chunk loads.
  - Checked: no `pm-` rule is in any stylesheet that `brands.html` links.
- **Visual check.** The launcher and card are identical at 1440 and 390 (`promo-open-pair.png`).

**Remaining CSS cost of deleting the lab: +1.7 kB gzip.**

- The lab's pages used to make the chunking join every section's CSS into one file. Now each next/dynamic section has its own file: work, run with mocks and number, orbit, close, and hero with Field. `brands.html` now links eight stylesheets (three are the layout's), and they gzip apart. CSS is 24.3 kB, against 22.6 before.
- **Tried and reverted.** Listing the section CSS modules in `Landing.tsx` joined them back into one 11.4 kB file, and CSS dropped to 22.0. But it pulled the modules' class maps into the first-load JS: 158.1 kB, with 1.9 kB of headroom. Net, the first paint got heavier (180.1 against 179.4 kB), so I reverted it.
- **Net first paint.** First-load JS fell 2.9 kB as the lab's shared chunks went away, so the first paint is 1.2 kB lighter than before this round: 179.4 kB of JS and CSS, against 180.6.

## Checks (final state)

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .` | 0 errors |
| `npx next lint --dir "app/(site)" --dir scripts` | No warnings or errors |
| `npm run check:site` | ok. /brands: 200, 1 h1, 1,091 visible words. /creators: 200, 1 h1, 1,388 visible words. 24 handles and 11 names checked. |
| `npm run measure` | measure ok (`measure-final.txt`) |
| Tours (`tour-b1440`, `tour-c1440`, `tour-b390`, `tour-c390`, `tour-brands-1440rm`; contact sheets `sheet-*.png`) | Console empty. Reduced motion logs only motion's own notice. No layout regressions. |

`npm run measure`, final:

| route | first load | framework | motion+lenis | site | css | html | font preloads |
|---|---|---|---|---|---|---|---|
| /brands | 155.1 kB | 88.4 kB | 41.6 kB | 25.0 kB | 24.3 kB | 19.4 kB | 1 |
| /creators | 155.1 kB | 88.4 kB | 41.6 kB | 25.0 kB | 24.3 kB | 22.6 kB | 1 |

- **First load:** 4.9 kB of headroom (2.0 before).
- **Lazy site chunks:** 11, 72.6 kB of 110 (18, 87.6 kB before).
- **Sky chunk:** 5.7 kB.
- **Deny-list:** clean over 23 site chunks.
- **Before this round** (`measure-before.txt`): first load 158.0 kB, motion+lenis 42.1, site 27.5, CSS 22.6.

## For the lead

1. **SPEC deviations to sign off:**
   - §5.3: the run section's top padding is now 64px (phone 48px), down from 140px (phone 96px).
   - §4.3: `useForcedReducedMotion` is gone from the `prefs.ts` table, and `AudienceProvider` lost `syncUrl`.
   - WP7's stylesheet is now global, with the `pm-` prefix.
2. **The sections' CSS is now five files** (eight stylesheets with the layout's three). Joining them into one would save about 1.7 kB gzip. The only in-scope way costs more first-load JS than it saves. Next 14.2.35's `experimental.cssChunking` has no setting that joins chunks which nothing imports together. Leave it, or revisit with a CSS diet (the window's file is 5.4 kB gzip).
3. **`useDeferredAudience` has no caller now.** It stays as a SPEC contract; it can be deleted if the contract is relaxed.

## Final fixes (release QA round)

I confirmed every issue against the code and QA's captures from the 06:33 measure build, then re-checked it on a fresh measure build served at :3005 (`NEXT_DIST_DIR=.next-measure npx next start -p 3005`). Evidence is in the scratchpad under `final/`. The contact sheet is `final/final-evidence.png`. The probes are `final/probe-sw.cjs` (switch count, hit-tested, so a switch under the sheet does not count), `final/probe-bottom.cjs` (max scroll) and `final/promo-timing.cjs`.

| # | Sev | Issue | Verdict | Change | Evidence after |
|---|---|---|---|---|---|
| 1 | med | Phone nav empties at the close | **FIXED** | `Nav.tsx`: `quiet = heroSwitchVisible \|\| closeSwitchVisible` drives `data-at-hero`. On phone the close now has the hero arrangement. `data-at-hero` only drives `max-md:` classes. | At max scroll on brands 390 (y6853), creators 390 (y7531) and brands/creators 360x740, the nav shows HeyMoon.AI, Pause and Dashboard (`final/b1.txt`, `navclose.txt`, sheet rows 1). At 1440 and 768 nothing changed. |
| 2 | med | 844x390: the close field rests under the nav | **FIXED** (both parts) | `close.module.css`, `@media (max-height:520px) and (orientation:landscape)`: wordmark 12vw (4px dots), `--foot-h` follows, `.bottom` padding 32/24. The note also steps aside while the field shows an error, which now reaches it. `Nav.tsx` measure() also sets `data-yield` (opacity 0, invisible, no pointer events) whenever the close field is under the pill. That covers screens the layout misses. | Field at 97–173 vs nav 16–72 (25px clear) on both routes, no yield (`final/b2.txt`, `bottom-final-brands-844x390.png`). At 740x360 the field sits at 73 and the nav yields (opacity 0). |
| 3 | med | Keyboard never reaches the launcher | **FIXED** | `Landing.tsx`: `<Promo />` moved to directly after `<Nav />`. | /brands 1440: forward Tab reaches the launcher right after Dashboard (`final/kbd-b1440.txt`). Enter opens with focus on the headline, Tab goes to "Try it with your store", Esc closes and refocuses the launcher. Phone: the launcher is inert while any field is in view (§5.7), so at the top Tab still passes it. |
| 4 | med | Close switch and nav switch handoff broken | **FIXED** | New `closeSwitchVisible` signal (`signals.ts`). In `AudienceSwitch.tsx` the close switch, and the hero switch on short screens, report "seen" while in view with the top edge below the tuck line (`--nav-top + --nav-h + 16`: 88, phone 80, the `.tuck` inset). The IO is rebuilt on resize. Nav: `hidden={quiet}`. The sticky hero keeps plain IO, because its lift transform would hand over too early. | Before (dev): two switches at 1280x720 y5591, 390 y7082 and 768 y7119, and none at all at the end of 1280x720. After: 18 viewport and route pairs, 41–96 positions each (`final/sw-matrix.txt`). No doubling at any close. 1280x720 max scroll shows the nav switch (sheet row 4). |
| 5 | low | 844x390: hero switch slides under the nav glass | **FIXED** | `Hero.tsx` wraps the switch in `.tuck`. `hero.module.css` gives it the close's view-timeline tuck, under `max-height:520px` only, where the hero is not sticky. The handoff is the same as in #4. | y35 hero switch at 125; y72 at 88 (the line); y107 tucked (opacity 0), nav switch shown, nothing under the pill (`final/aty.txt`, sheet row 5). |
| 6 | low | Caret blinks while paused and offscreen | **FIXED** | `Field.tsx`: `data-paused` from `usePlayback()`, `data-off` from the field's own visibility signal. `Field.module.css`: `.root[data-paused] .caret, .root[data-off] .caret { animation: none }`. | Paused: `running: []` at the hero, the window and the orbit (`final/pause.txt`). At the footer only the close caret (on screen) runs. The hero caret no longer runs (`final/idle.txt`). |
| 7 | low | axe `aria-allowed-role` (figure role=img) | **FIXED** | `RoasDial.tsx` and `ShareScale.tsx`: `<div role="img">` with the same label and description. The dial's `figcaption` became a div. | axe: no violations at brands/creators 1440 and 390, top and bottom (`final/axe.txt`). |
| 8 | low | Bare time in the folded read row | **FIXED** (my decision as final fixer: drop it) | `ChainList.tsx`: `.headTime` removed, with its CSS. The stopwatch above already stamps "Store details in 15.0s" / "Your grid in 16.2s". SPEC §5.2 line 2148 now matches §7.4. | Fold row reads "Four agents read your store · 9/9" and "Reading your profile · 9/9" (`final/stamp-row-*.png`, sheet rows 8). check:site: 1 word fewer per route. |
| 9 | low | Auto-open card folds before the stamp | **FIXED** (decision: keep 12s as the floor, and wait for the payoff) | `Promo.tsx`: two pausable clocks, the lead's 12s and `STAMP_HOLD_MS` 1.4s. The second starts when the thumbnail reports its run reaching the build (`PromoCard` `onRead`, act ≥ 1, 1.1s after the stamp). Auto-close happens when both are up, so the stamp is on screen for about 2.5s. Reduced motion uses 12s alone. It is driven by the run, not the data's times: a fixed 18s budget held the stamp only 1.3–1.6s in headless runs, because the first frame is slow. | brands: stamp at +16.8s after open, fold at +19.3s. creators: stamp at +18.8s, fold at +21.3s. Both hold 2.50s (`final/pt-b.txt`, `pt-c.txt`). |
| 10 | low | RTL smoke: word-split headings reversed | **FIXED** (wider than reported) | `dir="auto"` on WordReveal's root, on RunStage's own `RunH2` (same inline-block words: "handle a From / .live post a to") and on each hero chip's text span (same cause). | "From a handle to a live post.", "When do you get paid?", "The brand sets the payout…" and the chips all read in order under `dir=rtl` (`final/rtl-sheet-b.png-0.png`, `rtl-sheet-c.png-0.png`). Overflow 0. |
| 11 | low | Phone launcher over line ends at rest | **REJECTED** (tradeoff kept) | No change. A 64px end padding on every phone copy and figure row cuts the measure from 358 to 294px (18%) on every section, to clear one 48px disc that shows only after 1s at rest and tucks on the next scroll. Polish round 4 accepted the same tradeoff. | `qa/tour-b390/05.png` stands. |
| 12 | low | No-JS: dead Pause, grey nav over paper | **FIXED** (Pause) **+ improved** (skin) | `layout.tsx` `<noscript><style>`: `[data-pause]{display:none}` (PauseToggle now carries `data-pause`). The night glass also turns nearly opaque, `rgb(1 3 23/.94)`, so the pill reads as a solid night pill over paper instead of grey see-through. No `>` and no quotes, because React escapes style text. | `final/nojs-nav-strip.png` (sheet row 12): no Pause; a solid pill over paper. |

**Not counted as defects.** These are left as they are:

- **844x390 crossfade.** At 844x390 the probe counts two switches only inside the 16px tuck band (hero y74/78, close y6697). That is the designed crossfade: the nav's switch fades in as the big one fades out.
- **Hero edge on the sheet.** At 1280x720, 390x844 and 768x1024 the strict probe counts zero switches for about 20–40px where the sheet covers the hero switch's lower half. `useUncovered` hands over at the switch's top edge, and this predates this round.
- **360x740 lift.** On 360x740 only, the sticky hero's lift carries the half-faded switch 5px under the pill's bottom edge (y586–600). This also predates this round. 390x844 is clean.
- **QA's other 768x1024 and 1200x800 hero switch pairs.** QA listed these as "two switches" too (not the close cases in #4). They were false positives: at those points the hero switch is under the sheet, and QA's visibility check ignored occlusion. The hit-tested probe finds none, before or after.

**Files.** All under `app/(site)/`:

- `_site/shell/Nav.tsx`, `AudienceSwitch.tsx`, `Field.tsx`, `Field.module.css`, `PauseToggle.tsx`
- `_site/lib/signals.ts`
- `_site/Landing.tsx`
- `_site/hero/Hero.tsx`, `hero.module.css`, `Chips.tsx`
- `_site/close/close.module.css`
- `_site/mocks/RoasDial.tsx`, `ShareScale.tsx`
- `_site/window/ChainList.tsx`, `window.module.css`
- `_site/promo/Promo.tsx`, `PromoCard.tsx`
- `_site/ui/WordReveal.tsx`
- `_site/run/RunStage.tsx`
- `layout.tsx`

Also SPEC §5.0.5 (`data-at-hero`, the nav switch's `hidden`) and §5.2 line 2148.

**Checks (final state).**

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .` | 0 errors |
| `npx next lint --dir "app/(site)" --dir scripts` | No warnings or errors |
| `npm run check:site` | ok. /brands: 200, 1 h1, 1,090 visible words. /creators: 200, 1 h1, 1,387 visible words. 24 handles and 11 names checked. |
| `npm run measure` | measure ok (`final/measure-final.txt`) |
| axe (4 pages × top and bottom) | 0 violations |
| Tours: b1440, c1440, b390, c390, c390 reduced motion | Console empty on all five |

| route | first load | framework | motion+lenis | site | css | html | font preloads |
|---|---|---|---|---|---|---|---|
| /brands | 155.5 kB | 88.4 kB | 41.6 kB | 25.5 kB | 24.4 kB | 19.6 kB | 1 |
| /creators | 155.5 kB | 88.4 kB | 41.6 kB | 25.5 kB | 24.4 kB | 22.8 kB | 1 |

- **First load:** 4.5 kB of headroom. +0.4 kB from the switch IO, the yield and the caret gate.
- **Lazy site chunks:** 11, 72.8 kB of 110.
- **Sky chunk:** 5.7 kB.
- **Deny-list:** clean over 23 site chunks.
