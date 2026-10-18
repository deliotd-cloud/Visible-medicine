import {parseRegionalReferenceDraftContext,parseRegionalReferenceDraftEvent,sameRegionalReferenceDraftContext,type RegionalReferenceDraftContext,type RegionalReferenceDraftEvent} from './regional-reference-draft-contract.ts';
type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};
export function regionalReferenceDraftKey(value:RegionalReferenceDraftContext){const c=parseRegionalReferenceDraftContext(value);return JSON.stringify(['vm-regional-reference-teaching-drafts-1',c.atlasRevision,c.mappingRevision,c.teachingRevision,c.target.id,c.target.relation]);}
export async function regionalReferenceDraftHistory(db:Pick<D1Database,'prepare'>,user:string,context:RegionalReferenceDraftContext,before=2147483648):Promise<RegionalReferenceDraftEvent[]>{
 if(!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid correction history cursor.');
 const c=parseRegionalReferenceDraftContext(context),key=regionalReferenceDraftKey(c);
 const rows=await db.prepare(`SELECT user_id,nested_key,structure_id,track,version,payload,saved_at
  FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3
  AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`).bind(user,key,c.target.id,'teaching',before).all<Row>();
 if(rows.success!==true||!Array.isArray(rows.results)||rows.results.length>20)throw Error('Private teaching history could not be confirmed.');
 let previous=before;
 return rows.results.map(row=>{
  const record=parseRegionalReferenceDraftEvent(JSON.parse(row.payload));
  if(row.user_id!==user||row.nested_key!==key||row.structure_id!==c.target.id||row.track!=='teaching'||row.version!==record.version||row.saved_at!==record.savedAt||!sameRegionalReferenceDraftContext(record.context,c)||record.version>=previous)throw Error('Stored reference teaching correction envelope mismatch.');
  previous=record.version;return record;
 });
}
export async function appendRegionalReferenceDraft(db:Pick<D1Database,'prepare'>,user:string,value:RegionalReferenceDraftEvent,expected:number){
 const record=parseRegionalReferenceDraftEvent(value),c=record.context,key=regionalReferenceDraftKey(c);
 if(!Number.isSafeInteger(expected)||expected<0||expected>2147483646||record.version!==expected+1)throw Error('Invalid correction append version.');
 const result=await db.prepare(`INSERT INTO atlas_personal_nested_review_events
  (user_id,nested_key,structure_id,track,version,payload,saved_at)
  SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
   FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
  .bind(user,key,c.target.id,'teaching',record.version,JSON.stringify(record),record.savedAt,expected).run();
 if(result.success!==true||!Number.isSafeInteger(result.meta?.changes)||![0,1].includes(result.meta.changes))throw Error('Private correction append could not be confirmed.');
 return result.meta.changes===1;
}
