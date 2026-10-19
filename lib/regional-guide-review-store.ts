import {parseRegionalGuideReviewContext,parseRegionalGuideReviewEvent,type RegionalGuideReviewContext,type RegionalGuideReviewEvent} from './regional-guide-review-contract.ts';
type Row={user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string};
const track='teaching';
export function regionalGuideReviewKey(value:RegionalGuideReviewContext){const c=parseRegionalGuideReviewContext(value);return JSON.stringify(['vm-regional-guide-teaching-reviews-1',c.region,c.guideId]);}
export async function regionalGuideReviewHistory(db:Pick<D1Database,'prepare'>,user:string,context:RegionalGuideReviewContext,before=2147483648):Promise<RegionalGuideReviewEvent[]>{
 if(typeof user!=='string'||!user||!Number.isSafeInteger(before)||before<1||before>2147483648)throw Error('Invalid guide history request.');
 const c=parseRegionalGuideReviewContext(context),key=regionalGuideReviewKey(c);
 const rows=await db.prepare(`SELECT user_id,nested_key,structure_id,track,version,payload,saved_at
 FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3
 AND track=?4 AND version<?5 ORDER BY version DESC LIMIT 20`).bind(user,key,c.guideId,track,before).all<Row>();
 if(rows.success!==true||!Array.isArray(rows.results)||rows.results.length>20)throw Error('Private guide history could not be confirmed.');
 let previous=before;
 return rows.results.map(row=>{
  const event=parseRegionalGuideReviewEvent(JSON.parse(row.payload));
  if(row.user_id!==user||row.nested_key!==key||row.structure_id!==c.guideId||row.track!==track||row.version!==event.version||row.saved_at!==event.savedAt||event.context.region!==c.region||event.context.guideId!==c.guideId||event.version>=previous)throw Error('Stored guide teaching envelope mismatch.');
  previous=event.version;return event;
 });
}
export async function appendRegionalGuideReview(db:Pick<D1Database,'prepare'>,user:string,value:RegionalGuideReviewEvent,expected:number){
 const event=parseRegionalGuideReviewEvent(value),c=event.context,key=regionalGuideReviewKey(c);
 if(typeof user!=='string'||!user||!Number.isSafeInteger(expected)||expected<0||expected>2147483646||event.version!==expected+1)throw Error('Invalid guide append version.');
 const result=await db.prepare(`INSERT INTO atlas_personal_nested_review_events
 (user_id,nested_key,structure_id,track,version,payload,saved_at)
 SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE COALESCE((SELECT MAX(version)
 FROM atlas_personal_nested_review_events WHERE user_id=?1 AND nested_key=?2 AND structure_id=?3 AND track=?4),0)=?8`)
 .bind(user,key,c.guideId,track,event.version,JSON.stringify(event),event.savedAt,expected).run();
 if(result.success!==true||!Number.isSafeInteger(result.meta?.changes)||![0,1].includes(result.meta.changes))throw Error('Private guide append could not be confirmed.');
 return result.meta.changes===1;
}
