import data from '../public/models/bodyparts3d/inferior-thyroid-arteries/catalog.json' with { type: 'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addInferiorThyroidArteries(catalog: BodyCatalog) {
  return applyBodySourceAddition(catalog, source);
}
export function inferiorThyroidLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (!source.structures.some((p) => sourceCanonical(p) === sourceCanonical(s))) return undefined;
  const citations = ['https://anatomy.ttuhscep.edu/nervous_system/antneck_tables.html'];
  const note = 'Source-reference teaching draft for radiologist review. No gland segmentation, continuous lumen, procedural route or patient correspondence is established.';
  if (tab === 'anatomy' || tab === 'function') return {
    readiness: 'draft', title: `${s.name} · ${tab === 'anatomy' ? 'Source anatomy' : 'Supply relationships'} · draft`,
    body: tab === 'anatomy'
      ? 'The inferior thyroid artery typically arises from the thyrocervical trunk. Use Arterial connections to compare the supplied sources on the same side.'
      : 'This artery contributes to thyroid and lower-neck visceral supply. The displayed surface does not delineate a complete supply territory or all glandular branches.',
    bullets: [
      'The complete original source definition is retained, but that does not establish anatomical completeness of the named vessel.',
      'Thyroid/parathyroid tissue and recurrent laryngeal nerves are not added here. Do not infer their positions or an operative plane from this artery surface.',
      'Return separation to 0% before comparing source positions. Clipping a surface is not CT, MRI, ultrasound or angiography.',
    ], note, citations,
  };
  if (tab === 'quiz') return {
    readiness: 'draft', title: `${s.name} · Self-check · draft`,
    body: 'What is the usual parent vessel of the inferior thyroid artery?',
    bullets: ['Answer: the thyrocervical trunk.', 'A typical relationship does not prove a joined source lumen or exclude anatomical variants.'], note, citations,
  };
  return { readiness: 'pending', title: `${s.name} · Review pending`, body: 'Structure-specific clinical, pathology and imaging teaching awaits review.', bullets: [], note: 'No scan, diagnostic interpretation or intervention guidance is supplied.' };
}
