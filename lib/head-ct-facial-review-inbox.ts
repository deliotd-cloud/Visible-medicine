import type {InboxDescriptor,InboxItem,InboxStatus} from './clinical-review-inbox-contract.ts';
import {HEAD_MANIFEST_SHA256} from './head-atlas-import.ts';
import {CT_FACIAL_COMPARISON_CONCEPTS} from './head-ct-facial-comparison-review.ts';
import {facialDecisionContext,facialDecisionStale,type FacialDecisionKind} from './head-ct-facial-decision-contract.ts';
import {getFacialDecisions} from './head-ct-facial-decision-api.ts';
import {parseFacialHistory} from './head-ct-facial-decision-client.ts';

const kinds=['teaching','clinical'] as const;
async function revision(kind:FacialDecisionKind){
  try{
    const contexts=await Promise.all(CT_FACIAL_COMPARISON_CONCEPTS.map(concept=>facialDecisionContext(HEAD_MANIFEST_SHA256,concept,kind)));
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({schema:'vm-facial-inbox-group-1',kind,contexts})));
    return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
  }catch{return null;}
}
export async function facialReviewInboxCatalog():Promise<InboxDescriptor[]>{
  return Promise.all(kinds.map(async kind=>({key:`head:ct-facial-review:${kind}`,
    title:kind==='teaching'?'Facial anatomy and questions · 3 bones':'Facial clinical orientation · 3 bones',area:'head-learning',
    scopeLabel:'Three independent personal educational decisions; no clinical or publication approval',
    href:`/workspace/atlas-review/head-learning#head-ct-facial-${kind}-review`,
    trackLabel:kind==='teaching'?'Personal facial teaching decisions':'Personal facial clinical-orientation decisions',
    revision:await revision(kind),capability:'decision'})));
}
/** Compact discovery groups do not merge decisions: every newest record must
 * match its own exact context before the group can report acceptance. */
export function facialReviewGroupStatus(statuses:readonly InboxStatus[]):InboxStatus{
  if(statuses.length!==3||statuses.some(status=>!['unavailable','re-review','changes-required','approval-recorded','not-started','in-progress'].includes(status))||statuses.includes('unavailable'))return 'unavailable';
  if(statuses.includes('re-review'))return 're-review';
  if(statuses.includes('changes-required'))return 'changes-required';
  if(statuses.every(status=>status==='approval-recorded'))return 'approval-recorded';
  if(statuses.every(status=>status==='not-started'))return 'not-started';
  return 'in-progress';
}
/** Outer website inbox already authorizes and supplies a SELECT-only facade. */
export async function facialReviewInboxStatuses(request:Request,db:Pick<D1Database,'prepare'>|undefined,descriptors:InboxDescriptor[]):Promise<InboxItem[]>{
  if(!descriptors.length)return [];
  const catalog=await facialReviewInboxCatalog(),output:InboxItem[]=[];
  for(const descriptor of descriptors){
    const kind=kinds.find(kind=>descriptor.key===`head:ct-facial-review:${kind}`),expected=catalog.find(item=>item.key===descriptor.key);
    let status:InboxStatus='unavailable';
    if(kind&&expected?.revision&&Object.keys(descriptor).length===Object.keys(expected).length&&Object.entries(expected).every(([key,value])=>descriptor[key as keyof InboxDescriptor]===value))try{
      const statuses:InboxStatus[]=[];
      for(const concept of CT_FACIAL_COMPARISON_CONCEPTS){
        const context=await facialDecisionContext(HEAD_MANIFEST_SHA256,concept,kind),url=new URL('/api/atlas-review/head-ct-facial-decisions',request.url);
        url.search=new URLSearchParams({kind,concept}).toString();
        const response=await getFacialDecisions(new Request(url,{headers:request.headers}),db,HEAD_MANIFEST_SHA256);
        if(!response.ok){statuses.push('unavailable');continue;}
        const latest=parseFacialHistory(await response.json(),context).history[0];
        statuses.push(!latest?'not-started':facialDecisionStale(latest,context)?'re-review':latest.decision.status==='accepted-educational'?'approval-recorded':latest.decision.status==='changes-required'?'changes-required':'in-progress');
      }
      status=facialReviewGroupStatus(statuses);
    }catch{/* Unknown history is not empty or accepted. */}
    output.push({...descriptor,status});
  }
  return output;
}
