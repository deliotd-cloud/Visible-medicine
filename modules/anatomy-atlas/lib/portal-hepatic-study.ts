import pins from '../content/portal-hepatic-study-pins.json' with {type:'json'};
import {portalHepaticStudy} from '../content/portal-hepatic-study';
import {sourceCanonical} from './body-source-additions';
import type {BodyCatalog} from '../app/body-types';

/** Existing labelled surfaces only; no junction, flow or clinical approval. */
export function portalHepaticStudyReady(catalog:BodyCatalog|null,region:string,recipeId:string|null) {
  if(recipeId!==portalHepaticStudy.id)return true;
  if(!catalog||region!=='abdomen'||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license
    ||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
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
