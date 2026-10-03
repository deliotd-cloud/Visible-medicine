import pins from '../content/hand-arterial-ct-pins.json' with { type: 'json' };
import { handArterialCtAcquisition, handArterialCtTopics, type HandArterialCtGroup } from '../content/hand-arterial-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  identity: sourceCanonical(entry.identity),
  group: entry.group as HandArterialCtGroup,
  topics: new Set(entry.topics),
}]));

/** Closed, exact-source CT teaching for the 26 retained hand arterial selections. */
export function handArterialCtLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || binding.identity !== sourceCanonical(s) || !binding.topics.has(tab)) return undefined;
  const topic = handArterialCtTopics[binding.group];
  if (!topic) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${topic.title} · draft`,
    body: topic.body,
    bullets: [handArterialCtAcquisition, ...topic.bullets, `Source limit: ${s.coverageNote}`],
    citations: [...topic.citations],
    note: 'Educational draft for revision-bound radiologist review. Set separation to zero before comparing relationships. No patient images, registration or clinical approval are supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
