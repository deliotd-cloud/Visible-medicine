import data from '../public/models/bodyparts3d/limbic-landmarks/catalog.json' with { type:'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions';
import { limbicLandmarkStudy, limbicLandmarkReferences } from '../content/limbic-landmark-study';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source=data as unknown as BodySourceAddition;
export function addLimbicLandmarks(catalog:BodyCatalog) { return applyBodySourceAddition(catalog,source); }
export function limbicLandmarkStudyReady(catalog:BodyCatalog|null, region:string, recipeId:string|null) {
  if(recipeId!==limbicLandmarkStudy.id) return true;
  if(!catalog||!limbicLandmarkStudy.regions.includes(region)||catalog.sourceVersion!==source.sourceVersion||
    catalog.license!==source.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(source.coordinateSystem))return false;
  for(const pin of [...source.contextRecords,...source.structures]) {
    const matches=catalog.structures.filter(s=>s.id===pin.id||s.fmaId===pin.fmaId);
    if(matches.length!==1||sourceCanonical(matches[0])!==sourceCanonical(pin))return false;
  }
  for(const pin of [...source.contextBundles,...source.bundles]) {
    const matches=catalog.bundles.filter(b=>b.id===pin.id||b.url.split('?')[0]===pin.url.split('?')[0]);
    if(matches.length!==1||sourceCanonical(matches[0])!==sourceCanonical(pin))return false;
  }
  return true;
}
export function limbicLandmarkLesson(s:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if(!source.structures.some(pin=>sourceCanonical(pin)===sourceCanonical(s)))return undefined;
  const stria=s.fmaId==='FMA73414'||s.fmaId==='FMA73413',lamina=s.fmaId==='FMA61975';
  const note='Source-bound teaching draft for radiologist review. Coarse reference surfaces do not establish individual fibres, nuclei, clinical function or patient registration.';
  const citations=[...limbicLandmarkReferences];
  if(tab==='anatomy')return {readiness:'draft',title:`${s.name} · Anatomy · draft`,
    body:stria?'The stria medullaris thalami courses along the dorsomedial thalamic region towards the habenula. It is distinct from the stria terminalis, which follows the caudothalamic region.'
      :lamina?'The lamina terminalis contributes to the anterior wall of the third ventricle, between the optic chiasm and anterior commissure. The supplied definition consists of two original pieces, not a reconstructed continuous membrane.'
      :'This selection retains the official broad septum-of-telencephalon source definition. Do not equate the compound surface with a separately segmented septal nucleus, septum verum or complete septum pellucidum.',
    bullets:['Open Study → Deep brain: septal landmarks for the thalamic, fornical and commissural context.','Remove an obscuring context structure and Undo to restore it. Use 0% separation before interpreting spatial relationships.'],note,citations};
  if(tab==='function'&&(stria||lamina))return {readiness:'draft',title:`${s.name} · Function · draft`,
    body:stria?'The stria medullaris carries afferent connections towards the habenular region, including fibres from septal/preoptic areas. This model does not resolve individual projections, synapses or signal direction.'
      :'Its anatomical role here is as a boundary of the third ventricle. The surface does not depict a patent opening, cerebrospinal-fluid flow or separately segmented specialised cellular regions.',
    bullets:[stria?'Do not substitute this tract for the amygdala-related stria terminalis, whose source is withheld.':'The two source pieces retain their separate normals; no opening, tissue bridge or surgical access has been generated.'],note,citations};
  if(tab==='quiz')return {readiness:'draft',title:`${s.name} · Self-check · draft`,
    body:stria?'Which small epithalamic region receives afferents through the stria medullaris?':lamina?'Which ventricular wall does the lamina terminalis help form?':'Does this broad source label certify a separately modelled septal nucleus?',
    bullets:[stria?'Answer: the habenular region. This does not validate every projected connection in the source mesh.':lamina?'Answer: the anterior wall of the third ventricle.':'Answer: no. Gross source identity is not a cellular or nuclear parcellation.'],note,citations};
  return {readiness:'pending',title:`${s.name} · Review pending`,body:'Detailed structure-specific clinical and imaging teaching awaits authoring and review.',bullets:[],note:'No acquired CT, MRI, X-ray, ultrasound, diffusion tractography or patient registration is supplied.'};
}
