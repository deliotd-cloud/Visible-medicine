import data from '../public/models/bodyparts3d/pelvic-veins/catalog.json' with { type:'json' };
import { applyBodySourceAddition, sourceCanonical, type BodySourceAddition } from './body-source-additions';
import { pelvicVeinStudy, pelvicVeinReferences } from '../content/pelvic-vein-study';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
import { pelvicVeinTeaching, pelvicVeinTeachingGroups, pelvicVeinTeachingReferences, pelvicVeinSelectionNotes, type PelvicVeinTeachingGroup, type PelvicVeinTeachingTopic } from '../content/pelvic-vein-teaching';
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
  const group = (Object.keys(pelvicVeinTeachingGroups) as PelvicVeinTeachingGroup[]).find(key => (pelvicVeinTeachingGroups[key] as readonly string[]).includes(s.fmaId));
  const extended = group && Object.hasOwn(pelvicVeinTeaching[group], tab) ? pelvicVeinTeaching[group][tab as PelvicVeinTeachingTopic] : undefined;
  if (extended && group) return {
    readiness:'draft', title:`${s.name} · ${tab === 'ct' || tab === 'mri' ? tab.toUpperCase() : tab[0].toUpperCase()+tab.slice(1)} · draft`,
    body:extended.body,
    bullets:[pelvicVeinSelectionNotes[group], 'Return separation to zero before comparing source relationships. Source proximity, colour and calibre do not establish connected lumens, reflux or patency.'],
    note:'Source-bound teaching draft for radiologist review. No patient images, scan alignment, diagnostic threshold, procedural clearance or paid-lecture access is supplied. Modality evidence does not validate every small tributary; absent topics remain pending.',
    citations:[...new Set(extended.references.map(key=>pelvicVeinTeachingReferences[key]))],
  };
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
  if(tab==='quiz' && group) {
    const quiz = group==='iliolumbar' ? {
      body:'Which description best fits the outlets of the iliolumbar venous system?',
      answer:'Separate or shared trunks may reach different iliac receiving veins.',
      choices:['Separate or shared trunks may reach different iliac receiving veins.','All tributaries join one fixed trunk ending in the common iliac vein.','All tributaries end separately in the external iliac vein.','All tributaries join one fixed trunk ending in the internal iliac vein.'],
      explanation:'Separate or shared trunks may reach different iliac receiving veins. Dissection and venographic evidence describe variable arrangements; this source surface does not establish the outlet in an individual.',
      refs:['lumbar'] as const,
    } : group==='inferiorGluteal'||group==='superiorGluteal' ? {
      body:'Where does named gluteal venous return generally drain?',
      answer:'Toward the internal iliac venous system.',
      choices:['Toward the internal iliac venous system.','Directly into the external iliac vein.','Directly into the common femoral vein.','Directly into the common iliac vein without an internal iliac route.'],
      explanation:'Toward the internal iliac venous system is the general drainage route. The selected source segment does not map a complete territory or prove continuity of every branch.',
      refs:['pelvicBleeding'] as const,
    } : group==='obturator' ? {
      body:'What venous communication can occur near the superior pubic ramus?',
      answer:'An obturator-to-external-iliac-system communication.',
      choices:['An obturator-to-external-iliac-system communication.','A fixed obturator-to-common-iliac-vein channel.','A universal obturator-to-femoral-vein channel.','An obligatory obturator-to-lateral-sacral-vein channel.'],
      explanation:'An obturator-to-external-iliac-system communication is described as a venous corona mortis. This variable route is not separately demonstrated by the selected reference surface.',
      refs:['corona'] as const,
    } : group==='pudendal' ? {
      body:'Which venous system normally receives this named perineal drainage route?',
      answer:'The internal iliac venous system.',
      choices:['The internal iliac venous system.','The external iliac venous system.','The common femoral venous system.','The inferior mesenteric venous system.'],
      explanation:'The internal pudendal vein drains toward the internal iliac venous system. This right source segment does not reconstruct its complete course or establish flow in a patient.',
      refs:['perineum'] as const,
    } : {
      body:'How should the selected lateral sacral vein be understood within sacral venous anatomy?',
      answer:'As part of a communicating sacral venous plexus.',
      choices:['As part of a communicating sacral venous plexus.','As an isolated channel without transverse sacral connections.','As one uninterrupted midline channel replacing the paired lateral sacral veins.','As a direct continuation of the obturator venous corona mortis.'],
      explanation:'As part of a communicating sacral venous plexus: a study of 18 female cadavers described lateral sacral and transverse channels. This general anatomical teaching does not validate a complete plexus, a left counterpart or patient-specific pathways in this male reference.',
      refs:['presacral'] as const,
    };
    const keyPositions:Record<PelvicVeinTeachingGroup, readonly number[]> = {
      iliolumbar:[0,3], inferiorGluteal:[1,2], superiorGluteal:[3,0],
      obturator:[2,1], pudendal:[3], lateralSacral:[0],
    };
    const groupIds:readonly string[]=pelvicVeinTeachingGroups[group];
    const position=keyPositions[group][groupIds.indexOf(s.fmaId)];
    const distractors=quiz.choices.filter(choice=>choice!==quiz.answer);
    const choices=[...distractors];
    choices.splice(position,0,quiz.answer);
    return {readiness:'draft',title:`${s.name} · Self-check · draft`,
      body:quiz.body,bullets:choices,correctAnswer:quiz.answer,explanation:quiz.explanation,
      note,citations:quiz.refs.map(key=>pelvicVeinTeachingReferences[key])};
  }
  return {readiness:'pending',title:`${s.name} · Review pending`,body:'Detailed clinical, pathology and imaging teaching awaits authoring and review.',bullets:[],note:'No acquired CT, MRI, X-ray, ultrasound or patient registration is supplied.'};
}
