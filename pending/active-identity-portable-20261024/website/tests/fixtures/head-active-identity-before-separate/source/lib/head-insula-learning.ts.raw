import {HEAD_LINK_REVISION,headConceptById} from './head-atlas-links.ts';
import {HEAD_INSULA_TEACHING_REVISION,verifiedHeadInsulaTeachingRevision} from './head-insula-teaching.ts';

// Stable published URL positions: do not reuse slots for different structures.
export const headInsulaLearningSequences=[
  {id:'insulae',label:'Paired insulae · coverage comparison',concepts:['cortex-left-insula','cortex-right-insula']},
];
export const HEAD_INSULA_LEARNING_REVISION='3639c4e99a9076604a6e2b572c4455d92ef5a986a07a6346f86e4213560e07e6';
export function headInsulaLearningPacket(){
  return {schema:'vm-head-insula-learning-1',headRevision:HEAD_LINK_REVISION,teachingRevision:HEAD_INSULA_TEACHING_REVISION,
    status:'draft',patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Compare left then right insular coverage in the existing generic 3D Atlas and the saved native studies. CT regional masks and MRI partial masks do not establish complete cortical boundaries. CT, MRI and generic Atlas are separate, unregistered subjects. Confirm laterality using native orientation markers; hide overlays to inspect the underlying image. Step order is editorial, not a continuous pathway. No automatic camera sweep, diagnosis, score, progress or approval is recorded.',
    sequences:headInsulaLearningSequences.map(sequence=>({...sequence,concepts:[...sequence.concepts],bindings:sequence.concepts.map(headConceptById)}))};
}
/** Independent authorized review, never inherited from an older teaching decision. */
export async function verifiedHeadInsulaLearningRevision(manifestRevision:string):Promise<string|null>{
  if(await verifiedHeadInsulaTeachingRevision(manifestRevision)!==HEAD_INSULA_TEACHING_REVISION)return null;
  const packet=headInsulaLearningPacket();
  if(packet.headRevision!==manifestRevision||packet.sequences.some(sequence=>sequence.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==sequence.concepts[index]||!binding.ctHref||!binding.mriHref)))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_INSULA_LEARNING_REVISION?revision:null;
}
