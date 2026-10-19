import { parseFrozenReviewEvent, type FrozenReviewEvent } from './frozen-review-contract';
import { bodyReviewTracks, type BodyReviewTrack } from '../atlas-review/lib/body-review-decisions';

type EventRow = {
  user_key: string;
  candidate_id: string;
  structure_id: string;
  track: string;
  version: number;
  payload: string;
  saved_at: string;
};

type FrozenReviewDatabase = Pick<D1Database, 'prepare'>;

const candidatePattern = /^[a-f0-9]{64}$/;

function key(value: string, label: string, max: number): string {
  if (typeof value !== 'string' || !value || value.length > max || /[\u0000-\u001f\u007f]/.test(value))
    throw new Error(`Invalid ${label}`);
  return value;
}

function candidate(value: string): string {
  if (typeof value !== 'string' || !candidatePattern.test(value))
    throw new Error('Invalid candidate ID');
  return value;
}

function structure(value: string): string {
  return key(value, 'structure ID', 256);
}

function track(value: BodyReviewTrack): BodyReviewTrack {
  if (!bodyReviewTracks.includes(value)) throw new Error('Invalid review track');
  return value;
}

function parsedRow(row: EventRow, userKey: string, candidateId: string, structureId: string, expectedTrack?: BodyReviewTrack): FrozenReviewEvent {
  if (row.user_key !== userKey || row.candidate_id !== candidateId || row.structure_id !== structureId ||
      (expectedTrack !== undefined && row.track !== expectedTrack) ||
      !Number.isSafeInteger(row.version) || row.version < 1 || row.version > 2147483647 ||
      typeof row.payload !== 'string' || row.payload.length > 131072 ||
      typeof row.saved_at !== 'string')
    throw new Error('Frozen review row does not match its storage key');
  const event = parseFrozenReviewEvent(JSON.parse(row.payload));
  if (event.candidateId !== row.candidate_id || event.review.structureId !== row.structure_id ||
      event.review.track !== row.track || event.review.version !== row.version ||
      event.review.savedAt !== row.saved_at)
    throw new Error('Frozen review payload does not match its storage row');
  return event;
}

export async function latestFrozenReviews(db: FrozenReviewDatabase, userKey: string, candidateId: string, structureId: string): Promise<FrozenReviewEvent[]> {
  key(userKey, 'user key', 4096);
  candidate(candidateId);
  structure(structureId);
  const rows = await db.prepare(`SELECT user_key,candidate_id,structure_id,track,version,payload,saved_at
    FROM atlas_candidate_review_events AS e WHERE user_key=?1 AND candidate_id=?2 AND structure_id=?3
    AND version=(SELECT MAX(version) FROM atlas_candidate_review_events
      WHERE user_key=?1 AND candidate_id=?2 AND structure_id=?3 AND track=e.track)`)
    .bind(userKey, candidateId, structureId).all<EventRow>();
  return rows.results.map(row => parsedRow(row, userKey, candidateId, structureId));
}

export async function frozenReviewHistory(db: FrozenReviewDatabase, userKey: string, candidateId: string, structureId: string,
  reviewTrack: BodyReviewTrack, before = 2147483648): Promise<FrozenReviewEvent[]> {
  key(userKey, 'user key', 4096);
  candidate(candidateId);
  structure(structureId);
  track(reviewTrack);
  if (!Number.isSafeInteger(before) || before < 1 || before > 2147483648)
    throw new Error('Invalid history cursor');
  const rows = await db.prepare(`SELECT user_key,candidate_id,structure_id,track,version,payload,saved_at
    FROM atlas_candidate_review_events WHERE user_key=?1 AND candidate_id=?2 AND structure_id=?3
    AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`)
    .bind(userKey, candidateId, structureId, reviewTrack, before).all<EventRow>();
  return rows.results.map(row => parsedRow(row, userKey, candidateId, structureId, reviewTrack));
}

export async function appendFrozenReview(db: FrozenReviewDatabase, userKey: string, input: FrozenReviewEvent,
  expectedVersion: number): Promise<boolean> {
  key(userKey, 'user key', 4096);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || expectedVersion >= 2147483647)
    throw new Error('Invalid expected version');
  const event = parseFrozenReviewEvent(input);
  candidate(event.candidateId);
  structure(event.review.structureId);
  track(event.review.track);
  if (event.review.version !== expectedVersion + 1) throw new Error('Invalid append version');
  const payload = JSON.stringify(event);
  if (payload.length > 131072) throw new Error('Frozen review payload exceeds storage limit');
  try {
    const result = await db.prepare(`INSERT INTO atlas_candidate_review_events
      (user_key,candidate_id,structure_id,track,version,payload,saved_at)
      SELECT ?1,?2,?3,?4,?5,?6,?7
      WHERE COALESCE((SELECT MAX(version) FROM atlas_candidate_review_events
        WHERE user_key=?1 AND candidate_id=?2 AND structure_id=?3 AND track=?4),0)=?8`)
      .bind(userKey, event.candidateId, event.review.structureId, event.review.track,
        event.review.version, payload, event.review.savedAt, expectedVersion).run();
    return result.meta.changes === 1;
  } catch (error) {
    // A competing writer can pass the SELECT at the same version; the composite
    // primary key decides the race. Other D1 failures must remain visible.
    const message = String(error);
    if (/UNIQUE constraint failed: atlas_candidate_review_events\.user_key, atlas_candidate_review_events\.candidate_id, atlas_candidate_review_events\.structure_id, atlas_candidate_review_events\.track, atlas_candidate_review_events\.version/i.test(message))
      return false;
    throw error;
  }
}
