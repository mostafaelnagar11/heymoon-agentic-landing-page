"use client";

/* The sample account a login from the landing page opens onto (Mostafa, 20 Oct: "when i click on login and logged
   in show me a dashboard with data not the empty state one").

   The landing's Login verifies a code and comes here with ?signin=1. A browser that has built nothing would land on
   "No campaign yet", which is true and useless for showing the product, so a returning login gets the account a
   returning brand would have: Ounass, read and planned the way the conversation does it, its first campaign on the
   running ladder (Phase 1 done, Phase 2 live, drafts waiting), paid, the store connected, the brand account owned.
   A browser that already has a campaign keeps its own; one with a campaign and nobody signed in is signed in. */

import { fixtureFor } from "./mock/reads";
import { readIdFor, rememberRead } from "./agent/registry";
import { judge } from "./agent/eligibility";
import { planFor } from "./agent/tools";
import {
  claimBrand, connectStore, currentAccount, hasCampaigns, markPaid, putCampaign, putPlan, putRead, signIn,
} from "./store";

const SAMPLE = { url: "ounass.com", firstName: "Sara", lastName: "Haddad", email: "sara@ounass.ae" };

export function openSampleAccount() {
  const now = Date.now();
  const who = { firstName: SAMPLE.firstName, lastName: SAMPLE.lastName, email: SAMPLE.email };
  if (hasCampaigns()) {
    if (!currentAccount()) signIn(who, now);
    return;
  }
  const base = fixtureFor(SAMPLE.url)(readIdFor(SAMPLE.url));
  const read = { ...base, eligibility: judge(base) };
  rememberRead(read);
  putRead(read);
  const plan = planFor(read, "balanced");
  putPlan(plan);
  putCampaign(plan, SAMPLE.url);
  markPaid();
  connectStore("shopify");
  signIn(who, now);
  const acct = currentAccount();
  if (acct) claimBrand(SAMPLE.url, read.identity?.name.value ?? "Ounass", acct, now);
}
