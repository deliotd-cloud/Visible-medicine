export type IliacArterialModality = 'ct' | 'mri' | 'ultrasound';
export type IliacArterialGroup = 'common' | 'external' | 'internal';
export const iliacArterialReferences = {
  thighAnatomy: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html',
  pelvicAnatomy: 'https://anatomy.ttuhscep.edu/schemes/urinary.html',
  cta: 'https://pubmed.ncbi.nlm.nih.gov/9308477/',
  mra: 'https://pubmed.ncbi.nlm.nih.gov/9240520/',
  duplex: 'https://pubmed.ncbi.nlm.nih.gov/8740930/',
  internalCta: 'https://pubmed.ncbi.nlm.nih.gov/30944625/',
};
type Ref = keyof typeof iliacArterialReferences;
type Topic = {body:string;bullets:string[];references:Ref[]};
export const iliacArterialSelections:{fmas:string[];group:IliacArterialGroup;topics:IliacArterialModality[];landmark:string;limit:string;references:Ref[]}[] = [
  {fmas:['FMA14765','FMA14766'],group:'common',topics:['ct','mri','ultrasound'],landmark:'At the common iliac bifurcation, distinguish the external route toward the lower limb from the internal route into the pelvis. The bifurcation is usually anterior to the sacroiliac articulation.',limit:'Each side is one supplied arterial surface. Neither the endpoint nor separation distance establishes a patient bifurcation level, lumen diameter or disease severity.',references:['thighAnatomy']},
  {fmas:['FMA18806','FMA18807'],group:'external',topics:['ct','mri','ultrasound'],landmark:'Follow the external iliac artery along the pelvic brim toward the inguinal ligament, where it continues as the femoral artery. The inferior epigastric and deep circumflex iliac arteries are named branches.',limit:'This is the external iliac source, not a complete femoral runoff or proof that all branch ostia are present. Keep the neighbouring iliac vein a separate selection.',references:['thighAnatomy','pelvicAnatomy']},
  {fmas:['FMA18809','FMA18810'],group:'internal',topics:['ct','mri'],landmark:'The internal iliac artery commonly divides into anterior and posterior divisions. The posterior division gives iliolumbar, lateral sacral and superior gluteal branches; branching patterns vary.',limit:'The selected trunk does not provide every division, distal organ branch or collateral pathway. Do not assign a tumour feeder or embolization target from this donor surface.',references:['pelvicAnatomy','internalCta']},
];
// Original concise factual summaries; references do not license publisher media.
export const iliacArterialTopics:Record<IliacArterialGroup,Partial<Record<IliacArterialModality,Topic>>> = {
  common:{
    ct:{body:'Use the common iliac artery as the proximal orientation point before following its two major branches. CTA can assess iliac occlusion and stenosis, but calcified plaque may obscure narrowing on maximum-intensity projections.',bullets:['In the cited occlusive-disease study, reviewing axial images improved detection of severe stenoses. A volume-rendered overview or this smooth surface is not a substitute for the acquired source images.'],references:['cta']},
    mri:{body:'Contrast-enhanced MR angiography can depict the common iliac inflow segment and assess acquired narrowing or aneurysmal disease. It is a dedicated angiographic acquisition, not the same as routine pelvic MRI.',bullets:['The cited comparison with catheter angiography involved symptomatic vascular-disease patients. Its performance figures are not universal, and this model contains no MR signal or measured stenosis.'],references:['mra']},
    ultrasound:{body:'Ultrasound can show the common iliac artery in continuity with the distal aortic region and acquire Doppler information. A volunteer study found visualization depended on the scanning approach and body habitus.',bullets:['Not every common/external iliac segment was satisfactorily seen with the initial technique. Absence from an ultrasound view does not by itself prove absence or occlusion of the artery.'],references:['duplex']},
  },
  external:{
    ct:{body:'Follow the external iliac route toward its inguinal transition rather than confusing it with the internal pelvic branch. Iliac CTA interpretation combines the vascular overview with acquired axial images.',bullets:['Calcification can hide a short narrowing on maximum-intensity projections. Mesh colour, calibre and apparent continuity cannot establish normal inflow or a safe access vessel.'],references:['cta']},
    mri:{body:'The external iliac artery is separately assessable on contrast-enhanced pelvic MR angiography. Following this limb-directed segment helps distinguish it from the internal iliac route.',bullets:['The referenced study assessed stenosis and occlusion against catheter angiography. It does not validate every distal branch, routine-MRI visibility or registration of this source to a patient.'],references:['mra']},
    ultrasound:{body:'Triplex ultrasound research visualized common and external iliac segments and measured arterial diameters and flow velocities. These are acquired observations, not properties of the static atlas surface.',bullets:['The cited small volunteer study used adjusted positioning and probe selection. Its variable measurements must not become a universal normal diameter or Doppler waveform for this artery.'],references:['duplex']},
  },
  internal:{
    ct:{body:'CTA can show the internal iliac trunk and major branching pattern. A pelvic-tumour study compared those branches with catheter angiography, while terminal tumour-feeding branches were less reliably displayed.',bullets:['That study concerns patients with tumours, not a normal donor map. Do not infer a complete terminal arterial tree, a tumour supply territory or an intervention plan from this source.'],references:['internalCta']},
    mri:{body:'Contrast-enhanced MR angiography has assessed internal iliac stenoses and occlusions separately from the common and external iliac segments.',bullets:['Evidence for the major internal iliac segment does not establish visibility of every organ branch or correspondence with this model. Distal branching and any patient-specific disease require the acquired examination.'],references:['mra']},
  },
};
