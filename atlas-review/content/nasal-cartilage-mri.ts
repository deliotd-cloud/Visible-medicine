// Original educational synthesis. References do not import images, scans or article data.
export const nasalCartilageMriGroups = {
  septal: ['FMA59503'],
  alar: ['FMA59505', 'FMA59506'],
  lateral: ['FMA59512', 'FMA59513'],
} as const;

const visscher = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5577227/';
const septolateralReference = 'https://pubmed.ncbi.nlm.nih.gov/33144032/';
const acquisitionLimit = 'The Visscher study used one cadaver head and one volunteer with dedicated 3-T spoiled-gradient-echo images at 0.9 × 0.9 × 1 mm. This does not establish visibility on routine brain MRI or complete boundaries for this source mesh.';

export const nasalCartilageMriTopics = {
  septal: {
    body: 'Use the source-labelled septal cartilage as a midline orientation landmark. In the dedicated nasal MRI study, septal cartilage was identified on axial images while the investigators examined the nasal cartilages.',
    bullets: [
      acquisitionLimit,
      'A visible segment in that study does not validate the full extent or edge of this recovered septal mesh. In particular, do not infer a resolved boundary where septal and upper lateral cartilage meet.',
      'Model colour and shape are display and source properties, not MR signal, an acquired contour or a registered patient scan.',
    ],
    citations: [visscher, septolateralReference],
  },
  alar: {
    body: 'On axial images in the Visscher study, parts of the lower lateral (major alar) cartilage were identified inferior to the upper lateral cartilage. In the three-observer cadaver MRI-versus-micro-CT comparison, its lateral crus was consistently identified in manual segmentation; part of the medial crus was missed.',
    bullets: [
      acquisitionLimit,
      'Identification of the lateral crus does not establish visibility of the entire named cartilage, especially the medial crus, or validate the full recovered mesh boundary.',
      'Model colour and smoothness are display properties, not MR signal, tissue integrity, an acquired mask or patient registration.',
    ],
    citations: [visscher],
  },
  lateral: {
    body: 'In the dedicated study, upper lateral cartilage was identified on axial images superior to the lower lateral (major alar) cartilage. Use that relationship to orient this source-labelled selection near the septal cartilage.',
    bullets: [
      acquisitionLimit,
      'The source mesh edge must not be read as an MR-resolved upper lateral–septal interface. The recovered surface has no independent boundary review; a six-specimen micro-MRI study disputed a clean division into separate upper lateral and septal parts.',
      'This lesson does not locate a patient-specific cartilage edge or prove whole-mesh visibility on an acquired scan.',
    ],
    citations: [visscher, septolateralReference],
  },
} as const;
