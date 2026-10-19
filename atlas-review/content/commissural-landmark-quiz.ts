// Original questions: factual reading links, not reproduced article material.
export const commissuralLandmarkQuizQuestions = {
  forniceal: {
    body: 'Why does failure to trace the human forniceal commissure on diffusion MRI not prove that crossing fibres are absent?',
    choices: [
      'A surface mesh measures individual axons directly',
      'Delicate fibres can be present histologically without being reconstructed by tractography',
      'The commissure is a cerebrospinal fluid channel',
      'Every streamline represents a confirmed anatomical connection',
    ],
    correctAnswer: 'Delicate fibres can be present histologically without being reconstructed by tractography',
    explanation: 'A multimodal study found fine crossing fibres between the fornical crura on histology despite no crossing connection in its 7 T tractography analysis. Neither a missing streamline nor this source-labelled surface establishes the presence or absence of a pathway in an individual patient.',
    references: ['https://pubmed.ncbi.nlm.nih.gov/35879431/'],
  },
  posterior: {
    body: 'Which landmark relationship helps locate the posterior commissure?',
    choices: [
      'Within the anterior horn of a lateral ventricle',
      'Below the fourth ventricle in the medulla',
      'Inside the optic canal beside the ophthalmic artery',
      'Above the rostral cerebral aqueduct in the pineal region',
    ],
    correctAnswer: 'Above the rostral cerebral aqueduct in the pineal region',
    explanation: 'Cadaveric dissection identified the posterior commissure above the upper aqueduct in the inferior pineal lamina. It is distinct from the habenular commissure. Learning this relationship does not validate the source surface or guarantee that either bundle is separately resolved on a scan.',
    references: ['https://pubmed.ncbi.nlm.nih.gov/42192803/'],
  },
} as const;

export type CommissuralLandmarkQuizGroup = keyof typeof commissuralLandmarkQuizQuestions;
