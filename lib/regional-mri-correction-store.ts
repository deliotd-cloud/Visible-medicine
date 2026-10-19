import {parseRegionalMriCorrectionContext,parseRegionalMriCorrectionEvent,sameRegionalMriCorrectionContext,type RegionalMriCorrectionContext,type RegionalMriCorrectionEvent} from './regional-mri-correction-contract.ts';
type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};
export function regionalMriCorrectionKey(value:RegionalMriCorrectionContext){
 const c=parseRegionalMriCorrectionContext(value);
 return JSON.stringify(['vm-regional-mri-corrections-1',c.sourceRevision,c.projectionRevision,c.sequenceId,c.annotation.id]);
}
export async function regionalMriCorrectionHistory(db:Pick<D1Database,'prepare'>,user:string,context:RegionalMriCorrectionContext,before=2147483648):Promise<RegionalMriCorrectionEvent[]>{
 if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid correction history cursor.');
 const c=parseRegionalMriCorrectionContext(context),key=regionalMriCorrectionKey(c);
 const rows=await db.prepare(`SELECT user_id,nested_key,structure_id,track,version,payload,saved_at
  FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3
  AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`).bind(user,key,c.annotation.anatomyId,'geometry',before).all<Row>();
 if(!rows.success)throw Error('Regional correction history read failed.');
 let previous=before;
 return rows.results.map(row=>{
  const event=parseRegionalMriCorrectionEvent(JSON.parse(row.payload));
  if(row.user_id!==user||row.nested_key!==key||row.structure_id!==c.annotation.anatomyId||row.track!=='geometry'||row.version!==event.version||row.saved_at!==event.savedAt||
   !sameRegionalMriCorrectionContext(event.context,c)||event.version>=previous)throw Error('Stored regional correction envelope mismatch.');
  previous=event.version;return event;
 });
}
export async function appendRegionalMriCorrection(db:Pick<D1Database,'prepare'>,user:string,value:RegionalMriCorrectionEvent,expected:number){
 const event=parseRegionalMriCorrectionEvent(value),c=event.context,key=regionalMriCorrectionKey(c);
 if(!Number.isSafeInteger(expected)||expected<0||expected>2147483646||event.version!==expected+1)throw Error('Invalid correction append version.');
 // The conditional INSERT, not the preliminary history read, is the concurrency gate.
 const result=await db.prepare(`INSERT INTO atlas_personal_nested_review_events
  (user_id,nested_key,structure_id,track,version,payload,saved_at)
  SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
   FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
  .bind(user,key,c.annotation.anatomyId,'geometry',event.version,JSON.stringify(event),event.savedAt,expected).run();
 if(!result.success)throw Error('Regional correction append failed.');
 return result.meta.changes===1;
}
