import { env } from 'cloudflare:workers';
import { structures } from '../../anatomy-data';
import {
  tracks,
  currentRevision,
  checklistVersion,
  validateDraft,
  type SavedReview,
  type ReviewTrack,
} from '../../../lib/review-workspace';
import {
  latestReviews,
  reviewHistory,
  appendReview,
} from '../../../lib/review-store';
import {
  authenticatedReviewer,
  reviewBody,
  reviewJson,
  ReviewHttpError,
} from '../../../lib/review-http';

export const dynamic = 'force-dynamic';
function database() {
  if (!env.DB)
    throw new ReviewHttpError(
      503,
      'Review storage is unavailable. Nothing has been saved.',
    );
  return env.DB;
}
function validTarget(id: string | null, track: string | null) {
  if (
    !structures.some((s) => s.id === id) ||
    !tracks.includes(track as ReviewTrack)
  )
    throw new ReviewHttpError(
      400,
      'Unknown shoulder structure or review track.',
    );
}
function failure(error: unknown) {
  if (error instanceof ReviewHttpError)
    return reviewJson({ error: error.message }, error.status);
  console.error(JSON.stringify({ event: 'review-storage-failed' }));
  return reviewJson(
    {
      error:
        'Review storage could not be reached. Your unsaved edits remain on this page; retry saving.',
    },
    503,
  );
}
export async function GET(request: Request) {
  try {
    const userId = authenticatedReviewer(request.headers),
      db = database(),
      url = new URL(request.url);
    if (url.searchParams.get('history') === '1') {
      const id = url.searchParams.get('structureId'),
        track = url.searchParams.get('track');
      validTarget(id, track);
      const before = Number(url.searchParams.get('before') ?? 2147483647);
      if (!Number.isSafeInteger(before) || before < 1)
        throw new ReviewHttpError(400, 'Invalid history cursor.');
      const history = await reviewHistory(
        db,
        userId,
        id!,
        track as ReviewTrack,
        before,
      );
      return reviewJson({
        history,
        nextBefore: history.length === 20 ? history.at(-1)!.version : null,
      });
    }
    const reviews = await latestReviews(db, userId);
    return reviewJson({ reviews, scope: 'private-to-signed-in-user' });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const userId = authenticatedReviewer(request.headers);
    const raw = await reviewBody(request);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw new ReviewHttpError(400, 'Invalid save request.');
    const input = raw as Record<string, unknown>;
    const id = typeof input.structureId === 'string' ? input.structureId : null,
      track = typeof input.track === 'string' ? input.track : null;
    validTarget(id, track);
    const expected = input.expectedVersion;
    if (
      typeof expected !== 'number' ||
      !Number.isSafeInteger(expected) ||
      expected < 0 ||
      expected > 2147483646
    )
      throw new ReviewHttpError(400, 'Invalid review version.');
    const current = currentRevision(id!, track as ReviewTrack);
    if (
      input.revisionHash !== current ||
      input.checklistVersion !== checklistVersion
    )
      throw new ReviewHttpError(
        409,
        'The material or checklist changed. Reload and review the current version before saving.',
      );
    let draft;
    try {
      draft = validateDraft(input.draft, id!, track as ReviewTrack);
    } catch (error) {
      throw new ReviewHttpError(
        422,
        error instanceof Error ? error.message : 'Invalid review.',
      );
    }
    const db = database();
    const previous = (
      await reviewHistory(db, userId, id!, track as ReviewTrack)
    )[0];
    if (
      previous &&
      previous.issues.some(
        (issue) => !draft.issues.some((next) => next.id === issue.id),
      )
    )
      throw new ReviewHttpError(
        422,
        'Saved issues cannot be removed. Resolve them with an explanation instead.',
      );
    const now = new Date().toISOString();
    const review: SavedReview = {
      ...draft,
      structureId: id!,
      track: track as ReviewTrack,
      version: expected + 1,
      savedAt: now,
      reviewedAt: draft.status === 'approved' ? now : null,
      revisionHash: current,
      checklistVersion,
    };
    if (!(await appendReview(db, userId, review, expected)))
      throw new ReviewHttpError(
        409,
        'Another save changed this review. Refresh saved reviews, compare your edits, then save again.',
      );
    return reviewJson({ review }, 201);
  } catch (error) {
    return failure(error);
  }
}
