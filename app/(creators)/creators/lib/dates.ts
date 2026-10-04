/* Days, the way the product writes them.
 *
 * A fixed month and weekday table rather than toLocaleDateString's
 * short forms, because those drift between browsers: en-GB gives
 * "Sept" in current Chrome and "Sep" elsewhere, and a week header that
 * changes spelling depending on who is looking is a bug report. */

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromKey = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };

export const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** The Monday a day's week starts on. Weeks run Monday to Sunday here,
    the same as the calendar grid. */
export const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Thu 2 Oct". */
export const shortDay = (d: Date) => `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;

/** "27 Sep 2026". */
export const mediumDate = (d: Date) => `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;

/** "27 September 2026". */
export const longDate = (d: Date) => `${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}`;

/** "15 – 21 Dec 2025", "29 Sep – 5 Oct 2026", "29 Dec 2025 – 4 Jan 2026". */
export function weekLabel(start: Date, end: Date) {
  const y = end.getFullYear();
  if (start.getFullYear() !== y) return `${start.getDate()} ${MON[start.getMonth()]} ${start.getFullYear()} – ${end.getDate()} ${MON[end.getMonth()]} ${y}`;
  if (start.getMonth() !== end.getMonth()) return `${start.getDate()} ${MON[start.getMonth()]} – ${end.getDate()} ${MON[end.getMonth()]} ${y}`;
  return `${start.getDate()} – ${end.getDate()} ${MON[end.getMonth()]} ${y}`;
}

/** "today", "tomorrow", "yesterday", or the short day. */
export function relDay(k: string, today: Date) {
  const n = Math.round((fromKey(k).getTime() - startOfDay(today).getTime()) / 86_400_000);
  return n === 0 ? "today" : n === 1 ? "tomorrow" : n === -1 ? "yesterday" : shortDay(fromKey(k));
}
