import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
import type { ShoulderClinicalGroup } from './shoulder-clinical-curriculum';

/** Original short factual drafts, with explicit official identities. Shared
 * head/group context is not individual muscle or nerve-lesion segmentation. */
export const handClinicalGroups: readonly ShoulderClinicalGroup[] = [
  {
    key: 'abductor-digiti-minimi',
    identities: [
      ['FMA37396', 'right', 'FJ1466'],
      ['FMA37397', 'left', 'FJ1466M'],
    ],
    scope:
      'Reference muscle surface only; no denervation, tear, joint disease or patient-specific nerve course is represented.',
    pathology: {
      body: 'Ulnar motor nerve dysfunction can weaken little-finger abduction and, when longstanding, accompany wasting of the hypothenar muscles.',
      bullets: [
        'A resting little finger held away from its neighbours can instead reflect impaired adduction; it is not proof of abductor injury.',
      ],
    },
    clinical: {
      body: 'Distinguish active spreading of the little finger from its resting position.',
      bullets: [
        'ADM supplies little-finger abduction; the dorsal interossei serve other digits.',
        'Interpret strength alongside other intrinsic muscles and sensation rather than diagnosing from one movement.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK546622/',
      'https://www.ncbi.nlm.nih.gov/books/NBK534772/',
    ],
  },
  {
    key: 'flexor-digiti-minimi',
    identities: [
      ['FMA37398', 'right', 'FJ1470'],
      ['FMA37399', 'left', 'FJ1470M'],
    ],
    scope:
      'Reference muscle surface only; no denervation, tear, joint disease or patient-specific nerve course is represented.',
    pathology: {
      body: 'Weakness of this ulnar-supplied intrinsic flexor can contribute to reduced control of the little-finger knuckle.',
      bullets: [
        'Pain-limited movement, tendon injury and neurological weakness are different possible explanations for impaired flexion.',
      ],
    },
    clinical: {
      body: 'Its main contribution is metacarpophalangeal flexion, not isolated bending of the fingertip.',
      bullets: [
        'Finger flexion also depends on the long flexor tendons and other intrinsic muscles.',
        'A single finger movement cannot independently establish the condition of this small muscle.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK546622/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
    ],
  },
  {
    key: 'opponens-digiti-minimi',
    identities: [
      ['FMA37400', 'right', 'FJ1482'],
      ['FMA37401', 'left', 'FJ1482M'],
    ],
    scope:
      'Reference muscle surface only; no denervation, tear, joint disease or patient-specific nerve course is represented.',
    pathology: {
      body: 'Ulnar motor dysfunction affecting the hypothenar muscles can reduce the ability to cup the palm around objects.',
      bullets: [
        'The affected muscles depend on the level and branches involved; not every distal ulnar lesion has the same pattern.',
      ],
    },
    clinical: {
      body: 'Opponens digiti minimi acts on metacarpal V, helping orient the little-finger side of the palm.',
      bullets: [
        'This differs from flexing a finger joint with the long tendons.',
        'Compare hand function with sensory findings and forearm muscles when considering the level of nerve dysfunction.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK546622/',
      'https://www.ncbi.nlm.nih.gov/books/NBK431063/',
    ],
  },
  {
    key: 'abductor-pollicis-brevis',
    identities: [
      ['FMA37386', 'right', 'FJ1483'],
      ['FMA37387', 'left', 'FJ1483M'],
    ],
    scope:
      'Reference muscle surface only; no denervation, tear, joint disease or patient-specific nerve course is represented.',
    pathology: {
      body: 'Median nerve dysfunction can weaken palmar thumb abduction. Advanced carpal tunnel syndrome may be accompanied by thenar wasting.',
      bullets: [
        'Not every case of carpal tunnel syndrome causes visible atrophy or motor loss.',
      ],
    },
    clinical: {
      body: 'APB lifts the thumb away from the plane of the palm; this is different from APL movement at the thumb base.',
      bullets: [
        'Motor assessment and the distribution of sensory symptoms provide complementary information.',
        'Skin over the thenar eminence is typically supplied by a branch passing outside the tunnel; muscle weakness and overlying skin sensation need not change together.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/carpal-tunnel-syndrome/',
      'https://www.ncbi.nlm.nih.gov/books/NBK580533/',
    ],
  },
  {
    key: 'opponens-pollicis',
    identities: [
      ['FMA37390', 'right', 'FJ1501'],
      ['FMA37391', 'left', 'FJ1501M'],
    ],
    scope:
      'Reference muscle surface only; no denervation, tear, joint disease or patient-specific nerve course is represented.',
    pathology: {
      body: 'Impaired thumb opposition may reflect thenar motor dysfunction, but painful thumb-base arthritis can also limit grip and pinch.',
      bullets: [
        'Joint pain and loss of muscle innervation are not interchangeable diagnoses.',
      ],
    },
    clinical: {
      body: 'Opposition includes rotation of metacarpal I to orient the thumb pad towards the fingers, not merely bending the thumb.',
      bullets: [
        'Consider pain, joint movement, strength and sensation together.',
        'Several muscles cooperate in opposition; the selected surface is not an isolated clinical test or a verified recurrent-motor-branch map.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK580533/',
      'https://www.orthoinfo.org/diseases--conditions/arthritis-of-the-thumb/',
    ],
  },
  {
    key: 'adductor-pollicis',
    identities: [
      ['FMA46121', 'right', 'FJ1481'],
      ['FMA46122', 'left', 'FJ1481M'],
      ['FMA46123', 'right', 'FJ1515'],
      ['FMA46124', 'left', 'FJ1515M'],
    ],
    scope:
      'Oblique and transverse heads share whole-muscle clinical context; neither head independently localises a nerve lesion.',
    pathology: {
      body: 'Deep ulnar motor branch dysfunction can weaken thumb adduction and lateral pinch.',
      bullets: [
        'This differs from median-related opposition weakness or disruption of a thumb flexor tendon.',
      ],
    },
    clinical: {
      body: 'Froment’s sign describes compensatory thumb interphalangeal flexion by FPL when adductor function is weak.',
      bullets: [
        'The compensation recruits an anterior-interosseous/median-supplied muscle rather than restoring normal ulnar adductor function.',
        'The sign alone does not establish a wrist, elbow or more proximal lesion.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK431063/'],
  },
  {
    key: 'lumbricals',
    identities: [
      ['FMA42398', 'right', 'FJ1510'],
      ['FMA42399', 'left', 'FJ1510M'],
    ],
    scope:
      'The selection is the lumbrical group, not four individually numbered muscles or a segmented motor-territory map.',
    pathology: {
      body: 'Loss of intrinsic muscle balance can contribute to clawing: excessive knuckle extension with bent interphalangeal joints.',
      bullets: [
        'Ulnar dysfunction typically affects lumbricals 3–4; the first two usually receive median supply. The whole group must not be labelled ulnar-only.',
      ],
    },
    clinical: {
      body: 'Lumbricals help combine knuckle flexion with finger-joint extension through the extensor apparatus.',
      bullets: [
        'Interossei also contribute; this posture is not an isolated lumbrical test.',
        'Some anomalous or enlarged lumbricals can contribute to carpal-tunnel crowding, but that variant is not established by this grouped reference surface.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK534876/',
      'https://www.ncbi.nlm.nih.gov/books/NBK539810/',
    ],
  },
  {
    key: 'palmar-interossei',
    identities: [
      ['FMA42402', 'right', 'FJ1511'],
      ['FMA42403', 'left', 'FJ1511M'],
    ],
    scope:
      'Group-level teaching only; individual numbered muscles and the disputed separate thumb component are not established by this selection.',
    pathology: {
      body: 'Deep ulnar nerve dysfunction may reduce finger adduction and contribute to intrinsic imbalance.',
      bullets: [
        'Persistent outward drift of the little finger is a recognised finding in ulnar weakness, not a stand-alone diagnosis.',
      ],
    },
    clinical: {
      body: 'Palmar interossei draw fingers towards the middle-finger axis, while also assisting knuckle flexion and finger-joint extension.',
      bullets: [
        'Distinguish this action from spreading by the dorsal interossei.',
        'Finger position depends on competing muscles, tendons and joints; the atlas does not measure their strength.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK534772/'],
  },
  {
    key: 'dorsal-interossei',
    identities: [
      ['FMA42404', 'right', 'FJ1509'],
      ['FMA42405', 'left', 'FJ1509M'],
    ],
    scope:
      'The source groups the dorsal interossei; a particular web-space muscle or its denervation is not independently segmented.',
    pathology: {
      body: 'Ulnar motor dysfunction can impair finger spreading and cause interosseous wasting.',
      bullets: [
        'Intrinsic weakness may contribute to clawing, but deformity involves the wider balance of intrinsic and extrinsic forces.',
      ],
    },
    clinical: {
      body: 'Dorsal interossei move fingers 2–4 away from the middle-finger axis; ADM supplies little-finger abduction.',
      bullets: [
        'The middle finger can move towards either side of its axis.',
        'Assess the pattern across muscles and sensation; apparent wasting in a reference mesh cannot diagnose neuropathy.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK534772/',
      'https://www.ncbi.nlm.nih.gov/books/NBK539810/',
    ],
  },
];

const byFma = new Map(
  handClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
export function handClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle' ||
    s.region !== 'hand' ||
    s.regions.length !== 1 ||
    s.regions[0] !== 'hand' ||
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
