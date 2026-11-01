import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';
import {prostateReviewMaterial} from './prostate-review-material.ts';
import {prostateReviewContext,sameProstateReviewContext,validateProstateDecision,parseProstateReviewEvent} from './prostate-review-contract.ts';
import {prostateReviewHistory,appendProstateReview} from './prostate-review-store.ts';

class ProstateConflict extends ReviewHttpError{constructor(message:string,readonly code:'source-changed'|'version-conflict'){super(409,message);}}
const privateUser=(request:Request)=>JSON.stringify(['vm-prostate-zones-private-1',authenticatedReviewer(request.headers)]);
const database=(binding:Pick<D1Database,'prepare'>|undefined)=>{if(!binding)throw new ReviewHttpError(503,'Private prostate review storage is unavailable. Keep your edits.');return binding;};
async function selection(request:Request){
 const params=new URL(request.url).searchParams;
 if(params.size!==1||!params.has('revision'))throw new ReviewHttpError(400,'Invalid prostate review selection.');
 const revision=params.get('revision');
 if(!revision||!/^[a-f0-9]{64}$/.test(revision))throw new ReviewHttpError(400,'Invalid prostate review selection.');
 const material=await prostateReviewMaterial();
 const context=prostateReviewContext(material);
 if(revision!==context.contentRevision)throw new ProstateConflict('The prostate source changed. Keep your edits and reload the current material.','source-changed');
 return context;
}
function failure(error:unknown){
 if(error instanceof ReviewHttpError)return reviewJson({error:error.message,...(error instanceof ProstateConflict?{code:error.code}:{})},error.status);
 console.error(JSON.stringify({event:'prostate-review-storage-failed'}));
 return reviewJson({error:'Storage could not be confirmed. Keep your edits and compare saved history before retrying.'},503);
}
/** Call only through runClinicalReview with an opaque account/institution principal. */
export async function getProstateReviews(request:Request,binding:Pick<D1Database,'prepare'>|undefined){
 try{
  const user=privateUser(request),context=await selection(request),raw=request.headers.get('X-Prostate-Review-Before');
  if(raw!==null&&!/^[1-9]\d{0,9}$/.test(raw))throw new ReviewHttpError(400,'Invalid prostate history cursor.');
  const before=raw===null?2147483648:Number(raw);
  if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid prostate history cursor.');
  const db=database(binding),history=await prostateReviewHistory(db,user,context,before);
  const latestVersion=raw===null?(history[0]?.version??0):((await prostateReviewHistory(db,user,context))[0]?.version??0);
  return reviewJson({context,history,latestVersion,nextBefore:history.length===20?history.at(-1)!.version:null,scope:'private-to-signed-in-account-and-institution'});
 }catch(error){return failure(error);}
}
/** Call only through runClinicalReview with an opaque account/institution principal. */
export async function postProstateReview(request:Request,binding:Pick<D1Database,'prepare'>|undefined){
 try{
  const user=privateUser(request),context=await selection(request);
  if(request.headers.has('X-Prostate-Review-Before'))throw new ReviewHttpError(400,'History cursors are not accepted on a save.');
  const raw=await reviewBody(request);
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==3||!['context','expectedVersion','decision'].every(k=>Object.hasOwn(raw,k)))throw new ReviewHttpError(400,'Unexpected prostate review field.');
  const input=raw as Record<string,unknown>;
  if(!sameProstateReviewContext(input.context,context))throw new ProstateConflict('The prostate source changed. Keep your edits and reload the current material.','source-changed');
  const expected=input.expectedVersion;
  if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid prostate review version.');
  let decision;try{decision=validateProstateDecision(input.decision);}catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid prostate review decision.');}
  const db=database(binding),previous=(await prostateReviewHistory(db,user,context))[0];
  if((previous?.version??0)!==expected)throw new ProstateConflict('Another save changed this prostate review. Compare saved history before rebasing your edits.','version-conflict');
  if(!sameProstateReviewContext(context,prostateReviewContext(await prostateReviewMaterial())))throw new ProstateConflict('The prostate source changed. Keep your edits and reload the current material.','source-changed');
  const event=parseProstateReviewEvent({eventSchema:'vm-prostate-zones-review-event-1',context,version:expected+1,savedAt:new Date().toISOString(),decision});
  if(!await appendProstateReview(db,user,event,expected))throw new ProstateConflict('Another save won the version check. Compare saved history before rebasing your edits.','version-conflict');
  return reviewJson({review:event},201);
 }catch(error){return failure(error);}
}
