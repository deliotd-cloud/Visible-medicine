/** Original questions; references support facts, not reproduction of prose or images. */
export const lumbarSacralQuizGroups = {
  numbering: ['FMA13072'],
  ligament: ['FMA13073'],
  softTissue: ['FMA13074'],
  degenerativeSlip: ['FMA13075'],
  pars: ['FMA13076'],
  sacrum: ['FMA16202'],
} as const;
export type LumbarSacralQuizGroup = keyof typeof lumbarSacralQuizGroups;
export const lumbarSacralQuizQuestions = {
  numbering: {
    body: 'Can the source label L1, or a similar vertebral shape, establish the level on a patient examination?',
    choices: ['Yes, from a similar vertebral outline alone', 'No; establish numbering on the acquired examination', 'Yes, from the lowest visible disc alone', 'Yes, using the closest atlas level to the iliac crest'],
    correctAnswer: 'No; establish numbering on the acquired examination',
    explanation: 'Numeric variants and transitional anatomy can change vertebral enumeration. Establish the patient numbering convention using suitable imaging coverage; an atlas label is not a patient-level mapping.',
    reference: 'https://pubmed.ncbi.nlm.nih.gov/20203111/',
  },
  ligament: {
    body: 'Which non-bony structure can thicken and contribute to lumbar spinal canal narrowing?',
    choices: ['Transverse process', 'Pedicle', 'Ligamentum flavum', 'Spinous process'],
    correctAnswer: 'Ligamentum flavum',
    explanation: 'Ligamentum flavum thickening can contribute to stenosis alongside disc and facet changes. A vertebral bone surface alone does not show the full canal or its neural contents.',
    reference: 'https://www.orthoinfo.org/diseases--conditions/lumbar-spinal-stenosis/',
  },
  softTissue: {
    body: 'Which capability makes MRI useful when assessing lumbar neural compression beyond bone contours?',
    choices: ['Showing bony cortical contours alone', 'Producing a projection radiograph', 'Giving a calibrated CT bone-density value', 'Depicting discs and neural soft tissues on acquired images'],
    correctAnswer: 'Depicting discs and neural soft tissues on acquired images',
    explanation: 'MRI can assess discs and neural soft tissues that a bone mesh cannot represent. Interpret the actual examination and clinical context; model isolation or apparent space does not establish stenosis.',
    reference: 'https://www.orthoinfo.org/diseases--conditions/lumbar-spinal-stenosis/',
  },
  degenerativeSlip: {
    body: 'Must a lumbar vertebral slip always have an associated pars defect?',
    choices: ['No; degenerative slip can occur without a pars defect', 'Yes; every vertebral slip requires a pars fracture', 'Yes; disc degeneration excludes vertebral slip', 'No; only degenerative slips require pars defects'],
    correctAnswer: 'No; degenerative slip can occur without a pars defect',
    explanation: 'Degenerative and isthmic spondylolisthesis have different mechanisms. Degenerative slip relates to disc, facet and supporting-tissue degeneration; isthmic slip is associated with a pars defect. This source vertebra does not simulate either condition.',
    reference: 'https://www.orthoinfo.org/diseases--conditions/adult-spondylolisthesis-in-the-low-back/',
  },
  pars: {
    body: 'Which distinction separates spondylolysis from spondylolisthesis?',
    choices: ['Disc dehydration versus marrow oedema', 'Pars defect versus vertebral slip', 'Central canal versus lateral recess', 'Sacral fusion versus lumbar numbering'],
    correctAnswer: 'Pars defect versus vertebral slip',
    explanation: 'Spondylolysis concerns a defect in the pars interarticularis; spondylolisthesis concerns displacement of one vertebra relative to another. A pars defect can occur without slip. Neither is demonstrated by an intact reference mesh.',
    reference: 'https://www.orthoinfo.org/diseases--conditions/spondylolysis-and-spondylolisthesis/',
  },
  sacrum: {
    body: 'Does an unrevealing plain radiograph exclude a suspected sacral insufficiency fracture?',
    choices: ['Yes; all sacral fractures have an obvious line', 'Yes; a normal lumbar radiograph proves the sacrum is intact', 'No; an occult fracture may require further clinically directed imaging', 'Yes; MRI cannot show fracture-related marrow changes'],
    correctAnswer: 'No; an occult fracture may require further clinically directed imaging',
    explanation: 'Sacral insufficiency fractures may be obscured on radiographs. MRI can reveal fracture-related marrow oedema, while CT helps assess fracture morphology. The examination, coverage and clinical context matter; the atlas supplies neither fracture nor marrow signal.',
    reference: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7964142/',
  },
} as const;
