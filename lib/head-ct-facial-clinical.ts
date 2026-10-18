import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';
import {HEAD_CT_FACIAL_COMPARISON_REVISION,verifiedHeadCtFacialComparisonPacket} from './head-ct-facial-comparison-review.ts';

const zygomatic={
  text:'Zygomatic-complex injuries can extend across the orbital rim, orbital walls or floor, facial buttress and arch. The injury pattern is not confined to the cheekbone surface.',
  caution:'A limited zygomatic annotation cannot establish the presence, absence or extent of an injury in those neighbouring regions. None is claimed to be abnormal in this atlas subject.',
  sources:['ao-zygoma'],
  question:'Does the saved zygomatic region cover every structure relevant to a zygomatic-complex injury?',
  answer:'No. The saved annotation has limited extent. Assessment of an injury requires the actual images and relevant neighbouring anatomy, not this coloured outline alone.',
};

/** Original factual paraphrases only; no source prose, images, scans or cases. */
export const headCtFacialClinicalContent={
  schema:'vm-head-ct-facial-clinical-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',
  comparisonRevision:HEAD_CT_FACIAL_COMPARISON_REVISION,status:'draft',reviewedAt:null,
  clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Clinical orientation draft awaiting independent revision-bound radiologist review. General injury context, not findings in the source CT or generic 3D model. Zygomatic annotations are limited regions; a mandible mask label does not certify whole-bone coverage. The generic model and CT are separate unregistered subjects. The same general note on left and right does not assert equal findings or risk. No exact MRI target, X-ray/US case, diagnosis, treatment advice, graded exam result or publication approval is supplied.',
  accessed:'2026-10-16',
  reuse:'Original summaries and links only. Reference access is not image, article-text, model or dataset reuse permission; no third-party asset, dependency, font or fee is introduced.',
  sources:[
    {id:'ao-zygoma',title:'AO Surgery Reference · Zygoma, zygomatic complex fracture',url:'https://surgeryreference.aofoundation.org/cmf/trauma/midface/zygoma-complex/definition',evidence:'Expert-authored surgical reference describing associated orbital/arch/buttress anatomy and CT planes. Not a cohort risk estimate, assessment of this scan or reuse grant.'},
    {id:'ao-mandible',title:'AO Surgery Reference · Examination of patients with mandibular fractures',url:'https://surgeryreference.aofoundation.org/cmf/trauma/mandible/further-reading/patient-examination',evidence:'Expert-authored examination and imaging reference. History, clinical assessment including occlusion, and image review are distinct from atlas annotation. No images or source prose reused.'},
  ],
  imaging:{CT:{
    text:'Review the underlying CT across the available native planes with the annotation hidden and shown. A 3D outline is not a substitute for the image review described in the cited references. Named neighbouring landmarks may lie outside the saved mask or image coverage.',
    sources:['ao-zygoma','ao-mandible'],
  }},
  notes:[
    {conceptId:'bone-left-zygomatic',title:'Left zygomatic region · injury patterns extend beyond the mask',...zygomatic},
    {conceptId:'bone-right-zygomatic',title:'Right zygomatic region · injury patterns extend beyond the mask',...zygomatic},
    {conceptId:'bone-mandible',title:'Mandible · clinical occlusion is not encoded by an outline',
      text:'Assessment of suspected mandibular injury combines history, physical examination and imaging. Altered dental occlusion is an important clinical observation.',
      caution:'This static mask records neither the patient’s bite, symptoms nor dental examination. It is not a fracture assessment and does not certify complete mandibular coverage or normality.',
      sources:['ao-mandible'],
      question:'Can selecting this mandibular outline establish the patient’s dental occlusion?',
      answer:'No. A static anatomical annotation does not record a clinical bite assessment. Keep the model, underlying CT and clinical examination as distinct evidence.'},
  ],
  reviewChecks:[
    'Verify the exact three CT identities, raw labels, side, representation and independent generic 3D source bindings against the accepted manifest.',
    'Read the expert references and review the cautious original clinical wording; no probability, management recommendation or abnormal finding is attributed to this source case.',
    'Retain limited zygomatic extent, uncertain complete-mandible coverage, absent MRI/X-ray/US counterparts and separate unregistered subjects.',
    'Review this clinical packet independently; older comparison, anatomy, quiz, tour or publication decisions cannot approve it.',
  ],
} as const;

export const HEAD_CT_FACIAL_CLINICAL_REVISION='4cedbbb0c72474fd0536790f51eb8bd6e8a2772ca65f09d19da057bd39ca4ed3';
export function headCtFacialClinicalPacket(){return {content:headCtFacialClinicalContent,bindings:headCtFacialClinicalContent.notes.map(note=>headConceptById(note.conceptId))};}

export function headCtFacialClinicalForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(!headLinksCurrent()||modality!=='CT'||revision!==HEAD_LINK_REVISION||revision!==headCtFacialClinicalContent.headRevision)return null;
  const note=headCtFacialClinicalContent.notes.find(note=>note.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!note||!binding||binding.headRevision!==revision||binding.conceptId!==conceptId||binding.ctHref!==`/atlas/ct-head?concept=${conceptId}`||!binding.atlasHref||Object.hasOwn(binding,'mriHref'))return null;
  const imaging=headCtFacialClinicalContent.imaging.CT,ids=new Set<string>([...note.sources,...imaging.sources]);
  return {note,binding,imaging,sources:headCtFacialClinicalContent.sources.filter(source=>ids.has(source.id)),scope:headCtFacialClinicalContent.scope,revision:HEAD_CT_FACIAL_CLINICAL_REVISION};
}

/** Generic reference receives general clinical orientation, not a scan task. */
export function headCtFacialClinicalForReference(conceptId:string,revision:string){
  const value=headCtFacialClinicalForConcept(conceptId,'CT',revision);if(!value)return null;
  const ids=new Set<string>(value.note.sources);
  return {note:value.note,binding:value.binding,sources:headCtFacialClinicalContent.sources.filter(source=>ids.has(source.id)),scope:value.scope,revision:value.revision};
}

/** Separate content hash and complete comparison pins, never clinical approval. */
export async function verifiedHeadCtFacialClinicalRevision(manifestRevision:string,candidate:unknown=headCtFacialClinicalPacket()):Promise<string|null>{
  if(!headLinksCurrent()||manifestRevision!==HEAD_LINK_REVISION)return null;
  const comparison=await verifiedHeadCtFacialComparisonPacket(manifestRevision);
  if(!comparison||headCtFacialClinicalContent.headRevision!==manifestRevision||comparison.items.length!==headCtFacialClinicalContent.notes.length)return null;
  const current=headCtFacialClinicalPacket();
  if(current.content.comparisonRevision!==HEAD_CT_FACIAL_COMPARISON_REVISION)return null;
  for(const [index,item] of comparison.items.entries()){
    const note=current.content.notes[index],binding=current.bindings[index];
    if(note.conceptId!==item.conceptId||!binding||JSON.stringify(binding)!==JSON.stringify(item.binding)||Object.hasOwn(binding,'mriHref'))return null;
  }
  let encoded:string|undefined;try{encoded=JSON.stringify(candidate);}catch{return null;}
  if(encoded!==JSON.stringify(current))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(encoded));
  const revision=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_CT_FACIAL_CLINICAL_REVISION?revision:null;
}
