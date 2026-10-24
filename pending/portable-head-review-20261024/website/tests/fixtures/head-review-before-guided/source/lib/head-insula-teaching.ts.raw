import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';

/** Original short factual summaries; references are not imported assets or permissions. */
export const headInsulaTeachingContent={
  schema:'vm-head-insula-teaching-1',headRevision:HEAD_LINK_REVISION,status:'draft',reviewedAt:null,
  patientRegistration:false,clinicalApproval:false,publicationApproval:false,
  sources:[
    {id:'ut-insula',title:'UTHealth · Insular lobe: location and sensory roles',url:'https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p26_index.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no source text, figures or datasets imported.'},
    {id:'truwit-1990',title:'Truwit et al. · Early CT loss of the insular ribbon (Radiology, 1990)',url:'https://pubmed.ncbi.nlm.nih.gov/2389039/',accessed:'2026-10-08',reuse:'Original research reference only. No source text, figures or datasets imported.'},
  ],
  imaging:{
    CT:{text:'Hide the overlay and inspect the insular grey–white interface on native CT. Reduced definition of this interface can be an early sign of middle cerebral artery infarction. This is general teaching, not a finding asserted in this case; the saved mask neither diagnoses nor excludes ischaemia.',sources:['truwit-1990']},
    MRI:{text:'Check the actual MRI sequence and native orientation, then inspect adjacent slices with the overlay hidden. This saved partial mask covers only a regional portion of the insula. Describe the visible coverage without extending it to the whole cortex or inferring tissue normality, function or a vascular territory.',sources:[]},
  },
  scope:'Teaching draft · awaiting radiologist review. CT uses a regional mask; MRI uses a partial mask. Generic insular surfaces do not separately label individual gyri or functional subdivisions. CT, MRI and generic Atlas are separate, unregistered subjects; matching names do not establish spatial correspondence, matching boundaries or clinical sign-off.',
  notes:(['left','right'] as const).map(side=>({
    conceptId:`cortex-${side}-insula`,
    anatomy:{text:`The ${side} insula is a cortical region recessed within the lateral sulcus, rather than on the exposed outer surface of the hemisphere.`,sources:['ut-insula']},
    function:{text:'Insular cortex participates in taste and sensation from internal organs. A structural outline does not map these functions.',sources:['ut-insula']},
    task:`Confirm the patient's ${side} side from native orientation markers. Inspect the saved insular extent with the overlay shown and hidden; compare its coverage with the separately sourced 3D surface. Name the difference between a partial mask and a complete anatomical boundary.`,
  })),
} as const;

export const HEAD_INSULA_TEACHING_REVISION='29728058abf40309b84fc269fa498a6b490073b14d1bc5db17f09ed8153183ef';
export function headInsulaTeachingPacket(){return {content:headInsulaTeachingContent,bindings:headInsulaTeachingContent.notes.map(note=>headConceptById(note.conceptId))};}

export function headInsulaTeachingForConcept(conceptId:string,modality:HeadModality,revision:string){
  if((modality!=='CT'&&modality!=='MRI')||revision!==HEAD_LINK_REVISION)return null;
  const note=headInsulaTeachingContent.notes.find(note=>note.conceptId===conceptId),concept=headConceptById(conceptId);
  if(!note||!concept||concept.headRevision!==revision||!concept.ctHref||!concept.mriHref)return null;
  const imaging=headInsulaTeachingContent.imaging[modality];
  const ids=new Set<string>([...note.anatomy.sources,...note.function.sources,...imaging.sources]);
  return {note,concept,imaging,scope:headInsulaTeachingContent.scope,sources:headInsulaTeachingContent.sources.filter(source=>ids.has(source.id)),revision:HEAD_INSULA_TEACHING_REVISION};
}

/** Generic 3D reference receives no native image interpretation or scan exercise. */
export function headInsulaTeachingForReference(conceptId:string,revision:string){
  const value=headInsulaTeachingForConcept(conceptId,'CT',revision);if(!value)return null;
  const ids=new Set<string>([...value.note.anatomy.sources,...value.note.function.sources]);
  return {concept:value.concept,anatomy:value.note.anatomy,function:value.note.function,scope:value.scope,
    sources:headInsulaTeachingContent.sources.filter(source=>ids.has(source.id)),revision:value.revision};
}

export async function verifiedHeadInsulaTeachingRevision(manifestRevision:string):Promise<string|null>{
  const packet=headInsulaTeachingPacket();
  if(manifestRevision!==HEAD_LINK_REVISION||packet.content.headRevision!==manifestRevision||packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||!binding.ctHref||!binding.mriHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_INSULA_TEACHING_REVISION?revision:null;
}
