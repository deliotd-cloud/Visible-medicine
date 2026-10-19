import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';
import {facialDecisionKind,facialDecisionConcept,facialDecisionContext,parseFacialDecisionContext,parseSavedFacialDecision,validateFacialDecision,type FacialDecisionKind} from './head-ct-facial-decision-contract.ts';
import {facialDecisionHistory,appendFacialDecision} from './head-ct-facial-decision-store.ts';

// Internal handlers: the website route MUST run runClinicalReview first.
// Only its server-derived account/institution identity is accepted at that boundary.
const privateUser=(request:Request,kind:FacialDecisionKind)=>JSON.stringify(['vm-head-ct-facial-personal-decisions-1',kind,authenticatedReviewer(request.headers)]);
const database=(db:Pick<D1Database,'prepare'>|undefined)=>{if(!db)throw new ReviewHttpError(503,'Facial review storage is unavailable.');return db;};
function failure(error:unknown){
  if(error instanceof ReviewHttpError)return reviewJson({error:error.message},error.status);
  console.error(JSON.stringify({event:'head-ct-facial-decision-unconfirmed'}));
  return reviewJson({error:'Save or history could not be confirmed. Keep your edits and compare saved history before retrying.'},503);
}
export async function getFacialDecisions(request:Request,binding:Pick<D1Database,'prepare'>|undefined,manifestRevision:string){
  try{
    authenticatedReviewer(request.headers);
    const params=new URL(request.url).searchParams;
    for(const key of params.keys())if(!['concept','kind','before'].includes(key)||params.getAll(key).length!==1)throw new ReviewHttpError(400,'Unexpected or duplicate history parameter.');
    const concept=params.get('concept'),kind=params.get('kind');
    if(!facialDecisionConcept(concept)||!facialDecisionKind(kind))throw new ReviewHttpError(400,'Unknown facial concept or decision kind.');
    const raw=params.get('before'),before=raw===null?2147483648:Number(raw);
    if((raw!==null&&!/^[1-9]\d{0,9}$/.test(raw))||!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid history cursor.');
    const user=privateUser(request,kind),context=await facialDecisionContext(manifestRevision,concept,kind);
    const history=await facialDecisionHistory(database(binding),user,concept,kind,before);
    return reviewJson({context,history,nextBefore:history.length===20?history.at(-1)!.version:null,scope:'private-to-signed-in-account-and-institution'});
  }catch(error){return failure(error);}
}
export async function postFacialDecision(request:Request,binding:Pick<D1Database,'prepare'>|undefined,manifestRevision:string){
  try{
    authenticatedReviewer(request.headers);
    if(new URL(request.url).searchParams.size)throw new ReviewHttpError(400,'Unexpected decision query parameter.');
    const raw=await reviewBody(request);
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==3||!['context','expectedVersion','decision'].every(k=>Object.hasOwn(raw,k)))throw new ReviewHttpError(400,'Unexpected decision field.');
    const input=raw as Record<string,unknown>;
    let submitted;try{submitted=parseFacialDecisionContext(input.context);}catch{throw new ReviewHttpError(400,'Invalid facial identity or context.');}
    const user=privateUser(request,submitted.kind),context=await facialDecisionContext(manifestRevision,submitted.conceptId,submitted.kind);
    if(JSON.stringify(submitted)!==JSON.stringify(context))throw new ReviewHttpError(409,'The facial source, packet or review wording changed. Keep edits and reload before reviewing again.');
    const expected=input.expectedVersion;
    if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid decision version.');
    let decision;try{decision=validateFacialDecision(input.decision,context);}catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid decision.');}
    const db=database(binding),previous=(await facialDecisionHistory(db,user,context.conceptId,context.kind))[0];
    if((previous?.version??0)!==expected)throw new ReviewHttpError(409,'Another save changed this facial decision. Refresh history and compare your edits.');
    const saved=parseSavedFacialDecision({eventSchema:'vm-ct-facial-decision-event-1',context,version:expected+1,savedAt:new Date().toISOString(),decision});
    if(!await appendFacialDecision(db,user,saved,expected))throw new ReviewHttpError(409,'Another save won the version check. Refresh history and compare your edits.');
    return reviewJson({review:saved},201);
  }catch(error){return failure(error);}
}
