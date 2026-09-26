import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type RegionalConnectiveClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category:
    | 'cartilage'
    | 'ligament'
    | 'fascia'
    | 'tendon'
    | 'membrane'
    | 'connective-tissue',
];
interface RegionalConnectiveClinicalGroup {
  key: string;
  identities: readonly RegionalConnectiveClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original factual teaching; exact source categories, sides and partial extents retained.
export const regionalConnectiveClinicalGroups: readonly RegionalConnectiveClinicalGroup[] =
  [
    {
      key: 'nasal-septum',
      identities: [
        [
          'FMA59503',
          'midline',
          'partof',
          ['FJ2557'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
      ],
      pathology: {
        body: 'After nasal trauma, a septal haematoma is a collection of blood within the septal tissues that needs urgent assessment. A straight-looking external nose does not exclude it, and a reference cartilage surface cannot show the swelling.',
        bullets: [
          'The selected cartilage is only part of the nasal septum; its lining and blood collection are not segmented.',
          'A septal haematoma is not simply another name for a deviated septum.',
        ],
      },
      clinical: {
        body: 'Painful swelling inside the nose or persistent obstruction after an injury should be assessed urgently. The NHS advises A&E for a purple swelling inside an injured nose; do not attempt to drain or straighten it yourself.',
        bullets: [
          'Examination is needed to distinguish swelling, displacement and other injuries.',
          'No drainage route, septal flap, perforation or patient-specific obstruction is modelled.',
        ],
      },
      scope:
        'One part-of-tree septal cartilage source, not the complete bony and soft-tissue septum. No mucosal layers, airflow or healing simulation.',
      references: [
        'https://www.nhs.uk/conditions/broken-nose/',
        'https://www.gloshospitals.nhs.uk/your-visit/patient-information-leaflets/suspected-broken-nose-nasal-fracture/',
      ],
    },
    {
      key: 'external-nasal-framework',
      identities: [
        [
          'FMA59505',
          'right',
          'partof',
          ['FJ2554'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA59506',
          'left',
          'partof',
          ['FJ2555'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA59512',
          'right',
          'partof',
          ['FJ2558'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA59513',
          'left',
          'partof',
          ['FJ2556'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
      ],
      pathology: {
        body: 'Nasal injury may alter shape or nasal breathing, but external swelling does not establish which cartilage is damaged. Upper lateral and major alar cartilages are separate parts of the framework, not interchangeable labels for the whole nose.',
        bullets: [
          'A bony nasal fracture and an individual cartilage injury are not the same finding.',
          'The reference shapes do not identify a fracture, valve collapse or a cosmetic deformity in a patient.',
        ],
      },
      clinical: {
        body: 'A changed shape or breathing difficulty after a nasal injury warrants clinical assessment. Swelling and other injured tissues must be considered together; selecting a cartilage cannot determine whether correction is needed.',
        bullets: [
          'Keep the separate right/left and upper-lateral/alar identities when orienting the nose.',
          'No reduction manoeuvre, rhinoplasty design, nasal-valve test or airflow measurement is supplied.',
        ],
      },
      scope:
        'Four independently indexed part-of-tree cartilage surfaces. Soft-tissue support and nasal-valve motion are not clinically validated; no mirrored or reconstructed injury geometry.',
      references: ['https://www.nhs.uk/conditions/broken-nose/'],
    },
    {
      key: 'laryngeal-cartilages',
      identities: [
        [
          'FMA55099',
          'midline',
          'isa',
          ['FJ2808'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA9615',
          'midline',
          'isa',
          ['FJ2440', 'FJ2769'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA55113',
          'right',
          'isa',
          ['FJ2792'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA55114',
          'left',
          'isa',
          ['FJ2775'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA55115',
          'right',
          'isa',
          ['FJ2793'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA55116',
          'left',
          'isa',
          ['FJ2776'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA55117',
          'right',
          'isa',
          ['FJ2795'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA55118',
          'left',
          'isa',
          ['FJ2773'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
      ],
      pathology: {
        body: 'Laryngeal trauma can involve cartilage, joints, mucosa, ligaments or nerves, with different consequences for breathing, swallowing and voice. A normal-looking exterior framework does not rule out an important internal injury.',
        bullets: [
          'Voice change and noisy or difficult breathing after neck trauma require attention even without an obvious external deformity.',
          'The thyroid, cricoid, arytenoid, corniculate and cuneiform selections do not share one identical injury pattern.',
        ],
      },
      clinical: {
        body: "Breathing difficulty after neck trauma is an emergency. Assessment prioritises the airway and uses specialist examination and imaging as appropriate; do not press on or manipulate the model's corresponding landmarks to test a real injury.",
        bullets: [
          'The cricoid remains one selection with two indexed components, not two separate cartilages.',
          'No fracture grade, airway calibre, reduction method, intubation path or emergency incision site is provided.',
        ],
      },
      scope:
        'Eight cartilage identities, nine source components. Mucosal coverage, joint surfaces and dynamic airway behaviour are not fully validated; no patient-specific trauma or procedural simulation.',
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4363638/'],
    },
    {
      key: 'laryngeal-connective-support',
      identities: [
        [
          'FMA55138',
          'midline',
          'isa',
          ['FJ2790'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA55140',
          'right',
          'isa',
          ['FJ2797'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA55141',
          'left',
          'isa',
          ['FJ2779'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA55227',
          'unspecified',
          'isa',
          ['FJ2771'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA55230',
          'midline',
          'isa',
          ['FJ2807'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA55237',
          'midline',
          'isa',
          ['FJ2789'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA55133',
          'right',
          'isa',
          ['FJ2804'],
          'head-neck',
          ['head-neck'],
          'membrane',
        ],
        [
          'FMA55134',
          'left',
          'isa',
          ['FJ2786'],
          'head-neck',
          ['head-neck'],
          'membrane',
        ],
      ],
      pathology: {
        body: 'Swallowing difficulty can have many causes and is not evidence of a torn hyoid or laryngeal ligament. These attachments provide anatomical context for a coordinated system of muscles, nerves and moving tissues; they do not work as isolated swallowing switches.',
        bullets: [
          'Dysphagia can involve food, liquid or saliva and can be associated with coughing or choking.',
          'An epiglottic attachment, a thyrohyoid thickening and the median cricothyroid ligament are distinct structures, not equivalent disease sites.',
        ],
      },
      clinical: {
        body: 'Persistent swallowing difficulty or coughing with eating or drinking needs assessment by the appropriate clinical team. Swallowing evaluation establishes safety; a visible epiglottis or intact-looking connective surface cannot certify protection from aspiration.',
        bullets: [
          'The supplied thyrohyoid membrane sides remain separate from their named ligamentous thickenings.',
          'No swallowing manoeuvre, diet prescription, cricothyroid puncture route or safe operative plane is supplied.',
        ],
      },
      scope:
        'Eight independently named ligament/membrane selections. Hyo-epiglottic source laterality remains unspecified. Attachments, perforating structures and swallowing mechanics are not independently validated.',
      references: [
        'https://www.guysandstthomas.nhs.uk/health-information/dysphagia-or-swallowing-problems',
        'https://www.cuh.nhs.uk/patient-information/dysphagia-swallowing-difficulties-adults/',
      ],
    },
    {
      key: 'vocal-ligaments',
      identities: [
        [
          'FMA55245',
          'right',
          'isa',
          ['FJ2805'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA55246',
          'left',
          'isa',
          ['FJ2787'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
      ],
      pathology: {
        body: 'Hoarseness is a symptom of altered voice production, not a diagnosis of vocal-ligament damage. Inflammation, vocal-fold lesions and impaired movement can affect the voice; a ligament surface alone cannot distinguish these problems.',
        bullets: [
          'The vocal ligament is not the whole mucosal vocal fold or the contracting vocalis muscle.',
          'The scene contains no nodule, polyp, mucosal wave or sound recording.',
        ],
      },
      clinical: {
        body: 'Persistent hoarseness warrants medical review, particularly with a neck lump, swallowing difficulty or coughing blood. Breathing difficulty needs urgent assessment. Examination of the larynx determines the cause rather than the appearance of this reference ligament.',
        bullets: [
          'Right and left remain independently selected, without diagnosing paralysis from a static position.',
          'No voice-rest regimen, lesion-removal method, tension measurement or phonation test is provided.',
        ],
      },
      scope:
        'Two exact ligament surfaces. Mucosal layers, vibration, tissue stiffness and vocal-fold motion are not independently represented or clinically validated.',
      references: ['https://www.nidcd.nih.gov/health/hoarseness'],
    },
    {
      key: 'stylohyoid-chain',
      identities: [
        [
          'FMA72309',
          'right',
          'isa',
          ['FJ2764'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA72311',
          'left',
          'isa',
          ['FJ2763'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
      ],
      pathology: {
        body: 'An elongated styloid process or calcified stylohyoid chain may be associated with Eagle syndrome. However, an incidental elongated process does not establish the syndrome, and symptoms must be correlated with clinical findings.',
        bullets: [
          'The ligament, styloid process and stylohyoid muscle remain different structures.',
          'No ossified segment or symptomatic neurovascular contact has been inferred from this reference ligament.',
        ],
      },
      clinical: {
        body: 'Symptoms attributed to the stylohyoid region need assessment and appropriate imaging, with consideration of other causes of head or neck symptoms. Selecting a long-looking structure is not a diagnostic measurement.',
        bullets: [
          'The two source sides do not establish symmetric symptoms or bilateral disease.',
          'No palpation provocation, vascular compression test, resection length or surgical corridor is supplied.',
        ],
      },
      scope:
        'Two indexed stylohyoid ligament surfaces. Ossification, dimensions and surrounding neurovascular relationships require patient-specific validation.',
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/7975191/'],
    },
    {
      key: 'orbital-check-ligaments',
      identities: [
        [
          'FMA49144',
          'right',
          'isa',
          ['FJ1334'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA49145',
          'left',
          'isa',
          ['FJ1284'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA49147',
          'right',
          'isa',
          ['FJ1335'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
        [
          'FMA49148',
          'left',
          'isa',
          ['FJ1292'],
          'head-neck',
          ['head-neck'],
          'ligament',
        ],
      ],
      pathology: {
        body: 'Double vision can have different causes, including problems affecting eye alignment and movement. A passive orbital check ligament is not an eye muscle or cranial nerve; its selection cannot distinguish restricted movement from muscle weakness or a nerve disorder.',
        bullets: [
          'Medial and lateral check ligaments remain separate from the corresponding rectus muscles.',
          'No tethering, scarring or muscle paralysis is demonstrated by the static model.',
        ],
      },
      clinical: {
        body: 'Double vision should be assessed even if intermittent. Sudden onset or associated eye pain needs urgent assessment; after a head injury, follow emergency advice. The atlas is for orientation, not an ocular-motility examination.',
        bullets: [
          'Keep the orbital wall, muscle and ligament in context when comparing sides.',
          'No forced-duction manoeuvre, eye-alignment angle or strabismus surgery plan is supplied.',
        ],
      },
      scope:
        'Four indexed check-ligament surfaces. Attachments and passive restraint mechanics remain unvalidated; no eye-movement or nerve-function simulation.',
      references: ['https://www.nhs.uk/symptoms/double-vision/'],
    },
    {
      key: 'superior-oblique-trochleae',
      identities: [
        [
          'FMA49067',
          'right',
          'isa',
          ['FJ1380'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
        [
          'FMA49068',
          'left',
          'isa',
          ['FJ1329'],
          'head-neck',
          ['head-neck'],
          'cartilage',
        ],
      ],
      pathology: {
        body: 'Brown syndrome involves restricted movement of the superior-oblique muscle–tendon system, particularly when the eye tries to look upward while turned toward the nose. It is not simply another name for superior-oblique weakness.',
        bullets: [
          'The trochlea is the tendon pulley, not the contracting muscle.',
          'Selecting the pulley does not prove that the pulley itself is diseased or that a patient has Brown syndrome.',
        ],
      },
      clinical: {
        body: 'An ophthalmic examination assesses the pattern of eye movement and its cause. The source model cannot reproduce tendon restriction, measure head posture or distinguish congenital from acquired disease.',
        bullets: [
          'The independently indexed right and left trochleae are reference anatomy, not a simulated motility test.',
          'No forced movement, injection or tendon-lengthening procedure is described.',
        ],
      },
      scope:
        'Two fibrocartilaginous pulley surfaces. Tendon gliding, attachment footprints and restrictive mechanics are not clinically validated.',
      references: ['https://www.aapos.org/glossary/brown-syndrome'],
    },
    {
      key: 'common-tendinous-rings',
      identities: [
        [
          'FMA49072',
          'right',
          'isa',
          ['FJ1342'],
          'head-neck',
          ['head-neck'],
          'tendon',
        ],
        [
          'FMA49073',
          'left',
          'isa',
          ['FJ1291'],
          'head-neck',
          ['head-neck'],
          'tendon',
        ],
      ],
      pathology: {
        body: 'Disease near the orbital apex can affect both eye movements and vision. The common tendinous ring is a regional landmark, not a lesion and not a complete model of the neighbouring nerve passages.',
        bullets: [
          'Published orbital-apex cases illustrate that visual and movement deficits can evolve; a normal reference ring cannot exclude this.',
          'A selected ring cannot determine whether a process is inflammatory, infectious, traumatic or another cause.',
        ],
      },
      clinical: {
        body: 'New double vision with visual deterioration needs urgent medical assessment. Sudden loss of vision is an emergency; do not wait for the atlas to identify a nerve or passage.',
        bullets: [
          'Assessment and patient imaging establish the actual involved structures, not the visible opening in this mesh.',
          'No safe transorbital corridor, decompression path or cranial-nerve clearance measurement is supplied.',
        ],
      },
      scope:
        'Two indexed tendinous-ring surfaces. The full orbital apex, its compartments and all traversing structures are not independently validated by these meshes.',
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC5814374/',
        'https://www.nhs.uk/conditions/vision-loss/',
      ],
    },
    {
      key: 'eyelid-tarsal-plates',
      identities: [
        [
          'FMA59091',
          'right',
          'isa',
          ['FJ1375'],
          'head-neck',
          ['head-neck'],
          'connective-tissue',
        ],
        [
          'FMA59092',
          'left',
          'isa',
          ['FJ1324'],
          'head-neck',
          ['head-neck'],
          'connective-tissue',
        ],
        [
          'FMA59089',
          'right',
          'isa',
          ['FJ1379'],
          'head-neck',
          ['head-neck'],
          'connective-tissue',
        ],
        [
          'FMA59090',
          'left',
          'isa',
          ['FJ1328'],
          'head-neck',
          ['head-neck'],
          'connective-tissue',
        ],
      ],
      pathology: {
        body: 'A chalazion arises from blockage of a meibomian gland in the eyelid. The tarsal plate provides anatomical context, but the plate is dense connective tissue, not the gland itself and not cartilage.',
        bullets: [
          'Not every eyelid lump is a chalazion; the reference plate contains no cyst or inflamed gland.',
          'Upper/lower and right/left plates remain distinct selections.',
        ],
      },
      clinical: {
        body: 'An eyelid lump that persists, changes or causes concern needs assessment. Pain in the eye or changes in vision warrant urgent advice rather than self-diagnosis from the model.',
        bullets: [
          'The atlas does not reveal gland ducts, cyst contents or the cause of a swelling.',
          'No squeezing, incision, injection, biopsy plan or treatment regimen is provided.',
        ],
      },
      scope:
        'Four indexed eyelid connective-tissue plates. Glands, full eyelid layers, attachment systems and tear flow are not separately segmented or clinically validated.',
      references: [
        'https://www.moorfields.nhs.uk/eye-conditions/chalazion',
        'https://www.nhs.uk/symptoms/eyelid-problems/',
      ],
    },
    {
      key: 'linea-alba',
      identities: [
        [
          'FMA11336',
          'midline',
          'isa',
          ['FJ1448'],
          'abdomen',
          ['abdomen'],
          'fascia',
        ],
      ],
      pathology: {
        body: 'Rectus diastasis involves thinning and widening of the linea alba with increased separation of the rectus muscles. It can coexist with a midline hernia, but these are not interchangeable descriptions.',
        bullets: [
          'The apparent width of the reference mesh is not a clinical inter-rectus measurement.',
          'No fascial defect, hernia sac or herniated bowel has been added.',
        ],
      },
      clinical: {
        body: 'Clinical assessment distinguishes muscle separation from a hernia and evaluates any symptoms. A painful abdominal lump with vomiting or other acute symptoms needs urgent medical assessment; the atlas cannot establish reducibility or bowel safety.',
        bullets: [
          'No diagnostic width threshold is applied to unvalidated model dimensions.',
          'No hernia-reduction manoeuvre, abdominal exercise prescription, incision or mesh-repair plan is supplied.',
        ],
      },
      scope:
        'One indexed midline fascial surface. Thickness, aponeurotic continuity and dynamic abdominal-wall behaviour are not clinically validated.',
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC10364860/',
        'https://www.nhs.uk/conditions/hernia/',
      ],
    },
    {
      key: 'intestinal-mesenteries',
      identities: [
        [
          'FMA14643',
          'midline',
          'isa',
          ['FJ3396'],
          'abdomen',
          ['abdomen'],
          'membrane',
        ],
        [
          'FMA14647',
          'midline',
          'isa',
          ['FJ3398'],
          'abdomen',
          ['abdomen'],
          'membrane',
        ],
      ],
      pathology: {
        body: 'Abdominal adhesions are abnormal scar-like bands that can tether bowel and sometimes cause obstruction. They are not the normal mesentery or transverse mesocolon, and a normal reference fold does not demonstrate an adhesion.',
        bullets: [
          'The small-intestinal mesentery and transverse mesocolon support different bowel regions and remain separate selections.',
          'The model contains no obstructed segment, abnormal band or validated bowel-perfusion finding.',
        ],
      },
      clinical: {
        body: 'Abdominal pain with distension, vomiting or inability to pass stool or gas can indicate obstruction and needs prompt medical assessment. Clinical evaluation and appropriate imaging establish the cause; the atlas cannot determine whether bowel is compromised.',
        bullets: [
          'Surgical history can matter even when an earlier operation was many years ago.',
          'No adhesion-release technique, mesenteric vessel-ligation route or avascular dissection plane is supplied.',
        ],
      },
      scope:
        'Two indexed mesenteric surfaces, not complete peritoneal leaves, roots or fascial planes. Embedded vessels, nerves and lymphatics are not comprehensively segmented.',
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/abdominal-adhesions',
      ],
    },
    {
      key: 'mesoappendix',
      identities: [
        [
          'FMA16549',
          'unspecified',
          'isa',
          ['FJ3397'],
          'abdomen',
          ['abdomen'],
          'membrane',
        ],
      ],
      pathology: {
        body: 'Appendicitis is inflammation of the appendix. The mesoappendix is its associated supporting fold, not the appendix itself; selecting it does not identify the origin or extent of inflammation.',
        bullets: [
          'A reference mesenteric fold cannot show a blocked appendiceal lumen, abscess or perforation.',
          "Its displayed position is not a reliable map of every patient's appendix.",
        ],
      },
      clinical: {
        body: 'Suspected appendicitis requires prompt medical assessment. Symptoms, examination and appropriate investigations establish the diagnosis; severe or worsening abdominal pain should not be assessed by matching a pain location to this mesh.',
        bullets: [
          'No source laterality has been inferred: this mesoappendix entry remains unspecified.',
          'No vessel division, appendectomy route or other operative guidance is supplied.',
        ],
      },
      scope:
        'One indexed mesoappendix surface. Complete peritoneal leaves, appendiceal vessels, internal bowel structure and patient-specific position are not validated.',
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/appendicitis',
      ],
    },
  ];
const byFma = new Map(
  regionalConnectiveClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function regionalConnectiveClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'connective')
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions, category] = match.identity;
  if (
    s.category !== category ||
    s.laterality !== side ||
    s.sourceTree !== tree ||
    s.region !== region ||
    !same(s.regions, regions) ||
    !same(
      s.sources.map((p) => p.file),
      files,
    )
  )
    return undefined;
  const { group } = match,
    topic = group[tab];
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'pathology' ? 'Injury & disease' : 'Clinical context'} · draft`,
    body: topic.body,
    bullets: [...topic.bullets, group.scope],
    note: [
      'Draft teaching; independent anatomical and clinical review pending. Educational context, not a patient diagnosis or treatment plan.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...group.references],
  };
}
