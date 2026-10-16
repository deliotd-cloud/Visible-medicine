// Original source-bound educational drafts. Reading links grant no media rights.
const arterialProjection = 'https://pubmed.ncbi.nlm.nih.gov/614070/';
const arterialDetection = 'https://pubmed.ncbi.nlm.nih.gov/10520330/';
const livingAngiography = 'https://pubmed.ncbi.nlm.nih.gov/29127118/';
const thumbVariation = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9747343/';
const palmVenography = 'https://pubmed.ncbi.nlm.nih.gov/27845962/';
const digitalVenousStudy = 'https://pubmed.ncbi.nlm.nih.gov/4020057/';
const deepPalmStudy = 'https://pubmed.ncbi.nlm.nih.gov/1780719/';
const latexVenousMap = 'https://pubmed.ncbi.nlm.nih.gov/36051780/';

type Fact = { body: string; bullets: string[]; references: readonly string[] };
type Family =
  | 'metacarpalArtery' | 'radialis'
  | 'commonFirst' | 'commonSecond' | 'commonThird' | 'commonFourth'
  | 'properMiddleLateral' | 'properIndexMedial' | 'properRingMedial'
  | 'properLittleLateral' | 'properMiddleMedial' | 'properRingLateral'
  | 'deepVenousArch' | 'superficialVenousArch' | 'dorsalNetwork'
  | 'metacarpalVein' | 'indexVein' | 'middleVein' | 'ringVein';

export const handVesselXrayFacts: Record<Family, Fact> = {
  metacarpalArtery: {
    body: 'The retained palmar metacarpal artery is a deep-palm reference beside the metacarpals. Injected-cadaver hand radiographs show how arterial branches may overlap in projection; they do not show this atlas selection on an ordinary unenhanced patient film.',
    bullets: [
      'Each hand has one grouped metacarpal-artery identity here, without independently numbered metacarpal branches.',
      'A projected crossing near a common digital trunk does not prove a continuous lumen or a patient-specific junction.',
    ],
    references: [arterialProjection, arterialDetection],
  },
  radialis: {
    body: 'The radialis indicis label orients the radial side of the index finger in the palmar arterial source. Thumb-artery dissections describe variable neighbouring origins, so this name alone does not fix an origin on a contrast image.',
    bullets: [
      'Two source components make one radialis indicis selection; they do not demonstrate arterial duplication.',
      'Compare the named index side only on a suitably filled acquired angiogram; projection or nonvisualisation cannot establish an absent branch.',
    ],
    references: [thumbVariation, arterialProjection],
  },
  commonFirst: {
    body: 'This is the source-labelled first common palmar digital artery, a proximal palmar trunk reference. Thumb and first-web arterial nomenclature varies across anatomical studies, so the retained “first” label is not a validated web-space assignment.',
    bullets: [
      'Do not equate the model label with one universal thumb–index branch pattern or a specific patient origin.',
      'On contrast projection, distinguish a demonstrated trunk from overlying distal vessels before describing continuity.',
    ],
    references: [thumbVariation, arterialProjection],
  },
  commonSecond: {
    body: 'The source calls this the second common palmar digital artery. Use it to compare the palmar trunk region with the adjacent metacarpals, while keeping “second” as an unvalidated source ordinal rather than a named web space.',
    bullets: [
      'Selected living-patient angiography documents variable palmar-arch patterns; it does not validate this model’s ordinal mapping.',
      'An unseen or unfilled projected segment cannot be assigned a cause from the contrast-detection abstract.',
    ],
    references: [livingAngiography, arterialDetection],
  },
  commonThird: {
    body: 'The third common palmar digital artery is another retained source ordinal for a palmar trunk. A contrast angiogram may separate overlapping vessels by its acquired views; the mesh does not identify a specific patient branch.',
    bullets: [
      '“Third” is not a verified third-web-space correspondence in this source.',
      'A distal apparent fork on one projection cannot establish complete digital filling or collateral supply.',
    ],
    references: [arterialProjection, livingAngiography],
  },
  commonFourth: {
    body: 'The fourth common palmar digital artery is retained as a source label near the ulnar side of the palmar digital group. The numbered sequence has not been reconciled with a standard branch inventory or an acquired patient angiogram.',
    bullets: [
      'Do not infer a fourth web space or a little-finger branch solely from “fourth.”',
      'Projected vessel overlap and variable contrast filling limit any claim of a continuous distal route.',
    ],
    references: [arterialProjection, arterialDetection],
  },
  properMiddleLateral: {
    body: 'This selection preserves the source label for the lateral side of the middle finger. It is a distal palmar digital orientation cue, not a demonstrated vessel on a routine hand radiograph.',
    bullets: [
      'Lateral is an anatomical source label, not screen-right or a registered patient side.',
      'The retained proper-artery sides are incomplete; no opposite-side counterpart or distal connection is supplied by this selection.',
    ],
    references: [arterialProjection, arterialDetection],
  },
  properIndexMedial: {
    body: 'The medial index proper artery label points to one source-labelled side of the index finger. A thumb and index arterial study demonstrates that neighbouring source patterns can vary, limiting any fixed origin inferred from this name.',
    bullets: [
      'Keep “medial index” distinct from the radialis indicis selection; a projection alone does not link their lumens.',
      'Neither nonvisualisation nor a mesh gap diagnoses interruption or occlusion.',
    ],
    references: [thumbVariation, arterialProjection],
  },
  properRingMedial: {
    body: 'The medial ring proper artery is one retained digital-side selection. Its single available source side has no corresponding bilateral pair in this exact set.',
    bullets: [
      'Name, digit and medial side come from the source, not from angiographic registration.',
      'Do not fill in the missing side or assume a mirrored branch from a projected contrast course.',
    ],
    references: [arterialProjection, livingAngiography],
  },
  properLittleLateral: {
    body: 'The lateral little-finger proper artery retains the source’s distal side label. Cadaver injected radiographs provide projection context for digital vessels, but not routine plain-film depiction of this fine branch.',
    bullets: [
      'This artery does not imply a complete little-finger arterial or venous inventory.',
      'A visible projected trace would still need the acquired study to establish vessel identity and filling.',
    ],
    references: [arterialProjection, arterialDetection],
  },
  properMiddleMedial: {
    body: 'Only one medial middle-finger proper-artery selection is retained in this exact set. The source label can orient a digital side; it cannot complete the bilateral inventory.',
    bullets: [
      'Medial remains anatomical source wording, independent of display direction.',
      'Overlapping small arteries on an injected-cadaver X-ray are a reason to check acquired views, not proof of a specific junction.',
    ],
    references: [arterialProjection],
  },
  properRingLateral: {
    body: 'The lateral ring proper artery is a retained digital-side reference, separate from the medial ring selection. Its geometry is an atlas source surface, not a segmented contrast-filled branch.',
    bullets: [
      'A single radiographic projection can superimpose neighbouring digital branches.',
      'The source does not supply all opposite sides or a measured distal perfusion route.',
    ],
    references: [arterialProjection, arterialDetection],
  },
  deepVenousArch: {
    body: 'The deep palmar venous arch is a distinct source-labelled venous selection. A deep-palm anatomical study injected and dissected fresh cadavers; that evidence supplies context for deep venous pathways, not proof that this mesh is a complete arch on patient venography.',
    bullets: [
      'Keep the deep venous label separate from the deep arterial arch and from the superficial venous label.',
      'Injection and dissection do not validate relative depth, continuity, filling or drainage of this exact source surface.',
    ],
    references: [deepPalmStudy, latexVenousMap],
  },
  superficialVenousArch: {
    body: 'The superficial palmar venous arch label marks a palmar vein region. Contrast venography in nine fresh cadavers mapped a complex cutaneous palm network, which cannot be reduced to one uninterrupted source arch.',
    bullets: [
      'A venographic network in specimens does not make the source arch visible on an unenhanced hand X-ray.',
      'Do not infer a complete loop, a fixed relation to the arterial arch, or patient drainage from the selected mesh.',
    ],
    references: [palmVenography, latexVenousMap],
  },
  dorsalNetwork: {
    body: 'The dorsal hand venous network is one retained source identity over the metacarpal region. Cadaver venography of the palm and injected digital-vein studies describe connections with dorsal drainage, while leaving this model’s tributary inventory unverified.',
    bullets: [
      'The nine-cadaver palm study used contrast venography and soft X-ray, not ordinary plain-film visibility of normal veins.',
      'One network selection per hand does not resolve every dorsal tributary, valve or palmar communication.',
    ],
    references: [palmVenography, digitalVenousStudy, latexVenousMap],
  },
  metacarpalVein: {
    body: 'The palmar metacarpal vein selection is a grouped venous source near the metacarpals. Deep-palm injection dissections and palm venography offer regional context without assigning this model to a numbered clinical tributary.',
    bullets: [
      'Three retained components form one metacarpal-vein identity, not three numbered veins.',
      'Neither a projected crossing nor adjacent arterial geometry proves venous drainage or a patent channel.',
    ],
    references: [deepPalmStudy, palmVenography],
  },
  indexVein: {
    body: 'The palmar index vein selection retains its named digit as a teaching landmark. Cadaver digital-vein studies used sequential angiography and dissection to examine dorsal and palmar pathways; those specimen pathways are not a patient venogram for this mesh.',
    bullets: [
      'Two source components are unnamed parts of one selection, not radial and ulnar index branches.',
      'The small-vessel projection does not establish a filled digital vein, valves or an individual drainage route.',
    ],
    references: [digitalVenousStudy, latexVenousMap],
  },
  middleVein: {
    body: 'The palmar middle-finger vein label identifies another retained digit group. Injected hand dissections show superficial and deep venous systems, but do not assign this exact two-part source selection to two anatomical branches.',
    bullets: [
      'Keep the named middle digit fixed when comparing a separately acquired contrast view.',
      'The two components are not side-labelled, and venous filling or continuity is unknown.',
    ],
    references: [latexVenousMap, digitalVenousStudy],
  },
  ringVein: {
    body: 'The palmar ring-finger vein group is a source-labelled distal venous reference. Digital cadaver angiography found dorsal venous arches and palmar-to-dorsal connections; it does not certify this selection’s branch count or a patient-specific route.',
    bullets: [
      'Two source components remain one unnamed ring-vein identity, without radial/ulnar branch assignment.',
      'Little-finger vein groups are held outside this exact set; do not extrapolate them from the ring group.',
    ],
    references: [digitalVenousStudy, latexVenousMap],
  },
};

export const handVesselXrayLimitations: readonly string[] = [
  'Set separation to zero before comparing reference relationships. This does not register the source geometry to any patient image or establish screen-side correspondence.',
  'Routine unenhanced hand radiographs do not map normal arterial or venous lumens. Arterial injected-cadaver radiographs, selected living angiography and cadaver venography have distinct evidence limits.',
  'A static source surface cannot establish contrast filling, patent lumen, disease, collateral adequacy, flow, procedural suitability or the cause of an unseen segment.',
  'The first–fourth common digital numbering is unvalidated; proper arterial sides form an incomplete inventory. Source names and anatomical medial/lateral labels are retained without patient validation.',
  'Venous arches are not proved continuous or validated for relative depth. The three-part metacarpal vein and two-part digital vein groups are single source identities, not numbered or side-specific branches. Little-finger veins remain held and absent.',
];

export const handVesselXrayNote = 'Original 36-selection / 19-family X-ray and contrast-radiography teaching draft for revision-bound radiologist review. No acquired image, patient-space registration, clinical approval or media import is supplied. Reading citations support scoped teaching, not asset licences. Atlas, imaging-case and lecture access remain independent.';
