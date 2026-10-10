// Original formative questions about usual foot anatomy; source surfaces remain unvalidated.
const lowerLimb = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string) => ({
  body, choices, correctAnswer, explanation, references: [lowerLimb],
});

export const plantarMuscleQuizQuestions = {
  abductorDigitiMinimi: question('What movement does abductor digiti minimi of the foot produce?',
    ['Abduction of the fifth toe', 'Extension of the fifth toe', 'Adduction of the great toe', 'Ankle dorsiflexion'],
    'Abduction of the fifth toe', 'It draws the fifth toe away from the second-toe axis.'),
  flexorDigitiMinimiBrevis: question('Which joint does flexor digiti minimi brevis of the foot flex?',
    ['Fifth toe distal interphalangeal', 'Fifth toe metatarsophalangeal', 'Great toe interphalangeal', 'Ankle'],
    'Fifth toe metatarsophalangeal', 'Its usual action is flexion at the fifth toe metatarsophalangeal joint.'),
  abductorHallucis: question('Which nerve supplies abductor hallucis?',
    ['Lateral plantar nerve', 'Deep fibular nerve', 'Medial plantar nerve', 'Sural nerve'],
    'Medial plantar nerve', 'Abductor hallucis receives medial plantar nerve supply.'),
  extensorHallucisBrevis: question('Where does extensor hallucis brevis insert?',
    ['Base of the fifth metatarsal', 'Distal phalanx of the hallux', 'Flexor digitorum longus tendon', 'Proximal phalanx of the hallux'],
    'Proximal phalanx of the hallux', 'Its tendon reaches the dorsal base of the great toe proximal phalanx.'),
  flexorAccessorius: question('Quadratus plantae, also called flexor accessorius, joins which tendon?',
    ['Flexor digitorum longus', 'Tibialis anterior', 'Extensor hallucis longus', 'Fibularis brevis'],
    'Flexor digitorum longus', 'It attaches to flexor digitorum longus tendons and assists toe flexion.'),
  flexorDigitorumBrevis: question('Which toes receive tendons from flexor digitorum brevis?',
    ['Only the great toe', 'Only the fifth toe', 'Second through fifth toes', 'First through fourth toes'],
    'Second through fifth toes', 'Its tendons reach the middle phalanges of toes two through five.'),
} as const;
export type PlantarMuscleQuizGroup = keyof typeof plantarMuscleQuizQuestions;
