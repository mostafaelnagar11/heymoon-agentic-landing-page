import type { Metadata } from "next";
import { LegalPage } from "../_site/legal/LegalPage";
import { TERMS } from "../_site/legal/terms";
export const dynamic = "error";
export const metadata: Metadata = { title: "Terms and Conditions · HeyMoon.AI", description: "The terms and conditions for HeyMoon.AI." };
export default function Page() { return <LegalPage doc={TERMS} />; }
