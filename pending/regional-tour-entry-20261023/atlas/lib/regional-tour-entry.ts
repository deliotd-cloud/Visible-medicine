import type {BodyCatalog} from '../app/body-types';
import {regionalTours,regionalTourStructures,regionalTourFrame,type RegionalTour} from './regional-tours';

/** Fresh-document selection only. This is not a playback or runtime message command. */
export type RegionalTourEntry =
  | {status:'none'}
  | {status:'invalid'}
  | {status:'requested';id:string;revision:string;sourceRevision:string};
export const noRegionalTourEntry:RegionalTourEntry={status:'none'};
type Params=Record<string,string|string[]|undefined>;
const keys=['regionalTour','tourRevision','tourSource'] as const;
const token=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,139}$/;
const source=/^[a-f0-9]{40}$/;

export function parseRegionalTourEntry(params:Params):RegionalTourEntry {
  if(!params||typeof params!=='object'||Array.isArray(params))return {status:'invalid'};
  if(!keys.some(key=>Object.hasOwn(params,key)))return noRegionalTourEntry;
  const [id,revision,sourceRevision]=keys.map(key=>Object.hasOwn(params,key)?params[key]:undefined);
  if(typeof id!=='string'||!token.test(id)||typeof revision!=='string'||!token.test(revision)||
    typeof sourceRevision!=='string'||!source.test(sourceRevision))return {status:'invalid'};
  return {status:'requested',id,revision,sourceRevision};
}

/** Transport only the three bounded public fields, never unrelated URLs or identifiers. */
export function regionalTourEntrySuffix(params:Params):string|null {
  const entry=parseRegionalTourEntry(params);
  if(entry.status==='invalid')return null;
  if(entry.status==='none')return '';
  return '&'+new URLSearchParams({regionalTour:entry.id,tourRevision:entry.revision,tourSource:entry.sourceRevision}).toString();
}

type Resolution={status:'none'}|{status:'rejected';reason:'invalid'|'source-changed'|'busy'|'unavailable'}|{status:'ready';tour:RegionalTour};
export function resolveRegionalTourEntry(catalog:BodyCatalog,region:string,currentSourceRevision:string,
  entry:RegionalTourEntry,busy=false):Resolution {
  if(entry?.status==='none')return {status:'none'};
  if(entry?.status!=='requested'||Object.keys(entry).sort().join(',')!=='id,revision,sourceRevision,status'||
    typeof entry.id!=='string'||!token.test(entry.id)||typeof entry.revision!=='string'||!token.test(entry.revision)||
    typeof entry.sourceRevision!=='string'||!source.test(entry.sourceRevision))return {status:'rejected',reason:'invalid'};
  if(busy)return {status:'rejected',reason:'busy'};
  if(typeof currentSourceRevision!=='string'||!source.test(currentSourceRevision)||currentSourceRevision!==entry.sourceRevision)
    return {status:'rejected',reason:'source-changed'};
  try {
    const candidates=regionalTours.filter(tour=>tour.id===entry.id&&tour.revision===entry.revision);
    if(candidates.length!==1)throw Error('Tour unavailable');
    const tour=candidates[0];
    if(tour.status!=='draft'||!tour.steps.length||(region!=='whole-body'&&
      (tour.region!==region||!catalog.regions.some(item=>item.id===region))))throw Error('Region unavailable');
    regionalTourStructures(catalog,tour);
    regionalTourFrame(catalog,tour);
    tour.steps.forEach((_,index)=>regionalTourFrame(catalog,tour,index));
    return {status:'ready',tour};
  } catch {return {status:'rejected',reason:'unavailable'};}
}
