import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface ThighMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  representation: 'muscle' | 'head' | 'portion';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution?: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const table =
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const obturator = 'Obturator nerve; individual branching requires review.';
const femoral = 'Femoral nerve.';
const tibial = 'Tibial division of the sciatic nerve.';
const quadricepsInsertion =
  'Patella through the quadriceps tendon; force continues through the patellar ligament to the tibial tuberosity.';
const gemellusInsertion =
  'Medial greater trochanter through the shared obturator-internus tendon apparatus.';

// Original brief factual drafts, not an imported textbook table. Exact source
// IDs distinguish heads/portions without adding or changing source surfaces.
export const thighMuscleLessons: readonly ThighMuscleLesson[] = [
  {
    key: 'adductor-brevis',
    fmaIds: ['FMA22452', 'FMA22454'],
    representation: 'muscle',
    origin: 'Pubic body and inferior pubic ramus.',
    insertion:
      'Proximal femur along the pectineal line and upper linea aspera.',
    action: 'Draws the thigh towards the midline and assists hip flexion.',
    motorSupply: obturator,
    references: [books + 'NBK534775/'],
  },
  {
    key: 'adductor-longus',
    fmaIds: ['FMA22456', 'FMA22457'],
    representation: 'muscle',
    origin: 'Anterior pubic body below the pubic crest.',
    insertion: 'Middle portion of the femoral linea aspera.',
    action:
      'Draws the thigh towards the midline; its contribution to other hip movements depends on position.',
    motorSupply: obturator,
    references: [books + 'NBK534775/'],
  },
  {
    key: 'adductor-magnus',
    fmaIds: ['FMA22459', 'FMA22460'],
    representation: 'muscle',
    origin:
      'Adductor portion: inferior pubic and ischial rami. Hamstring portion: ischial tuberosity.',
    insertion:
      'Adductor portion: gluteal tuberosity, linea aspera and medial supracondylar line. Hamstring portion: adductor tubercle.',
    action:
      'Adducts the hip; its hamstring portion also contributes to hip extension.',
    motorSupply:
      'Classically obturator nerve to the adductor portion and tibial division of sciatic nerve to the hamstring portion; overlapping supply occurs.',
    caution:
      'The selected source does not separately map these functional portions or their motor territories. Adductor minimus has a separate source label; this is not proof of a universal boundary.',
    references: [books + 'NBK534842/'],
  },
  {
    key: 'adductor-minimus',
    fmaIds: ['FMA43886', 'FMA43887'],
    representation: 'portion',
    origin: 'Inferior pubic ramus in the superior adductor-region description.',
    insertion: 'Medial aspect of the femoral gluteal tuberosity.',
    action:
      'Contributes to hip adduction as part of the superior adductor region.',
    motorSupply: obturator,
    caution:
      'Often described as the superior portion of adductor magnus, with variable separation. The two source labels do not prove distinct complete muscles or non-overlapping attachment territories.',
    references: [books + 'NBK534842/'],
  },
  {
    key: 'gemellus-inferior',
    fmaIds: ['FMA22336', 'FMA22337'],
    representation: 'muscle',
    origin: 'Ischial tuberosity.',
    insertion: gemellusInsertion,
    action:
      'Assists external hip rotation and abduction when the hip is flexed.',
    motorSupply: 'Nerve to quadratus femoris.',
    references: [books + 'NBK557420/'],
  },
  {
    key: 'gemellus-superior',
    fmaIds: ['FMA22334', 'FMA22335'],
    representation: 'muscle',
    origin: 'Ischial spine.',
    insertion: gemellusInsertion,
    action:
      'Assists external hip rotation and abduction when the hip is flexed.',
    motorSupply: 'Nerve to obturator internus.',
    references: [books + 'NBK557420/'],
  },
  {
    key: 'gluteus-maximus',
    fmaIds: ['FMA22328', 'FMA22329'],
    representation: 'muscle',
    origin:
      'Posterior ilium and sacrum, with associated lumbar fascia and sacrotuberous ligament.',
    insertion: 'Iliotibial tract and femoral gluteal tuberosity.',
    action:
      'Extends and externally rotates the hip, helping raise the trunk from a flexed position.',
    motorSupply: 'Inferior gluteal nerve.',
    references: [books + 'NBK538193/'],
  },
  {
    key: 'gluteus-medius',
    fmaIds: ['FMA22330', 'FMA22331'],
    representation: 'muscle',
    origin: 'Outer ilium between the anterior and posterior gluteal lines.',
    insertion:
      'Greater trochanter, principally its lateral and superolateral facets.',
    action:
      'Abducts the hip and helps keep the pelvis level over the supporting leg.',
    motorSupply: 'Superior gluteal nerve.',
    caution:
      'Fibre-specific rotational actions and attachment facets require review; the surface is not a functional-subdivision map.',
    references: [
      books + 'NBK557509/',
      'https://pubmed.ncbi.nlm.nih.gov/34686966/',
    ],
  },
  {
    key: 'gluteus-minimus',
    fmaIds: ['FMA22332', 'FMA22333'],
    representation: 'muscle',
    origin: 'Outer ilium between the anterior and inferior gluteal lines.',
    insertion: 'Anterior aspect of the greater trochanter.',
    action:
      'Abducts and stabilizes the hip; anterior fibres assist internal rotation.',
    motorSupply: 'Superior gluteal nerve.',
    references: [books + 'NBK556144/'],
  },
  {
    key: 'gracilis',
    fmaIds: ['FMA43883', 'FMA43884'],
    representation: 'muscle',
    origin: 'Pubic body and inferior pubic ramus.',
    insertion: 'Proximal medial tibia within the pes anserinus.',
    action:
      'Adducts the hip, flexes the knee and helps internally rotate the leg with the knee bent.',
    motorSupply: obturator,
    references: [books + 'NBK534775/'],
  },
  {
    key: 'iliacus',
    fmaIds: ['FMA22322', 'FMA22323'],
    representation: 'muscle',
    origin: 'Iliac fossa and inner iliac crest.',
    insertion:
      'Lesser trochanter region through the iliopsoas attachment apparatus.',
    action: 'Flexes the hip in conjunction with psoas major.',
    motorSupply: femoral,
    caution:
      'Iliacus and psoas major have separate source identities and different motor supplies; a shared distal apparatus is not a single nerve territory.',
    references: [books + 'NBK531508/', books + 'NBK500008/'],
  },
  {
    key: 'obturator-externus',
    fmaIds: ['FMA22326', 'FMA22327'],
    representation: 'muscle',
    origin: 'External obturator membrane and adjacent bony margins.',
    insertion: 'Trochanteric fossa of the femur.',
    action: 'Externally rotates the thigh.',
    motorSupply: 'Obturator nerve.',
    references: [table],
  },
  {
    key: 'obturator-internus',
    fmaIds: ['FMA22324', 'FMA22325'],
    representation: 'muscle',
    origin: 'Internal obturator membrane and surrounding foramen margins.',
    insertion: 'Medial greater trochanter above the trochanteric fossa.',
    action:
      'Externally rotates the hip and assists abduction with the hip flexed.',
    motorSupply: 'Nerve to obturator internus, not the obturator nerve.',
    references: [table, books + 'NBK557420/'],
  },
  {
    key: 'pectineus',
    fmaIds: ['FMA22450', 'FMA22451'],
    representation: 'muscle',
    origin: 'Superior pubic ramus at the pecten pubis.',
    insertion: 'Femoral pectineal line.',
    action: 'Adducts and flexes the thigh.',
    motorSupply:
      'Usually femoral nerve; additional obturator supply may occur.',
    references: [table],
  },
  {
    key: 'piriformis',
    fmaIds: ['FMA22340', 'FMA22341'],
    representation: 'muscle',
    origin: 'Pelvic surface of the sacrum, with variable adjacent attachments.',
    insertion: 'Superior aspect of the greater trochanter.',
    action: 'Assists external hip rotation and abduction of the flexed thigh.',
    motorSupply:
      'Nerve to piriformis from the sacral plexus; branching varies.',
    caution:
      'No sciatic-nerve course, nerve-through-muscle variant or entrapment diagnosis is established by this surface.',
    references: [books + 'NBK519497/'],
  },
  {
    key: 'psoas-major',
    fmaIds: ['FMA22342', 'FMA22343'],
    representation: 'muscle',
    origin:
      'Lower thoracic/lumbar vertebral bodies and discs, and lumbar transverse processes.',
    insertion: 'Lesser trochanter through the iliopsoas tendon apparatus.',
    action:
      'Flexes the hip; with the femur fixed, contributes to movement and support of the lumbar region.',
    motorSupply:
      'Direct branches of lumbar anterior rami, not the femoral supply of iliacus.',
    caution:
      'Vertebral-level footprints and lumbar-plexus relations are not mapped on this source surface.',
    references: [books + 'NBK531508/', books + 'NBK500008/'],
  },
  {
    key: 'quadratus-femoris',
    fmaIds: ['FMA22338', 'FMA22339'],
    representation: 'muscle',
    origin: 'Lateral border of the ischial tuberosity.',
    insertion:
      'Posterior proximal femur at the quadrate line near the intertrochanteric crest.',
    action: 'Externally rotates the thigh.',
    motorSupply: 'Nerve to quadratus femoris.',
    references: [table],
  },
  {
    key: 'sartorius',
    fmaIds: ['FMA22354', 'FMA22355'],
    representation: 'muscle',
    origin: 'Anterior superior iliac spine.',
    insertion: 'Proximal medial tibia within the pes anserinus.',
    action:
      'Flexes, abducts and externally rotates the hip; flexes the knee and assists internal leg rotation when it is bent.',
    motorSupply: femoral,
    references: [books + 'NBK532889/'],
  },
  {
    key: 'semimembranosus',
    fmaIds: ['FMA22448', 'FMA22449'],
    representation: 'muscle',
    origin: 'Ischial tuberosity.',
    insertion:
      'Posterior aspect of the medial tibial condyle, with associated tendon expansions.',
    action:
      'Extends the hip, flexes the knee and assists internal leg rotation with the knee bent.',
    motorSupply: tibial,
    caution:
      'The distal expansions are not independently segmented; this is not a complete posteromedial-knee reconstruction.',
    references: [books + 'NBK542215/'],
  },
  {
    key: 'semitendinosus',
    fmaIds: ['FMA22358', 'FMA22359'],
    representation: 'muscle',
    origin: 'Ischial tuberosity.',
    insertion: 'Proximal medial tibia within the pes anserinus.',
    action:
      'Extends the hip, flexes the knee and assists internal leg rotation with the knee bent.',
    motorSupply: tibial,
    references: [books + 'NBK542215/'],
  },
  {
    key: 'tensor-fasciae-latae',
    fmaIds: ['FMA22425', 'FMA22426'],
    representation: 'muscle',
    origin: 'Anterior iliac crest near the anterior superior iliac spine.',
    insertion:
      'Iliotibial tract; its distal continuation reaches the lateral proximal tibia.',
    action:
      'Assists hip flexion, abduction and internal rotation while tensioning the iliotibial tract.',
    motorSupply: 'Superior gluteal nerve.',
    caution:
      'This is a fascial continuation, not a separately mapped tendon directly connecting the muscle to the tibia.',
    references: [books + 'NBK526019/', books + 'NBK532889/'],
  },
  {
    key: 'rectus-femoris',
    fmaIds: ['FMA38928', 'FMA38929'],
    representation: 'muscle',
    origin:
      'Anterior inferior iliac spine and the region above the acetabular rim through direct and indirect tendons.',
    insertion: quadricepsInsertion,
    action:
      'Extends the knee and flexes the hip; unlike the vasti, it crosses both joints.',
    motorSupply: femoral,
    caution:
      'The proximal heads and intramuscular tendon are not separate selectable structures here.',
    references: [books + 'NBK513334/'],
  },
  {
    key: 'vastus-lateralis',
    fmaIds: ['FMA38930', 'FMA38931'],
    representation: 'muscle',
    origin:
      'Greater trochanter, gluteal tuberosity and lateral lip of the femoral linea aspera.',
    insertion: quadricepsInsertion,
    action:
      'Extends the knee as part of the quadriceps; it does not cross the hip.',
    motorSupply: femoral,
    references: [books + 'NBK513334/'],
  },
  {
    key: 'vastus-medialis',
    fmaIds: ['FMA38932', 'FMA38933'],
    representation: 'muscle',
    origin:
      'Intertrochanteric line and medial lip of the femoral linea aspera.',
    insertion: quadricepsInsertion,
    action:
      'Extends the knee as part of the quadriceps; it does not cross the hip.',
    motorSupply: femoral,
    caution:
      'Oblique and longitudinal fibre subdivisions are not separately segmented or functionally validated.',
    references: [books + 'NBK500008/', books + 'NBK513334/'],
  },
  {
    key: 'vastus-intermedius',
    fmaIds: ['FMA38934', 'FMA38935'],
    representation: 'muscle',
    origin: 'Anterior and lateral femoral shaft.',
    insertion: quadricepsInsertion,
    action:
      'Extends the knee as part of the quadriceps; it does not cross the hip.',
    motorSupply: femoral,
    references: [books + 'NBK513334/'],
  },
  {
    key: 'biceps-femoris-long-head',
    fmaIds: ['FMA45888', 'FMA45889'],
    representation: 'head',
    origin: 'Ischial tuberosity.',
    insertion:
      'Shared biceps femoris distal tendon, principally at the fibular head.',
    action:
      'Extends the hip, flexes the knee and assists external leg rotation with the knee bent.',
    motorSupply: tibial,
    references: [books + 'NBK546688/'],
  },
  {
    key: 'biceps-femoris-short-head',
    fmaIds: ['FMA45891', 'FMA45892'],
    representation: 'head',
    origin:
      'Lateral lip of the femoral linea aspera and lateral supracondylar region.',
    insertion:
      'Shared biceps femoris distal tendon, principally at the fibular head.',
    action:
      'Flexes the knee and assists external leg rotation with the knee bent. It does not cross or extend the hip.',
    motorSupply: 'Common fibular division of the sciatic nerve.',
    references: [books + 'NBK546688/'],
  },
];

const byFma = new Map(
  thighMuscleLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function thighMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('thigh')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body:
      tab === 'function'
        ? l.action
        : l.representation === 'head'
          ? 'One source-labelled head is selected, not the whole muscle. Distal notes describe the shared tendon apparatus.'
          : l.representation === 'portion'
            ? 'This source label describes a variably separate muscle portion; it does not establish a universal boundary from the neighbouring muscle.'
            : 'Typical attachments are described below, not measured footprints or validated tendon compartments on this surface.',
    bullets:
      tab === 'anatomy'
        ? [
            `Proximal attachment: ${l.origin}`,
            `Distal attachment: ${l.insertion}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}`,
          ]
        : [
            `Motor supply: ${l.motorSupply}`,
            'Named limb nerves and plexus branches are teaching references; their courses are not rendered in this regional model.',
          ],
    note: [
      'Draft teaching; independent anatomical and clinical review pending.',
      l.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
