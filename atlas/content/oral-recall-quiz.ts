// Original, brief formative questions about general anatomy. The same question is shared by each pinned member of its group.
const dental = 'https://www.dentalcare.com/en-us/ce-courses/ce500/types-of-teeth-and-their-functions';
const muscles = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, references: string[]) =>
  ({body, choices, correctAnswer, explanation, references});

export const oralRecallQuizQuestions = {
  incisors: question('Which task best matches incisors during eating?',
    ['Cutting food', 'Grinding food', 'Tearing food', 'Crushing food'],
    'Cutting food', 'Incisors cut food.', [dental]),
  canines: question('In permanent dentition, where do canines lie?',
    ['Behind molars', 'Between lateral incisors and premolars', 'Between two premolars', 'In front of central incisors'],
    'Between lateral incisors and premolars', 'Canines sit behind lateral incisors and before premolars.', [dental]),
  premolars: question('Which tooth type is absent from primary dentition?',
    ['Incisors', 'Canines', 'Premolars', 'Molars'],
    'Premolars', 'Primary dentition has no premolars.', [dental]),
  molars: question('Which feature helps molars grind food?',
    ['A narrow cutting edge', 'A long, narrow crown', 'A single pointed cusp', 'A broad chewing surface'],
    'A broad chewing surface', 'Molars use broad surfaces for grinding.', [dental]),
  tongue: question('What do intrinsic tongue muscles change?',
    ['Jaw position', 'Tongue shape', 'Uvula length', 'Tooth position'],
    'Tongue shape', 'Intrinsic muscles alter the tongue\'s shape.', [muscles]),
  uvula: question('What does the musculus uvulae do?',
    ['Depresses the tongue', 'Opens the jaw', 'Shortens the uvula', 'Tenses the cheek'],
    'Shortens the uvula', 'The musculus uvulae shortens the uvula.', [muscles]),
} as const;

export type OralRecallQuizGroup = keyof typeof oralRecallQuizQuestions;
