// Original formative wording. The anatomy reference describes usual actions,
// not motion or validated boundaries of the selected reference surfaces.
const reference = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const forefootMuscleQuizQuestions = {
  lumbricals: question(
    'What combined toe action is associated with the foot lumbricals?',
    ['Flex the toe bases and extend their interphalangeal joints', 'Extend the toe bases and flex their interphalangeal joints', 'Adduct toes towards the second-toe axis', 'Flex only the great-toe base'],
    'Flex the toe bases and extend their interphalangeal joints',
    'Foot lumbricals act on toes 2–5, flexing at the metatarsophalangeal joints and helping extend the interphalangeal joints. A static selection does not show motion.',
  ),
  plantarInterossei: question(
    'Towards which axis do the plantar interossei bring toes 3–5?',
    ['Great-toe axis', 'Second-toe axis', 'Third-toe axis', 'Fifth-toe axis'],
    'Second-toe axis',
    'The plantar interossei adduct toes 3–5 towards the second toe. Their individual tendons and movements are not established by the selected surfaces.',
  ),
  flexorHallucisBrevis: question(
    'At which joint does flexor hallucis brevis help bend the great toe?',
    ['Ankle joint', 'Great-toe interphalangeal joint', 'Great-toe metatarsophalangeal joint', 'Fifth-toe metatarsophalangeal joint'],
    'Great-toe metatarsophalangeal joint',
    'Both represented heads of flexor hallucis brevis contribute to bending the great toe at its metatarsophalangeal joint. The model does not demonstrate force or movement.',
  ),
} as const;
export type ForefootMuscleQuizGroup = keyof typeof forefootMuscleQuizQuestions;
