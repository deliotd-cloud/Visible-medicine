import manifest from './plexus-review-manifest.json' with { type: 'json' };
import { authenticatedReviewer, reviewBody, reviewJson, ReviewHttpError } from '../atlas-review/lib/review-http.ts';
import { plexusCandidateId, plexusReviewScope, type PlexusReviewContext } from './plexus-review-contract.ts';
import { isPlexusReviewTrack, parseSavedPlexusReview, plexusApprovalProblems,
  validatePlexusReviewContext, type SavedPlexusReview } from './plexus-review-decisions.ts';
import { appendPlexusReview, plexusReviewHistory } from './plexus-review-store.ts';
import { validateBodyReviewDraft } from '../atlas-review/lib/body-review-decisions.ts';

const currentContext = (): PlexusReviewContext => validatePlexusReviewContext(manifest.context);
const privateUser = (request:Request) => JSON.stringify(['vm-schematic-personal-review-1',authenticatedReviewer(request.headers)]);
const database = (binding:Pick<D1Database,'prepare'>|undefined) => {
  if (!binding) throw new ReviewHttpError(503,'Schematic review storage is unavailable.');
  return binding;
};
function failure(error:unknown) {
  if (error instanceof ReviewHttpError) return reviewJson({error:error.message},error.status);
  console.error(JSON.stringify({event:'plexus-review-storage-failed'}));
  return reviewJson({error:'Storage could not be confirmed. Keep your edits and compare saved history before retrying.'},503);
}
function noQuery(request:Request) {
  if (new URL(request.url).searchParams.size) throw new ReviewHttpError(400,'Unexpected review query parameter.');
}
export async function getPlexusReviews(request:Request,binding:Pick<D1Database,'prepare'>|undefined) {
  try {
    const user = privateUser(request), url = new URL(request.url), allowed = new Set(['track','before']);
    for (const key of url.searchParams.keys())
      if (!allowed.has(key) || url.searchParams.getAll(key).length !== 1) throw new ReviewHttpError(400,'Unexpected or duplicate review parameter.');
    const track = url.searchParams.get('track');
    if (!isPlexusReviewTrack(track)) throw new ReviewHttpError(400,'Choose one valid schematic review track.');
    const rawBefore = url.searchParams.get('before');
    if (rawBefore !== null && !/^[1-9]\d{0,9}$/.test(rawBefore)) throw new ReviewHttpError(400,'Invalid history cursor.');
    const before = rawBefore === null ? 2147483648 : Number(rawBefore);
    if (!Number.isSafeInteger(before) || before < 1 || before > 2147483648) throw new ReviewHttpError(400,'Invalid history cursor.');
    const context = currentContext();
    const history = await plexusReviewHistory(database(binding),user,track,before);
    return reviewJson({context,history,track,nextBefore:history.length === 20 ? history.at(-1)!.version : null,
      scope:'private-to-signed-in-user'});
  } catch (error) { return failure(error); }
}

export async function postPlexusReview(request:Request,binding:Pick<D1Database,'prepare'>|undefined) {
  try {
    const user = privateUser(request);
    noQuery(request);
    const raw = await reviewBody(request);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ReviewHttpError(400,'Invalid schematic review save request.');
    const input = raw as Record<string,unknown>;
    const keys = ['catalogScope','candidateId','frame','sourceCommit','track','materialHash','revisionHash','checklistVersion','expectedVersion','draft'];
    if (Object.keys(input).length !== keys.length || Object.keys(input).some(k => !keys.includes(k)))
      throw new ReviewHttpError(400,'Unexpected review field.');
    const context = currentContext(), track = input.track;
    if (input.catalogScope !== plexusReviewScope || input.candidateId !== plexusCandidateId || !isPlexusReviewTrack(track) ||
        !input.frame || typeof input.frame !== 'object' || Array.isArray(input.frame) ||
        Object.keys(input.frame).length !== 3 ||
        (input.frame as Record<string,unknown>).kind !== 'diagrammatic' ||
        (input.frame as Record<string,unknown>).units !== 'arbitrary' ||
        (input.frame as Record<string,unknown>).patientRegistration !== false ||
        input.sourceCommit !== context.sourceCommit)
      throw new ReviewHttpError(400,'Wrong schematic identity or frame.');
    const expected = input.expectedVersion;
    if (typeof expected !== 'number' || !Number.isSafeInteger(expected) || expected < 0 || expected > 2147483646)
      throw new ReviewHttpError(400,'Invalid review version.');
    if (input.materialHash !== context.materialHash || input.revisionHash !== context.revisions[track] ||
        input.checklistVersion !== context.checklistVersion)
      throw new ReviewHttpError(409,'The schematic material or checklist changed. Preserve your edits and reload before re-reviewing.');
    let draft;
    try { draft = validateBodyReviewDraft(input.draft,context.checklists[track]); }
    catch (error) { throw new ReviewHttpError(422,error instanceof Error ? error.message : 'Invalid review.'); }
    if (draft.status === 'approved') {
      const problems = plexusApprovalProblems(draft,context,track);
      if (problems.length) throw new ReviewHttpError(422,problems.join(' '));
    }
    const db = database(binding), previous = (await plexusReviewHistory(db,user,track))[0];
    if ((previous?.version ?? 0) !== expected) throw new ReviewHttpError(409,'Another save changed this review. Refresh and compare your edits.');
    if (previous?.issues.some(issue => !draft.issues.some(next => next.id === issue.id)))
      throw new ReviewHttpError(422,'Saved issues cannot be deleted. Resolve them with an explanation.');
    const now = new Date().toISOString();
    const saved:SavedPlexusReview = parseSavedPlexusReview({...draft,
      eventSchema:'vm-plexus-schematic-review-event-1',context,track,version:expected+1,
      savedAt:now,reviewedAt:draft.status === 'approved' ? now : null,revisionHash:context.revisions[track]});
    if (!(await appendPlexusReview(db,user,saved,expected)))
      throw new ReviewHttpError(409,'Another save won the version check. Refresh and compare your edits.');
    return reviewJson({review:saved},201);
  } catch (error) { return failure(error); }
}
