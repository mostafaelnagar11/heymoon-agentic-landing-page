"use client";
/* STUB (WP0). WP3 owns this lab page. Calls notFound() in production; WP-F deletes lab/. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { RunStage } from "../../_site/run/RunStage";

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="run" surface="paper">
      {(a) => <RunStage audience={a} />}
    </LabFrame>
  );
}
