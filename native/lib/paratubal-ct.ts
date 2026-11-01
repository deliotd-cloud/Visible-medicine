import pins from '../content/pharyngeal-mri-pins.json' with { type: 'json' };
import { paratubalCtTopics } from '../content/paratubal-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof paratubalCtTopics;
const expected = new Map<string, Group>([
  ['FMA46729', 'levator'], ['FMA46728', 'levator'],
  ['FMA46732', 'tensor'], ['FMA46731', 'tensor'],
]);
// Reuse the already-pinned complete surface identities, never a name-only match.
const entries = pins.entries.filter(entry => expected.has(entry.identity.fmaId));
if (entries.length !== 4 || new Set(entries.map(entry => entry.identity.fmaId)).size !== 4 ||
  entries.some(entry => entry.group !== expected.get(entry.identity.fmaId) ||
    entry.identity.nodeName !== entry.identity.fmaId))
  throw Error('Unexpected paratubal CT source pins.');
const bindings = new Map(entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as Group,
}]));

/** Research-context CT teaching, bound to these four reference surfaces only. */
export function paratubalCtLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const binding = bindings.get(structure.id);
  if (!binding || sourceCanonical(structure) !== binding.signature) return undefined;
  const topic = paratubalCtTopics[binding.group];
  return {
    readiness: 'draft', title: `${structure.name} · CT research context · draft`,
    body: topic.body, bullets: [...topic.bullets], citations: [...topic.citations], note: topic.note,
  };
}
