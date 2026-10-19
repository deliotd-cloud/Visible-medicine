// Original formative wording; citations support usual anatomy, not source-mesh validation.
const arteries = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html';
const veins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const foregutVesselQuizQuestions = {
  commonHepaticArtery: question('Which artery normally branches from the common hepatic artery?',
    ['Left gastric artery', 'Proper hepatic artery', 'Splenic artery', 'Superior mesenteric artery'],
    'Proper hepatic artery', 'The common hepatic usually gives rise to the proper hepatic and gastroduodenal arteries.', arteries),
  properHepaticArtery: question('Which artery normally branches from the proper hepatic artery?',
    ['Splenic artery', 'Left gastric artery', 'Gastroduodenal artery', 'Right hepatic artery'],
    'Right hepatic artery', 'The proper hepatic usually divides into right and left hepatic arteries; branching can vary.', arteries),
  splenicArtery: question('Which artery normally gives rise to the short gastric arteries?',
    ['Splenic artery', 'Right gastric artery', 'Common hepatic artery', 'Inferior mesenteric artery'],
    'Splenic artery', 'Short gastric branches usually arise from the splenic artery and reach the stomach fundus.', arteries),
  leftGastricArtery: question('The left gastric artery normally follows which border of the stomach?',
    ['Greater curvature', 'Fundus only', 'Lesser curvature', 'Pyloric canal only'],
    'Lesser curvature', 'It supplies the upper stomach near the lesser curvature and commonly arises from the celiac trunk.', arteries),
  leftGastroepiploicVein: question('The left gastroepiploic vein normally drains into which vein?',
    ['Portal vein', 'Superior mesenteric vein', 'Inferior vena cava', 'Splenic vein'],
    'Splenic vein', 'The left gastroepiploic, or gastro-omental, vein usually carries greater-curvature drainage to the splenic vein.', veins),
  rightGastroepiploicVein: question('The right gastroepiploic vein normally drains towards which vein?',
    ['Superior mesenteric vein', 'Splenic vein', 'Left renal vein', 'Inferior vena cava'],
    'Superior mesenteric vein', 'The right gastroepiploic, or gastro-omental, vein usually reaches the superior mesenteric system; confluence varies.', veins),
  leftGastricVein: question('Which stomach border does the left gastric vein normally drain?',
    ['Greater curvature', 'Lesser curvature', 'Fundus only', 'Duodenal border'],
    'Lesser curvature', 'The left gastric vein usually drains the lesser curvature and lower esophagus towards the portal vein.', veins),
  rightGastricVein: question('The right gastric vein normally drains into which vein?',
    ['Splenic vein', 'Inferior vena cava', 'Portal vein', 'Left renal vein'],
    'Portal vein', 'It usually carries lesser-curvature drainage to the portal vein; individual venous anatomy can vary.', veins),
} as const;
export type ForegutVesselQuizGroup = keyof typeof foregutVesselQuizQuestions;
