import {HEAD_MRI_COMPARISON_REVISION,verifiedHeadMriComparisonPacket} from './head-mri-comparison-review.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,verifiedHeadMriOnlyTeachingRevision} from './head-mri-only-teaching.ts';
import {HEAD_MRI_LEARNING_REVISION,verifiedHeadMriLearningRevision} from './head-mri-learning.ts';

// Separate from the original 25-concept notes. No approval, publishing or
// registration authority is conveyed by this preparatory correction contract.
const conceptIds=['limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland'] as const;
export const HEAD_MRI_DRAFT_CHECKLIST=[
  {id:'identity',label:'Check the exact MRI and generic 3D identities, laterality and source revisions; no CT substitute.'},
  {id:'extent',label:'Inspect native mask extent independently of generic 3D, including the partial callosal mask; no patient-space registration.'},
  {id:'facts',label:'Review the MRI-only teaching facts, references, exercises and stated limitations.'},
  {id:'exercise',label:'Inspect both MRI-only guided sequences and their exact step targets; no sequence approval is implied.'},
  {id:'revision',label:'Bind corrections to all three independent packet revisions and this exact head source.'},
] as const;
type CheckId=typeof HEAD_MRI_DRAFT_CHECKLIST[number]['id'];
export type HeadMriDraftContext={
  schema:'vm-head-mri-draft-context-1';catalogScope:'head-mri-only-drafts';packetId:'head-mri-only-learning';
  headRevision:string;comparisonRevision:string;teachingRevision:string;learningRevision:string;
  checklistVersion:string;checklist:{id:CheckId;label:string}[];conceptIds:string[];
  patientRegistration:false;clinicalApproval:false;publicationApproval:false;
};
export type HeadMriDraft={
  status:'draft'|'changes-required';reviewer:string;qualification:string;scope:string;notes:string;
  checks:Record<CheckId,boolean>;attested:false;
};
export type SavedHeadMriDraft={
  eventSchema:'vm-head-mri-draft-event-1';context:HeadMriDraftContext;version:number;savedAt:string;draft:HeadMriDraft;
};
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:unknown,keys:readonly string[]):value is Record<string,unknown>=>object(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const hash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const text=(value:unknown,max:number)=>{if(typeof value!=='string'||value.length>max)throw Error('A draft field is missing or too long.');return value.trim();};
const contextKeys=['schema','catalogScope','packetId','headRevision','comparisonRevision','teachingRevision','learningRevision','checklistVersion','checklist','conceptIds','patientRegistration','clinicalApproval','publicationApproval'];

/** Historical evidence is parsed as recorded, never silently upgraded. */
function recordedContext(value:unknown):HeadMriDraftContext{
  if(!exact(value,contextKeys)||value.schema!=='vm-head-mri-draft-context-1'||value.catalogScope!=='head-mri-only-drafts'||value.packetId!=='head-mri-only-learning'||
    !hash(value.headRevision)||!hash(value.comparisonRevision)||!hash(value.teachingRevision)||!hash(value.learningRevision)||
    typeof value.checklistVersion!=='string'||!/^[a-z0-9-]{1,80}$/.test(value.checklistVersion)||
    !Array.isArray(value.conceptIds)||value.conceptIds.length!==conceptIds.length||value.conceptIds.some((id,index)=>id!==conceptIds[index])||
    !Array.isArray(value.checklist)||value.checklist.length!==HEAD_MRI_DRAFT_CHECKLIST.length||
    value.checklist.some((item,index)=>!exact(item,['id','label'])||item.id!==HEAD_MRI_DRAFT_CHECKLIST[index].id||typeof item.label!=='string'||!item.label.trim()||item.label!==item.label.trim()||item.label.length>1000)||
    value.patientRegistration!==false||value.clinicalApproval!==false||value.publicationApproval!==false)
    throw Error('Invalid MRI-only review context.');
  return {schema:value.schema,catalogScope:value.catalogScope,packetId:value.packetId,
    headRevision:value.headRevision,comparisonRevision:value.comparisonRevision,teachingRevision:value.teachingRevision,learningRevision:value.learningRevision,
    checklistVersion:value.checklistVersion,checklist:value.checklist.map(item=>({id:item.id as CheckId,label:item.label as string})),conceptIds:[...value.conceptIds],
    patientRegistration:false,clinicalApproval:false,publicationApproval:false};
}

/** Server callers must provide the actual current imported head manifest hash. */
export async function headMriDraftContext(manifestRevision:string):Promise<HeadMriDraftContext>{
  const [comparison,teaching,learning]=await Promise.all([
    verifiedHeadMriComparisonPacket(manifestRevision),verifiedHeadMriOnlyTeachingRevision(manifestRevision),verifiedHeadMriLearningRevision(manifestRevision),
  ]);
  if(!comparison||teaching!==HEAD_MRI_ONLY_TEACHING_REVISION||learning!==HEAD_MRI_LEARNING_REVISION)
    throw Error('The MRI source or an independent review packet changed.');
  return recordedContext({schema:'vm-head-mri-draft-context-1',catalogScope:'head-mri-only-drafts',packetId:'head-mri-only-learning',
    headRevision:manifestRevision,comparisonRevision:HEAD_MRI_COMPARISON_REVISION,teachingRevision:teaching,learningRevision:learning,
    checklistVersion:'head-mri-draft-review-1',checklist:HEAD_MRI_DRAFT_CHECKLIST.map(item=>({...item})),conceptIds:comparison.items.map(item=>item.conceptId),
    patientRegistration:false,clinicalApproval:false,publicationApproval:false});
}
export function blankHeadMriDraft(context:HeadMriDraftContext):HeadMriDraft{
  const checked=recordedContext(context);
  return {status:'draft',reviewer:'',qualification:'',scope:'',notes:'',checks:Object.fromEntries(checked.checklist.map(item=>[item.id,false])) as Record<CheckId,boolean>,attested:false};
}
export function validateHeadMriDraft(input:unknown,context:HeadMriDraftContext):HeadMriDraft{
  const checked=recordedContext(context);
  if(!exact(input,['status','reviewer','qualification','scope','notes','checks','attested'])||
    !['draft','changes-required'].includes(input.status as string)||input.attested!==false||
    !exact(input.checks,checked.checklist.map(item=>item.id))||Object.values(input.checks).some(value=>typeof value!=='boolean'))
    throw Error('Invalid MRI draft; approval and attestation are not supported.');
  const draft:HeadMriDraft={status:input.status as HeadMriDraft['status'],reviewer:text(input.reviewer,160),qualification:text(input.qualification,160),
    scope:text(input.scope,1000),notes:text(input.notes,8000),checks:{...input.checks} as Record<CheckId,boolean>,attested:false};
  if(draft.status==='changes-required'&&draft.notes.length<10)throw Error('Describe the requested corrections (at least 10 characters).');
  return draft;
}
export function parseSavedHeadMriDraft(input:unknown):SavedHeadMriDraft{
  if(!exact(input,['eventSchema','context','version','savedAt','draft'])||input.eventSchema!=='vm-head-mri-draft-event-1'||
    typeof input.version!=='number'||!Number.isSafeInteger(input.version)||input.version<1||input.version>2147483647||
    typeof input.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.savedAt)||
    !Number.isFinite(Date.parse(input.savedAt))||new Date(input.savedAt).toISOString()!==input.savedAt)
    throw Error('Invalid saved MRI-only draft.');
  const context=recordedContext(input.context);
  return {eventSchema:input.eventSchema,context,version:input.version,savedAt:input.savedAt,draft:validateHeadMriDraft(input.draft,context)};
}
export function headMriDraftStale(saved:SavedHeadMriDraft,context:HeadMriDraftContext):boolean{
  try{return JSON.stringify(parseSavedHeadMriDraft(saved).context)!==JSON.stringify(recordedContext(context));}
  catch{return true;}
}
