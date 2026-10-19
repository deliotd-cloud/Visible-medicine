import {HEAD_LINK_REVISION,type HeadModality} from './head-atlas-links.ts';
import {headImageConceptById} from './head-image-only-links.ts';
import {HEAD_IMAGE_ONLY_COMPARISON_REVISION,verifiedHeadImageOnlyComparisonPacket} from './head-image-only-comparison-review.ts';

/** Original summaries and exercises. No external diagrams, text or datasets imported. */
export const headCerebellarTeachingContent={
  schema:'vm-head-cerebellar-teaching-1',headRevision:HEAD_LINK_REVISION,comparisonRevision:HEAD_IMAGE_ONLY_COMPARISON_REVISION,
  status:'draft',reviewedAt:null,patientRegistration:false,clinicalApproval:false,publicationApproval:false,
  sources:[
    {id:'ut-cerebellum',title:'UTHealth Neuroscience Online · Cerebellum (James Knierim)',url:'https://nba.uth.tmc.edu/neuroscience/s3/chapter05.html',accessed:'2026-10-10',reuse:'Factual reference only; original summary. No source prose, illustrations, media or datasets imported. No endorsement or commercial reuse permission for source assets assumed.'},
    {id:'ut-cerebellum-lab',title:'UTHealth Neuroanatomy Online · Cerebellum and Brainstem',url:'https://nba.uth.tmc.edu/neuroanatomy/L5/Lab05p22_index.html',accessed:'2026-10-10',reuse:'Factual reference only; original summary. No source prose, illustrations, media or datasets imported. No endorsement or commercial reuse permission for source assets assumed.'},
  ],
  imaging:{
    CT:{text:'Confirm the native orientation, then compare the saved outline with the CT across neighbouring slices and another plane. Hide the overlay before describing the image itself. Identify where saved coverage ends; the mask does not certify complete anatomy, normal tissue or a diagnosis.',sources:[]},
    MRI:{text:'Check the actual MRI sequence and native orientation before describing signal. Compare adjacent slices and another plane, with the overlay hidden and shown. The vermis mask has partial coverage. A named hemisphere mask does not separately delineate cerebellar lobules, deep nuclei or functional zones, and does not establish normality.',sources:[]},
  },
  scope:'Teaching draft · awaiting radiologist review. These CT/MRI concept links join separate, unregistered subjects, not matched coordinates. No exact matching 3D Atlas part is mapped. The MRI vermis is partial; saved extents are not certified complete boundaries. No clinical or publication approval is recorded. Comparison decisions do not approve this independent teaching packet.',
  notes:[
    ...(['left','right'] as const).map(side=>({
      conceptId:`cerebellum-${side}-hemisphere`,
      anatomy:{text:`The ${side} cerebellar hemisphere lies lateral to the midline vermis. Cerebellar cortex overlies deeper tissue and nuclei; a hemisphere label is not a separate segmentation of those components.`,sources:['ut-cerebellum-lab']},
      function:{text:'Cerebellar circuits help coordinate and adapt movement. Lateral cerebellar regions participate in movement planning and timing; a whole-hemisphere mask is not a functional map.',sources:['ut-cerebellum']},
      task:`Confirm the patient's ${side} side from the orientation markers. Trace the saved hemisphere through adjacent slices, then compare its outline with the opposite side without assuming symmetry. Explain which visible boundaries belong to the saved mask rather than a separately labelled lobule or nucleus.`,
    })),
    {conceptId:'cerebellum-vermis',
      anatomy:{text:'The vermis is the midline cerebellar region between the hemispheres. It is distinct from a lateral hemisphere; this label does not identify its individual lobules.',sources:['ut-cerebellum-lab']},
      function:{text:'The vermis participates in spinocerebellar circuits that combine sensory information with motor commands to adjust coordination. A static mask cannot demonstrate those connections or their function.',sources:['ut-cerebellum']},
      task:'Use the native orientation markers to inspect the midline region in more than one plane. On MRI, identify the limits of the partial saved mask. Compare CT and MRI as separate examples of the concept, not as aligned views of one subject.',
    },
  ],
} as const;

export const HEAD_CEREBELLAR_TEACHING_REVISION='9cce154f427183be142fb0ec601aa19137c017f85b8c3feaa1b0db6842253a3a';
export function headCerebellarTeachingPacket(){return {content:headCerebellarTeachingContent,bindings:headCerebellarTeachingContent.notes.map(note=>headImageConceptById(note.conceptId))};}
export function headCerebellarTeachingForConcept(conceptId:string,modality:HeadModality,revision:string){
  if((modality!=='CT'&&modality!=='MRI')||revision!==HEAD_LINK_REVISION)return null;
  const note=headCerebellarTeachingContent.notes.find(note=>note.conceptId===conceptId),concept=headImageConceptById(conceptId);
  if(!note||!concept||concept.headRevision!==revision||concept.atlasHref||!concept.ctHref||!concept.mriHref)return null;
  const imaging=headCerebellarTeachingContent.imaging[modality];
  const ids=new Set<string>([...note.anatomy.sources,...note.function.sources,...imaging.sources]);
  return {note,concept,imaging,scope:headCerebellarTeachingContent.scope,sources:headCerebellarTeachingContent.sources.filter(source=>ids.has(source.id)),revision:HEAD_CEREBELLAR_TEACHING_REVISION};
}

/** Review identity only; never inherits comparison acceptance or certifies masks. */
export async function verifiedHeadCerebellarTeachingRevision(manifestRevision:string):Promise<string|null>{
  if(!await verifiedHeadImageOnlyComparisonPacket(manifestRevision))return null;
  const packet=headCerebellarTeachingPacket();
  if(packet.content.headRevision!==manifestRevision||packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||binding.atlasHref||!binding.ctHref||!binding.mriHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_CEREBELLAR_TEACHING_REVISION?revision:null;
}
