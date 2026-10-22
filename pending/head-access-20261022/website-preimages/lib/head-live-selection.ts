import {headAtlasConceptOptions,headConceptById,type HeadConceptLink} from './head-atlas-links.ts';
export const HEAD_SELECTION_PROTOCOL='vm-head-semantic-selection';
type Selection={kind:'root'|'nested';id:string;source:string;laterality:string;parentId?:string;parentSource?:string;study?:string};
export type LiveHeadSelection={sequence:number;status:'selected'|'empty'|'blocked';reason?:'practice'|'guided'|'unavailable';concept:HeadConceptLink|null};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:object,keys:string[])=>Object.keys(v).sort().join('|')===keys.sort().join('|');
const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
// A regional view includes neighbouring anatomy (for example cervical spine).
// Accept its valid identity so an unmapped selection clears an older head focus.
// The exact authored registry below is still the only source of comparison links.
const id=(v:unknown)=>typeof v==='string'&&/^vm:anatomy:body:[a-z][a-z-]{0,39}:[a-z0-9:-]{1,180}$/.test(v);
/** Only reverse an already authored exact-source comparison; never match by name. */
export function conceptForHeadSelection(s:Selection):HeadConceptLink|null{
  for(const {conceptId}of headAtlasConceptOptions()){
    const concept=headConceptById(conceptId)!;
    const q=new URL(concept.atlasHref,'https://atlas.invalid').searchParams;
    const nested=q.get('study')==='2';
    if(nested!==(s.kind==='nested'))continue;
    if(q.get(nested?'part':'structure')!==s.id||q.get(nested?'partSource':'source')!==s.source)continue;
    if(s.id.split(':')[4]!==s.laterality)continue;
    if(nested&&(q.get('structure')!==s.parentId||q.get('source')!==s.parentSource||q.get('detail')!==s.study))continue;
    return concept;
  }
  return null;
}
export function parseHeadSelection(value:unknown,revision:string,session:string,sequence:number):LiveHeadSelection|null{
  if(!object(value)||value.type!==HEAD_SELECTION_PROTOCOL||value.version!==1||value.revision!==revision||
    !/^[a-f0-9]{40}$/.test(revision)||value.session!==session||!Number.isSafeInteger(value.sequence)||
    (value.sequence as number)<=sequence)return null;
  const keys=['type','version','revision','session','sequence','status'];
  const result={sequence:value.sequence as number,concept:null};
  if(value.status==='empty'&&exact(value,keys))return {...result,status:'empty'};
  if(value.status==='blocked'&&exact(value,[...keys,'reason'])&&['practice','guided','unavailable'].includes(value.reason as string))
    return {...result,status:'blocked',reason:value.reason as 'practice'|'guided'|'unavailable'};
  if(value.status!=='selected'||!exact(value,[...keys,'selection'])||!object(value.selection))return null;
  const s=value.selection,base=['kind','id','source','laterality'];
  if(!id(s.id)||!hash(s.source)||!['left','right','midline','unpaired','unspecified'].includes(s.laterality as string))return null;
  if(s.kind==='root'){
    if(!exact(s,base))return null;
  }else if(s.kind==='nested'){
    if(!exact(s,[...base,'parentId','parentSource','study'])||!id(s.parentId)||!hash(s.parentSource)||
      typeof s.study!=='string'||!/^[a-z-]{1,40}$/.test(s.study))return null;
  }else return null;
  return {...result,status:'selected',concept:conceptForHeadSelection(s as Selection)};
}
