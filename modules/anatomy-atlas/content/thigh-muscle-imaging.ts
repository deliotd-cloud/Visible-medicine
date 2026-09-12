// Original teaching drafts. Reading references are not imported image licences.
export const thighMuscleImagingReferences = {
  hipUS: 'https://essr.org/content-essr/uploads/2016/10/hip.pdf',
  kneeUS: 'https://essr.org/content-essr/uploads/2016/10/knee.pdf',
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
  gemelli: 'https://www.ncbi.nlm.nih.gov/books/NBK557420/',
  obturator: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8102206/',
  adductor: 'https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.24769',
  hamstring: 'https://link.springer.com/article/10.1007/s00256-019-03208-x',
  mri: 'https://www.radiologyinfo.org/en/info/muscmr',
  ultrasound: 'https://www.radiologyinfo.org/en/info/musculous',
  xray: 'https://www.radiologyinfo.org/en/info/bonerad',
} as const;
export type ThighImagingReference = keyof typeof thighMuscleImagingReferences;
export type ThighImagingModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export type ThighImagingFact = { text: string; references: readonly ThighImagingReference[] };
type Fact = ThighImagingFact;
const fact = (text: string, ...references: ThighImagingReference[]): Fact => ({ text, references });
const deepUS = fact('Depth and intervening bone may prevent a complete ultrasound view. Removing overlying meshes does not create an acoustic window.', 'ultrasound');
const deepMRI = fact('Trace the selected muscle in more than one acquired plane; a single section need not show its complete course or tendon.', 'mri');
const vastusUS = fact('Follow the muscle towards the layered quadriceps tendon. The source muscle selection does not independently segment its tendon contribution.', 'kneeUS');
const vastusMRI = fact('Keep this quadriceps component distinct from rectus femoris when following the extensor apparatus. Do not infer tendon-layer integrity from a muscle surface.', 'kneeUS');

export const thighMuscleImagingModes: Record<ThighImagingModality, Fact> = {
  ct: fact('Use bone landmarks and sequential CT sections to locate the selected muscle. The coloured surface supplies spatial orientation, not CT attenuation, an internal tissue boundary or a patient-specific measurement.'),
  mri: fact('MRI can depict muscles, tendons and adjacent soft tissues. Compare the actual sequence and acquired planes: the atlas surface has no MR signal, oedema or fatty-change measurement.', 'mri'),
  ultrasound: fact('Relate the selected structure to an actual ultrasound image, accounting for tissue depth and bone. Rotation, transparency and separation here are not a real-time sonographic examination.', 'ultrasound'),
  xray: fact('Use radiographic bone landmarks for orientation. Plain films do not delineate these individual muscle bellies in detail; normal-looking bone does not establish normal muscle or tendon.', 'xray'),
};
type Group = {
  fmaIds: readonly string[];
  landmark: Fact;
  focus: Partial<Record<ThighImagingModality, Fact>>;
  limitation: string;
};
export const thighMuscleImagingGroups = {
  adductorMinimus: {
    fmaIds: ['FMA43886', 'FMA43887'],
    landmark: fact('This source labels a superior adductor-region portion separately. Human anatomical descriptions differ in its separation and attachment relationships.', 'adductor'),
    focus: { mri: fact('Do not transfer the source label into an independently segmented patient muscle without reviewing its relationship to adductor magnus.', 'adductor'), ultrasound: deepUS },
    limitation: 'Separate source labels do not establish a universal tissue plane or non-overlapping adductor portions.',
  },
  superiorGemellus: {
    fmaIds: ['FMA22334', 'FMA22335'],
    landmark: fact('Superior gemellus arises at the ischial spine and joins the obturator-internus tendon apparatus above that tendon.', 'gemelli'),
    focus: { mri: deepMRI, ultrasound: deepUS },
    limitation: 'Selected: superior gemellus, not the entire gemelli–obturator complex. Tendon blending and neural territories are not separately mapped.',
  },
  inferiorGemellus: {
    fmaIds: ['FMA22336', 'FMA22337'],
    landmark: fact('Inferior gemellus arises at the ischial tuberosity and joins the obturator-internus tendon apparatus below that tendon.', 'gemelli'),
    focus: { mri: deepMRI, ultrasound: deepUS },
    limitation: 'Selected: inferior gemellus, not quadratus femoris. A shared distal apparatus does not make these different muscles interchangeable.',
  },
  obturatorInternus: {
    fmaIds: ['FMA22324', 'FMA22325'],
    landmark: fact('Obturator internus turns around the lesser sciatic notch towards the medial greater trochanter; its tendon accompanies the gemelli.', 'obturator'),
    focus: { mri: fact('Follow both the intrapelvic muscle and the turning tendon course; do not substitute the different trajectory of obturator externus.', 'obturator'), ultrasound: deepUS },
    limitation: 'Neither the complete tendon blend nor an injection route is segmented or validated by this selection.',
  },
  obturatorExternus: {
    fmaIds: ['FMA22326', 'FMA22327'],
    landmark: fact('Obturator externus approaches the trochanteric fossa from the external obturator region, with a trajectory distinct from obturator internus.', 'obturator'),
    focus: { mri: deepMRI, ultrasound: deepUS },
    limitation: 'The source does not establish capsular integrity, arterial protection, surgical safety or a validated separation plane.',
  },
  piriformis: {
    fmaIds: ['FMA22340', 'FMA22341'],
    landmark: fact('Piriformis extends from the anterior sacral region through the greater sciatic foramen towards the greater trochanter.', 'anatomy'),
    focus: { mri: fact('Review the muscle course and actual adjacent neural anatomy together; the isolated surface cannot diagnose sciatic entrapment.'), ultrasound: deepUS },
    limitation: 'No sciatic-nerve variant, neural compression or patient-specific asymmetry is established by this static muscle.',
  },
  gluteusMaximus: {
    fmaIds: ['FMA22328', 'FMA22329'],
    landmark: fact('Gluteus maximus is the large superficial posterior gluteal muscle, contributing to the iliotibial tract and femoral gluteal tuberosity.', 'anatomy'),
    focus: { ultrasound: fact('Use the posterior gluteal muscle as superficial context. Its anterior margin helps orient the adjacent gluteus medius.', 'hipUS'), mri: deepMRI },
    limitation: 'Do not assign the greater-trochanteric abductor tendon footprints to this muscle or infer its internal fibre architecture from the outer mesh.',
  },
  pectineus: {
    fmaIds: ['FMA22450', 'FMA22451'],
    landmark: fact('Pectineus lies in the proximal anteromedial thigh, over the pubis and medial to the iliopsoas region.', 'hipUS'),
    focus: { ultrasound: fact('Distinguish pectineus from iliopsoas and the more medial adductor group when relating an anterior-groin image to this selection.', 'hipUS'), mri: deepMRI },
    limitation: 'This selection does not map variable motor supply, a complete femoral triangle or an approved procedural corridor.',
  },
  sartorius: {
    fmaIds: ['FMA22354', 'FMA22355'],
    landmark: fact('Sartorius runs from the anterior superior iliac spine across the anterior thigh towards the medial knee.', 'hipUS'),
    focus: { ultrasound: fact('Near the anterior superior iliac spine, sartorius is medial to tensor fasciae latae; follow its changing direction down the thigh.', 'hipUS'), mri: fact('Follow its oblique course across successive slices rather than treating one cross-section as the whole muscle.') },
    limitation: 'Sartorius is not rectus femoris. The distal pes-anserine tendon blend is not independently segmented here.',
  },
  tensorFasciaeLatae: {
    fmaIds: ['FMA22425', 'FMA22426'],
    landmark: fact('Tensor fasciae latae lies lateral to sartorius proximally and continues into fascia over the lateral thigh.', 'hipUS'),
    focus: { ultrasound: fact('Trace the lateral muscle towards its fascial continuation, superficial to vastus lateralis.', 'hipUS'), mri: fact('Keep the muscle belly distinct from the longer iliotibial tract; they are not equivalent source selections.') },
    limitation: 'The muscle mesh does not independently supply the full iliotibial tract, distal insertion or a friction-syndrome diagnosis.',
  },
  vastusLateralis: {
    fmaIds: ['FMA38930', 'FMA38931'],
    landmark: fact('Vastus lateralis occupies the lateral quadriceps region and contributes to the common extensor apparatus at the patella.', 'anatomy'),
    focus: { mri: vastusMRI, ultrasound: vastusUS },
    limitation: 'Selected: vastus lateralis, not the overlying iliotibial tract. A complete quadriceps tendon is not reconstructed by this muscle alone.',
  },
  vastusMedialis: {
    fmaIds: ['FMA38932', 'FMA38933'],
    landmark: fact('Vastus medialis occupies the medial quadriceps region and reaches the patellar extensor apparatus.', 'anatomy'),
    focus: { mri: vastusMRI, ultrasound: vastusUS },
    limitation: 'The source does not separately segment oblique fibres or validate patellar tracking, muscle activation or a tendon-layer tear.',
  },
  vastusIntermedius: {
    fmaIds: ['FMA38934', 'FMA38935'],
    landmark: fact('Vastus intermedius lies deep to rectus femoris against the anterior femoral shaft; its tendon contribution is deep within the quadriceps apparatus.', 'kneeUS'),
    focus: { mri: vastusMRI, ultrasound: vastusUS },
    limitation: 'Do not confuse this deep quadriceps component with the adjacent femur or infer internal tendon detail from the surface colour.',
  },
  bicepsShortHead: {
    fmaIds: ['FMA45891', 'FMA45892'],
    landmark: fact('The short biceps-femoris head arises from the distal lateral femoral region, not the ischial tuberosity, and joins the distal biceps apparatus.', 'hamstring'),
    focus: { mri: fact('Distinguish short and long heads in the distal posterolateral thigh; a proximal hamstring-origin description does not apply to the short head.', 'hamstring'), ultrasound: fact('Use the fibular head and distal biceps apparatus as orientation landmarks, following both heads separately where the acquired images permit.', 'hamstring') },
    limitation: 'No common-fibular nerve, T-junction tear or independent tendon subdivision is supplied by this muscle-only selection.',
  },
} satisfies Record<string, Group>;
export type ThighMuscleImagingGroup = keyof typeof thighMuscleImagingGroups;
