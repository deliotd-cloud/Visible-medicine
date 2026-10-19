import {HEAD_LINK_REVISION,headAtlasConcept,headConceptById} from './head-atlas-links.ts';

/** Independent addition: the original six-bone comparison packet is untouched. */
export const HEAD_CT_FACIAL_COMPARISON_REVISION='63984aa3eadf24ca1ca012b8cc08e6b227507b9db0411aed0ceae31636ccbaf7';
export const CT_FACIAL_COMPARISON_CONCEPTS=['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'] as const;
const sourceHash='c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4';
const identities=[
  ['bone-left-zygomatic','cth.fac.zygomatic_bone.left','Left zygomatic bone — limited region','left','partial-mask','left:bone:left-zygomatic-bone'],
  ['bone-right-zygomatic','cth.fac.zygomatic_bone.right','Right zygomatic bone — limited region','right','partial-mask','right:bone:right-zygomatic-bone'],
  ['bone-mandible','cth.fac.mandible','Mandible — regional mask','midline_or_unpaired','mask','midline:bone:mandible'],
] as const;

/** Public anatomy identities only. No pixels, mask derivatives or scan metadata. */
export function headCtFacialComparisonPacket(){
  return {schema:'vm-head-ct-facial-comparison-review-1',packetId:'head-ct-facial-comparisons',status:'draft',
    headRevision:HEAD_LINK_REVISION,patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Three CT-only semantic comparisons: limited-region zygomatic masks and the saved mandible mask with existing generic 3D bones. Representation names do not establish complete coverage. Subjects and extents differ; there is no patient-space registration, diagnostic or fracture assessment, MRI counterpart, clinical approval or publication approval. These bindings have an independent review revision; earlier skull-bone, teaching or tour decisions do not approve them.',
    reviewChecks:[
      'Verify native ID, exact raw label, laterality and representation against the pinned head manifest.',
      'Inspect the actual saved CT extent with overlays hidden and shown. Limited regions and a mask-type label are not evidence of a complete whole bone.',
      'Inspect the generic bone independently, including source bundle, side, boundaries and missing anatomy; these generic surfaces remain unvalidated.',
      'Assess educational semantic usefulness only. Do not infer matching subjects, coordinates, distances, normality, fracture detection or MRI equivalence.',
      'Record an explicit decision against this independent comparison packet, not inherited geometry, teaching, tour or publication approval.',
    ],
    items:identities.map(([conceptId,id,label,laterality,representation,suffix])=>({conceptId,
      ct:{id,label,laterality,representation},
      atlas:{structureId:'vm:anatomy:body:head-neck:'+suffix,sourceHash,study:'1',side:laterality==='midline_or_unpaired'?'both':laterality},
      binding:headConceptById(conceptId)}))};
}
export type HeadCtFacialComparisonPacket=ReturnType<typeof headCtFacialComparisonPacket>;

export async function verifiedHeadCtFacialComparisonPacket(manifestRevision:string):Promise<HeadCtFacialComparisonPacket|null>{
  if(manifestRevision!==HEAD_LINK_REVISION)return null;
  const packet=headCtFacialComparisonPacket();
  for(const item of packet.items){
    const {binding,atlas}=item;
    if(!binding||binding.ctHref!==`/atlas/ct-head?concept=${item.conceptId}`||Object.hasOwn(binding,'mriHref'))return null;
    if(JSON.stringify(headAtlasConcept(item.ct,'CT'))!==JSON.stringify(binding))return null;
    const query=new URLSearchParams({study:atlas.study,structure:atlas.structureId,side:atlas.side,source:atlas.sourceHash,concept:item.conceptId});
    if(binding.atlasHref!==`/atlas/head-neck-3d?${query}`)return null;
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===HEAD_CT_FACIAL_COMPARISON_REVISION?packet:null;
}
