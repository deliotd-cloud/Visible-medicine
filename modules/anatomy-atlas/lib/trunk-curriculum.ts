import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
interface TrunkMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  region: 'thorax' | 'abdomen' | 'spine';
  representation: 'muscle' | 'part' | 'group';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution: string;
  references: readonly string[];
}
// Explicit existing source identities; no inferred new anatomy or mesh admission.
export const trunkMuscleLessons: readonly TrunkMuscleLesson[] = [
  {
    key: 'external-intercostal',
    fmaIds: ['FMA9756'],
    region: 'thorax',
    representation: 'group',
    origin: 'Lower edge of a rib.',
    insertion: 'Upper edge of the neighbouring rib below.',
    action:
      'Supports intercostal spaces and helps raise ribs during inspiration.',
    motorSupply: 'Segmental intercostal nerves, from anterior spinal rami.',
    caution:
      'The two source components form a grouped entry, not one midline muscle or separately numbered intercostal slips.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/intercostal-muscles',
      'https://www.kenhub.com/en/library/anatomy/intercostal-spaces',
    ],
  },
  {
    key: 'internal-intercostal',
    fmaIds: ['FMA9757'],
    region: 'thorax',
    representation: 'group',
    origin: 'Costal-groove region of a rib.',
    insertion: 'Upper edge of the adjacent rib below.',
    action:
      'The interosseous portion assists forced expiration; the parasternal/interchondral portion can assist inspiration.',
    motorSupply: 'Segmental intercostal nerves, from anterior spinal rami.',
    caution:
      'Do not assign the same respiratory action to every internal-intercostal fibre. The grouped source does not independently identify parasternal and interosseous portions.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/intercostal-muscles',
      'https://www.kenhub.com/en/library/anatomy/intercostal-spaces',
    ],
  },
  {
    key: 'innermost-intercostal',
    fmaIds: ['FMA9758'],
    region: 'thorax',
    representation: 'group',
    origin: 'Inner rib surface near its costal groove.',
    insertion: 'Inner aspect of the neighbouring rib below.',
    action:
      'Supports rib spaces and assists forced expiration with the deeper chest-wall musculature.',
    motorSupply: 'Segmental intercostal nerves, from anterior spinal rami.',
    caution:
      'The neurovascular plane lies between internal and innermost layers in typical anatomy; this grouped surface does not establish a safe needle corridor.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/intercostal-muscles',
      'https://www.kenhub.com/en/library/anatomy/intercostal-spaces',
    ],
  },
  {
    key: 'external-oblique',
    fmaIds: ['FMA13337', 'FMA13336'],
    region: 'abdomen',
    representation: 'muscle',
    origin: 'Outer surfaces of ribs 5–12.',
    insertion:
      'Linea alba and pubic region through its aponeurosis, with the anterior iliac crest.',
    action:
      'Bilateral activity compresses the abdomen and bends the trunk forwards; one side helps bend towards itself and rotate away.',
    motorSupply: 'Thoracoabdominal nerves T7–T11 and the subcostal nerve T12.',
    caution:
      'These are motor-supply notes. This muscle does not substitute for absent deeper abdominal-wall layers or a validated pressure model.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/external-abdominal-oblique-muscle',
    ],
  },
  {
    key: 'pectoralis-minor',
    fmaIds: ['FMA13376', 'FMA13375'],
    region: 'thorax',
    representation: 'muscle',
    origin: 'Anterior ribs 3–5 near their costal cartilages, with variation.',
    insertion: 'Medial/upper aspect of the scapular coracoid process.',
    action:
      'Draws the scapula forwards and downwards and helps hold it against the chest; with the scapula fixed, it can assist inspiration.',
    motorSupply:
      'Mainly the medial pectoral nerve, with variable communicating contributions from the lateral pectoral nerve.',
    caution:
      'Its insertion is on the scapula, not the humerus. Neither nerve course nor a thoracic-outlet diagnosis is established by this surface.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/pectoralis-minor-muscle',
      'https://www.ncbi.nlm.nih.gov/books/NBK556059/',
    ],
  },
  {
    key: 'pectoralis-major',
    fmaIds: ['FMA13374', 'FMA13373'],
    region: 'thorax',
    representation: 'group',
    origin:
      'For the represented sternocostal/abdominal portions: anterior sternum, upper costal-cartilage region and external-oblique aponeurosis.',
    insertion: 'Lateral lip of the humeral intertubercular groove.',
    action:
      'Helps adduct and internally rotate the arm; the sternocostal portion can extend an already flexed arm.',
    motorSupply:
      'Medial and lateral pectoral nerves; individual territories are not segmented here.',
    caution:
      'This PART-OF entry contains sternocostal and abdominal source components. A separately identified clavicular component is absent; clavicular-head flexion must not be attributed to these displayed components.',
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK525991/',
      'https://www.ncbi.nlm.nih.gov/books/NBK556059/',
    ],
  },
  {
    key: 'transversus-thoracis',
    fmaIds: ['FMA9762', 'FMA9761'],
    region: 'thorax',
    representation: 'muscle',
    origin:
      'Inner lower sternum and xiphoid region, with nearby costal-cartilage attachments.',
    insertion: 'Inner surfaces of costal cartilages, commonly ribs 2–6.',
    action:
      'Can draw the anterior ribs down during forced expiration and support the chest wall.',
    motorSupply: 'Intercostal nerves.',
    caution:
      'Variable slips are not individually labelled in this entry; displayed proximity does not validate internal-thoracic vessel access.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/transversus-thoracis-muscle',
    ],
  },
  {
    key: 'diaphragm',
    fmaIds: ['FMA13295'],
    region: 'thorax',
    representation: 'muscle',
    origin:
      'Inner xiphoid and lower six rib/costal-cartilage regions; lumbar crura and arcuate-ligament attachments.',
    insertion: 'Central tendon.',
    action:
      'Its contraction lowers the domes and expands the thorax for inspiration; it also contributes to abdominal-pressure control.',
    motorSupply:
      'Phrenic nerves C3–C5 provide motor supply; peripheral sensory supply is a separate distinction.',
    caution:
      'One source surface does not resolve all crura, hiatus boundaries or phrenic branches. No breathing, pressure or ultrasound-excursion measurement is simulated.',
    references: ['https://www.kenhub.com/en/library/anatomy/diaphragm'],
  },
  {
    key: 'trapezius-ascending',
    fmaIds: ['FMA33583', 'FMA33581'],
    region: 'spine',
    representation: 'part',
    origin:
      'Lower thoracic midline spines and supraspinous attachments, typically T4–T12.',
    insertion: 'Medial end of the scapular spine.',
    action:
      'Helps depress and retract the scapula and contributes to upward rotation with other shoulder-girdle muscles.',
    motorSupply:
      'Accessory nerve (CN XI); cervical C3–C4 contributions include proprioception.',
    caution:
      "Ascending denotes the lower fibres' direction, not scapular elevation. No isolated-fibre biomechanics is validated.",
    references: ['https://www.kenhub.com/en/library/anatomy/trapezius-muscle'],
  },
  {
    key: 'trapezius-transverse',
    fmaIds: ['FMA33585', 'FMA33584'],
    region: 'spine',
    representation: 'part',
    origin:
      'Upper thoracic midline spines and supraspinous attachments; the boundary with neighbouring parts varies.',
    insertion: 'Acromion and upper crest of the scapular spine.',
    action:
      'Primarily draws the scapula towards the vertebral column and helps stabilize it.',
    motorSupply:
      'Accessory nerve (CN XI); cervical C3–C4 contributions include proprioception.',
    caution:
      'This is the middle part, not the entire trapezius. Source seams are not validated functional borders.',
    references: ['https://www.kenhub.com/en/library/anatomy/trapezius-muscle'],
  },
  {
    key: 'trapezius-descending',
    fmaIds: ['FMA33587', 'FMA33586'],
    region: 'spine',
    representation: 'part',
    origin: 'Occipital superior-nuchal region and nuchal ligament.',
    insertion: 'Lateral third of the clavicle.',
    action:
      'Helps elevate the shoulder girdle and contributes to upward rotation; neck actions depend on fixation.',
    motorSupply:
      'Accessory nerve (CN XI); cervical C3–C4 contributions include proprioception.',
    caution:
      "Descending describes the upper fibres' direction, not depression. Neck movement is not inferred from the exploded position.",
    references: ['https://www.kenhub.com/en/library/anatomy/trapezius-muscle'],
  },
  {
    key: 'lumbar-rotator',
    fmaIds: ['FMA23090', 'FMA23089'],
    region: 'spine',
    representation: 'group',
    origin:
      'General family pattern begins on vertebral transverse elements; exact lumbar slips are not assigned.',
    insertion: 'General pattern reaches the lamina/spinous region above.',
    action:
      'The rotator family assists local postural control; the contribution of each lumbar slip has not been established for this entry.',
    motorSupply:
      'Medial branches of spinal posterior rami in the general rotator pattern.',
    caution:
      'Lumbar rotatores are variable and may be indistinct. Do not transfer thoracic slip counts or exact rotation claims to this regional representation.',
    references: ['https://www.kenhub.com/en/library/anatomy/rotatores-muscles'],
  },
  {
    key: 'thoracic-rotator',
    fmaIds: ['FMA23083'],
    region: 'spine',
    representation: 'group',
    origin: 'Thoracic transverse processes in the typical rotator pattern.',
    insertion:
      'Lamina/spinous regions one or two levels above for short and long slips respectively.',
    action:
      'Assists local stabilization, with small contributions to extension and opposite-side rotation.',
    motorSupply: 'Medial branches of spinal posterior rami.',
    caution:
      'This bilateral source group does not separately identify every short/long slip or vertebral level; its midline catalogue label is not an unpaired muscle.',
    references: ['https://www.kenhub.com/en/library/anatomy/rotatores-muscles'],
  },
  {
    key: 'iliocostalis-lumborum',
    fmaIds: ['FMA22741', 'FMA22740'],
    region: 'spine',
    representation: 'muscle',
    origin: 'Sacral/iliac attachments and thoracolumbar aponeurotic tissues.',
    insertion:
      'Lumbar transverse processes and lower ribs through distinct portions; described ranges vary.',
    action:
      'Helps extend the trunk bilaterally and bend it towards the active side unilaterally.',
    motorSupply: 'Branches of spinal posterior rami.',
    caution:
      'The lumbar and thoracic portions have different attachment patterns. A single source component does not validate each laminated tendon or justify an exact footprint.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/iliocostalis-muscle',
    ],
  },
  {
    key: 'iliocostalis-thoracis',
    fmaIds: ['FMA22743', 'FMA22742'],
    region: 'spine',
    representation: 'muscle',
    origin: 'Angles of ribs 7–12 in the typical description.',
    insertion: 'Angles of the upper six ribs and the C7 transverse process.',
    action: 'Assists spinal extension and same-side lateral bending.',
    motorSupply: 'Branches of spinal posterior rami.',
    caution:
      'This part spans ribs; do not reuse the pelvic origin of iliocostalis lumborum for it.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/iliocostalis-muscle',
    ],
  },
  {
    key: 'longissimus-thoracis',
    fmaIds: ['FMA22753', 'FMA22751'],
    region: 'spine',
    representation: 'muscle',
    origin:
      'Sacropelvic and lumbar vertebral attachments through the erector-spinae aponeurotic complex.',
    insertion:
      'Thoracic transverse processes and lower ribs; its lumbar portion reaches lumbar transverse/accessory processes.',
    action:
      'Helps extend the spine bilaterally and bend it towards the active side unilaterally.',
    motorSupply: 'Thoracic and lumbar posterior-ramus branches.',
    caution:
      'The name includes a lumbar portion in common descriptions. One continuous surface does not separately map all fascicles, tendons or regional nerve branches.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/longissimus-muscle',
    ],
  },
  {
    key: 'semispinalis-thoracis',
    fmaIds: ['FMA22873', 'FMA22872'],
    region: 'spine',
    representation: 'muscle',
    origin: 'Transverse processes around T6–T10.',
    insertion: 'Spinous processes around C6–T4.',
    action: 'Assists cervicothoracic extension and opposite-side rotation.',
    motorSupply: 'Medial branches of spinal posterior rami.',
    caution:
      'Its insertion is vertebral, not on the skull. Do not copy capitis-specific head attachments into this entry.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/semispinalis-thoracis-muscle',
    ],
  },
  {
    key: 'serratus-posterior-inferior',
    fmaIds: ['FMA13406', 'FMA13405'],
    region: 'spine',
    representation: 'muscle',
    origin: 'Midline spines and supraspinous tissues around T11–L2.',
    insertion: 'Lower borders of ribs 9–12, lateral to their angles.',
    action:
      'Classically described as drawing lower ribs down; its precise respiratory contribution remains debated.',
    motorSupply: 'Anterior-ramus branches T9–T11 and the subcostal nerve T12.',
    caution:
      'Posterior location does not mean posterior-ramus supply. The atlas does not settle disputed respiratory mechanics.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/serratus-posterior-muscles',
    ],
  },
  {
    key: 'serratus-posterior-superior',
    fmaIds: ['FMA13404', 'FMA13403'],
    region: 'spine',
    representation: 'muscle',
    origin: 'Lower nuchal ligament and midline spines around C7–T3.',
    insertion: 'Upper borders of ribs 2–5, lateral to their angles.',
    action:
      'Classically described as raising upper ribs; its precise respiratory contribution remains debated.',
    motorSupply: 'Intercostal nerves T2–T5, derived from anterior rami.',
    caution:
      'This is not serratus anterior and is not supplied by the long thoracic nerve. Respiratory action is a teaching description, not measured motion.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/serratus-posterior-muscles',
    ],
  },
  {
    key: 'spinalis',
    fmaIds: ['FMA77179'],
    region: 'spine',
    representation: 'group',
    origin:
      'Thoracic reference pattern: spinous processes around T11–L2; remaining source components are not given a finer identity here.',
    insertion:
      'Thoracic reference pattern: upper thoracic spinous processes, commonly T2–T8.',
    action:
      'The spinalis family contributes to extension and local postural support.',
    motorSupply: 'Branches of spinal posterior rami.',
    caution:
      'Four components are grouped under Spinalis. The index identifies FJ1544/FJ1544M as thoracic; it does not justify labelling FJ1543/FJ1543M as a complete cervical or capitis muscle. No skull attachment is assigned to this group.',
    references: ['https://www.kenhub.com/en/library/anatomy/spinalis-muscle'],
  },
  {
    key: 'lateral-lumbar-intertransversarius',
    fmaIds: ['FMA22850'],
    region: 'spine',
    representation: 'group',
    origin:
      'Transverse/accessory regions of lumbar vertebrae, depending on the lateral subdivision.',
    insertion: 'Transverse region of a contiguous lumbar vertebra.',
    action:
      'Helps stabilize adjacent lumbar segments and can assist same-side bending.',
    motorSupply: 'Anterior rami of lumbar spinal nerves.',
    caution:
      "The lateral group's ventral/dorsal subdivisions are not independently identified. Its nerve supply differs from the medial group.",
    references: [
      'https://www.kenhub.com/en/library/anatomy/intertransversarii-laterales-lumborum-muscles',
    ],
  },
  {
    key: 'medial-lumbar-intertransversarius',
    fmaIds: ['FMA22851'],
    region: 'spine',
    representation: 'group',
    origin: 'Accessory-process region of a lumbar vertebra.',
    insertion: 'Mammillary-process region of a contiguous lumbar vertebra.',
    action:
      'Helps steady adjacent lumbar segments and can assist same-side bending.',
    motorSupply: 'Posterior rami of adjacent lumbar spinal nerves.',
    caution:
      'This medial group is not simply another transverse-to-transverse sheet. A bilateral group is not a single midline slip.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/intertransversarii-laterales-lumborum-muscles',
    ],
  },
  {
    key: 'interspinalis-thoracis',
    fmaIds: ['FMA22891', 'FMA22890'],
    region: 'spine',
    representation: 'group',
    origin:
      'Upper aspect of a thoracic spinous process where a slip is present.',
    insertion: 'Lower aspect of the neighbouring spinous process above.',
    action:
      'The interspinalis family contributes to postural control; a specific movement contribution is not established for this thoracic representation.',
    motorSupply: 'Posterior rami of spinal nerves.',
    caution:
      'Thoracic slips are sparse and variable. Do not imply a complete serial muscle at every level or transfer cervical/lumbar functional measurements to this entry.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/interspinales-muscles',
    ],
  },
];
const byFma = new Map(
  trunkMuscleLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function trunkMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'anatomy' && tab !== 'function') || s.system !== 'muscles')
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l || !s.regions.includes(l.region)) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${l.representation === 'group' ? 'Source-group overview' : tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body:
      tab === 'function'
        ? l.action
        : l.representation === 'group'
          ? 'Partial source-group teaching: the attachments below are reference patterns, not proof of complete parts, levels or measured footprints.'
          : 'Typical attachments are described here, not measured footprints or independently validated fibres on this surface.',
    bullets:
      tab === 'anatomy'
        ? [
            `Origin: ${l.origin}`,
            `Insertion: ${l.insertion}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}.`,
          ]
        : [
            `Motor supply: ${l.motorSupply}`,
            'Named nerves are teaching references, not validated nerve courses or motor territories in this entry.',
          ],
    note: [
      'Draft teaching; independent anatomical and clinical review pending.',
      'Explode and cut controls do not simulate contraction, breathing or a safe procedure.',
      l.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
