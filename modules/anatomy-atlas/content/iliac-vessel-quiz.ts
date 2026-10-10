// Original formative wording about usual anatomy, not validation of source surfaces.
const arteries = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_pelvis_perineum.html';
const abdominalVeins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html';
const pelvicVeins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_pelvis_perineum.html';
const ucsf = 'https://orthosurgery.ucsf.edu/igot/ucsf-ortho-anatomy-core';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const iliacVesselQuizQuestions = {
  commonIliacArtery: question('Which pair are the usual terminal branches of a common iliac artery?',
    ['Internal and external iliac arteries', 'Femoral and obturator arteries', 'Superior and inferior gluteal arteries', 'Renal and gonadal arteries'],
    'Internal and external iliac arteries', 'A common iliac artery divides into internal and external iliac branches.', arteries),
  externalIliacArtery: question('Beyond the inguinal ligament, the external iliac artery continues under which name?',
    ['Popliteal artery', 'Femoral artery', 'Obturator artery', 'Internal iliac artery'],
    'Femoral artery', 'The name changes to femoral artery at the inguinal ligament.', arteries),
  internalIliacArtery: question('Which region receives branches from the internal iliac artery?',
    ['Forearm', 'Scalp', 'Pelvic viscera', 'Coronary circulation'],
    'Pelvic viscera', 'Its branches supply pelvic organs as well as other nearby regions.', arteries),
  commonIliacVein: question('The right and left common iliac veins unite to form which vessel?',
    ['Portal vein', 'Superior vena cava', 'Azygos vein', 'Inferior vena cava'],
    'Inferior vena cava', 'The paired common iliac veins join to begin the inferior vena cava.', abdominalVeins),
  externalIliacVein: question('Which vein continues as the external iliac vein above the inguinal ligament?',
    ['Femoral vein', 'Internal iliac vein', 'Great saphenous vein', 'Inferior vena cava'],
    'Femoral vein', 'The femoral and external iliac names meet at the inguinal ligament.', ucsf),
  internalIliacVein: question('Veins from which organ drain toward the internal iliac vein through a pelvic plexus?',
    ['Lung', 'Urinary bladder', 'Spleen', 'Thyroid'],
    'Urinary bladder', 'The vesical venous plexus drains toward internal iliac venous tributaries.', pelvicVeins),
} as const;
export type IliacVesselQuizGroup = keyof typeof iliacVesselQuizQuestions;
