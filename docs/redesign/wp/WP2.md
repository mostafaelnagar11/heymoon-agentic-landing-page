# WP2: Working window (S4, "Fifteen seconds")

4 Oct 2026. Built to SPEC §5.2 against WP0 as shipped (WP0-NOTES). WP8's mocks were still WP0 stubs for the whole build; the window imports them by contract (see R1).

## What shipped

| File | What it does |
|---|---|
| `window/useRun.ts` | The schedule from DEMO only (§5.2.2): R, F = R + 600, B0 = F + 500, build units at B0, creators W / P0 / picks / foot, acts, END, and every mark. `snapAt(schedule, mark)` is a pure function that gives the frame at a mark (row states, counters, status line, stamp, fold, artefact flags). `useRun` wraps WP0's `useTimeline` (the only clock), throttles `onProgress` (act changes, 10% steps, done), handles `seek` and `restartNonce` by nonce, and mirrors `t` into a `RunClock` context that only the page variant writes and only the act rail reads. |
| `window/WorkingWindow.tsx` | The contract export, both variants. Page: a title bar (Star, store or handle, the status line, counter, labelled stopwatch, progress glyph), the chain on the left, the artefact on the right. Below 1024, one column (48px bar, a 32px status strip, a 5-row viewport, a 280px pane). Compact (WP7): frame art, a 16px-inset window, a 32px header with the full stopwatch group, the last four read rows, then MockPlan (brands) or MockTiers (creators) at 0.72. Also exports `FrameArt` (the halftone and the measured dotted arc, R = 1.1 × width, apex 120px above the bottom) and the two frozen views the lab uses. |
| `window/ChainList.tsx` | Page: the read header, rows that unfold 4 to 9 (300ms, 40ms stagger), the fold (rows collapse in 500ms into the header, which becomes the summary row: full moon, title, 9/9, `read.totalText`), a hairline, the build header and its rows. One lilac highlight glides between working rows and stretches over two when creators and safety work together. Below 1024 the list slides (300ms) so the working row sits in slot 4, with top and bottom fades. Compact: the last four rows, sliding up. Every position is derived from state plus CSS row heights, never measured, so slide, fold and highlight always agree. |
| `window/ChainRow.tsx` | One row: Moon (0 waiting, cycling while working and playing, static 2 while paused, 4 done), the agent in Geist Mono caps, then `note` (with "…" while working) cross-fading to `produces` (200ms, 4px). Never a read value. |
| `window/Stopwatch.tsx` | `[data-stopwatch]`: "Reading" then the stamp, beside the time. React renders the time once (the server's final value); the clock writes `textContent` only when the tenths change. Frozen at `read.totalText` after R. |
| `window/Artefact.tsx` | Act 0: the store or handle card (Globe or At, mono URL). Every unit the read has found holds a skeleton tag; its `produces` replaces it on landing. The fold collapses the tags (300ms). Brands: MockPlan with reveals flipping per row, checks for safety and brief, MockPhases under it. Creators: the card collects the build's four products, then MockWhy fills (120ms), then MockTiers (picks at 343/667/911ms past P0, then the foot). An invisible ghost of the largest final state sizes the stage, so nothing shifts; a `Fit` wrapper scales the stage down (never up) to the pane. |
| `window/ActRail.tsx` | Desktop and tablet: three buttons, each with a 2px track whose fill is written per frame from the shared clock (`scaleX`, origin flips in RTL), "01" with a glyph (0 / working / 4), title, body. Phone: three small track buttons, then the active act's title and body. A click seeks. Hyphenated words ("Pre-qualified") never break at the hyphen. |
| `window/WorkSection.tsx` | §5.2.1: head (WordReveal H2, sub), the deep frame (`role="region"`, "A sample run", sr-only summary), the window, the controls (outside the aria-hidden window; `inert` until done), the sentinel for `passed`, the act rail. Gating, the `work` signal and rule 2.4.7 arming live here. |
| `window/window.module.css` | All of the above. §2.3 variables only, no `@apply`/`theme()`, every transition and animation under `prefers-reduced-motion: no-preference`. |
| `lab/window/page.tsx` | `?view=page` (default: the real section below the fold, with room to scroll past), `top` (in view at mount, stays final), `scrub` (any instant via `&t=ms`, a slider and presets, page and compact on one clock, rail synced), `compact` (live, looping, with a playing toggle). All take `?a=`, `&rm=1`, the toolbar pause, and `&readout=1` (the `work` signal and the stopwatch live). |

## Deviations from SPEC, with reasons

| # | SPEC | Shipped | Why |
|---|---|---|---|
| D1 | Header row 40px | 40px from 1024 (creators 56px: the title with `read.sub` under it). Below 1024 the header is 48px, one row. The divider is 8px so summary + divider + build header = two rows. | The phone slide then always lands on row boundaries: no half-cut row at the top of the 5-row viewport. |
| D2 | Controls at `bottom-5 end-5` | From 1024, as SPEC (over the pane's foot, which reserves 88px). Below 1024 they sit at the foot of the rows' viewport, just above the 280px pane, over a deeper white fade. | Over the 280px pane they would cover the finished plan, or force it to shrink at the moment it completes. |
| D3 | Pointer over the window pauses | A pointer the visitor **moved** over the window pauses (pointermove with movement), with the ring; scrolling clears it; leaving resumes. Pressing "Run it again" consumes the hover. | Found in testing: the window covers most of a 900px viewport, so a pointer resting mid-screen while the wheel brings it up held the run at 0.0s until the mouse moved. And "Run it again" did nothing until the pointer left, because the press is over the window. |
| D4 | Head on a 12-col grid, phone stacked | 12-col from 1024; stacked below it. | At 640 to 1023 the 5-col sub is taller than the 6-col H2 and pushed the H2 down by its own height. |
| D5 | "A tag per landed unit" | Each unit the read has found (4, then 9) holds a skeleton tag (`ink/6`, MockPlan's own skeleton language); landing replaces it with the `produces` tag (fade-up on the text). The card is top-anchored and grows down at the unfold. | An empty card that fills one chip at a time read as broken for the first seconds; skeletons show the work queued and keep each tag's place. No new text. |
| D6 | Creators act 1: "The build rows run. When the last one lands (W), MockWhy …" | Between B0 and W the handle card collects the build's own four `produces` as tags. | SPEC is silent on what the pane shows for those 7.2s; this is the product's words, nothing invented. |
| D7 | "ladder → MockPhases grown under the card" | MockPhases fades in (bars empty) when the ladder row starts (act 2), and grows when it lands. Its space is reserved from B0, so the plan never moves. | It visualises the row in progress, then landing. |
| D8 | The read header has no glyph; the summary has a full moon | Each run header carries its progress glyph, `round(4·done/total)` (§5.0.2 "progress"). | The fold becomes continuous: the glyph waxes as the read lands and is already the summary's full moon. Partial phases here are state (ruling 35). |
| D9 | Mocks take props only; default placement `absolute inset-x-6 top-1/2 -translate-y-1/2` | Each mock sits in a mount that brings a root carrying `.absolute` into flow (CSS, so SSR and no-JS are right); any other absolutely placed root gets the mount sized to it after layout. Verified by injecting a spec-placed root: mount height = child height, zero inset. | MockPlan, MockPhases, MockWhy and MockTiers take no `className`, and the window stacks them. See R1. |
| D10 | Compact artefact "scaled with CSS zoom 0.72" | `transform: scale(.72)`, top-anchored, cropped by the thumbnail's bottom edge. The page pane uses the same idea (`Fit`), only when the stage is taller than the pane. | Transforms keep layout measurement stable across engines; the text is still real text. |
| D11 | Status line `text-small text-ink/60` | The agent name at ink/72, weight 500; the note at ink/60. | Hierarchy inside one line, Linear-style. Still one line, ellipsis. |
| D12 | Reduced motion: final state | Final state, controls visible, no "Run it again" (as SPEC). The rail still works: under reduced motion a click jumps to the END of that act (a static step), since a reduced window never plays. | A seek to an act's start would freeze the window mid-act. |
| D13 | (not specified) Status line at idle and during the fold | t = 0 shows the read opener with every row waiting (the run starts at 1ms). During the fold: the build opener (brands), else the last read line. | Product stream lines only. |
| D14 | Below 1024 bar: Star, handle, stopwatch; status in the strip | The strip also carries the counter and the progress glyph at its end. | Below 1024 there is no room for them in the bar, and the counter must stay visible while the list slides. |
| D15 | 55% visibility | 55% of the frame, or of the viewport when the frame is taller than it. | Otherwise a 684px frame could never start on a 390px-tall landscape screen. |
| D16 | `setSignal("work", …)` | `overall` is written rounded to tenths. | It changes only on 10% steps anyway; WP7 reads `< .6`. |

## Requests to the lead

- **R1 (WP8).** MockPlan, MockPhases, MockWhy and MockTiers: either take `className` or render an in-flow root. WP2 already copes with the spec'd `absolute inset-x-6 top-1/2 -translate-y-1/2 sm:inset-x-8` root (D9), so either way works; please have the verifier look at `/lab/window?view=scrub&t=30000` (brands) and `&a=creators` once the real mocks land. MockPhases must animate its own grow on a `grown` change from false to true (WP2 renders it with `grown=false` first). MockWhy must show `filled` rows only, and MockTiers the `shown` picks only and the foot only when `showFoot`.
- **R2 (layout check).** The phone pane is 280px (SPEC). With v1's proportions (MockPlan about 172px, MockPhases about 134px) the brands stack scales to about 0.78. If it reads too small with the real mocks, I suggest a 320px phone pane (frame about 724px, still inside 844 minus the nav). One number in `window.module.css` (`.pane`, and `.controls` `bottom`).
- **R3 (WP7).** `WorkingWindow variant="compact"` is `w-full aspect-video` below 640 and 360x210 from 640, `aria-hidden`, no controls. Give it `playing={open && !paused}` and `loop`; it starts from 0 on mount (client mount), and shows its final state under reduced motion. Its `[data-stopwatch]` comes after the page's in DOM order on the Landing.
- **R4 (WP-F).** `PageWindow` and `CompactWindow` are exported only for the lab's frozen views; WorkingWindow is their only production caller, so nothing to delete with `lab/`.

## Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .` | 0 errors (whole project) |
| `npx next lint --dir "app/(site)"` | No warnings or errors |
| `npm run check:site` | ok: /brands and /creators 200, 1 h1, 24 handles and 11 names checked |
| Console, lab page and /brands | No errors or warnings from WP2 (motion's own "Reduced Motion enabled" notice under `--rm`) |
| Horizontal scroll | none at 1440, 1024, 768, 390 (`scrollWidth` = viewport), nor in RTL |

## Acceptance (§5.2.5), with evidence

Evidence is from the private headless browser (screenshots in the scratchpad `shots/WP2/`), with in-page `performance.now()` timing measured from the stopwatch's first tenth.

**Brands**

| Line | Result | Evidence |
|---|---|---|
| Scroll the frame to 55% in view; the rows start | PASS | Before the scroll the `work` signal reads `idle` and the stopwatch "Reading 0.0s" (armed below the fold, rule 2.4.7); after it, `playing`. |
| Counter "3/4" until about 6.0s, then "4/9" | PASS | "3/4" at 4.3 to 6.0s; "4/9" at **6.09s** (bound 6,048ms). |
| `[data-stopwatch]` ends at exactly "Store details in " + totalText and never changes | PASS | "Store details in 15.0s" at **15.07s** (bound 15,022ms), unchanged in every sample to 34s. |
| Fold at about 15.6s; build header "Five agents on your plan" | PASS | `data-folded="1"` at **15.67s**; header text from `build.title`. |
| Matching creators and Vetting land in the same frame | PASS | Both rows "working" together from 19.6s (one highlight over two rows); both end on the same mark (B0 + 5,640). |
| End: "Phase 1 · Warm-up", "Guaranteed", "$1,000", "UAE, KSA, Kuwait", three discs, phase bars 16/53/100% | PASS (props) / verify with real WP8 | At END MockPlan gets `view.plan()` with every reveal on and both checks; MockPhases gets `view.phases()` (widths .16 / .533 / 1) with `grown`. Rendering is WP8's. |
| Controls appear 30.9s ±0.3s after the start | PASS | `data-on="1"` at **30.94s**. |

**Creators**

| Line | Result | Evidence |
|---|---|---|
| "Reading your profile", "@yourhandle · five agents"; stamp "Your grid in 16.2s" | PASS | Header shows both lines; stamp "Your grid in 16.2s" at 16.29s; controls at **30.19s** (SPEC about 30.1). |
| "Three agents building your profile" | PASS | Build header from `build.title`. |
| MockWhy: four labels, each with a full Moon, no meter; the pane has no digits | PASS (props) / verify with real WP8 | At W + 250 the pane's rendered text is MockWhy's only (MockTiers and the ghost are `visibility: hidden`, so `innerText` excludes them); `view.why()` passes all four `lit`. |
| MockTiers 12%, 12%, 11%, then Dune Run "Request to join", then "12 more, each a request to join" | PASS (props) / verify with real WP8 | `view.tiers()`; `shown` 1, 2, 3 at P0 + 343 / 667 / 911; `showFoot` at P0 + 1,311. |

**Both**

| Line | Result | Evidence |
|---|---|---|
| Scrolling away pauses; returning resumes from the same tenth | PASS | Away at "Reading 8.1s" for 2s; back, the next sample read "8.3s" (the 200ms after return). |
| Hover pauses and shows the ring | PASS (D3) | Moved over the window: ring `rgba(18,21,27,.2) inset 1px`, watch 2.6 → 2.6 over 1.2s; left: ring 0, resumed. A pointer resting under a scroll does not pause. |
| No-JS: curl HTML contains "Five agents on your plan" and "15.0s" | PASS | curl `/brands`: both present, plus "Store details in"; `/creators`: "Three agents building your profile", "Your grid in", "16.2s". |
| Clicking act 3 completes the plan at once | PASS | Seek to `acts[2]`: plan layer on with every reveal and both checks; the ladder row works, phases grow when it lands; done 5.4s later. |
| axe: no focusable element inside `aria-hidden` | PASS | 0 links, buttons, inputs or `[tabindex]` under `[aria-hidden=true]`; the controls are outside the window and `inert` until done. |
| No text inside the window below the §2.1 floors | PASS | Smallest text is ink/60 on white (rows, agents, counters, status, stopwatch label, header sub); on the status strip (canvas at 55%) ink/60 is about 4.7:1; working rows are ink/88 and #4D2FB0 on the lilac highlight; tags ink/72 on canvas. Skeletons carry no visible text. |

**Also verified**

- Rule 2.4.7: in view at mount (`?view=top`) the window stays final with the controls; below the fold it arms to the start while unseen.
- Reduced motion (`--rm`, both sides): final state, "Store details in 15.0s", controls visible and not inert, no "Run it again".
- User pause (toolbar): the stopwatch holds ("Reading 0.0s" twice, 1.5s apart), the signal reads `paused`; unpausing resumes.
- `passed` turns true once the frame's bottom is above the viewport.
- "Run it again" restarts from 0 and plays at once (D3).
- Compact: plays at real pace, the stopwatch group always shows its label ("Reading 5.2s", then the stamp), the plan or tiers rise in after the fold, and it loops after 2s.
- RTL (`dir="rtl"` on html): the layout, the highlight, the rail fills and the title bar mirror; URL, handle and numbers stay LTR.
- 1024x768 and 768x1024 fit with no overflow.

## Fix round (4 Oct)

Files touched: `window/ChainRow.tsx`, `window/ChainList.tsx`, `window/Artefact.tsx`, `window/WorkingWindow.tsx`, `window/window.module.css`. `useRun.ts` (the schedule), `WorkSection.tsx`, `ActRail.tsx`, `Stopwatch.tsx` and `lab/window/page.tsx` are unchanged. Screenshots: `scratchpad/shots/fix/WP2/` (`before-*` are the state at the start of the round).

| # | Item | Result | What changed, and the evidence |
|---|---|---|---|
| 1 | Lead (1): early in the run the lower half of the desktop window is an empty white/lavender block; the chain has 4 rows and the card sits high | **FIXED** | **Skeleton rows.** From the first frame the read holds a row for every unit it will run; rows 5 to 9 are skeletons (bars the width of their own agent and note at ink/6, a faint phase-0 glyph) until the read finds them at `sizes[1]`, then cross-fade in (300ms, 40ms a row). The list never grows, and the counter still reads 3/4 then 4/9. **Skeleton tags.** The card holds a skeleton tag for all nine read units from the first frame, so it never grows during the read. **Centred.** The act-0 card is centred in the pane (SPEC "content centred"; the old top anchor was mine), and the plan is centred until the phases arrive, then glides up 77px (700ms) as they fade in under it. **Alive.** Queued skeletons breathe (an opacity overlay, a wave by row/tag, 1.8s) only while the run plays (`data-live`, rule 2.4.8); paused, they hold; reduced motion has no pulse. **Fold.** The build header and its rows rise in as the read folds (F) instead of at B0, so the list is whole through the fold. Evidence: `before-b-3000.png`, `before-c-3000.png` against `b1-3000.png`, `c1-0.png`, `Lb2-0.png` (live, 0.5s), `real-b1440-0.png` (/brands in context), `Lb3-0.png` (fold), `b2-22000.png` (plan centred in act 1), `b2-26200.png` (act 2), `pulse-1.png`. |
| 2 | Lead (1): size the frame to its content | **FIXED** | From 1024 the frame hugs the window, and the body is sized by the run's tallest moment: 8 + 56 (the taller read header) + 9 rows × 52 + a 24px foot = 556px (window 608, frame 664, was 720). One height for both audiences, so the Landing's swap does not move the page. Pane box insets 32/24/64: a full stage still clears the controls, a stage that fits sits 16px above centre. The stage is never narrower than 320px (the box scales it), which also fixes MockWhy's title truncating at 1024 (`t1024-30100.png` before, `t1024b-30100.png` after, k .97). The whole frame fits under the nav at 1440×900 with the act rail in view. |
| 3 | R1 (WP8): mounts, MockPhases grow, MockWhy `filled`, MockTiers `shown`/`showFoot` | **RESOLVED** (no change) | WP8 kept `FRAME`'s `absolute` root on purpose; the lead confirmed the `.mount > .absolute` wrapper. Measured mounts in flow (plan 231, phases 142, why 148, tiers 220 at 310 wide). `/lab/window?view=scrub&t=30000`: brands `final-b-30000.png` (pane text "Phase 1 · Warm-up, Guaranteed, You pay $1,000, Markets UAE, KSA, Kuwait, Creators" + both checks + phases; bars 16% / 53.3% / 100%, `final-b2-30890`), creators `final-c-30000.png` (MockWhy four labels with full Moons, MockTiers 12%, 12%, 11%, Dune Run "Request to join", "12 more, each a request to join"). MockWhy alone at W + 250 (`final-c-24785.png`): pane text has no digit, 0 meters. Phases fade in ungrown at the ladder start (`b2-26200.png`) and grow when it lands; tiers keep their place before the foot (`c2-26000.png`: three picks, the request row and the foot held as skeletons until `showFoot`). |
| 4 | R2: phone pane 280px | **FIXED** | With the real mocks the brands stack is 385px tall and was scaled to **0.64** in the 280px pane (`before-pb-30890.png`, 7px labels). Now: the rows' viewport is the header plus **4** rows (240px; the last working row sits in the 4th of 5 visible slots once scrolled, the next row peeks under it), and the pane is **380px** below 640, **420px** from 640 to 1023 (`--pane` on `.winWrap`; the controls follow it). Brands scale **0.91** on phone (`pb1-30890.png`, `pb2-22000.png`), 1.0 at 768 (`t768-30890.png`); creators tiers 1.0 (`pc1-30100.png`). Phone frame 745px (was 692): the window sits whole under the nav at 390×844 (`real-c390-0.png`). No horizontal scroll at 390, 768, 1024, 1440. |
| 5 | R3 (WP7): compact `playing`/`loop` | **RESOLVED** (WP7 did it) | `PromoCard.tsx`: `<WorkingWindow variant="compact" … playing={playing && present} loop />`. Compact untouched this round (`compact-c.png`). |
| 6 | R4 (WP-F): `PageWindow`/`CompactWindow` exported for the lab only | **STANDS** (informational) | Nothing to delete with `lab/`. |
| 7 | WP2 never independently verified: re-run §5.2.5 | **PASS** (below) | |

**§5.2.5 re-run (this round).**

- Brands counter 3/4 then 4/9 right after "Reading 6.0s"; `[data-stopwatch]` ends at exactly "Store details in 15.0s" and never changes; fold 600ms after the stamp; build header "Five agents on your plan"; controls at END (in-page log, `timing.cjs`). The machine was at load average 24 with ~50 Chromium processes from parallel agents, so the headless clock (40ms dt clamp) ran slow in the first seconds; the schedule (`useRun.ts`) is unchanged, so the build round's wall-clock numbers (4/9 at 6.09s, controls at 30.94s) stand.
- Matching creators and Vetting land in the same frame, one highlight over both (unchanged logic; `b2-22000.png` shows both done together).
- Creators: "Reading your profile" with "@yourhandle · five agents", stamp "Your grid in 16.2s", "Three agents building your profile" (`c1-19000.png`, `rm-c1440-0.png`).
- No-JS: curl `/brands` has "Five agents on your plan", "Store details in", "15.0s"; `/creators` has "Three agents building your profile", "Your grid in". `npm run check:site` ok (24 handles, 11 names).
- Reduced motion: final state, stamp, controls visible, no "Run it again", no pulse (`rm-c1440-0.png`, `rm-b390-0.png`).
- RTL: skeleton bars, the card, the rows and the title bar mirror; no horizontal scroll (`rtl-3000.png`).
- Nothing focusable was added inside the `aria-hidden` window; the skeleton spans are aria-hidden text, `user-select: none`.
- `npx tsc --noEmit -p .`: 0 errors. `npx next lint --dir "app/(site)"`: no warnings or errors. Console: no errors or warnings from WP2 (motion's own reduced-motion notice under `--rm`).

**Deviations updated by this round:** D5 (now every read unit holds a skeleton tag from the first frame, and the card is centred, not top-anchored); D7 (the space under the plan is no longer left empty in act 1: the plan is centred and glides up when the phases arrive); D2 (the controls now sit above a 380/420px pane); SPEC "header plus 5 rows" and "Artefact at 280px" below 1024 are now 4 rows and 380/420px (R2); SPEC `h-[720px]` from 1024 is now content-sized (664px). New: the build rows show (waiting) from F rather than B0; the bar's counter still switches at B0.

**Left as is, for the lead.** At rest the creators list column holds the summary and four build rows (316 of 556px), so its lower part is calm while the pane carries the act; the fold and the four build units are SPEC and data, and nothing may be invented to fill it.
