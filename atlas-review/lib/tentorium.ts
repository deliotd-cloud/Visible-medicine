import data from '../public/models/bodyparts3d/tentorium/catalog.json' with { type: 'json' };
import {
  applyBodySourceAddition,
  sourceCanonical,
  type BodySourceAddition,
} from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addTentorium(catalog: BodyCatalog) {
  return applyBodySourceAddition(catalog, source);
}
export function tentoriumLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    sourceCanonical(s) !== sourceCanonical(source.structures[0]) ||
    !['anatomy', 'function'].includes(tab)
  )
    return undefined;
  return {
    readiness: 'draft',
    title: `Tentorium · ${tab === 'anatomy' ? 'Dural fold' : 'Support & compartments'} · draft`,
    body:
      tab === 'anatomy'
        ? 'The tentorium is a dural fold over the cerebellum, beneath the posterior cerebrum. The midbrain passes through its tentorial notch. This selection shows only the supplied right-sided portion, not the complete fold or notch.'
        : 'The tentorium supports and partly separates intracranial regions. It is connective tissue, not cerebellar cortex, a vessel or a moving muscle. This static surface does not simulate brain pressure or tissue displacement.',
    bullets: [
      'The tentorium itself is not a paired right/left organ. “Right” describes this incomplete source surface and controls which side can display it.',
      'The complete left portion, other dural folds, venous sinuses and attachment footprints are not supplied. Separation is an explanatory display, not surgery or herniation.',
      'Use the Tentorium: supplied right portion study to set the brain aside and inspect the source fold against nearby skull bones.',
    ],
    note: 'Independent anatomical and clinical review pending. No CT/MRI segmentation, scan intensity, registration or patient finding is implied.',
    citations: [
      'https://anatomy.ttuhscep.edu/anatomytables/brain.html',
      'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html',
    ],
  };
}
