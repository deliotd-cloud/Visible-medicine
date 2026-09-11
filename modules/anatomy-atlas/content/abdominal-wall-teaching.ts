// Original factual teaching and self-checks, not imported publisher prose or
// illustrations. Source mesh/identity adaptations retain their separate licence.
import type { SpecimenLesson } from './um-limb-teaching';
import type { SpecimenTopicDraft } from './um-limb-clinical';

export const abdominalTeachingReferences = {
  attachments: { title: 'Texas Tech · Abdominal muscle anatomy', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_abdomen.html' },
  layers: { title: 'StatPearls · Abdominal wall muscles', url: 'https://www.ncbi.nlm.nih.gov/books/NBK470334/' },
  nerves: { title: 'StatPearls · Abdominal wall nerves', url: 'https://www.ncbi.nlm.nih.gov/books/NBK556034/' },
  wall: { title: 'StatPearls · Anterolateral abdominal wall', url: 'https://www.ncbi.nlm.nih.gov/books/NBK525975/' },
  rotation: { title: 'Study · Muscle activity during trunk rotation', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4793016/' },
  function: { title: 'Read et al. · Imaging insights into abdominal wall function', url: 'https://www.frontiersin.org/journals/surgery/articles/10.3389/fsurg.2022.799277/full' },
  ultrasound: { title: 'Draghi et al. · Abdominal wall sonography', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7441131/' },
  masses: { title: 'Ballard et al. · Imaging abdominal wall masses', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7263290/' },
  hernia: { title: 'ACR Appropriateness Criteria · Hernia', url: 'https://acsearch.acr.org/docs/3158169/Narrative/' },
} as const;
export const abdominalReferenceTitles = Object.fromEntries(Object.values(abdominalTeachingReferences).map(r => [r.url, r.title]));
type Ref = keyof typeof abdominalTeachingReferences;
const refs = (...keys: Ref[]) => keys.map(key => abdominalTeachingReferences[key].url);
const draft = (body: string, ...keys: Ref[]): SpecimenTopicDraft => ({ readiness: 'draft', body, references: refs(...keys) });
const selfCheck = (question: string, answer: string, ...keys: Ref[]) => ({ question, answer, references: refs(...keys) });
const radiography = draft('Plain radiographs do not separate the individual abdominal muscle layers. A normal film does not establish an intact wall. For suspected abdominal-wall hernia, ACR favours ultrasound or CT over routine abdominal radiography; the clinical question determines imaging.', 'hernia');
const lowerThoracic = 'Segmental lower thoracic anterior rami, including the subcostal nerve. This is typical supply, not a donor-specific nerve map.';
const lowerThoracicLumbar = 'Lower thoracic anterior rami and L1 contributions through iliohypogastric/ilioinguinal branches; regional supply varies. No individual nerve route is reconstructed.';

export type AbdominalMuscleFamily = 'external' | 'internal' | 'transverse' | 'rectus';
const families: Record<AbdominalMuscleFamily, SpecimenLesson> = {
  external: {
    anatomy: 'The superficial lateral muscle sheet lies outside internal oblique. Most fibres descend towards the midline; its medial aponeurosis contributes to the anterior rectus sheath. The inferior aponeurotic border forms the inguinal ligament, not a separately selectable structure here.',
    function: 'Assists opposite-side trunk rotation, same-side bending and abdominal compression. Both sides contribute to trunk flexion and forceful expiration.',
    attachments: { proximal: 'Outer surfaces of ribs 5–12.', distal: 'Anterior iliac crest and, through its aponeurosis, the linea alba and pubic region.', motor: lowerThoracic },
    references: refs('attachments', 'layers', 'rotation', 'nerves'),
    extended: {
      modelLimit: 'A whole source surface, not separately segmented fibres, aponeurosis or inguinal ligament. Source fragments and gaps are not tears or hernias.',
      topics: {
        clinical: draft('Knowing the external oblique aponeurosis helps orient the superficial inguinal region. Its muscle belly alone cannot show the inguinal canal walls, rings or their contents.', 'wall'),
        pathology: draft('A bulge may reflect a wall defect or impaired muscular function. Seeing external oblique over a bulge does not establish whether deeper fascia is intact.', 'function'),
        ct: draft('Identify the outermost lateral muscle layer, then follow the internal oblique and transversus deeper to it. Look across adjacent sections; a single outline is not a complete wall assessment.', 'function'),
        mri: draft('Follow the superficial lateral sheet towards its aponeurosis in more than one plane. Inferior fibres do not keep one uniform direction throughout the wall.', 'function'),
        ultrasound: draft('In the lateral wall, external oblique is the most superficial of the three muscle layers beneath subcutaneous tissue. Identify deeper layers before naming a focal abnormality.', 'ultrasound'),
        xray: radiography,
      },
      selfCheck: selfCheck('Does an intact-looking external oblique exclude an abdominal-wall hernia?', 'No. Assessment must include the deeper wall and fascial continuity, not just its outer muscle surface.', 'function'),
    },
  },
  internal: {
    anatomy: 'The middle lateral layer sits between external oblique and transversus. Many fibres ascend medially, but inferior fibres differ. Its aponeurosis contributes to the rectus sheath; that arrangement changes across the arcuate line.',
    function: 'Assists same-side trunk rotation and bending. The opposite external oblique can work with it during rotation; bilateral activity also compresses the abdomen.',
    attachments: { proximal: 'Thoracolumbar fascia, iliac crest and lateral inguinal ligament.', distal: 'Lower ribs, linea alba and pubic attachment through its aponeurosis.', motor: lowerThoracicLumbar },
    references: refs('attachments', 'layers', 'rotation', 'nerves'),
    extended: {
      modelLimit: 'Neither the split sheath nor individual cremasteric fibres are resolved. Separation between surfaces is a display arrangement, not a safe operative plane.',
      topics: {
        clinical: draft('Abdominal-wall nerves course between internal oblique and transversus before branching. This explains the relevance of the layer interface; the atlas cannot guide a block or identify a safe needle path.', 'nerves', 'wall'),
        pathology: draft('Loss of innervation can weaken the abdominal wall. A static internal-oblique surface cannot distinguish normal recruitment from denervation or demonstrate a sensory deficit.', 'wall'),
        ct: draft('Locate the middle lateral muscle between the outer external oblique and deeper transversus. Trace it towards the rectus sheath without assuming one identical sheath pattern at every level.', 'wall', 'function'),
        mri: draft('Use adjacent sections to follow internal oblique rather than identifying it from fibre direction alone. Lower wall orientation differs from the upper wall.', 'function'),
        ultrasound: draft('Recognize internal oblique between the other two lateral layers. Its deep interface with transversus has neurovascular importance; this mesh does not display the actual nerves or sonographic fascial lines.', 'ultrasound', 'nerves'),
        xray: radiography,
      },
      selfCheck: selfCheck('Is the important deep interface beside internal oblique the same as the gap made by Explode?', 'No. Typical nerves travel between internal oblique and transversus, but artificial model separation does not reconstruct that plane or its contents.', 'nerves'),
    },
  },
  transverse: {
    anatomy: 'Transversus is the deepest lateral muscle, superficial to transversalis fascia. Its largely transverse fibres become aponeurotic medially. The muscle and the fascia with a similar name are different structures.',
    function: 'Contributes to abdominal compression and coordinated trunk support. Its action is not an isolated hinge movement or a guaranteed correction for back pain.',
    attachments: { proximal: 'Inner lower costal cartilages, thoracolumbar fascia, iliac crest and lateral inguinal ligament.', distal: 'Linea alba and pubic attachments through the aponeurosis.', motor: lowerThoracicLumbar },
    references: refs('attachments', 'layers', 'function', 'nerves'),
    extended: {
      modelLimit: 'Transversalis fascia, peritoneum and a complete neurovascular plane are absent. Source surface thickness is not a muscle-activation measurement.',
      topics: {
        clinical: draft('The transversus abdominis plane is named for the interface superficial to this muscle and deep to internal oblique. It is not the space deep to transversalis fascia; no procedural guidance is provided here.', 'nerves', 'wall'),
        pathology: draft('Muscular dysfunction can coexist with a fascial defect or occur without one. A resting source mesh cannot test transversus recruitment or diagnose the cause of a bulge.', 'function'),
        ct: draft('Trace the deepest lateral muscle separately from adjacent fat and fascial boundaries. Fascial continuity matters when evaluating a suspected defect; the atlas supplies only the muscle surface.', 'function'),
        mri: draft('Follow this deep layer across planes, keeping it distinct from internal oblique. Its upper portion may extend behind rectus; a uniform three-layer diagram is a simplification.', 'function'),
        ultrasound: draft('Find transversus deep to internal oblique. The deeper abdominal tissues are not another muscle layer. Changes seen during contraction require real dynamic imaging, not the atlas separation control.', 'ultrasound'),
        xray: radiography,
      },
      selfCheck: selfCheck('Are transversus abdominis and transversalis fascia interchangeable labels?', 'No. One is muscle; the other is a deeper fascial layer that is not separately supplied in this specimen.', 'layers'),
    },
  },
  rectus: {
    anatomy: 'A longitudinal anterior muscle on each side of the linea alba. The surrounding sheath receives the lateral muscles’ aponeuroses. Superior and inferior epigastric vessels supply this region, but are not included in this specimen.',
    function: 'Contributes to trunk flexion and abdominal compression, with other muscles coordinating pelvic and trunk control. The paired source surfaces do not simulate a sit-up.',
    attachments: { proximal: 'Pubic crest and symphysis.', distal: 'Xiphoid process and costal cartilages 5–7.', motor: lowerThoracic },
    references: refs('attachments', 'layers', 'wall', 'nerves'),
    extended: {
      modelLimit: 'No complete sheath, linea alba, epigastric vessels or separately labelled tendinous intersections. An exploded gap cannot measure diastasis; source discontinuities cannot diagnose injury.',
      topics: {
        clinical: draft('Rectus diastasis and a focal hernia are different findings and can coexist. The distance between these displayed surfaces is not a patient measurement or a diagnostic threshold.', 'function'),
        pathology: draft('A rectus-sheath haematoma is bleeding within this wall region, not bowel inside a hernia sac. Trauma, exertion and anticoagulation are relevant clinical context; the model contains no haemorrhage.', 'masses'),
        ct: draft('CT can show a rectus-region haematoma and its extent. Contrast extravasation may indicate active bleeding; normal-looking atlas geometry cannot exclude that finding in a patient.', 'masses'),
        mri: draft('MRI characterizes soft tissue and blood products, whose signal varies with their evolution and sequence. Do not apply a single universal signal rule or infer a lesion from atlas colour.', 'masses'),
        ultrasound: draft('Identify rectus and its surrounding echogenic sheath, then distinguish a solid or fluid lesion from herniating contents. Dynamic evaluation belongs to a real examination, not to exploded geometry.', 'ultrasound', 'masses'),
        xray: radiography,
      },
      selfCheck: selfCheck('Does widening the two rectus surfaces in Explode demonstrate diastasis?', 'No. This moves intact source meshes for inspection; it neither images the linea alba nor measures a patient’s abdominal wall.', 'function'),
    },
  },
};

// Explicit concept-to-source selections; no inferred name matching, mirrored
// anatomy or transfer to another dataset with a similar FMA identifier.
export const abdominalLessonBindings: Readonly<Record<string, { family: AbdominalMuscleFamily; side: 'right' | 'left' }>> = {
  'bp3d3-abdominal-wall-FMA13336': { family: 'external', side: 'right' },
  'bp3d3-abdominal-wall-FMA13337': { family: 'external', side: 'left' },
  'bp3d3-abdominal-wall-FMA13892': { family: 'internal', side: 'right' },
  'bp3d3-abdominal-wall-FMA13893': { family: 'internal', side: 'left' },
  'bp3d3-abdominal-wall-FMA22344': { family: 'transverse', side: 'right' },
  'bp3d3-abdominal-wall-FMA22345': { family: 'transverse', side: 'left' },
  'bp3d3-abdominal-wall-FMA13377': { family: 'rectus', side: 'right' },
  'bp3d3-abdominal-wall-FMA13378': { family: 'rectus', side: 'left' },
};
export function authoredAbdominalLesson(family: AbdominalMuscleFamily, side: 'right' | 'left'): SpecimenLesson {
  const lesson = JSON.parse(JSON.stringify(families[family])) as SpecimenLesson;
  const opposite = side === 'right' ? 'left' : 'right';
  if (family === 'external') lesson.function += ` For this ${side} selection, the rotational contribution is towards the ${opposite}.`;
  if (family === 'internal') lesson.function += ` For this ${side} selection, the rotational contribution is towards the ${side}.`;
  return lesson;
}
