"use client";
/* STUB (WP0). WP1 owns this lab page. Calls notFound() in production; WP-F deletes lab/. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { Hero } from "../../_site/hero/Hero";

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="hero" surface="night">
      {() => <Hero />}
    </LabFrame>
  );
}
