# WP7 notes: Promo card

4 Oct 2026. Built to SPEC §5.7, with rulings 11 to 14, §1.4 (the 4.0s line), §1.7 (the switch while the card is open), §5.9 (reduced motion, no JS, pause) and INPUTS (writer.com's floating card, made honest). Nothing is committed; the lead commits.

## Files

| File | What it is |
|---|---|
| `app/(site)/_site/promo/Promo.tsx` | `Promo(PromoProps)`, which keeps the contract exactly. It reads the urgent audience, and `promoOpen` is the only source of truth for open, so `toField()` from anywhere (the nav's Start, the window's "Try it…") closes the card. It holds the visibility rules (rulings 13 and 14), the auto-open, the session record `hm.site.promo`, focus return, and the phone's close on a pointerdown outside the card. It also exports `PROMO_KEY`. |
| `app/(site)/_site/promo/Launcher.tsx` | `Launcher` (forwardRef to the `<button>`). The button is the hit area and shows or hides with a 200ms opacity and scale transition. Inside it, `.anim` plays `motion-safe:animate-launcher-in` / `-pulse`, keyed by a nonce so a pulse can replay. Inside that, `.face` is the disc (`bg-night-0`, `shadow-launcher`, press scale). The glyphs are a 20px full Moon, which plays one lunar cycle at `GLYPH.launcherStepMs` (90ms) on mouse hover, and an 18px X with a 2px stroke. They cross-fade with a 90° turn over 220ms. |
| `app/(site)/_site/promo/PromoCard.tsx` | `PromoCard` (forwardRef handle `{el}`). The dock is fixed, and scales down only on short viewports. The card is an `m.div` with `role="dialog"`, `aria-modal="false"`, `aria-labelledby="promo-h"`, `data-lenis-prevent` and `dawn-fade`. Inside: the lilac band (eyebrow, then an `h2#promo-h` with `tabIndex={-1}`), then the media. The media holds `<WorkingWindow variant="compact" loop>`, keyed by audience, on a floor of deep, plus the pill. It also handles the swipe down on phone. |
| `app/(site)/_site/promo/promo.module.css` | All WP7 styling (§2.3 variables only, no `@apply`/`theme()`), plus the entrance keyframes, scoped to `no-preference` and `[data-motion="full"]`. |
| `app/(site)/lab/promo/page.tsx` | Lab, with two views. **`?view=page`** (the default) is a stand-in page: a night hero with the **real** hero `Field`, the **real** `WorkSection` (it writes `work`, so the auto-open is real), a paper run, a night close with the **real** close `Field`, and the real `Promo`. A readout shows every signal the promo reads and the session record. Its buttons: clear session, block storage (every `Storage` call throws), keyboard (sets `keyboardOpen`), and open without focus. The lab writes the `surface` signal itself, with the Nav's rule, because a lab has no Nav. **`?view=gallery`** shows both audiences side by side on paper and on night: the launcher closed and open, and the card in flow. Every view takes the toolbar's audience, `?rm=1` and pause. `&debug=0` hides the readout. |

Every contract is kept exactly: `Promo(PromoProps)`. `Launcher` and `PromoCard` are WP7-internal (their props are WP7's). No WP0 or other-package file was touched, and no Tailwind key was added.

## Deviations from SPEC, with reasons

| # | SPEC | Shipped | Why |
|---|---|---|---|
| 1 | Thumbnail 360x210 with the pill "absolute bottom-4" over it | The compact window keeps its 360x210 (phone 16:9). Below it is a **48px floor** of the frame's own deep (`--floor`). The window dissolves into the floor over its last 24px (an eased sine ramp), and the pill floats on the floor (it overlaps the fade by 8px). The card is 371px tall (360x371; phone 366x367). | WP2's compact keeps the **working row in the 4th, bottom slot** (rows at y 163 to 197 of 210). A 40px pill at bottom 16 sits at 154 to 194, so it would have covered exactly the row that is working, all through the read. With the floor, the working row is always fully visible above the fade (`shots/WP7/run-brands-sheet.png`, `run-creators-sheet.png`). The fade is neutral deep alpha, not the brand gradient (rule 2.4.2 holds). |
| 2 | Launcher box `rounded-full bg-night-0 shadow-launcher` on the `<button>` | The button is a transparent 56/52px round hit area that carries the show/hide transition and the focus ring. The disc (`bg-night-0 shadow-launcher`) is `.face`, inside the animated `.anim` span. | §5.7 asks for the pulse ("one launcher pulse"), and a pulse that moved only the glyph inside a still disc would barely read. Rule 2.4.6 still holds: the keyframes (`both` fill) run on `.anim`, the button only transitions, and the press scale is on `.face`. |
| 3 | Open: "a white X at 18px with a 2px stroke" | An inline 18px SVG X, 2px stroke with round caps, instead of Phosphor's X. | Phosphor's stroke at 18px is 1.1px (regular) or 1.7px (bold), never 2. |
| 4 | Headline `tabIndex={-1}`, focused on a user open | Focused as specified, but it draws **no focus ring** (`outline: none`). | It is a programmatic focus target, not a control. In testing, a ring boxed the whole headline after a keyboard open. A screen reader lands on the dialog's name either way, and the next Tab reaches the pill, which has its ring. |
| 5 | "at most 2 lines" | Always exactly 2 lines: `max-width: 232px` plus `text-wrap: balance`. The lines are "Watch five agents / build a campaign" and "Watch HeyMoon / read a grid". | The creators headline fits on one line at 312px, so the band (and the card's top edge) would jump 25px on every switch while the card is open. At this measure both audiences, and Q1's "seven", break into balanced pairs. Writer's headline is 2 to 3 lines. |
| 6 | Switch while open: "the thumbnail remounts" | It remounts, keyed by audience, and the new one fades in over 200ms on top of the old one, which is held fully drawn and then removed. | A bare remount cut to a fresh window. A plain cross-fade (both fading) dipped the white window to grey through the deep background. Holding the old one under the fade keeps the window white the whole time (`shots/WP7/sw-sheet.png`). |
| 7 | Phone: "a swipe down of 64px or more on the card" closes | As specified, plus: the card follows the finger (upward drags resist at 0.2×), springs back below 64px, and on a swipe close it keeps going down from where the finger let go. The pointer is captured only after 6px of movement, and a drag swallows the click that follows it, so a tap on the pill stays a tap. The card has `touch-action: none` on phone. | Without the follow, a swipe has no feedback until it suddenly closes. Without the late capture, `setPointerCapture` on pointerdown would retarget the pill's click to the card. |
| 8 | (none) | When the launcher has to hide (desktop: the close field comes into view; phone: any field in view or the keyboard opens), an open card closes with it. That forced close does **not** write `"dismissed"`. | Ruling 14: "It never covers a field and never competes with the bookend." A card left open would cover the close field from 1024 to about 1348 wide, and on phone always. |
| 9 | (none) | Short and wide (`max-height: 520px` and `min-width: 640px`): the card docks **beside** the launcher (`bottom: 24px`, `end: 92px`), and on any viewport the dock scales down (`--fit`, from the card's layout height) when the card would not fit above its bottom edge. At 844x390 the fit is 0.954. | At 844x390 the 371px card at bottom 92 started 73px above the viewport. |
| 10 | (none) | The open's `filter: blur()` is dropped once the card is sharp (`transitionEnd: {filter: "none"}`). | Otherwise motion leaves `filter: blur(0px)` inline, which keeps a filter layer on the card while it rests. |
| 11 | (none) | An internal `openId` prop refocuses the headline when the card is reopened during its own 240ms exit. | AnimatePresence brings the same element back, so a mount-only focus effect would not run again. Found in testing (Esc, then Enter on the launcher straight away). |
| 12 | Pill `shadow-float` | `shadow-float` plus a 1px contact shadow (`0 1px 2px rgb(0 0 0/.2)`). Hover: lilac `#F3EFFC`. Press: scale .97. Focus ring: `rgb(167 139 250/.9)` (on deep). | The token alone left the pill's lower edge soft on the deep floor. `bg-white/90` (the usual hover) turns grey over deep. |
| 13 | Global `:focus-visible` (offset 3px) | Launcher ring at offset 7px. | At 3px the focus ring sat inside the launcher's own 2px ring and 6px halo and did not read. |

The card's `transform-origin` is the launcher's centre at every layout: desktop, phone (computed with `max()` and `env(safe-area-inset-bottom)`), short screens, and RTL mirrored.

## Requests to the lead

1. **Hero field and a user-opened card (decision, no change made).** Ruling 14 hides the launcher only for the close field on desktop. Below about **1348px** wide, a card the visitor opens at scrollY 0 overlaps the end of the hero field (the Start button). At 1024x768 the card spans x 640 to 1000 and y 305 to 676. It only happens when the visitor opens the card, never on an auto-open (the auto-open needs `work.passed`, by which time the hero is covered), and the pill and the X are both one press away. If you want the field never covered, the smallest rule is: below 1348px, hide the launcher while `heroFieldVisible` too (one line in `Promo.tsx`, `shown`). I did not do it because §5.7 says the desktop launcher appears at 4s, at the hero.
2. **Probes with the card open (WP-F, informational).** The compact thumbnail's stopwatch also carries `data-stopwatch` (WP2's `Stopwatch`). The page's window comes first in the DOM, so §7.2's `document.querySelector("[data-stopwatch]")` still reads the page window. A probe run while the card is open should be scoped to `[data-slot=work] [data-stopwatch]`, or to `#promo-card [data-stopwatch]` for the thumbnail.
3. **Q1 is a pure `copy.ts` flip for WP7.** The headline reads `COPY.brands.promo.headline(DEMO)`. "Watch seven agents / build a campaign" balances to the same two lines, so the band does not change.

## Acceptance (§5.7), with evidence

I tested in a private headless Chromium (SwiftShader) driven by `scratchpad/tools/wp7.cjs`. Shots are in `scratchpad/shots/WP7/`. The headless renderer runs at about 5 to 15 fps, so motion timings in these runs are slower than real time (the timeline clamps each frame to 40ms), never faster.

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | On desktop the launcher appears 4s after load. | **PASS** | `performance.now()` 3201: `data-shown="false"`; 4301: `"true"` and not `inert` (1440x900, brands lab). On `/brands`, shown at 5.5s, exactly one launcher. |
| 2 | At 390 wide it is absent while any part of either field is on screen, and while the keyboard is open. | **PASS** | 390x844, isMobile. At the hero: `"false"`. Scrolled past the hero: `"true"`, with one `launcher-pulse` on the inner span. With the close field fully in view: `"false"`. With `keyboardOpen` set: `"false"`, and the open card closed. With the keyboard cleared: `"true"`. (The close field uses WP0's IO, threshold 0, so one pixel on screen counts.) |
| 3 | axe sees a dialog with its name taken from the headline. | **PASS** | `role="dialog"`, `aria-modal="false"`, name "Watch five agents build a campaign" from `aria-labelledby="promo-h"`. axe-core 0 violations on `#promo-card` (19 passes) and on the launcher. |
| 4 | Esc closes it and focuses the launcher. | **PASS** | Esc with focus on the headline: closed, `document.activeElement` is the launcher. The same with focus on the pill (after Tab). Esc on the launcher while open closes too. |
| 5 | The pill scrolls to the nearest field and focuses it. | **PASS** | At scrollY 2600 (the close field is nearest): the pill closed the card (`promoOpen` false), scrolled to 3574 and focused `#lab-close-store`. At the top, it goes to the hero field. |
| 6 | Auto-open fires when you scroll quickly past the frame before 60% of the run, and only once per session. It never fires on phone. | **PASS** | 1440x900: wheel 1100 then 1600 (frame passed at about 3% of the run). The card opens on its own after one pulse and 600ms. Focus stays on `<body>`. Session `"auto"` (`shots/WP7/auto-open.png`). A close writes `"dismissed"`. Reload and the same scroll: no auto-open. At 390x844 the same scroll: no open, session empty. |
| 7 | In a private window with storage blocked, there are no errors. | **PASS** | An init script makes the `sessionStorage` and `localStorage` getters throw `SecurityError`. Console clean, no auto-open after the fast scroll, and open, Esc and close all work. The lab's "block storage" button reproduces it live. |
| 8 | The thumbnail's stamp reaches "Store details in " + `read.totalText` at real pace, never earlier. | **PASS** | From the launcher click to "Store details in 15.0s": 16,981ms, against the 15,522ms minimum (500ms lead + 15,022ms). The stamp then holds "15.0s" and the plan shows. Creators: "Your grid in 16.2s". |
| 9 | The compact thumbnail never shows a time without its label beside it. | **PASS** | Every frame was sampled from open to stamp: 152 distinct stopwatch texts, 0 with an empty label ("Reading", then the stamp). Paused at open: "Reading 0.0s". |
| 10 | After the launcher has appeared, scrolling to the close field hides it again (opacity 0, `inert`). | **PASS** | `data-shown="false"`, `inert=""`, `aria-hidden="true"`, computed opacity `0`. |

Also checked against §5.7 and §5.9:

| Item | Result | Evidence |
|---|---|---|
| Open choreography: the X at 0; the card scale .92, y 12, blur 6 to rest (420ms outExpo, from the launcher); eyebrow +60; headline masked rise +120; thumbnail wipe +120 (500ms); pill +360; loop +500. | PASS | 10× slowed capture (CDP playback rate plus a patched clock), `shots/WP7/slow-sheet.png` |
| Close: 240ms exit to scale .96, y 8, opacity 0; the X turns back into the Moon. | PASS | The element is removed after the exit (716ms headless, at 4 frames). |
| Switch while open: the headline cross-fades over 200ms (the outgoing copy is `aria-hidden`; one `#promo-h`); the thumbnail remounts and stays white through the fade. | PASS | `shots/WP7/sw-sheet.png` |
| Reduced motion (`?rm=1` and emulated `reduce`): open and close are a 150ms opacity fade (computed `transform` and `filter` are `none`); the thumbnail is final at once ("Store details in 15.0s"; after a switch, "Your grid in 16.2s"). | PASS | `shots/WP7/rm-open.png`, `rm-switch.png` |
| Paused: the thumbnail holds. | PASS | "Reading 0.0s" after 3s paused; "3.0s" 3s after resuming; it holds at "3.0s" when paused again. |
| No JS: the launcher is hidden. | PASS | SSR `/brands`: `data-shown="false" aria-hidden="true" inert=""`. |
| Phone: a pointerdown outside closes it; a swipe of 140px closes it; a 40px swipe springs back. | PASS | 390x844 touch (CDP touch events) |
| Hover: one lunar cycle at 90ms a step; the ring brightens. | PASS | `shots/WP7/lin-sheet.png` (bottom row) |
| RTL: the launcher and the card mirror to the start edge. | PASS | `dir="rtl"`: card x 24 to 384, launcher x 24 to 80 |
| Short 844x390: the card fits beside the launcher. | PASS | top 12, bottom 366, fit 0.954 (`shots/WP7/short.png`) |
| No gradient on the launcher ring, the band or the pill. No play triangle, no "Live", no timestamp. | PASS | Ring `#9B7BF0` (token); band `--lilac`; the fade is deep alpha |
| Contrast: eyebrow #4D2FB0 on #F3EFFC (about 7:1); headline ink on lilac; pill ink on white. | PASS | |

Views: `shots/WP7/run-brands-sheet.png` and `run-creators-sheet.png` (the full loop, 1440 at 2x), `final-brands-2x.png` (on `/brands` at the hero), `ph1-open.png` (390x844), `gallery-1.png` and `gallery-phone.png` (both audiences, paper and night).

## Checks

- `npx tsc --noEmit -p .`: clean (whole project).
- `npx next lint --dir "app/(site)"`: no warnings or errors.
- `npm run check:site`: ok (`/brands` and `/creators`, 24 handles and 11 names checked).
- Lab: `/lab/promo?a=brands`, `?a=creators`, `&rm=1`, the toolbar pause, and `?view=gallery`, at 1440x900 and 390x844. The console was clean throughout. The one exception is motion's own "You have Reduced Motion enabled" notice under `?rm=1`.
