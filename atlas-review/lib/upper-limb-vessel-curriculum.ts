import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface UpperLimbVesselLesson {
  fmaId: string;
  side: 'right' | 'left';
  regions: readonly string[];
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const axillary = books + 'NBK482174/';
const brachial = books + 'NBK537145/';
const posteriorHumeral = books + 'NBK538283/';
const forearm = books + 'NBK545155/';
const hand = books + 'NBK546583/';
const cubital = books + 'NBK551674/';
const venous = books + 'NBK27370/';
const thyrocervical = books + 'NBK555996/';
const costocervical = books + 'NBK556020/';
const dorsalScapular = books + 'NBK459343/';
const latissimus = books + 'NBK448120/';
const externalJugular = books + 'NBK538222/';
const supraclavicular = books + 'NBK537265/';
const tables =
  'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_tables.html';
const upperLimbTables =
  'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/';
const thoracoacromial =
  'https://www.kenhub.com/en/library/anatomy/thoracoacromial-artery';
const arm = ['shoulder-arm'] as const;
const shoulderThorax = ['shoulder-arm', 'thorax'] as const;
const rootNeck = ['shoulder-arm', 'head-neck', 'thorax'] as const;
const forearmHand = ['forearm', 'hand'] as const;
const superficial = ['forearm', 'shoulder-arm'] as const;

function pair(
  ids: readonly [string, string],
  regions: readonly string[],
  anatomy: string,
  role: string,
  distinction: string,
  references: readonly string[],
): UpperLimbVesselLesson[] {
  return ids.map((fmaId, i) => ({
    fmaId,
    side: i === 0 ? 'right' : 'left',
    regions,
    anatomy,
    function: role,
    distinction,
    references,
  }));
}

// Original brief factual teaching for exact existing bilateral source identities.
export const upperLimbVesselLessons: readonly UpperLimbVesselLesson[] = [
  ...pair(
    ['FMA22655', 'FMA22656'],
    arm,
    'Continues from the subclavian artery at the lateral first-rib border to the lower teres-major border, where it becomes brachial.',
    'Carries arterial blood into shoulder branches and the distal upper limb.',
    'Pectoralis minor defines the usual three parts. The source selection does not independently validate every branch or brachial-plexus relationship.',
    [axillary],
  ),
  ...pair(
    ['FMA22691', 'FMA22692'],
    arm,
    'Continues below teres major along the anterior arm, usually dividing into radial and ulnar arteries in the cubital fossa.',
    'Supplies arm tissues and conveys blood toward forearm and hand.',
    'Not the profunda brachii. Bifurcation height varies; no safe puncture site, pressure reading or uninterrupted lumen is inferred.',
    [brachial],
  ),
  ...pair(
    ['FMA22696', 'FMA22697'],
    arm,
    'The profunda brachii usually branches from the brachial artery and follows the radial groove with the radial nerve.',
    'Supplies posterior arm tissues and contributes to collateral routes around the elbow.',
    'The named nerve relationship is teaching context, not an imported nerve course. Collateral continuity and adequacy remain unvalidated.',
    [brachial],
  ),
  ...pair(
    ['FMA22682', 'FMA22683'],
    arm,
    'Usually leaves the third axillary part and passes anterior to the proximal humerus.',
    'Contributes to humeral-head and shoulder-joint blood supply.',
    'Not the posterior circumflex vessel. A surface does not establish humeral-head perfusion or a fixed share of supply.',
    [axillary],
  ),
  ...pair(
    ['FMA22685', 'FMA22687'],
    arm,
    'Usually arises from the third axillary part and passes through the quadrangular space with the axillary nerve around the surgical neck.',
    'Contributes to deltoid, proximal humeral and shoulder-joint blood supply.',
    'Each side contains two source files, not two validated named branches. No compression diagnosis, nerve segmentation or safe dissection plane is established.',
    [posteriorHumeral],
  ),
  ...pair(
    ['FMA23180', 'FMA23181'],
    arm,
    'Branches from the subscapular artery and passes through the triangular space toward the posterior scapula.',
    'Contributes to scapular muscle supply and the scapular arterial network.',
    'Triangular space is not the quadrangular space of the posterior circumflex humeral artery. Anastomotic joins and collateral flow are not certified.',
    [axillary, tables],
  ),
  ...pair(
    ['FMA66321', 'FMA66322'],
    arm,
    'Continues from the subscapular system toward the deep surface of latissimus dorsi with the thoracodorsal neurovascular bundle.',
    'Provides a major arterial contribution to latissimus dorsi.',
    'Not a motor nerve. Source geometry does not map every muscular branch, perforator or usable flap pedicle.',
    [latissimus],
  ),
  ...pair(
    ['FMA22733', 'FMA22734'],
    forearmHand,
    'Descends on the radial forearm, then crosses the anatomical snuffbox toward the deep palm.',
    'Supplies forearm/wrist tissues and contributes predominantly to the deep palmar arch.',
    'Not an exclusive thumb/index territory. Radial origin, arch continuity and collateral sufficiency require review; no Allen test is simulated.',
    [forearm, hand],
  ),
  ...pair(
    ['FMA22797', 'FMA22798'],
    forearmHand,
    'Descends through the anterior forearm and enters the palm superficial to the flexor retinaculum.',
    'Supplies forearm tissues and contributes predominantly to the superficial palmar arch.',
    'Not a carpal-tunnel route. Distal artery–nerve clearance, branches and arch completeness are not validated by the single surface.',
    [forearm],
  ),
  ...pair(
    ['FMA22812', 'FMA22813'],
    forearmHand,
    'Usually branches from the common interosseous artery and descends anterior to the interosseous membrane with its namesake nerve.',
    'Contributes blood to deep flexor muscles and forearm bones.',
    'Not the posterior interosseous artery. No distal membrane-crossing connection or nerve course is reconstructed.',
    [forearm],
  ),
  ...pair(
    ['FMA13325', 'FMA13326'],
    superficial,
    'Ascends superficially on the lateral forearm and arm, then follows the deltopectoral interval toward its usual axillary-vein junction.',
    'Collects superficial venous return from the lateral upper limb.',
    'Not a deep companion vein. Terminal drainage and superficial communications vary; valve competence and access suitability are not shown.',
    [cubital, venous, tables],
  ),
  ...pair(
    ['FMA22909', 'FMA22910'],
    superficial,
    'Ascends superficially on the medial upper limb, pierces arm fascia and joins brachial veins toward the axillary vein.',
    'Collects superficial venous return from the medial hand and forearm.',
    'The basilic vein is not formed simply by radial/ulnar deep veins. Fascial entry and confluence levels need source-specific review.',
    [cubital, tables],
  ),
  ...pair(
    ['FMA22839', 'FMA22840'],
    ['hand'],
    'A predominantly radial arterial arch in the deep palm, usually joined by the deep ulnar branch.',
    'Distributes blood into deep palmar tissues and communicating metacarpal pathways.',
    'Not the superficial palmar arch. A named arch is not proof of a complete patent ring or adequate digital perfusion.',
    [hand],
  ),
  ...pair(
    ['FMA3992', 'FMA4084'],
    rootNeck,
    'A short subclavian branch near the anterior scalene, giving rise to vessels toward thyroid, cervical and scapular regions.',
    'Distributes arterial supply to lower-neck and shoulder pathways.',
    'This is a parent trunk, not each downstream branch. Ascending-cervical ancestry and other branching patterns vary; no fixed four-way source split is assumed.',
    [thyrocervical, upperLimbTables],
  ),
  ...pair(
    ['FMA5039', 'FMA4086'],
    rootNeck,
    'A subclavian branch dividing into deep cervical and supreme intercostal pathways.',
    'Contributes supply to deep neck tissues and upper posterior intercostal spaces.',
    'Origin relative to anterior scalene requires side-specific source review. Do not force the selected left and right roots to the same textbook level.',
    [costocervical],
  ),
  ...pair(
    ['FMA4057', 'FMA10552'],
    shoulderThorax,
    'Descends near the medial scapular border, with variable origin from the subclavian or transverse cervical system.',
    'Contributes blood to rhomboids, levator scapulae and the scapular network.',
    'Arterial origin is not fixed by the displayed name. The dorsal scapular nerve and all scapular anastomoses are not independently reconstructed.',
    [dorsalScapular, thyrocervical],
  ),
  ...pair(
    ['FMA10698', 'FMA10681'],
    shoulderThorax,
    'Usually arises from the thyrocervical system and runs toward the supraspinous and infraspinous scapular regions.',
    'Contributes to rotator-cuff and shoulder-region blood supply.',
    'The artery is not the suprascapular nerve. Notch/ligament relationships, variants and complete cuff territories require review.',
    [thyrocervical, tables],
  ),
  ...pair(
    ['FMA13330', 'FMA13331'],
    shoulderThorax,
    'Receives deep and superficial upper-limb veins and continues as subclavian at the first-rib border.',
    'Returns venous blood from upper-limb and axillary tributaries toward the thorax.',
    'Not the accompanying artery. Junction shape, venous valves, patency and compression cannot be inferred from this segment.',
    [cubital, venous],
  ),
  ...pair(
    ['FMA50859', 'FMA50860'],
    shoulderThorax,
    'A venous route through the supraclavicular region; it may join the external jugular system.',
    'Conveys venous return from the scapular region toward central neck veins.',
    'Do not force a matching arterial tree or a universal terminal junction. The selected segment does not validate its full drainage territory.',
    [externalJugular, supraclavicular],
  ),
  ...pair(
    ['FMA66563', 'FMA66564'],
    shoulderThorax,
    'A short branch of the second axillary part that passes through clavipectoral fascia toward its regional branches.',
    'Distributes blood toward pectoral, clavicular, acromial and deltoid tissues.',
    'Parent trunk and separately selectable branches are distinct. Their presence does not certify a complete four-branch tree or flap supply.',
    [upperLimbTables],
  ),
  ...pair(
    ['FMA23063', 'FMA23064'],
    shoulderThorax,
    'Descends from the thoracoacromial system between pectoralis major and minor.',
    'Contributes blood to the pectoral muscles and adjacent tissues.',
    'Not the entire thoracoacromial trunk or a pectoral nerve. Small branches, fascial planes and safe injection corridors remain unvalidated.',
    [thoracoacromial, upperLimbTables],
  ),
  ...pair(
    ['FMA23068', 'FMA23069'],
    shoulderThorax,
    'Runs from the thoracoacromial system toward the acromion and deltoid region.',
    'Contributes to arterial connections around the acromion.',
    'Not the whole shoulder anastomosis. A visible segment does not establish its joins or collateral adequacy.',
    [thoracoacromial],
  ),
  ...pair(
    ['FMA23072', 'FMA23073'],
    shoulderThorax,
    'Follows the deltopectoral interval, commonly alongside the cephalic vein.',
    'Contributes arterial blood to adjacent deltoid and pectoral tissues.',
    'The branch may have a variable origin within the thoracoacromial system. Do not relabel it as the cephalic vein or infer a safe operative route.',
    [thoracoacromial, tables],
  ),
];
const byFma = new Map(upperLimbVesselLessons.map((l) => [l.fmaId, l]));
export function upperLimbVesselLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'vessels' ||
    s.category !== 'vessel' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (
    !l ||
    s.laterality !== l.side ||
    s.region !== l.regions[0] ||
    !l.regions.every((r) => s.regions.includes(r))
  )
    return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Course & connections' : 'Circulation & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            'Red/blue denotes artery/vein, not oxygenation or measured flow. Shared regional navigation is not a segmented perfusion or drainage map.',
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Component counts are not branch counts; gaps are not reconstructed.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not physiological displacement, vascular interiors, angiography or Doppler ultrasound.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
