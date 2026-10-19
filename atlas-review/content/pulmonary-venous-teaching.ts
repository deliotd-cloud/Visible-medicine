// Original orientation drafts. Reading links do not licence source text, figures or images.
export const pulmonaryVenousTeachingReferences = {
  hilum: 'https://anatomy.ttuhscep.edu/schemes/lungs_ans.html',
  ct: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3384510/',
  mrComparison: 'https://pubmed.ncbi.nlm.nih.gov/23172711/',
} as const;

export type PulmonaryVenousTeachingGroup =
  | 'rightSuperior' | 'rightInferior' | 'leftSuperior' | 'leftInferior';

type Reference = keyof typeof pulmonaryVenousTeachingReferences;
type ImagingConcept = { body: string; bullets: readonly string[]; references: readonly Reference[] };
type QuizConcept = {
  body: string; choices: readonly [string, string, string, string];
  correctAnswer: string; explanation: string; references: readonly Reference[];
};
type TeachingConcept = { ct: ImagingConcept; mri: ImagingConcept; quiz: QuizConcept };

export const pulmonaryVenousTeachingConcepts: Record<PulmonaryVenousTeachingGroup, TeachingConcept> = {
  rightSuperior: {
    ct: {
      body: 'On CT, follow usual right upper- and middle-lobe return through the anterior hilum to the left atrium.',
      bullets: [
        'Use axial and orthogonal views to distinguish the artery and posterior bronchus by continuity.',
        'Middle-lobe drainage and ostia vary; atlas pieces do not count openings.',
      ], references: ['hilum', 'ct'],
    },
    mri: {
      body: 'Relate the right superior vein to the left atrium on anatomy-oriented MRI or venous MRA source images.',
      bullets: [
        'Follow usual upper- and middle-lobe return across planes; one routine plane or MRA projection may omit a connection.',
        'Motion changes depiction. The atlas supplies no lumen, flow, ostial count or patient correspondence.',
      ], references: ['hilum', 'mrComparison'],
    },
    quiz: {
      body: 'An anterior right hilar vessel appears to approach the left atrium. What best supports calling it a pulmonary vein?',
      choices: [
        'Its colour on the atlas surface is blue.',
        'It lies near the right pulmonary artery in one axial section.',
        'Its course continues to the left atrium on acquired sections in more than one plane.',
        'The atlas contains one right superior source file.',
      ],
      correctAnswer: 'Its course continues to the left atrium on acquired sections in more than one plane.',
      explanation: 'A vein is identified by the traced atrial connection, with typical anterior hilar position as an orientation clue. Colour, one section and source-file count cannot distinguish the artery or establish an ostium; variants need review on the acquired study.',
      references: ['hilum', 'ct'],
    },
  },
  rightInferior: {
    ct: {
      body: 'On CT, trace right lower-lobe return through the inferior hilum to the left atrium.',
      bullets: [
        'Use contiguous, orthogonal images to separate the vein from artery and posterior bronchus.',
        'Inferior position alone proves neither identity nor a complete drainage or ostial pattern.',
      ], references: ['hilum', 'ct'],
    },
    mri: {
      body: 'Seek right lower-lobe return and its atrial connection on anatomy-oriented MRI or venous MRA source images.',
      bullets: [
        'Compare its inferior course with bronchus and artery; a routine plane may miss the connection.',
        'Projected overlap is not a junction. Motion and acquisition can change apparent geometry.',
      ], references: ['hilum', 'mrComparison'],
    },
    quiz: {
      body: 'At the right hilum, a low vessel is visible on one CT section. Which next step best separates an inferior pulmonary vein from a neighbouring artery?',
      choices: [
        'Follow the vessel on consecutive and orthogonal acquired sections to its left-atrial connection.',
        'Use inferior position alone as definitive identification.',
        'Count the labelled meshes attached to the right lung.',
        'Assume any vessel in front of the bronchus is an artery.',
      ],
      correctAnswer: 'Follow the vessel on consecutive and orthogonal acquired sections to its left-atrial connection.',
      explanation: 'Continuity to the left atrium establishes the venous pathway. Hilar position is only typical; overlap, variants and source-file grouping make location or mesh count insufficient.',
      references: ['hilum', 'ct'],
    },
  },
  leftSuperior: {
    ct: {
      body: 'On CT, follow left upper-lobe and lingular return through the anterior hilum to the left atrium.',
      bullets: [
        'Use orthogonal views: the artery is usually superior; the bronchus is posterior.',
        'A shared opening is possible. Two grouped files do not count branches or ostia.',
      ], references: ['hilum', 'ct'],
    },
    mri: {
      body: 'Follow left upper-lobe and lingular return on anatomy-oriented MRI or venous MRA source images.',
      bullets: [
        'Inspect atrial entry across planes; projection or routine coverage may hide a junction.',
        'Two donor files do not count ostia. MRI and CT geometry varies with acquisition.',
      ], references: ['hilum', 'mrComparison'],
    },
    quiz: {
      body: 'The left superior selection is assembled from two source files. What can be concluded about its left-atrial opening?',
      choices: [
        'There must be two separate left superior ostia.',
        'It must share one ostium with the left inferior vein.',
        'Each source file names an independently validated lung segment.',
        'Nothing about ostial number follows from file count; inspect the acquired atrial connections.',
      ],
      correctAnswer: 'Nothing about ostial number follows from file count; inspect the acquired atrial connections.',
      explanation: 'Files are grouped source surfaces, not validated tributaries or atrial openings. Separate and shared connections are anatomical possibilities; source images across planes are needed to identify the actual pattern.',
      references: ['ct'],
    },
  },
  leftInferior: {
    ct: {
      body: 'On CT, follow left lower-lobe return through the inferior hilum to the left atrium.',
      bullets: [
        'Across planes, distinguish its course from the superior artery and posterior bronchus.',
        'Inspect the atrial entry; three grouped files do not count branches or ostia.',
      ], references: ['hilum', 'ct'],
    },
    mri: {
      body: 'Track left lower-lobe return to the atrium on anatomy-oriented MRI or venous MRA source images.',
      bullets: [
        'Compare source planes with projections; overlap can hide or falsely join atrial entries.',
        'Three donor files are not a drainage map. Apparent angles and dimensions vary by acquisition.',
      ], references: ['hilum', 'mrComparison'],
    },
    quiz: {
      body: 'A venous MRA projection seems to join the left inferior and superior veins. Which interpretation respects the image and atlas limits?',
      choices: [
        'The three left inferior source files prove three separate atrial openings.',
        'Review acquired source planes for the atrial entries; projection overlap and sequence coverage can mislead.',
        'The atlas donor geometry can be transferred directly onto the patient MRA.',
        'A shared opening can be excluded because four atlas veins are named.',
      ],
      correctAnswer: 'Review acquired source planes for the atrial entries; projection overlap and sequence coverage can mislead.',
      explanation: 'Projected overlap cannot prove a shared connection. The actual entries require acquired source images; four labels and grouped source files establish neither a complete drainage map nor ostial number, and donor geometry is not registered to a patient.',
      references: ['ct', 'mrComparison'],
    },
  },
};
