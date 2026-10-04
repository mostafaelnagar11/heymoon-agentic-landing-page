"use client";
/* STUB (WP0). WP4 owns this lab page. Calls notFound() in production; WP-F deletes lab/. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { NumberSection } from "../../_site/number/NumberSection";

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="number" surface="paper">
      {(a) => <NumberSection audience={a} />}
    </LabFrame>
  );
}
