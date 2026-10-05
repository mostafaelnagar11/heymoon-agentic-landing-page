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
