import { bodyReviewContext } from './body-review-context';
import {
  appendBodyReview,
  bodyReviewHistory,
  latestBodyReviews,
} from './body-review-store';
import {
  bodyApprovalProblems,
  bodyDecisionScope,
  isBodyReviewTrack,
  validateBodyReviewDraft,
  type SavedBodyReview,
} from './body-review-decisions';
import {
  authenticatedReviewer,
  reviewBody,
  reviewJson,
  ReviewHttpError,
} from './review-http';

function failure(error: unknown) {
  if (error instanceof ReviewHttpError)
    return reviewJson({ error: error.message }, error.status);
  console.error(JSON.stringify({ event: 'body-review-storage-failed' }));
  return reviewJson(
    {
      error:
        'Storage could not be confirmed. Keep your edits, refresh saved records and compare before retrying.',
    },
    503,
  );
}
function database(db: D1Database | undefined) {
  if (!db)
    throw new ReviewHttpError(
      503,
      'Body review storage is unavailable. Keep your edits and try refreshing later.',
    );
  return db;
}
async function contextFor(id: unknown) {
  if (typeof id !== 'string' || !id || id.length > 256)
    throw new ReviewHttpError(400, 'Choose one valid body selection.');
  const context = await bodyReviewContext(id);
  if (!context)
    throw new ReviewHttpError(
      404,
      'This structure is outside the root-body review scope.',
    );
  return context;
}
export async function getBodyDecisions(
  request: Request,
  binding: D1Database | undefined,
) {
  try {
    const user = authenticatedReviewer(request.headers),
      url = new URL(request.url);
    if (
      ['structureId', 'track', 'before'].some(
        (key) => url.searchParams.getAll(key).length > 1,
      )
    )
      throw new ReviewHttpError(400, 'Duplicate review parameter.');
    const context = await contextFor(url.searchParams.get('structureId'));
    const track = url.searchParams.get('track');
    if (!isBodyReviewTrack(track))
      throw new ReviewHttpError(400, 'Choose a valid review track.');
    const before = Number(url.searchParams.get('before') ?? 2147483648);
    if (!Number.isSafeInteger(before) || before < 1 || before > 2147483648)
      throw new ReviewHttpError(400, 'Invalid history cursor.');
    const db = database(binding);
    const [reviews, history] = await Promise.all([
      latestBodyReviews(db, user, context.structureId),
      bodyReviewHistory(db, user, context.structureId, track, before),
    ]);
    return reviewJson({
      context,
      reviews,
      history,
      track,
      nextBefore: history.length === 20 ? history.at(-1)!.version : null,
      scope: 'private-to-signed-in-user',
    });
  } catch (error) {
    return failure(error);
  }
}
export async function postBodyDecision(
  request: Request,
  binding: D1Database | undefined,
) {
  try {
    const user = authenticatedReviewer(request.headers),
      raw = await reviewBody(request);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw new ReviewHttpError(400, 'Invalid save request.');
    const input = raw as Record<string, unknown>,
      track = input.track,
      expected = input.expectedVersion;
    if (input.catalogScope !== bodyDecisionScope || !isBodyReviewTrack(track))
      throw new ReviewHttpError(400, 'Wrong catalogue scope or review track.');
    if (
      typeof expected !== 'number' ||
      !Number.isSafeInteger(expected) ||
      expected < 0 ||
      expected > 2147483646
    )
      throw new ReviewHttpError(400, 'Invalid review version.');
    const context = await contextFor(input.structureId);
    if (
      input.materialHash !== context.materialHash ||
      input.revisionHash !== context.revisions[track] ||
      input.checklistVersion !== context.checklistVersion
    )
      throw new ReviewHttpError(
        409,
        'The material or checklist changed. Preserve your edits and reload the current worksheet before re-reviewing.',
      );
    let draft;
    try {
      draft = validateBodyReviewDraft(input.draft, context.checklists[track]);
    } catch (error) {
      throw new ReviewHttpError(
        422,
        error instanceof Error ? error.message : 'Invalid review.',
      );
    }
    if (draft.status === 'approved') {
      const problems = bodyApprovalProblems(draft, context, track);
      if (problems.length) throw new ReviewHttpError(422, problems.join(' '));
    }
    const db = database(binding);
    const previous = (
      await bodyReviewHistory(db, user, context.structureId, track)
    )[0];
    if ((previous?.version ?? 0) !== expected)
      throw new ReviewHttpError(
        409,
        'Another save changed this review. Refresh saved records and compare your edits.',
      );
    if (
      previous?.issues.some(
        (issue) => !draft.issues.some((next) => next.id === issue.id),
      )
    )
      throw new ReviewHttpError(
        422,
        'Saved issues cannot be deleted. Resolve them with an explanation.',
      );
    const now = new Date().toISOString();
    const review: SavedBodyReview = {
      ...draft,
      eventSchema: 'vm-body-review-event-1',
      catalogScope: bodyDecisionScope,
      structureId: context.structureId,
      track,
      version: expected + 1,
      savedAt: now,
      reviewedAt: draft.status === 'approved' ? now : null,
      revisionHash: context.revisions[track],
      checklistVersion: context.checklistVersion,
      checklist: context.checklists[track],
      material: {
        sourceHash: context.sourceHash,
        teachingHash: context.teachingHash,
        rendererHash: context.rendererHash,
        materialHash: context.materialHash,
        teachingTabs: context.teachingTabs,
      },
    };
    if (!(await appendBodyReview(db, user, review, expected)))
      throw new ReviewHttpError(
        409,
        'Another save won the version check. Refresh saved records and compare your edits.',
      );
    return reviewJson({ review }, 201);
  } catch (error) {
    return failure(error);
  }
}
