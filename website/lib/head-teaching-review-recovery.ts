'use client';

import type {HeadTeachingDraft,HeadTeachingDraftContext} from './head-teaching-review-contract';

// This map lives only as long as the current document. Never persist private drafts.
export type RecoverySnapshot={
  draft:HeadTeachingDraft; baseline:HeadTeachingDraft; baseVersion:number;
  dirty:boolean; uncertain:boolean; reloadRequired:boolean; writeInFlight:boolean;
};
type Entry={id:number;generation:number;context:string;identity:string;detached:boolean;snapshot:RecoverySnapshot};
const entries=new Map<number,Entry>();
const LIMIT=32;
let nextId=0;
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
export const exactRecoveryContext=(context:HeadTeachingDraftContext)=>JSON.stringify(context);
export function createRecoveryRecord(context:HeadTeachingDraftContext,identity:string,snapshot:RecoverySnapshot):{id:number;generation:number}|null{
  if(!identity||entries.size>=LIMIT)return null; // Never evict another unsaved draft.
  const id=++nextId;
  entries.set(id,{id,generation:1,context:exactRecoveryContext(context),identity,detached:false,snapshot:clone(snapshot)});
  return {id,generation:1};
}
export function updateRecoveryRecord(id:number,generation:number,snapshot:RecoverySnapshot):number|null{
  const entry=entries.get(id);
  if(!entry||entry.generation!==generation)return null;
  entry.generation++;
  entry.snapshot=clone(snapshot);
  return entry.generation;
}
export function detachRecoveryRecord(id:number,generation:number,writeInFlight:boolean):number|null{
  const entry=entries.get(id);
  if(!entry||entry.generation!==generation)return null;
  entry.generation++;
  entry.detached=true;
  if(writeInFlight){entry.snapshot.writeInFlight=true;entry.snapshot.uncertain=true;}
  return entry.generation;
}
export function reattachRecoveryRecord(id:number,generation:number):number|null{
  const entry=entries.get(id);
  if(!entry||entry.generation!==generation)return null;
  entry.generation++;
  entry.detached=false;
  return entry.generation;
}
export function claimRecoveryRecord(context:HeadTeachingDraftContext,identity:string):{id:number;generation:number;snapshot:RecoverySnapshot}|null{
  if(!identity)return null;
  const source=exactRecoveryContext(context);
  const entry=[...entries.values()].reverse().find(item=>item.detached&&item.context===source&&item.identity===identity);
  if(!entry)return null;
  entry.generation++;
  entry.detached=false;
  return {id:entry.id,generation:entry.generation,snapshot:clone(entry.snapshot)};
}
export function clearRecoveryRecord(id:number,generation:number):boolean{
  const entry=entries.get(id);
  if(!entry||entry.generation!==generation)return false;
  entries.delete(id);
  return true;
}
export function recoveryCapacityRemaining():boolean{return entries.size<LIMIT;}
