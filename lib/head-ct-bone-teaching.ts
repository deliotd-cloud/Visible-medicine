import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {HEAD_CT_BONE_COMPARISON_REVISION,verifiedHeadCtBoneComparisonPacket} from './head-ct-bone-comparison-review.ts';

/** Original short factual summaries. No source prose, illustrations, scans or exercises are imported. */
export const headCtBoneTeachingContent={
  schema:'vm-head-ct-bone-teaching-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',comparisonRevision:HEAD_CT_BONE_COMPARISON_REVISION,
  status:'draft',reviewedAt:null,patientRegistration:false,clinicalApproval:false,publicationApproval:false,
  sources:[{
    id:'openstax-skull',title:'OpenStax · Anatomy and Physiology 2e · 7.2 The Skull',
    url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull',accessed:'2026-10-09',
    reuse:'Factual reference only. Original summary; no source prose, illustrations, media, exercises or datasets imported. No licence or reuse permission inferred.',
  }],
  imaging:{
    CT:{text:'Confirm the native side and trace the saved region through neighbouring CT slices. Compare the actual image with the partial-mask overlay hidden and shown. A named landmark may lie outside this region or be unresolved on this image; do not infer its capture from the bone label.',sources:[]},
  },
  scope:'Teaching draft · awaiting revision-bound radiologist review. Six CT-only partial bone masks link to generic 3D bones. They are separate, unregistered subjects with different extents; the saved masks do not outline whole bones. No MRI counterpart, patient-space alignment, diagnostic conclusion, clinical approval or publication approval is recorded. Generic 3D surfaces require independent anatomical review.',
  notes:[
    {conceptId:'bone-left-parietal',
      anatomy:{text:'The left parietal forms upper lateral braincase. Paired parietals meet above, between frontal and occipital bones.',sources:['openstax-skull']},
      function:{text:'This part of the braincase helps protect the brain.',sources:['openstax-skull']},
      task:'Use native markers to confirm left. Follow neighbouring slices, toggle the partial mask, then compare its extent with the separate generic left parietal bone.'},
    {conceptId:'bone-right-parietal',
      anatomy:{text:'The right parietal forms upper lateral braincase. Paired parietals meet above, between frontal and occipital bones.',sources:['openstax-skull']},
      function:{text:'This part of the braincase helps protect the brain.',sources:['openstax-skull']},
      task:'Use native markers to confirm right. Follow neighbouring slices, toggle the partial mask, then compare its extent with the separate generic right parietal bone.'},
    {conceptId:'bone-left-nasal',
      anatomy:{text:'The left nasal bone contributes to the paired bony bridge of the nose.',sources:['openstax-skull']},
      function:{text:'The bony bridge supports nasal cartilage.',sources:['openstax-skull']},
      task:'Confirm left on the native image. Trace the saved region across slices and compare the partial mask with the separate generic left nasal bone.'},
    {conceptId:'bone-right-nasal',
      anatomy:{text:'The right nasal bone contributes to the paired bony bridge of the nose.',sources:['openstax-skull']},
      function:{text:'The bony bridge supports nasal cartilage.',sources:['openstax-skull']},
      task:'Confirm right on the native image. Trace the saved region across slices and compare the partial mask with the separate generic right nasal bone.'},
    {conceptId:'bone-occipital',
      anatomy:{text:'The occipital bone forms the posterior skull and base. The foramen magnum passes through it.',sources:['openstax-skull']},
      function:{text:'Its condyles articulate with the atlas and help support the head.',sources:['openstax-skull']},
      task:'Inspect the posterior native CT across slices with the partial mask hidden and shown. Compare the generic bone separately; determine whether any named landmark is actually visible.'},
    {conceptId:'bone-ethmoid',
      anatomy:{text:'The ethmoid contributes to the upper nasal septum, nasal roof and medial orbital wall.',sources:['openstax-skull']},
      function:{text:'Olfactory nerve branches pass through openings in its cribriform plate.',sources:['openstax-skull']},
      task:'Inspect adjacent native CT slices and toggle the partial mask. Compare the generic ethmoid separately; do not assume the saved region resolves cribriform openings.'},
  ],
} as const;

export const HEAD_CT_BONE_TEACHING_REVISION='2a15fac2f81c3bd68324a4f3a32faaeb8ef477b0acfb1181c676a962ed7a7137';
export function headCtBoneTeachingPacket(){return {content:headCtBoneTeachingContent,bindings:headCtBoneTeachingContent.notes.map(note=>headConceptById(note.conceptId))};}

export function headCtBoneTeachingForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(modality!=='CT'||revision!==HEAD_LINK_REVISION)return null;
  const note=headCtBoneTeachingContent.notes.find(note=>note.conceptId===conceptId),concept=headConceptById(conceptId);
  if(!note||!concept||concept.headRevision!==revision||concept.ctHref!==`/atlas/ct-head?concept=${conceptId}`||Object.hasOwn(concept,'mriHref'))return null;
  const imaging=headCtBoneTeachingContent.imaging.CT;
  const ids=new Set<string>([...note.anatomy.sources,...note.function.sources,...imaging.sources]);
  return {note,concept,imaging,scope:headCtBoneTeachingContent.scope,sources:headCtBoneTeachingContent.sources.filter(source=>ids.has(source.id)),revision:HEAD_CT_BONE_TEACHING_REVISION};
}

/** Generic reference excludes scan-specific reading tasks and the CT imaging note. */
export function headCtBoneTeachingForReference(conceptId:string,revision:string){
  const value=headCtBoneTeachingForConcept(conceptId,'CT',revision);if(!value)return null;
  return {concept:value.concept,anatomy:value.note.anatomy,function:value.note.function,scope:value.scope,sources:value.sources,revision:value.revision};
}

export async function verifiedHeadCtBoneTeachingRevision(manifestRevision:string):Promise<string|null>{
  const comparison=await verifiedHeadCtBoneComparisonPacket(manifestRevision);
  if(!comparison||headCtBoneTeachingContent.headRevision!==manifestRevision||headCtBoneTeachingContent.comparisonRevision!==HEAD_CT_BONE_COMPARISON_REVISION||comparison.items.length!==headCtBoneTeachingContent.notes.length)return null;
  const packet=headCtBoneTeachingPacket();
  for(let index=0;index<comparison.items.length;index++){
    const item=comparison.items[index],note=packet.content.notes[index],binding=packet.bindings[index];
    if(note.conceptId!==item.conceptId||!binding||JSON.stringify(binding)!==JSON.stringify(item.binding)||Object.hasOwn(binding,'mriHref'))return null;
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_CT_BONE_TEACHING_REVISION?revision:null;
}
