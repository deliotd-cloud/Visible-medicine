// Original formative questions. Links are factual reading references, not reused assets.
const oralAnatomy = 'https://anatomy.ttuhscep.edu/nervous_system/infratemp.html';
const attachments = 'https://anatomy.ttuhscep.edu/anatomytables/joints_alpha.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const salivaryStylohyoidQuizQuestions = {
  submandibular: question('The main submandibular duct normally opens at which oral landmark?',
    ['Palatine tonsil', 'Parotid papilla', 'Sublingual caruncle', 'Foramen cecum'], 'Sublingual caruncle',
    'This opening is in the mouth floor; it is not the parotid duct opening.', oralAnatomy),
  sublingual: question('During its usual forward course, the submandibular duct lies against which surface of the sublingual gland?',
    ['Lateral', 'Superior', 'Posterior', 'Medial'], 'Medial',
    'Keep the gland and neighbouring duct separate; the gland surface does not reconstruct a duct.', oralAnatomy),
  stylohyoid: question('Which attachment pair belongs to the stylohyoid ligament?',
    ['Mandibular condyle — articular fossa', 'Temporal styloid — lesser hyoid horn', 'Coronoid process — zygomatic arch', 'Sphenoid spine — mandibular lingula'],
    'Temporal styloid — lesser hyoid horn',
    'This ligament links skull and hyoid; it is not the stylohyoid muscle.', attachments),
} as const;
export type SalivaryStylohyoidQuizGroup = keyof typeof salivaryStylohyoidQuizQuestions;
