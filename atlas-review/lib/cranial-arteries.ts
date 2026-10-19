import data from '../public/models/bodyparts3d/cranial-arteries/catalog.json' with { type: 'json' };
import {
  applyBodySourceAddition,
  sourceCanonical,
  type BodySourceAddition,
} from './body-source-additions';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export const addCranialArteries = (catalog: BodyCatalog) =>
  applyBodySourceAddition(catalog, source);
export function cranialArteryLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (!source.structures.some((p) => sourceCanonical(p) === sourceCanonical(s)))
    return undefined;
  const citations = [
    'https://anatomy.ttuhscep.edu/anatomytables/arteries_head_neck.html',
  ];
  const mca = s.fmaId === 'FMA50082',
    pica = ['FMA50519', 'FMA50520'].includes(s.fmaId);
  const parent = mca
    ? 'internal carotid artery'
    : pica
      ? 'vertebral artery'
      : 'basilar artery';
  const supply = mca
    ? 'Lateral cerebral surfaces receive MCA branches.'
    : pica
      ? 'PICA contributes to inferior cerebellar and medullary supply.'
      : 'The superior cerebellar artery contributes to superior cerebellar supply.';
  const note =
    'Original source-reference teaching draft. No continuous lumen, complete perfusion territory, patent donor junction or patient-scan correspondence is established.';
  if (['anatomy', 'function', 'quiz'].includes(tab))
    return {
      readiness: 'draft',
      title: `${s.name} · ${tab === 'quiz' ? 'Self-check' : tab === 'function' ? 'Supply relationships' : 'Anatomy'} · draft`,
      body:
        tab === 'quiz'
          ? `Which artery is the usual parent of this selection? Answer: ${parent}.`
          : tab === 'function'
            ? supply
            : `The usual parent is the ${parent}. Use Arterial connections to compare the available source surfaces.`,
      bullets: [
        s.coverageNote!,
        'Return separation to 0% for source-position comparison. Surface proximity is not proof of a vascular junction.',
      ],
      citations,
      note,
    };
  return {
    readiness: 'pending',
    title: `${s.name} · Review pending`,
    body: 'Structure-specific clinical, pathology and imaging teaching awaits radiologist review.',
    bullets: [],
    note: 'No angiogram, perfusion map, diagnostic interpretation or intervention guidance is supplied.',
  };
}
