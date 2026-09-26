import pins from '../content/hand-intrinsic-study-pins.json' with {type:'json'};
import {handIntrinsicStudies} from '../content/hand-intrinsic-studies.ts';
import {sourceCanonical} from './body-source-additions.ts';
import type {BodyCatalog} from '../app/body-types';

/** Exact displayed source identities only; no inferred submuscles or attachments. */
export function handIntrinsicStudyReady(catalog:BodyCatalog|null,region:string,recipeId:string|null) {
  const study=handIntrinsicStudies.find(candidate=>candidate.id===recipeId);
  if(!study)return true;
  if(!catalog||region!=='hand'||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license
    ||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const ids=new Set([...study.targetFmaIds,...study.context.flatMap(rule=>rule.fmaIds??[])]);
  const records=pins.entries.filter(entry=>ids.has(entry.fmaId));
  if(records.length!==ids.size)return false;
  for(const pin of records){
    const found=catalog.structures.filter(structure=>structure.id===pin.id||structure.fmaId===pin.fmaId);
    if(found.length!==1||sourceCanonical(found[0])!==sourceCanonical(pin))return false;
  }
  const bundles=pins.bundles.filter(bundle=>records.some(entry=>entry.bundle===bundle.id));
  if(new Set(records.map(entry=>entry.bundle)).size!==bundles.length)return false;
  for(const pin of bundles){
    const found=catalog.bundles.filter(bundle=>bundle.id===pin.id||bundle.url.split('?')[0]===pin.url.split('?')[0]);
    if(found.length!==1||sourceCanonical(found[0])!==sourceCanonical(pin))return false;
  }
  return true;
}
