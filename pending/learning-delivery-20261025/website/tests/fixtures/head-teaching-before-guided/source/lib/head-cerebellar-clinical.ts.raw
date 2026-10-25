import {HEAD_LINK_REVISION,type HeadModality} from './head-atlas-links.ts';
import {headImageConceptById} from './head-image-only-links.ts';
import {HEAD_IMAGE_ONLY_COMPARISON_REVISION,verifiedHeadImageOnlyComparisonPacket} from './head-image-only-comparison-review.ts';

/** Original factual summaries only: no article text, images or datasets imported. */
export const cerebellarClinicalContent={
  schema:'vm-cerebellar-clinical-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',
  comparisonRevision:'53fb7d5fd236b6b1ef27466a9f4a9ffbae89702015ea0971bd0781cc4a1071d0',status:'draft',
  clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Clinical teaching draft awaiting radiologist review, not findings in the displayed scans. CT and MRI are separate, unregistered subjects. These hemisphere and vermis masks have no exact corresponding part mapped in the existing 3D Atlas; they do not delineate functional territories, lobules, nuclei or lesions. MRI vermis coverage is partial.',
  sources:[
    {id:'stoodley-2016',title:'Stoodley et al. (2016) · Cerebellar stroke lesion location and outcomes',url:'https://pubmed.ncbi.nlm.nih.gov/27812503/',evidence:'Lesion-symptom study of 18 isolated cerebellar strokes. Associations varied by lesion location and test; not a deterministic map for a whole hemisphere or an individual patient.'},
    {id:'ilg-2008',title:'Ilg et al. (2008) · Focal cerebellar lesions and gait control',url:'https://pubmed.ncbi.nlm.nih.gov/18835866/',evidence:'Twelve patients with chronic focal lesions after benign cerebellar tumour resection. MRI lesion analysis related balance and leg-placement deficits to different deep nuclei; not a vermis-only stroke cohort.'},
    {id:'hwang-2012',title:'Hwang et al. (2012) · CT detection of posterior fossa infarction',url:'https://pubmed.ncbi.nlm.nih.gov/22305149/',evidence:'67 MRI-positive posterior fossa infarcts with preceding non-contrast CT. Selected acute-stroke cohort, not a general accuracy estimate for every cerebellar abnormality or CT protocol.'},
    {id:'oppenheim-2000',title:'Oppenheim et al. (2000) · False-negative early diffusion MRI',url:'https://pubmed.ncbi.nlm.nih.gov/11003275/',evidence:'Historical observational stroke series. Missed early vertebrobasilar lesions were predominantly brainstem; its rates must not be presented as cerebellar-specific or current-protocol performance.'},
  ],
  reuse:'Original factual paraphrases and primary-source links only. No third-party figures, scans, models, article passages or datasets copied. No new dependency, asset licence or fee.',
  accessed:'2026-10-11',
  imaging:{
    CT:{text:'A non-diagnostic non-contrast CT does not exclude acute posterior fossa infarction. In the cited MRI-positive cohort, CT missed many infarcts; timing and beam-hardening were relevant limitations. This teaching mask is not evidence of an infarct or its absence.',sources:['hwang-2012']},
    MRI:{text:'Check the actual sequence and acquisition timing. Structural MRI is not automatically diffusion imaging. Early negative DWI did not exclude vertebrobasilar stroke in the cited historical series, whose missed lesions were mainly brainstem. This is a posterior-circulation caution, not a cerebellar-specific sensitivity estimate or a diagnosis in these images.',sources:['oppenheim-2000']},
  },
  notes:[
    {conceptId:'cerebellum-left-hemisphere',title:'Left hemisphere · lesion location matters',text:'The stroke study associated left-hand tapping impairment with left cerebellar damage. Motor and cognitive effects varied by lesion location; a whole left-hemisphere mask is not a functional territory.',caution:'Do not infer a fixed syndrome or a lesion from this normal-anatomy teaching label.',sources:['stoodley-2016'],question:'Does the left-hemisphere label alone predict a specific deficit?',answer:'No. The study used lesion location and clinical testing, not a whole-hemisphere label.'},
    {conceptId:'cerebellum-right-hemisphere',title:'Right hemisphere · motor and cognitive correlations',text:'The stroke study associated right-hand motor task impairment with right cerebellar damage. Posterior cerebellar lesions could also affect cognition; not every cerebellar lesion produced the same motor syndrome.',caution:'A regional mask cannot identify the study’s lobular or functional lesion pattern.',sources:['stoodley-2016'],question:'Does cerebellar damage always imply an identical motor syndrome?',answer:'No. Outcomes in this small stroke cohort depended on lesion location and the tasks assessed.'},
    {conceptId:'cerebellum-vermis',title:'Vermis · balance involves a network',text:'Midline anatomy helps orient a balance-focused assessment, but it is not the whole balance network. The focal-lesion study related dynamic balance impairment to fastigial nuclear involvement and leg-placement impairment to other deep nuclei.',caution:'Those nuclei are not separately outlined by this vermis mask. The study involved chronic postoperative lesions, not all causes of gait ataxia. Partial MRI coverage cannot establish the full extent of a midline abnormality.',sources:['ilg-2008'],question:'Does a vermis mask isolate every structure involved in balance?',answer:'No. It is a regional anatomical label, not a segmentation of the deep nuclei or their connected pathways.'},
  ],
  reviewChecks:[
    'Check clinical wording against each primary study and retain cohort, timing, sequence and localisation limits.',
    'Verify CT/MRI native identities and laterality, including partial MRI vermis coverage; do not invent a matching 3D target.',
    'Confirm these notes do not diagnose the reference scans or claim registered subjects, functional territories or segmented nuclei.',
    'Review this separate clinical revision; anatomy, comparison and guided-learning decisions do not approve it.',
  ],
} as const;

export const CEREBELLAR_CLINICAL_REVISION='49f55fc8ff432818ebc3b2fbe6e17891ec7dd25d5092d1699870fde06f02631d';
export function cerebellarClinicalPacket(){return {content:cerebellarClinicalContent,bindings:cerebellarClinicalContent.notes.map(note=>headImageConceptById(note.conceptId))};}
export function cerebellarClinicalForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(revision!==HEAD_LINK_REVISION||revision!==cerebellarClinicalContent.headRevision||cerebellarClinicalContent.comparisonRevision!==HEAD_IMAGE_ONLY_COMPARISON_REVISION||(modality!=='CT'&&modality!=='MRI'))return null;
  const note=cerebellarClinicalContent.notes.find(item=>item.conceptId===conceptId),binding=headImageConceptById(conceptId);
  if(!note||!binding||binding.headRevision!==revision||binding.atlasHref||!binding.ctHref||!binding.mriHref)return null;
  const imaging=cerebellarClinicalContent.imaging[modality],ids=new Set<string>([...note.sources,...imaging.sources]);
  return {note,binding,imaging,sources:cerebellarClinicalContent.sources.filter(source=>ids.has(source.id)),scope:cerebellarClinicalContent.scope,revision:CEREBELLAR_CLINICAL_REVISION};
}

/** Independent read-only Review identity. Does not approve comparisons or masks. */
export async function verifiedCerebellarClinicalRevision(manifestRevision:string):Promise<string|null>{
  if(manifestRevision!==HEAD_LINK_REVISION||!await verifiedHeadImageOnlyComparisonPacket(manifestRevision))return null;
  const packet=cerebellarClinicalPacket();
  if(packet.content.headRevision!==manifestRevision||packet.content.comparisonRevision!==HEAD_IMAGE_ONLY_COMPARISON_REVISION||packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||binding.atlasHref||!binding.ctHref||!binding.mriHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===CEREBELLAR_CLINICAL_REVISION?revision:null;
}
