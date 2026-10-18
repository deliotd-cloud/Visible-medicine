import pins from '../content/laryngeal-framework-imaging-pins.json' with { type: 'json' };
import {
  laryngealFrameworkImagingTopics,
  laryngealFrameworkImagingScope,
  laryngealFrameworkImagingNote,
  type LaryngealFrameworkImagingGroup,
} from '../content/laryngeal-framework-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map((entry) => [
  entry.identity.id,
  { identity: sourceCanonical(entry.identity), group: entry.group as LaryngealFrameworkImagingGroup, topics: entry.topics },
]));

export function laryngealFrameworkImagingLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri' && tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || !binding.topics.includes(tab) || sourceCanonical(s) !== binding.identity) return undefined;
  const topic = laryngealFrameworkImagingTopics[binding.group]?.[tab];
  if (!topic) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'ultrasound' ? 'Ultrasound' : tab.toUpperCase()} orientation · draft`,
    body: topic.body,
    bullets: [laryngealFrameworkImagingScope, ...topic.bullets],
    citations: [...topic.citations],
    note: laryngealFrameworkImagingNote,
  };
}
