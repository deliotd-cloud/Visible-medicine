import {resolveCandidate} from './clinical-review-candidate.ts';
import {frozenReviewContext,makeFrozenReviewEvent,validateFrozenReviewEvent,parseFrozenDecisionPage} from './frozen-review-contract.ts';
import {latestFrozenReviews,frozenReviewHistory,appendFrozenReview} from './frozen-review-store.ts';
import {isBodyReviewTrack} from '../atlas-review/lib/body-review-decisions.ts';
import {authenticatedReviewer,reviewBody,reviewJson,ReviewHttpError} from '../atlas-review/lib/review-http.ts';

function failed(error:unknown){
  if(error instanceof ReviewHttpError)return reviewJson({error:error.message},error.status);
  // No payload, reviewer name, evidence, account key or database diagnostics.
  console.error(JSON.stringify({event:'frozen-review-storage-unconfirmed'}));
  return reviewJson({error:'Saved review storage could not be confirmed. Keep your draft and refresh saved history before trying again.'},503);
}
function database(binding:D1Database|undefined){if(!binding)throw new ReviewHttpError(503,'Review storage is unavailable. Keep your draft.');return binding.withSession('first-primary');}
async function selected(registry:readonly unknown[],candidateId:string,structureId:unknown){
  if(typeof structureId!=='string'||!structureId||structureId.length>256)throw new ReviewHttpError(400,'Choose one valid saved structure.');
  const candidate=await resolveCandidate(registry,candidateId);
  if(!candidate)throw new ReviewHttpError(404,'Saved candidate was not found.');
  if(candidate.decisionMode!=='personal-review')throw new ReviewHttpError(409,'This candidate is permanently inspection-only. No decision was recorded.');
  if(!candidate.selections.some(s=>s.structureId===structureId))throw new ReviewHttpError(404,'Structure is outside this saved candidate.');
  return {candidate,context:await frozenReviewContext(candidate,structureId)};
}
/** Route must call through runClinicalReview and the existing administrator-model gate. */
export async function getFrozenDecisions(request:Request,candidateId:string,registry:readonly unknown[],binding:D1Database|undefined){
  try{
    const user=authenticatedReviewer(request.headers),query=new URL(request.url).searchParams;
    if(request.method!=='GET')throw new ReviewHttpError(405,'Use GET to read saved reviews.');
    if([...query.keys()].some(k=>!['structureId','track','before'].includes(k)||query.getAll(k).length!==1))throw new ReviewHttpError(400,'Invalid or duplicate review parameter.');
    const track=query.get('track');if(!isBodyReviewTrack(track))throw new ReviewHttpError(400,'Choose a valid review track.');
    const before=Number(query.get('before')??2147483648);if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw new ReviewHttpError(400,'Invalid history cursor.');
    const {candidate,context}=await selected(registry,candidateId,query.get('structureId')),db=database(binding);
    // Read history before latest on the same primary session: an intervening
    // append may give a newer latest, but must not make history newer than it.
    const history=await frozenReviewHistory(db,user,candidateId,context.structureId,track,before);
    const reviews=await latestFrozenReviews(db,user,candidateId,context.structureId);
    const page=await parseFrozenDecisionPage({schema:'vm-frozen-body-decision-page-1',scope:'private-to-signed-in-account-and-institution',candidate,context,reviews,history,track,nextBefore:history.length===20?history.at(-1)!.review.version:null},candidateId,context.structureId);
    return reviewJson(page);
  }catch(error){return failed(error);}
}
export async function postFrozenDecision(request:Request,candidateId:string,registry:readonly unknown[],binding:D1Database|undefined){
  try{
    const user=authenticatedReviewer(request.headers);
    if(request.method!=='POST')throw new ReviewHttpError(405,'Use POST to save a private review.');
    const raw=await reviewBody(request);
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new ReviewHttpError(400,'Invalid review request.');
    const input=raw as Record<string,unknown>,keys=['schema','candidateId','structureId','track','expectedVersion','contextHash','revisionHash','materialHash','draft'];
    if(Object.keys(input).length!==keys.length||!keys.every(k=>Object.hasOwn(input,k))||input.schema!=='vm-frozen-body-review-save-1'||input.candidateId!==candidateId||!isBodyReviewTrack(input.track))throw new ReviewHttpError(400,'Review scope does not match this candidate.');
    const expected=input.expectedVersion,track=input.track;
    if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0||expected>2147483646)throw new ReviewHttpError(400,'Invalid review version.');
    const {context}=await selected(registry,candidateId,input.structureId);
    if(input.contextHash!==context.contextHash||input.revisionHash!==context.revisions[track]||input.materialHash!==context.materialHash)throw new ReviewHttpError(409,'The review does not match this frozen candidate. Keep your draft and reload its saved history.');
    let event;
    try{event=makeFrozenReviewEvent(input.draft,context,track,expected+1,new Date().toISOString());}
    catch(error){throw new ReviewHttpError(422,error instanceof Error?error.message:'Invalid private review.');}
    const db=database(binding),previous=(await frozenReviewHistory(db,user,candidateId,context.structureId,track))[0];
    if(previous)validateFrozenReviewEvent(previous,context,track);
    if((previous?.review.version??0)!==expected)throw new ReviewHttpError(409,'Another save changed this review. Keep your draft and compare refreshed saved history.');
    if(previous?.review.issues.some(issue=>!event.review.issues.some(next=>next.id===issue.id)))throw new ReviewHttpError(422,'Saved issues cannot be deleted. Resolve them with an explanation.');
    if(!await appendFrozenReview(db,user,event,expected))throw new ReviewHttpError(409,'Another save won the version check. Keep your draft and compare refreshed history.');
    return reviewJson({schema:'vm-frozen-body-review-saved-1',candidateId,contextHash:context.contextHash,event},201);
  }catch(error){return failed(error);}
}
