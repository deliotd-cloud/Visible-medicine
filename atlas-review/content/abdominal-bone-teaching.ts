// Original draft teaching for the exact version-3 abdominal-wall skeletal selections.
// Linked reading supplies facts, not prose, illustrations, scans or clinical approval.
import type { SpecimenLesson } from './um-limb-teaching';
import type { SpecimenTopicDraft } from './um-limb-clinical';

export const abdominalBoneTeachingReferences = {
  thorax: { title: 'Texas Tech · Bones of the thorax', url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_thorax.html' },
  thoracicJoints: { title: 'UAMS · Joints and ligaments of the thorax', url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/joint-tables/joints-and-ligaments-of-the-thorax/' },
  floatingAnatomy: { title: 'University of the West Indies · Thoracic wall teaching', url: 'https://sta.uwi.edu/fms/MDSC1001/Thorax_Thoracic_wall.pdf' },
  column: { title: 'Texas Tech · Bones of the back', url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_back.html' },
  pelvis: { title: 'Texas Tech · Bones of the lower limb', url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html' },
  ribImaging: { title: 'ACR · Rib Fractures (PubMed)', url: 'https://pubmed.ncbi.nlm.nih.gov/31054749/' },
  spineImaging: { title: 'ACR/RSNA · Suspected Spine Trauma', url: 'https://www.radiologyinfo.org/en/info/acs-spine-trauma' },
  pelvicImaging: { title: 'AAOS · Pelvic Fractures', url: 'https://www.orthoinfo.org/diseases--conditions/pelvic-fractures/' },
  pelvicStress: { title: 'ACR · Stress Fracture, 2024 (PubMed)', url: 'https://pubmed.ncbi.nlm.nih.gov/39488356/' },
  chestMRI: { title: 'ACR/RSNA · Chest MRI', url: 'https://www.radiologyinfo.org/en/info/chestmr' },
  spineMRI: { title: 'ACR/RSNA · Spine MRI', url: 'https://www.radiologyinfo.org/en/info/spinemr' },
  ultrasound: { title: 'ACR/RSNA · Musculoskeletal Ultrasound', url: 'https://www.radiologyinfo.org/en/info/musculous' },
} as const;
export const abdominalBoneReferenceTitles = Object.fromEntries(Object.values(abdominalBoneTeachingReferences).map(r => [r.url, r.title]));
type Ref = keyof typeof abdominalBoneTeachingReferences;
const urls = (...keys: Ref[]) => keys.map(key => abdominalBoneTeachingReferences[key].url);
const draft = (body: string, ...keys: Ref[]): SpecimenTopicDraft => ({ readiness: 'draft', body, references: urls(...keys) });
const check = (question: string, answer: string, ...keys: Ref[]) => ({ question, answer, references: urls(...keys) });
export type AbdominalBoneConcept = 'hip' | 'sacrum' | 'lumbar' | 'xiphoid' | 'rib7' | 'rib8to10' | 'rib11to12';
export type AbdominalBoneBinding = { concept: AbdominalBoneConcept; side: 'right' | 'left' | 'midline'; level?: number };

// No inferred FMA/name crosswalk: every key is an admitted catalog selection.
export const abdominalBoneLessonBindings: Readonly<Record<string, AbdominalBoneBinding>> = {
  'bp3d3-abdominal-wall-FMA16586': { concept: 'hip', side: 'right' },
  'bp3d3-abdominal-wall-FMA16587': { concept: 'hip', side: 'left' },
  'bp3d3-abdominal-wall-FMA16202': { concept: 'sacrum', side: 'midline' },
  'bp3d3-abdominal-wall-FMA7488': { concept: 'xiphoid', side: 'midline' },
  'bp3d3-abdominal-wall-FMA13072': { concept: 'lumbar', side: 'midline', level: 1 },
  'bp3d3-abdominal-wall-FMA13073': { concept: 'lumbar', side: 'midline', level: 2 },
  'bp3d3-abdominal-wall-FMA13074': { concept: 'lumbar', side: 'midline', level: 3 },
  'bp3d3-abdominal-wall-FMA13075': { concept: 'lumbar', side: 'midline', level: 4 },
  'bp3d3-abdominal-wall-FMA13076': { concept: 'lumbar', side: 'midline', level: 5 },
  'bp3d3-abdominal-wall-FMA8229': { concept: 'rib7', side: 'right', level: 7 },
  'bp3d3-abdominal-wall-FMA8256': { concept: 'rib7', side: 'left', level: 7 },
  'bp3d3-abdominal-wall-FMA8283': { concept: 'rib8to10', side: 'right', level: 8 },
  'bp3d3-abdominal-wall-FMA8310': { concept: 'rib8to10', side: 'left', level: 8 },
  'bp3d3-abdominal-wall-FMA8364': { concept: 'rib8to10', side: 'right', level: 9 },
  'bp3d3-abdominal-wall-FMA8391': { concept: 'rib8to10', side: 'left', level: 9 },
  'bp3d3-abdominal-wall-FMA8445': { concept: 'rib8to10', side: 'right', level: 10 },
  'bp3d3-abdominal-wall-FMA8472': { concept: 'rib8to10', side: 'left', level: 10 },
  'bp3d3-abdominal-wall-FMA8531': { concept: 'rib11to12', side: 'right', level: 11 },
  'bp3d3-abdominal-wall-FMA8532': { concept: 'rib11to12', side: 'left', level: 11 },
  'bp3d3-abdominal-wall-FMA8533': { concept: 'rib11to12', side: 'right', level: 12 },
  'bp3d3-abdominal-wall-FMA8534': { concept: 'rib11to12', side: 'left', level: 12 },
};

const modelLimit = 'This is one original BodyParts3D version-3 reduced-source bony surface in a partial abdominal-wall specimen, not a registered patient or version-4 model. Cartilage, discs, marrow, ligaments, pleura, viscera and injury are not reconstructed. Source gaps and display separation are not pathology.';

function ribLesson({ concept, side, level }: AbdominalBoneBinding): SpecimenLesson {
  if (!level || side === 'midline') throw Error('Invalid rib binding');
  const relation = concept === 'rib7' ? 'a true rib: its costal cartilage normally joins the sternum directly'
    : concept === 'rib8to10' ? 'a false rib: its cartilage normally joins the next higher costal cartilage, eventually reaching rib 7 rather than the sternum directly'
    : 'a floating false rib: its short anterior cartilage ends in the lateral wall without a sternal attachment';
  const name = `${side} rib ${level}`;
  const posterior = concept === 'rib11to12'
    ? 'Its head meets the corresponding thoracic vertebral body; unlike ribs 7–10, it does not form a costotransverse articulation with a transverse process.'
    : 'A typical rib has a posterior head and tubercle, an angled shaft and an inferior costal groove for the intercostal neurovascular bundle; those relationships are anatomical guides, not certified landmarks on this mesh.';
  return {
    anatomy: `The ${name} curves along the ${side} lower chest wall. ${posterior} It is ${relation}. Costal cartilage and thoracic vertebrae needed to inspect the full pathway are absent from this specimen.`,
    function: `Rib ${level} contributes to the protective thoracic cage and to chest-wall movement with breathing. Its bony contour also provides regional muscle attachment context; this static surface cannot show breathing or muscle force.`,
    references: urls('thorax', 'thoracicJoints', ...(concept === 'rib11to12' ? ['floatingAnatomy' as const] : [])),
    extended: { modelLimit, topics: {
      clinical: draft(`A ${side} lower-rib complaint requires attention to the surrounding chest and upper abdomen as well as rib ${level}. The selected bone cannot assess pleura, lung or abdominal organs, and its source label is not a patient finding.`, 'thorax', 'ribImaging'),
      pathology: draft(`Fracture can interrupt a rib's cortex, but this ${name} source has no authored disease overlay or validated injury status. A source seam, rough contour or artificial separation cannot be interpreted as fracture or displacement.`, 'ribImaging'),
      ct: draft(`On an acquired CT series, follow the curved ${name} across adjacent sections and review nearby thoracic structures. CT may define a suspected fracture and associated findings when clinically indicated; this mesh contains neither voxels nor those tissues.`, 'ribImaging'),
      mri: draft(`Chest MRI can address selected rib and chest-wall soft-tissue questions, but rib ${level} has no marrow signal or surrounding tissue data in this model. Image interpretation depends on the actual sequences and clinical question.`, 'chestMRI'),
      xray: draft(`A chest radiograph projects the ${side} ribs over lung and other structures; count the levels on the acquired image before naming rib ${level}. Projection overlap can obscure a fracture, and rotating this mesh is not a radiograph.`, 'ribImaging'),
      ultrasound: draft(`Ultrasound may show an accessible outer rib cortex, but sound penetration through bone is limited and deeper thoracic injury is not excluded. This surface supplies no sonographic window or diagnostic result.`, 'ultrasound', 'ribImaging'),
    }, selfCheck: check(`Does rib ${level} on the ${side} attach directly to the sternum?`, concept === 'rib7' ? 'Its costal cartilage normally does; the cartilage is not included here.' : concept === 'rib8to10' ? 'No. Its cartilage joins the costal margin indirectly through the next higher cartilage; that cartilage is not modelled.' : 'No. It is a floating rib whose anterior end lacks a sternal attachment.', 'thorax') },
  };
}

function hipLesson(side: 'right' | 'left'): SpecimenLesson { return {
  anatomy: `The ${side} adult hip bone contains ilium, ischium and pubis. Its iliac crest forms the superior margin, the lateral acetabulum faces the femoral head, and the obturator foramen lies below. Posteriorly the ilium meets the sacrum; anteriorly the pubis meets the opposite side. These landmarks are not separately certified on the source mesh.`,
  function: `The ${side} hip bone helps transfer load between trunk and lower limb. The iliac crest is an abdominal-wall muscle attachment region, and the pubic crest relates to rectus abdominis. Exact attachment footprints are not mapped here.`,
  references: urls('pelvis'),
  extended: { modelLimit: `${modelLimit} The coccyx, pubic symphyseal fibrocartilage, sacroiliac ligaments and hip joint soft tissues are not complete selections.`, topics: {
    clinical: draft(`Assess a concern involving the ${side} hip bone within the entire pelvic ring and adjacent hip joint. The selected surface alone cannot establish stability, organ injury or a side-specific clinical diagnosis.`, 'pelvis'),
    pathology: draft(`Fracture can involve the pubic rami, acetabulum or other pelvic regions; patterns have different consequences. No fracture line or traumatic separation is present in this ${side} source bone.`, 'pelvicImaging'),
    ct: draft(`CT can define the extent of pelvic bone injury in cross-section and help relate a fracture to the acetabulum or posterior ring. Compare the actual imaging series; this ${side} mesh supplies no fracture or organ findings.`, 'pelvicImaging'),
    mri: draft(`MRI may help evaluate an occult pelvic stress or insufficiency fracture when radiographs are inconclusive. The ${side} reference surface contains no marrow signal, edema or ligament assessment.`, 'pelvicStress'),
    xray: draft(`A pelvic radiograph overlaps both hip bones and the sacrum. Identify the ${side} acetabulum and pubic rami within the whole ring; a rotated isolated mesh is not a calibrated projection or stability test.`, 'pelvis', 'pelvicImaging'),
    ultrasound: draft(`Ultrasound shows accessible outer bone surfaces but does not survey the full deep ${side} hip bone or pelvic ring through bone. This source offers no acoustic image or exclusion of fracture.`, 'ultrasound'),
  }, selfCheck: check(`Does one selected ${side} hip bone establish that the pelvic ring is stable?`, 'No. The ring and its ligaments, joints and patient imaging must be assessed together; model separation is artificial.', 'pelvis') },
}; }

function sacrumLesson(): SpecimenLesson { return {
  anatomy: 'The midline sacrum is formed from fused sacral vertebrae. Its superior base meets L5, lateral auricular surfaces face the paired ilia, and paired sacral foramina mark routes for nerve branches rather than holes caused by injury.',
  function: 'The sacrum transmits load from the lumbar column into both sides of the pelvis and forms the posterior pelvic ring. Its bony surface does not test sacroiliac ligament competence.',
  references: urls('column', 'pelvis'),
  extended: { modelLimit: `${modelLimit} Sacroiliac joint cartilage, stabilizing ligaments, nerves and coccyx are not a complete functional assembly.`, topics: {
    clinical: draft('A sacral concern belongs in the context of the posterior pelvic ring, neural symptoms and the actual examination. Visible sacral foramina are normal landmarks; this mesh cannot establish nerve function or ring stability.', 'column', 'pelvis'),
    pathology: draft('Sacral fractures or insufficiency injuries may be subtle and may involve the foramina. No such lesion is represented; a source opening or an offset hip bone is not a fracture or unstable sacroiliac joint.', 'pelvicImaging'),
    ct: draft('On CT, trace sacral bone and foramina across the acquired planes when a fracture is suspected. This surface can orient the region but cannot supply cortical breaks, hemorrhage or associated pelvic findings.', 'pelvicImaging'),
    mri: draft('MRI can evaluate marrow findings in suspected sacral stress or insufficiency injury when indicated. The atlas has no marrow signal and cannot distinguish an occult injury from normal anatomy.', 'pelvicStress'),
    xray: draft('The sacrum overlaps bowel and pelvic structures on radiographs, limiting a single projected view. Examine the acquired pelvis rather than interpreting the exposed rotating sacral mesh as an X-ray.', 'pelvicImaging'),
    ultrasound: draft('Ultrasound has difficulty penetrating the sacral bone and cannot display the entire deep body or canal. A superficial view cannot establish integrity of the whole sacrum or pelvic ring; no acoustic data exist here.', 'ultrasound'),
  }, selfCheck: check('Do paired sacral foramina in this surface indicate traumatic defects?', 'No. They are normal passages. A clinical injury requires assessment using actual patient findings and images.', 'column') },
}; }

function lumbarLesson(level: number): SpecimenLesson { return {
  anatomy: `L${level} is one of five lumbar vertebrae. Orient its large anterior body, posterior arch and spinous process; the vertebral foramen contributes to the spinal canal. The catalog identifies this source as L${level}, but neighbouring levels and discs are only partial context here.`,
  function: `L${level} contributes to weight bearing, lumbar movement and a protective bony canal. Movement and stability depend on discs, ligaments and muscles that a single static bone cannot demonstrate.`,
  references: urls('column'),
  extended: { modelLimit: `${modelLimit} The five lumbar source bones do not include a complete thoracic column, discs, canal contents or patient-level numbering evidence.`, topics: {
    clinical: draft(`A concern attributed to L${level} requires clinical findings and patient imaging to confirm the level and involved tissues. The source label cannot localize a patient's pain, nerve root deficit or instability.`, 'column', 'spineImaging'),
    pathology: draft(`Compression injury may change vertebral-body height, while other fracture patterns affect posterior elements. This L${level} bone is a reference shape; its source contour and exploded position are not disease.`, 'spineImaging'),
    ct: draft(`CT can examine L${level} cortical bone and posterior elements in an acquired injury series. Check adjacent levels and the real imaging plane; this source has no fragments, canal compromise measurement or patient registration.`, 'spineImaging'),
    mri: draft(`MRI can assess marrow, discs and neural structures near L${level} when the clinical question calls for them. None of their signals or integrity can be inferred from the coloured bone mesh.`, 'spineMRI', 'spineImaging'),
    xray: draft(`A lumbar radiograph compares vertebral heights and alignment across levels. Naming L${level} requires counting within the acquired anatomy; an isolated rotated mesh cannot establish a patient's level or alignment.`, 'column', 'spineImaging'),
    ultrasound: draft(`Ultrasound cannot penetrate the L${level} bony arch to survey the canal and deep vertebral body. An accessible outer contour cannot clear a fracture, disc or nerve-root concern from this mesh.`, 'ultrasound'),
  }, selfCheck: check(`Can the L${level} catalog label prove the same vertebral level in a patient's scan?`, 'No. Patient level counting requires the acquired anatomical context, including possible variation.', 'column') },
}; }

function xiphoidLesson(): SpecimenLesson { return {
  anatomy: 'The xiphoid process forms the inferior end of the sternum, near the upper midline abdominal wall. It may be cartilaginous earlier in life and ossifies variably; the sternum body and costal cartilages are not complete selectable context here.',
  function: 'The xiphoid is a midline bony and cartilaginous landmark and an attachment region for the anterior abdominal wall and diaphragm. A source surface does not show those attachment footprints or respiratory movement.',
  references: urls('thorax'),
  extended: { modelLimit: `${modelLimit} Xiphoid size, shape and ossification vary; this one source form cannot be generalized to every patient.`, topics: {
    clinical: draft('A palpable lower-sternal tip may be mistaken for an abnormal lump, but pain or a new mass needs its own clinical assessment. This xiphoid surface cannot diagnose the cause or depict adjacent mediastinal and abdominal structures.', 'thorax'),
    pathology: draft('Trauma may injure the lower sternum, while normal xiphoid shape and ossification vary. This single reference contour cannot distinguish a patient fracture from a normal variant.', 'thorax'),
    ct: draft('On CT, locate the xiphoid below the sternal body and inspect the acquired bone and adjacent tissues in more than one plane if clinically relevant. The atlas gives no patient cortex or injury findings.', 'thorax'),
    mri: draft('Chest MRI may characterize a selected sternal or adjacent chest-wall question, but this xiphoid surface has no sequence-dependent signal, cartilage detail or lesion. Its appearance cannot be used to interpret a patient MRI.', 'chestMRI'),
    xray: draft('The xiphoid can overlap other structures in projection and may be variably ossified. A frontal radiograph alone need not display its full shape; rotating this bone is not a second X-ray view.', 'thorax'),
    ultrasound: draft('Ultrasound may show an accessible outer xiphoid contour, but bone limits deeper penetration and xiphoid shape varies. This mesh provides no sonographic tissue interface or diagnosis.', 'ultrasound', 'thorax'),
  }, selfCheck: check('Does one xiphoid outline establish a normal appearance for every adult?', 'No. Shape and ossification vary; this is one partial source representation, not a patient reference standard.', 'thorax') },
}; }

export function authoredAbdominalBoneLesson(binding: AbdominalBoneBinding): SpecimenLesson {
  const lesson = binding.concept === 'hip' ? hipLesson(binding.side as 'right' | 'left')
    : binding.concept === 'sacrum' ? sacrumLesson()
    : binding.concept === 'lumbar' ? lumbarLesson(binding.level!)
    : binding.concept === 'xiphoid' ? xiphoidLesson() : ribLesson(binding);
  return JSON.parse(JSON.stringify(lesson)) as SpecimenLesson;
}
