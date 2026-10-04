"use client";
/* STUB (WP0). WP2 owns this lab page. Calls notFound() in production; WP-F deletes lab/. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { WorkSection } from "../../_site/window/WorkSection";

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="window" surface="paper">
      {(a) => <WorkSection audience={a} />}
    </LabFrame>
  );
}
