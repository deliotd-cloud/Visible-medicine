import type {Regional3dCatalogue} from './regional-mri-3d-comparison.ts';
import {resolveRegionalLearningReview} from './regional-mri-learning-review.ts';
import {parseRegionalReferenceReviewIndex,type RegionalReferenceReviewIndex,type RegionalReferenceReviewRow} from './regional-reference-review-index-contract.ts';

/** Authorized server callers supply fresh canonical projection; no private status/scan data. */
export async function buildRegionalReferenceReviewIndex(catalogue:Regional3dCatalogue|null):Promise<Readonly<RegionalReferenceReviewIndex>|null>{
 try{
  if(!catalogue||JSON.stringify(catalogue).length>2000000)return null;
  const c=structuredClone(catalogue),entries=c.learning?.entries;
  if(!Array.isArray(entries)||!entries.length||entries.length>100)return null;
  const rows:RegionalReferenceReviewRow[]=[];
  for(const entry of entries){
   const request={target:entry.target.id,relation:entry.target.relation,atlasRevision:c.atlasRevision,mappingRevision:c.mappingRevision,teachingRevision:entry.revision};
   const snapshot=await resolveRegionalLearningReview(request,c);if(!snapshot)return null;
   const e=snapshot.entry;
   rows.push({key:JSON.stringify([e.target.id,e.target.relation]),id:e.target.id,label:e.target.label,kind:e.target.kind,side:e.target.side,relation:e.target.relation,teachingRevision:e.revision,
    href:'/workspace/atlas-review/reference-learning?'+new URLSearchParams(request),draftTopics:e.topics.filter(t=>t.readiness==='draft').length,pendingTopics:e.topics.filter(t=>t.readiness==='pending').length,identityTopics:e.topics.filter(t=>t.readiness==='identity-only').length});
  }
  rows.sort((a,b)=>a.label.localeCompare(b.label)||a.kind.localeCompare(b.kind)||a.side.localeCompare(b.side)||a.relation.localeCompare(b.relation));
  return parseRegionalReferenceReviewIndex({schema:'vm-regional-reference-teaching-index-1',atlasRevision:c.atlasRevision,mappingRevision:c.mappingRevision,rows,approval:false});
 }catch{return null;}
}
