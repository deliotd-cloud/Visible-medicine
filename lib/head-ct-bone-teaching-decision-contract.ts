import {HEAD_CT_BONE_COMPARISON_REVISION,verifiedHeadCtBoneComparisonPacket} from './head-ct-bone-comparison-review.ts';
import {HEAD_CT_BONE_TEACHING_REVISION,headCtBoneTeachingPacket,verifiedHeadCtBoneTeachingRevision} from './head-ct-bone-teaching.ts';

export const CT_BONE_TEACHING_DECISION_CONCEPTS=['bone-left-parietal','bone-right-parietal','bone-left-nasal','bone-right-nasal','bone-occipital','bone-ethmoid'] as const;
export const CT_BONE_TEACHING_DECISION_CHECKS=[
  {id:'facts',label:'I reviewed this bone note’s anatomy and function claims against its stated factual reference.'},
  {id:'references',label:'I checked the source citation and the original wording; no external prose, exercise, figure or media is presented as reused.'},
  {id:'exercise',label:'I reviewed the CT reading action against the actual partial saved region without assuming named landmarks are captured or resolved.'},
  {id:'limits',label:'This is educational teaching for a CT-only concept; it does not approve masks, MRI, tours, registration, diagnosis, publication or access.'},
] as const;
export const CT_BONE_TEACHING_DECISION_ATTESTATION='I personally reviewed this exact CT bone teaching draft for educational use. My decision does not approve comparison geometry, masks, MRI, registration, clinical use or publication.';
type CheckId=typeof CT_BONE_TEACHING_DECISION_CHECKS[number]['id'];
export type CtBoneTeachingDecisionContext={
  schema:'vm-ct-bone-teaching-decision-context-1';catalogScope:'head-ct-bone-teaching';packetId:'head-ct-bone-teaching';
  conceptId:typeof CT_BONE_TEACHING_DECISION_CONCEPTS[number];headRevision:string;comparisonRevision:string;teachingRevision:string;
  checklistVersion:string;checklist:{id:CheckId;label:string}[];attestation:string;
  decisionScope:'personal-teaching-only';patientRegistration:false;clinicalApproval:false;publicationApproval:false;
};
export type CtBoneTeachingDecision={status:'draft'|'changes-required'|'accepted-teaching';reviewer:string;qualification:string;notes:string;checks:Record<CheckId,boolean>;attested:boolean};
export type SavedCtBoneTeachingDecision={eventSchema:'vm-ct-bone-teaching-decision-event-1';context:CtBoneTeachingDecisionContext;version:number;savedAt:string;decision:CtBoneTeachingDecision};
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw Error('A review field is missing or too long.');return v.trim();};
export function ctBoneTeachingDecisionConcept(value:unknown):value is CtBoneTeachingDecisionContext['conceptId']{return typeof value==='string'&&(CT_BONE_TEACHING_DECISION_CONCEPTS as readonly string[]).includes(value);}

/** Parse recorded evidence without silently replacing historical revisions or wording. */
export function parseCtBoneTeachingDecisionContext(value:unknown):CtBoneTeachingDecisionContext{
  if(!exact(value,['schema','catalogScope','packetId','conceptId','headRevision','comparisonRevision','teachingRevision','checklistVersion','checklist','attestation','decisionScope','patientRegistration','clinicalApproval','publicationApproval'])||
    value.schema!=='vm-ct-bone-teaching-decision-context-1'||value.catalogScope!=='head-ct-bone-teaching'||value.packetId!=='head-ct-bone-teaching'||!ctBoneTeachingDecisionConcept(value.conceptId)||
    !hash(value.headRevision)||!hash(value.comparisonRevision)||!hash(value.teachingRevision)||typeof value.checklistVersion!=='string'||!/^[a-z0-9-]{1,80}$/.test(value.checklistVersion)||
    !Array.isArray(value.checklist)||value.checklist.length!==CT_BONE_TEACHING_DECISION_CHECKS.length||value.checklist.some((c,i)=>!exact(c,['id','label'])||c.id!==CT_BONE_TEACHING_DECISION_CHECKS[i].id||typeof c.label!=='string'||!c.label.trim()||c.label!==c.label.trim()||c.label.length>1000)||
    typeof value.attestation!=='string'||!value.attestation.trim()||value.attestation!==value.attestation.trim()||value.attestation.length>1000||
    value.decisionScope!=='personal-teaching-only'||value.patientRegistration!==false||value.clinicalApproval!==false||value.publicationApproval!==false)
    throw Error('Invalid CT bone teaching review context.');
  return {schema:value.schema,catalogScope:value.catalogScope,packetId:value.packetId,conceptId:value.conceptId,headRevision:value.headRevision,comparisonRevision:value.comparisonRevision,teachingRevision:value.teachingRevision,
    checklistVersion:value.checklistVersion,checklist:value.checklist.map(c=>({id:c.id as CheckId,label:c.label as string})),attestation:value.attestation,
    decisionScope:value.decisionScope,patientRegistration:false,clinicalApproval:false,publicationApproval:false};
}
export async function ctBoneTeachingDecisionContext(manifestRevision:string,conceptId:unknown):Promise<CtBoneTeachingDecisionContext>{
  if(!ctBoneTeachingDecisionConcept(conceptId))throw Error('Unknown CT bone teaching concept.');
  const comparison=await verifiedHeadCtBoneComparisonPacket(manifestRevision);
  const teachingRevision=await verifiedHeadCtBoneTeachingRevision(manifestRevision);
  const packet=headCtBoneTeachingPacket();
  if(!comparison||!teachingRevision||teachingRevision!==HEAD_CT_BONE_TEACHING_REVISION||
    packet.content.headRevision!==manifestRevision||packet.content.comparisonRevision!==HEAD_CT_BONE_COMPARISON_REVISION||
    !comparison.items.some(item=>item.conceptId===conceptId)||!packet.content.notes.some(note=>note.conceptId===conceptId))
    throw Error('The CT bone teaching source or packet changed.');
  return parseCtBoneTeachingDecisionContext({schema:'vm-ct-bone-teaching-decision-context-1',catalogScope:'head-ct-bone-teaching',packetId:'head-ct-bone-teaching',conceptId,
    headRevision:manifestRevision,comparisonRevision:HEAD_CT_BONE_COMPARISON_REVISION,teachingRevision,checklistVersion:'ct-bone-teaching-review-1',
    checklist:CT_BONE_TEACHING_DECISION_CHECKS.map(c=>({...c})),attestation:CT_BONE_TEACHING_DECISION_ATTESTATION,
    decisionScope:'personal-teaching-only',patientRegistration:false,clinicalApproval:false,publicationApproval:false});
}
export function blankCtBoneTeachingDecision(context:CtBoneTeachingDecisionContext):CtBoneTeachingDecision{
  const c=parseCtBoneTeachingDecisionContext(context);
  return {status:'draft',reviewer:'',qualification:'',notes:'',checks:Object.fromEntries(c.checklist.map(item=>[item.id,false])) as Record<CheckId,boolean>,attested:false};
}
export function validateCtBoneTeachingDecision(input:unknown,context:CtBoneTeachingDecisionContext):CtBoneTeachingDecision{
  const c=parseCtBoneTeachingDecisionContext(context);
  if(!exact(input,['status','reviewer','qualification','notes','checks','attested'])||!['draft','changes-required','accepted-teaching'].includes(input.status as string)||typeof input.attested!=='boolean'||
    !exact(input.checks,c.checklist.map(item=>item.id))||Object.values(input.checks).some(v=>typeof v!=='boolean'))throw Error('Invalid CT bone teaching decision.');
  const decision:CtBoneTeachingDecision={status:input.status as CtBoneTeachingDecision['status'],reviewer:text(input.reviewer,160),qualification:text(input.qualification,160),notes:text(input.notes,8000),checks:{...input.checks} as Record<CheckId,boolean>,attested:input.attested};
  if(decision.status==='changes-required'&&decision.notes.length<10)throw Error('Describe the requested corrections (at least 10 characters).');
  if(decision.status==='accepted-teaching'){
    if(!decision.reviewer||!decision.qualification||!decision.attested||!Object.values(decision.checks).every(Boolean))throw Error('Teaching acceptance requires reviewer, qualification, every check and explicit attestation.');
  }else if(decision.attested)throw Error('Drafts and correction requests cannot carry acceptance attestation.');
  return decision;
}
export function parseSavedCtBoneTeachingDecision(input:unknown):SavedCtBoneTeachingDecision{
  if(!exact(input,['eventSchema','context','version','savedAt','decision'])||input.eventSchema!=='vm-ct-bone-teaching-decision-event-1'||
    typeof input.version!=='number'||!Number.isSafeInteger(input.version)||input.version<1||input.version>2147483647||
    typeof input.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.savedAt)||!Number.isFinite(Date.parse(input.savedAt))||new Date(input.savedAt).toISOString()!==input.savedAt)
    throw Error('Invalid saved CT bone teaching decision.');
  const context=parseCtBoneTeachingDecisionContext(input.context);
  return {eventSchema:input.eventSchema,context,version:input.version,savedAt:input.savedAt,decision:validateCtBoneTeachingDecision(input.decision,context)};
}
export function ctBoneTeachingDecisionStale(saved:SavedCtBoneTeachingDecision,context:CtBoneTeachingDecisionContext):boolean{
  try{return JSON.stringify(parseSavedCtBoneTeachingDecision(saved).context)!==JSON.stringify(parseCtBoneTeachingDecisionContext(context));}catch{return true;}
}
/** Supply only the newest event from confirmed, unpaginated history. Never
 * search older events for acceptance after a draft/correction supersedes it.
 * This is personal educational teaching acceptance, not clinical or publication approval. */
export function currentCtBoneTeachingAcceptance(latest:SavedCtBoneTeachingDecision,context:CtBoneTeachingDecisionContext):boolean{
  return !ctBoneTeachingDecisionStale(latest,context)&&latest.decision.status==='accepted-teaching';
}
