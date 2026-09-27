import pins from '../content/shoulder-arterial-ct-pins.json' with { type: 'json' };
import { shoulderArterialCtTopics, shoulderArterialCtAcquisition, type ShoulderArterialCtGroup } from '../content/shoulder-arterial-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, { identity: sourceCanonical(entry.identity), group: entry.group as ShoulderArterialCtGroup }]));
export function shoulderArterialCtLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const entry = bindings.get(structure.id);
  if (!entry || entry.identity !== sourceCanonical(structure)) return undefined;
  const topic = shoulderArterialCtTopics[entry.group];
  return {
    readiness: 'draft',
    title: `${structure.name} · ${topic.title} · draft`,
    body: topic.body,
    bullets: [shoulderArterialCtAcquisition, ...topic.bullets, `Source limit: ${structure.coverageNote}`],
    citations: [...topic.citations],
    note: 'Educational draft for revision-bound radiologist review. Set separation to zero before comparing relationships. No patient images, registration or clinical approval are supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
