import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';
import {headTeachingDraftContext,validateHeadTeachingDraft,parseSavedHeadTeachingDraft,type HeadTeachingDraftKind} from './head-teaching-review-contract.ts';
import {headTeachingDraftHistory,appendHeadTeachingDraft} from './head-teaching-review-store.ts';

const privateUser=(request:Request,kind:HeadTeachingDraftKind)=>JSON.stringify([kind==='brainstem-clinical'?'vm-head-brainstem-clinical-personal-drafts-1':kind==='ventricular-clinical'?'vm-head-ventricular-clinical-personal-drafts-1':kind==='cerebellar-clinical'?'vm-head-cerebellar-clinical-personal-drafts-1':kind==='deep-grey-clinical'?'vm-head-deep-grey-clinical-personal-drafts-1':kind==='lobar-clinical'?'vm-head-lobar-clinical-personal-drafts-1':kind==='hippocampal-clinical'?'vm-head-hippocampal-clinical-personal-drafts-1':kind==='mri-only-clinical'?'vm-head-mri-only-clinical-personal-drafts-1':kind==='mri-anatomy-checks'?'vm-head-mri-anatomy-checks-personal-drafts-1':'vm-head-teaching-personal-drafts-1',authenticatedReviewer(request.headers)]);
const database=(binding:Pick<D1Database,'prepare'>|undefined)=>{if(!binding)throw new ReviewHttpError(503,'Head teaching draft storage is unavailable.');return binding;};
function failure(error:unknown){
  if(error instanceof ReviewHttpError)return reviewJson({error:error.message},error.status);
  console.error(JSON.stringify({event:'head-teaching-draft-storage-failed'}));
  return reviewJson({error:'Storage could not be confirmed. Keep your edits and compare saved history before retrying.'},503);
}
export async function getHeadTeachingDrafts(request:Request,binding:Pick<D1Database,'prepare'>|undefined,manifestRevision:string,kind:HeadTeachingDraftKind='anatomy'){
  try{
    const user=privateUser(request,kind),params=new URL(request.url).searchParams;
    for(const key of params.keys())if(key!=='before'||params.getAll(key).length!==1)throw new ReviewHttpError(400,'Unexpected or duplicate history parameter.');
    const raw=params.get('before');
    if(raw!==null&&!/^[1-9]\d{0,9}$/.test(raw))throw new ReviewHttpError(400,'Invalid history cursor.');
    const before=raw===null?2147483648:Number(raw);
    if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid history cursor.');
    const context=await headTeachingDraftContext(manifestRevision,kind),history=await headTeachingDraftHistory(database(binding),user,before,kind);
    return reviewJson({context,history,nextBefore:history.length===20?history.at(-1)!.version:null,scope:'private-to-signed-in-account-and-institution'});
  }catch(error){return failure(error);}
}
export async function postHeadTeachingDraft(request:Request,binding:Pick<D1Database,'prepare'>|undefined,manifestRevision:string,kind:HeadTeachingDraftKind='anatomy'){
  try{
    const user=privateUser(request,kind);
    if(new URL(request.url).searchParams.size)throw new ReviewHttpError(400,'Unexpected draft query parameter.');
    const raw=await reviewBody(request),keys=['catalogScope','packetId','packetRevision','headRevision','checklistVersion','expectedVersion','draft'];
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==keys.length||keys.some(key=>!Object.hasOwn(raw,key)))throw new ReviewHttpError(400,'Unexpected draft field.');
    const input=raw as Record<string,unknown>,context=await headTeachingDraftContext(manifestRevision,kind);
    if(input.catalogScope!==context.catalogScope||input.packetId!==context.packetId)throw new ReviewHttpError(400,'Wrong teaching packet identity.');
    if(input.packetRevision!==context.packetRevision||input.headRevision!==context.headRevision||input.checklistVersion!==context.checklistVersion)throw new ReviewHttpError(409,'The teaching packet, head source or checklist changed. Keep your edits and reload before re-reviewing.');
    const expected=input.expectedVersion;
    if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid draft version.');
    let draft;
    try{draft=validateHeadTeachingDraft(input.draft,context);}catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid draft.');}
    const db=database(binding),previous=(await headTeachingDraftHistory(db,user,2147483648,kind))[0];
    if((previous?.version??0)!==expected)throw new ReviewHttpError(409,'Another save changed this draft. Refresh history and compare your edits.');
    const saved=parseSavedHeadTeachingDraft({eventSchema:'vm-head-teaching-draft-event-1',context,version:expected+1,savedAt:new Date().toISOString(),draft});
    if(!await appendHeadTeachingDraft(db,user,saved,expected,kind))throw new ReviewHttpError(409,'Another save won the version check. Refresh history and compare your edits.');
    return reviewJson({review:saved},201);
  }catch(error){return failure(error);}
}
