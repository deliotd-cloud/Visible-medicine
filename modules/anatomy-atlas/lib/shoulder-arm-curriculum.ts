import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

/** Original, concise teaching drafts. References verify facts; no source prose,
 * tables, diagrams or question banks are imported. Exact catalogue IDs only. */
export interface ShoulderArmLesson {
  key: string;
  fmaIds: readonly string[];
  representation: 'muscle' | 'part' | 'head';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  references: readonly string[];
}

const books = 'https://www.ncbi.nlm.nih.gov/books/';
const upperLimb =
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';

export const shoulderArmLessons: readonly ShoulderArmLesson[] = [
  {
    key: 'serratus-anterior',
    fmaIds: ['FMA13398', 'FMA13399'],
    representation: 'muscle',
    origin: 'Lateral surfaces of ribs 1–8, often extending to rib 9.',
    insertion:
      'Thoracic-facing surface along the medial scapular border, including its angles.',
    action:
      'Draws the scapula around the chest wall and holds it against the ribs. Its contribution to upward rotation supports raising the arm overhead.',
    motorSupply: 'Long thoracic nerve.',
    references: [books + 'NBK531457/'],
  },
  {
    key: 'anconeus',
    fmaIds: ['FMA37705', 'FMA37706'],
    representation: 'muscle',
    origin: 'Lateral epicondyle of the humerus.',
    insertion: 'Lateral olecranon and adjacent proximal ulna.',
    action:
      'Assists elbow extension and helps steady the elbow during movement.',
    motorSupply: 'Radial nerve.',
    references: [books + 'NBK539784/', upperLimb],
  },
  {
    key: 'brachialis',
    fmaIds: ['FMA37668', 'FMA37669'],
    representation: 'muscle',
    origin: 'Distal anterior humerus, deep to biceps.',
    insertion: 'Ulnar tuberosity and coronoid region.',
    action:
      'Bends the elbow with the forearm pronated, neutral or supinated. Unlike biceps, it does not produce forearm supination.',
    motorSupply:
      'Mainly musculocutaneous nerve; a lateral portion commonly also receives radial nerve fibres.',
    references: [books + 'NBK551630/'],
  },
  {
    key: 'coracobrachialis',
    fmaIds: ['FMA37665', 'FMA37666'],
    representation: 'muscle',
    origin: 'Scapular coracoid process.',
    insertion: 'Medial humeral shaft near its midpoint.',
    action:
      'Helps bring the arm forwards and towards the trunk at the shoulder; it does not cross the elbow.',
    motorSupply: 'Musculocutaneous nerve.',
    references: [books + 'NBK554420/'],
  },
  {
    key: 'infraspinatus',
    fmaIds: ['FMA32548'],
    representation: 'muscle',
    origin: 'Infraspinous fossa, below the scapular spine.',
    insertion: 'Greater humeral tubercle, mainly its middle facet.',
    action:
      'Turns the arm outwards and contributes to rotator-cuff control of the humeral head.',
    motorSupply: 'Suprascapular nerve.',
    references: [
      books + 'NBK513255/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC3553044/',
    ],
  },
  {
    key: 'subscapularis',
    fmaIds: ['FMA13415'],
    representation: 'muscle',
    origin: 'Subscapular fossa on the rib-facing scapula.',
    insertion: 'Lesser humeral tubercle.',
    action:
      'Turns the arm inwards. It forms the anterior muscular contribution to the rotator cuff and helps stabilize the humeral head.',
    motorSupply: 'Upper and lower subscapular nerves.',
    references: [books + 'NBK441844/'],
  },
  {
    key: 'supraspinatus',
    fmaIds: ['FMA32545'],
    representation: 'muscle',
    origin: 'Supraspinous fossa, above the scapular spine.',
    insertion:
      'Superior facet of the greater humeral tubercle, reached beneath the acromion.',
    action:
      'Contributes to arm abduction and humeral-head stabilization with the other cuff muscles. Its role is not limited to a single fixed angular interval.',
    motorSupply: 'Suprascapular nerve.',
    references: [books + 'NBK537202/', books + 'NBK537056/'],
  },
  {
    key: 'teres-major',
    fmaIds: ['FMA32551', 'FMA32552'],
    representation: 'muscle',
    origin: 'Posterior scapula near the inferior angle.',
    insertion: 'Medial lip of the humeral intertubercular groove.',
    action:
      'Draws the arm backwards and towards the body and turns it inwards. Teres major is not a rotator-cuff muscle.',
    motorSupply: 'Lower subscapular nerve.',
    references: [books + 'NBK580487/', upperLimb],
  },
  {
    key: 'teres-minor',
    fmaIds: ['FMA32554'],
    representation: 'muscle',
    origin: 'Lateral scapular border, below infraspinatus.',
    insertion: 'Greater humeral tubercle, below the infraspinatus attachment.',
    action:
      'Turns the arm outwards and helps the rotator cuff steady the humeral head. Distinguish it from the internally rotating teres major.',
    motorSupply: 'Axillary nerve.',
    references: [books + 'NBK513324/'],
  },
  {
    key: 'levator-scapulae',
    fmaIds: ['FMA32540', 'FMA32541'],
    representation: 'muscle',
    origin: 'Transverse processes of C1–C4.',
    insertion:
      'Medial scapular border between the superior angle and the root of its spine.',
    action:
      'Raises the scapula and assists downward rotation. With the scapula held steady, it can contribute to bending the neck towards the same side.',
    motorSupply:
      'Dorsal scapular nerve with cervical contributions, usually C3–C4.',
    references: [books + 'NBK553120/'],
  },
  {
    key: 'rhomboid-major',
    fmaIds: ['FMA13381', 'FMA13382'],
    representation: 'muscle',
    origin: 'Spinous processes of T2–T5.',
    insertion: 'Medial scapular border below the root of the scapular spine.',
    action:
      'Pulls the scapula towards the spine, assists downward rotation and helps maintain its position against the chest wall.',
    motorSupply: 'Dorsal scapular nerve.',
    references: [books + 'NBK534856/', upperLimb],
  },
  {
    key: 'rhomboid-minor',
    fmaIds: ['FMA13383', 'FMA13384'],
    representation: 'muscle',
    origin: 'Lower nuchal ligament and C7–T1 spinous processes.',
    insertion: 'Medial scapular border at the root of the scapular spine.',
    action:
      'Works with rhomboid major to retract and downwardly rotate the scapula, helping support it against the thorax.',
    motorSupply: 'Dorsal scapular nerve.',
    references: [books + 'NBK534856/', upperLimb],
  },
  {
    key: 'deltoid-clavicular',
    fmaIds: ['FMA34681'],
    representation: 'part',
    origin: 'Lateral third of the clavicle.',
    insertion:
      'Deltoid tuberosity of the humerus, as part of the deltoid attachment.',
    action:
      'The anterior portion contributes to bringing the arm forwards at the shoulder. It acts with the remaining deltoid, not as an isolated actuator.',
    motorSupply: 'Axillary nerve.',
    references: [books + 'NBK537056/'],
  },
  {
    key: 'deltoid-acromial',
    fmaIds: ['FMA34683'],
    representation: 'part',
    origin: 'Scapular acromion.',
    insertion:
      'Deltoid tuberosity of the humerus, shared with the other portions.',
    action:
      'The lateral portion contributes strongly to arm abduction, in coordination with the cuff and scapular muscles.',
    motorSupply: 'Axillary nerve.',
    references: [books + 'NBK537056/'],
  },
  {
    key: 'deltoid-spinal',
    fmaIds: ['FMA34685'],
    representation: 'part',
    origin: 'Scapular spine.',
    insertion:
      'Deltoid tuberosity of the humerus, as part of the deltoid attachment.',
    action:
      'The posterior portion contributes to moving the arm backwards at the shoulder.',
    motorSupply: 'Axillary nerve.',
    references: [books + 'NBK537056/'],
  },
  {
    key: 'biceps-short-head',
    fmaIds: ['FMA37684', 'FMA37685'],
    representation: 'head',
    origin: 'Coracoid process of the scapula.',
    insertion:
      'Joins the biceps distal apparatus: radial tuberosity and bicipital aponeurosis.',
    action:
      'Contributes to elbow flexion and forearm supination as part of biceps.',
    motorSupply: 'Musculocutaneous nerve.',
    references: [books + 'NBK554420/'],
  },
  {
    key: 'biceps-long-head',
    fmaIds: ['FMA37687'],
    representation: 'head',
    origin: 'Supraglenoid region of the scapula.',
    insertion:
      'Joins the biceps distal apparatus, including its radial attachment.',
    action:
      'Contributes to bending the elbow and turning the palm upwards with the rest of biceps.',
    motorSupply: 'Musculocutaneous nerve.',
    references: [books + 'NBK554420/'],
  },
  {
    key: 'triceps-medial-head',
    fmaIds: ['FMA37695', 'FMA37696'],
    representation: 'head',
    origin: 'Posterior humerus below the radial groove.',
    insertion: 'Olecranon through the triceps distal attachment.',
    action:
      'Contributes to elbow extension; this head does not cross the shoulder.',
    motorSupply: 'Radial nerve.',
    references: [books + 'NBK536996/'],
  },
  {
    key: 'triceps-lateral-head',
    fmaIds: ['FMA37697', 'FMA37698'],
    representation: 'head',
    origin: 'Posterior humerus above the radial groove.',
    insertion: 'Olecranon through the triceps distal attachment.',
    action: 'Contributes to elbow extension alongside the other triceps heads.',
    motorSupply: 'Radial nerve.',
    references: [books + 'NBK536996/'],
  },
  {
    key: 'triceps-long-head',
    fmaIds: ['FMA37699', 'FMA37700'],
    representation: 'head',
    origin: 'Infraglenoid tubercle of the scapula.',
    insertion: 'Olecranon through the triceps distal attachment.',
    action:
      'Extends the elbow and also assists shoulder extension and adduction.',
    motorSupply: 'Radial nerve.',
    references: [books + 'NBK536996/'],
  },
];

const byFma = new Map(
  shoulderArmLessons.flatMap((lesson) =>
    lesson.fmaIds.map((id) => [id, lesson] as const),
  ),
);

/** Adds only these two topics to explicitly admitted muscle identities. No
 * matching by name, mirroring, inferred nerve route or clinical sign-off. */
export function shoulderArmLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('shoulder-arm')
  )
    return undefined;
  const lesson = byFma.get(s.fmaId);
  if (!lesson) return undefined;
  const scope =
    lesson.representation === 'muscle'
      ? 'Attachment notes describe typical anatomy, not measured attachment footprints on this mesh.'
      : 'This surface represents one muscle head or portion, not the whole muscle or an independently validated tendon.';
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body: tab === 'anatomy' ? scope : lesson.action,
    bullets:
      tab === 'anatomy'
        ? [
            `Proximal attachment: ${lesson.origin}`,
            `Distal attachment: ${lesson.insertion}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}`,
          ]
        : [
            `Motor supply: ${lesson.motorSupply}`,
            'Named nerves are teaching references; their courses are not rendered in this regional model.',
          ],
    note: [
      'Draft teaching; independent anatomical and clinical review pending.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...lesson.references],
  };
}
