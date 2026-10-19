export const footVascularQuizGroups = {
  medialPlantar: ['FMA43929', 'FMA43930'],
  plantarArch: ['FMA43943', 'FMA43944'],
  deepPlantar: ['FMA69514', 'FMA69515'],
  dorsalVenousArch: ['FMA44881', 'FMA44882'],
} as const;
export type FootVascularQuizGroup = keyof typeof footVascularQuizGroups;
const arteries = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html';
const veins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html';
export const footVascularQuizQuestions = {
  medialPlantar: {
    body: 'Which artery gives rise to the medial plantar artery?',
    choices: ['Posterior tibial artery', 'Anterior tibial artery', 'Fibular artery', 'Popliteal artery'],
    correctAnswer: 'Posterior tibial artery',
    explanation: 'The posterior tibial artery divides into medial and lateral plantar arteries.',
    reference: arteries,
  },
  plantarArch: {
    body: 'In typical anatomy, which pairing describes the main arterial continuity of the plantar arch?',
    choices: ['Medial plantar artery with the anterior tibial artery', 'Lateral plantar artery with a deep plantar contribution', 'Fibular artery with the medial plantar artery', 'Popliteal artery with the dorsalis pedis artery'],
    correctAnswer: 'Lateral plantar artery with a deep plantar contribution',
    explanation: 'The lateral plantar artery typically forms the plantar arterial arch and communicates with the deep plantar branch of dorsalis pedis.',
    reference: arteries,
  },
  deepPlantar: {
    body: 'Which artery gives rise to the deep plantar artery?',
    choices: ['Medial plantar artery', 'Fibular artery', 'Dorsalis pedis artery', 'Lateral plantar artery'],
    correctAnswer: 'Dorsalis pedis artery',
    explanation: 'The deep plantar artery branches from dorsalis pedis and contributes to the plantar arterial arch.',
    reference: arteries,
  },
  dorsalVenousArch: {
    body: 'Which veins continue from the medial and lateral ends of the dorsal venous arch, respectively?',
    choices: ['Small saphenous and great saphenous veins', 'Anterior tibial and posterior tibial veins', 'Posterior tibial and fibular veins', 'Great saphenous and small saphenous veins'],
    correctAnswer: 'Great saphenous and small saphenous veins',
    explanation: 'The medial end drains toward the great saphenous vein; the lateral end drains toward the small saphenous vein.',
    reference: veins,
  },
} as const;
