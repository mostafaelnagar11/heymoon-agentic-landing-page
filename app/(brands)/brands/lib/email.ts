/* Work email, the one rule (brand team, 15 Oct: "any work email will do, as long as it's work email").

   Shared by the sign-in sheet and the team invite, so an address the sheet refuses can't be invited either. Any
   company domain passes, not only the store's own (Sephora's team is on @chalhoub.com); the personal providers are
   refused, matched on the domain's first label too so outlook.sa and hotmail.co.uk are caught. */

/** Deliberately loose: an address with a dot in its domain. The code that arrives there is what proves it. */
export const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const PERSONAL = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com", "ymail.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com",
]);
const PERSONAL_LABEL = /^(gmail|googlemail|outlook|hotmail|live|msn|yahoo|ymail|icloud|aol|protonmail|gmx|yandex)$/;

export const domainOf = (v: string) => v.trim().toLowerCase().split("@")[1] ?? "";

export const isPersonal = (v: string) => {
  const d = domainOf(v);
  return PERSONAL.has(d) || PERSONAL_LABEL.test(d.split(".")[0] ?? "");
};

/** "sara@chalhoub.com" → "s•••@chalhoub.com". How an owner is named to someone who isn't on their team. */
export const maskEmail = (v: string) => {
  const [user = "", domain = ""] = v.split("@");
  return `${user.slice(0, 1)}•••@${domain}`;
};
