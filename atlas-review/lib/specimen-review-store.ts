import {
  parseSavedSpecimenReview,
  type SavedSpecimenReview,
  type SpecimenReviewTrack,
} from "./specimen-review";
type Row = {
  payload: string;
  specimen_key: string;
  structure_id: string;
  track: string;
  version: number;
};
export async function specimenReviewHistory(
  db: D1Database,
  user: string,
  key: string,
  id: string,
  track: SpecimenReviewTrack,
  before = 2147483648,
) {
  const rows = await db
    .prepare(
      `SELECT payload,specimen_key,structure_id,track,version FROM atlas_personal_specimen_review_events
    WHERE user_id=?1 AND specimen_key=?2 AND structure_id=?3 AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`,
    )
    .bind(user, key, id, track, before)
    .all<Row>();
  return rows.results.map((row) => {
    const r = parseSavedSpecimenReview(JSON.parse(row.payload));
    if (
      row.specimen_key !== key ||
      row.structure_id !== id ||
      row.track !== track ||
      r.specimenKey !== key ||
      r.structureId !== id ||
      r.track !== track ||
      r.version !== row.version
    )
      throw Error("Stored review scope mismatch.");
    return r;
  });
}
export async function appendSpecimenReview(
  db: D1Database,
  user: string,
  review: SavedSpecimenReview,
  expected: number,
) {
  const r = parseSavedSpecimenReview(review);
  if (r.version !== expected + 1) throw Error("Invalid append version.");
  const result = await db
    .prepare(
      `INSERT INTO atlas_personal_specimen_review_events(user_id,specimen_key,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version) FROM atlas_personal_specimen_review_events
    WHERE user_id=?1 AND specimen_key=?2 AND structure_id=?3 AND track=?4),0)=?8`,
    )
    .bind(
      user,
      r.specimenKey,
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
