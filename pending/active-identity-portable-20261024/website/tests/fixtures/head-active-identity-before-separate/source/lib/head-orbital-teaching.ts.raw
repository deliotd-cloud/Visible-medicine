import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {HEAD_ORBITAL_COMPARISON_REVISION,verifiedHeadOrbitalComparisonPacket} from './head-orbital-comparison-review.ts';

/** Original factual summaries; no external illustrations, scans or text are imported. */
export const headOrbitalTeachingContent={
  schema:'vm-head-orbital-teaching-1',headRevision:HEAD_LINK_REVISION,comparisonRevision:HEAD_ORBITAL_COMPARISON_REVISION,
  status:'draft',reviewedAt:null,patientRegistration:false,clinicalApproval:false,publicationApproval:false,
  sources:[
    {id:'nei-eye-parts',title:'National Eye Institute · Cataracts and the Eye: anatomical parts',url:'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/cataracts/cataracts-and-eye',accessed:'2026-10-08',reuse:'Factual reference only. Original summary; no source prose, illustrations, media or datasets imported. No endorsement or reuse permission assumed.'},
    {id:'nei-vision',title:'National Eye Institute · How the Eyes Work',url:'https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work',accessed:'2026-10-08',reuse:'Factual reference only. Original summary; no source prose, illustrations, media or datasets imported. No endorsement or reuse permission assumed.'},
  ],
  imaging:{
    CT:{text:'Use native orientation markers to confirm the side, then inspect the globe across adjacent CT slices with the overlay hidden and shown. Describe where the saved mask starts and stops. This globe label does not separately delineate the cornea, lens, retina or optic nerve; their visibility must be assessed on the actual images, not inferred from the overlay.',sources:[]},
    MRI:{text:'Check the actual MRI sequence and orientation before describing the image. Follow the visible globe through adjacent slices with the overlay hidden and shown. The saved MRI mask covers a regional portion only: its edge is not proof of the complete globe boundary or of an individual eye layer. Do not infer normal vision or exclude disease from this mask.',sources:[]},
  },
  scope:'Teaching draft · awaiting radiologist review. The links compare a CT globe mask, a partial MRI globe mask and a generic 3D eyeball. Individual eye layers and the optic nerve are not matched by this globe link. These are separate, unregistered subjects; shape, image position and boundaries are not synchronized. Existing generic anatomy remains unvalidated. No clinical or publication approval is recorded.',
  notes:(['left','right'] as const).map(side=>({
    conceptId:`orbit-${side}-globe`,
    anatomy:{text:`The ${side} globe is the eyeball. Its supporting outer wall is largely sclera, with transparent cornea at the front. The lens is an internal optical structure; the light-sensitive retina lies at the back. A globe outline alone does not identify these separate tissues.`,sources:['nei-eye-parts']},
    function:{text:'Cornea and lens focus incoming light onto retinal photoreceptors. Retinal signals reach the brain through the optic nerve. Recognizing the globe on a structural image does not establish visual function.',sources:['nei-vision']},
    task:`Confirm the patient's ${side} side using the native markers, not the side of the screen. Compare two neighbouring slices and toggle the overlay. Describe the visible mask coverage, then explain why a globe selection is not a separate retinal or lens segmentation.`,
  })),
} as const;

export const HEAD_ORBITAL_TEACHING_REVISION='bf2d06becc092ea5f7a85814dfdd43dd5ae791ff95918f49ccd1ae200300b17a';
export function headOrbitalTeachingPacket(){return {content:headOrbitalTeachingContent,bindings:headOrbitalTeachingContent.notes.map(note=>headConceptById(note.conceptId))};}
export function headOrbitalTeachingForConcept(conceptId:string,modality:HeadModality,revision:string){
  if((modality!=='CT'&&modality!=='MRI')||revision!==HEAD_LINK_REVISION)return null;
  const note=headOrbitalTeachingContent.notes.find(note=>note.conceptId===conceptId),concept=headConceptById(conceptId);
  if(!note||!concept||concept.headRevision!==revision||!concept.ctHref||!concept.mriHref)return null;
  const imaging=headOrbitalTeachingContent.imaging[modality];
  const ids=new Set<string>([...note.anatomy.sources,...note.function.sources,...imaging.sources]);
  return {note,concept,imaging,scope:headOrbitalTeachingContent.scope,sources:headOrbitalTeachingContent.sources.filter(source=>ids.has(source.id)),revision:HEAD_ORBITAL_TEACHING_REVISION};
}

/** Generic reference omits scan-specific interpretation and exercises. */
export function headOrbitalTeachingForReference(conceptId:string,revision:string){
  const value=headOrbitalTeachingForConcept(conceptId,'CT',revision);if(!value)return null;
  return {concept:value.concept,anatomy:value.note.anatomy,function:value.note.function,scope:value.scope,sources:value.sources,revision:value.revision};
}

export async function verifiedHeadOrbitalTeachingRevision(manifestRevision:string):Promise<string|null>{
  if(!await verifiedHeadOrbitalComparisonPacket(manifestRevision))return null;
  const packet=headOrbitalTeachingPacket();
  if(packet.content.headRevision!==manifestRevision||packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||!binding.ctHref||!binding.mriHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HEAD_ORBITAL_TEACHING_REVISION?revision:null;
}
