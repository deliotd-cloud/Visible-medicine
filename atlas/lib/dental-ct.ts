import pins from '../content/dental-ct-pins.json' with { type: 'json' };
import { dentalCtGroups, dentalCtTopics, dentalCtNote } from '../content/dental-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof dentalCtGroups;
const expectedGroups = ['incisors', 'canines', 'premolars', 'molars'];
const expectedCounts = [8, 4, 8, 8];
if (JSON.stringify(Object.keys(dentalCtGroups)) !== JSON.stringify(expectedGroups) ||
    JSON.stringify(Object.keys(dentalCtTopics)) !== JSON.stringify(expectedGroups) ||
    pins.entries.length !== 28 ||
    JSON.stringify(expectedGroups.map(group => dentalCtGroups[group as Group].length)) !== JSON.stringify(expectedCounts))
  throw Error('Unexpected dental CT source scope');

const bindings = new Map<string, { signature: string; group: Group }>();
const fmas = Object.values(dentalCtGroups).flat();
if (new Set(fmas).size !== 28) throw Error('Duplicate dental CT source FMA');
for (const group of expectedGroups as Group[]) {
  const topic = dentalCtTopics[group];
  if (typeof topic.body !== 'string' || !Array.isArray(topic.bullets) ||
      !Array.isArray(topic.citations)) throw Error('Dental CT topic unavailable');
  for (const fma of dentalCtGroups[group]) {
    const matches = pins.entries.filter(entry => entry.group === group &&
      entry.identity.fmaId === fma && entry.topic === 'ct' && entry.previousReadiness === 'pending');
    if (matches.length !== 1) throw Error('Dental CT source identity unavailable');
    const identity = matches[0].identity;
    if (bindings.has(identity.id)) throw Error('Duplicate dental CT identity');
    bindings.set(identity.id, { signature: sourceCanonical(identity), group });
  }
}

/** A source-bound draft about CT methods for 28 exterior tooth records.
 * This provides no scan correspondence, segmented internals or approval. */
export function dentalCtLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const binding = bindings.get(structure.id);
  if (!binding || sourceCanonical(structure) !== binding.signature) return undefined;
  const topic = dentalCtTopics[binding.group];
  return {
    readiness: 'draft', title: `${structure.name} · CT methods orientation · draft`,
    body: topic.body, bullets: [...topic.bullets], citations: [...topic.citations], note: dentalCtNote,
  };
}
