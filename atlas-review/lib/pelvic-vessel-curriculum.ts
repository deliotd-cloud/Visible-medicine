import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface PelvicVesselLesson {
  fmaId: string;
  side: 'right' | 'left';
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const iliacArteries = books + 'NBK519552/';
const internalArteries = books + 'NBK537311/';
const veins = books + 'NBK554574/';
const cava = books + 'NBK482353/';
const crossing = books + 'NBK554377/';
const pelvicVenousVariation =
  'https://researcher.manipal.edu/en/publications/variant-anatomy-of-the-iliac-veins-and-presence-of-two-venous-rin/';
const requiredRegions = ['pelvis', 'abdomen', 'thigh'] as const;
function vessel(
  fmaId: string,
  side: PelvicVesselLesson['side'],
  anatomy: string,
  role: string,
  distinction: string,
  references: readonly string[],
): PelvicVesselLesson {
  return { fmaId, side, anatomy, function: role, distinction, references };
}
const commonLimit =
  'This is the parent artery, not the internal or external division. Bifurcation level, ureteral crossing and vessel–nerve clearance are not validated by the selected surface.';
const externalArteryLimit =
  'The femoral name transition is anatomical context, not a simulated join or safe access point. Inferior epigastric and deep circumflex iliac branches are not proven complete by this selection.';
const internalArteryLimit =
  'Anterior/posterior divisions and their branches vary. This adult-male reference does not provide a female pelvic vascular model; named branches are not independently validated by the trunk surface.';

// Short original teaching for existing identities; no publisher assets imported.
export const pelvicVesselLessons: readonly PelvicVesselLesson[] = [
  vessel(
    'FMA14765',
    'right',
    'The right common iliac artery begins at the aortic bifurcation and divides into internal and external iliac arteries near the pelvic brim.',
    'Routes arterial blood toward right pelvic and lower-limb pathways.',
    commonLimit,
    [iliacArteries],
  ),
  vessel(
    'FMA14766',
    'left',
    'The left common iliac artery descends from the aortic bifurcation toward its internal and external iliac divisions.',
    'Routes arterial blood toward left pelvic and lower-limb pathways.',
    commonLimit,
    [iliacArteries],
  ),
  vessel(
    'FMA18806',
    'right',
    'The right external iliac artery follows the medial psoas border and continues beneath the inguinal ligament as the femoral artery.',
    'Provides the principal arterial route into the right lower limb.',
    externalArteryLimit,
    [iliacArteries],
  ),
  vessel(
    'FMA18807',
    'left',
    'The left external iliac artery follows the medial psoas border and continues beneath the inguinal ligament as the femoral artery.',
    'Provides the principal arterial route into the left lower limb.',
    externalArteryLimit,
    [iliacArteries],
  ),
  vessel(
    'FMA18809',
    'right',
    'The right internal iliac artery descends into the true pelvis from the common iliac division and usually separates into anterior and posterior trunks.',
    'Supplies pelvic tissues and contributes branches to the perineum, gluteal region and thigh.',
    internalArteryLimit,
    [internalArteries],
  ),
  vessel(
    'FMA18810',
    'left',
    'The left internal iliac artery descends into the true pelvis from the common iliac division and usually separates into anterior and posterior trunks.',
    'Supplies pelvic tissues and contributes branches to the perineum, gluteal region and thigh.',
    internalArteryLimit,
    [internalArteries],
  ),
  vessel(
    'FMA21387',
    'right',
    'The right internal and external iliac veins unite as the right common iliac vein, which takes a relatively direct course toward the caval confluence.',
    'Returns right pelvic and lower-limb venous blood toward the inferior vena cava.',
    'The usual right-sided course is not a mirror of the left crossing. Confluence position, tributaries, patency and arterial relationships require source and clinical review.',
    [veins, cava],
  ),
  vessel(
    'FMA21388',
    'left',
    'The left common iliac vein joins the right-sided caval confluence, typically passing beneath the right common iliac artery.',
    'Returns left pelvic and lower-limb venous blood toward the inferior vena cava.',
    'An artery crossing a vein does not by itself diagnose May–Thurner syndrome. Compression, thrombus, collateral flow and symptoms are not determined by this reference surface.',
    [veins, cava, crossing],
  ),
  vessel(
    'FMA18885',
    'right',
    'The right external iliac vein continues from the femoral vein above the inguinal ligament and joins the internal iliac vein.',
    'Returns lower-limb venous blood toward the right common iliac vein.',
    'Not the accompanying artery. This single segment does not show every abdominal-wall tributary, venous valve or an uninterrupted patent lumen.',
    [veins],
  ),
  vessel(
    'FMA18886',
    'left',
    'The left external iliac vein continues from the femoral vein above the inguinal ligament and joins the internal iliac vein.',
    'Returns lower-limb venous blood toward the left common iliac vein.',
    'Four source components form this selection. They are not automatically labelled femoral, epigastric or circumflex tributaries, and do not certify continuous flow.',
    [veins],
  ),
  vessel(
    'FMA18887',
    'right',
    'The right internal iliac vein collects pelvic venous tributaries and joins the external iliac vein to form the common iliac vein.',
    'Collects venous return from pelvic, gluteal and perineal tissues.',
    'The six-file source group is not a complete pelvic venous plexus. Components are not assigned organ territories or named tributaries; valve status and drainage completeness remain unvalidated.',
    [veins, pelvicVenousVariation],
  ),
  vessel(
    'FMA18888',
    'left',
    'The left internal iliac vein collects pelvic venous tributaries and joins the external iliac vein to form the common iliac vein.',
    'Collects venous return from pelvic, gluteal and perineal tissues.',
    'The three-file source group is not equivalent to three named tributaries or a mirror of the six-file right group. Pelvic plexuses, cross-connections and variant confluences require review.',
    [veins, pelvicVenousVariation],
  ),
];
const byFma = new Map(pelvicVesselLessons.map((l) => [l.fmaId, l]));
export function pelvicVesselLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'vessels' ||
    s.category !== 'vessel' ||
    s.region !== 'pelvis' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (
    !l ||
    s.laterality !== l.side ||
    !requiredRegions.every((r) => s.regions.includes(r))
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
            'Red/blue denotes artery/vein, not oxygenation or measured flow. Shared abdomen/pelvis/thigh navigation is not a segmented supply or drainage map.',
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
