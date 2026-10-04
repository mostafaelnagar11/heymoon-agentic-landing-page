/* A country, as its flag.
 *
 * The circles used to be the two-letter code on lilac, which asks a
 * creator to decode "BH" when a flag is read at a glance. These are the
 * circle-world-flags pack (public/flags/, one SVG per ISO code, already
 * round), so they sit in the same overlapping row the codes did.
 *
 * Only the countries this product sells into or reads audiences in are
 * shipped. Anything else falls back to the code on lilac rather than a
 * broken image, so a new market never renders as nothing. */

const NAME: Record<string, string> = {
  AE: "United Arab Emirates", SA: "Saudi Arabia", KW: "Kuwait", QA: "Qatar",
  BH: "Bahrain", OM: "Oman", JO: "Jordan", EG: "Egypt",
};

export const countryName = (code: string) => NAME[code.toUpperCase()] ?? code;

export function Flag({ code, size = 24, className = "" }: { code: string; size?: number; className?: string }) {
  const c = code.toUpperCase();
  const s = { width: size, height: size };
  if (!NAME[c]) {
    return (
      <span title={c} style={s} className={`grid shrink-0 place-items-center rounded-pill bg-lilac text-[8px] font-semibold text-main ${className}`}>{c}</span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/flags/${c.toLowerCase()}.svg`} alt={NAME[c]} title={NAME[c]} width={size} height={size} loading="lazy"
      style={s} className={`shrink-0 rounded-pill ${className}`} />
  );
}
