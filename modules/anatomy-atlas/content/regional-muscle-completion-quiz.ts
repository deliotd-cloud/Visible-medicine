// Original general-anatomy draft questions; source meshes do not establish attachments or action.
const headNeck = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html';
const pelvicFloor = 'https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html';
const lowerLimb = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const transverseHead = 'https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-lower-limb/transverse-head-of-adductor-hallucis/22943';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, references: string[]) =>
  ({body, choices, correctAnswer, explanation, references});

export const regionalMuscleCompletionQuizQuestions = {
  longus: question('Where on the skull does longus capitis attach?',
    ['Basilar occipital bone', 'Mastoid process', 'Zygomatic arch', 'Mandibular ramus'],
    'Basilar occipital bone', 'Longus capitis reaches the basilar portion of the occipital bone.', [headNeck]),
  anterior: question('Which head movement is associated with rectus capitis anterior?',
    ['Head extension', 'Head flexion', 'Head rotation', 'Jaw elevation'],
    'Head flexion', 'Rectus capitis anterior contributes to flexion of the head.', [headNeck]),
  lateralis: question('Which head movement is associated with rectus capitis lateralis?',
    ['Head extension', 'Head rotation', 'Lateral bending of the head', 'Jaw elevation'],
    'Lateral bending of the head', 'Rectus capitis lateralis contributes to lateral bending of the head.', [headNeck]),
  coccygeus: question('Coccygeus and levator ani together form which muscular floor?',
    ['Thoracic diaphragm', 'Urogenital diaphragm', 'Oral diaphragm', 'Pelvic diaphragm'],
    'Pelvic diaphragm', 'Coccygeus and levator ani together form the pelvic diaphragm.', [pelvicFloor]),
  oblique: question('The oblique head of adductor hallucis arises chiefly from which bones?',
    ['Bases of metatarsals 2–4', 'Heads of metatarsals 3–5', 'Calcaneal tuberosity', 'Distal phalanges 2–4'],
    'Bases of metatarsals 2–4', 'The oblique head arises from the bases of the second through fourth metatarsals.', [lowerLimb]),
  transverse: question('Which soft tissue provides an origin for the transverse head of adductor hallucis?',
    ['Calcaneal tendon', 'Plantar ligaments of lateral metatarsophalangeal joints', 'Flexor retinaculum', 'Plantar aponeurosis at the heel'],
    'Plantar ligaments of lateral metatarsophalangeal joints', 'The transverse head arises from plantar ligaments of the lateral metatarsophalangeal joints and the adjacent deep transverse metatarsal ligament.', [transverseHead]),
} as const;
export type RegionalMuscleCompletionQuizGroup = keyof typeof regionalMuscleCompletionQuizQuestions;
