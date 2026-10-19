// Reuse our original factual prose, never another specimen's identities or scope.
// Reference articles, tables and images are linked, not imported or relicensed.
import { legClinicalGroups } from '../lib/leg-clinical-curriculum';
import { footClinicalGroups } from '../lib/foot-clinical-curriculum';
import type { SpecimenClinicalLesson, SpecimenTopicDraft } from './um-limb-clinical';

export const calfFootClinicalReferences = {
  ankleUS: { title: 'ESSR · Ankle ultrasound technical guidelines', url: 'https://essr.org/content-essr/uploads/2016/10/ankle.pdf' },
  tibialisAnteriorMRI: { title: 'Lee et al. · Tibialis anterior tendon and extensor retinaculum MRI (2006)', url: 'https://pubmed.ncbi.nlm.nih.gov/16861505/' },
  lowerLegAnatomy: { title: 'NCBI · Posterior leg compartment anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537340/' },
  anteriorLegAnatomy: { title: 'NCBI · Anterior leg compartment anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539725/' },
  footDrop: { title: 'NCBI · Foot drop: differential assessment', url: 'https://www.ncbi.nlm.nih.gov/books/NBK554393/' },
  peronealTendons: { title: 'NCBI · Peroneal tendon syndromes', url: 'https://www.ncbi.nlm.nih.gov/books/NBK544354/' },
  peronealImaging: { title: 'Melville et al. · Ultrasound/MRI and operative peroneal findings (2024)', url: 'https://pubmed.ncbi.nlm.nih.gov/38337434/' },
  fhlInjury: { title: 'Sammarco & Cooper · FHL injury in dancers and nondancers (1998)', url: 'https://pubmed.ncbi.nlm.nih.gov/9677077/' },
  popliteusInjury: { title: 'Morrissey & Knapik · Isolated popliteus injury review (2022)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8894959/' },
  soleusImaging: { title: 'Balius et al. · Soleus injury: ultrasound detection (2014)', url: 'https://pubmed.ncbi.nlm.nih.gov/24627005/' },
  calfInjury: { title: 'Delgado et al. · Tennis leg: ultrasound differential (2002)', url: 'https://pubmed.ncbi.nlm.nih.gov/12091669/' },
  gastrocnemiusAnatomy: { title: 'NCBI · Gastrocnemius anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459362/' },
  archCollapse: { title: 'AAOS · Progressive collapsing foot deformity', url: 'https://www.orthoinfo.org/diseases--conditions/posterior-tibial-tendon-dysfunction' },
  footAnatomy: { title: 'NCBI · Foot muscle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539705/' },
  plantarNerves: { title: 'NCBI · Tarsal tunnel syndrome', url: 'https://www.ncbi.nlm.nih.gov/books/NBK513273/' },
  lowerLimbTable: { title: 'Texas Tech · Lower-limb muscle anatomy', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html' },
  hammerToe: { title: 'AAOS · Hammer toe', url: 'https://www.orthoinfo.org/diseases--conditions/hammer-toe' },
  baxterEvidence: { title: 'Chen et al. · ADM fatty infiltration/Baxter neuropathy evidence review (2025)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12367558/' },
} as const;
type Reference = keyof typeof calfFootClinicalReferences;
const urls = (...refs: Reference[]) => refs.map(r => calfFootClinicalReferences[r].url);
const draft = (body: string, ...refs: Reference[]): SpecimenTopicDraft => ({ readiness: 'draft', body, references: urls(...refs) });
const quiz = (question: string, answer: string, ...refs: Reference[]) => ({ question, answer, references: urls(...refs) });
function reuse(region: 'leg' | 'foot', key: string, clinicalRef: Reference, pathologyRef = clinicalRef) {
  const group = (region === 'leg' ? legClinicalGroups : footClinicalGroups).find(g => g.key === key);
  if (!group) throw new Error(`Missing authored calf/foot concept: ${region}/${key}`);
  return { clinical: draft(group.clinical.body, clinicalRef), pathology: draft(group.pathology.body, pathologyRef) };
}

export const calfFootClinicalLessons: Record<string, SpecimenClinicalLesson> = {
  'extensor-digitorum-longus': {
    modelLimit: 'One supplied muscle surface, not separately validated distal tendon slips or a nerve territory. Its reference shape cannot show weakness, compartment pressure or a tendon tear.',
    topics: {
      ...reuse('leg', 'extensor-digitorum-longus', 'footDrop', 'anteriorLegAnatomy'),
      ultrasound: draft('Trace EDL across the anterior ankle, distinguishing it from EHL. Follow the tendon course rather than identifying one cross-section; this specimen does not validate individual distal slips.', 'ankleUS'),
    },
    selfCheck: quiz('Does weak lesser-toe extension identify one torn tendon?', 'No. Compare ankle movement and the wider neurological pattern; this selection does not isolate individual tendon slips.', 'footDrop'),
  },
  'extensor-hallucis-longus': {
    modelLimit: 'The long hallux extensor is supplied as one surface. No tear, root lesion or separate distal attachment footprint is segmented; selecting it does not test L5 function.',
    topics: {
      ...reuse('leg', 'extensor-hallucis-longus', 'footDrop'),
      ultrasound: draft('Identify EHL among the anterior ankle tendons and follow its course, separating it from tibialis anterior and EDL. The static surface cannot establish tendon continuity in a patient.', 'ankleUS'),
    },
    selfCheck: quiz('Can this selection establish an L5 root lesion?', 'No. It identifies a reference muscle, not the cause or distribution of weakness in a patient.'),
  },
  'peroneus-longus': {
    modelLimit: 'The source calls this peroneus longus (fibularis longus). Brevis, retinacula, os peroneum and tendon-sheath disease are not separate validated selections; separation is not tendon subluxation.',
    topics: {
      ...reuse('leg', 'fibularis-longus', 'lowerLimbTable', 'peronealTendons'),
      mri: draft('MRI can assess the peroneal tendons and surrounding tissues for tears or inflammation. Findings must distinguish longus from brevis rather than assigning all lateral pain to longus.', 'peronealTendons'),
      ultrasound: draft('Dynamic ultrasound can examine peroneal tendon movement and instability. Evidence from a selected surgical cohort does not establish universal accuracy; this static mesh cannot reproduce a dynamic examination.', 'peronealImaging'),
    },
    selfCheck: quiz('Does separation of this surface demonstrate peroneal tendon instability?', 'No. Explode mode only changes presentation; it contains no validated retinaculum, tendon tracking or dynamic scan.'),
  },
  'flexor-digitorum-longus': {
    modelLimit: 'A supplied long-flexor surface is not four independently assessed distal tendon slips. The foot display does not validate individual pulley systems or tendon continuity.',
    topics: {
      ...reuse('leg', 'flexor-digitorum-longus', 'lowerLegAnatomy'),
      ultrasound: draft('Find FDL beside tibialis posterior behind the medial malleolus, then trace it distally. Distinguish adjacent vessels and nerve; this muscle selection is not a complete tarsal-tunnel examination.', 'ankleUS'),
    },
    selfCheck: quiz('Does FDL stop at the middle phalanges like the short flexor?', 'No. Its distal attachments reach the distal phalanges of toes 2–5; the short flexor reaches the middle phalanges.', 'lowerLimbTable'),
  },
  'flexor-hallucis-longus': {
    modelLimit: 'The reference surface does not segment tenosynovitis, impingement, a tear or its sheath. Historical surgical-series findings are not prevalence estimates or a treatment pathway.',
    topics: {
      ...reuse('leg', 'flexor-hallucis-longus', 'fhlInjury'),
      ultrasound: draft('Identify FHL between the posterior talar tubercles; great-toe movement helps confirm the tendon. Follow its course beneath the sustentaculum tali. Exploding this static surface does not reproduce tendon motion.', 'ankleUS'),
    },
    selfCheck: quiz('Is FHL tendon disease restricted to dancers?', 'No. It has also been reported in nondancers; a selected clinical series cannot establish its population prevalence.', 'fhlInjury'),
  },
  popliteus: {
    modelLimit: 'One muscle surface does not represent the complete posterolateral corner, popliteomeniscal fascicles or a separately graded tendon injury. The source does not simulate knee instability.',
    topics: {
      ...reuse('leg', 'popliteus', 'popliteusInjury'),
      mri: draft('Review popliteus alongside the wider posterolateral knee structures on MRI. An isolated injury is different from a combined injury; small athletic series do not define a universal recovery timeline.', 'popliteusInjury'),
    },
    selfCheck: quiz('Does hiding popliteus isolate the complete posterolateral corner?', 'No. This display does not separately include every ligament, fascicle or stabilising structure of that region.'),
  },
  soleus: {
    modelLimit: 'The supplied soleus has no segmented intramuscular aponeuroses, strain grades or pressure compartments. Its separation from gastrocnemius is neither a tear nor a surgical decompression.',
    topics: {
      ...reuse('leg', 'soleus', 'lowerLegAnatomy', 'calfInjury'),
      mri: draft('MRI can localise soleus injury when a deeper lesion is not adequately shown by ultrasound. The referenced study used MRI as its comparison standard, not this atlas surface.', 'soleusImaging'),
      ultrasound: draft('A negative ultrasound does not reliably exclude a soleus injury. Deeper lesions were missed in the referenced clinical series; image quality, lesion location and the clinical question matter.', 'soleusImaging'),
    },
    selfCheck: quiz('Does a normal ultrasound necessarily exclude a deeper soleus strain?', 'No. Ultrasound missed lesions in the referenced series; clinical assessment determines whether further investigation is needed.', 'soleusImaging'),
  },
  'tibialis-anterior': {
    modelLimit: 'This muscle reference is not a torn tendon or a mapped neurological lesion. It contains no motor testing, gait simulation or measured compartment pressure.',
    topics: {
      ...reuse('leg', 'tibialis-anterior', 'footDrop'),
      mri: draft('Assess the tibialis anterior tendon together with its extensor-retinacular relationship. A small cadaver/patient study correlated standard and oblique-coronal MRI with this anatomy; its tear patterns are not universal diagnostic rules. The specimen does not separately segment those retinacular tunnels or patient injury.', 'tibialisAnteriorMRI'),
      ultrasound: draft('Follow tibialis anterior from its muscle-tendon junction across the anterior ankle towards its medial insertion. Inspect beyond a single transverse view; the specimen does not provide ultrasound images.', 'ankleUS'),
    },
    selfCheck: quiz('Is foot drop a diagnosis of tibialis-anterior tendon rupture?', 'No. It describes impaired dorsiflexion with several possible muscular, tendon and neurological causes.', 'footDrop'),
  },
  'tibialis-posterior': {
    modelLimit: 'The muscle surface does not separately resolve every insertion slip or the ligament support of the arch. Reference bone spacing is not a weight-bearing deformity measurement.',
    topics: {
      ...reuse('leg', 'tibialis-posterior', 'archCollapse'),
      mri: draft('MRI may assess posterior tibial tendon and associated ligament abnormalities when needed. Progressive arch collapse is not necessarily an isolated muscle lesion.', 'archCollapse'),
      xray: draft('Standing radiographs assess alignment and joint changes under load. They do not directly show tendon continuity; rotating or exploding this model is not a weight-bearing radiograph.', 'archCollapse'),
      ultrasound: draft('Trace tibialis posterior behind the medial malleolus towards its insertion, distinguishing adjacent FDL. Examine the navicular insertion region separately; this specimen does not resolve every distal tendon slip.', 'ankleUS'),
    },
    selfCheck: quiz('Can exploded arch spacing grade progressive collapsing foot deformity?', 'No. Display spacing is not a calibrated standing alignment study and the full ligament apparatus is absent.'),
  },
  'gastrocnemius-medial': {
    modelLimit: 'Only the supplied medial head is selected. No strain, fluid collection or venous clot is rendered; source defects are not diagnostic findings and this is not a vascular scan.',
    topics: {
      ...reuse('leg', 'gastrocnemius', 'gastrocnemiusAnatomy', 'calfInjury'),
      ultrasound: draft('Ultrasound can assess medial gastrocnemius injury and adjacent fluid. Calf pain also has non-muscular causes, including venous thrombosis; a muscle view alone does not exclude them.', 'calfInjury'),
    },
    selfCheck: quiz('Does selecting this muscle exclude a vascular cause of calf pain?', 'No. The model is not a patient examination and does not evaluate veins or blood flow.'),
  },
  'gastrocnemius-lateral': {
    modelLimit: 'Only the supplied lateral head is selected. Shared calf/Achilles context does not make a medial-head tennis-leg lesion a lateral-head diagnosis; no pathological head or tendon is modelled.',
    topics: {
      clinical: draft('The two gastrocnemius heads contribute to plantar flexion through the shared Achilles apparatus and also cross the knee. Interpret this lateral-head selection within that shared anatomy.', 'gastrocnemiusAnatomy'),
      pathology: draft('An injured gastrocnemius muscle and a ruptured Achilles tendon are different lesions. A lateral-head reference surface does not establish which tissue accounts for calf pain.', 'calfInjury'),
    },
    selfCheck: quiz('Is this lateral-head selection also a separate Achilles tendon selection?', 'No. The reference head and supplied Achilles tendon retain distinct identities despite their shared functional apparatus.'),
  },
  'abductor-hallucis': {
    modelLimit: 'The supplied medial intrinsic muscle does not establish tarsal-tunnel boundaries or a compressed nerve. Neither denervation nor a patient-specific arch deformity is rendered.',
    topics: reuse('foot', 'abductor-hallucis', 'footAnatomy', 'plantarNerves'),
    selfCheck: quiz('Does this muscle selection localise a tarsal-tunnel lesion?', 'No. No nerve-compression site is mapped; the selection identifies the source muscle only.'),
  },
  'abductor-digiti-minimi': {
    modelLimit: 'This is the foot muscle, not the hand muscle. It does not show fatty infiltration, a nerve lesion or a clinically verified Baxter entrapment site.',
    topics: {
      ...reuse('foot', 'abductor-digiti-minimi', 'baxterEvidence'),
      mri: draft('Fatty infiltration of this muscle is not an established stand-alone diagnosis of Baxter neuropathy. The 2025 systematic review found insufficient robust evidence for that association.', 'baxterEvidence'),
    },
    selfCheck: quiz('Does fatty infiltration on MRI alone establish Baxter neuropathy?', 'No. The cited review found the proposed association uncertain; symptoms and the wider clinical evidence still matter.', 'baxterEvidence'),
  },
  'flexor-digitorum-brevis': {
    modelLimit: 'This supplied short-flexor surface does not separately grade digital tendon slips, toe deformities or passive joint flexibility. Grouped bones are not validated digit-specific lesion labels.',
    topics: reuse('foot', 'flexor-digitorum-brevis', 'lowerLimbTable', 'hammerToe'),
    selfCheck: quiz('Can this grouped muscle prove that one digital tendon is ruptured?', 'No. It is a reference surface with no separately validated pathological tendon slips.'),
  },
  'quadratus-plantae': {
    modelLimit: 'The supplied muscle is not separated into two validated head selections or individual FDL attachment slips. No lateral plantar nerve path or denervation pattern is modelled.',
    topics: reuse('foot', 'quadratus-plantae', 'footAnatomy', 'plantarNerves'),
    selfCheck: quiz('Does quadratus plantae attach directly to a toe phalanx?', 'No. Its contribution is through the long-flexor tendon apparatus, not a direct phalangeal insertion.', 'footAnatomy'),
  },
  'extensor-digitorum-brevis': {
    modelLimit: 'The source provides one EDB surface. A separately validated extensor hallucis brevis and individual tendon slips are absent; do not transfer a different specimen\'s hallux-brevis identity here.',
    topics: {
      clinical: draft('This dorsal intrinsic extensor receives deep fibular motor supply, unlike plantar intrinsic muscles. Interpret toe movement alongside the long extensors rather than as an isolated EDB test.', 'lowerLimbTable'),
      pathology: draft('Deep fibular motor dysfunction can affect the short dorsal extensor. The reference surface cannot establish the cause, severity or level of a neurological lesion.', 'footAnatomy'),
    },
    selfCheck: quiz('Does this source contain a separate selectable extensor hallucis brevis?', 'No. Only the supplied EDB identity is bound here; an absent separate structure must not be inferred from another specimen.'),
  },
};
