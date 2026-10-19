import {validateHeadTeachingDraft,type HeadTeachingDraft,type HeadTeachingDraftContext} from './head-teaching-review-contract.ts';
import {validateHeadMriDraft,type HeadMriDraft,type HeadMriDraftContext} from './head-mri-review-draft-contract.ts';

export type HeadWorkingCopyState={baseVersion:number|null;unsavedChanges:boolean;saveUncertain:boolean;reloadRequired:boolean};
function state(input:HeadWorkingCopyState){
  if(!input||Object.keys(input).length!==4||!['baseVersion','unsavedChanges','saveUncertain','reloadRequired'].every(k=>Object.hasOwn(input,k))||
    input.baseVersion!==null&&(!Number.isSafeInteger(input.baseVersion)||input.baseVersion<0||input.baseVersion>2147483647)||
    [input.unsavedChanges,input.saveUncertain,input.reloadRequired].some(v=>typeof v!=='boolean'))throw Error('Invalid working-copy state.');
  return {...input};
}
function stamp(value:string){
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw Error('Invalid working-copy date.');
  return value;
}
function copy<C,D>(kind:'head-teaching'|'head-mri-only'|'head-brainstem-clinical'|'head-ventricular-clinical'|'head-cerebellar-clinical'|'head-deep-grey-clinical'|'head-lobar-clinical'|'head-hippocampal-clinical'|'head-mri-only-clinical'|'head-mri-anatomy-checks',context:C,draft:D,editState:HeadWorkingCopyState,createdAt:string){
  return {schema:'vm-head-review-working-copy-1' as const,kind,createdAt:stamp(createdAt),
    context:structuredClone(context),workingDraft:structuredClone(draft),editState:state(editState),
    localOnly:true as const,serverSaveConfirmed:false as const,clinicalApproval:false as const,publicationApproval:false as const,patientRegistration:false as const,
    warning:'Private working copy, not a saved review event, verified identity or approval. Keep this file private. No patient data should be entered. Restore text manually against the current source; this file cannot grant approval or replace saved history.'};
}

/** Preserve unfinished corrections and whitespace exactly, even when not valid for saving yet. */
export function headTeachingWorkingCopy(context:HeadTeachingDraftContext,draft:HeadTeachingDraft,editState:HeadWorkingCopyState,createdAt=new Date().toISOString()){
  if(!draft||!['draft','changes-required'].includes(draft.status))throw Error('Invalid working draft status.');
  validateHeadTeachingDraft({...draft,status:'draft'},context); // Check structure/bounds without the correction-save minimum.
  return copy(context.packetId==='head-learning-anatomy'?'head-teaching':context.packetId,context,draft,editState,createdAt);
}
export function headMriWorkingCopy(context:HeadMriDraftContext,draft:HeadMriDraft,editState:HeadWorkingCopyState,createdAt=new Date().toISOString()){
  if(!draft||!['draft','changes-required'].includes(draft.status))throw Error('Invalid working draft status.');
  validateHeadMriDraft({...draft,status:'draft'},context);
  return copy('head-mri-only',context,draft,editState,createdAt);
}
export type HeadReviewWorkingCopy=ReturnType<typeof headTeachingWorkingCopy>|ReturnType<typeof headMriWorkingCopy>;

/** Browser-only explicit download. No network, server save or automatic import. */
export function downloadHeadWorkingCopy(value:HeadReviewWorkingCopy){
  const bytes=JSON.stringify(value,null,2)+'\n';
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/json'}));
  let anchor:HTMLAnchorElement|undefined;
  try{
    anchor=document.createElement('a');
    anchor.href=url;anchor.download=`visible-medicine-${value.kind}-working-copy-${value.createdAt.replaceAll(':','-')}.json`;
    anchor.hidden=true;document.body.appendChild(anchor);anchor.click();
  }catch(error){URL.revokeObjectURL(url);throw error;}
  finally{anchor?.remove();}
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
