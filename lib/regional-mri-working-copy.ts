import {parseRegionalMriCorrectionContext,sameRegionalMriCorrectionContext,validateRegionalMriCorrectionDraft,type RegionalMriCorrectionContext,type RegionalMriCorrectionDraft} from './regional-mri-correction-contract.ts';

export type RegionalMriWorkingCopyState={baseVersion:number|null;unsavedChanges:boolean;saveUncertain:boolean;reloadRequired:boolean};
export type RegionalMriWorkingCopy={
 schema:'vm-regional-mri-correction-working-copy-1';createdAt:string;accountContext:string;context:RegionalMriCorrectionContext;
 workingDraft:RegionalMriCorrectionDraft;editState:RegionalMriWorkingCopyState;
 localOnly:true;serverSaveConfirmed:false;clinicalApproval:false;publicationApproval:false;patientRegistration:false;warning:string;
};
const MAX_BYTES=65536;
const warning='Private unfinished working copy, not saved review history or approval. Keep this file private and free of patient identifiers. Restoring requires the current source and account context, fresh history comparison and a separate explicit save. Recorded versions never authorize a save.';
const exact=(v:unknown,keys:readonly string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const fail=()=>{throw Error('Invalid or incompatible private working copy. No edits were restored.');};
function parse(value:unknown):RegionalMriWorkingCopy{
 if(!exact(value,['schema','createdAt','accountContext','context','workingDraft','editState','localOnly','serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration','warning'])||
  value.schema!=='vm-regional-mri-correction-working-copy-1'||typeof value.createdAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.createdAt)||
  !Number.isFinite(Date.parse(value.createdAt))||new Date(value.createdAt).toISOString()!==value.createdAt||!hash(value.accountContext)||
  value.localOnly!==true||value.serverSaveConfirmed!==false||value.clinicalApproval!==false||value.publicationApproval!==false||value.patientRegistration!==false||value.warning!==warning) return fail();
 const edit=value.editState,draft=value.workingDraft;
 if(!exact(edit,['baseVersion','unsavedChanges','saveUncertain','reloadRequired'])||edit.baseVersion!==null&&(!Number.isSafeInteger(edit.baseVersion)||edit.baseVersion<0||edit.baseVersion>2147483647)||
  [edit.unsavedChanges,edit.saveUncertain,edit.reloadRequired].some(v=>typeof v!=='boolean')||!exact(draft,['status','notes','checks','attested'])||!['draft','changes-required'].includes(draft.status))return fail();
 // Unfinished correction text may not yet meet the changes-required minimum.
 const checked=validateRegionalMriCorrectionDraft({...draft,status:'draft'});
 const workingDraft=Object.freeze({...checked,status:draft.status}) as RegionalMriCorrectionDraft;
 return Object.freeze({schema:value.schema,createdAt:value.createdAt,accountContext:value.accountContext,context:parseRegionalMriCorrectionContext(value.context),workingDraft,
  editState:Object.freeze({baseVersion:edit.baseVersion,unsavedChanges:edit.unsavedChanges,saveUncertain:edit.saveUncertain,reloadRequired:edit.reloadRequired}),
  localOnly:true,serverSaveConfirmed:false,clinicalApproval:false,publicationApproval:false,patientRegistration:false,warning});
}
/** Private text/metadata recovery only. No approval, authority, image or save action. */
export function regionalMriWorkingCopy(context:RegionalMriCorrectionContext,draft:RegionalMriCorrectionDraft,editState:RegionalMriWorkingCopyState,accountContext:string,createdAt=new Date().toISOString()):RegionalMriWorkingCopy{
 return parse({schema:'vm-regional-mri-correction-working-copy-1',createdAt,accountContext,context,workingDraft:draft,editState,
  localOnly:true,serverSaveConfirmed:false,clinicalApproval:false,publicationApproval:false,patientRegistration:false,warning});
}
/** Context arguments must come from the already loaded authorized server history. */
export function restoreRegionalMriWorkingCopy(value:unknown,currentContext:RegionalMriCorrectionContext,accountContext:string):RegionalMriWorkingCopy{
 const copy=parse(value);
 if(!hash(accountContext)||copy.accountContext!==accountContext||!sameRegionalMriCorrectionContext(copy.context,currentContext))return fail();
 return copy;
}
export async function readRegionalMriWorkingCopy(file:Pick<File,'size'|'name'|'text'>,currentContext:RegionalMriCorrectionContext,accountContext:string,signal?:AbortSignal){
 const aborted=()=>{if(signal?.aborted)throw Error('Working-copy restore was cancelled.');};aborted();
 if(!file||!Number.isSafeInteger(file.size)||file.size<1||file.size>MAX_BYTES||typeof file.name!=='string'||!file.name.toLowerCase().endsWith('.json'))return fail();
 const text=await file.text();aborted();
 if(typeof text!=='string'||text.length>MAX_BYTES||new TextEncoder().encode(text).byteLength>MAX_BYTES)return fail();
 let value:unknown;try{value=JSON.parse(text);}catch{return fail();}
 const copy=restoreRegionalMriWorkingCopy(value,currentContext,accountContext);aborted();return copy;
}
/** Explicit browser download only; no network request or automatic storage. */
export function downloadRegionalMriWorkingCopy(value:RegionalMriWorkingCopy){
 const copy=parse(value),bytes=JSON.stringify(copy,null,2)+'\n';
 if(new TextEncoder().encode(bytes).byteLength>MAX_BYTES)return fail();
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/json'}));let anchor:HTMLAnchorElement|undefined;
 try{
  anchor=document.createElement('a');anchor.href=url;anchor.download=`visible-medicine-regional-mri-working-copy-${copy.createdAt.replaceAll(':','-')}.json`;
  anchor.hidden=true;document.body.appendChild(anchor);anchor.click();
 }catch(error){URL.revokeObjectURL(url);throw error;}
 finally{anchor?.remove();}
 try{setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){URL.revokeObjectURL(url);throw error;}
}
