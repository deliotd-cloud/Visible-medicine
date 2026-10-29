/** Read-only personal discovery. These statuses never grant approval capabilities. */
export const inboxStatuses=['not-started','in-progress','changes-required','re-review','approval-recorded','inspection-required','unavailable'] as const;
export type InboxStatus=typeof inboxStatuses[number];
export type InboxArea='structures'|'head-learning'|'source-comparisons'|'regional-learning';
export type InboxCapability='decision'|'corrections'|'inspection-only';
export const inboxChangeReasons=['source-or-teaching','other-review-material','viewer-only','unavailable'] as const;
export type InboxChangeReason=typeof inboxChangeReasons[number];
export type InboxItem={key:string;title:string;area:InboxArea;scopeLabel:string;href:string;trackLabel:string;revision:string|null;status:InboxStatus;capability:InboxCapability;changeReason?:InboxChangeReason};
export type InboxDescriptor=Omit<InboxItem,'status'|'changeReason'>;
export type InboxBatch={schema:'vm-clinical-inbox-1';scope:'private-to-signed-in-account-and-institution';catalogRevision:string;page:number;pageCount:number;selectionTotal:number;nextPage:number|null;items:InboxItem[];approval:false};
export const inboxStatusLabels:Record<InboxStatus,string>={'not-started':'Not started','in-progress':'In progress','changes-required':'Changes required','re-review':'Re-review required','approval-recorded':'Approval recorded','inspection-required':'Inspection required',unavailable:'Status unavailable'};
export const inboxAreaLabels:Record<InboxArea,string>={structures:'3D anatomy & teaching','head-learning':'CT/MRI head learning','source-comparisons':'Held source comparisons','regional-learning':'Native MRI guide teaching'};
const exact=(value:unknown,keys:string[])=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
function worksheetHref(value:unknown):boolean{
 if(typeof value!=='string'||value.length>4096||/[\\\u0000-\u0020]/.test(value))return false;
 // Only existing worksheets, not arbitrary same-origin URLs or normalized traversal.
 const path=value.split(/[?#]/,1)[0];
 return /^\/workspace\/atlas-review(?:\/(?:shoulder|body|nested|specimens|head-learning|regional-guides|source-comparisons(?:\/(?:plexus|optic|disc|foot))?))?$/.test(path);
}
export function parseInboxBatch(value:unknown,expectedPage:number,expectedRevision:string|null):InboxBatch{
 const batch=value as InboxBatch;
 if(!exact(batch,['schema','scope','catalogRevision','page','pageCount','selectionTotal','nextPage','items','approval'])||batch.schema!=='vm-clinical-inbox-1'||batch.scope!=='private-to-signed-in-account-and-institution'||batch.approval!==false||
  !/^[a-f0-9]{64}$/.test(batch.catalogRevision)||expectedRevision!==null&&batch.catalogRevision!==expectedRevision||
  !Number.isSafeInteger(batch.page)||batch.page<1||batch.page!==expectedPage||!Number.isSafeInteger(batch.pageCount)||batch.pageCount<1||batch.pageCount>10000||batch.page>batch.pageCount||
  !Number.isSafeInteger(batch.selectionTotal)||batch.selectionTotal<0||
  batch.nextPage!==(batch.page<batch.pageCount?batch.page+1:null)||!Array.isArray(batch.items)||batch.items.length>64)throw Error('Review inbox changed or returned invalid scope. Restart the status scan.');
 const keys=new Set<string>();
 for(const item of batch.items){
  const hasReason=!!item&&typeof item==='object'&&Object.hasOwn(item,'changeReason');
  if(!exact(item,['key','title','area','scopeLabel','href','trackLabel','revision','status','capability',...(hasReason?['changeReason']:[])])||
   !!item&&typeof item==='object'&&'changeReason' in item&&!hasReason||
   hasReason&&(item.area!=='structures'||item.status!=='re-review'||item.capability!=='decision'||typeof item.revision!=='string'||!/^[a-f0-9]{64}$/.test(item.revision)||!inboxChangeReasons.includes(item.changeReason as InboxChangeReason))||
   typeof item.key!=='string'||!item.key||item.key.length>2048||keys.has(item.key)||
   typeof item.title!=='string'||!item.title||item.title.length>400||typeof item.scopeLabel!=='string'||item.scopeLabel.length>400||typeof item.trackLabel!=='string'||!item.trackLabel||item.trackLabel.length>160||
   !Object.hasOwn(inboxAreaLabels,item.area)||!inboxStatuses.includes(item.status)||!['decision','corrections','inspection-only'].includes(item.capability)||
   !worksheetHref(item.href)||
   item.revision!==null&&!/^[a-f0-9]{64}$/.test(item.revision)||item.revision===null&&item.status!=='unavailable'||
   item.capability!=='decision'&&item.status==='approval-recorded')throw Error('Invalid review inbox entry.');
  keys.add(item.key);
 }
 return structuredClone(batch);
}
