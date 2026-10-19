import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy,type Modality} from './head-atlas-import.ts';
import {practiceEntries} from './head-atlas-practice.ts';
import {headStudySetEntries,type HeadStudySet,HEAD_STUDY_SET_LIMIT} from './head-study-set.ts';
import {headImageConcept,headImageConceptById,resolveHeadImageConcept} from './head-image-only-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';

export const HEAD_STUDY_PLAN_KEY='vm.head-study-plan.v1';
export type HeadStudyPlan={schema:1;headRevision:string;conceptIds:string[]};

const keys=['schema','headRevision','conceptIds'] as const;
const MAX_PLAN_LENGTH=8192;

/** Accept only a plain, exact data record and a plain array of known unique IDs. */
function validPlan(value:unknown):value is HeadStudyPlan{
  if(!headLinksCurrent()||!value||typeof value!=='object'||Array.isArray(value))return false;
  try{
    if(Object.getPrototypeOf(value)!==Object.prototype)return false;
    const own=Reflect.ownKeys(value);
    if(own.length!==keys.length||keys.some(key=>!own.includes(key)||
      !Object.hasOwn(Object.getOwnPropertyDescriptor(value,key)??{},'value')))return false;
    const plan=value as Record<string,unknown>;
    if(plan.schema!==1||plan.headRevision!==HEAD_MANIFEST_SHA256||!Array.isArray(plan.conceptIds))return false;
    const ids=plan.conceptIds;
    if(Object.getPrototypeOf(ids)!==Array.prototype||ids.length<1||ids.length>HEAD_STUDY_SET_LIMIT||
      Reflect.ownKeys(ids).length!==ids.length+1)return false;
    const seen=new Set<string>();
    for(let index=0;index<ids.length;index++){
      const descriptor=Object.getOwnPropertyDescriptor(ids,index);
      if(!descriptor||!Object.hasOwn(descriptor,'value')||typeof descriptor.value!=='string'||
        !headImageConceptById(descriptor.value)||seen.has(descriptor.value))return false;
      seen.add(descriptor.value);
    }
    return true;
  }catch{return false;}
}

function eligibleConceptEntry(study:LoadedStudy,conceptId:string,modality:Modality,eligible:Set<HeadEntry>):HeadEntry|null{
  const entries=study.definition.entries;
  const resolved=resolveHeadImageConcept(entries,conceptId,modality);
  const matched=entries.find(entry=>entry===resolved);
  if(!matched||!eligible.has(matched)||headImageConcept(matched,modality)?.conceptId!==conceptId||
    entries.filter(entry=>headImageConcept(entry,modality)?.conceptId===conceptId).length!==1)return null;
  return matched;
}

/** Capture only canonical concepts from the exact current in-memory shortlist. */
export function createHeadStudyPlan(state:HeadStudySet,study:LoadedStudy|null,revision:string,modality:Modality):HeadStudyPlan|null{
  if(!study||revision!==HEAD_MANIFEST_SHA256||!headLinksCurrent()||
    (modality!=='CT'&&modality!=='MRI'))return null;
  const selected=headStudySetEntries(state,study,revision);
  if(!selected.length)return null;
  const eligible=new Set(practiceEntries(study.definition.entries));
  const conceptIds:string[]=[],seen=new Set<string>();
  for(const entry of selected){
    const concept=headImageConcept(entry,modality);
    if(!concept||seen.has(concept.conceptId)||
      eligibleConceptEntry(study,concept.conceptId,modality,eligible)!==entry)continue;
    conceptIds.push(concept.conceptId);seen.add(concept.conceptId);
  }
  if(!conceptIds.length)return null;
  const plan:HeadStudyPlan={schema:1,headRevision:revision,conceptIds};
  return validPlan(plan)?plan:null;
}

/** Parse an explicit browser-only value; this module never writes storage. */
export function parseHeadStudyPlan(raw:string|null):HeadStudyPlan|null{
  if(typeof raw!=='string'||raw.length<1||raw.length>MAX_PLAN_LENGTH)return null;
  try{
    const value:unknown=JSON.parse(raw);
    return validPlan(value)?{schema:1,headRevision:value.headRevision,conceptIds:[...value.conceptIds]}:null;
  }catch{return null;}
}

/** Resolve available masks in saved order, within the current loaded modality. */
export function resolveHeadStudyPlan(plan:HeadStudyPlan|null,study:LoadedStudy|null,revision:string,modality:Modality):HeadEntry[]{
  if(!study||revision!==HEAD_MANIFEST_SHA256||!validPlan(plan)||
    (modality!=='CT'&&modality!=='MRI'))return [];
  const eligible=new Set(practiceEntries(study.definition.entries));
  return plan.conceptIds.flatMap(id=>{
    const entry=eligibleConceptEntry(study,id,modality,eligible);
    return entry?[entry]:[];
  });
}
