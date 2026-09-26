import type { SavedReview, ReviewTrack } from './review-workspace';

type EventRow = { payload: string };
export async function latestReviews(
  db: D1Database,
  userId: string,
): Promise<SavedReview[]> {
  const result = await db
    .prepare(`SELECT e.payload FROM atlas_personal_review_events e
    JOIN (SELECT structure_id,track,MAX(version) AS version FROM atlas_personal_review_events WHERE user_id=?1 GROUP BY structure_id,track) latest
    ON e.structure_id=latest.structure_id AND e.track=latest.track AND e.version=latest.version
    WHERE e.user_id=?1`)
    .bind(userId)
    .all<EventRow>();
  return result.results.map((r) => JSON.parse(r.payload));
}
export async function reviewHistory(
  db: D1Database,
  userId: string,
  id: string,
  track: ReviewTrack,
  before = 2147483647,
) {
  const rows = await db
    .prepare(
      'SELECT payload FROM atlas_personal_review_events WHERE user_id=?1 AND structure_id=?2 AND track=?3 AND version<?4 ORDER BY version DESC LIMIT 20',
    )
    .bind(userId, id, track, before)
    .all<EventRow>();
  return rows.results.map((r) => JSON.parse(r.payload) as SavedReview);
}
export async function appendReview(
  db: D1Database,
  userId: string,
  review: SavedReview,
  expected: number,
) {
  // Atomic optimistic concurrency: no overwrite and no lost edits from another tab.
  const result = await db
    .prepare(`INSERT INTO atlas_personal_review_events(user_id,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6
    WHERE COALESCE((SELECT MAX(version) FROM atlas_personal_review_events WHERE user_id=?1 AND structure_id=?2 AND track=?3),0)=?7`)
    .bind(
      userId,
      review.structureId,
      review.track,
      review.version,
      JSON.stringify(review),
      review.savedAt,
      expected,
    )
    .run();
  return result.meta.changes === 1;
}
