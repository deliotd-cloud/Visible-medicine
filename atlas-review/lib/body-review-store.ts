import {
  parseSavedBodyReview,
  type SavedBodyReview,
  type BodyReviewTrack,
} from './body-review-decisions';

type EventRow = {
  payload: string;
  version: number;
  structure_id: string;
  track: string;
};
function parseRow(row: EventRow, id: string, track?: BodyReviewTrack) {
  const parsed = parseSavedBodyReview(JSON.parse(row.payload));
  if (
    row.structure_id !== id ||
    parsed.structureId !== id ||
    row.track !== parsed.track ||
    (track && parsed.track !== track) ||
    row.version !== parsed.version
  )
    throw new Error('Body review row does not match its storage key');
  return parsed;
}
export async function latestBodyReviews(
  db: D1Database,
  user: string,
  id: string,
) {
  const rows = await db
    .prepare(`SELECT payload,version,structure_id,track FROM atlas_personal_body_review_events
    WHERE user_id=?1 AND structure_id=?2 AND (track,version) IN
      (SELECT track,MAX(version) FROM atlas_personal_body_review_events WHERE user_id=?1 AND structure_id=?2 GROUP BY track)`)
    .bind(user, id)
    .all<EventRow>();
  return rows.results.map((row) => parseRow(row, id));
}
export async function bodyReviewHistory(
  db: D1Database,
  user: string,
  id: string,
  track: BodyReviewTrack,
  before = 2147483648,
) {
  const rows = await db
    .prepare(
      'SELECT payload,version,structure_id,track FROM atlas_personal_body_review_events WHERE user_id=?1 AND structure_id=?2 AND track=?3 AND version<?4 ORDER BY version DESC LIMIT 20',
    )
    .bind(user, id, track, before)
    .all<EventRow>();
  return rows.results.map((row) => parseRow(row, id, track));
}
export async function appendBodyReview(
  db: D1Database,
  user: string,
  review: SavedBodyReview,
  expected: number,
) {
  // One atomic statement: stale clients cannot overwrite or create parallel versions.
  if (review.version !== expected + 1)
    throw new Error('Invalid append version');
  const record = parseSavedBodyReview(review);
  const result = await db
    .prepare(`INSERT INTO atlas_personal_body_review_events(user_id,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6 WHERE COALESCE((SELECT MAX(version) FROM atlas_personal_body_review_events
    WHERE user_id=?1 AND structure_id=?2 AND track=?3),0)=?7`)
    .bind(
      user,
      record.structureId,
      record.track,
      record.version,
      JSON.stringify(record),
      record.savedAt,
      expected,
    )
    .run();
  return result.meta.changes === 1;
}
