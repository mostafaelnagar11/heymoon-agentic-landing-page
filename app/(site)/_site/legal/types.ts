/* The legal pages' data: one block per line of the source. Consecutive
   "li" blocks render as one list. A "p" with a label renders the label in bold ("Right to Access: ..."). */
export type LegalBlock = { t: "h2" | "h3" | "p" | "li"; text: string; label?: string };
export interface LegalDoc { title: string; updated: string; blocks: LegalBlock[] }
