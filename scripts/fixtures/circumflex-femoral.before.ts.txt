import data from '../public/models/bodyparts3d/circumflex-femoral/catalog.json' with { type: 'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export const addCircumflexFemoralBranches = (catalog: BodyCatalog) => applyBodySourceAddition(catalog, source);
export function circumflexFemoralLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (!source.structures.some(p => sourceCanonical(p) === sourceCanonical(s))) return undefined;
  const citations = ['https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/'];
  const note = 'Original-source teaching draft for radiologist review. The parent is grouped within another selection; no donor junction, continuous lumen, perfusion or patient correspondence is established.';
  if (tab === 'anatomy' || tab === 'function') return {
    readiness: 'draft', title: `${s.name} · ${tab === 'anatomy' ? 'Anatomy' : 'Supply relationships'} · draft`,
    body: tab === 'anatomy'
      ? 'The descending branch belongs to the lateral circumflex femoral artery. The latter usually arises from the deep femoral artery, with variable origins.'
      : 'The lateral circumflex femoral system contributes to the lateral thigh and hip. This isolated branch surface is not a complete supply territory or collateral network.',
    bullets: ['The same-side deep-femoral selection already contains the lateral circumflex parent surface. It is not separately selectable.', 'Via grouped parent means a route through that contained component, not a direct deep-femoral branch.', 'Use source position (0% separation) for spatial comparison; branch junctions remain unverified.'], citations, note,
  };
  if (tab === 'quiz') return {
    readiness: 'draft', title: `${s.name} · Model self-check · draft`,
    body: 'Does the grouped upstream selection imply a direct branch from the deep femoral artery?',
    bullets: ['No. The lateral circumflex parent is contained within that selection. The route label distinguishes the aggregate from the individual artery.'], citations, note,
  };
  return { readiness: 'pending', title: `${s.name} · Review pending`, body: 'Structure-specific clinical, pathology and imaging teaching awaits review.', bullets: [], note: 'No acquired scan, diagnostic interpretation or intervention guidance is supplied.' };
}
