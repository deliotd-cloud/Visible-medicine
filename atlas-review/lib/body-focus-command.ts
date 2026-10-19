import type {BodySelection,BodyRegion} from './body-selection-channel';

/** Semantic root focus only; the receiver resolves catalog identity and visibility. */
export const BODY_FOCUS_PROTOCOL='vm-body-semantic-focus';

const exactKeys=(value:object,keys:readonly string[])=>
  Object.getOwnPropertySymbols(value).length===0&&
  Object.getOwnPropertyNames(value).sort().join('|')===[...keys].sort().join('|');
const record=(value:unknown):value is Record<string,unknown>=>
  !!value&&typeof value==='object'&&!Array.isArray(value);
const sourceHash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const rootId=(value:unknown):value is string=>
  typeof value==='string'&&value.length<=240&&
  /^vm:anatomy:body:(?:leg|thigh):(left|right|midline|unpaired):[a-zA-Z0-9_-]+:[a-zA-Z0-9:_-]+$/.test(value);

/** Exact root identity, with no nested, specimen, coordinate, URL or access fields. */
export function validBodySelection(value:unknown):value is BodySelection{
  if(!record(value)||!exactKeys(value,['kind','id','source','laterality']))return false;
  return value.kind==='root'&&rootId(value.id)&&sourceHash(value.source)&&
    value.laterality===value.id.split(':')[4];
}

/** A valid envelope is still subject to the caller's current scope and visibility gate. */
export function parseBodyFocusCommand(value:unknown,revision:string,region:BodyRegion,session:string,afterCommand:number):
  {command:number;target:BodySelection}|null{
  if(!/^[a-f0-9]{40}$/.test(revision)||!['leg','thigh'].includes(region)||
    !/^[a-zA-Z0-9_-]{16,80}$/.test(session)||
    !Number.isSafeInteger(afterCommand)||afterCommand<0||!record(value)||
    !exactKeys(value,['type','version','revision','region','session','command','target'])||
    value.type!==BODY_FOCUS_PROTOCOL||value.version!==1||value.revision!==revision||
    value.region!==region||value.session!==session||!Number.isSafeInteger(value.command)||
    (value.command as number)<=afterCommand||!validBodySelection(value.target))return null;
  const target=value.target;
  return {command:value.command as number,target:{kind:'root',id:target.id,source:target.source,laterality:target.laterality}};
}
