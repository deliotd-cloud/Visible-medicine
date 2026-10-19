import pins from '../content/nasal-cartilage-quiz-pins.json' with { type: 'json' };
import { nasalCartilageMriGroups, nasalCartilageMriTopics } from '../content/nasal-cartilage-mri';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof nasalCartilageMriGroups;
const bindings = new Map<string, { signature: string; group: Group }>();
const expectedCount = Object.values(nasalCartilageMriGroups).reduce((count, fmas) => count + fmas.length, 0);
if (expectedCount !== 5 || pins.entries.length !== expectedCount) {
  throw Error('Unexpected nasal cartilage MRI source binding count');
}
for (const [group, fmas] of Object.entries(nasalCartilageMriGroups)) {
  for (const fma of fmas) {
    const matches = pins.entries.filter(entry => entry.group === group && entry.identity.fmaId === fma);
    if (matches.length !== 1) throw Error('Unexpected nasal cartilage MRI source binding');
    const identity = matches[0].identity;
    if (bindings.has(identity.id)) throw Error('Duplicate nasal cartilage MRI identity');
    bindings.set(identity.id, { signature: sourceCanonical(identity), group: group as Group });
  }
}

/** Five exact existing source records only; no new anatomy, geometry or scan mapping. */
export function nasalCartilageMriLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = nasalCartilageMriTopics[binding.group];
  return {
    readiness: 'draft',
    title: `${s.name} · MRI orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. Recovered CC-BY-4.0 meshes have unvalidated anatomical boundaries. No scan, figure, patient example, acquisition instruction, diagnosis or spatial registration is imported or implied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
