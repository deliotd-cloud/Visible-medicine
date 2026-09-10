import { thighMuscleLessons } from '../lib/thigh-curriculum';
import { legMuscleLessons } from '../lib/leg-curriculum';
import { footMuscleLessons } from '../lib/foot-curriculum';

export type SpecimenLesson = {
  anatomy: string; function: string; references: readonly string[];
  attachments?: { proximal: string; distal: string; motor: string };
};
const bones = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb';
const joints = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/9-6-anatomy-of-selected-synovial-joints';
const knee = 'https://www.ncbi.nlm.nih.gov/books/NBK500017/';
const leg = 'https://www.ncbi.nlm.nih.gov/books/NBK537024/';
const foot = 'https://www.ncbi.nlm.nih.gov/books/NBK539705/';
const source = 'https://researchdata.um.edu.my/dataset.xhtml?persistentId=doi:10.22452/RD/5T6TZ7';
const note = (anatomy: string, action: string, ...references: string[]): SpecimenLesson => ({ anatomy, function: action, references });

// Explicit concept choices, NOT an FMA crosswalk or name-based fallback. Reuse
// our original general teaching facts, excluding all other-subject model notes,
// FMA identities and clinical/scan entitlements. Binding pins live separately.
const muscleBindings: Array<[string, 'thigh' | 'leg' | 'foot', string]> = [
  ['adductor-brevis', 'thigh', 'adductor-brevis'], ['adductor-longus', 'thigh', 'adductor-longus'],
  ['adductor-magnus', 'thigh', 'adductor-magnus'], ['gracilis', 'thigh', 'gracilis'],
  ['inferior-gemellus', 'thigh', 'gemellus-inferior'], ['superior-gemellus', 'thigh', 'gemellus-superior'],
  ['gluteus-maximus', 'thigh', 'gluteus-maximus'], ['gluteus-medius', 'thigh', 'gluteus-medius'],
  ['gluteus-minimus', 'thigh', 'gluteus-minimus'], ['iliacus', 'thigh', 'iliacus'],
  ['obturator-externus', 'thigh', 'obturator-externus'], ['obturator-internus', 'thigh', 'obturator-internus'],
  ['pectineus', 'thigh', 'pectineus'], ['piriformis', 'thigh', 'piriformis'], ['psoas-major', 'thigh', 'psoas-major'],
  ['quadratus-femoris', 'thigh', 'quadratus-femoris'], ['sartorius', 'thigh', 'sartorius'],
  ['semimembranosus', 'thigh', 'semimembranosus'], ['semitendinosus', 'thigh', 'semitendinosus'],
  ['tensor-fasciae-latae', 'thigh', 'tensor-fasciae-latae'], ['rectus-femoris', 'thigh', 'rectus-femoris'],
  ['vastus-lateralis', 'thigh', 'vastus-lateralis'], ['vastus-medialis', 'thigh', 'vastus-medialis'],
  ['vastus-intermedius', 'thigh', 'vastus-intermedius'],
  ['biceps-femoris-long-head', 'thigh', 'biceps-femoris-long-head'], ['biceps-femoris-short-head', 'thigh', 'biceps-femoris-short-head'],
  ['extensor-digitorum-longus', 'leg', 'extensor-digitorum-longus'], ['extensor-hallucis-longus', 'leg', 'extensor-hallucis-longus'],
  ['peroneus-longus', 'leg', 'fibularis-longus'], ['flexor-digitorum-longus', 'leg', 'flexor-digitorum-longus'],
  ['flexor-hallucis-longus', 'leg', 'flexor-hallucis-longus'], ['popliteus', 'leg', 'popliteus'], ['soleus', 'leg', 'soleus'],
  ['tibialis-anterior', 'leg', 'tibialis-anterior'], ['tibialis-posterior', 'leg', 'tibialis-posterior'],
  ['gastrocnemius-medial', 'leg', 'gastrocnemius-medial-head'], ['gastrocnemius-lateral', 'leg', 'gastrocnemius-lateral-head'],
  ['abductor-hallucis', 'foot', 'abductor-hallucis'], ['abductor-digiti-minimi', 'foot', 'abductor-digiti-minimi'],
  ['quadratus-plantae', 'foot', 'quadratus-plantae'], ['flexor-digitorum-brevis', 'foot', 'flexor-digitorum-brevis'],
];
const libraries = { thigh: thighMuscleLessons, leg: legMuscleLessons, foot: footMuscleLessons };
export const specimenLessons: Record<string, SpecimenLesson> = Object.fromEntries(muscleBindings.map(([slug, library, key]) => {
  const lesson = libraries[library].find((l) => l.key === key);
  if (!lesson) throw new Error(`Missing authored muscle concept: ${library}/${key}`);
  return [slug, { anatomy: 'Typical attachments are described below. Their footprints, tendon subdivisions and motor territories are not mapped on this specimen.',
    function: lesson.action, attachments: { proximal: lesson.origin, distal: lesson.insertion, motor: lesson.motorSupply },
    references: [...lesson.references] }];
}));
Object.assign(specimenLessons, {
  'extensor-digitorum-brevis': {
    anatomy: 'A short dorsal-foot muscle. This source does not separately identify an extensor hallucis brevis component.',
    function: 'Assists extension of toes 2–4.',
    attachments: { proximal: 'Dorsolateral calcaneus and adjacent retinacular tissues.', distal: 'Long-extensor expansions for toes 2–4.', motor: 'Deep fibular nerve.' }, references: [foot],
  },
  femur: note('Thigh bone spanning the hip and knee.', 'Transfers load and provides a lever for limb movement.', bones),
  tibia: note('Medial leg bone; its distal end forms the medial malleolus.', 'Carries load from knee to ankle.', leg),
  fibula: note('Lateral leg bone; its distal end forms the lateral malleolus.', 'Provides muscle attachments and lateral ankle stability.', leg),
  patella: note('Sesamoid bone within the knee extensor apparatus.', 'Improves quadriceps leverage at the knee.', knee),
  'pelvis-group': note('One source-labelled pelvic group, not individually identified pelvic bones.', 'Provides the proximal bony context for these limb surfaces. Individual articulations require review.', source),
  talus: note('Tarsal bone between the ankle mortise and calcaneus.', 'Transfers leg load into the foot.', bones),
  calcaneus: note('Heel bone beneath the talus.', 'Receives calcaneal-tendon force.', bones),
  navicular: note('Medial tarsal bone between talus and cuneiforms.', 'Contributes to the medial arch.', bones),
  cuboid: note('Lateral tarsal bone in front of calcaneus.', 'Supports the lateral foot column.', bones),
  'medial-cuneiform': note('Medial wedge-shaped tarsal, behind metatarsal 1.', 'Contributes to midfoot support.', bones),
  'intermediate-cuneiform': note('Middle wedge-shaped tarsal, behind metatarsal 2.', 'Contributes to midfoot support.', bones),
  'lateral-cuneiform': note('Lateral wedge-shaped tarsal, behind metatarsal 3.', 'Contributes to midfoot support.', bones),
  'foot-bone-group': note('Upstream Phalanges entry remains one grouped surface. Individual component identities are unresolved.', 'Use it as grouped foot context; no digit numbering or individual-bone function is assigned.', source),
  acl: note('Cruciate ligament connecting anterior tibial intercondylar region to lateral femoral condyle.', 'Restrains anterior tibial translation relative to femur.', knee),
  pcl: note('Cruciate ligament connecting posterior tibial intercondylar region to medial femoral condyle.', 'Restrains posterior tibial translation relative to femur.', knee),
  mcl: note('Medial knee ligament between femur and tibia.', 'Helps resist valgus opening.', knee),
  lcl: note('Lateral knee ligament between femur and fibular head.', 'Helps resist varus opening.', knee),
  'patellar-ligament': note('Connects patella to tibial tuberosity.', 'Transmits extensor force to the tibia.', knee),
  'quadriceps-tendon': note('Shared quadriceps attachment to the patella.', 'Conveys quadriceps force into the extensor apparatus.', knee),
  'achilles-tendon': note('Calcaneal tendon shared principally by gastrocnemius and soleus.', 'Transmits plantarflexion force to the calcaneus.', foot),
  'meniscus-group': note('Grouped source menisci; medial and lateral parts are not separately selectable.', 'Menisci distribute knee loads and improve joint congruity.', joints),
  'femoral-cartilage': note('Supplied distal femoral articular-cartilage surface.', 'Supports low-friction contact at knee articulations.', joints),
  'tibial-cartilage': note('Grouped tibial articular-cartilage surface, separate from the menisci.', 'Supports low-friction femorotibial contact.', joints),
  'patellar-cartilage': note('Cartilage covering the patellar articular surface.', 'Supports low-friction patellofemoral contact.', joints),
  'femoral-head-cartilage': note('Supplied femoral-head cartilage; opposing acetabular cartilage is not included.', 'Supports low-friction hip articulation.', joints),
} satisfies Record<string, SpecimenLesson>);
