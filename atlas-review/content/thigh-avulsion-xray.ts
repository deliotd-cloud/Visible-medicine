// Independently authored teaching. References are factual reading, not media licences.
const pelvicRadiographs = 'https://pubmed.ncbi.nlm.nih.gov/11357449/';
const rectusMri = 'https://pubmed.ncbi.nlm.nih.gov/16738911/';
const lesserTrochanter = 'https://pubmed.ncbi.nlm.nih.gov/34306849/';
const iliopsoasCadavers = 'https://pubmed.ncbi.nlm.nih.gov/34347120/';
const hamstringFootprints = 'https://pubmed.ncbi.nlm.nih.gov/24859732/';
const hamstringVariation = 'https://pubmed.ncbi.nlm.nih.gov/22669443/';

export const thighAvulsionXrayTeaching = {
  rectus: {
    landmark: 'Anterior inferior iliac spine',
    body: 'The anterior inferior iliac spine (AIIS) is an indirect bony attachment landmark for the direct head of rectus femoris. A radiograph can show an ossified avulsion fragment in this region; it does not outline the selected individual muscle or establish a tendon tear.',
    anatomy: 'Keep the direct-head AIIS attachment distinct from the reflected/indirect origin. An AIIS fragment is not proof that only one head is injured, or that the rest of rectus femoris is intact. The cited MRI injury series assessed the heads separately; a coloured whole-muscle surface does not reproduce that assessment.',
    limits: 'Use the AIIS to orient the proximal attachment region, not to label the entire quadriceps on a plain film. Do not transfer a reference-model footprint to a patient radiograph or infer tendon continuity from a normal bony outline.',
    citations: [pelvicRadiographs, rectusMri],
  },
  iliacus: {
    landmark: 'Lesser trochanter',
    body: 'The lesser trochanter is an indirect bony attachment landmark for the iliopsoas complex. An ossified avulsion there can be a radiographic clue to attachment-region injury; it does not outline the selected individual iliacus muscle or establish its tendon tear.',
    anatomy: 'Iliacus and psoas major contribute to this shared iliopsoas insertion region. Cadaveric work describes variable tendon arrangements and muscular iliacus attachments; the lesser-trochanter fragment cannot identify isolated iliacus rather than psoas involvement.',
    limits: 'The cited avulsion series concerns adolescent athletes. Neither its injury mechanism nor a reference-model attachment establishes the cause of a lesser-trochanter abnormality in an adult. A normal bony outline does not establish individual muscle or tendon integrity.',
    citations: [lesserTrochanter, iliopsoasCadavers],
  },
  semimembranosus: {
    landmark: 'Ischial tuberosity',
    body: 'The ischial tuberosity is an indirect bony attachment landmark for the proximal hamstrings, including semimembranosus. A radiograph can show an ossified avulsion in this region; it does not outline the selected individual muscle or establish a tendon tear.',
    anatomy: 'Adult cadaveric studies describe a semimembranosus attachment beside the semitendinosus and long-head biceps femoris origins. This supports regional orientation, not a patient-specific footprint or a claim that one fragment identifies semimembranosus alone.',
    limits: 'An ischial fragment cannot distinguish which proximal hamstring is involved or establish how many tendons are injured. Retain the distinction between a bony attachment clue and direct soft-tissue assessment.',
    citations: [pelvicRadiographs, hamstringFootprints, hamstringVariation],
  },
  semitendinosus: {
    landmark: 'Ischial tuberosity',
    body: 'The ischial tuberosity is an indirect bony attachment landmark for the proximal hamstrings, including semitendinosus. A radiograph can show an ossified avulsion in this region; it does not outline the selected individual muscle or establish a tendon tear.',
    anatomy: 'Some adult dissections describe a conjoined semitendinosus–long-head biceps origin; others describe closely adjoining, nearly independent origins. Do not turn those specimen descriptions into an invariant footprint or infer a particular torn tendon from one ischial fragment.',
    limits: 'An ischial fragment cannot isolate semitendinosus from neighbouring hamstrings, establish tendon continuity or measure the selected muscle boundary. The surface model is an orientation aid, not a substitute for soft-tissue assessment.',
    citations: [pelvicRadiographs, hamstringFootprints, hamstringVariation],
  },
  bicepsLong: {
    landmark: 'Ischial tuberosity',
    body: 'The ischial tuberosity is an indirect bony attachment landmark for the long head of biceps femoris among the proximal hamstrings. A radiograph can show an ossified avulsion in this region; it does not outline the selected individual muscle or establish a tendon tear.',
    anatomy: 'The selected structure is the long head, not the separate short head. Adult dissections describe a conjoined or closely adjoining relationship with semitendinosus, beside semimembranosus. These descriptions do not make an ischial fragment specific to long-head biceps injury.',
    limits: 'An ischial fragment cannot distinguish which proximal hamstring is involved or establish the condition of the separate short head. Do not treat the selected model surface as a measured tendon footprint or patient-specific injury map.',
    citations: [pelvicRadiographs, hamstringFootprints, hamstringVariation],
  },
} as const;

export const thighAvulsionXrayLimits = {
  cohort: 'The radiographic avulsion evidence comes from selected adolescent athletic injury cohorts, not normal muscle-visibility studies or a population survey. Do not extrapolate their frequencies or mechanisms to adults, or infer that a normal film excludes a soft-tissue injury.',
  comparison: 'Compare the assembled model with an independently verified study only when available. Rotation and explode views do not simulate X-ray attenuation, detector geometry or patient registration. No acquired image, treatment threshold or management protocol is supplied.',
  note: 'Anatomy/radiology review pending for this exact source and teaching revision. No acquired image or imaging study is loaded; no patient registration or diagnostic decision is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
} as const;
