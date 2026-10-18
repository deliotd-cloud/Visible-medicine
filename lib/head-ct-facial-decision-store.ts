import {facialDecisionKind,facialDecisionConcept,parseSavedFacialDecision,type FacialDecisionKind,type SavedFacialDecision} from './head-ct-facial-decision-contract.ts';

// Reuse the existing append-only table, never another packet's stream.
export const facialDecisionKey=(kind:FacialDecisionKind)=>JSON.stringify(['vm-head-ct-facial-educational-decisions-1',kind]);
const track='teaching';
type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};
export async function facialDecisionHistory(db:Pick<D1Database,'prepare'>,user:string,conceptId:string,kind:FacialDecisionKind,before=2147483648):Promise<SavedFacialDecision[]>{
  if(!user||!facialDecisionConcept(conceptId)||!facialDecisionKind(kind)||!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid facial history request.');
  const key=facialDecisionKey(kind);
  const rows=await db.prepare(`SELECT user_id,nested_key,structure_id,track,version,payload,saved_at
    FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3
    AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`).bind(user,key,conceptId,track,before).all<Row>();
  if(!rows.success)throw Error('Facial history read failed.');
  let prior=before;
  return rows.results.map(row=>{
    const saved=parseSavedFacialDecision(JSON.parse(row.payload));
    if(row.user_id!==user||row.nested_key!==key||row.structure_id!==conceptId||row.track!==track||saved.context.kind!==kind||saved.context.conceptId!==conceptId||
      row.version!==saved.version||row.saved_at!==saved.savedAt||saved.version>=prior)throw Error('Stored facial review envelope mismatch.');
    prior=saved.version;return saved;
  });
}
export async function appendFacialDecision(db:Pick<D1Database,'prepare'>,user:string,saved:SavedFacialDecision,expected:number){
  const record=parseSavedFacialDecision(saved);
  if(!user||!Number.isSafeInteger(expected)||expected<0||expected>2147483646||record.version!==expected+1)throw Error('Invalid facial append version.');
  const result=await db.prepare(`INSERT INTO atlas_personal_nested_review_events
    (user_id,nested_key,structure_id,track,version,payload,saved_at)
    SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
      FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
    .bind(user,facialDecisionKey(record.context.kind),record.context.conceptId,track,record.version,JSON.stringify(record),record.savedAt,expected).run();
  if(!result.success)throw Error('Facial decision append failed.');
  return result.meta.changes===1;
}
