import {isRegionalMriInlineInspection,regionalMriInlineBodyFamilyKey,type RegionalMriInlineInspection} from './regional-mri-inline-inspection.ts';

export type PublicBodyTarget={kind:'root';id:string;source:string;laterality:'left'|'right'};
export type RegionalMriBodySelection=Readonly<{atlasRevision:string;region:'leg'|'thigh';sequence:number;target:Readonly<PublicBodyTarget>}>;
export type BodyFocusState='waiting'|'requesting'|'focusing'|'confirmed'|'blocked'|'failed';
const currentSelections=new WeakMap<object,()=>boolean>();
export function isCurrentRegionalMriBodySelection(value:unknown):value is RegionalMriBodySelection{
 return !!value&&typeof value==='object'&&currentSelections.get(value)?.()===true;
}
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:object,expected:readonly string[])=>Object.getOwnPropertySymbols(value).length===0&&
 Object.getOwnPropertyNames(value).sort().join('|')===[...expected].sort().join('|');
const hash=/^[a-f0-9]{64}$/,commit=/^[a-f0-9]{40}$/;
const region=(value:unknown):value is 'leg'|'thigh'=>value==='leg'||value==='thigh';
const side=(value:unknown):value is 'left'|'right'=>value==='left'||value==='right';
const safeSeq=(value:unknown)=>Number.isSafeInteger(value)&&(value as number)>0;
const bodyId=/^vm:anatomy:body:(leg|thigh):(left|right):[a-zA-Z0-9_-]+:[a-zA-Z0-9:_-]+$/;
const validTarget=(value:unknown,scope:'leg'|'thigh'):value is PublicBodyTarget=>{
 if(!object(value)||!exact(value,['kind','id','source','laterality'])||value.kind!=='root'||
  typeof value.id!=='string'||value.id.length>240||typeof value.source!=='string'||!hash.test(value.source)||!side(value.laterality))return false;
 const match=bodyId.exec(value.id);return !!match&&region(scope)&&match[2]===value.laterality;
};
const sameTarget=(a:PublicBodyTarget,b:PublicBodyTarget)=>a.kind===b.kind&&a.id===b.id&&a.source===b.source&&a.laterality===b.laterality;
/** Only an owned, exact public root link can request focus. */
export function publicBodyTarget(inspection:RegionalMriInlineInspection):PublicBodyTarget|null{
 if(!isRegionalMriInlineInspection(inspection)||regionalMriInlineBodyFamilyKey(inspection)===null)return null;
 const t=inspection.target;
 if(t.kind!=='body'||!side(t.side)||!commit.test(inspection.atlasRevision)||!hash.test(t.sourceHash)||t.specimenRevision!==null)return null;
 const url=new URL(t.href,'https://visible-medicine.invalid'),q=url.searchParams,keys=[...q.keys()],scope=q.get('region');
 if(url.origin!=='https://visible-medicine.invalid'||url.pathname!=='/atlas/3d'||url.hash||!region(scope)||
  keys.length!==6||new Set(keys).size!==6||!['region','study','structure','side','source','atlasRevision'].every(k=>keys.includes(k))||
  q.get('study')!=='1'||q.get('structure')!==t.id||q.get('side')!==t.side||q.get('source')!==t.sourceHash||
  q.get('atlasRevision')!==inspection.atlasRevision||
  new URL(inspection.src,'https://visible-medicine.invalid').searchParams.get('region')!==scope)return null;
 const target={kind:'root' as const,id:t.id,source:t.sourceHash,laterality:t.side};
 return validTarget(target,scope)?target:null;
}
const randomSession=()=>{const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');};
/** Host checks same origin and exact iframe WindowProxy before calling receive. */
export function createRegionalMriBodyFocus(send:(message:object)=>void,changed:(state:BodyFocusState)=>void,
 sessionFactory:()=>string=randomSession,selectionChanged:(selection:RegionalMriBodySelection|null)=>void=()=>{}){
 let revision='',scope:'leg'|'thigh'|null=null,target:PublicBodyTarget|null=null,session='',sequence=0,baseline=0,command=0;
 let state:BodyFocusState='waiting',accepted=false,resultSeen=false,waitingSnapshot=false,reportsReady=false,closed=false;
 let selection:RegionalMriBodySelection|null=null;
 const clearSelection=()=>{selection=null;selectionChanged(null);};
 const update=(next:BodyFocusState)=>{state=next;changed(next);};
 const retire=()=>{session='';sequence=0;baseline=0;command=0;accepted=false;resultSeen=false;waitingSnapshot=false;reportsReady=false;clearSelection();update('waiting');};
 const request=()=>{
  if(closed||!target||!scope)return;
  const candidate=sessionFactory();
  if(typeof candidate!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(candidate)){update('failed');return;}
  session=candidate;sequence=0;baseline=0;command=0;accepted=false;resultSeen=false;waitingSnapshot=true;reportsReady=false;
  send({type:'vm-body-semantic-selection-request',version:1,revision,region:scope,session});update('requesting');
 };
 const report=(reported:PublicBodyTarget)=>{
  const frozenTarget=Object.freeze({...reported});
  const proof=Object.freeze({atlasRevision:revision,region:scope!,sequence,target:frozenTarget});
  selection=proof;currentSelections.set(proof,()=>!closed&&session!==''&&selection===proof);selectionChanged(proof);
 };
 return {
  get state(){return state;},
  get selection(){return isCurrentRegionalMriBodySelection(selection)?selection:null;},
  begin(inspection:RegionalMriInlineInspection,readyKnown=false){retire();target=publicBodyTarget(inspection);revision=inspection.atlasRevision;
   const href=target?new URL(inspection.target.href,'https://visible-medicine.invalid'):null;
   scope=href&&region(href.searchParams.get('region'))?href.searchParams.get('region') as 'leg'|'thigh':null;
   if(!target||!scope)update('failed');else if(readyKnown)request();},
  receive(data:unknown):boolean|'available'|'unavailable'|void{
   if(closed||!target||!scope||!object(data)||data.version!==1||data.revision!==revision||data.region!==scope)return;
   if(data.type==='vm-body-semantic-selection-ready'){
    if(!exact(data,['type','version','revision','region'])||state==='failed')return;
    retire();request();return true;
   }
   if(!session||data.session!==session)return;
   if(data.type==='vm-body-semantic-selection'){
    const status=data.status;
    if(!safeSeq(data.sequence)||(data.sequence as number)<=sequence||
     (status==='selected'?!exact(data,['type','version','revision','region','session','sequence','status','selection']):
      status==='blocked'?!exact(data,['type','version','revision','region','session','sequence','status','reason']):
      status==='empty'?!exact(data,['type','version','revision','region','session','sequence','status']):true))return;
    if(status==='selected'&&!validTarget(data.selection,scope)){
     if(selection){clearSelection();reportsReady=false;update('failed');}return;
    }
    if(status==='blocked'&&!['practice','guided','unavailable'].includes(String(data.reason)))return;
    sequence=data.sequence as number;
    if(status==='blocked'){accepted=false;waitingSnapshot=false;reportsReady=false;clearSelection();update('blocked');return data.reason==='unavailable'?'unavailable':'available';}
    if(waitingSnapshot){waitingSnapshot=false;baseline=sequence;command++;resultSeen=false;
     send({type:'vm-body-semantic-focus',version:1,revision,region:scope,session,command,target});update('focusing');return 'available';}
    if(status==='empty'){clearSelection();if(state==='confirmed'){reportsReady=false;update('failed');}return 'available';}
    const reported=data.selection as PublicBodyTarget;
    if(reportsReady){
     if(reported.laterality===target.laterality){report(reported);if(!sameTarget(reported,target))update('failed');}
     else {clearSelection();reportsReady=false;update('failed');}
     return 'available';
    }
    // The source may publish its old selection after ACK, before the focus commit.
    // Only an exact, fresh post-baseline snapshot can confirm the requested target.
    if(state==='focusing'&&accepted&&sequence>baseline&&sameTarget(reported,target)){
     reportsReady=true;report(reported);update('confirmed');
    }else clearSelection();
    return 'available';
   }
   if(data.type==='vm-body-semantic-focus-result'){
    if(!exact(data,['type','version','revision','region','session','command','status'])||!safeSeq(data.command)||
     data.command!==command||state!=='focusing'||resultSeen||!['accepted','refused'].includes(String(data.status)))return;
    resultSeen=true;
    if(data.status==='refused'){accepted=false;reportsReady=false;clearSelection();update('failed');return;}
    accepted=true;
   }
  },
  fail(){if(!closed&&state!=='blocked'){session='';sequence=0;command=0;accepted=false;resultSeen=false;waitingSnapshot=false;
   reportsReady=false;clearSelection();update('failed');}},
  retry(){retire();request();},retire,
  close(){closed=true;retire();target=null;scope=null;},
 };
}
