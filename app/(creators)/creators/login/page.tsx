"use client";

/* Logging in, as its own address.
 *
 * The redesigned landing at /creators lives in the site's route group,
 * with its own design tokens, so it cannot render AccountSheet (which is
 * drawn in this app's tokens). Its Dashboard button links here instead,
 * and this page does what v1's button did in place: a creator already
 * signed in on this device goes straight to the dashboard, anyone else
 * gets the log-in sheet over this app's ground, then the dashboard.
 * Closing the sheet goes back to the landing. */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "../components/Wordmark";
import { AccountSheet, dialFor } from "../components/AccountSheet";
import { PEOPLE } from "../lib/mock/people";
import { signIn } from "../lib/session";
import { useAccount, useActiveProfile, useHydrated } from "../lib/store";

export default function Login() {
  const router = useRouter();
  const ready = useHydrated();
  const profile = useActiveProfile();
  const signedIn = useAccount() !== null && profile !== null;

  useEffect(() => { if (ready && signedIn) router.replace("/creators/dashboard"); }, [ready, signedIn, router]);

  return (
    <div className="min-h-[100dvh] bg-ground">
      <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center px-5 sm:px-8">
        <Wordmark size="md" />
      </header>
      {/* Held until the store has read this device, so a signed-in
          creator never sees the sheet flash before the redirect. */}
      <AccountSheet open={ready && !signedIn} mode="signin" name={profile?.creatorName}
        dial={dialFor(PEOPLE.find((x) => x.handle === profile?.handle)?.location ?? PEOPLE[0].location)}
        onClose={() => router.push("/creators")}
        onVerified={(a) => { signIn(a); router.push("/creators/dashboard"); }} />
    </div>
  );
}
