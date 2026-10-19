// Original formative wording about usual anatomy, not validation of source surfaces.
const arteries = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_head_neck.html';
const veins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_head_neck.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const headNeckVesselQuizQuestions = {
  commonCarotid: question('Which two arteries usually arise at the common carotid bifurcation?',
    ['Internal and external carotid arteries', 'Vertebral and basilar arteries', 'Subclavian and vertebral arteries', 'Anterior and posterior cerebral arteries'],
    'Internal and external carotid arteries', 'The common carotid normally divides into internal and external carotid branches.', arteries),
  internalCarotid: question('Which statement best describes the internal carotid artery in the neck?',
    ['It gives off the superior thyroid artery', 'It usually gives no cervical branches', 'It gives off the lingual artery', 'It gives off the facial artery'],
    'It usually gives no cervical branches', 'Named branches arise after its cervical course, not normally within it.', arteries),
  vertebral: question('From which artery does a vertebral artery usually arise?',
    ['Common carotid artery', 'Basilar artery', 'Subclavian artery', 'External carotid artery'],
    'Subclavian artery', 'The vertebral artery usually begins from the first part of the subclavian artery.', arteries),
  internalJugular: question('Which dural venous sinus continues as the internal jugular vein at the skull base?',
    ['Superior sagittal sinus', 'Straight sinus', 'Cavernous sinus', 'Sigmoid sinus'],
    'Sigmoid sinus', 'The internal jugular begins where the sigmoid sinus leaves the cranial cavity.', veins),
} as const;
export type HeadNeckVesselQuizGroup = keyof typeof headNeckVesselQuizQuestions;
