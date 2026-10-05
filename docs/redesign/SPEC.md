# HeyMoon site: build specification

4 Oct 2026. Lead architect. This is the definitive spec for the new marketing site in `app/(site)`. It merges the creative, engineering and claims critiques into one plan. Where they disagreed, §0 records the ruling and the reason. Revision 2 applies the rules audit and the buildability audit; §9 logs every finding as FIXED or REJECTED.

**Who reads this.** Parallel builders read this file, plus `docs/redesign/RESEARCH.md` and `docs/redesign/INPUTS.md`, and nothing else. Every value they need is here, or is cited by RESEARCH section number.

**Precedence:**

1. INPUTS.md (Mostafa).
2. RESEARCH §5 (HeyMoon rules D1 to D7, quoted).
3. This SPEC.
4. RESEARCH §1 to §4 and §6.

**Facts measured today with `node_modules/jiti`.** The bind script must reproduce every one of these.

| Fact | Value |
|---|---|
| Brands `read_site('ounass.com')` | opener plus 9 units, **15,022 ms**. `total` goes from 4 to 9 at the done=4 yield (6,048 ms). |
| Brands `propose_plan` | opener plus **6** stream steps, **10,768 ms**. `BUILD_TASKS` has **7** rows: `safety` has no stream step of its own, because its work is applied inside the `creators` step, whose `pool.why` says "MoonSearch AI cleared every one of them". |
| Creators `read_profile(PEOPLE[0])` | opener plus 9 units, **16,242 ms**. Opener prints the real handle (must be scrubbed). |
| Creators `propose_profile` | 4 units, **7,193 ms**, no opener. |
| Creators `match_offers` | yields one line per brand: "MoonMatch AI · Nabati Home", then "Tide Trace", "Marhaba Kitchen", and so on, including real-retailer names. **Never store its notes**; only the first three units' ms (343, 324, 244). |
| Product roster titles | `rosterTitle(READ_TASKS,"read your store")` gives "Four agents read your store". `rosterTitle(BUILD_TASKS,"on your plan")` gives "Five agents on your plan". Creators `rosterTitle(BUILD_TASKS,"building your profile")` gives "Three agents building your profile". |
| `.tsx` product modules | `countWord`, `rosterTitle` and `paceOf` live in `.tsx` modules. They load under jiti only with a TypeScript transpile hook (§3.2), which has been verified. |
| `request_funding({plan, phaseNo:1})` | total $1,050, vat $50, amount $1,000, `method.last4` "4629". |

**Glossary**

| Term | Meaning |
|---|---|
| **night** | Sky #010317 over ground #000211. Used by the hero and the close. |
| **paper** | The #FCFBF8 sheet. |
| **deep** | #141229 inset panels: the window frame and the orbit band. |
| **apex** | The y of the horizon's highest point. By construction it is the vertical centre of the field. |
| **world** | A MotionValue, 0 for brands and 1 for creators. |
| **heroExit** | A MotionValue, 0 to 1 as the sheet rises over the hero. |
| **unit** | One row of an agent run, with bound `startMs` and `endMs`. |
| **WP** | A work package. |
| **[A1..A8]** | Approved copy, verbatim. |
| **[PRODUCT]** | A product string, verbatim. |
| **[NEW]** | A string that needs a COPY.md review. |
| **[CHANGE]** | An approved string this spec changes; the reason is in §6.1. |

---

## 0. Decisions log (rulings on the critiques)

| # | Question | Ruling | Why |
|---|---|---|---|
| 1 | LazyMotion `domMax` (lead) or `domAnimation` (engineering) | **`domAnimation`, `strict`** | `domMax` adds 13.5 kB gz for layout and drag only. The pill is a two-slot `x` transform, and the "tag flies to the pane" idea becomes an arrival animation. |
| 2 | Headline morph in Motion or CSS | **CSS keyframes keyed by `data-state`** | It animates before hydration, costs zero JS, and keeps the H1 safe for LCP. |
| 3 | Switch semantics: nav of links (creative) or radiogroup (engineering) | **`role="radiogroup"` of `<a role="radio">`** | One tab stop with arrow selection suits a segmented control, and real anchors keep the no-JS path. |
| 4 | Shared `layoutId` across the switches (claims) | **Independent pills** | There are three switches in three places. A shared `layoutId` would fly a thumb across the page. |
| 5 | Sky via `next/dynamic` or a plain `import()` with a fresh canvas | **Plain `import()` of a non-React module, with the canvas created in the effect** | StrictMode double-mounts. A lost context on a reused canvas cannot be re-initialised. |
| 6 | Glass `backdrop-filter` over the live canvas (creative) | **None over the canvas. The paper skin keeps blur.** | The canvas changes every frame (dither, twinkle), so every backdrop blur would re-run every frame. |
| 7 | Toast content: lands on `produces` (creative), or no new text (claims) | **Note while working, then the `produces` label. No per-toast time.** | Product labels are verbatim. The one timing claim lives in the window. |
| 8 | Cut the 3-card grid and the tabbed Run (creative) | **The cards become the act rail under the window. The Run stays, as a scroll-linked sticky stage with real mocks.** | D3: every card holds a bound picture. The window is the cards' picture. Text receipts are not pictures. |
| 9 | Run on a 7s auto-advance timer (v1) | **Scroll-linked sticky stage, no timer** | It uses native scroll, with no hidden timer to pause (WCAG 2.2.2). |
| 10 | Guarantee on a dark panel (v1) or on paper (creative) | **Paper, editorial figure** | The deep surface is reserved for the window frame and the orbit, so the sheet doesn't stripe. |
| 11 | Promo eyebrow: live credit (creative) or "A sample run" (claims) | **"A sample run" [NEW]** | It says honestly what the media is, and it doesn't flicker. |
| 12 | Promo headline "seven agents" (INPUTS) or derived "five" (claims) | **Proposed: the derived count, "Watch five agents build a campaign" [CHANGE C1]. Q1 blocks WP-F.** WP7 builds against `COPY.brands.promo.headline` either way. | The card plays the read and the plan, and only five agents work in them. But INPUTS outranks this spec, so the change ships only with Mostafa's yes. If he keeps seven, it is a one-line flip in `copy.ts`. |
| 13 | Promo auto-open: when the hero exits (engineering), or only if the window was skipped (creative) | **Desktop only, once per session, only if the visitor scrolled past the window with its run under 60% done.** Never when a field is focused or holds text. Never on phone. | Opening over the window would cover its own subject. |
| 14 | Launcher visibility | **Desktop:** it appears after 4s or the first scroll, and hides while the close field is in view. **Phone:** hidden while any field is in view or the keyboard is open. | It never covers a field and never competes with the bookend. |
| 15 | Fork: two cards above the footer (claims), or the close's switch (creative) | **The close's glass switch is the fork** | No new copy, and the visitor lands next to the right field. |
| 16 | Stopwatch: bare "15.0s" (creative), or labelled (claims) | **Labelled stamp: "Store details in 15.0s" / "Your grid in 16.2s" [NEW]** | D5: the fifteen seconds is the read, not the campaign. |
| 17 | Brands build rows: 6 stream steps (engineering), or the 7 BUILD_TASKS rows (creative, claims) | **7 rows. `safety` works in parallel with `creators` and lands with it.** The bind asserts `plan.pool.why` names MoonSearch AI. | This matches the product roster and keeps "Five agents on your plan" true. |
| 18 | Pause control: floating in the hero (creative), or in the nav (engineering) | **In the nav, global** | Reachable from every section, and the launcher stays the only floating element. |
| 19 | Hero autofocus | **Dropped** | Screen-reader users would land past the H1 and the switch. The typed placeholder and the nav Start already invite. |
| 20 | Line-rise start: 105% (RESEARCH) or 42% (engineering) | **42%** | The H1 stays a visible LCP candidate on its first paint. |
| 21 | Horizon geometry | **The field row is the horizon's origin.** A grid with `minmax(apex - field/2, max-content)`. The CSS layers sit in the field row, and the shader measures the row. | Layout and light can never disagree. Tall content pushes the horizon down instead of under the nav. |
| 22 | CSS planet as a 2R disc element (creative) | **Viewport-sized gradient layers** | A 3,000px+ circle layer is an iOS GPU-memory risk. |
| 23 | Sheet lift: scroll-linked (creative) or native sticky (engineering) | **Native sticky structure, plus the creative's clip-path inset and dims as accelerated cosmetic bindings** | Structure without JS, polish on the compositor path. |
| 24 | Submit: rim burst (RESEARCH A) or dawn (creative) | **Dawn: 450ms fade to the product's #F6F4FC, then `location.assign`** | The next page is light and loads in a new root layout, so the fade turns the hard load into a continuation. |
| 25 | Field value across a switch | **One draft per audience** | A URL is never a valid handle. |
| 26 | MockWhy weights: bars (creative) or dots (claims) | **Neither. No meters and no quantities.** The four signal labels, each with a 15px Moon that is full when the bound signal is `strong` and new when it is not (today all four are strong). | `MATCH_WEIGHTS` say how the model weighs the signals, not how this creator scored. A meter lit 7 of 20 under "Why HeyMoon matched you" reads as a low score beside "Pre-qualified". A "35%" would read as a pay share. |
| 27 | Caption contrast (creative used ink/45 and white/40) | **Floors for text under 18px: ink/60 on paper, white/56 on night and deep** | Measured: ink/45 gives 3.0:1 and white/46 gives 4.45:1. Both fail AA 4.5:1. |
| 28 | Brands Run credits "Agents · MoonLive AI" on the payment step | **The label becomes "Done by" (A6's label). Step 03 is credited to "You" [CHANGE C2], gate G9.** | D2: no agent moves money. It changes approved copy, so it goes through the copy review. |
| 29 | Creators window acts | **Read, then the profile build with MockWhy, then picks and tiers** | It follows the product's order (`read_profile`, `propose_profile`, matching). |
| 30 | Footer copyright line | **None** | It asserts the entity before D5 sign-off. |
| 31 | H1 line 2 gradient on night | **The night variant: `95deg, #9B7BF0, #A65FED 48%, #F0559D`** | `#4D2FB0` on #010317 is 2.3:1. The stops are existing C1 tokens. Design OK listed in §8. |
| 32 | Creators stopwatch: 16.2s against "In about fifteen seconds" | **Show the true 16.2s. Never fudge it.** | "About" covers it. The bind asserts 13,500 to 16,499 ms, so the stamp stays within a second of fifteen and never prints above "16.5s". Retuning is Q2. |
| 33 | `/creators/login` | **Already exists** in `app/(creators)/creators/login/page.tsx` (commit cd957f5). The site links to it. | |
| 34 | Hero toasts against D3 ("The live example read and the sample chips were removed from the hero; one field is the front door") | **Kept on desktop (≥1024) as lead decision 1 says, behind gate G10. No toast lane below 1024.** | A replayed read beside the field is what D3 removed, so the override needs Mostafa's and design's sign-off. On phone the field is the only thing in the hero that asks for anything. If G10 is refused, `<Toasts>` is not mounted. |
| 35 | Moon glyphs that sit still as crescents | **Orbit nodes are always full; brightness carries their state. Run steps take their phase from their state (as the act rail does).** The lunar divider keeps its 0 to 7 sequence, under gate G7. | Direction C's own mitigation for the orbit is "Keep them full, never phased" (C4 rejected the crescent). A cycling working glyph, and a progress glyph that waxes as work lands, are the glyph system lead decision 1 adopted: their partial phases are state. A crescent (phase 1 or 7) used as a fixed label or decoration is a picture of night. |
| 36 | The guarantee Curve | **Inside the figure column, at v1's GuaranteePanel proportion (100% × 96px), as figure chrome.** Not full width. | At 1120px across the paper, a gradient stroke and violet fill become a fourth gradient spend and a wash (D3). v1 calls it "A shape, not a claim". |

---

## 1. Experience

### 1.1 The idea

**The field is the moon rising.** The page opens at night on the limb of a planet. The only light in the scene sits behind the store or handle field, so the thing you type into is the brightest object on screen. After that, a paper sheet lifts over the night and shows the work that happens when you press Start. It plays at the product's real pace, with a stopwatch that stamps **Store details in 15.0s**. The page ends at moonset: night again, the field on the horizon again, and the HeyMoon wordmark set in dots in the planet's dark side.

There are four constants:

| Constant | What it is |
|---|---|
| One light source | The rim. |
| One object | The field. |
| One thread | The 5x5 moon-phase dot glyph. |
| One proof | The read, timed live. |

### 1.2 Page architecture (both audiences share the skeleton)

| # | Section (slot id) | Surface | Owner | Brands | Creators |
|---|---|---|---|---|---|
| 0 | Nav | Fixed glass pill. Re-skins per surface. | WP0 | Wordmark, compact switch, pause, Dashboard (`/brands/dashboard`), Start | same, with Dashboard → `/creators/login` |
| 1 | Hero (`hero`) | night, sticky | WP1 | A1 | A5 hero |
| 2 | Working window (`work`) | paper sheet (lifts), deep frame | WP2 | A2 H2 and sub; window; act rail with the A2 cards | A5 H2 and sub; window; rail with the A5 cards |
| 3 | Run (`run`) | paper, sticky stage | WP3 | A3 | A6 |
| 4 | Number (`number`) | paper, opens with the lunar divider | WP4 | A4 guarantee and ROAS | A7 paid and share |
| 5 | Agents (`agents`) | deep inset panel | WP5 | A4 agents, orbit | A7 agents, orbit, the three Never locks |
| 6 | Connects (`connects`) | paper, last in the sheet | WP6 | A4 stores | A7 platforms |
| 7 | Close (`close`) | night (CSS horizon) | WP6 | A4 close, with the switch as the fork | A7 close |
| 8 | Footer and giant wordmark | night (planet body) | WP6 | | |
| ∞ | Promo launcher and card | fixed, bottom-right | WP7 | INPUTS brands | INPUTS creators |

Surface rhythm: night / paper (deep frame) / paper / paper / deep / paper / night. There are two dark objects on paper, and no stripes.

### 1.3 Signature moments

| ID | Moment | Trigger | Duration | What happens |
|---|---|---|---|---|
| **S1** | Moonrise | load | 0 to 2.4s | The CSS sky paints at first paint. The H1 lines rise. At 400ms the CSS rim **ignites from behind the field outward to both edges** (1.6s expo, pure CSS, no JS needed). When the canvas has drawn a frame, it crossfades in over 1.2s, already in step with the ignition. On desktop (≥1024, gate G10) the first toast rises out of the horizon at 2.4s. |
| **S2** | The switch | click or key | 1.2s | The pill springs (500ms). The headline odometers: out 450ms, in 800ms. The light changes hue over 1.2s and swings 6% of the width toward the side the thumb moved, then back. The field icon swaps and the placeholder retypes. The toasts re-cast. The sections below crossfade (deferred). |
| **S3** | Sheet lift | scroll from 0 to 1 hero height | scroll-linked | The paper sheet rises over the pinned night, from 24px inset to full bleed. A moonlight hairline sits on its top edge. The hero content lifts 40px and fades to .4, a dim overlay climbs to .55, and the limb sinks 120px. |
| **S4** | Fifteen seconds | window 55% in view, once | brands about 30.9s, creators about 30.1s | The rows tick at the real pace. The stopwatch counts and stamps **Store details in 15.0s**. The read folds into one line and the plan assembles beside it. Then "Run it again" and "Try it with your store". |
| **S5** | The number | enters, once | about 1.4s | **$63,050** counts up, critically damped (`SPRING.number`), while the curve beside it draws. Creators: **Weekly** sets in at figure size, and the payout rail waxes. |
| **S6** | The orbit | in view | 120s revolution; one bound run per cycle | Seven full moon glyphs on a tilted orbit. The agent at work brightens and sends a white beam into the star. MoonLive and MoonLearning stay dim, at "Waiting". |
| **S7** | Moonset | the close enters | scroll-linked | Night returns under the sheet's rounded bottom. The close rim re-ignites once. The dotted wordmark rises 24% and un-blurs from 8px to 0. |
| **S8** | Dawn | valid submit | 450ms | "Start" becomes "Reading". Everything but the field fades out, and the sky and the page behind it fade to #F6F4FC. Then `location.assign`. |

### 1.4 Load timeline (1440x900 desktop, 390x844 phone)

| t | Desktop | Phone |
|---|---|---|
| 0 (first paint, SSR) | CSS sky: gradient, ground disc, a faint pre-ignition rim at .30, halo .6, sun .45. Nav, switch, H1, field and chips are all in the HTML at their final positions, and only CSS animates them. | same |
| 0 to 600ms | Nav pill fades in, y −8 to 0, 500ms `--ease-out`. Switch the same, delayed 120ms. | same |
| 120 / 210ms | H1 line 1 / line 2 rise: `translateY(42%)` to 0, 1.1s `--ease-out-expo`, masked. **LCP = H1.** | 3 lines at 120 / 210 / 300ms |
| 300ms | The field rises 12px and fades in over 700ms. The hint is in the HTML in full. If hydration lands before 580ms (the field is still under 40% opacity), it clears and types at 85ms per char; otherwise it stays as rendered (§5.0.9). | same |
| 400ms | CSS ignition: the rim reveals from the centre outward over 1.6s expo, and rim, halo and sun reach their lit opacities. | same |
| 420ms | Chips fade in, 35ms stagger. | same |
| after `load` plus idle (about 300 to 900ms) | `import("./gl")`, then WebGL2, else WebGL1, else stay on CSS. | same; DPR capped at 1.5 |
| first canvas frame | The canvas crossfades over the CSS sky (1.2s). `uIgnite` follows the CSS ignition clock (§5.1.6). | same |
| 1.6s after the H1 rise | One gradient sweep on H1 line 2 (1.8s). It never loops. | same |
| 2.4s | First toast, left lane: "MOONSHOT AI · Opening yourstore.com" (gate G10). | No toasts below 1024 (ruling 34) |
| 4.0s or first scroll | The launcher scales in (0.8 to 1, 400ms expo). | Hidden until no field is in view |
| ongoing | Toasts play the read at its real pace, at most 2 visible, alternating lanes. Then a 3s rest, then repeat. The halo breathes ±4% over 8s; stars twinkle on 6 to 10s periods. | The halo and stars only |

### 1.5 Scroll storyboard

Page y values are build targets at 1440x900 and 390x844, ±10%.

| Beat | Desktop | Phone | Motion |
|---|---|---|---|
| **B1 Hero at rest** (scrollY 0) | Nav pill from x 160 to 1280. Switch top about y 170. Two-line H1 at 72px, its bottom about y 460. Field 580x76, centred on the apex at y 570. Chips at y 636. Two toast lanes on the horizon either side, x 80 to 380 and 1060 to 1360. The limb meets the screen edges at y 743. | Nav: Wordmark, pause, Dashboard. Switch 280x44. H1 38px on 3 lines. Field (`100vw − 32`) x 64, centred on the apex at about y 439. Chips on 2 lines. No toasts. The limb meets the edges about 47px below the apex. | S1, toasts |
| **B2 Lift** (scrollY 0 to 900) | The sheet's top edge rises from the bottom, inset 24px with a 32px radius and a moonlight hairline. Hero content goes y 0 to −40 and opacity 1 to .4. Dim overlay 0 to .55. Limb sinks 120px. The toasts freeze once the sheet covers their lanes (about scrollY 330). Start appears once the sheet covers the field (about scrollY 400). | Inset 12px, radius 28px, sink 80px. | S3 |
| **B3 Sheet arrives** (about 760 to 900) | The compact switch fades into the nav centre as soon as the sheet covers the hero switch (about 760). The pill flips to the paper skin (250ms) as the sheet passes under it (about 856 to 900). The canvas pauses at heroExit ≥ .999. | The compact switch replaces the Wordmark. | nav re-skin |
| **B4 Work head** (page y 1020 to 1190) | H2 "One link. The whole campaign." at 48px over cols 1 to 6. The sub over cols 8 to 12, aligned to the H2's last baseline. | Stacked: H2 34px, then the sub. | word blur-in, once |
| **B5 Window** (frame at page y 1250 to 1970) | Deep frame 1232x720 with the dotted horizon art. The white window is inset 56px. S4 starts at 55% visibility. | Frame (`100vw − 24`) x 660. Single column: 5-row chain viewport, then the artefact pane. | S4 |
| **B6 Act rail** (page y 2010 to 2190) | The three A2 promises in 3 columns. Each has a 2px track that fills while its act plays. | Only the active act's title and body, with three mini tracks above. | synced to S4 |
| **B7 Run** (page y 2290 to about 5000) | H2 left, sub right. Then a sticky stage of 100svh + 3 × 60svh: the step list on the left with a vertical progress rail, the panel on the right swapping mocks. | Stacked: each step followed by its mock. | sticky stage |
| **B8 Divider** (top of the number section) | 9 lunar glyphs, new to full to new, 11px, gap 16, at ink/16. They light in sequence (60ms stagger) once in view. | same | once |
| **B9 Number** (about 1,150px) | Row 1, guarantee. Left: H2, body, the 2px gradient rule, the signature. Right: "Guaranteed sales", **$63,050** at figure size counting up, "$12,500 across three phases, at 5x", then the curve under them at v1's proportion (column width × 96px). Row 2, ROAS. Left: H2, body, climb label, P1/P2/P3 chips. Right: dial 360px. | Stacked. Figure 64px. Curve 100% × 96px. Dial 300px. | S5, dial sweep 1.2s |
| **B10 Agents** (about 900px) | Deep panel inset 24px, radius 32. Left: H2, body, live readout. Right: 640x560 tilted orbit. | Panel inset 12px. Stage 358x300 under the copy, readout under the stage. | S6 |
| **B11 Connects** (about 300px) | One row: text on the left, marks on the right. One hairline above, no box. | Stacked, marks in a 2x2 grid. | fade, once |
| **B12 Close** (100svh) | The sheet ends with a 32px bottom radius over the night. The glass switch (the fork), then the H2 at display-2, then the field on the close horizon (apex at 56svh of the section), then the lock note and the credit. | H2 40px on 2 lines. | S7 |
| **B13 Footer** | Footer row (hairline white/8), then the dotted **HeyMoon** at 22vw, cropped by the page bottom with about 62% of its cap height showing. | 26vw | rise and un-blur |

### 1.6 Creators: what differs at each beat

| Beat | Creators |
|---|---|
| B1 | H1 "Your posts already sell." / "Take a cut of it." At icon and "yourhandle". Chips A5. The light leans pink. First toast (desktop): "MOONSHOT AI · Opening @yourhandle". Phone H1: "Your posts" / "already sell." / "Take a cut of it." |
| B4 | "One handle. Every campaign that fits." plus the A5 sub. |
| B5 | Title bar "@yourhandle". The read header is "Reading your profile" / "@yourhandle · five agents". 9 rows, stamp **Your grid in 16.2s**. Fold. Then "Three agents building your profile" (4 rows), MockWhy (four labels, each with a full Moon, no quantities), then MockTiers: Nabati Home 12%, Tide Trace 12% and Marhaba Kitchen 11%, each "Pre-qualified"; then Dune Run 11% "Request to join"; then "12 more, each a request to join" (all gate G5). |
| B6 | A5 card copy as the rail. |
| B7 | A6 steps. Panels: MockRead (final state), MockPicks, MockTerms, MockCheck. Steps 01, 03 and 04 carry credits that start with "You", so their glyph is the unlit ring. |
| B9 | Paid: "When do you get paid?". The figure is the word **Weekly**. PayoutRail: Funded, Held for you, Orders counted, Paid. Share: "10 to 16%" at figure size over the 16 dots of ShareScale. |
| B10 | "Seven agents. None of them can act as you." A dotted fence ellipse outside the orbit carries three lock glyphs. The left column adds "Locked for every agent" and three rows, each with a "Never" pill. The orbit cycles the read units. |
| B11 | "Your handle is all it needs." Instagram and TikTok as 40px ink squares. |
| B12 | "Paste your handle." Lock note: "No agent posts for you. No agent signs for you. No screen changes that." |

### 1.7 Switch timeline (brands to creators; mirror for the reverse)

| t (ms) | Element | Change |
|---|---|---|
| 0 | State | `select("creators", source)`. Urgent `setState`, then `history.replaceState(null, "", "/creators" + location.search + location.hash)`. Set `document.title` and the polite status text. |
| 0 to 500 | Pill | Spring `{bounce:.18, duration:.5}`. Label colours crossfade over 250ms. |
| 0 to 450 | H1 out | Lines go to `translateY(-100%)` and opacity 0, `--ease-exit`, 30ms stagger. |
| 120 to 920 | H1 in | Lines from `translateY(100%)` to 0, 800ms expo, 60ms stagger. |
| 0 to 1200 | Sky | `world` animates 0 to 1, `[.65,0,.35,1]`. The CSS tint layers crossfade, and the shader reads `uWorld` and `uDir`. |
| 0 to 200 | Toasts (desktop) | In-flight toasts exit. The queue swaps to the creators read and restarts at 1,000ms. |
| 0 to 200 | Field icon | Globe to At: crossfade with y 4px. |
| 0 to about 1,300 | Placeholder | If the field is empty, the hint deletes at 35ms per char, then types "yourhandle" at 85ms per char. If a draft exists for creators, it is shown. |
| 200 to 800 | Chips | Word blur-in, 35ms stagger. |
| deferred | Below the fold | `useDeferredValue`. Each section remounts keyed by audience and fades in over 300ms (opacity, 8px y). No exit animation, so there is never double DOM. The scroll anchor is restored (§5.0.4). |
| deferred | Promo | If open: the headline crossfades and the thumbnail remounts (keyed). |

**Reduced motion:** the pill moves instantly with a 200ms label crossfade. The headline sets swap by a 200ms opacity crossfade. `world` animates over 0.2s. The placeholder is static.

### 1.8 Submit timeline (S8)

| t (ms) | Change |
|---|---|
| 0 | Validate locally (§5.0.9). If invalid: show the error path, focus stays in the input, stop. |
| 0 | The button reads "Reading" with a cycling 15px glyph. The input becomes `readOnly`. The toasts freeze. Set `data-dawn` on the Landing root. |
| 0 to 300 | Every `.dawn-fade` element (nav, hero copy, switch, chips, toasts, sheet, footer, launcher) fades to 0 with `--ease-exit`. The field stays at full opacity. |
| 0 to 450 | `dawn` animates 0 to 1, `--ease-in-out`. The `.hz-dawn` layer of each horizon fades in with it, the canvas fades out with it (`opacity: 1 − dawn`, so it works even while the sky loop is paused), and the Landing root's background turns #F6F4FC, so the footer area and anything outside the two horizons go light too. |
| 450 | `window.location.assign("/brands/c?read=" + encodeURIComponent(url))`, or `"/creators/c?h=" + encodeURIComponent(handle)`. |
| `pageshow` with `persisted` | Reset `dawn`, `data-dawn`, the button label and the toasts (back/forward cache). |

**Reduced motion:** change the label, then navigate at once.

---

## 2. Design tokens

WP0 lands **every** token below before any builder starts. Builders never add a Tailwind key, because a new key reaches the browser only after a dev-server restart. Builder-specific CSS goes into a co-located `*.module.css`, under these rules:

- Use the CSS variables from §2.3.
- Never use `@apply` or `theme()` in a module. A module has no `@config`, so Tailwind would resolve the default config instead of this one.

### 2.1 `tailwind.site.config.ts` (complete)

```ts
import type { Config } from "tailwindcss";
import { C, EASE_CSS } from "./app/(site)/_site/tokens";

/* The marketing site's own tokens. Selected by app/(site)/globals.css via @config.
   Single source: _site/tokens.ts. Editing either file needs a dev-server restart. */
const config: Config = {
  content: ["./app/[(]site[)]/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        night: { 0: C.night0, 1: C.night1, 2: C.night2 },
        deep: C.deep,
        paper: C.paper,
        canvas: C.canvas,
        lilac: C.lilac,
        ink: C.ink,
        brand: {
          DEFAULT: C.v700, 700: C.v700, 600: C.v600, 500: C.v500, 400: C.v400, 300: C.v300,
          glow: C.glow, pink: C.pink, blush: C.blush,
        },
        good: { DEFAULT: C.good, deep: C.goodDeep },
        danger: C.danger,
      },
      opacity: {
        6: ".06", 7: ".07", 8: ".08", 12: ".12", 14: ".14", 16: ".16", 28: ".28", 32: ".32",
        56: ".56", 64: ".64", 72: ".72", 88: ".88", 92: ".92", 94: ".94",
      },
      fontSize: {
        "display-1": ["clamp(38px, min(8svh, 5.2vw), 80px)", { lineHeight: "1", letterSpacing: "-0.045em", fontWeight: "480" }],
        "display-2": ["clamp(36px, min(6.6svh, 4.4vw), 64px)", { lineHeight: "1.02", letterSpacing: "-0.042em", fontWeight: "480" }],
        figure: ["clamp(64px, 9vw, 132px)", { lineHeight: "0.92", letterSpacing: "-0.055em", fontWeight: "500" }],
        h2: ["clamp(30px, 3.3vw, 48px)", { lineHeight: "1.06", letterSpacing: "-0.038em", fontWeight: "500" }],
        h3: ["20px", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        lead: ["clamp(17px, 1.25vw, 18px)", { lineHeight: "1.55", letterSpacing: "-0.011em" }],
        body: ["16px", { lineHeight: "1.6", letterSpacing: "-0.006em" }],
        small: ["14px", { lineHeight: "1.45", letterSpacing: "-0.003em" }],
        micro: ["13px", { lineHeight: "1.45", letterSpacing: "0" }],
        "mono-label": ["11px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "500" }],
        "mono-data": ["13px", { lineHeight: "1.3", letterSpacing: "0", fontWeight: "500" }],
        "mono-timer": ["clamp(17px, 1.4vw, 20px)", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "500" }],
      },
      fontWeight: { book: "480" },
      letterSpacing: {
        figure: "-0.055em", display: "-0.045em", h2: "-0.038em", tight: "-0.02em",
        snug: "-0.011em", label: "0.08em", eyebrow: "0.12em",
      },
      borderRadius: {
        chip: "8px", receipt: "10px", control: "12px", toast: "14px", window: "18px",
        card: "20px", field: "24px", frame: "28px", sheet: "32px", pill: "100px",
      },
      boxShadow: {
        glass: "inset 0 0 0 1px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.06), 0 12px 32px -12px rgba(0,0,0,.6)",
        "glass-paper": "inset 0 0 0 1px rgba(18,21,27,.08), 0 8px 24px -12px rgba(25,18,52,.18)",
        track: "inset 0 1px 10px rgba(255,255,255,.05), inset 0 0 0 1px rgba(255,255,255,.08)",
        "track-paper": "inset 0 0 0 1px rgba(18,21,27,.06)",
        thumb: "inset 0 .6px .6px -1.25px rgba(0,0,0,.72), inset 0 2.29px 2.29px -2.5px rgba(0,0,0,.64), inset 0 10px 10px -3.75px rgba(0,0,0,.25), 0 10px 30px -10px rgba(0,0,0,.6), 0 0 24px -4px rgba(255,255,255,.18)",
        "thumb-paper": "0 1px 2px rgba(18,21,27,.08), 0 8px 20px -8px rgba(18,21,27,.28)",
        field: "0 0 0 1px rgba(255,255,255,.7), 0 24px 64px -24px rgba(0,0,0,.8)",
        toast: "inset 0 1px 0 rgba(255,255,255,.07), inset 0 0 0 1px rgba(255,255,255,.09), 0 18px 40px -18px rgba(0,0,0,.7)",
        window: "0 0 0 1px rgba(255,255,255,.06), 0 40px 100px -30px rgba(0,0,0,.8)",
        card: "0 1px 2px rgba(25,18,52,.04), 0 24px 48px -32px rgba(25,18,52,.22)",
        mock: "0 2px 4px rgba(25,18,52,.05), 0 20px 40px -16px rgba(25,18,52,.22)",
        promo: "0 1px 2px rgba(25,18,52,.06), 0 24px 64px -16px rgba(25,18,52,.35)",
        "promo-night": "0 0 0 1px rgba(255,255,255,.08), 0 32px 80px -16px rgba(0,0,0,.7)",
        launcher: "0 0 0 2px #9B7BF0, 0 0 0 6px rgba(155,123,240,.16), 0 12px 28px -8px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.10)",
        float: "0 8px 24px -6px rgba(0,0,0,.35)",
      },
      transitionTimingFunction: {
        "out-expo": EASE_CSS.outExpo, out: EASE_CSS.out, "in-out": EASE_CSS.inOut, exit: EASE_CSS.exit,
      },
      transitionDuration: { micro: "200ms", ui: "350ms", reveal: "600ms", world: "1200ms" },
      maxWidth: { text: "1120px", frame: "1232px" },
      zIndex: { sky: "0", canvas: "1", content: "2", close: "5", sheet: "20", nav: "50", promo: "60", skip: "70" },
      keyframes: {
        caret: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)", filter: "blur(4px)" }, to: { opacity: "1", transform: "none", filter: "blur(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "nav-in": { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "none" } },
        "field-in": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        "launcher-in": { from: { opacity: "0", transform: "scale(.8)" }, to: { opacity: "1", transform: "none" } },
        "launcher-pulse": { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.08)" } },
      },
      animation: {
        caret: "caret 1s step-end infinite",
        "fade-up": `fade-up .5s ${EASE_CSS.outExpo} both`,
        "fade-in": `fade-in .3s ${EASE_CSS.out} both`,
        "nav-in": `nav-in .5s ${EASE_CSS.out} both`,
        "field-in": `field-in .7s ${EASE_CSS.outExpo} .3s both`,
        "launcher-in": `launcher-in .4s ${EASE_CSS.outExpo} both`,
        "launcher-pulse": `launcher-pulse .6s ${EASE_CSS.out} 1`,
      },
    },
  },
  plugins: [],
};

export default config;
```

**Text contrast floors (ruling 27).** Every text colour must reach 4.5:1 below 18px and 3:1 above.

| Surface | Body | Captions, labels, any text under 18px | Decorative only, never text |
|---|---|---|---|
| Paper #FCFBF8 | `text-ink/72` | `text-ink/60` minimum (4.8:1) | `ink/30` and below |
| Night or deep | `text-white/72` | `text-white/56` minimum (5.6:1 on deep) | `white/32` and below |

Unlit glyph dots, tracks and hairlines are decorative.

### 2.2 `app/(site)/_site/tokens.ts` (complete; no React, imported by the config and by code)

```ts
export const C = {
  night0: "#000211", night1: "#010317", night2: "#0A0C1E", deep: "#141229",
  paper: "#FCFBF8", canvas: "#F6F4FC", lilac: "#F3EFFC", ink: "#12151B",
  v700: "#4D2FB0", v600: "#6848D1", v500: "#7C5CE0", v400: "#9B7BF0", v300: "#A78BFA", glow: "#A65FED",
  pink: "#F0559D", blush: "#F4A8D8", good: "#25A333", goodDeep: "#1C7A26", danger: "#D70015",
} as const;

export const EASE = {
  outExpo: [0.16, 1, 0.3, 1], out: [0.22, 1, 0.36, 1], inOut: [0.65, 0, 0.35, 1], exit: [0.7, 0, 0.84, 0],
} as const;
const bez = (e: readonly number[]) => `cubic-bezier(${e.join(",")})`;
export const EASE_CSS = {
  outExpo: bez(EASE.outExpo), out: bez(EASE.out), inOut: bez(EASE.inOut), exit: bez(EASE.exit),
} as const;

/** Seconds, for motion. */
export const DUR = {
  micro: 0.2, ui: 0.35, out: 0.45, pill: 0.5, reveal: 0.6, in: 0.8, hero: 1.1,
  draw: 1.2, world: 1.2, ignite: 1.6, dawn: 0.45, reduced: 0.2,
} as const;
export const SPRING = {
  pill: { type: "spring", bounce: 0.18, duration: 0.5 },
  // Critically damped (ζ ≈ 1.004, mass 1): $63,049 at 1.3 s, rest at about 1.44 s, never above the target.
  // ({damping: 60, stiffness: 100} was ζ = 3 and took 6.9 s to rest.)
  number: { stiffness: 120, damping: 22, restDelta: 0.5 },
} as const;

/** The two media queries every package shares. Never write another breakpoint for these. */
export const MQ = { phone: "(max-width: 639px)", short: "(max-height: 520px)" } as const;

export const GLYPH = { stepMs: 160, launcherStepMs: 90 } as const;
export const TYPE = { typeMs: 85, deleteMs: 35, errorMs: 4000, retypeBeforeMs: 580 } as const;
export const TOAST = { inMs: 500, holdMs: 2400, outMs: 400, restMs: 3000, firstAtMs: 2400, openerMs: 900, minWidth: 1024 } as const;
export const RUN = { startAt: 0.55, pauseBelow: 0.2, foldDelayMs: 600, foldMs: 500, holdMs: 4000, compactGapMs: 2000, picksLeadMs: 300 } as const;
export const ORBIT = { revS: 120, beamMs: 900, pulseMs: 600, restMs: 2000 } as const;
export const LIFT = { insetDesktop: 24, insetPhone: 12, radiusDesktop: 32, radiusPhone: 28, liftPx: 40, dim: 0.55, contentOpacity: 0.4 } as const;
export const SKY = {
  dprLevels: [1.5, 1.0, 0.75], maxPixels: 2.2e6, fpsFloor: 55.5, giveUpFps: 40,
  skipFrames: 30, sampleFrames: 50, capped33Ms: [31.3, 35.3], maxRestores: 2,
  sinkPx: { desktop: 120, phone: 80 }, pointerPx: { x: 12, y: 6 }, pointerLerp: 0.06,
  limbRadiusVw: 1.1, igniteDelayMs: 400, igniteMs: 1600, canvasFadeMs: 1200,
} as const;
export const WORLD = { duration: 1.2, reducedDuration: 0.2 } as const;
```

### 2.3 `app/(site)/globals.css` (complete)

```css
/* The marketing site's stylesheet. Never imported by (brands) or (creators). */
@config "../../tailwind.site.config.ts";

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Not inherited: RoasDial sets --sweep on the .dial-dot element itself, never on a parent. */
@property --sweep { syntax: "<angle>"; inherits: false; initial-value: 0deg; }

@layer base {
  :root {
    --night-0: #000211; --night-1: #010317; --night-2: #0A0C1E; --deep: #141229;
    --paper: #FCFBF8; --canvas: #F6F4FC; --lilac: #F3EFFC; --ink: #12151B;
    --v700: #4D2FB0; --v600: #6848D1; --v500: #7C5CE0; --v400: #9B7BF0; --v300: #A78BFA; --glow: #A65FED;
    --pink: #F0559D; --blush: #F4A8D8; --good: #25A333; --good-deep: #1C7A26; --danger: #D70015;

    --on-1: rgb(255 255 255 / .94); --on-2: rgb(255 255 255 / .72); --on-3: rgb(255 255 255 / .56); --on-4: rgb(255 255 255 / .32);
    --hair-night: rgb(255 255 255 / .08); --rule-night: rgb(255 255 255 / .14);
    --ink-2: rgb(18 21 27 / .72); --ink-3: rgb(18 21 27 / .60); --ink-4: rgb(18 21 27 / .30);
    --hair: rgb(18 21 27 / .07); --rule: rgb(18 21 27 / .14);

    /* THE ONE GRADIENT (D3), spent in exactly three places: the light behind the field
       (hero and close count as one), the 2px rule, and H1 line 2. */
    --grad: linear-gradient(95deg, #4D2FB0 0%, #7C5CE0 45%, #F0559D 100%);
    --grad-rule: linear-gradient(90deg, #4D2FB0, #7C5CE0 50%, #F0559D);
    --grad-night-text: linear-gradient(95deg, #9B7BF0 0%, #A65FED 48%, #F0559D 100%);

    --ease-out-expo: cubic-bezier(.16,1,.3,1);
    --ease-out: cubic-bezier(.22,1,.36,1);
    --ease-in-out: cubic-bezier(.65,0,.35,1);
    --ease-exit: cubic-bezier(.7,0,.84,0);

    --nav-top: 16px; --nav-h: 56px; --gutter: 24px;
    --limb-r: 110vw;
  }
  @media (max-width: 639px) { :root { --nav-top: 12px; --nav-h: 52px; --gutter: 16px; } }

  html { background: var(--night-1); -webkit-text-size-adjust: 100%; scroll-padding-top: 96px; }
  body { background: var(--night-1); color: var(--ink); overflow-x: clip; }
  ::selection { background: rgb(124 92 224 / .28); }
  :focus-visible { outline: 2px solid var(--v500); outline-offset: 3px; }
  [data-surface="night"] :focus-visible, [data-surface="deep"] :focus-visible { outline-color: rgb(167 139 250 / .9); }
}

/* Lenis 1.3.26's stylesheet, copied (the package is sideEffects:false). */
html.lenis, html.lenis body { height: auto; }
.lenis:not(.lenis-autoToggle).lenis-stopped { overflow: clip; }
.lenis [data-lenis-prevent], .lenis [data-lenis-prevent-wheel], .lenis [data-lenis-prevent-touch],
.lenis [data-lenis-prevent-vertical], .lenis [data-lenis-prevent-horizontal] { overscroll-behavior: contain; }
.lenis.lenis-smooth iframe { pointer-events: none; }
.lenis.lenis-autoToggle { transition-property: overflow; transition-duration: 1ms; transition-behavior: allow-discrete; }

@layer components {
  .num { font-variant-numeric: tabular-nums; direction: ltr; unicode-bidi: isolate; }
  .mono-caps { font-family: var(--font-geist-mono), ui-monospace, monospace; font-size: 11px; line-height: 1.2;
    font-weight: 500; letter-spacing: .08em; text-transform: uppercase; }
  /* The text-mono-* size utilities set size only. These set the Geist Mono family too (rule 2.4.9). */
  .mono-data { font-family: var(--font-geist-mono), ui-monospace, monospace; font-size: 13px; line-height: 1.3; font-weight: 500; }
  .mono-timer { font-family: var(--font-geist-mono), ui-monospace, monospace; font-size: clamp(17px, 1.4vw, 20px);
    line-height: 1; letter-spacing: -0.02em; font-weight: 500; font-variant-numeric: tabular-nums; }
  .grad-rule { background: var(--grad-rule); }
  .hm-media { background: linear-gradient(150deg, #EFEAFB 0%, #FBFAFD 45%, #FDEEF5 100%); }
  .halftone { background: radial-gradient(circle, rgb(167 139 250 / .55) 1px, transparent 1.4px) 0 0 / 8px 8px;
    -webkit-mask: radial-gradient(120% 70% at 50% 112%, #000 28%, transparent 70%);
            mask: radial-gradient(120% 70% at 50% 112%, #000 28%, transparent 70%); }
  .cv-auto { content-visibility: auto; contain-intrinsic-size: auto 900px; }

  /* H1 line 2 on night, with its one highlight pass (never looped). */
  .grad-text-night {
    background-image: linear-gradient(100deg, transparent 40%, rgb(255 255 255 / .55) 50%, transparent 60%), var(--grad-night-text);
    background-size: 250% 100%, 100% 100%; background-position: 0 0, 0 0; background-repeat: no-repeat;
    -webkit-background-clip: text; background-clip: text; color: transparent;
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
  }

  /* Moon-phase glyph (WP0 ui/Moon.tsx). */
  .moon { display: inline-block; flex: none; vertical-align: middle; }
  .moon circle { fill: currentColor; fill-opacity: .16; }
  .moon circle[data-lit="1"] { fill-opacity: 1; }
  .moon-ring { fill: none; stroke: currentColor; stroke-opacity: .30; }

  /* Odometer morph: hero H1 (WP1) and close H2 (WP6). States: rise | still | in | out | idle.
     Every switch REMOUNTS both children (key + h1/div swap), and a new node gets no CSS transition.
     So "out" hides itself with a delayed animation, never with a transition. */
  .morph { display: grid; }
  .morph > * { grid-area: 1 / 1; }
  .morph .line { display: block; overflow: clip; padding-block-end: .08em; }
  .morph .line > span { display: block; }
  .morph > [data-state="out"] { animation: morph-hide 0s linear .6s both; }   /* after the last line's hl-out (≤ .51s) */
  .morph > [data-state="idle"] { visibility: hidden; }

  /* Mock draws (WP3, WP4, WP8). Server HTML carries data-drawn, so no-JS shows them drawn. */
  .draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
  [data-drawn] .draw { stroke-dashoffset: 0; transition: stroke-dashoffset 1.2s var(--ease-out); }
  .draw-fill { opacity: 0; }
  [data-drawn] .draw-fill { opacity: 1; transition: opacity .8s var(--ease-out) .45s; }
  .dial-dot { transform-box: view-box; transform-origin: 100px 100px; }
  [data-drawn] .dial-dot { transform: rotate(var(--sweep)); transition: transform 1.2s var(--ease-out); }

  /* S8 dawn: everything that opts in fades while the field stays. !important beats motion's inline styles
     and CSS animations. The Landing root (.landing-root) turns light behind everything that faded. */
  [data-dawn] .dawn-fade { opacity: 0 !important; transition: opacity .3s var(--ease-exit) !important; pointer-events: none; }
  .landing-root { transition: background-color .45s var(--ease-in-out); }
  .landing-root[data-dawn] { background-color: var(--canvas); }

  /* ── Horizon (WP0 shell/Horizon.tsx). Put .hz in the SAME grid cell as the field:
        its vertical centre IS the apex. Layer order = DOM order.
        Halo, sun and rim are TWO levels: the outer layer carries the shape and the ignition animation;
        one inner .hz-tint per audience carries the colour and the opacity bound to `world`.
        (A CSS animation overrides an inline style on the same element, so the two must never share one.) ── */
  .hz { position: relative; z-index: 0; pointer-events: none; align-self: stretch; justify-self: stretch; }
  .hz > * { position: absolute; left: 50%; width: 100vw; translate: -50% 0; }
  .hz-tint { position: absolute; inset: 0; border-radius: inherit; }
  .hz-sky { bottom: 50%; height: 150svh;
    background: linear-gradient(to top, var(--deep) 0, var(--night-1) calc(var(--apex-pref, 60svh) * .62)); }
  /* The halo is "the glow behind the field" (D3): 38% wide, so it fades out about 29% of the width from the centre. */
  .hz-halo { top: 50%; height: min(50svh, 440px); translate: -50% -50%; opacity: 1; }
  .hz-halo > [data-tint="brands"] {
    background: radial-gradient(38% 50% at 50% 50%, rgb(124 92 224 / .42), rgb(77 47 176 / .16) 45%, transparent 75%); }
  .hz-halo > [data-tint="creators"] {
    background: radial-gradient(38% 50% at 50% 50%, rgb(240 85 157 / .38), rgb(124 92 224 / .16) 45%, transparent 75%); }
  .hz-sun { top: 50%; width: min(1100px, 130vw); height: min(280px, 34svh); translate: -50% -50%;
    border-radius: 50%; filter: blur(44px); opacity: .7; }
  .hz-sun > [data-tint="brands"] {
    background: radial-gradient(50% 50% at 50% 50%, rgb(255 255 255 / .55) 0%, rgb(167 139 250 / .55) 22%, rgb(124 92 224 / .32) 45%, transparent 70%); }
  .hz-sun > [data-tint="creators"] {
    background: radial-gradient(50% 50% at 50% 50%, rgb(255 255 255 / .55) 0%, rgb(244 168 216 / .55) 22%, rgb(240 85 157 / .30) 45%, transparent 70%); }
  .hz-ground { top: 50%; height: 150svh;
    background: radial-gradient(circle var(--limb-r) at 50% var(--limb-r),
      var(--night-0) calc(var(--limb-r) - .75px), var(--deep) calc(var(--limb-r) + .75px)); }
  .hz-earth { top: 50%; height: 200px;
    background: radial-gradient(circle var(--limb-r) at 50% var(--limb-r),
      transparent calc(var(--limb-r) - 36px), rgb(124 92 224 / .10) calc(var(--limb-r) - 1px), transparent var(--limb-r)); }
  /* The rim's mask and ignition clip-path live on the outer layer; the tints only paint. */
  .hz-rim { top: calc(50% - 4px); height: 200px;
    -webkit-mask: radial-gradient(circle calc(var(--limb-r) + 6px) at 50% calc(var(--limb-r) + 4px),
      transparent calc(var(--limb-r) - 1px), #000 calc(var(--limb-r) - .25px), #000 calc(var(--limb-r) + .5px), transparent calc(var(--limb-r) + 1.5px));
            mask: radial-gradient(circle calc(var(--limb-r) + 6px) at 50% calc(var(--limb-r) + 4px),
      transparent calc(var(--limb-r) - 1px), #000 calc(var(--limb-r) - .25px), #000 calc(var(--limb-r) + .5px), transparent calc(var(--limb-r) + 1.5px)); }
  .hz-rim > .hz-tint { --rim-hue: 124 92 224;
    background: linear-gradient(90deg, rgb(var(--rim-hue) / .15) 0%, rgb(var(--rim-hue) / .45) 20%,
      rgb(255 255 255 / .85) 50%, rgb(var(--rim-hue) / .45) 80%, rgb(var(--rim-hue) / .15) 100%); }
  .hz-rim > [data-tint="creators"] { --rim-hue: 240 85 157; }
  .hz-hair { top: calc(50% - 8px); height: 120px;
    background: linear-gradient(90deg, transparent 10%, rgb(255 255 255 / .30) 50%, transparent 90%);
    -webkit-mask: radial-gradient(circle calc(var(--limb-r) + 12px) at 50% calc(var(--limb-r) + 8px),
      transparent calc(var(--limb-r) + 2.5px), #000 calc(var(--limb-r) + 3px), transparent calc(var(--limb-r) + 3.5px));
            mask: radial-gradient(circle calc(var(--limb-r) + 12px) at 50% calc(var(--limb-r) + 8px),
      transparent calc(var(--limb-r) + 2.5px), #000 calc(var(--limb-r) + 3px), transparent calc(var(--limb-r) + 3.5px)); }
  .hz-dawn { top: -150svh; height: 300svh; background: var(--canvas); opacity: 0; }
  .hz[data-gl="on"] > :not(.hz-dawn) { visibility: hidden; }   /* set after the canvas fade completes */
}

@media (prefers-reduced-motion: no-preference) {
  .morph > [data-state="rise"] .line > span { animation: hl-rise 1.1s var(--ease-out-expo) both; animation-delay: calc(120ms + var(--i, 0) * 90ms); }
  .morph > [data-state="rise"] .line > .grad-text-night {
    animation: hl-rise 1.1s var(--ease-out-expo) calc(120ms + var(--i, 0) * 90ms) both,
               grad-sweep 1.8s var(--ease-in-out) calc(1.6s + var(--i, 0) * 90ms) both; }
  .morph > [data-state="in"] .line > span { animation: hl-in .8s var(--ease-out-expo) both; animation-delay: calc(120ms + var(--i, 0) * 60ms); }
  .morph > [data-state="out"] .line > span { animation: hl-out .45s var(--ease-exit) both; animation-delay: calc(var(--i, 0) * 30ms); }

  /* Outer layers only (.hz > .hz-*): the inner .hz-tint opacities stay free for `world`. */
  .hz[data-ignite] > .hz-rim { animation: hz-rim-in 1.6s var(--ease-out-expo) .4s both; }
  .hz[data-ignite] > .hz-halo { animation: hz-halo-in 1.6s var(--ease-out-expo) .4s both; }
  .hz[data-ignite] > .hz-sun { animation: hz-sun-in 1.6s var(--ease-out-expo) .4s both; }
}
@media (prefers-reduced-motion: reduce) {
  /* Animations, not transitions: both children are new nodes after every switch. */
  .morph > [data-state="in"] { animation: morph-fade-in .2s var(--ease-out) both; }
  .morph > [data-state="out"] { animation: morph-fade-out .2s var(--ease-out) both, morph-hide 0s linear .2s both; }
  .draw { stroke-dashoffset: 0 !important; transition: none !important; }
  .draw-fill { opacity: 1 !important; transition: none !important; }
  .dial-dot { transform: rotate(var(--sweep)) !important; transition: none !important; }
}

/* Short screens (MQ.short): the hero is not sticky, so every heroExit binding is switched off.
   !important in a stylesheet beats inline styles AND scroll-timeline animations. Each bound element
   carries data-lift (WP0 Lift.tsx, WP1 Hero.tsx). */
@media (max-height: 520px) {
  [data-lift] { opacity: 1 !important; transform: none !important; clip-path: none !important; }
  [data-lift="dim"], [data-lift="edge"] { opacity: 0 !important; }
}

@keyframes hl-rise { from { transform: translateY(42%); } }
@keyframes hl-in { from { transform: translateY(100%); } }
@keyframes hl-out { to { transform: translateY(-100%); opacity: 0; } }
@keyframes morph-hide { to { visibility: hidden; } }
@keyframes morph-fade-in { from { opacity: 0; } }
@keyframes morph-fade-out { to { opacity: 0; } }
@keyframes grad-sweep { from { background-position: 100% 0, 0 0; } to { background-position: 0 0, 0 0; } }
@keyframes hz-rim-in { from { clip-path: inset(0 50% 0 50%); opacity: .3; } to { clip-path: inset(0 0 0 0); opacity: 1; } }
@keyframes hz-halo-in { from { opacity: .6; } to { opacity: 1; } }
@keyframes hz-sun-in { from { opacity: .45; } to { opacity: .7; } }
```

### 2.4 Rules every builder applies

1. **Surfaces.** Every section root carries `data-surface="night|paper|deep"` and `data-slot="<slot id>"`. The nav reads them.
2. **Gradient spends.**
   - The gradient appears in three places only:
     1. the light behind the field (hero and close);
     2. the 2px `.grad-rule` in the number section;
     3. H1 line 2.
   - Product chrome drawn *inside mocks* keeps its own styling as a likeness: the MockCurve stroke, the dial, the Phase 1 bar. Those strokes use the gradient and are allowed.
   - **Figure chrome:** the guarantee `Curve` inside the figure column (cols 7 to 12), at v1's GuaranteePanel proportion of column width × 96px, with v1's gradient stroke and its .20 area fill. Never wider than the column, never full bleed (ruling 36).
   - Nothing else carries the gradient: not the launcher ring, the orbit, any button, or the promo band.
3. **On night, depth comes from rings and light.** Never put grey drop shadows on dark, except the `field`, `window` and `float` tokens, which sit on light objects.
4. **Numbers.** Every number uses `.num`. Money strings come pre-formatted from demo.json, and the site never formats money itself. The only exception is `CountUp`, which uses `formatUSD`, parity-tested against `fmtUSD` (§3.2).
5. **RTL-safe.**
   - Use logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `inset-inline`).
   - Every `x` direction in motion mirrors under `dir="rtl"`. Use the `useDir()` sign from `lib/prefs.ts`.
   - URL, handle and number elements carry `dir="ltr"`.
   - Never split text into characters. Words are the smallest split.
6. **Motion opts in.**
   - CSS motion lives inside `@media (prefers-reduced-motion: no-preference)` or uses `motion-safe:`. That includes every `animate-*` utility: write `motion-safe:animate-nav-in`, never a bare `animate-nav-in`.
   - JS motion checks `useReducedMotionPref()` (WP0), **never** motion's `useReducedMotion` (null on the server, and not live).
   - **Never put an `animate-*` with fill `both` on an element whose opacity or transform is also toggled** (a CSS animation's fill beats classes and inline styles). Animate an inner wrapper, and toggle the outer one with transitions.
7. **Static by default.** Count-ups, draws, the window and word reveals render their **final** state on the server. On mount:
   - if the element is below the viewport (`rect.top > innerHeight`), reset it to the start state while unseen, then play it on entry;
   - if it is in view at mount, leave it final.

   There is never a visible jump from final to zero.
8. **Ambient loops** run only while `useActive(ref)` is true: in view, the page is visible, not user-paused, and not reduced motion. Anything inside the sticky hero also needs `useUncovered(ref)` (§5.0.7): IntersectionObserver keeps reporting "visible" while the sheet covers it.
9. **Class names.** The type scale is used through Tailwind's `text-*` utilities: `text-small`, `text-micro`, `text-lead`, `text-body`, `text-h2`, `text-h3`, `text-figure`, `text-display-1`, `text-display-2`. Wherever this spec writes `small`, `micro`, `lead` or `body` inside a class list, it means the `text-` utility. `mono-caps`, `mono-data` and `mono-timer` are component classes from globals.css that set the Geist Mono family as well as the size; never write `text-mono-data` or `text-mono-timer` (size only, so the text falls back to Geist Sans).
10. **Breakpoints.** Phone means `MQ.phone` (`max-width: 639px`, Tailwind `max-sm:` / `sm:`); short means `MQ.short` (`max-height: 520px`, with no orientation clause). Above-the-fold layout is CSS only: `useIsPhone()` and `useMediaQuery()` return `false` on the server, so they never decide what renders in the hero, the nav or the first viewport.
11. **Links to `/brands` and `/creators`.** Never `next/link` (it is lint-banned in the site, §4.4). After a switch, Next 14.2's patched `replaceState` restores the old router tree under the new URL, so a soft navigation keeps `Landing` mounted with the wrong audience. Use a plain `<a {...useAudienceLink(a, source)}>` (`lib/audience.tsx`): its plain click calls `preventDefault()` then `select(a, source)`, or scrolls to the top when `a` is already the current audience. AudienceSwitch, the Nav Wordmark and the footer all use it.

---

## 3. demo.json

No product library is imported into the site bundle. `scripts/bind-demo.cjs` runs the real product functions under jiti and writes `app/(site)/_site/data/demo.json`. The site imports only that JSON, through `data/demo.ts`. **Every number on the page comes from it.** The one exception is the live stopwatch's intermediate values, which count toward a bound total.

### 3.1 `app/(site)/_site/data/types.ts` (complete)

```ts
export type Audience = "brands" | "creators";
export type AgentName =
  | "MoonShot AI" | "MoonMatch AI" | "MoonSearch AI" | "MoonWriter AI"
  | "MoonLive AI" | "MoonScore AI" | "MoonLearning AI";
export type AgentRole =
  | "Intake" | "Matching" | "Safety" | "Creative" | "Activation" | "Optimization" | "Learning";
export type Platform = "Instagram" | "TikTok";

/** A bound amount and the exact text the product prints for it (fmtUSD). */
export interface Money { value: number; text: string }

/** One row of an agent run. */
export interface RunUnit {
  key: string;          // READ_TASKS / BUILD_TASKS key
  agent: AgentName;
  role: AgentRole;
  note: string;         // task.note, verbatim: what the agent is doing
  produces: string;     // task.produces, verbatim: what it has made
  startMs: number;      // ms from run start when the row begins working
  endMs: number;        // ms from run start when the row lands
  stream: string;       // the stream step that did the work: = key, except brands "safety" → "creators"
}

export interface Run {
  title: string | null; // product roster title; null for the creators read (it uses LABELS.readingProfile)
  sub: string | null;   // creators read only: "@yourhandle · five agents"
  opener: string | null;// first stream line, scrubbed, "Agent · note"; null when the stream has none
  agents: AgentName[];  // distinct, in first-appearance order
  agentWord: string;    // countWord(agents.length)
  units: RunUnit[];
  sizes: { atMs: number; total: number }[]; // the counter's denominator over time (read: 4, then 9)
  totalMs: number;
  totalText: string;    // `${(totalMs / 1000).toFixed(1)}s`, e.g. "15.0s"
}

export interface Rung {
  phaseNo: 1 | 2 | 3;
  label: string;        // phaseTitle(phaseNo): "Phase 1 · Warm-up"
  budget: Money;        // $1,000 / $4,000 / $7,500
  multiple: number;     // 1 / 3.7 / 6.3
  multipleText: string; // "1x" / "3.7x" / "6.3x"
  width: number;        // max(.16, budget / max budget): MockPhases bar width (ruling C11)
}

export interface BrandsDemo {
  shownUrl: "yourstore.com";
  read: Run;            // read_site: opener + 9 units, 15,022 ms, "Four agents read your store"
  build: Run;           // propose_plan: opener + 7 rows (safety rides the creators step), 10,768 ms, "Five agents on your plan"
  promoAgentWord: string;          // countWord(|read.agents ∪ build.agents|): "five"
  plan: {
    phaseLabel: string;            // "Phase 1 · Warm-up"
    pay: Money;                    // $1,000
    markets: string[];             // ["UAE", "KSA", "Kuwait"]
    creatorCount: number;          // 3 (count only: no names, handles, avatars)
    creatorWord: string;           // "three"
  };
  ladder: Rung[];
  guarantee: { revenue: Money; budget: Money; roas: number; roasText: string }; // $63,050 / $12,500 / 5 / "5x"
  checkout: { total: Money; vat: Money; budget: Money; last4: string };         // $1,050 / $50 / $1,000 / "4629"
  roasScale: { min: number; max: number };                                      // 1 / 12
  unlockPct: number;                                                            // 80
}

/** Named CampaignPick, not Pick: `Pick` would shadow TypeScript's Pick<> utility in every importing file. */
export interface CampaignPick {
  brand: string;        // fictional campaign brands only (asserted)
  campaign: string;     // offer.title
  product: string;
  sharePct: number;     // commissionPct
  levelWord: string;    // MATCH_WORD[offer.match.level]: "Pre-qualified"
  paceBig: string;      // paceOf(offer).big: "4 ads"
  paceSmall: string;    // paceOf(offer).small: "at your own pace"
  enterMs: number;      // cumulative match_offers ms for this pick: 343 / 667 / 911
}

export interface CreatorsDemo {
  shownHandle: "@yourhandle";
  platforms: Platform[];           // ["Instagram", "TikTok"], asserted equal to the union of live offers' deliverable platforms
  read: Run;                       // read_profile: opener + 9 units, 16,242 ms
  build: Run;                      // propose_profile: 4 units, 7,193 ms, "Three agents building your profile"
  readerWord: string;              // "five"
  match: {
    levelWord: string;             // "Pre-qualified"
    reasons: { key: "market" | "authenticity" | "consistency" | "audience"; label: string; lit: boolean }[];
                                   // label = picks[0].match.signals[i].label; lit = picks[0].match.signals[i].strong (today all true).
                                   // No weights, no quantities (ruling 26). Gate G5.
  };
  picks: { title: string; countWord: string; items: CampaignPick[] }; // "Your top three, Pre-qualified"; countWord "three"
  requests: { next: { brand: string; sharePct: number }; rest: number };   // Dune Run 11 / 12
  prequalifiedCap: number;                                     // 3
  terms: { brand: string; needsApproval: boolean; sharePct: number; commits: string[]; notCommits: string[] };
  check: { product: string; brand: string; dueIn: string; checkCount: number; misses: { label: string; fix: string }[] };
  shares: { list: number[]; min: number; max: number; liveCount: number; counts: { pct: number; count: number }[] };
  locks: string[];                 // the three DEFAULT_AUTONOMY rows locked at never
}

export interface DemoData {
  version: 1;
  hash: string;                    // sha1 of the canonical JSON without `hash`; no timestamps anywhere
  agents: { name: AgentName; role: AgentRole }[];   // AGENTS order; roles asserted against tasks and the A4 stages
  brands: BrandsDemo;
  creators: CreatorsDemo;
}
```

`data/demo.ts`:

```ts
import raw from "./demo.json";
import type { DemoData } from "./types";
/* resolveJsonModule widens literals; correctness comes from the typed bind. */
export const DEMO = raw as unknown as DemoData;
```

### 3.2 The bind script

**`scripts/bind-demo.cjs`** (complete). It is the launcher only, and it adds the TSX transpile hook (verified today):

```js
/* Runs the real product functions and writes app/(site)/_site/data/demo.json.
   jiti 1.21 parses .tsx but does not transform JSX, so .tsx goes through TypeScript. */
const path = require("path");
const root = path.resolve(__dirname, "..");
const ts = require("typescript");
const babel = require("jiti/dist/babel.js");
const transform = (opts) => {
  if (opts.filename && opts.filename.endsWith(".tsx")) {
    const out = ts.transpileModule(opts.source, {
      fileName: opts.filename,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    return { code: out.outputText };
  }
  return (babel.default || babel)(opts);
};
const jiti = require("jiti")(__filename, {
  interopDefault: true, requireCache: false, alias: { "@": root }, transform,
  extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
});
jiti("./bind-demo.ts")
  .main({ check: process.argv.includes("--check") })
  .catch((e) => { console.error(`bind-demo: ${e.message}`); process.exit(1); });
```

**`scripts/bind-demo.ts`** is typed against `types.ts`, so `tsc` checks the mapping. It exports `main({check})`.

**Drain on a recorded fake clock.** Every stream is drained this way, so notes, ms and progress are the product's own:

```ts
/* Cast through unknown: `as any` fails @typescript-eslint/no-explicit-any (next/typescript), and §7.2 lints scripts/. */
const clock = globalThis as unknown as { setTimeout: (fn: () => void, ms: number) => unknown };
async function drain<T>(gen: AsyncGenerator<{ note: string; progress: { done: number; total: number } }, T>) {
  const real = clock.setTimeout;
  const log: number[] = [];
  clock.setTimeout = (fn, ms) => { log.push(ms); queueMicrotask(fn); return 0; };
  try {
    const chunks: { note: string; done: number; total: number; ms: number }[] = [];
    let r = await gen.next();
    for (; !r.done; r = await gen.next()) {
      chunks.push({ note: r.value.note, done: r.value.progress.done, total: r.value.progress.total, ms: log.at(-1) ?? 0 });
      log.length = 0;
    }
    return { chunks, value: r.value as T };
  } finally { clock.setTimeout = real; }
}
const ctx = () => ({ signal: new AbortController().signal });
```

**Field-by-field bindings.** It is a whitelist. Never spread a product object into the output.

| demo.json path | Produced by (B = `app/(brands)/brands`, C = `app/(creators)/creators`) |
|---|---|
| `agents[]` | B `lib/agent/agents.ts` `AGENTS` (assert length 7, identical to C's). The role is the agent's `role` in READ_TASKS ∪ BUILD_TASKS. MoonLive gets "Activation" and MoonLearning gets "Learning", both from `COPY.shared.stages` (import `_site/copy.ts`). Assert every task role matches the stage list. |
| `brands.read` | `drain(B tools.read_site({url:"ounass.com"}, ctx()))`. Chunk 0 is the opener; scrub `ounass.com` to `yourstore.com`. Chunks 1 to 9 map to `READ_TASKS[i-1]` (assert `note === \`${t.agent} · ${t.note}\``). `startMs` and `endMs` are cumulative chunk `ms`. `sizes` records each change of `total`, at that chunk's `endMs`: `[{0,4},{6048,9}]`. `title` = B `components/blocks.tsx` `rosterTitle(READ_TASKS, "read your store")`. `agentWord` = B `countWord`. |
| `brands.build` | `drain(B tools.propose_plan({read: brandsRead.value}, ctx()))`. The opener is chunk 0 ("MoonShot AI · Starting from your store details"). Map each chunk to its BUILD_TASKS row by `note`. Rows come **in BUILD_TASKS order**. The single row with no chunk must be `safety`: give it the `creators` row's start and end, and `stream: "creators"`. Assert `planFor(read).pool.why.includes("MoonSearch AI")`. `sizes` = `[{atMs:0, total: BUILD_TASKS.length}]`. `title` = `rosterTitle(BUILD_TASKS, "on your plan")`. |
| `brands.promoAgentWord` | `countWord(new Set([...read.agents, ...build.agents]).size)` |
| `brands.plan.*` | `plan = B planFor(read)`. `phaseLabel` = B `lib/mock/campaigns.ts` `phaseTitle(plan.ladder.value[0].phaseNo)`. `pay` = `money(plan.budget.value)`. `markets` = `plan.markets.value.slice(0,3).map(c => SHORT_MARKET[c])` (B `lib/landing.ts`; assert none undefined). `creatorCount` = `plan.creators.value.length`, with `creatorWord` from countWord. |
| `brands.ladder[]` | `plan.ladder.value`: `phaseNo`, `budget`, `multiple`. `label` = `phaseTitle(phaseNo)`. `width` = `max(.16, budget / max)`. |
| `brands.guarantee` | `ladderTotals(plan.planBudget.value, plan.guaranteedRoas.value)`: `revenue`, `budget`. `roas` = `plan.guaranteedRoas.value`. |
| `brands.checkout` | `req = B tools.request_funding({plan, phaseNo: 1})`. Its money fields are `Sourced`, so read `.value`: `money(req.total.value)`, `money(req.vat.value)`, `money(req.amount.value)` (as `budget`), and `req.method.last4`. Assert `total = amount + vat` and `vat = round(amount × VAT_RATE)`. |
| `brands.roasScale` | B `lib/agent/model.ts` `ROAS_MIN`, `ROAS_MAX` |
| `brands.unlockPct` | `UNLOCK_AT × 100` (B `lib/mock/campaigns.ts`) |
| `creators.read` | `drain(C tools.read_profile({handle: PEOPLE[0].handle}, ctx()))`. Scrub the handle to `@yourhandle`. Map to C `READ_TASKS` as for brands. `title: null`. `sub` = `` `@yourhandle · ${readerWord} agents` ``. |
| `creators.readerWord` | C `components/blocks.tsx` `countWord(new Set(READ_TASKS.map(t => t.agent)).size)` |
| `creators.build` | `drain(C tools.propose_profile({read: creatorsRead.value}, ctx()))`. 4 units, no opener. `title` = C `rosterTitle(BUILD_TASKS, "building your profile")`. |
| `creators.picks` | `const handle = PEOPLE[0].handle` (C `lib/mock/people.ts`; v1 calls it `DEMO`, which does not exist in the product code); `read = {...fullReadFor(handle, readIdFor(handle)), done: READ_TASKS.map(t=>t.key)}`; `offers = offersFor(profileFor(read))`; `picks = chatPicks(offers)` (C `lib/agent/types.ts`). `title` = C `lib/join.ts` `chatCampaignsTitle(chatCampaigns(offers, [], {}), countWord)`; `countWord` = C `countWord(picks.length)`. `paceBig` and `paceSmall` = C `components/figma.tsx` `paceOf(offer)`. `enterMs` comes from `drain(C tools.match_offers({profile}, ctx()))`, using **only** the first three chunks' `ms`, cumulative. Assert those chunks' notes equal `` `MoonMatch AI · ${picks[i].brand}` ``. **Never store a match_offers note.** |
| `creators.match` | `levelWord` = C `MATCH_WORD.prequalified`. `reasons` = `Object.keys(MATCH_WEIGHTS)` in that order (keys only; the weights are never stored). Each `label` is `picks[0].match.signals[i].label` and each `lit` is `picks[0].match.signals[i].strong` (assert exactly 4 signals). Measured today: all four `strong`. |
| `creators.requests` | `offers.filter(o => o.state === "open" && wantsYou(o) && o.match.level !== "prequalified")`. `next` = `[0]` brand and commissionPct. `rest` = `length − 1`. |
| `creators.prequalifiedCap` | C `lib/agent/model.ts` `PREQUALIFIED_CAP` |
| `creators.terms` | `req = C tools.request_accept({offer: picks[0], cadence: "3pw"})`. `commits` = `` [`${bundleLine(req.deliverables)}, at ${CADENCES.find(c => c.key === req.cadence).label.toLowerCase()}.`] ``. `notCommits` = `req.notCommits.map(firstSentence)`, where `firstSentence` is copied from the v1 page: up to the first ". ". |
| `creators.check` | C `DRAFTS.find(d => d.id === "d-2")`: `product`, `brand`, `dueIn`. `checkCount` = `check.checks.length`. `misses` = the failing checks, `{label, fix: firstSentence(fix)}`. |
| `creators.shares` | C `lib/mock/brands.ts` `BRANDS.filter(b => !b.ended).map(b => b.perOrderPct)`, with min, max, length, and the counts per pct (ascending). |
| `creators.locks` | C `lib/store.ts` `DEFAULT_AUTONOMY.filter(r => r.locked && r.level === "never").map(r => r.label)` |
| `creators.platforms` | `["Instagram", "TikTok"]`. Assert it equals the set of `offers.flatMap(o => o.deliverables.map(d => d.platform))`. |
| `money(n)` | `{ value: n, text: B fmtUSD(n) }` |

**The "shown" substitutions:**

| Computed on | Shown | Where it comes in |
|---|---|---|
| `ounass.com` | `yourstore.com` | Field shown, opener, title bar, sr summary. Every product string is scrubbed. |
| `PEOPLE[0].handle` | `@yourhandle` | Opener, read sub, title bar |
| Three plan creators (real people) | `creatorCount` only | MockPlan draws three abstract discs (§5.8) |
| Creator read values (niche, voice, audience shares) | not bound at all | Rows show `note`, then `produces` |
| Match signal details and weights | not bound at all | Labels plus one lit/unlit glyph each (gate G5) |

**Assertions.** Each one throws, which fails `predev` and `prebuild`.

1. **Copy-bearing invariants** (each one guards a sentence that hardcodes a word or a rule):
   - The brands read is between 14,500 and 15,499 ms. This holds "fifteen seconds" in the H1 and A2 (the read rounds to 15 s). It does **not** hold "15.0s": the stamp is bound (`read.totalText`), and every acceptance line compares against the bound text. Today it is 15,022 ms, printed "15.0s".
   - The creators read is between 13,500 and 16,499 ms ("In about fifteen seconds": within a second of fifteen, so the stamp never prints above "16.5s"). Today 16,242 ms, "16.2s".
   - `AGENTS.length` is 7 ("Seven agents").
   - The creators read has 5 agents, and C `READ_TASKS.find(t => t.key === "niche").note` includes "last thirty posts" (A6: "Five agents read your last thirty posts").
   - `PREQUALIFIED_CAP` is 3, and there are 3 picks ("Up to three").
   - `plan.ladder.value.length` is 3 ("three phases" in `figureNote`, in `dialNote` "all three phases" and in run step 04; the P1 to P3 chips).
   - `PHASE1_ROAS` is 1, and `plan.budget.value === PHASE1_BUDGET` (B `lib/agent/tools.ts`; D4: a fixed warm-up guaranteed at 1x, "the same for every brand"). Never compare with a typed 1000.
   - Creators `request_accept` returns `needsApproval === false` (MockTerms prints "You're Pre-qualified. Pressing it joins you.").

   Bound figures such as $63,050 are **not** asserted: they flow from the product.
2. **Shares:**
   - the minimum is at least 10 and the maximum at most 16 (D4);
   - no pick and no `requests.next` is Ounass, Luna Beauty or FreshGrocer.
3. **Leak guard.** Run case-insensitively over `JSON.stringify(out)`. Throw on any of these:
   - every handle (with and without `@`) and every `name` in C `PEOPLE` and B `CREATORS`;
   - `\bounass\b`, `\bluna\b`, `freshgrocer`;
   - `/creators/`, `.jpg`, `.jpeg`, `.png`, `.mp4`, `heymoon.ai/`, `acc-o-`;
   - the discount-code shape `\b[A-Z]{3,}-[A-Z]{2,}\b` (case-sensitive);
   - any `@handle` other than `@yourhandle`;
   - the keys `"why"`, `"evidence"`, `"expected"`, `"crewCost"`, `"followers"`, `"viewThrough"`, `"avatar"`, `"image"`, `"brandLogo"`, `"bonus"`, `"code"`, `"trackingLink"`, `"orders"`, `"score"`, `"signals"`, `"detail"`;
   - in any string value: `—`, `–`, `×`, `!`;
   - in `JSON.stringify(out.creators)`: `/\$\s?\d/`.

   **Use whole handles and names, never fragments:** "Maison Dune" is a legitimate fictional brand.
4. **Determinism.** Build twice in-process and deep-equal the results.
5. **Field parity.** Compare `_site/lib/field.ts` with the product on about 20 samples:
   - `normaliseUrl` against B `lib/mock/reads.ts` `normaliseUrl`;
   - `usableHandle` against C `lib/handle.ts` `handleKey` and `displayHandle`, plus v1's two regexes, copied into the bind as the contract.

   Samples include `"https://www.Ounass.com/en-ae/x"`, `" yourstore.com "`, `"nodot"`, `""`, `"instagram.com/some.one/"`, `"https://www.tiktok.com/@some_one?lang=en"`, `"instagram.com"`, `"bad handle!"` and 31 a's.
6. **Format parity.** `_site/lib/format.ts` `formatUSD(n) === fmtUSD(n)` for 0, 1, 999, 1000, 1050, 12500, 63050 and 1234567.
7. **Write only if changed.** Canonical key order, 2-space JSON. `--check` exits 1 if the file is stale. Print one line: `demo.json ok · brands read 15.0s · creators read 16.2s · <hash7>`.

**npm scripts (WP0):**

```json
"bind": "node scripts/bind-demo.cjs",
"predev": "npm run bind",
"prebuild": "npm run bind",
"measure": "node scripts/measure.cjs",
"check:site": "node scripts/check-site.cjs"
```

Pin `"motion": "12.43.0"` and `"lenis": "1.3.26"` exactly. Commit `demo.json`, so data changes show up in diffs.

---

## 4. File plan and work packages

### 4.1 Tree and ownership

**WP0 (Foundation)** is built first and alone. Then **WP1 to WP8** run in parallel. **WP-F** (Integration and QA) comes last.

**No file has two owners.** Importing another package's file is fine: until it lands, you get WP0's stub.

**Root files (WP0):**

| Path | Contents |
|---|---|
| `package.json` | Scripts in §3.2. Pin motion 12.43.0 and lenis 1.3.26. |
| `next.config.mjs` | Add `distDir: process.env.NEXT_DIST_DIR ?? ".next"`. Keep the `/` redirect. |
| `.eslintrc.json` | The site override in §4.4. |
| `.gitignore` | Add `/.next-measure*/` and `.next-measure.lock`. |
| `tailwind.site.config.ts` | §2.1 |
| `scripts/bind-demo.cjs` and `scripts/bind-demo.ts` | §3.2 |
| `scripts/measure.cjs` | §7.3 |
| `scripts/check-site.cjs` | §7.2: HTML checks against the running dev server |
| `app/icon.tsx` (new) and `app/favicon.ico` (**deleted**) | The site icon. Today `app/favicon.ico` is Next's default Vercel triangle (25,931 bytes): a third-party mark that reads as a play glyph. `icon.tsx` returns a 32×32 `ImageResponse` (`next/og`, statically generated) of the four-point star (`ui/Star.tsx`'s path) in white on a #010317 disc. No SVG rasteriser is installed, which is why it is generated rather than committed as a binary. It sits at the app root, so v1 and the product get it too, replacing the same default. |

**`app/(site)/` (route files):**

| Path | Owner | Contents |
|---|---|---|
| `layout.tsx` | WP0 | html, body, fonts, globals, `<Providers>` |
| `globals.css` | WP0 | §2.3 |
| `brands/page.tsx` | WP0 | Final: static, with metadata |
| `creators/page.tsx` | WP0 | Final: static, with metadata |
| `lab/_frame.tsx` | WP0 | LabFrame: a dev harness with an audience switch, rm and pause toolbar |
| `lab/shell/page.tsx` | WP0 | |
| `lab/hero/page.tsx` | WP1 | Every lab page calls `notFound()` in production. WP-F deletes `lab/`. |
| `lab/window/page.tsx` | WP2 | |
| `lab/run/page.tsx` | WP3 | |
| `lab/number/page.tsx` | WP4 | |
| `lab/agents/page.tsx` | WP5 | |
| `lab/close/page.tsx` | WP6 | |
| `lab/promo/page.tsx` | WP7 | |
| `lab/mocks/page.tsx` | WP8 | Every mock, both audiences, both states |

**`app/(site)/_site/` (WP0):**

| Path | Contents |
|---|---|
| `tokens.ts`, `copy.ts`, `contracts.ts` | §2.2, §6, §4.3 |
| `Landing.tsx` | v0 by WP0. Final edits by WP-F. |
| `fonts/GeistMono-Variable.woff2` | Copied from `node_modules/geist/dist/fonts/geist-mono/` |
| `data/types.ts`, `data/demo.json`, `data/demo.ts` | §3 |
| `data/view.ts` | DEMO to mock props: the only binding layer (§4.3) |

**`_site/lib/` (WP0):**

| File | Exports |
|---|---|
| `providers.tsx` | Providers |
| `audience.tsx` | AudienceProvider, useAudience, useDeferredAudience, useWorld, Swap, useAudienceLink, PATHS, other |
| `lift.tsx` | LiftProvider, useHeroExit, useLiftRefs, useUncovered |
| `signals.ts` | Cross-package UI state (an external store): INITIAL, useSignal, getSignal, setSignal, els |
| `prefs.ts` | useReducedMotionPref, useForcedReducedMotion, usePageVisible, useMediaQuery, useIsPhone, useIsShort, useFinePointer, useDir |
| `playback.tsx` | PlaybackProvider, usePlayback, useActive |
| `timeline.ts` | useTimeline |
| `ticker.ts` | The shared glyph clock |
| `field.ts` | normaliseUrl, usableUrl, handleKey, displayHandle, usableHandle |
| `format.ts` | formatUSD, seconds |
| `scroll.ts` | setLenis, getLenis, yFor, scrollToY, toField, scrollToSlot, captureAnchor, anchorOf, restoreAnchor |
| `session.ts` | readSession, writeSession (try/catch) |
| `iso.ts` | useIsoLayoutEffect |
| `inert.d.ts` | React 18 `inert` augmentation |

**`_site/ui/` (WP0):**

| File | Exports |
|---|---|
| `Moon.tsx` | Moon, MoonRing, MOON_BITMAPS |
| `Star.tsx` | Star, STAR_PATH: the four-point AI-core star (RESEARCH C4). The only copy; WP2, WP5 and `app/icon.tsx` import it. |
| `Wordmark.tsx` | Wordmark |
| `WordReveal.tsx` | WordReveal |
| `Reveal.tsx` | Reveal |
| `CountUp.tsx` | CountUp |
| `Section.tsx` | Section |
| `SrStatus.tsx` | SrStatus |
| `icons.ts` | Deep Phosphor re-exports |

**`_site/shell/` (WP0):**

| File | Exports |
|---|---|
| `Nav.tsx` | Nav |
| `AudienceSwitch.tsx` | AudienceSwitch |
| `Field.tsx` | Field |
| `Horizon.tsx` | Horizon (forwardRef) |
| `Lift.tsx` | LiftTrack, Sheet (both read `LiftProvider` from `lib/lift.tsx`) |
| `PauseToggle.tsx` | PauseToggle |
| `SkipLink.tsx` | SkipLink |

**`_site/` folders (WP1 to WP8):**

| Folder | Owner | Files |
|---|---|---|
| `hero/` | WP1 | `Hero.tsx`, `Headline.tsx`, `Chips.tsx`, `Toasts.tsx`, `hero.module.css` |
| `sky/` | WP1 | `Sky.tsx`, and the lazy chunk: `gl.ts`, `shader.ts`, `watchdog.ts` |
| `window/` | WP2 | `WorkSection.tsx`, `WorkingWindow.tsx`, `ChainList.tsx`, `ChainRow.tsx`, `Stopwatch.tsx`, `Artefact.tsx`, `ActRail.tsx`, `useRun.ts`, `window.module.css` |
| `run/` | WP3 | `RunStage.tsx`, `RunStep.tsx`, `run.module.css` |
| `number/` | WP4 | `NumberSection.tsx`, `Divider.tsx`, `Guarantee.tsx`, `Roas.tsx`, `Paid.tsx`, `Share.tsx`, `number.module.css` |
| `agents/` | WP5 | `AgentsBand.tsx`, `Orbit.tsx`, `Readout.tsx`, `Locks.tsx`, `orbit.module.css` |
| `close/` | WP6 | `Connects.tsx`, `Close.tsx`, `Footer.tsx`, `GiantWordmark.tsx`, `close.module.css` |
| `promo/` | WP7 | `Promo.tsx`, `Launcher.tsx`, `PromoCard.tsx`, `promo.module.css` |
| `mocks/` | WP8 | `MockField.tsx`, `MockPlan.tsx`, `MockPhases.tsx`, `MockPay.tsx`, `MockCurve.tsx`, `Curve.tsx`, `RoasDial.tsx`, `MockRead.tsx`, `MockWhy.tsx`, `MockPicks.tsx`, `MockTiers.tsx`, `MockTerms.tsx`, `MockCheck.tsx`, `ShareScale.tsx`, `PayoutRail.tsx`, `ProductTile.tsx`, `Discs.tsx`, `mocks.module.css` |

**Import rules (lint-enforced, §4.4):**

1. Site files never import from `app/(brands)`, `app/(creators)` or `app/_shared`.
2. Site files never import `framer-motion`, the full `motion` component, the Phosphor barrel, gsap, three or ogl.
3. Mocks never import `DEMO`.
4. Only `data/view.ts` and section components read `DEMO`.

### 4.2 Work packages

| WP | Scope (owns) | Depends on | Done when |
|---|---|---|---|
| **WP0 Foundation** (alone, first) | Everything marked WP0 in §4.1, plus a **stub for every WP1 to WP8 file** with the final export name and props. Each stub renders `<div data-stub="Name">` at the real size. The hero stub uses the real switch, a static h1, the real Field and Horizon. | none | 1. `npm run bind` writes demo.json and every assertion passes. 2. `npx tsc --noEmit -p .` and `next lint` are clean. 3. `/brands` and `/creators` render: nav, the hero stub with the real switch, field and horizon, and stub boxes for every section. 4. The switch flips audience with no reload (the URL changes, the title changes, and it survives a Fast Refresh). 5. The field validates and submits. 6. `npm run measure` passes. 7. `npm run check:site` passes. 8. The HTML carries the `/icon` link, and `app/favicon.ico` is gone. 9. With `?sky=css`, a switch cross-fades the horizon tint (the H2 fix: ignition and tint on separate layers). 10. **The lead restarts the dev server once.** |
| **WP1 Hero + Sky** | `hero/*`, `sky/*`, `lab/hero` | WP0 | §5.1 acceptance |
| **WP2 Working window** | `window/*`, `lab/window` | WP0 (incl. `ui/Star.tsx`); WP8 MockPlan, MockPhases, MockWhy, MockTiers, Discs | §5.2 acceptance |
| **WP3 Run stage** | `run/*`, `lab/run` | WP0; WP8 MockField, MockPlan, MockPay, MockCurve, MockRead, MockPicks, MockTerms, MockCheck | §5.3 acceptance |
| **WP4 Number** | `number/*`, `lab/number` | WP0; WP8 Curve, RoasDial, ShareScale, PayoutRail | §5.4 acceptance |
| **WP5 Agents orbit** | `agents/*`, `lab/agents` | WP0 (incl. `ui/Star.tsx`) | §5.5 acceptance |
| **WP6 Connects, Close, Footer** | `close/*`, `lab/close` | WP0 (Field, AudienceSwitch, Horizon, `useAudienceLink`) | §5.6 acceptance |
| **WP7 Promo** | `promo/*`, `lab/promo` | WP0; WP2 `WorkingWindow variant="compact"` | §5.7 acceptance |
| **WP8 Mocks library** | `mocks/*`, `lab/mocks` | WP0 | §5.8 acceptance. Land them in this order: window mocks, then run mocks, then number mocks. |
| **WP-F Integration and QA** | `Landing.tsx` final, cross-package fixes (owners first), deleting `lab/`, §7.4 | all, plus Q1 answered | Every box in §7.4 is ticked. Q1 is answered and `copy.ts` matches the answer. Gates G1 to G10 are listed as signed or blocking in the release note. |

### 4.3 Shared contracts (WP0 writes these exactly; changes only through the lead)

**`contracts.ts`:**

```ts
import type { ReactNode } from "react";
import type { MotionStyle } from "motion/react";
import type { Audience, CampaignPick, Platform } from "./data/types";

export type Slot = "hero" | "work" | "run" | "number" | "agents" | "connects" | "close";
export type Surface = "night" | "paper" | "deep";
export type SwitchPlacement = "hero" | "nav" | "close";
export type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** Below the fold, `audience` is ALWAYS the deferred value passed down by <Swap>. */
export interface SectionProps { audience: Audience }

/* ── WP0 shell and ui ── */
export interface AudienceSwitchProps { placement: SwitchPlacement; surface: "night" | "paper"; hidden?: boolean }
export interface FieldProps { id: string; placement: "hero" | "close" }          // reads the URGENT audience
export interface HorizonProps { variant: "hero" | "close"; ignite?: boolean; style?: MotionStyle; className?: string }
export interface MoonProps { phase?: Phase; working?: boolean; size?: number; className?: string }
export interface StarProps { size?: number; className?: string }                   // ui/Star.tsx, fill currentColor
export interface WordRevealProps { as?: "h2" | "h3" | "p"; text: string; className?: string; id?: string }
export interface CountUpProps { to: number; format: "usd" | "int"; className?: string }
export interface SectionShellProps { slot: Slot; surface: Surface; audience: Audience; cv?: boolean; className?: string; labelledBy?: string; children: ReactNode }

/* ── WP1 ── */
export interface HeroProps {}                         // urgent audience from context

/* ── WP2 ── */
export interface RunProgress { act: 0 | 1 | 2; actProgress: number; overall: number; done: boolean }
export interface WorkSectionProps extends SectionProps {}
export interface WorkingWindowProps {
  audience: Audience;
  variant: "page" | "compact";
  playing: boolean;                                   // the caller gates: in view, visible, not paused, not hovered
  loop?: boolean;                                     // compact loops with RUN.compactGapMs; page plays once
  seek?: { act: 0 | 1 | 2; nonce: number } | null;    // jump to an act; earlier acts complete instantly
  restartNonce?: number;                              // "Run it again"
  onProgress?: (p: RunProgress) => void;              // throttled to act changes and 10% steps
}

/* ── WP3 to WP6 ── */
export interface RunStageProps extends SectionProps {}
export interface NumberSectionProps extends SectionProps {}
export interface AgentsBandProps extends SectionProps {}
export interface ConnectsProps extends SectionProps {}
export interface CloseProps {}                        // urgent audience: the close is the fork
export interface FooterProps {}

/* ── WP7 ── */
export interface PromoProps {}                        // urgent audience: the card follows the switch

/* ── WP8 mocks: props only, aria-hidden root, may import copy.ts LABELS, never DEMO ── */
export interface MockFieldProps { kind: "url" | "handle"; value: string; platforms?: Platform[] }
export interface MockPlanProps {
  phaseLabel: string; pay: string; markets: string[]; creatorCount: number;
  reveal?: { header: boolean; pay: boolean; markets: boolean; creators: boolean };  // default: all true
  checks?: string[];                                  // check lines under the card (window only)
}
export interface MockPhasesProps { rungs: { phaseNo: number; budget: string; width: number }[]; grown: boolean }
export interface MockPayProps { total: string; vat: string; budget: string; last4: string }
export interface MockCurveProps { rungs: { phaseNo: number; multiple: number; multipleText: string }[]; label: string; drawn: boolean }
export interface CurveProps { drawn: boolean; className?: string }
export interface RoasDialProps { value: number; min: number; max: number; label: string; note: string; drawn: boolean }
export interface MockReadProps { title: string; sub: string; count: string; rows: { agent: string; produces: string }[] } // view passes sub ?? ""
export interface MockWhyProps { levelWord: string; reasons: { label: string; lit: boolean }[]; filled: number } // rows shown, 0 to 4
export interface MockPicksProps { title: string; picks: CampaignPick[]; shown: number; layout: "cards" | "rows" }
export interface MockTiersProps { picks: CampaignPick[]; shown: number; next: { brand: string; sharePct: number } | null; restLine: string; showFoot: boolean }
export interface MockTermsProps { brand: string; needsApproval: boolean; sharePct: number; commits: string[]; notCommits: string[] }
export interface MockCheckProps { product: string; brand: string; dueIn: string; misses: { label: string; fix: string }[]; shown: number }
export interface ShareScaleProps { figure: string; counts: { pct: number; count: number }[]; min: number; max: number; label: string; note: string; spoken: string; lit: boolean }
export interface PayoutRailProps { steps: string[]; lit: number }                 // glyphs lit, 0 to 4
export interface DiscsProps { count: number; size?: number }
export interface ProductTileProps { product: string; brand?: string; className?: string }
```

**`data/view.ts`** binds DEMO to mock props. Sections call these; nothing else reads DEMO for mocks.

```ts
export const view = {
  plan: () => ({ phaseLabel, pay: pay.text, markets, creatorCount }),           // MockPlan
  phases: () => ladder.map(r => ({ phaseNo: r.phaseNo, budget: r.budget.text, width: r.width })),
  pay: () => ({ total, vat, budget, last4 }),                                       // texts
  curve: () => ladder.map(r => ({ phaseNo, multiple, multipleText })),
  dial: () => ({ value: guarantee.roas, min: roasScale.min, max: roasScale.max }),
  read: () => ({ title: LABELS.creators.readingProfile, sub: creators.read.sub ?? "", count: `9/9`, rows: units.map(u => ({ agent, produces })) }),
  why: () => ({ levelWord, reasons: reasons.map(r => ({ label: r.label, lit: r.lit })) }),
  picks: () => ({ title: picks.title, picks: picks.items }),
  tiers: () => ({ picks, next: requests.next, restLine: LABELS.creators.tiersRest(requests.rest) }),
  terms: () => ({ ...creators.terms }),
  check: () => ({ ...creators.check }),
  share: () => ({ figure: COPY.creators.number.shareFigure(min, max), counts, min, max, label, note, spoken }), // note and spoken switch together on G3
  payout: () => ({ steps: COPY.creators.number.rail }),
};
```

The `count` in `view.read()` is `` `${units.length}/${sizes.at(-1).total}` `` (bound), not typed.

**`lib/audience.tsx`:**

```ts
export const PATHS = { brands: "/brands", creators: "/creators" } as const;
export const other = (a: Audience): Audience => (a === "brands" ? "creators" : "brands");
export type SwitchSource = "hero" | "nav" | "close";
export interface AudienceState { audience: Audience; switches: number; source: SwitchSource | null }
export interface WorldApi {                          // stable identity: never causes a render
  select(next: Audience, from: SwitchSource): void;
  world: MotionValue<number>;                        // 0 brands → 1 creators
  dir: MotionValue<number>;                          // +1 if the last switch went to creators, -1 to brands
  focus: MotionValue<number>;                        // 0..1 field-focus lean (600 ms --ease-out)
  dawn: MotionValue<number>;                         // 0..1 (S8)
  startDawn(): Promise<void>;                        // sets data-dawn on the Landing root; 450 ms (0 when reduced)
  resetDawn(): void;
}
export function AudienceProvider(p: { initial: Audience; children: ReactNode }): JSX.Element;
export function useAudience(): AudienceState;        // URGENT
export function useDeferredAudience(): Audience;     // useDeferredValue(audience)
export function useWorld(): WorldApi;
export function Swap(p: { children: (a: Audience) => ReactNode }): JSX.Element;
/** Props for a plain <a> to an audience route (rule 2.4.11). A plain click: preventDefault, then select(to, source),
    or a Lenis scroll to the top when `to` is already the audience. Modified and middle clicks keep the browser default. */
export function useAudienceLink(to: Audience, source: SwitchSource): { href: string; onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void };
```

`select(next, from)` does these, in order:

1. Return if `next` is already current.
2. `const anchor = from === "close" ? anchorOf("close") : from === "nav" ? captureAnchor() : null`.
3. Urgent `setState` (`switches + 1`, `source`).
4. `animate(world, next === "creators" ? 1 : 0, reduced ? {duration: .2} : {duration: 1.2, ease: EASE.inOut})`. Set `dir` to ±1.
5. `history.replaceState(null, "", PATHS[next] + location.search + location.hash)`. It must be `null` so Next 14.2's patched `replaceState` re-syncs its router.
6. Set `document.title = COPY[next].meta.title`, and set `SrStatus` to `COPY.shared.announce[next]`.
7. `Swap` restores `anchor` in a layout effect after the deferred commit, then re-checks one frame later, then bumps `setSignal("swapCommit", n + 1)` so the Nav re-observes the new `[data-surface]` nodes.

Never read the audience from `usePathname()`. Never call `router.refresh()`. Never link to `/brands` or `/creators` with `next/link` (rule 2.4.11).

**`lib/signals.ts`** is an external store (`useSyncExternalStore`), so publishers never re-render subscribers they don't touch:

```ts
export interface SignalState {
  heroSwitchVisible: boolean;    // writer: AudienceSwitch placement="hero" (IO visible AND useUncovered)
  heroFieldVisible: boolean;     // writer: Field placement="hero" (IO, rootMargin "-64px 0px 0px 0px", AND useUncovered)
  closeFieldVisible: boolean;    // writer: Field placement="close" (IO)
  fieldFocus: "hero" | "close" | null;  // writer: Field. Focus sets its placement; blur clears it only if it still holds it.
  heroFieldHasText: boolean;     // writer: Field placement="hero"
  closeFieldHasText: boolean;    // writer: Field placement="close"
  keyboardOpen: boolean;         // writer: Providers (visualViewport.height < .75 * innerHeight)
  surface: "night" | "paper";    // writer: Nav
  swapCommit: number;            // writer: Swap, after each deferred commit. Reader: Nav (re-observe surfaces)
  work: { state: "idle" | "playing" | "paused" | "done"; overall: number; passed: boolean };  // writer: WP2
  promoOpen: boolean;            // writer: WP7; also cleared by toField()
}
/** The server snapshot and the first client render. Matches what the SSR HTML shows at scrollY 0:
    the hero switch and field visible, so the nav's compact switch and Start render hidden. */
export const INITIAL: SignalState = {
  heroSwitchVisible: true, heroFieldVisible: true, closeFieldVisible: false,
  fieldFocus: null, heroFieldHasText: false, closeFieldHasText: false, keyboardOpen: false,
  surface: "night", swapCommit: 0, work: { state: "idle", overall: 0, passed: false }, promoOpen: false,
};
export function useSignal<K extends keyof SignalState>(k: K): SignalState[K];
export function getSignal<K extends keyof SignalState>(k: K): SignalState[K];
export function setSignal<K extends keyof SignalState>(k: K, v: SignalState[K]): void;
export const els: { heroField: HTMLElement | null; closeField: HTMLElement | null; heroInput: HTMLInputElement | null; closeInput: HTMLInputElement | null };
```

Store rules (React 18 throws during SSR without a server snapshot, and the root then falls back to client rendering, which would lose the server-rendered H1):

- `useSignal(k)` is `useSyncExternalStore(subscribe(k), () => state[k], () => INITIAL[k])`.
- `setSignal` replaces the state object (`state = { ...state, [k]: v }`) and notifies the key's listeners only when `!Object.is(state[k], v)`.
- `getSnapshot` returns the stored reference. It never builds a fresh object (a new `work` object per read loops React). WP2 writes `work` only when one of its fields changed.

**`lib/prefs.ts`** (all use `useSyncExternalStore`):

| Hook | Server value | Notes |
|---|---|---|
| `useReducedMotionPref()` | `true` | Updates live. `?rm=1` forces `true`, in lab pages only (read from `location.search` in an effect). |
| `usePageVisible()` | `true` | |
| `useMediaQuery(q, server = false)` | `false` | Never decides above-the-fold layout (rule 2.4.10). |
| `useIsPhone()` | `false` | `MQ.phone` |
| `useIsShort()` | `false` | `MQ.short` |
| `useFinePointer()` | `false` | |
| `useDir()` | `1` | `1` or `-1` |

Because the server snapshot is "reduced", SSR, no-JS and the first client render all show the static state.

**`lib/playback.tsx`:**

```ts
export function usePlayback(): { paused: boolean; toggle(): void };       // session key "hm.site.paused"
// paused comes from useSyncExternalStore with a server snapshot of false. sessionStorage is read only on the
// client snapshot, never during render, so aria-pressed never mismatches on hydration.
export function useActive(ref: RefObject<Element>, o?: { enter?: number; leave?: number }): boolean;
// true while: IO ratio ≥ enter (default .2, hysteresis to leave = .05), page visible, not paused, not reduced
```

**`lib/lift.tsx`** (the sheet and the hero share one scroll source, so it lives above both):

```ts
export function LiftProvider(p: { children: ReactNode }): JSX.Element;
// Owns sentinelRef and sheetRef, and heroExit = useScroll({ target: sentinelRef, offset: ["start start", "end start"] }).scrollYProgress.
// motion's useScroll waits for a pending ref (isRefPending in use-scroll.mjs), so LiftTrack may attach it after the provider renders.
export function useHeroExit(): MotionValue<number>;  // 0 to 1 as the sheet rises over the hero; ViewTimeline-accelerated
export function useLiftRefs(): { sentinelRef: RefObject<HTMLDivElement>; sheetRef: RefObject<HTMLDivElement> };
export function useUncovered(ref: RefObject<Element>): boolean;
// true while any part of the element is above the sheet's top edge (rect.top < sheetRect.top).
// Both rects are read in frame.read on every Lenis scroll event and on resize; state changes only on a crossing.
```

**`lib/timeline.ts`** is the one clock for the window, the toasts and the orbit:

```ts
export interface TimelineOpts { endMs: number; marks: number[]; playing: boolean; loopGapMs?: number }
export interface Timeline {
  t: MotionValue<number>;        // elapsed ACTIVE ms; write text from it via useMotionValueEvent, never via state
  mark: number;                  // index of the last mark ≤ t (React state; changes only on crossings)
  done: boolean;
  seek(ms: number): void; restart(): void;
}
export function useTimeline(o: TimelineOpts): Timeline;
```

- It advances with `frame.update` by `frameData.delta`, which is clamped to 40ms, so a resume never jumps.
- Under reduced motion it starts at `endMs` with `done = true`.

**`lib/ticker.ts`:** `subscribeGlyph(cb: (step: number) => void): () => void`. It runs one `frame.update` loop that steps every `GLYPH.stepMs`, and only while it has subscribers, the page is visible, and playback is not paused.

**`lib/field.ts`:**

| Export | Behaviour |
|---|---|
| `normaliseUrl(raw)` | trim, lowercase, strip `https?://` and `www.`, drop the path |
| `usableUrl(raw)` | `normaliseUrl`, then require a `.`; else `null` |
| `handleKey(raw)` | Copy of C `lib/handle.ts` |
| `displayHandle(raw)` | Copy of C `lib/handle.ts` |
| `usableHandle(raw)` | Copy `HANDLE`, `BARE_SITE` and `usableHandle` verbatim from `app/(creators)/creators/v1/page.tsx` lines 402 to 408 (`HANDLE.test(key) && !BARE_SITE.test(key) ? displayHandle(raw) : null`, with `key = handleKey(raw)`). The regexes are not reprinted here because a table cell cannot hold their pipe. Parity-tested by the bind. |

**`lib/scroll.ts`:**

```ts
export function setLenis(l: Lenis | null): void; export function getLenis(): Lenis | null;
/** Absolute document y that puts `el`'s top at `desiredTop` px from the viewport top. */
export function yFor(el: Element, desiredTop: number): number;   // window.scrollY + rect.top - desiredTop
export function scrollToY(y: number, o?: { immediate?: boolean; duration?: number; onComplete?: () => void }): void;
export function toField(prefer?: "nearest" | "hero" | "close"): void;
export function scrollToSlot(slot: Slot, o?: { immediate?: boolean }): void;
export interface Anchor { slot: Slot; top: number }
export function captureAnchor(): Anchor | null;      // the [data-slot] under the nav centre line
export function anchorOf(slot: Slot): Anchor;
export function restoreAnchor(a: Anchor): void;      // lenis.resize(), then an immediate scroll so a.slot's top returns to a.top; re-checks next frame
```

**Every helper passes Lenis a number, never an element or a selector.** For element targets, Lenis 1.3.26 subtracts the root's `scroll-padding-top` (96px in globals.css) and the target's `scroll-margin-top` itself (`lenis.mjs` around line 783), which would double any offset computed here. `scroll-padding-top` stays in globals.css for native no-JS anchor jumps only.

- `restoreAnchor` calls `lenis.resize()` first. Lenis debounces its dimensions by 250ms and clamps `scrollTo` to its stale `limit`, so a restore right after Swap changes the page height would stop short.
- Lenis runs with `anchors: false` (§5.0.1): its anchor handler does not `preventDefault`, so a hash link would jump natively and then animate back. The SkipLink handles its own click (§5.0.8).

`toField(prefer = "nearest")` does these, in order:

1. `setSignal("promoOpen", false)`.
2. Pick the field whose rect centre is nearest the viewport centre. A tie goes to the hero.
3. Hero: `scrollToY(0)`. Close: `scrollToY(window.scrollY + rect.top + rect.height / 2 - innerHeight * (phone ? .30 : .5))`. Both use `{duration: 1.2, easing: easeInOut, lock: true, immediate: reduced, onComplete: () => input.focus({preventScroll: true})}`.

### 4.4 Parallel-safety rules

1. **Stubs first.** WP0 ships every file in §4.1 with its final export name and props. Builders replace stub bodies only. A builder never edits another package's folder or any WP0 file. When something must change, message the lead.
2. **No new Tailwind keys.** Only the lead restarts the dev server (memory: *tailwind-token-needs-dev-restart*).
3. **Develop in `/lab/<wp>`, not `/brands`.** Dev compiles per route, so a syntax error in another package does not break your lab page.
4. **One dev server, on :3004, owned by the lead.** Never run `next build` into `.next`: it corrupts the running dev server (memory: *next-build-kills-dev-server*). Use `npm run measure`, which uses its own distDir and a lockfile.
5. **ESLint.** WP0 adds this override:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "overrides": [{
    "files": ["app/[(]site[)]/**/*.{ts,tsx}"],
    "rules": {
      "no-restricted-imports": ["error", {
        "paths": [
          { "name": "motion/react", "importNames": ["motion"], "message": "Use m from motion/react-m (LazyMotion strict)." },
          { "name": "framer-motion", "message": "Import from motion/react or motion/react-m." },
          { "name": "@phosphor-icons/react", "message": "Import from _site/ui/icons.ts (deep imports)." },
          { "name": "lenis/dist/lenis.css", "message": "Rules live in globals.css." },
          { "name": "next/link", "message": "Plain <a> only. After a switch, next/link desyncs the URL and the audience (rule 2.4.11). Every other route the site links to is in another root layout, so it is a full load anyway." }
        ],
        "patterns": [
          { "group": ["**/(brands)/**", "**/(creators)/**", "@/app/(brands)/**", "@/app/(creators)/**", "@/app/_shared/**", "**/_shared/**"],
            "message": "The site never imports product code (decisions 2 and 4)." },
          { "group": ["gsap", "gsap/*", "three", "three/*", "ogl", "@react-three/*"], "message": "Not in the stack (decision 5)." }
        ]
      }]
    }
  }]
}
```

**`ui/icons.ts`** re-exports the icons used, by deep path. For example: `export { Globe } from "@phosphor-icons/react/dist/csr/Globe";`.

The full set (all verified to exist in 2.1.10): Globe, At, Check, Lock, Pause, Play, X, InstagramLogo, TiktokLogo, Storefront, UserFocus, UsersThree, Handshake, ShieldCheck, PenNib, Megaphone, ChartLineUp, Brain.

### 4.5 `Landing.tsx` v0 (WP0; WP-F owns the final)

```tsx
"use client";
export function Landing({ initial }: { initial: Audience }) {
  return (
    <AudienceProvider initial={initial}>
      <PlaybackProvider>
        <LandingRoot /* div.landing-root; data-dawn set by startDawn(); relative; isolate */>
          <SkipLink />
          <Nav />
          <main id="main" tabIndex={-1}>
            <LiftProvider /* owns heroExit: LiftTrack AND Sheet must both be inside it */>
              <LiftTrack>
                <Hero />
              </LiftTrack>
              <Sheet>
                <Swap>{(a) => (
                  <>
                    <Suspense fallback={null}><WorkSection audience={a} /></Suspense>
                    <Suspense fallback={null}><RunStage audience={a} /></Suspense>
                    <Suspense fallback={null}><NumberSection audience={a} /></Suspense>
                    <Suspense fallback={null}><AgentsBand audience={a} /></Suspense>
                    <Suspense fallback={null}><Connects audience={a} /></Suspense>
                  </>
                )}</Swap>
              </Sheet>
            </LiftProvider>
            <Close />
          </main>
          <Footer /* dawn-fade */ />
          <Promo />
          <SrStatus />
        </LandingRoot>
      </PlaybackProvider>
    </AudienceProvider>
  );
}
```

**`app/(site)/brands/page.tsx`** (final; creators is the mirror):

```tsx
import type { Metadata } from "next";
import { Landing } from "../_site/Landing";
import { COPY } from "../_site/copy";
export const dynamic = "error";
export const metadata: Metadata = { title: COPY.brands.meta.title, description: COPY.brands.meta.description };
export default function Page() { return <Landing initial="brands" />; }
```

**`app/(site)/layout.tsx`** (final):

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import { Providers } from "./_site/lib/providers";
import { COPY } from "./_site/copy";
import "./globals.css";

const mono = localFont({
  src: "./_site/fonts/GeistMono-Variable.woff2", variable: "--font-geist-mono", weight: "100 900",
  preload: false, display: "swap", adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
export const metadata: Metadata = { title: "HeyMoon.AI", description: COPY.shared.metaDescription };
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${GeistSans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
```

---

## 5. Component specs

Every acceptance criterion can be checked in a browser at 1440x900 and at 390x844 (the DevTools device toolbar), unless it says otherwise.

**Techniques (names from RESEARCH 3.3) and where each is used:**

| Technique | Used in | Kind |
|---|---|---|
| Line rise | Hero H1 at load (§5.1.2) | triggered, CSS |
| Odometer morph | Hero H1 and close H2 on switch (§5.1.2, §5.6) | triggered, CSS |
| Pill | AudienceSwitch, ×3 (§5.0.3) | triggered, motion spring |
| World tint | Sky canvas and CSS horizon (§5.0.6, §5.1.6) | triggered, MotionValue |
| Sheet lift | Lift.tsx plus hero bindings (§5.0.7, §5.1.5) | scroll-linked, accelerated |
| Word blur-in | Section H2s and switch chips (§5.0.10) | enter, once |
| Agent chain | Working window rows (§5.2.3) | in view, real pacing |
| Outcome toast | Hero toasts (§5.1.4) | timed loop, paused offscreen |
| Sticky stage | Run (§5.3) | scroll-linked |
| Count-up | $63,050 (§5.4) | enter, once, critically damped |
| Draw | Curve, MockCurve, RoasDial (§5.4, §5.8) | enter or active |
| Beam | Orbit (§5.5) | in view |
| Gradient sweep | H1 line 2, once (§2.3) | load, once |
| Field beam (Border Beam) | **Removed.** A looping shimmer reads as cheap; the horizon leans in on focus instead (`focus`). | none |
| Manifesto scrub, card to bleed | **Not used.** There is no approved manifesto copy, and the sheet lift is the bleed moment. | none |

### 5.0 WP0 shell

#### 5.0.1 Providers (`lib/providers.tsx`)

```tsx
"use client";
import { ReactLenis, useLenis } from "lenis/react";
import type { LenisOptions } from "lenis";
import { LazyMotion, MotionConfig, domAnimation, frame, cancelFrame } from "motion/react";

const LENIS_OPTIONS = {                         // module constant: ReactLenis rebuilds when the JSON changes
  autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false,
  anchors: false,                               // its handler never preventDefaults, and element targets double-count scroll-padding (§4.3 scroll.ts)
  stopInertiaOnNavigate: true,                  // respectReducedMotion defaults to true
} satisfies LenisOptions;

function LenisFrameDriver() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    setLenis(lenis);
    const tick = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp);
    frame.update(tick, true);                     // one rAF for Lenis, motion, the sky and the clocks
    return () => { cancelFrame(tick); setLenis(null); };
  }, [lenis]);
  return null;
}
export function Providers({ children }: { children: React.ReactNode }) {
  // Lab pages only: ?rm=1 forces the JS side of reduced motion. Read in an effect, never via
  // useSearchParams (that would de-opt the static routes). CSS media queries cannot be forced this way:
  // use DevTools > Rendering > prefers-reduced-motion for a full check (§7.2).
  const forced = useForcedReducedMotion();      // false on the server and on every non-lab path
  return (
    <MotionConfig reducedMotion={forced ? "always" : "user"}>
      <LazyMotion features={domAnimation} strict>
        <ReactLenis root options={LENIS_OPTIONS} />
        <LenisFrameDriver />
        <KeyboardWatcher />{/* visualViewport → setSignal("keyboardOpen") */}
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
```

Rules:

- Components use `import * as m from "motion/react-m"`, and hooks come from `"motion/react"`.
- Every `useLenis(cb)` callback must be stable.
- Imperative `animate(mv, …)` ignores `MotionConfig`, so pass the reduced transition yourself.

#### 5.0.2 Moon glyph (`ui/Moon.tsx`)

```ts
export const MOON_BITMAPS = [   // 5x5, corners removed (21 dots). # lit, o unlit, . empty
  [".ooo.", "ooooo", "ooooo", "ooooo", ".ooo."],   // 0 new
  [".oo#.", "oooo#", "oooo#", "oooo#", ".oo#."],   // 1 waxing crescent
  [".o##.", "ooo##", "ooo##", "ooo##", ".o##."],   // 2 first quarter
  [".###.", "o####", "o####", "o####", ".###."],   // 3 waxing gibbous
  [".###.", "#####", "#####", "#####", ".###."],   // 4 full
  [".###.", "####o", "####o", "####o", ".###."],   // 5 waning gibbous
  [".##o.", "##ooo", "##ooo", "##ooo", ".##o."],   // 6 last quarter
  [".#oo.", "#oooo", "#oooo", "#oooo", ".#oo."],   // 7 waning crescent
] as const;
```

**Rendering.** `<svg viewBox="0 0 5 5" width={size} height={size} class="moon" aria-hidden>` holds 21 `<circle cx={c+.5} cy={r+.5} r=".33" data-lit="0|1">`. The colour is `currentColor`, and unlit dots are drawn at `fill-opacity:.16`.

**Working.** It subscribes to `ticker.ts` and steps through phases 0 to 7 every 160ms, writing `data-lit` straight onto the circles through refs, with no React state. Under reduced motion, a working glyph is static at phase 2. While paused, it freezes on its current phase.

**`MoonRing`.** A 2px ring at the same size, drawn with the `.moon-ring` class. It marks a step "yours" (a human presses it).

**Uses:**

| Use | Phase |
|---|---|
| working | the cycle |
| done | 4 |
| waiting | 0 |
| progress | `round(4·done/total)` |
| divider | 0,1,2,3,4,5,6,7,0 (the only decorative crescents on the page; gate G7) |
| launcher | 4 |
| payout rail | 0,2,3,4 |
| run steps, act rail | by state: upcoming 0, active working, done 4 (stacked run: 4) |
| orbit nodes | 4 always; their state is brightness, never phase (ruling 35) |

**Acceptance:**

- `/lab/shell` shows the 8 phases at 15px, 24px and 11px.
- A working glyph cycles at 1.28s per loop.
- React DevTools shows no re-renders while it cycles.

#### 5.0.3 AudienceSwitch (`shell/AudienceSwitch.tsx`)

**Sizes:**

| Placement | Track | Thumb | Labels |
|---|---|---|---|
| hero, close | 300x48 (phone 280x44) | half width, flush | 15px |
| nav | 200x36 (phone 168x34) | half width, flush | 13px |

**Skins:**

| Part | Night | Paper |
|---|---|---|
| Track | `bg-white/5 shadow-track`, radius pill, **no backdrop-filter** | `bg-ink/5 shadow-track-paper` |
| Thumb | `bg-white shadow-thumb` | `bg-white shadow-thumb-paper` |
| Labels, active | #000211 | ink |
| Labels, inactive | `white/64`; hover `white/90` | `ink/60` |

Labels are Geist 500 at −0.01em, and their colours cross-fade over 250ms.

**Thumb motion.** `m.span` with `initial={false}` and `animate={{ x: audience === "brands" ? "0%" : \`${100 * dirSign}%\` }}`, using `SPRING.pill`. `dirSign` is −1 under RTL. Reduced motion makes the move instant (MotionConfig) while the labels still cross-fade.

**Semantics:**

```tsx
<div role="radiogroup" aria-label={COPY.shared.switchLabel} onKeyDown={onKey}>
  <a href="/brands" role="radio" aria-checked tabIndex={0|-1} onClick={…}>Brands</a>
  <a href="/creators" role="radio" …>Creators</a>
</div>
```

| Key or input | Result |
|---|---|
| ArrowRight / ArrowDown | next option (mirrored in RTL) |
| ArrowLeft / ArrowUp | previous option |
| Home / End | first / last option |
| Space | selects, with `preventDefault` |
| Enter | native click |
| Cmd, Ctrl or Shift click, or middle click | browser default (opens in a new tab) |
| Plain click | `preventDefault`, then `select(a, placement)` |
| No JS | the anchors navigate |

**Variants:**

- `placement="nav"` with `hidden` renders `inert=""` and `aria-hidden`, at opacity 0 and scale .96. Showing it is a 200ms transition.
- `placement="hero"` writes `heroSwitchVisible = IO says visible && useUncovered(ref)`. The hero is sticky, so IntersectionObserver alone keeps reporting "visible" while the sheet covers it.

**Focus.** The outline is drawn on the anchor, with radius pill.

**Acceptance:**

- One Tab stop. The arrows switch and move focus.
- The URL becomes `/creators` with no document request in the Network panel. It is still `/creators` after a Fast Refresh (save any file).
- `document.title` is "HeyMoon.AI for creators".
- Cmd-click opens `/creators` in a new tab.
- With JS disabled, a click loads `/creators`.

#### 5.0.4 Swap and scroll anchoring (`lib/audience.tsx`)

**Keying.** `Swap` renders `children(deferredAudience)` inside `<m.div key={deferred}>`.

| Switch | Animation |
|---|---|
| First render (`switches === 0`) | none |
| Later switches | opacity 0 to 1 and y 8 to 0, over 300ms `--ease-out` |
| Reduced motion | opacity only, 150ms |

There is no exit animation, so there is never double DOM.

**Anchoring.** In a layout effect keyed on the deferred value, if `select()` captured an anchor, call `restoreAnchor(anchor)`. `restoreAnchor` calls `lenis.resize()`, scrolls with `lenis.scrollTo(<number>, {immediate: true, force: true})`, then re-checks once on the next frame, because `content-visibility` estimates heights. Then it bumps `swapCommit`.

**Size hints.** A remounted `cv` section has no remembered size, so offscreen it would fall back to 900px, and scrolling up after a switch would let the browser's scroll anchoring fight Lenis. So `Section` keeps a module-level map of rendered heights keyed by `slot` and `audience`, filled by a ResizeObserver while the section renders. On mount it sets `style.containIntrinsicSize` to `auto <h>px`, using its own audience's height if known, else the other audience's height for the same slot, else 900px.

**Acceptance.** Switching from the nav while mid-number-section keeps the number section's top within ±4px of where it was. Scrolling back up to the top after that switch shows no jump (record with the Performance panel's screenshots).

#### 5.0.5 Nav (`shell/Nav.tsx`)

**Box.**

- `<header>`, fixed at `top: var(--nav-top)` and centred.
- Width `min(1120px, 100vw − 48px)` (phone `100vw − 24px`). Height `var(--nav-h)`.
- Radius pill, padding `0 8px 0 20px`.
- `z-nav motion-safe:animate-nav-in dawn-fade`.
- It carries `data-at-hero={heroSwitchVisible || closeSwitchVisible ? "true" : "false"}` (server: `"true"`, from `INITIAL`; the close switch joined in the final round, so the phone nav keeps Wordmark, Pause and Dashboard at the close instead of emptying). Every arrangement change below is a CSS selector on that attribute plus Tailwind breakpoints. **The nav never calls `useIsPhone()`** (rule 2.4.10): the server would render the desktop arrangement on phones and the nav would reflow above the fold.

**Skins** (they cross-fade `background-color` and `box-shadow` over 250ms):

| Skin | Fill | Effects | Wordmark | Dashboard | Start |
|---|---|---|---|---|---|
| night (night or deep under the nav) | `rgb(1 3 23 / .62)` | `shadow-glass`, **no backdrop-filter** | "HeyMoon" white, ".AI" #A78BFA | `h-10 px-4 rounded-pill bg-white/8 text-white/92 text-small font-medium` | `h-10 px-[18px] rounded-pill bg-white text-ink text-small font-semibold` |
| paper | `rgb(252 251 248 / .72)` | `backdrop-filter: blur(20px) saturate(180%)`, `shadow-glass-paper` | ink, ".AI" #4D2FB0 | ink pill, white text | ink pill, white text |

**Layout (desktop ≥768).**

- Left: the Wordmark, a plain `<a href={PATHS[audience]}>` (never `next/link`). A plain click calls `preventDefault()` and scrolls to the top with Lenis.
- Centre: `AudienceSwitch placement="nav"`, absolutely centred, `hidden={heroSwitchVisible || closeSwitchVisible}` (one switch on screen at a time; `closeSwitchVisible` is the close switch's own IO, up to the line where its tuck starts).
- Right, gap 8:
  - `PauseToggle`.
  - Dashboard, an `<a href>` to `COPY[audience].nav.dashboardHref`. While Start is shown, it is demoted to a text link (`white/72` or `ink/72`).
  - Start, a `<button>` calling `toField()`. Shown only when `!heroFieldVisible && !closeFieldVisible`. Hidden means `inert`, opacity 0 and scale .96, over 200ms.

**Below 768 (phone, and 640 to 767).** The box keeps its sizes from `--nav-top`/`--nav-h` (52px below 640, 56px from 640). The arrangement:

- At the hero (`data-at-hero="true"`): Wordmark, Pause, Dashboard.
- Once the hero switch has left (`"false"`): the compact switch (start-aligned, in place of the Wordmark), Pause, and Start when no field is visible. Dashboard is hidden with `max-md:` classes and lives in the footer.
- The compact switch is 168x34 below 640 and 200x36 from 640.

**Surface detection.**

- One IntersectionObserver watches all `[data-surface]`, with `rootMargin = -(navTop + navH/2)px 0px -(innerHeight − navTop − navH/2 − 1)px 0px`. Recompute it on resize.
- **Re-observe on every `swapCommit` change** (disconnect, query `[data-surface]` again, observe). Swap remounts every section below the fold, and the old nodes are gone.
- Among the intersecting elements, pick the deepest (one that contains no other intersecting surface). Break ties by later DOM order.
- `deep` maps to the night skin. Write the result to `setSignal("surface")`.

**Acceptance:**

- The skin flips within 250ms as the sheet's top crosses the nav's centre line.
- `getComputedStyle(nav).backdropFilter` is `"none"` on night.
- Start is absent while either field is visible (on screen and, for the hero field, not under the sheet), and appears once both are hidden. Pressing it scrolls to the nearest field and focuses its input.
- At 390 wide at the hero, only Wordmark, Pause and Dashboard are visible, in the SSR HTML too (CLS track empty on a phone reload).
- After a switch, the skin still flips correctly at the sheet and at the agents band.

#### 5.0.6 Horizon (`shell/Horizon.tsx`)

**Structure.** It is `forwardRef` to the `.hz` root, an `m.div` accepting `style`. It renders the layers in this DOM order:

1. `.hz-sky`
2. `.hz-halo`, holding two `m.div.hz-tint` with `data-tint="brands"` and `data-tint="creators"`
3. `.hz-sun`, holding the same two tints
4. `.hz-ground`
5. `.hz-earth`
6. `.hz-rim`, holding the same two tints
7. `.hz-hair`
8. `.hz-dawn`

The outer halo, sun and rim layers carry the CSS ignition (`opacity`, and `clip-path` on the rim). The inner tints carry the `world` opacity. The two never share an element: a CSS animation with fill `both` overrides an inline style on the same element, so a shared element would hold both tints at full opacity for good.

**Bindings:**

- The brands tints' opacity is `useTransform(world, [0,1], [1,0])`, and the creators tints' is `[0,1]`. The server value comes from `world`'s initial value. The outer and inner opacities multiply.
- `.hz-dawn` opacity is bound to `dawn`.
- `ignite` sets `data-ignite`, which plays the CSS ignition on the outer layers.
- The `--apex-pref` CSS var comes from the parent (hero or close).

**Who controls what:**

- WP1 sets `data-gl="on"` and `data-gl="off"` on the root through the ref.
- WP1 passes the sink transform through `style`.

**Acceptance (with `?sky=css`):**

- The rim is a crisp line about 1.5px thick. The apex of the rim equals the field's vertical centre within ±0.5px. Probe: `field.getBoundingClientRect()` centre compared with `.hz` rect centre.
- The halo extends at most 25svh above the apex, and fades out about 29% of the viewport width either side of the centre (it is the light behind the field, not a band across the screen).
- A switch cross-fades the tint over 1.2s, including after the ignition has finished: `getComputedStyle(brandsTint).opacity` reads 0 after a switch to creators.
- No element in the hero is wider than 2x the viewport: no 2R disc exists.

#### 5.0.7 LiftTrack and Sheet (`shell/Lift.tsx`)

```tsx
<LiftProvider>                                   {/* lib/lift.tsx: owns sentinelRef, sheetRef and heroExit */}
  <div className="relative" /* LiftTrack */ style={{ "--hero-stick": `${stick}px` }}>
    {/* Always exactly one viewport tall, ending where the sheet arrives, so motion's JS offsets and the
        ViewTimeline "exit" range agree even when the hero is taller than the viewport. */}
    <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[100svh] h-[100svh]" />
    {children /* <Hero/>: its root is sticky, top: var(--hero-stick, 0px) */}
    <div aria-hidden className="h-[100svh] [@media(max-height:520px)]:h-0" />
  </div>
  <Sheet>…</Sheet>
</LiftProvider>
```

**heroExit.** `useScroll({ target: sentinelRef, offset: ["start start", "end start"] }).scrollYProgress`, created in `LiftProvider` (§4.3). It is the "exit" preset, so it is ViewTimeline-accelerated. It goes from 0 when the sheet's top enters at the viewport bottom to 1 when it reaches the viewport top. While the hero is stuck, the sheet's top is at `(1 − heroExit) × innerHeight`.

**`--hero-stick`.** LiftTrack measures its child with a ResizeObserver and sets `stick = min(0, innerHeight − hero.offsetHeight)` (server: 0). A hero taller than the viewport then scrolls until its bottom meets the viewport bottom, and only then pins, so its lower content is never stuck out of sight. The sheet starts to cover it at that same moment.

**Short screens (`MQ.short`, `max-height: 520px`, no orientation clause).** The spacer is 0, the sheet has no negative margin, and the hero is `position: relative` (WP1 uses the same query). Every element bound to `heroExit` carries `data-lift`, and the globals.css short block forces the bindings off with `!important` (which beats inline styles and scroll-timeline animations): content at full opacity, no transforms, no clip, the dim and the moonlight edge at 0. `useUncovered` needs no special case: it compares real rects.

**Sheet.**

- An `m.div` with `ref={sheetRef}`, `data-lift="sheet"`, `relative z-sheet -mt-[100svh] [@media(max-height:520px)]:mt-0 bg-paper rounded-sheet` (phone `rounded-[28px]`), `pb-8`, `data-surface="paper"`, `dawn-fade`.
- `style.clipPath = useTransform(heroExit, [0,1], ["inset(0px Ipx 0px Ipx round Rpx)", "inset(0px 0px 0px 0px round Rpx)"])`, where I is 24 and R is 32 (phone: 12 and 28).
- Do not add a box-shadow: the clip-path would clip it.
- **Moonlight edge:** an `m.div` with `data-lift="edge"` at the top, `absolute inset-x-[8%] top-0 h-px`, with `linear-gradient(90deg, transparent, rgb(255 255 255/.7), transparent)` and opacity `useTransform(heroExit, [0,1], [1,0])`.
- Under reduced motion, there is no clipPath and no edge binding. The sheet stays rounded, and the sticky overlap stays, because that is scrolling rather than animation.

**Acceptance:**

- At 1440x900, `heroExit` reaches 1.0 at scrollY 900 ±2.
- In Chrome, `sheet.getAnimations()[0].timeline` is a `ViewTimeline`.
- The sheet arrives full-bleed exactly as the hero is covered.
- At 844x390 and 900x500, the hero is not sticky, nothing overlaps, and the hero is never dimmed.
- At 1280x600 (a hero taller than the viewport), the chips are reachable by scrolling before the sheet covers them.
- `useUncovered` on the hero field flips to false at about scrollY 400 at 1440x900.

#### 5.0.8 PauseToggle, SkipLink, SrStatus

**PauseToggle.**

- A 32px circle `<button aria-pressed={paused} aria-label="Pause animations">` with a Pause or Play icon at 14px.
- Night: `bg-white/8` with `text-white/72`. Paper: `bg-ink/5` with `text-ink/72`.
- It toggles `usePlayback`, which pauses the sky, the toasts, the window, the orbit, the glyph ticker and the promo thumbnail.

**SkipLink.** "Skip to content", an `<a href="#main">` (the native jump is the no-JS path). It is `sr-only` until focused, then becomes a fixed white pill at the top-left, `z-skip`. On click: `preventDefault()`, `main.focus({ preventScroll: true })`, then `scrollToY(yFor(main, 0), { immediate: true })`. Lenis's own anchor handling is off (§5.0.1), so there is no native jump followed by an animated bounce back.

**SrStatus.** A `sr-only` element with `role="status"` and `aria-live="polite"`, holding the announce text.

#### 5.0.9 Field (`shell/Field.tsx`)

**Box.**

- Root: `div.relative z-content w-full max-w-[580px]`, phone `w-[calc(100vw-32px)]`.
- It carries `data-field={placement}`, `data-invalid={invalid ? "true" : "false"}` (always a string: hero.module.css matches `="true"`) and `data-going`, and registers `els.heroField` or `els.closeField`.
- In the hero it also gets `motion-safe:animate-field-in` plus `dawn` protection: the field never fades.

**Form.**

- `<form method="get" action={copy.field.action} noValidate>`.
- `rounded-field bg-white shadow-field`, height 76 (phone 64).
- Invalid adds `box-shadow: 0 0 0 2px #D70015` before the field shadow.

**Contents:**

| Element | Spec |
|---|---|
| Icon | Globe or At, 19px, `text-ink/30`, at `start-5`. Both are rendered and cross-fade with y 4px over 200ms. |
| Input | `name={param}`, `id={\`${id}-${audience === "brands" ? "store" : "handle"}\`}`, a `sr-only` `<label>`, `aria-invalid`, `aria-describedby` on the error id. 18px (phone 17px, never below 16), −0.01em, `ps-[52px] pe-[108px]`, `dir="ltr"`, `inputMode` url or text, `autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go"`. **No autofocus.** |
| Typed hint | `<p aria-hidden data-hint>`, the input's next sibling, absolutely over it at `ps-[52px]`. **The server renders the full placeholder in it**, and the input's `placeholder` attribute is always a single space (`" "`), so SSR, no-JS and hydration show the same text, and CSS hides the hint as soon as there is a value, with or without JS: `input:not(:placeholder-shown) + [data-hint] { visibility: hidden; }`. After hydration it clears and types at 85ms per char only if `performance.now() < TYPE.retypeBeforeMs` (580ms: the field is still under 40% opacity in its fade-in) and the value is empty; otherwise it holds. On an audience change it deletes at 35ms per char, then types the new placeholder. Its caret is a 1x22px bar, `bg-ink/45 motion-safe:animate-caret`, hidden while the input is focused or holds text. Under reduced motion it never types. |
| Button | `type="submit"` at `end-2.5`, `h-11` (phone `h-12`), `rounded-control bg-ink px-5 text-small font-semibold text-white`, `hover:bg-ink/85`. "Start", or "Reading" with a working Moon at 15px. |
| Error | `<p id role="alert">`, absolute at `top-[calc(100%+18px)]`, centred, `text-micro text-white/92`, after a 6px #D70015 dot. Shown on invalid; cleared after 4s or on input. |

**State.**

- One draft per audience: `Record<Audience, string>`.
- Focus animates `world.focus` to 1 (and to 0 on blur) over 600ms `--ease-out`. On the first focus it appends `<link rel="prefetch" href={action}>` once.
- It writes `fieldFocus` (its placement on focus; `null` on blur only if it still holds focus), `heroFieldHasText` or `closeFieldHasText`, and `heroFieldVisible` or `closeFieldVisible`.
- `heroFieldVisible = IO says visible (rootMargin "-64px 0px 0px 0px") && useUncovered(root)`. `closeFieldVisible` is the IntersectionObserver alone (the close is not sticky).

**Submit.**

1. `preventDefault`.
2. Validate: brands uses `usableUrl`, creators uses `usableHandle`. If invalid, take the error path and keep focus in the input.
3. Otherwise `setGoing(true)`, `await startDawn()`, then `location.assign(\`${action}?${param}=${encodeURIComponent(value)}\`)`.

On `pageshow` with `persisted`, reset `going` and call `resetDawn()`.

**Acceptance:**

- Submitting empty shows the alert, a red ring and no layout shift: the CLS track is empty, and the hero chips hide by `:has()`.
- Submitting " https://www.YourStore.com/path " navigates to `/brands/c?read=yourstore.com`.
- Creators: "instagram.com/some.one/" goes to `/creators/c?h=%40some.one`, and "instagram.com" is rejected.
- With JS disabled, Enter loads `/brands/c?read=…` and the product reads it.
- Back from `/brands/c` shows "Start" again, with no dawn.
- Brands draft "abc.com", then switch, then switch back, shows "abc.com". The creators field never shows it.

#### 5.0.10 Small primitives

| Primitive | Spec |
|---|---|
| `WordReveal` | Splits on spaces (keeping them). Words are `span.inline-block` with `--i`. Each word goes from opacity 0, `blur(8px)` and `translateY(.3em)` to sharp, over 600ms `--ease-out` with a 35ms stagger, when ≥60% in view, once. Pure CSS classes toggled by `data-armed` and `data-in` (`WordReveal.module.css`, WP0). Static by default (§2.4.7). Reduced motion: a 200ms opacity fade. Keep it to 20 words at most. |
| `Reveal` | The same mechanism for blocks: opacity plus 8px y, 600ms. |
| `CountUp` | The server renders the final formatted value. Offscreen at mount, it renders the start value (0). In view (once, 50%), `useSpring` (`SPRING.number`, critically damped, rests in about 1.44s) drives it and writes `textContent` with `formatUSD` or the integer. The visible span is `aria-hidden`, beside a `sr-only` final value. Reduced motion: final value only. **It never shows a value above `to`.** |
| `Section` | `<section data-slot data-surface aria-labelledby>`, plus `cv-auto` when `cv` is set (never on the run stage or any sticky ancestor). With `cv`, it also records its rendered height per `slot` and `audience` and sets `containIntrinsicSize` on mount from that record (§5.0.4 size hints). Callers pass the deferred `audience` they received. |
| `Wordmark` | "HeyMoon" plus a ".AI" span. Weight 600, −0.03em, `dir="ltr"`, `select-none`. Sizes sm 15, md 17, lg 19. Tone night (".AI" #A78BFA) or paper (".AI" #4D2FB0). Text only: callers wrap it in their own plain `<a>`. |
| `Star` | The four-point AI-core star, `STAR_PATH = "M12 1.6c0 5.2 5.2 10.4 10.4 10.4C17.2 12 12 17.2 12 22.4 12 17.2 6.8 12 1.6 12 6.8 12 12 6.8 12 1.6Z"` (RESEARCH C4) on a 24×24 viewBox, `fill="currentColor"`, `size` prop, `aria-hidden`. Used by the window title bar (WP2), the orbit core (WP5) and `app/icon.tsx`. |

### 5.1 WP1 Hero and Sky

#### 5.1.1 Hero layout (`hero/Hero.tsx`, `hero.module.css`)

```css
.hero {
  --field-h: 76px; --apex-pref: clamp(440px, 63.3svh, 640px);
  position: sticky; top: var(--hero-stick, 0px); z-index: 0; min-height: 100svh;   /* --hero-stick: §5.0.7 */
  display: grid; grid-template-columns: 100%;
  grid-template-rows: minmax(calc(var(--apex-pref) - var(--field-h) / 2), max-content) var(--field-h) 1fr;
  overflow: clip; isolation: isolate; background: var(--night-1);
}
@media (max-width: 639px) { .hero { --field-h: 64px; --apex-pref: clamp(400px, 52svh, 480px); } }
@media (max-height: 520px) { .hero { position: relative; } }   /* MQ.short, the same query as Lift.tsx */
.top    { grid-area: 1 / 1; align-self: end; display: flex; flex-direction: column; align-items: center;
          padding: calc(var(--nav-top) + var(--nav-h) + 24px) 16px clamp(64px, 12.2svh, 110px); z-index: 2; }
.fieldRow { grid-area: 2 / 1; display: grid; place-items: center; z-index: 2; }
.hzCell { grid-area: 2 / 1; }                  /* <Horizon> lives here: the same cell as the field */
.bottom { grid-area: 3 / 1; padding-top: 28px; display: flex; flex-direction: column; align-items: center; z-index: 2; }
.hero:has([data-invalid="true"]) .chips { opacity: 0; visibility: hidden; transition: opacity .2s; }
@media (max-width: 639px) { .top { padding-bottom: 76px; } }
```

The section is `<section data-slot="hero" data-surface="night" aria-labelledby="hero-h1">`.

**Children:**

| Child | Spec |
|---|---|
| `<Horizon variant="hero" ignite className={hzCell}>` | `style` sink bound as in §5.1.5. |
| `<Sky />` | Canvas host, `absolute inset-0 z-canvas`. |
| `.top` | Contains `AudienceSwitch placement="hero" surface="night"` (wrapped `dawn-fade motion-safe:animate-nav-in [animation-delay:120ms]`, `mb-12`, phone `mb-8`), then `<Headline/>` (`dawn-fade`). |
| `.fieldRow` | `<Field id="hero" placement="hero"/>` |
| `.bottom` | `<Chips/>` (class `chips dawn-fade`). Nothing else is in flow here, so the toasts never change the hero's height. |
| Toast lanes (≥1024 only, gate G10) | Absolute, out of flow, `z-content`, `dawn-fade`. Not rendered below 1024 (CSS `max-lg:hidden` on the lane container, and `<Toasts>` skips its timeline there). |
| Dim overlay | `absolute inset-0 z-[3] bg-black pointer-events-none`, `data-lift="dim"`. Its opacity is bound. |

Each of `.top`, `.fieldRow` and `.bottom`, the lane container and the Horizon root is an `m.div` carrying the lift style (§5.1.5) and `data-lift`.

**Geometry targets.** At 1440x900 the apex is at y 570. At 390x844 it is at about y 439.

**The apex is measured, never computed:** `hz.offsetTop + hz.offsetHeight / 2`.

#### 5.1.2 Headline (`hero/Headline.tsx`)

- A `.morph` container, `text-center text-display-1 font-book`, with line 1 in `text-white/[.96]`.
- For each audience, render one child:
  - the active one is `<h1 id="hero-h1" data-state>`;
  - the inactive one is `<div aria-hidden inert="" data-state>`.
- Each child holds:
  - one `sr-only` full sentence;
  - an `aria-hidden` desktop line set (`hidden sm:block`) and a phone line set (`sm:hidden`).
- Each line is `<span class="line" style="--i:n"><span class="{grad ? 'grad-text-night' : ''}">text</span></span>`.
- Lines and gradient indexes come from `COPY[a].h1`.

**States:**

| When | Active | Inactive |
|---|---|---|
| Server, and before the first switch | `rise` | `idle` |
| After a switch | new active `in` | old active `out` |

Key both children by audience. The h1/div type swap remounts them, which restarts the CSS animations.

**Acceptance:**

- The view-source has exactly one `<h1`, containing "A campaign in fifteen seconds. Sales, guaranteed." on `/brands`. On `/creators` the h1 is the creators sentence.
- After a switch there is still one `h1`.
- With DevTools Performance (Fast 4G, 4x CPU), the LCP element is inside the h1, within 150ms of FCP.
- Reduced motion: a 200ms crossfade, with no transforms.
- Line 2's highlight runs once, starting about 1.7s after load.

#### 5.1.3 Chips (`hero/Chips.tsx`)

- `<ul class="chips">` holding 3 `<li>`. Each is a Phosphor Check (12px, bold, `text-brand-300`) followed by `text-micro text-white/56`.
- Spacing: `gap-x-5 gap-y-2`, wrap, centred. On phone they wrap to 2 lines.
- **Load:** `motion-safe:animate-fade-up` with delays of 420 + 35·i ms.
- **Switch:** keyed by audience. They remount with a word blur-in, 35ms stagger.
- They are hidden while the field is invalid (CSS above).

#### 5.1.4 Toasts (`hero/Toasts.tsx`)

**Client-only, mounted after hydration. `aria-hidden`. Desktop only (≥1024). Behind gate G10** (ruling 34): if G10 is refused, `Hero` does not mount `<Toasts>` and nothing else changes.

**Data.** `items = [opener, ...DEMO[audience].read.units]`.

| Item | Starts | Lands | Text |
|---|---|---|---|
| Opener | 0 | `TOAST.openerMs` (900) | Its note only. No landing text. |
| Unit i | `startMs + 900` | `endMs + 900` | Working: `` `${note}…` ``. Landed: crossfades (200ms, y 4px) to `produces`. |

- The cycle lasts `read.totalMs + 900 + holdMs`, then rests `restMs`, then repeats.
- One `useTimeline` drives it, with `playing = heroVisible ≥ .4 && useUncovered(lanes) && pageVisible && !paused && !hovered && !dawn && viewport ≥ TOAST.minWidth`. `useUncovered` matters because the hero is sticky: IntersectionObserver keeps reporting the lanes visible while the sheet covers them.

**Visibility rules:**

- An item is visible from its start until its land time plus `holdMs`.
- When a third would show, the oldest exits first.
- The first toast appears `TOAST.firstAtMs` after mount.

**Toast box:**

- `min-w-[248px] max-w-[300px] rounded-toast pt-[11px] pe-[14px] pb-3 ps-3`, `bg-[rgb(20_18_41/.62)] shadow-toast`, **no backdrop-filter**.
- Row 1: a Moon at 15px, white (working, then phase 4), then the agent in `mono-caps text-white/56`.
- Row 2: `text-small text-white/92`, one line, ellipsis.

**Motion (AnimatePresence):**

- Enter: opacity 0 to 1, y 12 to 0, `blur(4px)` to 0, over 500ms `outExpo`.
- Exit: opacity to 0, y to −6, `blur(2px)`, over 400ms `exit`.

**Lanes:**

| Width | Lanes |
|---|---|
| ≥1200 | Two lanes, alternating L, R, L. Each is 300 wide; its inner edge is 338px from the centre (beyond the field's 290 half-width plus 48). Its bottom is at `apex + sagitta(488) − 16`, where `sagitta(x) = R − √(R² − x²)` and `R = 1.1·innerWidth`. Recompute on resize. `mask-image: linear-gradient(to top, transparent 0, #000 14px)`, so toasts surface out of the horizon. |
| 1024 to 1199 | One centred lane, absolutely positioned 40px below the chips (out of flow), 1 visible. Hidden while the hero field is focused. |
| Below 1024 | None (ruling 34). |

**Switch.** In-flight toasts exit within 200ms. The queue swaps to the new audience and restarts 1,000ms later.

**Reduced motion.** Two static landed toasts: unit 4 ("Sampling 60 product pages" landing on its `produces`) and unit 9. They fade in over 200ms. There is no loop.

**Acceptance:**

- There are never more than 2 toasts in the DOM.
- The first text after 2.4s is "Opening yourstore.com".
- Over one cycle the sequence matches §6.2's toast list.
- Landed toasts show the `produces` labels.
- Scrolling the hero below 40% visibility, or until the sheet covers the lanes, freezes the sequence, and scrolling back resumes it mid-item.
- Hovering a toast freezes it.
- At 390 and 768 wide there is no toast in the DOM and no toast timeline running.

#### 5.1.5 Lift bindings (inside Hero)

| Target | Binding | Reduced |
|---|---|---|
| `.top`, `.fieldRow`, `.bottom` and the lanes | `opacity: useTransform(heroExit, [0,1], [1, .4])` and `transform: useTransform(heroExit, [0,1], ["translateY(0px)", "translateY(-40px)"])` | none |
| Dim overlay | `opacity: [0, .55]` | none |
| Horizon root | `transform: ["translateY(0px)", "translateY(120px)"]` (phone 80px) | none |

Each one is a single `useTransform` with arrays in and arrays out, on an HTML element, so they stay on the compositor path. Every bound element carries `data-lift` (`"dim"` on the overlay), so the short-screen block in globals.css switches them off (§5.0.7). `Sky` passes `uScroll = 0` while `useIsShort()`.

**Acceptance.** In Chrome, `getAnimations()` on each bound element reports a `ViewTimeline`. At 844x390 the hero content stays at full opacity and the dim at 0 while it scrolls away.

#### 5.1.6 Sky canvas (`sky/Sky.tsx`, plus the lazy `sky/gl.ts`, `shader.ts` and `watchdog.ts`)

`Sky.tsx` is the only static import. It server-renders an empty host `<div>` with no canvas.

**Lifecycle:**

| Stage | Behaviour |
|---|---|
| Gate | Skip entirely if reduced motion is on, `navigator.connection?.saveData` is set, the user has paused, or `?sky=css` is present. |
| Start | After `load`, `requestIdleCallback(…, {timeout: 2000})` (fallback `setTimeout(…, 200)`), then `await import("./gl")`, which is the only path to the shader. |
| Context | `document.createElement("canvas")` **inside the effect**. Try `getContext("webgl2", {alpha:false, antialias:false, depth:false, stencil:false, premultipliedAlpha:false, preserveDrawingBuffer:false, powerPreference:"low-power", failIfMajorPerformanceCaveat:true})`, then `"webgl"` with the same options. On null, stay on CSS. **If `getShaderPrecisionFormat(FRAGMENT_SHADER, HIGH_FLOAT).precision` is 0, stay on CSS** (destroy the context): at `mediump`, `length(…) − uRadius` at about 1,600px loses roughly 1.5px in fp16 and the rim jitters. There is no mediump path. |
| Size | A ResizeObserver on the host (prefer `devicePixelContentBoxSize`). `dpr = min(devicePixelRatio, level, √(2.2e6 / (w·h)))`, with `level` in `[1.5, 1.0, 0.75]`. Measure `uApex` from the `.hz` cell and set `uRadius = 1.1·innerWidth`, in the same callback inside `frame.read`. |
| First frame | Draw, then on the next frame fade the canvas in: `opacity` 0 to 1 over 1.2s `--ease-out`. On `transitionend`, set `hz.dataset.gl = "on"`, which hides the CSS layers except dawn. |
| Ignite clock | `uIgnite = easeOutExpo(clamp((rimAnim.currentTime − 400) / 1600, 0, 1))`, where `rimAnim = hz.querySelector(".hz-rim").getAnimations()[0]`. If there is no animation, it is 1. This keeps the canvas in step with the CSS ignition. |
| Loop | `frame.render(draw, true)`. `draw` reads `world`, `dir`, `focus`, `dawn` and `heroExit` (0 while short), and lerps the pointer by .06 (fine pointers only; 0 otherwise and while paused). `uTime` advances only by `frameData.delta`. |
| Dawn | The canvas element's `opacity` is bound to `1 − dawn` through a `dawn.on("change")` subscription that writes `canvas.style.opacity`. This needs no frame, so the CSS `.hz-dawn` beneath shows even while the loop is paused (user pause, offscreen, or a submit from the close field). While the loop runs, `uDawn` also mixes the shader toward #F6F4FC, so there is no dark dip. |
| Pause | `cancelFrame(draw)` when any of these hold: `heroExit ≥ .999`, the hero track is out of view, `document.hidden`, or the user has paused (draw one frozen frame first). Resume with `frame.render(draw, true)`. |
| Watchdog | Skip 30 frames after any (re)start, then average 50 deltas. If below 55.5fps, step `level` down and resize. If the median delta stays within 31.3 to 35.3ms over the window, the display is capped (iOS Low Power): set 1.0 and stop stepping. If still below 40fps at 0.75, `destroy()`, set `data-gl="off"`, and keep the CSS sky. |
| Context loss | On `webglcontextlost`: `preventDefault()`, stop, set `data-gl="off"` (the CSS sky shows at once). On `webglcontextrestored`: rebuild, redraw, fade in. Restore at most 2 times. |
| Teardown | `cancelFrame`, disconnect the observers, `WEBGL_lose_context.loseContext()`, `canvas.remove()`. A fresh canvas per mount keeps StrictMode safe. |
| Debug | `?sky=css` forces CSS. `?sky=gl` skips the gates except WebGL availability. `?skydebug` logs DPR level changes and GPU ms (through `EXT_disjoint_timer_query_webgl2` when present), and exposes `window.__sky = { running, level }` in dev. |

**Geometry.** One buffer holds a full-screen triangle (`-1,-1  3,-1  -1,3`).

**Vertex shader:**

- WebGL2: `#version 300 es\nin vec2 aPos; void main(){ gl_Position = vec4(aPos,0.,1.); }`
- WebGL1: `attribute vec2 aPos; …`

**Fragment shader** (header by context: WebGL2 `#version 300 es\nprecision highp float;\nout vec4 FRAG;`; WebGL1 `precision highp float;\n#define FRAG gl_FragColor`). Never call `pow` with a base that can be negative: GLSL leaves it undefined, and ANGLE (D3D) and Metal return NaN, which blacks out whatever it touches.

```glsl
uniform vec2  uRes;     // drawing-buffer px
uniform float uDpr;     // buffer px per CSS px
uniform float uTime;    // ACTIVE seconds (frozen while paused)
uniform float uApex;    // CSS px from the canvas top: centre of the field row (measured)
uniform float uRadius;  // CSS px: 1.1 * innerWidth (same as CSS --limb-r)
uniform float uWorld;   // 0 brands .. 1 creators
uniform float uDir;     // +1 last switch went to creators, -1 to brands
uniform float uIgnite;  // 0..1, the CSS ignition clock
uniform float uScroll;  // heroExit
uniform float uSink;    // 120 desktop, 80 phone (CSS px at heroExit = 1)
uniform float uFocus;   // 0..1 field focus lean
uniform float uDawn;    // 0..1 submit
uniform vec2  uPointer; // -1..1, lerped

const vec3 SKY_TOP = vec3(0.0039, 0.0118, 0.0902);  // #010317
const vec3 SKY_HOR = vec3(0.0784, 0.0706, 0.1608);  // #141229
const vec3 GROUND  = vec3(0.0000, 0.0078, 0.0667);  // #000211
const vec3 DAWN    = vec3(0.9647, 0.9569, 0.9882);  // #F6F4FC
const vec3 B_IN  = vec3(0.4863, 0.3608, 0.8784);    // #7C5CE0
const vec3 B_OUT = vec3(0.3020, 0.1843, 0.6902);    // #4D2FB0
const vec3 B_CORE= vec3(0.6549, 0.5451, 0.9804);    // #A78BFA
const vec3 B_TR  = vec3(0.9412, 0.3333, 0.6157);    // #F0559D
const vec3 C_IN  = vec3(0.9412, 0.3333, 0.6157);    // #F0559D
const vec3 C_OUT = vec3(0.4863, 0.3608, 0.8784);    // #7C5CE0
const vec3 C_CORE= vec3(0.9569, 0.6588, 0.8471);    // #F4A8D8
const vec3 C_TR  = vec3(0.6510, 0.3725, 0.9294);    // #A65FED

float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c){ return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)); }

void main(){
  vec2 size = uRes / uDpr;
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;           // CSS px, top-left origin
  float apex = uApex + uScroll * uSink + uPointer.y * 6.0;
  float cx = size.x * 0.5 + uPointer.x * 12.0;
  float d = length(p - vec2(cx, apex + uRadius)) - uRadius;               // >0 sky, <0 ground

  vec3 base = d > 0.0 ? mix(SKY_TOP, SKY_HOR, clamp((p.y - 0.38 * apex) / (0.62 * apex), 0.0, 1.0)) : GROUND;

  vec3 cin = mix(B_IN, C_IN, uWorld), cout = mix(B_OUT, C_OUT, uWorld);
  vec3 core = mix(B_CORE, C_CORE, uWorld), trace = mix(B_TR, C_TR, uWorld);

  float sunX = cx + size.x * 0.06 * sin(3.14159265 * uWorld) * uDir;      // the light swings toward the thumb, then back
  float u = abs(p.x - sunX) / size.x;                                      // 0 under the sun, ~.5 at the edges
  float lit = mix(0.45, 1.0, uIgnite);
  float reach = uIgnite * (0.5 * size.x + 80.0);
  float spread = 1.0 - smoothstep(reach - 80.0, reach, abs(p.x - cx));     // ignition runs outward from the field

  float rim  = exp(-abs(d) / (1.25 - 0.35 * uFocus));
  float rimA = mix(0.85, 0.45, smoothstep(0.0, 0.3, u)) * mix(1.0, 0.33, smoothstep(0.3, 0.5, u));
  vec3  rimC = mix(vec3(1.0), cin, smoothstep(0.0, 0.3, u));
  float halo = d > 0.0 ? exp(-d / (0.11 * size.y)) : 0.0;
  halo *= 1.0 - smoothstep(0.10, 0.30, u);                                 // "behind the field": gone ~30% of the width out (CSS halo: 38% radius)
  float k = (u - 0.2) / 0.08;                                              // never pow() a negative base
  vec3  haloC = mix(cin, cout, smoothstep(0.0, 0.45, u)) + trace * 0.10 * exp(-k * k);
  vec2  s = vec2((p.x - sunX) / (0.18 * size.x), (p.y - apex) / (0.05 * size.y));
  float sun = exp(-dot(s, s)) * (1.0 + 0.15 * uFocus) * (d > 0.0 ? 1.0 : 0.35);
  vec3  sunC = mix(core, vec3(1.0), exp(-dot(s, s) * 4.0));
  float earth = d < 0.0 ? exp(d / 36.0) : 0.0;

  float breathe = 1.0 + 0.04 * sin(uTime * 6.2831853 / 8.0);
  float dim = 1.0 - 0.4 * uScroll;
  vec3 E = toLin(rimC) * rim * rimA * spread * 1.6
         + toLin(haloC) * halo * 0.55 * breathe * dim * lit
         + toLin(sunC) * sun * lit * dim
         + toLin(cin) * earth * 0.10 * lit;
  E = 1.0 - exp(-E * 1.4);                                                 // tone map in linear
  vec3 col = 1.0 - (1.0 - base) * (1.0 - toSrgb(E));                       // screen the light over the ground

  if (d > 24.0) {
    vec2 cell = floor(p / 3.0);
    float h = hash12(cell);
    if (h < 0.0035) {
      vec2 o = vec2(hash12(cell + 3.7), hash12(cell + 9.2)) * 2.0 + 0.5;
      float a = mix(0.25, 0.8, hash12(cell + 7.1));
      float period = mix(6.0, 10.0, hash12(cell + 1.3));
      float tw = 0.6 + 0.4 * sin(6.2831853 * uTime / period + h * 4000.0);
      col += a * tw * (1.0 - smoothstep(0.35, 0.9, length(p - (cell * 3.0 + o))))
             * (1.0 - min(1.0, halo * 1.6)) * smoothstep(24.0, 96.0, d);
    }
  }
  col = mix(col, DAWN, uDawn);
  col += (hash12(gl_FragCoord.xy + fract(uTime * 0.37) * 97.0) - 0.5) / 255.0;   // ±0.5/255 dither; static when frozen
  FRAG = vec4(col, 1.0);
}
```

**CSS/GL parity check** (`?skydebug`):

1. Load with `?sky=gl`.
2. Screenshot the moment of the crossfade.
3. The rim and apex positions must match within 1px, and the colour of the sky at the top and at the horizon within ΔE ≈ 2. Check the horizon colour at the centre and at 25% and 75% of the width: the halo's horizontal falloff must match too.
4. Tune only the constants (lit floor, intensities, the falloff edges 0.10/0.30), never the geometry.

**Acceptance (WP1):**

- `curl -s localhost:3004/brands | grep -c "<canvas"` prints 0.
- On desktop Chrome, `.hz[data-gl="on"]` appears within 4s.
- `canvas.width / canvas.clientWidth` is at most 1.5.
- With the sheet covering the hero, `__sky.running` is false and the Performance panel shows no GPU frames. The same holds in a hidden tab.
- A switch shifts the tint over 1.2s, and the light swings toward the thumb side and back.
- There is no visible banding in the halo (zoom a screenshot to 400%).
- The centre of the sky is never black or garbage on Windows Chrome (ANGLE/D3D) and on Safari (Metal): the `pow` fix.
- The halo is dark at the left and right edges of a 1440 screenshot.
- Submitting while paused (nav pause on) still turns the hero to #F6F4FC.
- `canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()` shows the CSS sky at once, with no console errors. `restoreContext()` brings the canvas back.
- `?sky=css` shows no canvas, and the ignition still plays.
- Under reduced motion there is no canvas, the CSS sky is lit, and there is no ignition animation.
- The first-load JS contains no `precision highp` (checked by `measure`).

### 5.2 WP2 Working window (S4)

#### 5.2.1 WorkSection (`window/WorkSection.tsx`)

**Box.** `<Section slot="work" surface="paper" cv>`, `pt-[120px] pb-24` (phone `pt-[72px] pb-16`). The container is `mx-auto max-w-text px-[var(--gutter)]`.

**Head.** A 12-column grid.

- H2 (`WordReveal as="h2"`, `text-h2 text-ink max-w-[16ch]`) spans cols 1 to 6.
- Sub (`text-lead text-ink/72`) spans cols 8 to 12, `self-end`.
- Phone: stacked, gap 16.

**Frame.**

- `mt-16` (phone `mt-10`).
- `w-[min(1232px,calc(100vw-48px))]` (phone `calc(100vw-24px)`), `mx-auto`. Height `h-[720px]` from 1024; below 1024 (phone and 640 to 1023) auto, min 660, with the single-column window.
- `rounded-frame` (phone `rounded-[24px]`), `bg-deep`, `relative overflow-hidden`, `data-surface="deep"`, `role="region" aria-label="A sample run"`.

**Frame art** (static, no canvas):

- `.halftone`, absolute, inset 0.
- An `<svg aria-hidden>` dotted arc: a circle with R = 1.1 × frame width and its apex 120px above the frame bottom, `stroke rgb(255 255 255/.5)`, width 2, `stroke-dasharray="0 8"`, round caps.

**Frame label.** `mono-caps text-white/56` at `top-5 start-14` (phone `start-3`): "A sample run".

**Window.** `<WorkingWindow variant="page" …>`, `absolute inset-x-14 top-14 bottom-0` from 1024; `inset-x-6 top-14` from 640 to 1023; phone `inset-x-3 top-11`. Below 1024 the frame is 660px tall and the window uses its single-column layout (§5.2.3).

**Controls overlay.** Outside the window's `aria-hidden` subtree, `absolute bottom-5 end-5`. Shown only when `done`: a 300ms fade; otherwise `inert`.

- "Try it with your store" / "…handle": an ink pill, h40, px18, white small/600. It calls `toField()`.
- "Run it again": a text button, `mono-data text-ink/72`. It bumps `restartNonce`.

**Gating.**

| Condition | Effect |
|---|---|
| First reaches ≥55% visibility | `playing` becomes true |
| Below 20% visibility | pauses |
| Page hidden | pauses |
| User paused | pauses |
| Pointer over the window | pauses, and shows a 1px `ink/20` inset ring |
| Done | plays **once**; then the controls show |

**Signals.** `setSignal("work", {state, overall, passed})`. `passed` becomes true when a sentinel at the frame's bottom edge goes above the viewport top.

**Accessibility.** A `sr-only` summary paragraph (`COPY[a].work.summary(DEMO)`) sits inside the region.

**Act rail.** `<ActRail>` below the frame (§5.2.4).

#### 5.2.2 Schedule (`window/useRun.ts`, from DEMO only)

| Symbol | Brands | Creators |
|---|---|---|
| R (read ends, the stopwatch freezes) | `read.totalMs` = 15,022 | 16,242 |
| F (fold starts) | R + 600 | R + 600 |
| B0 (build starts) | F + 500 | F + 500 |
| Build units | B0 + `unit.startMs` / `unit.endMs` | B0 + … (4 units, 7,193ms) |
| Artefact extras | none | W = B0 + 7,193: MockWhy fills (120ms stagger). P0 = W + 300: picks at P0 + `enterMs` (343 / 667 / 911). Foot at P0 + 911 + 400. |
| END | B0 + 10,768 + 4,000 = about 30,890 | foot + 4,000 = about 30,100 |
| Acts | 0: [0, B0); 1: [B0, B0 + ladder.startMs); 2: [B0 + ladder.startMs, END] | 0: [0, B0); 1: [B0, P0); 2: [P0, END] |

`useTimeline({endMs: END, marks: every unit start and end, sizes[].atMs, F, B0, W, P0, picks, foot})` is the only clock.

#### 5.2.3 WorkingWindow (`window/WorkingWindow.tsx`, `ChainList.tsx`, `ChainRow.tsx`, `Stopwatch.tsx`, `Artefact.tsx`)

**Page variant.**

| Part | Desktop (≥1024) | Below 1024 (phone, and 640 to 1023) |
|---|---|---|
| Window | `bg-white rounded-t-window shadow-window overflow-hidden`, `aria-hidden` | same |
| Title bar | 52px, hairline below. Start: `<Star size={16}>` in ink plus `yourstore.com` / `@yourhandle` in `mono-data text-ink/72 dir=ltr`. Centre: status line, `text-small text-ink/60`, one line, ellipsis. End: counter `mono-data text-ink/60` (e.g. "4/9"), then the stopwatch group, then a Moon at 15px with phase `round(4·done/total)`. | 48px. Star, handle and stopwatch at 17px. The status line moves to a 32px strip below. |
| Body | `grid-cols-[7fr_5fr]`. Left: ChainList. Right: Artefact on `bg-canvas`, `border-s border-[var(--hair)]`, `p-8`, content centred. | One column: the ChainList viewport (header plus 5 rows of 48px), then the Artefact at 280px tall. |

**The status line** shows the opener at t=0, then the working unit as `` `${agent} · ${note}` ``, then the last note at done.

**Stopwatch** (`data-stopwatch`):

- A label in `text-micro text-ink/60`: "Reading" while t < R, then `COPY[a].work.stamp` ("Store details in" / "Your grid in").
- A time in `mono-timer text-ink num`: `seconds(min(t, R))`. It is written to `textContent` only when the tenths digit changes.
- After R it stays frozen at `read.totalText`. **It never shows a time for the plan, and never a time without its label.**

**ChainList.**

- Header row, 40px: the title (`text-small font-semibold text-ink/72`). The brands read title is `read.title`. The creators read uses `LABELS.creators.readingProfile`, with `read.sub` under it. The counter sits at the end.
- Read rows are visible up to the current `sizes` total. At `sizes[1].atMs` (6,048 / 6,738ms), rows 5 to 9 unfold: height 0 to 52, 40ms stagger, 300ms `--ease-out`.
- **Fold** (F to B0): the read rows collapse (height and opacity, 500ms) into one summary row. It holds a Moon at phase 4, the title and `9/9`. No time: the stopwatch above already stamps the read with its label, and no time shows without one (final round, POLISH.md).
- Then the build header (`build.title`, counter `n/7` or `n/4`) and its rows.
- Phone: the list translates (300ms) so the working row sits in slot 4.

**ChainRow** (52px, phone 48px; `px-5`; grid `15px 132px 1fr`, gap 12; phone `15px 1fr`, with the agent above the text in 10px mono):

| State | Glyph | Agent (`mono-caps`) | Text | Row |
|---|---|---|---|---|
| waiting | Moon phase 0, ink | `text-ink/60` | `note`, `text-ink/60` | none |
| working | Moon working, `text-brand` | `text-brand` | `` `${note}…` ``, `text-ink/88` | `bg-lilac/60` |
| done | Moon phase 4, ink | `text-ink/60` | `produces`, `text-ink/88` (crossfade 200ms, y 4px) | none |

Rows show `note` and then `produces`. **They never show read values.**

Brands `safety` and `creators` work and land together.

**Artefact.**

| Act | Brands | Creators |
|---|---|---|
| 0 (read) | Store card: white, radius 16, `shadow-mock`, max-w 360. Header: Globe 14 plus "yourstore.com" in `mono-data`. A tag per landed unit (its `produces`): `rounded-chip bg-canvas ring-1 ring-[var(--hair)] text-micro text-ink/72`, `motion-safe:animate-fade-up` on arrival. | Handle card, the same, with At plus "@yourhandle". |
| Fold | The tags collapse, 300ms. | same |
| 1 | `MockPlan` from `view.plan()` with every `reveal` flag false (skeleton bars `bg-ink/6`). Flags flip as rows land: markets → `markets`; creators (with safety) → `creators`, plus the check line `safety.produces`; pricing → `header` and `pay`; brief → the check line `brief.produces`. | The build rows run. When the last one lands (W), `MockWhy` from `view.why()` appears with `filled` going from 0 to 4 at a 120ms stagger. |
| 2 | ladder → `MockPhases grown` under the card. | `MockTiers` from `view.tiers()`, with `shown` going 1, 2, 3 at the picks' times and `showFoot` at foot. |

**Compact variant** (WP7's thumbnail): 360x210, phone 100% at 16:9.

- The deep background, halftone and dotted arc, with the white window inset 16px (top-radius 12).
- Header 32px: `<Star size={12}>`, the URL or handle in mono 11, then at the end the stopwatch group, exactly as on the page: the label (`COPY[a].work.stamp`, or "Reading" while t < R) in 11px `text-ink/60`, then the time in mono 13. A bare "15.0s" under "Watch five agents build a campaign" would stamp the campaign, not the read (ruling 16, §6.5).
- Body: the last 4 rows (34px each: Moon 11, agent in mono 9px caps, note or produces at 11px).
- After the fold, the rows fade and the artefact rises in: MockPlan with all flags (brands), or MockTiers with `shown=3` (creators), scaled to fit with CSS `zoom` 0.72. The text is still real text, not an image.
- Real pace, same timeline. It loops with `RUN.compactGapMs`. No controls, `aria-hidden`.

**Reduced motion.** It renders the final state immediately: the stopwatch reads `totalText`, the controls are visible, and "Run it again" is hidden.

#### 5.2.4 ActRail (`window/ActRail.tsx`)

**Desktop.** Three columns, `mt-10 gap-6`. Each column is a `<button aria-current={active ? "step" : undefined}>` containing:

- A 2px track (`bg-ink/8`) with a fill (`bg-ink`). The fill's `transform: scaleX(actProgress)` is derived from the window's timeline `t` (a MotionValue shared inside WP2), written per frame and not through `onProgress`. It is `origin-left` (`origin-right` in RTL).
- A row: `mono-data text-ink/60` "01", then a Moon at 15px (upcoming 0, active working, done 4).
- The title, `text-h3`: active ink, upcoming `ink/60`, done `ink/72`.
- The body, `text-small text-ink/72`.

**Phone.** Only the active act's title and body, with three mini tracks above.

**Click.** `seek = {act, nonce}`. Earlier acts complete instantly, the stopwatch shows `totalText`, and play continues if in view.

The card 3 brands body interpolates `plan.pay.text` and `unlockPct`.

#### 5.2.5 Acceptance (WP2)

**Brands:**

- Scroll the frame to 55% in view. The rows start.
- The counter reads "3/4" until about 6.0s, then "4/9".
- `[data-stopwatch]` ends at exactly `"Store details in " + DEMO.brands.read.totalText` (today "Store details in 15.0s") and never changes after.
- The fold happens at about 15.6s. The build header reads "Five agents on your plan".
- "Matching creators whose audience is in your markets" and "Vetting every match for brand and fraud risk" land in the same frame.
- At the end, the plan shows "Phase 1 · Warm-up", "Guaranteed", "$1,000", "UAE, KSA, Kuwait", three discs, and phases bars at 16%, 53% and 100% width.
- The controls appear about 30.9s ±0.3s after the start. Check with `performance.now()` in the console.

**Creators:**

- "Reading your profile" and "@yourhandle · five agents" show, and the stamp reads "Your grid in 16.2s".
- "Three agents building your profile" shows.
- MockWhy shows the four reason labels, each with a full Moon (all four `lit` today), no meter, and the pane has no digits at all.
- MockTiers rows read 12%, 12% and 11%, then "Dune Run" with "Request to join", then "12 more, each a request to join".

**Both:**

- Scrolling away mid-run pauses the stopwatch, and returning resumes it from the same tenth.
- Hover pauses it and shows the ring.
- With no JS, `curl` HTML contains "Five agents on your plan" and "15.0s": it is the final state.
- Clicking act 3 completes the plan at once.
- axe reports no focusable element inside `aria-hidden`.
- No text inside the window is below the §2.1 floors.

### 5.3 WP3 Run stage (`run/RunStage.tsx`, `RunStep.tsx`)

**Box.** `<Section slot="run" surface="paper">`, **never `cv`**, `pt-[140px]` (phone `pt-24`). The head matches WorkSection's (H2 and sub, asymmetric).

**Sticky mode** applies at ≥768 wide, when not reduced, and when `innerHeight ≥ 600`.

- Outer: `relative h-[calc(100svh+3*60svh)]`.
- Inner: `sticky top-0 h-svh overflow-clip`, a 12-column grid, `items-center`, `pt-24`.

**Left: the step list** (cols 1 to 5). An `<ol>` of 4 `RunStep`s, each a `<li><button>` with grid `[32px_1fr]`.

- Glyph: a Moon at 15px whose phase follows the step's state, as on the act rail: upcoming 0, active working (in `text-brand`), done 4 (ruling 35: no crescent as a fixed label). If the step is "yours" (its credit starts with "You"), a MoonRing instead, in `text-brand` while active.
- Text:
  - `mono-data text-ink/60` "01";
  - the title, `text-h3`;
  - the body, `text-small`: active `text-ink/72`, inactive `text-ink/60` (all lines always shown, so there is no shift);
  - the credit, `mono-caps text-ink/60`: `` `${COPY[a].run.creditLabel} · ${credit}` ``.
- The active step gets `bg-white rounded-card shadow-card` with `p-5`. Inactive steps keep `p-5` on a transparent background. Cross-fade 300ms.

**Rail.** An absolute 2px line, `bg-ink/8`, at `start-[15px]`, from the first glyph to the last. Its fill is `bg-ink` with `transform: useTransform(progress, [0,1], ["scaleY(0)", "scaleY(1)"])`, `origin-top`.

**Right: the panel** (cols 7 to 12). `hm-media rounded-[24px] h-[480px] relative overflow-hidden ring-1 ring-[var(--hair)]`. AnimatePresence swaps one mock at a time:

- in: opacity, y 8 to 0, `blur(4px)` to 0, over 350ms `--ease-out`;
- out: opacity 0 over 200ms.

| Step | Brands | Creators |
|---|---|---|
| 01 | `MockField kind="url" value="yourstore.com"` | `MockRead {...view.read()}` |
| 02 | `MockPlan {...view.plan()}` | `MockPicks {...view.picks()} shown={3} layout="cards"` |
| 03 | `MockPay {...view.pay()}` | `MockTerms {...view.terms()}` |
| 04 | `MockCurve rungs label="Sales, guaranteed" drawn={active}` | `MockCheck {...view.check()} shown={active ? n : 0}` (misses appear at a 120ms stagger) |

**Progress.**

- `useScroll({target: outer, offset: ["start start", "end end"]})` (the contain preset).
- `active = min(3, floor(p × 4))` via `useMotionValueEvent`, with a ref compare, so it re-renders only on a change.

**Buttons.**

- Click: `scrollToY(outerTop + ((i + .5) / 4) × (outerHeight − innerHeight), {duration: .8})`, where `outerTop` is the outer's absolute document y.
- Focus: the same, immediate, so a keyboard user never reads step 3 over step 1's panel. **Only when `e.currentTarget.matches(":focus-visible")`**: Chrome and Firefox focus a button on mouse click, and an immediate scroll there would cancel the click's 0.8s scroll.

**Stacked mode** (phone, reduced motion, or short screens): each step block, then its mock in a `100% × 300px` hm-media mount. No sticky. Mocks draw on entry (reduced: drawn). Steps are not buttons, and every agent step's glyph is a full Moon (phase 4).

**Acceptance:**

- At 1440x900, scrolling through the section changes the active step exactly 3 times, at the scroll quarters.
- The rail fill reports a `ViewTimeline` or `ScrollTimeline`.
- The React profiler shows at most 4 RunStage renders across a full scroll.
- Tabbing to step 3 scrolls so step 3 is active. Clicking step 3 with the mouse scrolls smoothly over 0.8s (no jump).
- Reduced motion and 390 wide show the stacked layout with all four mocks.
- Credits read "Done by · MoonShot AI", "Done by · MoonMatch AI", "Done by · You", "Done by · MoonScore AI" (brands), and "Done by · You, then five agents", "Done by · MoonMatch AI", "Done by · You", "Done by · You, then MoonWriter AI" (creators).

### 5.4 WP4 Number (`number/*`)

**Box.** `<Section slot="number" surface="paper" cv>`, `pt-[120px] pb-[120px]`.

**Divider.** At the top of the section: 9 Moons at 11px, gap 16, centred, ink, phases `[0,1,2,3,4,5,6,7,0]`. Once in view, they go from all phase 0 to their phase in sequence, 60ms apart. Reduced motion: static.

**Brands row 1: Guarantee** (`Guarantee.tsx`). A 12-column grid.

- **Left, cols 1 to 5:**
  - H2, `WordReveal`, `text-h2 max-w-[16ch]`;
  - the body, `mt-5 text-body text-ink/72 max-w-[48ch]`;
  - the rule, `mt-9 grad-rule h-[2px] w-[200px] rounded-full`, scaleX 0 to 1 over 600ms `--ease-out`, start origin, on entry;
  - the signature, `mt-3 text-micro text-ink/60`.
- **Right, cols 7 to 12:**
  - the eyebrow, `mono-caps text-ink/60` "Guaranteed sales";
  - `mt-3`: `<CountUp to={guarantee.revenue.value} format="usd" className="text-figure text-ink num">`;
  - `mt-4 text-lead text-ink/72`: `COPY.brands.number.figureNote(guarantee.budget.text, guarantee.roasText)`;
  - `mt-8`: `<Curve drawn={counting} className="h-24 w-full">`, the column's width × 96px (v1's GuaranteePanel proportion; figure chrome under §2.4.2, ruling 36). It starts with the count.
  - There is **no ladder line** under the figure: "$4,000 at 3.7x and $7,500 at 6.3x" under "Guaranteed sales" would state Phases 2 and 3 as fact, and D4 calls them indicative. `figureNote` already carries the budget and the multiple; the phases appear only inside the product mocks.

**Brands row 2: ROAS** (`Roas.tsx`), `mt-[120px]`.

- **Left:** H2; body; `mt-8 text-micro text-ink/60` climb label; chips in `<ol class="flex gap-2 mt-3">`, `rounded-receipt px-3 py-2 text-small`. P1 is `bg-brand/8 text-brand font-semibold`; P2 and P3 are `bg-ink/[0.04] text-ink/72`. Text is `P{n} {multipleText}`.
- **Right:** `<RoasDial {...view.dial()} label note drawn>` at 360px (phone 300).

**Creators row 1: Paid** (`Paid.tsx`).

- **Left:** H2; body; rule; signature.
- **Right:** the eyebrow "Your payout is paid"; the figure "Weekly" (`text-figure`, no count); the note `text-lead text-ink/72`; `mt-8 <PayoutRail steps lit>`, with `lit` going 0 to 4 at 300ms intervals on entry.

**Creators row 2: Share** (`Share.tsx`).

- **Left:** H2; body; "Every order is counted through" in `text-micro text-ink/60`; chips "Your code" and "Your tracking link" (`rounded-receipt bg-ink/[0.04] text-small text-ink/72`).
- **Right:** `<ShareScale {...view.share()} lit>`.

**Phone.** Stacked. The figure is 64px; the curve stays 100% × 96px under the figure note.

**Acceptance:**

- A MutationObserver on the figure during the count never records a value above "$63,050". It ends on "$63,050" within 1.5s of starting.
- The curve draws over 1.2s with the count, inside cols 7 to 12, and is never wider than that column.
- The guarantee column carries no phase budgets ("$4,000", "$7,500"). The P1 to P3 chips in the ROAS row are approved A4 copy and stay.
- On `/creators`, `document.body.innerText` contains no match for `/\$\s?\d/`.
- ShareScale shows exactly 16 dots and the figure text "10 to 16%". `innerText` contains no "–".
- Reduced motion: final values, drawn charts, no transitions.
- On `/brands`, the ROAS chips read "P1 1x", "P2 3.7x", "P3 6.3x", and the dial's `aria-label` is "Guaranteed ROAS: 5x".

### 5.5 WP5 Agents orbit (S6) (`agents/*`)

**Box.** `<Section slot="agents" surface="paper" cv>` wraps a panel `div data-surface="deep"`.

- Panel: `mx-6 rounded-sheet bg-deep px-20 py-24 min-h-[820px] relative overflow-hidden`.
- Phone: `mx-3 rounded-[28px] px-5 py-14`, min-h auto.
- Star-dust: an absolute layer, `radial-gradient(circle, rgb(255 255 255/.05) 1px, transparent 1.4px) 0 0/8px 8px`.

**Left column** (cols 1 to 5):

- H2, `WordReveal`, `text-h2 text-white max-w-[16ch]`. Body, `mt-4 text-body text-white/72`.
- **Readout** (`Readout.tsx`, `mt-12`, `id="agent-readout"`, `aria-live="off"`):
  - Row: the agent's icon (18px, `text-white/56`), then the agent in `mono-caps text-white/92`, then the stage in `text-micro text-white/56`.
  - `mt-2 text-small text-white/88`: the unit's `note`, or "Waiting".
  - `mt-4`: a row of 7 Moons at 11px, white, one per agent: waiting 0, working cycle, done 4.
  - It cross-fades over 300ms when the agent changes.
- **Creators only** (`Locks.tsx`, `mt-10`):
  - `mono-caps text-white/56` "Locked for every agent".
  - Three rows, each `h-11 border-t border-white/8 flex items-center gap-3`: Lock 14 (`text-white/56`), the label (`text-small text-white/88`), and at the end a "Never" pill (`mono-caps text-white/72 ring-1 ring-white/16 rounded-pill px-2.5 h-6`).
  - Hovering or focusing a row brightens its fence lock to `white/88`.

**Icons:**

| Audience | Icons, in AGENTS order |
|---|---|
| Brands | Storefront, UsersThree, ShieldCheck, PenNib, Megaphone, ChartLineUp, Brain |
| Creators | UserFocus, Handshake, ShieldCheck, PenNib, Megaphone, ChartLineUp, Brain |

**Stage** (`Orbit.tsx`, cols 6 to 12, `relative w-full max-w-[640px] aspect-[640/560] ms-auto`). The design space is 640x560; the SVG scales through its viewBox and the HTML nodes through `k` (below). Columns 6 to 12 are about 625px wide at 1280 and about 470px at 1024, so the stage scales down there instead of overflowing. Below 1024 the band stacks: copy, then the stage centred at up to 640px, then the readout. Below 640 the phone geometry applies.

- **SVG layer** (`aria-hidden`, viewBox 0 0 640 560):
  - the orbit: an ellipse at (320, 280), rx 250, ry 96, `stroke rgb(255 255 255/.10)`, width 1.5, dasharray `0 8`, round caps;
  - creators only: the fence, an ellipse with rx 300 and ry 140 at `white/14`, also dotted;
  - the beams.
- **Core** (HTML, centred, z 2):
  - a 96px circle, `radial-gradient(circle at 50% 40%, rgb(255 255 255/.10), rgb(255 255 255/.02))`, with a 1px `white/12` ring;
  - `<Star size={36}>` (`ui/Star.tsx`, RESEARCH C4), white, `drop-shadow(0 0 24px rgba(255,255,255,.35))`;
  - **no gradient**.
- **Seven nodes:** `<button type="button" aria-label="{agent}, {stage}" aria-describedby="agent-readout">`, absolutely centred on the stage. Each holds a **full** Moon (phase 4) at 24px, the name (`mono-caps text-white/56`, active `white/92`) and the stage (`text-micro text-white/56`). The node never shows a phase (Direction C: "Keep them full, never phased"); its state is the Moon's colour: waiting `text-white/32`, working `text-white` plus the beam, done `text-white/56`.
- **Position** is written each frame straight to `style.transform` and `style.opacity`, with no React state:
  - **Not `useAnimationFrame`**: it registers once at mount and never stops, and its `t` is wall-clock time, so it can neither pause offscreen nor resume without a jump. Instead, an effect keyed on `active && !hovered` calls `frame.update(tick, true)` and its cleanup calls `cancelFrame(tick)`. `tick` adds `min(frameData.delta, 40)` to a ref `θt` (ms), so the angle resumes exactly where it stopped.
  - `θi = 2π(i/7 + θt/120,000) − π/2`;
  - `x = 250k·cos θ`, `y = 96k·sin θ`, where `k = stageWidth / 640` (a ResizeObserver on the stage);
  - `f = smoothstep(−.25, .25, sin θ)`;
  - scale `.74 + .26f`, opacity `.45 + .55f`;
  - z-index 3 when `sin θ > 0`, else 1.
  - It runs only while `useActive`.
- **Creators fence locks:** three Lock glyphs (14px, `white/56`) at 200°, 270° and 340° on the fence.

**Cycle** (`useTimeline`).

- Units are `DEMO.brands.build.units` (7) for brands and `DEMO.creators.read.units` (9) for creators.
- At time t, a unit is working if `startMs ≤ t < endMs`, and done if `t ≥ endMs`.
- **Working agent:** the node's full Moon brightens to `text-white` and its label goes to `white/92`. (The readout's row of seven glyphs, which is the glyph system rather than the orbit, does cycle.)
- **Beam:** an SVG path, a quadratic Bézier from the node to the core edge, with its control point offset 40px perpendicular to the midpoint. Stroke white, 1.25px, `pathLength=1`, `strokeDasharray=".25 1"`. The dashoffset goes 1.25 to 0 over 900ms `outExpo` at the unit's start. The `d` is recomputed per frame while visible (at most 2 beams).
- **Core pulse** at the unit's end: scale 1 to 1.06 to 1 over 600ms.
- **Done agents** stay at `text-white/56` until the cycle ends. At the end: rest 2s, reset to waiting, repeat.
- **MoonLive AI and MoonLearning AI never work** on either side. They stay dim at `text-white/32`, and the readout says "Waiting" on hover.
- **Brands:** MoonMatch and MoonSearch work at the same time (the safety row).
- **Readout** shows the most recently started working unit.
- **Hover or focus on a node** pauses the timeline and the revolution, and shows that agent's latest note in this cycle, or "Waiting". Leaving resumes.

**Phone.** The stage is 358x300 (rx 150, ry 58). Nodes show only their Moon (the label is still in `aria-label`). The readout sits below the stage.

**Reduced motion:**

- static positions on a near-circle (`ry = .9·rx`, scaled to fit);
- all seven full at `text-white/56`, labels visible;
- no beams and no revolution;
- the readout shows MoonShot's first unit, and hover or focus still updates it.

**Acceptance:**

- Over 10s, a node's angle advances 30° ±1°. After a hover or an offscreen pause, it resumes from the same angle (no jump).
- Brands: MoonLive and MoonLearning never light. MoonMatch and MoonSearch light together.
- No orbit node ever shows a crescent or a new moon: every node glyph has all 21 dots lit.
- Hovering MoonScore AI freezes every node position for 2s and shows "Sizing the warm-up crew against the $1,000 Phase 1 budget" during its unit.
- Offscreen, the orbit's frame callback is cancelled (Performance panel: no orbit work at the footer).
- At 1024 and 1280 wide the stage fits its column with no overflow.
- Tab moves through the 7 node buttons in AGENTS order.
- Reduced motion is static.
- No element in the band uses the brand gradient: the computed `background-image` contains no "#4D2FB0" or "rgb(77, 47, 176)" outside `.grad-*`.

### 5.6 WP6 Connects, Close, Footer (`close/*`)

#### Connects (`Connects.tsx`)

**Box.** `<Section slot="connects" surface="paper" cv>`, `py-24` (phone `py-16`). A hairline above it inside the container (`border-t border-[var(--hair)]`, `pt-16`).

**Desktop layout.** One row, `justify-between items-center`:

- text, max-w 480: H2 (`text-h2`), then the body (`mt-3 text-body text-ink/72`);
- marks, gap 48.

**Phone.** Stacked; the marks sit in a 2x2 grid.

**Brands marks:**

- `<img src="/platforms/{salla,zid,shopify,magento}.png" alt="{Name}" loading="lazy">`, at heights 34, 32, 24 and 24.
- `grayscale opacity-[.72]`, static, with no hover (the marks are not links).

**Creators marks:** two 40px `rounded-[10px] bg-ink` squares with white InstagramLogo and TiktokLogo at 22px, `role="img" aria-label="Instagram"` and "TikTok".

#### Close (`Close.tsx`): the fork

**Box.** `<section data-slot="close" data-surface="night" aria-labelledby="close-h2">`, `relative z-close -mt-8 min-h-svh bg-night-1 overflow-clip`. The same grid as the hero, with `--apex-pref: 56svh`. The field row holds `<Horizon variant="close" ignite={entered}>`.

`entered` becomes true once, at 40% visibility, which replays the ignition.

**Row 1** (`self-end`, `pb-[clamp(56px,8svh,96px)]`):

- `AudienceSwitch placement="close" surface="night"` with `mb-10`.
- The H2 morph:
  - a `.morph` container, `text-display-2 text-white/[.96] text-center`;
  - active `<h2 id="close-h2">`, inactive `<div aria-hidden inert>`;
  - states `still`, `in`, `out`, `idle`;
  - one line on desktop; phone uses `COPY[a].close.h2Phone` (2 lines).

**Row 2:** `<Field id="close" placement="close"/>`.

**Row 3** (`pt-[72px]`, centred):

- the lock note, `flex items-center gap-2 text-small text-white/72`, with Lock 12;
- `mt-2 text-micro text-white/56`: the credit.

**Switching here** calls `select(a, "close")`. The page above swaps (deferred), and the close keeps its viewport position (`anchorOf("close")`).

#### Footer (`Footer.tsx`, `GiantWordmark.tsx`)

**Box.** `<footer data-surface="night" class="bg-night-0 dawn-fade">`, which continues the close's planet ground. It fades with the dawn, and the Landing root behind it turns #F6F4FC (§1.8).

**Row.** `h-16 border-t border-white/8`, `mx-auto max-w-text px-[var(--gutter)] flex items-center justify-between`.

- Start: `Wordmark size="sm" tone="night"` inside a plain `<a href={PATHS[audience]}>` whose plain click calls `preventDefault()` and scrolls to the top.
- End: `<nav aria-label="Site">` with:
  - "Brands", a plain `<a href="/brands">`;
  - "Creators", a plain `<a href="/creators">`;
  - both spread `useAudienceLink(a, "nav")`: a plain click calls `preventDefault()` then `select(a, "nav")`, or scrolls to the top when `a` is already the audience; modified clicks keep the browser default. **Never `next/link`** (rule 2.4.11);
  - "Dashboard" (an `<a href>` per audience);
  - styled `text-micro text-white/72 hover:text-white`, gap 24.
- **No copyright line.**

**Giant wordmark** (`aria-hidden`).

- Container: `overflow-hidden`, height `calc(22vw * .8 * .62)` (phone 26vw).
- Inner `m.div` with the text "HeyMoon":

```css
.wm { display: block; font: 600 22vw/0.8 var(--font-geist-sans); letter-spacing: -0.06em; white-space: nowrap; text-align: center;
  color: transparent; background: radial-gradient(circle, rgb(255 255 255/.9) 0 1.1px, transparent 1.5px) 0 0 / 6px 6px;
  -webkit-background-clip: text; background-clip: text;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, rgb(0 0 0/.35) 55%, transparent 85%);
          mask-image: linear-gradient(to bottom, #000 0%, rgb(0 0 0/.35) 55%, transparent 85%); }
@media (max-width: 639px) { .wm { font-size: 26vw; } }
```

- Scroll binding: `useScroll({target: footer, offset: ["start end", "end end"]})` (the entry preset) drives three properties:
  - `transform`: `"translateY(24%)"` to `"translateY(0%)"`;
  - `filter`: `"blur(8px)"` to `"blur(0px)"`;
  - `opacity`: .4 to 1.
- Reduced motion: static at the final state.

**Acceptance:**

- Switching at the close keeps `close.getBoundingClientRect().top` within ±4px, morphs the H2, swaps the field icon, and changes the URL.
- The close rim ignites once on entry.
- The wordmark shows about 62% of its cap height at 1440, and its animations report a `ViewTimeline`.
- There is no "©" anywhere on the page.
- The store marks have `alt` text, and the creators squares have accessible names.
- After a switch to creators, the footer's "Brands" link brings brands back with the URL `/brands` and the brands page showing (no soft navigation that leaves the URL and the page out of step).
- Submitting the close field turns the footer area light along with the close.

### 5.7 WP7 Promo card (`promo/*`): writer.com, made honest (INPUTS)

#### Launcher (`Launcher.tsx`)

- **Box.** A `<button>`, fixed at `end-6 bottom-6` (phone: `end-4`, `bottom: max(16px, env(safe-area-inset-bottom))`). `z-promo`, 56px (phone 52), `rounded-full bg-night-0 shadow-launcher`, with the `dawn-fade` class.
- **Two levels** (rule 2.4.6): the `<button>` is shown and hidden only by a 200ms `opacity` and `scale` **transition**. The appear and pulse animations (`motion-safe:animate-launcher-in`, `motion-safe:animate-launcher-pulse`) play on an inner `<span>` that holds the glyph. On the button itself, their `both` fill would pin it visible and it could never hide again.
- **Content.**
  - Closed: a Moon at 20px, white, phase 4. On hover it plays one lunar cycle at 90ms per step.
  - Open: a white X at 18px with a 2px stroke.
  - The swap cross-fades with a 90° rotation over 220ms.
- **Accessible names.** `aria-expanded`, `aria-controls="promo-card"`. The `aria-label` is the headline while closed, and "Close" while open.
- **Appears:**
  - Desktop: 4s after load or on the first scroll (the inner span's `launcher-in`). Hidden while `closeFieldVisible`.
  - Phone: only when `!heroFieldVisible && !closeFieldVisible && !keyboardOpen`. One inner-span `launcher-pulse` the first time it appears.
- **Hidden** means `inert`, `aria-hidden`, opacity 0, scale .8 and `pointer-events: none`.

#### Card (`PromoCard.tsx`)

- **Box.** `id="promo-card" role="dialog" aria-modal="false" aria-labelledby="promo-h"`, fixed at `end-6 bottom-[92px]`, `w-[360px]`.
  - Phone: `inset-x-3`, `bottom: calc(74px + env(safe-area-inset-bottom))`, `max-w-[400px]` centred.
  - `rounded-card bg-white overflow-hidden`, with `shadow-promo` (or `shadow-promo-night` while the surface under the nav is night), and `data-lenis-prevent`.
  - It is rendered only while open (AnimatePresence).
- **Band.** `bg-lilac px-6 pt-5 pb-[22px] text-center`.
  - Eyebrow: `mono-caps text-brand`, "A sample run" (#4D2FB0 on #F3EFFC is about 7:1).
  - Headline: `mt-2 text-h3 text-ink`, at most 2 lines, `id="promo-h" tabIndex={-1}`. It reads `COPY[a].promo.headline`.
- **Thumbnail.** 360x210 (phone 16:9): `<WorkingWindow variant="compact" audience={urgent} playing={open && !paused} loop />`, keyed by audience, `aria-hidden`. **No play triangle anywhere.**
- **Button.** Floating over the thumbnail, `absolute bottom-4` and centred. `h-10 px-[18px] rounded-pill bg-white text-ink text-small font-semibold shadow-float`. Its label is `COPY[a].promo.cta`, with no icon. On click: close the card, then `toField()`.

#### Choreography

**Open:**

| Delay | Element | Motion |
|---|---|---|
| 0 | Launcher | glyph to X, 220ms |
| 0 | Card | scale .92 to 1, y 12 to 0, `blur(6px)` to 0, opacity 0 to 1, over 420ms `outExpo`, with `transform-origin` at the launcher's centre |
| +60ms | Eyebrow | in |
| +120ms | Headline | line rise |
| +120ms | Thumbnail | `clip-path: inset(100% 0 0 0)` to `inset(0)` over 500ms `outExpo` |
| +360ms | Pill | rises |
| +500ms | Thumbnail loop | starts |

**Close.** 240ms `exit` to scale .96, y 8 and opacity 0. The X turns back into the glyph.

**Focus.**

- A user-initiated open moves focus to the headline. An auto-open never moves focus.
- Esc (with focus in the card or on the launcher) closes, and focus returns to the launcher.
- Phone: a pointerdown outside closes, and so does a swipe down of 64px or more on the card.
- There is no focus trap, and no `lenis.stop()`: the page stays scrollable.

**Auto-open** (desktop ≥1024 only, once per session). All of these must hold:

- `work.passed` is true;
- `work.overall < .6`;
- `fieldFocus === null && !heroFieldHasText && !closeFieldHasText && !promoOpen`;
- `readSession("hm.site.promo")` is not `"dismissed"` and not `"auto"`.

Then: one launcher pulse, wait 600ms, open, and write `"auto"`. Any user close writes `"dismissed"`. Storage reads and writes are wrapped in try/catch; when storage is blocked, the card never auto-opens.

**Switch while open.** The headline cross-fades (200ms) and the thumbnail remounts.

**Reduced motion.** Open and close are a 150ms opacity fade. The thumbnail shows its final state.

**Writes.** `setSignal("promoOpen")`.

#### Acceptance

- On desktop the launcher appears 4s after load.
- At 390 wide it is absent while any part of either field is on screen, and while the keyboard is open.
- axe sees a dialog with its name taken from the headline.
- Esc closes it and focuses the launcher.
- The pill scrolls to the nearest field and focuses it.
- Auto-open fires when you scroll quickly past the frame before 60% of the run, and only once per session. It never fires on phone.
- In a private window with storage blocked, there are no errors.
- The thumbnail's stamp reaches `"Store details in " + read.totalText` (today "Store details in 15.0s") at real pace, never earlier.
- The compact thumbnail never shows a time without its label ("Reading" or the stamp) beside it.
- After the launcher has appeared, scrolling to the close field hides it again (opacity 0, `inert`).

### 5.8 WP8 Mocks library (`mocks/*`)

**Common rules:**

- Every mock's root is `aria-hidden`. The exceptions are RoasDial and ShareScale, which are `role="img"` with an `aria-label`.
- Mocks take props only. They may import `copy.ts` `LABELS`, and **never** `DEMO`.
- Mocks render in site tokens. v1's mocks (RESEARCH B4 and B7) are the visual reference; reuse their proportions.
- Default placement fills an hm-media mount: `absolute inset-x-6 top-1/2 -translate-y-1/2 sm:inset-x-8`, unless `className` overrides it.
- Cards are white, radius 16 to 18, `shadow-mock ring-1 ring-ink/[0.06]`.
- Text inside mocks is 10 to 13px, at `ink/60` or above.

| Mock | Shows | Changes from v1 |
|---|---|---|
| `MockField` | `url`: the value with a static 1px caret (`bg-brand`), a 28px blank circle, and a "Start" pill. `handle`: the At icon, the value, and 20px Instagram and TikTok squares. | Platforms come from data, not her accounts. |
| `MockPlan` | Header "Phase 1 · Warm-up" plus the "Guaranteed" pill (`bg-good/10 text-good-deep`). "You pay" with `pay` (26px/600). "Markets" with the markets joined by ", ". "Creators" with `<Discs count>`. Hidden fields render skeleton bars (`h-2 w-16 bg-ink/6 rounded`), and each reveal cross-fades over 300ms. Then the `checks` lines: Check 12 (`text-good`) plus `text-micro text-ink/72`. | No avatars: **Discs** replace them. |
| `Discs` | `count` discs, 20px, solid #A78BFA, #7C5CE0, #4D2FB0 (cycling), with a 2px white ring, overlapping by 6px (`-space-x-1.5`, reversed in RTL). | New. |
| `MockPhases` | Per rung: "Phase n" plus the budget; a bar at `width`. Phase 1's bar uses `.grad-rule` (mock chrome); the others `bg-ink/10`. `grown`: scaleX 0 to 1, 600ms `--ease-out`, 120ms stagger. | Proportional widths (C11). |
| `MockPay` | "Due today"; total (30px/600); `` `${budget} + ${vat} VAT` ``; a card row with `•••• {last4}`; a "Pay {total}" button. | Bound `last4`. |
| `MockCurve` | v1's smooth path through the rungs, phase rules, points and the last-multiple pill. `drawn` drives `data-drawn`. | none |
| `Curve` | v1's curve (viewBox 520x260, `preserveAspectRatio="none"`), with its gradient stroke and .20 area fill, drawn by the caller at the column's width × 96px (v1's `h-24 w-full` in GuaranteePanel). Figure chrome (§2.4.2). | `drawn` prop; never drawn full bleed |
| `RoasDial` | v1's dial (sweep to the value on a min to max arc, dot, big "5x", caption). It sets `--sweep` in `style` on the `.dial-dot` element itself: `@property --sweep` does not inherit. | `drawn` prop |
| `MockRead` | Header: `title`, `sub`, `count`. Nine rows: Moon phase 4, the agent in 10px mono caps, `produces` at 12px `ink/88`. | **No read values** (C9). |
| `MockWhy` | "Why HeyMoon matched you" plus a `levelWord` chip. Four rows, shown while row < `filled` (fade-up 300ms): a Moon at 15px in `text-brand` (phase 4 when `lit`, phase 0 when not), then the label (12px `ink/88`). | **No digits, no detail lines, no meters, no weights** (C7, ruling 26). |
| `MockPicks` | `cards`: three PickCards. Each has a `ProductTile` (112px), the brand (12px/600), the campaign (12px `ink/72`), the share "12%" (22px/600) with "of every order" (11px `ink/60`), `paceBig` / `paceSmall`, and a `levelWord` chip. `rows`: tile 44px, brand and campaign, share, chip. `shown` items fade up (400ms). | **No bonus bar, no countdown, no image, no logo** (C6). |
| `MockTiers` | Rows of picks (`shown`), then the `next` row (brand, share, a "Request to join" chip with `ring-1 ring-ink/12 text-ink/72`), then the foot `restLine` (`text-micro text-ink/60`) when `showFoot`. | none |
| `MockTerms` | "Join {brand}"; "You're Pre-qualified. Pressing it joins you."; "12%" with "of every order you bring in"; "You're agreeing to" over the commits; "You're not" over the 4 notCommits, **at the same weight**; a "Join Campaign" button (static). | none |
| `MockCheck` | "Pre-upload Check"; `` `${product} · ${brand} · due in ${dueIn}` ``; the misses (label, "Fix:" fix), `shown` progressively; a chip reading `toFix(misses.length)`. | none |
| `ShareScale` | The figure ("10 to 16%", `text-figure`); a 7-tick scale (10 to 16, `mono-data text-ink/60`); per tick, `count` full Moons at 11px, stacked; "Payout on every order" (`mono-caps`) plus the note. `lit` fades the dots in by tick at a 40ms stagger. `role="img" aria-label={spoken}`. | No en dash (C4). |
| `PayoutRail` | Four 24px Moons whose final phases are [0,2,3,4], on a dotted line (`stroke-dasharray "0 6"`, `ink/16`), each labelled in `text-micro text-ink/72`. Glyphs beyond `lit` stay at phase 0. | Glyph rail replaces v1's drawn rail. |
| `ProductTile` | A `.hm-media` tile, radius 12, showing the product name (12px/600 `ink/72`), centred. | Never an image. |

**Acceptance:**

- `/lab/mocks?a=brands` and `?a=creators` render every mock in both states.
- There is no `<img>` inside `mocks/`.
- MockWhy contains no digit and no meter.
- No creators mock contains "$".
- Every root is `aria-hidden`, except the two `role="img"` mocks.
- `tsc` passes.

### 5.9 Reduced motion, no JS, no WebGL, user pause

| Effect | Default | Reduced motion | No JS | No WebGL | Paused |
|---|---|---|---|---|---|
| Lenis | lerp .1 | lerp 1, instant scrollTo (built in) | native scroll | same | n/a |
| H1 and close H2 | CSS line rise and morph | 200ms opacity crossfade | rise plays, switch navigates | same | n/a |
| Switch pill | spring .5s | instant, 200ms label colour | links navigate | same | n/a |
| Sky | canvas after idle | CSS sky, lit, no ignition | CSS sky with CSS ignition | CSS sky with ignition | frozen frame |
| World tint | 1.2s | 0.2s | n/a | CSS layers | n/a |
| Sheet lift | sticky plus clip, fades, sink | sticky only | sticky only | same | n/a |
| Toasts (≥1024 only, G10) | loop, 2 max | 2 static landed | none | loop | hidden and stopped |
| Typed placeholder | full hint in the HTML; retypes on switch (and at load only if hydrated before 580ms) | static placeholder | static placeholder | same | static |
| Window | plays once at real pace | final state | final state (SSR) | same | paused |
| Run stage | sticky, scroll-linked | stacked | stacked (no hydration means no sticky logic; it renders stacked by default) | same | n/a |
| Count-up, curve, dial | about 1.4s / 1.2s | final | final (SSR) | same | n/a |
| Orbit | revolution plus beams; nodes always full | static circle, all full | static | same | frozen |
| Glyph working | 160ms per phase | phase 2 | phase 2 | same | frozen |
| Promo | 420ms open | 150ms opacity | launcher hidden (needs JS) | same | thumbnail paused |
| Dawn | 450ms | instant navigate | form GET | CSS dawn | CSS dawn (the canvas fades out with `dawn`) |
| Footer wordmark | scroll-linked rise | static | static | same | n/a |

**The Run stage renders the stacked layout on the server and in the first client render.** It switches to sticky in an effect, only when sticky mode applies. This keeps no-JS correct and avoids a hydration mismatch.

---

## 6. Copy deck and numbers

### 6.1 Changes to approved copy (each with its reason)

| # | Where | Approved | Shipped | Reason | Status |
|---|---|---|---|---|---|
| C1 | Brands promo headline | "Watch seven agents build a campaign" (INPUTS) | Proposed: "Watch five agents build a campaign". "five" is `promoAgentWord`, derived from READ_TASKS ∪ BUILD_TASKS. | Only five agents work in what the card plays. MoonLive and MoonLearning have no work before launch (D2: credit the one doing the work). | **Proposed. Q1 for Mostafa, and it blocks WP-F** (INPUTS outranks this spec). A one-line flip in `copy.ts` if he keeps "seven". |
| C2 | Brands Run credit label and step 03 credit | Label "Agents ·"; step 03 "MoonLive AI" | Label "Done by" (A6's label); step 03 "You", so the brands line reads "Done by · You" | Step 03 is the payment. D2: no agent moves money ("Move money" is locked at Never). | **Adopted, gate G9** (it changes approved copy and adds a new brands string) |
| C4 | ShareScale figure | "10–16%" | "10 to 16%" | En dash (COPY rule) | Adopted |
| C5 | ShareScale note, and its spoken label | "One dot for each of the 16 campaigns live today." and v1's aria-label "Shares of every order across 16 live campaigns, …" | Verbatim | A fixture count stated as the real roster (D6). The aria-label makes the same claim as the visible note. | **Gate G3** before public, covering both strings. The fallbacks "One dot for each campaign in this example." and "Shares of every order across the campaigns in this example, …" [NEW] are ready in `copy.ts`; the two switch together. |
| C6 | Creators pick cards | Bonus bar "Early bird bonus" and countdowns | Removed | Bonus percentages fall outside the allowed 10 to 16% (D4). A frozen countdown is false urgency. | Adopted |
| C7 | MockWhy | Her signal details (61%, 20%, 4 a week, 25 to 34) | The four labels, each with one glyph lit from the bound `strong` flag. No weights, no meters, no digits. | Decision 7. A "35%" would read as a pay share, and a weight meter would read as her score (ruling 26). | Adopted; her `strong` flags fall under gate G5 |
| C8 | MockField platforms | Her accounts | The landing constant, asserted against the offers | Decision 7 | Adopted |
| C9 | MockRead and window rows | Her read values | `note`, then `produces` | Decision 7 and RESEARCH 5.8 | Adopted |
| C10 | MockPlan creators | 3 real avatars | 3 abstract discs, count bound | Decision 7 | Adopted |
| C11 | MockPhases bars | Fixed widths 38/68/100% | Proportional: 16/53/100% (floored) | The fixed widths misstate 1,000 : 4,000 : 7,500. | Adopted |
| C12 | Stream openers | "Opening ounass.com" / "Opening @mais.mustafa" | "Opening yourstore.com" / "Opening @yourhandle" | RESEARCH 5.8, D7 | Adopted |
| C14 | Brands guarantee ladder line (a [NEW] string in revision 1) | none | Removed | Under "Guaranteed sales" it stated Phases 2 and 3 as fact; D4 calls them indicative, offered at 80%. | Adopted |

**Rejected:**

- **C3** ("You, then four agents" on brands step 01). The approved credit stands.
- **C13** ("signs" in the brands agents body). It is approved copy, and the metaphor is not a claim.

### 6.2 `app/(site)/_site/copy.ts` (complete; WP0 types it as shown)

```ts
import type { Audience, DemoData, Rung } from "./data/types";

const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const secs = (ms: number) => (ms / 1000).toFixed(1);

export const SHARED = {
  metaDescription: "Seven AI agents run creator campaigns end to end, for brands and for creators.",       // [A7]
  switchLabel: "Who HeyMoon is for",                                                                        // [A1]
  switchOptions: { brands: "Brands", creators: "Creators" },                                                // [A1]
  announce: { brands: "Showing HeyMoon for brands.", creators: "Showing HeyMoon for creators." },           // [NEW]
  skip: "Skip to content",                                                                                  // [NEW]
  pause: "Pause animations",                                                                                // [NEW] aria-label; state via aria-pressed
  sampleRun: "A sample run",                                                                                // [NEW] frame label, region name, promo eyebrow
  runAgain: "Run it again",                                                                                 // [NEW]
  close: "Close",                                                                                           // [NEW] launcher name while open
  reading: "Reading",                                                                                       // [A1][A5]
  waiting: "Waiting",                                                                                       // [PRODUCT]
  signature: "HeyMoon.AI, a Saudi company",                                                                 // [A4][A7] gate G1
  credit: "Built by AI. Backed by HeyMoon.AI, a Saudi company.",                                            // [A4][A7] gate G1
  stages: ["Intake", "Matching", "Safety", "Creative", "Activation", "Optimization", "Learning"],            // [A4]
  footerNav: "Site",                                                                                        // [v1]
  footerLinks: { brands: "Brands", creators: "Creators", dashboard: "Dashboard" },                          // [A1]
} as const;

export const COPY = {
  shared: SHARED,
  brands: {
    meta: {
      title: "HeyMoon.AI for brands",                                                                       // [NEW]
      description: "Paste your store link. HeyMoon builds a complete creator campaign around what you sell, and guarantees the sales.", // [A4]
    },
    h1: {                                                                                                   // [A1]
      sentence: "A campaign in fifteen seconds. Sales, guaranteed.",
      desktop: ["A campaign in fifteen seconds.", "Sales, guaranteed."], gradDesktop: 1,
      phone: ["A campaign in", "fifteen seconds.", "Sales, guaranteed."], gradPhone: 2,
    },
    field: {                                                                                                // [A1]
      label: "Your store link", placeholder: "yourstore.com", cta: "Start", going: "Reading",
      invalid: "Paste a store link, like yourstore.com.", icon: "globe", action: "/brands/c", param: "read", inputMode: "url",
    },
    chips: ["No forms to fill in", "No brief to write", "No agency to manage"],                              // [A1]
    nav: { dashboard: "Dashboard", dashboardHref: "/brands/dashboard", start: "Start" },                      // [A1]; Start [NEW on brands]
    work: {
      h2: "One link. The whole campaign.",                                                                  // [A2]
      sub: "Paste your store link. HeyMoon builds a complete creator campaign around what you sell, and guarantees the sales.", // [A2]
      acts: [                                                                                               // [A2] cards, as the act rail
        { title: "HeyMoon reads your store", body: (_: DemoData) => "Catalogue, prices, voice and markets. In about fifteen seconds." },
        { title: "See everything. Before you pay anything.", body: (_: DemoData) => "The whole campaign, built and priced before you approve it: the markets, the creators, the budget and the brief." },
        { title: "Start small. Scale on results.", body: (d: DemoData) => `Your first campaign is ${d.brands.plan.pay.text}, the same for every brand. The next is offered only when this one reaches ${d.brands.unlockPct}% of its target.` },
      ],
      stamp: "Store details in",                                                                            // [NEW] + read.totalText
      try: "Try it with your store",                                                                        // [INPUTS]
      summary: (d: DemoData) =>                                                                             // [NEW] sr-only; one idea per sentence, no "·" read aloud
        `A sample run on ${d.brands.shownUrl}. ${cap(d.brands.read.agentWord)} agents read the store in ${secs(d.brands.read.totalMs)} seconds, then ${d.brands.build.agentWord} agents build the plan. ${LABELS.brands.phase(d.brands.ladder[0].phaseNo)} is ${d.brands.plan.pay.text}. Markets: ${list(d.brands.plan.markets)}. ${cap(d.brands.plan.creatorWord)} creators.`,
    },
    run: {
      h2: "From a link to a live campaign.",                                                                // [A3]
      sub: "Four steps. You decide at one of them, and it ends on the number HeyMoon guaranteed.",          // [A3]
      creditLabel: "Done by",                                                                               // [CHANGE C2]
      steps: [                                                                                              // [A3]
        { title: "Paste your store link", body: "HeyMoon reads the catalogue, the prices, the voice and the markets it already ships to.", credit: (_: DemoData) => "MoonShot AI" },
        { title: "The plan arrives, priced", body: "Markets, creators, products and the brief, with the sales figure it guarantees. Change anything.", credit: (_: DemoData) => "MoonMatch AI" },
        { title: "You start Phase 1", body: "One payment, the same for every brand. Nothing after it is charged or committed.", credit: (_: DemoData) => "You" }, // [CHANGE C2] gate G9
        { title: "The sales land on the number", body: "Three phases run to the sales HeyMoon guaranteed on your budget, at the multiple you signed.", credit: (_: DemoData) => "MoonScore AI" },
      ],
    },
    number: {
      h2: "Miss the number? HeyMoon pays the difference.",                                                  // [A4] gate G2
      body: "Every campaign comes with a sales figure, in writing, before you pay. If your sales come in under it, the shortfall is HeyMoon's to cover, not yours.", // [A4]
      eyebrow: "Guaranteed sales",                                                                          // [A4]
      figureNote: (budget: string, roas: string) => `${budget} across three phases, at ${roas}`,            // [A4]
      // No ladderLine (C14): Phases 2 and 3 are indicative (D4) and never stated beside "Guaranteed sales".
      roasH2: "You set the ROAS. HeyMoon signs it.",                                                        // [A4]
      roasBody: "Pick the multiple you want on the whole campaign. HeyMoon prices the phases to reach it, or tells you it cannot and offers the number it can stand behind.", // [A4]
      climb: "It climbs as the campaign earns it",                                                          // [A4]
      chip: (r: Rung) => `P${r.phaseNo} ${r.multipleText}`,                                                 // [A4]
      dialLabel: "Guaranteed ROAS", dialNote: "blended across all three phases",                            // [A4]
    },
    agents: { h2: "Seven agents run the campaign.", body: "Each one owns a stage, and each one signs the work it did." }, // [A4]
    connects: { h2: "Connects to the store you already have.", body: "One tap, after you pay. It reads the orders that use a creator's code, and nothing else." }, // [A4] gate G4
    close: {
      h2: "Paste your store link.", h2Phone: ["Paste your", "store link."],                                // [A4]
      note: "Nothing is charged. Nothing is published. Not until you say so.",                              // [A4]
    },
    promo: {
      headline: (d: DemoData) => `Watch ${d.brands.promoAgentWord} agents build a campaign`,                // [CHANGE C1] PROPOSED: INPUTS says "seven"; Q1 blocks WP-F
      cta: "Try it with your store",                                                                        // [INPUTS]
    },
  },
  creators: {
    meta: {
      title: "HeyMoon.AI for creators",                                                                     // [PRODUCT] existing creators layout title
      description: "Paste your handle. HeyMoon tells you which live campaigns want somebody like you, and each one pays you a share of the orders your posts bring in.", // [A7]
    },
    h1: {                                                                                                   // [A5]
      sentence: "Your posts already sell. Take a cut of it.",
      desktop: ["Your posts already sell.", "Take a cut of it."], gradDesktop: 1,
      phone: ["Your posts", "already sell.", "Take a cut of it."], gradPhone: 2,
    },
    field: {                                                                                                // [A5]
      label: "Your Instagram or TikTok handle", placeholder: "yourhandle", cta: "Start", going: "Reading",
      invalid: "Paste your Instagram or TikTok handle, or the link to your profile.", icon: "at", action: "/creators/c", param: "h", inputMode: "text",
    },
    chips: ["No sign-up to start", "No agency in the middle", "Paid on time"],                              // [A5]
    nav: { dashboard: "Dashboard", dashboardHref: "/creators/login", start: "Start" },                        // [A5]
    work: {
      h2: "One handle. Every campaign that fits.",                                                          // [A5]
      sub: "Paste your Instagram or TikTok handle. HeyMoon reads your work and brings the live campaigns that fit. Each pays a share of every order you bring in.", // [A5]
      acts: [                                                                                               // [A5] cards
        { title: "HeyMoon reads your grid", body: (_: DemoData) => "What you post, where your audience is and how you sound on camera. In about fifteen seconds." },
        { title: "Matched on influence. Not on size.", body: (_: DemoData) => "Where your audience is, how much of your grid is your own work, how steadily you post and who the brand asked for." },
        { title: "Up to three, Pre-qualified.", body: (_: DemoData) => "Those you join outright, with no brand review. Every other campaign is a request the brand answers." },
      ],
      stamp: "Your grid in",                                                                                // [NEW] + read.totalText
      try: "Try it with your handle",                                                                       // [INPUTS]
      summary: (d: DemoData) =>                                                                             // [NEW] sr-only
        `A sample run on ${d.creators.shownHandle}. ${cap(d.creators.readerWord)} agents read the profile in ${secs(d.creators.read.totalMs)} seconds. ${cap(d.creators.picks.countWord)} campaigns come back ${d.creators.match.levelWord}: ${list(d.creators.picks.items.map((p) => `${p.brand} at ${p.sharePct}%`))} of every order.`,
    },
    run: {
      h2: "From a handle to a live post.",                                                                  // [A6]
      sub: "Four steps. The agents read, match and check. Joining and reporting are yours.",                // [A6]
      creditLabel: "Done by",                                                                               // [A6]
      steps: [                                                                                              // [A6]
        { title: "Paste your handle", body: "Five agents read your last thirty posts, where your audience is, how you talk on camera and which brands are already in your grid.", credit: (d: DemoData) => `You, then ${d.creators.readerWord} agents` },
        { title: "Your matches arrive", body: "Each shows where it runs and the share of every order it pays. Up to three you join outright.", credit: (_: DemoData) => "MoonMatch AI" },
        { title: "You join the campaign", body: "Choose how often you can post, then read what you agree to and, in the same weight, what you do not.", credit: (_: DemoData) => "You" },
        { title: "Post it, then report it", body: "You post from your own account, then submit the ad. MoonWriter AI checks it against the brief and names anything missing. Once it's accepted, it counts toward your payout.", credit: (_: DemoData) => "You, then MoonWriter AI" },
      ],
    },
    number: {
      h2: "When do you get paid?",                                                                          // [A7]
      body: "Each brand funds its phase before the brief is written, and HeyMoon holds it. Orders on your code and link are counted weekly, and your share of the ones that cleared is paid that week.", // [A7]
      eyebrow: "Your payout is paid", figure: "Weekly",                                                     // [A7]
      note: "On the orders your code and link carried, once they cleared.",                                 // [A7]
      rail: ["Funded", "Held for you", "Orders counted", "Paid"],                                           // [A7]
      shareH2: "The brand sets the payout. You bring the orders.",                                          // [A7]
      shareBody: "Each campaign's share of the order value is set by its brand before anyone joins. Nothing to negotiate: a quiet week pays less, and a good one pays more.", // [A7]
      counted: "Every order is counted through", chips: ["Your code", "Your tracking link"],                // [A7]
      shareFigure: (min: number, max: number) => `${min} to ${max}%`,                                       // [CHANGE C4]
      shareLabel: "Payout on every order",                                                                  // [A7]
      // Gate G3 covers BOTH the visible note and the spoken label: they make the same "live" claim.
      // If G3 is refused, view.share() switches both to their fallbacks together.
      shareNote: (n: number) => `One dot for each of the ${n} campaigns live today.`,                       // [A7] gate G3
      shareNoteFallback: "One dot for each campaign in this example.",                                      // [NEW] gate G9; used if G3 is refused
      shareSpoken: (total: number, min: number, max: number, counts: { pct: number; count: number }[]) =>   // [A7 v1 aria-label] gate G3
        `Shares of every order across ${total} live campaigns, from ${min}% to ${max}%: ${counts.map((c) => `${c.count} at ${c.pct}%`).join(", ")}.`,
      shareSpokenFallback: (min: number, max: number, counts: { pct: number; count: number }[]) =>          // [NEW] gate G9; used if G3 is refused
        `Shares of every order across the campaigns in this example, from ${min}% to ${max}%: ${counts.map((c) => `${c.count} at ${c.pct}%`).join(", ")}.`,
    },
    agents: {
      h2: "Seven agents. None of them can act as you.",                                                     // [A7]
      body: "Each one owns a stage and puts its name to what it did.",                                      // [A7]
      locked: "Locked for every agent", never: "Never",                                                     // [A7]
    },
    connects: { h2: "Your handle is all it needs.", body: "Instagram or TikTok. Nothing to connect to start, and HeyMoon holds no password to any account you have." }, // [A7]
    close: {
      h2: "Paste your handle.", h2Phone: ["Paste your", "handle."],                                         // [A7]
      note: "No agent posts for you. No agent signs for you. No screen changes that.",                      // [A7]
    },
    promo: { headline: (_: DemoData) => "Watch HeyMoon read a grid", cta: "Try it with your handle" },      // [INPUTS]
  },
} as const;

export const LABELS = {                                                                                     // [A8] product chrome, verbatim
  brands: {
    guaranteed: "Guaranteed", youPay: "You pay", markets: "Markets", creators: "Creators",
    dueToday: "Due today", vat: (budget: string, vat: string) => `${budget} + ${vat} VAT`,
    card: (last4: string) => `•••• ${last4}`, pay: (total: string) => `Pay ${total}`,
    salesGuaranteed: "Sales, guaranteed", phase: (n: number) => `Phase ${n}`, start: "Start",
  },
  creators: {
    readingProfile: "Reading your profile", why: "Why HeyMoon matched you", requestToJoin: "Request to join",
    tiersRest: (n: number) => `${n} more, each a request to join`,                                          // [A5]
    ofEveryOrder: "of every order", ofEveryOrderYou: "of every order you bring in",
    join: (brand: string) => `Join ${brand}`, prequalifiedJoins: "You're Pre-qualified. Pressing it joins you.",
    agreeing: "You're agreeing to", notAgreeing: "You're not", joinCta: "Join Campaign",
    preUpload: "Pre-upload Check",
    checkLine: (product: string, brand: string, dueIn: string) => `${product} · ${brand} · due in ${dueIn}`,
    fix: "Fix:", toFix: (n: number) => `${n} to fix`, start: "Start",
  },
} as const;
```

**Voice check on every [NEW] string.** No em or en dashes. No exclamation marks. No banned words. Buttons are verbs with no arrows. No first person. Sentence case. "the read" is never used as a noun.

### 6.3 Stream lines the page shows (from demo.json; listed so reviewers can check them)

These lines appear in the toasts, the window status line and the rows. Each row shows the note while working and its `produces` when done.

**Brands read** (opener, then 9 units, 15,022 ms):

0. MoonShot AI · Opening yourstore.com
1. MoonShot AI · Reading the homepage → Name and positioning
2. MoonShot AI · Walking the navigation and the designer index → What you actually sell
3. MoonMatch AI · Following the footer links to live profiles → Your own channels and their reach
4. MoonShot AI · Sampling 60 product pages → Price band and median order value
5. MoonWriter AI · Counting the words your store repeats → The register a creator has to match
6. MoonShot AI · Checking delivery promises and currencies → Markets, ranked by how you serve them
7. MoonShot AI · Ranking by shelf position and restocks → The products worth putting behind creators
8. MoonShot AI · Reading last year's campaign pages → When your demand peaks
9. MoonScore AI · Checking traffic against the guarantee floor → Whether HeyMoon can guarantee sales

**Brands build**: "Five agents on your plan". The opener is "MoonShot AI · Starting from your store details". Then 7 rows, 10,768 ms:

1. MoonShot AI · Setting the campaign goals and the markets to run in → The markets Phase 1 runs in
2. MoonMatch AI · Reading your audience off your own channels → Who the creators will be talking to
3. MoonMatch AI · Matching creators whose audience is in your markets → The creators who fit your brand
4. MoonSearch AI · Vetting every match for brand and fraud risk → Competitors excluded, overlaps declared (in parallel with row 3)
5. MoonScore AI · Sizing the warm-up crew against the $1,000 Phase 1 budget → Who the warm-up briefs, and the sales HeyMoon guarantees
6. MoonWriter AI · Drafting the brief from your own product copy → What every creator must say, and must not say
7. MoonScore AI · Laying out Phases 2 and 3 behind the warm-up → The whole campaign: three phases, one at a time

**Creators read**: "Reading your profile" / "@yourhandle · five agents". Opener, then 9 units, 16,242 ms:

0. MoonShot AI · Opening @yourhandle
1. MoonShot AI · Opening the profile → Who you are, in your own words
2. MoonShot AI · Finding every account you hold → Where you publish
3. MoonMatch AI · Reading your last thirty posts → What you are known for
4. MoonWriter AI · Learning how you talk on camera → The register a brief has to be written in
5. MoonMatch AI · Finding where your audience actually is → The markets you reach
6. MoonScore AI · Reading how your posts perform → What your posts tend to do
7. MoonShot AI · Timing your posts and your turnarounds → How consistent you are
8. MoonSearch AI · Vetting your grid, and the brands already in it → Whether anything blocks a campaign
9. MoonMatch AI · Checking which brands want somebody like you → Whether HeyMoon can place you

**Creators build**: "Three agents building your profile". 4 units, 7,193 ms:

1. MoonShot AI · Setting what you are known for → Your category
2. MoonShot AI · Setting how much work you can take → Your availability
3. MoonSearch AI · Blocking the categories you cannot take → Your no-list
4. MoonMatch AI · Matching you to live campaigns → The campaigns that fit you

### 6.4 Numbers the page shows

| Shown | Value | demo.json path | Source function |
|---|---|---|---|
| Stopwatch, brands | "15.0s" (15,022 ms), always beside its label "Store details in" (page and promo thumbnail) | `brands.read.totalMs`, `.totalText` | `read_site` drained on the fake clock (`costOf` per unit) |
| Read counter | 3/4, then 4/9, ending 9/9 | `brands.read.sizes`, `.units` | `read_site` progress |
| "Four agents read your store" | four | `brands.read.title`, `.agentWord` | `rosterTitle(READ_TASKS, …)`, `countWord` |
| "Five agents on your plan" | five | `brands.build.title` | `rosterTitle(BUILD_TASKS, …)` |
| Build counter | n/7 | `brands.build.units.length` | BUILD_TASKS |
| "60" in a note | 60 | `brands.read.units[3].note` | READ_TASKS |
| "$1,000" in a build note | $1,000 | `brands.build.units[4].note` | BUILD_TASKS (assert it contains `fmtUSD(PHASE1_BUDGET)`) |
| Promo "five" | five | `brands.promoAgentWord` | agents(READ ∪ BUILD) |
| "Phase 1 · Warm-up" | | `brands.plan.phaseLabel` | `phaseTitle(1)` |
| You pay, act 3 body, Run step 03 | $1,000 | `brands.plan.pay` | `planFor(read).budget` |
| Markets | UAE, KSA, Kuwait | `brands.plan.markets` | `plan.markets` through SHORT_MARKET |
| Creator discs | 3 | `brands.plan.creatorCount` | `plan.creators.value.length` |
| "80%" | 80 | `brands.unlockPct` | `UNLOCK_AT` |
| Phases | $1,000 / $4,000 / $7,500 | `brands.ladder[i].budget` | `plan.ladder` (phasesFor) |
| Multiples | 1x / 3.7x / 6.3x | `brands.ladder[i].multipleText` | `plan.ladder` (phaseMultiples) |
| Guarantee | $63,050 | `brands.guarantee.revenue` | `ladderTotals(12500, 5)` |
| "$12,500" | $12,500 | `brands.guarantee.budget` | same |
| "5x" | 5 | `brands.guarantee.roas`, `.roasText` | `plan.guaranteedRoas` |
| Dial ends | 1x, 12x | `brands.roasScale` | ROAS_MIN, ROAS_MAX |
| Due today | $1,050 = $1,000 + $50 VAT, •••• 4629 | `brands.checkout` | `request_funding({plan, phaseNo: 1})` |
| "Seven" | 7 | `agents.length` (asserted) | AGENTS |
| Stopwatch, creators | "16.2s" (16,242 ms) | `creators.read.totalMs`, `.totalText` | `read_profile` drained |
| "five agents" | five | `creators.readerWord`, `creators.read.sub` | READ_TASKS agents, `countWord` |
| "Three agents building your profile" | three | `creators.build.title` | `rosterTitle` |
| MockWhy glyphs | 4 labels, each full when `lit` (today 4 of 4); no quantity shown | `creators.match.reasons[].lit` | `picks[0].match.signals[].strong` (gate G5) |
| "Your top three, Pre-qualified" | three | `creators.picks.title` | `chatCampaignsTitle` |
| Pick shares | 12% / 12% / 11% | `creators.picks.items[].sharePct` | `chatPicks(offersFor(profileFor(read)))` |
| Pick pace | "4 ads", "5 ads", "1 a week / 4 ads over 30 days" | `creators.picks.items[].paceBig`, `.paceSmall` | `paceOf` |
| Pick entry | 343 / 667 / 911 ms | `creators.picks.items[].enterMs` | `match_offers` (ms only) |
| Dune Run 11%; "12 more" | 11; 12 | `creators.requests` | the requests filter |
| Terms 12%; "1 Reel, 3 Stories, at 3 posts per week."; "90 days" | | `creators.terms` | `request_accept`, `bundleLine`, CADENCES |
| Check | "due in 4 days"; 3 misses; "3 to fix" | `creators.check` | DRAFTS d-2 |
| Share scale | "10 to 16%"; 16 dots; "16" in the note and the aria-label (both gate G3) | `creators.shares` | BRANDS live `perOrderPct` |
| Locks | 3 rows | `creators.locks` | DEFAULT_AUTONOMY |

### 6.5 Never on the page, and never in demo.json

**Brands:**

- `price.expected` or any sales range, including planBuild's "the likely sales higher".
- Confidence words and percentages.
- crewCost $625, CREATOR_SHARE 65%, "35% … reserve", or any creator fee.
- Creator names, handles, avatars, followers or view-through; the pool of 8.
- Any Phase 1 figure above 1x.
- "5.044x", or any decimal blend.
- ORDERS_PER_VIEW and the dashboard fixture (revenueSeries, pace, ADS).
- STRATEGY_META 3x and 8x.
- README's stale figures.
- "Ounass", ounass.com, its logo, evidence strings, "Edit" interests.
- Bestseller images.
- Any old-site or App Store stat.

**Creators:**

- Any "$".
- Median order, order forecasts, budgets, phase pots, the fixed fee.
- Bonus percentages and countdowns.
- "62% of its Phase 3 target".
- Match scores, MATCH_WEIGHTS (as numbers or as meters), PREQUALIFIED_AT, MATCH_FLOOR.
- Followers, views, CPM, "per view", a "rate" or "rate card" (D4), and reach as the pitch. These are whole words: the product label "The markets you reach" (a creators READ_TASKS `produces`) and approved copy stay.
- Anything about PEOPLE[0]: her handle, name, avatar, location, code, link, niche, voice, audience shares, paid share, cadence, follower count.
- The handles of ended brands.

**Both:**

- "fifteen seconds", or a time without its label, stamped on the plan or the campaign.
- A "Live", "Real time", "just now" or "N … ago" **badge or timestamp** on the window, the promo card or the toasts. (The word "live" in approved and product copy is not this: "a live campaign" (A3), "a live post" (A6), "the live campaigns that fit" (A5), "Report a post as live" (A7), "Matching you to live campaigns", "MoonLive AI".)
- Any count of customers, launches or creators paid.
- Logos other than the four store marks and the Instagram and TikTok platform glyphs. That includes the default Next/Vercel favicon (replaced in WP0).
- A play triangle.
- "On-demand recording" or "Webinar".
- A "©" line.

`check:site` (§7.2) tests these as the explicit patterns listed there, never as bare substrings.

---

## 7. Performance and verification

### 7.1 Budgets

> **Lead ruling, 4 Oct (after WP0).** motion + lenis is **≤ 44 kB**, attributed by module (WP0-NOTES D13): 26 kB was below the floor of §5.0.1's own imports. First load stays **≤ 160 kB**, and to keep it, **everything below the hero loads through `next/dynamic`** in `Landing.tsx` (SSR kept, so the sections paint styled before their JS arrives). Those chunks are budgeted together as **lazy site chunks ≤ 110 kB** and are deny-scanned like first-load chunks. The hero is the only builder code on the first load, with about 6.5 kB of headroom: WP1 loads `Toasts` (desktop only) through `next/dynamic` too, and keeps the sky in its own `import()` chunk.

All sizes are gzip, as reported by `npm run measure`.

| Item | Budget | How it is checked |
|---|---|---|
| `/brands` and `/creators` First Load JS | **≤ 160 kB** (stretch goal 150) | the measure table |
| Framework (Next and React) | about 87 kB, fixed | "shared by all" |
| motion (m, domAnimation, hooks) + lenis + lenis/react | ≤ 26 kB | measure attributes chunks by marker strings |
| Site code + demo.json | ≤ 45 kB (demo.json about 3 kB) | route size |
| Sky chunk | ≤ 8 kB, and **absent from first load** | no first-load chunk contains `precision highp` or `uWorld` |
| Site CSS | ≤ 18 kB | the CSS files of `/(site)/layout` |
| HTML `/brands` | ≤ 60 kB gzip | `curl -s -H 'Accept-Encoding: gzip' localhost:3005/brands \| wc -c` |
| Preloaded fonts | exactly 1 (Geist Sans) | count `rel="preload" as="font"` in the HTML |
| LCP (Fast 4G, 4x CPU) | ≤ 1.8 s; the LCP element is the H1 | DevTools Performance plus the LCP observer |
| CLS | ≤ 0.02 | the layout-shift observer, load to bottom of page |
| Switch INP (4x CPU) | ≤ 100 ms | Performance, then Interactions |
| Hydration | no task over 50 ms (1x, M1) | main-thread track |
| Canvas | ≤ 4 ms GPU per frame at DPR 1.5 (M1); 60 fps on iPhone 12-class | `?skydebug`, watchdog log |
| Blurring elements at once | ≤ 20 | spot-check during the switch |
| Realtime canvases | 1 | `document.querySelectorAll("canvas").length ≤ 1` |

**Fallback levers if over budget, in order:**

1. Split the brands and creators sections into two chunks (dynamic import keyed by audience). Prefetch the other on idle and on switch hover or focus.
2. Async LazyMotion features: `features={() => import("./motion-features").then(m => m.default)}`. The pill then needs a CSS resting position.
3. Drop Suspense per section if it adds overhead.

### 7.2 How each builder verifies (every package, every time)

1. `npx tsc --noEmit -p .` must be clean.
2. `npx next lint --dir "app/(site)" --dir scripts` must be clean.
3. Open `http://localhost:3004/lab/<wp>?a=brands` and `?a=creators`. Then add `&rm=1`, which forces the **JS** side of reduced motion (motion and `useReducedMotionPref`), and use the toolbar's pause. For the CSS side, use DevTools > Rendering > "Emulate prefers-reduced-motion: reduce" (`?rm=1` cannot reach media queries). Check every acceptance line in your §5 section, at 1440x900 and 390x844.
4. `npm run check:site` (WP0, against the dev server). It curls `/brands` and `/creators`, keeps the raw HTML, and builds the visible text by stripping `<script>`/`<style>` blocks and tags. It fails on any of these, and on nothing else (the §6.5 lists are tested only through these patterns, because "live", "reach", "views" and "rate" appear in approved copy):
   - a status other than 200;
   - not exactly one `<h1`;
   - in the visible text: `/\b(real time|just now|\d+\s*(min|mins|minutes?|hours?|days?)\s+ago)\b/i`;
   - in the raw HTML: an element whose whole text is a badge word, `/>\s*(live|live now|real time)\s*</i`;
   - in the visible text: `/webinar|on-demand recording|©/i`;
   - on `/creators` only, in the visible text: `/\b(followers?|CPM|per view|rate card)\b/i` and `/\$\s?\d/`;
   - anywhere in the raw HTML, including the RSC payload: `/\bounass\b/i`, `freshgrocer`, `/\bluna beauty\b/i`, and every handle (with and without `@`) and name in C `PEOPLE` and B `CREATORS` (read through the same jiti loader as the bind, so the list is never typed by hand);
   - in the visible text: an em or en dash, "!", "×", or a banned word as a whole word (seamless, leverage, unlock, journey, empower, robust, simply, just).
5. Only at milestones, `npm run measure` (§7.3). Never `next build` into `.next`.

**Probe snippets** (paste into the console on the page):

```js
// accelerated scroll bindings: expect "ViewTimeline" / "ScrollTimeline" (Chrome 115+, Safari 26+)
[...document.querySelectorAll("[data-probe-scroll]")].map(e => e.getAnimations().map(a => a.timeline?.constructor.name));
// LCP: expect the h1 line, startTime within ~150 ms of FCP
new PerformanceObserver(l => console.log(l.getEntries().at(-1))).observe({ type: "largest-contentful-paint", buffered: true });
// CLS: expect a sum ≤ 0.02
let cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) { cls += e.value; console.log(cls, e.sources); } })).observe({ type: "layout-shift", buffered: true });
// apex alignment: expect |Δ| ≤ 0.5
const f = document.querySelector("[data-field='hero']").getBoundingClientRect(), h = document.querySelector(".hz").getBoundingClientRect(); (f.top + f.height / 2) - (h.top + h.height / 2);
// tokens reached the browser (after the WP0 restart)
getComputedStyle(document.body).backgroundColor === "rgb(1, 3, 23)";
// stopwatch stamp
document.querySelector("[data-stopwatch]").textContent;
// no money on creators
document.body.innerText.match(/\$\s?\d/);
```

**Probe hooks.** Builders add `data-probe-scroll` to every scroll-bound element, `data-field="hero|close"` to the Field roots (WP0), and `data-stopwatch` to the stopwatch (WP2).

### 7.3 `scripts/measure.cjs` (WP0)

1. Take a lock: `fs.openSync(".next-measure.lock", "wx")`, polling while it is held.
2. Run `node scripts/bind-demo.cjs --check`.
3. Run `NEXT_DIST_DIR=.next-measure next build`. On its first run Next appends `.next-measure/types/**/*.ts` to `tsconfig.json`; commit that once.
4. Compute first load per route as the union of `build-manifest.json` `rootMainFiles` and the `app-build-manifest.json` entries for `/(site)/layout` plus `/(site)/brands/page` (and the same for creators). Gzip each chunk.
5. **Fail** on any of these:
   - any §7.1 budget is exceeded;
   - a first-load chunk contains `precision highp`;
   - a **site chunk** contains a chunk-deny string. Site chunks are the first-load files of `/(site)/layout`, `/(site)/brands/page` and `/(site)/creators/page`, plus the lazy sky chunk (found by its `uWorld` marker); if fallback lever 1 is taken, WP-F adds the two audience chunks by their webpack chunk names. **Never scan the product routes' chunks**: they legitimately contain `read_site`, `FIXTURES` and "ounass". The chunk-deny list is:
     - every handle and name in C `PEOPLE` and B `CREATORS`;
     - `/\bounass\b/i`, `freshgrocer`, `/\bluna beauty\b/i`;
     - `/read_site|planFor|DEFAULT_AUTONOMY|FIXTURES/`.

     It does **not** include `/creators/` or media extensions: site code legitimately links `/creators/c` and `/creators/login` and loads `/platforms/*.png`. (Those stay in the demo.json leak guard, §3.2, where they are never legitimate.)
   - the route table does not show `○` for `/brands` and `/creators`.
6. Print the table. Optionally serve with `NEXT_DIST_DIR=.next-measure next start -p 3005` for DevTools checks.
7. Release the lock.

### 7.4 Final QA checklist (WP-F)

**Routes and wiring:**

- [ ] `/` redirects to `/brands`. `/brands` and `/creators` are static (`○`).
- [ ] `/brands/v1` and `/creators/v1` still return 200 and look unchanged.
- [ ] `/creators/login` opens the AccountSheet.
- [ ] The switch (hero, nav and close) flips the audience with no reload, and preserves `?utm_*` and the hash. The title and the status announcement update.
- [ ] After a switch, Fast Refresh keeps the URL. A browser reload of `/creators` renders creators.
- [ ] Both fields submit with JS on (dawn, then `/brands/c?read=…` or `/creators/c?h=%40…`) and with JS off (GET).
- [ ] Back from `/c` resets the field.
- [ ] Dashboard goes to `/brands/dashboard` or `/creators/login`. The footer links work, and after a switch the footer's Brands and Creators links leave the URL and the page in step (`next/link` is lint-banned in the site, §4.4).
- [ ] The tab icon is the HeyMoon star on every route (`/brands`, `/creators`, `/brands/v1`); `app/favicon.ico` is gone.
- [ ] `lab/` is deleted. `npm run measure` passes.
- [ ] The console shows no hydration warning on either route, at desktop and phone, with the nav pause on and off (signals, playback and the typed hint all have server snapshots).

**Honesty:**

- [ ] No "Ounass", "ounass.com", real handle, real name, face or avatar anywhere, in the HTML, the JS chunks or demo.json (`check:site`, `measure`, the bind leak guard).
- [ ] Creators visible text has no "$".
- [ ] The only creators pay numbers are 10 to 16%, 12%, 11% and "Weekly".
- [ ] The stopwatch stamps the read only ("Store details in 15.0s", "Your grid in 16.2s"), on the page and in the promo thumbnail. No time ever shows without its label. Nothing stamps the plan or the campaign.
- [ ] MoonLive and MoonLearning never "work". Brands step 03 is credited to "You".
- [ ] MockWhy shows labels and lit glyphs only: no weights, meters or digits.
- [ ] The guarantee column shows no Phase 2 or Phase 3 budget.
- [ ] No logo wall, testimonial, invented metric, compliance badge, "Live" badge or timestamp, "Webinar", play triangle or "©".
- [ ] The three gradient spends only: the light behind the field (rim and halo, which fades out well before the screen edges), the rule, H1 line 2; plus the mock and figure chrome of §2.4.2 (the Curve stays inside its column). Spot-check `background-image` on buttons, the launcher, the orbit and the promo band: no gradient.
- [ ] No crescent (phase 1 or 7) as a fixed label or decoration outside the lunar divider: orbit nodes are full, run steps follow their state. Partial phases appear only as state (working, progress).
- [ ] Below 1024 there are no hero toasts. The status of gate G10 is recorded.
- [ ] Every number in the page matches §6.4 and comes from demo.json. Grep the components for numeric literals in JSX text.

**Copy:**

- [ ] Every [A*] string is byte-identical to RESEARCH 5.1 (diff `copy.ts` against §6.2).
- [ ] Every [NEW] string has passed review (§8, G9).
- [ ] `check:site` voice rules pass.

**Accessibility:**

- [ ] axe (DevTools) shows 0 serious or critical issues on both routes, at desktop and phone.
- [ ] Keyboard-only: skip link, switch (arrows), field, Start, rail buttons, run steps, orbit nodes, launcher and card (Esc), footer. The focus ring is visible everywhere.
- [ ] Screen reader (VoiceOver): one h1, sensible h2 order, the switch announced as a radio group, the window's summary read, the promo dialog named.
- [ ] Contrast floors hold (§2.1). Sample 10 small texts per surface.
- [ ] The pause control stops everything that moves for more than 5s. Nothing flashes more than 3 times per second.

**Motion:**

- [ ] Reduced motion (DevTools emulation) on both routes: no transforms, no canvas, the stacked run, the static orbit, final window and number states, 200ms crossfades on the switch (the hero H1 and the close H2 visibly fade, they do not cut).
- [ ] With motion on, a switch shows the old headline lines leaving (450ms) before they hide.
- [ ] No-JS (DevTools, then disable JavaScript): the page reads fully, both audience links work, the fields GET-submit, and the window and number show their final states.
- [ ] `?sky=css`: the CSS sky and ignition, and no canvas.
- [ ] Scroll-bound elements report ViewTimeline or ScrollTimeline in Chrome.
- [ ] Nothing animates offscreen: the Performance panel shows idle at the footer.

**Responsive** (1440x900, 1280x720, 1920x1080, 768x1024, 390x844, 360x740, and 844x390 landscape):

- [ ] No horizontal scroll.
- [ ] The field is centred on the horizon.
- [ ] The nav never overlaps the switch, and its first paint on a phone is already the phone arrangement.
- [ ] The launcher never covers a field.
- [ ] Toast lanes sit on the horizon at ≥1200 wide. There are none below 1024.
- [ ] At 844x390 the hero is not dimmed or shifted while it scrolls away.
- [ ] The window (640 to 1023), the nav (640 to 767) and the orbit (1024 to 1279) fit with no overflow.

**Browsers:** Chrome, Safari 17+, Firefox, iOS Safari (a real device if one is available) and Android Chrome. In each: the WebGL sky or its CSS fallback, Lenis, sticky, `:has()`, and `svh`.

**RTL smoke:** set `dir="rtl"` on `<html>` in DevTools.

- [ ] The layout mirrors with no overflow.
- [ ] The switch thumb and arrow keys mirror.
- [ ] URLs, handles and numbers stay LTR.

**Performance:** every §7.1 budget, measured on `.next-measure` with `next start -p 3005`.

---

## 8. Open questions for Mostafa (real forks only)

| # | Fork | Default the build ships | The alternative, and its cost |
|---|---|---|---|
| **Q1** | The brands promo headline. INPUTS says "Watch seven agents build a campaign", but the card plays the read and the plan, where five agents work. **It blocks WP-F**: INPUTS outranks this spec, so "five" ships only with a yes. | Proposed: "Watch **five** agents build a campaign" (derived, so it stays true if the rosters change) | Keep "seven". This is a one-line change in `copy.ts` (`promoAgentWord` becomes the literal "seven"). The headline then says seven agents *build*, while the thumbnail shows five of them working. |
| **Q2** | The creators read really takes 16.2s, under card copy that says "In about fifteen seconds". | Show the true **16.2s**. "About" covers it. | Retune the creators READ_TASKS weights in `app/(creators)/creators/lib/agent/tools.ts`, so the read lands at 15.0 to 15.4s and both sides stamp "15.x". That is a product change, it also changes the live product's pacing, and the bind's assertion range would then tighten to 14,500 to 15,499. |

Everything else in this spec is decided. Gate G10 (hero toasts) also needs Mostafa, but as a sign-off on a default the build already ships, not as a fork.

### Gates before the page goes public (owner sign-off; these are not forks)

| Gate | Item | Owner |
|---|---|---|
| G1 | "HeyMoon.AI, a Saudi company" (signature and credit line) | Mansour, legal |
| G2 | "HeyMoon pays the difference": cash or credits? If cash, add "In cash, not credits." | Finance, legal |
| G3 | The "16 campaigns live" claim, in **both** strings that make it: the visible note "One dot for each of the 16 campaigns live today." and the ShareScale aria-label "Shares of every order across 16 live campaigns, …". It is a fixture count. If refused, `shareNoteFallback` and `shareSpokenFallback` replace both together. | D5 |
| G4 | "It reads the orders that use a creator's code, and nothing else." | Nick |
| G5 | **Every output of matching on PEOPLE[0]'s profile**, wherever it shows (window, Run, promo thumbnail, sr summary): the picks Nabati Home, Tide Trace and Marhaba Kitchen with their 12/12/11% shares and paces, the MockWhy `lit` flags, `requests.next` (Dune Run 11%) and `requests.rest` ("12 more"); plus draft d-2 ("Linen resort set · Maison Dune · due in 4 days") | D5 |
| G6 | "A campaign in fifteen seconds." next to a stopwatch that stamps the read only | Mostafa (D5) |
| G7 | (a) The night H1 gradient variant (`#9B7BF0 → #A65FED → #F0559D`). (b) Whether the rim counts as "the glow behind the field": its halo stays under 25svh tall **and fades out about 29% of the width either side of the centre** (CSS 38% radius, shader falloff 0.10 to 0.30); only the hairline rim itself reaches the edges, as the planet's limb. (c) The lunar divider's sequence 0 to 7, the only decorative crescents left (ruling 35). | Design |
| G8 | "Sales" in the copy versus "revenue" in the contracts | Legal |
| G9 | Every [NEW] string in §6.2, including the fallbacks, plus the [CHANGE C2] brands credit "Done by · You" | COPY review |
| G10 | Hero toasts (ruling 34). They replay a sample read beside the field, and D3 records that "The live example read and the sample chips were removed from the hero; one field is the front door." The build ships them on desktop (≥1024) only, with no lane below 1024. If refused, `<Toasts>` is not mounted. | Mostafa and design |

### Product note (found while binding; not a site task)

The brands product's build roster in `app/(brands)/brands/c/page.tsx` derives its "done" rows from `BUILD_TASKS.slice(0, build.progress.done)`. But `propose_plan` streams 6 steps for 7 rows, because `safety` is applied inside `creators`. The result in the product:

- "Vetting every match…" ticks when *pricing* lands;
- every later row ticks one step late;
- "Laying out Phases 2 and 3…" never ticks while the stream runs.

The site maps the rows by the stream step instead (§3.2). The product owner should fix the roster the same way.

---

## 9. Audit log (revision 2)

Two adversarial audits reviewed revision 1: a rules audit (claims, copy, D1 to D7) and a buildability audit (it ran the bind approach from scratch files and read the installed motion 12.43.0, lenis 1.3.26 and Next 14.2.35 sources). The lead re-verified each finding against the code or the rules before ruling. Where a fix differs from the auditor's suggestion, the reason is given.

Re-verified for this log: `MATCH_WEIGHTS` (creators `lib/agent/model.ts:126`) and, through jiti, that all four of `picks[0].match.signals` are `strong`; v1's `Curve` ("A shape, not a claim") is drawn `h-24 w-full` inside GuaranteePanel; v1's `shareSpoken` says "live campaigns"; `app/favicon.ico` is Next's 25,931-byte default; `request_funding` returns `Sourced` money fields; motion's `useAnimationFrame` registers once and never pauses, and `useScroll` waits for pending refs; Lenis subtracts `scroll-padding-top` for element targets (`lenis.mjs` ~783) and its anchor handler never calls `preventDefault`; Next's patched `replaceState` dispatches `ACTION_RESTORE` with the history entry's old tree.

**Totals: 41 findings. 41 FIXED, 0 REJECTED.** (Rules M5 and buildability M8 are the same defect, fixed once.)

### Rules audit (6 medium, 9 low)

| # | Finding | Verdict | Fix, and where |
|---|---|---|---|
| R-M1 | The "16 live campaigns" claim also ships in the ShareScale aria-label, outside G3 | FIXED | `shareSpokenFallback` [NEW] added; G3 names both strings, and `view.share()` switches both together (§6.1 C5, §6.2, §4.3 view, §8 G3). |
| R-M2 | The promo thumbnail's stopwatch has no label | FIXED | The compact header carries the full stopwatch group, label plus time (§5.2.3). New acceptance: the compact never shows a time without its label (§5.7, §7.4). |
| R-M3 | MockWhy's 20-dot meters show the model's weights as if they were her scores | FIXED | Meters dropped. Four labels, each with a Moon lit from the bound `strong` flag (all four today). `weights`/`dots` removed from the types, view and bind; `reasons[].lit` replaces them (ruling 26, §3.1, §3.2, §4.3, §5.2.5, §5.8, §6.1 C7, §6.4). Bound rather than always-lit, so an unmatched signal would show unlit instead of lying. |
| R-M4 | The full-width gradient Curve is a fourth gradient spend | FIXED (the auditor's option 2) | The Curve sits in the figure column at v1's proportion (column width × 96px) and is listed as figure chrome in §2.4.2 (ruling 36, §1.5 B9, §5.4, §5.8). Option 2 keeps the product's own chart styling as a likeness. |
| R-M5 | §6.5 deny terms are unscoped and clash with approved copy | FIXED | §6.5 now forbids a "Live"/"just now"/"ago" **badge or timestamp**, whole-word creators terms, and allows the Instagram and TikTok glyphs. `check:site` tests explicit patterns only (§6.5, §7.2). |
| R-M6 | Hero toasts bring back what D3 removed, with no gate | FIXED | Gate G10 (Mostafa and design). Default: desktop (≥1024) only, no lane below 1024; if refused, `<Toasts>` is not mounted (ruling 34, §1.3, §1.4, §1.5, §5.1.1, §5.1.4, §5.9, §8). |
| R-L1 | G5 covers only Nabati Home and d-2 | FIXED | G5 now covers every output of matching on PEOPLE[0]'s profile, wherever it shows, plus d-2 (§8). |
| R-L2 | C2 changes approved copy but is marked "Adopted" | FIXED | "Adopted, gate G9"; "Done by · You" (brands) listed under G9 (ruling 28, §6.1, §6.2, §8). |
| R-L3 | The "five" promo default goes against the spec's own precedence | FIXED | C1 and ruling 12 are "Proposed". Q1 blocks WP-F, and WP-F's done-when requires the answer (§0, §4.2, §6.1, §6.2, §8). |
| R-L4 | Bind assertions missing or loose | FIXED | Added `ladder.length === 3`, the "last thirty posts" note, and `budget === PHASE1_BUDGET`. Creators range is now 13,500 to 16,499 ms (the auditor suggested a 16,499 cap; the floor also rose so the range is symmetric about fifteen). Brands keeps 14,500 to 15,499 with a corrected comment: it holds "fifteen seconds", and every "15.0s" acceptance now compares with the bound `read.totalText` instead of a literal, so no number is typed (§0 ruling 32, §3.2, §5.2.5, §5.7). |
| R-L5 | `ladderLine` states Phases 2 and 3 as fact | FIXED | Dropped (C14). `figureNote` carries the budget and multiple (§1.5, §5.4, §6.1, §6.2). |
| R-L6 | Static crescent glyphs and phased orbit moons | FIXED | Orbit nodes are always full and brightness carries state (Direction C's own mitigation). Run steps take their phase from their state. The lunar divider stays, and its crescents go to G7 (ruling 35, §5.0.2, §5.3, §5.5, §8 G7). |
| R-L7 | G7 asks about the light's height, not its width | FIXED | Shader `halo *= 1 − smoothstep(0.10, 0.30, u)` and the CSS halo narrowed to a 38% radius; both fade out about 29% of the width from the centre. G7 names the width, and the parity check samples 25% and 75% of the width (§2.3, §5.0.6, §5.1.6, §8). The falloff edges differ from the auditor's 0.25/0.5 so the shader matches the CSS halo it crossfades from. |
| R-L8 | No site icon; the default Vercel mark ships | FIXED | WP0 adds `app/icon.tsx` (a 32×32 `ImageResponse` of the star) and deletes `app/favicon.ico` (§4.1, §4.2, §6.5, §7.4). At the app root rather than an SVG in `(site)`, because no rasteriser is installed and v1 and the product carry the same default mark. |
| R-L9 | The brands sr summary packs three ideas into one sentence, reads "·" aloud | FIXED | Rewritten as the auditor proposed, with "Phase 1" from `LABELS.brands.phase(ladder[0].phaseNo)` so no number is typed (§6.2). |

### Buildability audit (4 high, 11 medium, 11 low)

| # | Finding | Verdict | Fix, and where |
|---|---|---|---|
| B-H1 | `pow` of a negative base blacks out the sky's centre on ANGLE and Metal | FIXED | `float k = (u − 0.2) / 0.08; … exp(−k * k)`, plus a rule never to `pow` a possibly negative base (§5.1.6). |
| B-H2 | Ignition animations override the `world`-bound tint opacities | FIXED | Halo, sun and rim are two levels: the outer layer carries the ignition, one inner `.hz-tint` per audience carries the `world` opacity (§2.3, §5.0.6, WP0 done-when 9). |
| B-H3 | The morph's "out" state and the reduced-motion crossfade never show (remounted nodes get no transition) | FIXED | `out` hides with a delayed `morph-hide` animation (0.6s, after the last line's 0.51s exit); reduced motion uses `morph-fade-in`/`morph-fade-out` animations (§2.3). |
| B-H4 | The Sheet cannot reach `heroExit` | FIXED | `LiftProvider` in `lib/lift.tsx` owns the sentinel ref, the sheet ref and `useScroll`, and wraps both LiftTrack and Sheet (§4.1, §4.3, §4.5, §5.0.7). |
| B-M1 | `SPRING.number` is overdamped (ζ = 3) and rests at 6.9s | FIXED | `{ stiffness: 120, damping: 22, restDelta: 0.5 }`, ζ ≈ 1.004 (§1.3, §2.2, §5.0.10, §5.4, §5.9). |
| B-M2 | Signals have no server snapshot; two Fields write the same keys | FIXED | `INITIAL` exported and used as the server snapshot; immutable updates and stable snapshot references; per-field keys `fieldFocus`, `heroFieldHasText`, `closeFieldHasText` (§4.3, §5.0.9, §5.7). |
| B-M3 | IntersectionObserver ignores the sheet covering the sticky hero | FIXED | `useUncovered(ref)` compares real rects with the sheet's top. The hero switch, the hero field and the toasts use it. It compares rects instead of deriving from `heroExit` so it also holds on short screens (§2.4.8, §4.3, §5.0.3, §5.0.9, §5.1.4, §1.5). |
| B-M4 | `next/link` desyncs URL and state after `replaceState` | FIXED | Rule 2.4.11; a shared `useAudienceLink(to, source)` in `lib/audience.tsx` gives plain anchors the switch's click handling (AudienceSwitch, Nav Wordmark, footer); `next/link` is lint-banned in the site (§2.4, §4.1, §4.3, §4.4, §5.0.5, §5.6, §7.4). |
| B-M5 | The nav's surface observer loses the remounted sections | FIXED | `swapCommit` signal bumped by Swap; the Nav re-observes on change (§4.3, §5.0.4, §5.0.5). |
| B-M6 | `useAnimationFrame` cannot pause, and resumes with a jump | FIXED | `frame.update`/`cancelFrame` in an effect keyed on `active && !hovered`, accumulating clamped deltas (§5.5). |
| B-M7 | `measure`'s deny list blocks WP0's own code | FIXED | Scan only the site's first-load files and the sky chunk, with a chunk-specific deny list; `/creators/` and media extensions stay in the demo.json guard only (§7.3). |
| B-M8 | `check:site` fails on approved copy | FIXED | Explicit pattern list, the same fix as R-M5 (§7.2). |
| B-M9 | Lenis double-counts scroll padding, bounces on anchors, clamps to a stale limit | FIXED | `anchors: false`; every helper passes a number (`yFor`, `scrollToY`); `restoreAnchor` calls `lenis.resize()` first; the SkipLink handles its own click (§4.3, §5.0.1, §5.0.4, §5.0.8, §5.3). |
| B-M10 | A `useIsPhone()` nav would reflow on phones | FIXED | Rule 2.4.10 and a `data-at-hero` attribute; the nav layout is CSS only (§2.4, §5.0.5). |
| B-M11 | The launcher's `both`-fill animations stop it from hiding | FIXED | Animations on an inner span, transitions on the button; rule 2.4.6 generalises it (§2.4, §5.7). |
| B-L1 | Short screens: dimmed hero, mismatched queries, tall-hero timeline mismatch | FIXED | One `MQ.short` (no orientation clause); a `data-lift` short-mode block in globals.css forces every binding off with `!important`; the sentinel is `h-[100svh] bottom-[100svh]`. Also `--hero-stick`, so a hero taller than the viewport scrolls to its bottom before it pins (found while fixing this) (§2.2, §2.3, §5.0.7, §5.1.1, §5.1.5). |
| B-L2 | Remounted `cv` sections lose their size, so scroll anchoring fights Lenis | FIXED | Size hints per slot and audience from a ResizeObserver, fed to `containIntrinsicSize` on mount (§5.0.4, §5.0.10). |
| B-L3 | RunStage's focus scroll defeats the click scroll | FIXED | Scroll on focus only when `:focus-visible` (§5.3). |
| B-L4 | Bind code: `as any`, `Sourced` money, the missing `DEMO` | FIXED | Cast through `unknown`; `.value` reads; `PEOPLE[0].handle` (§3.2). |
| B-L5 | Types: `sub` nullability, `Pick` shadowing, `data-invalid` strings, `--sweep` inheritance | FIXED | `sub ?? ""`; `CampaignPick`; string `data-invalid`; `--sweep` set on `.dial-dot` itself (§2.3, §3.1, §4.3, §5.0.9, §5.8). |
| B-L6 | Class shorthand; `text-mono-*` sets size only | FIXED | `.mono-data` and `.mono-timer` component classes with the mono family; rule 2.4.9; every class list in the spec now writes `text-small`, `text-micro`, etc. (§2.3, §2.4). |
| B-L7 | Bare `animate-*` classes; `?rm=1` misses MotionConfig | FIXED | `motion-safe:` everywhere; `reducedMotion={forced ? "always" : "user"}` from an effect; §7.2 says to use DevTools emulation for CSS (§2.4, §5.0.1, §5.0.5, §5.7, §7.2). |
| B-L8 | Dawn: a paused canvas never draws it; the footer stays dark | FIXED (differently) | The canvas's opacity is bound to `1 − dawn` (no frame needed), the footer is `dawn-fade`, and the Landing root's background turns #F6F4FC. Not a fixed full-viewport veil: the hero and the close are isolated stacking contexts, so a root-level veil cannot sit under the field (§1.8, §2.3, §5.1.6, §5.6). |
| B-L9 | `mediump` loses about 1.5px at the rim | FIXED | No mediump path: without HIGH_FLOAT the sky stays CSS; `NO_STARS` removed (§5.1.6). |
| B-L10 | The typed hint flashes on hydration; `usePlayback` reads storage in render | FIXED (adapted) | The SSR HTML carries the full hint and the input a `" "` placeholder (CSS hides the hint once there is a value, even without JS). After hydration it retypes only if hydration landed before 580ms, while the field is still under 40% opacity, which keeps A1's typed-out placeholder on fast loads. `usePlayback` has a `false` server snapshot (§1.4, §2.2, §4.3, §5.0.9, §5.9). |
| B-L11 | The star has two owners; widths unspecified at 640 to 1023, 640 to 767, and 1024 to 1279 | FIXED | `ui/Star.tsx` in WP0; the window, nav and orbit widths are specified, and the orbit stage scales by `k = stageWidth / 640` (§4.1, §4.3, §5.0.5, §5.0.10, §5.2.1, §5.2.3, §5.5). |
