# HeyMoon — agentic creators

The creator side of HeyMoon, built as the mirror of `../moontech-agentic-brands`.
Same stack, same design system, same three rules enforced in code. The brands app
reads a store and sells a guarantee. This reads a person, tells them which live
campaigns want somebody like them, and takes them as far as joining one.

```bash
npm run dev     # http://localhost:3003
```

Sibling to `../moontech-agentic-brands` (port 3002), which is unchanged. Next 14,
TypeScript, Tailwind 3.4, Figtree (product), Geist (landing), Phosphor.

**The UI is the Figma's.** Every token, component and screen here was read off
`Moontech-INF / NEW UI` with `get_design_context` and rebuilt for the web — see
"The design system" below. The agentic architecture underneath is the brands
app's.

**This is v0.2.** v0.1 priced creators; the 21 Sep design review deleted that
whole idea, and [`REVIEW.md`](REVIEW.md) is the checklist of what it asked for,
verbatim, with what was done about each. Read that first if you saw v0.1.

---

## The one idea

A creator is not matched on how many people follow them.

```
where your audience is    ← the share of it inside the markets the brand ships to
how much of your grid     ← the share of your last thirty that was NOT paid work
   is advertising
how consistently you post ← cadence, and how long you have kept it up
who the brand asked for   ← age and gender against yours
```

Those four, weighted 35 / 25 / 20 / 20, are the match. Audience size is not one of
them and moves none of them, which is the whole argument:

> **Rasha:** we don't focus on the followers... views, followers, reach. We focus
> more on their influence — authenticity, consistency. Even with a million
> followers they might not be the right fit.

The score sets what happens rather than being shown as a number:

| Match | What it means |
| --- | --- |
| **0.70 and up, top three** | **Pre-qualified.** Featured first, and joining is the creator's to do. No brand review. |
| **0.50 and up, the rest** | **Strong match.** A request to join that the brand answers, with a reason either way. |
| Under **0.50** | Not brought at all. Said in the read, with what would change it. |

**Pre-qualified is capped at three.** 0.70 is the line a campaign has to clear,
and of the ones that clear it only the creator's three strongest are
pre-qualified (`PREQUALIFIED_CAP` in `model.ts`, applied in `offersFor`). Those
three are the ones the conversation brings and the ones Explore features. Every
other campaign is on the dashboard under Campaigns → Pending as a request to
join. Without the cap Mais was pre-qualified for fifteen of sixteen, and a
status most campaigns have tells a creator nothing.

The category is a gate rather than a weight: a brand that does not buy this kind
of creator is not a weak match, it is not a match.

**Worked example.** Asma Al Azmi has 18,200 followers — sixty times fewer than the
biggest account in the fixtures — and is the strongest match on the platform:
the highest match scores in the fixtures, on 54% of her audience being in Kuwait,
seven posts a week since 2019, and two thirds of her grid being her own work. A
follower-ranked market would never have shown her to anybody.

---

## How a campaign works

Read off the Figma's Campaign details screen, which is the most fully
specified thing in that file. Three parts of it this app had wrong at first:

**A campaign is a bundle, not a post.** It asks for a set of deliverables with
counts, per platform — 3 In-Feed Videos and 2 Reels — and what a creator earns
is a share of every order the whole bundle brings in. A campaign asking only for
formats the creator does not publish never reaches them.

**A campaign carries its terms on the face of the card**: duration (`30 days`,
or the design's real value `No end date`), countries, target age, target
gender, the platforms, the share it pays, and `Pre-qualified` when HeyMoon has
already cleared this creator for it.

**Joining is a request only when it has to be.**

- **Pre-qualified** — press **Join Campaign** and it is yours. HeyMoon cleared
  it, the brand was never asked, and pretending otherwise would invent a
  decision to take credit for.
- **Strong match** — press **Request to join** and the brand answers. Nothing
  is owed either way until it does, and the button reads *Request sent. Waiting
  for the brand* in the meantime.

Either way the cadence comes first — daily, 3, 2 or 1 post a week, which the
brand sees, so it is a promise rather than a preference — then the terms, which
say what the creator is agreeing to and in the same weight what they are **not**.
Then they press it.

**And only then is there a number.** The orders → earnings calculator appears in
the conversation the moment a campaign is theirs, never before:

> **Alex:** we want to calculate when you join a campaign, not before... if I
> make that many sales for this brand I expect this much money — a scroll, like
> a bar.

## The two payment models

Both are modelled; HeyMoon runs one. The product says which, on every campaign,
because the review asked it to:

> **Alex:** you need to explain the difference between [ROAS] and [CPA]
> campaigns... really explain them very very well and then "hey, we're going to
> now support this".

| | Performance | Fixed fee |
| --- | --- | --- |
| Payout Rate | `12% per Order` | `Fixed fee` |
| The Figma's tooltip | *"You will earn 10% of the total order value for every successful order you generate."* | *"This is the fixed base payment of $100 USD for the campaign, paid regardless of performance."* |
| Commits to | every **order** | the **campaign** |
| Floor / ceiling | neither | both |
| Early bird | `+3% per order` | `+$60` |
| In the ledger | never really closes. **Live performance**, and the number keeps moving | would settle at a figure and stop |
| **On HeyMoon today** | **yes — every campaign** | no |

> **Mostafa:** the first change will only work with the percentage rate. There's
> no fixed fee.
> **Alex:** we don't want to go with ad rates now. We want to stick to [ROAS].
> That's going to be the MVP.

`PayKind` stays in the type so a fixed-fee campaign is expressible the day
HeyMoon runs one. Nothing seeds one, and `CAMPAIGN_MODELS` carries the
`supported: false` that every screen explaining them reads from.

**The code and the tracking link are how any of it is paid.** A campaign pays a
share of the orders attributed to them, so a draft missing its code is the one
miss the Pre-upload Check argues hardest about — it is the creator's money, not
the brand's paperwork. Both sit in one pinned, copyable card on the campaign:

> **Alex:** it's all about the coupons. Now it's about the tracking links. That
> would be the next step they do in the dashboard.

**Repeat exposure, not fresh reach.** Five posts on one account reach roughly one
audience five times, not five audiences. The first counts in full, each one after
it counts for 40% (`effectiveExposures`). This is why a five-deliverable luxury
campaign forecasts 25 orders for Mais rather than 49, and the difference is
between a forecast a creator will believe and one they will not.

## The demo, in order

### 1. `/` — the landing, in the brands register

It follows the brands landing section for section, under the same claim,
**"Your posts already sell. Take a cut of it."** Every mock on it is bound to
the demo read and shows no person, no money figure and no rate. The field still
sends a handle to `/c`.

Three handles are seeded:

- **`@mais.mustafa`** — the case the product is built to win. 44K followers,
  ninth of ten on the brands app roster by following, and fifteen of sixteen
  live campaigns clear the pre-qualified line for her. She is pre-qualified for
  the top three, and the rest are requests to join.
- **`@ghalya.mu2`** — 1.1M followers, and it buys her nothing extra: 43% of her
  grid is already advertising, and FreshGrocer does not want her at all because
  she has never shot food. She matches four, on the Saudi audience and the
  cadence.
- **`@sara.creates`** — the one HeyMoon has nothing for. 260K followers, 61% of
  the grid paid, under a fifth of the audience anywhere a brand ships to. Said on
  the first screen with what would change it. A made-up handle, deliberately: no
  real person is used to illustrate a refusal.

### 2. Named agents read the person

Nine layers, about fifteen seconds, out of order because the work finishes out of
order. Five of the seven agents, doing their own jobs from the other side:

| Agent | Stage | On a creator |
| --- | --- | --- |
| **MoonShot AI** | Intake | The brief is the person, so it reads them |
| **MoonMatch AI** | Matching | Wants the audience, and decides what HeyMoon can place them on |
| **MoonScore AI** | Optimization | Reads how the posts perform, and never shows it as a valuation |
| **MoonWriter AI** | Creative | Wants the register, to write a brief in it |
| **MoonSearch AI** | Safety | **Vets the brands, for the creator's risk** |

MoonSearch is the inversion worth knowing. On a brand's account it vets creators.
Here it vets brands: who is already in the grid, what that blocks, and which
campaign would put two competitors on one feed.

The read ends on `standing`: whether any brand running today wants this person,
and the answer is the campaigns rather than a number. **Reach is read and never
displayed** — matching needs to know how far a post travels; a creator being told
their view-through is what they are worth is the thing the review cut.

### 3. Your profile, and there are no rates on it

> **Alex:** we no longer want to use the word card. What is a card? It's not an
> intuitive concept.
> **Rasha:** the concept of card, also rate card — we don't really use it.
> **Mostafa:** we can call it building your profile.

The mobile design has this screen as **Socials & AD Rates**: a list of formats
with a price typed in beside each — four identical `$100`s, because a person with
no data guesses one number and repeats it. v0.1 computed those prices instead.
v0.2 has no price on the screen at all.

What is left is what matching actually reads, as four sentences: where the
audience is, how much of the grid is the creator's own work, how consistently
they post, and how long a cut takes them. Plus what they will take — work a
month, turnaround — and what they will not, at all, whatever it pays.

### 4. Free text changes it

`three a month` · `no gambling or vaping` · `Instagram only` · `when do I get
paid?` · `why did this match me?`

Every change is attributed, and the campaigns on screen re-match, because the
match runs on the profile. **Money questions get an explanation, not a setting**
— `interpret` parses no figures, and `$500` returns the same answer as *how much
do I get*: nobody sets a rate here.

**A question interrupts the flow, and the flow comes back.**

> **Alex:** there are always things they could ask, interrupt the flow. That's
> fine. They interrupt, we answer them, and we go back to the flow.

The open step is *moved* to the end of the thread rather than copied, so the
answer lands and the question that was waiting is live again — and there is never
a second live copy of the same control.

### 5. Join, and then the calculator

**The first Join Campaign makes the account**, and nothing before it asks for
one. A popup (`AccountSheet`) takes a first and last name, prefilled from the
read and editable, and a phone number with its country code, defaulting to
where the read placed the creator. Then a six-digit code. It is the brands
app's sign-in beat for beat, and like it, it prints a demo code under the boxes,
because no message leaves a prototype. The popup is not part of the
conversation and leaves nothing in the thread. It closes the moment the code is
verified and the join carries on to the scheduling question. Closing it
without verifying starts nothing, and a creator with an account is never asked
again. The dashboard's own Join button opens the same popup.

There is no dashboard without a profile, since the conversation is what builds
one. Opening `/dashboard` without a profile goes to `/`, and the landing page's
Dashboard link only shows for a returning creator.

Cadence, then terms, then the press. The terms block says what the creator is
agreeing to and, in the same weight, what they are **not**: nothing exclusive, no
usage past 90 days, no say over their other posts, and nothing about a minimum —
a quiet week pays less and a good one pays more. That second list is the half a
creator signing with a brand never gets told.

Pre-qualified joins outright. Anything else is a request to join, and the
brand answers on its own beat rather than in the same frame — a request
answered instantly is not a request.

Then the calculator: drag orders, see what it pays, with the arithmetic under it
and what three campaigns at that rate come to. **Connecting Instagram is not
asked here at all.**

> **Rasha:** connecting their Instagram might be too early from just a
> conversation.
> **Alex:** absolutely — especially as we already got their handle in the first
> step. Let's delay the connection for later.

It is an alert on the dashboard, the way the store connection is on the brands
side.

### 6. `/dashboard` — the work, while it runs

The Figma's four tabs and nothing else — **Explore · Campaigns · Earnings ·
Profile** — plus **Ask Moon** beside them. Activity and the autonomy page are
reached from Profile.

> **Alex:** the left side is going to be taking the settings out.

**Reporting a post is the best thing in the product, and the idea is the mobile
design's.** It has a *Pre-upload Check*: seven boxes — Product intro, Quality and
lighting, Review and styling, Price transparency, Code visibility, Link
distribution, Brand tagging — which the creator ticks about their own work.

Same seven lines here, and the same two-step Send report behind them. The
difference is who checks. MoonWriter AI wrote the brief, so it reads the cut back
against it and says which ones it cannot find, with the timecode and the fix. It
runs **before the brand sees anything**, so a fixable miss costs a re-cut instead
of a decline on a record that follows you.

> **Alex:** by closing, we're calling it "you report a post".

This is the activation event, and the end of the journey the call agreed:
`qualify → match → activate`.

### 7. The loop

MoonLearning AI feeds a finished post back into the other agents. The Activity log
carries the real one: a first post that did 31,400 views against the 18,900 a post
of hers usually does, and 19 orders against the 7 to 23 MoonScore AI expected —
which is what re-weights the next match, rather than anybody arguing.


## Three rules, enforced in code

**No figure without a source.** Numbers reach the UI as `Sourced<T>` and render
through `<Figure>`, which refuses to draw a value with no evidence and shows a red
`unsourced` marker instead. Press any number for the sentence, the arithmetic and
the evidence rows.

**Nothing irreversible in a tool.** Stronger here than on the brands side, because
what an agent could overreach on belongs to a person. `request_accept` and
`request_send` return a *request*. No tool accepts a brief, signs anything or
posts to an account. Three autonomy rows are locked at Never and there is no
screen that moves them:

- Post to your accounts
- Join a campaign, or sign anything
- Report a post as live on your behalf

**Streaming, not timers.** A caller never learns a duration. `total` is work
discovered so far and grows; cancelling keeps the partial. Pacing is derived from
the size of each unit, so nothing is metronomic.

---

## How it is built

```
app/
  page.tsx           the landing, section for section with the brands landing; mocks in components/landing/
  c/page.tsx         the agent — conversation plus a panel of profile, campaigns, read
  dashboard/         the work, on the brands app's own shell
  [...legacy]/       every old creator-app route redirects to /c
  components/
    figma.tsx        the file's components, rebuilt at their measured sizes
    ui.tsx           the primitives: gradient pill, chips, tabs, sheet, KV row
    blocks.tsx       the typed thread blocks, every one a record once answered
    chat/            ChatShell, Composer, Turn, PanelHost
    panels/          CampaignDetail · CampaignsPanel · ProfilePanel · ReadPanel
    dashboard/       Sidebar · Topbar · views (Explore, Campaigns, Earnings, Profile) · Assistant
    landing/         Mocks · Run · Constellation
  lib/
    agent/
      types.ts       the whole agent boundary — screens import this and nothing else
      tools.ts       the mock implementation. The only file that knows it is fake.
      model.ts       the numbers — matching, orders, earnings. No creator rate.
      stream.ts      partial results, growing totals, cancel
      rng.ts         determinism. There is no Math.random in this project.
    mock/            people, brands
    store.ts         session state, one module store behind useSyncExternalStore
```

`REVIEW.md` is the 21 Sep checklist and the one file to read before changing any
of this — most of what looks like a missing feature is a deliberate deletion with
a quote attached.

**Swapping in a real model** means writing another object that satisfies
`AgentTools`. No screen changes: the UI already talks only to that interface, and
the free-text path is one function (`interpret`) that today is regexes and says so
in a comment.

### The design system

Read off the Figma node by node rather than approximated from screenshots:

| | In the file | Here |
| --- | --- | --- |
| Type | Figtree 400/500/600/700; 40 / 24 / 20 / 18 / 16 / 14 / 12 / 11 / 10 | `next/font/google`, the same scale named in `tailwind.config.ts` |
| Ink | `#12151B`, body on black at 90 / 60 / 50% | `ink`, `ink-90`, `ink-60`, `ink-50` |
| Main | `#4D2FB0`, chips at 10%, countdown bar at 80% | `main`, `main-10`, `main-80` |
| Surfaces | tile `#F3EFFC`, payment card and back button `#FAFAFA`, rules `#EBEBEB` | `lilac`, `paper`, `line` |
| Tints | exclusive `#FF8400` at 20%, prepaid `#25A333` at 10%, delta `#4FEA57`, progress `#FFE538` | `orange`, `green`, `lime`, `sun` |
| Radii | chip 8, inner 12, card 16, tile 24, sheet 32, pill 100 | same names |
| Shadow | `0 4px 4px rgba(17,17,17,.04)` | `shadow-card` |
| Gradients | header, primary button and bonus card are exported as images | nearest CSS in `globals.css`, colour-matched at the stops the export reported |
| Landing | the brands register | `ground` #FCFBF8, `deep` #141229, `shadow-hm-field/card/mock`, `hm-*` classes in `globals.css`, Geist |

And the components, each a node in the file rebuilt at its measured size
(`app/components/figma.tsx`): the campaign card (4px-padded 16px card, 160px
image, 28px countdown bar, 20px platform squares, payout and Pre-qualified
chips), the
campaign row, the lilac stat tile with its icon top-right, the Early Bird card,
Payment Details with the ⓘ, the per-platform Deliverables card, the gradient
header with the yellow "Ads completed" bar, and the floating tab bar.

### What is the Figma's, and what the agent adds

**Screens taken as drawn:** Explore (the Main page), Campaign details, the
Scheduling preference sheet, Application Status, Your Campaigns with its three
tabs, Stats, Earnings by Brand, Closed Ads, Socials & AD Rates (rebuilt as
**Your profile**), Profile, and the Pre-upload Check's seven lines with its
two-step Send report.

**What changed is who does the work.** The profile is read off the grid rather
than typed; the seven checks are run against the cut rather than self-certified;
the campaign list is what wants you today rather than a board; and every figure
opens into the arithmetic that produced it. The conversation at `/c` is the
file's onboarding, done by talking.

**And one screen is gone rather than rebuilt.** The Closed Ads prepaid /
postpaid switch was a control over an empty half once there was no fixed-fee
campaign left to settle, so Earnings is one ledger.

**Every answered block becomes a record.** A conversation is a transcript. Once
you have chosen a cadence or pressed Join Campaign, that block renders from what
was actually submitted and its controls are gone. Changing your mind is a
sentence in the message box, and the agent builds a new block.

### Desktop, not a phone enlarged

The Figma is a mobile app, so every screen in it is a 375px column. Rebuilt for
the web that has a failure mode the file cannot warn you about: the same column,
centred, with a metre of white either side and a chevron a thousand pixels from
its label. The dashboard was that at first.

Widening the column was not enough, and the second pass is the interesting one.
**Size a repeating unit by the column it occupies, never by the viewport.** The
rail takes 232px and Ask Moon up to 400px, so a 1600px viewport leaves a
904px content column — and a `2xl:grid-cols-4` keyed to the viewport *shrinks a
phone card* in it instead of adapting. Card grids are
`repeat(auto-fill,minmax(<the width the card was drawn for>,1fr))` with a
max-width ceiling so a lone item cannot balloon. The same mistake recurs one
level down: the masthead's own two-column split is `flex-wrap`, not a media
query, because its width depends on whether the assistant is open.

**Add rank above and below the body; never shrink the body.** `text-body` is
14px at every width — it is the Figma's reading size. Desktop hierarchy comes
from two new steps that bracket it: `text-eyebrow` (11px, tracked, uppercase)
for column heads and figure captions, and `text-head` (17px) for section
headings, because a 20px head over a 14px body is a phone's ratio.

**Many things are rows in one bordered surface, under column heads.** Not one
floating card per item. `ROW` in `figma.tsx` is the track contract the heads and
the cells both read, so they cannot drift.

**A desktop surface is a keyline plus a 1px contact shadow** — `border-hairline`
and `shadow-edge`, on `bg-canvas` ground. `shadow-card` (0 4px 4px) and
`rounded-tile` (24px) are never redefined: those *are* the phone.

Every desktop class is `md:`/`lg:`-prefixed or lives in a node that only exists
above a breakpoint, and every new prop defaults to off, so the phone renders the
exact class strings it rendered before:

| View | On a phone | On a desktop |
| --- | --- | --- |
| Explore | the file's home card, then one card per row | a greeting line, the gradient reduced to a 196px masthead beside two stat tiles, one genuinely featured campaign, a column-sized card grid, and every campaign as rows under column heads |
| Campaigns | full-width underlined tabs, stacked cards | one header line with the tabs as a segmented pill and a sort control; Active as cards carrying three numbers under a rule, Pending and Completed as rows under column heads |
| Earnings | stat tiles 2-up, lists stacked | tiles 4-up, both lists two across |
| Campaign detail | one scrolling sheet | two columns — what it asks for, and what it pays; the key facts two-up; the action at its own width |
| Profile | a settings list | a settings list, at a readable measure. This was briefly two columns with the identity in a rail; it was worse, and the person who has to look at it said so. |
| Activity, autonomy | stacked cards | two or three across, prose capped by `dash-measure` |

The conversation at `/c` is the exception and stays a 720px reading column,
because that is what it is.

### Known edges

- A hard refresh keeps your work but not what was on screen. A read that was
  interrupted mid-stream is dropped rather than restored as a dead stub.
- Only the three seeded handles have fixtures, plus `@sara.creates` for the
  refusal. Anything else falls through to the first one.
- Persisted state is version-keyed (`mtac_state_v6`) and shape-guarded: a saved
  campaign missing `match`, `commissionPct` or `trackingLink`, or carrying
  `payKind: "prepaid"`, is thrown away rather than rendered. Changing a persisted
  shape means adding a check there, not remembering to.
- The copy has not been through a copy review. Alex: "the copy is not reviewed
  yet", and an Arabic copy skill is coming.
