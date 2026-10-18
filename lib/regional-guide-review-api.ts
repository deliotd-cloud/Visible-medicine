import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';
import {parseRegionalGuideReviewSelection,resolveRegionalGuideReview} from './regional-guide-review.ts';
import {regionalGuideReviewContext,sameRegionalGuideReviewContext,validateRegionalGuideDecision,parseRegionalGuideReviewEvent} from './regional-guide-review-contract.ts';
import {regionalGuideReviewHistory,appendRegionalGuideReview} from './regional-guide-review-store.ts';

class GuideConflict extends ReviewHttpError{constructor(message:string,readonly code:'source-changed'|'version-conflict'){super(409,message);}}
const privateUser=(request:Request)=>JSON.stringify(['vm-regional-guide-teaching-private-1',authenticatedReviewer(request.headers)]);
const database=(binding:Pick<D1Database,'prepare'>|undefined)=>{if(!binding)throw new ReviewHttpError(503,'Private guide teaching review storage is unavailable. Keep your edits.');return binding;};
async function selection(request:Request){
 const params=new URL(request.url).searchParams;
 if(params.size!==3)throw new ReviewHttpError(400,'Invalid guide teaching selection.');
 const raw=Object.fromEntries(params);
 const parsed=parseRegionalGuideReviewSelection(raw);
 if(!parsed)throw new ReviewHttpError(400,'Invalid guide teaching selection.');
 const packet=await resolveRegionalGuideReview(parsed);
 if(!packet)throw new GuideConflict('The guide source changed. Keep your edits and reload the current guide.','source-changed');
 return regionalGuideReviewContext(packet);
}
function failure(error:unknown){
 if(error instanceof ReviewHttpError)return reviewJson({error:error.message,...(error instanceof GuideConflict?{code:error.code}:{})},error.status);
 console.error(JSON.stringify({event:'regional-guide-teaching-storage-failed'}));
 return reviewJson({error:'Storage could not be confirmed. Keep your edits and compare saved history before retrying.'},503);
}
/** Call only through runClinicalReview with an opaque account/institution principal. */
export async function getRegionalGuideReviews(request:Request,binding:Pick<D1Database,'prepare'>|undefined){
 try{
  const user=privateUser(request),context=await selection(request),raw=request.headers.get('X-Regional-Guide-Before');
  if(raw!==null&&!/^[1-9]\d{0,9}$/.test(raw))throw new ReviewHttpError(400,'Invalid guide history cursor.');
  const before=raw===null?2147483648:Number(raw);
  if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid guide history cursor.');
  const db=database(binding),history=await regionalGuideReviewHistory(db,user,context,before);
  const latestVersion=raw===null?(history[0]?.version??0):((await regionalGuideReviewHistory(db,user,context))[0]?.version??0);
  return reviewJson({context,history,latestVersion,nextBefore:history.length===20?history.at(-1)!.version:null,scope:'private-to-signed-in-account-and-institution'});
 }catch(error){return failure(error);}
}
export async function postRegionalGuideReview(request:Request,binding:Pick<D1Database,'prepare'>|undefined){
 try{
  const user=privateUser(request),context=await selection(request);
  if(request.headers.has('X-Regional-Guide-Before'))throw new ReviewHttpError(400,'History cursors are not accepted on a save.');
  const raw=await reviewBody(request);
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==3||!['context','expectedVersion','decision'].every(k=>Object.hasOwn(raw,k)))throw new ReviewHttpError(400,'Unexpected guide teaching review field.');
  const input=raw as Record<string,unknown>;
  if(!sameRegionalGuideReviewContext(input.context,context))throw new GuideConflict('The guide source changed. Keep your edits and reload the current guide.','source-changed');
  const expected=input.expectedVersion;
  if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid guide review version.');
  let decision;try{decision=validateRegionalGuideDecision(input.decision);}catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid guide teaching decision.');}
  const db=database(binding),previous=(await regionalGuideReviewHistory(db,user,context))[0];
  if((previous?.version??0)!==expected)throw new GuideConflict('Another save changed this guide review. Compare saved history before rebasing your edits.','version-conflict');
  const event=parseRegionalGuideReviewEvent({eventSchema:'vm-regional-guide-teaching-review-event-1',context,version:expected+1,savedAt:new Date().toISOString(),decision});
  if(!await appendRegionalGuideReview(db,user,event,expected))throw new GuideConflict('Another save won the version check. Compare saved history before rebasing your edits.','version-conflict');
  return reviewJson({review:event},201);
 }catch(error){return failure(error);}
}
