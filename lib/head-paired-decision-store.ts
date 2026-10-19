import {pairedDecisionConcept,parseSavedPairedDecision,type SavedPairedDecision} from './head-paired-decision-contract.ts';

// Separate append-only stream for each concept and authorized account/institution.
export const pairedDecisionKey=JSON.stringify(['vm-head-paired-decisions-1','semantic-comparison']);
const track='teaching';
type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};
export async function pairedDecisionHistory(db:Pick<D1Database,'prepare'>,user:string,conceptId:string,before=2147483648):Promise<SavedPairedDecision[]>{
  if(!user||!pairedDecisionConcept(conceptId)||!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid comparison history request.');
  const rows=await db.prepare(`SELECT user_id,nested_key,structure_id,track,version,payload,saved_at
    FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3
    AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`).bind(user,pairedDecisionKey,conceptId,track,before).all<Row>();
  if(!rows.success)throw Error('Comparison history read failed.');
  let prior=before;
  return rows.results.map(row=>{
    const saved=parseSavedPairedDecision(JSON.parse(row.payload));
    if(row.user_id!==user||row.nested_key!==pairedDecisionKey||row.structure_id!==conceptId||row.track!==track||saved.context.conceptId!==conceptId||
      row.version!==saved.version||row.saved_at!==saved.savedAt||saved.version>=prior)throw Error('Stored comparison envelope mismatch.');
    prior=saved.version;return saved;
  });
}
export async function appendPairedDecision(db:Pick<D1Database,'prepare'>,user:string,saved:SavedPairedDecision,expected:number){
  const record=parseSavedPairedDecision(saved);
  if(!user||!Number.isSafeInteger(expected)||expected<0||expected>2147483646||record.version!==expected+1)throw Error('Invalid append version.');
  // Atomic conditional INSERT; previous history is never replaced or upgraded.
  const result=await db.prepare(`INSERT INTO atlas_personal_nested_review_events
    (user_id,nested_key,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
      FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
    .bind(user,pairedDecisionKey,record.context.conceptId,track,record.version,JSON.stringify(record),record.savedAt,expected).run();
  if(!result.success)throw Error('Comparison decision append failed.');
  return result.meta.changes===1;
}
