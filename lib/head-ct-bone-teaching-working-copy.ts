import {parseCtBoneTeachingDecisionContext,validateCtBoneTeachingDecision,type CtBoneTeachingDecision,type CtBoneTeachingDecisionContext} from './head-ct-bone-teaching-decision-contract.ts';
import type {HeadWorkingCopyState} from './head-review-working-copy.ts';
export function ctBoneTeachingWorkingCopy(context:CtBoneTeachingDecisionContext,draft:CtBoneTeachingDecision,editState:HeadWorkingCopyState,createdAt=new Date().toISOString()){
  parseCtBoneTeachingDecisionContext(context);
  if(!draft||!['draft','changes-required','accepted-teaching'].includes(draft.status)||typeof draft.attested!=='boolean')throw Error('Invalid working decision.');
  validateCtBoneTeachingDecision({...draft,status:'draft',attested:false},context); // Preserve incomplete acceptance/correction text without authorizing it.
  if(!editState||Object.keys(editState).length!==4||!['baseVersion','unsavedChanges','saveUncertain','reloadRequired'].every(k=>Object.hasOwn(editState,k))||
    editState.baseVersion!==null&&(!Number.isSafeInteger(editState.baseVersion)||editState.baseVersion<0||editState.baseVersion>2147483647)||
    [editState.unsavedChanges,editState.saveUncertain,editState.reloadRequired].some(v=>typeof v!=='boolean')||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(createdAt)||!Number.isFinite(Date.parse(createdAt))||new Date(createdAt).toISOString()!==createdAt)throw Error('Invalid working-copy state.');
  return {schema:'vm-ct-bone-teaching-working-copy-1',kind:'ct-bone-teaching',createdAt,context:structuredClone(context),workingDraft:structuredClone(draft),editState:{...editState},
    localOnly:true,serverSaveConfirmed:false,clinicalApproval:false,publicationApproval:false,patientRegistration:false,
    warning:'Private unfinished working copy, not a saved decision or approval. Keep private; no patient data. Restore text manually against the current source.'};
}
export function downloadCtBoneTeachingWorkingCopy(value:ReturnType<typeof ctBoneTeachingWorkingCopy>){
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));let anchor:HTMLAnchorElement|undefined;
  try{anchor=document.createElement('a');anchor.href=url;anchor.download=`visible-medicine-teaching-${value.context.conceptId}-${value.createdAt.replaceAll(':','-')}.json`;anchor.hidden=true;document.body.appendChild(anchor);anchor.click();}
  catch(error){URL.revokeObjectURL(url);throw error;}finally{anchor?.remove();}setTimeout(()=>URL.revokeObjectURL(url),1000);
}
