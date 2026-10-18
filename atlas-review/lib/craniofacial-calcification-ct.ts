import pins from '../content/craniofacial-calcification-ct-pins.json' with { type: 'json' };
import { craniofacialCalcificationCtGroups as groups, craniofacialCalcificationCtNote as note } from '../content/craniofacial-calcification-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as keyof typeof groups,
}]));

/** CT only, on the exact displayed source record; no FMA/name fallback. */
export function craniofacialCalcificationCtLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const topic = groups[bound.group];
  return {
    readiness: 'draft',
    title: `${structure.name} · CT orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note,
  };
}
