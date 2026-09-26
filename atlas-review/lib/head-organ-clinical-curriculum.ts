import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type HeadOrganClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'organ',
];
interface HeadOrganClinicalGroup {
  key: string;
  identities: readonly HeadOrganClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const headOrganClinicalGroups: readonly HeadOrganClinicalGroup[] = [
  {
    key: 'pituitary',
    identities: [
      [
        'FMA13889',
        'unpaired',
        'isa',
        ['FJ1796'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One source-labelled pituitary surface. Anterior/posterior cell populations, hormone secretion, tumour volume and compression of nearby structures are not independently reconstructed or simulated.',
    pathology: {
      body: 'Pituitary tumours are usually non-cancerous, but can still cause important problems. Some produce excess hormones; others produce no clinical hormone-excess syndrome yet may compress nearby tissue or reduce normal pituitary function.',
      bullets: [
        'Hormone excess, hormone deficiency and pressure effects are different mechanisms.',
        'A normal-looking reference gland cannot exclude an endocrine disorder or a pituitary mass.',
      ],
    },
    clinical: {
      body: "Relate the gland's sellar position to its endocrine roles and nearby visual pathways. Symptoms may reflect hormone imbalance or visual disturbance; examination, hormone testing and appropriate imaging are needed to investigate them.",
      bullets: [
        "Selecting the gland does not establish a tumour's subtype, size or effect on vision.",
        'No hormone dose, stimulation-test interpretation, operative route or patient-specific imaging finding is supplied.',
      ],
    },
    references: [
      'https://www.cancer.gov/types/pituitary',
      'https://www.cancer.gov/types/pituitary/symptoms',
      'https://www.cancer.gov/types/pituitary/diagnosis-prognosis',
    ],
  },
  {
    key: 'eyeballs',
    identities: [
      [
        'FMA12514',
        'right',
        'partof',
        [
          'FJ1336',
          'FJ1337',
          'FJ1340',
          'FJ1348',
          'FJ1356',
          'FJ1368',
          'FJ1371',
          'FJ1382',
        ],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA12515',
        'left',
        'partof',
        [
          'FJ1282',
          'FJ1285',
          'FJ1286',
          'FJ1289',
          'FJ1297',
          'FJ1305',
          'FJ1317',
          'FJ1320',
          'FJ1331',
        ],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'Grouped source selections contain eight right and nine left components; the extra left FJ1282 is source-labelled anterior chamber. Neither set independently identifies a retinal component. No matched or complete ocular-layer dissection, visual function or patient retinal lesion is established.',
    pathology: {
      body: 'Cataract is clouding of the lens. Retinal detachment involves the light-sensitive tissue separating from its usual position. These affect different parts of the eye and are not interchangeable causes of visual disturbance.',
      bullets: [
        'Changing surface opacity does not simulate a cataract.',
        'A grouped globe highlight does not show a retinal tear or detachment.',
      ],
    },
    clinical: {
      body: 'New flashes, a sudden increase in floaters or a curtain-like visual shadow require immediate eye-care or emergency assessment. Do not dismiss these changes as an ordinary cataract or wait to compare them with the atlas.',
      bullets: [
        'Clinical eye examination is separate from inspecting this reference model.',
        'No measured visual acuity, retinal imaging, pressure reading or procedure selection is provided.',
      ],
    },
    references: [
      'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/cataracts',
      'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/retinal-detachment',
    ],
  },
  {
    key: 'tongue',
    identities: [
      [
        'FMA54640',
        'unpaired',
        'isa',
        ['FJ2761'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One whole-tongue reference surface, not independently validated mucosa, muscle compartments, tumour depth or a working swallowing mechanism. A display cut does not establish tissue margins.',
    pathology: {
      body: 'Tongue lesions can be benign or malignant. A persistent ulcer, patch or lump may need investigation; appearance alone does not determine the cause or prove cancer.',
      bullets: [
        'A normal reference colour is not a test for mucosal disease.',
        'A surface lesion and impaired tongue movement are different findings and need clinical interpretation.',
      ],
    },
    clinical: {
      body: 'A mouth ulcer lasting more than three weeks, an unexplained red or white patch, a lump or persistent oral pain should be assessed by a dentist or doctor. Difficulty speaking or swallowing also warrants assessment.',
      bullets: [
        'These symptoms can have non-cancerous causes; the lesson is not a diagnosis.',
        'No biopsy target, tumour depth, nerve deficit or resection margin is inferred from this mesh.',
      ],
    },
    references: ['https://www.nhs.uk/conditions/mouth-cancer/symptoms/'],
  },
  {
    key: 'lacrimal-glands',
    identities: [
      [
        'FMA59102',
        'right',
        'isa',
        ['FJ1350'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA59103',
        'left',
        'isa',
        ['FJ1299'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'Two separately indexed tear-producing glands, distinct from the medial drainage passages. Secretory ducts, tear-film composition, internal gland tissue and inflammatory swelling are not validated here.',
    pathology: {
      body: 'Dacryoadenitis is inflammation of a lacrimal gland, potentially associated with infection or immune-mediated disease. Swelling can occur around the upper outer eye, unlike the medial location of the lacrimal sac.',
      bullets: [
        'Tear-gland inflammation is not the same as a blocked tear-drainage passage.',
        'A watery eye does not identify the affected structure by itself.',
      ],
    },
    clinical: {
      body: 'Eye swelling or pain needs clinical assessment. Sudden visual loss, severe eye pain or rapidly worsening swelling requires emergency evaluation.',
      bullets: [
        'Study the production-versus-drainage relationship using the separate selections.',
        'No autoimmune diagnosis, infection identification or tear-production measurement is provided.',
      ],
    },
    references: [
      'https://my.clevelandclinic.org/health/diseases/24423-dacryoadenitis',
    ],
  },
  {
    key: 'submandibular-glands',
    identities: [
      [
        'FMA59802',
        'right',
        'isa',
        ['FJ2768'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA59803',
        'left',
        'isa',
        ['FJ2766'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'Each gland is a single source selection. Its internal ducts, stones, superficial/deep tissue planes and saliva flow are not independently validated; no removal route is supplied.',
    pathology: {
      body: 'A salivary stone can obstruct drainage and cause episodic swelling or pain, often around meals. Infection may complicate the obstruction; a painful gland is not automatically a stone.',
      bullets: [
        'The fixed surface does not demonstrate a stone or duct blockage.',
        'The gland and its drainage passage are related but distinct anatomy.',
      ],
    },
    clinical: {
      body: 'Relate swelling beneath the jaw or in the floor of the mouth to salivary anatomy. Persistent symptoms, redness, pus or fever warrant medical assessment.',
      bullets: [
        'Meal-related pain is a clue, not a diagnosis or a measured obstruction.',
        'No sharp-instrument removal, duct instrumentation or operation is taught.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/salivary-gland-stones/',
      'https://www.rightdecisions.scot.nhs.uk/ggc-primary-care/ear-nose-and-throat-ent/ear-nose-and-throat-ent-referral-guidance/throat-conditions/neck-lump/salivary-gland-pathology-sialadenitis-stones-cancer/',
    ],
  },
  {
    key: 'sublingual-glands',
    identities: [
      [
        'FMA59804',
        'right',
        'isa',
        ['FJ2767'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA59805',
        'left',
        'isa',
        ['FJ2765'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'Two source gland surfaces in the floor-of-mouth region. Small ducts, leaking saliva, cyst boundaries and an operative plane through mylohyoid are not reconstructed.',
    pathology: {
      body: 'A ranula is a saliva-containing swelling in the floor of the mouth. Saliva can escape from a damaged or obstructed gland into surrounding tissue; some swellings extend towards the neck.',
      bullets: [
        'A ranula is not simply another name for an enlarged gland.',
        'The atlas does not contain a ranula or prove which gland is leaking.',
      ],
    },
    clinical: {
      body: 'A floor-of-mouth swelling needs clinical assessment to identify its cause and extent. A large lesion may affect speech or swallowing; breathing difficulty requires urgent care.',
      bullets: [
        'Use the tongue and gland selections to orient the region, not to trace a patient lesion.',
        'No aspiration, drainage, operative route or recurrence prediction is supplied.',
      ],
    },
    references: ['https://my.clevelandclinic.org/health/diseases/23451-ranula'],
  },
  {
    key: 'epiglottis',
    identities: [
      [
        'FMA55130',
        'unpaired',
        'isa',
        ['FJ2770'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One unvalidated source epiglottis surface in its original frame. The tissue extent, attachments, airway lumen, paediatric proportions and swallowing motion are not independently validated.',
    pathology: {
      body: 'Epiglottitis causes swelling near the laryngeal entrance and can obstruct breathing. It is an emergency, not simply a label for any sore throat or an unusually shaped reference epiglottis.',
      bullets: [
        'Severe throat pain, painful swallowing, drooling and noisy or difficult breathing may occur.',
        "A static open-looking model cannot establish that a person's airway is safe.",
      ],
    },
    clinical: {
      body: 'In the UK, call 999 if epiglottitis is suspected. Do not delay emergency care to investigate the atlas or attempt a throat examination based on this model.',
      bullets: [
        'The adult reference cannot establish airway dimensions in a child.',
        'No laryngoscopy, intubation depth, tracheostomy site or other procedural instruction is provided.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/epiglottitis/',
      'https://111.wales.nhs.uk/Encyclopaedia/e/article/epiglottitis',
    ],
  },
  {
    key: 'canaliculi',
    identities: [
      [
        'FMA59582',
        'right',
        'isa',
        ['FJ1349'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA59583',
        'left',
        'isa',
        ['FJ1298'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One canaliculus-labelled surface per side, not independently modelled upper, lower and common channels. Puncta, duct lumen, concretions and canalicular continuity are unvalidated.',
    pathology: {
      body: 'Canaliculitis is infection of a lacrimal canaliculus. Persistent watering, discharge and inflammation near a punctum can resemble recurrent conjunctivitis, although the affected anatomical site is the drainage channel.',
      bullets: [
        'An inflamed canaliculus is distinct from the tear-producing gland or lacrimal sac.',
        'Source labels cannot identify a pathogen or a blocked lumen.',
      ],
    },
    clinical: {
      body: 'Persistent symptoms near the medial eyelid need eye-care assessment to distinguish canalicular disease from other causes of a red or watery eye.',
      bullets: [
        'Compare the selected channel with the adjacent sac without inferring missing branches.',
        'No probing, pressure test, expression of material or surgical technique is taught.',
      ],
    },
    references: ['https://eyewiki.aao.org/Canaliculitis'],
  },
  {
    key: 'nasolacrimal-ducts',
    identities: [
      [
        'FMA59555',
        'right',
        'isa',
        ['FJ1353'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA59556',
        'left',
        'isa',
        ['FJ1302'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One source-labelled nasolacrimal duct on each side. No validated lumen, distal valve, infant obstruction membrane, tear flow or surgical bypass route is represented.',
    pathology: {
      body: 'Nasolacrimal obstruction slows or prevents tear drainage towards the nose. Watering and discharge may result, and stagnation can increase infection risk. Obstruction may be congenital or acquired.',
      bullets: [
        'A narrow-looking reference surface is not evidence of obstruction.',
        "This adult reference does not reproduce an infant's developing drainage system.",
      ],
    },
    clinical: {
      body: 'Persistent watering or discharge needs an eye-care assessment to establish the cause and level of any drainage problem. The selected duct does not demonstrate whether tears can pass through it.',
      bullets: [
        'Keep the canaliculi, sac and final duct distinct during study.',
        'No irrigation result, dye-test interpretation, massage technique or device route is provided.',
      ],
    },
    references: [
      'https://my.clevelandclinic.org/health/diseases/17260-blocked-tear-duct-nasolacrimal-duct-obstruction',
    ],
  },
  {
    key: 'lacrimal-sacs',
    identities: [
      [
        'FMA59545',
        'right',
        'isa',
        ['FJ1360'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA59546',
        'left',
        'isa',
        ['FJ1309'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'Two separately indexed sac surfaces, not a filling reservoir, validated lumen or infected cavity. The medial tear-drainage location must not be confused with the upper outer tear-producing gland.',
    pathology: {
      body: 'Dacryocystitis involves inflammation and infection of the lacrimal sac, commonly with impaired tear drainage. Painful swelling near the inner eye corner or discharge may occur.',
      bullets: [
        'Sac disease is distinct from lacrimal-gland inflammation and canaliculitis.',
        'A reference sac does not show pus, abscess formation or the site of a blockage.',
      ],
    },
    clinical: {
      body: 'Painful medial eye swelling, redness, discharge or fever needs prompt clinical assessment. Chronic tear-drainage problems may present less dramatically.',
      bullets: [
        'The model cannot determine the severity or extent of a real infection.',
        'No compression test, drainage procedure, antibiotic regimen or operative bypass is supplied.',
      ],
    },
    references: [
      'https://my.clevelandclinic.org/health/diseases/24419-dacryocystitis',
    ],
  },
];
const byFma = new Map(
  headOrganClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function headOrganClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'organs')
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
