import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';
import type {RegionalMriReviewProjection} from './regional-mri-package';
import {regionalMriCorrectionContext,sameRegionalMriCorrectionContext,validateRegionalMriCorrectionDraft,parseRegionalMriCorrectionEvent} from './regional-mri-correction-contract.ts';
import {regionalMriCorrectionHistory,appendRegionalMriCorrection} from './regional-mri-correction-store.ts';
const privateUser=(request:Request)=>JSON.stringify(['vm-regional-mri-personal-corrections-1',authenticatedReviewer(request.headers)]);
const database=(binding:Pick<D1Database,'prepare'>|undefined)=>{if(!binding)throw new ReviewHttpError(503,'Private correction storage is unavailable.');return binding;};
function selection(request:Request,projection:RegionalMriReviewProjection|null){
 if(!projection)throw new ReviewHttpError(503,'An independently bound local source context is required.');
 if(new URL(request.url).searchParams.size)throw new ReviewHttpError(400,'Unexpected correction query parameter.');
 if(request.headers.get('X-Regional-MRI-Source')!==projection.sourceRevision||request.headers.get('X-Regional-MRI-Projection')!==projection.projectionRevision)
  throw new ReviewHttpError(409,'The MRI source context changed. Keep your edits and reopen the current source.');
 const context=regionalMriCorrectionContext(projection,request.headers.get('X-Regional-MRI-Sequence')??'',request.headers.get('X-Regional-MRI-Annotation')??'');
 if(!context)throw new ReviewHttpError(404,'No current source annotation matches this selection.');
 return context;
}
function failure(error:unknown){
 if(error instanceof ReviewHttpError)return reviewJson({error:error.message},error.status);
 console.error(JSON.stringify({event:'regional-mri-correction-storage-failed'}));
 return reviewJson({error:'Storage could not be confirmed. Keep your edits and compare saved history before retrying.'},503);
}
/** Only call through runClinicalReview, which replaces identity with the authorized principal. */
export async function getRegionalMriCorrections(request:Request,binding:Pick<D1Database,'prepare'>|undefined,projection:RegionalMriReviewProjection|null){
 try{
  const user=privateUser(request),context=selection(request,projection),raw=request.headers.get('X-Regional-MRI-Before');
  if(raw!==null&&!/^[1-9]\d{0,9}$/.test(raw))throw new ReviewHttpError(400,'Invalid correction history cursor.');
  const before=raw===null?2147483648:Number(raw);if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid correction history cursor.');
  const db=database(binding),history=await regionalMriCorrectionHistory(db,user,context,before);
  const latestVersion=raw===null?(history[0]?.version??0):((await regionalMriCorrectionHistory(db,user,context))[0]?.version??0);
  return reviewJson({context,history,latestVersion,nextBefore:history.length===20?history.at(-1)!.version:null,scope:'private-to-signed-in-account-and-institution'});
 }catch(error){return failure(error);}
}
export async function postRegionalMriCorrection(request:Request,binding:Pick<D1Database,'prepare'>|undefined,projection:RegionalMriReviewProjection|null){
 try{
  const user=privateUser(request),context=selection(request,projection),input=await reviewBody(request);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==3||!['context','expectedVersion','draft'].every(k=>Object.hasOwn(input,k)))throw new ReviewHttpError(400,'Unexpected correction field.');
  const raw=input as Record<string,unknown>;
  if(!sameRegionalMriCorrectionContext(raw.context,context))throw new ReviewHttpError(409,'The annotation or source review changed. Keep your edits and reload history.');
  const expected=raw.expectedVersion;if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid correction version.');
  let draft;try{draft=validateRegionalMriCorrectionDraft(raw.draft);}catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid correction draft.');}
  const db=database(binding),previous=(await regionalMriCorrectionHistory(db,user,context))[0];
  if((previous?.version??0)!==expected)throw new ReviewHttpError(409,'Another save changed this correction. Compare saved history before retrying.');
  const event=parseRegionalMriCorrectionEvent({eventSchema:'vm-regional-mri-correction-event-1',context,version:expected+1,savedAt:new Date().toISOString(),draft});
  if(!await appendRegionalMriCorrection(db,user,event,expected))throw new ReviewHttpError(409,'Another save won the version check. Compare saved history before retrying.');
  return reviewJson({review:event},201);
 }catch(error){return failure(error);}
}
