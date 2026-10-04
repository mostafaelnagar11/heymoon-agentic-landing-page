/* What the two fields accept. Plain string handling, copied from the product so the site never
   imports product code (§4.1 import rule 1). scripts/bind-demo.ts parity-tests every export here
   against the product's own functions on every bind. */

/** trim, lowercase, strip `https?://` and `www.`, drop the path. Copy of B lib/mock/reads.ts. */
export function normaliseUrl(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/** A store link the product can read, or null. */
export function usableUrl(raw: string): string | null {
  const url = normaliseUrl(raw);
  return url.includes(".") ? url : null;
}

/** Copy of C lib/handle.ts: a URL, a trailing slash, a query string, an "@" in front, capitals and
    stray spaces all reduce to the bare handle. */
export const handleKey = (raw: string): string => {
  const s = raw.trim().toLowerCase().replace(/[?#].*$/, "");
  const path = s.replace(/^[a-z]+:\/\//, "").replace(/^[^/\s]+\.[a-z]{2,}\//, "");
  const last = path.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/^@/, "").replace(/\s+/g, "");
};

/** Copy of C lib/handle.ts: "@name", or null if nothing usable was typed. */
export const displayHandle = (raw: string | null | undefined): string | null => {
  const key = raw ? handleKey(raw) : "";
  return key ? `@${key}` : null;
};

/* Verbatim from app/(creators)/creators/v1/page.tsx. handleKey already reduces a pasted profile link
   to the handle it names, so what is left to refuse is stray punctuation and a bare site with no
   profile on it ("instagram.com", "https://www.tiktok.com"). */
const HANDLE = /^[a-z0-9._]{1,30}$/;
const BARE_SITE = /^([a-z0-9-]+\.)?(instagram|tiktok)\.com$/;

export const usableHandle = (raw: string): string | null => {
  const key = handleKey(raw);
  return HANDLE.test(key) && !BARE_SITE.test(key) ? displayHandle(raw) : null;
};
