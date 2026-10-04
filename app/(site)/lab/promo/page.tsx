"use client";
/* STUB (WP0). WP7 owns this lab page. Calls notFound() in production; WP-F deletes lab/. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { Promo } from "../../_site/promo/Promo";

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="promo" surface="paper">
      {() => <div className="h-[200svh]"><Promo /></div>}
    </LabFrame>
  );
}
