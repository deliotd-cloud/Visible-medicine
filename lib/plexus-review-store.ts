import { plexusCandidateId, type PlexusReviewTrack } from './plexus-review-contract.ts';
import { parseSavedPlexusReview, type SavedPlexusReview } from './plexus-review-decisions.ts';

export const plexusSpecimenKey = 'independent-schematic:vm:schematic:brachial-plexus:right';
const envelopeTrack: Record<PlexusReviewTrack,string> = {topology:'geometry',presentation:'teaching'};
type Row = {payload:string; specimen_key:string; structure_id:string; track:string; version:number; saved_at:string};

function parseRow(row: Row, track: PlexusReviewTrack): SavedPlexusReview {
  const saved = parseSavedPlexusReview(JSON.parse(row.payload));
  if (row.specimen_key !== plexusSpecimenKey || row.structure_id !== plexusCandidateId ||
      row.track !== envelopeTrack[track] || saved.context.candidateId !== plexusCandidateId ||
      saved.track !== track || row.version !== saved.version || row.saved_at !== saved.savedAt)
    throw new Error('Stored schematic review envelope mismatch.');
  return saved;
}

export async function plexusReviewHistory(db:Pick<D1Database,'prepare'>, user:string, track:PlexusReviewTrack, before = 2147483648) {
  const rows = await db.prepare(`SELECT payload,specimen_key,structure_id,track,version,saved_at
    FROM atlas_personal_specimen_review_events WHERE user_id=?1 AND specimen_key=?2 AND structure_id=?3
    AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`)
    .bind(user,plexusSpecimenKey,plexusCandidateId,envelopeTrack[track],before).all<Row>();
  return rows.results.map(row => parseRow(row,track));
}

export async function appendPlexusReview(db:Pick<D1Database,'prepare'>, user:string, saved:SavedPlexusReview, expected:number) {
  const record = parseSavedPlexusReview(saved);
  if (record.version !== expected+1) throw new Error('Invalid append version.');
  const result = await db.prepare(`INSERT INTO atlas_personal_specimen_review_events
    (user_id,specimen_key,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
      FROM atlas_personal_specimen_review_events WHERE user_id=?1 AND specimen_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
    .bind(user,plexusSpecimenKey,plexusCandidateId,envelopeTrack[record.track],record.version,
      JSON.stringify(record),record.savedAt,expected).run();
  return result.meta.changes === 1;
}
