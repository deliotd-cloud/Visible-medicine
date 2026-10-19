import {HEAD_CT_BONE_COMPARISON_REVISION,verifiedHeadCtBoneComparisonPacket} from './head-ct-bone-comparison-review.ts';
import {CT_FACIAL_COMPARISON_CONCEPTS,HEAD_CT_FACIAL_COMPARISON_REVISION,verifiedHeadCtFacialComparisonPacket} from './head-ct-facial-comparison-review.ts';

export const CT_BONE_DECISION_CONCEPTS=['bone-left-parietal','bone-right-parietal','bone-left-nasal','bone-right-nasal','bone-occipital','bone-ethmoid'] as const;
export const CT_ALL_BONE_DECISION_CONCEPTS=[...CT_BONE_DECISION_CONCEPTS,...CT_FACIAL_COMPARISON_CONCEPTS] as const;
const facialConcept=(id:unknown)=>(CT_FACIAL_COMPARISON_CONCEPTS as readonly unknown[]).includes(id);
const packetIdFor=(id:unknown)=>facialConcept(id)?'head-ct-facial-comparisons':'head-ct-bone-comparisons';
export const CT_BONE_DECISION_CHECKS=[
  {id:'identity',label:'I checked the exact native CT and generic 3D identities, laterality and source revisions.'},
  {id:'extent',label:'I inspected the partial CT mask and generic bone independently; this is not approval of either geometry.'},
  {id:'comparison',label:'This different-subject semantic comparison is useful for education; it does not establish spatial alignment or diagnostic normality.'},
  {id:'limits',label:'This decision covers only this CT-to-3D comparison, not MRI, teaching, guided learning, publication or access permissions.'},
] as const;
export const CT_BONE_DECISION_ATTESTATION='I personally reviewed this exact CT-to-3D semantic comparison. My decision does not approve mask geometry, patient-space registration, clinical use or publication.';
const CT_FACIAL_DECISION_CHECKS=CT_BONE_DECISION_CHECKS.map(check=>check.id==='extent'
  ?{...check,label:'I inspected the actual saved CT extent and generic bone independently; neither mask representation nor this comparison approves complete bone coverage or either geometry.'}
  :{...check});
type CheckId=typeof CT_BONE_DECISION_CHECKS[number]['id'];
export type CtBoneDecisionContext={
  schema:'vm-ct-bone-decision-context-1';catalogScope:'head-ct-bone-comparisons';packetId:'head-ct-bone-comparisons'|'head-ct-facial-comparisons';
  conceptId:typeof CT_ALL_BONE_DECISION_CONCEPTS[number];headRevision:string;comparisonRevision:string;
  checklistVersion:string;checklist:{id:CheckId;label:string}[];attestation:string;
  decisionScope:'personal-semantic-comparison-only';patientRegistration:false;clinicalApproval:false;publicationApproval:false;
};
export type CtBoneDecision={status:'draft'|'changes-required'|'accepted-semantic';reviewer:string;qualification:string;notes:string;checks:Record<CheckId,boolean>;attested:boolean};
export type SavedCtBoneDecision={eventSchema:'vm-ct-bone-decision-event-1';context:CtBoneDecisionContext;version:number;savedAt:string;decision:CtBoneDecision};
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw Error('A review field is missing or too long.');return v.trim();};
export function ctBoneDecisionConcept(value:unknown):value is CtBoneDecisionContext['conceptId']{return typeof value==='string'&&(CT_ALL_BONE_DECISION_CONCEPTS as readonly string[]).includes(value);}

/** Parse recorded evidence without silently replacing historical revisions or wording. */
export function parseCtBoneDecisionContext(value:unknown):CtBoneDecisionContext{
  if(!exact(value,['schema','catalogScope','packetId','conceptId','headRevision','comparisonRevision','checklistVersion','checklist','attestation','decisionScope','patientRegistration','clinicalApproval','publicationApproval'])||
    value.schema!=='vm-ct-bone-decision-context-1'||value.catalogScope!=='head-ct-bone-comparisons'||value.packetId!==packetIdFor(value.conceptId)||!ctBoneDecisionConcept(value.conceptId)||
    !hash(value.headRevision)||!hash(value.comparisonRevision)||typeof value.checklistVersion!=='string'||!/^[a-z0-9-]{1,80}$/.test(value.checklistVersion)||
    !Array.isArray(value.checklist)||value.checklist.length!==CT_BONE_DECISION_CHECKS.length||value.checklist.some((c,i)=>!exact(c,['id','label'])||c.id!==CT_BONE_DECISION_CHECKS[i].id||typeof c.label!=='string'||!c.label.trim()||c.label!==c.label.trim()||c.label.length>1000)||
    typeof value.attestation!=='string'||!value.attestation.trim()||value.attestation!==value.attestation.trim()||value.attestation.length>1000||
    value.decisionScope!=='personal-semantic-comparison-only'||value.patientRegistration!==false||value.clinicalApproval!==false||value.publicationApproval!==false)
    throw Error('Invalid CT comparison review context.');
  return {schema:value.schema,catalogScope:value.catalogScope,packetId:value.packetId as CtBoneDecisionContext['packetId'],conceptId:value.conceptId,headRevision:value.headRevision,comparisonRevision:value.comparisonRevision,
    checklistVersion:value.checklistVersion,checklist:value.checklist.map(c=>({id:c.id as CheckId,label:c.label as string})),attestation:value.attestation,
    decisionScope:value.decisionScope,patientRegistration:false,clinicalApproval:false,publicationApproval:false};
}
export async function ctBoneDecisionContext(manifestRevision:string,conceptId:unknown):Promise<CtBoneDecisionContext>{
  if(!ctBoneDecisionConcept(conceptId))throw Error('Unknown CT bone comparison.');
  const facial=facialConcept(conceptId);
  const packet=facial?await verifiedHeadCtFacialComparisonPacket(manifestRevision):await verifiedHeadCtBoneComparisonPacket(manifestRevision);
  if(!packet||!packet.items.some(item=>item.conceptId===conceptId))throw Error('The CT source or comparison packet changed.');
  return parseCtBoneDecisionContext({schema:'vm-ct-bone-decision-context-1',catalogScope:'head-ct-bone-comparisons',packetId:packet.packetId,conceptId,
    headRevision:manifestRevision,comparisonRevision:facial?HEAD_CT_FACIAL_COMPARISON_REVISION:HEAD_CT_BONE_COMPARISON_REVISION,checklistVersion:facial?'ct-facial-semantic-review-1':'ct-bone-semantic-review-1',
    checklist:(facial?CT_FACIAL_DECISION_CHECKS:CT_BONE_DECISION_CHECKS).map(c=>({...c})),attestation:CT_BONE_DECISION_ATTESTATION,
    decisionScope:'personal-semantic-comparison-only',patientRegistration:false,clinicalApproval:false,publicationApproval:false});
}
export function blankCtBoneDecision(context:CtBoneDecisionContext):CtBoneDecision{
  const c=parseCtBoneDecisionContext(context);
  return {status:'draft',reviewer:'',qualification:'',notes:'',checks:Object.fromEntries(c.checklist.map(item=>[item.id,false])) as Record<CheckId,boolean>,attested:false};
}
export function validateCtBoneDecision(input:unknown,context:CtBoneDecisionContext):CtBoneDecision{
  const c=parseCtBoneDecisionContext(context);
  if(!exact(input,['status','reviewer','qualification','notes','checks','attested'])||!['draft','changes-required','accepted-semantic'].includes(input.status as string)||typeof input.attested!=='boolean'||
    !exact(input.checks,c.checklist.map(item=>item.id))||Object.values(input.checks).some(v=>typeof v!=='boolean'))throw Error('Invalid CT comparison decision.');
  const decision:CtBoneDecision={status:input.status as CtBoneDecision['status'],reviewer:text(input.reviewer,160),qualification:text(input.qualification,160),notes:text(input.notes,8000),checks:{...input.checks} as Record<CheckId,boolean>,attested:input.attested};
  if(decision.status==='changes-required'&&decision.notes.length<10)throw Error('Describe the requested corrections (at least 10 characters).');
  if(decision.status==='accepted-semantic'){
    if(!decision.reviewer||!decision.qualification||!decision.attested||!Object.values(decision.checks).every(Boolean))throw Error('Semantic acceptance requires reviewer, qualification, every check and explicit attestation.');
  }else if(decision.attested)throw Error('Drafts and correction requests cannot carry acceptance attestation.');
  return decision;
}
export function parseSavedCtBoneDecision(input:unknown):SavedCtBoneDecision{
  if(!exact(input,['eventSchema','context','version','savedAt','decision'])||input.eventSchema!=='vm-ct-bone-decision-event-1'||
    typeof input.version!=='number'||!Number.isSafeInteger(input.version)||input.version<1||input.version>2147483647||
    typeof input.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.savedAt)||!Number.isFinite(Date.parse(input.savedAt))||new Date(input.savedAt).toISOString()!==input.savedAt)
    throw Error('Invalid saved CT comparison decision.');
  const context=parseCtBoneDecisionContext(input.context);
  return {eventSchema:input.eventSchema,context,version:input.version,savedAt:input.savedAt,decision:validateCtBoneDecision(input.decision,context)};
}
export function ctBoneDecisionStale(saved:SavedCtBoneDecision,context:CtBoneDecisionContext):boolean{
  try{return JSON.stringify(parseSavedCtBoneDecision(saved).context)!==JSON.stringify(parseCtBoneDecisionContext(context));}catch{return true;}
}
/** Supply only the newest event from confirmed, unpaginated history. Never
 * search older events for acceptance after a draft/correction supersedes it.
 * This is personal semantic acceptance, not clinical or publication approval. */
export function currentCtBoneSemanticAcceptance(latest:SavedCtBoneDecision,context:CtBoneDecisionContext):boolean{
  return !ctBoneDecisionStale(latest,context)&&latest.decision.status==='accepted-semantic';
}
