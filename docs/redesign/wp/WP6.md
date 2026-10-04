# WP6 notes: Connects, Close, Footer

4 Oct 2026. SPEC §5.6 (with §1.3 S7, §1.5 B11 to B13, §5.9). Nothing committed; the lead commits.

## Files

| File | What it is |
|---|---|
| `app/(site)/_site/close/Connects.tsx` | `<Section slot="connects" surface="paper" cv>`. H2 (WordReveal, `id="connects-h2"`, labels the section) and body on the start side; marks on the end side; one hairline above, inside the container. Brands: the four PNGs from `public/platforms` at 34/32/24/24px, width set exactly from the natural aspect (no reflow when the lazy image lands). Creators: the two 40px ink squares, mapped from `DEMO.creators.platforms`, `role="img"` with the platform name. Plays once on entry (the hairline draws from the start edge over 1.1s expo, the H2's words blur in, the body and the marks rise with a 60ms stagger). Static by default: nothing is armed in the server HTML or when in view at mount. |
| `app/(site)/_site/close/Close.tsx` | The fork. `<section data-slot="close" data-surface="night" aria-labelledby="close-h2">`, `relative z-close -mt-8 min-h-svh overflow-clip bg-night-1`, the hero's grid with `--apex-pref: 56svh`. Row 1: the close `AudienceSwitch` (`mb-10`) and the H2 morph. Row 2: `<Field id="close" placement="close"/>` on `<Horizon variant="close" ignite={entered}>` in the same cell. Row 3: the lock note (Lock 12) and the credit. Switch, H2 and row 3 carry `dawn-fade`; the field stays. |
| `app/(site)/_site/close/Footer.tsx` | `<footer data-surface="night" class="dawn-fade bg-night-0">`. Row: Wordmark (sm, night) in a plain `<a>` whose plain click scrolls to the top; `<nav aria-label="Site">` with Brands and Creators (`useAudienceLink(a, "nav")`, `aria-current="page"` on the current one) and Dashboard (`COPY[audience].nav.dashboardHref`). No copyright line. Then `<GiantWordmark target={footerRef}/>`. |
| `app/(site)/_site/close/GiantWordmark.tsx` | The dotted "HeyMoon", `aria-hidden`, `dir="ltr"`, cropped by the page bottom. `useScroll({target: footer, offset: ["start end", "end end"]})` drives `transform` translateY(24%)→0, `filter` blur(8px)→0, `opacity` .4→1, each one array-in/array-out `useTransform` on an accelerated key, so all three run as ViewTimeline animations. Server and reduced motion bind nothing: the static final state. WP6-internal prop: `target`. |
| `app/(site)/_site/close/close.module.css` | All WP6 styling (§2.3 variables only, no `@apply`/`theme()`). |
| `app/(site)/lab/close/page.tsx` | Lab. Connects → Close → Footer in page order. The paper block stands in for the sheet's end (rounded bottom, `z-sheet`, `pb-8`), and its content renders through the **real `<Swap>`**, so a close switch exercises the Landing's anchor restore. The lead-in is 120svh for brands and 100svh for creators, so every switch changes the height above the close (180px at 900 tall). `?spacer=0` removes it (static-by-default path). A "Dawn" button runs `startDawn()`/`resetDawn()` without navigating. The LabFrame toolbar covers audience, `?rm=1` and pause. |

Contracts kept exactly: `Connects(ConnectsProps)`, `Close(CloseProps)`, `Footer(FooterProps)`; no WP0 or other-package file touched; no Tailwind key added.

## Deviations from SPEC, with reasons

| # | SPEC | Shipped | Why |
|---|---|---|---|
| 1 | Store marks `grayscale opacity-[.72]` | `filter: grayscale(1) brightness(.6) contrast(3); opacity: .56` | Plain grayscale leaves four different greys: Shopify's black word reads twice as heavy as Zid's light-purple mark and Magento's orange icon (compared side by side, `shots/WP6/marks-variants.png`). Brightness then contrast takes every coloured fill to one ink tone and keeps the white knock-outs (Shopify's S, Magento's facets). .56 puts the row a step quieter than the ink/72 body, about the average tone of the spec version. Decorative, not text. |
| 2 | Connects: one row on desktop, stacked on phone | Stacked below **1024** (marks on one line), 2x2 grid below 640 | The four marks need about 445px with their 48px gaps; beside the 480px text column that is 973px of content, which does not fit from 640 to about 1020 (it overflowed). |
| 3 | Marks gap 48 | Creators' two squares at gap 12 | At 48px the two squares read as unrelated marks floating at the far edge; at 12 they read as a pair, like app icons. Brands keep 48. |
| 4 | Lock note `flex items-center gap-2` with Lock 12 | The Lock is inline at the start of the first line; each sentence is `nowrap`, so a wrap only falls between sentences | On phone the note wraps; the flex version put the glyph beside a two-line centred block, and the wrap fell inside "Nothing / is published". Now: "Nothing is charged. Nothing is published." / "Not until you say so." Desktop is unchanged (one line). |
| 5 | (none) | Phone only: while the close field is invalid, row 3 fades out (`.close:has([data-invalid="true"])`), no layout shift | The creators error wraps to two lines on a phone and sat 16px over the lock note. The hero hides its chips the same way. Desktop keeps the note (35px clear). |
| 6 | Giant wordmark 26vw on phone | **23vw** on phone, with a 4px dot pitch (dot radius .75px) | "HeyMoon" is 4.0em wide in Geist 600 at -0.06em: 26vw is 104% of the width, the line start-aligns and the final "n" is cut (measured `scrollWidth` 415 in a 390 box). 23vw ends exactly on the 16px gutters. At 23vw the 6px pitch gave strokes about 2 dots wide; 4px keeps the desktop's density. |
| 7 | `entered` at 40% "replays the ignition" | Rule 2.4.7 applied: the close is **armed** (halo .6, sun .45, rim clipped to the centre: the ignition's own start keyframes) only if it is below the viewport at mount and motion is allowed; then it ignites once at 40%. In view at mount, reduced motion (CSS or `?rm=1`) and no-JS: lit, static, no replay. | Without arming, `data-ignite` would snap the already-lit rim dark and re-light it. With arming the animation starts from exactly what is on screen. |
| 8 | Close CSS horizon = WP0's layers as is | Scoped to the close (via the Horizon `className` hook, `.hzCell > .hz-*`): the sky continues below the apex as `--deep`, the ground is transparent outside the limb, and the rim, earth and hair layers are `max(200px, 12.1vw + 64px)` tall | The close has no canvas, so its CSS horizon is what ships. WP0's ground paints `--deep` outside the planet, which **cuts the halo and the sun flat along the apex line** beside the field; now the light ends on the limb's curve, as the shader does (its halo is a function of distance to the limb). And from about 1630px wide the limb meets the edges more than 200px below the apex (12.02vw; 231px at 1920), so the rim stopped short of the edges and the earth glow ended on a straight line. No WP0 file edited. See request 1. |
| 9 | Footer row `h-16 border-t` on the padded `max-w-text` container | The border sits on an inner row inside the padding | The hairline then starts and ends exactly on the content edges (wordmark start, Dashboard end) instead of 24px beyond them. Same for the Connects hairline ("inside the container"). |
| 10 | Close H2 storyboard "40px on 2 lines" (B12 phone) | `text-display-2`, which is 36px at 390 | The token is the source of truth (§2.1); 36 is inside the storyboard's ±10%. |
| 11 | B11 "about 300px" | 420px at 1440 (`py-24` + `pt-16` + content, as §5.6's box) | §5.6's box values win over the storyboard estimate; spacing reads balanced against the deep agents panel above (96px to the hairline, 132px to the sheet's bottom). |

## Requests to the lead

1. **Horizon (WP0, `globals.css`).** Consider adopting deviation 8 for the hero's CSS sky too (it is what ships under reduced motion, no WebGL and `?sky=css`): (a) `.hz-ground` transparent outside the limb plus `.hz-sky` continuing below the apex as `--deep`, so the halo and sun end on the limb instead of a straight line at the apex (visible in `shots/WP6/ref-hero.png` beside the field, and in the CSS/GL parity check at 25% and 75% width); (b) `.hz-rim`, `.hz-earth`, `.hz-hair` heights `max(200px, calc(12.1vw + 64px))` (the limb is 12.02vw below the apex at the edges; the 200px layers cut it from about 1630px wide). The exact CSS is in `close.module.css` under `.hzCell`.
2. **Morph timing (globals `.morph`, hero H1 and close H2).** With `hl-in` starting at 120ms on `--ease-out-expo` and `hl-out` on `--ease-exit` (an ease-in), the two lines overlap in the same line box from about 200 to 400ms: the new line is ~70% risen while the old one has moved ~20% (frames: `shots/WP6/morph2-grid.png`). It reads as a double exposure in stills. Options: start `in` at ~280ms, or run `out` on `--ease-out`. I left it, since it is shared with WP1.
3. **Anchor restore on the live page.** In the lab, with the real `<Swap>` and 180px of height change above, a close switch holds `close.top` within 0.1px at every offset tested (400, 120, 0, -60). On `/brands` during the parallel edits it held at offset 0 (0.9 → 0.9) but drifted at others, because sections above changed height after the deferred commit (the document went from 8,591 to 7,500px, and at one point to 407,250px while a package was mid-edit). Please re-run at WP-F with everything landed. Testing note: Playwright's `page.click` scrolls the target into view first, which moves the close by itself; dispatch the click from `evaluate` when probing this.
4. **RTL (WP0 Field).** With `dir="rtl"` on `<html>`, the field's typed hint sits under the Start button (`shots/WP6/rtl-bottom-1440.png`): the hint is positioned with logical `start-0 ps-[52px]` while the input is `dir="ltr"`. Not WP6's file.

## Acceptance checklist (§5.6)

| Line | Result | Evidence |
|---|---|---|
| Switching at the close keeps `close.getBoundingClientRect().top` within ±4px | **PASS** (lab, real Swap); see request 3 for the live page | `wp6/labfork.js`: brands → creators → brands at close tops 401.9, 120.9, 0.9 and -59.1; every sample over 720ms equal to the start (max Δ 0.1px). Live `/brands` at top 0.9: 0.9 for 1.2s after the switch. |
| … morphs the H2 | **PASS** | After the switch: `DIV:out` (hidden at .6s) and `H2:in`, exactly one `#close-h2`, `hl-out`/`hl-in`/`morph-hide` running (`morph2-grid.png`). Off screen, a switch swaps them still/idle with no animation. |
| … swaps the field icon | **PASS** | Close field icons' opacity 0 / 1 after the switch (Globe → At), live page. |
| … changes the URL | **PASS** | Live: `/brands` → `/creators`, title "HeyMoon.AI for creators". Lab: `?a=creators`. |
| The close rim ignites once on entry | **PASS** | `wp6/ignite.js`: at load `data-armed`, rim opacity .3, clip `inset(0px 50%)`, no animations; at 25% visible unchanged; at 45% `data-ignite` set and `hz-rim-in`, `hz-halo-in`, `hz-sun-in` running; 2.2s later all `finished`, rim 1 / `inset(0px 0%)`. Never re-armed. |
| The wordmark shows about 62% of its cap height at 1440 | **PASS** | Measured with `measureText`: cap height 224.9px, cap top 14.3px into the 253.4px line box, crop box 157.1px → **63.5%** shown (390: 63.3%). |
| … its animations report a ViewTimeline | **PASS** | `getAnimations()` on the wordmark: 3 × `ViewTimeline` (translateY 24%→0%, blur 8px→0px, opacity .4→1). |
| There is no "©" anywhere on the page | **PASS** | `/brands` innerText has no "©"; `check:site` (which tests it) passes. |
| The store marks have `alt` text | **PASS** | `img` alts "Salla", "Zid", "Shopify", "Magento" (all loaded, natural widths 228/163/334/329). |
| The creators squares have accessible names | **PASS** | `role="img"` with `aria-label` "Instagram" and "TikTok", also in the no-JS HTML. |
| After a switch to creators, the footer's "Brands" link brings brands back with the URL `/brands` and the brands page showing | **PASS** | Live: hero switch to creators, then footer "Brands": URL `/brands`, title "HeyMoon.AI for brands", close H2 "Paste your store link.", Connects H2 "Connects to the store you already have."; only one document request in the whole run. The footer Wordmark link scrolls to y 0. No JS: the link loads `/brands`. |
| Submitting the close field turns the footer area light along with the close | **PASS** | Live `/brands`: "abc.com" + Enter in the close field → button "Reading", footer opacity falling (0.79 at ~300ms), `.landing-root` background going to rgb(246,244,252), then `/brands/c?read=abc.com`. Lab "Dawn": footer 0, row 3 / switch / H2 0, field 1, `.hz-dawn` 1 (`dawn-1.png`). |

## Also checked

| Item | Result |
|---|---|
| Field centred on the close horizon | Δ = 0 at 1440x900, 390x844, 1280x720, 1920x1080, 360x740, 844x390. Apex 56svh: 403 at 720, 504 at 900, 605 at 1080, 414 at 740; at 844x390 content pushes it to 310 (as designed). |
| No horizontal scroll | `scrollWidth == innerWidth` at 360, 390, 768, 844, 1024, 1280, 1440, 1920. |
| Reduced motion (CSS, `--rm`) and `?rm=1` (JS) | Close never armed, no ignition animations, rim lit; wordmark has no inline style and no animations (transform none, blur none, opacity 1). Connects arms but plays an opacity-only 200ms fade under CSS reduce. |
| No JS (`/creators`) | Close lit, Connects final, wordmark sharp in place, footer links navigate. |
| Paused | Nothing in WP6 loops; pause on + `?rm=1` + creators renders with no console errors. |
| Night under the sheet's rounded bottom | The close starts 32px under the sheet (`-mt-8`, z 5 under z 20); the corners show night (`final-brands-1440-close.png`, live `real-brands-1440-120.png`). |
| Lazy chunk | Connects, Close and Footer arrive through Landing's `next/dynamic`; no new dependency (Phosphor icons from `ui/icons.ts`, plain `<img>`, no `next/image`). |

## Checks

1. `npx tsc --noEmit -p .`: clean (whole project).
2. `npx next lint --dir "app/(site)"`: "No ESLint warnings or errors" (one scoped `@next/next/no-img-element` disable, with its reason, on the four store marks).
3. Lab `/lab/close?a=brands`, `?a=creators`, `&rm=1`, `&spacer=0`, pause: checked at 1440x900 and 390x844 with the private headless helper and `wp6/*.js` probes; no console errors from WP6.
4. `npm run check:site`: "check:site ok · /brands, /creators · 24 handles and 11 names checked".

Screenshots: `/private/tmp/claude-501/-Users-mostafaaelnagar-Documents-moontech/d50da6c8-1e72-439f-9d55-d7ba5aef42c4/scratchpad/shots/WP6/` (`final-*`, `transit-*`, `morph2-grid`, `ignite-grid`, `reveal-grid`, `wmrise-grid`, `dawn-1`, `sz-*`, `rtl-*`, `marks-variants`).
