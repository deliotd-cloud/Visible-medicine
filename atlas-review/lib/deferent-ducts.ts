import data from '../public/models/bodyparts3d/deferent-ducts/catalog.json' with { type: 'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions.ts';
import { deferentDuctStudy, deferentDuctReferences } from '../content/deferent-duct-study.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source = data as unknown as BodySourceAddition;
export function addDeferentDucts(catalog: BodyCatalog) { return applyBodySourceAddition(catalog, source); }

/** One whole-record source gate for this study and all its incoming links. */
export function deferentDuctStudyReady(catalog: BodyCatalog | null, region: string, recipeId: string | null) {
  if (recipeId !== deferentDuctStudy.id) return true;
  if (!catalog || !deferentDuctStudy.regions.includes(region) || catalog.sourceVersion !== source.sourceVersion ||
      catalog.license !== source.license || sourceCanonical(catalog.coordinateSystem) !== sourceCanonical(source.coordinateSystem)) return false;
  for (const pin of [...source.contextRecords, ...source.structures]) {
    const rows = catalog.structures.filter(s => s.id === pin.id || s.fmaId === pin.fmaId);
    if (rows.length !== 1 || sourceCanonical(rows[0]) !== sourceCanonical(pin)) return false;
  }
  for (const pin of [...source.contextBundles, ...source.bundles]) {
    const rows = catalog.bundles.filter(b => b.id === pin.id || b.url.split('?')[0] === pin.url.split('?')[0]);
    if (rows.length !== 1 || sourceCanonical(rows[0]) !== sourceCanonical(pin)) return false;
  }
  return true;
}
export function deferentDuctLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (!source.structures.some(p => sourceCanonical(p) === sourceCanonical(s))) return undefined;
  const note = 'Source-bound teaching draft for radiologist review. Complete source files do not establish complete anatomical extent, a continuous lumen or patient correspondence.';
  if (tab === 'anatomy' || tab === 'function') return {
    readiness:'draft', title:`${s.name} · ${tab === 'anatomy' ? 'Source anatomy' : 'Transport function'} · draft`,
    body: tab === 'anatomy'
      ? 'The deferent duct (ductus or vas deferens) is a muscular duct that continues from the epididymis, passes through the inguinal canal and reaches the posterior bladder region. Its terminal portion joins the seminal-vesicle duct to form the ejaculatory duct.'
      : 'Contraction of the duct wall propels sperm towards the ejaculatory duct. This static surface does not depict peristalsis, flow, patency or fertility.',
    bullets: ['Use Study → Male pelvis: deferent ducts to compare the supplied surfaces and nearby organs.',
      'Epididymides, ejaculatory ducts, cord coverings and nerves are not supplied by this addition; do not infer a complete connection from surface proximity.'],
    note, citations:deferentDuctReferences,
  };
  if (tab === 'quiz') return {readiness:'draft',title:`${s.name} · Self-check · draft`,
    body:'Which duct joins the terminal deferent duct to form the ejaculatory duct?',
    bullets:['Answer: the duct of the seminal vesicle.','A typical anatomical relationship is not proof of a connected source lumen.'],note,citations:deferentDuctReferences};
  return {readiness:'pending',title:`${s.name} · Review pending`,body:'Structure-specific pathology, clinical and imaging teaching awaits review.',bullets:[],note:'No scan, diagnosis, intervention guidance or registered imaging correspondence is supplied.'};
}
