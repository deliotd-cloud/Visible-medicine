import pins from '../content/long-bone-imaging-pins.json' with { type: 'json' };
import { longBoneImagingGroups, longBoneImagingTopics, longBoneImagingNote } from '../content/long-bone-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof longBoneImagingGroups;
const bindings = new Map<string, { signature: string; group: Group }>();
const expectedCount = Object.values(longBoneImagingGroups).reduce((count, fmas) => count + fmas.length, 0);
if (expectedCount !== 6 || pins.entries.length !== expectedCount) {
  throw Error('Unexpected long-bone imaging source binding count');
}
for (const [group, fmas] of Object.entries(longBoneImagingGroups)) {
  for (const fma of fmas) {
    const matches = pins.entries.filter(entry => entry.group === group && entry.identity.fmaId === fma);
    if (matches.length !== 1) throw Error('Unexpected long-bone imaging source binding');
    const identity = matches[0].identity;
    if (bindings.has(identity.id)) throw Error('Duplicate long-bone imaging identity');
    bindings.set(identity.id, { signature: sourceCanonical(identity), group: group as Group });
  }
}

/** Six exact source bones, two modalities; no geometry or patient-image mapping. */
export function longBoneImagingLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = longBoneImagingTopics[binding.group][tab];
  return {
    readiness: 'draft',
    title: `${s.name} · whole-bone ${tab.toUpperCase()} orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note: longBoneImagingNote,
  };
}
