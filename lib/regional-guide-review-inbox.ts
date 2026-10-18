import type {InboxDescriptor,InboxItem,InboxStatus} from './clinical-review-inbox-contract.ts';
import {regionalGuideReviewPackets,regionalGuideReviewHref} from './regional-guide-review.ts';
import {regionalGuideReviewContext,parseRegionalGuideReviewHistory,sameRegionalGuideReviewContext} from './regional-guide-review-contract.ts';
import {getRegionalGuideReviews} from './regional-guide-review-api.ts';

export async function nativeGuideInboxCatalog():Promise<InboxDescriptor[]>{
 return(await regionalGuideReviewPackets()).map(p=>({key:`native-guide:${p.region}:${p.guideId}`,title:p.title,area:'regional-learning',scopeLabel:'Guide teaching wording only; no scan, 3D or release approval',href:regionalGuideReviewHref(p),trackLabel:'Teaching decision',revision:p.contentRevision,capability:'decision'}));
}
/** Read only: the outer inbox supplies a SELECT-only database adapter. */
export async function nativeGuideInboxStatuses(request:Request,db:Pick<D1Database,'prepare'>|undefined,descriptors:InboxDescriptor[]):Promise<InboxItem[]>{
 const packets=await regionalGuideReviewPackets(),catalog=await nativeGuideInboxCatalog();
 const output:InboxItem[]=[];
 for(const descriptor of descriptors){
  let status:InboxStatus='unavailable';
  const expected=catalog.find(d=>d.key===descriptor.key),packet=packets.find(p=>descriptor.key===`native-guide:${p.region}:${p.guideId}`);
  if(expected&&packet&&Object.keys(descriptor).length===Object.keys(expected).length&&Object.entries(expected).every(([key,value])=>descriptor[key as keyof InboxDescriptor]===value))try{
   const url=new URL('/api/atlas-review/regional-guides',request.url);url.search=new URLSearchParams({region:packet.region,guide:packet.guideId,revision:packet.contentRevision}).toString();
   const headers=new Headers(request.headers);headers.delete('X-Regional-Guide-Before');
   const response=await getRegionalGuideReviews(new Request(url,{headers}),db);
   if(response.ok){const context=regionalGuideReviewContext(packet),history=parseRegionalGuideReviewHistory(await response.json(),context),latest=history.history[0];
    status=!latest?'not-started':!sameRegionalGuideReviewContext(latest.context,context)?'re-review':latest.decision.status==='approved'?'approval-recorded':latest.decision.status==='changes-required'?'changes-required':'in-progress';}
  }catch{/* Unknown storage/context is never an empty or approved history. */}
  output.push({...descriptor,status});
 }
 return output;
}
