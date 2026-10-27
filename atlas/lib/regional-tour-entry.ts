import type {BodyCatalog} from '../app/body-types';
import {regionalTours,regionalTourStructures,regionalTourFrame,type RegionalTour} from './regional-tours';

/** Fresh-document selection only. This is not a playback or runtime message command. */
export type RegionalTourEntry =
  | {status:'none'}
  | {status:'invalid'}
  | {status:'requested';id:string;revision:string;sourceRevision:string;stepIndex?:number};
export const noRegionalTourEntry:RegionalTourEntry={status:'none'};
type Params=Record<string,string|string[]|undefined>;
const keys=['regionalTour','tourRevision','tourSource','regionalStep'] as const;
const token=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,139}$/;
const source=/^[a-f0-9]{40}$/;
const stepNumber=(value:unknown):number|null=>typeof value==='string'&&/^[1-9][0-9]{0,2}$/.test(value)&&Number(value)<=200?Number(value):null;

export function parseRegionalTourEntry(params:Params):RegionalTourEntry {
  if(!params||typeof params!=='object'||Array.isArray(params))return {status:'invalid'};
  if(!keys.some(key=>key in params))return noRegionalTourEntry;
  if(keys.some(key=>key in params&&!Object.hasOwn(params,key)))return {status:'invalid'};
  const [id,revision,sourceRevision,step]=keys.map(key=>Object.hasOwn(params,key)?params[key]:undefined);
  const parsedStep=stepNumber(step);
  if(typeof id!=='string'||!token.test(id)||typeof revision!=='string'||!token.test(revision)||
    typeof sourceRevision!=='string'||!source.test(sourceRevision)||
    (Object.hasOwn(params,'regionalStep')&&parsedStep===null))return {status:'invalid'};
  return Object.hasOwn(params,'regionalStep')
    ? {status:'requested',id,revision,sourceRevision,stepIndex:parsedStep!-1}
    : {status:'requested',id,revision,sourceRevision};
}

/** Transport only admitted bounded public fields, never unrelated URLs or identifiers. */
export function regionalTourEntrySuffix(params:Params):string|null {
  const entry=parseRegionalTourEntry(params);
  if(entry.status==='invalid')return null;
  if(entry.status==='none')return '';
  const safe=new URLSearchParams({regionalTour:entry.id,tourRevision:entry.revision,tourSource:entry.sourceRevision});
  if(entry.stepIndex!==undefined)safe.set('regionalStep',String(entry.stepIndex+1));
  return '&'+safe.toString();
}

type Resolution={status:'none'}|{status:'rejected';reason:'invalid'|'source-changed'|'busy'|'unavailable'}|{status:'ready';tour:RegionalTour;stepIndex?:number};
export function resolveRegionalTourEntry(catalog:BodyCatalog,region:string,currentSourceRevision:string,
  entry:RegionalTourEntry,busy=false):Resolution {
  if(entry?.status==='none')return {status:'none'};
  if(entry?.status!=='requested'||!['id,revision,sourceRevision,status','id,revision,sourceRevision,status,stepIndex'].includes(Object.keys(entry).sort().join(','))||
    typeof entry.id!=='string'||!token.test(entry.id)||typeof entry.revision!=='string'||!token.test(entry.revision)||
    typeof entry.sourceRevision!=='string'||!source.test(entry.sourceRevision)||
    ('stepIndex'in entry&&(typeof entry.stepIndex!=='number'||!Number.isInteger(entry.stepIndex)||entry.stepIndex<0||entry.stepIndex>=200)))return {status:'rejected',reason:'invalid'};
  if(busy)return {status:'rejected',reason:'busy'};
  if(typeof currentSourceRevision!=='string'||!source.test(currentSourceRevision)||currentSourceRevision!==entry.sourceRevision)
    return {status:'rejected',reason:'source-changed'};
  try {
    const candidates=regionalTours.filter(tour=>tour.id===entry.id&&tour.revision===entry.revision);
    if(candidates.length!==1)throw Error('Tour unavailable');
    const tour=candidates[0];
    if(tour.status!=='draft'||!tour.steps.length||(region!=='whole-body'&&
      (tour.region!==region||!catalog.regions.some(item=>item.id===region))))throw Error('Region unavailable');
    if('stepIndex'in entry&&entry.stepIndex!>=tour.steps.length)throw Error('Step unavailable');
    regionalTourStructures(catalog,tour);
    regionalTourFrame(catalog,tour);
    tour.steps.forEach((_,index)=>regionalTourFrame(catalog,tour,index));
    return 'stepIndex'in entry?{status:'ready',tour,stepIndex:entry.stepIndex}:{status:'ready',tour};
  } catch {return {status:'rejected',reason:'unavailable'};}
}
