// Original teaching synthesis; reference scans, diagrams and prose are not imported.
export const forearmMuscleImagingReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  compartments: 'https://rb.org.br/export-pdf/3380/v54n6a08.pdf',
  elbowUS: 'https://essr.org/content-essr/uploads/2016/10/elbow.pdf',
  wristUS: 'https://essr.org/content-essr/uploads/2016/10/wrist.pdf',
  ct: 'https://www.radiologyinfo.org/en/info/bodyct',
  mri: 'https://www.radiologyinfo.org/en/info/muscmr',
  xray: 'https://www.radiologyinfo.org/en/info/bonerad',
} as const;
export type ForearmImagingReference = keyof typeof forearmMuscleImagingReferences;
export type ForearmImagingModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export type ForearmImagingFact = { text: string; references: readonly ForearmImagingReference[] };
const fact = (text: string, ...references: ForearmImagingReference[]): ForearmImagingFact => ({ text, references });
const superficialVolar = fact('Find the superficial volar group, then follow this named belly into its tendon rather than identifying it from one axial section.', 'compartments');
const deepVolar = fact('Locate the deep volar layer relative to the radius, ulna and overlying flexors. Separately coloured surfaces are not measured intermuscular planes.', 'compartments');
const lateral = fact('Brachioradialis and the two radial wrist extensors form the lateral group; distinguish their proximal origins and distal targets.', 'compartments');
const superficialDorsal = fact('Start in the superficial dorsal group and track distally. A shared compartment does not make adjacent muscle or tendon identities interchangeable.', 'compartments');
const deepDorsal = fact('Find the deep dorsal group beneath the superficial extensors, then trace the selected structure through consecutive levels.', 'compartments');
const firstCompartment = fact('APL and EPB share the first extensor compartment; septation and additional APL tendon slips may occur.', 'wristUS');
const secondCompartment = fact('The radial wrist extensors occupy compartment two; APL and EPB cross superficial to them in the distal forearm.', 'wristUS');
const fourthCompartment = fact('Extensor digitorum and indicis share compartment four. Digit movement can help distinguish their tendons in live ultrasound.', 'wristUS');
const tunnelFlexors = fact('The carpal tunnel contains four superficialis tendons, four profundus tendons and the thumb long-flexor tendon.', 'wristUS');
const pronatorNerve = fact('The median nerve passes between the two pronator heads.', 'anatomy');
const ulnarNerve = fact('The ulnar nerve passes between the two FCU heads.', 'anatomy');

export const forearmMuscleImagingModes: Record<ForearmImagingModality, ForearmImagingFact> = {
  ct: fact('CT depicts cross-sectional bone and soft tissue. Use the named attachment and forearm level as orientation; this model has no attenuation, contrast phase, fracture finding or patient-specific muscle contour.', 'ct'),
  mri: fact('MRI distinguishes soft tissues including muscles and tendons. Compare the actual sequence, side and forearm rotation; this donor surface has no MR signal, oedema, fat measurement or proven patient boundary.', 'mri'),
  ultrasound: fact('Follow the muscle and tendon in short and long axes. Insonation angle changes echogenicity; atlas colour and shading are not echotexture, dynamic contraction or proof of a tear.', 'compartments'),
  xray: fact('Radiographs depict bony landmarks much better than individual muscles or tendons. Attachment landmarks orient the selection but do not prove tendon continuity, muscle integrity or nerve function.', 'xray'),
};
type Group = { fmaIds: readonly string[]; landmark: ForearmImagingFact; focus: Partial<Record<ForearmImagingModality, ForearmImagingFact>>; limitation: string };
export const forearmMuscleImagingGroups = {
  extensorCarpiUlnaris: {
    fmaIds: ['FMA38507','FMA38508'],
    landmark: fact('Ulnar wrist extensor; distal target: fifth-metacarpal base.', 'anatomy'),
    focus: { mri: superficialDorsal, ultrasound: fact('The ECU tendon occupies extensor compartment six near the ulnar styloid.', 'wristUS') },
    limitation: 'The source muscle does not individually validate its subsheath or a dynamic instability. Separating it in the atlas does not demonstrate tendon subluxation.',
  },
  flexorDigitorumSuperficialis: {
    fmaIds: ['FMA38470','FMA38471'],
    landmark: fact('Superficialis flexor targets: middle phalanges, digits two–five.', 'anatomy'),
    focus: { mri: superficialVolar, ultrasound: tunnelFlexors },
    limitation: 'This grouped muscle is not four separately validated tendon slips. Do not assign an individual finger, pulley or complete tendon rupture from the belly selection alone.',
  },
  abductorPollicisLongus: {
    fmaIds: ['FMA38516','FMA38517'],
    landmark: fact('Thumb long abductor; distal target: first-metacarpal base.', 'anatomy'),
    focus: { mri: deepDorsal, ultrasound: firstCompartment },
    limitation: 'This long abductor is not the thenar abductor brevis. The donor mesh does not establish a patient tendon-slip count or a pathological first compartment.',
  },
  brachioradialis: {
    fmaIds: ['FMA38486','FMA38487'],
    landmark: fact('Lateral supracondylar ridge to the radial styloid region.', 'anatomy'),
    focus: { mri: lateral, ultrasound: fact('Proximally, the radial nerve lies in the interval between brachioradialis and brachialis before dividing.', 'elbowUS') },
    limitation: 'The muscle is not the radial nerve or its branches. No lesion level, nerve entrapment or safe intervention path follows from selecting it.',
  },
  extensorCarpiRadialisBrevis: {
    fmaIds: ['FMA38498','FMA38499'],
    landmark: fact('Lateral epicondylar origin; distal target: third-metacarpal base.', 'anatomy'),
    focus: { mri: lateral, ultrasound: secondCompartment },
    limitation: 'Keep brevis distinct from longus at both ends. A common-extensor region is not a separately segmented tendon origin, ligament footprint or disease finding.',
  },
  extensorCarpiRadialisLongus: {
    fmaIds: ['FMA38495','FMA38496'],
    landmark: fact('Lateral supracondylar origin; distal target: second-metacarpal base.', 'anatomy'),
    focus: { mri: lateral, ultrasound: secondCompartment },
    limitation: 'This longus selection is not the entire radial-extensor pair. Its appearance cannot validate intersection inflammation or a patient-specific tendon boundary.',
  },
  extensorDigitiMinimi: {
    fmaIds: ['FMA38504','FMA38505'],
    landmark: fact('Small-finger extensor; distal target: fifth-digit extensor expansion.', 'anatomy'),
    focus: { mri: superficialDorsal, ultrasound: fact('Its tendon occupies compartment five; small-finger movement assists identification during live ultrasound.', 'wristUS') },
    limitation: 'Do not mistake this structure for a fifth wrist-extensor muscle or for the entire fifth-digit extensor apparatus. Distal joining slips are not independently validated.',
  },
  extensorDigitorum: {
    fmaIds: ['FMA38501','FMA38502'],
    landmark: fact('Common finger extensor; targets: expansions of digits two–five.', 'anatomy'),
    focus: { mri: superficialDorsal, ultrasound: fourthCompartment },
    limitation: 'The grouped source is not a complete segmentation of each finger tendon, central slip or lateral band. Selecting it does not establish one digit-specific lesion.',
  },
  extensorIndicis: {
    fmaIds: ['FMA38525','FMA38526'],
    landmark: fact('Deep index extensor arising from the distal ulna.', 'anatomy'),
    focus: { mri: deepDorsal, ultrasound: fourthCompartment },
    limitation: 'The independent index extensor and the index-directed common-extensor tendon remain different concepts. A shared distal target does not establish interchangeable source identity.',
  },
  extensorPollicisBrevis: {
    fmaIds: ['FMA38519','FMA38520'],
    landmark: fact('Thumb short extensor; distal target: proximal-phalanx base.', 'anatomy'),
    focus: { mri: deepDorsal, ultrasound: firstCompartment },
    limitation: 'Brevis is not longus or APL. No compartment septum, retinacular thickening or patient tendon variant is supplied by this muscle surface.',
  },
  extensorPollicisLongus: {
    fmaIds: ['FMA38522','FMA38523'],
    landmark: fact('Thumb long extensor; distal target: distal-phalanx base.', 'anatomy'),
    focus: { mri: deepDorsal, ultrasound: fact('EPL lies in compartment three, turns around Lister’s tubercle and crosses the radial-extensor tendons.', 'wristUS') },
    limitation: 'Do not identify EPL from a thumb-adjacent cross-section alone. The source cannot demonstrate attritional rupture, tendon gliding or a complete sheath.',
  },
  flexorCarpiRadialis: {
    fmaIds: ['FMA38460','FMA38461'],
    landmark: fact('Radial wrist flexor; targets: second/third metacarpal bases.', 'anatomy'),
    focus: { mri: superficialVolar, ultrasound: fact('FCR overlies the scaphoid on the radial side of the carpal tunnel.', 'wristUS') },
    limitation: 'Do not label this tendon as one of the digital flexors merely because it is adjacent to the tunnel. The source does not validate all distal slips or a sheath abnormality.',
  },
  flexorDigitorumProfundus: {
    fmaIds: ['FMA38479','FMA38480'],
    landmark: fact('Profundus flexor targets: distal phalanges, digits two–five.', 'anatomy'),
    focus: { mri: deepVolar, ultrasound: tunnelFlexors },
    limitation: 'The grouped source does not divide every digit component or neural territory. Do not use its whole-belly colour as an individual tendon contour or denervation map.',
  },
  flexorPollicisLongus: {
    fmaIds: ['FMA38482','FMA38484'],
    landmark: fact('Thumb long flexor; distal target: distal-phalanx base.', 'anatomy'),
    focus: { mri: deepVolar, ultrasound: tunnelFlexors },
    limitation: 'This long flexor is not thenar flexor brevis. The muscle surface does not establish accessory heads, tendon rupture or any particular median-nerve lesion.',
  },
  palmarisLongus: {
    fmaIds: ['FMA38463','FMA38464'],
    landmark: fact('Superficial long palmar tendon reaches the palmar aponeurosis.', 'anatomy'),
    focus: { mri: superficialVolar, ultrasound: fact('Palmaris longus may be absent, including on only one side.', 'anatomy') },
    limitation: 'Presence in this donor does not require its presence in a patient. A nonvisualized tendon alone does not establish agenesis or injury.',
  },
  pronatorQuadratus: {
    fmaIds: ['FMA38454','FMA38455'],
    landmark: fact('Deep distal pronator spanning anterior ulna and radius.', 'anatomy'),
    focus: { mri: deepVolar, ultrasound: fact('At the distal forearm, pronator quadratus lies beneath the crossing flexor tendons and myotendinous regions.', 'compartments') },
    limitation: 'Do not substitute this whole donor muscle for a patient margin, fat-plane sign or anterior-interosseous nerve territory. Small-field wrist images may not cover its full extent.',
  },
  supinator: {
    fmaIds: ['FMA38513','FMA38514'],
    landmark: fact('Proximal deep muscle wrapping around the upper radius.', 'anatomy'),
    focus: { mri: deepDorsal, ultrasound: fact('The deep radial/posterior-interosseous course passes between superficial and deep supinator portions; rotation can assist live assessment.', 'elbowUS') },
    limitation: 'The single source selection does not separately segment both supinator portions, the arcade or nerve fascicles. It does not demonstrate radial-tunnel compression.',
  },
  humeralPronatorTeres: {
    fmaIds: ['FMA38560','FMA38561'],
    landmark: fact('Humeral pronator head: medial epicondyle to lateral radius.', 'anatomy'),
    focus: { mri: superficialVolar, ultrasound: pronatorNerve },
    limitation: 'Only the source-labelled humeral head is selected. Do not equate its outline with the full pronator, an independently resolved patient head or nerve compression.',
  },
  ulnarPronatorTeres: {
    fmaIds: ['FMA38562','FMA38563'],
    landmark: fact('Ulnar pronator head: coronoid region to lateral radius.', 'anatomy'),
    focus: { mri: superficialVolar, ultrasound: pronatorNerve },
    limitation: 'Only the ulnar head is selected; a separately coloured mesh does not ensure that this head or its inter-head interval is distinct on acquired images.',
  },
  humeralFlexorCarpiUlnaris: {
    fmaIds: ['FMA38617','FMA38618'],
    landmark: fact('Humeral FCU head: medial epicondyle towards the pisiform.', 'anatomy'),
    focus: { mri: superficialVolar, ultrasound: ulnarNerve },
    limitation: 'This is one FCU head, not a complete ulnar-nerve tunnel or the full distal ligament-linked attachment complex. No safe needle corridor is defined.',
  },
  ulnarFlexorCarpiUlnaris: {
    fmaIds: ['FMA38619','FMA38620'],
    landmark: fact('Ulnar FCU head: proximal ulna towards the pisiform.', 'anatomy'),
    focus: { mri: superficialVolar, ultrasound: ulnarNerve },
    limitation: 'The source-labelled ulnar head must not inherit the humeral head’s exact contour. Neither this surface nor its separation establishes a patient entrapment or lesion.',
  },
} satisfies Record<string, Group>;
export type ForearmMuscleImagingGroup = keyof typeof forearmMuscleImagingGroups;
