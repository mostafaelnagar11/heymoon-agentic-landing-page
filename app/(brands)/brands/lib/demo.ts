"use client";

/* The sample account a login from the landing page opens onto.

   The landing's Login verifies a code and comes here with ?signin=1. A browser that has built nothing would land on
   "No campaign yet", which is true and useless for showing the product, so the login opens a sample brand instead.

   Which state it opens changed at the 19 Oct review. It used to open Ounass two phases in (Phase 1 done, Phase 2
   live, drafts waiting), and the walkthrough jumped straight into an advanced dashboard. A login now opens the cold
   start, the way a brand who has just paid arrives (brand flows, P2): Ounass read and planned, Phase 1 paid, the
   brand account owned, and the launch tracker waiting on the store. The running account is still there for
   showing what comes later: /brands/dashboard?demo=running. (20 Oct: after paying the brand's next step is in the
   conversation, per the v0.2 PRD, so the tracker's "Continue in the conversation" picks up at the store.)

   A browser that already has a campaign keeps its own; one with a campaign and nobody signed in is signed in. */

import { fixtureFor } from "./mock/reads";
import { readIdFor, rememberRead } from "./agent/registry";
import { judge } from "./agent/eligibility";
import { planFor } from "./agent/tools";
import {
  claimBrand, connectStore, currentAccount, hasCampaigns, markPaid, putCampaign, putPlan, putRead, resetAll, signIn,
} from "./store";

const SAMPLE = { url: "ounass.com", firstName: "Sara", lastName: "Haddad", email: "sara@ounass.ae" };

export function openSampleAccount(opts?: { running?: boolean }) {
  const now = Date.now();
  const who = { firstName: SAMPLE.firstName, lastName: SAMPLE.lastName, email: SAMPLE.email };
  /* The running demo replaces whatever this browser holds: it is asked for by name, to show a phase in flight. */
  if (opts?.running) resetAll();
  else if (hasCampaigns()) {
    if (!currentAccount()) signIn(who, now);
    return;
  }
  const base = fixtureFor(SAMPLE.url)(readIdFor(SAMPLE.url));
  const read = { ...base, eligibility: judge(base) };
  rememberRead(read);
  putRead(read);
  const plan = planFor(read, "balanced");
  putPlan(plan);
  putCampaign(plan, SAMPLE.url, { running: opts?.running });
  markPaid(now);
  if (opts?.running) connectStore("shopify");
  signIn(who, now);
  const acct = currentAccount();
  if (acct) claimBrand(SAMPLE.url, read.identity?.name.value ?? "Ounass", acct, now);
}
