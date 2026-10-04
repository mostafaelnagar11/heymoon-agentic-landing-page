/* Where a finished read is kept, so a rate card can be rebuilt from its
   id alone.

   A card holds a `readId`, not a read. Deep-linking to a card the store
   has never seen therefore needs somewhere to look the read up — and
   because every tool here is deterministic, rebuilding it is exact
   rather than approximate. Same module, same job, as the brands app. */

import type { CreatorRead } from "./types";
import { fullReadFor, readIdFor } from "./tools";

const seen = new Map<string, CreatorRead>();

export const rememberRead = (r: CreatorRead) => { seen.set(r.id, r); };

/** The read behind an id. Rebuilt from the fixture when it is not in
    memory, because a reload must not lose the evidence under a card. */
export function getRead(id: string): CreatorRead {
  const held = seen.get(id);
  if (held) return held;
  const handle = id.replace(/^r-/, "");
  const rebuilt = fullReadFor(handle, readIdFor(handle));
  seen.set(rebuilt.id, rebuilt);
  return rebuilt;
}
