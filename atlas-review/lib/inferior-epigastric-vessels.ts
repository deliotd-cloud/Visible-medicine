import data from '../public/models/bodyparts3d/inferior-epigastric-vessels/catalog.json' with { type:'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions';
import { inferiorEpigastricStudy, inferiorEpigastricReferences } from '../content/inferior-epigastric-study';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const source=data as unknown as BodySourceAddition;
export function addInferiorEpigastricVessels(catalog:BodyCatalog) { return applyBodySourceAddition(catalog,source); }
export function inferiorEpigastricStudyReady(catalog:BodyCatalog|null, region:string, recipeId:string|null) {
  if(recipeId!==inferiorEpigastricStudy.id) return true;
  if(!catalog||!inferiorEpigastricStudy.regions.includes(region)||catalog.sourceVersion!==source.sourceVersion||
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
export function inferiorEpigastricLesson(s:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if(!source.structures.some(pin=>sourceCanonical(pin)===sourceCanonical(s)))return undefined;
  const artery=s.fmaId==='FMA20689'||s.fmaId==='FMA20688';
  const note='Source-bound teaching draft for radiologist review. A surface is not a lumen, perfusion map, procedural landmark validation or registered patient image.';
  const citations=[...inferiorEpigastricReferences];
  if(tab==='anatomy')return {readiness:'draft',title:`${s.name} · Anatomy · draft`,
    body:artery?'The inferior epigastric artery branches from the external iliac artery and ascends into the anterior abdominal wall. It is distinct from the superficial epigastric artery, which arises from the femoral artery.'
      :'The inferior epigastric vein provides a deep abdominal-wall drainage route towards the external iliac vein. Compare the supplied vein and artery on the same anatomical side.',
    bullets:['Open Study → Abdominal wall: epigastric vessels for the source-bound vascular context.',
      'Each selection retains one complete source definition. This does not establish complete branches, perforators, accompanying venous channels or exact junctions.'],note,citations};
  if(tab==='function')return {readiness:'draft',title:`${s.name} · ${artery?'Supply':'Drainage'} · draft`,
    body:artery?'It contributes to lower anterior abdominal-wall supply, including rectus abdominis, and communicates with the superior epigastric arterial system. The reference surfaces do not establish a patent anastomosis or a measured supply territory.'
      :'It carries venous return from the lower abdominal wall into the external iliac system. The static source does not depict flow, venous valves, patency or pressure.',
    bullets:['The version-3 abdominal-wall muscle specimen remains separate; it is not registered to these version-4 vessels.'],note,citations};
  if(tab==='clinical')return {readiness:'draft',title:`${s.name} · Inguinal orientation · draft`,
    body:'The inferior epigastric vessels are an anatomical reference for inguinal hernias: direct hernias lie medial to them, while indirect hernias enter the deep inguinal ring lateral to them.',
    bullets:['The ring, fascial defect and hernia sac are not modelled here. This relationship alone cannot diagnose or classify a patient finding.','No safe access corridor, flap design or procedural plan is provided by this surface model.'],note,citations};
  if(tab==='quiz')return {readiness:'draft',title:`${s.name} · Self-check · draft`,
    body:artery?'Name the usual arterial origin of this vessel.':'Name the usual receiving vein for this drainage route.',
    bullets:[artery?'Answer: the external iliac artery.':'Answer: the external iliac vein.','Check the named source on the same side; visible surface proximity does not establish a connected lumen.'],note,citations};
  return {readiness:'pending',title:`${s.name} · Review pending`,body:'Detailed pathology and imaging teaching awaits authoring and review.',bullets:[],note:'No CT, MRI, X-ray, ultrasound, acquired angiogram or patient registration is supplied.'};
}
