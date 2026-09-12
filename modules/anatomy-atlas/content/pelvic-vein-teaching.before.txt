import data from '../public/models/bodyparts3d/pelvic-veins/catalog.json' with { type:'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions';
import { pelvicVeinStudy, pelvicVeinReferences } from '../content/pelvic-vein-study';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source=data as unknown as BodySourceAddition;
export function addPelvicVeins(catalog:BodyCatalog) { return applyBodySourceAddition(catalog,source); }
export function pelvicVeinStudyReady(catalog:BodyCatalog|null, region:string, recipeId:string|null) {
  if(recipeId!==pelvicVeinStudy.id) return true;
  if(!catalog||!pelvicVeinStudy.regions.includes(region)||catalog.sourceVersion!==source.sourceVersion||
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
export function pelvicVeinLesson(s:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if(!source.structures.some(pin=>sourceCanonical(pin)===sourceCanonical(s)))return undefined;
  const iliolumbar=s.sourceName.includes('iliolumbar');
  const pudendal=s.sourceName.includes('internal pudendal');
  const obturator=s.sourceName.includes('obturator');
  const gluteal=s.sourceName.includes('gluteal');
  const note='Source-bound teaching draft for radiologist review. This reference surface is not a patient image, connected lumen or procedural plan.';
  const citations=[...pelvicVeinReferences];
  if(tab==='anatomy')return {readiness:'draft',title:`${s.name} · Anatomy · draft`,
    body:iliolumbar?'The iliolumbar venous system links the lower lumbar and iliac regions. Its tributaries and receiving iliac vein vary; do not infer a universal branching pattern from one specimen.'
      :pudendal?'The internal pudendal vein is a perineal drainage route towards the internal iliac vein. Its course includes the pudendal canal, which is not reconstructed in this study.'
      :obturator?'The obturator vessels traverse the obturator canal at the superior margin of the obturator foramen. The nearby hip bone is orientation context, not a validated reconstruction of the canal or its nerve.'
      :gluteal?'Use this named gluteal venous surface to inspect its source position relative to the iliac veins and hip bone. It is only the supplied source extent, not the entire gluteal venous network.'
      :'Inspect this right lateral sacral source alongside the sacrum and right iliac veins. The left-labelled source is withheld for coordinate/laterality adjudication.',
    bullets:['Study → Pelvic venous tributaries provides a focused view. Hide an obscuring bone, select a vein and use Undo to restore removed structures.','Ten supplied vein definitions are visible. Left internal pudendal and left lateral sacral coverage remains missing; no counterpart has been invented.'],note,citations};
  if(tab==='function'&&(iliolumbar||pudendal))return {readiness:'draft',title:`${s.name} · Drainage · draft`,
    body:iliolumbar?'These veins drain the lower lumbar/iliac region into the iliac venous system, commonly the common iliac vein. Published dissections and venograms describe variable trunks and terminations.'
      :pudendal?'This route carries venous return from perineal structures towards the internal iliac system. It is not interchangeable with superficial external pudendal drainage.'
      :'This is a venous reference selection, not a simulation of drainage. Compare its original position with the supplied iliac veins; detailed structure-specific tributaries, territories and variants still require authoring and review.',
    bullets:['No valves, flow direction, pressure, collateral recruitment or vessel patency can be established from these static surfaces.'],note,citations};
  if(tab==='quiz')return {readiness:'draft',title:`${s.name} · Self-check · draft`,
    body:iliolumbar?'Must every iliolumbar vein terminate through an identical common trunk?':pudendal?'Which iliac vein usually receives this perineal drainage route?':'Can apparently touching source surfaces establish a patent venous connection?',
    bullets:[iliolumbar?'Answer: no. Tributaries, trunks and receiving iliac veins vary.':pudendal?'Answer: the internal iliac vein.':'Answer: no. Surface proximity alone does not establish lumen continuity or patency.'],note,citations};
  return {readiness:'pending',title:`${s.name} · Review pending`,body:'Detailed clinical, pathology and imaging teaching awaits authoring and review.',bullets:[],note:'No acquired CT, MRI, X-ray, ultrasound or patient registration is supplied.'};
}
