// Brief original factual synthesis; linked references are not licensed assets.
// These concepts bind only to the explicitly selected independent UM surfaces.
import type { SpecimenClinicalLesson, SpecimenTopicDraft } from './um-limb-clinical';
export const hipThighClinicalReferences = {
  hipFracture: { title: 'AAOS · Hip fractures', url: 'https://www.orthoinfo.org/diseases--conditions/hip-fractures/' },
  hipOA: { title: 'AAOS · Hip osteoarthritis: plain-language summary', url: 'https://orthoinfo.aaos.org/globalassets/pdfs/hip-osteoarthritis-cpg_pls.pdf' },
  gluteal: { title: 'Cambridge University Hospitals · Gluteal tendinopathy', url: 'https://www.cuh.nhs.uk/patient-information/gluteal-tendinopathy/' },
  snapping: { title: 'AAOS · Snapping hip', url: 'https://www.orthoinfo.org/diseases--conditions/snapping-hip/' },
  hipStrain: { title: 'AAOS · Hip strains', url: 'https://www.orthoinfo.org/diseases--conditions/hip-strains/' },
  thighStrain: { title: 'AAOS · Muscle strains in the thigh', url: 'https://www.orthoinfo.org/diseases--conditions/muscle-strains-in-the-thigh' },
  hamstrings: { title: 'AAOS · Hamstring muscle injuries', url: 'https://www.orthoinfo.org/diseases--conditions/hamstring-muscle-injuries' },
  posteriorAnatomy: { title: 'Texas Tech · Hip and posterior thigh dissection anatomy', url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_ans.html' },
  hipUS: { title: 'ESSR · Hip ultrasound technical guidelines', url: 'https://essr.org/content-essr/uploads/2016/10/hip.pdf' },
} as const;
type Reference = keyof typeof hipThighClinicalReferences;
const urls = (...keys: Reference[]) => keys.map(k => hipThighClinicalReferences[k].url);
const draft = (body: string, ...refs: Reference[]): SpecimenTopicDraft => ({ readiness: 'draft', body, references: urls(...refs) });
const quiz = (question: string, answer: string, ...refs: Reference[]) => ({ question, answer, references: urls(...refs) });

export const hipThighClinicalLessons: Record<string, SpecimenClinicalLesson> = {
  femur: {
    modelLimit: 'The original whole femur is shown, not a fractured bone. Head, neck and trochanteric regions are not separate injury selections; source irregularities are not fractures or osteonecrosis.',
    topics: {
      clinical: draft('Hip pain and difficulty bearing weight after a fall warrant assessment for proximal femoral injury. Some incomplete fractures allow limited walking.', 'hipFracture'),
      pathology: draft('Femoral-neck and trochanteric fractures involve different regions. Displacement of a neck fracture can endanger femoral-head blood supply.', 'hipFracture'),
      xray: draft('Radiographs usually demonstrate hip fractures and alignment, but an inconclusive film does not resolve persistent clinical suspicion.', 'hipFracture'),
      ct: draft('CT adds cross-sectional detail about fracture configuration and displacement, and can help investigate a suspected fracture not evident on radiographs.', 'hipFracture'),
      mri: draft('MRI can reveal small or incomplete fractures missed on radiographs. Further imaging depends on the clinical question and preceding findings.', 'hipFracture'),
    },
    selfCheck: quiz('Does being able to take a few steps exclude a hip fracture?', 'No. An incomplete fracture may still permit limited weight bearing; clinical assessment remains necessary.', 'hipFracture'),
  },
  'femoral-head-cartilage': {
    modelLimit: 'Only the supplied femoral-head cartilage is selectable. Opposing acetabular cartilage, labrum and wear grades are absent; exploded spacing is not radiographic joint-space width.',
    topics: {
      clinical: draft('Hip osteoarthritis can cause groin pain and stiffness during movement. Symptoms and examination matter alongside imaging.', 'hipOA'),
      pathology: draft('Articular cartilage loss can progress with adjacent bone changes. Osteophytes and subchondral changes concern the joint, not simply a detached cartilage shell.', 'hipOA'),
      xray: draft('Cartilage loss is inferred from reduced joint space rather than directly outlined cartilage. Osteophytes, sclerosis and cyst-like changes may accompany it.', 'hipOA'),
    },
    selfCheck: quiz('Can increasing this cartilage separation reproduce osteoarthritis on an X-ray?', 'No. Separation is a viewing aid, not cartilage loss, a validated projection or a joint-space measurement.'),
  },
  'gluteus-medius': {
    modelLimit: 'This muscle surface does not separately map its tendon facets, tears or bursae. A group visibility change is not a Trendelenburg test or a simulated gait cycle.',
    topics: {
      clinical: draft('Pain over the outer hip with side-lying or single-leg loading can involve the gluteal tendons. Location alone does not identify one injured tendon.', 'gluteal'),
      pathology: draft('Greater trochanteric pain syndrome includes gluteal tendon disorders; it should not automatically be labelled isolated bursitis.', 'gluteal'),
      mri: draft('MRI may help assess gluteal tendons when clinically needed; imaging is not required for every clinical diagnosis of gluteal tendinopathy.', 'gluteal'),
      ultrasound: draft('Follow medius toward the greater trochanter in two planes; distinguish its more superficial muscle layer from the deeper minimus.', 'hipUS'),
    },
    selfCheck: quiz('Does lateral hip pain prove that the trochanteric bursa is the only affected tissue?', 'No. Gluteal tendon pathology can contribute; clinical assessment considers the surrounding tissues.', 'gluteal'),
  },
  'gluteus-minimus': {
    modelLimit: 'Minimus is independently selectable but its tendon and enthesis are not separate meshes. No labelled tear, perfusion map or clinical muscle-strength assessment is supplied.',
    topics: {
      clinical: draft('Minimus tendon symptoms may overlap those of medius and hip-joint disease. A painful lateral hip is not a structure-specific diagnosis.', 'gluteal'),
      pathology: draft('Gluteal tendinopathy and tendon tears may coexist with other hip pathology; the source surface cannot establish either condition.', 'gluteal'),
      mri: draft('MRI can support assessment of the deep gluteal tendons when symptoms and examination require further investigation.', 'gluteal'),
      ultrasound: draft('Minimus lies deep to medius; its tendon reaches the anterior greater-trochanteric facet. Do not swap these two tendon identities.', 'hipUS'),
    },
    selfCheck: quiz('Does selecting the minimus outline identify a separate tendon tear?', 'No. This selection has no separately validated tendon segmentation or patient injury mapping.'),
  },
  iliacus: {
    modelLimit: 'Iliacus is a separate source muscle, not a segmented iliopsoas tendon or bursa. Hip flexion, tendon excursion and the complete femoral neurovascular bundle are not simulated.',
    topics: {
      clinical: draft('Hip-flexor loading can cause anterior hip symptoms. Pain, weakness and restricted movement require assessment rather than an automatic iliacus diagnosis.', 'hipStrain'),
      pathology: draft('Hip strains may affect muscle, tendon or their junction, ranging from overstretching to disruption. They are not synonymous with bursitis.', 'hipStrain'),
      xray: draft('Radiographs may be normal in snapping hip; they mainly help assess bone or joint alternatives rather than show a moving iliacus tendon.', 'snapping'),
      ultrasound: draft('Use the iliac wing to orient iliacus and psoas, then follow the anterior iliopsoas complex; their muscle outlines are not interchangeable.', 'hipUS'),
    },
    selfCheck: quiz('Does moving iliacus away from psoas recreate an internal snapping hip?', 'No. Explode changes viewing positions; the model has no validated tendon movement or dynamic examination.'),
  },
  'psoas-major': {
    modelLimit: 'The psoas surface is not a lumbar-plexus, tendon-sheath or retroperitoneal disease model. Neither internal snapping nor nerve compression can be diagnosed from its shape.',
    topics: {
      clinical: draft('Anterior snapping may involve the iliopsoas tendon, but snapping can also arise outside or within the hip joint.', 'snapping'),
      pathology: draft('A moving tendon can be associated with bursal irritation. Labral or cartilage problems can also cause catching, so these mechanisms must not be conflated.', 'snapping'),
      xray: draft('A radiograph may help investigate bony alternatives but does not directly demonstrate the transient tendon movement causing a snap.', 'snapping'),
      ultrasound: draft('The iliopsoas tendon is deep within the anterior muscle complex; its bursa lies between tendon and anterior capsule, normally collapsed.', 'hipUS'),
    },
    selfCheck: quiz('Is every catch or click inside the hip caused by iliopsoas?', 'No. Tendons at other locations and intra-articular cartilage or labral problems can produce mechanical symptoms.', 'snapping'),
  },
  'adductor-longus': {
    modelLimit: 'The supplied muscle is not a complete pubic aponeurotic complex. Its tendon footprint, pubic symphysis injury and inguinal canal pathology are not independently mapped.',
    topics: {
      clinical: draft('Medial-thigh or groin symptoms after loading can involve the adductors. Examination must also consider other hip and groin structures.', 'hipStrain'),
      pathology: draft('Acute strain and repetitive overload can affect the muscle-tendon unit. Athletic pubalgia involves a broader lower-abdominal or groin soft-tissue problem.', 'hipStrain'),
      mri: draft('MRI can evaluate the affected thigh muscles and tendons when further characterization is needed; pain alone does not specify the injured tissue.', 'thighStrain'),
      xray: draft('Bone imaging may identify an attachment avulsion or another bony cause. It does not directly grade an adductor muscle tear.', 'hipStrain'),
      ultrasound: draft('Adductor longus occupies the superficial medial-thigh layer beside gracilis; brevis and magnus are deeper. Trace toward the pubic attachment.', 'hipUS'),
    },
    selfCheck: quiz('Does an adductor-longus selection represent the complete sports-hernia region?', 'No. The source does not separately map the pubic aponeuroses or inguinal structures; those require their own anatomical and clinical assessment.'),
  },
  'rectus-femoris': {
    modelLimit: 'The muscle surface does not separately segment direct/reflected tendons or central aponeurosis. This adult specimen cannot show an adolescent growth-plate avulsion.',
    topics: {
      clinical: draft('Acute anterior-thigh pain during rapid activity can reflect muscle injury. Examine the hip, knee and extensor apparatus rather than localising by pain alone.', 'thighStrain'),
      pathology: draft('Muscle injury may involve the belly or muscle-tendon junction. Partial disruption and complete tendon detachment are different injuries.', 'thighStrain'),
      mri: draft('MRI can characterize muscle and tendon injury when needed, including whether a suspected strain involves a more substantial tendon lesion.', 'thighStrain'),
      xray: draft('Radiographs assess suspected bone injury; an unremarkable film does not establish that the rectus muscle-tendon unit is intact.', 'thighStrain'),
      ultrasound: draft('The direct proximal tendon relates to the anterior inferior iliac spine; deeper central aponeurotic anatomy differs from the superficial tendon contribution.', 'hipUS'),
    },
    selfCheck: quiz('Can this single muscle surface show which proximal rectus tendon has torn?', 'No. Its tendon components are not separate validated selections; imaging and clinical review would be needed.'),
  },
  semimembranosus: {
    modelLimit: 'One muscle surface is supplied, without separate tendon expansions, tear margins or measured retraction. Its medial distal anatomy should not be replaced with a biceps-femoris label.',
    topics: {
      clinical: draft('Localise this medial hamstring separately from lateral biceps femoris. Their distal attachments differ even though both contribute to knee flexion.', 'posteriorAnatomy'),
      pathology: draft('Hamstring injury can affect muscle or tendon; severe proximal injury may detach tendon from the ischial origin.', 'hamstrings'),
      mri: draft('MRI helps characterize hamstring soft-tissue injury and its severity; the atlas itself has no tear map.', 'hamstrings'),
      xray: draft('Radiographs can demonstrate a bony avulsion but do not directly establish hamstring soft-tissue continuity.', 'hamstrings'),
      ultrasound: draft('The ischial tuberosity orients the proximal hamstrings. Closely adjacent tendon origins may be difficult to separate; avoid assigning an unverified individual footprint.', 'hipUS'),
    },
    selfCheck: quiz('Does an apparent gap created by dissection demonstrate tendon retraction?', 'No. It is a reversible viewing arrangement, not measured traumatic displacement or a patient finding.'),
  },
  semitendinosus: {
    modelLimit: 'Semitendinosus remains distinct from semimembranosus. The pes anserinus and proximal shared tendon are not separately segmented or a complete graft-harvest simulation.',
    topics: {
      clinical: draft('Its long distal tendon reaches the medial tibia through the pes anserinus. Do not confuse this with semimembranosus insertion.', 'posteriorAnatomy'),
      pathology: draft('Overload can injure hamstring muscle or tendon; severe avulsion is different from a mild muscle strain.', 'hamstrings'),
      mri: draft('MRI can assess the extent of a hamstring injury rather than infer severity from visible bruising alone.', 'hamstrings'),
      xray: draft('A tendon avulsion may pull off bone visible on a radiograph; an absent fragment does not prove tendon integrity.', 'hamstrings'),
    },
    selfCheck: quiz('Does semitendinosus share the lateral fibular attachment of biceps femoris?', 'No. Semitendinosus reaches the medial tibia through the pes anserinus, whereas biceps femoris attaches laterally.', 'posteriorAnatomy'),
  },
  'biceps-femoris-long-head': {
    modelLimit: 'Long and short heads are separate source selections. Their shared distal tendon and a proximal tear footprint are not separate assets; the neighbouring sciatic course is incomplete.',
    topics: {
      clinical: draft('Sprinting or sudden hamstring loading can cause posterior-thigh pain. Assess whether symptoms suggest muscle injury or a more proximal tendon avulsion.', 'hamstrings'),
      pathology: draft('A severe proximal hamstring injury can detach tendon from bone. This differs from a limited muscle-belly strain.', 'hamstrings'),
      mri: draft('MRI helps define hamstring injury severity and the affected soft tissues.', 'hamstrings'),
      xray: draft('An avulsed bony fragment may be visible; radiographs alone cannot exclude an isolated tendon tear.', 'hamstrings'),
    },
    selfCheck: quiz('Do both biceps heads arise from the ischial tuberosity?', 'No. The long head arises from the ischium; the short head starts on the femur and does not cross the hip.', 'posteriorAnatomy'),
  },
  'biceps-femoris-short-head': {
    modelLimit: 'This is the independently labelled short head, not a shortened or torn long head. Its intramuscular nerves and distal tendon slips are not individually segmented.',
    topics: {
      clinical: draft('The short head acts across the knee, not the hip. Its femoral origin must not be described as a proximal ischial hamstring attachment.', 'posteriorAnatomy'),
      pathology: draft('A thigh muscle strain can involve muscle or tendon. Neither displayed fragmentation nor dissection spacing establishes a tear or injury grade.', 'thighStrain'),
      mri: draft('MRI can evaluate thigh muscle-tendon injury; identifying the affected head matters before calling a lesion a proximal hamstring avulsion.', 'thighStrain'),
    },
    selfCheck: quiz('Can an isolated short-head origin injury be an ischial avulsion?', 'No. Its origin is femoral, not ischial; the two biceps heads must retain distinct identities.', 'posteriorAnatomy'),
  },
};
