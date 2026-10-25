import {HEAD_LINK_REVISION,headAtlasConcept,headConceptById} from './head-atlas-links.ts';

/** Independent comparison evidence; never inherited teaching approval. */
export const HEAD_CT_BONE_COMPARISON_REVISION='084e59bd489af3f913a7f757c738d0b71ca2f0f69a00e6bd1140f611c3865605';
const sourceHash='c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4';
const identities=[
  ['bone-left-parietal','cth.skl.parietal_bone.left','Left parietal bone','left','left:bone:left-parietal-bone'],
  ['bone-right-parietal','cth.skl.parietal_bone.right','Right parietal bone','right','right:bone:right-parietal-bone'],
  ['bone-left-nasal','cth.fac.nasal_bone.left','Left nasal bone','left','left:bone:left-nasal-bone'],
  ['bone-right-nasal','cth.fac.nasal_bone.right','Right nasal bone','right','right:bone:right-nasal-bone'],
  ['bone-occipital','cth.skl.occipital_bone','Occipital bone','midline_or_unpaired','midline:bone:occipital-bone'],
  ['bone-ethmoid','cth.skl.ethmoid_bone','Ethmoid bone','midline_or_unpaired','midline:bone:ethmoid'],
] as const;

/** Public anatomical identities only, not scan metadata or private derivatives. */
export function headCtBoneComparisonPacket(){
  return {
    schema:'vm-head-ct-bone-comparison-review-1',packetId:'head-ct-bone-comparisons',status:'draft',
    headRevision:HEAD_LINK_REVISION,patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Six CT-only concept comparisons with existing generic 3D bones. Every CT mask is partial; it does not represent a whole bone. Different subjects and extents; no patient-space registration or clinical approval. No exact MRI targets are mapped.',
    reviewChecks:[
      'Check each native ID, raw label, laterality and partial-mask representation against the exact head manifest revision.',
      'Inspect the saved CT region and confirm its actual extent; do not treat it as a complete bone boundary.',
      'Inspect the generic bone, side and source bundle independently. Generic surfaces remain anatomically unvalidated.',
      'Judge whether the semantic comparison is educationally useful despite different subjects and extents. Do not infer alignment, measured distances, diagnostic normality or MRI equivalence.',
      'Record any future decision against this independent packet revision. Existing teaching and MRI review forms do not approve these bindings.',
    ],
    items:identities.map(([conceptId,id,label,laterality,suffix])=>({
      conceptId,ct:{id,label:label+' — regional mask',laterality,representation:'partial-mask'},
      atlas:{structureId:'vm:anatomy:body:head-neck:'+suffix,sourceHash,study:'1',side:laterality==='midline_or_unpaired'?'both':laterality},
      binding:headConceptById(conceptId),
    })),
  };
}
export type HeadCtBoneComparisonPacket=ReturnType<typeof headCtBoneComparisonPacket>;

export async function verifiedHeadCtBoneComparisonPacket(manifestRevision:string):Promise<HeadCtBoneComparisonPacket|null>{
  if(manifestRevision!==HEAD_LINK_REVISION)return null;
  const packet=headCtBoneComparisonPacket();
  for(const item of packet.items){
    const {binding,atlas}=item;
    if(!binding||binding.ctHref!==`/atlas/ct-head?concept=${item.conceptId}`||Object.hasOwn(binding,'mriHref'))return null;
    const native=headAtlasConcept(item.ct,'CT');
    if(!native||JSON.stringify(native)!==JSON.stringify(binding))return null;
    const expected=new URLSearchParams({study:atlas.study,structure:atlas.structureId,side:atlas.side,source:atlas.sourceHash,concept:item.conceptId});
    if(binding.atlasHref!==`/atlas/head-neck-3d?${expected}`)return null;
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_CT_BONE_COMPARISON_REVISION?packet:null;
}
