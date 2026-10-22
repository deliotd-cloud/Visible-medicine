import type {RegionalLearningTarget} from './regional-mri-learning.ts';
import type {RegionalLearningReviewSnapshot} from './regional-mri-learning-review.ts';
import {parseRegionalLearningReviewRequest} from './regional-mri-learning-review-link.ts';

export const regionalReferenceDraftChecks=[{id:'facts',label:'Consider the anatomy/function wording and proposed factual corrections.'},{id:'scope',label:'Consider the source side, partial/group/parent limits and missing anatomy.'},{id:'imaging',label:'Keep imaging teaching separate from findings on a scan or a registered 3D match.'},{id:'sources',label:'Consider references, pending topics and this exact draft revision.'}] as const;
export type RegionalReferenceDraftContext={schema:'vm-regional-reference-teaching-draft-context-1';atlasRevision:string;mappingRevision:string;teachingRevision:string;target:RegionalLearningTarget;checklistVersion:'regional-reference-teaching-v1';clinicalApproval:false;publicationApproval:false;patientRegistration:false};
export type RegionalReferenceDraft={status:'draft'|'changes-required';notes:string;checks:Record<typeof regionalReferenceDraftChecks[number]['id'],boolean>;attested:false};
export type RegionalReferenceDraftEvent={eventSchema:'vm-regional-reference-teaching-draft-event-1';context:RegionalReferenceDraftContext;version:number;savedAt:string;draft:RegionalReferenceDraft};
const exact=(v:unknown,keys:readonly string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const targetKeys=['id','kind','label','side','sourceHash','runtimeRevision','specimenRevision','relation'] as const;
export function parseRegionalReferenceDraftContext(value:unknown):RegionalReferenceDraftContext{
 if(!exact(value,['schema','atlasRevision','mappingRevision','teachingRevision','target','checklistVersion','clinicalApproval','publicationApproval','patientRegistration'])||
  value.schema!=='vm-regional-reference-teaching-draft-context-1'||value.checklistVersion!=='regional-reference-teaching-v1'||value.clinicalApproval!==false||value.publicationApproval!==false||value.patientRegistration!==false||!exact(value.target,targetKeys))throw Error('Invalid reference teaching correction context.');
 const t=value.target;
 if(!parseRegionalLearningReviewRequest({target:t.id,relation:t.relation,atlasRevision:value.atlasRevision,mappingRevision:value.mappingRevision,teachingRevision:value.teachingRevision})||
  !['body','specimen'].includes(t.kind)||!['left','right'].includes(t.side)||!text(t.label,600)||!t.label.trim()||!hash(t.sourceHash)||
  typeof t.runtimeRevision!=='string'||!/^[a-f0-9]{40}$/.test(t.runtimeRevision)||
  (t.kind==='body'?t.specimenRevision!==null:!hash(t.specimenRevision)))throw Error('Invalid reference teaching target.');
 const target=Object.freeze(Object.fromEntries(targetKeys.map(k=>[k,t[k]]))) as RegionalLearningTarget;
 return Object.freeze({schema:value.schema,atlasRevision:value.atlasRevision,mappingRevision:value.mappingRevision,teachingRevision:value.teachingRevision,target,checklistVersion:value.checklistVersion,clinicalApproval:false,publicationApproval:false,patientRegistration:false});
}
/** Call only after the protected server resolves the canonical public snapshot. */
export function regionalReferenceDraftContext(snapshot:RegionalLearningReviewSnapshot):RegionalReferenceDraftContext{
 return parseRegionalReferenceDraftContext({schema:'vm-regional-reference-teaching-draft-context-1',atlasRevision:snapshot.atlasRevision,mappingRevision:snapshot.mappingRevision,teachingRevision:snapshot.entry.revision,target:snapshot.entry.target,checklistVersion:'regional-reference-teaching-v1',clinicalApproval:false,publicationApproval:false,patientRegistration:false});
}
export function sameRegionalReferenceDraftContext(a:unknown,b:unknown){try{return JSON.stringify(parseRegionalReferenceDraftContext(a))===JSON.stringify(parseRegionalReferenceDraftContext(b));}catch{return false;}}
export function blankRegionalReferenceDraft():RegionalReferenceDraft{return {status:'draft',notes:'',checks:{facts:false,scope:false,imaging:false,sources:false},attested:false};}
export function validateRegionalReferenceDraft(value:unknown):RegionalReferenceDraft{
 if(!exact(value,['status','notes','checks','attested'])||!['draft','changes-required'].includes(value.status)||!text(value.notes,6000)||!exact(value.checks,regionalReferenceDraftChecks.map(c=>c.id))||Object.values(value.checks).some(v=>typeof v!=='boolean')||value.attested!==false)throw Error('Use text notes and the four consideration checks only; this is not approval.');
 if(value.status==='changes-required'&&value.notes.trim().length<10)throw Error('Describe the correction in at least 10 characters.');
 return Object.freeze({status:value.status,notes:value.notes,checks:Object.freeze({facts:value.checks.facts,scope:value.checks.scope,imaging:value.checks.imaging,sources:value.checks.sources}),attested:false});
}
export function parseRegionalReferenceDraftEvent(value:unknown):RegionalReferenceDraftEvent{
 if(!exact(value,['eventSchema','context','version','savedAt','draft'])||value.eventSchema!=='vm-regional-reference-teaching-draft-event-1'||!Number.isSafeInteger(value.version)||value.version<1||value.version>2147483647||typeof value.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.savedAt)||!Number.isFinite(Date.parse(value.savedAt))||new Date(value.savedAt).toISOString()!==value.savedAt)throw Error('Invalid saved reference teaching correction.');
 return Object.freeze({eventSchema:value.eventSchema,context:parseRegionalReferenceDraftContext(value.context),version:value.version,savedAt:value.savedAt,draft:validateRegionalReferenceDraft(value.draft)});
}
