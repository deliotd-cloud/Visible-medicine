// Original formative wording about usual anatomy, not validation of source surfaces.
const ttuhsc = 'https://anatomy.ttuhscep.edu/anatomytables/bones_head_neck.html';
const openstax = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const craniofacialBoneQuizQuestions = {
  hyoid: question('Which bone directly articulates with the hyoid?',
    ['None', 'Mandible', 'Temporal bone', 'Second cervical vertebra'],
    'None', 'The hyoid is suspended without articulating with another bone.', openstax),
  inferiorConcha: question('Which structure is a separate bone rather than part of the ethmoid?',
    ['Superior nasal concha', 'Inferior nasal concha', 'Middle nasal concha', 'Ethmoid perpendicular plate'],
    'Inferior nasal concha', 'The inferior concha is independent of the ethmoid bone.', openstax),
  lacrimal: question('The lacrimal bone contributes to which orbital wall?',
    ['Roof', 'Floor', 'Medial wall', 'Lateral wall'],
    'Medial wall', 'The lacrimal is a small bone on the medial orbital side.', openstax),
  mandible: question('The mandibular condyle articulates with which bone at the temporomandibular joint?',
    ['Maxilla', 'Zygomatic bone', 'Sphenoid bone', 'Temporal bone'],
    'Temporal bone', 'The condyle meets the mandibular fossa and articular tubercle of the temporal bone.', openstax),
  vomer: question('Which nasal-septum region includes the vomer?',
    ['Posteroinferior bony part', 'Anterior cartilage', 'Superior ethmoid part', 'Lateral nasal wall'],
    'Posteroinferior bony part', 'The vomer contributes to the lower back part of the bony septum.', openstax),
  maxilla: question('Which orbital surface is formed in part by the maxilla?',
    ['Roof', 'Floor', 'Lateral wall', 'Posterior rim'],
    'Floor', 'The maxilla contributes to the floor beneath the orbit.', ttuhsc),
  nasal: question('Which bone articulates above each nasal bone?',
    ['Lacrimal bone', 'Palatine bone', 'Frontal bone', 'Vomer'],
    'Frontal bone', 'The frontal bone meets the superior border of each nasal bone.', ttuhsc),
  palatine: question('Which part of the palatine bone contributes to the posterior hard palate?',
    ['Perpendicular plate', 'Pyramidal process', 'Orbital process', 'Horizontal plate'],
    'Horizontal plate', 'The paired horizontal plates contribute to the posterior bony palate.', ttuhsc),
  zygomatic: question('Which facial prominence is formed by the zygomatic bone?',
    ['Cheek', 'Chin', 'Nasal bridge', 'Lower jaw'],
    'Cheek', 'The zygomatic bone provides the bony cheek prominence.', ttuhsc),
} as const;
export type CraniofacialBoneQuizGroup = keyof typeof craniofacialBoneQuizQuestions;
