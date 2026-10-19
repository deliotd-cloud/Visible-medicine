import {HEAD_LINK_REVISION,headConceptById} from './head-atlas-links.ts';
import {HEAD_CT_FACIAL_COMPARISON_REVISION,verifiedHeadCtFacialComparisonPacket} from './head-ct-facial-comparison-review.ts';

// Stable URL positions. Changing the order needs a new sequence identity.
const facialConcepts=['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'] as const;
export const headCtFacialLearningSequences=[
  {id:'ct-facial-coverage',label:'Facial bone coverage · CT only',concepts:[...facialConcepts]},
];
const scope='One CT-only editorial sequence using the independent semantic comparison packet. Both zygomatic masks cover limited regions; the saved mandible regional mask is not evidence of a complete whole bone. Confirm side using native orientation markers, inspect adjacent slices and hide overlays to inspect the image. Compare generic 3D bones separately; subjects, positions and extents differ. No exact MRI target is mapped. Step order is editorial, not a continuous anatomical pathway. This guide does not establish spatial registration, diagnosis, fracture assessment, quiz scores, completion, clinical approval or publication approval. Existing comparison decisions do not approve the sequence.';

// This revision pins the sequence independently of the facial comparison and older tours.
export const HEAD_CT_FACIAL_LEARNING_REVISION='c3c4b999e726c585c96a989dc3c1a2cf2b5991e2160c138b2977c7e06dbaae83';
export function headCtFacialLearningPacket(){
  return {schema:'vm-head-ct-facial-learning-1',headRevision:HEAD_LINK_REVISION,comparisonRevision:HEAD_CT_FACIAL_COMPARISON_REVISION,
    status:'draft',patientRegistration:false,clinicalApproval:false,publicationApproval:false,scope,
    sequences:headCtFacialLearningSequences.map(sequence=>({...sequence,concepts:[...sequence.concepts],
      bindings:sequence.concepts.map(conceptId=>headConceptById(conceptId))}))};
}

/** A verified comparison supplies bindings, not approval of the ordered guide. */
export async function verifiedHeadCtFacialLearningRevision(manifestRevision:string):Promise<string|null>{
  const comparison=await verifiedHeadCtFacialComparisonPacket(manifestRevision);
  if(!comparison)return null;
  const packet=headCtFacialLearningPacket();
  if(packet.headRevision!==manifestRevision||packet.comparisonRevision!==HEAD_CT_FACIAL_COMPARISON_REVISION||
    packet.schema!=='vm-head-ct-facial-learning-1'||packet.status!=='draft'||
    packet.patientRegistration||packet.clinicalApproval||packet.publicationApproval||packet.scope!==scope||
    packet.sequences.length!==1||comparison.items.length!==facialConcepts.length)return null;
  const sequence=packet.sequences[0];
  if(sequence.id!=='ct-facial-coverage'||sequence.label!=='Facial bone coverage · CT only'||
    sequence.concepts.length!==facialConcepts.length||sequence.bindings.length!==facialConcepts.length)return null;
  for(const [index,conceptId] of facialConcepts.entries()){
    const binding=sequence.bindings[index],item=comparison.items[index];
    if(sequence.concepts[index]!==conceptId||!binding||!item||item.conceptId!==conceptId||
      binding.headRevision!==manifestRevision||binding.conceptId!==conceptId||
      binding.ctHref!==`/atlas/ct-head?concept=${conceptId}`||!binding.atlasHref||
      Object.hasOwn(binding,'mriHref')||JSON.stringify(item.binding)!==JSON.stringify(binding))return null;
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_CT_FACIAL_LEARNING_REVISION?revision:null;
}
