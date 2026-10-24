import {HEAD_LINK_REVISION,headConceptById} from './head-atlas-links.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,verifiedHeadMriOnlyTeachingRevision} from './head-mri-only-teaching.ts';

// Stable URL positions; changing order requires a new sequence ID, not slot reuse.
export const headMriLearningSequences=[
  {id:'mri-amygdalae',label:'Paired amygdalae · MRI only',concepts:['limbic-left-amygdala','limbic-right-amygdala']},
  {id:'mri-midline-landmarks',label:'Midline landmarks · MRI only',concepts:['commissure-corpus-callosum','endocrine-pituitary-gland']},
];
export const HEAD_MRI_LEARNING_REVISION='252282ae46e9485bc6fc43d2674c792083d75bb71828750c3e27ee42ad8bff47';
export function headMriLearningPacket(){
  return {schema:'vm-head-mri-learning-1',headRevision:HEAD_LINK_REVISION,teachingRevision:HEAD_MRI_ONLY_TEACHING_REVISION,
    status:'draft',patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'MRI-only orientation sequences across the saved MRI and existing generic 3D Atlas: separate, unregistered subjects. The callosal mask is partial; labels do not resolve nuclei, tracts, pituitary lobes or function. No CT targets are mapped. Step order is editorial, not a continuous neural pathway. No automatic camera sweep, measured physiology, scores, progress or approval are recorded.',
    sequences:headMriLearningSequences.map(sequence=>({...sequence,concepts:[...sequence.concepts],bindings:sequence.concepts.map(headConceptById)}))};
}
/** Authorized review verifies this packet independently of the original five sequences. */
export async function verifiedHeadMriLearningRevision(manifestRevision:string):Promise<string|null>{
  if(await verifiedHeadMriOnlyTeachingRevision(manifestRevision)!==HEAD_MRI_ONLY_TEACHING_REVISION)return null;
  const packet=headMriLearningPacket();
  if(packet.headRevision!==manifestRevision||packet.sequences.some(sequence=>sequence.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==sequence.concepts[index]||Object.hasOwn(binding,'ctHref')||!binding.mriHref)))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_MRI_LEARNING_REVISION?revision:null;
}
