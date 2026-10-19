import {HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from './head-atlas-teaching.ts';
import {BRAINSTEM_CLINICAL_REVISION,brainstemClinicalPacket} from './head-brainstem-clinical.ts';
import {VENTRICULAR_CLINICAL_REVISION,ventricularClinicalPacket} from './head-ventricular-clinical.ts';
import {CEREBELLAR_CLINICAL_REVISION,cerebellarClinicalPacket,verifiedCerebellarClinicalRevision} from './head-cerebellar-clinical.ts';
import {DEEP_GREY_CLINICAL_REVISION,deepGreyClinicalPacket,verifiedDeepGreyClinicalRevision} from './head-deep-grey-clinical.ts';
import {LOBAR_CLINICAL_REVISION,lobarClinicalPacket,verifiedLobarClinicalRevision} from './head-lobar-clinical.ts';
import {HIPPOCAMPAL_CLINICAL_REVISION,hippocampalClinicalPacket,verifiedHippocampalClinicalRevision} from './head-hippocampal-clinical.ts';
import {MRI_ONLY_CLINICAL_REVISION,mriOnlyClinicalPacket,verifiedMriOnlyClinicalRevision} from './head-mri-only-clinical.ts';
import {HEAD_MRI_ANATOMY_CHECK_REVISION,headMriAnatomyCheckPacket,verifiedHeadMriAnatomyCheckRevision} from './head-mri-anatomy-checks.ts';

// Preparatory draft/correction contract only. This is not an approval policy,
// persistence adapter, radiologist credential check or publication permission.
export type HeadTeachingDraftKind='anatomy'|'brainstem-clinical'|'ventricular-clinical'|'cerebellar-clinical'|'deep-grey-clinical'|'lobar-clinical'|'hippocampal-clinical'|'mri-only-clinical'|'mri-anatomy-checks';
export type HeadTeachingDraftContext={
  schema:'vm-head-teaching-draft-context-1';
  catalogScope:'head-linked-teaching-drafts'|'head-brainstem-clinical-drafts'|'head-ventricular-clinical-drafts'|'head-cerebellar-clinical-drafts'|'head-deep-grey-clinical-drafts'|'head-lobar-clinical-drafts'|'head-hippocampal-clinical-drafts'|'head-mri-only-clinical-drafts'|'head-mri-anatomy-checks-drafts';
  packetId:'head-learning-anatomy'|'head-brainstem-clinical'|'head-ventricular-clinical'|'head-cerebellar-clinical'|'head-deep-grey-clinical'|'head-lobar-clinical'|'head-hippocampal-clinical'|'head-mri-only-clinical'|'head-mri-anatomy-checks';
  packetRevision:string;
  headRevision:string;
  checklistVersion:string;
  checklist:{id:string;label:string}[];
  conceptIds:string[];
  patientRegistration:false;
  clinicalApproval:false;
  publicationApproval:false;
};
export type HeadTeachingDraft={
  status:'draft'|'changes-required';
  reviewer:string;
  qualification:string;
  scope:string;
  notes:string;
  checks:Record<string,boolean>;
  attested:false;
};
export type SavedHeadTeachingDraft={
  eventSchema:'vm-head-teaching-draft-event-1';
  context:HeadTeachingDraftContext;
  version:number;
  savedAt:string;
  draft:HeadTeachingDraft;
};

const checkIds=['facts','extent','comparison','exercise','revision'] as const;
const clinicalCheckIds=['wording','scan-attribution','imaging','bindings'] as const;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>object(v)&&Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const concept=(v:unknown):v is string=>typeof v==='string'&&/^(brainstem-(midbrain|pons|medulla)|ventricle-(left-lateral|right-lateral|third|fourth)|deep-(left|right)-(caudate|putamen|globus-pallidus|thalamus)|cortex-(left|right)-(frontal|parietal|temporal|occipital)-lobe|limbic-(left|right)-hippocampus)$/.test(v);
const cerebellarConcept=(v:unknown):v is string=>typeof v==='string'&&/^cerebellum-(left-hemisphere|right-hemisphere|vermis)$/.test(v);
const deepGreyConcept=(v:unknown):v is string=>typeof v==='string'&&/^deep-(left|right)-(caudate|putamen|globus-pallidus|thalamus)$/.test(v);
const lobarConcept=(v:unknown):v is string=>typeof v==='string'&&/^cortex-(left|right)-(frontal|parietal|temporal|occipital)-lobe$/.test(v);
const hippocampalConcept=(v:unknown):v is string=>typeof v==='string'&&/^limbic-(left|right)-hippocampus$/.test(v);
const mriClinicalConcept=(v:unknown):v is string=>v==='endocrine-pituitary-gland'||v==='commissure-corpus-callosum';
const mriQuestionConcept=(v:unknown):v is string=>mriClinicalConcept(v)||v==='limbic-left-amygdala'||v==='limbic-right-amygdala';
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw Error('A draft text field is missing or too long.');return v.trim();};

/** Parse a recorded context without silently upgrading historical material. */
function recordedContext(value:unknown):HeadTeachingDraftContext{
  const anatomy=value&&object(value)&&value.catalogScope==='head-linked-teaching-drafts'&&value.packetId==='head-learning-anatomy';
  const clinical=value&&object(value)&&value.catalogScope==='head-brainstem-clinical-drafts'&&value.packetId==='head-brainstem-clinical';
  const ventricular=value&&object(value)&&value.catalogScope==='head-ventricular-clinical-drafts'&&value.packetId==='head-ventricular-clinical';
  const cerebellar=value&&object(value)&&value.catalogScope==='head-cerebellar-clinical-drafts'&&value.packetId==='head-cerebellar-clinical';
  const deepGrey=value&&object(value)&&value.catalogScope==='head-deep-grey-clinical-drafts'&&value.packetId==='head-deep-grey-clinical';
  const lobar=value&&object(value)&&value.catalogScope==='head-lobar-clinical-drafts'&&value.packetId==='head-lobar-clinical';
  const hippocampal=value&&object(value)&&value.catalogScope==='head-hippocampal-clinical-drafts'&&value.packetId==='head-hippocampal-clinical';
  const mriClinical=value&&object(value)&&value.catalogScope==='head-mri-only-clinical-drafts'&&value.packetId==='head-mri-only-clinical';
  const mriQuestions=value&&object(value)&&value.catalogScope==='head-mri-anatomy-checks-drafts'&&value.packetId==='head-mri-anatomy-checks';
  const ids=clinical||ventricular||cerebellar||deepGrey||lobar||hippocampal||mriClinical?clinicalCheckIds:checkIds;
  if(!exact(value,['schema','catalogScope','packetId','packetRevision','headRevision','checklistVersion','checklist','conceptIds','patientRegistration','clinicalApproval','publicationApproval'])||
    value.schema!=='vm-head-teaching-draft-context-1'||(!anatomy&&!clinical&&!ventricular&&!cerebellar&&!deepGrey&&!lobar&&!hippocampal&&!mriClinical&&!mriQuestions)||
    !hash(value.packetRevision)||!hash(value.headRevision)||typeof value.checklistVersion!=='string'||!/^[a-z0-9-]{1,80}$/.test(value.checklistVersion)||
    value.patientRegistration!==false||value.clinicalApproval!==false||value.publicationApproval!==false||
    !Array.isArray(value.checklist)||value.checklist.length!==ids.length||
    value.checklist.some(item=>!exact(item,['id','label'])||!ids.some(id=>id===item.id)||typeof item.label!=='string'||!item.label.trim()||item.label.length>1000)||
    new Set(value.checklist.map(item=>item.id)).size!==ids.length||
    !Array.isArray(value.conceptIds)||!value.conceptIds.length||value.conceptIds.length>(mriClinical||hippocampal?2:clinical||cerebellar?3:ventricular||mriQuestions?4:deepGrey||lobar?8:25)||!value.conceptIds.every(mriClinical?mriClinicalConcept:mriQuestions?mriQuestionConcept:hippocampal?hippocampalConcept:cerebellar?cerebellarConcept:deepGrey?deepGreyConcept:lobar?lobarConcept:concept)||
    (mriClinical&&value.conceptIds.length!==2)||(mriQuestions&&value.conceptIds.length!==4)||
    (cerebellar&&value.conceptIds.length!==3)||
    (deepGrey&&value.conceptIds.length!==8)||
    (lobar&&value.conceptIds.length!==8)||
    (hippocampal&&value.conceptIds.length!==2)||
    (clinical&&(value.conceptIds.length!==3||!value.conceptIds.every(id=>['brainstem-midbrain','brainstem-pons','brainstem-medulla'].includes(id))))||
    (ventricular&&(value.conceptIds.length!==4||!value.conceptIds.every(id=>['ventricle-left-lateral','ventricle-right-lateral','ventricle-third','ventricle-fourth'].includes(id))))||new Set(value.conceptIds).size!==value.conceptIds.length)
    throw Error('Invalid head teaching draft context.');
  return {schema:value.schema,catalogScope:value.catalogScope as HeadTeachingDraftContext['catalogScope'],packetId:value.packetId as HeadTeachingDraftContext['packetId'],packetRevision:value.packetRevision,headRevision:value.headRevision,
    checklistVersion:value.checklistVersion,checklist:value.checklist.map(item=>({id:item.id as string,label:item.label as string})),conceptIds:[...value.conceptIds],
    patientRegistration:false,clinicalApproval:false,publicationApproval:false};
}

/** Server callers must supply the actual current imported head manifest hash. */
export async function headTeachingDraftContext(manifestRevision:string,kind:HeadTeachingDraftKind='anatomy'):Promise<HeadTeachingDraftContext>{
  if(kind!=='anatomy'&&kind!=='brainstem-clinical'&&kind!=='ventricular-clinical'&&kind!=='cerebellar-clinical'&&kind!=='deep-grey-clinical'&&kind!=='lobar-clinical'&&kind!=='hippocampal-clinical'&&kind!=='mri-only-clinical'&&kind!=='mri-anatomy-checks')throw Error('Invalid head teaching draft kind.');
  if(kind==='mri-only-clinical'){
    if(await verifiedMriOnlyClinicalRevision(manifestRevision)!==MRI_ONLY_CLINICAL_REVISION)throw Error('The MRI-only clinical packet or comparison source changed.');
    const packet=mriOnlyClinicalPacket();
    return recordedContext({schema:'vm-head-teaching-draft-context-1',catalogScope:'head-mri-only-clinical-drafts',packetId:'head-mri-only-clinical',
      packetRevision:MRI_ONLY_CLINICAL_REVISION,headRevision:manifestRevision,checklistVersion:'head-mri-only-clinical-draft-review-1',
      checklist:packet.content.reviewChecks.map((label,index)=>({id:clinicalCheckIds[index],label})),conceptIds:packet.content.notes.map(note=>note.conceptId),
      patientRegistration:false,clinicalApproval:false,publicationApproval:false});
  }
  if(kind==='mri-anatomy-checks'){
    if(await verifiedHeadMriAnatomyCheckRevision(manifestRevision)!==HEAD_MRI_ANATOMY_CHECK_REVISION)throw Error('The MRI anatomy question packet, bound teaching or comparison source changed.');
    const packet=headMriAnatomyCheckPacket();
    return recordedContext({schema:'vm-head-teaching-draft-context-1',catalogScope:'head-mri-anatomy-checks-drafts',packetId:'head-mri-anatomy-checks',
      packetRevision:HEAD_MRI_ANATOMY_CHECK_REVISION,headRevision:manifestRevision,checklistVersion:'head-mri-anatomy-checks-draft-review-1',
      checklist:packet.content.reviewChecks.map((label,index)=>({id:checkIds[index],label})),conceptIds:packet.content.questions.map(question=>question.conceptId),
      patientRegistration:false,clinicalApproval:false,publicationApproval:false});
  }
  if(kind==='hippocampal-clinical'){
    if(await verifiedHippocampalClinicalRevision(manifestRevision)!==HIPPOCAMPAL_CLINICAL_REVISION)throw Error('The hippocampal clinical packet or comparison source changed.');
    const packet=hippocampalClinicalPacket();
    return recordedContext({schema:'vm-head-teaching-draft-context-1',catalogScope:'head-hippocampal-clinical-drafts',packetId:'head-hippocampal-clinical',
      packetRevision:HIPPOCAMPAL_CLINICAL_REVISION,headRevision:manifestRevision,checklistVersion:'head-hippocampal-clinical-draft-review-1',
      checklist:packet.content.reviewChecks.map((label,index)=>({id:clinicalCheckIds[index],label})),conceptIds:packet.content.notes.map(note=>note.conceptId),
      patientRegistration:false,clinicalApproval:false,publicationApproval:false});
  }
  if(kind==='lobar-clinical'){
    if(await verifiedLobarClinicalRevision(manifestRevision)!==LOBAR_CLINICAL_REVISION)throw Error('The cerebral-lobe clinical packet or comparison source changed.');
    const packet=lobarClinicalPacket();
    return recordedContext({schema:'vm-head-teaching-draft-context-1',catalogScope:'head-lobar-clinical-drafts',packetId:'head-lobar-clinical',
      packetRevision:LOBAR_CLINICAL_REVISION,headRevision:manifestRevision,checklistVersion:'head-lobar-clinical-draft-review-1',
      checklist:packet.content.reviewChecks.map((label,index)=>({id:clinicalCheckIds[index],label})),conceptIds:packet.content.notes.map(note=>note.conceptId),
      patientRegistration:false,clinicalApproval:false,publicationApproval:false});
  }
  if(kind==='deep-grey-clinical'){
    if(await verifiedDeepGreyClinicalRevision(manifestRevision)!==DEEP_GREY_CLINICAL_REVISION)throw Error('The deep-grey clinical packet or comparison source changed.');
    const packet=deepGreyClinicalPacket();
    return recordedContext({schema:'vm-head-teaching-draft-context-1',catalogScope:'head-deep-grey-clinical-drafts',packetId:'head-deep-grey-clinical',
      packetRevision:DEEP_GREY_CLINICAL_REVISION,headRevision:manifestRevision,checklistVersion:'head-deep-grey-clinical-draft-review-1',
      checklist:packet.content.reviewChecks.map((label,index)=>({id:clinicalCheckIds[index],label})),conceptIds:packet.content.notes.map(note=>note.conceptId),
      patientRegistration:false,clinicalApproval:false,publicationApproval:false});
  }
  if(kind==='cerebellar-clinical'){
    // Image-only bindings intentionally have no exact 3D destination. Do not
    // relax the existing anatomy/brainstem/ventricular 3D-binding requirement.
    if(await verifiedCerebellarClinicalRevision(manifestRevision)!==CEREBELLAR_CLINICAL_REVISION)throw Error('The cerebellar clinical packet or comparison source changed.');
    const packet=cerebellarClinicalPacket();
    return recordedContext({schema:'vm-head-teaching-draft-context-1',catalogScope:'head-cerebellar-clinical-drafts',packetId:'head-cerebellar-clinical',
      packetRevision:CEREBELLAR_CLINICAL_REVISION,headRevision:manifestRevision,checklistVersion:'head-cerebellar-clinical-draft-review-1',
      checklist:packet.content.reviewChecks.map((label,index)=>({id:clinicalCheckIds[index],label})),conceptIds:packet.content.notes.map(note=>note.conceptId),
      patientRegistration:false,clinicalApproval:false,publicationApproval:false});
  }
  const clinical=kind==='brainstem-clinical',ventricular=kind==='ventricular-clinical';
  const packet=clinical?brainstemClinicalPacket():ventricular?ventricularClinicalPacket():headTeachingPacket();
  const ids=clinical||ventricular?clinicalCheckIds:checkIds;
  if(manifestRevision!==HEAD_LINK_REVISION||manifestRevision!==packet.content.headRevision||
    packet.content.reviewChecks.length!==ids.length||packet.bindings.length!==packet.content.notes.length||
    packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||!binding.atlasHref||!binding.ctHref||!binding.mriHref))
    throw Error('The current head source does not match this teaching packet.');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  if(revision!==(clinical?BRAINSTEM_CLINICAL_REVISION:ventricular?VENTRICULAR_CLINICAL_REVISION:HEAD_TEACHING_REVISION))throw Error('The teaching packet hash does not match its content.');
  return recordedContext({schema:'vm-head-teaching-draft-context-1',catalogScope:clinical?'head-brainstem-clinical-drafts':ventricular?'head-ventricular-clinical-drafts':'head-linked-teaching-drafts',packetId:clinical?'head-brainstem-clinical':ventricular?'head-ventricular-clinical':'head-learning-anatomy',
    packetRevision:revision,headRevision:manifestRevision,checklistVersion:clinical?'head-brainstem-clinical-draft-review-1':ventricular?'head-ventricular-clinical-draft-review-1':'head-teaching-draft-review-2',
    checklist:packet.content.reviewChecks.map((label,index)=>({id:ids[index],label})),conceptIds:packet.content.notes.map(note=>note.conceptId),
    patientRegistration:false,clinicalApproval:false,publicationApproval:false});
}

export function blankHeadTeachingDraft(context:HeadTeachingDraftContext):HeadTeachingDraft{
  const checked=recordedContext(context);
  return {status:'draft',reviewer:'',qualification:'',scope:'',notes:'',checks:Object.fromEntries(checked.checklist.map(item=>[item.id,false])),attested:false};
}

export function validateHeadTeachingDraft(input:unknown,context:HeadTeachingDraftContext):HeadTeachingDraft{
  const checked=recordedContext(context);
  if(!exact(input,['status','reviewer','qualification','scope','notes','checks','attested'])||
    (input.status!=='draft'&&input.status!=='changes-required')||input.attested!==false||
    !exact(input.checks,checked.checklist.map(item=>item.id))||Object.values(input.checks).some(value=>typeof value!=='boolean'))
    throw Error('Invalid head teaching draft; approval and attestation are not supported by this contract.');
  const draft:HeadTeachingDraft={status:input.status,reviewer:text(input.reviewer,160),qualification:text(input.qualification,160),scope:text(input.scope,1000),notes:text(input.notes,8000),checks:{...input.checks} as Record<string,boolean>,attested:false};
  if(draft.status==='changes-required'&&draft.notes.length<10)throw Error('Describe the requested corrections (at least 10 characters).');
  return draft;
}

/** Strict history envelope, never a clinical approval or inherited decision. */
export function parseSavedHeadTeachingDraft(input:unknown):SavedHeadTeachingDraft{
  if(!exact(input,['eventSchema','context','version','savedAt','draft'])||input.eventSchema!=='vm-head-teaching-draft-event-1'||
    typeof input.version!=='number'||!Number.isSafeInteger(input.version)||input.version<1||input.version>2147483647||
    typeof input.savedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.savedAt)||
    !Number.isFinite(Date.parse(input.savedAt))||new Date(input.savedAt).toISOString()!==input.savedAt)
    throw Error('Invalid saved head teaching draft.');
  const context=recordedContext(input.context);
  return {eventSchema:input.eventSchema,context,version:input.version,savedAt:input.savedAt,draft:validateHeadTeachingDraft(input.draft,context)};
}

/** Historical drafts remain historical, including when only the checklist changes. */
export function headTeachingDraftStale(saved:SavedHeadTeachingDraft,context:HeadTeachingDraftContext):boolean{
  try{return JSON.stringify(parseSavedHeadTeachingDraft(saved).context)!==JSON.stringify(recordedContext(context));}
  catch{return true;}
}
