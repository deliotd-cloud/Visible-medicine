import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';

/** Original clinical orientation only. No article text, figures, cases or datasets imported. */
export const mriOnlyClinicalContent={
  schema:'vm-head-mri-only-clinical-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',status:'draft',
  clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Clinical teaching draft awaiting independent radiologist review. These are general correlations, not findings in the teaching MRI. The native MRI and existing generic 3D Atlas are separate, unregistered subjects. No exact CT correspondence is mapped for either whole concept.',
  sources:[
    {id:'pituitary-society-2025',title:'Gurnell / Pituitary Society (2025) · Incidentaloma consensus presentation',url:'https://pituitarysociety.org/wp-content/uploads/2025/11/ABSTRACT-BOOK-FINAL-.pdf#page=14',evidence:'Official congress abstract, printed page 12 (PDF page 14), summarizing the Society’s consensus. It identifies separate imaging, hormonal and visual assessment; not the full guideline or an individual management protocol.'},
    {id:'splenium-2022',title:'Förster et al. (2022) · Diffusion Restricted Lesions in the Splenium of the Corpus Callosum',url:'https://pubmed.ncbi.nlm.nih.gov/35478124/',evidence:'Retrospective comparison of 23 selected cases across three diagnostic groups. Overlapping diffusion findings do not establish a universal diagnostic rule.'},
  ],
  reuse:'Original factual summaries with credited primary references only. No third-party text, figures, models, scans or datasets copied; access does not confer asset-reuse rights. No new dependency, font, asset or fee.',
  accessed:'2026-10-11',
  notes:[
    {conceptId:'endocrine-pituitary-gland',title:'Pituitary · appearance is not endocrine function',
      text:'The Pituitary Society’s incidentaloma framework considers dedicated pituitary imaging, hormone testing and visual assessment as distinct questions. A gland outline alone cannot answer all three.',
      caution:'The whole-gland mask identifies neither a lesion nor separate lobes, stalk, hormone-producing cells or optic-chiasm compression. No abnormality is asserted in this teaching subject.',
      sources:['pituitary-society-2025'],
      imaging:{text:'An anatomical MRI label is not a dedicated pituitary protocol or an endocrine test. Check the acquired sequence and resolution; a smooth outline does not establish a normal gland or exclude a small lesion.',sources:['pituitary-society-2025']},
      question:'Does an apparently normal gland outline establish normal pituitary hormone function?',
      answer:'No. Anatomical appearance and endocrine function require different evidence. This atlas supplies orientation, not a hormonal assessment or management decision.'},
    {conceptId:'commissure-corpus-callosum',title:'Corpus callosum · splenial restriction is not a single diagnosis',
      text:'A small retrospective MRI study compared splenial lesions in Marchiafava–Bignami syndrome, reversible splenial lesions and isolated ischemic stroke. All three groups had diffusion-weighted hyperintensity, and relative ADC values did not significantly distinguish the groups.',
      caution:'Those selected cases do not provide a universal classification rule. This saved partial callosal mask is neither a complete corpus callosum segmentation nor a lesion, splenium or fibre-tract map.',
      sources:['splenium-2022'],
      imaging:{text:'Interpret diffusion findings with lesion distribution, morphology and clinical context, not ADC alone. Inspect actual DWI and ADC acquisitions when available; reformatted anatomical images are not diffusion sequences. This teaching label is not evidence of restricted diffusion.',sources:['splenium-2022']},
      question:'Does restricted diffusion in the splenium by itself prove an ischemic infarct?',
      answer:'No. The study illustrates overlap between different causes. Acquired sequences, lesion pattern and clinical context remain necessary; the atlas outline does not diagnose any of them.'},
  ],
  reviewChecks:[
    'Check the original summaries against the cited primary abstract and study; retain their evidence-strength limitations.',
    'Confirm no teaching subject is labelled as diseased, hormonally normal, diffusion-restricted or examined with an unprovided acquisition.',
    'Inspect both exact MRI and existing 3D targets; retain the whole-gland and partial-callosal extent limits and no exact CT correspondence.',
    'Review this independent packet revision. Existing anatomy, MRI-only teaching and other clinical correction forms neither save nor approve it.',
  ],
} as const;

export const MRI_ONLY_CLINICAL_REVISION='7aea768dd0ffb76208cb1a1a785747c022259273856884ade32119a2442b3f1f';
export function mriOnlyClinicalPacket(){return {content:mriOnlyClinicalContent,bindings:mriOnlyClinicalContent.notes.map(note=>headConceptById(note.conceptId))};}

export function mriOnlyClinicalForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(modality!=='MRI'||!headLinksCurrent()||revision!==HEAD_LINK_REVISION||revision!==mriOnlyClinicalContent.headRevision)return null;
  const item=mriOnlyClinicalContent.notes.find(note=>note.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!item||!binding||binding.conceptId!==conceptId||binding.headRevision!==revision||Object.hasOwn(binding,'ctHref')||!binding.mriHref||!binding.atlasHref)return null;
  const {imaging,...note}=item,ids=new Set<string>([...note.sources,...imaging.sources]);
  return {note,binding,imaging,sources:mriOnlyClinicalContent.sources.filter(source=>ids.has(source.id)),scope:mriOnlyClinicalContent.scope,revision:MRI_ONLY_CLINICAL_REVISION};
}

/** Reference 3D receives shared clinical context and reflection, never native MRI instructions. */
export function mriOnlyClinicalForReference(conceptId:string,revision:string){
  const value=mriOnlyClinicalForConcept(conceptId,'MRI',revision);if(!value)return null;
  const ids=new Set<string>(value.note.sources);
  return {note:value.note,binding:value.binding,scope:value.scope,
    sources:mriOnlyClinicalContent.sources.filter(source=>ids.has(source.id)),revision:value.revision};
}

/** Authorized Review binds the complete content and exact MRI/3D targets, not an inherited approval. */
export async function verifiedMriOnlyClinicalRevision(manifestRevision:string):Promise<string|null>{
  if(!headLinksCurrent()||manifestRevision!==HEAD_LINK_REVISION||manifestRevision!==mriOnlyClinicalContent.headRevision)return null;
  const packet=mriOnlyClinicalPacket();
  if(packet.bindings.some((binding,index)=>!binding||binding.conceptId!==packet.content.notes[index].conceptId||binding.headRevision!==manifestRevision||Object.hasOwn(binding,'ctHref')||!binding.mriHref||!binding.atlasHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===MRI_ONLY_CLINICAL_REVISION?revision:null;
}
