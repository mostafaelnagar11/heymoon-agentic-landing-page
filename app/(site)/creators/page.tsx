import type { Metadata } from "next";
import { Landing } from "../_site/Landing";
import { COPY } from "../_site/copy";
export const dynamic = "error";
export const metadata: Metadata = { title: COPY.creators.meta.title, description: COPY.creators.meta.description };
export default function Page() { return <Landing initial="creators" />; }
