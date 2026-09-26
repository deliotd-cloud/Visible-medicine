import pins from '../content/small-intestinal-mesentery-mri-pins.json' with { type: 'json' };
import { smallIntestinalMesenteryMriTopic, smallIntestinalMesenteryMriReference } from '../content/small-intestinal-mesentery-mri';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bound = new Map(pins.entries.map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));
/** Source-bound orientation, not patient-specific mesenteric segmentation. */
export function smallIntestinalMesenteryMriLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri' || bound.get(structure.id) !== sourceCanonical(structure)) return undefined;
  return {
    readiness: 'draft', title: `${structure.name} · MRI orientation · draft`,
    body: smallIntestinalMesenteryMriTopic.body,
    bullets: [...smallIntestinalMesenteryMriTopic.bullets,
      'This is the source-labelled small-intestinal mesentery, not the transverse mesocolon or mesoappendix. Its roots, leaves and vessels are not separately validated. Return separation to zero before comparing relationships.'],
    citations: [smallIntestinalMesenteryMriReference, 'https://creativecommons.org/licenses/by/4.0/'],
    note: 'Independent anatomical/radiology review pending. Original adapted summary of Pierro et al. (2023), Life 13(8): 1691, CC BY 4.0; no figures imported. No scans, patient registration, diagnosis or acquisition protocol. Case, Atlas and paid-lecture access remain independent.',
  };
}
