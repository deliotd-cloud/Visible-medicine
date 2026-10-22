import {isRegionalMriInlineInspection,type RegionalMriInlineInspection} from './regional-mri-inline-inspection.ts';

export type PublicSpecimenTarget={scope:'knee';id:string;source:string;revision:string;laterality:'right-source-report'};
export type RegionalMriSpecimenSelection=Readonly<{atlasRevision:string;sequence:number;target:Readonly<PublicSpecimenTarget>}>;
const currentSelections=new WeakMap<object,()=>boolean>();
/** An in-memory current channel report, never a deserializable anatomical approval. */
export function isCurrentRegionalMriSpecimenSelection(value:unknown):value is RegionalMriSpecimenSelection{
 return !!value&&typeof value==='object'&&currentSelections.get(value)?.()===true;
}
export type SpecimenFocusState='waiting'|'requesting'|'focusing'|'confirmed'|'blocked'|'failed';
const keys=(value:Record<string,unknown>,expected:string[])=>Object.keys(value).sort().join('|')===expected.sort().join('|');
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const hash=/^[a-f0-9]{64}$/,commit=/^[a-f0-9]{40}$/;
/** Only the owned canonical knee specimen link supplies this public model identity. */
export function publicSpecimenTarget(inspection:RegionalMriInlineInspection):PublicSpecimenTarget|null{
 if(!isRegionalMriInlineInspection(inspection))return null;
 const t=inspection.target;
 if(t.kind!=='specimen'||t.side!=='right'||!commit.test(inspection.atlasRevision)||!commit.test(inspection.runtimeRevision)||
  t.runtimeRevision!==inspection.runtimeRevision||!hash.test(t.sourceHash)||
  !t.specimenRevision||!hash.test(t.specimenRevision))return null;
 const url=new URL(t.href,'https://visible-medicine.invalid'),q=url.searchParams;
 if(url.origin!=='https://visible-medicine.invalid'||url.pathname!=='/atlas/lower-limb-3d'||url.hash||
  [...q.keys()].length!==7||new Set(q.keys()).size!==7||q.get('specimen')!=='um-limb-1'||
  q.get('specimenScope')!=='knee'||q.get('specimenPart')!==t.id||q.get('specimenSource')!==t.sourceHash||
  q.get('specimenRevision')!==t.specimenRevision||q.get('specimenView')!=='anterior'||
  q.get('atlasRevision')!==inspection.runtimeRevision||
  !/^vm:reference:um-5t6tz7-v1-2:knee:[a-z0-9-]{1,100}$/.test(t.id))return null;
 return {scope:'knee',id:t.id,source:t.sourceHash,revision:t.specimenRevision,laterality:'right-source-report'};
}
const exactTarget=(value:unknown,target:PublicSpecimenTarget)=>object(value)&&keys(value,['scope','id','source','revision','laterality'])&&
 Object.keys(target).every(key=>value[key]===target[key as keyof PublicSpecimenTarget]);
// Observe all declared source scopes so leaving the knee invalidates its report.
// Outgoing focus commands remain restricted to an owned canonical knee target.
const validTarget=(value:unknown)=>object(value)&&keys(value,['scope','id','source','revision','laterality'])&&
 ['knee','hip-thigh','calf','foot','whole'].includes(String(value.scope))&&typeof value.id==='string'&&/^vm:reference:um-5t6tz7-v1-2:(?:knee|lower-limb):[a-z0-9-]{1,100}$/.test(value.id)&&
 typeof value.source==='string'&&hash.test(value.source)&&typeof value.revision==='string'&&hash.test(value.revision)&&
 ['right-source-report','source-group'].includes(String(value.laterality));
const safeSeq=(value:unknown)=>Number.isSafeInteger(value)&&(value as number)>0;
const randomSession=()=>{
 const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
};
/** One context/attempt at a time. The host validates origin and exact iframe window before receive. */
export function createRegionalMriSpecimenFocus(send:(message:object)=>void,changed:(state:SpecimenFocusState)=>void,
 sessionFactory:()=>string=randomSession,selectionChanged:(selection:RegionalMriSpecimenSelection|null)=>void=()=>{}){
 let revision='',target:PublicSpecimenTarget|null=null,session='',sequence=0,command=0,baseline=0;
 let state:SpecimenFocusState='waiting',accepted=false,closed=false,waitingSnapshot=false,resultSeen=false;
 let selection:RegionalMriSpecimenSelection|null=null,reportsReady=false;
 const clearSelection=()=>{selection=null;selectionChanged(null);};
 const reportSelection=(value:unknown)=>{
  if(!target||!object(value)||value.scope!=='knee'||value.source!==target.source||value.revision!==target.revision||
   value.laterality!=='right-source-report'){clearSelection();return;}
  const reported=Object.freeze({...value}) as Readonly<PublicSpecimenTarget>;
  const proof=Object.freeze({atlasRevision:revision,sequence,target:reported});
  selection=proof;currentSelections.set(proof,()=>!closed&&session!==''&&selection===proof);selectionChanged(proof);
 };
 const update=(next:SpecimenFocusState)=>{state=next;changed(next);};
 const retire=()=>{session='';sequence=0;command=0;accepted=false;waitingSnapshot=false;resultSeen=false;reportsReady=false;clearSelection();update('waiting');};
 const request=()=>{
  if(!target||closed)return;
  const candidate=sessionFactory();
  if(!/^[a-zA-Z0-9_-]{16,80}$/.test(candidate)){update('failed');return;}
  session=candidate;sequence=0;command=0;accepted=false;resultSeen=false;waitingSnapshot=true;
  send({type:'vm-specimen-selection-request',version:1,session});update('requesting');
 };
 return {
  get state(){return state;},
  get selection(){return isCurrentRegionalMriSpecimenSelection(selection)?selection:null;},
  begin(inspection:RegionalMriInlineInspection,readyKnown=false){retire();target=publicSpecimenTarget(inspection);revision=inspection.runtimeRevision;
   if(!target)update('failed');else if(readyKnown)request();},
  receive(data:unknown):boolean|'available'|'unavailable'|void{
   if(closed||!target||!object(data)||data.version!==1||data.revision!==revision)return;
   if(data.type==='vm-specimen-selection-ready'){
    if(!keys(data,['type','version','revision']))return;
    if(state==='failed')return; // A timed-out document needs an explicit retry or new frame load.
    // A same-window navigation keeps WindowProxy identity. Every new readiness
    // revokes the previous document's selection claim and opens a fresh session.
    retire();request();return true;
   }
   if(!session||data.session!==session)return;
   if(data.type==='vm-specimen-selection'){
    const status=data.status;
    if(!['selected','empty','blocked'].includes(String(status))||!safeSeq(data.sequence)||
     (data.sequence as number)<=sequence||!keys(data,status==='selected'?['type','version','revision','session','sequence','status','target']:
      status==='blocked'?['type','version','revision','session','sequence','status','reason']:
      ['type','version','revision','session','sequence','status']))return;
    if(status==='selected'&&!validTarget(data.target))return;
    if(status==='blocked'&&!['practice','guided','unavailable'].includes(String(data.reason)))return;
    sequence=data.sequence as number;
    if(status==='blocked'){accepted=false;waitingSnapshot=false;reportsReady=false;clearSelection();update('blocked');return data.reason==='unavailable'?'unavailable':'available';}
    if(waitingSnapshot){waitingSnapshot=false;baseline=sequence;command++;resultSeen=false;
     send({type:'vm-specimen-focus',version:1,revision,session,command,target});update('focusing');return 'available';}
    if(status==='selected'&&(reportsReady||accepted&&sequence>baseline)){reportsReady=true;reportSelection(data.target);}
    else clearSelection();
    if(state!=='focusing'&&state!=='confirmed')return;
    if(status!=='selected'||!exactTarget(data.target,target)){accepted=false;update('failed');return;}
    if(accepted&&sequence>baseline)update('confirmed');
    return 'available';
   }
   if(data.type==='vm-specimen-focus-result'){
    if(!keys(data,['type','version','revision','session','command','status'])||!safeSeq(data.command)||
     data.command!==command||state!=='focusing'||resultSeen||!['accepted','refused'].includes(String(data.status)))return;
    resultSeen=true;
    if(data.status==='refused'){accepted=false;reportsReady=false;clearSelection();update('failed');return;}
    accepted=true;
   }
  },
  fail(){if(!closed&&state!=='confirmed'&&state!=='blocked'){
   session='';sequence=0;command=0;accepted=false;waitingSnapshot=false;resultSeen=false;reportsReady=false;clearSelection();update('failed');
  }},
  retry(){retire();request();},
  retire,
  close(){closed=true;retire();target=null;},
 };
}
