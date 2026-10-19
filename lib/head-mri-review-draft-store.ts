import {parseSavedHeadMriDraft,type SavedHeadMriDraft} from './head-mri-review-draft-contract.ts';

// MRI corrections never share a history/version stream with original-25 notes.
export const headMriDraftKey=JSON.stringify(['vm-head-mri-drafts-1','mri']);
const structure='head-mri-only-learning',track='teaching';
type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};

export async function headMriDraftHistory(db:Pick<D1Database,'prepare'>,user:string,before=2147483648):Promise<SavedHeadMriDraft[]>{
  if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid history cursor.');
  const rows=await db.prepare(`SELECT user_id,nested_key,structure_id,track,version,payload,saved_at
    FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3
    AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`)
    .bind(user,headMriDraftKey,structure,track,before).all<Row>();
  if(!rows.success)throw Error('MRI history read failed.');
  return rows.results.map(row=>{
    const saved=parseSavedHeadMriDraft(JSON.parse(row.payload));
    if(row.user_id!==user||row.nested_key!==headMriDraftKey||row.structure_id!==structure||row.track!==track||
      row.version!==saved.version||row.saved_at!==saved.savedAt)throw Error('Stored MRI correction envelope mismatch.');
    return saved;
  });
}

export async function appendHeadMriDraft(db:Pick<D1Database,'prepare'>,user:string,saved:SavedHeadMriDraft,expected:number){
  const record=parseSavedHeadMriDraft(saved);
  if(!Number.isSafeInteger(expected)||expected<0||expected>2147483646||record.version!==expected+1)throw Error('Invalid append version.');
  // One conditional INSERT is the concurrency gate; the preceding API read is
  // for validation only, not a read-then-write lock. No existing row is replaced.
  const result=await db.prepare(`INSERT INTO atlas_personal_nested_review_events
    (user_id,nested_key,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
      FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
    .bind(user,headMriDraftKey,structure,track,record.version,JSON.stringify(record),record.savedAt,expected).run();
  if(!result.success)throw Error('MRI correction append failed.');
  return result.meta.changes===1;
}
