import review from '../atlas-review/manifest.json';
import type {Regional3dCatalogue,Regional3dTarget} from './regional-mri-3d-comparison.ts';
import {regionalLearningEntryValid,regionalLearningRevision,type RegionalLearningEntry} from './regional-mri-learning.ts';
import {parseRegionalLearningReviewRequest,type RegionalLearningReviewRequest} from './regional-mri-learning-review-link.ts';

export type RegionalLearningReviewSnapshot=Readonly<{
 atlasRevision:string;mappingRevision:string;entry:Readonly<RegionalLearningEntry>;
}>;
const hash=/^[a-f0-9]{64}$/,commit=/^[a-f0-9]{40}$/;
const exact=(value:unknown,keys:string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).sort().join('|')===[...keys].sort().join('|');
const digest=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),
 n=>n.toString(16).padStart(2,'0')).join('');
function freeze<T>(value:T):T{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
function identity(target:Regional3dTarget){return {id:target.id,kind:target.kind,label:target.label,side:target.side,
 sourceHash:target.sourceHash,specimenRevision:target.specimenRevision,relation:target.relation};}
function sameIdentity(a:object,b:object){
 const left=a as Record<string,unknown>,right=b as Record<string,unknown>;
 return Object.keys(left).length===Object.keys(right).length&&Object.keys(left).every(key=>left[key]===right[key]);
}

/** A revision-bound public teaching snapshot. Authorization belongs to the route. */
export async function resolveRegionalLearningReview(request:RegionalLearningReviewRequest,catalogue:Regional3dCatalogue|null):Promise<RegionalLearningReviewSnapshot|null>{
 try{
  // Own all inputs before the first digest await, including the public mapping.
  const r=parseRegionalLearningReviewRequest(structuredClone(request)),c=structuredClone(catalogue);
  if(!r||!c||
   !exact(c,['schema','mriRevision','atlasRevision','mappingRevision','entries','learning'])||
   c.schema!=='visible-medicine.regional-mri-3d/1'||!hash.test(c.mriRevision)||
   !commit.test(r.atlasRevision)||r.atlasRevision!==review.revision||c.atlasRevision!==r.atlasRevision||
   !hash.test(r.mappingRevision)||c.mappingRevision!==r.mappingRevision||!hash.test(r.teachingRevision)||
   typeof r.target!=='string'||!r.target||r.target.length>240||
   !['same-structure','parent-reference','group-reference'].includes(r.relation)||
   !Array.isArray(c.entries)||c.entries.length>200||
   !exact(c.learning,['schema','atlasRevision','mappingRevision','entries'])||
   c.learning.schema!=='visible-medicine.regional-reference-learning/1'||
   c.learning.atlasRevision!==r.atlasRevision||c.learning.mappingRevision!==r.mappingRevision||
   !Array.isArray(c.learning.entries)||c.learning.entries.length>100||JSON.stringify(c).length>2000000)return null;
  const targets=c.entries.flatMap(row=>Array.isArray(row?.targets)?row.targets:[])
   .filter(t=>t?.id===r.target&&t.relation===r.relation);
  if(!targets.length||targets.some(t=>!exact(t,['kind','id','label','side','region','sourceHash','specimenRevision','relation','href'])||
   !sameIdentity(identity(t),identity(targets[0]))))return null;
  const entries=c.learning.entries.filter(e=>e?.target?.id===r.target&&e?.target?.relation===r.relation);
  if(entries.length!==1||!regionalLearningEntryValid(entries[0]))return null;
  const entry=entries[0];
  if(entry.revision!==r.teachingRevision||!sameIdentity(entry.target,identity(targets[0])))return null;
  if(await digest({version:1,atlasRevision:c.atlasRevision,entries:c.entries})!==r.mappingRevision)return null;
  const {revision,...content}=entry;
  if(await regionalLearningRevision(r.atlasRevision,r.mappingRevision,content)!==revision)return null;
  return freeze({atlasRevision:r.atlasRevision,mappingRevision:r.mappingRevision,entry});
 }catch{return null;}
}
