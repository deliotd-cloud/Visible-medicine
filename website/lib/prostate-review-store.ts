import {parseProstateReviewContext,parseProstateReviewEvent,type ProstateReviewContext,type ProstateReviewEvent} from './prostate-review-contract.ts';
type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};
const key=JSON.stringify(['vm-prostate-zones-reviews-1','schematic-model-and-teaching']);
const structure='prostate-zones';
const track='teaching';
export function prostateReviewKey(value:ProstateReviewContext){parseProstateReviewContext(value);return key;}
export async function prostateReviewHistory(db:Pick<D1Database,'prepare'>,user:string,context:ProstateReviewContext,before=2147483648):Promise<ProstateReviewEvent[]>{
 if(typeof user!=='string'||!user||!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid prostate history request.');
 parseProstateReviewContext(context);
 const rows=await db.prepare(`SELECT user_id,nested_key,structure_id,track,version,payload,saved_at
 FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3
 AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`).bind(user,key,structure,track,before).all<Row>();
 if(rows.success!==true||!Array.isArray(rows.results)||rows.results.length>20)throw Error('Private prostate history could not be confirmed.');
 let previous=before;
 return rows.results.map(row=>{
  const event=parseProstateReviewEvent(JSON.parse(row.payload));
  if(row.user_id!==user||row.nested_key!==key||row.structure_id!==structure||row.track!==track||row.version!==event.version||row.saved_at!==event.savedAt||event.version>=previous)throw Error('Stored prostate review envelope mismatch.');
  previous=event.version;return event;
 });
}
export async function appendProstateReview(db:Pick<D1Database,'prepare'>,user:string,value:ProstateReviewEvent,expected:number){
 const event=parseProstateReviewEvent(value);
 if(typeof user!=='string'||!user||!Number.isSafeInteger(expected)||expected<0||expected>2147483646||event.version!==expected+1)throw Error('Invalid prostate append version.');
 const result=await db.prepare(`INSERT INTO atlas_personal_nested_review_events
 (user_id,nested_key,structure_id,track,version,payload,saved_at)
 SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
 FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
 .bind(user,key,structure,track,event.version,JSON.stringify(event),event.savedAt,expected).run();
 if(result.success!==true||!Number.isSafeInteger(result.meta?.changes)||![0,1].includes(result.meta.changes))throw Error('Private prostate append could not be confirmed.');
 return result.meta.changes===1;
}
