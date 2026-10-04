import type { Metadata } from "next";
import { Landing } from "../_site/Landing";
import { COPY } from "../_site/copy";
export const dynamic = "error";
export const metadata: Metadata = { title: COPY.brands.meta.title, description: COPY.brands.meta.description };
export default function Page() { return <Landing initial="brands" />; }
