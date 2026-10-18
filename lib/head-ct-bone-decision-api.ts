import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';
import {ctBoneDecisionConcept,ctBoneDecisionContext,parseCtBoneDecisionContext,parseSavedCtBoneDecision,validateCtBoneDecision} from './head-ct-bone-decision-contract.ts';
import {ctBoneDecisionHistory,appendCtBoneDecision} from './head-ct-bone-decision-store.ts';

// Internal service only. Any future route MUST use runClinicalReview before
// these handlers so identity is server-derived and institution changes are gated.
// A request header alone is NOT authorization at the website boundary.
const privateUser=(r:Request)=>JSON.stringify(['vm-head-ct-bone-personal-decisions-1',authenticatedReviewer(r.headers)]);
const database=(db:Pick<D1Database,'prepare'>|undefined)=>{if(!db)throw new ReviewHttpError(503,'Comparison review storage is unavailable.');return db;};
function failure(error:unknown){
  if(error instanceof ReviewHttpError)return reviewJson({error:error.message},error.status);
  console.error(JSON.stringify({event:'head-ct-bone-decision-storage-failed'}));
  return reviewJson({error:'Save or history could not be confirmed. Preserve your edits and compare saved history before retrying.'},503);
}
export async function getCtBoneDecisions(request:Request,binding:Pick<D1Database,'prepare'>|undefined,manifestRevision:string){
  try{
    const user=privateUser(request),params=new URL(request.url).searchParams;
    for(const key of params.keys())if(!['concept','before'].includes(key)||params.getAll(key).length!==1)throw new ReviewHttpError(400,'Unexpected or duplicate history parameter.');
    const concept=params.get('concept');if(!ctBoneDecisionConcept(concept))throw new ReviewHttpError(400,'Unknown CT bone comparison.');
    const raw=params.get('before'),before=raw===null?2147483648:Number(raw);
    if((raw!==null&&!/^[1-9]\d{0,9}$/.test(raw))||!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid history cursor.');
    const context=await ctBoneDecisionContext(manifestRevision,concept),history=await ctBoneDecisionHistory(database(binding),user,concept,before);
    return reviewJson({context,history,nextBefore:history.length===20?history.at(-1)!.version:null,scope:'private-to-signed-in-account-and-institution'});
  }catch(error){return failure(error);}
}
export async function postCtBoneDecision(request:Request,binding:Pick<D1Database,'prepare'>|undefined,manifestRevision:string){
  try{
    const user=privateUser(request);
    if(new URL(request.url).searchParams.size)throw new ReviewHttpError(400,'Unexpected decision query parameter.');
    const raw=await reviewBody(request);
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==3||!['context','expectedVersion','decision'].every(k=>Object.hasOwn(raw,k)))throw new ReviewHttpError(400,'Unexpected decision field.');
    const input=raw as Record<string,unknown>;let submitted;
    try{submitted=parseCtBoneDecisionContext(input.context);}catch{throw new ReviewHttpError(400,'Invalid comparison identity or context.');}
    const context=await ctBoneDecisionContext(manifestRevision,submitted.conceptId);
    if(JSON.stringify(submitted)!==JSON.stringify(context))throw new ReviewHttpError(409,'The comparison source or review wording changed. Preserve edits and reload before reviewing again.');
    const expected=input.expectedVersion;
    if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid decision version.');
    let decision;try{decision=validateCtBoneDecision(input.decision,context);}catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid decision.');}
    const db=database(binding),previous=(await ctBoneDecisionHistory(db,user,context.conceptId))[0];
    if((previous?.version??0)!==expected)throw new ReviewHttpError(409,'Another save changed this comparison. Refresh history and compare your edits.');
    const saved=parseSavedCtBoneDecision({eventSchema:'vm-ct-bone-decision-event-1',context,version:expected+1,savedAt:new Date().toISOString(),decision});
    if(!await appendCtBoneDecision(db,user,saved,expected))throw new ReviewHttpError(409,'Another save won the version check. Refresh history and compare your edits.');
    return reviewJson({review:saved},201);
  }catch(error){return failure(error);}
}
