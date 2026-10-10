// Original formative questions; reading references do not license image reuse.
const arteries = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html';
const superficialVeins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html';
const deepVeins = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3036282/';
const calfVeins = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4974293/';
const venousUltrasound = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8411774/';
const profundaStudy = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11764913/';
const plantarStudy = 'https://pubmed.ncbi.nlm.nih.gov/38718967/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const lowerLimbVesselQuizQuestions = {
  femoralArtery: question('Which artery continues as the femoral artery?',
    ['External iliac', 'Internal iliac', 'Obturator', 'Inferior epigastric'],
    'External iliac', 'The name changes beneath the inguinal ligament.', arteries),
  deepFemoralArtery: question('Which compartment receives important perforators from the deep femoral artery?',
    ['Anterior leg', 'Posterior thigh', 'Lateral leg', 'Deep posterior leg'],
    'Posterior thigh', 'Its perforating branches supply the posterior thigh.', arteries),
  femoralVein: question('Despite the obsolete name “superficial femoral vein”, this vessel belongs to which system?',
    ['Superficial venous', 'Portal venous', 'Deep venous', 'Lymphatic'],
    'Deep venous', 'Use femoral vein: calling it superficial can misrepresent its deep-system location.', deepVeins),
  greatSaphenous: question('The great saphenous vein normally joins which deep vessel?',
    ['Popliteal', 'Posterior tibial', 'Deep femoral', 'Femoral'],
    'Femoral', 'The saphenofemoral junction connects these systems.', superficialVeins),
  poplitealArtery: question('Which opening marks the femoral-to-popliteal arterial transition?',
    ['Adductor hiatus', 'Saphenous opening', 'Obturator canal', 'Femoral ring'],
    'Adductor hiatus', 'The vessel continues behind the knee.', arteries),
  anteriorTibialArtery: question('Beyond the ankle, the anterior tibial artery becomes which artery?',
    ['Lateral plantar', 'Dorsalis pedis', 'Medial plantar', 'Fibular'],
    'Dorsalis pedis', 'This continuation reaches the dorsal foot.', arteries),
  posteriorTibialArtery: question('Which pair are terminal plantar branches of the posterior tibial artery?',
    ['Arcuate and fibular', 'Dorsalis pedis and arcuate', 'Medial and lateral plantar', 'Superior and inferior gluteal'],
    'Medial and lateral plantar', 'Both enter the sole.', arteries),
  poplitealVein: question('Proximally through the adductor hiatus, the popliteal vein continues as which vein?',
    ['Great saphenous', 'Small saphenous', 'Deep femoral', 'Femoral'],
    'Femoral', 'The normal deep venous route continues into the thigh.', calfVeins),
  smallSaphenous: question('Which deep vein commonly receives the small saphenous vein?',
    ['Popliteal', 'External iliac', 'Deep femoral', 'Anterior tibial'],
    'Popliteal', 'Its termination varies; this is the common connection, not a universal pattern.', deepVeins),
  dorsalisPedis: question('Which surface is the usual location of dorsalis pedis?',
    ['Plantar heel', 'Dorsal foot', 'Posterior calf', 'Medial thigh'],
    'Dorsal foot', 'It continues the anterior tibial artery.', arteries),
  lateralPlantar: question('The lateral plantar artery contributes to which arch?',
    ['Aortic', 'Dorsal venous', 'Plantar arterial', 'Palmar arterial'],
    'Plantar arterial', 'It joins the deep plantar arterial pathway.', arteries),
  superficialMedialPlantar: question('Which parent vessel gives the superficial medial plantar branch?',
    ['Lateral plantar', 'Dorsalis pedis', 'Arcuate', 'Medial plantar'],
    'Medial plantar', 'Cadaveric research distinguishes superficial and deep branches, with variation. This selection is not the complete parent artery.', plantarStudy),
  anteriorTibialVein: question('The anterior tibial veins belong to which deep venous region?',
    ['Calf', 'Thigh', 'Pelvis', 'Abdominal wall'],
    'Calf', 'Deep calf veins are commonly paired; a single source surface does not establish their number.', calfVeins),
  posteriorTibialVein: question('Which foot surface drains towards the posterior tibial veins?',
    ['Dorsal only', 'Plantar', 'Lateral border only', 'Toe nails only'],
    'Plantar', 'These veins pass behind the medial malleolus into the posterior calf.', venousUltrasound),
  deepFemoralVein: question('The deep femoral vein normally accompanies which artery?',
    ['Obturator', 'Inferior gluteal', 'Deep femoral', 'Anterior tibial'],
    'Deep femoral', 'The profunda venous route follows its arterial counterpart; tributaries and course can vary.', profundaStudy),
} as const;
export type LowerLimbVesselQuizGroup = keyof typeof lowerLimbVesselQuizQuestions;
