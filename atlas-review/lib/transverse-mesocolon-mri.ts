import pins from '../content/transverse-mesocolon-mri-pins.json' with { type: 'json' };
import { transverseMesocolonMriTopic, transverseMesocolonMriReference } from '../content/transverse-mesocolon-mri';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bound = new Map(pins.entries.map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));
/** Source-bound orientation, not a patient-specific mesocolic segmentation. */
export function transverseMesocolonMriLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri' || bound.get(structure.id) !== sourceCanonical(structure)) return undefined;
  return {
    readiness: 'draft', title: `${structure.name} · MRI orientation · draft`,
    body: transverseMesocolonMriTopic.body,
    bullets: [...transverseMesocolonMriTopic.bullets,
      'This is the source-labelled transverse-colon mesentery, not the small-intestinal mesentery or a vessel. Its folds, thickness and attachment boundaries are not validated MRI contours. Return separation to zero before comparing relationships.'],
    citations: [transverseMesocolonMriReference, 'https://creativecommons.org/licenses/by/4.0/'],
    note: 'Independent anatomy/radiology review pending. Original summary of Chi et al. (2014), PLOS ONE 9(4): e93687, CC BY 4.0; wording adapted, no figures imported. No patient images, scan registration, diagnosis or acquisition protocol. Case, Atlas and paid-lecture access remain independent.',
  };
}
