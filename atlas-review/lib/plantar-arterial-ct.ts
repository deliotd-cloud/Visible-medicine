import pins from '../content/plantar-arterial-ct-pins.json' with { type: 'json' };
import { plantarArterialCtTopics, plantarArterialCtReferences, sharedImaging, type PlantarArterialCtGroup } from '../content/plantar-arterial-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bound = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as PlantarArterialCtGroup,
}]));
/** Exact catalogue identity admission, never a patient-vessel correspondence. */
export function plantarArterialCtLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const binding = bound.get(structure.id);
  if (!binding || sourceCanonical(structure) !== binding.signature) return undefined;
  const topic = plantarArterialCtTopics[binding.group];
  return {
    readiness: 'draft', title: `${structure.name} · CT arterial orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets, sharedImaging,
      'Return separation to zero for reference relationships. This model has no contrast-filled lumen, perfusion, stenosis measurement or validated scan alignment.'],
    citations: [...new Set([...topic.references.map(key => plantarArterialCtReferences[key]), plantarArterialCtReferences.cta])],
    note: 'Independent anatomy/radiology review pending. No patient images or paid-lecture access. Confirm patient, side, foot coverage, orientation and vascular series before future imaging comparison. Reference teaching only, not diagnosis, an acquisition protocol or procedural clearance.',
  };
}
