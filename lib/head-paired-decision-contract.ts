import {HEAD_INSULA_COMPARISON_REVISION,verifiedHeadInsulaComparisonPacket} from './head-insula-comparison-review.ts';
import {HEAD_ORBITAL_COMPARISON_REVISION,verifiedHeadOrbitalComparisonPacket} from './head-orbital-comparison-review.ts';
import {HEAD_IMAGE_ONLY_COMPARISON_REVISION,verifiedHeadImageOnlyComparisonPacket} from './head-image-only-comparison-review.ts';

export const PAIRED_DECISION_CONCEPTS=['cortex-left-insula','cortex-right-insula','orbit-left-globe','orbit-right-globe'] as const;
export const IMAGE_ONLY_DECISION_CONCEPTS=['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis'] as const;
export const PAIRED_DECISION_CHECKS=[
  {id:'identity',label:'I checked the exact native CT, MRI and generic 3D identities, laterality and source revisions.'},
  {id:'extent',label:'I inspected CT, partial MRI and generic 3D extents independently; this is not approval of any geometry or equivalent boundaries.'},
  {id:'comparison',label:'This different-subject semantic comparison is useful for education; it does not establish spatial alignment or diagnostic normality.'},
  {id:'limits',label:'This decision covers only this CT/MRI-to-3D comparison, not teaching, guided learning, publication or access permissions.'},
] as const;
export const PAIRED_DECISION_ATTESTATION='I personally reviewed this exact CT/MRI-to-3D semantic comparison. My decision does not approve mask geometry, patient-space registration, clinical use or publication.';
export const IMAGE_ONLY_DECISION_CHECKS=[
  {id:'identity',label:'I checked the exact native CT and MRI identities, laterality, representations and source revisions for this concept.'},
  {id:'extent',label:'I inspected the CT and MRI mask extents independently, including partial MRI vermis coverage where applicable; this does not approve geometry or equivalent boundaries.'},
  {id:'comparison',label:'This different-subject CT/MRI image-only semantic comparison is useful for education; it does not establish spatial alignment, matching boundaries or diagnostic normality.'},
  {id:'limits',label:'This decision covers only this CT/MRI image-only comparison, not 3D anatomy, teaching, guided learning, clinical use, publication or access permissions.'},
] as const;
export const IMAGE_ONLY_DECISION_ATTESTATION='I personally reviewed this exact CT/MRI image-only semantic comparison. My decision does not approve mask geometry, patient-space registration, 3D anatomy, clinical use or publication.';
type CheckId=typeof PAIRED_DECISION_CHECKS[number]['id'];
type PairedConceptId=typeof PAIRED_DECISION_CONCEPTS[number]|typeof IMAGE_ONLY_DECISION_CONCEPTS[number];
export type PairedDecisionContext={
  schema:'vm-paired-decision-context-1';catalogScope:'head-paired-comparisons';packetId:'head-insula-comparisons'|'head-orbital-comparisons'|'head-image-only-comparisons';
  conceptId:PairedConceptId;headRevision:string;comparisonRevision:string;
  checklistVersion:string;checklist:{id:CheckId;label:string}[];attestation:string;
  decisionScope:'personal-semantic-comparison-only';patientRegistration:false;clinicalApproval:false;publicationApproval:false;
};
export type PairedDecision={status:'draft'|'changes-required'|'accepted-semantic';reviewer:string;qualification:string;notes:string;checks:Record<CheckId,boolean>;attested:boolean};
export type SavedPairedDecision={eventSchema:'vm-paired-decision-event-1';context:PairedDecisionContext;version:number;savedAt:string;decision:PairedDecision};
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw Error('A review field is missing or too long.');return v.trim();};
export function pairedDecisionConcept(value:unknown):value is PairedDecisionContext['conceptId']{return typeof value==='string'&&((PAIRED_DECISION_CONCEPTS as readonly string[]).includes(value)||(IMAGE_ONLY_DECISION_CONCEPTS as readonly string[]).includes(value));}

function isImageOnly(conceptId:PairedConceptId):conceptId is typeof IMAGE_ONLY_DECISION_CONCEPTS[number]{return (IMAGE_ONLY_DECISION_CONCEPTS as readonly string[]).includes(conceptId);}
function packetIdFor(conceptId:PairedConceptId){return isImageOnly(conceptId)?'head-image-only-comparisons' as const:conceptId.startsWith('cortex-')?'head-insula-comparisons' as const:'head-orbital-comparisons' as const;}

/** Parse recorded evidence without silently replacing historical revisions or wording. */
export function parsePairedDecisionContext(value:unknown):PairedDecisionContext{
  if(!exact(value,['schema','catalogScope','packetId','conceptId','headRevision','comparisonRevision','checklistVersion','checklist','attestation','decisionScope','patientRegistration','clinicalApproval','publicationApproval'])||
    value.schema!=='vm-paired-decision-context-1'||value.catalogScope!=='head-paired-comparisons'||!pairedDecisionConcept(value.conceptId)||value.packetId!==packetIdFor(value.conceptId)||
    !hash(value.headRevision)||!hash(value.comparisonRevision)||typeof value.checklistVersion!=='string'||!/^[a-z0-9-]{1,80}$/.test(value.checklistVersion)||
    !Array.isArray(value.checklist)||value.checklist.length!==PAIRED_DECISION_CHECKS.length||value.checklist.some((c,i)=>!exact(c,['id','label'])||c.id!==PAIRED_DECISION_CHECKS[i].id||typeof c.label!=='string'||!c.label.trim()||c.label!==c.label.trim()||c.label.length>1000)||
    typeof value.attestation!=='string'||!value.attestation.trim()||value.attestation!==value.attestation.trim()||value.attestation.length>1000||
    value.decisionScope!=='personal-semantic-comparison-only'||value.patientRegistration!==false||value.clinicalApproval!==false||value.publicationApproval!==false)
    throw Error('Invalid CT/MRI comparison review context.');
  return {schema:value.schema,catalogScope:value.catalogScope,packetId:packetIdFor(value.conceptId),conceptId:value.conceptId,headRevision:value.headRevision,comparisonRevision:value.comparisonRevision,
    checklistVersion:value.checklistVersion,checklist:value.checklist.map(c=>({id:c.id as CheckId,label:c.label as string})),attestation:value.attestation,
    decisionScope:value.decisionScope,patientRegistration:false,clinicalApproval:false,publicationApproval:false};
}
export async function pairedDecisionContext(manifestRevision:string,conceptId:unknown):Promise<PairedDecisionContext>{
  if(!pairedDecisionConcept(conceptId))throw Error('Unknown paired head comparison.');
  if(isImageOnly(conceptId)){
    const packet=await verifiedHeadImageOnlyComparisonPacket(manifestRevision);
    if(!packet||!packet.bindings.some(binding=>binding.conceptId===conceptId))throw Error('The head source or comparison packet changed.');
    return parsePairedDecisionContext({schema:'vm-paired-decision-context-1',catalogScope:'head-paired-comparisons',packetId:packetIdFor(conceptId),conceptId,
      headRevision:manifestRevision,comparisonRevision:HEAD_IMAGE_ONLY_COMPARISON_REVISION,checklistVersion:'image-only-semantic-review-1',
      checklist:IMAGE_ONLY_DECISION_CHECKS.map(c=>({...c})),attestation:IMAGE_ONLY_DECISION_ATTESTATION,
      decisionScope:'personal-semantic-comparison-only',patientRegistration:false,clinicalApproval:false,publicationApproval:false});
  }
  const insula=conceptId.startsWith('cortex-');
  const packet=insula?await verifiedHeadInsulaComparisonPacket(manifestRevision):await verifiedHeadOrbitalComparisonPacket(manifestRevision);
  if(!packet||!packet.items.some(item=>item.conceptId===conceptId))throw Error('The head source or comparison packet changed.');
  return parsePairedDecisionContext({schema:'vm-paired-decision-context-1',catalogScope:'head-paired-comparisons',packetId:packet.packetId,conceptId,
    headRevision:manifestRevision,comparisonRevision:insula?HEAD_INSULA_COMPARISON_REVISION:HEAD_ORBITAL_COMPARISON_REVISION,checklistVersion:'paired-semantic-review-1',
    checklist:PAIRED_DECISION_CHECKS.map(c=>({...c})),attestation:PAIRED_DECISION_ATTESTATION,
    decisionScope:'personal-semantic-comparison-only',patientRegistration:false,clinicalApproval:false,publicationApproval:false});
}
export function blankPairedDecision(context:PairedDecisionContext):PairedDecision{
  const c=parsePairedDecisionContext(context);
  return {status:'draft',reviewer:'',qualification:'',notes:'',checks:Object.fromEntries(c.checklist.map(item=>[item.id,false])) as Record<CheckId,boolean>,attested:false};
}
export function validatePairedDecision(input:unknown,context:PairedDecisionContext):PairedDecision{
  const c=parsePairedDecisionContext(context);
  if(!exact(input,['status','reviewer','qualification','notes','checks','attested'])||!['draft','changes-required','accepted-semantic'].includes(input.status as string)||typeof input.attested!=='boolean'||
    !exact(input.checks,c.checklist.map(item=>item.id))||Object.values(input.checks).some(v=>typeof v!=='boolean'))throw Error('Invalid CT/MRI comparison decision.');
  const decision:PairedDecision={status:input.status as PairedDecision['status'],reviewer:text(input.reviewer,160),qualification:text(input.qualification,160),notes:text(input.notes,8000),checks:{...input.checks} as Record<CheckId,boolean>,attested:input.attested};
  if(decision.status==='changes-required'&&decision.notes.length<10)throw Error('Describe the requested corrections (at least 10 characters).');
  if(decision.status==='accepted-semantic'){
    if(!decision.reviewer||!decision.qualification||!decision.attested||!Object.values(decision.checks).every(Boolean))throw Error('Semantic acceptance requires reviewer, qualification, every check and explicit attestation.');
  }else if(decision.attested)throw Error('Drafts and correction requests cannot carry acceptance attestation.');
  return decision;
}
export function parseSavedPairedDecision(input:unknown):SavedPairedDecision{
  if(!exact(input,['eventSchema','context','version','savedAt','decision'])||input.eventSchema!=='vm-paired-decision-event-1'||
    typeof input.version!=='number'||!Number.isSafeInteger(input.version)||input.version<1||input.version>2147483647||
    typeof input.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.savedAt)||!Number.isFinite(Date.parse(input.savedAt))||new Date(input.savedAt).toISOString()!==input.savedAt)
    throw Error('Invalid saved CT/MRI comparison decision.');
  const context=parsePairedDecisionContext(input.context);
  return {eventSchema:input.eventSchema,context,version:input.version,savedAt:input.savedAt,decision:validatePairedDecision(input.decision,context)};
}
export function pairedDecisionStale(saved:SavedPairedDecision,context:PairedDecisionContext):boolean{
  try{return JSON.stringify(parseSavedPairedDecision(saved).context)!==JSON.stringify(parsePairedDecisionContext(context));}catch{return true;}
}
/** Supply only the newest event from confirmed, unpaginated history. Never
 * search older events for acceptance after a draft/correction supersedes it.
 * This is personal semantic acceptance, not clinical or publication approval. */
export function currentPairedSemanticAcceptance(latest:SavedPairedDecision,context:PairedDecisionContext):boolean{
  return !pairedDecisionStale(latest,context)&&latest.decision.status==='accepted-semantic';
}
