// Original short factual synthesis; references are linked, never republished.
// Anatomical source rights and clinical approval remain separate from this copy.
import type { SpecimenLesson } from './um-limb-teaching';
import type {
  SpecimenClinicalLesson,
  SpecimenTopicDraft,
} from './um-limb-clinical';

export const hraPelvicReferences = {
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
  'ovary' | 'tube' | 'uterus' | 'fundus' | 'cervix' | 'vagina',
  TopicSet
> = {
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
              ...Object.values(lessonTopics).flatMap((t) => t.references),
            ]),
          ],
        },
      },
    }),
  ) as SpecimenLesson;
}
