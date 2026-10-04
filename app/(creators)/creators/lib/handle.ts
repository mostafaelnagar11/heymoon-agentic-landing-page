/* A handle, however it was typed or pasted.
 *
 * The landing asks creators to paste their handle, and people paste the
 * link to their profile as often as the handle itself. That used to
 * miss and fall through to the first creator — so pasting
 * instagram.com/ghalya.mu2 showed you somebody else. A URL, a trailing
 * slash, a query string, an "@" in front, capitals and stray spaces all
 * reduce to the bare handle here.
 *
 * Plain string handling with no data behind it, so screens can use it
 * without reaching into the mock. */
export const handleKey = (raw: string): string => {
  const s = raw.trim().toLowerCase().replace(/[?#].*$/, "");
  const path = s.replace(/^[a-z]+:\/\//, "").replace(/^[^/\s]+\.[a-z]{2,}\//, "");
  const last = path.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/^@/, "").replace(/\s+/g, "");
};

/** The handle as the product displays it: "@name", or null if nothing
    usable was typed. */
export const displayHandle = (raw: string | null | undefined): string | null => {
  const key = raw ? handleKey(raw) : "";
  return key ? `@${key}` : null;
};
