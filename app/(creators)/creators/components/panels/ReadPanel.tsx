"use client";

/* Everything HeyMoon found, with the evidence under every line.
 *
 * The brands app opens each row into "MoonShot AI read this off the
 * home page" and the page underneath it. Same here, except the thing
 * being read is a person, which raises the stakes on being able to
 * correct it: a brand whose median price is read wrong loses a plan, a
 * creator whose audience is read wrong loses money.
 */

import { Card } from "../ui";
import { EvidenceRow, ReadValue, SampleNotice, agentForLayer } from "../blocks";
import { useRead, useStore } from "../../lib/store";
import type { CreatorRead, ReadLayerKey, Sourced } from "../../lib/agent/types";

const ORDER: { k: ReadLayerKey; label: string }[] = [
  { k: "accounts", label: "Your accounts" },
  { k: "niche", label: "What you post about" },
  { k: "audience", label: "Where they are" },
  { k: "voice", label: "How you talk" },
  { k: "cadence", label: "Your rhythm" },
  { k: "conflicts", label: "What is already in your grid" },
];

export function ReadPanel() {
  const readId = useStore((s) => Object.keys(s.reads)[0] ?? null);
  const read = useRead(readId);
  if (!read) return <p className="text-body text-ink-60">Nothing read yet.</p>;

  return (
    <div className="space-y-3">
      {/* The panel is the same read at full length, so it opens the same
          way: a sample says so before its first "your". */}
      {read.sample && <Card className="overflow-hidden"><SampleNotice /></Card>}
      {ORDER.filter((o) => read.done.includes(o.k)).map(({ k, label }) => (
        <Layer key={k} read={read} layer={k} label={label} />
      ))}

      {/* WHETHER HEYMOON CAN PLACE THEM, which used to be a price and
          is now a question about brands. The evidence under it is the
          one place the matching weights are written down in full. */}
      {read.standing && (
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-50">What HeyMoon can place you on</p>
            <div className="mt-1 text-body text-ink"><ReadValue read={read} layer="standing" /></div>
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold text-ink">{agentForLayer("standing")} worked this out from:</p>
            <ul className="mt-1 divide-y divide-line">
              {read.standing.best.evidence.map((e) => <EvidenceRow key={e.id} e={e} />)}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}

function Layer({ read, layer, label }: { read: CreatorRead; layer: ReadLayerKey; label: string }) {
  const src = (read as unknown as Record<string, Sourced<unknown> | undefined>)[layer];
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-4 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-50">{label}</p>
        <div className="mt-1 text-body text-ink"><ReadValue read={read} layer={layer} /></div>
      </div>
      {src && src.evidence.length > 0 && (
        <div className="px-4 py-2.5">
          <p className="text-[11px] font-semibold text-ink">{agentForLayer(layer)} read this off:</p>
          <ul className="mt-0.5 divide-y divide-line">
            {src.evidence.map((e) => <EvidenceRow key={e.id} e={e} />)}
          </ul>
        </div>
      )}
    </Card>
  );
}
