import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
type ForearmVesselClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'vessel',
];
interface ForearmVesselClinicalGroup {
  key: string;
  identities: readonly ForearmVesselClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original factual teaching bound to exact represented source identities; no publisher assets imported.
export const forearmVesselClinicalGroups: readonly ForearmVesselClinicalGroup[] =
  [
    {
      key: 'radial-arteries',
      identities: [
        [
          'FMA22733',
          'right',
          'isa',
          ['FJ2294'],
          'forearm',
          ['forearm', 'hand'],
          'vessel',
        ],
        [
          'FMA22734',
          'left',
          'isa',
          ['FJ2242'],
          'forearm',
          ['forearm', 'hand'],
          'vessel',
        ],
      ],
      scope:
        'Separate radial artery sources with forearm/hand membership. No wall layers, thrombus, catheter, complete palmar arches or validated collateral sufficiency.',
      pathology: {
        body: 'Radial artery occlusion can follow transradial cardiac catheterization and may occur without obvious symptoms. Arterial patency is therefore a different question from whether the hand looks normal or feels comfortable.',
        bullets: [
          'Occlusion of one artery does not by itself describe the blood supply reaching every finger.',
          'Clinical studies assess vessel patency; the reference surface does not contain those measurements.',
        ],
      },
      clinical: {
        body: 'Clinical vascular ultrasound can assess radial flow and patency when indicated. A newly cold, pale, severely painful, numb or weak hand requires emergency assessment; in the UK call 999 for suspected acute limb ischaemia.',
        bullets: [
          "Follow the treating team's advice after a vascular procedure; the atlas cannot clear someone for repeat access.",
          'No Allen-test simulation, puncture site, compression method, heparin dose or device recommendation is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/19801029/',
        'https://pubmed.ncbi.nlm.nih.gov/30431581/',
        'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
      ],
    },
    {
      key: 'ulnar-arteries',
      identities: [
        [
          'FMA22797',
          'right',
          'isa',
          ['FJ2310'],
          'forearm',
          ['forearm', 'hand'],
          'vessel',
        ],
        [
          'FMA22798',
          'left',
          'isa',
          ['FJ2258'],
          'forearm',
          ['forearm', 'hand'],
          'vessel',
        ],
      ],
      scope:
        'Right/left ulnar arteries retain forearm/hand membership; no distal lesion, hamate contact mechanics, digital embolus or validated superficial palmar circulation.',
      pathology: {
        body: 'Hypothenar hammer syndrome involves injury to the palmar ulnar artery associated with repeated impacts on the heel of the hand. Thrombosis or embolic obstruction of downstream digital vessels can cause finger ischaemia.',
        bullets: [
          'The cited clinical series proposed an underlying arterial predisposition; that hypothesis is not a requirement for diagnosis.',
          'Not every painful hand or occupational exposure indicates this syndrome.',
        ],
      },
      clinical: {
        body: 'New finger coldness, colour change, pain or numbness after repetitive hand trauma warrants medical assessment. Sudden severe symptoms require emergency care; clinical history, examination and vascular imaging identify the cause.',
        bullets: [
          'The proximal forearm surface alone cannot establish a lesion in the palm.',
          'No impact-provocation test, occupational exposure limit, graft choice or treatment algorithm is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/10642713/',
        'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
      ],
    },
    {
      key: 'anterior-interosseous-arteries',
      identities: [
        [
          'FMA22812',
          'right',
          'isa',
          ['FJ2266'],
          'forearm',
          ['forearm', 'hand'],
          'vessel',
        ],
        [
          'FMA22813',
          'left',
          'isa',
          ['FJ2214'],
          'forearm',
          ['forearm', 'hand'],
          'vessel',
        ],
      ],
      scope:
        'Separate anterior interosseous arteries, not their namesake nerves or the posterior interosseous arteries. No arterial leak, haematoma or intraneural anatomy is modelled.',
      pathology: {
        body: 'A delayed anterior interosseous artery pseudoaneurysm has been reported after fixation of an ulnar fracture, with a painful forearm mass and anterior interosseous nerve palsy. A contained arterial leak and a nerve deficit can therefore coexist.',
        bullets: [
          'This rare case demonstrates a possible complication, not its frequency.',
          'A pseudoaneurysm is not a normal branch junction or an enlarged nerve.',
        ],
      },
      clinical: {
        body: 'New or enlarging forearm swelling, worsening pain or new weakness after injury or fixation needs prompt reassessment. Clinical examination and appropriate vascular imaging distinguish arterial injury from other causes of postoperative symptoms.',
        bullets: [
          'The atlas cannot identify the source of a mass or prove that a nerve is compressed.',
          'No aspiration, drainage, plate position, embolisation route or surgical treatment plan is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/34925612/'],
    },
    {
      key: 'cephalic-veins',
      identities: [
        [
          'FMA13325',
          'right',
          'isa',
          ['FJ2272'],
          'forearm',
          ['forearm', 'shoulder-arm'],
          'vessel',
        ],
        [
          'FMA13326',
          'left',
          'isa',
          ['FJ2220'],
          'forearm',
          ['forearm', 'shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        'Independent cephalic veins with forearm/shoulder-arm navigation. No valves, clot, cephalic-arch stenosis, AV fistula or dialysis flow is represented.',
      pathology: {
        body: 'Superficial vein inflammation can follow a cannula or injection and cause a tender, warm, swollen area. Symptoms along the cephalic vein are not automatically a deep vein thrombosis, but clinical assessment may be needed to distinguish them.',
        bullets: [
          'Visible redness can be less obvious on darker skin; tenderness and swelling also matter.',
          'A blue reference vein cannot diagnose inflammation, thrombosis or infection.',
        ],
      },
      clinical: {
        body: 'The cephalic vein can form part of a surgically created dialysis fistula, joined to a radial or brachial artery. This is a deliberate artery–vein connection, not the normal venous anatomy shown here.',
        bullets: [
          'A new painful or swollen arm needs urgent assessment; UK NHS 111 can advise.',
          'Dialysis-access planning requires the renal/vascular team and actual vessel assessment; no cannulation or fistula-creation instructions are supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/phlebitis/',
        'https://my.clevelandclinic.org/health/procedures/dialysis-fistula',
        'https://www.niddk.nih.gov/health-information/kidney-disease/kidney-failure/hemodialysis',
      ],
    },
    {
      key: 'basilic-veins',
      identities: [
        [
          'FMA22909',
          'right',
          'isa',
          ['FJ2270'],
          'forearm',
          ['forearm', 'shoulder-arm'],
          'vessel',
        ],
        [
          'FMA22910',
          'left',
          'isa',
          ['FJ2218'],
          'forearm',
          ['forearm', 'shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        'Separate basilic veins retain forearm/shoulder-arm membership. The model has no catheter, central tip position, fascial-entry clearance, clot or dialysis fistula.',
      pathology: {
        body: 'A peripherally inserted central catheter (PICC) may use an upper-arm vein such as the basilic vein. Catheter-associated thrombosis and infection are distinct complications; pain, swelling or redness does not establish which problem is present.',
        bullets: [
          'The basilic vein is not interchangeable with a deep brachial companion vein.',
          'A catheter can be correctly named yet still require separate checks of position and function.',
        ],
      },
      clinical: {
        body: 'New arm swelling or insertion-site pain, redness, discharge, fever or chills with a PICC needs prompt contact with the treating team. The team determines assessment and treatment; do not use the atlas to adjust or remove a line.',
        bullets: [
          'Preserving arm veins can matter for future dialysis access, so suitability depends on the whole clinical plan.',
          'No universal preferred vein, catheter size, insertion route, flushing routine or anticoagulant/antibiotic regimen is supplied.',
        ],
      },
      references: [
        'https://www.clinicalguidelines.scot.nhs.uk/media/1515/vascular-access-procedure-and-practice-guidelines.pdf',
        'https://www.plymouthhospitals.nhs.uk/display-pil/pil-your-picc-line-7825/',
        'https://www.uhmb.nhs.uk/our-services/patient-information-leaflets/care-your-peripherally-inserted-central-catheter',
        'https://www.niddk.nih.gov/health-information/kidney-disease/kidney-failure/hemodialysis',
      ],
    },
    {
      key: 'common-interosseous-arteries',
      identities: [
        [
          'FMA22807',
          'right',
          'isa',
          ['FJ2275'],
          'forearm',
          ['forearm'],
          'vessel',
        ],
        [
          'FMA22808',
          'left',
          'isa',
          ['FJ2223'],
          'forearm',
          ['forearm'],
          'vessel',
        ],
      ],
      scope:
        'Separate common interosseous trunks only; no complete anterior/posterior branch continuity or reconstructed variant origin. Primary region remains forearm.',
      pathology: {
        body: 'Common interosseous arterial origins can vary alongside other upper-limb arterial variations. A reported common trunk arose from the radial rather than the usual ulnar-side pattern; a variant origin is not itself an aneurysm or occlusion.',
        bullets: [
          'The cited cadaver report is an observation, not a population prevalence estimate.',
          'No unusual origin is assigned to this reference simply because another specimen had one.',
        ],
      },
      clinical: {
        body: 'Distinguishing a common trunk from its anterior and posterior branches matters when interpreting forearm vascular imaging or planning reconstruction. A familiar vessel name is not enough to establish its origin in an individual patient.',
        bullets: [
          'The atlas does not certify every junction or identify an apparently superficial vessel for access.',
          'No assumed collateral route, branch-sacrifice rule, injection site or operative corridor is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/27437201/'],
    },
    {
      key: 'recurrent-interosseous-arteries',
      identities: [
        [
          'FMA268667',
          'right',
          'isa',
          ['FJ2297'],
          'forearm',
          ['forearm'],
          'vessel',
        ],
        [
          'FMA268669',
          'left',
          'isa',
          ['FJ2245'],
          'forearm',
          ['forearm'],
          'vessel',
        ],
      ],
      scope:
        'Independent recurrent interosseous identities. These are not separately validated posterior interosseous main trunks, cutaneous perforators or a patent elbow collateral ring.',
      pathology: {
        body: 'Recurrent interosseous perforators have been studied in posterior forearm flap reconstruction. Their relevance is the blood supply reaching transferred tissue; seeing a named parent artery does not prove that all required perforators or venous drainage are intact.',
        bullets: [
          'Anatomical dissections and a clinical series support reconstructive context, not a universal safe tissue territory.',
          "A flap's compromised supply is not diagnosed from the colour of this surface.",
        ],
      },
      clinical: {
        body: 'Use this selection to distinguish the recurrent branch from the posterior interosseous arterial system described in reconstructive literature. Actual perforators, connections and tissue viability require specialist assessment.',
        bullets: [
          'No flap dimensions, ligation point, pedicle length or harvesting technique is reproduced.',
          'The source does not demonstrate collateral adequacy around an injured elbow or predict flap survival.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/26078501/'],
    },
  ];
const byFma = new Map(
  forearmVesselClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
export function forearmVesselClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'vessels')
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions, category] = match.identity;
  if (
    s.category !== category ||
    s.laterality !== side ||
    s.sourceTree !== tree ||
    s.region !== region ||
    !same(s.regions, regions) ||
    !same(
      s.sources.map((p) => p.file),
      files,
    )
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
