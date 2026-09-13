// Original, source-referenced teaching drafts; no reference figures are imported.
export const legMuscleImagingReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
  ankleUS: 'https://essr.org/content-essr/uploads/2016/10/ankle.pdf',
  kneeUS: 'https://essr.org/content-essr/uploads/2016/10/knee.pdf',
  plantarisMRI: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3352606/',
  mri: 'https://www.radiologyinfo.org/en/info/muscmr',
  ultrasound: 'https://www.radiologyinfo.org/en/info/musculous',
  xray: 'https://www.radiologyinfo.org/en/info/bonerad',
} as const;
export type LegImagingReference = keyof typeof legMuscleImagingReferences;
export type LegImagingModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export type LegImagingFact = { text: string; references: readonly LegImagingReference[] };
const fact = (text: string, ...references: LegImagingReference[]): LegImagingFact => ({ text, references });
const tendonMRI = fact('On the acquired MRI, follow the selected muscle towards its named distal target in sequential sections and a second plane. A muscle-only mesh does not establish continuity of the complete tendon or its internal fibres.');
const angleUS = fact('At the curved ankle tendons, an oblique beam can produce anisotropy; apparent darkening alone is not a tear.', 'ankleUS');
const deepUS = fact('Depth and overlying bone can limit ultrasound visibility; hiding meshes cannot create an acoustic window.', 'ultrasound');
const calfMRI = fact('Review gastrocnemius, soleus and plantaris separately. Reported plantaris injuries may coexist with gastrocnemius injury or spare the adjacent muscles.', 'plantarisMRI');

export const legMuscleImagingModes: Record<LegImagingModality, LegImagingFact> = {
  ct: fact('Use the tibia, fibula and relevant joint landmarks to orient sequential CT sections. This coloured surface contains no CT attenuation, contrast phase, internal tissue segmentation or patient measurement.'),
  mri: fact('MRI depicts muscle and tendon soft tissues. Compare the actual sequence, plane and coverage with the selected structure; colour in this atlas is not MR signal or evidence of oedema, fatty change or a tear.', 'mri'),
  ultrasound: fact('Ultrasound permits real-time assessment of muscle and tendon. Use the named landmarks to relate an acquired image to the model; atlas rotation and separation do not simulate an ultrasound examination.', 'ultrasound'),
  xray: fact('Radiographs provide bone landmarks but little detail of individual muscles and tendons. Locate the named attachment region without interpreting normal-looking bone as proof of normal soft tissue.', 'xray'),
};
type Group = {
  fmaIds: readonly string[];
  landmark: LegImagingFact;
  focus: Partial<Record<LegImagingModality, LegImagingFact>>;
  limitation: string;
};
export const legMuscleImagingGroups = {
  tibialisAnterior: {
    fmaIds: ['FMA22544', 'FMA22545'],
    landmark: fact('Tibialis anterior reaches the medial cuneiform and first-metatarsal base from the anterior tibial region.', 'anatomy'),
    focus: { mri: fact('Track the anterior-ankle course to the medial foot; do not substitute the retromalleolar course of tibialis posterior.', 'ankleUS'), ultrasound: fact('Follow the anterior-ankle tendon distally and medially; keep it distinct from the toe extensors.', 'ankleUS') },
    limitation: 'Selected: tibialis anterior muscle. The source does not independently delineate every distal tendon slip or retinacular tunnel.',
  },
  extensorHallucisLongus: {
    fmaIds: ['FMA22546', 'FMA22547'],
    landmark: fact('Extensor hallucis longus links the anterior fibular region to the great toe’s distal phalanx.', 'anatomy'),
    focus: { mri: fact('The distal-phalanx endpoint distinguishes longus from the proximal-phalanx attachment of extensor hallucis brevis.', 'anatomy'), ultrasound: fact('At the anterior ankle, identify this tendon between tibialis anterior and extensor digitorum longus.', 'ankleUS') },
    limitation: 'The great-toe extensor is not the lesser-toe extensor group. Tendon sheath and distal insertion detail are not separately validated.',
  },
  extensorDigitorumLongus: {
    fmaIds: ['FMA22548', 'FMA22549'],
    landmark: fact('Extensor digitorum longus continues from the anterior leg into dorsal expansions of toes two to five.', 'anatomy'),
    focus: { mri: tendonMRI, ultrasound: fact('Trace the anterior-ankle extensor group from its muscle–tendon junction rather than assigning identity from one section.', 'ankleUS') },
    limitation: 'One source selection does not establish separately segmented, intact extensor slips to all four lesser toes.',
  },
  fibularisTertius: {
    fmaIds: ['FMA22550', 'FMA22551'],
    landmark: fact('Fibularis tertius belongs to the anterior compartment and reaches the dorsal fifth metatarsal.', 'anatomy'),
    focus: { mri: tendonMRI, ultrasound: fact('Do not search for this anterior-compartment muscle within the lateral-compartment longus–brevis pair.', 'anatomy') },
    limitation: 'The shared fibularis name is not evidence of a shared course. This source does not establish prevalence or patient-specific variants.',
  },
  fibularisLongus: {
    fmaIds: ['FMA22552', 'FMA22553'],
    landmark: fact('Fibularis longus crosses the plantar foot towards the medial cuneiform and first-metatarsal base.', 'anatomy'),
    focus: { mri: tendonMRI, ultrasound: angleUS },
    limitation: 'The lateral leg muscle is not the entire plantar tendon course; no retinacular stability or dynamic subluxation is established here.',
  },
  fibularisBrevis: {
    fmaIds: ['FMA22554', 'FMA22555'],
    landmark: fact('Fibularis brevis connects the lateral fibular region to the fifth-metatarsal base.', 'anatomy'),
    focus: { mri: tendonMRI, ultrasound: fact('Follow the tendon behind the lateral malleolus towards the fifth-metatarsal base; distinguish it from longus.', 'ankleUS') },
    limitation: 'The muscle mesh cannot grade a split tendon, demonstrate retinacular integrity or substitute for dynamic imaging.',
  },
  tibialisPosterior: {
    fmaIds: ['FMA65018', 'FMA65019'],
    landmark: fact('Tibialis posterior reaches the navicular region with additional midfoot attachments.', 'anatomy'),
    focus: { mri: tendonMRI, ultrasound: fact('Follow the tendon behind the medial malleolus towards the navicular; distinguish flexor digitorum longus.', 'ankleUS') },
    limitation: 'This muscle-only selection is not a complete distal footprint, tendon sheath or validated assessment of arch support.',
  },
  flexorDigitorumLongus: {
    fmaIds: ['FMA65016', 'FMA65017'],
    landmark: fact('Flexor digitorum longus links the posterior tibia to the distal phalanges of toes two to five.', 'anatomy'),
    focus: { mri: fact('Its distal-phalanx targets differ from flexor digitorum brevis, which reaches the middle phalanges.', 'anatomy'), ultrasound: fact('Distinguish this medial-ankle tendon from tibialis posterior and the crossing flexor hallucis longus.', 'ankleUS') },
    limitation: 'The four distal tendon slips and their crossing relationships are not independently segmented by selecting the muscle.',
  },
  flexorHallucisLongus: {
    fmaIds: ['FMA65014', 'FMA65015'],
    landmark: fact('Flexor hallucis longus links the posterior fibular region to the great toe’s distal phalanx.', 'anatomy'),
    focus: { mri: fact('Use the posterior talar groove as a checkpoint before following the tendon beneath the sustentaculum and towards its crossing with digitorum.', 'ankleUS'), ultrasound: fact('Follow the tendon between the posterior talar tubercles and beneath the sustentaculum tali.', 'ankleUS') },
    limitation: 'No tunnel calibre, tendon impingement or sheath fluid is measured by this surface. The great-toe target differs from the lesser-toe flexors.',
  },
  popliteus: {
    fmaIds: ['FMA22591', 'FMA22592'],
    landmark: fact('Popliteus connects the lateral femoral condyle to posterior tibia above the soleal line.', 'anatomy'),
    focus: { mri: fact('Distinguish the tendon in the femoral groove from the overlying lateral collateral ligament and the separate biceps tendon approaching the fibula.', 'kneeUS'), ultrasound: fact('The proximal tendon is deep to the lateral collateral ligament in its femoral groove.', 'kneeUS') },
    limitation: 'This muscle selection is not the complete posterolateral corner. Ligament continuity and knee stability require separate assessment.',
  },
  plantaris: {
    fmaIds: ['FMA22560', 'FMA22561'],
    landmark: fact('Plantaris has a proximal lateral-femoral origin and a slender tendon passing between gastrocnemius and soleus.', 'plantarisMRI'),
    focus: { mri: calfMRI, ultrasound: fact('An intact plantaris tendon can mimic remaining Achilles fibres; identify the structures separately.', 'ankleUS') },
    limitation: 'The selected source is not proof that plantaris is present in every patient, nor that a calf fluid collection has a single cause.',
  },
  soleus: {
    fmaIds: ['FMA22558', 'FMA22559'],
    landmark: fact('Soleus lies deep to gastrocnemius; the plantaris tendon courses through the intervening plane.', 'plantarisMRI'),
    focus: { mri: calfMRI, ultrasound: deepUS },
    limitation: 'The outer soleus mesh does not segment internal aponeuroses, demonstrate their integrity or grade a myoconnective injury.',
  },
  medialGastrocnemius: {
    fmaIds: ['FMA45957', 'FMA45958'],
    landmark: fact('The medial gastrocnemius head is a posteromedial-knee landmark adjoining the semimembranosus–gastrocnemius bursa.', 'kneeUS'),
    focus: { mri: calfMRI, ultrasound: fact('Locate the bursal interval between semimembranosus and the medial gastrocnemius head; do not label it as muscle.', 'kneeUS') },
    limitation: 'Neither a distended bursa nor a tear is generated by separation. The selected head does not include all calf tendons.',
  },
  lateralGastrocnemius: {
    fmaIds: ['FMA45960', 'FMA45961'],
    landmark: fact('The lateral gastrocnemius head lies behind the lateral femoral condyle, distinct from the fibular-head biceps insertion.', 'kneeUS'),
    focus: {
      mri: calfMRI,
      ultrasound: fact('A fabella may lie in this head’s tendon; use its relationship to the lateral femoral condyle.', 'kneeUS'),
      xray: fact('If a fabella is visible, relate it to the lateral gastrocnemius tendon rather than assuming a muscle contour.', 'kneeUS'),
    },
    limitation: 'A source without a separately labelled fabella does not prove patient absence. This selection cannot establish posterolateral stability.',
  },
} satisfies Record<string, Group>;
export type LegMuscleImagingGroup = keyof typeof legMuscleImagingGroups;
