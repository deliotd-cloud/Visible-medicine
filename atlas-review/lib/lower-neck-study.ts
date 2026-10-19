import pins from '../content/lower-neck-study-pins.json' with {type:'json'};
import {lowerNeckStudy} from '../content/lower-neck-study.ts';
import {sourceCanonical} from './body-source-additions.ts';
import type {BodyCatalog} from '../app/body-types';

/** Exact displayed source identities only; no inferred sheath, branches or missing anatomy. */
export function lowerNeckStudyReady(catalog:BodyCatalog|null,region:string,recipeId:string|null) {
  if(recipeId!==lowerNeckStudy.id)return true;
  if(!catalog||!lowerNeckStudy.regions.includes(region)
    ||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license
    ||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const ids=new Set(lowerNeckSourceIds());
  if(pins.entries.length!==ids.size||new Set(pins.entries.map(entry=>entry.fmaId)).size!==ids.size
    ||!pins.entries.every(entry=>ids.has(entry.fmaId)))return false;
  for(const pin of pins.entries){
    const found=catalog.structures.filter(structure=>structure.id===pin.id||structure.fmaId===pin.fmaId);
    if(found.length!==1||sourceCanonical(found[0])!==sourceCanonical(pin))return false;
  }
  const bundleIds=new Set(pins.entries.map(entry=>entry.bundle));
  if(pins.bundles.length!==bundleIds.size||new Set(pins.bundles.map(bundle=>bundle.id)).size!==bundleIds.size
    ||!pins.bundles.every(bundle=>bundleIds.has(bundle.id)))return false;
  for(const pin of pins.bundles){
    const found=catalog.bundles.filter(bundle=>bundle.id===pin.id||bundle.url.split('?')[0]===pin.url.split('?')[0]);
    if(found.length!==1||sourceCanonical(found[0])!==sourceCanonical(pin))return false;
  }
  return true;
}

function lowerNeckSourceIds(){
  return [...lowerNeckStudy.targetFmaIds,...lowerNeckStudy.context.flatMap(rule=>rule.fmaIds??[])];
}
