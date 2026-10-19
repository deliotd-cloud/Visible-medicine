import {atlasStudySuffix} from './atlas-study-transport.ts';
import {headLearningLinks,parseHeadLearningIntent,type HeadLearningPosition} from './head-atlas-learning.ts';
import type {LiveHeadSelection} from './head-live-selection.ts';

export const HEAD_FOCUS_PROTOCOL='vm-head-semantic-focus';

type RootTarget={kind:'root';id:string;source:string;laterality:string};
type NestedTarget={kind:'nested';id:string;source:string;laterality:string;parentId:string;parentSource:string;study:string};
export type HeadGuidedDestination={position:HeadLearningPosition;href:string;src:string;target:RootTarget|NestedTarget};

/** Only exact authored tour URLs can become focus commands. */
export function headGuidedDestination(href:string):HeadGuidedDestination|null{
  const path='/atlas/head-neck-3d?';
  if(typeof href!=='string'||!href.startsWith(path)||href.includes('#'))return null;
  const params=new URLSearchParams(href.slice(path.length));
  const position=parseHeadLearningIntent(params,'atlas');
  if(!position||headLearningLinks(position)?.atlasHref!==href)return null;
  const suffix=atlasStudySuffix(Object.fromEntries(params));
  if(suffix===null)return null;
  const nested=params.get('study')==='2';
  const id=params.get(nested?'part':'structure');
  const source=params.get(nested?'partSource':'source');
  if(!id||!source)return null;
  const identity={id,source,laterality:id.split(':')[4]};
  const target:RootTarget|NestedTarget=nested
    ?{kind:'nested',...identity,parentId:params.get('structure')!,parentSource:params.get('source')!,study:params.get('detail')!}
    :{kind:'root',...identity};
  return {position,href,src:'/atlas-runtime/head-neck/index.html?region=head-neck'+suffix,target};
}

const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).sort().join('|')===keys.sort().join('|');

/** A result acknowledges handling only; the selection snapshot confirms focus. */
export function headFocusResult(value:unknown,revision:string,session:string,command:number):'accepted'|'refused'|null{
  if(!/^[a-f0-9]{40}$/.test(revision)||!/^[a-zA-Z0-9_-]{16,80}$/.test(session)||
    !Number.isSafeInteger(command)||command<=0||!object(value)||
    !exact(value,['type','version','revision','session','command','status'])||
    value.type!==HEAD_FOCUS_PROTOCOL+'-result'||value.version!==1||value.revision!==revision||
    value.session!==session||value.command!==command)return null;
  return value.status==='accepted'||value.status==='refused'?value.status:null;
}

export function headGuidedMatches(snapshot:LiveHeadSelection,destination:HeadGuidedDestination):boolean{
  return snapshot.status==='selected'&&snapshot.concept?.conceptId===destination.position.conceptId;
}
