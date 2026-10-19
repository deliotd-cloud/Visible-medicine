import {HEAD_LINK_REVISION,headAtlasConcept,headConceptById} from './head-atlas-links.ts';

/** Independent, read-only comparison evidence. Not a teaching decision or release policy. */
export const HEAD_MRI_COMPARISON_REVISION='599dcb6159ba58b16bd26d67810238155911c4d011dd03f7172faa554f6b531f';
const deepSource='6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c';
const organSource='7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915';
const root='vm:anatomy:body:head-neck:';

/** Allowlisted identity metadata only; no scan pixels, coordinates or private paths. */
const identities=[
  {conceptId:'limbic-left-amygdala',nativeId:'mrb.dgm.amygdala.left',rawLabel:'Left amygdala — regional mask',laterality:'left',representation:'mask',atlasId:root+'left:organ:left-amygdala',atlasBundle:'head-neck-nerves-deep-brain',atlasSource:deepSource},
  {conceptId:'limbic-right-amygdala',nativeId:'mrb.dgm.amygdala.right',rawLabel:'Right amygdala — regional mask',laterality:'right',representation:'mask',atlasId:root+'right:organ:right-amygdala',atlasBundle:'head-neck-nerves-deep-brain',atlasSource:deepSource},
  {conceptId:'commissure-corpus-callosum',nativeId:'mrb.wmt.corpus_callosum',rawLabel:'Corpus callosum — regional mask',laterality:'midline_or_unpaired',representation:'partial-mask',atlasId:root+'midline:organ:corpus-callosum',atlasBundle:'head-neck-nerves-deep-brain',atlasSource:deepSource},
  {conceptId:'endocrine-pituitary-gland',nativeId:'mrb.orb.pituitary_gland',rawLabel:'Pituitary gland — regional mask',laterality:'midline_or_unpaired',representation:'mask',atlasId:root+'unpaired:organ:pituitary-gland',atlasBundle:'head-neck-organs-recovery',atlasSource:organSource},
] as const;

export function headMriComparisonPacket(){
  return {
    schema:'vm-head-mri-comparison-review-1',packetId:'head-mri-only-comparisons',status:'draft',headRevision:HEAD_LINK_REVISION,
    patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Four MRI-only semantic comparisons with the existing generic 3D Atlas. Different subjects and potentially different anatomical extents; no patient-space registration, scan-derived 3D geometry or clinical sign-off. No exact whole-concept CT binding is mapped. CT point locators, callosal subparts and the pituitary fossa are not substitutes.',
    reviewChecks:[
      'Confirm the exact native MRI ID, raw label, laterality and mask representation against this head manifest revision.',
      'Inspect the saved MRI extent; the callosal partial mask is not a complete corpus callosum segmentation.',
      'Inspect the exact generic 3D structure and bundle hash, independently of the MRI subject.',
      'Keep CT gaps explicit; do not replace these concepts with points, subparts or neighbouring structures.',
      'Record any future comparison decision against this independent packet revision, not the teaching or guided-sequence revisions.',
    ],
    items:identities.map(identity=>({...identity,binding:headConceptById(identity.conceptId)})),
  };
}
export type HeadMriComparisonPacket=ReturnType<typeof headMriComparisonPacket>;

/** Fail closed on a stale source, changed identity, changed link or changed packet text. */
export async function verifiedHeadMriComparisonPacket(manifestRevision:string):Promise<HeadMriComparisonPacket|null>{
  const packet=headMriComparisonPacket();
  if(manifestRevision!==HEAD_LINK_REVISION||manifestRevision!==packet.headRevision)return null;
  for(const item of packet.items){
    const native=headAtlasConcept({id:item.nativeId,label:item.rawLabel,laterality:item.laterality,representation:item.representation},'MRI');
    const binding=item.binding;
    if(!binding||!native||JSON.stringify(native)!==JSON.stringify(binding)||Object.hasOwn(binding,'ctHref')||
      binding.mriHref!==`/atlas/mri-head?concept=${item.conceptId}`)return null;
    const expected=new URLSearchParams({study:'1',structure:item.atlasId,side:item.laterality==='midline_or_unpaired'?'both':item.laterality,source:item.atlasSource,concept:item.conceptId});
    if(binding.atlasHref!==`/atlas/head-neck-3d?${expected}`)return null;
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_MRI_COMPARISON_REVISION?packet:null;
}
