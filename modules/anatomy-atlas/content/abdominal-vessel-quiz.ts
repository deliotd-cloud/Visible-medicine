// Original formative questions; cited tables are factual references, not reused assets.
const arteries = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html';
const veins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});
export const abdominalVesselQuizQuestions = {
  aorta: question('Which paired arteries usually arise at the abdominal aortic bifurcation?',
    ['Common iliac', 'External iliac', 'Internal iliac', 'Femoral'], 'Common iliac',
    'External and internal iliac arteries branch further downstream.', arteries),
  celiac: question('Which artery usually branches directly from the celiac trunk?',
    ['Renal', 'Left gastric', 'Inferior mesenteric', 'Common iliac'], 'Left gastric',
    'The usual three branches also include splenic and common hepatic arteries.', arteries),
  sma: question('Which bowel segment normally receives superior mesenteric arterial branches?',
    ['Sigmoid colon', 'Stomach', 'Jejunum', 'Descending colon'], 'Jejunum',
    'Jejunal branches belong to the midgut arterial supply.', arteries),
  ima: question('Which vessel is a usual inferior mesenteric artery branch?',
    ['Ileocolic', 'Middle colic', 'Right colic', 'Left colic'], 'Left colic',
    'The left colic artery contributes to descending-colon supply.', arteries),
  renal: question('Where do the main renal arteries usually originate?',
    ['Abdominal aorta', 'Celiac trunk', 'Common iliac arteries', 'Splenic artery'], 'Abdominal aorta',
    'Accessory arteries and variant patterns are not excluded by this reference model.', arteries),
  caval: question('Which paired veins usually unite to form the inferior vena cava?',
    ['Renal', 'Common iliac', 'Hepatic', 'Internal iliac'], 'Common iliac',
    'This is systemic venous return, not portal inflow.', veins),
  hepatic: question('The main hepatic veins carry liver outflow into which vessel?',
    ['Portal vein', 'Splenic vein', 'Inferior vena cava', 'Superior mesenteric vein'], 'Inferior vena cava',
    'Intrahepatic tributaries feed hepatic venous outflow; they are not portal branches.', veins),
  splenic: question('The splenic vein usually joins which vein to form the portal vein?',
    ['Right hepatic', 'Left renal', 'Inferior vena cava', 'Superior mesenteric'], 'Superior mesenteric',
    'This is a portal-system confluence, distinct from hepatic venous drainage.', veins),
} as const;
export type AbdominalVesselQuizGroup = keyof typeof abdominalVesselQuizQuestions;
