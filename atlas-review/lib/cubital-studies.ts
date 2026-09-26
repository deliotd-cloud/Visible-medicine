import pins from '../content/cubital-study-pins.json' with {type:'json'};
import {cubitalStudies} from '../content/cubital-studies.ts';
import {sourceCanonical} from './body-source-additions.ts';
import type {BodyCatalog,BodyStructure} from '../app/body-types';

export function cubitalStudyReady(catalog:BodyCatalog|null,region:string,recipeId:string|null) {
  const study=cubitalStudies.find(s=>s.id===recipeId);
  if(!study)return true;
  if(!catalog || region!=='whole-body' || catalog.sourceVersion!==pins.sourceVersion ||
    catalog.license!==pins.license || sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  for(const pin of pins.entries){
    const found=catalog.structures.filter(s=>s.id===pin.id||s.fmaId===pin.fmaId);
    if(found.length!==1||sourceCanonical(found[0])!==sourceCanonical(pin))return false;
  }
  for(const pin of pins.bundles){
    const found=catalog.bundles.filter(b=>b.id===pin.id||b.url.split('?')[0]===pin.url.split('?')[0]);
    if(found.length!==1||sourceCanonical(found[0])!==sourceCanonical(pin))return false;
  }
  return true;
}

/** Viewing bounds only. Removal/extraction never clips or edits source meshes. */
export function cubitalStudyBounds({catalog,region,recipeId,structures,visibleIds,enabled}:{
  catalog:BodyCatalog|null;region:string;recipeId:string|null;structures:BodyStructure[];visibleIds:string[];enabled:boolean;
}) {
  const study=cubitalStudies.find(s=>s.id===recipeId);
  if(!enabled||!study||!visibleIds.length||!cubitalStudyReady(catalog,region,recipeId))return null;
  const allowed=new Set([...study.targetFmaIds,...study.context.flatMap(r=>r.fmaIds??[])]);
  const visible=structures.filter(s=>visibleIds.includes(s.id));
  if(new Set(visibleIds).size!==visibleIds.length||visible.length!==visibleIds.length||visible.some(s=>
    !allowed.has(s.fmaId)||!pins.entries.some(p=>p.id===s.id&&sourceCanonical(p)===sourceCanonical(s))))return null;
  const sides=[...new Set(visible.map(s=>s.laterality))];
  if(sides.some(s=>s!=='left'&&s!=='right'))return null;
  const boxes=sides.map(s=>pins.cameraBounds[s as 'left'|'right']);
  return {min:[0,1,2].map(i=>Math.min(...boxes.map(b=>b.min[i]))),max:[0,1,2].map(i=>Math.max(...boxes.map(b=>b.max[i])))};
}
