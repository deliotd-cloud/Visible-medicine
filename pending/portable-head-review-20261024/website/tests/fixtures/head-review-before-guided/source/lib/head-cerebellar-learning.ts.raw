import {HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {headImageConceptById} from './head-image-only-links.ts';
import {HEAD_CEREBELLAR_TEACHING_REVISION,verifiedHeadCerebellarTeachingRevision} from './head-cerebellar-teaching.ts';

// Published step positions are stable; reordering requires a new sequence ID.
export const headCerebellarLearningSequences=[
  {id:'cerebellar-orientation',label:'Cerebellar orientation · CT/MRI only',concepts:['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis']},
];
export const HEAD_CEREBELLAR_LEARNING_REVISION='b16bb7d2830a9d80adeff7c6fba75da6db7bd0c403084916cfdb3447235f239f';
export function headCerebellarLearningPacket(){
  return {schema:'vm-head-cerebellar-learning-1',headRevision:HEAD_LINK_REVISION,teachingRevision:HEAD_CEREBELLAR_TEACHING_REVISION,
    status:'draft',clinicalApproval:false,publicationApproval:false,patientRegistration:false,
    scope:'Native CT/MRI orientation only. These are separate, unregistered subjects; MRI vermis coverage is partial. There is no exact matching 3D Atlas part. Step order is editorial, not a connected pathway or spatial registration. Navigation records no scores, progress or approval; scored practice is an explicitly separate action.',
    sequences:headCerebellarLearningSequences.map(sequence=>({...sequence,concepts:[...sequence.concepts],bindings:sequence.concepts.map(headImageConceptById)}))};
}
export async function verifiedHeadCerebellarLearningRevision(manifestRevision:string):Promise<string|null>{
  if(await verifiedHeadCerebellarTeachingRevision(manifestRevision)!==HEAD_CEREBELLAR_TEACHING_REVISION)return null;
  const packet=headCerebellarLearningPacket();
  if(packet.headRevision!==manifestRevision||packet.sequences.some(sequence=>sequence.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==sequence.concepts[index]||binding.atlasHref||!binding.ctHref||!binding.mriHref)))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_CEREBELLAR_LEARNING_REVISION?revision:null;
}
