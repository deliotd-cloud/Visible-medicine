import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';
import {headMriDraftContext,validateHeadMriDraft,parseSavedHeadMriDraft} from './head-mri-review-draft-contract.ts';
import {headMriDraftHistory,appendHeadMriDraft} from './head-mri-review-draft-store.ts';

// Only call through runClinicalReview, which overwrites identity server-side.
const privateUser=(request:Request)=>JSON.stringify(['vm-head-mri-personal-drafts-1',authenticatedReviewer(request.headers)]);
const database=(binding:Pick<D1Database,'prepare'>|undefined)=>{if(!binding)throw new ReviewHttpError(503,'MRI correction storage is unavailable.');return binding;};
function failure(error:unknown){
  if(error instanceof ReviewHttpError)return reviewJson({error:error.message},error.status);
  // Do not log notes, identities or database exception payloads.
  console.error(JSON.stringify({event:'head-mri-draft-storage-failed'}));
  return reviewJson({error:'Storage could not be confirmed. Keep your edits and compare saved history before retrying.'},503);
}
export async function getHeadMriDrafts(request:Request,binding:Pick<D1Database,'prepare'>|undefined,manifestRevision:string){
  try{
    const user=privateUser(request),params=new URL(request.url).searchParams;
    for(const key of params.keys())if(key!=='before'||params.getAll(key).length!==1)throw new ReviewHttpError(400,'Unexpected or duplicate history parameter.');
    const raw=params.get('before');
    if(raw!==null&&!/^[1-9]\d{0,9}$/.test(raw))throw new ReviewHttpError(400,'Invalid history cursor.');
    const before=raw===null?2147483648:Number(raw);
    if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid history cursor.');
    const context=await headMriDraftContext(manifestRevision),history=await headMriDraftHistory(database(binding),user,before);
    return reviewJson({context,history,nextBefore:history.length===20?history.at(-1)!.version:null,scope:'private-to-signed-in-account-and-institution'});
  }catch(error){return failure(error);}
}
export async function postHeadMriDraft(request:Request,binding:Pick<D1Database,'prepare'>|undefined,manifestRevision:string){
  try{
    const user=privateUser(request);
    if(new URL(request.url).searchParams.size)throw new ReviewHttpError(400,'Unexpected draft query parameter.');
    const raw=await reviewBody(request),keys=['catalogScope','packetId','headRevision','comparisonRevision','teachingRevision','learningRevision','checklistVersion','expectedVersion','draft'];
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==keys.length||keys.some(key=>!Object.hasOwn(raw,key)))throw new ReviewHttpError(400,'Unexpected draft field.');
    const input=raw as Record<string,unknown>,context=await headMriDraftContext(manifestRevision);
    if(input.catalogScope!==context.catalogScope||input.packetId!==context.packetId)throw new ReviewHttpError(400,'Wrong MRI-only packet identity.');
    if(input.headRevision!==context.headRevision||input.comparisonRevision!==context.comparisonRevision||
      input.teachingRevision!==context.teachingRevision||input.learningRevision!==context.learningRevision||input.checklistVersion!==context.checklistVersion)
      throw new ReviewHttpError(409,'An MRI packet, head source or checklist changed. Keep your edits and reload before re-reviewing.');
    const expected=input.expectedVersion;
    if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid draft version.');
    let draft;
    try{draft=validateHeadMriDraft(input.draft,context);}catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid draft.');}
    const db=database(binding),previous=(await headMriDraftHistory(db,user))[0];
    if((previous?.version??0)!==expected)throw new ReviewHttpError(409,'Another save changed this draft. Refresh history and compare your edits.');
    const saved=parseSavedHeadMriDraft({eventSchema:'vm-head-mri-draft-event-1',context,version:expected+1,savedAt:new Date().toISOString(),draft});
    if(!await appendHeadMriDraft(db,user,saved,expected))throw new ReviewHttpError(409,'Another save won the version check. Refresh history and compare your edits.');
    return reviewJson({review:saved},201);
  }catch(error){return failure(error);}
}
