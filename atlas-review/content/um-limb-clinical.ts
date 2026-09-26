// Original, brief teaching synthesis. References are linked, not republished;
// their images/text and licences are not imported into the CC0 mesh asset set.
import { hipThighClinicalLessons, hipThighClinicalReferences } from './um-hip-thigh-clinical';
import { calfFootClinicalLessons, calfFootClinicalReferences } from './um-calf-foot-clinical';
import { hipMuscleClinicalLessons, hipMuscleClinicalReferences } from './um-hip-muscle-clinical';
import { boneCartilageClinicalLessons, boneCartilageClinicalReferences } from './um-bone-cartilage-clinical';
export type SpecimenExtendedTopic = 'clinical' | 'pathology' | 'ct' | 'mri' | 'xray' | 'ultrasound';
export type SpecimenTopicDraft = { readiness: 'draft'; body: string; references: string[] };
export type SpecimenClinicalLesson = {
  modelLimit: string;
  topics: Partial<Record<SpecimenExtendedTopic, SpecimenTopicDraft>>;
  selfCheck: { question: string; answer: string; references: string[] };
};
const aaos = (slug: string) => `https://www.orthoinfo.org/diseases--conditions/${slug}/`;
export const specimenClinicalReferences = {
  ...boneCartilageClinicalReferences,
  ...hipMuscleClinicalReferences,
  ...calfFootClinicalReferences,
  ...hipThighClinicalReferences,
  acl: { title: 'AAOS · Anterior cruciate ligament injuries', url: aaos('anterior-cruciate-ligament-acl-injuries') },
  pcl: { title: 'AAOS · Posterior cruciate ligament injuries', url: aaos('posterior-cruciate-ligament-injuries') },
  collateral: { title: 'AAOS · Collateral ligament injuries', url: aaos('collateral-ligament-injuries') },
  meniscus: { title: 'AAOS · Meniscus tears', url: aaos('meniscus-tears') },
  quadriceps: { title: 'AAOS · Quadriceps tendon tear', url: aaos('quadriceps-tendon-tear') },
  patellar: { title: 'AAOS · Patellar tendon tear', url: aaos('patellar-tendon-tear') },
  achilles: { title: 'AAOS · Achilles tendon rupture', url: aaos('achilles-tendon-rupture-tear') },
  talus: { title: 'AAOS · Talus fractures', url: aaos('talus-fractures') },
  calcaneus: { title: 'AAOS · Calcaneus fractures', url: aaos('calcaneus-heel-bone-fractures') },
  kneeUS: { title: 'ESSR · Knee ultrasound technical guidelines', url: 'https://essr.org/content-essr/uploads/2016/10/knee.pdf' },
} as const;
type Reference = keyof typeof specimenClinicalReferences;
const urls = (...keys: Reference[]) => keys.map(k => specimenClinicalReferences[k].url);
const draft = (body: string, ...refs: Reference[]): SpecimenTopicDraft => ({ readiness: 'draft', body, references: urls(...refs) });
const quiz = (question: string, answer: string, ...refs: Reference[]) => ({ question, answer, references: urls(...refs) });
export const specimenClinicalLessons: Record<string, SpecimenClinicalLesson> = {
  ...boneCartilageClinicalLessons,
  ...hipMuscleClinicalLessons,
  ...calfFootClinicalLessons,
  ...hipThighClinicalLessons,
  acl: {
    modelLimit: 'One supplied ligament surface: bundles, attachment footprints and injury grades are not separately mapped. Separation is a teaching arrangement, not anterior instability.',
    topics: {
      clinical: draft('Pivoting or an awkward landing can produce a pop, swelling and giving way. Clinical assessment also considers menisci, cartilage and other ligaments; symptoms alone do not identify an isolated ACL injury.', 'acl'),
      pathology: draft('Injury ranges from stretching to partial or complete disruption. An attachment injury can pull off a bone fragment. Associated damage matters as well as the ACL tear itself.', 'acl'),
      mri: draft('MRI assesses the ACL and associated meniscal, cartilage and ligament injuries. It supports clinical assessment; it is not always necessary to establish the diagnosis.', 'acl'),
      xray: draft('Radiographs assess accompanying bone injury, including avulsion. They do not directly demonstrate an ACL tear.', 'acl'),
    },
    selfCheck: quiz('Does a normal radiograph establish that the ACL is intact?', 'No. Radiographs show bone rather than directly establishing ligament continuity.', 'acl'),
  },
  pcl: {
    modelLimit: 'The model has one PCL selection, not separate functional bundles or a simulated posterior-drawer examination. Source shape cannot establish ligament competence.',
    topics: {
      clinical: draft('A force against the front of a flexed knee, such as a dashboard impact, can injure the PCL. Assessment includes posterior laxity and possible accompanying injuries.', 'pcl'),
      pathology: draft('Partial tears and combined knee injuries occur. A tibial attachment may avulse with bone; ligament appearance alone does not establish functional stability.', 'pcl'),
      mri: draft('MRI depicts the PCL better than radiographs. Chronic injury may look deceptively normal, so imaging must be interpreted with history and examination.', 'pcl'),
      xray: draft('Look for an associated bony avulsion. Clinician-directed stress radiographs can assess posterior translation; the atlas does not reproduce this examination.', 'pcl'),
    },
    selfCheck: quiz('Why can apparently normal chronic imaging be insufficient?', 'PCL injury may be less conspicuous later; clinical posterior laxity still needs assessment.', 'pcl'),
  },
  mcl: {
    modelLimit: 'Superficial/deep MCL and meniscal attachments are not individually labelled here. Do not equate one displayed surface with the complete medial stabilizing complex.',
    topics: {
      clinical: draft('Valgus loading may cause medial pain, tenderness and instability. Examine for other knee injuries rather than assuming an isolated sprain.', 'collateral'),
      pathology: draft('A sprain can stretch, partly disrupt or completely tear the ligament; attachment avulsion is possible.', 'collateral'),
      mri: draft('MRI evaluates the ligament injury and other knee structures; grading also depends on clinical assessment.', 'collateral'),
      xray: draft('Radiographs may show attachment avulsion, not the ligament tear itself.', 'collateral'),
      ultrasound: draft('Follow the MCL along the medial joint line to its tibial attachment. Ultrasound can assess accessible fibres dynamically; this surface does not reproduce the layered examination.', 'kneeUS'),
    },
    selfCheck: quiz('Which side of the knee is assessed for an MCL injury?', 'The medial side; pain and instability still require assessment of accompanying injuries.', 'collateral'),
  },
  lcl: {
    modelLimit: 'This fibular collateral ligament is not the entire posterolateral corner. Additional stabilizers and nerve relationships are incomplete in this specimen.',
    topics: {
      clinical: draft('Varus loading can injure the lateral ligament, producing lateral tenderness or instability. Associated injuries affect the overall assessment.', 'collateral'),
      pathology: draft('Partial or complete disruption and bony attachment avulsion can occur. A visible ligament is not proof of mechanical competence.', 'collateral'),
      mri: draft('MRI assesses the LCL together with other ligaments, cartilage and menisci.', 'collateral'),
      xray: draft('Radiographs may reveal an avulsed fragment but do not directly show an LCL tear.', 'collateral'),
      ultrasound: draft('The fibular head helps identify the LCL course. Distinguish it from biceps femoris posteriorly and the deeper proximal popliteus tendon; the anatomy is not interchangeable.', 'kneeUS'),
    },
    selfCheck: quiz('Does an LCL view show all lateral stabilizers?', 'No. It is one ligament; the specimen does not supply a complete posterolateral-corner study.'),
  },
  'meniscus-group': {
    modelLimit: 'Medial and lateral menisci remain one source group. Horns, roots, tear zones and displaced fragments are not separate selections; a displayed gap must not be labelled as a tear.',
    topics: {
      clinical: draft('Joint-line pain, swelling and catching or locking can accompany a meniscal injury, but are not specific. Acute tears may coexist with ACL injury.', 'meniscus'),
      pathology: draft('Traumatic and degenerative tears differ in context. Radial, flap and displaced bucket-handle patterns are examples, not interchangeable labels for every symptomatic meniscus.', 'meniscus'),
      mri: draft('MRI is commonly used to evaluate acute meniscal tears and associated soft-tissue injury. Location and pattern require review of the real image series.', 'meniscus'),
      xray: draft('A meniscal tear is not directly visible on radiographs; bone and degenerative joint changes may offer alternative explanations for pain.', 'meniscus'),
      ct: draft('CT arthrography may be considered when MRI cannot be obtained. It uses joint contrast and is not equivalent to routine non-contrast CT.', 'meniscus'),
    },
    selfCheck: quiz('Can this grouped mesh locate a medial meniscal root tear?', 'No. It has no separately validated roots or tear mapping; patient imaging would need independent interpretation.'),
  },
  'quadriceps-tendon': {
    modelLimit: 'One tendon surface is supplied. Laminar contributions, retinacula and tear gaps are not segmented; moving the tendon away is not a rupture simulation.',
    topics: {
      clinical: draft('Pain and a gap above the patella with loss of active extension raise concern for extensor-mechanism disruption. A new traumatic loss of extension needs clinical assessment.', 'quadriceps'),
      pathology: draft('Tears may be partial, complete or detach from the patella. Existing tendon weakness can contribute; a complete tear interrupts force transmission to the patella.', 'quadriceps'),
      mri: draft('MRI can define tear location and extent when needed, including partial versus complete disruption or an alternative injury.', 'quadriceps'),
      xray: draft('A low-positioned patella on a lateral radiograph can accompany quadriceps tendon rupture. Interpret position with the examination, not from this mesh.', 'quadriceps'),
      ultrasound: draft('Inspect the tendon above the patella in longitudinal and transverse planes. Probe-angle effects can alter its appearance; the model has neither echotexture nor a simulated ultrasound beam.', 'kneeUS'),
    },
    selfCheck: quiz('Which patellar displacement may accompany a quadriceps tendon rupture?', 'Inferior displacement: the intact patellar tendon can pull the patella downward.', 'quadriceps'),
  },
  'patellar-ligament': {
    modelLimit: 'The source label is patellar ligament; clinical literature often calls it patellar tendon. No separate enthesis, tendon lamina or tear is mapped.',
    topics: {
      clinical: draft('A traumatic pop, infrapatellar gap and impaired active knee extension suggest extensor-mechanism injury. Clinical examination distinguishes this from other causes of pain or weakness.', 'patellar'),
      pathology: draft('Partial or complete disruption may occur, including avulsion at the patella. Tendinopathy and tendon rupture are different findings; neither is demonstrated by this source surface.', 'patellar'),
      mri: draft('MRI can show the site and amount of disrupted tendon, and help distinguish other injuries with similar symptoms.', 'patellar'),
      xray: draft('A high-positioned patella can accompany loss of distal tethering. Radiographic patellar height is not measured by this atlas.', 'patellar'),
      ultrasound: draft('Trace the tendon between patella and tibia in long and short axes. Include the tendon width: abnormalities need not lie in the midline.', 'kneeUS'),
    },
    selfCheck: quiz('Why may the patella move upward after complete distal tendon disruption?', 'The connection to the tibia is lost while the quadriceps can pull proximally.', 'patellar'),
  },
  'achilles-tendon': {
    modelLimit: 'This surface does not separately map gastrocnemius/soleus subtendons, perfusion zones or a tear gap. Separation is not dorsiflexion or a dynamic tendon test.',
    topics: {
      clinical: draft('Sudden posterior ankle pain or a pop with reduced push-off raises concern for rupture. Clinicians assess tendon continuity and the calf-squeeze response alongside the history.', 'achilles'),
      pathology: draft('Rupture may be partial or complete and occur within the tendon or at its calcaneal attachment. Tendon degeneration and traumatic disruption are not synonymous.', 'achilles'),
      mri: draft('MRI can assess tear extent and location and identify alternative soft-tissue causes of symptoms.', 'achilles'),
      xray: draft('Insertional avulsion may leave a small calcaneal fragment visible on radiographs. Absence of a fragment does not establish tendon continuity.', 'achilles'),
      ultrasound: draft('Ultrasound can show tendon continuity and changes with ankle movement in real time. This atlas is static source geometry, not a dynamic scan or tendon-gap measurement.', 'achilles'),
    },
    selfCheck: quiz('Does a normal bone radiograph exclude Achilles rupture?', 'No. A tendon can rupture without an avulsed bone fragment.', 'achilles'),
  },
  talus: {
    modelLimit: 'The talus is a whole source bone. No fracture lines, blood supply, cartilage injury or Hawkins classification are mapped or inferred.',
    topics: {
      clinical: draft('Severe ankle pain after high-energy trauma requires assessment of bone alignment, skin, circulation, sensation and associated injuries. A talar injury is not simply an ankle sprain.', 'talus'),
      pathology: draft('Fractures can involve the neck, body or processes. Displacement may compromise blood supply, with later osteonecrosis or post-traumatic arthritis; risk is not established from this model.', 'talus'),
      xray: draft('Radiographs show fracture and alignment. Persistent clinical concern may require further imaging even if the initial view is inconclusive.', 'talus'),
      ct: draft('CT resolves fracture lines and displacement in cross-section, helping characterize complex talar injury. Rotating this surface is not a CT reconstruction of a fracture.', 'talus'),
    },
    selfCheck: quiz('Why does blood supply matter in a displaced talar fracture?', 'Vascular disruption can lead to osteonecrosis and collapse despite fracture treatment.', 'talus'),
  },
  calcaneus: {
    modelLimit: 'A whole calcaneus is shown without fracture fragments, articular grading or a validated radiographic projection. Do not measure fracture angles from the free-rotation view.',
    topics: {
      clinical: draft('Axial loading after a fall may injure the heel and other sites, including the spine. Examination includes skin, circulation, sensation and associated trauma.', 'calcaneus'),
      pathology: draft('Fracture can widen or shorten the heel and disrupt the subtalar joint. Articular injury may lead to persistent pain, stiffness and post-traumatic arthritis.', 'calcaneus'),
      xray: draft('Radiographs demonstrate calcaneal fracture and displacement. Clinical findings and appropriate additional views remain important.', 'calcaneus'),
      ct: draft('CT helps define fragment displacement and joint involvement in this complex bone, complementing radiographs rather than replacing clinical assessment.', 'calcaneus'),
    },
    selfCheck: quiz('Which nearby joint often matters in a calcaneal fracture?', 'The subtalar joint: articular disruption can contribute to later pain and restricted movement.', 'calcaneus'),
  },
};
