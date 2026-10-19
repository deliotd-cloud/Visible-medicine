import type {HeadSelection} from './head-selection-channel';

/** Semantic focus only; the receiver must still resolve exact catalog identity and scope. */
export const HEAD_FOCUS_PROTOCOL='vm-head-semantic-focus';
export type HeadFocusTarget=HeadSelection;

const ownKeys=(value:object,keys:readonly string[])=>
  Object.keys(value).sort().join('|')===[...keys].sort().join('|');
const hash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const headId=(value:unknown):value is string=>
  typeof value==='string'&&value.length<=240&&
  /^vm:anatomy:body:head-neck:(?:left|right|midline|unpaired):[a-zA-Z0-9_-]+:[a-zA-Z0-9:_-]+$/.test(value);

/** Parse a command envelope; no URL, coordinates, access or approval can enter it. */
export function parseHeadFocusCommand(value:unknown,revision:string,session:string,afterCommand:number):
  {command:number;target:HeadFocusTarget}|null{
  if(!/^[a-f0-9]{40}$/.test(revision)||!/^[a-zA-Z0-9_-]{16,80}$/.test(session)||
    !Number.isSafeInteger(afterCommand)||afterCommand<0||!value||typeof value!=='object'||Array.isArray(value))return null;
  const envelope=value as Record<string,unknown>;
  if(!ownKeys(envelope,['type','version','revision','session','command','target'])||
    envelope.type!==HEAD_FOCUS_PROTOCOL||envelope.version!==1||envelope.revision!==revision||
    envelope.session!==session||!Number.isSafeInteger(envelope.command)||
    (envelope.command as number)<=afterCommand)return null;
  const raw=envelope.target;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const target=raw as Record<string,unknown>;
  if(target.kind!=='root'&&target.kind!=='nested')return null;
  const fields=target.kind==='root'
    ?['kind','id','source','laterality']
    :['kind','id','source','laterality','parentId','parentSource','study'];
  if(!ownKeys(target,fields)||!headId(target.id)||!hash(target.source)||
    target.laterality!==(target.id as string).split(':')[4])return null;
  if(target.kind==='nested'&&(!headId(target.parentId)||!hash(target.parentSource)||
    !['brainstem','ventricles','cerebral'].includes(target.study as string)))return null;
  const identity={id:target.id,source:target.source,laterality:target.laterality as string};
  const parsed:HeadFocusTarget=target.kind==='root'
    ?{kind:'root',...identity}
    :{kind:'nested',...identity,parentId:target.parentId as string,
      parentSource:target.parentSource as string,study:target.study as string};
  return {command:envelope.command as number,target:parsed};
}
