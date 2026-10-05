# Eclipse wave 2: AGENTS package

5 Oct. Owner: AGENTS. Files: `app/(site)/_site/hero/Agents.tsx` and `app/(site)/_site/hero/agents.module.css`. No other file was edited, and no contract change is requested. Evidence is in `$SP/w2c-agents/`, where `$SP` is the session scratchpad.

## What was built

**The clock was kept from the stopped run.** These parts are unchanged:

- `replayOf(DEMO[shown].read)` runs on `useTimeline`, with the marks, `loopGapMs: REPLAY.restMs`, and arming at `REPLAY.firstAtMs` of page life.
- `playing = armed && !switching && active && uncovered && !typing && !dawning && !going`. Here `typing` means the hero field is focused or has text, and `useTail` holds it for `REPLAY.resumeMs` after a blur.
- On a switch, `shown` lags the urgent audience by `SWITCH.replayAfterMs`. Every glint waits in the meantime, and `restart()` runs on the swap.
- `typingAgents(typed)` is computed from the field's length.
- `LAUNCH_AGENTS` applies while going or dawning, and `REST_AGENTS` applies before the clock arms.
- `setAgents` is called only while `gl && !reduced`, and is sent again when `mountKey` changes.
- The `AGENT_ORDER` vs `DEMO.agents` assertion is still there.

One change: `setAgents` now runs in a layout effect (inside the commit) instead of a passive effect. A verifier's MutationObserver on the card therefore runs after the renderer has already received the new states.

**Labels were removed.** `RingLabel`, `labelAnchor`, `LABEL`, `setLabelRect`, the rect plumbing and the `hero.module.css` `.swap` import are gone. Nothing in Agents calls an obsolete handle member.

**The DOM glints** apply only while GL is off and motion is allowed (`!gl && !reduced`):

- They are portalled into `props.stage.current` with `createPortal`.
- There is one dot per agent at `glintPoint(name)`, given in % of the stage. Its opacity is `dotOpacity(level)`, set inline with a 300 ms transition.
- The working dot (`data-w`) shows four spikes of 0.035 S (7% of the stage).
- The tint is violet on brands and pink on creators.
- All styles are inline, because the layer exists only after hydration. Each dot carries `data-glint` for verifiers.

**The card** (brands only, `card && matchMedia(CARD_MQ) && audience === CARD_AUDIENCE`, after arming) has this structure:

- **Box.** `m.div.dawn-fade.pointer-events-none.absolute.z-content`, placed by `CARD_CSS` (inset-inline-end, bottom 88, width) and `CARD.heightPx`. It carries the presence fade: in with the opener, and out over `SWITCH.textOutMs` on a switch to creators, after which it unmounts. This uses `AnimatePresence`.
- **Card.** `[data-agent-card][data-agent][data-working][data-landed][aria-hidden][data-lift][data-probe-scroll]` (`absolute inset-0 grid grid-cols-1`). It holds the dark glass from the module and the heroExit opacity `[0,1] → [1, LIFT.contentOpacity]`, which is ViewTimeline-accelerated and verified with `getAnimations()`. There is no binding under reduced motion. Padding and radius come from `CARD`.
- **Row.** It contains `<Moon working size={13}>`, the name (`mono-caps flex-none whitespace-nowrap text-white/80`) and the note (`truncate text-small text-white/88`, inside a `grid min-w-0 flex-1 grid-cols-1` cell).

**Crossfades.** The card uses two levels of `AnimatePresence` in sync mode, opacity only, 200 ms.

- A new run (a change of agent) crossfades the whole row. Each layer is laid out on its own, so the note never slides when the name's width changes.
- Inside a run, only the note crossfades. The last item's change to its `produces` counts as a note change.
- No transform is applied at any point. The MutationObserver log showed 0 transforms and one rect over a full cycle.

**Content.** The card shows `replayAt(replay, at)`. From `holdEndMs` through the rest, it shows the cycle's last item landed: its `land`, with the glyph at rest.

- `data-working` is `playing && !landed`. While the visitor types, under the nav pause, while going or off screen, the text holds and the glyph rests.
- Reduced motion shows one static card: MoonScore AI, "Whether HeyMoon can guarantee sales", with the glyph at rest and no fades.
- There is no live region and nothing is announced.

**CSS.** `agents.module.css` is one rule (the glass), 146 B raw and 159 B gz. Layout uses existing utilities that are already in the site CSS. The contract's metrics and the dots are inline.

**Two deviations from the brief:**

1. **`dawn-fade` sits on the box, not on the `[data-agent-card]` root.** Chrome starts no CSS transition on a property that a running animation drives, and the root's opacity is driven by the heroExit ViewTimeline animation. With the class on the root, the dawn cut the card to 0 in one frame. On the box it is a real 300 ms `CSSTransition`: setting `data-dawn` by hand traced opacity 1 → 0.98 at 130 ms → 0, with a `CSSTransition` in `getAnimations()`.
2. **The heroExit binding and the glass are on the card, and the presence fade is on its box.** With this split, the card's own backdrop blur never sits under an ancestor with opacity below 1 while the sheet lifts. An opacity ancestor becomes the backdrop root and kills the blur.

## Measurements

**measure, before** (`measure-before.txt`, Agents not yet mounted): first load 158.0 kB; css 25.2 kB; 12 lazy site chunks, 79.6 kB; sky 5.7 kB; ok.

**measure, after** (`measure-after.txt`, all three packages on the tree): first load 158.1 kB; css 25.5 kB; 13 lazy site chunks, 81.7 kB of 110; sky 10.7 kB ≤ 12; **measure ok**.

`next/dynamic` with `ssr: false` does **not** link `agents.module.css` in the static HTML. `brands.html` links 8 stylesheets, and `084010c8667fbb0f.css` is not one of them. The file loads with the lazy chunk instead, so AGENTS adds 0 B to first-paint CSS (W2c-9 assumed it would be linked).

**Checks:** `npx tsc --noEmit -p .` is clean. `npx next lint --dir "app/(site)" --dir scripts` reports no warnings or errors. `npm run check:site` is ok.

**regress.** `node $SP/w2c-arch/regress.cjs --card --sizes 1920x1080,1440x900,1306x800,1180x800,1024x768,900x800,390x844` reported **"regress: all checks pass"** (`regress-after.txt` and `.json`). The baseline run had 31 FAILs: STAR and CLUSTER from STAGE, plus the expected CARD failures.

Card boxes on brands (no card on creators, 900 or 390):

| Viewport | Card box |
|---|---|
| 1920x1080 | 1180..1520 × 948..992 |
| 1440x900 | 940..1280 × 768..812 |
| 1306x800 | 873..1213 × 668..712 |
| 1180x800 | 810..1150 × 668..712 |
| 1024x768 | 660..1000 × 636..680 |

- One run showed a transient `CARD 1920x1080 brands: 0 visible`. It was the first page after warm-up, and the chunk arrived late on the dev server. A re-run passed.
- One note is left: `CLUSTER 1306x800 brands: visible bottom 706.2 reaches the card top 668`. The contract allows this, and contrast there is measured below.

**A-A1** (`cardlog.cjs`, `aa1-final.txt`, /brands?sky=css at 1440x900, times are `performance.now()`). The sequence equals `replayOf(DEMO.brands.read).items`:

| t (ms) | Agent | Text |
|---|---|---|
| 2405 | | card mounts |
| 2406 | MoonShot AI | Opening yourstore.com |
| 4491 | MoonShot AI | Reading the homepage… |
| 5406 | MoonShot AI | Walking the navigation and the designer index… |
| 7008 | MoonMatch AI | Following the footer links to live profiles… |
| 8474 | MoonShot AI | Sampling 60 product pages… |
| 10543 | MoonWriter AI | Counting the words your store repeats… |
| 13129 | MoonShot AI | Checking delivery promises and currencies… |
| 14423 | MoonShot AI | Ranking by shelf position and restocks… |
| 16457 | MoonShot AI | Reading last year's campaign pages… |
| 18008 | MoonScore AI | Checking traffic against the guarantee floor… |
| 19524 | MoonScore AI | Whether HeyMoon can guarantee sales (landed, glyph at rest) |
| 24924 | MoonShot AI | Opening yourstore.com (next cycle, 19524 + 2400 + 3000) |
| 25839 | MoonShot AI | Reading the homepage… (915 ms) |

- maxCards was 1, transforms 0, and one rect (940,768,340,44).
- After the first item, every interval matches the stream within ±6 ms.
- The first opener ran 2.1 s instead of 0.9 s. This is an artifact of the headless SwiftShader environment: `boxtrace.cjs` shows no requestAnimationFrame between 270 and 4359 ms of page life while timers ran, and `lib/timeline` advances only on frames (40 ms clamp). The second cycle's opener took 915 ms.

**A-A2** (GL on, `aa2-gl.json`, 1024x768 `?tier=low`):

- 86 samples were taken while `data-working="true"`. 6 fell in the renderer's hold, where `__sky.working` is −1 by design.
- 78 samples agree with `AGENT_ORDER.indexOf(data-agent)`.
- 2 samples, 37 ms and 168 ms after a crossing, still showed the previous index. The renderer applies `setAgents`' working index on its next drawn frame, and `dbg()` reports `wk`, not the target. Under SwiftShader a frame takes 150 to 500 ms; at 60 fps the lag is at most 16 ms. Samples taken two animation frames after each mutation all agree.

**A-A3:**

- On /creators at 1440 (`aa3-creators-css.txt`, dots), the working order is MoonShot, MoonMatch, MoonWriter, MoonMatch, MoonScore, MoonShot, MoonSearch (index 2), MoonMatch, then the rest. MoonLive and MoonLearning are 0 throughout, and no card exists.
- On GL at 390x844 creators, `__sky.levels` keep indices 4 and 6 at 0.18.
- MoonSearch never appears on the brands card.

**A-A4:** at 390x844 and 900x800 there is no card, and the dots change (`aa4-390.txt`, `aa4-900.txt`). At 390x844 with GL on, `__sky.levels` change.

**A-A5:**

- **Typing** (`aa5-typing.txt`): 7 keystrokes light the glints one by one to `dotOpacity(.82)` = 0.69, with working −1. The card holds "Opening yourstore.com" with `data-working=false`.
- **Blur with the field emptied:** all glints go to waiting, and the replay resumes 616 ms after the blur. It resumes where it stopped.
- **Switch** (`aa5-switch.txt`, `fade.cjs`): click at 10017. The box's exit animation is running at 10175 (0.94), 0.61 at 10203 and 0.37 at 10226. The fade ends about 350 ms after the click on the dev server, which is 200 ms from React's commit. The unmount waited for a main thread busy with the switch. Glints wait from the click, and the creators opener starts 1053 ms later.
- **Switch back to brands:** the card returns with "Opening yourstore.com" 1077 ms after the click.
- **Nav pause** (`aa5-pause.txt`): paused at 6049. The glyph rests at 6162, and no text changes until the resume at 12027. "Walking…" then finishes at 13001, which is its remaining 877 ms.
- **heroExit:** at scrollY 449 the card's opacity is 0.678, equal to the copy column's, and it is driven by `ViewTimeline`.
- **Dawn:** a valid submit sets all dots to 1 (`LAUNCH_AGENTS`), the box dawn-fades, and the page navigates to `/brands/c?read=shop.example.com`.
- **Reduced motion:** one static card, as described above (`rm-1440.png`). /creators shows no card.

**Contrast** (`contrast.py`: the 98th-percentile text luminance against the card's median and 90th-percentile background, from 2x screenshots):

| Capture | Name | Note | Background |
|---|---|---|---|
| 1440x900, GL, rings drawn | 12.61 : 1 | 15.30 : 1 | rgb 6 6 29 |
| 1306x800, GL, rings' faded edge under the card top | 12.55 : 1 (12.35 against the p90 background) | 15.19 : 1 (14.94) | rgb 7 7 31 |

## Screenshots (in `$SP/w2c-agents/`)

| File | What it shows |
|---|---|
| `gl-1440-opener.png` / `-card.png` | 1440x900, GL with the rings, the opener card |
| `css-unit2-card.png` | A unit, "Walking the navigation and th…" with the working glyph (2x) |
| `css-landed-card.png` | The landed last item, MoonScore AI with "Whether HeyMoon can guar…" and the full moon at rest (2x) |
| `gl-1306.png` / `-card.png` | 1306x800, GL; the faded faces sit above and behind the card's top edge, and the text stays crisp |
| `brands-1024.png` | 1024x768, the card at 660..1000 |
| `creators-1440.png` | No card; the pink working glint |
| `sw-out.png` / `sw-back.png` | The switch: the card gone on creators, then back with the opener |
| `rm-1440.png` | Reduced motion: the static landed card |
| `p390.png`, `p390-creators-gl.png` | Phone: no card, glints only |
| `css-dots-ring.png` | The DOM glint overlaid on the contract ring (on the rim at −37°) |

## Open questions for the lead

1. **The promo launcher crowds the card at 1024 to 1200.** `pm-launcher` (fixed, viewport corner) sits 6 to 8 px under the card's end:

   | Viewport | Launcher | Card |
   |---|---|---|
   | 1180x800 | 1100..1156 × 720..776 | ends at 1150 × 712 |
   | 1024x768 | 950..994 × 694..738 | ends at 1000 × 680 |

   At 1440 it sits clear, outside the 1120 box. The card's position is fixed by the contract. A fix belongs to the launcher, or to a contract change, and is the lead's call (`launch-1180-crop.png`).
2. **The punchline is truncated.** The landed text "Whether HeyMoon can guarantee sales" shows as "Whether HeyMoon can guar…" at 340 px: the note gets about 191 px beside "MOONSCORE AI", and it needs about 245 px. This follows the brief (one row, an ellipsis), but it is the cycle's punchline. Two options: a wider card (`CARD.widthPx` around 400, if the column allows), or showing `land` without the name.
3. **Optional, for RENDERER.** If `__sky.working` reflected `setAgents`' target at once (`agW`, or a `workingTarget` field), A-A2 could be checked at the commit instead of one renderer frame later.
4. **Integration can drop the obsolete members.** Agents never calls `setLabelRect`, `setTyped`, `setCut`, `setFieldRect`, `LABEL` or `labelAnchor`, so they can be deleted at integration.
