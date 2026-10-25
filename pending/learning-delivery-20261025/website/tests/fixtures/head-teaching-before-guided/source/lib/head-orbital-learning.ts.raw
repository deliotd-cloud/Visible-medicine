import {HEAD_LINK_REVISION,headConceptById} from './head-atlas-links.ts';
import {HEAD_ORBITAL_TEACHING_REVISION,verifiedHeadOrbitalTeachingRevision} from './head-orbital-teaching.ts';

// Stable published URL positions: do not reuse slots for different structures.
export const headOrbitalLearningSequences=[
  {id:'globes',label:'Paired globes · coverage comparison',concepts:['orbit-left-globe','orbit-right-globe']},
];
export const HEAD_ORBITAL_LEARNING_REVISION='03e2088ef9e8219729362408bb204b4b7db6aabf68993427b1db631f015e1448';
export function headOrbitalLearningPacket(){
  return {schema:'vm-head-orbital-learning-1',headRevision:HEAD_LINK_REVISION,teachingRevision:HEAD_ORBITAL_TEACHING_REVISION,
    status:'draft',patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Compare left then right globe coverage in the saved CT and MRI studies and the existing generic 3D Atlas. The MRI masks cover regional portions only. Confirm laterality using native orientation markers, inspect adjacent slices and hide overlays to assess the underlying images. Individual eye layers and the optic nerve are not matched by these globe links. CT, MRI and generic Atlas are separate, unregistered subjects; shape, position and boundaries are not synchronized. Step order is editorial, not a continuous pathway. No visual function, diagnosis, patient registration, score, progress, completion or approval is established or recorded.',
    sequences:headOrbitalLearningSequences.map(sequence=>({...sequence,concepts:[...sequence.concepts],bindings:sequence.concepts.map(headConceptById)}))};
}
/** Independent draft packet verification, bound to orbital teaching and exact links. */
export async function verifiedHeadOrbitalLearningRevision(manifestRevision:string):Promise<string|null>{
  if(await verifiedHeadOrbitalTeachingRevision(manifestRevision)!==HEAD_ORBITAL_TEACHING_REVISION)return null;
  const packet=headOrbitalLearningPacket();
  if(packet.headRevision!==manifestRevision||packet.sequences.some(sequence=>sequence.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==sequence.concepts[index]||!binding.ctHref||!binding.mriHref||!binding.atlasHref)))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_ORBITAL_LEARNING_REVISION?revision:null;
}
