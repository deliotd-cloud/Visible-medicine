import type {RegionalMriReviewProjection,RegionalMriReviewRow} from './regional-mri-package';

export type RegionalMriCorrectionContext={
 schema:'vm-regional-mri-correction-context-1';sourceRevision:string;projectionRevision:string;region:string;
 laterality:string;sequenceId:string;sequenceLabel:string;imageSha256:string;annotation:RegionalMriReviewRow;
 clinicalApproval:false;publicationApproval:false;patientRegistration:false;
};
export type RegionalMriCorrectionDraft={status:'draft'|'changes-required';notes:string;checks:{identity:boolean;extent:boolean;sourceScope:boolean};attested:false};
export type RegionalMriCorrectionEvent={eventSchema:'vm-regional-mri-correction-event-1';context:RegionalMriCorrectionContext;version:number;savedAt:string;draft:RegionalMriCorrectionDraft};
const exact=(v:unknown,keys:readonly string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z][a-zA-Z0-9:._-]{0,199}$/.test(v);
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v);
const side=(v:unknown)=>['left','right','midline','bilateral'].includes(v as string);
const regions=new Set(['knee','head-neck','shoulder','shoulder-arm','forearm','hand','thorax','abdomen','pelvis','thigh','leg','foot','spine']);
const rowKeys=['id','anatomyId','label','laterality','coverage','reviewStatus','reviewRevision','reviewScope','geometryKind','gridKind','geometryMappingRevision','geometrySourceSha256'] as const;
const contextKeys=['schema','sourceRevision','projectionRevision','region','laterality','sequenceId','sequenceLabel','imageSha256','annotation','clinicalApproval','publicationApproval','patientRegistration'] as const;
/** Parse recorded metadata as recorded, never upgrade it to the current source. */
export function parseRegionalMriCorrectionContext(value:unknown):RegionalMriCorrectionContext{
 if(!exact(value,contextKeys)||value.schema!=='vm-regional-mri-correction-context-1'||!hash(value.sourceRevision)||!hash(value.projectionRevision)||
  !regions.has(value.region)||!side(value.laterality)||!id(value.sequenceId)||!text(value.sequenceLabel,160)||!hash(value.imageSha256)||
  value.clinicalApproval!==false||value.publicationApproval!==false||value.patientRegistration!==false)throw Error('Invalid regional correction context.');
 const a=value.annotation;
 if(!exact(a,rowKeys)||!id(a.id)||!id(a.anatomyId)||!text(a.label,160)||!side(a.laterality)||!['partial','complete','not-assessed'].includes(a.coverage)||
  !['accepted-scoped','provisional','deferred'].includes(a.reviewStatus)||!hash(a.reviewRevision)||!text(a.reviewScope,2000)||!['mask','points','curve','none'].includes(a.geometryKind)||
  a.reviewStatus==='deferred'&&a.geometryKind!=='none'||(a.geometryKind==='mask'?
   !['source-native','derived-source-ras'].includes(a.gridKind)||!hash(a.geometryMappingRevision)||!hash(a.geometrySourceSha256):
   a.gridKind!==null||a.geometryMappingRevision!==null||a.geometrySourceSha256!==null))throw Error('Invalid regional annotation context.');
 const annotation=Object.freeze(Object.fromEntries(rowKeys.map(k=>[k,a[k]]))) as RegionalMriReviewRow;
 return Object.freeze({schema:value.schema,sourceRevision:value.sourceRevision,projectionRevision:value.projectionRevision,region:value.region,laterality:value.laterality,
  sequenceId:value.sequenceId,sequenceLabel:value.sequenceLabel,imageSha256:value.imageSha256,annotation,clinicalApproval:false,publicationApproval:false,patientRegistration:false});
}
/** Only server callers with independently verified projection may authorize this selection. */
export function regionalMriCorrectionContext(projection:RegionalMriReviewProjection,sequenceId:string,annotationId:string):RegionalMriCorrectionContext|null{
 const sequence=projection.series.find(s=>s.id===sequenceId),annotation=sequence?.annotations.find(a=>a.id===annotationId);
 if(!sequence||!annotation)return null;
 return parseRegionalMriCorrectionContext({schema:'vm-regional-mri-correction-context-1',sourceRevision:projection.sourceRevision,projectionRevision:projection.projectionRevision,
  region:projection.region,laterality:projection.laterality,sequenceId:sequence.id,sequenceLabel:sequence.label,imageSha256:sequence.imageSha256,annotation,
  clinicalApproval:false,publicationApproval:false,patientRegistration:false});
}
export function sameRegionalMriCorrectionContext(left:unknown,right:unknown){
 try{return JSON.stringify(parseRegionalMriCorrectionContext(left))===JSON.stringify(parseRegionalMriCorrectionContext(right));}catch{return false;}
}
export function validateRegionalMriCorrectionDraft(value:unknown):RegionalMriCorrectionDraft{
 if(!exact(value,['status','notes','checks','attested'])||!['draft','changes-required'].includes(value.status)||typeof value.notes!=='string'||value.notes.length>6000||
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value.notes)||!exact(value.checks,['identity','extent','sourceScope'])||
  Object.values(value.checks).some(v=>typeof v!=='boolean')||value.attested!==false)throw Error('Invalid correction draft. Use text notes and the three inspection checks only.');
 if(value.status==='changes-required'&&value.notes.trim().length<10)throw Error('Describe the requested correction in at least 10 characters.');
 return Object.freeze({status:value.status,notes:value.notes,checks:Object.freeze({identity:value.checks.identity,extent:value.checks.extent,sourceScope:value.checks.sourceScope}),attested:false});
}
export function parseRegionalMriCorrectionEvent(value:unknown):RegionalMriCorrectionEvent{
 if(!exact(value,['eventSchema','context','version','savedAt','draft'])||value.eventSchema!=='vm-regional-mri-correction-event-1'||!Number.isSafeInteger(value.version)||
  value.version<1||value.version>2147483647||typeof value.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.savedAt)||
  !Number.isFinite(Date.parse(value.savedAt))||new Date(value.savedAt).toISOString()!==value.savedAt)throw Error('Invalid saved regional correction.');
 return Object.freeze({eventSchema:value.eventSchema,context:parseRegionalMriCorrectionContext(value.context),version:value.version,savedAt:value.savedAt,draft:validateRegionalMriCorrectionDraft(value.draft)});
}
