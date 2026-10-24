import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';

/** Original factual summaries and learner exercises; no source text or assets imported. */
export const headMriOnlyTeachingContent={
  schema:'vm-head-mri-only-teaching-1',headRevision:HEAD_LINK_REVISION,status:'draft',reviewedAt:null,
  patientRegistration:false,clinicalApproval:false,publicationApproval:false,
  sources:[
    {id:'ut-amygdala',title:'UTHealth · Amygdala anatomy and emotional learning',url:'https://nba.uth.tmc.edu/neuroscience/m/s4/chapter06.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text, figures or datasets imported.'},
    {id:'ut-callosum',title:'UTHealth · Corpus callosum and medial cerebral structures',url:'https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p22_index.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text, figures or datasets imported.'},
    {id:'nci-pituitary',title:'NIH/NCI SEER · Pituitary anatomy and endocrine roles',url:'https://training.seer.cancer.gov/anatomy/endocrine/glands/pituitary.html',accessed:'2026-10-08',reuse:'Factual reference only. Original summaries credit NIH/NCI SEER; no text, figures or datasets imported.'},
  ],
  notes:[
    ...(['left','right'] as const).map(side=>({
      conceptId:`limbic-${side}-amygdala`,
      anatomy:{text:`The ${side} amygdala lies at the anterior end of the hippocampal region in the medial temporal lobe.`,sources:['ut-amygdala']},
      function:{text:'Amygdalar networks help associate sensory events with emotional significance and learned responses, including rewarding and aversive experiences.',sources:['ut-amygdala']},
      imaging:{text:'Check the actual MRI sequence and native orientation markers. Inspect this saved outline with the overlay hidden, then compare adjacent slices and another plane. The label alone does not resolve individual amygdalar nuclei or establish tissue normality.',sources:[]},
      task:`Confirm the patient’s ${side} side using native markers. Compare the saved amygdala and hippocampal extents where both are visible. Keep their labels separate; do not infer an internal nuclear boundary or an emotional response from a mask.`,
      scope:'Teaching draft · not clinically signed off. The saved amygdalar mask does not identify separate nuclei, connecting tracts or functional activation. MRI and generic 3D Atlas are separate, unregistered subjects; matching names are semantic comparisons only. No exact CT comparison is mapped.',
    })),
    {conceptId:'commissure-corpus-callosum',
      anatomy:{text:'The corpus callosum is a midline white-matter commissure. Its named regions include rostrum, genu, body and splenium.',sources:['ut-callosum']},
      function:{text:'Callosal fibres connect cerebral areas across the two hemispheres; a regional outline does not demonstrate the individual connections.',sources:['ut-callosum']},
      imaging:{text:'Inspect the native sagittal MRI with the overlay hidden before comparing the saved partial mask in another plane. Its endpoint is the saved regional extent, not proof of the complete callosal boundary or a fibre-tract map.',sources:[]},
      task:'Describe which portion is actually covered by the saved mask. Do not promote CT point locators for callosal subparts to a whole corpus callosum comparison, or infer tract integrity from this outline.',
      scope:'Teaching draft · not clinically signed off. This MRI mask covers a regional portion only; it is not a complete callosal segmentation, tractography or functional connectivity study. MRI and generic 3D Atlas are separate, unregistered subjects. No exact whole-concept CT comparison is mapped.',
    },
    {conceptId:'endocrine-pituitary-gland',
      anatomy:{text:'The pituitary occupies the sphenoid bone’s sella turcica and connects to the hypothalamus through the infundibular stalk. It has distinct anterior and posterior regions.',sources:['nci-pituitary']},
      function:{text:'Hormones released from its anterior and posterior regions help regulate growth, other endocrine glands and water balance. Hypothalamic input regulates the two regions by different mechanisms.',sources:['nci-pituitary']},
      imaging:{text:'Check the actual native MRI sequence and resolution. Inspect the saved gland outline in sagittal and coronal views with the overlay hidden. Do not infer a separate stalk or lobe segmentation, hormone status or a normal gland from this whole-gland label.',sources:[]},
      task:'Distinguish the gland from its bony container. Inspect the saved MRI extent, then compare the fixed generic 3D gland target; the CT pituitary fossa is not an equivalent gland segmentation.',
      scope:'Teaching draft · not clinically signed off. This gland label does not separately resolve its lobes, stalk or cell populations and does not measure endocrine function. MRI and generic 3D Atlas are separate, unregistered subjects. No exact CT gland comparison is mapped.',
    },
  ],
} as const;

export const HEAD_MRI_ONLY_TEACHING_REVISION='fc36d805260460f51b5be65a074a4d70624b7f63e77039f2b670d10c96b5004c';
export function headMriOnlyTeachingPacket(){return {content:headMriOnlyTeachingContent,bindings:headMriOnlyTeachingContent.notes.map(note=>headConceptById(note.conceptId))};}

export function headMriOnlyTeachingForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(modality!=='MRI'||revision!==HEAD_LINK_REVISION)return null;
  const note=headMriOnlyTeachingContent.notes.find(note=>note.conceptId===conceptId),concept=headConceptById(conceptId);
  if(!note||!concept||concept.headRevision!==revision||Object.hasOwn(concept,'ctHref')||!concept.mriHref)return null;
  const ids=new Set<string>([...note.anatomy.sources,...note.function.sources,...note.imaging.sources]);
  return {note,concept,imaging:note.imaging,scope:note.scope,sources:headMriOnlyTeachingContent.sources.filter(source=>ids.has(source.id)),revision:HEAD_MRI_ONLY_TEACHING_REVISION};
}

/** Reference 3D gets common facts only: never native MRI exercises or signal guidance. */
export function headMriOnlyTeachingForReference(conceptId:string,revision:string){
  const value=headMriOnlyTeachingForConcept(conceptId,'MRI',revision);if(!value)return null;
  const ids=new Set<string>([...value.note.anatomy.sources,...value.note.function.sources]);
  return {concept:value.concept,anatomy:value.note.anatomy,function:value.note.function,scope:value.scope,
    sources:headMriOnlyTeachingContent.sources.filter(source=>ids.has(source.id)),revision:value.revision};
}

/** Called by the authorized review page, independent of the original teaching form. */
export async function verifiedHeadMriOnlyTeachingRevision(manifestRevision:string):Promise<string|null>{
  const packet=headMriOnlyTeachingPacket();
  if(manifestRevision!==HEAD_LINK_REVISION||packet.content.headRevision!==manifestRevision||packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||Object.hasOwn(binding,'ctHref')||!binding.mriHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_MRI_ONLY_TEACHING_REVISION?revision:null;
}
