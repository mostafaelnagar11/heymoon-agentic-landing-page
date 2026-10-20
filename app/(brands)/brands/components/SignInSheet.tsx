"use client";

/* The account, asked for once, at the only moment it is needed.
 *
 * Everything before this is free and anonymous: the read, the plan, the
 * two numbers, the creators. A form in front of any of that would be a
 * toll gate on the part that sells the product. But money cannot move
 * for nobody, so the gate sits exactly at the payment and nowhere
 * earlier — press Start Phase 1 and this opens; verify, and it closes
 * onto the payment card that was always the next thing.
 *
 * Two screens, beat for beat with the current web app: details, then
 * Continue, then six boxes under a countdown with the demo code printed
 * below them. The code IS the account; there is no password.
 *
 * What it asks for is a WORK email (brand team, 15 Oct: "any work email
 * will do, as long as it's work email"). Any company domain is accepted,
 * not only the store's own, because brands are often run from a parent's
 * domain (Sephora from @chalhoub.com, our own team from @itcan.ae).
 * Personal providers are refused with the reason, because whoever pays
 * becomes the owner of the brand account and invites the rest of the
 * team, and a personal inbox is the wrong owner for a company. Phone
 * sign-in is parked: it may come back as the exemption route for Salla
 * and Zid owners who only have Gmail, once the team decides.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, EnvelopeSimple, LockKey } from "@phosphor-icons/react";
import { Sheet } from "./ui";
import { Wordmark } from "./Wordmark";
import { accessFor, joinBrand, requestAccess, signIn, useBrandAccount } from "../lib/store";
import { isPersonal, looksLikeEmail, maskEmail } from "../lib/email";
import { hash } from "../lib/agent/rng";

const LEN = 6;
const EXPIRES_IN = 60;

/* The demo code, derived from the address rather than drawn at random:
   the same email always gets the same six digits, so a screenshot, a
   walkthrough and a test all agree. */
const demoCodeFor = (email: string) =>
  String(Math.abs(hash(email.trim().toLowerCase())) % 1_000_000).padStart(LEN, "0");

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function SignInSheet({ open, onClose, onVerified, host, brandName, forPayment = false }: {
  open: boolean;
  onClose: () => void;
  /** The store the brand just confirmed. Whoever pays for it first owns it; anyone else is invited or asks. */
  host?: string;
  brandName?: string;
  /** Opened at the payment (signed out since the store was confirmed), so "nothing was charged" means something. */
  forPayment?: boolean;
  /** Runs after the sheet closes, with the name that was verified. */
  onVerified: (name: string) => void;
}) {
  /* "owned": the code was right, but the brand already has an owner and this address isn't on their team. The
     person is NOT signed in: they can ask the owner for access or use another address. "requested": asked. */
  const [step, setStep] = useState<"details" | "code" | "owned" | "requested">("details");
  const brand = useBrandAccount(host);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  /* The personal-address line shows once the brand has tried to continue with one, or left the field holding
     one, not on every keystroke while "sara@gmail" is still being typed. */
  const [checked, setChecked] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [left, setLeft] = useState(EXPIRES_IN);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const firstBox = useRef<HTMLInputElement>(null);

  const code = demoCodeFor(email);
  const typed = digits.join("");
  const expired = left <= 0;
  const shown = email.trim().toLowerCase();
  const personal = looksLikeEmail(email) && isPersonal(email);
  const ready = !!first.trim() && !!last.trim() && looksLikeEmail(email) && !personal;

  /* Every open is a fresh attempt. A sheet that reopens holding the
     half-typed code from a run the brand abandoned looks broken. */
  useEffect(() => {
    if (!open) return;
    setStep("details");
    setDigits(Array(LEN).fill(""));
    setBusy(false);
    setWrong(false);
    const t = setTimeout(() => firstBox.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open]);

  /* The countdown belongs to the code screen and restarts with it, so
     going back to change the address does not leave a stale clock. */
  useEffect(() => {
    if (step !== "code") return;
    setLeft(EXPIRES_IN);
    const t = setTimeout(() => boxes.current[0]?.focus(), 120);
    const id = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [step]);

  const sendCode = () => {
    setChecked(true);
    if (!ready || busy) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); setStep("code"); }, 850);
  };

  const again = () => {
    setDigits(Array(LEN).fill(""));
    setWrong(false);
    setLeft(EXPIRES_IN);
    boxes.current[0]?.focus();
  };

  const verify = (entered: string) => {
    if (entered.length < LEN || busy || expired) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (entered !== code) {
        setWrong(true);
        setDigits(Array(LEN).fill(""));
        boxes.current[0]?.focus();
        return;
      }
      /* Ownership is checked after the code, not before: a request has to come from an address that proved it is
         theirs, or anyone could file one in someone else's name. */
      const access = host ? accessFor(host, shown) : "unclaimed";
      if (access === "outsider") { setStep("owned"); return; }
      if (access === "invited" && host) joinBrand(host, { firstName: first.trim(), lastName: last.trim(), email: shown }, Date.now());
      signIn(
        { firstName: first.trim(), lastName: last.trim(), email: shown },
        Date.now()
      );
      onVerified(`${first.trim()} ${last.trim()}`);
    }, 700);
  };

  /* Whatever arrives at a box is spread from that box onward. One
     character is a keystroke; six are a paste, an autofill from the
     mail app's code suggestion, or a fast typist whose keys landed before
     React moved the focus. One code path for all of them, because the
     version that kept only the last character dropped five digits out
     of every autofill. */
  const fill = (from: number, raw: string) => {
    const d = raw.replace(/\D/g, "");
    const next = [...digits];
    setWrong(false);
    if (!d) { next[from] = ""; setDigits(next); return; }
    for (let k = 0; k < d.length && from + k < LEN; k++) next[from + k] = d[k];
    setDigits(next);
    boxes.current[Math.min(from + d.length, LEN - 1)]?.focus();
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
      boxes.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) boxes.current[i + 1]?.focus();
  };

  const wide = "flex h-12 w-full items-center justify-center rounded-pill text-body font-semibold transition disabled:cursor-not-allowed";

  return (
    <Sheet open={open} onClose={onClose} labelledBy="signin-title">
      <div className="px-6 pb-7 pt-6 sm:px-8 sm:pb-8">
        {step === "owned" || step === "requested" ? (
          <OwnedStep
            requested={step === "requested"}
            forPayment={forPayment}
            brandName={brandName ?? host ?? "This brand"}
            owner={brand?.owner ? maskEmail(brand.owner.email) : ""}
            ownerFirst={brand?.owner.firstName ?? ""}
            you={shown}
            onRequest={() => {
              if (!host) return;
              requestAccess(host, { firstName: first.trim(), lastName: last.trim(), email: shown }, Date.now());
              setStep("requested");
            }}
            onOtherEmail={() => { setEmail(""); setChecked(false); setStep("details"); }}
            onClose={onClose}
          />
        ) : step === "details" ? (
          <>
            <Wordmark size="lg" />
            <h2 id="signin-title" className="mt-6 text-[24px] font-semibold tracking-[-0.03em] text-ink">
              Let&apos;s get started
            </h2>
            <p className="mt-1.5 text-body text-ink-soft">HeyMoon emails a code to confirm it is you</p>

            <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} noValidate className="mt-6">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "signin-first", label: "First name", v: first, set: setFirst, ref: firstBox, ac: "given-name" },
                  { id: "signin-last", label: "Last name", v: last, set: setLast, ref: undefined, ac: "family-name" },
                ] as const).map((f) => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className="mb-1.5 block text-meta font-medium text-ink-60">
                      {f.label}
                    </label>
                    <input
                      ref={f.ref}
                      id={f.id}
                      value={f.v}
                      onChange={(e) => f.set(e.target.value)}
                      autoComplete={f.ac}
                      spellCheck={false}
                      /* A focused field darkens its own hairline and
                         nothing more. The purple stroke it used to draw
                         was the brand colour doing a job the caret
                         already does, on every field in turn, which
                         made filling the form flash. */
                      className="w-full rounded-control border border-black/[0.1] bg-white px-4 py-3 text-body text-ink outline-none transition placeholder:text-ink-faint focus:border-ink/25"
                    />
                  </div>
                ))}
              </div>

              <label htmlFor="signin-email" className="mb-1.5 mt-4 block text-meta font-medium text-ink-60">
                Work email
              </label>
              {/* Any company address, not only the store's own domain. Always ltr: an address reads left to right in
                  every language. */}
              <input
                id="signin-email"
                type="email"
                dir="ltr"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setChecked(true)}
                placeholder="you@yourcompany.com"
                aria-invalid={(checked && personal) || undefined}
                aria-describedby="signin-email-note"
                className={`w-full rounded-control border bg-white px-4 py-3 text-body text-ink outline-none transition placeholder:text-ink-faint ${
                  checked && personal ? "border-danger" : "border-black/[0.1] focus:border-ink/25"
                }`}
              />
              <p id="signin-email-note" className="mt-1.5 text-[11px] leading-4" role={checked && personal ? "alert" : undefined}>
                {checked && personal ? (
                  <span className="font-semibold text-danger">
                    Use your work email. Personal addresses like Gmail or Outlook can&apos;t open a brand account.
                  </span>
                ) : (
                  <span className="text-ink-faint">Any company address works, even if it isn&apos;t your store&apos;s domain.</span>
                )}
              </p>

              <button
                type="submit"
                disabled={!ready || busy}
                className={`${wide} g-button mt-4 border border-white/50 text-[#FBF8FE] disabled:opacity-40`}
              >
                {busy ? "Sending the code" : "Continue"}
              </button>
            </form>

            {/* A sentence, not a link. With an emailed code there is no
                separate sign-up screen to send anyone to: the first code
                an address accepts is what creates the account. And the
                person who pays owns it (brand team, 15 Oct), so it says so
                before they pay, not after. */}
            <p className="mt-5 text-center text-meta text-ink-soft">
              No account yet? The same email makes one. Whoever pays owns the brand account and invites the team.
            </p>
            <p className="mt-2 text-center text-[11px] leading-4 text-ink-faint">
              By continuing you agree to the HeyMoon terms and privacy policy.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep("details")}
              aria-label="Back to your details"
              className="grid h-9 w-9 place-items-center rounded-control border border-hairline bg-white text-ink-soft transition hover:bg-wash"
            >
              <ArrowLeft size={15} weight="bold" aria-hidden className="rtl:rotate-180" />
            </button>

            <span aria-hidden className="mt-5 grid h-11 w-11 place-items-center rounded-control bg-brand-100 text-brand">
              <EnvelopeSimple size={19} weight="fill" />
            </span>
            <h2 id="signin-title" className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-ink">
              Check your email
            </h2>
            <p className="mt-1.5 text-body text-ink-soft">
              HeyMoon sent a 6 digit code to <span dir="ltr" className="num font-semibold text-ink">{shown}</span>
            </p>

            <div dir="ltr" className="mt-5 flex gap-2" onPaste={paste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { boxes.current[i] = el; }}
                  value={d}
                  onChange={(e) => fill(i, e.target.value)}
                  onKeyDown={(e) => key(i, e)}
                  onFocus={(e) => e.currentTarget.select()}
                  disabled={busy || expired}
                  inputMode="numeric"
                  maxLength={LEN}
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1} of ${LEN}`}
                  aria-invalid={wrong || undefined}
                  className={`num h-14 w-full min-w-0 rounded-control border bg-white text-center text-[22px] font-semibold text-ink outline-none transition disabled:bg-wash ${
                    wrong ? "border-danger" : "border-black/[0.12] focus:border-ink/30"
                  }`}
                />
              ))}
            </div>

            <p className="mt-3 text-center text-meta text-ink-faint" role={wrong ? "alert" : undefined}>
              {wrong ? (
                <span className="font-semibold text-danger">That code is not right. Try again.</span>
              ) : expired ? (
                <span className="font-semibold text-danger">The code expired.</span>
              ) : (
                <>Code expires in <span className="num font-semibold text-ink-soft">{mmss(left)}</span></>
              )}
            </p>

            <button
              type="button"
              onClick={() => (expired ? again() : verify(typed))}
              disabled={busy || (!expired && typed.length < LEN)}
              className={`${wide} g-button mt-4 border border-white/50 text-[#FBF8FE] disabled:opacity-40`}
            >
              {busy ? "Checking" : expired ? "Send a new code" : "Verify code"}
            </button>

            {/* The current app prints the demo code under the boxes, so
                this does too. No message leaves a prototype. */}
            <p className="mt-4 text-center text-meta text-ink-faint">
              Demo code: <span className="num font-semibold tracking-[0.08em] text-ink-soft">{code}</span>
            </p>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* The brand already has an owner (brand team, 15 Oct: "if someone pays, they become the owner of the brand. And they
   only can invite others… I only can be invited or I request access"). Signing in with the same company's email
   doesn't hand anyone the account; it offers a request to the person who owns it, and says who that is without
   printing their whole address to someone they haven't let in. */
function OwnedStep({ requested, forPayment, brandName, owner, ownerFirst, you, onRequest, onOtherEmail, onClose }: {
  requested: boolean;
  forPayment: boolean;
  brandName: string;
  owner: string;
  ownerFirst: string;
  you: string;
  onRequest: () => void;
  onOtherEmail: () => void;
  onClose: () => void;
}) {
  const wide = "flex h-12 w-full items-center justify-center rounded-pill text-body font-semibold transition";
  if (requested) {
    return (
      <>
        <span aria-hidden className="grid h-11 w-11 place-items-center rounded-control bg-good/[0.1] text-good-deep">
          <CheckCircle size={20} weight="fill" />
        </span>
        <h2 id="signin-title" className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-ink">
          Request sent
        </h2>
        <p className="mt-1.5 text-body leading-6 text-ink-soft">
          {ownerFirst || "The owner"} sees it on the {brandName} team page. HeyMoon emails{" "}
          <span dir="ltr" className="num font-semibold text-ink">{you}</span> when they answer.{forPayment && " Nothing was charged."}
        </p>
        <button type="button" onClick={onClose} className={`${wide} g-button mt-6 border border-white/50 text-[#FBF8FE]`}>
          Done
        </button>
      </>
    );
  }
  return (
    <>
      <span aria-hidden className="grid h-11 w-11 place-items-center rounded-control bg-brand-100 text-brand">
        <LockKey size={19} weight="fill" />
      </span>
      <h2 id="signin-title" className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-ink">
        {brandName} already has an account
      </h2>
      <p className="mt-1.5 text-body leading-6 text-ink-soft">
        It belongs to <span dir="ltr" className="num font-semibold text-ink">{owner}</span>, who paid for its first
        campaign. Only the owner can add people, so ask {ownerFirst || "them"} to invite you, or send a request now.
      </p>
      <button type="button" onClick={onRequest} className={`${wide} g-button mt-6 border border-white/50 text-[#FBF8FE]`}>
        Request access
      </button>
      <button
        type="button"
        onClick={onOtherEmail}
        className={`${wide} mt-2 border border-hairline bg-white text-ink-soft hover:bg-wash`}
      >
        Use a different email
      </button>
    </>
  );
}
