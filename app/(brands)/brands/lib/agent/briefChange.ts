/* A change to the brief, said in plain words (PRD v0.2, 6d).

   MoonWriter rewrites the draft in the product. The prototype does the part a reader checks: each clause of what the
   brand typed lands in Say or Don't, and a line it contradicts comes out. Appending the sentence as typed left the
   brief saying "Say the price honestly" right above "Don't mention prices".

   Lines are compared by the content words of their first sentence, the one the brief card shows: the rest is
   MoonWriter's evidence ("Your own copy has none… 'exclusive' 17 times"), and matching on it took out lines the brand
   never saw mention the word. So "prices" takes out "Say the price honestly" and nothing else. Words
   every brief uses ("product", "creators", "video") don't count as a match, or one change would empty a whole row.
   An Arabic change is sorted into the right row but takes nothing out: the draft's lines are English. */

const NEGATIVE = /^(?:don'?t|do not|never|no|avoid|stop|skip|without|لا\s|بدون|تجنب|ممنوع|دون\s)/i;
const DROP_NEGATIVE = /^(?:don'?t|do not|never)\s+/i;
const FILLER = /^(?:please|also|and|but|then|make sure (?:to|they)|i want (?:them|creators) to|creators should|they should)\s+/i;
/* A new clause starts at a comma, a semicolon, a full stop, or an "and"/"but" that opens another instruction. */
const CLAUSES = /\s*[;,]\s*|\.\s+|\s+(?:and|but)\s+(?=(?:don'?t|do not|never|no|avoid|say|mention|show|use|keep|always)\b)/i;

const stem = (w: string) => {
  const x = w.toLowerCase().replace(/[^a-z]/g, "");
  if (x.endsWith("ies")) return x.slice(0, -3) + "y";
  if (/(?:ses|xes|ches|shes)$/.test(x)) return x.slice(0, -2);
  if (x.endsWith("s") && !x.endsWith("ss")) return x.slice(0, -1);
  return x;
};

const COMMON = new Set(
  [
    "mention", "say", "show", "talk", "about", "use", "include", "state", "tell", "name", "list", "make", "sure", "that",
    "this", "they", "them", "their", "with", "from", "into", "your", "onto", "over", "just", "ever", "never", "dont",
    "avoid", "without", "stop", "skip", "please", "also", "should", "must", "always", "creator", "product", "video",
    "content", "brand", "store", "item", "post", "frame", "first", "second",
  ].map(stem)
);

const words = (s: string) => s.split(/[^A-Za-z']+/).map(stem).filter((w) => w.length >= 4 && !COMMON.has(w));
/** The sentence a line shows on the card (blocks.tsx, briefLine). */
const shown = (l: string) => l.split(/(?<=[.!?])\s+/)[0];
const touches = (line: string, keys: string[]) => keys.length > 0 && words(shown(line)).some((w) => keys.includes(w));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export interface BriefChange {
  mustSay: string[];
  mustNotSay: string[];
  /** Lines the change contradicted, taken out. */
  removed: string[];
}

export function applyBriefChange(brief: { mustSay: string[]; mustNotSay: string[] }, text: string): BriefChange {
  let mustSay = [...brief.mustSay];
  let mustNotSay = [...brief.mustNotSay];
  const removed: string[] = [];
  const clauses = text.trim().replace(/[.!]+$/, "").split(CLAUSES).map((c) => c.trim().replace(FILLER, "").trim()).filter(Boolean);

  for (const c of clauses) {
    if (NEGATIVE.test(c)) {
      /* "Don't mention prices" sits in the Don't row as "Mention prices"; "No logos" and "Avoid slang" keep their word. */
      const line = cap(c.replace(DROP_NEGATIVE, ""));
      const keys = words(line);
      removed.push(...mustSay.filter((l) => touches(l, keys)));
      mustSay = mustSay.filter((l) => !touches(l, keys));
      /* A topic already banned ("Avoid exclamation marks") needs no second line saying so. */
      const covered = (l: string) => same(l, line) || (keys.length > 0 && keys.every((k) => words(shown(l)).includes(k)));
      if (!mustNotSay.some(covered)) mustNotSay = [...mustNotSay, line];
    } else {
      const line = cap(c);
      const keys = words(line);
      removed.push(...mustNotSay.filter((l) => touches(l, keys)));
      mustNotSay = mustNotSay.filter((l) => !touches(l, keys));
      if (!mustSay.some((l) => same(l, line))) mustSay = [...mustSay, line];
    }
  }
  return { mustSay, mustNotSay, removed };
}
