import {assertRegionalMriPackageOwnership,type RegionalMriPackage,type RegionalLoadedSeries,type RegionalAnnotation} from './regional-mri-package.ts';

/** Original teaching drafts, not mask, clinical, correspondence or release approval. */
export const KNEE_GUIDE_REVISION='knee-guided-inspection-20261013-v1';
export const MENISCI_GUIDE_REVISION='knee-meniscal-guided-inspection-20261014-v1';
export const EXTENSOR_GUIDE_REVISION='knee-extensor-guided-inspection-20261014-v1';
export const POSTERIOR_GUIDE_REVISION='knee-posterior-guided-inspection-20261014-v1:58d69d2e05edb5090e528e1195933b59b8690fb2a213156ddba40fbfa55d01d2';
type StepSpec={anatomyId:string;title:string;caption:string;source:{title:string;href:string}};
const cruciateSource={title:'Harner et al. · cadaver morphology study (1995)',href:'https://pubmed.ncbi.nlm.nih.gov/8600743/'};
const meniscalSource={title:'Brody et al. · cadaver anatomy/3-T MRI study (2007)',href:'https://pubmed.ncbi.nlm.nih.gov/17449741/'};
const quadricepsSource={title:'Waligora et al. · cadaver anatomy study (2009)',href:'https://pubmed.ncbi.nlm.nih.gov/19690926/'};
const extensorSource={title:'Andrikoula et al. · cadaver anatomy study (2006)',href:'https://pubmed.ncbi.nlm.nih.gov/16283173/'};
const posteriorLandmarkSource={title:'Greenwood et al. · cadaveric popliteal-fossa mapping (2021)',href:'https://pubmed.ncbi.nlm.nih.gov/33594009/'};
const posteriorVariationSource={title:'Aktan Ikiz et al. · popliteal relationship variation study (2009)',href:'https://pubmed.ncbi.nlm.nih.gov/19418007/'};
const definitions:{id:string;title:string;revision?:string;steps:StepSpec[]}[]=[
  {id:'cruciate-ligaments',title:'Cruciate ligaments',steps:[
    {anatomyId:'anat.knee.lig.anterior_cruciate_ligament',title:'Anterior cruciate ligament',
      caption:'Cadaver measurements distinguish the ligament midsubstance from its broader insertion areas. Inspect the saved ACL extent in this sequence; a segmentation does not establish complete insertion coverage.',source:cruciateSource},
    {anatomyId:'anat.knee.lig.posterior_cruciate_ligament',title:'Posterior cruciate ligament',
      caption:'Cadaver work describes functional components of the PCL. This named annotation does not establish separate bundle segmentation or function. Inspect only its recorded extent and source scope.',source:cruciateSource},
  ]},
  {id:'collateral-ligaments',title:'Collateral ligaments',steps:[
    {anatomyId:'anat.knee.lig.medial_collateral_ligament',title:'Medial collateral ligament',
      caption:'Dissection studies distinguish superficial and deep MCL attachments. A single MCL annotation must not be treated as proof that both components are separately represented.',
      source:{title:'Liu et al. · cadaver morphology study (2010)',href:'https://pubmed.ncbi.nlm.nih.gov/20846377/'}},
    {anatomyId:'anat.knee.lig.lateral_collateral_ligament',title:'Lateral collateral ligament',
      caption:'Cadaver stability testing considers the LCL, popliteofibular complex and capsule separately. Inspect the named LCL only; do not infer a complete posterolateral-corner segmentation.',
      source:{title:'Lasmar et al. · cadaver biomechanics study (2010)',href:'https://pubmed.ncbi.nlm.nih.gov/20454502/'}},
  ]},
  {id:'menisci',title:'Menisci',revision:MENISCI_GUIDE_REVISION,steps:[
    {anatomyId:'anat.knee.men.medial_meniscus',title:'Medial meniscus',
      caption:'Inspect the recorded whole medial meniscus extent in this sequence. Meniscal roots attach near the central tibial plateau and tibial cruciate insertions in the cited cadaver anatomy/3-T MRI study. This whole annotation does not establish individual horn, body or root coverage, normality, diagnosis or a registered 3D match.',source:meniscalSource},
    {anatomyId:'anat.knee.men.lateral_meniscus',title:'Lateral meniscus',
      caption:'Inspect the recorded whole lateral meniscus extent in this sequence. Meniscal roots attach near the central tibial plateau and tibial cruciate insertions in the cited cadaver anatomy/3-T MRI study. This whole annotation does not establish individual horn, body or root coverage, normality, diagnosis or a registered 3D match.',source:meniscalSource},
  ]},
  {id:'extensor-mechanism',title:'Extensor mechanism',revision:EXTENSOR_GUIDE_REVISION,steps:[
    {anatomyId:'anat.knee.tdn.quadriceps_tendon',title:'Quadriceps tendon',
      caption:'Inspect the saved quadriceps tendon extent in this sequence. Cadaver dissection found variable tendon layering; this annotation does not identify separate layers or establish complete insertion coverage.',source:quadricepsSource},
    {anatomyId:'anat.knee.bne.patella',title:'Patella',
      caption:'Inspect the saved patella bone extent in this sequence. This bone annotation does not establish patellar cartilage or retinacular coverage, tracking, patellar height or a diagnosis.',source:extensorSource},
    {anatomyId:'anat.knee.tdn.patellar_tendon',title:'Patellar tendon',
      caption:'Inspect the saved patellar tendon extent in this sequence. Cadaver anatomy describes attachments at the patellar apex and tibial tubercle; this annotation does not establish either attachment or a complete extensor mechanism.',source:extensorSource},
  ]},
  {id:'posterior-knee',title:'Posterior knee: popliteus and vessels',revision:POSTERIOR_GUIDE_REVISION,steps:[
    {anatomyId:'anat.knee.msk.popliteus_muscle',title:'Popliteus muscle',
      caption:'Inspect the saved popliteus extent in this sequence as a posterior-knee orientation landmark. A partial annotation does not establish its complete attachments, surrounding capsule or a complete popliteal fossa. The independent 3D body model is an anatomical reference, not registered patient anatomy.',source:posteriorLandmarkSource},
    {anatomyId:'anat.knee.nvs.popliteal_artery',title:'Popliteal artery',
      caption:'Inspect the separately labelled popliteal artery extent and nearby displayed structures where source geometry is present. Cadaveric artery–vein and muscle–artery relationships vary. This annotation does not establish a complete lumen, branching, flow, patency, compression or a diagnosis.',source:posteriorVariationSource},
    {anatomyId:'anat.knee.nvs.popliteal_vein',title:'Popliteal vein',
      caption:'Inspect the saved popliteal vein extent separately from the artery in this sequence. Cadaveric relationships vary; do not infer a universal artery–vein order. This annotation does not establish full drainage, patency, thrombosis or registered 3D correspondence.',source:posteriorVariationSource},
  ]},
];
export type RegionalGuideStep=Readonly<StepSpec&{candidates:readonly RegionalAnnotation[]}>;
export type RegionalStudyGuide=Readonly<{id:string;title:string;revision:string;sourceRevision:string;sequenceId:string;imageSha256:string;steps:readonly RegionalGuideStep[]}>;
const owners=new WeakMap<RegionalStudyGuide,{pkg:RegionalMriPackage;study:RegionalLoadedSeries}>();

/** Never substitutes another sequence, another anatomy ID, or the first variant. */
export function regionalMriGuides(pkg:RegionalMriPackage,study:RegionalLoadedSeries):readonly RegionalStudyGuide[]{
  assertRegionalMriPackageOwnership(pkg,study);
  if(pkg.manifest.region!=='knee')return Object.freeze([]);
  return Object.freeze(definitions.map(definition=>{
    const guide:RegionalStudyGuide=Object.freeze({id:definition.id,title:definition.title,revision:definition.revision??KNEE_GUIDE_REVISION,
      sourceRevision:pkg.revision,sequenceId:study.series.id,imageSha256:study.series.image.sha256,
      steps:Object.freeze(definition.steps.map(step=>Object.freeze({...step,source:Object.freeze({...step.source}),
        candidates:Object.freeze(study.series.annotations.filter(annotation=>annotation.anatomyId===step.anatomyId))}))),
    });
    owners.set(guide,{pkg,study});return guide;
  }));
}

/** Explicit accepted-scoped choice only; draft prose gains no approval from it. */
export function regionalMriGuideAnnotation(pkg:RegionalMriPackage,study:RegionalLoadedSeries,guide:RegionalStudyGuide,index:number,annotationId:string):RegionalAnnotation|null{
  try{assertRegionalMriPackageOwnership(pkg,study);}catch{return null;}
  const owner=owners.get(guide);
  if(owner?.pkg!==pkg||owner.study!==study||!Number.isSafeInteger(index)||index<0)return null;
  const annotation=guide.steps[index]?.candidates.find(candidate=>candidate.id===annotationId);
  return annotation&&annotation.review.status==='accepted-scoped'&&annotation.geometry.kind!=='none'?annotation:null;
}

/** Public authoring metadata only: no annotation candidates or patient context. */
export function regionalMriGuideDrafts(region:string):readonly Readonly<{id:string;title:string;revision:string;steps:readonly Readonly<StepSpec>[]}>[]{
  if(region!=='knee')return Object.freeze([]);
  return Object.freeze(definitions.map(d=>Object.freeze({id:d.id,title:d.title,revision:d.revision??KNEE_GUIDE_REVISION,
    steps:Object.freeze(d.steps.map(s=>Object.freeze({...s,source:Object.freeze({...s.source})}))),
  })));
}
