// Original formative wording about usual anatomy, not validation of source surfaces.
const wall = 'https://anatomy.ttuhscep.edu/schemes/abdo_wall_ing_tables.html';
const peritoneum = 'https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html';
const answers = 'https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_ans.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const abdominalConnectiveQuizQuestions = {
  lineaAlba: question('Which tissues meet to form the linea alba?',
    ['Aponeuroses of the three flat abdominal muscles', 'Rectus muscle bellies', 'Parietal peritoneum alone', 'Transversalis fascia alone'],
    'Aponeuroses of the three flat abdominal muscles', 'The midline band joins aponeuroses from external and internal oblique and transversus abdominis.', wall),
  smallBowelMesentery: question('Which bowel segments are suspended by the small-intestinal mesentery?',
    ['Duodenum and cecum', 'Jejunum and ileum', 'Ascending and descending colon', 'Transverse and sigmoid colon'],
    'Jejunum and ileum', 'This peritoneal fold links those two small-bowel segments to the posterior abdominal wall.', peritoneum),
  transverseMesocolon: question('Which organ attaches to the posterior abdominal wall through the transverse mesocolon?',
    ['Vermiform appendix', 'Jejunum', 'Transverse colon', 'Sigmoid colon'],
    'Transverse colon', 'This mesocolon is the peritoneal attachment of the transverse colon.', peritoneum),
  mesoappendix: question('Which artery travels in the mesoappendix to supply the appendix?',
    ['Middle colic artery', 'Inferior mesenteric artery', 'Anterior cecal artery', 'Appendicular artery'],
    'Appendicular artery', 'The mesoappendix carries the appendicular blood supply; this does not establish its origin in an individual.', answers),
} as const;
export type AbdominalConnectiveQuizGroup = keyof typeof abdominalConnectiveQuizQuestions;
