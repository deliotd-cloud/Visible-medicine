import data from '../public/models/bodyparts3d/subscapular-arteries/catalog.json' with {type:'json'};
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export const addSubscapularArteries = (catalog: BodyCatalog) => applyBodySourceAddition(catalog, source);
export function subscapularArteryLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (!source.structures.some(p => sourceCanonical(p) === sourceCanonical(s))) return undefined;
  const citations = ['https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/'];
  const note = 'Source-reference teaching draft for radiologist review. No continuous lumen, measured junction, complete collateral network or patient correspondence is established.';
  if (tab === 'anatomy' || tab === 'function') return {
    readiness: 'draft', title: `${s.name} · ${tab === 'anatomy' ? 'Anatomy' : 'Supply relationships'} · draft`,
    body: tab === 'anatomy'
      ? 'The subscapular artery usually arises from the third part of the axillary artery. Its circumflex scapular and thoracodorsal branches are separate selections in this atlas.'
      : 'The subscapular system contributes to the scapular region and latissimus dorsi through its branches. The model does not delimit a complete perfusion territory.',
    bullets: ['Use Arterial connections to compare the available same-side parent and branches.', 'The original IS-A source is retained; the broader PART-OF aggregate is not imported over its existing branch surfaces.', 'Return separation to 0% for source-position comparison. Artificial separation or clipping is not angiography.'], citations, note,
  };
  if (tab === 'quiz') return {
    readiness: 'draft', title: `${s.name} · Self-check · draft`,
    body: 'Which two named branches are linked to this subscapular selection?',
    bullets: ['Circumflex scapular and thoracodorsal arteries.', 'Typical branching does not prove donor-specific junctions or exclude variation.'], citations, note,
  };
  return {readiness:'pending',title:`${s.name} · Review pending`,body:'Structure-specific clinical, pathology and imaging teaching awaits review.',bullets:[],note:'No scan, diagnostic interpretation or intervention guidance is supplied.'};
}
