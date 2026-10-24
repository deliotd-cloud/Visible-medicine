import {HEAD_LINK_REVISION,headConceptById} from './head-atlas-links.ts';
import {headImageOnlyComparisonPacket,headImageConcept,headImageConceptById} from './head-image-only-links.ts';

export const HEAD_IMAGE_ONLY_COMPARISON_REVISION='53fb7d5fd236b6b1ef27466a9f4a9ffbae89702015ea0971bd0781cc4a1071d0';
export type HeadImageOnlyComparisonPacket=ReturnType<typeof headImageOnlyComparisonPacket>;

/** Exact identity metadata only. Verification is not clinical acceptance. */
export async function verifiedHeadImageOnlyComparisonPacket(manifestRevision:string):Promise<HeadImageOnlyComparisonPacket|null>{
  if(manifestRevision!==HEAD_LINK_REVISION)return null;
  const packet=headImageOnlyComparisonPacket();
  if(packet.headRevision!==manifestRevision)return null;
  for(const item of packet.bindings){
    const binding=headImageConceptById(item.conceptId);
    if(!binding||binding.atlasHref||headConceptById(item.conceptId)||
      binding.ctHref!==`/atlas/ct-head?concept=${item.conceptId}`||binding.mriHref!==`/atlas/mri-head?concept=${item.conceptId}`)return null;
    for(const modality of ['CT','MRI'] as const){
      if(JSON.stringify(headImageConcept(modality==='CT'?item.ct:item.mri,modality))!==JSON.stringify(binding))return null;
    }
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_IMAGE_ONLY_COMPARISON_REVISION?packet:null;
}
