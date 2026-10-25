import {HEAD_LINK_REVISION,headConceptById} from './head-atlas-links.ts';
import {HEAD_CT_BONE_COMPARISON_REVISION,verifiedHeadCtBoneComparisonPacket} from './head-ct-bone-comparison-review.ts';

// Stable URL positions; a changed order requires a new sequence identity.
export const headCtBoneLearningSequences=[
  {id:'ct-parietal-occipital',label:'Parietal and occipital coverage · CT only',concepts:['bone-left-parietal','bone-right-parietal','bone-occipital']},
  {id:'ct-nasal-ethmoid',label:'Nasal and ethmoid coverage · CT only',concepts:['bone-left-nasal','bone-right-nasal','bone-ethmoid']},
];
export const HEAD_CT_BONE_LEARNING_REVISION='7741c9c60ad93a94b62d83855c4cd5ee5bdb0ffdbb07563f8654750632d7569f';
export function headCtBoneLearningPacket(){
  return {schema:'vm-head-ct-bone-learning-1',headRevision:HEAD_LINK_REVISION,comparisonRevision:HEAD_CT_BONE_COMPARISON_REVISION,
    status:'draft',patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Two CT-only coverage sequences using six existing source-bound bone comparisons. Each saved CT mask is partial, not a complete bone. Confirm side using native orientation markers, inspect adjacent slices and hide overlays to inspect the image. Compare the generic 3D bone separately; subjects, positions and extents differ. No exact MRI target is mapped. Step order is editorial, not a continuous anatomical pathway. These tours do not establish spatial registration, fracture assessment, scores, completion or clinical approval. Existing comparison decisions do not approve a sequence.',
    sequences:headCtBoneLearningSequences.map(sequence=>({...sequence,concepts:[...sequence.concepts],bindings:sequence.concepts.map(headConceptById)}))};
}
/** Verify ordered drafts independently; comparison approval is never inherited. */
export async function verifiedHeadCtBoneLearningRevision(manifestRevision:string):Promise<string|null>{
  const comparison=await verifiedHeadCtBoneComparisonPacket(manifestRevision);
  if(!comparison)return null;
  const packet=headCtBoneLearningPacket();
  if(packet.headRevision!==manifestRevision||packet.sequences.some(sequence=>sequence.bindings.some((binding,index)=>
    !binding||binding.headRevision!==manifestRevision||binding.conceptId!==sequence.concepts[index]||!binding.ctHref||Object.hasOwn(binding,'mriHref')||!binding.atlasHref||
    !comparison.items.some(item=>item.conceptId===binding.conceptId&&JSON.stringify(item.binding)===JSON.stringify(binding)))))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_CT_BONE_LEARNING_REVISION?revision:null;
}
