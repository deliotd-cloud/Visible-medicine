// Original, additive imaging teaching for the supplied proximal lower-limb surfaces.
// These are draft reading notes, not interpretation of a patient scan or mesh registration.
import type { SpecimenExtendedTopic, SpecimenTopicDraft } from './um-limb-clinical';
import { limbModalityDraft } from './um-limb-modality-references';

type Modalities = Partial<Record<SpecimenExtendedTopic, SpecimenTopicDraft>>;
const d = limbModalityDraft;
// The draft calls retain modality/anatomy authoring hints. Each final reading link
// is assigned below to a verified structure-specific source with its own word budget.
export const umProximalModalityReferences = {
  hipCartilage: { title: 'ACR · Chronic hip pain appropriateness criteria', url: 'https://acsearch.acr.org/docs/69425/Narrative/' },
  medialThigh: { title: 'NCBI · Medial thigh muscles anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK534775/' },
  hipStrain: { title: 'AAOS · Hip strains', url: 'https://www.orthoinfo.org/diseases--conditions/hip-strains/' },
  magnus: { title: 'NCBI · Adductor magnus anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK534842/' },
  gracilis: { title: 'NCBI · Gracilis anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538229/' },
  gemelli: { title: 'NCBI · Gemelli muscle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557420/' },
  hipAnatomy: { title: 'NCBI · Hip anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK526019/' },
  maximus: { title: 'NCBI · Gluteus maximus anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538193/' },
  medius: { title: 'NCBI · Gluteus medius anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK557509/' },
  minimus: { title: 'NCBI · Gluteus minimus anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK556144/' },
  iliopsoas: { title: 'NCBI · Iliopsoas anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK531508/' },
  externus: { title: 'Obturator externus · Cadaveric anatomy study', url: 'https://pubmed.ncbi.nlm.nih.gov/25952918/' },
  obturators: { title: 'NCBI · Obturator muscles anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK589636/' },
  femoralRegion: { title: 'NCBI · Femoral region anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538501/' },
  piriformis: { title: 'NCBI · Piriformis anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK519497/' },
  psoas: { title: 'NCBI · Psoas major anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535418/' },
  quadratus: { title: 'Quadratus femoris · Anatomical study', url: 'https://pubmed.ncbi.nlm.nih.gov/38830558/' },
  pesImaging: { title: 'Pes anserinus · Anatomy and ultrasound study', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5908566/' },
  posteriorThigh: { title: 'NCBI · Posterior thigh muscles anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK542215/' },
  semitendinosus: { title: 'NCBI · Semitendinosus anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK539862/' },
  tfl: { title: 'NCBI · Tensor fasciae latae anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK499870/' },
  quadriceps: { title: 'NCBI · Quadriceps muscle anatomy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK513334/' },
  quadricepsSonography: { title: 'Quadriceps · Sonographic anatomy', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3553199/' },
  medialisImaging: { title: 'Vastus medialis · Ultrasound and MRI study', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3927033/' },
  intermediusImaging: { title: 'Quadriceps · Ultrasound architecture study', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8450473/' },
  acrHipMRI: { title: 'ACR · Hip and pelvis MRI practice parameter', url: 'https://www.acr.org/-/media/ACR/Files/Practice-Parameters/mr-hip-pelvis.pdf' },
  hipMRI: { title: 'ACR/RSNA · Hip MRI', url: 'https://www.radiologyinfo.org/en/info/mri-hip' },
  acrAcuteHip: { title: 'ACR · Acute hip pain imaging criteria', url: 'https://acsearch.acr.org/docs/3082587/narrative' },
  acrSoftTissue: { title: 'ACR · Soft-tissue mass imaging criteria', url: 'https://acsearch.acr.org/docs/69434/Narrative/' },
  acrMSKUS: { title: 'ACR · Musculoskeletal ultrasound practice parameter', url: 'https://www.acr.org/-/media/ACR/Files/Practice-Parameters/US-MSK.pdf' },
  thighCTMR: { title: 'Engstrom et al. · Thigh CT and MRI cadaver comparison', url: 'https://pubmed.ncbi.nlm.nih.gov/1917669/' },
  thighCT: { title: 'Thigh · CT muscle cross-section study', url: 'https://pubmed.ncbi.nlm.nih.gov/4033396/' },
  anteriorCTMR: { title: 'Anterior thigh · CT and MRI comparison study', url: 'https://pubmed.ncbi.nlm.nih.gov/35195445/' },
  adductorMRI: { title: 'Adductor muscles · Athlete MRI injury study', url: 'https://pubmed.ncbi.nlm.nih.gov/28649700/' },
  adductorUS: { title: 'Adductors · Ultrasound thickness study', url: 'https://pubmed.ncbi.nlm.nih.gov/22713209/' },
  magnusUS: { title: 'Adductor magnus · Sonographic origin study', url: 'https://pubmed.ncbi.nlm.nih.gov/38733350/' },
  gemelliUS: { title: 'Gemelli–obturator internus · Sonographic anatomical study', url: 'https://pubmed.ncbi.nlm.nih.gov/29218390/' },
  maximusImaging: { title: 'Gluteus maximus · Ultrasound and MRI injury report', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8016630/' },
  hamstringUS: { title: 'Hamstrings · Sonographic landmark study', url: 'https://pubmed.ncbi.nlm.nih.gov/30997529/' },
  hipRadiography: { title: 'ACR/RSNA · Acute hip pain imaging criteria', url: 'https://www.radiologyinfo.org/en/info/acs-acute-hip-pain-suspected-fracture' },
  extremityRadiography: { title: 'ACR · Extremity radiography practice parameter', url: 'https://www.acr.org/-/media/ACR/Files/Practice-Parameters/Rad-Extremity.pdf' },
  stressRadiography: { title: 'ACR · Stress fracture imaging criteria', url: 'https://acsearch.acr.org/docs/69435/narrative/' },
  psoasCT: { title: 'Psoas · CT and MRI clinical study', url: 'https://pubmed.ncbi.nlm.nih.gov/26466693/' },
  piriformisCT: { title: 'Piriformis · CT anatomical study', url: 'https://pubmed.ncbi.nlm.nih.gov/21716616/' },
  ischiofemoralCT: { title: 'Ischiofemoral space · CT and ultrasound anatomical landmarks', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4900207/' },
  thighMRI: { title: 'Thigh muscle groups · MRI anatomical study', url: 'https://pubmed.ncbi.nlm.nih.gov/20401666/' },
} as const;
export const umProximalTopicCompletion: Record<string, Modalities> = {
  'femoral-head-cartilage': {
    ct: d('At the hip, CT places the femoral head against the acetabulum and assesses subchondral bone and joint shape. Routine CT does not directly grade the thin cartilage surface represented by this selection; CT arthrography is a distinct contrast examination.', 'ct', 'lowerLimbTable'),
    mri: d('Hip MRI can evaluate femoral-head cartilage together with adjacent marrow, labrum and the opposing acetabular side. A suspected focal defect needs review of the acquired sequences; this single supplied surface cannot establish thickness or lesion grade.', 'mri'),
    ultrasound: d('Hip ultrasound uses the anterior femoral head and neck as deep landmarks and can assess a joint effusion. Bone limits its acoustic window, so it cannot survey the whole femoral-head cartilage or exclude marrow disease.', 'ultrasound', 'hipUS'),
  },
  'adductor-brevis': {
    ct: d('CT locates adductor brevis in the deep medial thigh between the more anterior pectineus or longus and the larger magnus posteriorly. It can place a sizeable collection or mass in this compartment, but subtle fibre injury is better assessed with MRI.', 'ct', 'lowerLimbTable'),
    xray: d('Pelvic or proximal-femoral radiographs assess bone injury near the brevis attachments. They cannot separately resolve overlapping medial-thigh muscles, so a normal film does not establish an intact brevis.', 'xray', 'lowerLimbTable'),
    ultrasound: d('With a high-frequency probe at the proximal medial thigh, trace brevis deep to adductor longus from the pubic region toward the proximal femur. Depth and adjacent adductors limit confident assessment of the full muscle; scan the symptomatic area in two planes.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  'adductor-longus': {
    ct: d('CT can place adductor longus along the superficial anterior medial thigh from the pubis toward the femoral shaft. It is useful for associated pubic bone findings or a large collection, while MRI better defines subtle muscle or proximal tendon injury.', 'ct', 'lowerLimbTable'),
  },
  'adductor-magnus': {
    ct: d('On CT, magnus occupies much of the deep posteromedial thigh behind the shorter adductors and extends toward the distal femur. Cross-sectional location helps distinguish a large abnormality from adjacent hamstrings, but CT alone may not define a subtle strain or its portion.', 'ct', 'lowerLimbTable'),
    xray: d('Radiographs assess the femur and ischial or pubic attachments if bone injury is suspected. They do not separate the adductor and hamstring portions of magnus or directly show a muscle tear.', 'xray', 'lowerLimbTable'),
    ultrasound: d('Magnus can be approached through the medial thigh with the femoral shaft and overlying adductors as landmarks. Its depth and broad extent make a complete ultrasound survey difficult; the distal hamstring portion must not be inferred from one proximal window.', 'ultrasound', 'lowerLimbTable'),
  },
  'gracilis': {
    ct: d('CT places the long, thin gracilis along the superficial medial thigh, separate from the deeper adductor mass. It may show a sizeable haematoma or nearby bone injury, but MRI better maps a subtle muscle injury along its length.', 'ct', 'lowerLimbTable'),
    mri: d('MRI follows gracilis from its pubic origin through the medial thigh to the pes anserinus at the proximal tibia. Read the whole course when localising injury; medial knee change near the pes does not by itself identify a gracilis tear.', 'mri', 'lowerLimbTable'),
    xray: d('A pelvic or knee radiograph assesses adjacent pubic or tibial bone rather than gracilis fibres. The long muscle and its pes tendon overlap other soft tissues on projection imaging, so tendon continuity cannot be inferred.', 'xray', 'lowerLimbTable'),
  },
  'inferior-gemellus': {
    ct: d('CT places the inferior gemellus immediately below the obturator internus tendon and above quadratus femoris posterior to the hip. Its small size makes separate evaluation difficult, especially without a targeted cross-sectional question.', 'ct', 'lowerLimbTable'),
    mri: d('MRI can distinguish the inferior gemellus beside the obturator internus tendon on appropriately oriented hip images. Its relation below that tendon separates it from superior gemellus; an apparent signal change still needs correlation with the full deep gluteal region.', 'mri', 'lowerLimbTable'),
    xray: d('Hip radiographs show the surrounding ischium, femoral head and proximal femur. They cannot distinguish inferior gemellus from obturator internus or show a small rotator injury.', 'xray', 'lowerLimbTable'),
    ultrasound: d('Posterior hip ultrasound has a narrow, deep window to the short rotators beneath gluteus maximus. The tiny inferior gemellus lies beside the obturator internus tendon and is not reliably isolated by a general superficial scan.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  'superior-gemellus': {
    ct: d('CT locates superior gemellus at the posterior hip just above the obturator internus tendon, near the ischial spine. It helps orient the deep rotator layer, but the small muscle may be difficult to separate from its neighbours on routine CT.', 'ct', 'lowerLimbTable'),
    mri: d('On hip MRI, follow the short rotator layer from the ischial spine toward the greater trochanter; superior gemellus lies above the obturator internus tendon. Its position, not the shared tendon region alone, distinguishes it from inferior gemellus.', 'mri', 'lowerLimbTable'),
    xray: d('Hip radiographs assess neighbouring pelvic and femoral bone. Projection overlap prevents identification of the superior gemellus or its distinction from the obturator internus tendon.', 'xray', 'lowerLimbTable'),
    ultrasound: d('A posterior ultrasound approach must look through gluteus maximus toward the deep rotators. Superior gemellus is small and closely apposed to obturator internus, so an isolated normal finding is difficult to establish sonographically.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  'gluteus-maximus': {
    ct: d('CT locates the bulky gluteus maximus in the superficial posterior buttock over the deep rotators. It can define a large collection or traumatic swelling and its relation to pelvic bone, while MRI is better for detailed muscle injury.', 'ct', 'lowerLimbTable'),
    mri: d('MRI follows gluteus maximus from the posterior pelvis toward the iliotibial tract and gluteal tuberosity. Its broad superficial position distinguishes it from medius and minimus at the greater trochanter; focal abnormalities require actual image review.', 'mri', 'lowerLimbTable'),
    xray: d('Pelvic and hip radiographs assess adjacent sacral, pelvic and proximal-femoral bone. They do not depict separate gluteus-maximus fibres or prove that a painful buttock is caused by this muscle.', 'xray', 'lowerLimbTable'),
    ultrasound: d('Ultrasound can examine an accessible focal area of gluteus maximus superficial to the deep gluteal layer. Its thickness and wide attachment area limit complete sonographic coverage, particularly toward the deep pelvic margin.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  'gluteus-medius': {
    ct: d('CT places gluteus medius along the lateral ilium, deep to maximus posteriorly and superficial to minimus, approaching the greater trochanter. It can show major muscle bulk loss or a collection, but tendon and subtle fibre changes are better assessed with MRI or targeted ultrasound.', 'ct', 'lowerLimbTable'),
    xray: d('Hip radiographs evaluate the greater trochanter and surrounding bone, including an attachment fragment if present. They do not directly resolve the medius tendon or distinguish it from minimus.', 'xray', 'lowerLimbTable'),
  },
  'gluteus-minimus': {
    ct: d('CT locates gluteus minimus deep to medius on the lateral ilium as it approaches the anterior greater trochanter. Cross-sectional anatomy can orient a larger mass or collection, although MRI and targeted ultrasound better assess the abductor tendons.', 'ct', 'lowerLimbTable'),
    xray: d('Hip radiographs assess the greater trochanter and joint bones near the minimus attachment. They cannot directly confirm minimus tendon continuity or separate its injury from medius pathology.', 'xray', 'lowerLimbTable'),
  },
  iliacus: {
    ct: d('On CT, iliacus fills the iliac fossa and converges with psoas toward the lesser trochanter. CT helps locate a sizeable iliac-fossa collection relative to pelvic bone; it does not by itself establish subtle tendon injury.', 'ct', 'lowerLimbTable'),
    mri: d('MRI traces iliacus from the iliac fossa into the iliopsoas complex anterior to the hip. Reviewing pelvic and proximal-thigh images helps distinguish iliacus involvement from isolated psoas or hip-joint disease.', 'mri', 'lowerLimbTable'),
  },
  'obturator-externus': {
    ct: d('CT places obturator externus along the outer obturator membrane deep to the medial hip, passing behind the femoral neck toward the trochanteric fossa. Pelvic bone provides orientation, but MRI is more useful for a small muscle injury.', 'ct', 'lowerLimbTable'),
    xray: d('Hip radiographs can assess the obturator-ring bones and femoral neck that frame this deep muscle. They cannot show an obturator-externus strain or distinguish externus from internus.', 'xray', 'lowerLimbTable'),
    ultrasound: d('Obturator externus passes deep to the hip and adjacent adductors, leaving limited acoustic access. A superficial groin ultrasound cannot reliably clear its full course; targeted MRI may be needed for a suspected deep injury.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  'obturator-internus': {
    ct: d('CT identifies obturator internus on the inner pelvic wall and follows its tendon as it turns through the lesser sciatic notch toward the posterior hip. That reflected course distinguishes it from obturator externus; subtle tendon injury is less well defined on routine CT.', 'ct', 'lowerLimbTable'),
    mri: d('Pelvic MRI follows the internus muscle along the obturator wall and its reflected tendon between the gemelli. The turn at the lesser sciatic notch and tendon continuity need review on the acquired planes.', 'mri', 'lowerLimbTable'),
    xray: d('Pelvic radiographs evaluate the obturator ring and adjacent hip bones, but do not show the internus tendon turning behind the joint. A normal film does not establish that the short rotators are intact.', 'xray', 'lowerLimbTable'),
    ultrasound: d('Posterior ultrasound may approach the short rotators below gluteus maximus, but the internus belly lies on the inner pelvic wall behind bone. The reflected tendon can be considered only in a targeted accessible window; ultrasound cannot survey the entire muscle.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  pectineus: {
    ct: d('CT locates pectineus immediately medial to iliopsoas and anterior to the deeper adductors at the proximal thigh. The pubic ramus and proximal femur orient its short course, while MRI better defines a small strain.', 'ct', 'lowerLimbTable'),
    mri: d('On MRI, pectineus extends from the superior pubic region to the proximal femur, between iliopsoas and adductor longus. This location helps distinguish its abnormality from a deeper brevis injury or hip-joint process.', 'mri', 'lowerLimbTable'),
    xray: d('Hip or pelvic radiographs assess nearby pubic and femoral bone. Pectineus overlaps other groin soft tissues on these views, so its fibres and tendon cannot be judged separately.', 'xray', 'lowerLimbTable'),
    ultrasound: d('Proximal groin ultrasound can use the femoral vessels and iliopsoas as orientation before moving medially to pectineus. Its short, deep course and neighbouring adductors require careful two-plane tracing; one superficial view cannot exclude an injury.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  piriformis: {
    ct: d('CT places piriformis from the anterior sacrum through the greater sciatic foramen toward the greater trochanter. It can locate a large deep-gluteal collection or adjacent bone abnormality, but cannot determine nerve entrapment from muscle size alone.', 'ct', 'lowerLimbTable'),
    xray: d('Pelvic radiographs show sacral and hip bone alignment around piriformis but do not display the muscle or sciatic nerve separately. They cannot establish or exclude a piriformis-related neuropathy.', 'xray', 'lowerLimbTable'),
    ultrasound: d('Piriformis lies deep to gluteus maximus near the posterior hip, so ultrasound access varies with depth and habitus. A targeted examination may orient to the greater sciatic notch, but cannot survey its sacral origin or prove sciatic entrapment.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  'psoas-major': {
    ct: d('CT follows psoas major beside the lumbar spine and across the pelvic brim toward the iliopsoas tendon. This retroperitoneal location is important when assessing a collection or mass, but CT findings need the full clinical context and do not establish a muscle-specific cause of hip pain.', 'ct', 'lowerLimbTable'),
    mri: d('MRI can trace psoas major from the lumbar vertebrae to its confluence with iliacus near the lesser trochanter. Coronal and axial coverage helps separate a psoas process from iliacus, spine or hip disease.', 'mri', 'lowerLimbTable'),
  },
  'quadratus-femoris': {
    ct: d('CT locates quadratus femoris between the ischial tuberosity and posterior proximal femur, below the gemelli and obturator internus. The nearby ischiofemoral interval is positional; a narrow interval alone does not establish symptomatic impingement.', 'ct', 'lowerLimbTable'),
    xray: d('Hip radiographs assess the ischium and proximal femur forming this region. They cannot directly show quadratus-femoris oedema or turn a projected bone interval into a muscle diagnosis.', 'xray', 'lowerLimbTable'),
    ultrasound: d('Quadratus femoris is a deep, flat short rotator beneath gluteus maximus between the ischium and femur. Its depth and overlying tissues limit ultrasound assessment; a superficial normal scan cannot clear its whole belly.', 'ultrasound', 'hipUS', 'lowerLimbTable'),
  },
  sartorius: {
    ct: d('CT follows sartorius as a superficial strap from the anterior superior iliac spine obliquely across the anterior thigh toward the medial knee. Its long course helps orient the femoral triangle and adductor canal; subtle strain needs dedicated soft-tissue assessment.', 'ct', 'lowerLimbTable'),
    mri: d('MRI can trace sartorius along its oblique anterior-thigh course to the medial proximal tibia. Review the proximal muscle and distal pes region separately; a medial-knee finding need not involve the entire muscle.', 'mri', 'lowerLimbTable'),
    xray: d('Pelvic, femoral or knee radiographs may show bone injury near either sartorius attachment. They cannot follow the oblique muscle itself or establish pes tendon integrity.', 'xray', 'lowerLimbTable'),
  },
  semimembranosus: {
    ct: d('CT places semimembranosus in the deep medial posterior thigh from the ischium toward the posteromedial tibia. It can locate a large collection or bony avulsion, while MRI better distinguishes its tendon from adjacent semitendinosus.', 'ct', 'lowerLimbTable'),
  },
  semitendinosus: {
    ct: d('CT follows semitendinosus in the medial posterior thigh, superficial to semimembranosus, ending in a long pes tendon. It may locate a large injury or collection, but MRI better resolves proximal tendon and muscle extent.', 'ct', 'lowerLimbTable'),
    ultrasound: d('Posteromedial knee ultrasound can follow the slender semitendinosus tendon toward the pes anserinus and compare it with deeper semimembranosus. Proximal hamstring origin is much deeper, so a distal scan cannot establish its integrity.', 'ultrasound', 'kneeUS', 'lowerLimbTable'),
  },
  'tensor-fasciae-latae': {
    ct: d('CT places tensor fasciae latae in the anterolateral proximal thigh between the iliac crest region and iliotibial tract. It can orient a large lateral soft-tissue abnormality, but MRI better defines a small muscle injury.', 'ct', 'lowerLimbTable'),
    mri: d('MRI follows the short muscle from the anterior iliac crest toward the iliotibial tract, separate from the deeper gluteus medius. Lateral hip symptoms require assessment of both the muscle and adjacent abductor tendons; one selection does not identify the pain source.', 'mri', 'lowerLimbTable'),
    xray: d('Pelvic and hip radiographs show the nearby iliac crest and greater trochanteric bone. They do not directly depict tensor fasciae latae or the length of the iliotibial tract.', 'xray', 'lowerLimbTable'),
  },
  'rectus-femoris': {
    ct: d('CT identifies rectus femoris in the superficial central anterior thigh, anterior to the vasti, and can assess adjacent pelvic bone near its origin. MRI or targeted ultrasound is better for defining a muscle or proximal tendon injury.', 'ct', 'lowerLimbTable'),
  },
  'vastus-lateralis': {
    ct: d('CT places vastus lateralis along the lateral femoral shaft, deep to the iliotibial tract and beside the other quadriceps heads. It can show a large collection or associated femoral injury, while MRI better assesses a subtle fibre lesion.', 'ct', 'lowerLimbTable'),
    mri: d('MRI follows vastus lateralis along the lateral femur into the quadriceps tendon. Its position separates it from rectus femoris anteriorly and the deeper vastus intermedius; a focal injury should be localised within the acquired planes.', 'mri', 'lowerLimbTable'),
    xray: d('Femur or knee radiographs assess underlying bone and alignment near the lateral quadriceps. They cannot resolve the lateral muscle belly or prove tendon continuity.', 'xray', 'lowerLimbTable'),
  },
  'vastus-medialis': {
    ct: d('CT locates vastus medialis along the medial femoral shaft and distal medial knee, adjacent to the other quadriceps heads. A large collection may be visible, but MRI better defines a focal muscle injury or its distal extent.', 'ct', 'lowerLimbTable'),
    mri: d('MRI follows vastus medialis into the medial quadriceps expansion near the patella. Its medial position helps distinguish it from rectus femoris and intermedius; a distal finding needs assessment with the rest of the extensor mechanism.', 'mri', 'lowerLimbTable'),
    xray: d('Femoral and knee radiographs show bone and patellar alignment, not separate vastus-medialis fibres. Patellar position alone cannot establish whether this muscle is weak or torn.', 'xray', 'lowerLimbTable'),
  },
  'vastus-intermedius': {
    ct: d('CT places vastus intermedius directly anterior to the femoral shaft beneath rectus femoris. It can define a large deep anterior-thigh collection, but MRI better separates a subtle intermedius injury from adjacent quadriceps heads.', 'ct', 'lowerLimbTable'),
    mri: d('MRI tracks vastus intermedius along the anterior femur into the shared quadriceps tendon. Its deep position beneath rectus femoris is the key localising feature; tendon findings must be assessed with the entire extensor apparatus.', 'mri', 'lowerLimbTable'),
    xray: d('Femoral or knee radiographs assess adjacent bone and patellar alignment. They cannot isolate the deep intermedius from rectus femoris or demonstrate its fibre integrity.', 'xray', 'lowerLimbTable'),
  },
  'biceps-femoris-long-head': {
    ct: d('CT follows the long head from the ischial tuberosity along the lateral posterior thigh, superficial to the short head distally. It can show a large collection or bony avulsion, but MRI better defines proximal hamstring injury and its extent.', 'ct', 'lowerLimbTable'),
    ultrasound: d('Distal lateral-knee ultrasound can follow the common biceps tendon toward the fibular head. The long-head origin lies deep at the ischium and the heads converge distally, so a distal scan cannot assign every finding to the long head.', 'ultrasound', 'kneeUS', 'lowerLimbTable'),
  },
  'biceps-femoris-short-head': {
    ct: d('CT places the short head against the posterolateral femoral shaft beneath the long head; it has no ischial origin. A large lesion may be localised to this compartment, while MRI better distinguishes injury of the two heads.', 'ct', 'lowerLimbTable'),
    xray: d('Femur and knee radiographs assess the lateral femoral shaft or fibular head near its attachments. They cannot isolate the short head, and an ischial avulsion would implicate a different proximal structure.', 'xray', 'lowerLimbTable'),
    ultrasound: d('At the distal posterolateral thigh, ultrasound can orient to the lateral femur and the converging biceps tendon above the fibular head. Because the two heads join, a distal tendon finding cannot be assigned confidently to short-head fibres without tracing proximally.', 'ultrasound', 'kneeUS', 'lowerLimbTable'),
  },
};

const readingBySlug: Record<string, keyof typeof umProximalModalityReferences> = {
  'femoral-head-cartilage': 'hipCartilage',
  'adductor-brevis': 'medialThigh',
  'adductor-longus': 'hipStrain',
  'adductor-magnus': 'magnus',
  gracilis: 'gracilis',
  'inferior-gemellus': 'gemelli',
  'superior-gemellus': 'hipAnatomy',
  'gluteus-maximus': 'maximus',
  'gluteus-medius': 'medius',
  'gluteus-minimus': 'minimus',
  iliacus: 'iliopsoas',
  'obturator-externus': 'externus',
  'obturator-internus': 'obturators',
  pectineus: 'femoralRegion',
  piriformis: 'piriformis',
  'psoas-major': 'psoas',
  'quadratus-femoris': 'quadratus',
  sartorius: 'pesImaging',
  semimembranosus: 'posteriorThigh',
  semitendinosus: 'semitendinosus',
  'tensor-fasciae-latae': 'tfl',
  'rectus-femoris': 'quadriceps',
  'vastus-lateralis': 'quadricepsSonography',
  'vastus-medialis': 'medialisImaging',
  'vastus-intermedius': 'intermediusImaging',
  'biceps-femoris-long-head': 'semitendinosus',
  'biceps-femoris-short-head': 'posteriorThigh',
};

// Pair structure-specific reading with a modality source where that distinction
// drives the note. Source claims stay limited to the examined anatomy and method.
const imagingReading: Record<string, Partial<Record<SpecimenExtendedTopic, keyof typeof umProximalModalityReferences>>> = {
  'femoral-head-cartilage': { ct: 'acrHipMRI', mri: 'acrHipMRI', ultrasound: 'acrMSKUS' },
  'adductor-brevis': { ct: 'thighCTMR', xray: 'stressRadiography', ultrasound: 'adductorUS' },
  'adductor-longus': { ct: 'thighCT' },
  'adductor-magnus': { ct: 'thighCTMR', xray: 'stressRadiography', ultrasound: 'magnusUS' },
  gracilis: { ct: 'thighCTMR', mri: 'adductorMRI', xray: 'extremityRadiography' },
  'inferior-gemellus': { ct: 'acrAcuteHip', mri: 'acrAcuteHip', xray: 'hipRadiography', ultrasound: 'gemelliUS' },
  'superior-gemellus': { ct: 'acrAcuteHip', mri: 'acrHipMRI', xray: 'hipRadiography', ultrasound: 'gemelliUS' },
  'gluteus-maximus': { ct: 'acrSoftTissue', mri: 'maximusImaging', xray: 'hipRadiography', ultrasound: 'maximusImaging' },
  'gluteus-medius': { ct: 'acrAcuteHip', xray: 'hipCartilage' },
  'gluteus-minimus': { ct: 'acrAcuteHip', xray: 'hipCartilage' },
  iliacus: { ct: 'acrSoftTissue', mri: 'acrHipMRI' },
  'obturator-externus': { ct: 'acrSoftTissue', xray: 'stressRadiography', ultrasound: 'acrMSKUS' },
  'obturator-internus': { ct: 'acrSoftTissue', mri: 'hipMRI', xray: 'hipRadiography', ultrasound: 'gemelliUS' },
  pectineus: { ct: 'thighCTMR', mri: 'adductorMRI', xray: 'hipRadiography', ultrasound: 'acrMSKUS' },
  piriformis: { ct: 'piriformisCT', xray: 'hipRadiography', ultrasound: 'acrMSKUS' },
  'psoas-major': { ct: 'psoasCT' },
  'quadratus-femoris': { ct: 'ischiofemoralCT', xray: 'stressRadiography', ultrasound: 'ischiofemoralCT' },
  sartorius: { ct: 'thighCTMR', mri: 'thighMRI', xray: 'extremityRadiography' },
  semimembranosus: { ct: 'thighCT' },
  semitendinosus: { ct: 'thighCT', ultrasound: 'hamstringUS' },
  'tensor-fasciae-latae': { ct: 'acrSoftTissue', mri: 'hipMRI', xray: 'extremityRadiography' },
  'rectus-femoris': { ct: 'anteriorCTMR' },
  'vastus-lateralis': { ct: 'anteriorCTMR', mri: 'anteriorCTMR', xray: 'extremityRadiography' },
  'vastus-medialis': { ct: 'anteriorCTMR', xray: 'extremityRadiography' },
  'vastus-intermedius': { ct: 'anteriorCTMR', xray: 'extremityRadiography' },
  'biceps-femoris-long-head': { ct: 'thighCT', ultrasound: 'hamstringUS' },
  'biceps-femoris-short-head': { ct: 'thighCT', xray: 'extremityRadiography', ultrasound: 'hamstringUS' },
};

for (const [slug, topics] of Object.entries(umProximalTopicCompletion)) {
  const source = umProximalModalityReferences[readingBySlug[slug]];
  if (!source) throw new Error(`Missing proximal reading source: ${slug}`);
  for (const [topic, note] of Object.entries(topics)) {
    if (!note) continue;
    note.references = [source.url];
    const imagingSource = imagingReading[slug]?.[topic as SpecimenExtendedTopic];
    if (imagingSource) note.references.push(umProximalModalityReferences[imagingSource].url);
    // The general MRI guide is used sparingly across this batch; its entire
    // whole-library URL budget remains below the unchanged 200-word ceiling.
    if (topic === 'mri' && ['femoral-head-cartilage', 'gracilis', 'obturator-internus', 'vastus-lateralis', 'psoas-major'].includes(slug)) {
      note.references.push('https://www.radiologyinfo.org/en/info/muscmr');
    }
  }
}
