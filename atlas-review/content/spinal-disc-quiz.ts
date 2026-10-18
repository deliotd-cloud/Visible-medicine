/** Original active-recall drafts. Reading links do not license third-party figures. */
export const spinalDiscQuizGroups = {
  axis: ['FMA25058'],
  cervicalPlanes: ['FMA13896', 'FMA13897', 'FMA13898', 'FMA13899', 'FMA13900'],
  thoracicCoverage: ['FMA10458', 'FMA13495', 'FMA13500', 'FMA13501', 'FMA13502', 'FMA13503', 'FMA13504'],
  surfaceLimits: ['FMA13505', 'FMA13506', 'FMA13507', 'FMA13508'],
  lumbarNumbering: ['FMA16033', 'FMA16034', 'FMA16035', 'FMA16036', 'FMA16037'],
} as const;
export type SpinalDiscQuizGroup = keyof typeof spinalDiscQuizGroups;
const coverage = 'https://accreditationsupport.acr.org/support/solutions/articles/11000061020-mri-exam-specific-parameters-spine-module-revised-5-10-2022-';

export const spinalDiscQuizQuestions = {
  axis: {
    body: 'Which interpretation preserves the anatomy of this source-labelled axis disc?',
    choices: ['It lies below C2; there is no C1–C2 intervertebral disc', 'It is the disc between C1 and C2', 'Its source label establishes a patient MRI level', 'It is a segmented patient MRI slice'],
    correctAnswer: 'It lies below C2; there is no C1–C2 intervertebral disc',
    explanation: 'Distinguish the atlas–axis joint from the disc below C2. This retained source label is not registration to a patient examination; confirm patient numbering independently.',
    reference: 'https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/further-reading/ao-spine-upper-cervical-injuries-classification-system',
  },
  cervicalPlanes: {
    body: 'After locating a cervical disc on sagittal MRI, which approach best assesses its relationship to the canal and cord?',
    choices: ['Use only the midline sagittal image', 'Correlate same-level axial images after confirming patient level and coverage', 'Use the atlas colour as MR tissue signal', 'Assign the patient level from the source name alone'],
    correctAnswer: 'Correlate same-level axial images after confirming patient level and coverage',
    explanation: 'Use the acquired planes together. The visible disc, canal, cord and surrounding CSF depend on image contrast, coverage and quality; an exterior mesh supplies none of their patient MR signal.',
    reference: coverage,
  },
  thoracicCoverage: {
    body: 'What is the most reliable starting point for comparing this thoracic disc landmark with MRI?',
    choices: ['Number the patient solely from the closest atlas shape', 'Infer cord compression from the exploded mesh', 'Confirm patient numbering and coverage, then correlate sagittal and same-level axial images', 'Assume an uncovered disc level is normal'],
    correctAnswer: 'Confirm patient numbering and coverage, then correlate sagittal and same-level axial images',
    explanation: 'Level identification and coverage must be established on the actual examination before comparing planes. An uncovered level cannot be assessed, and a source landmark does not supply patient cord or CSF findings.',
    reference: coverage,
  },
  surfaceLimits: {
    body: 'Which information does this whole-disc surface model supply when studying MRI anatomy?',
    choices: ['Patient nucleus-pulposus MR signal', 'A measured degree of spinal canal narrowing', 'Automatic registration to the patient scan', 'An exterior source-anatomy landmark, not internal tissue signal'],
    correctAnswer: 'An exterior source-anatomy landmark, not internal tissue signal',
    explanation: 'Annulus, nucleus and endplates are not independent selections in this model. Examine the acquired series for tissue signal and neural relationships; cutting or separating a surface mesh does not create those data.',
    reference: 'https://www.radiologyinfo.org/en/info/spinemr',
  },
  lumbarNumbering: {
    body: 'Before assigning this disc a level on patient MRI, what must be established?',
    choices: ['The nearest atlas label, irrespective of patient anatomy', 'The patient vertebral numbering convention, accounting for transitional anatomy', 'A level inferred from mesh colour', 'The lowest visible disc alone, irrespective of imaging coverage'],
    correctAnswer: 'The patient vertebral numbering convention, accounting for transitional anatomy',
    explanation: 'Numeric variants and transitional anatomy can change enumeration. Confirm numbering with suitable examination coverage; this source-labelled disc does not automatically identify a two-vertebra patient interval or a nerve root.',
    reference: 'https://pubmed.ncbi.nlm.nih.gov/20203111/',
  },
} as const;
