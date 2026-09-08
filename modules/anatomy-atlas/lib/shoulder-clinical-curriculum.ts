import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface ClinicalTopic {
  body: string;
  bullets: readonly string[];
}
export interface ShoulderClinicalGroup {
  key: string;
  identities: readonly (readonly [fmaId: string, side: string, file: string])[];
  scope: string;
  pathology: ClinicalTopic;
  clinical: ClinicalTopic;
  references: readonly string[];
}
const ortho = 'https://www.orthoinfo.org/diseases--conditions/';
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const cuff = ortho + 'rotator-cuff-tears/';
const cuffAnatomy = books + 'NBK441844/';
const axillary = books + 'NBK539895/';
const proximalBiceps = ortho + 'biceps-tendon-tear-at-the-shoulder/';
const distalBiceps = ortho + 'biceps-tendon-tear-at-the-elbow/';
const cuffScope =
  'Muscle surface only: tendon thickness, tear margins, retraction and bursae are not independently validated or simulated.';
const headScope =
  'One muscle head, not an independently segmented tendon. Notes about the shared distal apparatus apply to the muscle as a whole.';

/** Original short factual drafts; references are not licensed content imports.
 * Exact existing source identities only. No patient diagnosis or sign-off. */
export const shoulderClinicalGroups: readonly ShoulderClinicalGroup[] = [
  {
    key: 'serratus',
    identities: [
      ['FMA13398', 'right', 'FJ1459'],
      ['FMA13399', 'left', 'FJ1459M'],
    ],
    scope:
      'The long thoracic nerve and dynamic scapular winging are not rendered by this muscle surface.',
    pathology: {
      body: 'Long thoracic nerve injury can weaken serratus anterior, allowing the medial scapular border to lift away from the chest wall.',
      bullets: [
        'This is a nerve-related loss of muscle control, not necessarily a tear of the muscle.',
        'Altered scapular movement also has muscular, bony and joint-related causes; winging alone does not identify the cause.',
      ],
    },
    clinical: {
      body: 'Relate scapular support to overhead reach and observe the shoulder blade as well as the glenohumeral joint.',
      bullets: [
        'Clinical assessment compares scapular position and movement with the other side.',
        'When nerve injury is suspected, examination and electrodiagnostic testing may help; a static model cannot establish nerve function.',
      ],
    },
    references: [
      books + 'NBK531457/',
      ortho + 'scapular-shoulder-blade-disorders/',
    ],
  },
  {
    key: 'supraspinatus',
    identities: [['FMA32545', 'left', 'FJ1506M']],
    scope: cuffScope,
    pathology: {
      body: 'Supraspinatus is a frequent site of rotator-cuff tendon tearing, from acute injury or degenerative change.',
      bullets: [
        'Partial-thickness and full-thickness describe depth of tendon involvement; full-thickness does not necessarily mean its entire width is detached.',
        'Cuff tears can occur without pain.',
      ],
    },
    clinical: {
      body: 'Pain or weakness during arm elevation is relevant to cuff assessment, but does not by itself identify a torn supraspinatus.',
      bullets: [
        'The Jobe/empty-can test is an examination association, not a stand-alone diagnosis.',
        'Interpret findings with the history, other shoulder muscles and neck examination; this atlas provides no patient test result.',
      ],
    },
    references: [cuff, cuffAnatomy],
  },
  {
    key: 'infraspinatus',
    identities: [['FMA32548', 'left', 'FJ1500M']],
    scope: cuffScope,
    pathology: {
      body: 'Infraspinatus weakness or wasting can accompany tendon disease or suprascapular neuropathy.',
      bullets: [
        'A lesion near the suprascapular notch may affect both supraspinatus and infraspinatus.',
        'A more distal lesion near the spinoglenoid notch can spare supraspinatus. These are localisation clues, not diagnoses from appearance alone.',
      ],
    },
    clinical: {
      body: 'Relate the posterior cuff to external rotation and humeral-head control.',
      bullets: [
        'Compare external-rotation strength and the distribution of muscle wasting during clinical assessment.',
        'Tendon disruption and denervation are different mechanisms; this reference mesh cannot distinguish them in a patient.',
      ],
    },
    references: [books + 'NBK513255/', cuffAnatomy],
  },
  {
    key: 'subscapularis',
    identities: [['FMA13415', 'left', 'FJ1504M']],
    scope: cuffScope,
    pathology: {
      body: 'Subscapularis tendon injury involves the anterior rotator cuff and can impair its contribution to internal rotation and joint stability.',
      bullets: [
        'A tendon lesion is distinct from a muscle-belly injury.',
        'The displayed lesser-tubercle relationship is orientation context, not a measured tear or attachment footprint.',
      ],
    },
    clinical: {
      body: 'Lift-off, belly-press and bear-hug tests are clinical associations used when assessing subscapularis.',
      bullets: [
        'Pain, weakness and restricted movement require interpretation together; one manoeuvre does not provide a complete diagnosis.',
        'The atlas does not model a patient response or prescribe an examination after an injury.',
      ],
    },
    references: [cuffAnatomy, cuff],
  },
  {
    key: 'teres-minor',
    identities: [['FMA32554', 'left', 'FJ1508M']],
    scope: cuffScope,
    pathology: {
      body: 'Teres minor can be affected by cuff tendon disease or by axillary nerve dysfunction.',
      bullets: [
        'Axillary nerve compression in the quadrangular space is one possible cause of teres minor wasting.',
        'Do not label isolated wasting as quadrangular-space syndrome without clinical assessment.',
      ],
    },
    clinical: {
      body: 'External rotation with the arm elevated is relevant to teres minor assessment; the hornblower sign is a recognised examination association.',
      bullets: [
        'Consider the deltoid and axillary nerve alongside the posterior cuff.',
        'Teres major is a different muscle and is not part of the rotator cuff.',
      ],
    },
    references: [books + 'NBK513324/', axillary, cuffAnatomy],
  },
  {
    key: 'deltoid',
    identities: [
      ['FMA34681', 'left', 'FJ1468M'],
      ['FMA34683', 'left', 'FJ1467M'],
      ['FMA34685', 'left', 'FJ1513M'],
    ],
    scope:
      'One deltoid portion. Shared nerve-related teaching is not proof of an isolated lesion in the selected portion.',
    pathology: {
      body: 'Axillary nerve injury can weaken the deltoid, including after a shoulder dislocation. Persistent denervation may lead to wasting.',
      bullets: [
        'Reduced arm abduction may accompany altered sensation over the lateral shoulder.',
        'Pain and limited movement after injury can obscure weakness; nerve dysfunction is not equivalent to a torn deltoid.',
      ],
    },
    clinical: {
      body: 'Assessment considers deltoid function, lateral-shoulder sensation and the rest of the shoulder rather than the selected portion alone.',
      bullets: [
        'The axillary nerve also supplies teres minor.',
        'This atlas supplies no nerve-conduction measurement, injection landmark or dislocation-reduction guidance.',
      ],
    },
    references: [axillary],
  },
  {
    key: 'biceps-short',
    identities: [
      ['FMA37684', 'right', 'FJ1512'],
      ['FMA37685', 'left', 'FJ1512M'],
    ],
    scope: headScope,
    pathology: {
      body: 'The short-head shoulder attachment is usually retained when the proximal long-head tendon ruptures.',
      bullets: [
        'A proximal long-head rupture should not be labelled as a short-head rupture.',
        'Distal biceps injury involves the radial attachment of the combined muscle, not a second proximal long-head lesion.',
      ],
    },
    clinical: {
      body: 'Preserved elbow bending does not exclude a biceps tendon injury.',
      bullets: [
        'Distal tendon disruption can particularly reduce supination strength.',
        'Identify whether teaching concerns the shoulder or elbow attachment before interpreting a described deformity.',
      ],
    },
    references: [proximalBiceps, distalBiceps],
  },
  {
    key: 'biceps-long',
    identities: [['FMA37687', 'left', 'FJ1478M']],
    scope: headScope,
    pathology: {
      body: 'Proximal long-head tendon rupture may cause distal bunching of the muscle belly, often called a Popeye deformity.',
      bullets: [
        'The short-head attachment often remains intact.',
        'A distal biceps rupture is a separate injury at the elbow; retraction is towards the shoulder.',
      ],
    },
    clinical: {
      body: 'The location of bruising, weakness and a change in muscle contour helps distinguish shoulder-end from elbow-end injury.',
      bullets: [
        'A normal-looking contour does not rule out a partial tear.',
        'The selected muscle head is not a patient tendon study or a simulated rupture.',
      ],
    },
    references: [proximalBiceps, distalBiceps],
  },
  {
    key: 'triceps',
    identities: [
      ['FMA37695', 'right', 'FJ1480'],
      ['FMA37696', 'left', 'FJ1480M'],
      ['FMA37697', 'right', 'FJ1477'],
      ['FMA37698', 'left', 'FJ1477M'],
      ['FMA37699', 'right', 'FJ1479'],
      ['FMA37700', 'left', 'FJ1479M'],
    ],
    scope: headScope,
    pathology: {
      body: 'Distal triceps tendon injury affects its connection to the olecranon. Tears can be partial or complete.',
      bullets: [
        'An acute pushing load or fall may injure this extensor mechanism.',
        'Posterior elbow pain, swelling and extension weakness are relevant, but weakness is not always obvious.',
      ],
    },
    clinical: {
      body: 'Clinical assessment considers active elbow extension and the shared distal tendon, not just one of the three muscle heads.',
      bullets: [
        'Some retained extension does not settle the extent of a suspected tear.',
        'Ultrasound or MRI may help assess tendon continuity; no acquired imaging or tear segmentation is included here.',
      ],
    },
    references: [ortho + 'triceps-tendon-tear-at-the-elbow/'],
  },
];

const byFma = new Map(
  shoulderClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
export function shoulderClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle' ||
    s.region !== 'shoulder-arm' ||
    s.regions.length !== 1 ||
    s.regions[0] !== 'shoulder-arm' ||
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
  const { group } = match;
  const topic = group[tab];
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
