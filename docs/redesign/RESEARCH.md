# HeyMoon redesign: research brief

4 Oct 2026. Design-director synthesis of 8 research sources: `google`, `awwwards`, `ai-leaders`, `mobbin-slice`, `motion-tech`, `visual`, `components-21st`, `heymoon-assets`. All 8 returned results; none is missing.

Scope: one marketing site in `app/(site)`, with a Brands | Creators switch in the hero. Stack: Next.js 14.2.35, React 18.3.1, Tailwind 3.4.19, TypeScript.

Read this together with `docs/redesign/INPUTS.md`, which lists Mostafa's must-haves:

- Both sides keep their own copy and their own working field.
- The floating promo card from writer.com, in an honest form.

---

## 0. The short version

- **HeyMoon's opening.** Nobody makes the audience switch a cinematic, hero-level moment. Agentio, the direct competitor, puts For Brands | For Creators in its nav and in its sign-up modal. ElevenLabs uses product tabs. Handshake re-skins the page from a nav dropdown. HeyMoon can own the switch.
- **What a $1B site looks like is restraint.** One headline, one field and one signature visual. Warm near-neutrals, light display weights, tight tracking, and a product you can see working.
- **HeyMoon can't use the usual proof.** It has no logos, testimonials, footage or consented faces, and it may not invent numbers. So the proof is the product working on screen with bound figures, the guarantee in writing, and the read timed on screen. Every visual is generated in code.
- **Decagon already owns "a pale full moon over a pastel horizon".** HeyMoon's moon has to be a night limb or horizon, never a full disc in a pastel sky. The crescent stays rejected as a mark.
- **Stack: keep what is installed.** That means `motion` 12.43.0 and `lenis` 1.3.26. Use one raw WebGL canvas at most, and no GSAP by default.

---

## 1. The 18 references

Deduplicated across all eight sources. Each entry names the one thing to take.

| # | Site | URL | Take this one thing | Seen by |
|---|---|---|---|---|
| 1 | Lovable | https://lovable.dev | **The field is the hero.** A large centred input card sits over a glow, with a typed placeholder cycling real examples, and nothing competes with typing. This is also the proportion reference already on record for the HeyMoon landings. | google, ai-leaders, visual |
| 2 | Linear | https://linear.app | **Per-line blur-rise H1.** The line spans are hand-authored for each breakpoint, plus one `sr-only` sentence. All motion CSS sits inside `@media (prefers-reduced-motion: no-preference)`. | all |
| 3 | Attio | https://attio.com | **Display type sized in `svh`, with tracking tied to it**: `clamp(64px, calc(16px + 5.333svh), 80px)`. It is revealed with a 1.5px blur, so the hero always fits one screen and the blur reads as focus, not smear. | motion-tech, ai-leaders |
| 4 | Vercel | https://vercel.com | **One object lit as the only light source on black.** The triangle sits in an eclipse halo, and everything else is quiet. | google, ai-leaders, visual |
| 5 | Decagon | https://decagon.ai | **Agent outcome toasts drift over the hero scene** ("Extending your rental for the weekend."). The agent's work appears as finished outcomes, not as a dashboard. Also the warning case: Decagon's hero is already a moon over a pastel horizon. | google, ai-leaders, visual |
| 6 | Cursor | https://cursor.com | **A scripted product window where agent tasks move through states** (In Progress, then Ready for Review). It sits under a deliberately small 26px headline. | google, ai-leaders, visual |
| 7 | Harvey | https://www.harvey.ai | **"Product on art".** A real product window is framed on a dark textured canvas instead of a gradient. | google, ai-leaders, visual |
| 8 | ElevenLabs | https://elevenlabs.io | **The hero tab rail swaps a whole product panel, not just the headline.** The panel is #F5F3F1 with a 24px radius. | google, ai-leaders, visual |
| 9 | Stripe | https://stripe.com | **A two-tone headline paragraph at weight 300.** The promise is in ink and the mechanism continues in a muted tone. | google, ai-leaders |
| 10 | Dia | https://www.diabrowser.com | **A curved horizon arc that crops the product, with the CTA sitting on the horizon line.** It is the modern form of the old heymoon planet horizon. | google |
| 11 | Sierra | https://sierra.ai | **A content sheet with large rounded corners that lifts off a tinted layer as you scroll.** | google, visual |
| 12 | Rox (Mobbin) | https://mobbin.com/explore/sections/5ecd9d68-8156-4307-93c9-33b61faea92e | **Agent work as a vertical chain of step cards that tick in with timestamps.** | mobbin |
| 13 | Antimetal (Mobbin) | https://mobbin.com/explore/sections/5aa60e87-1a43-492d-9616-107268d3f5ce | **One particle system reused down the page.** It morphs between shapes and ends as a dotted footer wordmark. | mobbin |
| 14 | Adaline (Mobbin) | https://mobbin.com/explore/sections/4e09d146-d3ca-4dc5-b4b3-727545614224 | **Day-to-night bookend.** The hero scene comes back at night behind the final CTA. | mobbin |
| 15 | Handshake (Mobbin) | https://mobbin.com/explore/sections/23394640-2eb7-4990-8ccc-ba67140a250c | **An audience fork above the footer.** One large card per audience, so a visitor who landed on the wrong side can choose at the end. | mobbin |
| 16 | Sunday | https://www.sunday.ai | **Hero media in a rounded card that opens to full-bleed as you scroll.** Driven by `clip-path: inset()` on a CSS progress variable, with no WebGL. | awwwards |
| 17 | Lando Norris | https://landonorris.com | **A strict four-colour palette with one electric accent, spent only on key words.** Site of the Year 2025. | google, awwwards |
| 18 | Horizon Glow Hero (21st, ruixen.ui) | https://21st.dev/@ruixen.ui/components/horizon-glow-hero | **A planet-limb glow built from three CSS/SVG layers (bloom, line, hairline).** One progress value drives each layer over its own slice. Full code was read. | components-21st |

**Technical references (sources of method, not looks).** Each is used in sections 3 and 4:

- GitHub engineering, "How we built the GitHub globe" (https://github.blog/engineering/how-we-built-the-github-globe): show a placeholder, then crossfade the canvas in; a frame-time watchdog at 55.5fps.
- Codrops, "Blurry Text Reveal on Scroll" (https://tympanus.net/codrops/2024/04/23/blurry-text-reveal-on-scroll).
- Motion's shared layout example (https://motion.dev/examples/react-shared-layout-animation).
- Lenis docs and darkroom.engineering's `satus` starter.
- GSAP SplitText docs.
- Paper Shaders (https://shaders.paper.design).
- The magicui components: Border Beam, Animated Beam, Number Ticker, Orbiting Circles and Marquee.

**The benchmark to beat (not to copy): Agentio** (https://www.agentio.com). It is the direct competitor in AI-native creator advertising and has a $40M Series B. It shows For Brands | For Creators in the nav and as a segmented choice inside its Get started modal. The execution is competent but generic: a lavender gradient, a play-button video and no motion craft. That gap is HeyMoon's opening.

**Honourable mentions (not shortlisted):**

- Epiminds: the closest product, multi-agent marketing.
- Fourmula AI: an input slot surrounded by an orbit of outputs.
- Perplexity Comet: painterly planets with orbit lines.
- Hebbia: a sculptural copper object on warm black.
- USAvionix: the same Next + R3F + Lenis stack, with scenario chapters.
- Igloo Inc. and Messenger: a single object carried through many chapters.
- Terminal Industries: an Animations score of 8.8 on an enterprise page structure.
- Wembi: a scroll-scrubbed manifesto.

### 1.1 Do not steal: research ideas that break HeyMoon's rules

The sources proposed several ideas that HeyMoon's own rules forbid (see section 5). They are listed here so no builder picks them up.

| Proposed in research | Source sites | Why it is out | Use instead |
|---|---|---|---|
| A live ticker such as "SAR earned by creators this week" or "Campaigns launched today" | Stripe, Whop, Glean | Invented metrics (D6). Creators landing: "no money figure" (D4). | Count up the bound figures only, inside mocks ($63,050, 5x, 10 to 16%, Weekly) |
| A GCC brand logo wall or marquee, "Trusted by…" | Agentio, Cerebrium, Terminal, Butter | No customers on record. The Ounass logo needs permission (E2). | The "Connects to" store marks: Salla, Zid, Shopify, Magento (E1) |
| Documentary creator footage, creator photo heroes, or floating creator video tiles | Sierra, Runway, Granola, Paraform | Real people with no consent on file (D7). The 48MB of `public/ads` needs consent from the creators and from Ounass (E2). | Code-generated visuals and bound mocks |
| A creator-card marquee with avatars, handles or earnings | Passionfroot, 21st Blurred Marquee | Faces, names and money figures (D4, D7) | None. "It is not a marketplace: no roster, no grid of faces" (D3) |
| An earnings slider or ROI/ROAS calculator | Paraform, Terminal, Cerebrium | "There is no slider; numbers are set in conversation". Creators: "an earnings calculator before joining" is banned (D4). | The bound RoasDial at 5x, and ShareScale |
| Benchmark bars such as "HeyMoon 6.1x vs agency 1.8x" | Cerebrium | Invented comparative numbers (D6) | None |
| Testimonial walls, famous-founder quotes, a press strip, old-site testimonials | Cursor, Harvey, Epiminds, moontech.co | No consent, and they were about MoonTech (D7) | None, until real consented quotes exist |
| A serif display, or a serif accent on the money line | Harvey, Granola, Dia, Comet, Hebbia, Rox, Giga, Paraform, Lando | The NO-serif decision (D3) | Geist at a light or in-between weight with tight tracking, plus Geist Mono labels |
| A crescent as the mark or as a sculptural hero object | ai-leaders synthesis, Hebbia-style | Crescent "read as night, not as intelligence" (C4) | The four-point star stays the AI core. A moon or planet may be a stage, never the logo. |
| A pale full moon in a pastel sky | Decagon | Derivative of a known agent company | A night limb or horizon, or an eclipse rim |
| A different gradient per agent (earthy bento, seven coloured orbs) | Sierra bento, ElevenLabs orbs | "ONE accent gradient, spent in three places only" (D3) | Monochrome agents; the gradient only where the rule allows |
| A full-bleed aurora or mesh-gradient background | Lovable bloom, Paper MeshGradient | "Never a background wash" (D3) | The existing `hm-glow` behind the field |
| Compliance badges (SAMA, PDPL, ZATCA), funding announcement bar, "X Saudi brands launched" | Sierra, Harvey, Glean | None of these are on record | "HeyMoon.AI, a Saudi company", pending sign-off (D5) |
| A preloader, hold-to-launch, ambient sound | Lando, Why Zero, iyO | Hurts LCP, and gimmicky for a "busy, suspicious founder" (D1) | Hero renders at first paint |
| "Sign up with Google" in the hero | Stripe, Claude.com | The fields must submit to `/brands/c` and `/creators/c` (F) | The field only |
| A rotating word in the H1 ("Your posts already [sell / earn]") | WRITER | The approved H1s are copy decisions (A1, A5) | Keep the H1s verbatim |

---

## 2. What the $1B AI sites have in common

### Structure

- **The product companies follow a near-fixed order:** announcement bar, hero, logo strip directly under the fold, metric case cards (a logo plus one big number), named testimonials, stats band, security badges, changelog or news, then a final CTA that repeats the hero line.
  - Seen on Decagon, Attio, Harvey, Vercel and Sierra.
  - Attio's page is 17,204px tall, but each section makes exactly one claim.
- **Mid-page stories use a sticky list with one swapping panel**, not feature grids:
  - Dia: a numbered list from 01 to 0n, plus a docked CTA pill.
  - Lovable: a gradient underline that fills as you go.
  - Cerebrium: a scrollspy that greys out inactive items.
  - Decagon: a vertical dot timeline.
  - Sierra: a sticky `h-screen` product studio.
- **Pages end where they began:**
  - Decagon repeats its hero line.
  - Adaline returns to the hero scene at night.
  - Antimetal ends on a dotted wordmark.
  - Linear and Vercel set a giant wordmark in the footer.
- **Splitting by audience is a known pattern, but only at nav or footer level:**
  - Two nav items: Passionfroot, Agentio, Paraform.
  - A nav dropdown that re-skins the page: Handshake.
  - A segmented choice inside the CTA modal: Agentio.
  - A fork above the footer: Handshake.
  - Product tabs in the hero: ElevenLabs.
  - No AI or SaaS site in the public Mobbin library, and none of the AI leaders, puts a true Brands | Creators segmented control in the hero itself. HeyMoon should use all of these layers at once (section 6).

### Hero

- **One headline, one CTA pair or one field, one visual.** The counter-example is WRITER (popups, a chat widget, a cookie modal and floating cards all competing), which reads as a template.
- **Headlines are smaller and lighter than people assume:**
  - Cursor 26px
  - Runway 37-40px
  - Sierra 44-65px (two captures disagree; viewport emulation differed)
  - Stripe and ElevenLabs 48px at weight 300
  - Linear 64px at 510
  - Vercel 64px at 400
  - Decagon 72px at 500
  - Clay 88px at 575
  - Butter 105px at 400 (an Awwwards site)
- **The input is the hero:** Lovable's prompt card, OpenAI's "What can I help with?", Perplexity, Manus' "What can I do for you?", and Decagon's inline email pill. This maps directly onto "paste your store link" and "paste your handle".
- **The hero is often an inset framed card** with an 8-16px gutter and a roughly 20-24px radius: Decagon (12px), Runway, Wembi, Cerebrium.
- **Two-beat lines:** "Better outcomes. Built on Sierra." and "Built to think. Born to haul." (Waabi). HeyMoon's "A campaign in fifteen seconds. / Sales, guaranteed." and "Your posts already sell. / Take a cut of it." already fit. Keep them.

### Proof

- **Logos sit right under the hero:** Cerebrium 12, Decagon 24+, Terminal 20+, Butter 25+, Harvey 40+.
- **Numbers are specific:** Decagon "70%" and "80.9% resolution", Harvey "3,000+ Legal Organizations", Cerebrium "3.8s vs 156s".
- **Numbers move:**
  - Stripe ticks "Global GDP running on Stripe".
  - Glean counts tokens saved.
  - Shopify's globe draws arcs from real orders streamed in over SSE.
- **Speed is made visible:** Linear stamps "Worked for 8 sec", and Character.AI says "ten seconds".
- **Outcome pricing appears on the homepage:** Sierra's "Pay for a job well done". This validates putting HeyMoon's guarantee front and centre.
- **The agent appears as outcomes inside a scene:** Sierra's glass chat bubbles over video, Decagon's toasts over WebGL.
- **HeyMoon's translation.** Logos, testimonials and live counters aren't available, so the proof stack is:
  1. The product working on screen, driven by the bound fixtures.
  2. The guarantee in writing, with the bound figure ($63,050 on $12,500 at 5x).
  3. The read timed on screen. It is tuned to about 15s; the plan adds about 11s, so the timer must claim only the read (D5).
  4. The "Connects to" store marks.
  5. On Creators, the three "Never" locks as trust proof.
  6. "HeyMoon.AI, a Saudi company", pending sign-off.

### Motion

- **The product companies on Next.js stay restrained:** CSS/WAAPI or Motion, blur-in lines, product UI moving through states, looping video, and one custom canvas. Seen on Sierra, Cursor, Linear, Attio, Vercel and ElevenLabs. None scroll-jacks or pins a long story on the homepage.
- **Award sites run Lenis + GSAP ScrollTrigger + SplitText**, with pins and page transitions, mostly on Webflow or Astro: Lando, Wembi, Mistral, Clay, Terminal, Cerebrium, L.I.S.A.
- **Next.js award sites use Motion `useScroll` or R3F with Lenis:** Waabi, Sunday, USAvionix, Butter.
- **Awwwards sub-scores:** Animations is always the highest (8.2-8.8) and Accessibility the lowest (6.2-7.2). Proper reduced-motion support, focus states and semantic markup would set HeyMoon apart.

### Type

- **Light or in-between display weights:** Stripe, ElevenLabs and Cerebrium at 300; Sierra and Vercel at 400; Linear at 510; Clay at 575.
- **Tracking runs from -0.02em** (Sierra, Linear) **through -0.04em** (Decagon, Clay, Factory) **to -0.06em** (Vercel).
- **Monospace micro-labels:** Linear's Berkeley Mono "FIG 0.1", Factory, Cerebrium's Suisse Mono, Glean's eyebrows.
- **Many leaders went serif.** HeyMoon decided against it (D3). Its premium signal is:
  - Geist at an in-between weight with tight tracking. GeistSans in this repo is variable, `weight: "100 900"` in `geist` 1.7.2, so 450-520 is available at no cost.
  - Geist Mono for agent labels.
- **What dates the old moontech.co** is Manrope 700 at normal tracking.

### Colour

- **Neutrals are warm, never pure:**
  - Darks: Cursor #14120B, Harvey #0F0E0D, Hebbia #0E0B0B, Linear #08090A, Mistral #101013.
  - Papers: Anthropic #FAF9F5, Dia #FBFAF6, ElevenLabs #FDFCFC, Cognition #F7F6F5, Harvey #FAFAF9.
- **Light and cream dominate among the leaders.** Pure dark is mostly dev tools.
- **Colour comes from one signature object** while the UI stays monochrome: Stripe's wave, Lovable's aurora, ElevenLabs' orbs, Vercel's halo, Mistral's pixels.
- **Award sites use near-black plus exactly one saturated accent.**
- **HeyMoon's existing system is already on-pattern:** paper #FCFBF8, ink #12151B, deep #141229, and one gradient spent in three places.

### What reads as cheap

- Popups, a chat widget and floating cards competing in the hero (WRITER).
- Weight 700 headlines.
- Long hero paragraphs and emoji problem cards (the old moontech.co).
- Scrolling logo marquees. The leaders use grids of equal tiles.
- A looping shimmer.
- Banding in dark glows. Fix it by dithering ±0.5/255 in the shader.
- Large travel distances on reveals.

---

## 3. Motion language

### 3.1 Principles

1. **Motion explains the product.** Every animation either shows a bound agent step or moves attention to the field. Nothing loops without pausing when offscreen.
2. **Arrive, don't fly.** Travel is at most 20% of the line height (4-12px). Blur is 1.5-4px on display type and 6-8px on body words, and never 10px on 64px+ type.
3. **One switch, one world.** The audience value drives everything at once: H1, sub, field icon and placeholder, CTA label, chips, the canvas tint, the proof, and the promo card.
4. **Native scroll, no hijacking.** Lenis smooths the real document scroll. Pinning is done with CSS `position: sticky`. If snapping is used at all, it is `proximity`, never `mandatory`.
5. **Static is the default and motion is opted into.** Motion CSS lives inside `prefers-reduced-motion: no-preference` or Tailwind `motion-safe:`.
6. **Numbers never overshoot a guarantee.** A spring that passes $63,050 and settles back has briefly shown a figure HeyMoon did not guarantee. Count-ups and dials on guaranteed figures are critically damped.

### 3.2 Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(.16,1,.3,1)` | Arrivals: H1 line rise, toasts, step cards, beams, "data arriving" |
| `--ease-out` (house) | `cubic-bezier(.22,1,.36,1)` | UI state: the existing AudienceSwitch 240ms, word blur-in, sheet, reveals. Fold the current `.2,.8,.2,1` (`.reveal`) and `.22,.8,.2,1` (`.draw`) into this one. |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | World changes: canvas tint, horizon position on switch |
| `--ease-exit` | `cubic-bezier(.7,0,.84,0)` | Outgoing headline lines |
| `spring.pill` | `{ type:'spring', bounce:.18, duration:.5 }` | Brands \| Creators thumb (`layoutId`) |
| `spring.number` | `useSpring` damping 60, stiffness 100, no overshoot | Count-ups (magicui Number Ticker) |
| `dur.micro` | 150-250ms | Colour and state crossfades, hover, focus; also the reduced-motion swap |
| `dur.ui` | 300-500ms | AnimatePresence swaps (300-350), outgoing lines (450), pill (500) |
| `dur.reveal` | 600-800ms | Word blur-in (600, 35ms stagger), incoming lines (800, 60ms stagger, 120ms delay) |
| `dur.hero` | 1.1s | H1 line rise: 90ms stagger starting at 120ms, in CSS |
| `dur.draw` | 1.1-1.3s | Count-ups (existing), SVG draw (`pathLength=1`, 1.2s) |
| `dur.world` | 1.2s | Canvas crossfade after its first frame; canvas tint change |
| `dur.step` | 7s | Run auto-advance (existing `STEP_MS 7000`) |
| ambient | 3.6s / 8s / 60s | Spoke pulse 3.6s; canvas breathe 8s; ring 60s; border beam 8s idle, 3s on focus |

The hero entrance budget: the H1 is fully readable within about 1.0s of first paint, and the canvas is in within about 2s. Nothing gates reading.

### 3.3 Named techniques

| Name | What it is | Spec | Trigger |
|---|---|---|---|
| **Line rise** | Masked per-line H1 entrance (Linear) | `.line{display:block;overflow:clip;padding-bottom:.08em}`, `@keyframes rise{from{transform:translateY(105%)}}`, 1.1s `--ease-out-expo`, delay `calc(120ms + var(--i)*90ms)`. A blur-rise variant: `opacity 0, blur(2-4px), translateY(20%)`. Pure CSS so LCP isn't gated on hydration. | Load |
| **Odometer morph** | Brands↔Creators headline swap | Both headlines are server-rendered in one grid cell (`[grid-area:1/1]`), so neither shifts layout. The inactive one gets `aria-hidden` and `inert`. Out: `y:-100%, opacity 0`, 450ms `--ease-exit`. In: `y:0`, 800ms `--ease-out-expo`, 60ms stagger, 120ms delay. Motion takes over only after the first toggle (`initial={false}`). | Click |
| **Pill** | Shared-layout thumb (Motion example, 21st Segmented Control) | `<LayoutGroup id="audience">` with `layoutId="pill"`, `spring.pill`, and a 250ms colour crossfade on labels. Arrow keys, Home and End use a roving tabindex. `layoutRoot` goes on the sticky nav copy. | Click / key |
| **World tint** | The canvas reacts to the switch | `animate(tintMV, BRAND\|CREATOR, {duration:1.2, ease:[.65,0,.35,1]})`, read in the draw loop as `uTint`. Never through React state. | Click |
| **Word blur-in** | Section titles and subs | Words split in JSX with real spaces kept. `whileInView`, `viewport={{once:true, amount:.6}}`, `staggerChildren:.035`. Each word goes from `opacity 0, blur(8px), y .3em` to sharp in 600ms `--ease-out`. At most about 20 words per block. Never split Arabic into characters. | Enter, once |
| **Manifesto scrub** | Codrops / Wembi word-by-word | `useScroll({target, offset:['start end','end end']})`. Each word maps opacity `[.15,1]` and filter `blur(6px)→blur(0px)` over `[i/n,(i+1)/n]`. Runs on the compositor in Chrome 115+ and Safari 26+. | Scroll-linked |
| **Sticky stage** | 4-step Run or 7-agent chapters | `<section style={{height: steps*90 + 'svh'}}>` around `<div className="sticky top-0 h-svh overflow-clip">`, with `offset:['start start','end end']`. The active step comes from `useMotionValueEvent` and renders at most 7 times. The rail is a `scaleX` transform string. Under 768px use `steps*70svh` or unpin. | Scroll-linked |
| **Sheet lift** | Sierra's rounded sheet | A paper sheet with a 32px top radius rises over the dark hero layer. Translate and `clip-path` are bound to progress; no layout reads. | Scroll-linked |
| **Card to bleed** | Sunday | A rounded media card opens to full-bleed through `clip-path: inset(var(--p))`. | Scroll-linked |
| **Agent chain** | Rox / Cursor / Linear | Step rows tick in with an agent name in Geist Mono caps, an elapsed time in `tabular-nums`, and a dot-matrix "working" glyph (Linear: `upDown` 2.8s, `pong` 1.6s). Paced by the existing `useSchedule` and `costOf`; paused offscreen. | In view |
| **Outcome toast** | Decagon | A glass toast arrives with `y 8px→0`, `blur 4px→0`, 500ms `--ease-out-expo`, holds 3-4s, and exits to opacity 0. At most 2 visible. Text uses product labels verbatim. | Timed loop, paused offscreen |
| **Beam** | magicui Animated Beam | A quadratic Bézier between real DOM nodes, recomputed by ResizeObserver. The gradient stroke runs `x1 10%→110%` with `--ease-out-expo`, staggered 0.3s per node. Runs only in view. | In view |
| **Field beam** | magicui Border Beam | `offset-path: rect(0 auto auto 0 round 24px)` with `offsetDistance` 0→100%: 8s idle, 3s on focus, one burst on submit. Fallback: a conic border on `@property --angle`. | Ambient / focus |
| **Count-up** | Number Ticker | `useSpring` writes `textContent` directly (no React renders), with `tabular-nums` and `useInView({once:true})`. Bound figures only. | Enter, once |
| **Draw** | Existing `.draw` | `stroke-dashoffset` with `pathLength=1`, 1.2s. `.draw-fill` fades in after 450ms. | Active / enter |
| **Gradient sweep** | Once, on the gradient line | `background-position` 100%→0 over 1.8s, starting 1.2s after the line rise. **Never looped**: a looping shimmer reads as cheap. | Load, once |

### 3.4 What is scroll-linked, what is triggered, what is ambient

| Scroll-linked (bound to scroll progress) | Triggered (plays once on load, enter, click or submit) | Ambient (loops, must pause offscreen and in hidden tabs) |
|---|---|---|
| Canvas `uScroll` (horizon sinks or brightens as the hero leaves) | H1 line rise (load) | Canvas breathe and star twinkle |
| Sheet lift and card-to-bleed | Odometer morph, pill, world tint (switch) | Field beam |
| Sticky stage step and progress rail | Section word blur-in (enter, once) | Constellation ring 60s and spoke pulse 3.6s |
| Manifesto scrub | Count-ups, draws, dial (enter, once) | Outcome toasts |
| Footer wordmark rise and un-blur | Agent chain, beams (in view) | Run auto-advance 7s (hover pauses it, click takes over) |
| | Submit: "Start" becomes "Reading", the field beam bursts, then the route changes | |

Anything that moves for more than 5s needs a pause path. That means hover and focus pause, plus a visible control for the toast loop and the Run (WCAG 2.2.2). Nothing may flash more than 3 times per second (2.3.1).

### 3.5 Scroll acceleration rules (checked against the installed motion 12.43.0)

Checked in `node_modules` today:

- `framer-motion/dist/es/value/use-scroll.mjs` has `canAccelerateScroll` and `offsetToViewTimelineRange`.
- `motion-dom/.../accelerated-values.mjs` lists exactly `opacity, clipPath, filter, transform, backgroundColor`.
- `use-transform.mjs` passes acceleration on only when all of these hold:
  - the input is not a function;
  - the ranges are arrays;
  - `clamp` is not `false`;
  - `!isTransformed`, which means only one `useTransform` hop.

So the motion-tech recipes, written against 14.0.0 source, also hold on the installed version.

To get the compositor (jank-proof) path:

1. Use a page-level `useScroll()` with no offset, or a target whose offset uses only `start`/`end` container edges. These qualify: `['start start','end end']`, `['start end','end start']`, `['start end','end end']`. A `center` edge, px or vh values fall back to JS silently.
2. Bind the value directly or through **one** `useTransform` with array in and array out. A function transformer, `clamp:false`, `useSpring`, or a second chained transform drops to JS.
3. Animate only `opacity`, `clipPath`, `filter`, `transform` or `backgroundColor`. The `x`, `y` and `scale` shorthands are **not** accelerated. Write `transform: useTransform(p,[0,1],['translateY(0px)','translateY(-120px)'])` instead.
4. Browser support: Chrome/Edge 115+ and Safari 26+. Firefox falls back to JS automatically.

Lenis already lerps, so `useSpring` on scroll progress is rarely needed.

### 3.6 Reduced motion

1. Author motion as opt-in, inside `@media (prefers-reduced-motion: no-preference)` or with `motion-safe:`. Also fix the known brands Constellation bug: it uses `motion-safe:hm-*` on plain CSS classes, so its animations never run.
2. Leave Lenis 1.3.26 at its default `respectReducedMotion: true`. That forces `lerp` to 1 and makes `scrollTo` and anchors instant.
3. Use `<MotionConfig reducedMotion="user">`. It disables transform and layout animation but **not** scroll-linked bindings or filter tweens. So gate parallax, pinning, the manifesto and blur reveals with `useReducedMotion()`:
   - pinned stage → a stacked list;
   - blur reveals → opacity only;
   - manifesto → fully lit text.
4. Canvas: draw one frame at a fixed `uTime` and stop, with no mouse or scroll coupling. Or keep only the CSS sky. Listen for live `matchMedia` changes.
5. Keep 150-250ms opacity crossfades for state changes, so the Brands↔Creators switch is still perceivable.
6. Test with DevTools "Emulate CSS prefers-reduced-motion" **and with JS disabled**. The page must read fully: CSS sky, visible headline, both audiences reachable by link.

### 3.7 Performance budget (p75, field data)

| Metric | Core Web Vitals "good" | HeyMoon target |
|---|---|---|
| LCP | ≤2.5s | ≤1.8s on 4G mid-range Android. Measure under throttling; the audience is on Saudi and UAE mobile networks. |
| INP | ≤200ms | ≤100ms |
| CLS | ≤0.1 | ≤0.02 |
| Lighthouse mobile | | ≥90 |
| First-load JS (gzip) | | ≤160 kB. Next 14.2 baseline is 87.4 kB, Lenis + Motion with `domMax` measured about 31 kB, leaving about 40 kB for our code. The canvas is its own lazy chunk, loaded after idle. |
| Realtime canvases | | 1 per page. DPR ≤1.5, at most about 2.2 MP. GPU at most about 4ms per frame on M1, and 60fps on iPhone 12-class devices. Paused offscreen and in hidden tabs. |
| Main thread | | No task over 50ms during hydration. At most about 20 elements blurring at once. No scroll listener that calls `setState`. No layout reads after writes. |

Further rules:

- **LCP element:** the server-rendered H1 text, animated in CSS. Never the canvas, and never a JS-gated `opacity:0`. Motion's `initial` is server-rendered as inline style, so it would hold back LCP until hydration.
- **Fonts:** load through `next/font` (already done with `geist`), with at most 2 preloaded weights.
- **Below the fold:** non-sticky sections get `content-visibility:auto; contain-intrinsic-size:auto 900px`. Never apply it to the pinned section.
- **Watching the frame rate:** if the average over 50 frames falls below 55.5fps, step DPR down 1.5 → 1.0 → 0.75 (the GitHub globe method).
- **The audience switch:** `selected` updates urgently and drives the pill and the hero. Below-the-fold sections read `useDeferredValue(selected)`, so the next paint lands well under 100ms.

### 3.8 Arabic and RTL

- Never split Arabic into characters, because that breaks cursive joining. Split by word or line only.
- Mirror every `x` direction under `dir="rtl"`.
- `.num` keeps digits LTR with `unicode-bidi: isolate`.
- RTL leading is 1.2-1.25 with normal tracking (C3).
- Brands has a first-pass Arabic; Creators has none (D5).

---

## 4. Recommended stack

| Package | Version | Status in repo | Role | Why |
|---|---|---|---|---|
| `next` | 14.2.35 | installed | App router, static prerender of `/brands` and `/creators` | Keep. No change needed for any technique here. |
| `react` / `react-dom` | 18.3.1 | installed | | React 18.3 has no boolean `inert`. Pass `inert={active ? undefined : ''}` and add a TS augmentation. |
| `tailwindcss` | 3.4.19 (`^3.4.1`) | installed | Styling via `tailwind.site.config.ts` (`@config`) | 21st components use Tailwind v4 syntax (`size-(--x)`, `bg-linear-to-l`) and must be ported. A **new** config key needs a dev-server restart. |
| `lenis` | **1.3.26**, pin exact | installed `^1.3.26`, unused | Smooth native scroll | It moves the real document, so `position:sticky`, IntersectionObserver, native ScrollTimeline and Motion `useScroll` all work with no proxy. That is why to pick it over transform-based smoothers. |
| `motion` | **12.43.0**, pin exact | installed `^12.43.0`, unused | UI motion, `useScroll`, `layoutId`, AnimatePresence, `frame` loop | Already installed, battle-tested, and it has the same accelerated-scroll path as 14 (verified, 3.5). **14.0.0** (published 2026-10-02) passed motion-tech's scratch build on Next 14.2.35 + React 18.3.1. Upgrade once it has a few weeks of use. Note: v13 removed the optional `@emotion/is-prop-valid`. |
| `geist` | 1.7.2 | installed | Geist Sans (variable 100-900) and Geist Mono | Hierarchy from one variable family (Glean pattern). Mono for agent labels. |
| `@phosphor-icons/react` | ^2.1.10 | installed | Agent and UI icons | Existing icon set (B4). |
| Raw WebGL2, with WebGL1 fallback | no dependency | to write | The one hero canvas: a full-screen triangle and one fragment shader | A renderer library for a single triangle is overhead. The shader is a handful of `exp()` calls per pixel, under 2ms at 1.5 DPR on Apple Silicon. |

**Not adopted by default:**

| Package | Version | Decision | Reason |
|---|---|---|---|
| `gsap` + `@gsap/react` | 3.15.0 / 2.1.2 (all plugins free since 3.13) | Escape hatch only | Measured at **+77 kB gzip** of first-load JS (119 → 196 kB in the scratch build). That is nearly twice the 40 kB headroom. Adopt only for runtime SplitText on CMS copy, or for a snapped pinned timeline CSS sticky cannot express. If adopted: `gsap.ticker` drives `lenis.raf(t*1000)` (never also autoRaf or Motion's frame), `lenis.on('scroll', ScrollTrigger.update)`, `lagSmoothing(0)`, no `scrollerProxy`, no `normalizeScroll`, and `useGSAP` with `gsap.matchMedia()` for reduced motion. |
| `ogl` | 1.0.11 | No | A wrapper we don't need for one triangle, and it does **not** handle WebGL context loss (still a TODO in its source). |
| `three` / `@react-three/fiber` | not measured here | No | No meshes are needed. A signed-distance-field shader draws spheres, limbs and orbit lines in one pass. It would not fit the about 40 kB headroom. Reconsider only if Direction C needs real 3D. |
| `@paper-design/shaders-react` | 0.0.81 | Optional, pin exact | Pre-1.0. Allowed only as a *replacement* for the single canvas, never as a second one. A `MeshGradient` background would break "never a background wash". Its lifecycle code (IntersectionObserver and visibility pause, ResizeObserver plus `visualViewport`, `highp`→`mediump` precision fallback, `maxPixelCount`) is worth copying into our own canvas. |
| Rive, Lottie, Spline, Swup, Barba, Taxi.js, Howler | none | No | One page with an in-page switch needs no page-transition library. No illustration or character assets exist. |

### 4.1 Wiring (from motion-tech, adapted to the installed versions)

- **`app/(site)/providers.tsx` (`'use client'`):**
  - `<ReactLenis root ref={lenisRef} options={LENIS_OPTIONS} />`, with the options as a **module constant**, because it rebuilds whenever the JSON changes: `{ autoRaf:false, lerp:0.1, smoothWheel:true, syncTouch:false, anchors:{offset:-64}, stopInertiaOnNavigate:true }`. The 64 matches the sticky header.
  - Import `lenis/dist/lenis.css`.
  - Drive Lenis from Motion's loop: `frame.update(({timestamp}) => lenisRef.current?.lenis?.raf(timestamp), true)`, cleaned up with `cancelFrame`.
  - Wrap in `<MotionConfig reducedMotion="user"><LazyMotion features={domMax}>`. Use `domMax` because `layoutId` needs it.
  - Import components with `import * as m from 'motion/react-m'` and hooks from `'motion/react'`. Use `strict` only if `m` is used everywhere: it throws in dev on any full `motion` component, including `motion/react-client`.
- **Use `data-lenis-prevent`** on the promo card and any scroll panel. Call `lenis.stop()`/`start()` while a sheet or modal is open.
- **Canvas:**
  - Load with `dynamic(() => import('./sky-canvas'), { ssr:false })` from a `'use client'` file. Start it in `requestIdleCallback`, with a `setTimeout(…,200)` fallback for Safari.
  - Get the context with `getContext('webgl2', {antialias:false, alpha:false, depth:false, stencil:false, failIfMajorPerformanceCaveat:true})`, then fall back to `'webgl'`, then to the CSS sky.
  - Register the draw with Motion's `frame.render`, so Lenis, MotionValues and the canvas share one rAF.
  - Read `uScroll` through `useLenis(l => …, [], 0)`, never React state.
  - Handle `webglcontextlost` and `webglcontextrestored`.
  - On unmount, call `WEBGL_lose_context`.
- **URL state:** `/brands` and `/creators` are two statically prerendered routes rendering the same client `<Landing initialAudience>`, with distinct metadata. The switch calls `history.replaceState`, not `router.push`. Today `/` redirects to `/brands` (next.config.mjs).
- **Field metrics:** `useReportWebVitals` from `next/web-vitals`.

---

## 5. HeyMoon constraints (verbatim from the heymoon-assets source)

Everything in 5.1 to 5.6 is quoted from the heymoon-assets research **unchanged**, including its own typography. Where it conflicts with the references above, this section wins.

**Plus Mostafa's must-have** (`docs/redesign/INPUTS.md`). The writer.com floating promo card:

- A round launcher bottom-right: a dark navy disc with a bright ring, which becomes a white X when open.
- When open, a white card: eyebrow, a centred 2-3 line headline on a pale lavender band, a full-bleed thumbnail, and a white pill button.
- Made honest: "There is no recording or webinar to promote, so the card shows the agents building something for real (bound to the product's data), and its button takes the visitor to the field".
  - Brands: "Watch seven agents build a campaign" → "Try it with your store".
  - Creators: "Watch HeyMoon read a grid" → "Try it with your handle".
  - Also from INPUTS.md: "The step-list-with-tool-icons pattern is also a strong fit for showing the agents working (READ_TASKS / BUILD_TASKS on each side)."
- **Director's note, reconciling this with the WRITER counter-example:**
  - The launcher is the *only* floating element: no chat widget, and no cookie modal stacked on it.
  - It starts closed, and on mobile it never covers the hero field.
  - It may open itself once, after the visitor scrolls past the hero.
  - A dismissal is remembered for the session, wrapped in try/catch.

### 5.1 Copy inventory

> **A1 BRANDS HERO COPY** (app/(brands)/brands/lib/i18n.ts, landing.* keys; every key also has a first-pass Arabic string awaiting the Arabic copywriter). The switch nav is aria-labelled 'Who HeyMoon is for' with tabs 'Brands' | 'Creators' (AR 'لمن HeyMoon', 'العلامات التجارية', 'صنّاع المحتوى'). H1 line 1 'A campaign in fifteen seconds.'; line 2 in gradient type 'Sales, guaranteed.' (AR 'حملة في 15 ثانية.' / 'ومبيعات مضمونة.'). Store field: Globe icon, typed-out placeholder 'yourstore.com', button 'Start' that becomes 'Reading' and navigates to /brands/c?read=<url>. Error line 'Paste a store link, like yourstore.com.'; sr label 'Your store link'. Check chips under the field: 'No forms to fill in' · 'No brief to write' · 'No agency to manage'. Nav: Wordmark, 'العربية' toggle, dark 'Dashboard' button.

> **A2 BRANDS CARDS.** H2 'One link. The whole campaign.' Sub 'Paste your store link. HeyMoon builds a complete creator campaign around what you sell, and guarantees the sales.' Card 1: 'HeyMoon reads your store' / 'Catalogue, prices, voice and markets. In about fifteen seconds.' [MockField]. Card 2: 'See everything. Before you pay anything.' / 'The whole campaign, built and priced before you approve it: the markets, the creators, the budget and the brief.' [MockPlan]. Card 3: 'Start small. Scale on results.' / 'Your first campaign is $1,000, the same for every brand. The next is offered only when this one reaches 80% of its target.' [MockPhases].

> **A3 BRANDS RUN:** four steps that auto-advance every 7s, list on one side and one mock panel on the other. H2 'From a link to a live campaign.' Sub 'Four steps. You decide at one of them, and it ends on the number HeyMoon guaranteed.' 01 'Paste your store link' / 'HeyMoon reads the catalogue, the prices, the voice and the markets it already ships to.' (agent MoonShot AI, MockField). 02 'The plan arrives, priced' / 'Markets, creators, products and the brief, with the sales figure it guarantees. Change anything.' (MoonMatch AI, MockPlan). 03 'You start Phase 1' / 'One payment, the same for every brand. Nothing after it is charged or committed.' (MoonLive AI, MockPay). 04 'The sales land on the number' / 'Three phases run to the sales HeyMoon guaranteed on your budget, at the multiple you signed.' (MoonScore AI, MockCurve labelled 'Sales, guaranteed'). Credit line reads 'Agents · <agent>'.

> **A4 BRANDS GUARANTEE, ROAS, AGENTS, STORES, CLOSE.** Guarantee H2 'Miss the number? HeyMoon pays the difference.' Body 'Every campaign comes with a sales figure, in writing, before you pay. If your sales come in under it, the shortfall is HeyMoon's to cover, not yours.' Then a 2px gradient rule and 'HeyMoon.AI, a Saudi company'. The dark panel carries eyebrow 'Guaranteed sales', a count-up to $63,050, '$12,500 across three phases, at 5x', and a drawn curve. ROAS H2 'You set the ROAS. HeyMoon signs it.' Body 'Pick the multiple you want on the whole campaign. HeyMoon prices the phases to reach it, or tells you it cannot and offers the number it can stand behind.' Then 'It climbs as the campaign earns it' with chips P1 1x / P2 3.7x / P3 6.3x, and a dial at 5x on a 1x to 12x arc captioned 'Guaranteed ROAS' / 'blended across all three phases'. Agents block (#141229) H2 'Seven agents run the campaign.' Body 'Each one owns a stage, and each one signs the work it did.' Constellation nodes and stages: MoonShot Intake, MoonMatch Matching, MoonSearch Safety, MoonWriter Creative, MoonLive Activation, MoonScore Optimization, MoonLearning Learning. Stores H2 'Connects to the store you already have.' Body 'One tap, after you pay. It reads the orders that use a creator's code, and nothing else.' over the Salla, Zid, Shopify and Magento marks. Close H2 'Paste your store link.' with the field again, then 'Nothing is charged. Nothing is published. Not until you say so.' and 'Built by AI. Backed by HeyMoon.AI, a Saudi company.' Footer: Wordmark, AR toggle, Dashboard. Brands metadata: 'Paste your store link. HeyMoon builds a complete creator campaign around what you sell, and guarantees the sales.'

> **A5 CREATORS HERO and CARDS** (COPY object in app/(creators)/creators/v1/page.tsx; English only, no i18n). Nav: Wordmark + 'for creators'; a 'Start' pill that appears only once both fields are off screen; 'Dashboard' (opens the login sheet unless signed in). H1 'Your posts already sell.' with gradient line 'Take a cut of it.' Handle field: At icon, placeholder 'yourhandle', button 'Start' that becomes 'Reading' and navigates to /creators/c?h=@handle. Label 'Your Instagram or TikTok handle'. Error 'Paste your Instagram or TikTok handle, or the link to your profile.' Chips: 'No sign-up to start' · 'No agency in the middle' · 'Paid on time'. Cards H2 'One handle. Every campaign that fits.' Sub 'Paste your Instagram or TikTok handle. HeyMoon reads your work and brings the live campaigns that fit. Each pays a share of every order you bring in.' Card 1: 'HeyMoon reads your grid' / 'What you post, where your audience is and how you sound on camera. In about fifteen seconds.' Card 2: 'Matched on influence. Not on size.' / 'Where your audience is, how much of your grid is your own work, how steadily you post and who the brand asked for.' Card 3: 'Up to three, Pre-qualified.' / 'Those you join outright, with no brand review. Every other campaign is a request the brand answers.' (tiers foot line: '12 more, each a request to join').

> **A6 CREATORS RUN.** H2 'From a handle to a live post.' Sub 'Four steps. The agents read, match and check. Joining and reporting are yours.' Step 1 'Paste your handle' / 'Five agents read your last thirty posts, where your audience is, how you talk on camera and which brands are already in your grid.' (credit 'You, then five agents', MockRead). Step 2 'Your matches arrive' / 'Each shows where it runs and the share of every order it pays. Up to three you join outright.' (MoonMatch AI, MockPicks). Step 3 'You join the campaign' / 'Choose how often you can post, then read what you agree to and, in the same weight, what you do not.' (credit 'You', MockTerms). Step 4 'Post it, then report it' / 'You post from your own account, then submit the ad. MoonWriter AI checks it against the brief and names anything missing. Once it's accepted, it counts toward your payout.' (credit 'You, then MoonWriter AI', MockCheck). Credit label 'Done by'.

> **A7 CREATORS PAID, SHARE, AGENTS, PLATFORMS, CLOSE.** Paid H2 'When do you get paid?' Body 'Each brand funds its phase before the brief is written, and HeyMoon holds it. Orders on your code and link are counted weekly, and your share of the ones that cleared is paid that week.' Signature 'HeyMoon.AI, a Saudi company'. Dark panel 'Your payout is paid' / 'Weekly' / 'On the orders your code and link carried, once they cleared.' with a drawn rail 'Funded › Held for you › Orders counted › Paid'. Share H2 'The brand sets the payout. You bring the orders.' Body 'Each campaign's share of the order value is set by its brand before anyone joins. Nothing to negotiate: a quiet week pays less, and a good one pays more.' Then 'Every order is counted through' with chips 'Your code' and 'Your tracking link'. ShareScale shows '10–16%' over one dot per live campaign, captioned 'Payout on every order' / 'One dot for each of the 16 campaigns live today.' Agents H2 'Seven agents. None of them can act as you.' Body 'Each one owns a stage and puts its name to what it did.' Eyebrow 'Locked for every agent' over three rows, each marked 'Never': 'Post to your accounts', 'Join a campaign, or sign anything', 'Report a post as live'. Platforms H2 'Your handle is all it needs.' Body 'Instagram or TikTok. Nothing to connect to start, and HeyMoon holds no password to any account you have.' Close 'Paste your handle.' with the field, then 'No agent posts for you. No agent signs for you. No screen changes that.' and 'Built by AI. Backed by HeyMoon.AI, a Saudi company.' Creators metadata: 'Paste your handle. HeyMoon tells you which live campaigns want somebody like you, and each one pays you a share of the orders your posts bring in.' The new (site) layout metadata reads 'Seven AI agents run creator campaigns end to end, for brands and for creators.'

> **A8 MOCK CHROME** (product labels, keep verbatim). Brands mocks resolved: MockField = the url, a static caret and a 'Start' pill. MockPlan = 'Phase 1 · Warm-up', a 'Guaranteed' pill, 'You pay $1,000', 'Markets UAE, KSA, Kuwait', 'Creators' with 3 real avatars. MockPhases = Phase 1 $1,000 / Phase 2 $4,000 / Phase 3 $7,500 on bars at 38/68/100%. MockPay = 'Due today' '$1,050', '$1,000 + $50 VAT', '•••• 4629', 'Pay $1,050'. MockCurve = 'Sales, guaranteed' through Phase 1/2/3 at 1x→3.7x→6.3x with a '6.3x' pill. Creators mocks resolved: MockWhy = 'Why HeyMoon matched you · Pre-qualified' over four signals: 'Where your audience is' / '61% of them are in SA, AE, KW.'; 'How much of your grid is advertising' / 'Only 20% of your last thirty posts were paid.'; 'How consistently you post' / '4 a week, every week since 2021.'; 'Who the brand asked for' / '24 to 45, any gender. Yours are 25 to 34.' MockTiers = Nabati Home 12%, Tide Trace 12% and Marhaba Kitchen 11% marked Pre-qualified, then Dune Run marked 'Request to join'. MockRead = 'Reading your profile' / '@yourhandle · five agents', count 5/9, rows You, Accounts, What you post ('Lifestyle, then Fashion and Motherhood.'), Your voice ('“Honestly, I wore this three days straight.”'), Audience (AE 39%, SA 22%), Performance (working), Rhythm (Waiting). MockPicks = 'Your top three, Pre-qualified' on real CampaignCards. MockTerms = 'Join Nabati Home' / 'You're Pre-qualified. Pressing it joins you.' / '12%' 'of every order you bring in' / 'You're agreeing to' '1 Reel, 3 Stories, at 3 posts per week.' / 'You're not' with 4 lines (nothing exclusive; no usage past 90 days; no say over other posts; nothing about a minimum) / 'Join Campaign'. MockCheck = 'Pre-upload Check' / 'Linen resort set · Maison Dune · due in 4 days', misses Price transparency, Code visibility and Link distribution, each with a 'Fix:' line, and a '3 to fix' chip.

### 5.2 Data bindings

> **B1 BRANDS DEMO BINDING** (copy useDemo from app/(brands)/brands/v1/page.tsx; values verified by running the code through node_modules/jiti). Steps: id = readIdFor('ounass.com') [lib/agent/registry.ts]; read = {...FIXTURES['ounass.com'](id), done: all 9 ReadLayerKeys} [lib/mock/reads.ts]; rememberRead(read); plan = planFor(read). Signature: planFor(read: BrandRead, strategy?: StrategyKey): Plan in lib/agent/tools.ts; defaults to 'balanced', synchronous and deterministic (no Math.random anywhere). Each Plan field is Sourced<T> = {value, why, evidence[], computedFrom?, setBy}. Ounass values: budget 1000; planBudget 12500; guaranteedRoas 5; markets ['AE','SA','KW','QA','BH'] (SHORT_MARKET in lib/landing.ts gives UAE/KSA/Kuwait/Qatar/Bahrain); audience {female, 24 to 38}; pool 8; creators 3 (avatar paths only); ladder [{phaseNo, budget, multiple, state, note}] = 1: $1,000 at 1x proposed / 2: $4,000 at 3.7x locked / 3: $7,500 at 6.3x locked. Confidence is High (12,500 ÷ 5 = 2,500). Due today is $1,050 (VAT_RATE 0.05). The lunabeauty.ae and freshgrocer.ae fixtures give the same ladder; freshgrocer is the below-the-traffic-floor path.

> **B2 BRANDS FUNCTIONS** (lib/agent/tools.ts). ladderTotals(planBudget: number, targetRoas: number) returns {budget, revenue, blended, phases: [b1,b2,b3], multiples: [m1,m2,m3]}. ladderTotals(12500, 5) = {budget 12500, revenue 63050, blended 5.044}. Other inputs: (60000,5) gives $302,300 on 1x/3.5x/5.9x; (10000,3) gives $30,400; (20000,8) gives $160,500. phasesFor(planBudget) returns [1000, p2, p3]: the remainder is split 1 to 2, rounded to 500. phaseMultiples(planBudget, targetRoas) returns [1, r2, r3] with r2 = (1 + r3) / 2, so the blend hits the target. Constants: PHASE1_BUDGET = 1000, PHASE1_ROAS = 1, CREW_BUDGET = 650. suggestPlanShape(multiple) returns {planBudget, roas}. STRATEGY_META: wide 3x on 8 product lines, balanced 5x on 4, concentrated 8x on 2; all three cost $1,000. READ_TASKS: ReadTask[] with {key, agent, role, note, produces, weight}, 9 rows. MoonShot AI does identity/category/priceBand/markets/bestsellers/seasonality; MoonMatch AI does socials; MoonWriter AI does voice; MoonScore AI does eligibility. Notes include 'Reading the homepage', 'Sampling 60 product pages', 'Counting the words your store repeats' and 'Checking traffic against the guarantee floor'. BUILD_TASKS has 7 rows: MoonShot markets, MoonMatch audience and creators, MoonSearch safety, MoonScore pricing and ladder, MoonWriter brief. Streaming: read_site and propose_plan are async generators that yield chunk(partial, 'Agent · note', done, total).

> **B3 BRANDS MODEL and HELPERS.** lib/agent/model.ts: ROAS_MIN = 1, ROAS_MAX = 12, CONFIDENCE_HIGH_RATIO = 2500, CONFIDENCE_MEDIUM_RATIO = 1000, PLAN_BUDGET_MIN = 1000, PLAN_BUDGET_MAX = 80000. getConfidence(budget, roas) returns {level, label, pct, desc, ratio}. Also CONFIDENCE_RULE (a string), budgetForHigh/budgetForMedium(roas), roasForHigh/roasForMedium(budget), ORDERS_PER_VIEW {luxury .00085, beauty .0011, grocery .00175, general .00095}, CREATOR_SHARE .65. lib/mock/campaigns.ts: VAT_RATE, UNLOCK_AT = 0.8, fmtUSD(n), PHASE_NAMES ['Warm-up','Scale','Peak'], and a dashboard fixture (PHASES, revenueSeries(p), pace(p), ADS with views and sales per live ad) usable for a live-chart visual. lib/agent/agents.ts: AGENTS = ['MoonShot AI','MoonMatch AI','MoonSearch AI','MoonWriter AI','MoonLive AI','MoonScore AI','MoonLearning AI'] as const; the file is identical on the creators side. lib/useReveal.ts: useReveal(threshold) sets data-in on a ref; useInView(threshold) returns [ref, seen]; useCountUp(to, go, ms = 1100). lib/i18n.ts: useT() returns {t, locale, dir, isAr}; it needs lib/store useLocale; num() keeps Western digits.

> **B4 BRANDS MOCK COMPONENTS** (components/landing/Mocks.tsx; every one is aria-hidden and takes props only). MockField({url}); MockPlan({plan, markets}); MockPhases({rungs}); MockPay({total, vat, budget}); MockCurve({active, rungs, label}) draws when active; Curve({className}); GuaranteePanel({revenue, budget, roas, label, note}) with a count-up; RoasDial({value, min, max, label, note}). Run.tsx: Run({steps: {key, title, body, agent, panel: ReactNode | ((active) => ReactNode)}[]}) with STEP_MS 7000 and an IntersectionObserver gate. Hovering pauses it and clicking takes it over. The creators Run fixes focus and reduced-motion bugs that brands still has. Constellation.tsx takes no props: 7 nodes on a 37% ring around a gradient core tile with the four-point star. Phosphor icons: Storefront/UsersThree/ShieldCheck/PenNib/Megaphone/ChartLineUp/Brain on brands; UserFocus/Handshake replace the first two on creators.

> **B5 CREATORS DEMO BINDING** (copy useDemo from app/(creators)/creators/v1/page.tsx). DEMO = PEOPLE[0].handle, which is '@mais.mustafa'; it is computed on and never shown, and SHOWN = '@yourhandle'. Steps: id = readIdFor(DEMO); read = {...fullReadFor(DEMO, id), done: READ_TASKS keys}; profile = profileFor(read); offers = offersFor(profile); picks = chatPicks(offers). chatPicks(offers: Offer[], n = CHAT_PICKS = 3): Offer[] lives in lib/agent/types.ts and sorts by byStrength with prequalified first. requests = offers.filter(o => o.state === 'open' && wantsYou(o) && o.match.level !== 'prequalified'), which gives 13, the first being Dune Run. req = tools.request_accept({offer: picks[0], cadence: '3pw'}) returns {brand, needsApproval: false, commissionPct: 12, deliverables, notCommits[4], cadence}. bundleLine(req.deliverables) = '1 Reel, 3 Stories'. Then draft = DRAFTS.find(d => d.id === 'd-2'); live = BRANDS.filter(b => !b.ended); locks = DEFAULT_AUTONOMY.filter(r => r.locked && r.level === 'never').map(r => r.label). Offer fields the mocks use: id, brand, brandLogo, commissionPct, match {score, level, signals[{label, detail, strong}]}, product, title, markets, bonus, state.

> **B6 CREATORS RESOLVED DATA.** Picks: Nabati Home 12% 'Soy wax candle, oud and fig' (campaign 'The Room After Maghrib'); Tide Trace 12% 'Eau de parfum, six scents'; Marhaba Kitchen 11% 'Weeknight meal kits'. All three are prequalified at score 0.756, tie broken by byStrength. BRANDS (lib/mock/brands.ts) has 19 seeds, 16 live, 3 ended. perOrderPct for the 16 live = [12,15,10,12,14,14,13,16,12,11,13,15,14,12,10,11], range 10 to 16%. Five carry an early-bird bonus: +3% per order on Ounass, Tide Trace and Oud & Amber; +2% on Atelier Noor and Marhaba Kitchen. Campaign brands other than Ounass, Luna and FreshGrocer are fictional and have no logo files. DEFAULT_AUTONOMY (lib/store.ts): 3 rows locked at never, 4 'alone' (Hide campaigns that are not a fit; Block a brand that clashes with your grid; Check a submitted ad against the brief; Learn from finished work), 3 'ask'. Creators READ_TASKS: 9 rows across 5 agents. MoonShot does identity/accounts/cadence; MoonMatch does niche/audience/standing; MoonWriter does voice; MoonScore does reach; MoonSearch does conflicts, and on this side MoonSearch vets BRANDS for the creator. model.ts: MATCH_WEIGHTS market .35 / authenticity .25 / consistency .20 / audience .20; PREQUALIFIED_AT .70; PREQUALIFIED_CAP 3; MATCH_FLOOR .50; MATCH_WORD {Pre-qualified, Strong match, Worth a look}; CAMPAIGN_MODELS Performance supported, Fixed fee supported: false. CHECK_NAMES (7): Product intro, Quality and lighting, Review and styling, Price transparency, Code visibility, Link distribution, Brand tagging. CADENCES: Daily posts / 3, 2 or 1 posts per week.

> **B7 CREATORS MOCK COMPONENTS** (components/landing/Mocks.tsx; props only, they never import fixtures). MockField({handle, platforms}); MockWhy({level, signals}); MockTiers({picks, next, rest, restLine}); MockRead({sub, total, rows, at, active}), paced by useSchedule; MockPicks({title, offers, active}), which renders the real CampaignCard; MockTerms({brand, needsApproval, commissionPct, commits, notCommits}); MockCheck({product, brand, dueIn, rows, misses, at, active}); MoneyPanel({label, figure, note, steps}); ShareScale({shares, label, note, spoken}). components/figma.tsx exports CampaignCard, PayoutChip, MatchChip, BrandMark, Soc (platform squares), Flags, ProductTile (a tinted composed tile in place of photos) and CountdownBar. Pacing comes from costOf(unitKey, weight) in lib/agent/stream.ts, scaled by paced(). lib/useReveal.ts adds useReducedMotion(), useVisible(threshold, initial, rootMargin) and useSchedule(run, at[]) which returns n. CAUTION: the two sides' Tailwind configs give the same class names different values ('text-brand' is a colour on brands and an 11px size on creators; paper, title and display differ). Any mock reused in app/(site) needs tailwind.site.config.ts to define what it uses: ink scale, brand/main, lilac, green/good, danger, orange, shadow-hm-*, text-display, rounded-pill, plus the CSS classes g-button, working-ring, hm-crop, draw, draw-fill and dial-dot.

### 5.3 Brand tokens

> **C1 COLOURS.** ink #12151B; body text is black alpha .9/.6/.5/.4, and the landing body uses ink/55 to 60. Purple brand/main #4D2FB0: hover #3F2596, mid #6848D1, light #7A47CE, glow #A65FED, 500 #7C5CE0, 400 #9B7BF0, 300 #A78BFA. lilac/wash #F3EFFC; canvas #F6F4FC (app html bg); landing paper/ground #FCFBF8; deep #141229 (dark panels and agents block); night #161722. Gradient end pink #F0559D; spoke pulse lavender #A98BFF; blush #F4A8D8 / #C2418B. Semantic: green/good #25A333 (deep #1C7A26); orange #FF8400; amber #B26A00 / #FFF4E5 / #FFE0B2; lime #4FEA57; sun #FFE538; danger #D70015. hairline rgba(18,21,27,.07); rule rgba(18,21,27,.14). Old moontech.co dark ground for reference: #000211 / #010317, cards #0A0C1E, CTA #5A3BBF.

> **C2 GRADIENTS** (both globals.css files). hm-grad-text: linear-gradient(95deg, #4D2FB0 0%, #7C5CE0 45%, #F0559D 100%), background-clip text. hm-grad-rule: linear-gradient(90deg, #4D2FB0, #7C5CE0 50%, #F0559D). hm-glow (behind the field): radial(38% 60% at 30% 50%, rgba(77,47,176,.30), transparent 70%) + radial(38% 60% at 70% 50%, rgba(240,85,157,.22), transparent 70%) + radial(44% 70% at 50% 50%, rgba(124,92,224,.26), transparent 72%), filter blur(52px). hm-glow-dark: radial(40% 60% at 35% 55%, rgba(124,92,224,.55)) + radial(38% 58% at 68% 45%, rgba(240,85,157,.38)), blur(56px). hm-media (mock mount): linear-gradient(150deg, #EFEAFB 0%, #FBFAFD 45%, #FDEEF5 100%). keyline-grad: 90deg #4D2FB0 to #9B7BF0 55% to #F4A8D8, with the .unlock-notch at 80%; this signature mark is byte-identical across the web, mobile and agentic clients. AI core tile: linear-gradient(140deg, #4D2FB0, #7C5CE0 55%, #F0559D) with shadow 0 10px 40px -8px rgba(124,92,224,.8). g-button: radial-gradient(140% 220% at 85% 0%, #6848D1 0%, #4D2FB0 45%, #4D2FB0 100%). g-bonus: 120deg #4D2FB0 / #7A47CE / #A65FED. SVG charts and the dial use the same three stops; area fills use #7C5CE0 at .18 to .20 fading to 0.

> **C3 TYPE, SHAPE, ELEVATION.** The landing face is Geist Sans (geist package; the new app/(site)/layout.tsx already loads GeistSans + GeistMono and tailwind.site.config.ts maps sans and mono to them). Weight 600. H1 clamp(40px, 6.6vw, 68px), leading 1.02, tracking -0.038em, max 20ch. H2 clamp(28px, 3.4vw, 40px), leading 1.1, tracking -0.035em. Guarantee H2 clamp(30px, 3.6vw, 44px). Card title 19px at -0.02em; body 16px/1.6; eyebrows 11px uppercase with .14em tracking; big figure clamp(44px, 6vw, 76px) at -0.04em. The product UI face is Figtree 400 to 700 (body 14px, display 30px at -0.03em). Arabic is IBM Plex Sans Arabic 400/500 on --font-ar, with rtl leading 1.2 to 1.25 and tracking normal. .num = tabular-nums, direction ltr, unicode-bidi isolate. Radii: chip 8, inner/control 12, card 16, tile/field 24, sheet 32, pill 100; landing card 24 with an 18 media area; dark panels 22 and 26; the field's button 12. Shadows: hm-field '0 2px 4px rgba(25,18,52,.04), 0 20px 44px -18px rgba(25,18,52,.22), 0 56px 90px -48px rgba(25,18,52,.30)'; hm-card '0 1px 2px rgba(25,18,52,.04), 0 24px 48px -32px rgba(25,18,52,.22)'; hm-mock '0 2px 4px rgba(25,18,52,.05), 0 20px 40px -16px rgba(25,18,52,.22)'. Layout max width 1120px with 20 to 32px gutters; the hero fills min-h calc(100svh - 64px) under a 64px sticky blurred header.

> **C4 WORDMARK and MARKS.** components/Wordmark.tsx (one copy per side) renders the text 'HeyMoon' + '.AI', with '.AI' in #4D2FB0 (text-brand on brands, text-main on creators). font-semibold, leading-none, tracking -0.03em, sizes sm 15 / md 17 / lg 19px, dir=ltr, select-none. The docs call it a stopgap: 'Design owes a real mark'. public/logo.svg and public/logo.png are the OLD 'MOONTech' logo (navy serif MOON + sans Tech + four-point star); do not use them. The AI-core glyph is the four-pointed star path 'M12 1.6c0 5.2 5.2 10.4 10.4 10.4C17.2 12 12 17.2 12 22.4 12 17.2 6.8 12 1.6 12 6.8 12 12 6.8 12 1.6Z'. A crescent was tried and rejected because it 'read as night, not as intelligence'. AudienceSwitch (app/_shared): a 296x48 pill track at ink/5 with an inset hairline. The white thumb's shadow is '0 1px 2px rgba(18,21,27,.08), 0 8px 20px -8px rgba(18,21,27,.28)'; it slides in 240ms cubic-bezier(.22,1,.36,1), then a full page load follows. Its HREFs currently point at /brands/v1 and /creators/v1.

> **C5 MOTION VOCABULARY** already in the code (every piece is reduced-motion safe). rise 0.5s ease-out with a 70ms stagger on hero lines. .reveal: opacity + translateY(10px) over .5s cubic-bezier(.2,.8,.2,1), triggered by data-in. .rule-draw: scaleX over .6s. SVG .draw: stroke-dashoffset over 1.2s cubic-bezier(.22,.8,.2,1) with pathLength=1. .draw-fill: opacity over .8s after .45s. dial-dot rotates to var(--sweep). Count-ups run 1.1 to 1.3s. Constellation: hm-spoke pulse runs along each spoke in 3.6s, staggered per node; hm-node glow ring; hm-ring rotates once per 60s; hm-breathe 4.8s; hm-star 28s. run-fill is a 7s linear timer bar. The typed placeholder types at 85ms per char with a 1s step-end caret. working-ring spinner .9s. lenis ^1.3.26 and motion ^12.43.0 are in package.json but nothing imports them yet. Known bug: the brands Constellation uses motion-safe:hm-* on plain CSS classes, so those animations never ran there (the creators copy fixes it).

### 5.4 Hard rules

> **D1 VOICE RULES** (docs/brands/COPY.md; it sits under heymoon-copy-changes-before-after.md, which wins where they differ). Write short, concrete and calm, for a busy, suspicious founder in Riyadh or Dubai. Lead with the thing, one idea per sentence, cut justification nobody asked for, let numbers persuade, no meta-commentary about the design, say the hard thing first. NO em dashes, NO en dashes (write ranges as 'X to Y'), NO exclamation marks. Sentence case except names. Banned words: seamless, leverage, unlock (except the literal phase gate), journey, empower, robust, simply, just, 'whatever has arrived', and 'end to end' more than once a screen. Say 'Sales', not revenue, return or ROAS. 'Revenue' survives only in contract and guarantee terms, and the landing's 'You set the ROAS' section is the one sanctioned ROAS. Write multiples as '5x', never '5×'. 'We' and 'our' are allowed on marketing pages only. Buttons are verbs, with no arrows and no first person ('Start', 'See the plan', 'Pay $1,050'). Never call it 'the read'. Existing violation: ShareScale prints '10–16%' with an en dash.

> **D2 AGENT RULES.** Name the seven (MoonShot AI, MoonMatch AI, MoonSearch AI, MoonWriter AI, MoonLive AI, MoonScore AI, MoonLearning AI) and credit the one doing the work; the spec's G1 'no agent names' is overruled. The landing may say 'Seven agents'. Inside the product, never state how many agents exist and never recite the pipeline in a message; rosters derive from READ_TASKS and BUILD_TASKS. Agents can never move money, publish or sign (brands), or post, join, sign or report a post (creators). These are locked at Never and shown locked; they are not preferences. Tools return requests and a human presses the button. Never resurrect the deleted invented agents Scout, Ledger, Signal, Copy, Atlas and Underwriter.

> **D3 VISUAL DECISIONS ON RECORD.** NO serif: 'a display serif through the headings is what made this read as a magazine rather than as software'. Headings use the interface grotesque with tight tracking, and the old MOONTech serif logo is retired too. ONE accent gradient, spent in three places only: a glow behind the field, a 2px rule, and one line of type. Never a background wash ('spread across a hero it reads as a template'). Every card holds a bound picture of the product, not a list of labels, and mocks reuse product labels verbatim. It is not a marketplace: no roster, no grid of faces; creators appear once, as three avatars inside the plan mock. The live example read and the sample chips were removed from the hero; one field is the front door. The landing reference for proportions was lovable.dev.

> **D4 CLAIMS THAT MUST NOT BE MADE.** Brands: no expected or forecast sales range anywhere (C16 withdrawn 16 Sep); show only the guaranteed figure. Phase 1 is a fixed $1,000 for every brand, guaranteed at 1x (money back, no profit), so never imply the warm-up profits. The spec's worked examples at 5x on Phase 1 contradict the build. Phases 2 and 3 are indicative and offered at 80% of the previous phase's target. Never show a fee beside a creator, and never name creators before payment. There is no slider; numbers are set in conversation, and below medium confidence HeyMoon refuses to build. Creators landing: no money figure, no arithmetic, no payment-model table and no rate. Also none of: CPM or per-view language; followers, views or reach as the pitch; 'card' or 'rate card' (say 'your profile'); fixed-fee campaigns (performance share only); an earnings calculator before joining; connecting Instagram up front; any claim about how the read is obtained or about connecting TikTok. The only pay numbers allowed are the 10% to 16% shares and 'Weekly'. The rejected hero 'get paid for the posts you were making anyway' was dropped because influencers know it is false.

> **D5 CLAIMS NEEDING SIGN-OFF BEFORE PUBLIC** (OPEN-QUESTIONS section 14). 'HeyMoon.AI is a Saudi company': Mansour and legal; a CR or Maroof listing beside it would carry more. 'HeyMoon pays you the difference': is it cash or credits? Finance and legal; if cash, add 'In cash, not credits.' The store connection is read-only and 'reads the orders that use a creator's code, and nothing else': Nick. 'Check the details before you pay.' as the disclaimer: legal. 'Sales' in copy vs 'revenue' in contracts: legal. On the creators landing, the demo creator's read values in the mocks and Nabati Home as the lead campaign need a yes before the page leaves the team. 'A campaign in fifteen seconds': the store read is tuned to about 15s in costOf and the plan build adds about 11s, so the 15 seconds is the read. The Arabic is a first pass for brands only; creators has no Arabic.

> **D6 NUMBERS MUST BE SOURCED AND BOUND.** The rule is 'no figure without a source': values travel as Sourced<T>, and <Figure> draws a red 'unsourced' marker if the source is missing. Bind every figure to the functions in B1 to B7; never type them in. The DOCS ARE STALE: the README's '$60,000 at 5x = $302,300' and the 12,000/4,000 confidence thresholds do not match the code (2,500/1,000; the default plan is $12,500 giving $63,050 on 1x/3.7x/6.3x). ORDERS_PER_VIEW is a placeholder platform benchmark that needs a real number. Old-site and App Store stats are unsourced and contradict each other, so do NOT reuse them. moontech.co: '+38K Active Users', '+38K Downloads', '+10K Campaigns Launched', 'Trusted by 200+ Brands', 'Rated #1 Vertical AI Workflow... 4.9/5 stars from 500+ brands', '24-Hour Launch Guarantee', 'Launch campaigns in under 24 hours', 'Keep 100% of your earnings', 'Instant payouts after approval'. App Store: '200+ brands', '1,000+ verified influencers', '1,000+ campaigns launched', '60,000+ ads published since 2023'.

> **D7 REAL PEOPLE WHO MUST NOT BE SHOWN.** The ten creator fixtures are real Gulf influencers with real photos in public/creators: Jawaher Alsuwaidi (@jawahralsuwaidi), MakeupbyMemz (@makeupbymemz), Ola Farahat (@olafarahat), Mais Mustafa (@mais.mustafa), Asma Al Azmi (@asmaalazmii_), Ghaliah Alsharif (@ghalya.mu2), Rebecca Kassab Al Azar (@rebeccarkassab), Dima Sheikhly (@dimasheikhly), Paola El Sitt (@paola.elsitt), Noon Reviews (@skindew0). The brands product rule: faces only (the review said 'no harm in showing the icons'), never names, handles, links or fees. The brands MockPlan shows the avatars of Jawaher, Mais and Asma. On the creators landing PEOPLE[0] is a real person: never show her name, avatar, location, discount code, voice register or payout, and use '@yourhandle'. Refusal demos use the invented '@sara.creates' ('no real person is used to illustrate a refusal'). The old-site testimonials quote real people (an Alshaya Group affiliate manager and four influencer handles) speaking about MoonTech; they cannot move to HeyMoon without consent. The repo holds no consent records for any creator image or video.

### 5.5 Assets

> **E1 USABLE ASSETS.** public/platforms/{salla,zid,shopify,magento}.png: store-integration marks with optical heights 34/32/24/24; nominative use for 'connects to'. public/flags/{ae,sa,kw,qa,bh,om,jo,eg}.svg: circle flags, used by Flag.tsx. Phosphor icons. The Wordmark component (text). Geist and Geist Mono via the geist package; Figtree and IBM Plex Sans Arabic via next/font/google. HeyMoon has NO product photography, brand creative, illustration, 3D or video of its own; ProductTile composes a tinted tile with the product name instead of a photo. So hero and section visuals have to come from bound UI mocks, type, gradients and code-generated motion (shader, SVG, canvas).

> **E2 ASSETS WITH CAVEATS.** public/logo.svg and logo.png carry the wrong name (MOONTech). public/ounass-logo.jpeg is a real retailer and the brands demo store; showing it on a marketing site implies a client relationship and needs permission. luna-logo.png and freshgrocer-logo.jpg belong to demo fixture brands of unknown provenance. public/creators/<10 handles>/{avatar,p1..p5}.jpg (3.0MB) are real creators' social photos with no consent on file. Some are reused as fake product images: the Ounass bestsellers use olafarahat p1/p2 and asmaalazmii_ p1, Luna uses makeupbymemz p1 to p4, FreshGrocer uses skindew0 p1. That is a misattribution risk. public/ads/*.mp4 + .jpg posters (48MB total: noon 19.5MB, memz 14.2MB, cosmo 12.8MB, palm 4.0MB) are real creators' Ounass ad creative. palm clutch is tied to creator 1 Jawaher, memz to MakeupbyMemz, noon to Noon Reviews and cosmo to creator 7 Rebecca Kassab. Using them needs consent from each creator AND Ounass, plus re-encoding and posters. Old-site images on framerusercontent (planet horizon webp, dashboard + phone mock, client logo PNGs) belong to MoonTech and show MoonTech branding.

### 5.6 Routes and scaffold

> **F ROUTES and SCAFFOLD for the build.** The redesign group app/(site) already exists with its own layout (Geist, title 'HeyMoon.AI'), a globals.css that names tailwind.site.config.ts via @config, and 3-line placeholder pages at /brands and /creators. The original landings moved to /brands/v1 and /creators/v1 (git shows the renames, uncommitted). '/' redirects to /brands (next.config.mjs). The fields must keep submitting to /brands/c?read=<url> and /creators/c?h=<@handle>. Dashboards: /brands/dashboard, and /creators/dashboard, which needs a profile, so the creators landing opens AccountSheet in signin mode. Brands keeps Arabic RTL through DirSync and LangToggle (lib/store locale; storage keys mtab_ for brands and mtac_ for creators). Dev server is npm run dev on :3004 (heymoon-agentic-landing-page in .claude/launch.json).

### 5.7 The baseline to beat: the old site at moontech.co

These are summarised from heymoon-assets and visual, not quoted. heymoon.ai currently serves an unrelated GoDaddy "Hemyoon" placeholder.

- **Worth keeping (brand memory):**
  - The dark cosmic ground: #000211 and #010317.
  - The planet horizon as the hero device. Today it is a raster webp, 1440x954.
  - The audience toggle as the very first interaction. Today it is a 300x50 track at 5% white, with a white thumb that has a pressed-in triple inset shadow, and it links to a separate page.
  - The floating glass nav: rgba(0,0,0,.6), `blur(30px)`, radius 100.
- **What dates it:**
  - Manrope 700 at normal tracking.
  - Two SEO paragraphs above the fold.
  - Unsourced, contradictory stats.
  - Emoji problem cards and a generic SaaS section order.
  - MoonTech naming.
  - Creator promises the product now forbids, such as "Keep 100% of your earnings" and "Instant payouts".

### 5.8 Two things to fix before any demo goes public (director's reading of the rules)

1. **The brands demo computes on the `ounass.com` fixture.** E2 says showing Ounass implies a client relationship. So use the same pattern the creators side already uses: compute on the fixture, but **show** `yourstore.com` in every field, toast and window, unless Ounass permission is on file.
2. **Creators toasts and windows should use the READ_TASKS agent notes, not the demo creator's read values**, until D5's sign-off arrives. The read values include "Your voice" and audience shares derived from a real person (D7).

---

## 6. Three creative directions

All three share these:

- The Brands | Creators switch at every layer, from the research: hero segmented control, mirrored capsule in the sticky nav, preselected in any CTA sheet, the fork cards above the footer, and shareable deep links through the two routes `/brands` and `/creators`, with no query string needed.
- The approved copy, verbatim.
- Bound mocks.
- The honest promo card.
- No serif, no faces beyond the three avatars in MockPlan, no invented figures.

### Direction A: Moonrise

*The old heymoon horizon, made cinematic.*

**Concept.** HeyMoon's brand memory is the night sky and the planet horizon. Moonrise keeps it, but replaces the raster planet with a live limb of light.

- **The rim as the field's glow.** The page opens at night, with the edge of a planet across the lower third of the viewport, lit by the brand gradient. That rim **is** the "glow behind the field": the store-link or handle field sits on the horizon line, as Dia sets its CTA on its arc. So the one-gradient rule holds, with three spends: the rim and glow, the 2px rule, and the gradient line of the H1.
- **The switch changes the atmosphere.** The stops stay the same and the weighting moves. Brands leans to the violet end (#4D2FB0 → #7C5CE0). Creators leans to the pink end (#7C5CE0 → #F0559D).
- **The page.** As you scroll, a paper sheet (#FCFBF8, 32px top radius) rises over the horizon, Sierra's sheet in reverse. It carries the cards and the Run. The deep #141229 comes back for the agents and the guarantee.
- **The close.** The close sets the horizon again, higher now, with the field on it. A giant "HeyMoon" wordmark is cropped by the bottom edge, as in Adaline's bookend and the Horizon Glow footer.
- **Why it is not Decagon:** night, not pastel; a limb, not a disc; no figures; no moon in the sky at all, only the ground we stand on.

**Hero:**

- Full-bleed night above a server-rendered CSS sky.
- The glass switch, then the two-line H1 in white, with its second line in gradient type and a line rise.
- The field on the horizon line, with a field beam on focus.
- The three check chips under it.
- Two outcome toasts at a time drift above the limb, using READ_TASKS notes verbatim: "MoonShot AI · Reading the homepage", "MoonShot AI · Sampling 60 product pages", "MoonScore AI · Checking traffic against the guarantee floor".

**Signature moment: the switch, answered by the whole sky.**

- Click Creators and the pill springs (500ms).
- The Brands lines drop out (450ms `--ease-exit`) and the Creators lines roll up (800ms, 60ms stagger).
- The field icon swaps Globe for At, and the placeholder retypes at 85ms per character.
- Over 1.2s `--ease-in-out`, the light slides along the rim toward pink and the limb lifts slightly.
- Second moment, on submit: "Start" becomes "Reading", the rim brightens and runs once around the limb, then the route changes.

**Palette (existing tokens only):**

- Sky: #010317 at the top falling to #141229 at the horizon.
- Planet body: #000211.
- Rim: the C2 stops.
- Ink on dark: white at 92%, 64% and 48%.
- Hairline: rgba(255,255,255,.08).
- Paper sheet #FCFBF8 with ink #12151B.
- #25A333 only inside mocks.

**Motion:**

- The CSS sky paints first and is the LCP-safe state. The WebGL limb crossfades in over 1.2s after its first drawn frame.
  - The shader is the motion-tech limb: signed-distance halo, razor rim, sun along the limb, hashed stars, `1-exp` tone map, dithering.
- `uScroll` lowers the limb by about 0.3 as the hero leaves. Mouse parallax is 0.03, lerped at 0.06.
- Line rise and odometer morph.
- Scroll-linked sheet lift.
- The existing Run in a sticky stage.
- The Constellation on the dark band.
- The footer horizon uses the CSS/SVG Horizon Glow layers, not a second WebGL context.

**Grounded in:** moontech.co, Vercel's eclipse light, Dia's horizon arc, Horizon Glow Hero, the GitHub globe method, Linear's line reveal, Sierra's sheet, Adaline's bookend, Decagon's toasts.

**Rule risk:**

- Needs design sign-off that a thin rim and halo counts as "the glow behind the field" and not a "background wash" (D3). Keep the halo under about 25% of the viewport height.
- It reverses the current landings' light hero, so it needs Mostafa's call.

**Promo card:**

- The launcher is a #000211 disc with a 2px C2-gradient ring.
- The card's band is lilac wash #F3EFFC.
- The thumbnail is the Run panel looping READ_TASKS.

### Direction B: The Working Page

*Paper, precision, and a product that runs in front of you.*

**Concept.** The agent companies at a $1B scale mostly sell on paper-white, with the product working in the middle of the page: Cursor, Harvey, Attio, Linear. B takes the approved landing as it is (paper #FCFBF8, Geist, the glow behind the field, lovable.dev proportions) and makes it read expensive through craft, not spectacle:

- **A lighter, svh-fluid headline.** Geist at about 480-520 instead of 600, tracking -0.04em, `clamp(48px, calc(16px + 5.3svh), 80px)`.
- **One large scripted product window** that runs the real agents with timestamps.
- **One ownable graphic device: the moon-phase dot-matrix.** Eight phases from new to full are drawn as 5x5 dot grids, in the manner of Linear's thinking glyphs and Mistral's pixel system. It is used as each agent's "working" glyph, the Run's progress, the section dividers and the dotted footer wordmark.
- **No canvas in the hero.** The product is the visual.

**Hero:**

- Centred: the switch, the two-line H1, then the field card with `hm-glow` behind it and a field beam on focus, then the chips.
- Directly under the fold line, an inset framed window with a 12px gutter and 24px radius (Decagon's frame, Harvey's "product on art").
- The "art" is a code-generated dither of lilac wash and paper tones. It is static CSS/SVG, not a canvas.

**Signature moment: "Watch it build".**

- The window plays the read as a chain of nine rows (Rox).
- Each row shows its agent in Geist Mono caps ("MOONSHOT AI"), the READ_TASKS note verbatim, and a moon-phase glyph that fills from new to full as the row works.
- A stopwatch counts up in `tabular-nums` and stops on a stamp for the read only, honouring D5's 15s-is-the-read rule.
- Then MockPlan slides in with the "Guaranteed" pill.
- On Creators, the same window runs the creators READ_TASKS ("You, then five agents"), then MockPicks.
- The same component, shrunk, is the promo card's thumbnail.

**Palette:**

- Paper #FCFBF8, ink #12151B, body text at ink/55-60.
- Lilac wash #F3EFFC, canvas #F6F4FC, `hm-media` for mock mounts.
- Deep #141229 for exactly two dark bands: agents and guarantee.
- The gradient only in the three sanctioned places.
- Moon-phase glyphs at ink/20 while idle and #4D2FB0 while working.

**Motion:**

- Almost all triggered, mostly CSS: line rise, word blur-in titles, the window chain (via `useSchedule`, paused offscreen), count-ups, draws.
- The sticky Run.
- Exactly one scroll-linked piece: the manifesto.
- No WebGL. This gives the lowest JS and the best LCP of the three.

**Grounded in:** Lovable, Cursor, Harvey, Linear, Attio, Rox, Decagon's inset frame, Mistral's pixel system, Granola's dither.

**Rule risk:**

- The lowest of the three.
- The danger is that it reads too close to the current landing. The uplift has to come from the type, the window and the glyph system, so build those first and judge the result against Cursor and Linear.

**Promo card:**

- A white card on paper.
- A #12151B launcher with a gradient ring.
- The thumbnail is the window in miniature.

### Direction C: Seven Moons

*The agents are the hero object.*

**Concept.** Seven small moons orbit the four-point-star core, which is the existing AI-core glyph, not a crescent.

- **Drawing.** They are drawn in one shader as signed-distance-field spheres plus thin orbit lines, as in Comet. They are monochrome moonlight on deep #141229.
- **The gradient goes only where the work is.** Only the agent doing the work takes the brand gradient. That makes "credit the one doing the work" (D2) visible, and keeps a single accent.
- **The field sits in the centre of the orbit**, like Fourmula's slot inside its ring.
- **One system, re-formed down the page (Antimetal, Igloo).** As you scroll:
  - the orbit tilts and unrolls into seven sticky chapters, one per agent, each with its bound mock and constellation stage name (Intake, Matching, Safety, Creative, Activation, Optimization, Learning);
  - the moons regroup into the three phases of the ladder (1x, 3.7x, 6.3x);
  - on Creators, three moons dim behind the "Locked for every agent / Never" band;
  - the footer is "HeyMoon" set in the same dots.

**Hero:**

- Dark and centred: the switch, the H1, then the field inside the ring.
- Agent names appear in Geist Mono when you hover or focus a moon.
- Each moon is a real focusable button with a text label.

**Signature moment: the read, in orbit.**

- On load, or when the visitor presses Start, moons light in READ_TASKS order.
- A beam runs from each lit moon into the core (Animated Beam), and a stopwatch counts in the core.
- Flip to Creators and the ring re-forms around five reading agents, with MoonSearch now vetting brands, and the three locks fade in.

**Palette:**

- Deep #141229 and night #161722.
- Moons drawn in white at 10%, 24% and 60%.
- The C2 gradient only on the active agent, the 2px rule and the H1's gradient line.

**Motion:**

- The most ambitious of the three.
- One shader carries the morph targets, driven by `uScroll`.
- The seven chapters use the CSS sticky stage.
- Beams and count-ups as above.
- The fallback is the existing `Constellation.tsx` SVG (static under reduced motion), which also serves as the no-WebGL state.

**Grounded in:** ElevenLabs' orbs (made monochrome), Perplexity Comet's orbit lines, Antimetal, Igloo Inc., Fourmula, EDOLUS's orbit chapters, Orbiting Circles and Animated Beam (21st/magicui), MindMarket's stacking cards, the existing Constellation.

**Rule risk:**

- The glow on the active agent is arguably a fourth gradient spend (D3), so it needs sign-off. The alternative is to treat it as the field's glow by flowing the active light into the core where the field sits.
- Spheres sit near the rejected crescent. Keep them full, never phased, and keep the star as the core.
- It has the highest performance risk. The 55.5fps watchdog and the static fallback are mandatory.
- "Seven agents" is allowed on the landing (D2).

**Promo card:**

- The launcher is a miniature ring of seven dots around the star.
- The card's thumbnail is the orbit running the read.

### Director's recommendation

**Lead with A and borrow B's middle:**

- A's night hero, switch and bookend close.
- B's paper sheet, working window and moon-phase glyph system in between.

They were designed to combine. Treat C's orbit as the **agents-band** treatment once A is within budget, not as the hero.

**Prototype order:**

1. A's hero, switch and canvas fallback. This is the riskiest piece and the first impression.
2. B's working window, which the promo card reuses.
3. C's agents band.

---

## 7. Gaps and caveats

**Source coverage.** All 8 sources returned results; none is missing. These were thin or failed:

- **Slice MCP:** dead. Every call returned `fetch failed`, and its server (slice-mcp-production.up.railway.app) answers 404 "Application not found". Zero results. A new endpoint is needed to use it.
- **Mobbin:**
  - WebFetch returned 403 everywhere.
  - curl reached only the first 60 public items per listing: 974 sections across 215 sites were parsed.
  - Not reachable: search, collections, pages beyond the first, the motion capture videos, and Mobbin's own MCP/API (paid plan).
  - So Mobbin motion details come from its tags plus the live sites' code, not from watching captures.
  - Agentio and Whop were read from their HTML only, not seen.
- **Google:** the visual source hit a CAPTCHA and did not bypass it, so it used DuckDuckGo. The google source relied on WebSearch plus list articles, which are low-signal SEO lists and were used for candidate names only.
- **Gallery sites:** lapa.ninja, land-book and designrush returned 403. godly.website now redirects to recent.design, which is mostly portfolios.
- **Awwwards:**
  - Its "artificial intelligence" category is a keyword search with mostly old results.
  - `/annual-awards-2025/` did not render.
  - spur.us returned 429, meetcleo returned 403, and the Illoca fetch failed. Those three entries rely on Awwwards text only.
  - Igloo Inc.'s WebGL never rendered in the automated pane.
- **Blocked fetches:** Cloudflare challenged openai.com, lovable.dev, perplexity.ai and character.ai for curl and WebFetch; x.ai was blocked too. pi.website returned a Vercel checkpoint. These were read in a real browser where possible.
- **21st.dev:** the free tier allows 2 code retrievals a day; the quota resets 2026-10-05 00:00 UTC.
  - Full code was read for Horizon Glow Hero and Sticky Content Wrapper.
  - Border Beam, Animated Beam, Number Ticker, Orbiting Circles and Marquee were read from magicui's public MIT source.
  - Segmented Control, Animated Radial Chart, the footers, the bento grids, Blurred Marquee and the scroll word reveals are **metadata only**. Their motion specs are inferred.
- **The shared browser pane:**
  - It was contaminated by other agents mid-run, so the affected frames were discarded and re-verified in private tabs.
  - motion-tech took no screenshots at all.
  - Linear's hero rendered black in a background tab, so its animations were measured with `getAnimations()` instead.

**Measurement conflicts:**

- **Sierra's H1** is reported as 44px (ai-leaders) and 65px (google, visual). The viewport emulation differed. Treat it as 44-65px.
- **Decagon's 3D stack** is reported as three.js (google), as three.js plus Spline (motion-tech), and as "one weak spline match" (visual). Treat it as unverified.
- **Stack detection** comes from grepping HTML and bundles. It is indicative, not proof: Next.js lazy-loads chunks, and framer-motion was detected through its `MotionHandoff` string.
- **Repo state:** components-21st reported "no animation libraries" in the **moontech** repo's package.json. That is a different repo. This repo (heymoon-agentic-landing-page) has `lenis ^1.3.26` and `motion ^12.43.0` installed and unused, which I verified today along with `gsap`, `ogl` and `three` not being installed.
- **Motion 14.0.0** is two days old. The acceleration rules were read from its source, and I confirmed the same code path exists in the installed 12.43.0 (section 3.5).
- **`docs/brands/README.md` is stale** (D6). Bind to the code, not the docs.

**Research nobody did, which is worth doing before the build locks:**

1. **Arabic-first premium references.** No source examined a premium Arabic/RTL AI or commerce site, which is a real gap for a Saudi company. Brands has a first-pass Arabic.
2. **Phone-width captures of the references.** Almost everything was measured at 1440px, so mobile hero behaviour is extrapolated.
3. **Field performance data** for the references (CrUX), and a baseline for Saudi and UAE mobile networks.
4. **A consent path for real creative.** Until it exists, every direction above is code-generated by necessity, not by choice.

**Decisions waiting on people:**

- A dark hero (Direction A) versus the current light one: Mostafa.
- Whether a horizon rim counts as "the glow behind the field": design.
- Showing `ounass.com` or `yourstore.com` in the brands demo: Ounass permission.
- The demo creator's read values: D5.
- "A Saudi company": Mansour and legal.
- A two-word category name in the style of Attio's "agentic revenue". This is a copy decision and is deliberately not invented here.
