// Original educational wording and reading links only; no study prose, images or scans imported.
export const spinalBoneUltrasoundReferences = {
  thoracicSonoanatomy: 'https://pubmed.ncbi.nlm.nih.gov/22354105/',
  trunkNerveTracking: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5222601/',
  lumbarSonoanatomy: 'https://pubmed.ncbi.nlm.nih.gov/22010025/',
  vertebralVariants: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7713870/',
} as const;

export const spinalBoneUltrasoundTeaching = {
  thoracic: {
    body: 'On a posterior thoracic sonogram, first separate the midline spinous-process echo from the adjacent laminar echoes. The bright accessible cortex casts a deeper acoustic shadow; the shadow is not a view through the vertebral body.',
    bullets: [
      'Moving laterally in the anatomy changes the expected bony landmark from lamina and articular column to transverse process, costotransverse region and rib. A rib echo and its shadow should not be renamed as the selected vertebra.',
      'Ribs and overlapping posterior elements leave restricted interlaminar acoustic gaps. In an adult volunteer study, upper thoracic views were more often inconclusive than lower thoracic views; even a visible gap does not make the whole canal visible.',
      'A thoracic level label requires a verified counting context. Rib number or a single prominent process can mislead where thoracolumbar segments or rib counts vary; this isolated bone surface cannot resolve an individual patient’s vertebral numbering.',
      'This source-labelled surface represents one vertebra for spatial teaching. It is not a recorded ultrasound frame, a registered patient contour, or evidence of cortex continuity, vertebral-body marrow, disc or spinal-cord appearance.',
    ],
    citations: ['thoracicSonoanatomy', 'trunkNerveTracking', 'vertebralVariants'],
  },
  lumbar: {
    body: 'On a posterior lumbar sonogram, a midline spinous-process echo and shadow orient the view. Just off midline, repeated laminar echoes alternate with interlaminar gaps; the gap is an acoustic window between bones, not a hole in the vertebra.',
    bullets: [
      'Farther lateral, the articular-process column and then the transverse-process echoes form different repeating patterns. Keep a facet-region echo distinct from the lamina and from the selected whole-vertebra mesh.',
      'A phantom and small volunteer study delineated lumbar laminae, articular processes, transverse processes and L3/L4–L4/L5 interlaminar windows. Visibility through a window depends on the actual acquisition; it cannot be assumed from this model.',
      'Toward the lower lumbar junction, the broad posterior sacral echo and the L5/S1 gap help orient relative position. Transitional anatomy can alter a level count, so neither this mesh label nor an isolated surface landmark verifies a patient’s L2–L5 numbering.',
      'The superficial bone echo shadows what lies directly behind it. This atlas surface cannot inspect vertebral-body marrow, a disc or spinal cord, and no patient scan or atlas-to-patient registration is supplied.',
    ],
    citations: ['lumbarSonoanatomy', 'vertebralVariants'],
  },
} as const;

export const spinalBoneUltrasoundNote =
  'Original educational draft; revision-bound radiologist sign-off pending. The cited observations describe acquired ultrasound and anatomical variation, not validation of this mesh or any clinical finding. No diagnostic, procedural or patient-specific inference is supplied. Atlas, case and paid-lecture access remain independent.';
