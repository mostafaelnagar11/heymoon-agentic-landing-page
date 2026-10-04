"use client";
/* STUB (WP0). WP6 owns this lab page. Calls notFound() in production; WP-F deletes lab/. */
import { notFound } from "next/navigation";
import { LabFrame, labAudience, type LabSearch } from "../_frame";
import { Connects } from "../../_site/close/Connects";
import { Close } from "../../_site/close/Close";
import { Footer } from "../../_site/close/Footer";

export default function Page({ searchParams }: { searchParams?: LabSearch }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <LabFrame initial={labAudience(searchParams)} title="close" surface="paper">
      {(a) => <><Connects audience={a} /><Close /><Footer /></>}
    </LabFrame>
  );
}
