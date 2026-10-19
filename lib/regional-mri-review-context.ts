import localContext from 'virtual:visible-medicine-regional-review-context';
import type {RegionalMriReviewProjection,RegionalMriReviewRow} from './regional-mri-package';

const HASH=/^[a-f0-9]{64}$/,ID=/^[a-zA-Z][a-zA-Z0-9:._-]{0,199}$/;
const regions=new Set(['knee','head-neck','shoulder','shoulder-arm','forearm','hand','thorax','abdomen','pelvis','thigh','leg','foot','spine']);
const exact=(v:unknown,keys:string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,n:number):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=n&&!/[\u0000-\u001f\u007f]/.test(v);
const hash=(v:unknown):v is string=>typeof v==='string'&&HASH.test(v);
const id=(v:unknown):v is string=>typeof v==='string'&&ID.test(v);
const side=(v:unknown)=>['left','right','midline','bilateral'].includes(v as string);
const rowKeys=['id','anatomyId','label','laterality','coverage','reviewStatus','reviewRevision','reviewScope','geometryKind','gridKind','geometryMappingRevision','geometrySourceSha256'];
function row(value:unknown):RegionalMriReviewRow|null{
 if(!exact(value,rowKeys)||!id(value.id)||!id(value.anatomyId)||!text(value.label,160)||!side(value.laterality)||
  !['partial','complete','not-assessed'].includes(value.coverage)||!['accepted-scoped','provisional','deferred'].includes(value.reviewStatus)||
  !hash(value.reviewRevision)||!text(value.reviewScope,2000)||!['mask','points','curve','none'].includes(value.geometryKind)||
  value.reviewStatus==='deferred'&&value.geometryKind!=='none')return null;
 if(value.geometryKind==='mask'?!['source-native','derived-source-ras'].includes(value.gridKind)||!hash(value.geometryMappingRevision)||!hash(value.geometrySourceSha256):
  value.gridKind!==null||value.geometryMappingRevision!==null||value.geometrySourceSha256!==null)return null;
 return Object.freeze({id:value.id,anatomyId:value.anatomyId,label:value.label,laterality:value.laterality,coverage:value.coverage,
  reviewStatus:value.reviewStatus,reviewRevision:value.reviewRevision,reviewScope:value.reviewScope,geometryKind:value.geometryKind,
  gridKind:value.gridKind,geometryMappingRevision:value.geometryMappingRevision,geometrySourceSha256:value.geometrySourceSha256});
}
/** Private development server context only, never a client-submitted approval. */
export async function regionalMriReviewContext(source:{revision:string;region:string}|null):Promise<RegionalMriReviewProjection|null>{
 if(!import.meta.env.DEV||!source||!hash(source.revision)||!regions.has(source.region))return null;
 try{
  const value:unknown=localContext;
  if(!exact(value,['schema','sourceRevision','region','laterality','registration','release','series','projectionRevision'])||
   value.schema!=='visible-medicine.regional-mri-review-context/1'||value.sourceRevision!==source.revision||value.region!==source.region||!side(value.laterality)||
   value.registration!=='none'||value.release!=='local-private-draft'||!hash(value.projectionRevision)||!Array.isArray(value.series)||value.series.length<1||value.series.length>32)return null;
  const series:RegionalMriReviewProjection['series'][number][]=[],seriesIds=new Set<string>();let total=0;
  for(const s of value.series){
   if(!exact(s,['id','label','imageSha256','annotations'])||!id(s.id)||seriesIds.has(s.id)||!text(s.label,160)||!hash(s.imageSha256)||
    !Array.isArray(s.annotations)||s.annotations.length>5000||(total+=s.annotations.length)>10000)return null;
   seriesIds.add(s.id);const annotations:RegionalMriReviewRow[]=[],ids=new Set<string>();
   for(const a of s.annotations){const result=row(a);if(!result||ids.has(result.id))return null;ids.add(result.id);annotations.push(result);}
   series.push(Object.freeze({id:s.id,label:s.label,imageSha256:s.imageSha256,annotations:Object.freeze(annotations)}));
  }
  const payload={schema:value.schema,sourceRevision:value.sourceRevision,region:value.region,laterality:value.laterality,registration:value.registration,release:value.release,series:Object.freeze(series)};
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
  const revision=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');if(revision!==value.projectionRevision)return null;
  return Object.freeze({...payload,projectionRevision:revision}) as RegionalMriReviewProjection;
 }catch{return null;}
}
