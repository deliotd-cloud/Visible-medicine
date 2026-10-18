import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';
import type {Regional3dCatalogue} from './regional-mri-3d-comparison.ts';
import {parseRegionalLearningReviewRequest} from './regional-mri-learning-review-link.ts';
import {resolveRegionalLearningReview} from './regional-mri-learning-review.ts';
import {regionalReferenceDraftContext,sameRegionalReferenceDraftContext,validateRegionalReferenceDraft,parseRegionalReferenceDraftEvent} from './regional-reference-draft-contract.ts';
import {regionalReferenceDraftHistory,appendRegionalReferenceDraft} from './regional-reference-draft-store.ts';
class ReferenceDraftConflict extends ReviewHttpError{constructor(message:string,readonly code:'source-changed'|'version-conflict'){super(409,message);}}
const privateUser=(request:Request)=>JSON.stringify(['vm-regional-reference-teaching-private-1',authenticatedReviewer(request.headers)]);
const database=(binding:Pick<D1Database,'prepare'>|undefined)=>{if(!binding)throw new ReviewHttpError(503,'Private teaching correction storage is unavailable.');return binding;};
async function selection(request:Request,catalogue:Regional3dCatalogue|null){
 if(new URL(request.url).searchParams.size)throw new ReviewHttpError(400,'Unexpected correction query parameter.');
 if(!catalogue)throw new ReviewHttpError(503,'Current reference teaching is unavailable. Keep your edits.');
 const parsed=parseRegionalLearningReviewRequest({target:request.headers.get('X-Reference-Teaching-Target')??undefined,relation:request.headers.get('X-Reference-Teaching-Relation')??undefined,atlasRevision:request.headers.get('X-Reference-Teaching-Atlas')??undefined,mappingRevision:request.headers.get('X-Reference-Teaching-Mapping')??undefined,teachingRevision:request.headers.get('X-Reference-Teaching-Revision')??undefined});
 if(!parsed)throw new ReviewHttpError(400,'Invalid public reference teaching selection.');
 const snapshot=await resolveRegionalLearningReview(parsed,catalogue);
 if(!snapshot)throw new ReferenceDraftConflict('Reference teaching changed. Keep or export your edits and reload this page.','source-changed');
 return regionalReferenceDraftContext(snapshot);
}
function failure(error:unknown){
 if(error instanceof ReviewHttpError)return reviewJson({error:error.message,...(error instanceof ReferenceDraftConflict?{code:error.code}:{})},error.status);
 console.error(JSON.stringify({event:'regional-reference-teaching-storage-failed'}));
 return reviewJson({error:'Storage could not be confirmed. Keep your edits and compare saved history before retrying.'},503);
}
/** Call only through runClinicalReview, which supplies the authorized account/institution key. */
export async function getRegionalReferenceDrafts(request:Request,binding:Pick<D1Database,'prepare'>|undefined,catalogue:Regional3dCatalogue|null){
 try{
  const user=privateUser(request),context=await selection(request,catalogue),raw=request.headers.get('X-Reference-Teaching-Before');
  if(raw!==null&&!/^[1-9]\d{0,9}$/.test(raw))throw new ReviewHttpError(400,'Invalid correction history cursor.');
  const before=raw===null?2147483648:Number(raw);if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid correction history cursor.');
  const db=database(binding),history=await regionalReferenceDraftHistory(db,user,context,before);
  const latestVersion=raw===null?(history[0]?.version??0):((await regionalReferenceDraftHistory(db,user,context))[0]?.version??0);
  return reviewJson({context,history,latestVersion,nextBefore:history.length===20?history.at(-1)!.version:null,scope:'private-to-signed-in-account-and-institution'});
 }catch(error){return failure(error);}
}
export async function postRegionalReferenceDraft(request:Request,binding:Pick<D1Database,'prepare'>|undefined,catalogue:Regional3dCatalogue|null){
 try{
  const user=privateUser(request),context=await selection(request,catalogue);
  if(request.headers.has('X-Reference-Teaching-Before'))throw new ReviewHttpError(400,'History cursors are not accepted on a save.');
  const raw=await reviewBody(request);
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==3||!['context','expectedVersion','draft'].every(k=>Object.hasOwn(raw,k)))throw new ReviewHttpError(400,'Unexpected teaching correction field.');
  const input=raw as Record<string,unknown>;
  if(!sameRegionalReferenceDraftContext(input.context,context))throw new ReferenceDraftConflict('The reference or teaching revision changed. Keep your edits and reload this page.','source-changed');
  const expected=input.expectedVersion;if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid correction version.');
  let draft;try{draft=validateRegionalReferenceDraft(input.draft);}catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid correction draft.');}
  const db=database(binding),previous=(await regionalReferenceDraftHistory(db,user,context))[0];
  if((previous?.version??0)!==expected)throw new ReferenceDraftConflict('Another save changed this draft. Compare latest saved history before rebasing your edits.','version-conflict');
  const record=parseRegionalReferenceDraftEvent({eventSchema:'vm-regional-reference-teaching-draft-event-1',context,version:expected+1,savedAt:new Date().toISOString(),draft});
  if(!await appendRegionalReferenceDraft(db,user,record,expected))throw new ReferenceDraftConflict('Another save won the version check. Compare latest saved history before rebasing your edits.','version-conflict');
  return reviewJson({review:record},201);
 }catch(error){return failure(error);}
}
