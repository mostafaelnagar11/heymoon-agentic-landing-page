# Redesign inputs from Mostafa

Things he has asked for or pointed at. Every design and build stage
treats these as requirements, not suggestions.

## The brief (4 Oct 2026)

"Build something amazing, brilliant." Research Mobbin, awwwards.com and
Google's "best AI agentic websites 2026". It should feel like a $1B
company's site: very smooth, with good animations. Keep both sides of the
switch: Brands and Creators, each with its own copy and its own working
field into the product.

## Must-have: the floating promo card (from writer.com)

He sent a screenshot of writer.com and said he likes it "so much":

- A round launcher in the bottom-right corner: dark navy disc, a bright
  blue ring, a white X when open.
- Open, it shows a white card with rounded corners, sitting above the
  launcher:
  - a small eyebrow ("On-demand recording"),
  - a 2–3 line bold headline, centred, on a pale lavender band,
  - a full-bleed video thumbnail under it,
  - a white pill button ("Watch Now") floating over the thumbnail.
- Behind it, Writer's hero shows an agent working through a task list:
  one row per step, each with a tool icon ("Apply cross-sell scoring
  framework…", "Build personalized sales play dashboard…", "Send dashboard
  to Slack account channel").

HeyMoon's version must be honest. There is no recording or webinar to
promote, so the card shows the agents building something for real (bound
to the product's data), and its button takes the visitor to the field:

- Brands: "Watch seven agents build a campaign" → a live loop of the
  store read and plan → "Try it with your store".
- Creators: "Watch HeyMoon read a grid" → the read and the matches →
  "Try it with your handle".

The step-list-with-tool-icons pattern is also a strong fit for showing
the agents working (READ_TASKS / BUILD_TASKS on each side).

## The hero's right side, as Mostafa sketched it (5 Oct 2026)

He sent a sketch: the eclipse (black disc) with the four-point star in front, and around it two
concentric rings of circles, "creators from MENA and Gulf region profile pictures". The pictures sit
UNDER the eclipse disc and the star, and fade or sit at mid opacity "so it doesn't look busy". The
agents' text (agent name in caps plus its note, e.g. "MOONSHOT AI · Walking the navigation an…") sits
in a fixed card at the bottom right of the hero, not beside the ring.

**Consent decision.** Asked what fills the circles, he chose the creator photos already in the project
(the 10 profile pictures in public/creators), the option worded "only if you confirm HeyMoon has their
permission to appear on the marketing site". This overrides RESEARCH D7 for these 10 profile pictures
on the marketing site, faces only: never a name, handle, link, location or figure beside them. The site
uses anonymised copies, public/hero/creators/c01.webp to c10.webp (192 px), so no handle reaches the
HTML or the JS (check:site and measure still deny every handle and name).

**Scope (same day):** "this is only for brands, for influencers we will do something else". The rings
and the agent card are the brands hero only; the creators hero keeps today's eclipse until its own
concept. The creators-only items (the cut wedge, the creators material) are deferred.
Also dropped: the star's light reaching toward the field ("you can delete this"). Focus still turns the star to face the visitor.
Locked: the switch animation stays exactly as it is ("keep the star flip animation", "keep the eclipse
animation while switching tab"): the star's tumble through an edge-on liquid sliver with a dispersion
flash into the other material, the diamond-ring bead travelling half the rim with its trail, and the
corona warming violet to pink (and back).
Ring opacity, pinned (Mostafa: "increase it by 10%"): the inner ring of creator pictures at 50% opacity,
the outer ring at 35%, both still fading to nothing toward the cluster's edge with the radial mask.

**More faces, and the platform icons (5 Oct).** "Replace 5 creators profile pictures with these icons randomly":
five circles now show Facebook, Instagram, Snapchat, TikTok and YouTube marks (public/hero/platforms, recreated
from simple-icons glyphs on brand colours). "Replace the repeated creator profile pictures with some other from web
based in MENA and you can add some men": he approved downloading 16 Unsplash portraits (free Unsplash licence:
commercial use, no attribution required; it does not allow implying the people endorse HeyMoon, so they are never
named or described as HeyMoon creators). Every face circle now shows a different person. Sources, as
public/hero/creators file -> unsplash.com/photos/<id>:
c11 ZBdKvfexoh0 · c12 f49XhYbpiA0 · c13 fLxvz8EjCoQ · c14 dvtRiyRaebk · c15 PuJlKSPNaS8 · c16 ctClE19woNI ·
c17 1w9I6H4aftw · c18 lVhZ0aNzCWg · c19 ruWf1KGPPsY · c20 yQA11IaTA58 · c21 ny0LoUeptkI · c22 KD2h-E98RkM ·
c23 prBNzhikrDo · c24 mtjZgt_PU_8 · c25 W2ux-aiCKpU · c26 B0sP5phgEVQ (6 Oct: replaced tnQuaiP9njQ, a face wrapped
in white cloth that read as a blur in the ring: "pick another influencer profile picture than this one").
Ring opacity raised again ("by another 10%"): inner 60%, outer 45%. The nav button reads "Login".

**The logo's typeface (6 Oct).** Asked for a suggestion for the wordmark's font, he chose Sora ("use sora") from eight
set side by side (Geist, Outfit, Sora, Urbanist, Readex Pro, Space Grotesk, Unbounded, Plus Jakarta Sans). The
wordmark is Sora SemiBold at -0.03em everywhere it appears: the landing's nav and footer, the giant dotted
"HeyMoon" under the footer, and both product apps. Only the logo changes: every other line stays in Geist (landing)
or Figtree (apps). The font ships as a 1.2 kB subset of the ten glyphs in "HeyMoon.AI".

**No glints on the rim (6 Oct).** "The stars around the eclipse can you remove it keep only the big shiny one": the seven
agent glints fixed on the rim (one per agent, lit in turn by the agent clock, by typing and on submit) are gone from
the shader, the renderer's state, the DOM fallback dots and the contract (GLINT_DEG, LEVEL, REST_AGENTS, setAgents).
The diamond-ring bead is the rim's only star. The agent card, the bead's switch travel, the submit turn and the comet
are unchanged. Posters re-rendered.

**More platforms, no credit line (6 Oct).** "Add snapchat facebook and x": the creators Connects row shows Instagram,
TikTok, Snapchat, Facebook and X squares (the last three are MORE_PLATFORMS in close/Connects.tsx, outside the demo's
bound DEMO.creators.platforms, which stays Instagram and TikTok). The body line still says "Instagram or TikTok." until
he rewrites it. "Remove this": the close's credit line "Built by AI. Backed by HeyMoon.AI, a Saudi company." is gone
(COPY.shared.credit deleted; the signature under the number section stays).

**The shortfall row (6 Oct).** "Add a new section here for we pay the difference of the guaranteed ROAS if not
achieved": a third brands row in the number section, after the ROAS dial, reverses the 5 Oct removal for this row
only (row 1 keeps "Every campaign is built to generate sales."). H2 "Miss the ROAS? HeyMoon pays the difference."
(the product's own line is "Miss the number? HeyMoon pays the difference.", lib/i18n landing.v2t; PlanCard: under the
floor, HeyMoon pays the difference and the brand still banks the guaranteed figure). The figure is an example worked
from DEMO's guarantee: a close at 4.3x instead of 5x on $12,500 makes $53,750, so HeyMoon pays $9,300 of the
$63,050, labelled "An example, not a forecast." Same day, "remove this and bring this bar above": the "Paid by HeyMoon" eyebrow and the
$9,300 figure are gone; the bar and its legend lead the column, then "HeyMoon pays the rest of the $63,050 it
guaranteed, if the campaign closes at 4.3x instead of 5x." The promo headlines are one line each at one shared size.

**The Creators hero: the payout track (7 Oct).** Asked what should sit around the star on Creators, he saw three
concepts, then six more from a design round (12 ideas, three judges), and picked concept 6, "Paid that week" ("apply
this concept"). One thin ring at 0.40 S, broken by the star's arms into four arcs clockwise: Campaign matched, Held for
you, Orders counted, Paid. ("Change Funded to be Campaign matched": the hero's list is COPY.creators.track; the
number section's rail keeps "Funded".) Each arc is a light trail; Orders counted is a tally of ticks; Paid is the one
pink arc, peaking beside the Creators bead, with a pink check on its label. Drawn in the shader on Creators only, so it
is in the poster; on the switch the Orders and Paid arcs appear behind the travelling bead; a 24 s idle loop (one
week) dims the steps and lights them again in turn; typing dims it to 45%. The labels are DOM in the agents chunk, and
the Creators card reads "MoonScore AI · Your share for this week is on its way".
Same day, "make it live so the lines appear before the text which looks weird; draw the lines when the text of it
appears": the track is now drawn in, not shown at rest. The poster (REST) is the star alone; after release each arc
draws clockwise like a pen stroke and its label fades in as its arc starts (Campaign matched, Held for you, Orders
counted, then Paid), from 0.4 s after release on load and 1 s after a switch lands. The renderer is the one clock: it
writes the label states on its canvas (data-track) and the labels follow. The idle loop dims the steps and draws them
again. With no WebGL (reduced motion, Save-Data, a failure) there are no arcs and no labels.
