// Original formative wording about usual relationships, not validation of source surfaces.
const intestine = 'https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html';
const thorax = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/joint-tables/joints-and-ligaments-of-the-thorax/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const trunkCoreQuizQuestions = {
  rectum: question('Which bowel segment is immediately proximal to the rectum?',
    ['Sigmoid colon', 'Cecum', 'Transverse colon', 'Ascending colon'],
    'Sigmoid colon', 'The sigmoid colon leads into the rectum at the distal end of the colon.', intestine),
  firstCostal: question('What type of joint normally connects the first costal cartilage to the sternum?',
    ['Plane synovial joint', 'Synchondrosis', 'Syndesmosis', 'Symphysis'],
    'Synchondrosis', 'The first sternocostal articulation is cartilaginous, unlike the usual synovial joints below it.', thorax),
  laterCostal: question('What type of sternocostal articulation is usual for costal cartilages two through seven?',
    ['Synchondrosis', 'Syndesmosis', 'Synovial joint', 'Symphysis'],
    'Synovial joint', 'These cartilages normally meet the sternum at synovial joints; this is not the rib-to-cartilage joint.', thorax),
} as const;
export type TrunkCoreQuizGroup = keyof typeof trunkCoreQuizQuestions;
