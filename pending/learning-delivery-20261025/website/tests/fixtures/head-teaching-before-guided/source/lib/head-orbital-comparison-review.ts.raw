import {HEAD_LINK_REVISION,headAtlasConcept,headConceptById} from './head-atlas-links.ts';

/** Independent semantic comparison draft; no patient registration or teaching approval. */
export const HEAD_ORBITAL_COMPARISON_REVISION='46dad07e2b98482755eef0bccc84002f26d1626bb9b7996735755f55a70ee382';
const sourceHash='7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915';

/** Anatomical identity metadata only; no patient geometry, images or local paths. */
export function headOrbitalComparisonPacket(){
  return {
    schema:'vm-head-orbital-comparison-review-1',packetId:'head-orbital-comparisons',status:'draft',
    headRevision:HEAD_LINK_REVISION,patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Two semantic globe comparisons between CT masks, partial MRI masks and existing generic 3D eyeballs. Separate, unregistered subjects with different regional coverage; this does not establish matching boundaries, complete MRI segmentation or clinical sign-off.',
    reviewChecks:[
      'Confirm each exact native ID, raw source label, laterality and representation against this head manifest revision.',
      'Inspect the CT and partial MRI extents independently; do not infer equivalent boundaries or complete segmentation.',
      'Inspect the left and right generic eyeballs against their exact source bundle. The generic surfaces remain anatomically unvalidated.',
      'Confirm the globe-to-eyeball concept comparison is useful without implying agreement of shape, position or patient identity. Orbit, lens and optic nerve are not substituted.',
      'Keep any future decision bound to this separate packet revision. Existing head teaching, MRI-only and insula review decisions do not approve it.',
    ],
    items:(['left','right'] as const).map(side=>{
      const conceptId=`orbit-${side}-globe`,label=`${side==='left'?'Left':'Right'} globe — regional mask`;
      return {conceptId,
        ct:{id:`cth.orb.globe.${side}`,label,laterality:side,representation:'mask'},
        mri:{id:`mrb.orb.globe.${side}`,label,laterality:side,representation:'partial-mask'},
        atlas:{structureId:`vm:anatomy:body:head-neck:${side}:organ:${side}-eyeball`,sourceHash,study:'1',side},
        binding:headConceptById(conceptId),
      };
    }),
  };
}
export type HeadOrbitalComparisonPacket=ReturnType<typeof headOrbitalComparisonPacket>;

export async function verifiedHeadOrbitalComparisonPacket(manifestRevision:string):Promise<HeadOrbitalComparisonPacket|null>{
  if(manifestRevision!==HEAD_LINK_REVISION)return null;
  const packet=headOrbitalComparisonPacket();
  for(const item of packet.items){
    const {binding,atlas}=item;
    if(!binding||binding.ctHref!==`/atlas/ct-head?concept=${item.conceptId}`||binding.mriHref!==`/atlas/mri-head?concept=${item.conceptId}`)return null;
    for(const modality of ['CT','MRI'] as const){
      const native=headAtlasConcept(modality==='CT'?item.ct:item.mri,modality);
      if(!native||JSON.stringify(native)!==JSON.stringify(binding))return null;
    }
    const expected=new URLSearchParams({study:atlas.study,structure:atlas.structureId,side:atlas.side,source:atlas.sourceHash,concept:item.conceptId});
    if(binding.atlasHref!==`/atlas/head-neck-3d?${expected}`)return null;
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_ORBITAL_COMPARISON_REVISION?packet:null;
}
