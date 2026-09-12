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
        topics: selectedTopics,
        selfCheck: {
          question: c.question,
          answer: c.answer,
          references: urls(...c.references),
        },
      },
    }),
  ) as SpecimenLesson;
}
