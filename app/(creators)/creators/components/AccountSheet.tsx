"use client";

/* The account, asked for once, at the only moment it is needed.
 *
 * Everything before Join Campaign is free and anonymous: the read, the
 * profile, the three campaigns. A form in front of any of that would be
 * a toll gate on the part that shows a creator what they are worth. But
 * a campaign cannot be joined by nobody — the brand's brief, the code
 * and the weekly payout all belong to a person — so the gate sits at the
 * first press of Join Campaign and nowhere earlier.
 *
 * A POPUP, NOT A TURN. The sign-in is not part of the conversation and
 * leaves nothing in it: it opens over the page, and the moment the code
 * is verified it is gone and the join carries on to the scheduling
 * question, which was always the next thing. Closing it without
 * verifying starts nothing.
 *
 * The two steps are the brands app's sign-in (SignInSheet), beat for
 * beat, so the platform has one way in: a name and a phone with its
 * country code, Continue, then six boxes under a countdown with the demo
 * code printed below them.
 *
 * A phone rather than an email: in the Gulf the number is the account —
 * it is what a creator answers inside the hour, and it is where a brand
 * manager's question reaches them. The name is prefilled from the read
 * and stays editable, because the read knows what a creator is called
 * on their grid and only they know what goes on the account. */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CaretDown, ChatCircleDots, EnvelopeSimple, X } from "@phosphor-icons/react";
import { Btn, Sheet } from "./ui";
import { Wordmark } from "./Wordmark";
import { hash } from "../lib/agent/rng";
import type { Account } from "../lib/store";

const LEN = 6;
const EXPIRES_IN = 60;

/* The markets HeyMoon's creators are in, not a world list: a select with
   two hundred rows is a worse control than a short one that covers
   everybody who can use the product today. */
export const DIAL_CODES = [
  { code: "+971", flag: "\u{1F1E6}\u{1F1EA}", name: "United Arab Emirates" },
  { code: "+966", flag: "\u{1F1F8}\u{1F1E6}", name: "Saudi Arabia" },
  { code: "+965", flag: "\u{1F1F0}\u{1F1FC}", name: "Kuwait" },
  { code: "+974", flag: "\u{1F1F6}\u{1F1E6}", name: "Qatar" },
  { code: "+973", flag: "\u{1F1E7}\u{1F1ED}", name: "Bahrain" },
  { code: "+968", flag: "\u{1F1F4}\u{1F1F2}", name: "Oman" },
  { code: "+962", flag: "\u{1F1EF}\u{1F1F4}", name: "Jordan" },
  { code: "+20", flag: "\u{1F1EA}\u{1F1EC}", name: "Egypt" },
];

/** The country code for where the read placed somebody, so a creator in
    Jeddah does not start on the UAE's. */
export const dialFor = (location?: string) => {
  const l = (location ?? "").toLowerCase();
  if (/ksa|saudi|jeddah|riyadh/.test(l)) return "+966";
  if (/kuwait/.test(l)) return "+965";
  if (/qatar|doha/.test(l)) return "+974";
  if (/bahrain|manama/.test(l)) return "+973";
  if (/oman|muscat/.test(l)) return "+968";
  if (/jordan|amman/.test(l)) return "+962";
  if (/egypt|cairo/.test(l)) return "+20";
  return "+971";
};

/* Deliberately loose. It checks that a person typed a number rather than
   policing which numbers exist, because the code that arrives there is
   what actually proves the account. */
const digitsOf = (v: string) => v.replace(/\D/g, "");
const LOOKS_LIKE_PHONE = (v: string) => digitsOf(v).length >= 7;
const LOOKS_LIKE_EMAIL = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/* Derived from the number rather than drawn at random, the same way the
   brands app does it: the same phone always gets the same six digits,
   so a walkthrough, a screenshot and a test all agree. */
const demoCodeFor = (dial: string, phone: string) =>
  String(Math.abs(hash(`${dial}${digitsOf(phone)}`)) % 1_000_000).padStart(LEN, "0");

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const LABEL = "mb-1.5 block text-meta font-medium text-ink-60";
const FIELD = "w-full rounded-inner border border-black/10 bg-white px-4 py-3 text-body text-ink outline-none transition placeholder:text-ink-40 focus:border-main/50";

export function AccountSheet({ open, mode = "signup", brand, name = "", dial: startDial = "+971", email: startEmail = "", onClose, onVerified }: {
  open: boolean;
  /** "signup" at the first Join: a name and a phone. "signin" from the
      landing's Dashboard button: the phone alone, because the number IS
      the account — asking a returning creator for their name again is
      asking them to prove something the code already proves.
      "phone" and "email" are the Profile page's: a new number, or an
      email address, each confirmed with a code the same way. */
  mode?: "signup" | "signin" | "phone" | "email";
  /** The campaign the creator pressed Join on, so the sheet says why it
      is asking. */
  brand?: string;
  /** The name the read found, split on the first space. */
  name?: string;
  dial?: string;
  /** The email already on the account, to start from. */
  email?: string;
  onClose: () => void;
  /** Runs once the code is verified, with what was typed. The caller
      closes the sheet, and on the Profile page merges the one field
      that changed into the account it already has. */
  onVerified: (a: Account) => void;
}) {
  const [step, setStep] = useState<"details" | "code">("details");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dial, setDial] = useState(startDial);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [left, setLeft] = useState(EXPIRES_IN);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const firstField = useRef<HTMLInputElement>(null);
  const phoneField = useRef<HTMLInputElement>(null);
  const emailField = useRef<HTMLInputElement>(null);

  const byEmail = mode === "email";
  const code = byEmail ? demoCodeFor("@", email.trim().toLowerCase()) : demoCodeFor(dial, phone);
  const typed = digits.join("");
  const expired = left <= 0;
  const signin = mode === "signin";
  /* Only the first join asks for a name: everywhere else the account,
     or the read, already has one. */
  const named = mode === "signup";
  const ready = byEmail ? LOOKS_LIKE_EMAIL(email) : (!named || (!!first.trim() && !!last.trim())) && LOOKS_LIKE_PHONE(phone);

  /* Every open is a fresh attempt, prefilled from the read. A sheet that
     reopens holding a half-typed code from an abandoned run looks
     broken. */
  useEffect(() => {
    if (!open) return;
    const [given, ...rest] = name.trim().split(/\s+/);
    setStep("details");
    setFirst(given ?? "");
    setLast(rest.join(" "));
    setDial(startDial);
    setEmail(startEmail);
    setDigits(Array(LEN).fill(""));
    setBusy(false);
    setWrong(false);
    const t = setTimeout(() => (byEmail ? emailField : named ? firstField : phoneField).current?.focus({ preventScroll: true }), 120);
    return () => clearTimeout(t);
  }, [open, name, startDial, startEmail, named, byEmail]);

  /* The countdown belongs to the code step and restarts with it, so
     going back to fix the number does not leave a stale clock. */
  useEffect(() => {
    if (step !== "code") return;
    setLeft(EXPIRES_IN);
    setDigits(Array(LEN).fill(""));
    setWrong(false);
    const t = setTimeout(() => boxes.current[0]?.focus({ preventScroll: true }), 120);
    const id = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [step]);

  const sendCode = () => {
    if (!ready || busy) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); setStep("code"); }, 850);
  };

  const again = () => {
    setDigits(Array(LEN).fill(""));
    setWrong(false);
    setLeft(EXPIRES_IN);
    boxes.current[0]?.focus({ preventScroll: true });
  };

  const verify = (entered: string) => {
    if (entered.length < LEN || busy || expired) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (entered !== code) {
        setWrong(true);
        setDigits(Array(LEN).fill(""));
        boxes.current[0]?.focus({ preventScroll: true });
        return;
      }
      const now = Date.now();
      onVerified(byEmail
        ? { firstName: first.trim(), lastName: last.trim(), dialCode: dial, phone: "", verifiedAt: now, email: email.trim(), emailVerifiedAt: now }
        : { firstName: first.trim(), lastName: last.trim(), dialCode: dial, phone: digitsOf(phone), verifiedAt: now });
    }, 700);
  };

  /* Whatever arrives at a box is spread from that box onward. One
     character is a keystroke; six are a paste or the phone's SMS
     autofill. One path for all of them, because keeping only the last
     character drops five digits out of every autofill. */
  const fill = (from: number, raw: string) => {
    const d = raw.replace(/\D/g, "");
    const next = [...digits];
    setWrong(false);
    if (!d) { next[from] = ""; setDigits(next); return; }
    for (let k = 0; k < d.length && from + k < LEN; k++) next[from + k] = d[k];
    setDigits(next);
    boxes.current[Math.min(from + d.length, LEN - 1)]?.focus({ preventScroll: true });
    const full = next.join("");
    if (full.length === LEN) verify(full);
  };

  const paste = (e: React.ClipboardEvent) => {
    const d = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!d) return;
    e.preventDefault();
    fill(0, d.slice(0, LEN));
  };

  const key = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      boxes.current[i - 1]?.focus({ preventScroll: true });
    }
    if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus({ preventScroll: true });
    if (e.key === "ArrowRight" && i < LEN - 1) boxes.current[i + 1]?.focus({ preventScroll: true });
  };

  const close = (
    <button type="button" onClick={onClose} aria-label="Close"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-paper text-ink-60 transition hover:bg-lilac">
      <X size={15} weight="bold" aria-hidden />
    </button>
  );

  return (
    <Sheet open={open} onClose={onClose} labelledBy="account-title">
      <div className="px-6 pb-7 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
        {step === "details" ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <Wordmark size="sm" />
              {close}
            </div>
            <h2 id="account-title" className="mt-6 text-title font-semibold tracking-[-0.02em] text-ink">
              {signin ? "Log in" : mode === "phone" ? "Change your number" : byEmail ? (startEmail ? "Change your email" : "Add your email") : "Make your account"}
            </h2>
            <p className="mt-1.5 text-body text-ink-60">
              {signin ? "Your phone number is your account. HeyMoon texts a code to confirm it is you."
                : mode === "phone" ? "HeyMoon texts a code to the new number to confirm it's yours. Your campaigns stay where they are."
                : byEmail ? "For statements and receipts. HeyMoon emails a code to confirm it's yours."
                : `${brand ? `To join ${brand}. ` : ""}HeyMoon texts a code to confirm it is you.`}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} noValidate className="mt-6">
              {named && <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label htmlFor="acct-first" className={LABEL}>First name</label>
                  <input ref={firstField} id="acct-first" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" spellCheck={false} className={FIELD} />
                </div>
                <div className="min-w-0">
                  <label htmlFor="acct-last" className={LABEL}>Last name</label>
                  <input id="acct-last" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" spellCheck={false} className={FIELD} />
                </div>
              </div>}

              {byEmail ? (
                <>
                  <label htmlFor="acct-email" className={LABEL}>Email</label>
                  <input ref={emailField} id="acct-email" type="email" inputMode="email" autoComplete="email" dir="ltr" spellCheck={false}
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={FIELD} />
                </>
              ) : (<>
              <label htmlFor="acct-phone" className={LABEL}>Phone number</label>
              {/* The code and the number are one control with a seam in
                  it: they are one answer, and a select apart from its box
                  invites half of it. Always ltr — a number is dialled
                  left to right in every language. */}
              <div dir="ltr" className="flex items-stretch overflow-hidden rounded-inner border border-black/10 bg-white transition focus-within:border-main/50">
                <div className="relative shrink-0">
                  <select aria-label="Country code" value={dial} onChange={(e) => setDial(e.target.value)}
                    className="h-full appearance-none bg-transparent py-3 pl-3.5 pr-8 text-body font-semibold text-ink outline-none">
                    {DIAL_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag}  {c.code}</option>)}
                  </select>
                  <CaretDown size={11} weight="bold" aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-50" />
                </div>
                <span aria-hidden className="my-2 w-px shrink-0 bg-black/[0.08]" />
                <input ref={phoneField} id="acct-phone" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="50 123 4567"
                  className="num w-full min-w-0 bg-transparent px-3 py-3 text-body text-ink outline-none placeholder:font-normal placeholder:text-ink-40" />
              </div>
              </>)}

              <Btn full type="submit" disabled={!ready || busy} className="mt-5">{busy ? "Sending the code" : "Continue"}</Btn>
            </form>
            {/* A sentence, not a link, as on the brands sign-in: there is no
                separate sign-up to send anyone to. A new creator's way in
                is the field on the page behind this. */}
            {signin && <p className="mt-4 text-center text-meta text-ink-60">New to HeyMoon? Close this and paste your handle. The conversation sets you up.</p>}
            {(named || signin) && <p className="mt-4 text-center text-brand leading-4 text-ink-50">By continuing you agree to the HeyMoon terms and privacy policy.</p>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setStep("details")} aria-label="Back to your details"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-paper text-ink-60 transition hover:bg-lilac">
                <ArrowLeft size={15} weight="bold" aria-hidden className="rtl:rotate-180" />
              </button>
              {close}
            </div>
            <span aria-hidden className="mt-5 grid h-11 w-11 place-items-center rounded-inner bg-lilac text-main">
              {byEmail ? <EnvelopeSimple size={20} weight="fill" /> : <ChatCircleDots size={20} weight="fill" />}
            </span>
            <h2 id="account-title" className="mt-4 text-title font-semibold tracking-[-0.02em] text-ink">{byEmail ? "Check your email" : "Check your phone"}</h2>
            <p className="mt-1.5 text-body text-ink-60">
              HeyMoon sent a 6 digit code to <span dir="ltr" className="num font-semibold text-ink">{byEmail ? email.trim() : `${dial} ${digitsOf(phone)}`}</span>
            </p>

            <div dir="ltr" className="mt-5 flex gap-2" onPaste={paste}>
              {digits.map((d, i) => (
                <input key={i} ref={(el) => { boxes.current[i] = el; }} value={d}
                  onChange={(e) => fill(i, e.target.value)} onKeyDown={(e) => key(i, e)} onFocus={(e) => e.currentTarget.select()}
                  disabled={busy || expired} inputMode="numeric" maxLength={LEN}
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1} of ${LEN}`} aria-invalid={wrong || undefined}
                  className={`num h-14 w-full min-w-0 rounded-inner border bg-white text-center text-title font-semibold text-ink outline-none transition disabled:bg-paper ${wrong ? "border-danger" : "border-black/10 focus:border-main/50"}`} />
              ))}
            </div>

            <p className="mt-3 text-center text-meta text-ink-50" role={wrong ? "alert" : undefined}>
              {wrong ? <span className="font-semibold text-danger">That code is not right. Try again.</span>
                : expired ? <span className="font-semibold text-danger">The code expired.</span>
                : <>Code expires in <span className="num font-semibold text-ink-60">{mmss(left)}</span></>}
            </p>

            <Btn full type="button" onClick={() => (expired ? again() : verify(typed))} disabled={busy || (!expired && typed.length < LEN)} className="mt-4">
              {busy ? "Checking" : expired ? "Send a new code" : "Verify code"}
            </Btn>

            {/* No message leaves a prototype, so the code is printed here,
                as the brands app prints it. */}
            <p className="mt-4 text-center text-meta text-ink-50">
              Demo code: <span className="num font-semibold tracking-[0.08em] text-ink-60">{code}</span>
            </p>
          </>
        )}
      </div>
    </Sheet>
  );
}
