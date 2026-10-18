// Original normal-anatomy questions; references supply facts, not reused assets.
const table = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const hip = 'https://anatomy.ttuhscep.edu/schemes/gluteal_tables.html';
const movement = 'https://anatomy.ttuhscep.edu/modules/lower_limb_module/lower_limb_03.html';
const posterior = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal.html';
const anterior = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});
export const thighDeepMuscleQuizQuestions = {
  brevis: question('Which nerve has anterior and posterior divisions on opposite sides of adductor brevis?',
    ['Obturator', 'Femoral', 'Sciatic', 'Superior gluteal'], 'Obturator',
    'Its anterior and posterior divisions flank the muscle.', table),
  longus: question('Adductor longus contributes most directly to which hip movement?',
    ['Abduction', 'Adduction', 'Ankle eversion', 'Knee extension'], 'Adduction',
    'The thigh moves toward the midline.', movement),
  magnus: question('Which action distinguishes the hamstring portion of adductor magnus?',
    ['Knee extension', 'Ankle dorsiflexion', 'Hip extension', 'Toe flexion'], 'Hip extension',
    'The ischiocondylar portion has a hamstring-like role.', table),
  minimus: question('Adductor minimus is commonly described as part of which muscle?',
    ['Pectineus', 'Gracilis', 'Sartorius', 'Adductor magnus'], 'Adductor magnus',
    'The name identifies its uppermost fibres, not an extra compartment.', table),
  inferior: question('Which nerve supplies inferior gemellus?',
    ['Nerve to quadratus femoris', 'Femoral nerve', 'Superior gluteal nerve', 'Obturator nerve'], 'Nerve to quadratus femoris',
    'Inferior gemellus shares this supply with quadratus femoris.', hip),
  superior: question('Superior gemellus joins which tendon?',
    ['Piriformis', 'Obturator internus', 'Iliopsoas', 'Gluteus minimus'], 'Obturator internus',
    'It acts with the deep hip rotators.', hip),
  gracilis: question('At the hip, which movement does gracilis assist?',
    ['Abduction', 'Lateral rotation only', 'Adduction', 'Extension only'], 'Adduction',
    'Adduction brings the thigh medially.', movement),
  iliacus: question('The iliacus and psoas major share a tendon reaching which landmark?',
    ['Greater trochanter', 'Patella', 'Ischial spine', 'Lesser trochanter'], 'Lesser trochanter',
    'This is the iliopsoas attachment.', hip),
  externus: question('Where does the obturator externus tendon insert?',
    ['Trochanteric fossa', 'Tibial tuberosity', 'Adductor tubercle', 'Fibular head'], 'Trochanteric fossa',
    'Its tendon courses below the femoral neck.', table),
  internus: question('Which opening transmits the obturator internus tendon?',
    ['Obturator canal', 'Lesser sciatic foramen', 'Greater sciatic foramen', 'Femoral canal'], 'Lesser sciatic foramen',
    'Distinguish its turn out of the pelvis from piriformis.', hip),
  pectineus: question('Pectineus assists the adductor group in which movement?',
    ['Hip abduction', 'Knee extension', 'Hip adduction', 'Ankle inversion'], 'Hip adduction',
    'It assists the stronger hip adductors.', movement),
  piriformis: question('Piriformis exits the pelvis through which opening?',
    ['Femoral canal', 'Obturator canal', 'Lesser sciatic foramen', 'Greater sciatic foramen'], 'Greater sciatic foramen',
    'Its position helps organize gluteal neurovascular relationships.', hip),
  quadratus: question('Which muscle lies just superior to quadratus femoris in the deep gluteal region?',
    ['Inferior gemellus', 'Sartorius', 'Rectus femoris', 'Gracilis'], 'Inferior gemellus',
    'Use their relative levels when exploring the deep rotators.', posterior),
  sartorius: question('Sartorius reaches the medial tibia through which attachment?',
    ['Patellar ligament', 'Pes anserinus', 'Iliotibial tract', 'Achilles tendon'], 'Pes anserinus',
    'Follow the long oblique muscle across the anterior thigh.', anterior),
  tensor: question('Tensor fasciae latae inserts through which fascial structure?',
    ['Plantar aponeurosis', 'Patellar retinaculum', 'Iliotibial tract', 'Interosseous membrane'], 'Iliotibial tract',
    'Gluteus maximus also has an attachment to this tract.', posterior),
} as const;
export type ThighDeepMuscleQuizGroup = keyof typeof thighDeepMuscleQuizQuestions;
