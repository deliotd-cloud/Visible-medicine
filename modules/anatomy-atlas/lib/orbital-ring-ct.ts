import pins from '../content/orbital-support-mri-pins.json' with { type: 'json' };
import {
  orbitalRingCtTopic,
  orbitalRingCtScope,
  orbitalRingCtNote,
} from '../content/orbital-ring-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

// Reuse only complete immutable ring identities. The pin file's MRI lesson,
// readiness, previous content and review state have no authority over CT.
const bindings = new Map(pins.entries.filter(entry => entry.family === 'ring')
  .map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));

/** Exact retained source selection only: no name, FMA or laterality fallback. */
export function orbitalRingCtLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const identity = bindings.get(structure.id);
  if (!identity || sourceCanonical(structure) !== identity) return undefined;
  return {
    readiness: orbitalRingCtTopic.readiness,
    title: `${structure.name} · CT orientation · draft`,
    body: orbitalRingCtTopic.body,
    bullets: [orbitalRingCtScope, ...orbitalRingCtTopic.bullets],
    citations: [...orbitalRingCtTopic.citations],
    note: orbitalRingCtNote,
  };
}
