// Explicit reuse of our original prose only; no foreign identities or scope notes.
import { thighClinicalGroups } from '../lib/thigh-clinical-curriculum';
import type { SpecimenClinicalLesson, SpecimenTopicDraft } from './um-limb-clinical';

export const hipMuscleClinicalReferences = {
  adductorStrain: { title: 'NCBI · Adductor strain', url: 'https://www.ncbi.nlm.nih.gov/books/NBK493166/' },
  magnusAnatomy: { title: 'NCBI · Adductor magnus anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK534842/' },
  pesBursitis: { title: 'AAOS · Pes anserine bursitis', url: 'https://www.orthoinfo.org/diseases--conditions/pes-anserine-knee-tendon-bursitis' },
  deepGluteal: { title: 'Park et al. · Deep gluteal syndrome review (2020)', url: 'https://pubmed.ncbi.nlm.nih.gov/32349600/' },
  gemelliAnatomy: { title: 'NCBI · Gemelli muscle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557420/' },
  externusInjury: { title: 'Rhim et al. · Obturator externus injury: three-player series (2022)', url: 'https://pubmed.ncbi.nlm.nih.gov/36143822/' },
  maximusAnatomy: { title: 'NCBI · Gluteus maximus anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538193/' },
  ischiofemoralMRI: { title: 'Özdemir et al. · Ischiofemoral MRI findings in asymptomatic volunteers (2015)', url: 'https://pubmed.ncbi.nlm.nih.gov/25680726/' },
  quadricepsAnatomy: { title: 'NCBI · Quadriceps muscle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK513334/' },
  // Same URLs as existing lessons: aggregate citation limits apply across modules.
  hipMuscleTable: { title: 'Texas Tech · Lower-limb muscle anatomy', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html' },
  hipMuscleSnapping: { title: 'AAOS · Snapping hip', url: 'https://www.orthoinfo.org/diseases--conditions/snapping-hip/' },
  hipMuscleUS: { title: 'ESSR · Hip ultrasound technical guidelines', url: 'https://essr.org/content-essr/uploads/2016/10/hip.pdf' },
  hipMuscleKneeUS: { title: 'ESSR · Knee ultrasound technical guidelines', url: 'https://essr.org/content-essr/uploads/2016/10/knee.pdf' },
  hipMuscleQuadricepsTear: { title: 'AAOS · Quadriceps tendon tear', url: 'https://www.orthoinfo.org/diseases--conditions/quadriceps-tendon-tear/' },
} as const;
type Reference = keyof typeof hipMuscleClinicalReferences;
const urls = (...refs: Reference[]) => refs.map(r => hipMuscleClinicalReferences[r].url);
const draft = (body: string, ...refs: Reference[]): SpecimenTopicDraft => ({ readiness: 'draft', body, references: urls(...refs) });
const quiz = (question: string, answer: string, ...refs: Reference[]) => ({ question, answer, references: urls(...refs) });
function reuse(key: string, clinicalRef: Reference, pathologyRef = clinicalRef) {
  const group = thighClinicalGroups.find(g => g.key === key);
  if (!group) throw new Error(`Missing authored hip muscle concept: ${key}`);
  return { clinical: draft(group.clinical.body, clinicalRef), pathology: draft(group.pathology.body, pathologyRef) };
}

export const hipMuscleClinicalLessons: Record<string, SpecimenClinicalLesson> = {
  'adductor-brevis': {
    modelLimit: 'This is the supplied brevis, not adductor longus or the entire groin. No attachment avulsion, tendon tear or pubic aponeurotic complex is segmented.',
    topics: {
      ...reuse('adductors', 'adductorStrain'),
      mri: draft('MRI can localise an adductor injury and its extent. Identify the actual muscle involved; longus predominance does not establish a brevis tear.', 'adductorStrain'),
    },
    selfCheck: quiz('Does pain on adduction identify brevis rather than longus?', 'No. Adductor-related symptoms do not isolate one muscle or exclude other groin conditions.', 'adductorStrain'),
  },
  'adductor-magnus': {
    modelLimit: 'One supplied magnus surface does not separately grade its adductor and hamstring portions or map a complete adductor hiatus. No separate minimus identity is inferred.',
    topics: {
      ...reuse('magnus-minimus', 'magnusAnatomy', 'adductorStrain'),
      mri: draft('Localise signal change or disruption within the injured portion on MRI; a large reference surface does not imply whole-muscle damage.', 'adductorStrain'),
    },
    selfCheck: quiz('Is the whole of adductor magnus an isolated obturator-nerve test?', 'No. Its adductor and hamstring portions have different typical motor contributions; the muscle is supplied by obturator and tibial/sciatic pathways.', 'magnusAnatomy'),
  },
  gracilis: {
    modelLimit: 'The supplied muscle does not separately resolve pes tendon slips or the anserine bursa. Moving it away from the knee cannot demonstrate bursitis or tendon integrity.',
    topics: {
      ...reuse('gracilis', 'pesBursitis', 'adductorStrain'),
      ultrasound: draft('At the tibial pes insertion, closely apposed tendons can be difficult to separate; trace the complex proximally.', 'hipMuscleKneeUS'),
    },
    selfCheck: quiz('Does pes anserine bursitis prove that gracilis is torn?', 'No. The adjacent bursa can be painful without a demonstrated tear in the gracilis tendon.', 'pesBursitis'),
  },
  pectineus: {
    modelLimit: 'This reference muscle does not map a femoral or obturator nerve branch. Typical teaching is not confirmation of this donor\'s variable innervation or a pain generator.',
    topics: reuse('pectineus', 'hipMuscleTable', 'adductorStrain'),
    selfCheck: quiz('Do all medial-thigh adductors share only obturator supply?', 'No. Pectineus usually receives femoral supply, sometimes with additional obturator contribution; the donor\'s precise branches are not mapped.', 'hipMuscleTable'),
  },
  'superior-gemellus': {
    modelLimit: 'The supplied superior gemellus is separate from the inferior gemellus. No sciatic entrapment site, nerve variant or muscle-specific provocative test is demonstrated.',
    topics: reuse('gemelli-obturator-internus', 'deepGluteal'),
    selfCheck: quiz('Which named nerve typically supplies superior gemellus?', 'The nerve to obturator internus. This conventional relationship is not a reconstruction of the source donor\'s nerve branches.', 'gemelliAnatomy'),
  },
  'inferior-gemellus': {
    modelLimit: 'The inferior gemellus remains its own source selection, not an extension of the superior gemellus. A displayed gap is not a nerve-compression site or surgical release.',
    topics: reuse('gemelli-obturator-internus', 'deepGluteal'),
    selfCheck: quiz('Does inferior gemellus have the same usual named supply as superior gemellus?', 'No. Inferior gemellus conventionally receives the nerve to quadratus femoris; superior gemellus receives the nerve to obturator internus.', 'gemelliAnatomy'),
  },
  'obturator-internus': {
    modelLimit: 'One supplied muscle does not separately resolve its reflected tendon, associated bursa or every gemellar connection. No nerve path is added and internus is not externus.',
    topics: reuse('gemelli-obturator-internus', 'deepGluteal'),
    selfCheck: quiz('Does the word obturator mean internus and externus share one nerve?', 'No. Internus receives its named nerve; externus receives the obturator nerve. Similar names do not establish identical motor supply.', 'hipMuscleTable'),
  },
  'obturator-externus': {
    modelLimit: 'The reference surface does not show an injury grade, footprint lesion or a return-to-sport prognosis. A three-player report cannot establish general prevalence or recovery time.',
    topics: {
      ...reuse('obturator-externus', 'externusInjury'),
      mri: draft('MRI identified externus injuries in the cited small football-player series when symptoms overlapped with other groin injuries. The atlas is not a diagnostic scan or a recovery predictor.', 'externusInjury'),
    },
    selfCheck: quiz('Can a three-player injury series determine every patient\'s recovery time?', 'No. It demonstrates a reported injury pattern, not a universal prognosis or treatment protocol.', 'externusInjury'),
  },
  'gluteus-maximus': {
    modelLimit: 'This supplied muscle has no denervation pattern, pressure lesion or patient-specific weakness. Its disappearance in dissection mode does not simulate inferior gluteal neuropathy.',
    topics: reuse('gluteus-maximus', 'maximusAnatomy'),
    selfCheck: quiz('Which named gluteal nerve is most directly associated with maximus motor supply?', 'The inferior gluteal nerve. Weak hip extension still requires a broader assessment rather than diagnosis from one muscle selection.', 'maximusAnatomy'),
  },
  piriformis: {
    modelLimit: 'The piriformis surface cannot establish a through-muscle sciatic variant, entrapment or the diagnostic performance of a provocative test. No missing sciatic nerve is fabricated.',
    topics: {
      ...reuse('piriformis', 'deepGluteal'),
      mri: draft('Pelvic MRI may help investigate deep gluteal causes after considering spinal disease. A piriformis selection does not prove nerve entrapment.', 'deepGluteal'),
    },
    selfCheck: quiz('Does the atlas demonstrate sciatic entrapment within this piriformis?', 'No. It shows the source muscle, not a mapped sciatic variant, compression site or patient-specific lesion.'),
  },
  'quadratus-femoris': {
    modelLimit: 'Neither the ischiofemoral space nor quadratus femoris signal is clinically measured here. Display separation changes spacing without simulating impingement or decompression.',
    topics: {
      ...reuse('quadratus-femoris', 'ischiofemoralMRI'),
      mri: draft('Ischiofemoral asymmetry, fatty change and oedema were observed in some asymptomatic volunteers. MRI findings and spacing alone do not establish symptomatic impingement.', 'ischiofemoralMRI'),
    },
    selfCheck: quiz('Does ischiofemoral asymmetry on MRI necessarily explain hip pain?', 'No. Asymmetry and some signal changes occur without symptoms; correlate findings with the clinical assessment and imaging position.', 'ischiofemoralMRI'),
  },
  sartorius: {
    modelLimit: 'One source muscle does not separately segment the anserine bursa or individual pes insertion footprints. The model cannot assess passive flexibility or reproduce medial-knee pain.',
    topics: {
      ...reuse('sartorius', 'pesBursitis'),
      ultrasound: draft('Posteromedial knee ultrasound distinguishes sartorius muscle from nearby gracilis and semitendinosus tendons before their closely apposed insertion.', 'hipMuscleKneeUS'),
    },
    selfCheck: quiz('Does sharing the pes insertion make sartorius a hamstring?', 'No. Sartorius is a femoral-supplied anterior-thigh muscle; sharing an insertion does not make these muscles anatomically identical.', 'hipMuscleTable'),
  },
  'tensor-fasciae-latae': {
    modelLimit: 'The source muscle does not include a separately validated iliotibial tract or bursa. It is not connected to the tibia by a newly invented direct tendon; no snapping motion is simulated.',
    topics: {
      ...reuse('tfl', 'hipMuscleSnapping'),
      ultrasound: draft('Lateral hip ultrasound places the fascia lata superficial to gluteal tissues and the greater trochanter. This muscle-only selection cannot depict fascial snapping.', 'hipMuscleUS'),
    },
    selfCheck: quiz('Does external hip snapping mean TFL itself has torn?', 'No. Snapping can involve the iliotibial tract and may be painless; a snap alone does not establish a muscle tear.', 'hipMuscleSnapping'),
  },
  'vastus-intermedius': {
    modelLimit: 'The deep vastus remains a whole muscle surface without separate intramuscular laminae or tendon-layer injury grades. Rectus femoris is a different selectable muscle above it.',
    topics: {
      clinical: draft('Assess extension through the complete quadriceps apparatus; selecting this deep muscle does not isolate its force contribution.', 'quadricepsAnatomy'),
      pathology: reuse('vasti', 'hipMuscleQuadricepsTear').pathology,
      ultrasound: draft('The conventional deep quadriceps-tendon layer relates to intermedius; a muscle surface does not resolve tendon-layer tears.', 'hipMuscleKneeUS'),
    },
    selfCheck: quiz('Does vastus intermedius cross the hip like rectus femoris?', 'No. The vasti arise from the femur and act across the knee; rectus femoris also crosses the hip.', 'quadricepsAnatomy'),
  },
  'vastus-lateralis': {
    modelLimit: 'One lateral vastus surface does not include a separately resolved lateral retinaculum or injury to the shared tendon. Dissection movement is not patellar tracking.',
    topics: {
      clinical: draft('Vastus lateralis contributes to knee extension with the other quadriceps muscles. Weakness alone does not isolate a lateral-vastus lesion.', 'quadricepsAnatomy'),
      pathology: reuse('vasti', 'hipMuscleQuadricepsTear').pathology,
      ultrasound: draft('Lateralis contributes to the conventional intermediate quadriceps-tendon layer with medialis; ultrasound assessment follows the shared apparatus.', 'hipMuscleKneeUS'),
    },
    selfCheck: quiz('Can this muscle-only selection establish continuity of the whole quadriceps tendon?', 'No. It is a source muscle surface, not an examination of the separately supplied tendon or all of its layers.'),
  },
  'vastus-medialis': {
    modelLimit: 'No separately validated VMO/VML subdivision, medial retinaculum or maltracking mechanism is supplied. A whole-muscle label must not be promoted to a fibre-specific treatment target.',
    topics: {
      clinical: draft('Assess medialis within the extensor mechanism. This whole-muscle selection cannot quantify isolated fibre recruitment or establish patellar tracking.', 'quadricepsAnatomy'),
      pathology: reuse('vasti', 'hipMuscleQuadricepsTear').pathology,
      ultrasound: draft('Medialis joins lateralis in the conventional intermediate tendon layer; this whole muscle does not identify isolated VMO pathology.', 'hipMuscleKneeUS'),
    },
    selfCheck: quiz('Does the atlas contain a separately validated VMO selection?', 'No. It retains the supplied whole vastus medialis surface, without an inferred fibre-specific compartment.'),
  },
};
