"use client";
/* STUB (WP0). WP5 owns this lab page. Calls notFound() in production; WP-F deletes lab/. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { AgentsBand } from "../../_site/agents/AgentsBand";

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="agents" surface="paper">
      {(a) => <AgentsBand audience={a} />}
    </LabFrame>
  );
}
