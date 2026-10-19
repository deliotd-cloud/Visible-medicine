// Original short factual synthesis; references are linked, never republished.
// Anatomical source rights and clinical approval remain separate from this copy.
import type { SpecimenLesson } from './um-limb-teaching';
import type {
  SpecimenClinicalLesson,
  SpecimenTopicDraft,
} from './um-limb-clinical';

export const hraPelvicReferences = {
  urinary: {
    title: 'NIDDK · Urinary tract function',
    url: 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works',
  },
  urinaryImaging: {
    title: 'NIDDK · Urinary tract imaging',
    url: 'https://www.niddk.nih.gov/health-information/diagnostic-tests/urinary-tract-imaging',
  },
  bladder: {
    title: 'NCI SEER · Bladder anatomy',
    url: 'https://www.training.seer.cancer.gov/bladder/anatomy/',
  },
  bladderMri: {
    title: 'VI-RADS development consensus · Bladder MRI (2018)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29755006/',
  },
  colorectal: {
    title: 'NCI SEER · Colorectal anatomy',
    url: 'https://training.seer.cancer.gov/colorectal/anatomy/',
  },
  rectalMri: {
    title: 'ESGAR · Rectal MRI primary staging (2026)',
    url: 'https://link.springer.com/article/10.1007/s00330-025-12274-w',
  },
  pelvicVessels: {
    title: 'Texas Tech · Female reproductive vascular anatomy',
    url: 'https://anatomy.ttuhscep.edu/schemes/femalerepro_tables.html',
  },
  pelvicVeins: {
    title: 'AVLS international working group · Pelvic venous disorders (2021)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8371031/',
  },
  uterineDoppler: {
    title: 'ISUOG · Uterine artery Doppler in pre-eclampsia screening (2018)',
    url: 'https://www.isuog.org/static/79953875-e790-4e4d-aaea8d59e1d018e9/ISUOG-Practice-Guidelines-ultrasound-in-screening-for-Pre-eclampisa.pdf',
  },
  sacralImaging: {
    title: 'RadioGraphics · CT of sacral fractures (2022)',
    url: 'https://pubs.rsna.org/radiographics/doi/full/10.1148/rg.220075',
  },
  dissection: {
    title: 'Texas Tech · Female pelvic relationships and support',
    url: 'https://anatomy.ttuhscep.edu/reproductive_system/pelvicvisc_ans.html',
  },
  endometriosis: {
    title: 'ESHRE · Endometriosis guideline (2022)',
    url: 'https://www.eshre.eu/Guidelines-and-Legal/Guidelines/Endometriosis-Guideline',
  },
  compartments: {
    title: 'ESUR · Endometriosis MRI protocol and compartments (2025)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12559084/',
  },
  anatomy: {
    title: 'Texas Tech · Pelvic viscera anatomy',
    url: 'https://anatomy.ttuhscep.edu/reproductive_system/pelvicvisc_tables.html',
  },
  ovaries: {
    title: 'NCI SEER · Ovaries',
    url: 'https://training.seer.cancer.gov/anatomy/reproductive/female/ovaries.html',
  },
  tract: {
    title: 'NCI SEER · Female genital tract',
    url: 'https://training.seer.cancer.gov/anatomy/reproductive/female/tract.html',
  },
  cervix: {
    title: 'NCI SEER · Cervix and pelvic anatomy',
    url: 'https://training.seer.cancer.gov/cervical-uterine/anatomy/',
  },
  cervicalCancer: {
    title: 'NCI · Cervical cancer overview',
    url: 'https://www.cancer.gov/types/cervical',
  },
  uterus: {
    title: 'IDKD · Benign disease and imaging of the uterus',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK543803/',
  },
  adnexa: {
    title: 'ESUR · Adnexal MRI and CT recommendations (2024)',
    url: 'https://link.springer.com/article/10.1007/s00330-024-10817-1',
  },
  cystic: {
    title: 'ESUR · Cystic female pelvic lesions (2026)',
    url: 'https://link.springer.com/article/10.1186/s13244-025-02174-4',
  },
  anomalies: {
    title: 'ESUR · MRI of genital tract anomalies (2020)',
    url: 'https://link.springer.com/article/10.1007/s00330-020-06750-8',
  },
  abdominalCt: {
    title: 'ACR/RSNA · Abdominal and Pelvic CT',
    url: 'https://www.radiologyinfo.org/en/info/abdominct',
  },
  abdominalXray: {
    title: 'ACR/RSNA · Abdominal X-ray',
    url: 'https://www.radiologyinfo.org/en/info/abdominrad',
  },
  pelvicUltrasound: {
    title: 'ACR/RSNA · Pelvis Ultrasound',
    url: 'https://www.radiologyinfo.org/en/info/pelvus',
  },
} as const;
export const hraPelvicReferenceTitles = Object.fromEntries(
  Object.values(hraPelvicReferences).map((r) => [r.url, r.title]),
);
type Ref = keyof typeof hraPelvicReferences;
const refs = (...keys: Ref[]) => keys.map((k) => hraPelvicReferences[k].url);
const draft = (body: string, ...keys: Ref[]): SpecimenTopicDraft => ({
  readiness: 'draft',
  body,
  references: refs(...keys),
});
type TopicSet = SpecimenClinicalLesson['topics'];
const topics: Record<
  | 'ovary'
  | 'tube'
  | 'uterus'
  | 'fundus'
  | 'cervix'
  | 'vagina'
  | 'uterosacral'
  | 'cardinal'
  | 'peritoneal'
  | 'adnexalSupport'
  | 'pouch'
  | 'junction'
  | 'rectum'
  | 'bladderDome'
  | 'bladderBase'
  | 'bladderNeck'
  | 'uterineArtery'
  | 'uterineVein'
  | 'sacrum',
  TopicSet
> = {
  junction: {
    clinical: draft('Use the cervical projection and surrounding vaginal fornices to orient the upper vagina. The source junction is a gross regional boundary, not the microscopic squamocolumnar junction.', 'cervix'),
    pathology: draft('Epithelial cervical disease cannot be inferred from this junction mesh. Distinguish a gross cervix–vagina relationship from the transformation zone examined during cervical assessment.', 'cervix'),
    ct: draft('For CT correlation, identify the cervix and upper vagina in the acquired study before assigning a source-region label. This surface supplies neither a tissue attenuation nor a tumour boundary.', 'cervix'),
    xray: draft('On an unenhanced pelvic projection, the cervix–vagina meeting region is superimposed on other soft tissues. The source seam is a gross teaching boundary, not a line to trace on the radiograph or an epithelial landmark.', 'cervix', 'abdominalXray'),
    mri: draft('Follow the cervical canal towards the upper vagina in orthogonal planes. A rendered seam is not evidence of a septum, abnormal canal or interrupted vaginal continuity.', 'anomalies'),
    ultrasound: draft('When correlating pelvic ultrasound, establish the cervix and adjacent vaginal region first. This source has no probe plane or validated epithelial landmark; do not overlay its outline automatically.', 'cervix'),
  },
  rectum: {
    clinical: draft('Compare the rectum with the vagina anteriorly and sacrum posteriorly. Its displayed shell is not a mesorectal fascia segmentation, resection margin or complete anal-sphincter model.', 'anatomy'),
    pathology: draft('Adenocarcinoma is the predominant colorectal malignancy. For a real rectal lesion, organ origin, depth and surrounding involvement require acquired imaging and tissue diagnosis, not this reference contour.', 'colorectal'),
    ct: draft('Use CT to relate a labelled rectum to the rest of the imaged pelvis. Do not transfer an MRI local-staging category or a measured mesorectal margin from this unregistered surface.', 'rectalMri'),
    xray: draft('A pelvic radiograph may show gas or stool projected over the expected rectal region, but overlapping contents do not delineate its wall or mesorectal fascia. The isolated rectal shell is not a projection image.', 'colorectal', 'abdominalXray'),
    mri: draft('High-resolution T2-weighted images establish local anatomy; interpret diffusion-weighted images with T2 and ADC maps. Assess the mesorectal fascia, vessels and nodes separately. A numerical ADC threshold alone is not a staging rule.', 'rectalMri'),
    ultrasound: draft('Endorectal ultrasound has a role in selected early-tumour assessment. It is a different examination from routine transabdominal pelvic ultrasound; this model supplies neither wall-layer echoes nor a tumour-depth measurement.', 'rectalMri'),
  },
  bladderDome: {
    clinical: draft('The superior bladder relates to the anterior peritoneal reflection. Bladder filling changes its configuration; this fixed donor surface cannot establish capacity or a patient-specific contact plane.', 'dissection', 'bladder'),
    pathology: draft('Bladder lesions require assessment of the wall and surrounding tissues. A separation between this dome and the source base is a modelling boundary, not rupture or a diverticulum.', 'urinaryImaging'),
    ct: draft('CT can assess urinary stones, masses and traumatic injury when appropriately acquired. This unopacified reference has no contrast phase, extravasation or measurable lesion.', 'urinaryImaging'),
    mri: draft('Bladder MRI assessment combines T2-weighted, diffusion and dynamic contrast information when using VI-RADS. A smooth dome mesh cannot exclude muscle invasion or be assigned a VI-RADS score.', 'bladderMri'),
    xray: draft('Contrast cystography depicts a filled bladder lumen; it is not equivalent to an unenhanced pelvic radiograph. The atlas does not simulate filling, contrast leakage or a cystogram.', 'urinaryImaging'),
    ultrasound: draft('Ultrasound can assess bladder wall abnormalities, stones and diverticula. The dome label is a surface identifier, not an echogenic interface, measured volume or guarantee that a lesion is absent.', 'urinaryImaging'),
  },
  bladderBase: {
    clinical: draft('The posterior bladder base is related to the upper vagina and cervix. The trigone is an internal landmark bounded by the ureteric openings and urethral outlet, not the entire external base.', 'anatomy'),
    pathology: draft('Urothelial carcinoma can arise in the bladder lining. This base selection does not separate urothelium, lamina propria and muscle, so it cannot establish histological depth.', 'bladder', 'bladderMri'),
    ct: draft('Correlate the bladder base with the ureteric entry region on suitable acquired images. This source does not contain a contrast-filled lumen or validate the patency of either ureter.', 'anatomy', 'urinaryImaging'),
    mri: draft('On T2-weighted bladder MRI, the muscular layer has low signal. The base mesh is not that layer and cannot supply an invasion boundary; combine the actual sequences with clinical and pathological evidence.', 'bladderMri'),
    xray: draft('A voiding cystourethrogram follows the contrast-filled bladder and urethra. A source base outline cannot show reflux or replace the dynamic examination.', 'urinaryImaging'),
    ultrasound: draft('Examine the acquired bladder base rather than treating this external surface as a mucosal map. No ureteric jets, stones or dynamic emptying are simulated here.', 'urinaryImaging'),
  },
  bladderNeck: {
    clinical: draft('Urine leaves through the urethra at the bladder outlet. Storage and voiding require coordinated bladder, outlet, nerve and pelvic-floor activity; this isolated source-labelled smooth muscle is not the complete continence apparatus.', 'urinary'),
    pathology: draft('Retention and incontinence describe different functional problems. Neither can be diagnosed from the shape or size of this static bladder-neck selection.', 'urinary', 'urinaryImaging'),
    ct: draft('CT can show structural urinary-tract disease, but this source neck has no functional emptying record. Its apparent opening is not proof of outlet obstruction or a patent urethra.', 'urinaryImaging'),
    mri: draft('MRI can depict pelvic soft-tissue relationships. Do not read source-labelled smooth muscle as a resolved histological sphincter or infer normal continence from its contour.', 'urinaryImaging', 'urinary'),
    xray: draft('A voiding cystourethrogram acquires the outlet during emptying. This static neck surface cannot reproduce its timing or demonstrate a voiding abnormality.', 'urinaryImaging'),
    ultrasound: draft('Bladder ultrasound and a functional emptying assessment answer different questions. This source carries no pre-void or post-void measurement and no bladder-neck motion.', 'urinary', 'urinaryImaging'),
  },
  uterineArtery: {
    clinical: draft('The uterine artery crosses superior to the ureter near the cervix. This is an important operative relationship, but the current specimen does not supply a complete ureter or a safe procedural route.', 'dissection'),
    pathology: draft('In pregnancy, uterine artery Doppler contributes to pre-eclampsia risk assessment alongside other factors. A vessel outline or isolated waveform feature is not a diagnosis; this source is not a pregnancy simulation.', 'uterineDoppler'),
    ct: draft('For future CT correlation, the mapped artery must be identified in that study and side. Source colour and a nearby enhancing vessel are not sufficient to establish the same branch or a spatial registration.', 'pelvicVessels'),
    xray: draft('A routine pelvic radiograph cannot follow the small uterine arterial branch across the ureter. The source vessel is an anatomical route, while projection overlap and absent vessel contrast prevent a side-specific arterial trace.', 'pelvicVessels', 'abdominalXray'),
    mri: draft('Keep an arterial source selection separate from adjacent veins and uterine tissue when planning MRI teaching anchors. This mesh contains no angiographic sequence, perfusion measurement or validated patient vascular tree.', 'pelvicVessels'),
    ultrasound: draft('Colour Doppler helps locate the vessel; spectral Doppler provides a waveform. Uterine artery indices depend on the acquisition method and pregnancy context. No Doppler signal or gestational reference range is generated by this model.', 'uterineDoppler'),
  },
  uterineVein: {
    clinical: draft('Uterine veins drain the uterine plexus towards the internal iliac veins. Connections with ovarian and vaginal venous networks mean a single displayed branch is not the complete pelvic drainage system.', 'pelvicVessels'),
    pathology: draft('Pelvic venous disorders require symptoms and venous pathophysiology to be considered together. A prominent reference vein alone does not diagnose a symptomatic pelvic venous disorder.', 'pelvicVeins'),
    ct: draft('Use the acquired venous anatomy and study protocol when assigning a CT anchor. This donor branch is not evidence of reflux, obstruction or a contrast-filling defect in a patient.', 'pelvicVeins'),
    xray: draft('A plain pelvic projection does not resolve the uterine venous plexus or distinguish this branch from nearby arteries. Do not interpret the model calibre or blue colour as a radiographic sign of pelvic venous disease.', 'pelvicVeins', 'abdominalXray'),
    mri: draft('A venous anatomical map and a haemodynamic assessment are distinct. This reference has no measured flow direction, venographic acquisition or validated link to an MRI case.', 'pelvicVeins'),
    ultrasound: draft('A venous assessment needs acquired flow information and clinical context. The blue source surface supplies neither a Doppler trace nor evidence of reflux; do not infer haemodynamics from colour or calibre.', 'pelvicVeins'),
  },
  sacrum: {
    clinical: draft('The sacrum transmits spinal load into the pelvic ring. A clinically useful injury assessment also considers stability and neurological findings; the present isolated bone cannot supply either.', 'sacralImaging'),
    pathology: draft('Fractures may involve the alae, neural foramina or central canal. Distinguish traumatic injury from insufficiency injury; an opening or surface irregularity in this reference is not a fracture.', 'sacralImaging'),
    ct: draft('Review sacral injuries in axial images and multiplanar reconstructions, checking displacement and foraminal or canal involvement. No fracture line, displacement measurement or neural compression is encoded in this normal-reference mesh.', 'sacralImaging'),
    mri: draft('MRI can reveal marrow oedema in an occult insufficiency fracture, including after unrevealing CT. The rendered bone has no marrow signal, and its appearance cannot exclude an injury.', 'sacralImaging'),
    xray: draft('Sacral fractures can be obscured on pelvic radiographs. A reassuring projection alone does not exclude injury; this isolated 3D bone is not a simulated diagnostic radiograph.', 'sacralImaging'),
    ultrasound: draft('Routine pelvic ultrasound uses soft-tissue acoustic windows and does not reproduce the enclosed sacral canal or marrow. The bright bony interface, when encountered, is not a map of the foramina or a fracture assessment.', 'pelvicUltrasound', 'sacralImaging'),
  },
  uterosacral: {
    clinical: draft(
      'Compare each ligament with the posterior cervix, vaginal fornix and neighbouring rectum. A source-labelled band is not a complete pelvic-support apparatus or an operative dissection plane.',
      'dissection',
    ),
    pathology: draft(
      'Deep endometriosis may affect the uterosacral region. Assess a suspected deposit and adjacent spread on acquired images; a thick or irregular source mesh is not a lesion.',
      'compartments',
    ),
    ct: draft('Use the posterior cervix, rectum and sacral region to orient a CT examination. The thin uterosacral band is not reliably separated as this mesh suggests; CT relationship alone cannot establish a small deposit or its margins.', 'dissection', 'abdominalCt'),
    xray: draft('The paired uterosacral supports are soft-tissue bands behind the cervix, superimposed on bowel and sacrum in a pelvic projection. Their source contours should not be read as visible radiographic ligaments.', 'dissection', 'abdominalXray'),
    mri: draft(
      'Follow the ligament in more than one plane. ESUR cautions that thickness alone is not specific for an endometriotic deposit; a nodule seen in only one plane remains uncertain. This model cannot supply either signal or diagnostic measurements.',
      'compartments',
    ),
    ultrasound: draft(
      'Ultrasound and MRI contribute to endometriosis assessment, but negative imaging does not exclude disease, particularly superficial peritoneal disease. The visible source ligament is not evidence of sonographic visibility or a negative examination.',
      'endometriosis',
    ),
  },
  cardinal: {
    clinical: draft(
      'Relate the lateral cervical support region to the uterine vessels. Its rendered border does not define all parametrial connective tissue, ureteral relationships or a safe surgical boundary.',
      'dissection',
    ),
    pathology: draft(
      'Parametrial involvement is a location to assess, not a diagnosis conferred by selecting the cardinal surface. Distinguish the underlying disease, its extent and neighbouring organ involvement on patient studies.',
      'compartments',
    ),
    ct: draft('On CT, orient the lateral cervical region by the cervix, bladder and pelvic sidewall. The cardinal source edge does not identify a separate CT fascial plane, ureter course or measured extent of parametrial tissue.', 'dissection', 'abdominalCt'),
    xray: draft('A plain pelvic radiograph overlaps the lateral cervical connective tissue with pelvic bones and other soft tissues. It cannot display a separate cardinal ligament or the vessels and ureter near its source region.', 'dissection', 'abdominalXray'),
    mri: draft(
      'Use the cervix, vagina and lateral pelvic tissues as orientation landmarks when assessing parametrial spread. Named reporting compartments are analytical divisions, not separately encapsulated organs or these mesh outlines.',
      'compartments',
    ),
    ultrasound: draft(
      'Interpret lateral cervical tissue with the rest of a dedicated pelvic examination. This reference does not contain ultrasound texture, dynamic tissue mobility or the missing ureter needed for patient-specific assessment.',
      'anatomy',
      'endometriosis',
    ),
  },
  peritoneal: {
    clinical: draft(
      'Identify which organ the fold relates to before naming a nearby finding. A broad-ligament, paraovarian or tubal location is not automatically an ovarian origin.',
      'anatomy',
      'cystic',
    ),
    pathology: draft(
      'A cyst beside the ovary may be extraovarian. Establish the ovary separately and assess the lesion itself; separating these folds does not simulate a cyst, adhesion or obstructed tube.',
      'cystic',
    ),
    ct: draft('Relate a CT finding to the uterus, tube and ovary before assigning a broad-ligament, mesosalpinx or mesovarium location. These delicate peritoneal folds are not individual CT contours copied from the source model.', 'anatomy', 'abdominalCt'),
    xray: draft('Broad-ligament folds and their tubal or ovarian portions are not individually outlined on a plain pelvic radiograph. Bowel and pelvic bones overlap their expected location; the source fold is anatomical context only.', 'anatomy', 'abdominalXray'),
    mri: draft(
      'Orient the uterus, ovaries and tubes together. MRI can clarify an indeterminate adnexal finding, but this thin source surface is not an MR-visible tissue boundary or a validated segmentation of a lesion.',
      'adnexa',
    ),
    ultrasound: draft(
      'During adnexal assessment, distinguish a finding from a separately identified ovary. These labelled mesenteric folds cannot establish which normal folds a particular ultrasound examination resolves.',
      'adnexa',
      'anatomy',
    ),
  },
  adnexalSupport: {
    clinical: draft(
      'Distinguish the ovarian attachment towards the uterus from the lateral fold carrying the ovarian neurovascular route. No complete vessels, ureter or nerves are supplied by selecting either ligament.',
      'dissection',
    ),
    pathology: draft(
      'A mass near an ovarian attachment still requires determination of its organ of origin. Surface displacement in this atlas is a display operation, not evidence of a mass or vascular compromise.',
      'cystic',
    ),
    ct: draft('On CT, place the ovary between its uterine attachment and the lateral pelvic sidewall before considering a nearby finding. The source support does not resolve its vessels, lymphatics or a patient-specific tether.', 'dissection', 'abdominalCt'),
    xray: draft('Neither the proper ovarian ligament nor the lateral suspensory fold forms a distinct line on an ordinary pelvic radiograph. Their routes are obscured by superimposed pelvic soft tissues and bowel.', 'dissection', 'abdominalXray'),
    mri: draft(
      'Use the ovary, uterus and pelvic sidewall as relational landmarks. The source contains no flow, enhancement or tissue signal; a geometric connection cannot demonstrate perfusion.',
      'anatomy',
      'dissection',
    ),
    ultrasound: draft(
      'Locate the ovary independently during adnexal assessment. Doppler findings must come from a patient examination, not the colour of this support surface or its proximity to a labelled vessel.',
      'adnexa',
    ),
  },
  pouch: {
    clinical: draft(
      'Keep the anterior vesicouterine recess separate from the posterior rectouterine pouch. The source support-surface grouping is a display category: this selection represents a peritoneal recess, not a solid ligament.',
      'dissection',
    ),
    pathology: draft(
      'Describe a lesion near this recess separately from invasion of the bladder wall. An apparent contact between model surfaces supplies no evidence of tissue invasion or adhesion.',
      'compartments',
    ),
    ct: draft('Locate the anterior peritoneal recess between bladder and uterus on the acquired CT using both organ boundaries. The source pouch is a potential space, not a fixed open cavity or a segmented fluid collection.', 'dissection', 'abdominalCt'),
    xray: draft('The vesicouterine recess is a peritoneal reflection between two soft-tissue organs, not a radiopaque cavity. Plain projection overlap cannot show its separate wall or distinguish it by the model outline.', 'dissection', 'abdominalXray'),
    mri: draft(
      'The vesico-uterine space relates to the posterior part of the bladder dome. Localize findings relative to the uterus and bladder wall; do not confuse this with the bladder base or the posterior pouch of Douglas.',
      'compartments',
      'dissection',
    ),
    ultrasound: draft(
      'Use the bladder and uterus to orient the anterior pelvic relationship. This static source cannot demonstrate a fluid collection, dynamic sliding or patient-specific separation of the organs.',
      'dissection',
    ),
  },
  ovary: {
    clinical: draft(
      'First establish whether an adnexal finding arises within the ovary or beside it. “Adnexal” and “ovarian” are not interchangeable; this reference supplies no lesion-specific model.',
      'adnexa',
      'cystic',
    ),
    pathology: draft(
      'A paraovarian cyst is separate from ovarian tissue. Identifying the ovary independently helps avoid assigning every nearby cyst to it. No lesion is simulated here.',
      'cystic',
    ),
    mri: draft(
      'MRI can clarify an adnexal mass that ultrasound cannot characterize. T1/T2 signal, diffusion and enhancement require acquired images; neither mesh colour nor shape can supply an O-RADS score.',
      'adnexa',
    ),
    ultrasound: draft(
      'Ultrasound is the first-line assessment for suspected adnexal masses. Locate both ovaries and relate a finding to the uterus and neighbouring structures; this mesh contains no echoes or Doppler information.',
      'adnexa',
    ),
    ct: draft(
      'When ovarian malignancy is suspected, contrast-enhanced CT is used to assess disease extent beyond the ovary. This is a different task from characterizing normal follicles; the atlas cannot stage disease.',
      'adnexa',
    ),
    xray: draft('A plain pelvic projection may contain adnexal calcification, but it does not localize every density to an ovary or define the ovarian cortex. Identify organ origin with the appropriate acquired examination rather than this mesh.', 'adnexa', 'abdominalXray'),
  },
  tube: {
    clinical: draft(
      'Distinguish a tubal abnormality from a neighbouring ovarian lesion. Selecting a named segment does not establish tubal patency, fertility or the site of a pregnancy.',
      'cystic',
    ),
    pathology: draft(
      'Hydrosalpinx is a fluid-distended uterine tube. A folded tubular configuration helps distinguish it from a rounded adnexal cyst; source gaps here are not obstruction.',
      'cystic',
    ),
    ct: draft('CT can place a gross adnexal finding beside the uterus and ovary, but normal ampulla, isthmus, infundibulum and fimbriae are not separate routine CT labels. These source segments do not establish lumen patency.', 'anatomy', 'abdominalCt'),
    xray: draft('An unenhanced pelvic radiograph cannot resolve normal uterine-tube segments or fimbriae against overlapping bowel and pelvic soft tissue. The clearly separated source pieces are anatomy lessons, not projected radiographic edges.', 'anatomy', 'abdominalXray'),
    mri: draft(
      'Simple fluid in a hydrosalpinx is typically bright on T2 and dark on T1. Inspect the contents and wall; these source surfaces contain neither fluid signal nor wall enhancement.',
      'cystic',
    ),
    ultrasound: draft(
      'Assess an adnexal cystic finding in relation to the ovary and uterus. The clearly separated tubal segments in this atlas are teaching selections, not a claim that routine ultrasound resolves each one.',
      'adnexa',
    ),
  },
  uterus: {
    clinical: draft(
      'Localize a uterine finding to the cavity, muscular wall or external contour before describing it. The body/fundus/lower-segment selections are regional surfaces, not histological layers.',
      'uterus',
    ),
    pathology: draft(
      'Adenomyosis involves endometrial-type tissue within myometrium; a leiomyoma is a smooth-muscle tumour. Neither is represented by an irregularity or gap in this model.',
      'uterus',
    ),
    ct: draft('On CT, use the uterine outline and cervix to orient the body or lower-region source label. The source divides external regions, while CT findings within the cavity or wall require interpretation of acquired tissue detail.', 'uterus', 'abdominalCt'),
    xray: draft('The body and lower uterine region overlap other pelvic soft tissues on a plain radiograph; even a visible uterine-region density cannot identify this model seam or endometrial and myometrial layers.', 'uterus', 'abdominalXray'),
    mri: draft(
      'On T2-weighted MRI, distinguish bright endometrium, the darker junctional zone and outer myometrium. Their appearance varies with physiology. None is separately segmented in this atlas.',
      'uterus',
    ),
    ultrasound: draft(
      'Endometrial thickness and appearance vary with menstrual and menopausal context. A fixed source surface cannot measure the endometrium or provide a diagnostic thickness threshold.',
      'uterus',
    ),
  },
  fundus: {
    clinical: draft(
      'For a suspected uterine anomaly, assess the cavity and external fundal contour together. A view of the outer surface alone is insufficient.',
      'anomalies',
    ),
    pathology: draft(
      'Different cavity configurations can accompany different external contours. Do not classify a septate or bicorporeal uterus by splitting, hiding or exploding this reference.',
      'anomalies',
    ),
    ct: draft('The superior uterine contour can help orient CT anatomy relative to the adnexa, but a rendered fundal dome does not disclose the internal cavity configuration. Assess a suspected anomaly on suitable acquired images.', 'anomalies', 'abdominalCt'),
    xray: draft('A routine pelvic projection does not show the separate internal cavity and external fundal contour needed to understand a uterine anomaly. The source dome is a 3D orientation aid, not a radiographic classification.', 'anomalies', 'abdominalXray'),
    mri: draft(
      'Uterus-oriented imaging, especially a true coronal view, relates the cavity to the external fundal contour. Rotating this mesh is not equivalent to obtaining that MR plane.',
      'anomalies',
    ),
    ultrasound: draft(
      'Interpret the fundal region with the cavity and the rest of the uterus. The atlas has no sonographic endometrial boundary or reconstructed ultrasound volume.',
      'uterus',
    ),
  },
  cervix: {
    clinical: draft(
      'Cervical screening assesses epithelial disease; a smooth gross contour cannot exclude it. The source does not resolve the transformation zone or substitute for screening.',
      'cervicalCancer',
    ),
    pathology: draft(
      'Nabothian cysts are cervical gland retention cysts. A labelled cervical opening is not a cyst, and an atlas surface cannot characterize a patient lesion.',
      'uterus',
    ),
    ct: draft('Use the uterine body and upper vagina to locate the cervical region on CT. The internal and external os are canal ends in this source, not measured CT apertures or a reliably traced epithelial boundary.', 'cervix', 'abdominalCt'),
    xray: draft('The cervix and its two canal openings are superimposed on surrounding pelvic soft tissues in a plain projection. The atlas openings should not be treated as visible radiographic holes or screening findings.', 'cervix', 'abdominalXray'),
    mri: draft(
      'Orient assessment to the cervical canal, including a perpendicular short-axis view when evaluating cervical structure. The cervix and uterine body need not share one axis.',
      'anomalies',
    ),
    ultrasound: draft(
      'The internal os faces the uterine cavity; the external os opens towards the vagina. These are orientation landmarks, not calibrated ultrasound calipers or a cervical-length measurement.',
      'cervix',
    ),
  },
  vagina: {
    clinical: draft(
      'When assessing a genital tract anomaly, examine the vagina and cervix as well as the uterus; associated urinary anatomy may matter. This separate study is not a complete anomaly survey.',
      'anomalies',
    ),
    pathology: draft(
      'Cyst location helps distinguish vaginal, periurethral and vestibular lesions. A Gartner duct cyst is associated with the vaginal wall; Bartholin lesions arise near the introitus. No cyst or gland is modelled.',
      'cystic',
    ),
    ct: draft('Follow the gross vaginal course below the cervix and between bladder and rectum when orienting CT anatomy. Its collapsed walls and fine layers are not resolved by this source shell or transferred to a patient scan.', 'anatomy', 'abdominalCt'),
    xray: draft('A plain pelvic projection superimposes the vagina with bladder, rectum and pelvic bones. The vaginal canal is not outlined as this source shell; a projection cannot show its fornices or wall layers separately.', 'anatomy', 'abdominalXray'),
    ultrasound: draft('On acquired pelvic ultrasound, relate the vagina to the cervix, bladder and rectum in the actual examination plane. The source shell provides neither echoes nor a probe orientation, so it cannot define a vaginal wall lesion.', 'cervix', 'pelvicUltrasound'),
    mri: draft(
      'Follow vaginal continuity with the cervix and its relationship to adjacent organs in multiple planes. This source cannot show an obstructing septum, retained blood or a duplicated vagina.',
      'anomalies',
    ),
  },
};
type Concept = {
  anatomy: string;
  function: string;
  refs: Ref[];
  family: keyof typeof topics;
  question: string;
  answer: string;
};
export const hraPelvicConcepts = {
  junction: {
    anatomy: 'The source-labelled meeting region of upper vagina and cervix. The cervix projects into the vaginal canal, with fornices around its vaginal portion; these are gross relationships rather than epithelial zones.',
    function: 'Marks the cervix–vagina relationship for orientation. It is not a separate organ, valve or additional opening of the cervical canal.',
    refs: ['cervix'], family: 'junction',
    question: 'Is the cervicovaginal source junction the cervical squamocolumnar junction?',
    answer: 'No. The source label describes gross regional geometry; the squamocolumnar junction is an epithelial transition that is not modelled.',
  },
  rectum: {
    anatomy: 'The bowel segment between sigmoid colon and anal canal, posterior to the vagina and anterior to the sacrum. Its source surface does not separately identify the bowel-wall layers or mesorectal fascia.',
    function: 'Temporarily stores stool before defaecation. Continence and evacuation also involve structures and dynamic activity that this specimen does not reproduce.',
    refs: ['anatomy', 'colorectal'], family: 'rectum',
    question: 'Can the rectal surface be used as the mesorectal fascia for a tumour-margin measurement?',
    answer: 'No. Rectal wall and mesorectal fascia are different boundaries; neither tumour staging nor a margin distance can be derived from this source selection.',
  },
  bladderDome: {
    anatomy: 'The superior urinary-bladder source surface. Its delivery label distinguishes it from the separately retained base, despite shared or ambiguous upstream fundus terminology.',
    function: 'Part of the expandable urinary reservoir. It does not act independently from the remainder of the bladder wall, and its static source dimensions are not bladder capacity.',
    refs: ['bladder', 'dissection'], family: 'bladderDome',
    question: 'Does the source dome–base seam demonstrate a bladder rupture?',
    answer: 'No. It is a boundary between source pieces; rupture requires evidence from the actual patient investigation.',
  },
  bladderBase: {
    anatomy: 'The posterior bladder-base source surface, distinct from the superior dome and inferior neck. Its external contour is not a separate mesh of the internal trigone.',
    function: 'Part of the urinary reservoir near the ureteric entry region. The base label alone establishes neither a patent connection nor a complete anti-reflux mechanism.',
    refs: ['anatomy', 'bladder'], family: 'bladderBase',
    question: 'Are the external bladder base and internal vesical trigone identical selections?',
    answer: 'No. The trigone is an internal landmark between the two ureteric openings and urethral outlet; this source labels an external region.',
  },
  bladderNeck: {
    anatomy: 'Source-labelled smooth muscle at the inferior bladder outlet towards the urethra. It is distinct from the skeletal external urethral sphincter and does not represent all female outlet tissues.',
    function: 'Participates in the outlet region of the coordinated storage–voiding system. Muscle activity, innervation and pressure relationships are not simulated.',
    refs: ['urinary', 'anatomy'], family: 'bladderNeck',
    question: 'Does selecting bladder-neck smooth muscle isolate the external urethral sphincter?',
    answer: 'No. The source is labelled smooth muscle; the external urethral sphincter is a distinct skeletal-muscle structure not supplied by this selection.',
  },
  uterineArtery: {
    anatomy: 'Paired arterial supply to the uterus, usually arising from the internal iliac anterior division and ascending beside the uterus. The uterine and ovarian arterial systems communicate; the source is not a complete branching map.',
    function: 'Supplies oxygenated blood to uterine tissues. A selected arterial mesh is a spatial reference, not a measured perfusion territory or flow simulation.',
    refs: ['pelvicVessels'], family: 'uterineArtery',
    question: 'At the paracervical crossing, which passes above the ureter?',
    answer: 'The uterine artery. The relationship should be confirmed on the actual case; this specimen lacks a complete ureter and cannot guide an intervention.',
  },
  uterineVein: {
    anatomy: 'A source branch of the uterine venous drainage, related to the uterine plexus and internal iliac system. Left and right selections remain separate; neither is the entire ovarian vein.',
    function: 'Returns blood from the uterine venous network. Collateral connections and changing flow directions cannot be inferred from the two retained branch surfaces.',
    refs: ['pelvicVessels'], family: 'uterineVein',
    question: 'Does a large-looking uterine vein in this atlas prove symptomatic venous reflux?',
    answer: 'No. A reference calibre is not a patient measurement, and anatomy alone does not establish symptoms or reflux.',
  },
  sacrum: {
    anatomy: 'The fused sacral bone at the posterior pelvis, with a central canal and foramina for sacral neural passage. The retained surface is not a separately labelled nerve-root or sacroiliac-joint model.',
    function: 'Transfers axial load between the spine and pelvic ring. Removing adjacent organs in the viewer does not test bony stability or expose a validated sacral plexus.',
    refs: ['sacralImaging'], family: 'sacrum',
    question: 'Does a normal-appearing sacral radiograph rule out an insufficiency fracture?',
    answer: 'No. Some injuries are radiographically occult; MRI can reveal marrow abnormality when a clinically suspected injury remains unresolved.',
  },
  uterosacral: {
    anatomy:
      'Paired posterior cervical support extending towards the sacral region beside the rectum. Compare its cervical and posterior ends without inferring uninterrupted fascia from an open source shell.',
    function:
      'Contributes to apical uterine support together with other connective tissues and pelvic-floor muscles. Those muscles and a complete nerve pathway are not represented here.',
    refs: ['anatomy', 'dissection'],
    family: 'uterosacral',
    question:
      'Does a single-plane thickening alone prove uterosacral endometriosis?',
    answer:
      'No. Corroborate morphology in other planes and assess the acquired signal and context; isolated thickness is not a specific diagnosis.',
  },
  cardinal: {
    anatomy:
      'Lateral cervical connective-tissue support towards the pelvic sidewall. The paired source regions retain separate identities even where their ontology term is shared.',
    function:
      'Helps support the cervix. It is not equivalent to the whole broad-ligament peritoneal sheet, and its outline does not establish the full vascular or ureteral course.',
    refs: ['dissection'],
    family: 'cardinal',
    question:
      'Is the cardinal support region identical to the broad-ligament peritoneal sheet?',
    answer:
      'No. Distinguish lateral cervical supporting connective tissue from the broad peritoneal fold; neither rendered boundary is an operative plane.',
  },
  suspensory: {
    anatomy:
      'The lateral ovarian peritoneal fold associated with the ovarian vessels crossing the pelvic brim; also called the infundibulopelvic ligament.',
    function:
      'Provides a route for ovarian vessels, lymphatics and autonomic nerves. Selecting this surface does not reveal those missing contents or prove their continuity.',
    refs: ['anatomy', 'dissection'],
    family: 'adnexalSupport',
    question:
      'Which ovarian attachment carries the lateral ovarian neurovascular route?',
    answer:
      'The suspensory ligament; the proper ovarian ligament connects the ovary towards the uterus.',
  },
  ovarianLigament: {
    anatomy:
      'The proper ovarian ligament connects the ovary to the uterus below the tubal attachment. It is distinct from the more lateral suspensory ligament.',
    function:
      'Tethers the ovary towards the uterus. It is a gubernacular remnant, not a duct connecting ovarian tissue to the uterine cavity.',
    refs: ['dissection'],
    family: 'adnexalSupport',
    question:
      'Does the proper ovarian ligament transmit an oocyte into the uterine cavity?',
    answer:
      'No. It is an attachment, not a reproductive duct; the uterine tube provides the relevant transport pathway.',
  },
  broadLigament: {
    anatomy:
      'A paired-layer peritoneal fold relating uterus and adnexa to the pelvic walls. Its named regions include mesometrium, mesosalpinx and mesovarium.',
    function:
      'Organizes peritoneal relationships around uterus, tube and ovary. Do not interpret its name as a thick load-bearing cord or a complete pelvic-support model.',
    refs: ['anatomy', 'dissection'],
    family: 'peritoneal',
    question: 'Which two named regions relate specifically to tube and ovary?',
    answer:
      'Mesosalpinx relates to the uterine tube; mesovarium attaches the ovary. Mesometrium is the uterine portion.',
  },
  mesosalpinx: {
    anatomy:
      'The broad-ligament portion associated with the uterine tube, distinct from the mesovarium beside the ovary.',
    function:
      'Supports the tubal relationship within the peritoneal fold. Its surface does not demonstrate a tubal lumen, patency or intramural continuation.',
    refs: ['anatomy'],
    family: 'peritoneal',
    question: 'Is the mesosalpinx a segment of the uterine-tube lumen?',
    answer:
      'No. It is a related peritoneal fold, not the ampulla, isthmus or another luminal segment.',
  },
  mesovarium: {
    anatomy:
      'A short peritoneal attachment between the ovary and broad ligament. It is distinct from both the uterine-tube fold and the lateral suspensory ligament.',
    function:
      'Provides the ovarian mesenteric attachment. It does not form a complete peritoneal envelope enclosing the ovarian surface.',
    refs: ['anatomy', 'dissection'],
    family: 'peritoneal',
    question: 'Does the mesovarium enclose the entire ovarian surface?',
    answer:
      'No. It is a local mesenteric attachment; the exposed ovarian surface and its other attachments remain distinct.',
  },
  vesicouterine: {
    anatomy:
      'The anterior peritoneal recess at the reflection between bladder and uterus. The source name uterovesical refers here to the vesicouterine pouch.',
    function:
      'Defines a peritoneal relationship rather than an organ, duct or fibrous ligament. Its displayed surface is not a measured cavity or a fluid collection.',
    refs: ['dissection'],
    family: 'pouch',
    question: 'Is the vesicouterine pouch the pouch of Douglas?',
    answer:
      'No. The vesicouterine recess is anterior to the uterus; the rectouterine pouch of Douglas lies posteriorly.',
  },
  ovary: {
    anatomy:
      'The paired gonad lies beside the uterus, related to the uterine tube and its supporting folds. Its source position is not a universal patient position.',
    function:
      'Produces oocytes and ovarian hormones. Follicles, cortex and medulla are not separately selectable.',
    refs: ['anatomy', 'ovaries'],
    family: 'ovary',
    question: 'Does a cyst beside an ovary necessarily arise from that ovary?',
    answer:
      'No. Establish its organ of origin; paraovarian and tubal lesions may be nearby.',
  },
  ampulla: {
    anatomy:
      'The broad tubal segment between the isthmus and infundibulum. Compare it with the narrow medial segment on the same side.',
    function:
      'Participates in transport along the uterine tube. A selected surface does not demonstrate a connected, patent lumen.',
    refs: ['anatomy', 'tract'],
    family: 'tube',
    question: 'Which named tubal region lies between isthmus and infundibulum?',
    answer:
      'The ampulla. Its displayed separation from neighbouring parts is artificial.',
  },
  isthmus: {
    anatomy:
      'The narrow tubal segment near the uterus, medial to the ampulla. It is not the uterine isthmus between corpus and cervix.',
    function:
      'Forms part of the passage towards the uterus. The intramural tubal course is not established by this source segment.',
    refs: ['anatomy', 'tract'],
    family: 'tube',
    question: 'Are the tubal isthmus and uterine isthmus the same structure?',
    answer:
      'No. One is a uterine-tube segment; the other is the transition between uterine body and cervix.',
  },
  infundibulum: {
    anatomy:
      'The funnel-like distal tubal region next to the fimbriae. It is distinct from both the ampulla and the ovarian surface.',
    function:
      'Receives the oocyte into the tubal pathway. The tube does not form a sealed direct conduit from ovarian tissue.',
    refs: ['anatomy', 'tract'],
    family: 'tube',
    question: 'Is the ovary directly continuous with a sealed tubal lumen?',
    answer:
      'No. The distal tube relates to the ovary through an open peritoneal arrangement, not a sealed ovarian duct.',
  },
  fimbriae: {
    anatomy:
      'Fringed projections around the distal tubal opening. This is not another name for the whole infundibulum.',
    function:
      'Helps guide the released oocyte towards the tubal opening. Ciliary activity and movement are not simulated.',
    refs: ['anatomy', 'tract'],
    family: 'tube',
    question: 'Are fimbriae and infundibulum interchangeable labels?',
    answer: 'No. Fimbriae fringe the funnel-like infundibular opening.',
  },
  body: {
    anatomy:
      'The principal uterine region between fundus and the inferior transition towards the cervix. It is a regional selection, not an isolated myometrial layer.',
    function:
      'Provides the uterine environment for pregnancy and contributes muscular activity. Neither pregnancy nor contraction is simulated.',
    refs: ['anatomy', 'tract'],
    family: 'uterus',
    question:
      'Does hiding the uterine body expose a validated endometrial layer?',
    answer:
      'No. These are regional source surfaces; endometrium and junctional zone are not separate meshes.',
  },
  fundus: {
    anatomy:
      'The uterine portion above the tubal entry level. Its external contour is distinct from the shape of the endometrial cavity.',
    function:
      'Part of the muscular uterus rather than a separate organ. Its source orientation does not describe every uterine version or flexion.',
    refs: ['anatomy', 'tract'],
    family: 'fundus',
    question:
      'Can the external fundal contour alone classify a uterine anomaly?',
    answer:
      'No. The cavity, fundal contour and associated genital/urinary anatomy must be assessed together.',
  },
  lower: {
    anatomy:
      'The source-labelled inferior uterine transition towards the cervix. Do not equate its outline with a pregnancy-specific lower-segment measurement.',
    function:
      'Connects the uterine body region towards the cervix. The non-pregnant static source does not model obstetric remodelling.',
    refs: ['anatomy', 'tract'],
    family: 'uterus',
    question:
      'Can this source-labelled lower segment measure a Caesarean scar or pregnant lower segment?',
    answer:
      'No. It contains neither a patient scar nor a pregnant uterine wall or calibrated scan.',
  },
  cervix: {
    anatomy:
      'The inferior uterine portion surrounding the cervical canal and projecting into the upper vagina, where the fornices surround it.',
    function:
      'Connects the uterine cavity and vagina through the cervical canal. Mucus, epithelial zones and cervical remodelling are not simulated.',
    refs: ['cervix', 'tract'],
    family: 'cervix',
    question:
      'Does normal-looking cervical mesh geometry exclude epithelial disease?',
    answer:
      'No. A gross surface does not show the epithelial changes assessed by cervical screening.',
  },
  internalOs: {
    anatomy:
      'The opening at the uterine end of the cervical canal. It is distinct from the external opening towards the vagina.',
    function:
      'Marks communication between uterine cavity and cervical canal. A source surface cannot establish canal patency.',
    refs: ['cervix'],
    family: 'cervix',
    question: 'Which opening is at the uterine end of the cervical canal?',
    answer: 'The internal os; the external os is at the vaginal end.',
  },
  externalOs: {
    anatomy:
      'The opening of the cervical canal towards the vagina. Its appearance varies; this source is not a universal shape template.',
    function:
      'Marks the vaginal end of the cervical canal. Selecting it does not measure dilatation or demonstrate a patent passage.',
    refs: ['cervix'],
    family: 'cervix',
    question: 'Does the external os open directly into the uterine body?',
    answer:
      'No. It opens towards the vagina; the cervical canal leads to the internal os and uterine cavity.',
  },
  vagina: {
    anatomy:
      'The fibromuscular canal below the cervix, between the anterior urinary structures and posterior rectum. Fornices surround the projecting cervix superiorly.',
    function:
      'Provides passage for menstrual flow and forms part of the birth canal. Distension and pelvic-floor support are not simulated.',
    refs: ['tract', 'cervix'],
    family: 'vagina',
    question:
      'Does removing the vaginal surface reveal a complete pelvic-floor dissection?',
    answer:
      'No. Pelvic-floor muscles, full supporting fascia and nerves are not supplied in this separate model.',
  },
} as const satisfies Record<string, Concept>;
export type HraPelvicConcept = keyof typeof hraPelvicConcepts;

// Explicit source-local mapping; no ontology/name-based transfer to another donor.
const prefix = 'vm:reference:hra-united-female-v1-10:pelvis:';
export const hraPelvicLessonBindings: Readonly<
  Record<string, HraPelvicConcept>
> = {
  [prefix + 'cervicovaginal-junction']: 'junction',
  [prefix + 'rectum']: 'rectum',
  [prefix + 'fundus-of-urinary-bladder-dome']: 'bladderDome',
  [prefix + 'fundus-of-urinary-bladder-base']: 'bladderBase',
  [prefix + 'urinary-bladder-neck-smooth-muscle']: 'bladderNeck',
  [prefix + 'left-uterine-artery']: 'uterineArtery',
  [prefix + 'right-uterine-artery']: 'uterineArtery',
  [prefix + 'left-uterine-vein']: 'uterineVein',
  [prefix + 'right-uterine-vein']: 'uterineVein',
  [prefix + 'sacrum']: 'sacrum',
  [prefix + 'right-uterosacral-ligament']: 'uterosacral',
  [prefix + 'left-uterosacral-ligament']: 'uterosacral',
  [prefix + 'right-cardinal-ligament-of-uterus']: 'cardinal',
  [prefix + 'left-cardinal-ligament-of-uterus']: 'cardinal',
  [prefix + 'suspensory-ligament-of-ovary-r']: 'suspensory',
  [prefix + 'suspensory-ligament-of-ovary-l']: 'suspensory',
  [prefix + 'ovarian-ligament-r']: 'ovarianLigament',
  [prefix + 'ovarian-ligament-l']: 'ovarianLigament',
  [prefix + 'broad-ligament']: 'broadLigament',
  [prefix + 'mesosalpinx-r']: 'mesosalpinx',
  [prefix + 'mesosalpinx-l']: 'mesosalpinx',
  [prefix + 'mesovarium-r']: 'mesovarium',
  [prefix + 'mesovarium-l']: 'mesovarium',
  [prefix + 'uterovesical-pouch']: 'vesicouterine',
  [prefix + 'left-ovary']: 'ovary',
  [prefix + 'right-ovary']: 'ovary',
  [prefix + 'ampulla-of-uterine-tube-l']: 'ampulla',
  [prefix + 'ampulla-of-uterine-tube-r']: 'ampulla',
  [prefix + 'isthmus-of-fallopian-tube-l']: 'isthmus',
  [prefix + 'isthmus-of-fallopian-tube-r']: 'isthmus',
  [prefix + 'uterine-tube-infundibulum-l']: 'infundibulum',
  [prefix + 'uterine-tube-infundibulum-r']: 'infundibulum',
  [prefix + 'fibria-of-uterine-tube-l']: 'fimbriae',
  [prefix + 'fibria-of-uterine-tube-r']: 'fimbriae',
  [prefix + 'body-of-uterus']: 'body',
  [prefix + 'fundus-of-uterus']: 'fundus',
  [prefix + 'lower-uterine-segment']: 'lower',
  [prefix + 'cervix']: 'cervix',
  [prefix + 'internal-cervical-os']: 'internalOs',
  [prefix + 'external-cervical-os']: 'externalOs',
  [prefix + 'vagina']: 'vagina',
};
export function authoredHraPelvicLesson(key: HraPelvicConcept): SpecimenLesson {
  const c = hraPelvicConcepts[key],
    lessonTopics = topics[c.family];
  return JSON.parse(
    JSON.stringify({
      anatomy: c.anatomy,
      function: c.function,
      references: refs(...c.refs),
      extended: {
        modelLimit:
          'Partial source surfaces only. No measured tissue signal, patient pathology, lumen continuity, operative plane or scan registration. Source gaps and separation offsets are not disease.',
        topics: lessonTopics,
        selfCheck: {
          question: c.question,
          answer: c.answer,
          references: [
            ...new Set([
              ...refs(...c.refs),
              ...Object.entries(lessonTopics)
                .filter(([tab]) => !modalityCompletionTopics[c.family]?.includes(tab as keyof TopicSet))
                .flatMap(([, topic]) => topic.references),
            ]),
          ],
        },
      },
    }),
  ) as SpecimenLesson;
}

// Additional modality references belong to the new topic notes, not silently to
// the existing self-check. Preserve its original revision-bound evidence set.
const modalityCompletionTopics: Partial<Record<keyof typeof topics, readonly (keyof TopicSet)[]>> = {
  junction: ['xray'], rectum: ['xray'], uterineArtery: ['xray'], uterineVein: ['xray'],
  sacrum: ['ultrasound'], uterosacral: ['ct', 'xray'], cardinal: ['ct', 'xray'],
  peritoneal: ['ct', 'xray'], adnexalSupport: ['ct', 'xray'], pouch: ['ct', 'xray'],
  ovary: ['xray'], tube: ['ct', 'xray'], uterus: ['ct', 'xray'], fundus: ['ct', 'xray'],
  cervix: ['ct', 'xray'], vagina: ['ct', 'xray', 'ultrasound'],
};
