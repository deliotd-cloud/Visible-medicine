import pins from '../content/orbital-nerve-mri-pins.json' with { type: 'json' };
import {
  orbitalNerveMriTopics,
  orbitalNerveMriScope,
  orbitalNerveMriNote,
  type OrbitalNerveMriGroup,
} from '../content/orbital-nerve-mri';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map((entry) => [
  entry.identity.id,
  { identity: sourceCanonical(entry.identity), group: entry.group as OrbitalNerveMriGroup, topics: entry.topics },
]));

export function orbitalNerveMriLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || !binding.topics.includes(tab) || sourceCanonical(s) !== binding.identity) return undefined;
  const topic = orbitalNerveMriTopics[binding.group];
  if (!topic) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · MRI orientation · draft`,
    body: topic.body,
    bullets: [orbitalNerveMriScope, ...topic.bullets],
    citations: [...topic.citations],
    note: orbitalNerveMriNote,
  };
}
