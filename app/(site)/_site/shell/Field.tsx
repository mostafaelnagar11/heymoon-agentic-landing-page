"use client";
/* The one object: the store or handle field (SPEC §5.0.9). A real GET form, so no-JS submits to the
   product. With JS: validate locally, then the dawn (S8), then location.assign. One draft per
   audience: a URL is never a valid handle (ruling 25). Reads the URGENT audience. */
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { animate } from "motion/react";
import type { FieldProps } from "../contracts";
import type { Audience } from "../data/types";
import { COPY } from "../copy";
import { EASE, TYPE } from "../tokens";
import { useAudience, useWorld } from "../lib/audience";
import { usableHandle, usableUrl } from "../lib/field";
import { getReducedMotion } from "../lib/prefs";
import { els, getSignal, setSignal } from "../lib/signals";
import { useUncovered } from "../lib/lift";
import { Moon } from "../ui/Moon";
import { At, Globe } from "../ui/icons";
import s from "./Field.module.css";

const prefetched = new Set<string>();

export function Field({ id, placement }: FieldProps) {
  const { audience } = useAudience();
  const { focus, startDawn, resetDawn } = useWorld();
  const copy = COPY[audience].field;

  const [drafts, setDrafts] = useState<Record<Audience, string>>({ brands: "", creators: "" });
  const value = drafts[audience];
  /* The error belongs to the draft it was raised on: the other audience never shows its ring or its
     message, and a switch clears it (below), so switching back does not bring it back. */
  const [invalidFor, setInvalidFor] = useState<Audience | null>(null);
  const invalid = invalidFor === audience;
  const [going, setGoing] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const errorTimer = useRef<number>();
  /* The server renders the full placeholder in the hint; after that the typing writes textContent. */
  const [ssrHint] = useState<string>(copy.placeholder);

  const inputId = `${id}-${audience === "brands" ? "store" : "handle"}`;
  const errorId = `${id}-error`;

  /* Register the field for toField() and the promo. */
  useEffect(() => {
    if (placement === "hero") { els.heroField = rootRef.current; els.heroInput = inputRef.current; }
    else { els.closeField = rootRef.current; els.closeInput = inputRef.current; }
    return () => {
      if (placement === "hero") { els.heroField = null; els.heroInput = null; }
      else { els.closeField = null; els.closeInput = null; }
    };
  }, [placement]);

  useEffect(() => {
    setSignal(placement === "hero" ? "heroFieldHasText" : "closeFieldHasText", value.length > 0);
  }, [value, placement]);

  /* Visibility: the hero field is visible while IO says so (64px below the top, under the nav) AND it
     is not under the sheet; the close field is IO alone (the close is not sticky). */
  const uncovered = useUncovered(rootRef);
  const inView = useRef(placement === "hero");
  const key = placement === "hero" ? "heroFieldVisible" : "closeFieldVisible";
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      inView.current = e.isIntersecting;
      setSignal(key, inView.current && (placement !== "hero" || uncovered));
    }, placement === "hero" ? { rootMargin: "-64px 0px 0px 0px" } : undefined);
    io.observe(el);
    return () => io.disconnect();
  }, [key, placement, uncovered]);
  useEffect(() => {
    setSignal(key, inView.current && (placement !== "hero" || uncovered));
  }, [key, placement, uncovered]);

  /* The typed hint. At mount it retypes only if hydration landed before TYPE.retypeBeforeMs (the
     field is still under 40% opacity in its fade-in); otherwise it holds the server text. On an
     audience change it deletes at 35 ms per char, then types the new placeholder at 85 ms per char.
     Under reduced motion it never types. */
  const shownHint = useRef<string>(ssrHint);
  const hintAudience = useRef<Audience | null>(null);
  useEffect(() => {
    const el = hintRef.current;
    if (!el) return;
    const target = COPY[audience].field.placeholder;
    const remount = hintAudience.current === null || hintAudience.current === audience;
    hintAudience.current = audience;
    const reduced = getReducedMotion();
    let timer: number | undefined;
    const write = (t: string) => { shownHint.current = t; el.textContent = t; };
    const typeIn = (n: number) => {
      write(target.slice(0, n));
      if (n < target.length) timer = window.setTimeout(() => typeIn(n + 1), TYPE.typeMs);
    };
    const del = () => {
      const cur = shownHint.current;
      if (!cur.length) { timer = window.setTimeout(() => typeIn(1), TYPE.typeMs); return; }
      write(cur.slice(0, -1));
      timer = window.setTimeout(del, TYPE.deleteMs);
    };
    if (remount) {
      if (!reduced && performance.now() < TYPE.retypeBeforeMs && !inputRef.current?.value) { write(""); timer = window.setTimeout(() => typeIn(1), TYPE.typeMs); }
      else write(target);
    } else if (reduced) write(target);
    else del();
    return () => window.clearTimeout(timer);
  }, [audience]);

  /* Back/forward cache: the page comes back mid-dawn. */
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setGoing(false);
      resetDawn();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [resetDawn]);

  useEffect(() => () => window.clearTimeout(errorTimer.current), []);

  const clearError = () => { window.clearTimeout(errorTimer.current); setInvalidFor(null); };
  useEffect(() => { window.clearTimeout(errorTimer.current); setInvalidFor(null); }, [audience]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDrafts((d) => ({ ...d, [audience]: v }));
    if (invalid) clearError();
  };

  const onFocus = () => {
    setSignal("fieldFocus", placement);
    animate(focus, 1, getReducedMotion() ? { duration: 0 } : { duration: 0.6, ease: EASE.out });
    if (!prefetched.has(copy.action)) {
      prefetched.add(copy.action);
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = copy.action;
      document.head.appendChild(link);
    }
  };
  const onBlur = () => {
    if (getSignal("fieldFocus") === placement) setSignal("fieldFocus", null);
    animate(focus, 0, getReducedMotion() ? { duration: 0 } : { duration: 0.6, ease: EASE.out });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (going) return;
    const raw = inputRef.current?.value ?? value;
    const ok = audience === "brands" ? usableUrl(raw) : usableHandle(raw);
    if (!ok) {
      setInvalidFor(audience);
      inputRef.current?.focus();
      window.clearTimeout(errorTimer.current);
      errorTimer.current = window.setTimeout(() => setInvalidFor(null), TYPE.errorMs);
      return;
    }
    clearError();
    setGoing(true);
    await startDawn();
    window.location.assign(`${copy.action}?${copy.param}=${encodeURIComponent(ok)}`);
  };

  return (
    <div
      ref={rootRef}
      data-field={placement}
      data-invalid={invalid ? "true" : "false"}
      data-going={going ? "true" : "false"}
      className={`${s.root} relative z-content w-[calc(100vw-32px)] max-w-[580px] sm:w-full ${placement === "hero" ? "motion-safe:animate-field-in" : ""}`}
    >
      <form
        method="get"
        action={copy.action}
        noValidate
        onSubmit={onSubmit}
        className={`${s.form} relative h-16 rounded-field bg-white shadow-field sm:h-[76px]`}
      >
        <span aria-hidden className="pointer-events-none absolute inset-y-0 start-5 grid place-items-center text-ink/30">
          <Globe size={19} className={`${s.icon} col-start-1 row-start-1`} data-on={audience === "brands" ? "true" : "false"} />
          <At size={19} className={`${s.icon} col-start-1 row-start-1`} data-on={audience === "creators" ? "true" : "false"} />
        </span>
        <label htmlFor={inputId} className="sr-only">{copy.label}</label>
        <input
          ref={inputRef}
          id={inputId}
          name={copy.param}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          readOnly={going}
          placeholder=" "
          aria-invalid={invalid}
          aria-describedby={errorId}
          dir="ltr"
          inputMode={copy.inputMode}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          className={`${s.input} h-full w-full rounded-field bg-transparent ps-[52px] pe-[108px] text-[17px] tracking-[-0.01em] text-ink outline-none sm:text-[18px]`}
        />
        <p aria-hidden data-hint className={`${s.hint} pointer-events-none absolute inset-y-0 start-0 flex items-center ps-[52px] text-[17px] tracking-[-0.01em] text-ink/60 sm:text-[18px]`} dir="ltr">
          <span ref={hintRef}>{ssrHint}</span>
          <span className={`${s.caret} ms-px inline-block h-[22px] w-px bg-ink/45 motion-safe:animate-caret`} />
        </p>
        <button
          type="submit"
          className="absolute end-2.5 top-1/2 inline-flex h-12 -translate-y-1/2 items-center gap-2 rounded-control bg-ink px-5 text-small font-semibold text-white transition-colors hover:bg-ink/85 sm:h-11"
        >
          {going ? <><Moon working size={15} className="text-white" />{copy.going}</> : copy.cta}
        </button>
      </form>
      <p id={errorId} role="alert" className="absolute inset-x-0 top-[calc(100%+18px)] flex items-center justify-center gap-2 text-center text-micro text-white/92">
        {invalid && <><span aria-hidden className="size-1.5 flex-none rounded-full bg-danger" />{copy.invalid}</>}
      </p>
    </div>
  );
}
