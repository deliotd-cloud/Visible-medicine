// Original teaching synthesis only. Reference illustrations and scans are not imported.
export const footMuscleImagingReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
  plantarUS: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10508328/',
  morphologyMRI: 'https://link.springer.com/article/10.1186/s12891-020-03926-7',
  ultrasound: 'https://www.radiologyinfo.org/en/info/musculous',
  xray: 'https://www.radiologyinfo.org/en/info/bonerad',
} as const;
export type FootImagingReference = keyof typeof footMuscleImagingReferences;
export type FootImagingModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export type FootImagingFact = { text: string; references: readonly FootImagingReference[] };
const fact = (text: string, ...references: FootImagingReference[]): FootImagingFact => ({ text, references });
const smallMRI = fact('Small forefoot muscle borders may remain indistinct on acquired MRI. A single-participant 7T study illustrates this resolution problem; it does not establish a mandatory field strength or diagnostic threshold.', 'morphologyMRI');
const neighbourMRI = fact('Trace the named muscle across consecutive sections before separating it from neighbouring intrinsic muscles. A differently coloured model surface is not a visible patient tissue plane.');
const deepUS = fact('Depth and bone can limit the acoustic window. Removing overlying atlas structures does not make a deep muscle sonographically visible.', 'ultrasound');
const toeUS = fact('Match the named toe and proximal/distal direction before comparing the small selection with an ultrasound image. A single isolated cross-section is insufficient evidence of source identity.');
const halluxUS = fact('The flexor hallucis longus tendon lies between the two brevis heads and continues between their sesamoids.', 'plantarUS');

export const footMuscleImagingModes: Record<FootImagingModality, FootImagingFact> = {
  ct: fact('Use the named tarsal, metatarsal or phalangeal landmarks to orient sequential CT images. This donor muscle surface contains no CT attenuation, contrast phase, fracture finding or patient-specific segmentation.'),
  mri: fact('Match side, foot orientation and image coverage before comparing intrinsic-muscle anatomy. The atlas has no MR signal, oedema or muscle-fat measurement; review the actual acquired sequence and boundaries.'),
  ultrasound: fact('Ultrasound provides real-time soft-tissue imaging. The landmarks below support orientation, not a complete scanning protocol; the static atlas cannot demonstrate echotexture, contraction, tendon gliding or blood flow.', 'ultrasound'),
  xray: fact('Radiographs show bone landmarks but little individual muscle or tendon detail. A named attachment region is useful orientation, not proof of tendon continuity or normal muscle function.', 'xray'),
};
type Group = { fmaIds: readonly string[]; landmark: FootImagingFact; focus: Partial<Record<FootImagingModality, FootImagingFact>>; limitation: string };
const lumbrical = (toe: number, fmaIds: readonly string[]): Group => ({
  fmaIds,
  landmark: fact(`Toe ${toe}: long-flexor tendon origin; medial extensor-apparatus insertion.`, 'anatomy'),
  focus: { mri: smallMRI, ultrasound: toeUS },
  limitation: `This source-labelled lumbrical relates to toe ${toe}, not an equally numbered interosseous. A complete tendon expansion and separate neural territory are not segmented.`,
});
const interosseous = (toe: number, fmaIds: readonly string[]): Group => ({
  fmaIds,
  landmark: fact(`Toe ${toe}: medial metatarsal to medial proximal-phalanx/extensor apparatus.`, 'anatomy'),
  focus: { mri: smallMRI, ultrasound: toeUS },
  limitation: 'Selected: a plantar interosseous, not a dorsal interosseous or interdigital nerve. Source numbering must not be interpreted as metatarsal numbering or a neuroma location.',
});
export const footMuscleImagingGroups = {
  firstLumbrical: lumbrical(2, ['FMA37717', 'FMA37718']),
  secondLumbrical: lumbrical(3, ['FMA37719', 'FMA37720']),
  thirdLumbrical: lumbrical(4, ['FMA37485', 'FMA37486']),
  fourthLumbrical: lumbrical(5, ['FMA37483', 'FMA37484']),
  firstPlantarInterosseous: interosseous(3, ['FMA37745', 'FMA37746']),
  secondPlantarInterosseous: interosseous(4, ['FMA37743', 'FMA37744']),
  thirdPlantarInterosseous: interosseous(5, ['FMA37741', 'FMA37742']),
  abductorHallucis: {
    fmaIds: ['FMA37459', 'FMA37460'],
    landmark: fact('Abductor hallucis follows the medial sole towards the medial great-toe proximal phalanx.', 'anatomy'),
    focus: { mri: neighbourMRI, ultrasound: fact('The navicular tuberosity is a landmark above the abductor hallucis belly; plantar neurovascular bundles pass beneath the muscle.', 'plantarUS') },
    limitation: 'The muscle selection does not establish a tibial/plantar nerve entrapment, a nerve calibre or a procedural corridor.',
  },
  abductorDigitiMinimi: {
    fmaIds: ['FMA37463', 'FMA37464'],
    landmark: fact('Abductor digiti minimi forms the lateral sole margin and reaches the fifth proximal phalanx.', 'anatomy'),
    focus: { mri: fact('Distinguishing the distal abductor from flexor digiti minimi depends on actual image resolution; independent model colours do not establish their boundary.', 'morphologyMRI'), ultrasound: toeUS },
    limitation: 'This foot selection is not the similarly named hand muscle. No denervation signal or lateral plantar nerve lesion is supplied.',
  },
  flexorDigitiMinimiBrevis: {
    fmaIds: ['FMA37471', 'FMA37472'],
    landmark: fact('Flexor digiti minimi brevis spans fifth-metatarsal base to fifth proximal phalanx.', 'anatomy'),
    focus: { mri: smallMRI, ultrasound: fact('Its distal tendon blends with abductor digiti minimi; a shared insertion does not make both muscle bellies interchangeable.', 'plantarUS') },
    limitation: 'The muscle alone does not define the entire fifth-toe plantar plate, tendon blend or an independent lesion.',
  },
  opponensDigitiMinimi: {
    fmaIds: ['FMA86034', 'FMA86035'],
    landmark: fact('Some descriptions separate deep fifth-toe flexor fibres reaching the fifth metatarsal as opponens digiti minimi.', 'plantarUS'),
    focus: { mri: fact('Before assigning an independent patient contour, establish whether the labelled deep slip is separable from flexor digiti minimi brevis. The source label alone cannot answer this.'), ultrasound: deepUS },
    limitation: 'Source-labelled variant/slip, not a universally distinct muscle. No prevalence estimate, separate motor function or thumb-like opposition is inferred.',
  },
  flexorAccessorius: {
    fmaIds: ['FMA37465', 'FMA37466'],
    landmark: fact('Flexor accessorius (quadratus plantae) links the calcaneal region to flexor digitorum longus tendons.', 'anatomy'),
    focus: { mri: fact('In the cited MRI proof-of-concept, distinguishing quadratus plantae from adjacent abductor digiti minimi depended on image resolution. Do not transfer donor boundaries into uncertain patient images.', 'morphologyMRI'), ultrasound: deepUS },
    limitation: 'The source does not separately segment both quadratus heads or all long-flexor tendon connections. The alias is not a second muscle.',
  },
  flexorDigitorumBrevis: {
    fmaIds: ['FMA37461', 'FMA37462'],
    landmark: fact('Flexor digitorum brevis reaches middle phalanges of toes two to five.', 'anatomy'),
    focus: { mri: neighbourMRI, ultrasound: fact('Its split distal tendons admit the long-flexor tendons, which continue to the distal phalanges.', 'anatomy') },
    limitation: 'This selected belly does not segment every distal split, pulley or tendon sheath. Short and long flexors have different distal targets.',
  },
  extensorHallucisBrevis: {
    fmaIds: ['FMA51144', 'FMA51145'],
    landmark: fact('Extensor hallucis brevis runs from superolateral calcaneus to the great-toe proximal phalanx.', 'anatomy'),
    focus: { mri: neighbourMRI, ultrasound: fact('Use the dorsal foot and named proximal-phalanx target as orientation; do not transfer the plantar short-flexor layout to this extensor.') },
    limitation: 'This source separates hallucis brevis; do not treat it as the entire extensor digitorum brevis or hallucis longus apparatus.',
  },
  medialFlexorHallucisBrevis: {
    fmaIds: ['FMA45971', 'FMA45972'],
    landmark: fact('The medial brevis head reaches the medial great-toe proximal phalanx through its sesamoid-bearing tendon.', 'anatomy'),
    focus: { mri: smallMRI, ultrasound: halluxUS },
    limitation: 'One source head is selected. Its tendon, medial sesamoid and adjacent abductor attachment are not individually validated by the belly mesh.',
  },
  lateralFlexorHallucisBrevis: {
    fmaIds: ['FMA45973', 'FMA45974'],
    landmark: fact('The lateral brevis head reaches the lateral great-toe proximal phalanx through its sesamoid-bearing tendon.', 'anatomy'),
    focus: { mri: smallMRI, ultrasound: halluxUS },
    limitation: 'Keep this source head distinct from adductor hallucis. The selection cannot establish sesamoid injury, plantar-complex integrity or a complete footprint.',
  },
  obliqueAdductorHallucis: {
    fmaIds: ['FMA46018', 'FMA46019'],
    landmark: fact('The oblique adductor head approaches the lateral hallux from proximal central metatarsals.', 'anatomy'),
    focus: { mri: smallMRI, ultrasound: deepUS },
    limitation: 'Selected: oblique head, not the full adductor. A common distal target does not establish independent tendon footprints or pathological alignment.',
  },
  transverseAdductorHallucis: {
    fmaIds: ['FMA46020', 'FMA46021'],
    landmark: fact('The transverse adductor head approaches the lateral hallux across the distal forefoot.', 'anatomy'),
    focus: { mri: smallMRI, ultrasound: fact('Follow the named transverse source course in more than one view; apparent isolation after hiding neighbours is not evidence of an acoustic separation plane.') },
    limitation: 'The transverse muscle head is not the transverse metatarsal ligament. The source cannot demonstrate arch mechanics or hallux-valgus causation.',
  },
} satisfies Record<string, Group>;
export type FootMuscleImagingGroup = keyof typeof footMuscleImagingGroups;
