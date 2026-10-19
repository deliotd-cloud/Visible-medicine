import pins from '../content/tentorium-imaging-pins.json' with { type: 'json' };
import { tentoriumImagingTopics } from '../content/tentorium-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const target = pins.entries[0];
const targetSignature = sourceCanonical(target.identity);

export function tentoriumImagingLesson(
  structure: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  if (structure.fmaId !== 'FMA83966' ||
      structure.bundle !== 'tentorium-partial' ||
      structure.laterality !== 'right' ||
      structure.region !== 'head-neck' ||
      structure.system !== 'connective' ||
      sourceCanonical(structure) !== targetSignature) return undefined;

  const topic = tentoriumImagingTopics[tab];
  return {
    readiness: 'draft',
    title: `${structure.name} · ${topic.title} · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note: `Educational draft for revision-bound radiologist review. Anatomy summary adapted from Rai et al., The Tentorium Cerebelli (2018), CC BY 3.0; no endorsement. No figure or clinical image reproduced. Compare the assembled source surface at zero separation. It supplies no acquired CT/MRI images, intensities, masks, registration, patient finding or clinical approval. Atlas, imaging-case and paid-lecture access remain independent. Source limit: ${structure.coverageNote}`,
  };
}
