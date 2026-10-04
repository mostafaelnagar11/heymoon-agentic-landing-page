import { redirect } from "next/navigation";

/* Every old bookmark lands on the agent. The creator app used to be a
   set of routes — onboarding, campaigns, statistics, account — and
   none of them exist any more: there is one conversation and one
   dashboard. A 404 for a link somebody saved is a worse answer than
   the place that replaced it. */
export default function Legacy() {
  redirect("/creators/c");
}
