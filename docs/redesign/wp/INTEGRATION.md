# Integration notes (WP-F, part 1)

The integrator runs after every fixer has finished. It checks the whole site, fixes what fails, and records every edit here.

Screenshots and probe output: `scratchpad/shots/fix/INTEG/`. Probe scripts: `scratchpad/integ/` (`switch.cjs`, `field.cjs`, `pause.cjs`, `cls.cjs`, `runmock.cjs`).

## Fix round (4 Oct)

### Edits made

None. Every check except the CSS budget passed without a change. The CSS failure can't be fixed with a small edit and needs a ruling (see "Open problems").

### 1. Static checks: PASS

| Check | Result |
|---|---|
| `npm run bind -- --check` | `demo.json ok · brands read 15.0s · creators read 16.2s · 7db478b` |
| `npx tsc --noEmit -p .` | 0 errors |
| `npx next lint --dir "app/(site)" --dir scripts` | No warnings or errors. The 6 `no-explicit-any` errors WP8 reported are gone. |
| `npm run check:site` | ok. /brands: 200, 1 h1, 1,091 visible words. /creators: 200, 1 h1, 1,388 visible words. Checked 24 handles and 11 names. |

### 2. `npm run measure`: FAIL on CSS only

| route | first load | framework | motion+lenis | site | css | html | font preloads |
|---|---|---|---|---|---|---|---|
| /brands | 158.0 kB | 88.4 kB | 42.1 kB | 27.5 kB | **22.7 kB** | 19.7 kB | 1 |
| /creators | 158.0 kB | 88.4 kB | 42.1 kB | 27.5 kB | **22.7 kB** | 22.9 kB | 1 |

- **Passing:** first load is within budget with 2.0 kB to spare. Lazy site chunks are 87.6 kB of 110 (18 chunks). motion+lenis is 42.1 of 44. Site code is 27.5 of 45. The sky chunk is 5.7 of 8 and stays out of the first load. HTML is under 60 kB. There is exactly one font preload, and both routes are static (○).
- **The deny-list is clean:** 24 handles, 11 names and 4 patterns, checked over 38 site chunks.
- **Failing:** `✗ /brands: CSS 22.7 kB > 18.0 kB` and the same on /creators.

**Where the CSS comes from (gzip):**

- **`/(site)/layout` CSS, 11.6 kB:**
  - Tailwind utilities: 7.1 kB, of which lab-only classes are 0.8 kB.
  - Preflight and base: 1.3 kB.
  - `globals.css`: the rest.
  - The two font CSS files: 0.5 kB.
- **Page CSS, 11.1 kB.** This is the CSS modules of the hero and of every `next/dynamic` section. Next puts all of it in one file, linked with `data-precedence="dynamic"`. Each module's share:

  | Module | Share (kB) |
  |---|---|
  | window | 3.94 |
  | orbit | 1.72 |
  | close | 1.32 |
  | run | 1.17 |
  | mocks | 1.09 |
  | hero | 0.89 |
  | number | 0.45 |
  | Field | 0.26 |
  | WordReveal | 0.23 |

- **Promo CSS, 2.0 kB, which `measure` does not count.** `brands.html` links a third dynamic stylesheet, `78de1cafceda1242.css`, for the promo launcher and card. The CSS that actually blocks the first paint is therefore **24.7 kB**.
- **The overage predates the fix round.** Authored CSS grew only about 0.8 kB gzip this round (HEAD 11.10 to 11.88, an estimate from the sources without Tailwind), so the budget was already failing at about 22 kB.
- **No §7.1 lever applies.** All three levers (audience split, async LazyMotion, dropping Suspense) move JS only. None of them changes CSS.

### 3. Tours: no regression from the parallel fixes

**Tours run:**

| Page | Viewport | Motion | Shots |
|---|---|---|---|
| /brands | 1440x900 | on | 11 |
| /creators | 1440x900 | on | 11 |
| /brands | 390x844 | on | 11 |
| /creators | 390x844 | on | 12 |
| /brands | 1440x900 | reduced | 10 |

I looked at every shot. The contact sheets are `sheet-*.png`.

- **Console:** empty on every tour. The reduced-motion tour logs only motion's own reduced-motion notice.
- **Hydration:** I turned the nav pause on and reloaded (/brands 1440, /creators 390). The pause stayed on, and there was no hydration warning (`pause.cjs`).
- **Layout:**
  - No overlaps or broken layout.
  - No sideways scroll at 390 or 360 on either page (`scrollWidth - innerWidth` = 0 all the way down).
  - The sheet peek shows: 64px at 1440, 40px at 390.
  - The split nav glass splits on the surface edge (`nav-zoom.png`).
  - The close switch sits clear of the nav at maximum scroll.
  - Reduced motion shows the stacked run, the final window, the static orbit and both hero toasts at rest.
- **CLS:**

  | Page | Viewport | CLS |
  |---|---|---|
  | /brands | 1440 | 0.0021 |
  | /creators | 1440 | 0.0028 |
  | /brands | 390 | 0.0041 |
  | /creators | 390 | 0.0030 |

  All are under the 0.02 budget. The nav's `ms-auto` cluster is a small part of it. In every case the LCP element is an h1 line (`cls.cjs`).
- **One false alarm:** the /brands 1440 tour (04, 05) caught step 04 active with step 02's mock showing. The machine was loaded at the time (measure build plus two tours). A dedicated probe (`runmock.cjs`) showed the mock follows the active step at every quarter, about 0.4 to 0.7s behind on a fast scroll. That lag comes from `AnimatePresence mode="wait"`. It is not a regression; it is listed under polish.

### 4. Switch, fields and routes: PASS

- **Switch, 1440 and 390 (`switch.cjs`).** The test loads `/brands?utm_source=test#run` and switches hero → creators, then nav → brands, then close → creators.
  - Each switch changes the URL with `?utm_source=test#run` kept, and the title moves between "HeyMoon.AI for brands" and "HeyMoon.AI for creators".
  - SrStatus announces "Showing HeyMoon for creators." / "…brands."
  - All three switches show the same checked option.
  - The page never reloads: a `window` marker survives every switch.
  - The console stays empty.
  - The close stays in place across the close switch (`switch-1440-close.png`).
- **Fields (`field.cjs`).**
  - **With JS:**
    - The /brands hero, with `acme-store.com`, sets `data-dawn` and goes to `/brands/c?read=acme-store.com`.
    - The /creators hero, with `testhandle`, sets `data-dawn` and goes to `/creators/c?h=%40testhandle`.
    - The /brands close field goes to `/brands/c?read=acme-store.com`.
  - **With JS off (plain GET):**
    - The /brands hero goes to `/brands/c?read=acme-store.com`.
    - The /creators close goes to `/creators/c?h=testhandle`. There is no "@", because a plain GET can't add one, and the product page takes the bare handle.
- **Routes:**
  - `/` returns 307 and redirects to `/brands`.
  - These all return 200: `/brands`, `/creators`, `/brands/v1`, `/creators/v1`, `/brands/c`, `/creators/c`, `/brands/dashboard`, `/creators/login`, `/creators/dashboard`.

### Open problems

1. **CSS budget (needs a lead ruling).** The SPEC §7.1 table checks "the CSS files of `/(site)/layout`". That is 11.6 kB and **passes**. `measure.cjs` (WP0) also counts the page CSS (22.7 kB, **fails**). Neither number includes the promo stylesheet, so the CSS that really blocks first paint is 24.7 kB. Options:
   - (a) Make `measure` follow the §7.1 table (layout only, 18 kB), and add a separate section-CSS line at about 14 kB.
   - (b) Raise the line to about 25 kB and count every stylesheet the prerendered HTML links.
   - (c) Keep 18 kB and fund a CSS diet. The weight is in window.module.css (3.9 kB), orbit (1.7) and close (1.3).

   Two honest savings are available whatever the ruling:
   - Deleting `lab/` (WP-F) takes 0.8 kB off the Tailwind utilities.
   - `dynamic(() => import("./promo/Promo"), { ssr: false })` in `Landing.tsx` moves 2.0 kB of promo CSS off the first paint. The launcher needs JS and appears only after 4s or a scroll (§5.7), so no server markup is lost. Not applied: it changes WP7's delivery after verification.
2. **Waiting on sign-off from the fixers' notes:**
   - WP1 R2: toast lane geometry, D1 and D3.
   - WP6 deviation 12: the close's minimum height is `100lvh - foot + 40px`, not `min-h-svh`.
   - WP7 deviation 1: the 48px floor.
   - WP4 request 5: the divider colour is `ink` or `ink/16`.
3. **WP6 R5 (`LEAD.md` item 5), still open.** At maximum scroll the nav's small switch and the close switch are on screen together (`tour-b1440/09.png`, `tour-c1440/09.png`). A small fix: the nav hides its switch while the close switch is in view, the way it already hides Start.

### Polish ideas (not implemented)

- **Gap above the run.** At 1440 there are 240px of empty paper (measured) between the work section's three steps and the run stage's H2 ("From a link to a live campaign."). Two section paddings stack there. About 160px would read tighter.
- **Run mock swap.** `AnimatePresence mode="wait"` (200ms exit, then 350ms enter) makes the mock trail the active step by 0.4 to 0.7s on a fast scroll. A cross-fade with overlap (both in one slot), or `mode="popLayout"`, would keep it in step.
- **Phone launcher.** At 390 the launcher sits over content at the right edge, for example the "16%" dot and label of ShareScale on /creators and the end of body lines. Options: a safe zone (bottom padding on the figure rows), or hiding it while a figure row passes under it.
- **Split nav glass.** In a still frame the edge reads as a hard line through the pill. The controls (the white thumb and Start) keep the skin of the pill's centre over the other half. A 6 to 8px feathered split would soften it.
- **CSS diet candidates.** Window's reduced-motion block is 4 kB raw and repeats selectors that could share a custom property. Orbit has many absolutely positioned per-element rules that could be generated inline.
