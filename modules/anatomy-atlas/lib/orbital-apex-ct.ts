import pins from '../content/orbital-nerve-mri-pins.json' with { type: 'json' };
import {
  orbitalApexCtTopics,
  orbitalApexCtScope,
  orbitalApexCtNote,
  type OrbitalApexCtGroup,
} from '../content/orbital-apex-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

// Reuse only the immutable geometry identities and group labels from this pin set.
// Its MRI topic list, lesson text, readiness and review state have no CT authority.
const bindings = new Map(pins.entries.map(entry => [
  entry.identity.id,
  { identity: sourceCanonical(entry.identity), group: entry.group as OrbitalApexCtGroup },
]));

export function orbitalApexCtLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const binding = bindings.get(structure.id);
  if (!binding || sourceCanonical(structure) !== binding.identity) return undefined;
  const topic = orbitalApexCtTopics[binding.group];
  // A pending research candidate must not replace the existing pending lesson.
  if (!topic || topic.readiness !== 'draft') return undefined;
  return {
    readiness: topic.readiness,
    title: `${structure.name} · CT orientation · ${topic.readiness}`,
    body: topic.body,
    bullets: [orbitalApexCtScope, ...topic.bullets],
    citations: [...topic.citations],
    note: orbitalApexCtNote,
  };
}
