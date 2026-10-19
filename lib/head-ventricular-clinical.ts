import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';

/** Original source-limited summaries; references do not license images or datasets. */
export const ventricularClinicalContent={
  schema:'vm-ventricular-clinical-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',status:'draft',
  clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Clinical teaching draft awaiting radiologist review. General interpretation principles, not findings in the displayed scans. CT, MRI and the reference 3D model are separate, unregistered subjects. Masks and illustrative CSF motion do not measure pressure, flow, obstruction or diagnostic ventricular size.',
  sources:[
    {id:'asymmetry-2008',title:'Kiroglu et al. (2008) · Cerebral lateral ventricular asymmetry on CT',url:'https://pubmed.ncbi.nlm.nih.gov/18253688/',evidence:'Retrospective clinical sample of 170 asymmetric cases and 170 controls. Additional MRI found lesions in some cases; not a healthy-population prevalence estimate.'},
    {id:'inph-2021',title:'Japanese Society of Normal Pressure Hydrocephalus · Third-edition guidelines (2021)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7905302/',evidence:'Society guideline for idiopathic normal pressure hydrocephalus. Not a universal diagnostic rule for all ventricular enlargement or age groups.'},
    {id:'aqueduct-2009',title:'Stoquart-El Sankari et al. (2009) · Phase-contrast MRI and aqueductal stenosis',url:'https://pubmed.ncbi.nlm.nih.gov/18832663/',evidence:'Retrospective series of 17 selected patients with absent aqueductal flow on phase-contrast MRI. Conventional morphological signs were absent in seven; not a general diagnostic-accuracy estimate.'},
    {id:'fourth-2018',title:'Disproportionately Large Communicating Fourth Ventricle · Case series (2018)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6324856/',evidence:'Six selected cases with prior posterior fossa disease or intervention. A rare presentation; terminology and mechanisms should not be generalized to every enlarged fourth ventricle.'},
  ],
  reuse:'Original factual paraphrases with primary-source links only. No article text, figures, scans, models or datasets imported. No new dependency, licence obligation or fee introduced by these notes.',
  accessed:'2026-10-11',
  imaging:{
    CT:{text:'Inspect the actual ventricular outline and adjacent brain, not just the coloured mask. In the cited asymmetry cohort, additional MRI identified lesions in some patients whose CT did not establish the cause. CT asymmetry alone is not a diagnosis.',sources:['asymmetry-2008']},
    MRI:{text:'A structural MRI image is not a CSF-flow measurement. The aqueductal study used dedicated phase-contrast acquisition and found cases without the usual morphological signs. Neither a still mask nor the Atlas animation establishes aqueductal patency.',sources:['aqueduct-2009']},
  },
  notes:[
    {conceptId:'ventricle-left-lateral',title:'Lateral ventricles · compare rather than assume symmetry',text:'Compare both lateral ventricles and the surrounding structures on the acquired study. A difference between their sizes does not by itself establish unilateral obstruction; accompanying abnormalities and the clinical context matter.',caution:'Do not label every asymmetry normal either. The clinical CT cohort included patients with additional MRI findings. This separate reference surface supplies no patient-specific diagnosis.',sources:['asymmetry-2008'],question:'Does a larger left lateral ventricle alone prove a blocked CSF pathway?',answer:'No. Side-to-side difference is an observation; its cause requires the rest of the imaging and clinical assessment.'},
    {conceptId:'ventricle-right-lateral',title:'Ventricular enlargement · size needs context',text:'Ventricular enlargement is not synonymous with idiopathic normal pressure hydrocephalus. The society guideline considers symptoms and the pattern of ventricular and sulcal morphology; enlargement can also accompany ageing or neurodegeneration.',caution:'This principle is not right-sided: compare the whole system. The guideline concerns iNPH, not all causes of hydrocephalus. These atlas masks provide neither validated diagnostic measurements nor a diagnosis.',sources:['inph-2021'],question:'Can a large-looking ventricular model establish iNPH?',answer:'No. Model appearance alone cannot supply the clinical assessment and acquired-image morphology required for that interpretation.'},
    {conceptId:'ventricle-third',title:'Third ventricle · morphology versus aqueductal flow',text:'Relate the third ventricle to the lateral and fourth ventricles when examining the actual images. Their relative appearance can direct attention toward the aqueduct, but conventional morphology and measured CSF flow are different evidence.',caution:'In a selected aqueductal-stenosis series, some patients lacked the usual morphological signs. Do not infer an open or blocked aqueduct from this regional mask or its connection to a schematic surface.',sources:['aqueduct-2009'],question:'Does a visible anatomical connection prove fluid passes through it?',answer:'No. Anatomical shape is not a measurement of flow; the cited study used a dedicated phase-contrast acquisition.'},
    {conceptId:'ventricle-fourth',title:'Fourth ventricle · enlargement does not locate a block',text:'Assess fourth-ventricular enlargement with the rest of the ventricular system and the clinical history. A small case series described disproportionate enlargement despite communicating CSF pathways and a patent aqueduct.',caution:'Those cases had preceding posterior fossa disease or intervention. They illustrate a possible alternative, not the frequency or cause of enlargement in an arbitrary patient. The atlas cannot distinguish a trapped ventricle from communicating hydrocephalus.',sources:['fourth-2018'],question:'Does a large fourth ventricle automatically mean an outlet obstruction?',answer:'No. Ventricular shape alone cannot establish the flow mechanism or obstruction site.'},
  ],
  reviewChecks:[
    'Verify every clinical statement against its cited primary study or scoped society guideline; retain population and study limitations.',
    'Confirm no note attributes pathology, asymmetry, obstruction, pressure or measured flow to the displayed reference scans or model.',
    'Check exact laterality, CT/MRI targets and existing 3D selections; retain separate-subject and partial-mask limits.',
    'Review this independent packet revision. Earlier anatomy, brainstem, CSF-animation or sequence reviews do not approve these clinical notes.',
  ],
} as const;

export const VENTRICULAR_CLINICAL_REVISION='eedb43742b2c178ccdf76d6daf36d3002ecc369323027ce6a22c5d9e0a8221e0';
export function ventricularClinicalPacket(){return {content:ventricularClinicalContent,bindings:ventricularClinicalContent.notes.map(note=>headConceptById(note.conceptId))};}
export function ventricularClinicalForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(revision!==HEAD_LINK_REVISION||revision!==ventricularClinicalContent.headRevision||(modality!=='CT'&&modality!=='MRI'))return null;
  const note=ventricularClinicalContent.notes.find(item=>item.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!note||!binding||binding.headRevision!==revision||!binding.atlasHref||!binding.ctHref||!binding.mriHref)return null;
  const imaging=ventricularClinicalContent.imaging[modality],ids=new Set<string>([...note.sources,...imaging.sources]);
  return {note,binding,imaging,sources:ventricularClinicalContent.sources.filter(source=>ids.has(source.id)),scope:ventricularClinicalContent.scope,revision:VENTRICULAR_CLINICAL_REVISION};
}
