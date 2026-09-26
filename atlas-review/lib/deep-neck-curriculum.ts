import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface DeepNeckMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution: string;
  references: readonly string[];
}
// Existing left/right source identities in the spine route; no level-specific mesh admission.
export const deepNeckMuscleLessons: readonly DeepNeckMuscleLesson[] = [
  {
    key: 'longus-capitis',
    fmaIds: ['FMA46310', 'FMA46309'],
    origin: 'Anterior tubercles on the C3–C6 transverse processes.',
    insertion:
      'Basilar region of the occipital bone, in front of the foramen magnum.',
    action: 'Helps nod the head forwards at the craniocervical junction.',
    motorSupply: 'Cervical anterior rami, usually described as C1–C3.',
    caution:
      'Longus capitis reaches the skull; it is not the separately named longus colli. The surface does not establish individual segmental slips.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/prevertebral-muscles',
      'https://www.ncbi.nlm.nih.gov/books/NBK560569/',
    ],
  },
  {
    key: 'rectus-capitis-anterior',
    fmaIds: ['FMA46314', 'FMA46313'],
    origin:
      'Front of the atlas lateral mass near the root of its transverse process.',
    insertion:
      'Underside of the occipital basilar region, anterior to its condyle.',
    action:
      'Assists forward nodding and stabilization at the atlanto-occipital joint.',
    motorSupply: 'Upper cervical anterior rami, commonly C1–C2.',
    caution:
      'Its anterior-ramus supply is distinct from the posterior C1 suboccipital nerve. It does not insert on the jugular process like rectus capitis lateralis.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/prevertebral-muscles',
    ],
  },
  {
    key: 'rectus-capitis-lateralis',
    fmaIds: ['FMA46318', 'FMA46317'],
    origin: 'Upper aspect of the atlas transverse process.',
    insertion: 'Underside of the occipital jugular process.',
    action:
      'Helps tilt the head towards its own side and steady the atlanto-occipital joint.',
    motorSupply: 'Upper cervical anterior rami, commonly C1–C2.',
    caution:
      'This short lateral muscle is not one of the four posterior suboccipital muscles; its nearby joints and nerve branches are not validated by selecting it.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/prevertebral-muscles',
    ],
  },
  {
    key: 'rectus-capitis-posterior-major',
    fmaIds: ['FMA32531', 'FMA32530'],
    origin: 'Spinous process of the axis (C2).',
    insertion: 'Lateral part of the occipital inferior nuchal line.',
    action: 'Helps extend the head and turn it towards the contracting side.',
    motorSupply: 'Suboccipital nerve, the posterior ramus of C1.',
    caution:
      'It borders the suboccipital triangle; that teaching relationship does not validate a safe corridor around the vertebral artery.',
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK567762/',
      'https://ncbi.nlm.nih.gov/books/NBK556133/',
    ],
  },
  {
    key: 'rectus-capitis-posterior-minor',
    fmaIds: ['FMA32533', 'FMA32532'],
    origin: 'Posterior tubercle of the atlas (C1).',
    insertion: 'Medial inferior-nuchal region of the occipital bone.',
    action: 'Assists head extension and fine postural control.',
    motorSupply: 'Suboccipital nerve, the posterior ramus of C1.',
    caution:
      'It is not one of the three muscle borders of the suboccipital triangle. A myodural connection is not separately segmented or validated here.',
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK567762/',
      'https://ncbi.nlm.nih.gov/books/NBK556133/',
    ],
  },
  {
    key: 'obliquus-capitis-superior',
    fmaIds: ['FMA32535', 'FMA32534'],
    origin: 'Transverse process of the atlas (C1).',
    insertion: 'Occipital bone between its nuchal lines.',
    action: 'Helps extend the head and tilt it towards its own side.',
    motorSupply: 'Suboccipital nerve, the posterior ramus of C1.',
    caution:
      'This muscle reaches the skull, unlike obliquus capitis inferior. A source surface cannot demonstrate individual joint stability.',
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK567762/',
      'https://ncbi.nlm.nih.gov/books/NBK556133/',
    ],
  },
  {
    key: 'obliquus-capitis-inferior',
    fmaIds: ['FMA32537', 'FMA32536'],
    origin: 'Spinous process of the axis (C2).',
    insertion:
      'Transverse process of the atlas (C1), with no skull attachment.',
    action:
      'Turns the atlas, carrying the head, towards the contracting side at the atlanto-axial joint.',
    motorSupply: 'Suboccipital nerve, the posterior ramus of C1.',
    caution:
      'Despite capitis in its name, it joins C2 to C1. No operative or injection trajectory follows from its displayed position.',
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK567762/',
      'https://ncbi.nlm.nih.gov/books/NBK556133/',
    ],
  },
  {
    key: 'splenius-capitis',
    fmaIds: ['FMA22729', 'FMA22728'],
    origin: 'Lower nuchal ligament and posterior midline spines around C7–T3.',
    insertion:
      'Temporal mastoid process and lateral superior-nuchal region of the occipital bone.',
    action:
      'Both sides help extend the head and neck; one side helps tilt and turn the head towards itself.',
    motorSupply: 'Branches of cervical spinal posterior rami.',
    caution:
      "Its same-side rotation differs from sternocleidomastoid's usual opposite-side rotation. Exact attachment and segmental nerve ranges need review.",
    references: [
      'https://www.kenhub.com/en/library/anatomy/splenius-capitis-muscle',
    ],
  },
  {
    key: 'splenius-cervicis',
    fmaIds: ['FMA22727', 'FMA22726'],
    origin:
      'Posterior midline spines of upper thoracic vertebrae, commonly T3–T6.',
    insertion:
      'Transverse processes of upper cervical vertebrae, commonly C1–C3.',
    action:
      'Both sides help extend the neck; one side assists bending and turning it towards itself.',
    motorSupply: 'Branches of cervical spinal posterior rami.',
    caution:
      'The cervical attachment is not a mastoid insertion. Close blending with splenius capitis does not make the two source identities interchangeable.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/splenius-cervicis-muscle',
    ],
  },
  {
    key: 'longissimus-capitis',
    fmaIds: ['FMA22756', 'FMA22754'],
    origin:
      'Processes of the lower cervical and upper thoracic vertebrae; exact attachment sites and level range need source-specific review.',
    insertion: 'Temporal mastoid process.',
    action:
      'Helps extend the head and neck; unilateral activity also assists same-side tilt and rotation.',
    motorSupply: 'Branches of cervical spinal posterior rami.',
    caution:
      'The cited overview simplifies cervical attachment terminology. This regional wording does not assign a transverse or articular footprint to each source slip.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/longissimus-muscle',
    ],
  },
  {
    key: 'longissimus-cervicis',
    fmaIds: ['FMA22758', 'FMA22757'],
    origin: 'Upper thoracic transverse processes, typically T1–T5.',
    insertion: 'Cervical transverse processes, typically C2–C6.',
    action:
      'Helps extend the cervical spine with both sides active and bend it towards the active side unilaterally.',
    motorSupply: 'Branches of cervical spinal posterior rami.',
    caution:
      'Its superior attachments are cervical vertebrae, not the skull. The single source file does not separate all segmental tendons.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/longissimus-muscle',
    ],
  },
  {
    key: 'semispinalis-capitis',
    fmaIds: ['FMA22877', 'FMA22876'],
    origin:
      'Lower cervical articular processes and upper thoracic transverse processes, typically C4–C7 and T1–T6 respectively.',
    insertion: 'Occipital bone between the superior and inferior nuchal lines.',
    action:
      'Helps extend the head and neck; one side contributes to opposite-side rotation.',
    motorSupply:
      'Cervical posterior-ramus branches, including contributions commonly described from C2 and C3.',
    caution:
      'This is not a suboccipital-nerve-only muscle. Its source file does not independently resolve segmental tendons or the paths of nerves piercing nearby tissues.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/semispinalis-capitis-muscle',
    ],
  },
  {
    key: 'semispinalis-cervicis',
    fmaIds: ['FMA22875', 'FMA22874'],
    origin:
      'Transverse processes of the upper thoracic vertebrae, typically T1–T6.',
    insertion: 'Cervical spinous processes, typically C2–C5.',
    action:
      'Assists cervical extension bilaterally and opposite-side rotation when one side contracts.',
    motorSupply: 'Medial branches of cervical spinal posterior rami.',
    caution:
      'It attaches to cervical vertebrae, unlike semispinalis capitis. A continuous mesh does not identify every laminated fibre or vertebral span.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/semispinalis-cervicis-muscle',
    ],
  },
  {
    key: 'iliocostalis-cervicis',
    fmaIds: ['FMA22745', 'FMA22744'],
    origin: 'Angles of ribs 3–6 in the typical description.',
    insertion:
      'Transverse processes of the lower cervical vertebrae, commonly C4–C6.',
    action:
      'Helps extend the neck with both sides active and bend it towards the contracting side.',
    motorSupply: 'Branches of cervical spinal posterior rami.',
    caution:
      'Although part of the iliocostalis column, this cervical part begins on ribs, not directly on the iliac crest. These are typical attachments, not measured source footprints.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/intrinsic-back-muscles',
    ],
  },
];
const byFma = new Map(
  deepNeckMuscleLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function deepNeckMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('spine')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body:
      tab === 'anatomy'
        ? 'Typical anatomical attachments are described here, not measured footprints or individually validated muscle slips on this surface.'
        : l.action,
    bullets:
      tab === 'anatomy'
        ? [
            `Origin: ${l.origin}`,
            `Insertion: ${l.insertion}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}.`,
          ]
        : [
            `Motor supply: ${l.motorSupply}`,
            'Named nerves are teaching references, not validated nerve courses or motor territories in this muscle entry.',
          ],
    note: [
      'Draft teaching; independent anatomical and clinical review pending.',
      'Explode and cut controls do not simulate muscle contraction, joint mechanics or a safe procedure.',
      l.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
