import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';

/** Study associations are not hemisphere-specific predictions for the selected mask. */
const topics=[
  {part:'frontal',title:'speech impairment is not a single patch',text:'High-resolution MRI of Broca’s two preserved historical brains showed damage extending deeper than the surface lesions originally described. These cases caution against attributing the entire speech impairment to one inferior-frontal patch.',caution:'Two historical specimens are not a contemporary diagnostic cohort. This lobar outline identifies neither Broca’s area nor language dominance, a lesion or a speech network.',sources:['dronkers-2007'],question:'Does selecting a frontal lobe identify the cause of a speech impairment?',answer:'No. A lobar label supplies orientation, not a lesion map or an individual language assessment.'},
  {part:'parietal',title:'neglect associations are more specific than a lobe',text:'Mort and colleagues mapped 35 right-hemisphere stroke cases. In their middle-cerebral-artery subgroup, neglect was associated with angular-gyrus involvement in the inferior parietal lobule.',caution:'This selected right-sided stroke study does not make every parietal lesion a neglect lesion. A whole-lobe mask is not an angular-gyrus or arterial-territory map.',sources:['mort-2003'],question:'Is the highlighted parietal lobe a validated neglect map?',answer:'No. The study association concerns a subregion and selected cases, not this entire mask.'},
  {part:'temporal',title:'medial temporal and whole-lobe findings differ',text:'In the posterior-cerebral-artery subgroup of the same study, patients with neglect had parahippocampal-region involvement; those without neglect did not. The association was medial temporal, not the whole temporal lobe.',caution:'The study involved right-hemisphere strokes. It does not establish a bilateral temporal-lobe rule or a diagnostic threshold for a displayed atlas subject.',sources:['mort-2003'],question:'Can this temporal-lobe outline substitute for the study’s parahippocampal region?',answer:'No. A lobar outline and a medial-temporal subregion are different anatomical targets.'},
  {part:'occipital',title:'a field defect does not uniquely locate a lesion',text:'A retrospective series recorded 904 homonymous hemianopias in 852 patients. Occipital and optic-radiation lesions were common, but most field-defect patterns occurred at different retrochiasmal locations.',caution:'The case-series associations are not a one-to-one visual-field map. This occipital surface delineates neither optic radiations, a lesion nor an individual retinotopic field.',sources:['zhang-2006'],question:'Does a homonymous field defect prove that a lesion is confined to the occipital lobe?',answer:'No. The series included different retrochiasmal lesion locations; a field pattern alone was not uniquely localising.'},
] as const;

/** Original factual summaries only; no source images, article text or datasets bundled. */
export const lobarClinicalContent={
  schema:'vm-lobar-clinical-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',status:'draft',
  clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Clinical orientation drafts awaiting radiologist review, not abnormalities demonstrated by these scans. CT, MRI and the existing reference 3D Atlas are separate, unregistered subjects. Lobar masks do not define lesions, vascular territories, language dominance or functional networks. Left/right identifies the selected anatomy; the same study discussion on both sides does not establish bilateral clinical equivalence.',
  sources:[
    {id:'dronkers-2007',title:'Dronkers et al. (2007) · Paul Broca’s historic cases',url:'https://pubmed.ncbi.nlm.nih.gov/17405763/',evidence:'MRI re-examination of two preserved historical brains. Lesions extended beyond the visible surface damage; not a modern population or functional-language map.'},
    {id:'mort-2003',title:'Mort et al. (2003) · The anatomy of visual neglect',url:'https://academic.oup.com/brain/article-abstract/126/9/1986/367474',evidence:'Lesion-mapping study of 35 right-hemisphere MCA/PCA stroke cases. Subgroup associations involve angular-gyrus and parahippocampal regions, not whole lobes.'},
    {id:'zhang-2006',title:'Zhang et al. (2006) · Homonymous hemianopias',url:'https://pubmed.ncbi.nlm.nih.gov/16567710/',evidence:'Retrospective service series from 1989–2004: 904 field defects in 852 patients. Multiple retrochiasmal locations; field patterns were not uniquely localising.'},
  ],
  reuse:'Original factual paraphrases and primary-source links only. No passages, figures, scans, models or datasets copied. Reference access does not grant image-reuse rights. No new dependency, font, asset or fee.',
  accessed:'2026-10-11',
  imaging:{
    CT:{text:'Use the native images, not overlay colour, to assess a suspected lesion. These association studies do not establish CT sensitivity or validate a lobar mask as a lesion or arterial-territory boundary.',sources:['mort-2003','zhang-2006']},
    MRI:{text:'Structural MRI localisation is not functional mapping. The historical-brain and stroke studies do not turn this scan or reference model into an individual language, neglect or visual-field map.',sources:['dronkers-2007','mort-2003','zhang-2006']},
  },
  notes:['left','right'].flatMap(side=>topics.map(({part,title,...note})=>({conceptId:`cortex-${side}-${part}-lobe`,title:`${side==='left'?'Left':'Right'} ${part} lobe · ${title}`,...note}))),
  reviewChecks:[
    'Check the original study findings and retain historical-specimen, selected-cohort, laterality and retrospective limits.',
    'Verify all eight native CT/MRI concepts and existing 3D targets against the exact head revision, including left/right identity.',
    'Confirm no lesion, vascular territory, language dominance, field deficit, functional network or patient-space registration is attributed to a lobar mask.',
    'Review this independent clinical packet; earlier anatomy, clinical, quiz and sequence reviews do not approve it.',
  ],
} as const;

export const LOBAR_CLINICAL_REVISION='a0217a9f8621b59aaa906678565c52cbbfc5ebf3a8ef7ac8c29168879dd617c1';
export function lobarClinicalPacket(){return {content:lobarClinicalContent,bindings:lobarClinicalContent.notes.map(note=>headConceptById(note.conceptId))};}
export function lobarClinicalForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(!headLinksCurrent()||revision!==HEAD_LINK_REVISION||revision!==lobarClinicalContent.headRevision||(modality!=='CT'&&modality!=='MRI'))return null;
  const note=lobarClinicalContent.notes.find(item=>item.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!note||!binding||binding.conceptId!==conceptId||binding.headRevision!==revision||!binding.atlasHref||!binding.ctHref||!binding.mriHref)return null;
  const imaging=lobarClinicalContent.imaging[modality],ids=new Set<string>([...note.sources,...imaging.sources]);
  return {note,binding,imaging,sources:lobarClinicalContent.sources.filter(source=>ids.has(source.id)),scope:lobarClinicalContent.scope,revision:LOBAR_CLINICAL_REVISION};
}

/** Content and complete CT/MRI/3D bindings have a separate read-only Review identity. */
export async function verifiedLobarClinicalRevision(manifestRevision:string):Promise<string|null>{
  if(!headLinksCurrent()||manifestRevision!==HEAD_LINK_REVISION||manifestRevision!==lobarClinicalContent.headRevision)return null;
  const packet=lobarClinicalPacket();
  if(packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||!binding.atlasHref||!binding.ctHref||!binding.mriHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===LOBAR_CLINICAL_REVISION?revision:null;
}
