# WP5 · Agents orbit (S6)

4 Oct 2026. Builder notes for §5.5, updated after the round 1 verification (see "Round 1 fixes" below). Files owned and changed, nothing else touched:

| File | What it is |
|---|---|
| `app/(site)/_site/agents/AgentsBand.tsx` | The section (contract export and props unchanged). Owns the cycle: `useTimeline` over the bound units, going live, the hold (hover or focus), the lock highlight, the derived states, beams, pulse and readout line. |
| `app/(site)/_site/agents/Orbit.tsx` | The 640x560 stage (phone 358x300): SVG plane (ring, inner ring, lit disc, creators fence), beams, core, seven node buttons, fence locks. One `frame.update` callback while running. |
| `app/(site)/_site/agents/Readout.tsx` | `#agent-readout`: icon, agent, stage, note or "Waiting", the 7-glyph row. Cross-fade. |
| `app/(site)/_site/agents/Locks.tsx` | Creators only: "Locked for every agent" and the three bound `DEMO.creators.locks` rows with "Never". |
| `app/(site)/_site/agents/orbit.module.css` | All geometry, states and media and container queries. §2.3 variables only; no `@apply`, no `theme()`, no new Tailwind keys. |
| `app/(site)/lab/agents/page.tsx` | Lab: both audiences (toolbar or `?a=`), motion, reduced motion (toolbar `rm`, or DevTools emulation for CSS), pause (toolbar), `&gap=1` to mount the band below the fold, a viewport of paper below it to test offscreen. |

## Round 1 fixes (verifier issues)

Probes are in `scratchpad/tools/` (`wp5v-*` are the verifier's, `wp5r2-*` are mine). Screenshots are in `scratchpad/shots/WP5/r2-*`.

| # | Sev | Issue | Result | Evidence after the fix |
|---|---|---|---|---|
| 1 | medium | Go-live glitch: one commit live on the end-of-cycle state (readout flashes the last line, the core pulses) | **FIXED** | One effect now sets `orbiting` and calls `restart()` together, so both land in one commit. It also turns orbiting off or back on if reduced motion changes at runtime. `wp5v-golive.cjs`: in the first 700 ms on both audiences there is a single readout layer at opacity 1 ("Setting the campaign goals…" / "Opening the profile") and no core or ripple animation (0 of 44 and 0 of 43 samples). Before the fix: the last unit's line at opacity 1 at 24 ms, and the core and ripple running. |
| 2 | medium | The readout's working glyph kept the shared ticker running offscreen | **FIXED** | `Readout` takes `ticking` (`active \|\| paused`). A working glyph that isn't ticking renders phase 2 (the static working phase) and leaves the ticker. `wp5v-offscreen.cjs`, offscreen: 0 `data-lit`, 0 style and 0 other mutations on both audiences (was 399 `data-lit`). `wp5r2-glyph.cjs`: offscreen, MoonWriter rests at phase 2 (`01100`) with 0 writes in 2 s. When paused mid-cycle it freezes in place (18 dots lit, unchanged for 1.5 s, 0 writes). It resumes on return (253 writes in 1.5 s). |
| 3 | medium | Back labels hidden for the agent at work, and drawn over the beam and the core | **FIXED** (and extended) | (a) The hide rule exempts the working node as well as the held one. (b) Each label sits on the side of its glyph away from the core: below a front node, above a back node, with the name next to the glyph (`column-reverse` above). The side changes only while the label is faded out: 140 ms out, move, 250 ms in. (c) Once tilted, a back label shows the name only (the role fades). (d) Near the ends of the ellipse labels lean inward, so they never reach past the orbit toward the fence's side locks or the stage edge. (e) A fence lock that a label passes over steps back to .14 (the fence is behind the orbit). A lock highlighted from its row stays on top. (f) The beam's bow eases to straight near the ends of the ellipse, where a label sits just above or below a flat beam. `wp5r2-collide.cjs` samples every 200 ms over a full revolution (125 s). It tests the visible label text against the beam paths, the core and corona, the other labels, the undimmed locks and the stage edge. Result: **0 hits** on brands and creators at 1440, 1280 and 1024. In `r2-tilt-grid.png`, MoonShot is lit with its name at the top through the whole tilt-in. `r2-hold-brands-1440-score.png`: MoonScore held at the back, its label above it, clear of the corona. Static-to-live hand-off (`wp5r2-handoff.cjs`): every glyph, label and lock moves at most 0.14 px, in LTR and RTL. |
| 4 | low | "Join a campaign, or sign anything" truncated at 360 | **FIXED** | The label wraps (`text-wrap: pretty`, no `truncate`), and rows are `min-h-11 py-2`, so single-line rows stay 44 px. At 360 that row is 58 px on two lines ("Join a campaign, or / sign anything"), scroll width equals client width, and the others are 44. At 390 all three are 44 (`r2-locks-360-crop.png`). |
| 5 | low | Phone static creators: the fence crossed the readout hairline | **FIXED, by a different route** | The suggested `PHONE.fryS = 116` would put the 270° lock at y −116, 15 units from MoonShot's glyph at −101, so the lock would sit on the glyph. Shipped instead: phone static fence fryS 128 and circle 106 x 95 (still ≈ .9). On phone, creators tucks `-8px` under the stage, not `-28px`, since the fence sits 28 units below the nodes. At 390 with reduced motion the fence bottom is at 585 and the hairline at 599 (14 px). The lock is 10 px above MoonShot's glyph. Live, the air under the picture matches brands: 54 px from the fence bottom to the hairline, against 55 px from brands' lowest glyph. The same problem existed on tablet, where the static fence ran into the copy and the hairline. Creators there tucks `4%` at both ends instead of `8%`: at 768, 19 px from the copy to the lock and 16 px from the fence to the hairline. |
| 6 | low | Lock rows are `tabIndex=0` with no action | **NOT CHANGED (lead's call)** | §5.5 asks for "focusing a row" to brighten its lock, which needs a tab stop. Kept as specified and raised under Requests. Dropping it is a one-line change. |
| 7 | low | Readout glyph row dimmed to 56%, so waiting new moons read at about .09 | **FIXED** | The `.dot` dimming is removed, so all seven glyphs are white as §5.5 says. A waiting new moon reads at its own .16 dot opacity (`r2-rm-c-390-crop.png`: 5 full and 2 faint new moons). |
| 8 | low | Orphan "in" in the brands phone note | **FIXED** | `.note` uses `text-wrap: balance`, not `pretty`. Both fix the orphan, but balance splits a two-line status note evenly. At 390 the two line widths are 175 and 160 px ("…goals and / the markets to run in"). Before: 299 and 36 px. |
| 9 | low | At 1024 the labels crowd neighbouring nodes | **FIXED** | `@container (max-width: 520px) { .role { display: none } }`. At 1024 the stage is 462 px, so labels are names only (`r2-c1024-stage.png`). The 1024 collision run has 0 hits. |

## What was built

**Data.** Brands cycles `DEMO.brands.build.units` (7 rows, 10,768 ms; safety rides the creators step, so MoonMatch and MoonSearch work together). Creators cycles `DEMO.creators.read.units` (9 rows, 16,242 ms). Marks are every unit start and end, sorted and unique; the band derives every state from the timeline's `mark` (React state that changes only on a crossing), so nothing re-renders per frame. At the end: `ORBIT.restMs` of rest (all done), then reset. MoonLive AI and MoonLearning AI have no unit on either side and never work. Every string is `COPY`, `SHARED` or a bound unit `note`; nothing is typed.

**Two modes.**
- *Static* (server, no-JS, reduced motion, and until the band is first active): a face-on near-circle (ry = .9 rx), every glyph full at white/56, every label shown (the three upper ones above their glyph), readout on MoonShot's first unit. Pure CSS: positions and label lean are custom properties in **container query units** (`cqw` of the stage), one set per geometry, so the server HTML is correct at every width without JS.
- *Live*: the first time `useActive` is true, the band flips to orbiting and restarts the cycle in one commit. The circle then **tilts into the inclined orbit** (1.8 s, ease-in-out cubic). At θ 0 and tilt 0 the positions equal the static layout exactly, labels included, so the hand-off never jumps. Then it revolves at 120 s per turn.

**Motion engineering.** One `frame.update(tick, true)` in an effect keyed on `running` (`orbiting && active && nothing held`); the cleanup calls `cancelFrame`. `tick` adds `min(delta, 40)` to a ref, so the angle resumes exactly where it stopped (hover, offscreen, pause, hidden tab). Each frame writes about 40 inline styles: node `translate3d(…cqw)`, z-index only on change, glyph scale and opacity, label transform, beam `d` and dash offsets. Attributes (`data-hidden`, `data-up`, `data-far`, `data-flip`, lock `data-under`) are written only on change. The plane (ring, disc, inner ring, fence, lock positions) is written only while it tilts. A ResizeObserver supplies `k` (stage px per design unit) and the label sizes for the lock test; both are layout reads, made there and after `document.fonts.ready`, never in the frame loop. The readout's working glyph uses the shared ticker only while the band is active, or paused (where the ticker freezes it).

**Look.**
- **Ring:** dotted (0 8, round), with a white-only vertical gradient so the near arc reads brighter.
- **Plane:** a faint lit disc and an inner dotted ring at 0.6 give the orbital plane presence.
- **Core:** opaque over deep, so back nodes pass behind it, never through. It has its 1px ring, a hairline corona 12% out and a white moonlight glow. On each landing it pulses 1 → 1.06 → 1 over 600 ms and sends out one hairline ripple.
- **Working node:** eases to full brightness whatever its depth (the agent at work is a light), with a soft white halo, its name at white/92 (never hidden) and a beam.
- **Beam:** a comet (three aligned dashes, a bright head and a fading tail) runs from the glyph edge into the core over 900 ms with an out-expo ease. A faint tether (white/.20) holds while the unit works. The bow sits on the trailing side of the node's motion and eases to straight near the ends of the ellipse.
- **Labels:**
  - Placement: on the side of the glyph away from the core (12 + 8 px below a front glyph, 12 + 6 px above a back one), with the name next to the glyph.
  - Lean: near the ends of the ellipse a label leans inward, so its outer edge stops 6 px past the glyph centre.
  - Back labels: once the orbit is tilted they show the name only, and deep at the back (sin θ < −.62) they step out unless that agent is working or held.
  - Changing side: only while faded out.
  - Never scaled or dimmed, so they keep the white/56 floor.
  - Under 520 px of stage: names only.
- **Fence locks (creators):** 14 px bold `Lock` in a 26 px deep disc (22 px on phone). A lock steps back while a label passes over it, and comes forward (z 4, white/88) when its row is hovered or focused.

**Readout.** The line under a hairline: icon, name in Geist Mono, stage, then the note (two lines reserved, balanced, so a wrap never moves the copy), then the seven 11px white glyphs (waiting 0, working cycling, done 4). On a change the old line lifts and fades in 140 ms, then the new one rises in over 260 ms after 80 ms (about 340 ms in all), and the outgoing line leaves the DOM when its fade ends.

**Layout.**
- **≥1024:** a 5/7 split at a 24px gutter inside `max-w-text`. At 1440 the band's content edge (160px) lines up with the other sections. The copy, readout and locks group is centred on the stage's height.
- **<1024:** stacked: copy, stage (centred, up to 640), readout, locks. The stage's empty top and bottom bands tuck by 8% of the width (creators: 4%, because its static fence reaches nearly to the stage edge).
- **<640:** the 358x300 stage reaches 16px into the panel padding on each side, and tucks 28px under (creators: 8px). Nodes show only their glyph and have a 44px touch target.

**Accessibility.**
- **Nodes:** seven `<button type="button" aria-label="{agent}, {stage}" aria-describedby="agent-readout">` in AGENTS order. The stage is a `role="group"` named by the H2.
- **Readout:** `aria-live="off"`.
- **Lock rows:** focusable (`tabIndex=0`) per spec. Hover or focus brightens their fence lock to white/88. Long labels wrap, never truncate.
- **Focus:** the global deep-surface violet ring.
- **Hold:** hovering or focusing a node pauses both the cycle and the revolution, and the readout shows that agent's latest note this cycle, or "Waiting".
- **RTL:** the orbit and the label lean mirror (`--flip` in CSS, `useDir()` in JS).

## Deviations from SPEC (with reasons)

1. **Beam dash math.** §5.5 gives `strokeDasharray=".25 1"` with the offset going 1.25 → 0. The pattern period is 1.25, so at offset 0 the dash is back at the node: the beam would end where it started. Shipped: a comet of three dashes with a gap of 3 (longer than the path), its head running from 0 to 1 + length over `ORBIT.beamMs` (out-expo). That is the spec's intent: one pass from the node into the star.
2. **Tether.** Added a faint line (white/.20) for the whole working unit, so the link between the agent and the core reads for its full duration, not just the first 900 ms.
3. **Bow.** The bow scales down when the chord is under 160 units (a node just above or below the core), so the curve doesn't hook. It also eases to straight as |sin θ| falls below .5 (near the ends of the ellipse). There, the trailing-side bow would lift the beam into the label sitting just above or below it.
4. **Working node ignores depth dimming.** Its opacity eases (180 ms time constant) to 1 at any depth. With `.45 + .55f`, an agent at work at the back read dimmer than idle ones at the front; §1.3 says the working agent "brightens".
5. **Labels.**
   - Not scaled or depth-dimmed (only the glyph is), so their text never falls under the white/56 floor (§2.1; axe flattens opacity).
   - Placed on the side away from the core, never always below: a label below a back node sat on the beam's path and the core's corona.
   - Back labels drop the role once tilted (a depth cue, and it keeps the name under the fence's top lock).
   - Lean inward near the ends.
   - Step out deep at the back unless working or held.
   - All labels show in static mode (the upper three above their glyph). Under a 520 px stage, names only.
6. **Fence lock occlusion.** Not in the spec. With fixed-px labels on a scaling stage, a label can't clear every lock at every width (the top lock at 1024, for example). The fence runs behind the orbit, so the lock steps back under a passing label. Over full revolutions this happens only briefly. At 1440 it never happens. At 1024 it lasts about 0.5 s per side lock, and about 1.7 s for the top lock while MoonShot works directly under it.
7. **Tilt-in.** Not in the spec. The static circle the server draws tilts into the live orbit on first activation, instead of cutting from one layout to the other.
8. **Plane and core dressing**, all white only, never the brand gradient:
   - the ring's vertical stroke gradient (spec: flat white/.10, shipped: .07 to .24);
   - the lit disc and inner ring;
   - the core corona, ripple and moonlight glow.
9. **Readout extras.** A top hairline; a balanced note; the cross-fade is a 5px lift and rise, so two notes never sit on top of each other at full strength.
10. **Spacing.**
    - **Section:** no vertical padding. Number ends with `py-24 sm:py-[120px]` and Connects starts with `py-24` plus its hairline.
    - **Panel:** content is centred vertically (`sm:flex sm:flex-col sm:justify-center`) and capped at `max-w-text`.
    - **Stacked stage:** its empty top and bottom bands are tucked by negative margins:
      - phone: −28px below for brands, −8px for creators;
      - tablet: 8% of the column width for brands, 4% for creators.

      Once tilted, the orbit fills only the middle half of the stage. Creators tucks less because its static fence fills the stage.
11. **Lock rows** are `min-h-11 py-2` (not `h-11`), so a label too long for the row at 360 wraps instead of being cut off; single-line rows are still 44 px.
12. **Static geometry** ("scaled to fit"), chosen so labels, locks, glyphs, the copy and the readout hairline clear each other at every width:
    - **Desktop:** circle rx 210 / ry 189; fence 276 / 264.
    - **Phone:** circle rx 106 / ry 95; fence 158 / 128.

## Requests to the lead

- **None blocking.**
- **Lock rows are focusable `<li tabIndex=0>`**, as §5.5 asks ("focusing a row"). They are three tab stops with no action (verifier issue 6). If you prefer, drop `tabIndex` and keep hover only. It is a one-line change in `Locks.tsx`, and the list's `aria-labelledby` stays.
- **For verifiers.**
  - In headless Chromium with `isMobile: true`, an IntersectionObserver's first entry arrives about 2.3 s late. I measured the same delay with a bare observer, outside the site. Phone captures need a wait of 3 s or more before the band goes live.
  - A long-running `page.evaluate` poll starves rAF in that harness. Use timed waits, not in-page polling, to measure motion.
  - A capture taken right after an edit to a WP5 file can catch a dev-server recompile and show the orbit live but not yet tilted. Re-run it.
- **Budget.** The band adds no dependency. Its lazy chunk carries 10 Phosphor icons: 9 agent icons and Lock. If the lazy-chunk budget gets tight, the icons are the bulk.
- **Dev console under reduced motion.** motion prints "You have Reduced Motion enabled on your device…" in dev, from `MotionConfig reducedMotion="user"`. It is not WP5 code.

## Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .` | 0 errors (whole project, at the time of this run) |
| `npx next lint --dir "app/(site)"` | ✔ No ESLint warnings or errors |
| Lab `?a=brands`, `?a=creators`, `&rm=1`, `--rm` emulation, pause, `&gap=1` | No console errors at 1440x900, 1280, 1024, 768, 390x844 and 360; the only warning is motion's dev notice under reduced motion |
| `npm run check:site` | ok: /brands and /creators 200, 1 h1, 24 handles and 11 names checked |

## Acceptance (§5.5) · PASS/FAIL with evidence

Probes: `scratchpad/tools/wp5-accept.cjs` (1440x900, motion on), `wp5-cycle.cjs`, the verifier's `wp5v-*`, and `wp5r2-*` for round 1. Screenshots are in `scratchpad/shots/WP5/`.

ACCEPTANCE_TABLE
