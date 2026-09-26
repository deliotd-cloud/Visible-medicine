import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
import type { ShoulderClinicalGroup } from './shoulder-clinical-curriculum';

/** Original brief lower-leg teaching drafts; independent clinical review pending. */
export const legClinicalGroups: readonly ShoulderClinicalGroup[] = [
  {
    key: 'extensor-digitorum-longus',
    identities: [
      ['FMA22548', 'right', 'FJ1406'],
      ['FMA22549', 'left', 'FJ1406M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Weakness of the long toe extensors can accompany anterior-compartment muscle injury or dysfunction of their deep fibular motor supply.',
      bullets: [
        'Difficulty straightening toes 2–5 is not sufficient to distinguish a tendon lesion from neurological weakness.',
      ],
    },
    clinical: {
      body: 'Compare lesser-toe extension with ankle dorsiflexion and the wider motor/sensory pattern.',
      bullets: [
        'A muscle-belly selection does not isolate its individual distal tendon slips.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK539725/',
      'https://www.ncbi.nlm.nih.gov/books/NBK554393/',
    ],
  },
  {
    key: 'extensor-hallucis-longus',
    identities: [
      ['FMA22546', 'right', 'FJ1408'],
      ['FMA22547', 'left', 'FJ1408M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Impaired great-toe extension may reflect local muscle/tendon injury or a neurological lesion.',
      bullets: ['Great-toe weakness alone does not prove an L5 root lesion.'],
    },
    clinical: {
      body: 'Assess hallux extension alongside other dorsiflexors and the neurological examination.',
      bullets: [
        'The long extensor reaches the distal phalanx; short hallux-extensor action is not an equivalent substitute.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK539725/',
      'https://www.ncbi.nlm.nih.gov/books/NBK554393/',
    ],
  },
  {
    key: 'fibularis-brevis',
    identities: [
      ['FMA22554', 'right', 'FJ1409'],
      ['FMA22555', 'left', 'FJ1409M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Fibularis brevis can develop tendinopathy, longitudinal tendon splitting or displacement around the lateral ankle.',
      bullets: [
        'Lateral ankle pain is not always a ligament sprain; tendon and ligament injuries can coexist.',
      ],
    },
    clinical: {
      body: 'Localise symptoms along the retromalleolar tendon and towards its fifth-metatarsal attachment.',
      bullets: [
        'Distinguish painful eversion from superficial-fibular motor weakness.',
        'A static reference surface cannot demonstrate dynamic tendon subluxation.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK544354/',
      'https://www.ncbi.nlm.nih.gov/books/NBK519526/',
    ],
  },
  {
    key: 'fibularis-longus',
    identities: [
      ['FMA22552', 'right', 'FJ1410'],
      ['FMA22553', 'left', 'FJ1410M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Fibularis longus tendon disease can cause lateral ankle or plantar-lateral foot pain.',
      bullets: [
        'Its plantar course around the cuboid differs from the brevis tendon ending at the fifth-metatarsal base.',
      ],
    },
    clinical: {
      body: 'Relate eversion and first-ray support to the longus tendon course.',
      bullets: [
        'If an os peroneum is present within the tendon, its associated pathology requires separate assessment; this atlas selection does not establish that variant.',
        'Do not infer tendon integrity from preserved muscle-belly geometry.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK544354/',
      'https://www.ncbi.nlm.nih.gov/books/NBK519526/',
    ],
  },
  {
    key: 'fibularis-tertius',
    identities: [
      ['FMA22550', 'right', 'FJ1411'],
      ['FMA22551', 'left', 'FJ1411M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Tertius can share weakness with other anterior-compartment muscles in deep fibular nerve dysfunction.',
      bullets: [
        'Its normal presence and separation from extensor digitorum longus vary; anatomical absence is not an acquired tear.',
      ],
    },
    clinical: {
      body: 'Despite its fibularis name, tertius belongs to the anterior compartment and assists dorsiflexion as well as eversion.',
      bullets: [
        'It should not be assigned the superficial fibular supply of longus and brevis.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK539725/'],
  },
  {
    key: 'flexor-digitorum-longus',
    identities: [
      ['FMA65016', 'right', 'FJ1414'],
      ['FMA65017', 'left', 'FJ1414M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Long toe-flexor injury or tibial motor dysfunction can alter active lesser-toe flexion.',
      bullets: [
        'A curled toe does not by itself identify a torn or overactive FDL; joint position and other muscles also matter.',
      ],
    },
    clinical: {
      body: 'Relate FDL to distal-joint flexion of toes 2–5, while recognising the combined action of long and intrinsic flexors.',
      bullets: [
        'This grouped tendon course cannot establish the integrity of one digital slip or diagnose a specific motor lesion.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK537340/'],
  },
  {
    key: 'flexor-hallucis-longus',
    identities: [
      ['FMA65014', 'right', 'FJ1415'],
      ['FMA65015', 'left', 'FJ1415M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'FHL can develop tendon-sheath inflammation and tendon tears in dancers and nondancers.',
      bullets: [
        'Repeated pointe work can be associated with symptoms, but FHL disease is not confined to ballet.',
      ],
    },
    clinical: {
      body: 'Posteromedial ankle symptoms with hallux movement may prompt assessment of the FHL tendon and its sheath.',
      bullets: [
        'Correlate imaging with the clinical findings; the cited surgical series does not establish prevalence, a diagnostic rule or a recovery timetable.',
        'Long hallux flexion acts at the distal phalanx, unlike the short flexor insertion.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/9677077/',
      'https://pubmed.ncbi.nlm.nih.gov/8816655/',
      'https://www.ncbi.nlm.nih.gov/books/NBK537340/',
    ],
  },
  {
    key: 'plantaris',
    identities: [
      ['FMA22560', 'right', 'FJ1429'],
      ['FMA22561', 'left', 'FJ1429M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Plantaris injury is possible, but the label tennis leg should not automatically be equated with plantaris rupture.',
      bullets: [
        'A clinical ultrasound study found medial gastrocnemius injury much more often than plantaris rupture.',
      ],
    },
    clinical: {
      body: 'Acute calf pain requires consideration of other muscle injuries and non-muscular causes, including deep-vein thrombosis.',
      bullets: [
        'The long thin plantaris tendon is not a nerve; absence or variable insertion can be normal.',
        'Neither selecting nor exploding this reference muscle excludes thrombosis.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/12091669/',
      'https://www.ncbi.nlm.nih.gov/books/NBK459362/',
    ],
  },
  {
    key: 'popliteus',
    identities: [
      ['FMA22591', 'right', 'FJ1430'],
      ['FMA22592', 'left', 'FJ1430M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Popliteus injury may occur alone or as part of a wider posterolateral knee injury.',
      bullets: [
        'Pain at the back or outer side of the knee is not a stand-alone popliteus diagnosis.',
      ],
    },
    clinical: {
      body: 'Relate symptoms to knee rotation and the wider ligament, meniscal and stability assessment.',
      bullets: [
        'The muscle does not cross the ankle.',
        'The isolated-injury literature is limited; athlete case reports and series do not supply a universal treatment or return-to-sport rule.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/35252463/',
      'https://www.ncbi.nlm.nih.gov/books/NBK526084/',
    ],
  },
  {
    key: 'soleus',
    identities: [
      ['FMA22558', 'right', 'FJ1437'],
      ['FMA22559', 'left', 'FJ1437M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Soleus strain and injury to the shared Achilles apparatus can both affect calf loading, but they are not the same lesion.',
      bullets: [
        'A deep calf muscle lesion can be difficult to localise from pain alone.',
      ],
    },
    clinical: {
      body: 'Soleus crosses the ankle, not the knee; bending the knee changes gastrocnemius length without turning movement into a perfectly isolated soleus test.',
      bullets: [
        'Acute severe or escalating calf pain after injury, particularly with tense swelling or neurological change, warrants emergency assessment for possible compartment syndrome.',
        'Explode mode does not model pressure or perform a decompression.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK537340/',
      'https://pubmed.ncbi.nlm.nih.gov/12091669/',
      'https://www.orthoinfo.org/diseases--conditions/compartment-syndrome/',
    ],
  },
  {
    key: 'tibialis-anterior',
    identities: [
      ['FMA22544', 'right', 'FJ1439'],
      ['FMA22545', 'left', 'FJ1439M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Tibialis-anterior tendon disease or rupture can impair dorsiflexion. Foot drop can also arise from nerve, root or other neurological disease.',
      bullets: [
        'A foot-drop pattern is not synonymous with a torn tibialis-anterior tendon.',
      ],
    },
    clinical: {
      body: 'Assess ankle dorsiflexion and inversion alongside toe extension, sensation and gait.',
      bullets: [
        'Differentiate local tendon failure from a broader neurological pattern; a single movement cannot localise the lesion.',
        'Acute compartment syndrome threatens muscle and nerve perfusion and needs emergency assessment, unlike a routine exertional ache.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK513304/',
      'https://www.ncbi.nlm.nih.gov/books/NBK554393/',
      'https://www.orthoinfo.org/diseases--conditions/compartment-syndrome/',
    ],
  },
  {
    key: 'tibialis-posterior',
    identities: [
      ['FMA65018', 'right', 'FJ1440'],
      ['FMA65019', 'left', 'FJ1440M'],
    ],
    scope:
      'Reference muscle surface only; no pathological tendon, nerve territory, compartment pressure or patient-specific lesion is represented.',
    pathology: {
      body: 'Posterior tibial tendon dysfunction can contribute to progressive collapsing foot deformity.',
      bullets: [
        'Arch collapse is a multi-structure problem involving ligaments and alignment, not simply one damaged muscle.',
      ],
    },
    clinical: {
      body: 'Medial ankle/arch symptoms, standing alignment and heel-rise function help assess the posterior tibial apparatus.',
      bullets: [
        'Pain-limited performance is not proof of tendon rupture.',
        'This source does not show spring-ligament failure, weight-bearing collapse or a validated deformity stage.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/posterior-tibial-tendon-dysfunction',
      'https://www.ncbi.nlm.nih.gov/books/NBK539913/',
    ],
  },
  {
    key: 'gastrocnemius',
    identities: [
      ['FMA45957', 'right', 'FJ1397'],
      ['FMA45958', 'left', 'FJ1397M'],
      ['FMA45960', 'right', 'FJ1394'],
      ['FMA45961', 'left', 'FJ1394M'],
    ],
    scope:
      'Whole-apparatus clinical context applies to both source heads; no diseased surface, subtendon or patient-specific lesion is segmented.',
    pathology: {
      body: 'Gastrocnemius strains and Achilles tendon ruptures are distinct injuries. Medial gastrocnemius injury is a common explanation for the clinical label tennis leg.',
      bullets: [
        'Calf pain can also involve soleus, plantaris or deep-vein thrombosis; location alone is insufficient.',
      ],
    },
    clinical: {
      body: 'Gastrocnemius crosses knee and ankle, whereas soleus does not. Both transmit force through the shared Achilles apparatus.',
      bullets: [
        'Sudden posterior ankle pain with loss of push-off warrants prompt assessment for Achilles injury.',
        'The selected head is not a separate Achilles subtendon, simulated tear or calf-squeeze examination.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/12091669/',
      'https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear/',
      'https://www.ncbi.nlm.nih.gov/books/NBK459362/',
    ],
  },
];

const byFma = new Map(
  legClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
export function legClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle' ||
    s.region !== 'leg' ||
    s.regions.length !== 1 ||
    s.regions[0] !== 'leg' ||
    s.sourceTree !== 'isa'
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (
    !match ||
    s.laterality !== match.identity[1] ||
    s.sources.length !== 1 ||
    s.sources[0].file !== match.identity[2]
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
