/* The /terms and /privacy pages (29 Oct review: the footer needs the company and its legal pages, or the
   site "feels a bit scammy"). A plain reading page on paper: the wordmark back to the landing, the title,
   the date, then the text. No sky, no lift, no audience switch.
   Server-rendered; the wordmark is the only client part. */
import type { ReactNode } from "react";
import { COPY } from "../copy";
import { Wordmark } from "../ui/Wordmark";
import type { LegalBlock, LegalDoc } from "./types";

const f = COPY.shared.footer;
const l = COPY.shared.legal;

function Body({ blocks }: { blocks: LegalBlock[] }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t === "li") {
      const items: LegalBlock[] = [];
      while (i < blocks.length && blocks[i].t === "li") items.push(blocks[i++]);
      i--;
      out.push(
        <ul key={i} className="my-4 list-disc space-y-1.5 ps-6 marker:text-brand/60">
          {items.map((it, k) => <li key={k}>{it.text}</li>)}
        </ul>,
      );
    } else if (b.t === "h2") {
      out.push(<h2 key={i} className="mt-12 text-balance text-[22px] font-semibold leading-snug tracking-[-0.015em] text-ink">{b.text}</h2>);
    } else if (b.t === "h3") {
      out.push(<h3 key={i} className="mt-7 text-[17px] font-semibold leading-snug text-ink">{b.text}</h3>);
    } else {
      out.push(
        <p key={i} className="mt-4">
          {b.label ? <><strong className="font-semibold text-ink">{b.label}:</strong> </> : null}{b.text}
        </p>,
      );
    }
  }
  return <>{out}</>;
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex h-20 max-w-[760px] items-center justify-between gap-6 px-[var(--gutter)]">
        <a href="/brands" className="-mx-1 rounded-[6px] px-1 py-1"><Wordmark size="md" tone="paper" /></a>
        <a href="/brands" className="rounded-[4px] text-[14px] font-medium text-ink/64 hover:text-ink">{l.back}</a>
      </header>
      <main id="main" className="mx-auto max-w-[760px] px-[var(--gutter)] pb-24 pt-10 sm:pt-16">
        <h1 className="text-balance text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[52px]">{doc.title}</h1>
        <p className="mt-4 text-[15px] text-ink/56">{l.updated} {doc.updated}</p>
        <div className="mt-8 text-[16px] leading-7 text-ink/72">
          <Body blocks={doc.blocks} />
        </div>
      </main>
      <footer className="border-t border-ink/[0.08]">
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[var(--gutter)] py-6 text-[13px] text-ink/56">
          <p>HeyMoon.AI</p>
          <nav aria-label={f.legalLabel} className="flex gap-5">
            <a href="/terms" className="hover:text-ink">{f.terms}</a>
            <a href="/privacy" className="hover:text-ink">{f.privacy}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
