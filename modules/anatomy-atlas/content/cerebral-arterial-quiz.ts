// Original formative wording about usual arterial relationships, not donor-specific flow.
const anterior = 'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html';
const posterior = 'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const cerebralArterialQuizQuestions = {
  basilar: question('Which vessels normally unite to form the basilar artery?',
    ['The paired vertebral arteries', 'The paired internal carotid arteries', 'The paired posterior cerebral arteries', 'The paired anterior cerebral arteries'],
    'The paired vertebral arteries', 'The vertebral arteries join near the pontomedullary junction. This surface cannot establish a patent junction.', posterior),
  anteriorCommunicating: question('What does the anterior communicating artery connect?',
    ['The two posterior cerebral arteries', 'The paired anterior cerebral arteries', 'The basilar and vertebral arteries', 'The internal carotid and basilar arteries'],
    'The paired anterior cerebral arteries', 'It joins the two anterior cerebral arteries across the midline.', anterior),
  anteriorCerebral: question('Which cortical territory is predominantly supplied by the anterior cerebral artery?',
    ['Lateral temporal cortex', 'Cerebellar cortex', 'Medial frontal and parietal cortex', 'Occipital visual cortex'],
    'Medial frontal and parietal cortex', 'The usual ACA territory includes medial frontal and parietal regions; this model has no perfusion map.', anterior),
  posteriorCommunicating: question('Which arteries does the posterior communicating artery normally link?',
    ['Both vertebral arteries', 'Both anterior cerebral arteries', 'The basilar and anterior cerebral arteries', 'The internal carotid and posterior cerebral arteries'],
    'The internal carotid and posterior cerebral arteries', 'This link may vary in size; the surface cannot establish its flow or patency.', anterior),
  posteriorCerebral: question('Where do posterior cerebral arteries usually arise?',
    ['At the basilar bifurcation', 'From the anterior communicating artery', 'From the external carotid arteries', 'Directly from the vertebral arteries'],
    'At the basilar bifurcation', 'A carotid-origin variant can occur. The source segments do not prove this donor’s origin or variant.', posterior),
} as const;
export type CerebralArterialQuizGroup = keyof typeof cerebralArterialQuizQuestions;
