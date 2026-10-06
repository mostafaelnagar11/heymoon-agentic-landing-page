"use client";
/* The login dialog (Mostafa, 6 Oct: "login by country code + phone number and OTP"). Opened by Login in the nav and
   the footer (lib/login.ts). Two steps: the country code and the number, then the six-digit code. The prototype has
   no SMS: as in both product apps, the code is derived from the number (the same number always gets the same six
   digits) and printed under the boxes, so a walkthrough and a screenshot agree. On a match it opens the audience's
   dashboard: brands straight to /brands/dashboard; creators through /creators/login, which reads the verified number
   from sessionStorage (LOGIN_HANDOFF_KEY, never the URL), signs in and opens the creators dashboard.
   Loaded through next/dynamic (ssr: false), so none of it is first-load code. */
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { COPY } from "../copy";
import { useAudience } from "../lib/audience";
import { closeLogin, LOGIN_HANDOFF_KEY, useLoginOpen } from "../lib/login";
import { getLenis } from "../lib/scroll";
import { Check, X } from "../ui/icons";
import { Emblem } from "../ui/Wordmark";

const T = COPY.shared.login;
const LEN = 6;
const RESEND_S = 30;

/* The GCC and the nearby markets, Saudi first. digits: the national number's length (no trunk zero). */
const COUNTRIES = [
  { iso: "sa", name: "Saudi Arabia", dial: "+966", digits: 9, hint: "50 123 4567" },
  { iso: "ae", name: "United Arab Emirates", dial: "+971", digits: 9, hint: "50 123 4567" },
  { iso: "kw", name: "Kuwait", dial: "+965", digits: 8, hint: "5001 2345" },
  { iso: "qa", name: "Qatar", dial: "+974", digits: 8, hint: "3312 3456" },
  { iso: "bh", name: "Bahrain", dial: "+973", digits: 8, hint: "3600 1234" },
  { iso: "om", name: "Oman", dial: "+968", digits: 8, hint: "9212 3456" },
  { iso: "jo", name: "Jordan", dial: "+962", digits: 9, hint: "7 9012 3456" },
  { iso: "eg", name: "Egypt", dial: "+20", digits: 10, hint: "10 0123 4567" },
] as const;

const digitsOf = (v: string) => v.replace(/\D/g, "").replace(/^0+/, "");
/* FNV-1a, the products' own hash (lib/agent/rng.ts in both apps), so the code is derived, never random. */
const fnv = (s: string) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const demoCode = (dial: string, digits: string) => String(fnv(`${dial}${digits}`) % 1_000_000).padStart(LEN, "0");
/* The number in the country's own grouping, read off its hint ("50 123 4567" gives 2, 3, 4). */
const grouped = (d: string, hint: string) => {
  const out: string[] = []; let k = 0;
  for (const g of hint.split(" ").map((x) => x.length)) { if (k >= d.length) break; out.push(d.slice(k, k + g)); k += g; }
  if (k < d.length) out.push(d.slice(k));
  return out.join(" ");
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]';

export function LoginDialog() {
  const open = useLoginOpen();
  return <AnimatePresence>{open && <Panel key="login" />}</AnimatePresence>;
}

function Panel() {
  const { audience } = useAudience();
  const [iso, setIso] = useState<(typeof COUNTRIES)[number]["iso"]>("sa");
  const c = COUNTRIES.find((x) => x.iso === iso)!;
  const [raw, setRaw] = useState("");
  const [step, setStep] = useState<"phone" | "code" | "done">("phone");
  const [tried, setTried] = useState(false);
  const [boxes, setBoxes] = useState<string[]>(Array(LEN).fill(""));
  const [wrong, setWrong] = useState(false);
  const [left, setLeft] = useState(RESEND_S);
  const panel = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = digitsOf(raw);
  const valid = digits.length === c.digits;
  const code = useMemo(() => demoCode(c.dial, digits), [c.dial, digits]);

  /* Open: stop the smooth scroll and the page behind, focus the number. Close: give both back. */
  useEffect(() => {
    getLenis()?.stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    phoneRef.current?.focus();
    return () => { getLenis()?.start(); document.documentElement.style.overflow = prev; };
  }, []);

  /* The resend clock, only on the code step. */
  useEffect(() => {
    if (step !== "code" || left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [step, left]);

  const send = () => {
    setTried(true);
    if (!valid) { phoneRef.current?.focus(); return; }
    setBoxes(Array(LEN).fill("")); setWrong(false); setLeft(RESEND_S); setStep("code");
    window.setTimeout(() => boxRefs.current[0]?.focus(), 60);
  };

  const finish = () => {
    setStep("done");
    window.setTimeout(() => {
      if (audience === "creators") {
        try { sessionStorage.setItem(LOGIN_HANDOFF_KEY, JSON.stringify({ dialCode: c.dial, phone: digits, at: Date.now() })); } catch { /* blocked storage: the creators sheet asks again */ }
        window.location.assign("/creators/login");
      } else {
        window.location.assign("/brands/dashboard");
      }
    }, 700);
  };

  const check = (next: string[]) => {
    const typed = next.join("");
    if (typed.length < LEN) return;
    if (typed === code) finish();
    else { setWrong(true); setBoxes(Array(LEN).fill("")); window.setTimeout(() => boxRefs.current[0]?.focus(), 30); }
  };

  const put = (i: number, v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.length > 1) { fill(i, d); return; }
    const next = boxes.slice(); next[i] = d; setBoxes(next); setWrong(false);
    if (d && i < LEN - 1) boxRefs.current[i + 1]?.focus();
    check(next);
  };
  const fill = (from: number, d: string) => {
    const next = boxes.slice();
    for (let k = 0; k < d.length && from + k < LEN; k++) next[from + k] = d[k];
    setBoxes(next); setWrong(false);
    boxRefs.current[Math.min(LEN - 1, from + d.length)]?.focus();
    check(next);
  };
  const onBoxKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !boxes[i] && i > 0) { boxRefs.current[i - 1]?.focus(); }
    if (e.key === "ArrowLeft" && i > 0) boxRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) boxRefs.current[i + 1]?.focus();
  };
  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const d = e.clipboardData.getData("text").replace(/\D/g, "");
    if (d) { e.preventDefault(); fill(i, d.slice(0, LEN)); }
  };

  /* Esc closes; Tab stays inside the dialog. */
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.stopPropagation(); closeLogin(); return; }
    if (e.key !== "Tab" || !panel.current) return;
    const f = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const shownNumber = `${c.dial} ${grouped(digits, c.hint)}`;

  return (
    <m.div className="fixed inset-0 z-[80] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div aria-hidden className="absolute inset-0 bg-[#010317]/60 backdrop-blur-[6px]" onClick={closeLogin} />
      <m.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        data-lenis-prevent=""
        onKeyDown={onKey}
        className="relative w-[min(420px,100%)] rounded-frame bg-paper p-7 text-ink shadow-[0_32px_80px_-16px_rgba(0,0,0,.6)] sm:p-8"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" onClick={closeLogin} aria-label={T.close}
          className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-pill text-ink/60 transition-colors hover:bg-ink/[0.05] hover:text-ink">
          <X size={18} weight="bold" />
        </button>

        <span className="grid h-11 w-11 place-items-center rounded-pill bg-[#010317] text-white"><Emblem size={18} /></span>

        {step === "phone" && (
          <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }}>
            <h2 id="login-title" className="mt-5 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">{T.title}</h2>
            <p className="mt-2 text-[15px] leading-[1.5] text-ink/65">{T.sub}</p>

            <label htmlFor="login-phone" className="mt-6 block text-[13px] font-medium text-ink/70">{T.phone}</label>
            <div className={`mt-2 flex h-14 items-stretch overflow-hidden rounded-field border bg-white transition-colors focus-within:border-brand/50 ${tried && !valid ? "border-[#D70015]" : "border-ink/[0.12]"}`}>
              {/* The country: a native select (keyboard, screen readers and phone pickers for free) under a drawn face. */}
              <label className="relative flex shrink-0 items-center gap-2 border-e border-ink/[0.08] ps-4 pe-3">
                <span className="sr-only">{T.country}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/flags/${c.iso}.svg`} alt="" width={20} height={20} className="h-5 w-5 rounded-full" />
                <span className="num text-[15px] font-medium" dir="ltr">{c.dial}</span>
                <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className="text-ink/45"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <select value={iso} onChange={(e) => { setIso(e.target.value as typeof iso); setTried(false); phoneRef.current?.focus(); }}
                  className="absolute inset-0 cursor-pointer opacity-0">
                  {COUNTRIES.map((x) => <option key={x.iso} value={x.iso}>{`${x.name} (${x.dial})`}</option>)}
                </select>
              </label>
              <input
                ref={phoneRef}
                id="login-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                dir="ltr"
                value={raw}
                onChange={(e) => { setRaw(e.target.value.replace(/[^\d\s]/g, "")); }}
                placeholder={c.hint}
                aria-invalid={tried && !valid}
                aria-describedby={tried && !valid ? "login-phone-err" : undefined}
                className="num min-w-0 flex-1 bg-transparent px-4 text-[17px] outline-none placeholder:text-ink/35 focus-visible:outline-none"
              />
            </div>
            {tried && !valid && <p id="login-phone-err" role="alert" className="mt-2 text-[13px] text-[#D70015]">{T.invalid(c.digits)}</p>}

            <button type="submit" className="mt-6 h-12 w-full rounded-control bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink/85">
              {T.send}
            </button>
          </form>
        )}

        {step === "code" && (
          <div>
            <h2 id="login-title" className="mt-5 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">{T.codeTitle}</h2>
            <p className="mt-2 text-[15px] leading-[1.5] text-ink/65">
              <span dir="ltr" className="num">{T.sentTo(shownNumber)}</span>{" "}
              <button type="button" onClick={() => { setStep("phone"); window.setTimeout(() => phoneRef.current?.focus(), 30); }}
                className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">{T.change}</button>
            </p>

            <div className="mt-6 grid grid-cols-6 gap-2" dir="ltr">
              {boxes.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => { boxRefs.current[i] = el; }}
                  value={v}
                  onChange={(e) => put(i, e.target.value)}
                  onKeyDown={(e) => onBoxKey(i, e)}
                  onPaste={(e) => onPaste(i, e)}
                  onFocus={(e) => e.target.select()}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={i === 0 ? LEN : 1}
                  aria-label={T.digit(i + 1)}
                  aria-invalid={wrong}
                  className={`num h-14 w-full rounded-control border bg-white text-center text-[22px] font-semibold outline-none transition-colors focus:border-brand/60 ${wrong ? "border-[#D70015]" : "border-ink/[0.12]"}`}
                />
              ))}
            </div>
            {wrong && <p role="alert" className="mt-2 text-[13px] text-[#D70015]">{T.wrong}</p>}

            <p className="mt-4 text-[13px] text-ink/60">
              {left > 0 ? <span className="num">{T.resendIn(mmss(left))}</span> : (
                <button type="button" onClick={() => { setLeft(RESEND_S); setBoxes(Array(LEN).fill("")); setWrong(false); boxRefs.current[0]?.focus(); }}
                  className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">{T.resend}</button>
              )}
            </p>
            <p className="mt-3 rounded-receipt bg-ink/[0.04] px-3 py-2 text-[13px] text-ink/70"><span className="num">{T.demo(code)}</span></p>
          </div>
        )}

        {step === "done" && (
          <div role="status" className="py-4">
            <h2 id="login-title" className="sr-only">{T.title}</h2>
            <span className="mt-5 grid h-12 w-12 place-items-center rounded-pill bg-[#25A333] text-white"><Check size={22} weight="bold" /></span>
            <p className="mt-4 text-[17px] font-medium">{T.done}</p>
          </div>
        )}
      </m.div>
    </m.div>
  );
}
