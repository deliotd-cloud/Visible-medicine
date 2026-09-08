import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface LimbBoneLesson {
  bindings: readonly (readonly [string, 'left' | 'right'])[];
  region: BodyStructure['region'];
  regions: readonly BodyStructure['region'][];
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const shoulder = books + 'NBK536933/';
const forearm = books + 'NBK545260/';
const leg = books + 'NBK537024/';

// Original factual teaching. Existing right shoulder pilot content is preserved.
export const limbBoneLessons: readonly LimbBoneLesson[] = [
  {
    bindings: [['FMA13323', 'left']],
    region: 'shoulder-arm',
    regions: ['shoulder-arm'],
    anatomy:
      'The clavicle bridges the manubrium medially and the scapular acromion laterally through the sternoclavicular and acromioclavicular joints.',
    function:
      'Acts as a strut supporting the shoulder away from the trunk and transfers upper-limb loads toward the axial skeleton.',
    distinction:
      'The clavicle is not a direct humeral articulation. Ligament restraint, joint discs and clearance of underlying vessels are not established by separating this surface.',
    references: [books + 'NBK525990/'],
  },
  {
    bindings: [['FMA13396', 'left']],
    region: 'shoulder-arm',
    regions: ['shoulder-arm'],
    anatomy:
      'The scapular glenoid receives the humeral head; the acromion meets the clavicle. Its posterior spine separates the supraspinous and infraspinous fossae.',
    function:
      'Provides a mobile base and attachment framework for positioning and stabilising the arm. Scapulothoracic gliding is not a true synovial joint.',
    distinction:
      'The labrum, capsule, bursae and muscle attachment footprints are not validated by the bone outline. Explode distances do not represent scapulohumeral rhythm.',
    references: [shoulder],
  },
  {
    bindings: [['FMA23131', 'left']],
    region: 'shoulder-arm',
    regions: ['shoulder-arm', 'forearm'],
    anatomy:
      'The humerus spans shoulder to elbow. Proximally its head meets the glenoid; distally the capitulum meets the radial head and the trochlea meets the ulnar trochlear notch.',
    function:
      'Forms the arm lever through which muscles position the limb and move the elbow. Shoulder and elbow articulations have different movement constraints.',
    distinction:
      'One bone appears in both arm and forearm views; this is shared regional membership, not duplicate anatomy. Tubercle, groove and nerve relationships need review; no fracture or safe surgical corridor is inferred.',
    references: [books + 'NBK507841/', shoulder, forearm],
  },
  {
    bindings: [
      ['FMA23464', 'right'],
      ['FMA23465', 'left'],
    ],
    region: 'forearm',
    regions: ['forearm'],
    anatomy:
      'In anatomical position the radius lies on the thumb side. Its head articulates with the humeral capitulum and ulnar radial notch; distally it meets the scaphoid, lunate and ulnar head.',
    function:
      'Carries the hand during forearm rotation and transmits wrist loads. During pronation the distal radius crosses relative to the ulna; supination reverses this arrangement.',
    distinction:
      'Rotation involves both radioulnar joints and soft-tissue constraints. Explode is not pronation, and this surface does not certify the annular ligament, TFCC or a fixed load-sharing percentage.',
    references: [books + 'NBK544512/'],
  },
  {
    bindings: [
      ['FMA23467', 'right'],
      ['FMA23468', 'left'],
    ],
    region: 'forearm',
    regions: ['forearm'],
    anatomy:
      'In anatomical position the ulna is medial. Its proximal trochlear notch lies between olecranon and coronoid processes and meets the humeral trochlea; its distal head meets the radius.',
    function:
      'Provides elbow support and muscle attachment sites, while working with the radius and interosseous membrane to share forearm forces.',
    distinction:
      'The distal ulna has no direct carpal articulation; an articular disc intervenes. This does not mean it carries no load. Disc integrity, ulnar variance and physiological joint motion are unvalidated.',
    references: [forearm],
  },
  {
    bindings: [
      ['FMA16586', 'right'],
      ['FMA16587', 'left'],
    ],
    region: 'pelvis',
    regions: ['pelvis', 'thigh'],
    anatomy:
      'Each adult hip bone unites ilium, ischium and pubis around the acetabulum for the femoral head. It joins the sacrum posteriorly and the opposite pubis at the anterior symphysis.',
    function:
      'Links spinal and lower-limb load paths, supports pelvic contents and provides broad muscle and ligament attachments.',
    distinction:
      'One hip-bone surface is not three independently dissectible bones or the entire bony pelvis. Fusion timing, sex-specific pelvic shape, birth-canal dimensions and acetabular labrum are not established by this selection.',
    references: [books + 'NBK545204/'],
  },
  {
    bindings: [
      ['FMA24474', 'right'],
      ['FMA24475', 'left'],
    ],
    region: 'thigh',
    regions: ['thigh', 'pelvis', 'leg'],
    anatomy:
      'The femoral head and neck connect to the shaft beside the greater and lesser trochanters. Distal condyles articulate with the tibia, and the anterior distal surface articulates with the patella.',
    function:
      'Transfers load between hip and knee and supplies lever arms and attachment sites for muscles controlling stance and movement.',
    distinction:
      'The same femur is shared across pelvis, thigh and leg views. Neck-shaft angle, torsion, growth plates, internal trabeculae and cartilage are not measured or validated by this exterior mesh.',
    references: [books + 'NBK532982/'],
  },
  {
    bindings: [
      ['FMA24477', 'right'],
      ['FMA24478', 'left'],
    ],
    region: 'leg',
    regions: ['leg'],
    anatomy:
      'The tibia is the medial leg bone. Its proximal plateaus meet the femoral condyles; distally it contributes the ankle roof and medial malleolus around the talus.',
    function:
      'Carries the principal axial load through the leg and provides attachment sites, including the tibial tuberosity for the patellar ligament.',
    distinction:
      'Menisci, cartilage, cruciate footprints and ankle alignment require separate review. The visible plateaus are not validated contact maps or a loading simulation.',
    references: [leg],
  },
  {
    bindings: [
      ['FMA24480', 'right'],
      ['FMA24481', 'left'],
    ],
    region: 'leg',
    regions: ['leg'],
    anatomy:
      'The fibula lies lateral to the tibia. Its head meets the proximal tibia, while its distal lateral malleolus contributes to the ankle mortise around the talus.',
    function:
      'Supports lateral ankle stability and muscle/ligament attachment, with a smaller contribution to axial load bearing than the tibia.',
    distinction:
      'The fibula does not articulate with the femur. Its proximal tibiofibular joint is distinct from the tibiofemoral joint; syndesmotic integrity and common fibular nerve clearance are not validated.',
    references: [leg, books + 'NBK500017/'],
  },
  {
    bindings: [
      ['FMA24486', 'right'],
      ['FMA24487', 'left'],
    ],
    region: 'leg',
    regions: ['leg'],
    anatomy:
      'The patella is a sesamoid bone within the knee extensor mechanism. Its posterior articular surface meets the femoral trochlea; the patellar ligament continues toward the tibial tuberosity.',
    function:
      'Improves the mechanical advantage of knee extension by holding the quadriceps tendon–patellar ligament linkage away from the joint rotation axis.',
    distinction:
      'The patella does not directly articulate with the tibia. Tendon continuity, cartilage, tracking, patellar height and moment arms are not validated by this isolated bone or its explode offset.',
    references: [books + 'NBK519534/'],
  },
];
const byFma = new Map(
  limbBoneLessons.flatMap((lesson) =>
    lesson.bindings.map(([fma, side]) => [fma, { lesson, side }] as const),
  ),
);
export function limbBoneLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'skeleton' ||
    s.category !== 'bone' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (
    !match ||
    s.laterality !== match.side ||
    s.region !== match.lesson.region ||
    !match.lesson.regions.every((r) => s.regions.includes(r))
  )
    return undefined;
  const l = match.lesson;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Structure & relationships' : 'Role & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            'Reference bone surface: named landmarks, attachment footprints, cortical thickness and marrow are not independently segmented or validated. A cut surface is not an acquired CT section.',
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Boundaries and joint relationships require independent review.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not tissue interiors, operative cleavage planes, physiological joint motion or acquired imaging.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
