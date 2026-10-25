import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';

/** Original educational paraphrases only; no publication text, images or cases bundled. */
export const brainstemClinicalContent={
  schema:'vm-brainstem-clinical-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',status:'draft',
  clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Clinical teaching draft awaiting radiologist review. These are general localization patterns, not findings in the displayed scans. Regional masks do not segment individual nuclei, tracts, lesions or vascular territories. CT, MRI and the reference 3D model are separate, unregistered subjects.',
  sources:[
    {id:'weber-2024',title:'Hatgaonkar et al. (2024) · Clinico-Radiological Correlation of Weber’s Syndrome',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10839420/',evidence:'Single clinical case; illustrative, not a diagnostic rule.'},
    {id:'pons-2009',title:'Samaniego et al. (2009) · Favorable outcome from a locked-in state despite extensive pontine infarction by MRI',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2921010/',evidence:'Three-patient case series; does not establish an individual prognosis.'},
    {id:'medulla-2021',title:'Tao et al. (2021) · A comparative analysis of 375 patients with lateral and medial medullary infarction',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8413826/',evidence:'Retrospective cohort; presentations and population-specific frequencies vary.'},
    {id:'ct-2012',title:'Hwang et al. (2012) · Comparative sensitivity of CT versus MRI for detecting acute posterior fossa infarct',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3346849/',evidence:'Comparative study of 67 MRI-positive cases; not a universal sensitivity estimate.'},
    {id:'dwi-2000',title:'Oppenheim et al. (2000) · False-negative diffusion-weighted MR findings in acute ischemic stroke',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7974060/',evidence:'Historical observational study; acquisition and timing affect detection.'},
  ],
  reuse:'Factual references with attribution and original summaries only. No third-party article text, illustrations, patient images or datasets imported; no asset reuse licence assumed. No new dependency or fee.',
  accessed:'2026-10-11',
  imaging:{
    CT:{text:'Early noncontrast CT may miss posterior fossa infarction; skull-base beam hardening can obscure brainstem detail. A clean-looking CT or a smooth annotation outline does not exclude tissue injury.',sources:['ct-2012']},
    MRI:{text:'Diffusion-weighted MRI can reveal ischemia missed on CT, but early DWI can also be negative in brainstem stroke. Check the actual sequence and acquisition timing; an anatomical MRI image is not automatically a DWI study.',sources:['ct-2012','dwi-2000']},
  },
  notes:[
    {conceptId:'brainstem-midbrain',title:'Midbrain · crossed motor signs',text:'Third-nerve dysfunction on one side together with weakness of the opposite limbs can suggest a ventral midbrain localization. This pattern relates cranial-nerve pathways to descending motor pathways.',caution:'Not every third-nerve palsy originates in the midbrain, and clinical patterns vary. The regional Atlas target cannot identify the affected fascicle or establish a cause.',sources:['weber-2024'],question:'In the illustrative crossed pattern, are the third-nerve signs and limb weakness on the same side?',answer:'Opposite sides. This is a localization clue, not a stand-alone diagnosis or a finding demonstrated by this atlas.'},
    {conceptId:'brainstem-pons',title:'Pons · ventral motor pathways',text:'Extensive bilateral ventral pontine injury can disrupt corticospinal and corticobulbar pathways, producing paralysis and loss of speech while awareness is preserved: a classic locked-in pattern.',caution:'This does not describe every pontine lesion. Regional mask size does not measure pathway injury, awareness or prognosis, and imaging extent alone does not determine recovery.',sources:['pons-2009'],question:'Does inability to move or speak necessarily mean loss of awareness in the classic locked-in pattern?',answer:'No. Awareness can remain intact despite profound motor and speech impairment. A regional pons label cannot assess awareness.'},
    {conceptId:'brainstem-medulla',title:'Medulla · variable lateral presentations',text:'Lateral medullary infarction can produce combinations of vertigo, ataxia, dysphagia, voice change, sensory disturbance and Horner syndrome. Presentations vary rather than requiring every feature.',caution:'Absence of one classic feature does not exclude a medullary lesion. The whole regional label does not separate the lateral medulla, individual nuclei or arterial territories.',sources:['medulla-2021'],question:'Must every classic lateral medullary feature be present to consider this localization?',answer:'No. Reported presentations are heterogeneous; the combination of findings matters. The teaching outline itself is not a diagnostic checklist.'},
  ],
  reviewChecks:[
    'Verify clinical wording and the strength and limitations of each primary reference.',
    'Confirm that symptoms are hypothetical teaching correlations, not findings attributed to these source scans.',
    'Verify modality caveats and distinguish the available sequence from DWI; no inferred tract, lesion or vascular segmentation.',
    'Check every CT/MRI/3D target and review this separate exact packet revision; existing anatomy notes and decisions do not approve this extension.',
  ],
} as const;

export const BRAINSTEM_CLINICAL_REVISION='1ec8a673d43cf47c77ec5dc3c3815b879960c02dccdfe703b3053eff69f4103d';
export function brainstemClinicalPacket(){return {content:brainstemClinicalContent,bindings:brainstemClinicalContent.notes.map(note=>headConceptById(note.conceptId))};}
export function brainstemClinicalForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(revision!==HEAD_LINK_REVISION||revision!==brainstemClinicalContent.headRevision||(modality!=='CT'&&modality!=='MRI'))return null;
  const note=brainstemClinicalContent.notes.find(item=>item.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!note||!binding||binding.headRevision!==revision||!binding.atlasHref||!binding.ctHref||!binding.mriHref)return null;
  const imaging=brainstemClinicalContent.imaging[modality],ids=new Set<string>([...note.sources,...imaging.sources]);
  return {note,binding,imaging,sources:brainstemClinicalContent.sources.filter(source=>ids.has(source.id)),scope:brainstemClinicalContent.scope,revision:BRAINSTEM_CLINICAL_REVISION};
}
