// Original, source-bound educational drafts. References grant no rights to figures or media.
const aium = 'https://onlinelibrary.wiley.com/doi/10.1002/jum.16234';
const practice = 'https://pubmed.ncbi.nlm.nih.gov/17238867/';
const collateral = 'https://pubmed.ncbi.nlm.nih.gov/9010531/';
const communicating = 'https://pubmed.ncbi.nlm.nih.gov/8610318/';
const windowStudy = 'https://pubmed.ncbi.nlm.nih.gov/9372576/';

type Family = 'aca' | 'acom' | 'pca' | 'pcom' | 'mca';
type Fact = {body: string; bullets: readonly string[]; references: readonly string[]};

export const intracranialArterialUsFacts: Record<Family, Fact> = {
  aca: {
    body: 'The selected anterior cerebral artery (ACA) is a named orientation reference for transcranial Doppler teaching. From a transtemporal view, flow in the ipsilateral ACA is usually directed away from the transducer.',
    bullets: [
      'The source supplies a whole ACA identity on each side, without validated A1 or A2 segment boundaries.',
      'Vessel identification depends on an acquired signal and its anatomical context; mesh position cannot supply flow direction or a measured velocity.',
    ],
    references: [aium, practice, windowStudy],
  },
  acom: {
    body: 'The anterior communicating artery (ACom) is a midline source label between the anterior circulations. Doppler studies of severe occlusive disease have assessed ACom cross-flow when acoustic windows were adequate.',
    bullets: [
      'This selected surface does not demonstrate a patent connecting lumen, cross-flow or collateral adequacy in any patient.',
      'A midline label does not make the communicating segment separately resolved on every transcranial examination.',
    ],
    references: [collateral, practice, aium, windowStudy],
  },
  pca: {
    body: 'The posterior cerebral artery (PCA) is a posterior-circulation reference around the cerebral peduncle. In the usual ipsilateral transtemporal pattern, P1 flow is toward the transducer and P2 flow is away.',
    bullets: [
      'Nine retained source files form each PCA selection; they are not validated P1/P2 assignments or a complete branch map.',
      'The two flow directions describe acquired Doppler segment identification, not a property of these static surfaces.',
    ],
    references: [aium, practice, windowStudy],
  },
  pcom: {
    body: 'The posterior communicating artery (PCom) is a side-specific source label linking anterior and posterior circulation concepts. Original Doppler studies found that PCom detection and collateral interpretation vary with the examination and vascular setting.',
    bullets: [
      'Hemodynamic criteria for PCom collateral flow have produced both false positives and false negatives.',
      'Neither a model junction nor the label establishes a patent lumen, constant flow direction or adequate collateral supply.',
    ],
    references: [collateral, communicating, aium, practice, windowStudy],
  },
  mca: {
    body: 'The right middle cerebral artery (MCA) is a named transtemporal Doppler target. In the usual ipsilateral pattern its flow is toward the transducer.',
    bullets: [
      'Three original PART-OF files form six source components on the right; no matching left MCA selection is supplied here.',
      'These components are not separately validated M1/M2 segments. They cannot provide a waveform, velocity or patient-specific vessel course.',
    ],
    references: [aium, practice, windowStudy],
  },
};

export const intracranialArterialUsLimitations: readonly string[] = [
  'Spectral transcranial Doppler and imaging duplex are different measurement methods; interpret acquired velocities against the laboratory’s method-specific references, not this model.',
  'An absent Doppler signal can reflect an inadequate acoustic window; it does not by itself establish an absent or occluded artery.',
  'These source surfaces provide no ultrasound acquisition, waveform, stenosis assessment, perfusion result or patient-specific registration.',
];

export const intracranialArterialUsNote = 'Educational draft for revision-bound radiologist review; clinical approval is not supplied. Compare assembled relationships at zero separation. No ultrasound image or CT/MRI registration is supplied. Case, Atlas and lecture access remain independent.';
