import type { ReasoningConcept } from './reasoning-questions';

const deltoid = { title: 'Loyola University: deltoid attachments and actions', url: 'https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/delt.htm' };
const thumb = { title: 'Texas Tech: upper-limb muscle relationships', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html' };
const hip = { title: 'UAMS: lower-limb muscle relationships', url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-lower-limb/' };
const gluteal = { title: 'Loyola University: deep gluteal relationships', url: 'https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/labs/le/glut_post_th/g3.html' };
const pair = (right: string, left: string, file: string) => [
  { fma: right, side: 'right' as const, file },
  { fma: left, side: 'left' as const, file: file + 'M' },
];
type Draft = Omit<ReasoningConcept, 'readiness' | 'revision'>;

// Original draft questions about existing selections, not new meshes or a
// publisher question bank. Named parts and ordered regional scope stay exact.
export const limbRelationshipsReasoningConcepts: readonly ReasoningConcept[] = ([
  {
    key: 'limb-deltoid-clavicular', region: 'shoulder-arm',
    bindings: pair('FMA34680', 'FMA34681', 'FJ1468'),
    prompt: 'Which deltoid part begins on the lateral clavicle and contributes to shoulder flexion and internal rotation?',
    explanation: 'The clavicular part is the anterior portion. Its contribution differs from the posterior portion, which assists extension and external rotation; the model does not simulate those movements.',
    distractors: ['limb-deltoid-acromial', 'limb-deltoid-spinal', 'supraspinatus'], references: [deltoid],
  },
  {
    key: 'limb-deltoid-acromial', region: 'shoulder-arm',
    bindings: pair('FMA34682', 'FMA34683', 'FJ1467'),
    prompt: 'Which deltoid part links the acromion to the humeral deltoid tuberosity?',
    explanation: 'The acromial part forms the middle portion of deltoid. The neighbouring clavicular and spinal parts share the distal attachment but arise from different shoulder-girdle sites.',
    distractors: ['limb-deltoid-clavicular', 'limb-deltoid-spinal', 'supraspinatus'], references: [deltoid],
  },
  {
    key: 'limb-deltoid-spinal', region: 'shoulder-arm',
    bindings: pair('FMA34684', 'FMA34685', 'FJ1513'),
    prompt: 'Which deltoid part arises from the scapular spine and assists shoulder extension and external rotation?',
    explanation: 'The spinal part is the posterior portion of deltoid. Here spinal refers to the scapular spine, not a vertebral attachment.',
    distractors: ['limb-deltoid-clavicular', 'limb-deltoid-acromial', 'infraspinatus'], references: [deltoid],
  },
  {
    key: 'limb-abductor-pollicis-longus', region: 'forearm',
    bindings: pair('FMA38516', 'FMA38517', 'FJ1484'),
    prompt: 'Which long thumb muscle reaches the first metacarpal rather than either thumb phalanx?',
    explanation: 'Abductor pollicis longus reaches the metacarpal base and contributes to carpometacarpal abduction. The two thumb extensors shown instead reach phalanges.',
    distractors: ['limb-extensor-pollicis-brevis', 'limb-extensor-pollicis-longus', 'flexor-pollicis-longus'], references: [thumb],
  },
  {
    key: 'limb-extensor-pollicis-brevis', region: 'forearm',
    bindings: pair('FMA38519', 'FMA38520', 'FJ1494'),
    prompt: 'Which forearm thumb extensor ends on the proximal phalanx rather than the distal phalanx?',
    explanation: 'Extensor pollicis brevis reaches the proximal phalanx and assists metacarpophalangeal extension. Extensor pollicis longus continues to the distal phalanx.',
    distractors: ['limb-extensor-pollicis-longus', 'limb-abductor-pollicis-longus', 'flexor-pollicis-longus'], references: [thumb],
  },
  {
    key: 'limb-extensor-pollicis-longus', region: 'forearm',
    bindings: pair('FMA38522', 'FMA38523', 'FJ1495'),
    prompt: 'Which thumb extensor turns around the dorsal radial tubercle before reaching the distal phalanx?',
    explanation: 'Extensor pollicis longus follows this route and extends the interphalangeal joint. Flexor pollicis longus shares a distal-phalanx endpoint but bends that joint instead.',
    distractors: ['limb-extensor-pollicis-brevis', 'limb-abductor-pollicis-longus', 'flexor-pollicis-longus'], references: [thumb],
  },
  {
    key: 'limb-iliacus', region: 'thigh', sourceRegions: ['thigh', 'pelvis'],
    bindings: pair('FMA22322', 'FMA22323', 'FJ1422'),
    prompt: 'Which hip flexor passes from the iliac fossa towards the lesser trochanter with psoas major?',
    explanation: 'Iliacus joins the iliopsoas attachment. It is not a short posterior hip rotator, despite sharing the same regional viewer.',
    distractors: ['limb-piriformis', 'limb-obturator-internus', 'limb-quadratus-femoris'], references: [hip],
  },
  {
    key: 'limb-piriformis', region: 'thigh', sourceRegions: ['thigh', 'pelvis'],
    bindings: pair('FMA22340', 'FMA22341', 'FJ1428'),
    prompt: 'Which muscle travels from the anterior sacrum through the greater sciatic foramen towards the greater trochanter?',
    explanation: 'Piriformis uses this route. Obturator internus exits through the lesser sciatic foramen instead; the question does not establish an individual sciatic-nerve course.',
    distractors: ['limb-obturator-internus', 'limb-gemellus-superior', 'limb-quadratus-femoris'], references: [hip],
  },
  {
    key: 'limb-obturator-internus', region: 'thigh', sourceRegions: ['thigh', 'pelvis'],
    bindings: pair('FMA22324', 'FMA22325', 'FJ1426'),
    prompt: 'Which muscle sends its tendon through the lesser sciatic foramen, with the gemelli bordering it in the gluteal region?',
    explanation: 'Obturator internus follows this turning route towards the greater trochanter. The gemelli flank its tendon; they are distinct muscle selections, not subdivisions of this target.',
    distractors: ['limb-piriformis', 'limb-gemellus-superior', 'limb-gemellus-inferior'], references: [gluteal],
  },
  {
    key: 'limb-quadratus-femoris', region: 'thigh', sourceRegions: ['thigh', 'pelvis'],
    bindings: pair('FMA22338', 'FMA22339', 'FJ1432'),
    prompt: 'Which short hip rotator lies below the obturator-internus/gemelli complex and posterior to obturator externus?',
    explanation: 'Quadratus femoris occupies this inferior relationship. The other displayed rotators belong to the more superior complex; this is reference anatomy, not a patient-specific surgical plane.',
    distractors: ['limb-obturator-internus', 'limb-gemellus-superior', 'limb-gemellus-inferior'], references: [gluteal],
  },
  {
    key: 'limb-gemellus-superior', region: 'thigh', sourceRegions: ['thigh', 'pelvis'],
    bindings: pair('FMA22334', 'FMA22335', 'FJ1417'),
    prompt: 'Which gemellus starts on the ischial spine and joins the obturator internus tendon?',
    explanation: 'Superior gemellus has the ischial-spine attachment. Inferior gemellus instead begins on the ischial tuberosity.',
    distractors: ['limb-gemellus-inferior', 'limb-obturator-internus', 'limb-quadratus-femoris'], references: [hip],
  },
  {
    key: 'limb-gemellus-inferior', region: 'thigh', sourceRegions: ['thigh', 'pelvis'],
    bindings: pair('FMA22336', 'FMA22337', 'FJ1416'),
    prompt: 'Which muscle starts on the ischial tuberosity and reaches the femur through the obturator internus tendon?',
    explanation: 'Inferior gemellus joins that common tendon. Quadratus femoris also has an ischial-tuberosity origin, but has its own direct femoral attachment.',
    distractors: ['limb-gemellus-superior', 'limb-quadratus-femoris', 'limb-obturator-internus'], references: [hip],
  },
] satisfies Draft[]).map(c => ({ ...c, readiness: 'draft', revision: 1 }));
