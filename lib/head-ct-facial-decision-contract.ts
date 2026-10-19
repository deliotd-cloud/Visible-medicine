import {HEAD_CT_FACIAL_COMPARISON_REVISION,CT_FACIAL_COMPARISON_CONCEPTS,verifiedHeadCtFacialComparisonPacket} from './head-ct-facial-comparison-review.ts';
import {HEAD_CT_FACIAL_TEACHING_REVISION,headCtFacialTeachingPacket,verifiedHeadCtFacialTeachingRevision} from './head-ct-facial-teaching.ts';
import {HEAD_CT_FACIAL_CLINICAL_REVISION,headCtFacialClinicalPacket,verifiedHeadCtFacialClinicalRevision} from './head-ct-facial-clinical.ts';

export type FacialDecisionKind='teaching'|'clinical';
export const FACIAL_TEACHING_CHECKS=[
  {id:'facts',label:'I reviewed each anatomy, function and question claim against the stated factual reference.'},
  {id:'references',label:'I checked the source citation and original wording; no external prose, figure, exercise or media is presented as reused.'},
  {id:'exercise',label:'I reviewed the CT reading action against the actual saved regions without assuming complete bone coverage or matching generic 3D coordinates.'},
  {id:'limits',label:'This is personal educational review only; it does not approve masks, registration, clinical use, publication or access.'},
] as const;
export const FACIAL_CLINICAL_CHECKS=[
  {id:'wording',label:'I reviewed the cautious injury and examination wording against the cited references without making a source-case diagnosis.'},
  {id:'scan-attribution',label:'I checked that no injury, normality, bite finding or complete mask extent is attributed to the source scan.'},
  {id:'imaging',label:'I reviewed the native CT imaging guidance and its limits without implying other modality coverage or a clinical assessment.'},
  {id:'bindings',label:'I checked the exact three CT identities and separate generic 3D bindings without asserting patient-space registration.'},
] as const;
export const FACIAL_TEACHING_ATTESTATION='I personally reviewed this exact facial teaching packet for educational use. This self-reported decision does not approve masks, patient registration, clinical use or publication.';
export const FACIAL_CLINICAL_ATTESTATION='I personally reviewed this exact facial clinical-orientation draft for educational use. This self-reported decision does not approve diagnosis, masks, patient registration, clinical use or publication.';
type FacialConcept=typeof CT_FACIAL_COMPARISON_CONCEPTS[number];
type CheckId=typeof FACIAL_TEACHING_CHECKS[number]['id']|typeof FACIAL_CLINICAL_CHECKS[number]['id'];
type Scope='head-ct-facial-teaching'|'head-ct-facial-clinical';
export type FacialDecisionContext={
  schema:'vm-ct-facial-decision-context-1';kind:FacialDecisionKind;catalogScope:Scope;packetId:Scope;conceptId:FacialConcept;
  headRevision:string;comparisonRevision:string;packetRevision:string;checklistVersion:string;
  checklist:{id:string;label:string}[];attestation:string;decisionScope:'personal-educational-only';
  patientRegistration:false;clinicalApproval:false;publicationApproval:false;
};
export type FacialDecision={status:'draft'|'changes-required'|'accepted-educational';reviewer:string;qualification:string;notes:string;checks:Record<string,boolean>;attested:boolean};
export type SavedFacialDecision={eventSchema:'vm-ct-facial-decision-event-1';context:FacialDecisionContext;version:number;savedAt:string;decision:FacialDecision};
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw Error('A review field is missing or too long.');return v.trim();};
export function facialDecisionKind(v:unknown):v is FacialDecisionKind{return v==='teaching'||v==='clinical';}
export function facialDecisionConcept(v:unknown):v is FacialConcept{return typeof v==='string'&&(CT_FACIAL_COMPARISON_CONCEPTS as readonly string[]).includes(v);}
const checksFor=(kind:FacialDecisionKind)=>kind==='teaching'?FACIAL_TEACHING_CHECKS:FACIAL_CLINICAL_CHECKS;

/** Historical evidence keeps its own hashes, version, labels and attestation wording. */
export function parseFacialDecisionContext(v:unknown):FacialDecisionContext{
  const kind=typeof v==='object'&&v!==null&&'kind' in v&&facialDecisionKind(v.kind)?v.kind:null;
  if(!kind||!exact(v,['schema','kind','catalogScope','packetId','conceptId','headRevision','comparisonRevision','packetRevision','checklistVersion','checklist','attestation','decisionScope','patientRegistration','clinicalApproval','publicationApproval'])||
    v.schema!=='vm-ct-facial-decision-context-1'||!facialDecisionKind(v.kind)||!facialDecisionConcept(v.conceptId)||
    v.catalogScope!==`head-ct-facial-${v.kind}`||v.packetId!==v.catalogScope||
    !hash(v.headRevision)||!hash(v.comparisonRevision)||!hash(v.packetRevision)||
    typeof v.checklistVersion!=='string'||!/^[a-z0-9-]{1,80}$/.test(v.checklistVersion)||
    !Array.isArray(v.checklist)||v.checklist.length!==checksFor(kind).length||
    v.checklist.some((c,i)=>!exact(c,['id','label'])||c.id!==checksFor(kind)[i].id||typeof c.label!=='string'||!c.label.trim()||c.label!==c.label.trim()||c.label.length>1000)||
    typeof v.attestation!=='string'||!v.attestation.trim()||v.attestation!==v.attestation.trim()||v.attestation.length>1000||
    v.decisionScope!=='personal-educational-only'||v.patientRegistration!==false||v.clinicalApproval!==false||v.publicationApproval!==false)
    throw Error('Invalid facial educational review context.');
  return {schema:v.schema,kind:v.kind,catalogScope:v.catalogScope as Scope,packetId:v.packetId as Scope,conceptId:v.conceptId,
    headRevision:v.headRevision,comparisonRevision:v.comparisonRevision,packetRevision:v.packetRevision,checklistVersion:v.checklistVersion,
    checklist:v.checklist.map(c=>({id:c.id as CheckId,label:c.label as string})),attestation:v.attestation,
    decisionScope:'personal-educational-only',patientRegistration:false,clinicalApproval:false,publicationApproval:false};
}
export async function facialDecisionContext(manifestRevision:string,conceptId:unknown,kind:unknown):Promise<FacialDecisionContext>{
  if(!facialDecisionConcept(conceptId)||!facialDecisionKind(kind))throw Error('Unknown facial concept or decision kind.');
  const comparison=await verifiedHeadCtFacialComparisonPacket(manifestRevision);
  if(!comparison||!comparison.items.some(item=>item.conceptId===conceptId))throw Error('The facial comparison source or packet changed.');
  const teaching=kind==='teaching';
  const revision=teaching?await verifiedHeadCtFacialTeachingRevision(manifestRevision):await verifiedHeadCtFacialClinicalRevision(manifestRevision);
  const packet=teaching?headCtFacialTeachingPacket():headCtFacialClinicalPacket();
  const expected=teaching?HEAD_CT_FACIAL_TEACHING_REVISION:HEAD_CT_FACIAL_CLINICAL_REVISION;
  if(!revision||revision!==expected||packet.content.headRevision!==manifestRevision||packet.content.comparisonRevision!==HEAD_CT_FACIAL_COMPARISON_REVISION||
    !packet.content.notes.some(note=>note.conceptId===conceptId))throw Error('The facial review source or packet changed.');
  const scope=`head-ct-facial-${kind}` as Scope;
  return parseFacialDecisionContext({schema:'vm-ct-facial-decision-context-1',kind,catalogScope:scope,packetId:scope,conceptId,
    headRevision:manifestRevision,comparisonRevision:HEAD_CT_FACIAL_COMPARISON_REVISION,packetRevision:revision,
    checklistVersion:`ct-facial-${kind}-review-1`,checklist:checksFor(kind).map(c=>({...c})),
    attestation:teaching?FACIAL_TEACHING_ATTESTATION:FACIAL_CLINICAL_ATTESTATION,decisionScope:'personal-educational-only',
    patientRegistration:false,clinicalApproval:false,publicationApproval:false});
}
export function blankFacialDecision(context:FacialDecisionContext):FacialDecision{
  const c=parseFacialDecisionContext(context);
  return {status:'draft',reviewer:'',qualification:'',notes:'',checks:Object.fromEntries(c.checklist.map(item=>[item.id,false])),attested:false};
}
export function validateFacialDecision(v:unknown,context:FacialDecisionContext):FacialDecision{
  const c=parseFacialDecisionContext(context);
  if(!exact(v,['status','reviewer','qualification','notes','checks','attested'])||!['draft','changes-required','accepted-educational'].includes(v.status as string)||typeof v.attested!=='boolean'||
    !exact(v.checks,c.checklist.map(item=>item.id))||Object.values(v.checks).some(value=>typeof value!=='boolean'))throw Error('Invalid facial educational decision.');
  const d:FacialDecision={status:v.status as FacialDecision['status'],reviewer:text(v.reviewer,160),qualification:text(v.qualification,160),notes:text(v.notes,8000),checks:{...v.checks} as Record<string,boolean>,attested:v.attested};
  if(d.status==='changes-required'&&d.notes.length<10)throw Error('Describe the requested corrections (at least 10 characters).');
  if(d.status==='accepted-educational'){
    if(!d.reviewer||!d.qualification||!d.attested||!Object.values(d.checks).every(Boolean))throw Error('Educational acceptance requires reviewer, qualification, every check and explicit attestation.');
  }else if(d.attested)throw Error('Drafts and correction requests cannot carry acceptance attestation.');
  return d;
}
export function parseSavedFacialDecision(v:unknown):SavedFacialDecision{
  if(!exact(v,['eventSchema','context','version','savedAt','decision'])||v.eventSchema!=='vm-ct-facial-decision-event-1'||
    typeof v.version!=='number'||!Number.isSafeInteger(v.version)||v.version<1||v.version>2147483647||
    typeof v.savedAt!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(v.savedAt)||
    !Number.isFinite(Date.parse(v.savedAt))||new Date(v.savedAt).toISOString()!==v.savedAt)throw Error('Invalid saved facial educational decision.');
  const context=parseFacialDecisionContext(v.context);
  return {eventSchema:v.eventSchema,context,version:v.version,savedAt:v.savedAt,decision:validateFacialDecision(v.decision,context)};
}
export function facialDecisionStale(saved:SavedFacialDecision,context:FacialDecisionContext):boolean{
  try{return JSON.stringify(parseSavedFacialDecision(saved).context)!==JSON.stringify(parseFacialDecisionContext(context));}catch{return true;}
}
/** Supply only the latest confirmed, unpaginated event. Earlier acceptance cannot survive a correction or draft. */
export function currentFacialEducationalAcceptance(latest:SavedFacialDecision,context:FacialDecisionContext):boolean{
  return !facialDecisionStale(latest,context)&&latest.decision.status==='accepted-educational';
}
