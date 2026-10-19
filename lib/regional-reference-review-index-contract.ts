import {parseRegionalLearningReviewRequest} from './regional-mri-learning-review-link.ts';
export type RegionalReferenceReviewRow={key:string;id:string;label:string;kind:'body'|'specimen';side:'left'|'right';relation:'same-structure'|'parent-reference'|'group-reference';teachingRevision:string;href:string;draftTopics:number;pendingTopics:number;identityTopics:number};
export type RegionalReferenceReviewIndex={schema:'vm-regional-reference-teaching-index-1';atlasRevision:string;mappingRevision:string;rows:readonly Readonly<RegionalReferenceReviewRow>[];approval:false};
export const regionalReferenceRelationLabels={'same-structure':'Same structure','parent-reference':'Whole parent','group-reference':'Grouped reference'} as const;
const exact=(v:unknown,keys:string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
/** Display consistency only, never clinical authority, saved status or MRI registration. */
export function parseRegionalReferenceReviewIndex(value:unknown):Readonly<RegionalReferenceReviewIndex>|null{
 try{
  if(JSON.stringify(value).length>100000)return null;
  const v=structuredClone(value);
  if(!exact(v,['schema','atlasRevision','mappingRevision','rows','approval'])||v.schema!=='vm-regional-reference-teaching-index-1'||v.approval!==false||
   typeof v.atlasRevision!=='string'||!/^[a-f0-9]{40}$/.test(v.atlasRevision)||typeof v.mappingRevision!=='string'||!/^[a-f0-9]{64}$/.test(v.mappingRevision)||!Array.isArray(v.rows)||v.rows.length>100)return null;
  const seen=new Set();
  for(const row of v.rows){
   if(!exact(row,['key','id','label','kind','side','relation','teachingRevision','href','draftTopics','pendingTopics','identityTopics'])||typeof row.label!=='string'||!row.label.trim()||row.label.length>600||/[\u0000-\u001f\u007f]/.test(row.label)||!['body','specimen'].includes(row.kind)||!['left','right'].includes(row.side)||
    typeof row.href!=='string'||row.href.length>2000||!row.href.startsWith('/workspace/atlas-review/reference-learning?')||
    ![row.draftTopics,row.pendingTopics,row.identityTopics].every(n=>Number.isInteger(n)&&n>=0&&n<=8)||row.draftTopics+row.pendingTopics+row.identityTopics!==8)return null;
   const url=new URL(row.href,'https://visible-medicine.invalid'),keys=[...url.searchParams.keys()];
   if(url.origin!=='https://visible-medicine.invalid'||url.pathname!=='/workspace/atlas-review/reference-learning'||url.hash||url.username||url.password||keys.length!==5||new Set(keys).size!==keys.length)return null;
   const request=parseRegionalLearningReviewRequest(Object.fromEntries(url.searchParams));
   if(!request||request.target!==row.id||request.relation!==row.relation||request.atlasRevision!==v.atlasRevision||request.mappingRevision!==v.mappingRevision||request.teachingRevision!==row.teachingRevision||row.key!==JSON.stringify([row.id,row.relation])||seen.has(row.key))return null;
   seen.add(row.key);Object.freeze(row);
  }
  Object.freeze(v.rows);return Object.freeze(v) as Readonly<RegionalReferenceReviewIndex>;
 }catch{return null;}
}
