import {
  parseSavedNestedReview,
  type SavedNestedReview,
  type NestedReviewTrack,
} from "./nested-review";
type Row = {
  payload: string;
  nested_key: string;
  structure_id: string;
  track: string;
  version: number;
};
export async function nestedReviewHistory(
  db: D1Database,
  user: string,
  key: string,
  id: string,
  track: NestedReviewTrack,
  before = 2147483648,
) {
  const rows = await db
    .prepare(
      `SELECT payload,nested_key,structure_id,track,version FROM nested_review_events
    WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`,
    )
    .bind(user, key, id, track, before)
    .all<Row>();
  return rows.results.map((row) => {
    const r = parseSavedNestedReview(JSON.parse(row.payload));
    if (
      row.nested_key !== key ||
      row.structure_id !== id ||
      row.track !== track ||
      r.nestedKey !== key ||
      r.structureId !== id ||
      r.track !== track ||
      r.version !== row.version
    )
      throw Error("Stored review scope mismatch.");
    return r;
  });
}
export async function appendNestedReview(
  db: D1Database,
  user: string,
  review: SavedNestedReview,
  expected: number,
) {
  const r = parseSavedNestedReview(review);
  if (r.version !== expected + 1) throw Error("Invalid append version.");
  const result = await db
    .prepare(
      `INSERT INTO nested_review_events(user_id,nested_key,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version) FROM nested_review_events
    WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`,
    )
    .bind(
      user,
      r.nestedKey,
      r.structureId,
      r.track,
      r.version,
      JSON.stringify(r),
      r.savedAt,
      expected,
    )
    .run();
  return result.meta.changes === 1;
}
