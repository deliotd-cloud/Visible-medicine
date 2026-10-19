import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface NeckMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  representation?: 'regional-group';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const scalene = 'https://www.kenhub.com/en/library/anatomy/scalene-muscles';

// Exact source identities, ordered left/right; names and legacy IDs stay intact.
export const neckMuscleLessons: readonly NeckMuscleLesson[] = [
  {
    key: 'subclavius',
    fmaIds: ['FMA13411', 'FMA13412'],
    origin: 'First rib near its junction with the costal cartilage.',
    insertion: 'Underside of the middle third of the clavicle.',
    action:
      'Helps hold the clavicle steady during shoulder movement and draws it downwards.',
    motorSupply:
      'Nerve to subclavius, arising from the upper brachial-plexus trunk (C5–C6).',
    caution:
      'The head/neck catalogue placement is retained for navigation; this is a shoulder-girdle muscle. Its surface does not establish a safe space around the underlying vessels or plexus.',
    references: ['https://www.kenhub.com/en/library/anatomy/subclavius-muscle'],
  },
  {
    key: 'cervical-rotator',
    fmaIds: ['FMA81753', 'FMA81752'],
    representation: 'regional-group',
    origin:
      'General rotator pattern: vertebral transverse processes. Exact cervical levels are not assigned to this regional surface.',
    insertion:
      'General pattern reaches the lamina/spinous region above; the selected entry does not identify short versus long slips.',
    action:
      'Rotatores as a family help stabilize neighbouring vertebrae, with a small contribution to movement. The action of each cervical slip has not been established for this regional representation.',
    motorSupply:
      'The rotator family is generally supplied through medial branches of spinal posterior rami; individual cervical branches are not mapped here.',
    caution:
      'Cervical rotatores are variable and may blend with deep multifidus fibres. Do not transfer thoracic level counts or precise rotation actions to this selection. One source file does not prove one muscle slip.',
    references: ['https://www.kenhub.com/en/library/anatomy/rotatores-muscles'],
  },
  {
    key: 'platysma',
    fmaIds: ['FMA45740', 'FMA45739'],
    origin: 'Superficial fascia over the upper pectoral and deltoid regions.',
    insertion:
      'Lower mandibular region and soft tissues of the lower face, blending with facial muscles.',
    action:
      'Tenses the skin of the neck and can assist downward movement of the lower lip and mouth corner; its contribution varies.',
    motorSupply:
      'Usually the cervical branch of the facial nerve (CN VII), with variable additional facial-nerve contributions.',
    caution:
      'This is a muscle of facial expression, not a primary cervical flexor. A selected sheet does not resolve skin attachments, fascial planes or individual facial-nerve branches.',
    references: [books + 'NBK545294/', books + 'NBK542313/'],
  },
  {
    key: 'scalenus-anterior',
    fmaIds: ['FMA13393', 'FMA13392'],
    origin:
      'Anterior tubercles on the C3–C6 transverse processes, in the usual description.',
    insertion:
      'Scalene tubercle on rib 1, in front of the groove for the subclavian artery.',
    action:
      'With the rib stable, assists neck flexion and same-side bending. With the neck stable, helps elevate rib 1 for inspiration.',
    motorSupply:
      'Cervical anterior rami, commonly described as C4–C6; segmental contributions vary.',
    caution:
      'Attachment levels and neurovascular relationships vary. This entry does not validate the interscalene space, a phrenic-nerve course or a needle path.',
    references: [books + 'NBK519058/', scalene],
  },
  {
    key: 'scalenus-medius',
    fmaIds: ['FMA13391', 'FMA13390'],
    origin:
      'Cervical transverse processes, often described from C2–C7; upper attachments can vary.',
    insertion:
      'Upper surface of rib 1 behind the groove for the subclavian artery.',
    action:
      'Assists bending the neck towards its own side, or elevates rib 1 when the neck is held steady.',
    motorSupply: 'Cervical anterior rami, commonly C3–C8.',
    caution:
      'Source references differ in upper attachment detail. Individual slips and nerves passing through or beside the muscle require separate review.',
    references: [books + 'NBK519058/', scalene],
  },
  {
    key: 'scalenus-posterior',
    fmaIds: ['FMA13389', 'FMA13388'],
    origin:
      'Posterior tubercles of lower cervical transverse processes; the reported level range varies.',
    insertion: 'Outer surface of rib 2, not the first rib.',
    action:
      'Helps bend the neck towards its own side, or lifts rib 2 with the neck stabilized.',
    motorSupply: 'Cervical anterior rami, commonly C6–C8.',
    caution:
      'Do not infer a fixed vertebral origin range or a separately rendered accessory scalene from this source surface.',
    references: [books + 'NBK519058/', scalene],
  },
  {
    key: 'sternocleidomastoid',
    fmaIds: ['FMA13409', 'FMA13408'],
    origin:
      'Sternal head from the manubrium; clavicular head from the medial clavicle.',
    insertion:
      'Temporal mastoid process and superior nuchal line on the occipital bone.',
    action:
      'One side turns the face away while tilting the head towards itself. Bilateral action depends on neck posture and stabilization; cervical flexion can coexist with upper-head extension. With the head fixed, it can assist inspiration.',
    motorSupply:
      'Primarily the spinal accessory nerve (CN XI); cervical-plexus fibres also convey proprioceptive information.',
    caution:
      'The one-file entry does not separately identify the two heads. Exploding the mesh is not muscle contraction, and its appearance cannot diagnose torticollis or nerve injury.',
    references: [books + 'NBK532881/'],
  },
];
const byFma = new Map(
  neckMuscleLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);

export function neckMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('head-neck')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${l.representation ? 'Regional overview' : tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body:
      tab === 'anatomy'
        ? l.representation
          ? 'This is a regional source representation. Family-level teaching below does not assign individual slips or vertebral attachment levels.'
          : 'Typical attachments are described below; they are not measured footprints on the selected surface.'
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
      'This static surface does not simulate neck movement or breathing.',
      l.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
