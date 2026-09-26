import pins from '../content/acral-bone-imaging-pins.json' with { type: 'json' };
import { halluxXrayTopics, halluxXrayReferences, halluxXrayShared } from '../content/hallux-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
export { halluxXrayReferences } from '../content/hallux-xray';

const groups: Record<string, keyof typeof halluxXrayTopics> = {
  FMA43253: 'proximal', FMA43254: 'proximal',
  FMA32650: 'distal', FMA32651: 'distal',
};
const bindings = new Map(pins.entries.flatMap(({ identity }) => {
  const group = identity.region === 'foot' ? groups[identity.fmaId] : undefined;
  return group ? [[identity.id, { signature: sourceCanonical(identity), group }] as const] : [];
}));

/** Only the four exact retained hallux source identities, never name-only mapping. */
export function halluxXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = halluxXrayTopics[binding.group];
  return {
    readiness: 'draft', title: `${s.name} · X-ray orientation · draft`,
    body: topic.body, bullets: [topic.cue, ...halluxXrayShared],
    citations: [...halluxXrayReferences],
    note: 'Anatomy/radiology review pending for this source revision. No radiograph or spatial registration is supplied. Confirm side and projection on the separate acquired study. This is orientation teaching, not a patient diagnosis or treatment recommendation. Case, Atlas and paid-lecture access remain independent.',
  };
}
