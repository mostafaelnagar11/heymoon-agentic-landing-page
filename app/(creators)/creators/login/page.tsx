"use client";

/* Logging in, as its own address.
 *
 * The redesigned landing at /creators lives in the site's route group,
 * with its own design tokens, so it cannot render AccountSheet (which is
 * drawn in this app's tokens). Its Login now opens the site's own phone
 * and code dialog; once the code matches, the site leaves the verified
 * number in sessionStorage under "hm_site_login" (never in the URL) and
 * comes here. This page reads it once, removes it, signs in and opens the
 * dashboard, with no second sheet.
 *
 * Without a handoff it does what v1's button did in place: a creator
 * already signed in on this device goes straight to the dashboard, anyone
 * else gets the log-in sheet over this app's ground, then the dashboard.
 * Closing the sheet goes back to the landing. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "../components/Wordmark";
import { AccountSheet, dialFor } from "../components/AccountSheet";
import { PEOPLE } from "../lib/mock/people";
import { signIn } from "../lib/session";
import { useAccount, useActiveProfile, useHydrated } from "../lib/store";

/* The site's handoff (app/(site)/_site/lib/login.ts LOGIN_HANDOFF_KEY), honoured for five minutes. */
const HANDOFF_KEY = "hm_site_login";
const HANDOFF_MS = 5 * 60 * 1000;

function takeHandoff(): { dialCode: string; phone: string } | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HANDOFF_KEY);
    const h = JSON.parse(raw) as { dialCode?: string; phone?: string; at?: number };
    if (!h.dialCode || !h.phone || !h.at || Date.now() - h.at > HANDOFF_MS) return null;
    return { dialCode: h.dialCode, phone: h.phone };
  } catch {
    return null;
  }
}

export default function Login() {
  const router = useRouter();
  const ready = useHydrated();
  const profile = useActiveProfile();
  const signedIn = useAccount() !== null && profile !== null;
  const [handedOff, setHandedOff] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const h = takeHandoff();
    if (h) {
      setHandedOff(true);
      signIn({ firstName: "", lastName: "", dialCode: h.dialCode, phone: h.phone, verifiedAt: Date.now() });
      router.replace("/creators/dashboard");
      return;
    }
    if (signedIn) router.replace("/creators/dashboard");
  }, [ready, signedIn, router]);

  return (
    <div className="min-h-[100dvh] bg-ground">
      <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center px-5 sm:px-8">
        <Wordmark size="md" />
      </header>
      {/* Held until the store has read this device, so a signed-in
          creator never sees the sheet flash before the redirect. */}
      <AccountSheet open={ready && !signedIn && !handedOff} mode="signin" name={profile?.creatorName}
        dial={dialFor(PEOPLE.find((x) => x.handle === profile?.handle)?.location ?? PEOPLE[0].location)}
        onClose={() => router.push("/creators")}
        onVerified={(a) => { signIn(a); router.push("/creators/dashboard"); }} />
    </div>
  );
}
