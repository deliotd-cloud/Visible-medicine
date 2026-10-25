import {hippocampalConcepts,hippocampalTeachingReferences} from '../atlas-review/content/hippocampal-teaching.ts';
import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';

// Reuse the existing source lesson, not a second independently authored diagnosis.
const source=hippocampalConcepts.find(item=>item.id==='cerebral-hippocampus');
const references=hippocampalTeachingReferences;
function sourceCurrent(){
  if(hippocampalConcepts.length!==1||!source||source.study!=='cerebral'||
    JSON.stringify(source.fmaIds)!==JSON.stringify(['FMA72714','FMA72713']))return false;
  const sections=[source.sections.clinical,source.sections.pathology,source.imaging?.ct,source.imaging?.mri];
  return sections.every(section=>section?.readiness==='draft'&&section.body.length>0&&section.references.length>0&&
    section.references.every(id=>Object.hasOwn(references,id)));
}
const clinicalSourceIds=[...new Set([...(source?.sections.clinical.references??[]),...(source?.sections.pathology.references??[])])];

/** Existing original factual summaries and primary-source links; no article images or datasets. */
export const hippocampalClinicalContent={
  schema:'vm-hippocampal-clinical-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',status:'draft',
  clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  sourceTeaching:{path:'atlas-review/content/hippocampal-teaching.ts',conceptId:'cerebral-hippocampus'},
  scope:'Clinical orientation drafts reused from the existing 3D hippocampal teaching, awaiting independent radiologist review. CT, MRI and the existing reference 3D Atlas are separate, unregistered subjects. A selected mask supplies neither an individual diagnosis nor evidence of hippocampal sclerosis, epileptogenicity, memory performance or subfield boundaries. The 2019 MRI protocol reference does not establish that the displayed teaching study acquired that protocol; reformatting cannot supply an unacquired sequence or contrast.',
  sources:[
    {id:'hippocampalLearning',...references.hippocampalLearning,evidence:'UTHealth neuroscience teaching on medial temporal memory and distributed learning systems; not an individual memory assessment.'},
    {id:'hippocampalMRI',...references.hippocampalMRI,evidence:'ILAE 2019 structural MRI consensus, reused from the existing source lesson. Protocol and hippocampal sclerosis context, not confirmation of this teaching scan’s protocol, pathology or clinical approval.'},
  ],
  reuse:'Reuses the existing original 3D Atlas teaching and its primary-source links. No article passages, figures, scans, models or datasets copied. Access to a reference does not grant image-reuse rights. No new dependency, font, asset or fee.',
  accessed:'2026-10-11',
  imaging:{
    CT:{text:source?.imaging?.ct?.body??'',sources:source?.imaging?.ct?.references??[]},
    MRI:{text:source?.imaging?.mri?.body??'',sources:source?.imaging?.mri?.references??[]},
  },
  notes:['left','right'].map(side=>({
    conceptId:`limbic-${side}-hippocampus`,title:`${side==='left'?'Left':'Right'} hippocampus · memory network and imaging limits`,
    text:source?.sections.clinical.body??'',caution:source?.sections.pathology.body??'',sources:clinicalSourceIds,
    question:'Does selecting this hippocampus establish memory performance, hippocampal sclerosis or epileptogenicity?',
    answer:'No. The selected anatomy is an orientation target. Clinical assessment and acquired imaging remain separate; shape alone does not establish those conclusions.',
  })),
  reviewChecks:[
    'Check the reused memory and pathology wording against the complete original source lesson and its primary references.',
    'Confirm neither teaching scan is presented as a diagnostic finding, an acquired HARNESS protocol, a memory assessment or proof of epileptogenicity.',
    'Retain CT/MRI limitations, the 2019 reference scope, coarse model/subfield limits and the distinction between acquired sequences and reformats.',
    'Verify both native left/right CT/MRI masks and existing 3D targets at the exact head/source revision; review this packet independently of earlier reviews.',
  ],
} as const;

export const HIPPOCAMPAL_CLINICAL_REVISION='1205ab6db13804b874cb89ad680b0819a6ab4d90985f3f622f746daea5549057';
export function hippocampalClinicalPacket(){
  return {content:hippocampalClinicalContent,sourceTeaching:{concepts:hippocampalConcepts,references},bindings:hippocampalClinicalContent.notes.map(note=>headConceptById(note.conceptId))};
}
export function hippocampalClinicalForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(!sourceCurrent()||!headLinksCurrent()||revision!==HEAD_LINK_REVISION||revision!==hippocampalClinicalContent.headRevision||(modality!=='CT'&&modality!=='MRI'))return null;
  const note=hippocampalClinicalContent.notes.find(item=>item.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!note||!binding||binding.conceptId!==conceptId||binding.headRevision!==revision||!binding.atlasHref||!binding.ctHref||!binding.mriHref)return null;
  const imaging=hippocampalClinicalContent.imaging[modality],ids=new Set<string>([...note.sources,...imaging.sources]);
  return {note,binding,imaging,sources:hippocampalClinicalContent.sources.filter(item=>ids.has(item.id)),scope:hippocampalClinicalContent.scope,revision:HIPPOCAMPAL_CLINICAL_REVISION};
}

/** Complete original lesson/references and exact CT/MRI/3D bindings share this independent identity. */
export async function verifiedHippocampalClinicalRevision(manifestRevision:string):Promise<string|null>{
  if(!sourceCurrent()||!headLinksCurrent()||manifestRevision!==HEAD_LINK_REVISION||manifestRevision!==hippocampalClinicalContent.headRevision)return null;
  const packet=hippocampalClinicalPacket();
  if(packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||!binding.atlasHref||!binding.ctHref||!binding.mriHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===HIPPOCAMPAL_CLINICAL_REVISION?revision:null;
}
