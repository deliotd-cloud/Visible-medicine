import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

/** Original factual teaching drafts, not imported textbook prose or tables.
 * Exact source identities; neither names nor opposite-side meshes are inferred. */
export interface ForearmMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  representation: 'muscle' | 'head';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution?: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const upperLimb =
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
const pin =
  'Posterior interosseous nerve, continuing the deep branch of the radial nerve.';
const ain = 'Anterior interosseous branch of the median nerve.';

export const forearmMuscleLessons: readonly ForearmMuscleLesson[] = [
  {
    key: 'extensor-carpi-ulnaris',
    fmaIds: ['FMA38507', 'FMA38508'],
    representation: 'muscle',
    origin:
      'Common extensor origin at the lateral humeral epicondyle and posterior ulnar border.',
    insertion: 'Dorsal base of metacarpal V.',
    action:
      'Extends the wrist and draws the hand towards its little-finger side (ulnar deviation).',
    motorSupply: pin,
    caution:
      'Both proximal attachment regions are described; the source components remain selected together.',
    references: [books + 'NBK539760/'],
  },
  {
    key: 'flexor-digitorum-superficialis',
    fmaIds: ['FMA38470', 'FMA38471'],
    representation: 'muscle',
    origin:
      'Humeroulnar attachment at the medial epicondyle and coronoid region, with a radial attachment on the anterior radius.',
    insertion: 'Paired tendon slips on the middle phalanges of fingers 2–5.',
    action:
      'Bends the proximal interphalangeal joints of the fingers and assists knuckle and wrist flexion. Its attachment is more proximal than that of profundus.',
    motorSupply: 'Median nerve.',
    caution:
      'This selectable muscle groups two source components. Individual digital slips are not separately selectable or attachment-validated.',
    references: [books + 'NBK539723/'],
  },
  {
    key: 'abductor-pollicis-longus',
    fmaIds: ['FMA38516', 'FMA38517'],
    representation: 'muscle',
    origin:
      'Posterior radius and ulna, with the intervening interosseous membrane.',
    insertion: 'Radial base of metacarpal I.',
    action:
      'Moves the thumb away from the index finger at its carpometacarpal joint.',
    motorSupply: pin,
    caution:
      'Accessory slips and insertion variants are not independently mapped by this surface.',
    references: [upperLimb, 'https://pubmed.ncbi.nlm.nih.gov/2032936/'],
  },
  {
    key: 'brachioradialis',
    fmaIds: ['FMA38486', 'FMA38487'],
    representation: 'muscle',
    origin: 'Proximal two-thirds of the lateral humeral supracondylar ridge.',
    insertion: 'Lateral distal radius near the styloid base.',
    action:
      'Bends the elbow, including with a neutral forearm position. Its distal attachment is on the radius, so it does not cross the wrist.',
    motorSupply: 'Radial nerve.',
    references: [books + 'NBK526110/'],
  },
  {
    key: 'extensor-carpi-radialis-brevis',
    fmaIds: ['FMA38498', 'FMA38499'],
    representation: 'muscle',
    origin: 'Common extensor attachment at the lateral humeral epicondyle.',
    insertion: 'Dorsal base of metacarpal III.',
    action:
      'Helps extend the wrist and deviate it towards the thumb side. Distinguish its third-metacarpal attachment from the second-metacarpal attachment of longus.',
    motorSupply: 'Deep branch of the radial nerve.',
    references: [books + 'NBK539719/'],
  },
  {
    key: 'extensor-carpi-radialis-longus',
    fmaIds: ['FMA38495', 'FMA38496'],
    representation: 'muscle',
    origin: 'Distal third of the lateral humeral supracondylar ridge.',
    insertion: 'Dorsal base of metacarpal II.',
    action:
      'Extends the wrist and contributes to radial deviation, towards the thumb.',
    motorSupply: 'Radial nerve.',
    references: [upperLimb],
  },
  {
    key: 'extensor-digiti-minimi',
    fmaIds: ['FMA38504', 'FMA38505'],
    representation: 'muscle',
    origin:
      'Lateral humeral epicondyle through the common extensor attachment.',
    insertion: 'Extensor apparatus of finger 5.',
    action:
      'Adds extension to the little finger, especially at the knuckle, through its extensor apparatus.',
    motorSupply: pin,
    caution:
      'Tendon number and interconnections vary; this is not a validated individual-slip reconstruction.',
    references: [
      books + 'NBK534805/',
      'https://pubmed.ncbi.nlm.nih.gov/14707639/',
    ],
  },
  {
    key: 'extensor-digitorum',
    fmaIds: ['FMA38501', 'FMA38502'],
    representation: 'muscle',
    origin: 'Common extensor attachment on the lateral humeral epicondyle.',
    insertion: 'Extensor apparatus of fingers 2–5.',
    action:
      'Extends the finger knuckles and transmits tension through the extensor apparatus to assist finger straightening. It also assists wrist extension.',
    motorSupply: pin,
    caution:
      'Digital tendon distribution varies. The grouped surface does not certify every slip or connection between tendons.',
    references: [
      books + 'NBK534805/',
      'https://pubmed.ncbi.nlm.nih.gov/14707639/',
    ],
  },
  {
    key: 'extensor-indicis',
    fmaIds: ['FMA38525', 'FMA38526'],
    representation: 'muscle',
    origin: 'Posterior distal ulna and adjacent interosseous membrane.',
    insertion:
      'Index-finger extensor apparatus, alongside the extensor digitorum contribution.',
    action:
      'Provides an additional route for extending the index finger; it is not a thumb extensor.',
    motorSupply: pin,
    references: [
      books + 'NBK545260/',
      books + 'NBK538428/',
      books + 'NBK544294/',
    ],
  },
  {
    key: 'extensor-pollicis-brevis',
    fmaIds: ['FMA38519', 'FMA38520'],
    representation: 'muscle',
    origin: 'Posterior radius and adjacent interosseous membrane.',
    insertion: 'Dorsal base of the thumb proximal phalanx.',
    action: 'Extends the thumb principally at its metacarpophalangeal joint.',
    motorSupply: pin,
    references: [upperLimb, books + 'NBK544294/'],
  },
  {
    key: 'extensor-pollicis-longus',
    fmaIds: ['FMA38522', 'FMA38523'],
    representation: 'muscle',
    origin: 'Posterior mid-ulna and interosseous membrane.',
    insertion: 'Dorsal base of the thumb distal phalanx.',
    action:
      'Straightens the thumb interphalangeal joint and also contributes to extension at its knuckle. This distal attachment distinguishes it from brevis.',
    motorSupply: pin,
    references: [books + 'NBK544294/'],
  },
  {
    key: 'flexor-carpi-radialis',
    fmaIds: ['FMA38460', 'FMA38461'],
    representation: 'muscle',
    origin: 'Medial humeral epicondyle through the common flexor attachment.',
    insertion: 'Palmar base of metacarpal II, with a contribution to III.',
    action:
      'Flexes the wrist and draws the hand towards the thumb side (radial deviation).',
    motorSupply: 'Median nerve.',
    references: [upperLimb],
  },
  {
    key: 'flexor-digitorum-profundus',
    fmaIds: ['FMA38479', 'FMA38480'],
    representation: 'muscle',
    origin: 'Proximal anterior/medial ulna and interosseous membrane.',
    insertion: 'Palmar bases of the distal phalanges of fingers 2–5.',
    action:
      'Bends the fingertips at the distal interphalangeal joints and contributes to more proximal finger flexion. Do not confuse its distal insertion with superficialis.',
    motorSupply:
      'Typically anterior interosseous (median) for fingers 2–3, and ulnar nerve for fingers 4–5; individual patterns can vary.',
    caution:
      'The nerve-supply division is teaching context, not a segmented motor-territory map in this mesh.',
    references: [books + 'NBK526046/'],
  },
  {
    key: 'flexor-pollicis-longus',
    fmaIds: ['FMA38482', 'FMA38484'],
    representation: 'muscle',
    origin: 'Anterior radius and neighbouring interosseous membrane.',
    insertion: 'Palmar base of the thumb distal phalanx.',
    action:
      'Bends the thumb interphalangeal joint and contributes to thumb knuckle flexion.',
    motorSupply: ain,
    references: [books + 'NBK538490/'],
  },
  {
    key: 'palmaris-longus',
    fmaIds: ['FMA38463', 'FMA38464'],
    representation: 'muscle',
    origin: 'Common flexor attachment at the medial humeral epicondyle.',
    insertion: 'Palmar aponeurosis and flexor retinaculum.',
    action:
      'Tensions the palmar aponeurosis and provides a small contribution to wrist flexion.',
    motorSupply: 'Median nerve.',
    caution:
      'Palmaris longus can be absent or differently formed in healthy people; this reference model is not a universal pattern.',
    references: [books + 'NBK519516/', books + 'NBK539784/'],
  },
  {
    key: 'pronator-quadratus',
    fmaIds: ['FMA38454', 'FMA38455'],
    representation: 'muscle',
    origin: 'Anterior distal ulna.',
    insertion: 'Anterior distal radius.',
    action:
      'Pronates the forearm by drawing the radius across the ulna; it acts with pronator teres.',
    motorSupply: ain,
    references: [books + 'NBK539784/'],
  },
  {
    key: 'supinator',
    fmaIds: ['FMA38513', 'FMA38514'],
    representation: 'muscle',
    origin:
      'Lateral epicondylar region, radial collateral and annular ligaments, and proximal ulnar supinator crest.',
    insertion: 'Proximal radius, around its lateral aspect.',
    action:
      'Turns the radius into supination; in anatomical position the palm faces forwards.',
    motorSupply: 'Deep branch of the radial nerve.',
    references: [books + 'NBK580564/', books + 'NBK526056/'],
  },
  {
    key: 'pronator-teres-humeral-head',
    fmaIds: ['FMA38560', 'FMA38561'],
    representation: 'head',
    origin:
      'Medial humeral epicondylar region and adjoining supracondylar ridge.',
    insertion: 'Joins the pronator teres attachment on the lateral mid-radius.',
    action:
      'Contributes to forearm pronation with the other head, and assists elbow flexion.',
    motorSupply: 'Median nerve.',
    references: [books + 'NBK580564/'],
  },
  {
    key: 'pronator-teres-ulnar-head',
    fmaIds: ['FMA38562', 'FMA38563'],
    representation: 'head',
    origin: 'Ulnar coronoid process.',
    insertion: 'Joins the pronator teres attachment on the lateral mid-radius.',
    action:
      'Contributes to pronation as part of pronator teres; it is not a separately modelled movement.',
    motorSupply: 'Median nerve.',
    references: [books + 'NBK580564/'],
  },
  {
    key: 'flexor-carpi-ulnaris-humeral-head',
    fmaIds: ['FMA38617', 'FMA38618'],
    representation: 'head',
    origin: 'Medial humeral epicondyle via the common flexor attachment.',
    insertion:
      'Shared FCU tendon to the pisiform, continued through ligaments to the hamate hook and metacarpal V.',
    action:
      'Contributes to wrist flexion and ulnar deviation with the ulnar head.',
    motorSupply: 'Ulnar nerve.',
    references: [books + 'NBK526051/'],
  },
  {
    key: 'flexor-carpi-ulnaris-ulnar-head',
    fmaIds: ['FMA38619', 'FMA38620'],
    representation: 'head',
    origin:
      'Olecranon and proximal posterior ulnar border through an aponeurosis.',
    insertion:
      'Shared FCU tendon to the pisiform; ligament continuations reach the hamate hook and metacarpal V.',
    action:
      'Contributes to wrist flexion and deviation towards the little-finger side.',
    motorSupply: 'Ulnar nerve.',
    references: [books + 'NBK526051/'],
  },
];

const byFma = new Map(
  forearmMuscleLessons.flatMap((lesson) =>
    lesson.fmaIds.map((id) => [id, lesson] as const),
  ),
);

export function forearmMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('forearm')
  )
    return undefined;
  const lesson = byFma.get(s.fmaId);
  if (!lesson) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body:
      tab === 'anatomy'
        ? lesson.representation === 'head'
          ? 'One source-labelled muscle head is selected, not the whole muscle or an independently validated tendon. Distal notes describe the shared muscle attachment.'
          : 'These notes describe typical attachments, not measured footprints or validated tendon compartments on the selected surface.'
        : lesson.action,
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
      lesson.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...lesson.references],
  };
}
