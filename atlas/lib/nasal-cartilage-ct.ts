import pins from '../content/nasal-cartilage-quiz-pins.json' with { type: 'json' };
import { nasalCartilageCtGroups, nasalCartilageCtTopics, nasalCartilageCtNote } from '../content/nasal-cartilage-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof nasalCartilageCtGroups;
const bindings = new Map<string, { signature: string; group: Group }>();
const expectedCount = Object.values(nasalCartilageCtGroups).reduce((count, fmas) => count + fmas.length, 0);
if (expectedCount !== 5 || pins.entries.length !== expectedCount) {
  throw Error('Unexpected nasal cartilage CT source binding count');
}
for (const [group, fmas] of Object.entries(nasalCartilageCtGroups)) {
  for (const fma of fmas) {
    const matches = pins.entries.filter(entry => entry.group === group && entry.identity.fmaId === fma);
    if (matches.length !== 1) throw Error('Unexpected nasal cartilage CT source binding');
    const identity = matches[0].identity;
    if (bindings.has(identity.id)) throw Error('Duplicate nasal cartilage CT identity');
    bindings.set(identity.id, { signature: sourceCanonical(identity), group: group as Group });
  }
}

/** Five exact existing source records only; no new anatomy, geometry or scan mapping. */
export function nasalCartilageCtLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = nasalCartilageCtTopics[binding.group];
  return {
    readiness: 'draft',
    title: `${s.name} · CT interpretation limits · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note: nasalCartilageCtNote,
  };
}


