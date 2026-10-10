// Original formative wording about general anatomy. Source meshes do not establish muscle function.
const subclavius = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
const trapezius = 'https://anatomy.ttuhscep.edu/modules/upper_limb_module/upper_limb_03.html';
const middle = 'https://rad.uw.edu/muscle-atlas/trapezius';
const directions = 'https://learning.medicine.wsu.edu/cohort-2029/dissector/lab-2-station-6/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, references: string[]) =>
  ({body, choices, correctAnswer, explanation, references});

export const scapularMuscleQuizQuestions = {
  subclavius: question('Which two bones provide the main attachments of subclavius?',
    ['Scapula and humerus', 'Sternum and scapula', 'First rib and clavicle', 'Humerus and clavicle'],
    'First rib and clavicle', 'Subclavius attaches from the first rib and its cartilage to the inferior clavicle. This source selection does not verify either attachment in a patient.', [subclavius]),
  ascending: question('Which scapular movement is chiefly associated with the ascending (inferior) trapezius fibers?',
    ['Scapular depression', 'Scapular elevation', 'Scapular protraction', 'Humeral medial rotation'],
    'Scapular depression', 'The ascending, inferior trapezius fibers help depress the scapula. This mesh does not measure movement or muscle activation.', [trapezius, directions]),
  transverse: question('Which scapular movement is chiefly associated with the transverse (middle) trapezius fibers?',
    ['Scapular elevation', 'Scapular protraction', 'Scapular depression', 'Scapular retraction'],
    'Scapular retraction', 'The transverse, middle trapezius fibers pull the scapula toward the vertebral column. This mesh does not measure movement or muscle activation.', [middle]),
  descending: question('Which scapular movement is chiefly associated with the descending (superior) trapezius fibers?',
    ['Scapular protraction', 'Scapular elevation', 'Scapular depression', 'Humeral extension'],
    'Scapular elevation', 'The descending, superior trapezius fibers help elevate the scapula. This mesh does not measure movement or muscle activation.', [trapezius, directions]),
} as const;
export type ScapularMuscleQuizGroup = keyof typeof scapularMuscleQuizQuestions;
