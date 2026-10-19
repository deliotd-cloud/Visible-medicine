import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type DentalClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'organ',
];
interface DentalClinicalGroup {
  key: string;
  identities: readonly DentalClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const dentalClinicalGroups: readonly DentalClinicalGroup[] = [
  {
    key: 'incisors',
    pathology: {
      body: 'Incisor injury can range from a chipped crown to loss of the whole tooth from its socket. These are different injuries, and the visible size of a chip does not establish the depth of damage.',
      bullets: [
        'Central and lateral incisors remain separate selections in both arches; this trauma example is not exclusive to incisors.',
        'A reference tooth cannot show an actual fracture or establish whether the pulp has been injured.',
      ],
    },
    clinical: {
      body: 'A damaged tooth needs dental assessment; a knocked-out permanent tooth needs emergency dental care. Do not reinsert a baby tooth. The adult teeth shown here must not be used to decide which dentition a child has.',
      bullets: [
        'The Crown/Root distinction in an avulsion teaching discussion is anatomical context, not a reimplantation procedure.',
        'The atlas cannot determine whether a real tooth can be saved or prescribe splinting or endodontic treatment.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/chipped-broken-or-cracked-tooth/',
      'https://www.nhs.uk/conditions/knocked-out-tooth/',
    ],
    identities: [
      [
        'FMA55680',
        'right',
        'isa',
        ['FJ1280'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55681',
        'right',
        'isa',
        ['FJ1279'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55682',
        'left',
        'isa',
        ['FJ1265'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55683',
        'left',
        'isa',
        ['FJ1266'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA57140',
        'right',
        'isa',
        ['FJ1273'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA57141',
        'left',
        'isa',
        ['FJ1259'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA57142',
        'right',
        'isa',
        ['FJ1272'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA57143',
        'left',
        'isa',
        ['FJ1258'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One indexed permanent-tooth surface per selection. Enamel, dentine, pulp, canals and periodontal attachment are not independently segmented. No dental numbering, paediatric dentition, tissue vitality or treatment simulation is inferred.',
  },
  {
    key: 'upper-canines',
    pathology: {
      body: 'An impacted upper canine has not erupted into its intended position. Its position may affect nearby teeth, including their roots; an erupted reference canine does not reproduce this developmental problem.',
      bullets: [
        'Impaction may concern one or both sides; select the actual side rather than assuming symmetry.',
        'A missing tooth in a clinical examination and an unrepresented atlas structure are not the same finding.',
      ],
    },
    clinical: {
      body: 'Assessment of an unerupted upper canine involves its position and neighbouring teeth. Orthodontic review determines whether alignment, monitoring or another approach is appropriate; no single option follows from selecting this surface.',
      bullets: [
        'The scene contains no eruption timetable, traction path or patient-specific risk calculation.',
        'No developing successor, retained baby canine or impacted-position mesh has been added.',
      ],
    },
    references: ['https://www.nuh.nhs.uk/orthodontics-tooth-impaction'],
    identities: [
      [
        'FMA55798',
        'right',
        'isa',
        ['FJ1281'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55799',
        'left',
        'isa',
        ['FJ1267'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One indexed permanent-tooth surface per selection. Enamel, dentine, pulp, canals and periodontal attachment are not independently segmented. No dental numbering, paediatric dentition, tissue vitality or treatment simulation is inferred.',
  },
  {
    key: 'lower-canines',
    pathology: {
      body: 'Periodontal disease affects the supporting tissues around teeth. Inflammation may progress from bleeding or swollen gums to loss of support and tooth mobility; the process is not confined to canines.',
      bullets: [
        'An intact-looking tooth surface does not demonstrate healthy gingiva or alveolar support.',
        'The selected lower canine is an orientation landmark, not a periodontal measurement.',
      ],
    },
    clinical: {
      body: 'Bleeding gums, recession or a loose tooth warrant dental assessment. Gingival examination, periodontal measurements and imaging when indicated evaluate support that this tooth surface does not represent.',
      bullets: [
        'Do not infer a pocket depth, attachment-loss stage or prognosis from the model.',
        'No scaling, probing technique, extraction decision or gum-treatment prescription is supplied.',
      ],
    },
    references: ['https://www.nidcr.nih.gov/health-info/gum-disease'],
    identities: [
      [
        'FMA55686',
        'right',
        'isa',
        ['FJ1274'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55687',
        'left',
        'isa',
        ['FJ1260'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One indexed permanent-tooth surface per selection. Enamel, dentine, pulp, canals and periodontal attachment are not independently segmented. No dental numbering, paediatric dentition, tissue vitality or treatment simulation is inferred.',
  },
  {
    key: 'premolars',
    pathology: {
      body: 'Cracks can produce intermittent pain during chewing or sensitivity to temperature. The symptoms may be difficult to localise and do not identify a crack by themselves.',
      bullets: [
        'First and second premolars in the upper and lower arches remain distinct, even though they share this teaching example.',
        'Crack extent and pulpal involvement are not reconstructed from the external reference surface.',
      ],
    },
    clinical: {
      body: 'Suspected cracking needs dental assessment. History and examination establish the affected tooth and guide further investigation; the apparent shape of a normal atlas tooth cannot determine treatment.',
      bullets: [
        'Changing view or using explode does not reveal a real fracture line.',
        'No individual canal count, access cavity, restoration design or root-canal procedure is inferred.',
      ],
    },
    references: [
      'https://www.aae.org/patients/dental-symptoms/cracked-teeth/',
      'https://www.nhs.uk/conditions/chipped-broken-or-cracked-tooth/',
    ],
    identities: [
      [
        'FMA55688',
        'right',
        'isa',
        ['FJ1278'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55689',
        'right',
        'isa',
        ['FJ1277'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55690',
        'left',
        'isa',
        ['FJ1262'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55691',
        'left',
        'isa',
        ['FJ1264'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55692',
        'left',
        'isa',
        ['FJ1257'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55693',
        'left',
        'isa',
        ['FJ1255'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55694',
        'right',
        'isa',
        ['FJ1269'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55695',
        'right',
        'isa',
        ['FJ1271'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One indexed permanent-tooth surface per selection. Enamel, dentine, pulp, canals and periodontal attachment are not independently segmented. No dental numbering, paediatric dentition, tissue vitality or treatment simulation is inferred.',
  },
  {
    key: 'upper-molars',
    pathology: {
      body: 'Dental caries involves acid-related loss of tooth mineral. Early lesions may have no symptoms; more advanced decay can form a cavity and lead to pain or infection.',
      bullets: [
        'Decay is possible in any tooth, not only these upper molars.',
        'Surface colour in this atlas is a material style, not a caries finding.',
      ],
    },
    clinical: {
      body: 'Dental examination, with radiographs when indicated, is needed to detect and assess decay. A painless or visually intact reference tooth cannot rule out disease.',
      bullets: [
        "First and second molars are represented; absent wisdom-tooth meshes do not diagnose a patient's missing or impacted teeth.",
        'No cavity-depth measurement, dental radiograph, sealant decision or restoration plan is generated.',
      ],
    },
    references: ['https://www.nidcr.nih.gov/health-info/tooth-decay'],
    identities: [
      [
        'FMA55697',
        'right',
        'isa',
        ['FJ1275'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55698',
        'right',
        'isa',
        ['FJ1276'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55699',
        'left',
        'isa',
        ['FJ1261'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55700',
        'left',
        'isa',
        ['FJ1263'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One indexed permanent-tooth surface per selection. Enamel, dentine, pulp, canals and periodontal attachment are not independently segmented. No dental numbering, paediatric dentition, tissue vitality or treatment simulation is inferred.',
  },
  {
    key: 'lower-molars',
    pathology: {
      body: 'A dental abscess is an infection-associated collection of pus in a tooth or surrounding gum. Pain, swelling, fever or a bad taste may occur; abscesses are not restricted to lower molars.',
      bullets: [
        'Decay, gum disease or injury can precede infection; the selected reference surface cannot identify its origin.',
        'The atlas contains no infected cavity or validated route of spread.',
      ],
    },
    clinical: {
      body: 'Suspected dental abscess requires urgent dental care and does not resolve on its own. Difficulty breathing, speaking or swallowing, or marked oral swelling, requires emergency assessment: call 999 or attend A&E in the UK.',
      bullets: [
        'A static tooth cannot determine the severity of infection or airway safety.',
        'No drainage method, antibiotic regimen, anaesthetic injection or surgical route is supplied.',
      ],
    },
    references: ['https://www.nhs.uk/conditions/dental-abscess/'],
    identities: [
      [
        'FMA55703',
        'left',
        'isa',
        ['FJ1256'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55704',
        'left',
        'isa',
        ['FJ1254'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55705',
        'right',
        'isa',
        ['FJ1268'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
      [
        'FMA55706',
        'right',
        'isa',
        ['FJ1270'],
        'head-neck',
        ['head-neck'],
        'organ',
      ],
    ],
    scope:
      'One indexed permanent-tooth surface per selection. Enamel, dentine, pulp, canals and periodontal attachment are not independently segmented. No dental numbering, paediatric dentition, tissue vitality or treatment simulation is inferred.',
  },
];
const byFma = new Map(
  dentalClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function dentalClinicalLesson(
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
