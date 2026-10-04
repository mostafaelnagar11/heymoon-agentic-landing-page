"use client";

/* WHERE FRIDAY'S RUN GOES.
 *
 * One popup, from every place that asks for it: the Profile page's
 * Payouts, Explore's "things left before you get paid", and the next
 * payout card on Earnings. An account holder and an IBAN, checked the
 * way a bank checks one — the country's length, then the mod-97 sum,
 * which catches a mistyped character before a Friday run bounces on it
 * — and kept as its last four characters only (see PayoutMethod). */

import { useEffect, useState } from "react";
import { Bank, CheckCircle, Warning } from "@phosphor-icons/react";
import { Btn, Sheet } from "../ui";
import { disconnect, pushToast, setPayout, useAccount, useActiveProfile, usePayout } from "../../lib/store";

/* The markets HeyMoon pays into, and how long each one's IBAN is. */
const IBAN_LENGTH: Record<string, { length: number; name: string }> = {
  AE: { length: 23, name: "UAE" }, SA: { length: 24, name: "Saudi" }, KW: { length: 30, name: "Kuwaiti" },
  QA: { length: 29, name: "Qatari" }, BH: { length: 22, name: "Bahraini" }, OM: { length: 23, name: "Omani" },
  JO: { length: 30, name: "Jordanian" }, EG: { length: 29, name: "Egyptian" },
};

const clean = (raw: string) => raw.replace(/\s+/g, "").toUpperCase();

/** The IBAN standard's check: move the first four characters to the
    end, turn letters into numbers, and the whole must leave 1 over 97. */
function mod97(iban: string) {
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  return rem;
}

/** What is wrong with an IBAN, or null when it checks out. `typing` is
    true while it is still shorter than its country's length, so the
    field does not shout at the fifth character. */
export function ibanCheck(raw: string): { ok: boolean; typing: boolean; problem: string | null } {
  const s = clean(raw);
  if (!s) return { ok: false, typing: true, problem: null };
  if (!/^[A-Z]{2}/.test(s)) return { ok: false, typing: false, problem: "An IBAN starts with two letters for the country, like AE." };
  const c = IBAN_LENGTH[s.slice(0, 2)];
  if (!c) return { ok: false, typing: false, problem: "HeyMoon pays into banks in the GCC, Jordan and Egypt, and that country code isn't one of them." };
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]*$/.test(s)) return { ok: false, typing: false, problem: "After the country, an IBAN is two digits and then letters and numbers only." };
  if (s.length < c.length) return { ok: false, typing: true, problem: null };
  if (s.length > c.length) return { ok: false, typing: false, problem: `A ${c.name} IBAN is ${c.length} characters, and this one is ${s.length}.` };
  if (mod97(s) !== 1) return { ok: false, typing: false, problem: "That IBAN doesn't add up. Check it against your bank app: one character is usually off." };
  return { ok: true, typing: false, problem: null };
}

/** Grouped in fours as it is typed, the way it is printed on a card. */
const grouped = (raw: string) => clean(raw).replace(/(.{4})/g, "$1 ").trim();

const LABEL = "mb-1.5 block text-meta font-medium text-ink-60";
const FIELD = "w-full rounded-inner border border-black/10 bg-white px-4 py-3 text-body text-ink outline-none transition placeholder:text-ink-40 focus:border-main/50";

export function PayoutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const account = useAccount();
  const profile = useActiveProfile();
  const current = usePayout();
  const [editing, setEditing] = useState(false);
  const [holder, setHolder] = useState("");
  const [iban, setIban] = useState("");
  const [bank, setBank] = useState("");
  const [touched, setTouched] = useState(false);

  /* Every open starts fresh, with the name on the account. */
  const holderName = account ? `${account.firstName} ${account.lastName}`.trim() : profile?.creatorName ?? "";
  useEffect(() => {
    if (!open) return;
    setEditing(false);
    setHolder(holderName);
    setIban(""); setBank(""); setTouched(false);
  }, [open, holderName]);
  const shut = () => { setEditing(false); onClose(); };

  const check = ibanCheck(iban);
  const shown = check.problem && (touched || !check.typing) ? check.problem : null;
  const ready = !!holder.trim() && check.ok;

  const save = () => {
    if (!ready) return;
    const s = clean(iban);
    setPayout({ holder: holder.trim(), country: s.slice(0, 2), last4: s.slice(-4), bank: bank.trim() || undefined, addedAt: Date.now() });
    pushToast({ tone: "green", text: `Friday's run goes to the account ending ${s.slice(-4)}.` });
    shut();
  };

  /* The popup opens on what is there, if anything, and on the form if
     nothing is. */
  const form = editing || !current;

  return (
    <Sheet open={open} onClose={shut} title={form ? (current ? "Change where you're paid" : "Where you're paid") : "Where you're paid"}>
      <div className="px-4 pb-5 pt-1">
        {!form && current ? (
          <>
            <div className="flex items-center gap-3 rounded-inner border border-line px-4 py-3.5">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-green-10 text-green"><Bank size={20} weight="fill" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-semibold text-ink">{current.bank ?? "Bank account"} ending <span className="num">{current.last4}</span></span>
                <span className="block truncate text-meta text-ink-50">{current.holder} · {IBAN_LENGTH[current.country]?.name ?? current.country} IBAN</span>
              </span>
              <CheckCircle size={18} weight="fill" aria-hidden className="shrink-0 text-green" />
            </div>
            <p className="mt-3 text-meta leading-4 text-ink-50">Every Friday, your share of the orders that cleared that week goes here.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Btn full onClick={() => setEditing(true)}>Change it</Btn>
              <Btn full variant="ghost" onClick={() => { disconnect("payout"); pushToast({ tone: "main", text: "Removed. Add an account before Friday so the run can reach you." }); onClose(); }}>Remove</Btn>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
            <p className="text-body text-ink-60">A bank account in your name. HeyMoon pays into it every Friday, on the orders that cleared that week.</p>
            <label htmlFor="pay-holder" className={`${LABEL} mt-5`}>Account holder</label>
            <input id="pay-holder" value={holder} onChange={(e) => setHolder(e.target.value)} autoComplete="name" className={FIELD} />
            <label htmlFor="pay-iban" className={`${LABEL} mt-4`}>IBAN</label>
            <input id="pay-iban" value={grouped(iban)} onChange={(e) => setIban(e.target.value)} onBlur={() => setTouched(true)}
              inputMode="text" autoComplete="off" spellCheck={false} dir="ltr" placeholder="AE07 0331 2345 6789 0123 456"
              aria-invalid={!!shown} className={`num ${FIELD} font-mono tracking-[0.04em] ${shown ? "border-danger/60" : ""}`} />
            {shown
              ? <p className="mt-1.5 flex items-start gap-1.5 text-meta leading-4 text-danger" role="alert"><Warning size={13} weight="fill" aria-hidden className="mt-0.5 shrink-0" />{shown}</p>
              : check.ok
                ? <p className="mt-1.5 flex items-center gap-1.5 text-meta text-green"><CheckCircle size={13} weight="fill" aria-hidden />Checks out.</p>
                : <p className="mt-1.5 text-meta text-ink-50">On your bank app or a statement. It starts with the country, like AE.</p>}
            <label htmlFor="pay-bank" className={`${LABEL} mt-4`}>Bank <span className="font-normal text-ink-40">· optional</span></label>
            <input id="pay-bank" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Emirates NBD" className={FIELD} />
            <Btn full type="submit" disabled={!ready} className="mt-5">Save</Btn>
            <p className="mt-3 text-center text-meta leading-4 text-ink-50">HeyMoon keeps the last four characters, to show you which account it is.</p>
          </form>
        )}
      </div>
    </Sheet>
  );
}
