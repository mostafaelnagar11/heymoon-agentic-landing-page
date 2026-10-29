import type { Metadata } from "next";
import { LegalPage } from "../_site/legal/LegalPage";
import { PRIVACY } from "../_site/legal/privacy";
export const dynamic = "error";
export const metadata: Metadata = { title: "Privacy Policy · HeyMoon.AI", description: "How HeyMoon.AI handles your personal information." };
export default function Page() { return <LegalPage doc={PRIVACY} />; }
