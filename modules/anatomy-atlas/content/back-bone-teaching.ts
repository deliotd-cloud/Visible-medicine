// Original factual synthesis; source prose, tables, figures and scans are not
// redistributed. These facts do not validate the independent v3 source meshes.
import type { SpecimenLesson } from './um-limb-teaching';
import type {
  SpecimenClinicalLesson,
  SpecimenTopicDraft,
} from './um-limb-clinical';

export const backBoneReferences = {
  back: {
    title: 'Texas Tech · bones of the back',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_back.html',
  },
  column: {
    title: 'OpenStax · vertebral column',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-3-the-vertebral-column',
  },
  upper: {
    title: 'Texas Tech · upper-limb bones',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html',
  },
  lower: {
    title: 'Texas Tech · lower-limb bones',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html',
  },
  trauma: {
    title: 'ACR · Acute Spinal Trauma, 2024 update',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40409895/',
  },
  spineImaging: {
    title: 'ACR/RSNA · suspected spine trauma',
    url: 'https://www.radiologyinfo.org/en/info/acs-spine-trauma',
  },
  upperCervicalRadiographs: {
    title: 'AO Surgery Reference · upper-cervical radiographic landmarks',
    url: 'https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/further-reading/patient-examination-radiological-evaluation-xr-ct-mri',
  },
  cervicalRadiographs: {
    title: 'Royal Children’s Hospital · cervical radiographic landmarks (paediatric context)',
    url: 'https://www.rch.org.au/trauma-service/manual/Radiology/',
  },
  compression: {
    title: 'AAOS · osteoporosis and spinal fractures',
    url: 'https://www.orthoinfo.org/diseases--conditions/osteoporosis-and-spinal-fractures/',
  },
  pelvis: {
    title: 'AAOS · pelvic fractures',
    url: 'https://www.orthoinfo.org/diseases--conditions/pelvic-fractures/',
  },
  shoulder: {
    title: 'AAOS · shoulder trauma',
    url: 'https://www.orthoinfo.org/diseases--conditions/shoulder-trauma-fractures-and-dislocations/',
  },
  ultrasound: {
    title: 'ACR/RSNA · musculoskeletal ultrasound and its bone limits',
    url: 'https://www.radiologyinfo.org/en/info/musculous',
  },
  shoulderImaging: {
    title: 'ACR · Acute Shoulder Pain, 2024 update (primary publication)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40409888/',
  },
} as const;
type Ref = keyof typeof backBoneReferences;
const urls = (...keys: Ref[]) => keys.map((key) => backBoneReferences[key].url);
const draft = (body: string, ...refs: Ref[]): SpecimenTopicDraft => ({
  readiness: 'draft',
  body,
  references: urls(...refs),
});
const topics = {
  occipital: {},
  cervical: {
    clinical: draft(
      'Cervical trauma assessment includes neural and ligamentous injury as well as fractures. Bone position in this reference cannot establish stability; no ligament or cord is supplied here.',
      'trauma',
      'spineImaging',
    ),
    ct: draft(
      'CT is generally the initial cross-sectional test in acute blunt spine trauma when imaging is indicated. Use this view to locate bone, not to clear a patient’s cervical spine or replace clinical decision rules.',
      'trauma',
    ),
    mri: draft(
      'MRI addresses suspected cord, nerve-root or ligament injury that a bone-only view cannot resolve. A normal-looking atlas surface is not evidence that those unmodelled tissues are intact.',
      'spineImaging',
    ),
  },
  thoracolumbar: {
    clinical: draft(
      'A vertebral compression fracture is not automatically osteoporotic. Relate the affected level to the clinical context and acquired imaging; mesh proportions do not measure bone strength.',
      'compression',
    ),
    pathology: draft(
      'Compression can reduce vertebral body height, sometimes producing a wedge. This reference does not model fracture collapse: changing separation alters positions, not vertebral height or stability.',
      'compression',
    ),
    ct: draft(
      'In a vertebral fracture, CT helps assess bone fragments and extension towards the spinal canal. Identify the body and posterior arch here, but do not treat source irregularities as fracture lines.',
      'compression',
    ),
    mri: draft(
      'MRI can reveal marrow oedema and associated disc or neural findings. Signal, sequence and clinical context matter; a coloured mesh cannot date a fracture or distinguish its cause.',
      'compression',
    ),
    xray: draft(
      'A lateral radiograph relates vertebral height and alignment across several levels. A rotated surface view is not a projection radiograph and has no patient-specific disc-space or height measurement.',
      'compression',
    ),
  },
  pelvic: {
    clinical: draft(
      'Assess the pelvic ring as a connected system rather than judging one selected bone alone. Pelvic ligaments and internal organs are absent from this back reference, so stability cannot be inferred.',
      'pelvis',
    ),
    pathology: draft(
      'Pelvic fractures can follow high-energy trauma or occur in weakened bone after lesser force. Artificial separation of the sacrum and hip bones is not a fracture or ligament disruption.',
      'pelvis',
    ),
    ct: draft(
      'CT helps define the pattern and extent of a pelvic fracture in cross-section. This mesh can orient the sacrum and hip bone but supplies no fracture line or associated organ assessment.',
      'pelvis',
    ),
    mri: draft(
      'MRI may help investigate an occult pelvic fracture when earlier images do not explain the concern. No marrow signal is present in this source; the teaching note is not a scan result.',
      'pelvis',
    ),
    xray: draft(
      'Pelvic radiographs use different projections to assess alignment and displacement. Review the ring, not only the highlighted surface; this independent model is not a calibrated pelvic radiograph.',
      'pelvis',
    ),
  },
  shoulder: {
    clinical: draft(
      'Shoulder trauma may affect the clavicle, scapula or proximal humerus, with associated soft-tissue injury. First identify which bone and joint region are involved; this source contains no injured patient anatomy.',
      'shoulder',
    ),
    pathology: draft(
      'A fracture is a break in bone; a dislocation alters a joint relationship. The atlas’s explode offsets represent neither, and absent cartilage or ligaments cannot establish joint integrity.',
      'shoulder',
    ),
    ct: draft(
      'CT can supplement radiographs when a shoulder fracture needs further definition. Relate the selected bone to its articular region; this source does not supply fragments for classification or operative planning.',
      'shoulder',
    ),
    xray: draft(
      'Radiographs are commonly used to diagnose shoulder fractures. A diagnosis concerns the acquired projections and examination, not the appearance of this rotating surface; selecting a bone does not generate an X-ray.',
      'shoulder',
    ),
  },
} satisfies Record<string, SpecimenClinicalLesson['topics']>;

type Concept = {
  anatomy: string;
  function: string;
  references: Ref[];
  family: keyof typeof topics;
  question: string;
  answer: string;
};
export const backBoneConcepts = {
  occipital: {
    anatomy:
      'Posterior skull bone. Locate the nuchal region above C1; its inferior condyles articulate with the atlas.',
    function:
      'Supports craniovertebral articulation and provides posterior neck attachment sites.',
    references: ['back'],
    family: 'occipital',
    question:
      'Does this occipital surface show the complete craniovertebral stabilising apparatus?',
    answer:
      'No. The bone is supplied, but the relevant ligaments and neural tissues are not.',
  },
  atlas: {
    anatomy:
      'C1 is a ring with anterior and posterior arches and no vertebral body. Compare it directly with the dens-bearing C2 below.',
    function:
      'Supports the skull and participates in craniovertebral movement.',
    references: ['back', 'column'],
    family: 'cervical',
    question:
      'Does a selected C1 ring show whether the transverse ligament is intact?',
    answer:
      'No. That ligament is not segmented, and a bone-only surface cannot demonstrate its integrity.',
  },
  axis: {
    anatomy:
      'C2 carries the dens above its body, facing the inner anterior arch of C1.',
    function: 'Provides the pivot for upper-cervical rotation.',
    references: ['column'],
    family: 'cervical',
    question: 'Is the dens part of the atlas or the axis?',
    answer:
      'The axis (C2). Its relationship to C1 does not make it a separate C1 bone.',
  },
  cervical: {
    anatomy:
      'C3–C6 have small bodies, posterior arches and transverse foramina. Distinguish the central vertebral foramen from the lateral transverse openings.',
    function:
      'Support the neck while permitting movement and providing a bony canal around neural structures.',
    references: ['column'],
    family: 'cervical',
    question:
      'Does an empty vertebral foramen in this dissection indicate absent patient neural tissue?',
    answer:
      'No. Cord, nerve roots and surrounding soft tissues were not included in this source study.',
  },
  c7: {
    anatomy:
      'C7 lies at the cervicothoracic transition and typically has a long spinous process.',
    function:
      'Contributes to neck support and posterior attachment sites at this transition.',
    references: ['back'],
    family: 'cervical',
    question:
      'Can the most conspicuous posterior projection alone verify a patient vertebral level?',
    answer:
      'No. A source label identifies this reference selection; patient numbering requires the acquired anatomical context.',
  },
  thoracic: {
    anatomy:
      'Thoracic vertebrae have costal articulations. Orient the body anteriorly and the spinous process posteriorly; rib-facet configuration varies with level.',
    function:
      'Support the thorax and articulate with ribs while contributing to the spinal canal.',
    references: ['back', 'column'],
    family: 'thoracolumbar',
    question:
      'Does a costal articulation in this study demonstrate a complete costovertebral joint?',
    answer:
      'No. Ribs, joint capsules and cartilage are not supplied in this back-layer selection set.',
  },
  lumbar: {
    anatomy:
      'Lumbar vertebrae have large bodies and robust posterior elements. Pedicles join the body to the arch; laminae form its posterior part.',
    function:
      'Bear substantial trunk load and contribute to lower-back movement and canal protection.',
    references: ['column'],
    family: 'thoracolumbar',
    question:
      'Can a bone-only lumbar outline establish disc or nerve-root compression?',
    answer:
      'No. Those tissues and their patient-specific relationships are not represented by this surface.',
  },
  sacrum: {
    anatomy:
      'Fused sacral segments form the posterior pelvic bone. Compare its base, posterior foramina and lateral articulations with the paired hip bones.',
    function: 'Transfers load between the spine and pelvis.',
    references: ['back', 'lower'],
    family: 'pelvic',
    question:
      'Does moving the sacrum away from the hip bones demonstrate sacroiliac instability?',
    answer:
      'No. Separation is a display arrangement, with no simulated ligament failure or measured instability.',
  },
  clavicle: {
    anatomy:
      'A curved strut between the sternum and acromion. Its medial and lateral ends relate to different joints.',
    function:
      'Links the shoulder girdle to the axial skeleton and supports the upper limb away from the trunk.',
    references: ['upper'],
    family: 'shoulder',
    question:
      'Is a separated clavicle a model of an acromioclavicular ligament injury?',
    answer:
      'No. The offsets are artificial and the required ligament anatomy is not segmented.',
  },
  scapula: {
    anatomy:
      'The posterior spine divides supra- and infraspinous fossae and continues towards the acromion. The glenoid faces the humeral head laterally.',
    function:
      'Provides the shoulder socket and muscle attachment sites; its motion contributes to positioning the arm.',
    references: ['upper'],
    family: 'shoulder',
    question:
      'Does the visible glenoid rim include a validated glenoid labrum?',
    answer:
      'No. This is the bony source surface; the labrum is not part of this independent study.',
  },
  hip: {
    anatomy:
      'The adult hip bone combines ilium, ischium and pubis around the acetabulum. The iliac crest forms its superior margin.',
    function:
      'Transmits load through the pelvic ring and provides lower-limb and trunk attachment sites.',
    references: ['lower'],
    family: 'pelvic',
    question:
      'Does one hip-bone selection provide a complete pelvic-ring stability assessment?',
    answer:
      'No. Assessment requires the whole ring and associated tissues; the source offers only skeletal context.',
  },
  humerus: {
    anatomy:
      'The head articulates with the glenoid. Anteriorly, the intertubercular groove separates the tubercles; the radial groove lies on the posterior shaft.',
    function:
      'Acts as the arm’s bony lever between shoulder and elbow, with muscle attachments along its length.',
    references: ['upper'],
    family: 'shoulder',
    question:
      'Does displaying the radial groove also display the radial nerve?',
    answer:
      'No. A bony groove is a landmark, not an independently supplied nerve or an injury assessment.',
  },
} as const satisfies Record<string, Concept>;
export type BackBoneConcept = keyof typeof backBoneConcepts;

// Complete only slots absent from the delivered lessons. These are teaching
// prompts for acquired images, never findings from the unvalidated source bone.
const additionalTopics: Record<BackBoneConcept, SpecimenClinicalLesson['topics']> = {
  occipital: {
    clinical: draft('The occipital condyles meet C1 at the craniovertebral junction. After trauma, the bone-only view cannot show the stabilising ligaments, brainstem or cord; symptoms and acquired images must be assessed together.', 'upperCervicalRadiographs'),
    pathology: draft('An occipital-condyle fracture or craniovertebral displacement changes the skull-base relationship to C1. The intact source contour and display offset represent neither injury nor stability.', 'upperCervicalRadiographs'),
    ct: draft('Multiplanar CT can show an occipital-condyle fracture and its relationship to the C1 lateral mass. Use the condyle as an orientation landmark here; no fracture fragment or patient alignment is encoded.', 'upperCervicalRadiographs'),
    mri: draft('When craniovertebral soft-tissue or neural injury is suspected, acquired MRI can address tissues beyond a CT bone assessment. This occipital surface has no ligament, cord or signal data.', 'upperCervicalRadiographs', 'spineImaging'),
    ultrasound: draft('Ultrasound can depict accessible superficial soft tissue but bone blocks the deeper craniovertebral junction. A visible occipital surface cannot substitute for acquired CT or MRI when that junction is in question.', 'ultrasound', 'upperCervicalRadiographs'),
  },
  atlas: {
    pathology: draft('A C1 ring fracture can involve its anterior or posterior arch; associated ligament injury is a separate question. The supplied unbroken ring cannot exclude either injury in a patient.', 'upperCervicalRadiographs'),
    ultrasound: draft('C1 lies beneath the skull base and other acoustic barriers. Ultrasound does not survey the full ring, dens relationship or transverse ligament; this bone selection is only a landmark for acquired cross-sectional assessment.', 'ultrasound', 'upperCervicalRadiographs'),
  },
  axis: {
    pathology: draft('The C2 dens and posterior elements can be injured in different patterns. A modelled dens attached to the body describes this source arrangement, not evidence that a patient has no fracture or instability.', 'upperCervicalRadiographs'),
    ultrasound: draft('The C2 dens lies deep behind bone, beyond a reliable ultrasound window. Surface sonography cannot clear an odontoid fracture or the C1–C2 relationship; use acquired images when clinically indicated.', 'ultrasound', 'upperCervicalRadiographs'),
  },
  cervical: {
    pathology: draft('A C3–C6 injury may affect a body, facet or posterior element and may coexist with ligament or neural damage. Source foramina and explode spacing are reference and display context, not evidence of traumatic widening or compression.', 'trauma', 'spineImaging'),
    ultrasound: draft('The C3–C6 vertebral canal and bone interior are hidden from surface ultrasound by the posterior elements. Ultrasound may address an accessible soft-tissue question, but cannot survey a cervical fracture or cord injury.', 'ultrasound', 'spineImaging'),
  },
  c7: {
    pathology: draft('Trauma near C7 can involve the cervicothoracic transition; a prominent spinous process alone does not identify the full injury level or pattern. The unaltered source bone and separation offsets are not patient findings.', 'trauma', 'spineImaging'),
    ultrasound: draft('Although the C7 spinous tip can be superficial, ultrasound sees only reachable outer cortex and soft tissue. It cannot evaluate the deep C7–T1 canal or exclude a junctional injury.', 'ultrasound', 'spineImaging'),
  },
  thoracic: {
    ultrasound: draft('Ribs and posterior vertebral cortex obstruct a complete thoracic-vertebra ultrasound view. Sonography may answer a nearby soft-tissue question, but cannot establish vertebral height, canal integrity or a fracture pattern.', 'ultrasound', 'trauma'),
  },
  lumbar: {
    ultrasound: draft('Ultrasound can show some superficial lumbar tissues and accessible bone cortex; it cannot penetrate the vertebral body to assess marrow or the canal. A bone-only lesson is not an acquired ultrasound or fracture screen.', 'ultrasound', 'compression'),
  },
  sacrum: {
    ultrasound: draft('The sacral cortex and depth limit ultrasound assessment of the posterior pelvic ring. Pelvic sonography can address organs or fluid, but cannot establish a sacral fracture or sacroiliac stability from this surface.', 'ultrasound', 'pelvis'),
  },
  clavicle: {
    mri: draft('MRI can answer selected soft-tissue or occult-injury questions around the clavicle after clinical and radiographic assessment. This source contains no marrow signal, acromioclavicular ligament or sternoclavicular capsule.', 'shoulderImaging', 'shoulder'),
    ultrasound: draft('The superficial clavicular cortex may be accessible to ultrasound, and adjacent soft tissue can be examined, but sound cannot show the bone interior or the entire injury pattern. No sonogram is supplied here.', 'ultrasound', 'shoulderImaging'),
  },
  scapula: {
    mri: draft('MRI can investigate selected peri-scapular soft tissues and shoulder joint structures when the clinical question warrants it. The visible scapular spine and glenoid are bone landmarks, with no labrum, tendon or marrow signal.', 'shoulderImaging', 'shoulder'),
    ultrasound: draft('Ultrasound can assess accessible rotator-cuff tendons near the scapular shoulder, but the scapular blade blocks deeper structures and its cortex is not a complete fracture survey. The labrum and marrow are absent.', 'ultrasound', 'shoulderImaging'),
  },
  hip: {
    ultrasound: draft('Pelvic ultrasound can assess selected organs or fluid, but the adult hip bone blocks a view through the pelvic ring. It cannot determine acetabular or iliac fracture extent or ring stability from this surface.', 'ultrasound', 'pelvis'),
  },
  humerus: {
    mri: draft('MRI may address suspected rotator-cuff or other soft-tissue injury beside the proximal humerus after the initial clinical and radiographic assessment. This full-bone mesh has no tendon, nerve, cartilage or marrow signal.', 'shoulderImaging', 'shoulder'),
    ultrasound: draft('Ultrasound can examine rotator-cuff tendons beside the humeral head and an accessible cortical margin. Acoustic shadowing prevents assessment through the humerus, so it cannot describe the full fracture pattern or marrow.', 'ultrasound', 'shoulderImaging'),
  },
};

// Projection orientation only; no acquisition protocol or clearance thresholds.
const cervicalXray: Partial<Record<BackBoneConcept, SpecimenTopicDraft>> = {
  occipital: draft(
    'On an upper-cervical lateral radiograph, locate the skull base above the C1 ring; the occipital condyles articulate with C1. This surface supplies anatomical context, not a calibrated craniovertebral measurement or evidence of stability.',
    'upperCervicalRadiographs',
  ),
  atlas: draft(
    'The lateral projection relates the anterior and posterior C1 arches to the C2 dens; the open-mouth projection shows the C1 lateral masses beside it. C1 has no vertebral body. These reference relationships cannot establish transverse-ligament integrity.',
    'upperCervicalRadiographs',
    'column',
  ),
  axis: draft(
    'Identify the dens as part of C2, rising above its body between the C1 lateral masses on an open-mouth projection. Compare with the lateral view of the dens and C2 body. A smooth model contour cannot exclude a fracture.',
    'upperCervicalRadiographs',
  ),
  cervical: draft(
    'On a lateral radiograph, follow the anterior and posterior vertebral-body margins and the spinolaminar contour across C3–C6 rather than judging one level alone. Intervertebral spaces here contain no modelled discs; explode gaps are not radiographic disc-space widening.',
    'cervicalRadiographs',
  ),
  c7: draft(
    'Locate C7 in relation to T1 at the cervicothoracic junction. A lateral image that does not show this junction leaves that region unassessed; recognising C7’s spinous process alone is insufficient. Rotating this model does not supply a missing radiographic view.',
    'cervicalRadiographs',
  ),
};

// Exact source identities, admitted only after full specimen/surface validation.
// These mappings are not transferable to another source merely by matching FMA.
export const backBoneBindings: Readonly<Record<string, BackBoneConcept>> = {
  FMA52735: 'occipital',
  FMA12519: 'atlas',
  FMA12520: 'axis',
  FMA12525: 'c7',
  FMA12521: 'cervical',
  FMA12522: 'cervical',
  FMA12523: 'cervical',
  FMA12524: 'cervical',
  FMA9165: 'thoracic',
  FMA9187: 'thoracic',
  FMA9209: 'thoracic',
  FMA9248: 'thoracic',
  FMA9922: 'thoracic',
  FMA9945: 'thoracic',
  FMA9968: 'thoracic',
  FMA9991: 'thoracic',
  FMA10014: 'thoracic',
  FMA10037: 'thoracic',
  FMA10059: 'thoracic',
  FMA10081: 'thoracic',
  FMA13072: 'lumbar',
  FMA13073: 'lumbar',
  FMA13074: 'lumbar',
  FMA13075: 'lumbar',
  FMA13076: 'lumbar',
  FMA16202: 'sacrum',
  FMA13322: 'clavicle',
  FMA13323: 'clavicle',
  FMA13395: 'scapula',
  FMA13396: 'scapula',
  FMA16586: 'hip',
  FMA16587: 'hip',
  FMA23130: 'humerus',
  FMA23131: 'humerus',
};

export function authoredBackBoneLesson(key: BackBoneConcept): SpecimenLesson {
  const c = backBoneConcepts[key],
    selectedTopics = topics[c.family];
  return JSON.parse(
    JSON.stringify({
      anatomy: c.anatomy,
      function: c.function,
      references: urls(...c.references),
      extended: {
        modelLimit:
          'One unvalidated, reduced-resolution source bone, not separate landmark meshes. No cartilage, discs, ligament integrity, bone density, marrow signal or patient registration. Explode offsets and source defects are not disease.',
        topics: {
          ...selectedTopics,
          ...additionalTopics[key],
          ...(cervicalXray[key] ? { xray: cervicalXray[key] } : {}),
        },
        selfCheck: {
          question: c.question,
          answer: c.answer,
          references: urls(...c.references),
        },
      },
    }),
  ) as SpecimenLesson;
}
