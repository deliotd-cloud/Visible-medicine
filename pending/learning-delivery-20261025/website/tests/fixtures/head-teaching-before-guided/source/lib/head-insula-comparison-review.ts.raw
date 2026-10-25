import {HEAD_LINK_REVISION,headAtlasConcept,headConceptById} from './head-atlas-links.ts';

/** Independent comparison evidence, not a teaching decision or patient registration. */
export const HEAD_INSULA_COMPARISON_REVISION='000ef8732b522db2396d7315727c18d7d09b79e5b9916bba381450fe730d11c1';
const parentId='vm:anatomy:body:head-neck:midline:organ:brain';
const parentSource='f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335';
const partSource='7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410';

/** Public identity metadata only. No scan pixels, private paths or coordinates. */
export function headInsulaComparisonPacket(){
  return {
    schema:'vm-head-insula-comparison-review-1',packetId:'head-insula-comparisons',status:'draft',
    headRevision:HEAD_LINK_REVISION,patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Two semantic comparisons between CT, partial MRI masks and existing generic cerebral 3D surfaces. These are separate, unregistered subjects with different regional coverage. No shared patient-space position, complete MRI segmentation or clinical sign-off is established.',
    reviewChecks:[
      'Confirm each exact CT and MRI ID, raw source label and laterality against this head manifest revision.',
      'Inspect CT and MRI extents independently; the MRI representation is a partial-mask, not an equivalent complete segmentation.',
      'Inspect each generic insula with its exact cerebral part source and brain parent source; source surfaces remain anatomically unvalidated.',
      'Assess whether each representation supports the intended comparison without implying spatial registration or matching boundaries.',
      'Keep any future decision bound to this independent packet revision. Original teaching and MRI-only notes do not approve these comparisons.',
    ],
    items:(['left','right'] as const).map(side=>{
      const conceptId=`cortex-${side}-insula`,label=`${side==='left'?'Left':'Right'} insula — regional mask`;
      return {conceptId,
        ct:{id:`cth.ctx.insula.${side}`,label,laterality:side,representation:'mask'},
        mri:{id:`mrb.ctx.insula.${side}`,label,laterality:side,representation:'partial-mask'},
        atlas:{parentId,parentSource,partId:`vm:anatomy:body:head-neck:${side}:organ:${side}-insula`,partSource,detail:'cerebral'},
        binding:headConceptById(conceptId),
      };
    }),
  };
}
export type HeadInsulaComparisonPacket=ReturnType<typeof headInsulaComparisonPacket>;

export async function verifiedHeadInsulaComparisonPacket(manifestRevision:string):Promise<HeadInsulaComparisonPacket|null>{
  const packet=headInsulaComparisonPacket();
  if(manifestRevision!==HEAD_LINK_REVISION||packet.headRevision!==manifestRevision)return null;
  for(const item of packet.items){
    const {binding,atlas}=item;
    if(!binding||binding.ctHref!==`/atlas/ct-head?concept=${item.conceptId}`||binding.mriHref!==`/atlas/mri-head?concept=${item.conceptId}`)return null;
    for(const modality of ['CT','MRI'] as const){
      const native=headAtlasConcept(modality==='CT'?item.ct:item.mri,modality);
      if(!native||JSON.stringify(native)!==JSON.stringify(binding))return null;
    }
    const expected=new URLSearchParams({study:'2',structure:atlas.parentId,side:item.ct.laterality,source:atlas.parentSource,detail:atlas.detail,part:atlas.partId,partSource:atlas.partSource,concept:item.conceptId});
    if(binding.atlasHref!==`/atlas/head-neck-3d?${expected}`)return null;
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_INSULA_COMPARISON_REVISION?packet:null;
}
