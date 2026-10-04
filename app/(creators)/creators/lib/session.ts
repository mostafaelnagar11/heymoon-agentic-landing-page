/* Logging in, from the landing's Dashboard button.
 *
 * The number is the account: a verified code signs the creator in, and
 * the dashboard opens. On a device that already holds the profile the
 * conversation built, that is all it does.
 *
 * A device that holds nothing is the prototype's honest limit. There is
 * no server to fetch an account from, and the dashboard's payouts,
 * drafts and codes are the sample creator's fixtures whoever looks at
 * them — so a login there restores the sample account, built exactly as
 * the conversation builds it for a handle it does not know: the same
 * read, the same profile, the same matched campaigns. Nothing is
 * invented for the person who typed the number. */

import { READ_TASKS, fullReadFor, offersFor, profileFor, readIdFor } from "./agent/tools";
import { activeProfileNow, putOffers, putProfile, putRead, setAccount, type Account } from "./store";

export function signIn(a: Account) {
  let profile = activeProfileNow();
  if (!profile) {
    /* NOT PEOPLE[0]'S OWN READ. Built from her handle, this put a real
       creator's name, avatar and city on the dashboard of whoever typed
       a number, and her name on their account. A handle that is not
       seeded is read as the sample (personFor): her figures, and nothing
       that says who she is. "@yourhandle" is the one the landing prints. */
    const handle = "@yourhandle";
    const read = { ...fullReadFor(handle, readIdFor(handle)), done: READ_TASKS.map((t) => t.key) };
    putRead(read);
    profile = profileFor(read);
    putProfile(profile);
    putOffers(offersFor(profile));
  }
  /* The sheet asks a returning creator for their number only, so the
     name on the account is the one on the profile. */
  const [first = "", ...rest] = (profile.creatorName ?? "").split(/\s+/);
  setAccount({ ...a, firstName: a.firstName || first, lastName: a.lastName || rest.join(" ") });
}
