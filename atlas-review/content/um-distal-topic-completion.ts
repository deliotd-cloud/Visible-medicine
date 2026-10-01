// Original draft teaching for missing imaging topics on exact UM limb selections.
// Reading links are external; no scan, diagnostic finding or source geometry is imported.
import type { SpecimenExtendedTopic, SpecimenTopicDraft } from './um-limb-clinical';
import { limbModalityReferences } from './um-limb-modality-references';

type ImagingTopic = Extract<SpecimenExtendedTopic, 'ct' | 'mri' | 'xray' | 'ultrasound'>;
export const umDistalModalityReferences = {
  kneeTrauma: { title: 'ACR · Acute Trauma to the Knee', url: 'https://acsearch.acr.org/docs/69419/narrative/' },
  hipUltrasound: { title: 'ACR/RSNA · Hip Ultrasound', url: 'https://www.radiologyinfo.org/en/info/us-hip' },
  kneePain: { title: 'ACR · Chronic Knee Pain', url: 'https://acsearch.acr.org/docs/69432/Narrative/' },
  ankleTrauma: { title: 'ACR · Acute Trauma to the Ankle', url: 'https://acsearch.acr.org/docs/69436/Narrative/' },
  footTrauma: { title: 'ACR · Acute Trauma to the Foot', url: 'https://acsearch.acr.org/docs/70546/Narrative/' },
  chronicFoot: { title: 'ACR · Chronic Foot Pain', url: 'https://acsearch.acr.org/docs/69424/Narrative' },
  chronicAnkle: { title: 'ACR · Chronic Ankle Pain', url: 'https://acsearch.acr.org/docs/69422/Narrative/' },
  intrinsicImaging: { title: 'Intrinsic foot muscle ultrasound and MRI agreement study', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8842549/' },
  abductorUltrasound: { title: 'Weight-bearing intrinsic foot ultrasound study', url: 'https://pubmed.ncbi.nlm.nih.gov/30583193/' },
  intrinsicUltrasound: { title: 'Intrinsic foot muscle ultrasonography study', url: 'https://pubmed.ncbi.nlm.nih.gov/34846008/' },
  calfMRI: { title: 'Calf muscle injury MRI study', url: 'https://pubmed.ncbi.nlm.nih.gov/17483942/' },
  calfUltrasound: { title: 'Triceps surae MRI and ultrasound measurement study', url: 'https://pubmed.ncbi.nlm.nih.gov/32532123/' },
  anteriorMRI: { title: 'Lower-leg extensor muscle MRI volumetry study', url: 'https://pubmed.ncbi.nlm.nih.gov/12439580/' },
  flexorMRI: { title: 'FHL and FDL tendon interconnections on MRI study', url: 'https://pubmed.ncbi.nlm.nih.gov/37225891/' },
  mskUltrasoundPractice: { title: 'AIUM/ACR/SRU · Musculoskeletal ultrasound practice parameter', url: 'https://www.aium.org/docs/default-source/practice-guideline/AIUM-Practice-Guideline-for-the-Performance-of-a-Musculoskeletal-Ultrasound-Examination.pdf' },
  stressFracture: { title: 'ACR · Stress (Fatigue/Insufficiency) Fracture', url: 'https://acsearch.acr.org/docs/69435/narrative/' },
  anteriorLeg: { title: 'NCBI · Anterior leg compartment anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539725/' },
  posteriorLeg: { title: 'NCBI · Posterior leg compartment anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537340/' },
  gastrocnemius: { title: 'NCBI · Gastrocnemius anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459362/' },
  gastrocnemiusMuscle: { title: 'NCBI · Gastrocnemius muscle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK532946/' },
  medialArch: { title: 'NCBI · Medial longitudinal arch anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK562289/' },
  footMuscles: { title: 'NCBI · Foot muscle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539705/' },
  footAnkle: { title: 'NCBI · Foot and ankle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK546698/' },
  footArch: { title: 'NCBI · Foot arches anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK587361/' },
  footJoints: { title: 'NCBI · Foot joint anatomy', url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK536941/' },
  ankleJoint: { title: 'NCBI · Ankle joint anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK545158/' },
  tibPosterior: { title: 'NCBI · Tibialis posterior anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539913/' },
  extHallucis: { title: 'NCBI · Extensor hallucis longus anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539875/' },
  legBones: { title: 'NCBI · Leg bone anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537024/' },
  // Existing lesson references are re-used at their canonical URLs.
  patella: { title: 'AAOS · Patellar fractures', url: 'https://www.orthoinfo.org/diseases--conditions/patellar-kneecap-fractures/' },
  collateral: { title: 'AAOS · Collateral ligament injuries', url: 'https://www.orthoinfo.org/diseases--conditions/collateral-ligament-injuries/' },
  acl: { title: 'AAOS · ACL injuries', url: 'https://www.orthoinfo.org/diseases--conditions/anterior-cruciate-ligament-acl-injuries/' },
  pcl: { title: 'AAOS · PCL injuries', url: 'https://www.orthoinfo.org/diseases--conditions/posterior-cruciate-ligament-injuries/' },
  meniscus: { title: 'AAOS · Meniscus tears', url: 'https://www.orthoinfo.org/diseases--conditions/meniscus-tears/' },
  quadriceps: { title: 'AAOS · Quadriceps tendon tear', url: 'https://www.orthoinfo.org/diseases--conditions/quadriceps-tendon-tear/' },
  patellarTendon: { title: 'AAOS · Patellar tendon tear', url: 'https://www.orthoinfo.org/diseases--conditions/patellar-tendon-tear/' },
  achilles: { title: 'AAOS · Achilles tendon rupture', url: 'https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear/' },
  popliteus: { title: 'Morrissey & Knapik · Popliteus injury review', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8894959/' },
  ankleFracture: { title: 'AAOS · Ankle fractures', url: 'https://www.orthoinfo.org/diseases--conditions/ankle-fractures-broken-ankle/' },
  navicular: { title: 'AOFAS · Navicular stress fracture', url: 'https://www.footcaremd.org/foot-and-ankle-conditions/midfoot/navicular-stress-fractures' },
  peroneal: { title: 'NCBI · Peroneal tendon syndromes', url: 'https://www.ncbi.nlm.nih.gov/books/NBK544354/' },
  // Distinct imaging references can carry only the prose they actually support.
  calcaneus: { title: 'AAOS · Calcaneal fractures', url: 'https://www.orthoinfo.org/diseases--conditions/calcaneus-heel-bone-fractures/' },
  cuboid: { title: 'Angoules et al. · Cuboid fracture diagnosis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6379735/' },
  tibAnterior: { title: 'Lee et al. · Tibialis anterior tendon MRI', url: 'https://pubmed.ncbi.nlm.nih.gov/16861505/' },
  tarsalTunnel: { title: 'NCBI · Tarsal tunnel syndrome', url: 'https://www.ncbi.nlm.nih.gov/books/NBK513273/' },
} as const;
type Ref = keyof typeof umDistalModalityReferences | keyof typeof limbModalityReferences;
const draft = (body: string, ...keys: Ref[]): SpecimenTopicDraft => ({ readiness: 'draft', body, references: keys.map(k => k in umDistalModalityReferences ? umDistalModalityReferences[k as keyof typeof umDistalModalityReferences].url : limbModalityReferences[k as keyof typeof limbModalityReferences].url) });
export const umDistalTopicCompletion: Record<string, Partial<Record<ImagingTopic, SpecimenTopicDraft>>> = {
  femur: {
    ultrasound: draft('Ultrasound can inspect the accessible cortex and adjacent hip or knee soft tissues, depending on the question. It cannot survey the entire femoral marrow or reliably exclude an occult fracture. This whole-bone mesh supplies neither sonographic echoes nor a patient lesion.', 'hipUltrasound'),
  },
  tibia: {
    ultrasound: draft('The superficial tibial cortex is accessible to ultrasound, where a focal surface irregularity may prompt further assessment. Deep plateau geometry and marrow injury are outside a surface ultrasound examination. This intact tibial selection is not an ultrasound result.', 'mskUltrasoundPractice'),
  },
  fibula: {
    ultrasound: draft('Ultrasound can inspect accessible fibular cortex and adjacent lateral-ankle soft tissues at a symptomatic site. It cannot replace radiographs or CT for complete fracture configuration, nor MRI for marrow injury. The source fibula carries no patient-specific finding.', 'ankleFracture'),
  },
  patella: {
    mri: draft('MRI shows patellar marrow, articular cartilage and the adjacent extensor mechanism when a clinical question requires them. It can reveal injury hidden on a radiograph, but findings must be read with the full knee examination. The supplied patella has no lesion grade or patient marrow signal.', 'patella'),
    ultrasound: draft('Place the probe over the anterior patella to inspect its superficial cortex and the quadriceps and patellar tendon attachments. The deep articular surface and marrow are not comprehensively assessed by ultrasound. This bone mesh is not a dynamic extensor examination.', 'ultrasound'),
  },
  'femoral-cartilage': {
    ct: draft('CT defines adjacent distal femoral bone and may show secondary joint changes. Routine CT does not depict the thin articular cartilage surface as MRI can; apparent joint spacing is indirect. This selected cartilage mesh has no measured thickness or lesion grade.', 'kneePain'),
    ultrasound: draft('With knee flexion, ultrasound can view accessible anterior trochlear cartilage beneath the quadriceps tendon. It cannot survey the whole femoral condylar articular surface, especially covered weight-bearing regions. A normal limited window does not establish intact cartilage throughout this selection.', 'ultrasound'),
  },
  'tibial-cartilage': {
    ct: draft('CT can show tibial plateau bone, fracture contours and secondary degenerative change. The grouped articular cartilage is not directly graded on routine CT. Do not translate the reference surface into a patient cartilage-thickness measurement.', 'kneePain'),
    ultrasound: draft('The tibial plateau cartilage lies largely beneath the femur and is poorly accessible to ultrasound. Peripheral joint fluid or soft tissues may be visible, but that does not map medial and lateral cartilage thickness. MRI is better suited to a full cartilage question.', 'ultrasound'),
  },
  'patellar-cartilage': {
    ct: draft('CT shows patellar bone and patellofemoral alignment well, including a complex bony injury. It does not routinely grade the opposing articular cartilage directly. This surface is not a CT measurement of a patellofemoral defect.', 'kneePain'),
    ultrasound: draft('Ultrasound examines the anterior extensor mechanism, but the patellar articular cartilage faces deep into the joint. It cannot reliably survey that deep surface behind the patella. Use appropriate joint imaging when that cartilage is the clinical question.', 'ultrasound'),
  },
  acl: {
    ct: draft('CT may reveal a tibial-spine or other bony avulsion associated with ACL injury. The ligament fibres themselves are not routinely assessed for continuity on CT. This source ligament is a reference selection, not evidence of a tear.', 'acl'),
    ultrasound: draft('A routine knee ultrasound cannot trace the full intra-articular ACL through the intercondylar notch. It may assess adjacent effusion or accessible attachment-region findings, which do not exclude an ACL tear. Clinical examination and MRI address ligament integrity when indicated.', 'kneeTrauma'),
  },
  pcl: {
    ct: draft('CT can define a posterior tibial bony avulsion or another associated fracture. It cannot ordinarily establish PCL fibre integrity or posterior laxity. Those remain clinical and, when needed, MRI questions.', 'pcl'),
    ultrasound: draft('The PCL lies deep within the intercondylar region, beyond a routine complete ultrasound survey. A posterior knee window may show neighbouring tissues without proving PCL continuity. This model does not supply a stress examination or patient scan.', 'kneeTrauma'),
  },
  mcl: {
    ct: draft('CT can clarify a medial femoral or tibial attachment avulsion and associated bone injury. A normal CT bone study does not establish that MCL fibres are intact. MRI or targeted ultrasound may evaluate the accessible ligament when clinically indicated.', 'collateral'),
  },
  lcl: {
    ct: draft('CT helps define fibular-head or femoral attachment avulsion and other posterolateral bony injuries. The LCL and the rest of the posterolateral corner are not completely characterised by routine CT. This single ligament mesh cannot imply isolated stability.', 'kneeTrauma'),
  },
  'patellar-ligament': {
    ct: draft('CT can define a patellar or tibial-tubercle avulsion within the extensor apparatus. It is less direct than ultrasound or MRI for fibre continuity of the patellar ligament itself. Bony alignment in this static reference does not test active extension.', 'patellarTendon'),
  },
  'meniscus-group': {
    ultrasound: draft('Ultrasound can inspect peripheral meniscal margins and adjacent joint-line tissues. It cannot comprehensively assess the deeper intra-articular menisci or exclude an internal tear after a limited view. This grouped mesh also does not identify medial and lateral patient lesions.', 'meniscus'),
  },
  'quadriceps-tendon': {
    ct: draft('CT can show a superior-patellar avulsion or another accompanying bony injury. It does not routinely resolve the layered quadriceps tendon as well as targeted ultrasound or MRI. A reference tendon surface cannot demonstrate extensor strength or a patient rupture.', 'kneeTrauma'),
  },
  popliteus: {
    ct: draft('CT can define a bony attachment avulsion or fracture near the posterolateral knee. The deep popliteus tendon and muscle need soft-tissue assessment if injury remains a concern. This isolated mesh is not a complete posterolateral-corner study.', 'popliteus'),
    xray: draft('Knee radiographs survey alignment and a possible avulsion fragment near the popliteus attachment. They do not show the deep muscle or its tendon directly. A normal film cannot establish posterolateral soft-tissue integrity.', 'popliteus'),
    ultrasound: draft('A posterolateral ultrasound window may show accessible popliteus tendon portions, but the deeper course is hard to survey completely. Dynamic probe positioning and nearby neurovascular structures matter. MRI better evaluates suspected deep or combined posterolateral injury.', 'popliteus'),
  },
  calcaneus: {
    mri: draft('MRI depicts calcaneal marrow and adjacent Achilles, plantar fascia and subtalar soft tissues when the question extends beyond cortical shape. A marrow stress response may precede a clear radiographic line. This intact heel-bone surface has no patient marrow signal.', 'calcaneus'),
    ultrasound: draft('Ultrasound can inspect the superficial heel cortex and Achilles insertion in a focused examination. It cannot survey the whole calcaneal marrow or define a complex intra-articular fracture. The displayed heel bone is not evidence of enthesopathy or injury.', 'ankleTrauma'),
  },
  cuboid: {
    ultrasound: draft('A focused ultrasound can inspect the accessible lateral cuboid cortex and neighbouring peroneus-longus tendon. Cortical overlap and depth limit assessment of internal fracture extent or marrow stress response. Persistent midfoot concern may require radiography, CT or MRI.', 'cuboid'),
  },
  'intermediate-cuneiform': {
    mri: draft('MRI can depict marrow stress response in the intermediate cuneiform and adjacent tarsometatarsal soft tissues. Signal change must be interpreted with symptoms and neighbouring structures; it is not present in this surface mesh. This bone selection is distinct from the Lisfranc ligament.', 'stressFracture'),
    ultrasound: draft('A dorsal ultrasound window may show superficial intermediate-cuneiform cortex and adjacent tendon or ligament-region tissues. It cannot evaluate the full marrow or replace a stability assessment of the midfoot. The unresolved grouped metatarsals remain unassigned.', 'footTrauma'),
  },
  'lateral-cuneiform': {
    mri: draft('MRI can assess lateral-cuneiform marrow and neighbouring midfoot soft tissues when radiographs leave a focal question unresolved. A marrow stress response is a scan finding, not a property of this intact reference bone. Evaluate it with the wider tarsometatarsal assembly.', 'stressFracture'),
    ultrasound: draft('Ultrasound can inspect the accessible dorsal lateral-cuneiform surface and adjacent soft tissues. It does not survey deep joint surfaces or marrow. This selection should not be confused with the separate cuboid.', 'footTrauma'),
  },
  'medial-cuneiform': {
    ct: draft('CT defines medial-cuneiform fracture planes and neighbouring first-ray joint alignment when detailed bone assessment is required. It cannot establish Lisfranc ligament competence by itself. Reference spacing has no calibrated patient diastasis.', 'footTrauma'),
    ultrasound: draft('A focused dorsal or medial ultrasound window can view superficial medial-cuneiform cortex and accessible adjacent tissues. Deep articular involvement and marrow change require other imaging. This bone is not a proxy for the full Lisfranc complex.', 'footTrauma'),
  },
  navicular: {
    ultrasound: draft('Ultrasound can examine the superficial navicular tuberosity and posterior-tibial-tendon insertion. It cannot exclude a central navicular stress injury or survey marrow. This selected bone has no patient stress-fracture finding.', 'navicular'),
  },
  talus: {
    mri: draft('MRI evaluates talar marrow, osteochondral surfaces and adjacent ankle soft tissues after a focused clinical question. Marrow oedema can be occult on initial radiographs, but it is not encoded in this surface. Assessment must distinguish the talar dome from the separate calcaneus.', 'ankleTrauma'),
    ultrasound: draft('Ultrasound can view small accessible talar cortical and anterior joint margins during a focused ankle examination. It cannot survey the talar dome, deep cartilage or marrow comprehensively. A limited normal window does not exclude an osteochondral lesion.', 'ankleTrauma'),
  },
  'abductor-digiti-minimi': {
    ct: draft('CT gives plantar-lateral foot anatomy and bone relationships, but separates this small intrinsic muscle less clearly than MRI. It cannot establish denervation from muscle shape alone. This source is not a patient nerve study.', 'chronicFoot'),
    xray: draft('Foot radiographs assess the lateral foot bones and alignment relevant to plantar pain. They do not directly depict abductor digiti minimi or diagnose its innervation. A visible bone abnormality is not automatically the cause of muscle symptoms.', 'chronicFoot'),
    ultrasound: draft('Ultrasound can inspect the superficial lateral plantar muscle near the calcaneus with attention to depth and probe position. Its appearance alone cannot localise Baxter nerve compression. The reference mesh contains no nerve course or dynamic scan.', 'intrinsicUltrasound'),
  },
  'abductor-hallucis': {
    ct: draft('CT situates this medial plantar muscle against the calcaneus and first-ray bones, especially when bone anatomy is the question. Small intrinsic muscle and nerve changes are less well characterised than on MRI. This surface cannot identify a tarsal-tunnel lesion.', 'chronicFoot'),
    mri: draft('MRI can separate abductor hallucis from deeper plantar muscles and measure its size in a targeted assessment. Muscle size by itself does not localise a nerve lesion. The source mesh has no patient MRI signal or denervation finding.', 'intrinsicImaging'),
    xray: draft('Standing foot radiographs can assess medial arch alignment and adjacent bone changes. They do not show abductor hallucis fibres or establish muscle function. The model spacing is not a weight-bearing measurement.', 'xray'),
    ultrasound: draft('A medial plantar ultrasound window can identify abductor hallucis superficial to the deeper tarsal-tunnel region. Probe pressure and the nearby neurovascular bundle limit what one view can prove. It is not a complete nerve-entrapment assessment.', 'abductorUltrasound'),
  },
  'extensor-digitorum-brevis': {
    ct: draft('CT locates the dorsolateral calcaneal origin and adjacent foot bones, but is not the preferred test of this small muscle. Attenuation alone does not define a deep-fibular nerve lesion. This source lacks separately validated hallux-brevis anatomy.', 'ct'),
    mri: draft('MRI can show dorsal-foot soft tissues near the short extensor origin when a focused injury question remains after radiography. Signal alone does not localise a nerve lesion. This selection does not separately identify extensor hallucis brevis.', 'footTrauma'),
    xray: draft('Foot radiographs show dorsolateral bone alignment and possible osseous injury near the muscle origin. They do not directly image extensor digitorum brevis. A normal film cannot rule out a muscle or nerve problem.', 'xray'),
    ultrasound: draft('Ultrasound can identify the superficial dorsal muscle belly lateral to the long extensor tendons. It can guide a focused soft-tissue assessment but does not establish individual distal slips from this mesh. A deep-fibular nerve diagnosis needs wider evaluation.', 'mskUltrasoundPractice'),
  },
  'extensor-digitorum-longus': {
    ct: draft('CT identifies anterior-leg compartment relationships and associated bone injury. It does not routinely grade EDL muscle or tendon fibre injury. The single source surface does not validate four distal tendon slips.', 'ct'),
    mri: draft('MRI can assess EDL muscle and tendon signal through the anterior leg and ankle. Trace it beside, rather than confuse it with, the hallux long extensor. This static model carries no strain grade or patient tendon finding.', 'anteriorMRI'),
    xray: draft('Leg and ankle radiographs assess bones and alignment around EDL. The muscle and its tendon continuity are not directly visible. A normal film does not explain isolated lesser-toe extension weakness.', 'xray'),
  },
  'extensor-hallucis-longus': {
    ct: draft('CT provides anterior-leg and ankle bone context along the EHL course. It does not directly establish a subtle tendon tear or L5 motor function. The long hallux extensor must remain distinct from EDL.', 'ct'),
    mri: draft('MRI can follow EHL from its deep anterior-leg muscle belly toward the hallux tendon. Signal and continuity should be interpreted alongside the other anterior-compartment structures. This source cannot diagnose a root lesion or patient tear.', 'anteriorMRI'),
    xray: draft('Radiographs show associated tibial, fibular or foot bone injury, not EHL fibres. Dorsal hallux weakness with a normal film still requires clinical localisation. This mesh is no motor test.', 'xray'),
  },
  'flexor-digitorum-brevis': {
    ct: draft('CT shows plantar bone architecture and gross soft-tissue relationships around the short flexor. MRI more clearly separates small intrinsic muscles if their signal is the question. CT cannot validate this source as four individual tendon slips.', 'ct'),
    mri: draft('MRI can distinguish the superficial central plantar FDB from deeper quadratus plantae. Its signal may be assessed with other plantar muscles, but one change does not define a digital tendon injury. The grouped foot bones give no patient toe-specific lesion labels.', 'intrinsicImaging'),
    xray: draft('Weight-bearing foot radiographs can assess toe alignment and bony deformity. They do not directly reveal FDB tendon continuity or passive toe flexibility. A toe deformity should not be attributed to this single muscle from a film.', 'chronicFoot'),
    ultrasound: draft('A plantar probe can image accessible FDB fibres and trace them toward the lesser toes. Deeper quadratus plantae and the long flexor lie in different layers and should not be conflated. This source does not resolve individual digital slips.', 'intrinsicImaging'),
  },
  'flexor-digitorum-longus': {
    ct: draft('CT shows the posteromedial ankle bony tunnel and associated fracture anatomy. It is less direct for FDL tendon-sheath or fibre assessment than targeted ultrasound or MRI. Do not infer one of four distal slips from this whole surface.', 'chronicAnkle'),
    mri: draft('MRI follows FDL behind the medial malleolus and into the plantar foot alongside neighbouring flexors. It can assess tendon and sheath signal when clinically relevant. The display does not model a patient tarsal-tunnel lesion.', 'flexorMRI'),
    xray: draft('Ankle and foot films assess bones adjacent to FDL, including medial-malleolar injury. They cannot directly show FDL tendon continuity. A normal film does not settle a focused posteromedial tendon question.', 'ankleTrauma'),
  },
  'flexor-hallucis-longus': {
    ct: draft('CT defines posterior talar or sustentacular bone anatomy along the FHL route. It does not routinely diagnose tenosynovitis or demonstrate dynamic gliding. The reference muscle has no patient impingement sign.', 'ankleTrauma'),
    mri: draft('MRI can follow FHL through the posterior ankle and beneath the sustentaculum tali, assessing its tendon and sheath. Signal must be interpreted with symptoms and other posterior-ankle findings. Static separation of this mesh is not tendon motion.', 'flexorMRI'),
    xray: draft('Ankle radiographs can reveal posterior talar bone variants or injury around the FHL course. They do not image the tendon fibres directly. A normal film cannot exclude a clinically suspected FHL disorder.', 'ankleFracture'),
  },
  'gastrocnemius-lateral': {
    ct: draft('CT shows the lateral calf compartment and associated bone or deep soft-tissue context. MRI better characterises subtle lateral-head muscle injury. This selection is separate from the medial head and Achilles tendon.', 'kneeTrauma'),
    mri: draft('MRI can localise signal in the lateral gastrocnemius head and distinguish it from soleus or medial-head injury. Interpretation needs the wider calf and clinical history. The static source does not contain a strain grade.', 'calfMRI'),
    xray: draft('Knee and leg films survey nearby bone injury, not lateral-gastrocnemius fibres. A normal radiograph does not exclude muscle injury. Calf symptoms also require consideration beyond this head.', 'kneePain'),
    ultrasound: draft('Ultrasound can inspect the superficial lateral head and its interface with deeper soleus during a focused calf examination. It should not be labelled a medial-head tennis-leg finding. A muscle view alone cannot assess venous causes of calf pain.', 'calfUltrasound'),
  },
  'gastrocnemius-medial': {
    ct: draft('CT gives bony context around the medial calf, but a subtle muscle injury may require MRI for tissue characterisation. MRI studies separate medial-head injury from neighbouring soleus findings. This source surface does not represent a patient tear.', 'calfMRI'),
    mri: draft('MRI can localise a medial-head injury and distinguish it from deeper soleus change or fluid at their interface. The scan must be interpreted with clinical and vascular assessment where relevant. This model contains no patient strain or venous finding.', 'calfMRI'),
    xray: draft('Radiographs show knee or leg bone injury around the medial head, not the muscle fibres. A normal film cannot diagnose or exclude a calf strain. The source surface is anatomical context only.', 'kneePain'),
  },
  'peroneus-longus': {
    ct: draft('CT defines lateral-malleolar and cuboid bone relationships along the fibularis-longus tendon path. Soft-tissue windows may give context but are not a routine tendon-continuity examination. This selection does not include a separately validated brevis tendon.', 'peroneal'),
    xray: draft('Ankle and foot radiographs assess lateral bony injury and an os peroneum when present. They do not directly show a peroneus-longus tendon tear or dynamic subluxation. Retinacular competence is not inferred from this static model.', 'chronicAnkle'),
  },
  'quadratus-plantae': {
    ct: draft('CT shows plantar bone context but is not the preferred study for a suspected small intrinsic-muscle lesion. MRI or targeted ultrasound may be chosen after an unresolved soft-tissue question. This source surface is not a two-head or nerve map.', 'chronicFoot'),
    mri: draft('MRI places quadratus plantae deep to FDB and beside the long-flexor tendon apparatus. Assess any signal change with the wider plantar layers and clinical question. It does not insert directly on a toe phalanx.', 'intrinsicImaging'),
    xray: draft('Foot radiographs show bones and alignment overlying the deep plantar muscle. They cannot depict quadratus-plantae fibres or determine lateral-plantar nerve function. No individual head is identified by this mesh.', 'xray'),
    ultrasound: draft('A plantar ultrasound approach may reach quadratus plantae beneath FDB, but depth and overlying tissue limit detail. Trace the deeper muscle and FDL relation rather than calling the superficial FDB quadratus plantae. This is not a nerve-conduction test.', 'intrinsicImaging'),
  },
  soleus: {
    ct: draft('CT gives bone context around the deep calf, but MRI has been used to characterise injuries within the calf muscle complex. This soleus surface does not segment an intramuscular lesion or measure compartment pressure. A bone-focused CT view cannot supply those findings.', 'calfMRI'),
    xray: draft('Leg radiographs assess tibial or fibular bone injury around soleus. They do not show a deeper soleus strain or exclude one. The two gastrocnemius heads remain separate overlying structures.', 'xray'),
  },
  'tibialis-anterior': {
    ct: draft('CT shows anterior tibial and ankle bone relationships along the tibialis-anterior path. It is not a routine test of tendon continuity or dorsiflexion strength. The mesh does not include a measured compartment pressure.', 'chronicAnkle'),
    xray: draft('Leg and ankle films assess osseous injury adjacent to tibialis anterior. They cannot directly establish tendon rupture or distinguish tendon injury from a neurological cause of foot drop. Clinical localisation remains necessary.', 'chronicAnkle'),
  },
  'tibialis-posterior': {
    ct: draft('CT defines the medial-malleolar and midfoot bone relationships crossed by tibialis posterior. It may clarify an associated bony abnormality, but not every distal tendon slip or arch-support ligament. This static reference is not a standing alignment study.', 'chronicAnkle'),
  },
  'achilles-tendon': {
    ct: draft('CT can define a calcaneal avulsion or other bone injury at the Achilles insertion. It is not the usual direct assessment of tendon fibre continuity compared with ultrasound or MRI. This intact source tendon cannot establish plantarflexion strength or a patient rupture.', 'achilles'),
  },
};
