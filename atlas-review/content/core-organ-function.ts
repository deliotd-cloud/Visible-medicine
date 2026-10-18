// Original introductory summaries; no publication prose, image or animation is imported.
export const coreOrganFunctionReferences = {
  heart: 'https://www.nhlbi.nih.gov/health/heart/blood-flow',
  lung: 'https://www.nhlbi.nih.gov/health/lungs/respiratory-system',
  liverNci: 'https://www.cancer.gov/types/liver/what-is-liver-cancer',
  liverDigestion:
    'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
  liverAlbumin: 'https://medlineplus.gov/lab-tests/albumin-blood-test/',
} as const;

export const coreOrganFunctionTopics = {
  heart: {
    title: 'Circulatory role & visible limits',
    body:
      'Rhythmic contraction of the heart generates pressure for two linked circuits. The right heart receives systemic venous blood and sends it towards the lungs; oxygenated blood returns to the left heart for delivery through the systemic circulation. Coronary vessels supply the heart muscle itself.',
    bullets: [
      'The pulmonary circuit links the right heart with the lungs; the systemic circuit links the left heart with the rest of the body.',
      'The nested cardiac study exposes selected cavities and vessels, but the root and nested surfaces do not animate contraction, valves or blood flow and do not quantify pressure, volume or perfusion.',
      'Source: National Heart, Lung, and Blood Institute; National Institutes of Health; U.S. Department of Health and Human Services.',
    ],
    references: ['heart'],
  },
  lung: {
    title: 'Respiratory role & visible limits',
    body:
      'Ventilation moves air through the respiratory passages into and out of the lungs. In the alveoli, oxygen moves from inhaled air into blood while carbon dioxide moves from blood into air for exhalation. Air movement depends on the respiratory muscles and open airways; it is distinct from gas transfer across the alveolar surface.',
    bullets: [
      'Both lungs participate in gas exchange; the right lung has three lobes, while the smaller left lung has two and leaves space for the heart.',
      'The nested pulmonary study exposes selected lobar branch groups and proximal airway context; it is not a complete airway tree, alveolar model or animation of ventilation or gas exchange.',
      'Source: National Heart, Lung, and Blood Institute; National Institutes of Health; U.S. Department of Health and Human Services.',
    ],
    references: ['lung'],
  },
  liver: {
    title: 'Metabolic role & visible limits',
    body:
      'The liver processes nutrient-rich blood arriving from the digestive tract, stores glucose as glycogen, makes bile that helps digest fats, and produces plasma proteins including albumin. It also changes and clears many substances from the blood; these coordinated roles extend beyond any single visible surface.',
    bullets: [
      'Bile made by the liver enters a separate drainage system; bile production does not make this surface a complete biliary model.',
      'The displayed root aggregates source components but does not show microscopic lobules, biochemical pathways, dynamic blood processing or quantified liver function.',
      'References: National Cancer Institute, “What Is Liver Cancer?”; National Institute of Diabetes and Digestive and Kidney Diseases. Source: MedlinePlus, National Library of Medicine. This is introductory physiology, not diagnostic guidance.',
    ],
    references: ['liverNci', 'liverDigestion', 'liverAlbumin'],
  },
} as const;
