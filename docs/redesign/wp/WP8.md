# WP8 Mocks library: notes

4 Oct 2026. SPEC rev 2, §5.8 (with §2.4, §5.9, §6). Branch `redesign`, nothing committed.

## What I built

Every WP0 stub body is replaced; every export name and prop is exactly the §4.3 contract. Mocks take props only, import `copy.ts` `LABELS` (never `DEMO`, never `data/view`), use only site tokens and the §2.3 variables, and render their final state on the server from their props (no JS needed to see them finished).

| File | What it is |
|---|---|
| `mocks/parts.tsx` (new, in my folder) | Shared pieces: `FRAME` (v1's placement, keeps the `absolute` class WP2's mounts key on), `FIT` (tall mocks: centred while they fit, pinned to the top with a 20px fade where they do not; the frame is a size container), `CARD` (white, `shadow-mock ring-1 ring-ink/[0.06]`), `Chip` (20px product status chip in 6 tones), `Tick`, `PlatformSquare` (Instagram/TikTok marks), `BrandDot` (monogram), `Swap` (value and skeleton in one grid cell), `Chevron`, `svgId`, `useBox` (rendered size in a layout effect, for 1:1 viewBoxes). |
| `mocks/mocks.module.css` | All states as `data-on` / `data-drawn` keyed rules: the reveal cross-fade (300ms), arrivals (fade-up 300ms; picks 400ms), bar growth (600ms, 120ms stagger, inline-start origin, RTL-mirrored), share dots (40ms per tick), payout glyph waxing (fill-opacity 320ms). Container queries for MockRead (one line per row above 400px, agent over label below) and for short mounts (≤360px tall). Every transition sits under `prefers-reduced-motion: no-preference`. No `@apply`, no `theme()`, no Tailwind keys. |
| `Discs.tsx` | `count` solid discs, #A78BFA / #7C5CE0 / #4D2FB0 cycling (`--v300/500/700`), 2px white ring, 6px overlap at 20px via `margin-inline-start` (mirrors in RTL). |
| `MockPlan.tsx` | Header "Phase 1 · Warm-up" + Guaranteed pill (`bg-good/10 text-good-deep`), You pay (26/600), Markets (joined ", "), Creators (`<Discs>`). Each field whose `reveal` flag is off shows its skeleton (`h-2 w-16 bg-ink/6`) in the same cell and cross-fades on reveal, so the card never resizes. `checks` lines under the card (Check 12 `text-good`, `text-micro text-ink/72`), each fading up as it mounts. |
| `MockPhases.tsx` | "Phase n" + budget over a bar at the bound width (16/53/100%, C11). Phase 1 bar `.grad-rule` (mock chrome), others `bg-ink/10`. `grown`: scaleX 0→1, 600ms `--ease-out`, 120ms stagger. |
| `MockWhy.tsx` | "Why HeyMoon matched you" + `levelWord` chip, then four rows: 15px Moon in `text-brand` (phase 4 when `lit`, 0 when not) and the label at 12px ink/88. Rows past `filled` keep their place and fade up (300ms). No digits, no detail lines, no meters, no weights (ruling 26). |
| `MockTiers.tsx` | Pick rows (monogram, brand, share chip, green level chip) by `shown`; the `next` row (neutral share, "Request to join" with `ring-1 ring-ink/12 text-ink/72`) and the foot `restLine` (`text-micro text-ink/60`) arrive together with `showFoot` (foot 120ms later). Rows keep their place: no resize. Trailing chip slot is fixed-width so the share chips align in a column. |
| `MockField.tsx` | `url`: value, static 1px `bg-brand` caret, 28px blank circle, Start. `handle`: At icon, value (its own "@" dropped beside the icon, as in the real field), platform squares from `platforms`, Start. |
| `MockPay.tsx` | Due today, total (30/600), `LABELS.brands.vat(budget, vat)`, a drawn card (no network mark) with `•••• {last4}`, `Pay {total}`. |
| `MockCurve.tsx` | v1's chart: rules per phase, floor, gradient line (mock chrome), .18 area, points landing as the line reaches them, the last `multipleText` in a pill, "Phase n" labels. 146px tall; its viewBox follows its rendered width 1:1, so labels stay 11px and strokes 2.5px in a 280 or 430px card. `drawn` drives `data-drawn`. |
| `Curve.tsx` | v1's guarantee curve, gradient stroke and .20 fill, drawn by the caller at column × 96. The path is scaled into a viewBox equal to the rendered box (`useBox`), so the stroke is 2.5px everywhere (v1's `preserveAspectRatio="none"` stretch thinned flat stretches to under 1px). Server box 520×96. Mirrors in RTL (no text). |
| `RoasDial.tsx` | v1's dial: track, gradient arc (`.draw`), dot riding it (`.dial-dot`, `--sweep` set on the dot itself), "5x", "1x"/"12x", caption (label `mono-caps text-brand`, note `text-small text-ink/60`). Fluid `w-full` (WP4 request 2). `role="img"`, `aria-label="Guaranteed ROAS: 5x"`, `aria-describedby` the note. |
| `MockRead.tsx` | Header (brand Moon 4, title, sub, bound `count` in `mono-data`), nine rows: Moon 4, agent in 10px mono caps ink/60, `produces` 12px ink/88. No read values (C9). `FIT` placement. |
| `MockPicks.tsx` | `cards`: title with the Star, two drawn carousel buttons, a rail of 256px PickCards (ProductTile 112px with a floating level chip, brand 12/600, campaign 12 ink/72, a lilac stats tile: share 22/600 brand + "of every order" 11px, `paceBig` 15/600 + `paceSmall` 11px) running past the panel edge. `rows`: 44px tile, brand and campaign, share, chip. Picks past `shown` keep their place and fade up 8px over 400ms. No bonus bar, countdown, image or logo (C6). |
| `MockTerms.tsx` | "Join {brand}", the pre-qualified line, "12%" (34/600) with "of every order you bring in", "You're agreeing to" over the commits and "You're not" over the four notCommits in identical type and weight, a drawn "Join Campaign" pill (`bg-brand`). Side by side only in a short wide mount (524×300) to save height. |
| `MockCheck.tsx` | A draft tile, "Pre-upload Check", the check line (wraps to two lines rather than losing "due in 4 days"), then each miss (danger X, label, lilac "Fix:" box) arriving by `shown`. While misses land the header slot holds a progress Moon (`round(4·shown/n)`); once all have landed it cross-fades to the "3 to fix" chip. Final height from the first frame. |
| `ShareScale.tsx` | Eyebrow "Payout on every order" (`mono-caps text-ink/60`), the figure "10 to 16%" at `text-figure` fitted to its own column (`min(clamp(64px, 9vw, 132px), 23cqi)`, WP4 request 1, −0.05em optical pull in LTR), 7 ticks 10%..16% (`mono-data text-ink/60`) on a hairline, `count` full 11px Moons stacked per tick (16 in all), the note. `lit` fades dots in by tick at 40ms. `role="img"` `aria-label={spoken}`, `aria-describedby` the note. |
| `PayoutRail.tsx` | Four 24px Moons (`text-brand`), final phases [0,2,3,4], glyphs past `lit` at 0, waxing over 320ms. Dotted line (`ink/16`, 6px pitch) in segments that stop 7px short of each glyph; end glyphs flush, middles evenly spaced; labels `text-micro text-ink/72`, ends aligned to their edge. Logical positions, mirrors in RTL. |
| `ProductTile.tsx` | `.hm-media` tile, radius 12, a soft corner light (a gradient, no blur filter), a 4% inner hairline, the product name centred (12/600 ink/72), optional brand in 10px mono caps. Never an image. Default 112px. |
| `lab/mocks/page.tsx` | Every mock for the audience in the mount its consumer gives it: WP2's artefact pane (canvas, 360px stage, absolute roots brought into flow the way WP2's `.mount` does), WP7's compact thumbnail (zoom .72), WP3's sticky panel (524×480) and stacked mounts (100%×300), WP4's 520px figure column. `?s=final` (default, the server picture), `?s=start` (reveal off, not grown, not drawn, nothing shown or lit), `?s=play` (a 6.4s loop at the consumers' timings: reveal flags, checks, phases at 3s, why at 120ms, tiers at `enterMs`, misses at 120ms, rail at 300ms). Toolbar audience switch, `rm` (play shows final under `?rm=1` or the OS setting), pause (freezes the play clock). `?dir=rtl` mirrors the page. Every mount carries `data-lab` for probes. `notFound()` in production. |

## Deviations from SPEC (each with its reason)

| # | SPEC | Shipped | Why |
|---|---|---|---|
| 1 | §4.1 lists 18 files in `mocks/` | Plus `mocks/parts.tsx` | Shared chrome (frames, chip, tick, platform squares, swap cell, `useBox`) used by 12 mocks. A new file in my own folder touches no one else's (WP4 did the same with `number/parts.tsx`). |
| 2 | "Default placement … `absolute inset-x-6 top-1/2 -translate-y-1/2 sm:inset-x-8`" | Kept for every short mock. MockRead, MockTerms, MockCheck and MockPicks `cards` use `FIT`: `absolute inset-0`, centred while the card fits, pinned to the top with a 20px fade where it does not. | v1 did the same (`FRAME_TOP`, `FRAME_FIT`): the read's nine rows and the terms' button cannot fit WP3's 300px stacked mounts, and a centred card taller than its mount would lose its header off the top. The fade is no deeper than the padding, so in a mount that fits it only lands on tint. |
| 3 | Curve: v1's 520x260 drawing, `preserveAspectRatio="none"` | Same drawing, scaled into a viewBox equal to the rendered box (layout effect; server 520×96) | The stretch made the stroke under 1px wherever the line runs flat (measured in a test page). `vector-effect: non-scaling-stroke` fixes the width in Chrome but changes how `pathLength` dashes resolve, a risk for the draw in other engines. |
| 4 | MockCurve: "v1's smooth path" | Same points and floor; a monotone cubic (Fritsch–Carlson) with tangents eased to 0.42 instead of v1's flat tangents; the pill prints `multipleText`; the chart is 146px tall with a width-following viewBox | v1's flat tangents stall at each rung into steps; a plain monotone curve straightens into a polyline because 1 → 3.7 → 6.3 climbs evenly. Neither overshoots. A fixed-ratio viewBox scaled the 10.5-unit labels to 16px in the 524px panel; now they are 11px at every width. `multipleText` is the bound text ("6.3x"), §2.4.4. |
| 5 | ShareScale order: figure, scale, then the label and note | Label first as an eyebrow (`mono-caps text-ink/60`), then figure, scale, note. Tick labels "10%" to "16%". | It rhymes with WP4's paid row directly above (eyebrow, figure, chart, note) and with the guarantee row; same content. A bare "10" under a dot stack reads as a count. |
| 6 | MockCheck: misses and a `toFix` chip | Plus a progress Moon in the chip's slot while misses are still landing (`round(4·shown/n)`, ruling 35's "progress glyph that waxes as work lands"); a static draft tile replaces v1's VideoCamera icon; the chip is danger-tinted | `VideoCamera` is not in `ui/icons.ts` (WP0 file); no orange token exists. A working (cycling) glyph would be an ambient loop outside `useActive`, so the progress glyph is static per `shown`. |
| 7 | MockTiers: the `next` row (no timing given) | The next row and the foot arrive together on `showFoot`; the next row's text is ink/72 at full opacity (v1 dimmed the row to 45%) | WP2's schedule has picks at `enterMs` and the foot after; the request row belongs with "12 more, each a request to join". 45% opacity would put its text under the ink/60 floor (ruling 27). |
| 8 | "Text inside mocks is 10 to 13px" | Exceptions: MockField's typed value 19px (v1's input proportion), MockPicks' `paceBig` 15px and rows' share 15px, besides the figures the spec sizes itself (26, 30, 22, 34) | They are figures and an input's value, not body text; at 12px the pace beside a 22px share read as a caption. |
| 9 | MockTerms "Join Campaign" | Solid `bg-brand` pill with an inset highlight; with `needsApproval` (never true today, the bind asserts it) the button reads `LABELS.creators.requestToJoin` and the pre-qualified line is omitted | v1 used the product's `g-button` radial gradient, which is not a site token and would be a further gradient spend. There is no approved copy for the request-line variant. |
| 10 | MockPicks: "`shown` items fade up (400ms)" | As specified, 8px. Cards are 256px wide (v1 252/290) on a rail that runs past the panel edge; the title carries `ui/Star` (v1's Sparkle) and two drawn chevrons; `rows` uses a plain 44px hm-media tile | A 44px tile cannot set a product name (v1's `plain` tile). The Star is the product's AI mark; no new icon ships. |
| 11 | RoasDial | Fluid; min/max labels 8 units (≈14px at 360, 12px at 300) instead of v1's 11 (≈20px); `aria-describedby` the note | WP4 request 2. The note is visible text inside a `role="img"`, so it would otherwise be unreachable to a screen reader; the label stays exactly "Guaranteed ROAS: 5x". ShareScale does the same with its note. |
| 12 | Curve in RTL (unspecified) | Mirrored (`rtl:-scale-x-100`); MockCurve is not (it carries text) | The line climbs with the reading direction; WP4's rule grows from the right in RTL too. |
| 13 | v1 colours ink/35 to ink/50 on labels | Raised to ink/60 (ink/64 on lilac tints) | Ruling 27 floors. The disabled carousel chevron (an icon, not text) is ink/30. |

## Requests to the lead

1. **WP3, for the record (no change asked):** in the 300px stacked mounts MockRead shows its header and about five of nine rows (six at desktop width), and on phone MockTerms shows through its third not-commit with the button below the fade (at 524 wide the lists sit side by side and the fade lands on the button); in the 768px sticky panel (about 345×480) MockRead shows about seven rows. This is v1's cropped-sheet behaviour, by design, with a 20px fade. If the lead wants them whole on phone, the fix is WP3's: a taller mount for those two steps (about 420px for MockRead, 380px for MockTerms at 358 wide).
2. **WP2:** the window's `.mount > .absolute` override depends on the mock root carrying Tailwind's `absolute` class; `FRAME` keeps it on purpose. Verified in `/lab/window?view=scrub` at 22.0s (skeleton reveal) and at the end, both audiences.
3. **WP-F:** the lab uses a few Tailwind arbitrary variants (`[&>div>.absolute]:!relative` …) that ship in site CSS until `lab/` is deleted.
4. No contract or WP0 change is needed. WP4's requests 1 and 2 are done (see deviations 5 and 11; measured below).

## Measured (headless Chromium via the private helper)

- ShareScale in WP4's lab: column 520 px at 1440 and 1920, figure font 119.6 px, text 506 px wide, 20 px clear of the column edge; at 390, column 358, figure 64 px, text 271 px. 16 Moons. `scrollWidth` equals the viewport at 1440, 1920 and 390.
- Root probe, `/lab/mocks`: 13 brands roots and 19 creators roots, every one `aria-hidden="true"` except RoasDial (`FIGURE role=img aria-label="Guaranteed ROAS: 5x"`) and ShareScale (`role=img`, label "Shares of every order across 16 live campaigns, from 10% to 16%: 2 at 10%, 2 at 11%, 4 at 12%, 2 at 13%, 3 at 14%, 2 at 15%, 1 at 16%.").
- Creators lab: `document.body.innerText.match(/\$\s?\d/)` → `null`; `meter, progress, [role=progressbar], [role=meter]` → 0; `img` inside mounts → 0; MockWhy text has no digit.
- Reduced motion: with the CSS emulation (`--rm`) on `?s=play`, every bar is at `transform: none`, `transition-duration: 0s`; with `?rm=1` play shows the final state.
- In the consumers: WP2 `/lab/window?view=scrub` (brands 22.0s skeletons and end; creators end: MockWhy over MockTiers), WP3 `/lab/run` sticky at 1440 (steps 1 and 4) and at 768×1024 (all eight panels fit; MockRead fades as described), WP4 `/lab/number?at=top` both audiences. No console errors or warnings in any of them, on `/lab/mocks` (final, start, play, rtl, phone), or on `/brands` and `/creators` scrolled to the bottom.

## Acceptance (§5.8)

| Line | Result | Evidence |
|---|---|---|
| `/lab/mocks?a=brands` and `?a=creators` render every mock in both states. | **PASS** | `?s=final` and `?s=start` (plus `?s=play`, `&rm=1`, `&dir=rtl`, pause) at 1440×900 and 390×844: `b-final.png`, `c-final.png`, `start-montage.png`, `b390-montage.png`, `c390-montage.png`, `rtl-montage.png`, element shots `b-el-*`, `c-lab-*`. |
| There is no `<img>` inside `mocks/`. | **PASS** | `grep -rn "<img" app/(site)/_site/mocks/` → no match; DOM count inside lab mounts 0; `/brands` and `/creators` `[aria-hidden] img` 0. |
| MockWhy contains no digit and no meter. | **PASS** | Rendered text "Why HeyMoon matched you / Pre-qualified / Where your audience is / How much of your grid is advertising / How consistently you post / Who the brand asked for": `/\d/` false; no meter/progress roles; the glyphs are Moons (phase 4 or 0), not quantities. |
| No creators mock contains "$". | **PASS** | Creators lab `innerText` has no `/\$\s?\d/`; no creators mock file prints a currency; `check:site` creators money rule passes. |
| Every root is `aria-hidden`, except the two `role="img"` mocks. | **PASS** | Root probe above (32 roots). Nothing inside a mock is focusable (buttons are drawn spans). |
| `tsc` passes. | **PASS** | `npx tsc --noEmit -p .`: 0 errors (whole project). |

Also from the brief, §2.4 and §5.9:

| Check | Result |
|---|---|
| `npx next lint --dir "app/(site)"` | **PASS**, no warnings or errors |
| `npm run check:site` | **PASS**: "check:site ok · /brands, /creators · 24 handles and 11 names checked" |
| Mocks never import `DEMO` (props only, `LABELS` only) | **PASS** (grep: no `DEMO`, `data/demo` or `data/view` import in `mocks/`) |
| Product labels verbatim | **PASS**: every product string comes from `LABELS` or props ("Join Campaign", "Pre-upload Check", "Request to join", "Fix:", "Guaranteed", "You pay", …) |
| Abstract Discs, no faces; `yourstore.com` / `@yourhandle` only; no read values | **PASS** |
| Static by default (server HTML is the final picture; no visible jump) | **PASS**: every state is a prop-driven attribute; the window's skeletons only appear when WP2 passes `reveal` false |
| No layout shift from any state change (only opacity, transform and SVG attributes move; hidden rows keep their place) | **PASS** |
| Reduced motion: no transitions (CSS), final via props (JS) | **PASS** |
| RTL: logical properties, mirrored bars, discs, rail, labels; numbers `dir`-safe via `.num` | **PASS** (`rtl-montage.png`) |
| 1440×900 and 390×844, no horizontal scroll | **PASS** (`scrollWidth` 1440 / 390) |

Screenshots: `scratchpad/shots/WP8/` (`b-final.png`, `c-final.png`, `b-el-*.png`, `c-lab-*.png`, `c390-*.png`, `b390-*.png`, `*-montage.png`, `win-*.png`, `run-*.png`, `run768-montage.png`, `num-brands.png`, `num-creators.png`, `curve-5.png`).
