import pins from '../content/achilles-ct-pins.json' with { type: 'json' };
import { achillesCtTopic } from '../content/achilles-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));
export function achillesCtLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' || bindings.get(structure.id) !== sourceCanonical(structure)) return undefined;
  return {
    readiness: 'draft',
    title: `${structure.name} · ${achillesCtTopic.title} · draft`,
    body: achillesCtTopic.body,
    bullets: [...achillesCtTopic.bullets, `Source limit: ${structure.coverageNote}`, achillesCtTopic.credit],
    citations: [...achillesCtTopic.citations, 'https://creativecommons.org/licenses/by/4.0/'],
    note: 'Educational draft for revision-bound radiologist review. Set separation to zero before comparing relationships. No patient images, registration or clinical approval are supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
