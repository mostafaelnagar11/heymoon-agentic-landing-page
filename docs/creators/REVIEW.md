# Design review, 21 Sep 2026 — the checklist

Alex, Rasha and Mostafa, 25 minutes on v0.1. Alex asked for the comments
"as a checklist within the prototype", so here they are, verbatim where it
matters, with what was done about each.

**The journey, agreed in the call:** `qualify → match → activate`, where
activation is **reporting the first post**. Everything below serves that.

---

## 1. ROAS only. No fixed fee. — done

> **Mostafa:** the first change will only work with the percentage rate.
> There's no fixed fee.
> **Alex:** we don't want to go with ad rates now. We want to stick to
> [ROAS]. That's going to be the MVP.

Every campaign now pays a **share of the sales it drives**. `payKind` stays
in the model so a fixed-fee campaign can come back, but nothing seeds one,
and the product says plainly which model it runs on.

## 2. Explain the campaign models — done

> **Alex:** you need to explain the difference between [ROAS] and
> [CPA] campaigns... really explain them very very well and then "hey,
> we're going to now support this".

One explanation — `ModelsSheet` in `figma.tsx` — on every campaign:
what a performance campaign is, what a fixed-fee one is, and which of
the two HeyMoon runs today. It was a card of its own until 27 Sep 2026;
it now opens from the ⓘ beside "performance" on Payment Details. Not on the landing, because of item 13; the
agent gives the same explanation when asked.

## 3. Kill "card" and "rate card" — done

> **Alex:** we no longer want to use the word card. What is a card? It's
> not an intuitive concept.
> **Rasha:** the concept of card, also rate card — we don't really use it.

The artefact is **your profile**, and the agent says "building your
profile". "See your rates" on the landing is gone. "Campaign details"
stays, which Alex confirmed is fine.

## 4. Do not lead on followers, views or reach — done

> **Rasha:** we don't focus on the followers... views, followers, reach.
> We focus more on their influence — authenticity, consistency. Even with
> a million followers they might not be the right fit.
> **Rasha:** "43% of following watches, that is the number I price on" —
> [cut it]

Followers and views are gone from every creator-facing surface. What the
qualification now reports is **influence**: consistency, authenticity of
the grid, category authority, and audience in the markets brands sell to.
The numbers still exist inside the matching model; none is shown as the
thing the creator is judged on.

## 5. No per-view pricing language — done

> **Rasha:** this for example per view. We don't pay per view. What do we
> estimate per view?

Every CPM and "per thousand views" figure is deleted.

## 6. No creator-set rate — done

> **Rasha:** "your rate is set to 500" — this is also confusing.
> **Mostafa:** delete.

The rate bar, the ceilings and the whole "raise my rate" path are gone. A
creator does not price themselves here; the campaign's commission is the
price, and it is the brand's.

## 7. The calculator comes after joining — done

> **Alex:** we want to calculate when you join a campaign, not before.
> **Alex:** if I make that many sales for this brand I expect this much
> money... a scroll — if I make these many orders, I make this much money
> — like a bar.

`EarningsBlock`, in the thread the moment they join. (It was also on a
joined campaign's Stats tab until 27 Sep 2026, when it was taken off.)
The creator drags orders; it shows what that pays,
the arithmetic under it, and what three campaigns at that rate come to.
Nothing before joining puts a figure on it — the card carries the share
and the share only.

## 8. Match strength, and pre-qualified — done

> **Alex:** there should be a high match, medium match... the highest
> matching needs to be featured, clear, quick — just say join, and it's
> pre-qualified. The other campaigns we need to actually accept for them.
> Less matching could be "see other campaigns", maybe on the right.

- **Pre-qualified** campaigns are featured and **join immediately**, with
  no brand approval. A creator is pre-qualified for **three campaigns at
  most**: their three strongest matches over the 0.70 line.
- Every other campaign is a **request to join** from the dashboard
  (Campaigns → Pending), and the brand answers it.
- Weaker matches sit behind "See other campaigns".

## 9. Delay connecting socials to the dashboard — done

> **Rasha:** connecting their Instagram might be too early from just a
> conversation.
> **Alex:** absolutely — especially as we already got their handle in the
> first step. Let's delay the connection for later.
> **Mostafa:** I'm going to move it inside the dashboard, as we did with
> the brands and the store.

Out of the conversation entirely. It is an alert on the dashboard, the way
the store connection is on the brands side.

## 10. Coupons and tracking links are the dashboard's job — done

> **Alex:** it's all about the coupons. Now it's about the tracking links.
> That would be the next step they do in the dashboard.

The code was already pinned and copyable. The **tracking link** now sits
beside it, also copyable, per deliverable.

## 11. "Report a post", not "close an ad" — done

> **Alex:** by closing, we're calling it "you report a post".

`ReportBlock` — the Figma's two-step Send report, with the Pre-upload
Check in front of it, on the campaign's Ad Content tab. This is the
activation event and the last thing the agent hands over.

## 12. Settings out of the left rail — done

> **Alex:** the left side is going to be taking the settings out.

The rail is the Figma's four tabs and nothing else: Explore, Campaigns,
Earnings, Profile. Activity and the autonomy page live under Profile.

## 13. Landing page says less — done

> **Mostafa:** the landing page should show less information — the
> necessary information, that this is an influencer marketing platform
> where they can earn extra money. Anything else should be in the
> conversation.

One claim, one field. The arithmetic, the agents, the payment models and
the pre-upload check all came off it; the agent answers those when asked.

The claim itself was wrong on the first pass — "get paid for the posts
you were making anyway" tells an influencer something they know is
false, since they are already paid for sponsored work. It now says what
is actually different: **"Your posts already sell. Take a cut of it."**

**Superseded, 23 Sep 2026.** Mostafa asked for the landing to match the
brands landing's register. It is a full page again, with the read, the
match, the join, the pre-upload check and the seven agents, and it still
carries no money figure, no arithmetic, no payment-model table and no
rate. See app/page.tsx.

The mocks copy the product's own labels as they are, "Join Campaign" and
"Pre-upload Check" among them, at Mostafa's call: each mock is a likeness
of a real screen. Every sentence the landing itself says is sentence case.
Before the page goes outside the team, two things need a yes: the values
from the demo creator's read that the mocks show (listed at the top of
app/page.tsx), and Nabati Home as the first campaign on it. That was
Ounass until 24 Sep. Seven of the demo creator's campaigns tie on score,
and the order of the brand list used to decide which three led. A stated
tie-break now decides (market fit, then share, then closing date; see
PREQUALIFIED_CAP in model.ts).

## 14. Campaign imagery — done before the call

> **Mostafa:** the images is wrong, but it will be images relevant to the
> campaign.

Each campaign shows its product, on a tint keyed to the brand's category.
Real photography drops in via `image:` on the brand seed.

## 15. Questions may interrupt the flow, and the flow resumes — done

> **Alex:** there are always things they could ask, interrupt the flow.
> That's fine. They interrupt, we answer them, and we go back to the flow.
> **Rasha:** an influencer can ask, from the first analysis, "when do I
> get paid?"

Asking a question mid-flow answers it and then re-offers the step that was
open, rather than losing it.

---

## Not in 0.2

- **Copy review.** Alex: "the copy is not reviewed yet", and an Arabic copy
  skill is coming. Everything here is written to the brands app's voice
  rules; it has not been through that pass.
- **"Result space, not see…"** (00:07:46) was too garbled in the transcript
  to action. Worth two minutes in the next call.

---

## What the review changed in the numbers

Two model changes fell out of the above rather than being asked for, and
both are recorded here because they move every figure in the product.

**Repeat exposure, not fresh reach.** `expectedOrders` multiplied a
creator's median views by the *number* of deliverables, as if five posts
reached five audiences. They reach roughly one audience five times. The
first post now counts in full and each one after it counts for 40%
(`effectiveExposures`). On a five-deliverable luxury campaign that took
the expected order count from 49 to 25, which is the difference between
a forecast a creator will believe and one they will not.

**The seeded payouts now sit inside the model's own range.** They were
hand-written at three to four times what `expectedOrders` predicts for
the same person and campaign, so opening a figure contradicted the
calculator two screens away. Every one of them is now within the low-to-
high band, and the evidence under it says what the band was.
