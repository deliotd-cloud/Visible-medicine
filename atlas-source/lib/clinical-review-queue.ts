import { findClinicalReviewEntries, type ClinicalReviewEntry } from './clinical-review-index';
import { authenticatedReviewer, reviewJson, ReviewHttpError } from './review-http';
import { latestReviews } from './review-store';
import { latestBodyReviews } from './body-review-store';
import { nestedReviewHistory } from './nested-review-store';
import { specimenReviewHistory } from './specimen-review-store';
import { bodyReviewContext } from './body-review-context';
import { nestedReviewMaterial } from './nested-review-material';
import { specimenReviewMaterial } from './specimen-review-material';
import { staleReview, validateDraft, type SavedReview } from './review-workspace';
import { bodyReviewStale, bodyApprovalProblems } from './body-review-decisions';
import { nestedReviewStale, nestedApprovalProblems } from './nested-review';
import { specimenReviewStale, specimenApprovalProblems } from './specimen-review';
import type { ClinicalStatus, ClinicalStatusItem } from './clinical-review-status';
import type { ClinicalPriorityItem, ClinicalChangeReason } from './clinical-review-priority';
import { reviewChangeReason } from './review-change-reason';

function status(saved: { status: string } | undefined, stale: boolean, validApproval = true): ClinicalStatus {
  if (!saved) return 'not-started';
  if (!['draft', 'changes-required', 'approved'].includes(saved.status)) throw Error('Invalid saved status');
  if (stale) return 're-review';
  if (saved.status === 'approved') return validApproval ? 'approval-recorded' : 'unavailable';
  return saved.status === 'changes-required' ? 'changes-required' : 'in-progress';
}
const tracks = ['geometry', 'teaching'] as const;

export type ClinicalReviewTrackRevisions = Readonly<{ geometry: string | null; teaching: string | null }>;
export type ClinicalReviewRevisionObserver =
  (key: string, revisions: Promise<ClinicalReviewTrackRevisions | null>) => void;

function observeMaterial<T>(
  key: string, source: Promise<T | null>, observer: ClinicalReviewRevisionObserver | undefined,
  context: (value: T) => { revisions: ClinicalReviewTrackRevisions },
): Promise<T | null> {
  if (observer) {
    const revisions = source.then(value => {
      if (!value) return null;
      const hashes = context(value).revisions;
      return { geometry: hashes.geometry, teaching: hashes.teaching };
    }, () => null).catch(() => null);
    observer(key, revisions);
  }
  return source;
}

/** Bounded read-only personal snapshot. This does not authorize publication or
 * institution access. The existing trusted Sites identity boundary still applies. */
export async function getClinicalReviewQueue(request: Request, db: D1Database | undefined) {
  return clinicalReviewQueue(request, db, false);
}

/** Trusted caller opt-in; no public route or query parameter selects this shape. */
export async function getClinicalReviewQueueWithReasons(request: Request, db: D1Database | undefined,
  observeRevisions?: ClinicalReviewRevisionObserver) {
  return clinicalReviewQueue(request, db, true, observeRevisions);
}

async function clinicalReviewQueue(request: Request, db: D1Database | undefined, withReasons: boolean,
  observeRevisions?: ClinicalReviewRevisionObserver) {
  try {
    const user = authenticatedReviewer(request.headers);
    const params = new URL(request.url).searchParams;
    for (const key of params.keys()) {
      if (!['q', 'scope', 'page'].includes(key) || params.getAll(key).length !== 1)
        throw new ReviewHttpError(400, 'Invalid review search parameters.');
    }
    if (!db) throw new ReviewHttpError(503, 'Saved review status is unavailable.');
    const entries = findClinicalReviewEntries(Object.fromEntries(params)).entries;
    // Shoulder is a fixed nine-structure catalogue. Its existing reader returns
    // at most one latest record per track; load it once, never once per row.
    let shoulder: Promise<SavedReview[]> | undefined;
    const read = async (entry: ClinicalReviewEntry): Promise<ClinicalStatusItem | ClinicalPriorityItem> => {
      try {
        const values: ClinicalStatus[] = [];
        const reasons: (ClinicalChangeReason | null)[] = [null, null];
        if (entry.scope === 'shoulder') {
          shoulder ??= latestReviews(db, user);
          const rows = (await shoulder).filter(r => r.structureId === entry.id);
          for (const track of tracks) {
            const matches = rows.filter(r => r.track === track);
            if (matches.length > 1) throw Error('Duplicate saved track');
            const saved = matches[0];
            if (saved && (!Number.isSafeInteger(saved.version) || saved.version < 1
              || typeof saved.checklistVersion !== 'string'
              || (saved.revisionHash !== null && typeof saved.revisionHash !== 'string')))
              throw Error('Invalid saved review');
            const stale = !!saved && staleReview(saved);
            if (saved && !stale) validateDraft(saved, entry.id, track);
            values.push(status(saved, stale));
          }
        } else if (entry.scope === 'body') {
          const contextSource = observeMaterial(entry.key, bodyReviewContext(entry.id), observeRevisions, value => value);
          const [context, rows] = await Promise.all([contextSource, latestBodyReviews(db, user, entry.id)]);
          if (!context) throw Error('Missing body context');
          for (const [index, track] of tracks.entries()) {
            const matches = rows.filter(r => r.track === track);
            if (matches.length > 1) throw Error('Duplicate saved track');
            const saved = matches[0];
            const state = status(saved, !!saved && bodyReviewStale(saved, context),
              !saved || saved.status !== 'approved' || bodyApprovalProblems(saved, context, track).length === 0);
            values.push(state);
            if (withReasons && saved && state === 're-review')
              reasons[index] = await reviewChangeReason('body', saved, context, track);
          }
        } else {
          // Keys originate in the server's canonical index, never in a client's
          // claimed specimen/parent mapping or reviewer identifier.
          const [sourceKey, id] = JSON.parse(entry.key.slice(entry.scope.length + 1)) as [string, string];
          if (id !== entry.id) throw Error('Review selection mismatch');
          if (entry.scope === 'nested') {
            const material = await observeMaterial(entry.key, nestedReviewMaterial(sourceKey, id),
              observeRevisions, value => value.context);
            if (!material) throw Error('Missing nested context');
            for (const [index, track] of tracks.entries()) {
              const saved = (await nestedReviewHistory(db, user, sourceKey, id, track))[0];
              const state = status(saved, !!saved && nestedReviewStale(saved, material.context),
                !saved || saved.status !== 'approved' || nestedApprovalProblems(saved, material.context, track).length === 0);
              values.push(state);
              if (withReasons && saved && state === 're-review')
                reasons[index] = await reviewChangeReason('nested', saved, material.context, track);
            }
          } else {
            const material = await observeMaterial(entry.key, specimenReviewMaterial(sourceKey, id),
              observeRevisions, value => value.context);
            if (!material) throw Error('Missing specimen context');
            for (const [index, track] of tracks.entries()) {
              const saved = (await specimenReviewHistory(db, user, sourceKey, id, track))[0];
              const state = status(saved, !!saved && specimenReviewStale(saved, material.context),
                !saved || saved.status !== 'approved' || specimenApprovalProblems(saved, material.context, track).length === 0);
              values.push(state);
              if (withReasons && saved && state === 're-review')
                reasons[index] = await reviewChangeReason('specimen', saved, material.context, track);
            }
          }
        }
        const item = { key: entry.key, geometry: values[0], teaching: values[1] };
        return withReasons ? { ...item, geometryReason: reasons[0], teachingReason: reasons[1] } : item;
      } catch {
        // Failure/corruption is not evidence that no review exists. Do not leak
        // database errors or fall back to an older, superseded approval.
        const item = { key: entry.key, geometry: 'unavailable' as const, teaching: 'unavailable' as const };
        return withReasons ? { ...item, geometryReason: null, teachingReason: null } : item;
      }
    };
    const items = await Promise.all(entries.map(read));
    return reviewJson(withReasons
      ? { schema: 'vm-clinical-priority-1', scope: 'private-to-signed-in-user', items }
      : { scope: 'private-to-signed-in-user', items });
  } catch (error) {
    return reviewJson({ error: error instanceof ReviewHttpError ? error.message : 'Saved review status is unavailable.' },
      error instanceof ReviewHttpError ? error.status : 503);
  }
}
