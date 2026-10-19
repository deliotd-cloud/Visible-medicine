import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
type PelvicVesselClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'vessel',
];
interface PelvicVesselClinicalGroup {
  key: string;
  identities: readonly PelvicVesselClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original factual teaching for exact represented identities; no publisher media or protocols imported.
export const pelvicVesselClinicalGroups: readonly PelvicVesselClinicalGroup[] =
  [
    {
      key: 'common-iliac-arteries',
      identities: [
        [
          'FMA14765',
          'right',
          'isa',
          ['FJ3565'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
        [
          'FMA14766',
          'left',
          'isa',
          ['FJ3464'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
      ],
      scope:
        'Independent right/left common iliac trunks; not their internal/external divisions. No aneurysm sac, wall layers, thrombus, measured lumen or validated ureter/vein clearance.',
      pathology: {
        body: 'An iliac artery aneurysm is an abnormal enlargement that may cause no symptoms, compress neighbouring structures or rupture. It is different from the narrowing caused by arterial plaque. A vessel that looks wide at this zoom level is not evidence of either condition.',
        bullets: [
          'The common iliac trunk lies upstream of both pelvic and lower-limb arterial pathways.',
          'A normal reference surface cannot exclude an aneurysm or establish rupture risk.',
        ],
      },
      clinical: {
        body: "Suspected iliac aneurysm needs clinical imaging and specialist assessment. New severe abdominal, back or groin pain with collapse requires emergency help. Local pressure effects cannot be diagnosed by the model's apparent contact with surrounding structures.",
        bullets: [
          'Compare the named common trunk with its internal/external divisions for orientation, not lesion localisation.',
          'No repair diameter, surveillance interval, graft size or procedural access route is supplied.',
        ],
      },
      references: [
        'https://my.clevelandclinic.org/health/diseases/iliac-artery-aneurysm',
      ],
    },
    {
      key: 'external-iliac-arteries',
      identities: [
        [
          'FMA18806',
          'right',
          'isa',
          ['FJ3567'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
        [
          'FMA18807',
          'left',
          'isa',
          ['FJ3466'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
      ],
      scope:
        'Separate right/left external iliac sources with pelvis/abdomen/thigh navigation preserved. The femoral transition is not a reconstructed lumen, puncture point or validated inguinal-ligament clearance.',
      pathology: {
        body: 'Atherosclerotic disease in a lower-limb inflow artery can reduce blood delivery during exercise. Acute arterial occlusion from a clot is a different, time-critical presentation; a visible reference artery does not establish adequate perfusion.',
        bullets: [
          'Exertional leg pain can have nonvascular causes and does not identify this artery as the culprit.',
          'Rest pain or nonhealing foot wounds need assessment beyond a surface model.',
        ],
      },
      clinical: {
        body: 'Recurrent exercise-related leg pain warrants assessment of symptoms, pulses and appropriate circulation tests. A suddenly cold, painful limb with new numbness or weakness is an emergency: obtain immediate medical help rather than waiting to match symptoms to this atlas.',
        bullets: [
          'Ankle–arm pressure comparison and clinical vascular imaging are tests; rendering colour and diameter are not.',
          'No Doppler threshold, walking prescription, stent choice, bypass plan or clot-removal route is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/peripheral-arterial-disease-pad/',
        'https://www.nhs.uk/conditions/peripheral-arterial-disease-pad/diagnosis/',
        'https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000001251',
      ],
    },
    {
      key: 'internal-iliac-arteries',
      identities: [
        [
          'FMA18809',
          'right',
          'isa',
          ['FJ3569'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
        [
          'FMA18810',
          'left',
          'isa',
          ['FJ3468'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
      ],
      scope:
        'Right/left internal iliac trunk selections in an adult-male reference. No complete anterior/posterior branch tree, female pelvic vasculature or validated pelvic perfusion territory.',
      pathology: {
        body: 'Internal iliac branches can be injured in major pelvic trauma and contribute to concealed bleeding. Pelvic haemorrhage can also arise from veins and fractured bone; an arterial label must not be mistaken for proof of the bleeding source.',
        bullets: [
          'The selected trunk is not an independently localised injured gluteal, pudendal or obturator branch.',
          'An uninjured-looking model does not exclude serious pelvic bleeding.',
        ],
      },
      clinical: {
        body: 'Major pelvic injury requires emergency trauma assessment that considers circulation, pelvic stability and associated injuries together. Showing only arteries would leave important potential bleeding sources out of the discussion.',
        bullets: [
          'This anatomical view cannot determine bleeding activity, haemodynamic stability or organ viability.',
          'No embolisation target, vessel-sacrifice decision, packing technique or pelvic-stabilisation instruction is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC5241998/'],
    },
    {
      key: 'right-common-iliac-vein',
      identities: [
        [
          'FMA21387',
          'right',
          'isa',
          ['FJ3566'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
      ],
      scope:
        'One right common iliac venous source, not a mirror of the left crossing. No thrombus, venous valves, complete caval confluence or validated flow direction.',
      pathology: {
        body: 'Clot in an iliac vein is proximal deep venous thrombosis and can obstruct pelvic or lower-limb venous return. Right-sided disease is possible; the familiar left-sided compression relationship does not exclude other causes or locations of venous obstruction.',
        bullets: [
          'Venous thrombosis is different from an arterial blockage or an aneurysm.',
          'Symptoms and investigations, not the side label, establish the affected vein.',
        ],
      },
      clinical: {
        body: 'New unilateral leg pain or swelling should prompt urgent medical assessment for DVT and other causes. DVT symptoms accompanied by chest pain or breathlessness need emergency help; in the UK call 999.',
        bullets: [
          'A clot may embolise to the lungs, but no embolus is simulated here.',
          'No anticoagulant dose, thrombectomy route, venous-stent plan or individual embolic-risk estimate is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/',
        'https://www.nhs.uk/conditions/pulmonary-embolism/',
      ],
    },
    {
      key: 'left-common-iliac-vein',
      identities: [
        [
          'FMA21388',
          'left',
          'isa',
          ['FJ3465'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
      ],
      scope:
        'One left common iliac venous source. The usual right-common-iliac-artery crossing is anatomical context, not a measured compression, spur, pressure gradient or clot.',
      pathology: {
        body: 'The left common iliac vein can be compressed beneath the right common iliac artery. This relationship may be clinically relevant in venous obstruction or left iliofemoral DVT, but compression also occurs without venous symptoms. Anatomy alone is not a diagnosis of May–Thurner syndrome.',
        bullets: [
          'Nonthrombotic compression and an actual venous clot are different findings.',
          'Do not infer a syndrome, causal mechanism or need for treatment from this reference crossing.',
        ],
      },
      clinical: {
        body: 'Assessment relates venous symptoms and clinical imaging to alternative causes. Duplex studies and cross-sectional imaging can contribute; this atlas does not perform either examination or quantify narrowing. New possible DVT still requires urgent assessment.',
        bullets: [
          'The cited asymptomatic CT study was observational, not a diagnostic cut-off or individual risk calculator.',
          'No stenosis threshold, prophylactic treatment, stent sizing or scan-registration accuracy is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC11332375/',
        'https://pubmed.ncbi.nlm.nih.gov/15111841/',
        'https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/',
      ],
    },
    {
      key: 'external-iliac-veins',
      identities: [
        [
          'FMA18885',
          'right',
          'isa',
          ['FJ3568'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
        [
          'FMA18886',
          'left',
          'isa',
          ['FJ3484', 'FJ3522', 'FJ3523', 'FJ3524'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
      ],
      scope:
        'One right source component and four ordered left components; not four left tributaries or a validated femoral join. The unequal source grouping is preserved.',
      pathology: {
        body: 'Iliofemoral DVT can involve the external iliac venous outflow route. After DVT, persistent venous damage and impaired return can contribute to post-thrombotic symptoms such as swelling and discomfort; this is distinct from proving a new clot.',
        bullets: [
          'A multi-component vein is not a segmented thrombus.',
          'The four left components do not establish a greater clot burden or worse prognosis than the single right component.',
        ],
      },
      clinical: {
        body: 'New or recurrent symptoms need clinical review; persistent swelling after DVT does not by itself distinguish recurrence from post-thrombotic disease. Assessment considers the relevant venous pathway rather than assuming one normal-looking reference segment excludes disease.',
        bullets: [
          'The atlas supplies neither venous compressibility nor a Doppler waveform.',
          'No anticoagulant change, compression prescription, treatment duration or procedural pathway is supplied.',
        ],
      },
      references: [
        'https://www.nhlbi.nih.gov/health/venous-thromboembolism/recovery',
        'https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/',
      ],
    },
    {
      key: 'internal-iliac-veins',
      identities: [
        [
          'FMA18887',
          'right',
          'isa',
          ['FJ3570', 'FJ3571', 'FJ3572', 'FJ3607', 'FJ3608', 'FJ3609'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
        [
          'FMA18888',
          'left',
          'isa',
          ['FJ3469', 'FJ3470', 'FJ3471'],
          'pelvis',
          ['pelvis', 'abdomen', 'thigh'],
          'vessel',
        ],
      ],
      scope:
        'Six right and three left source components under separate internal iliac vein identities. Not a complete pelvic plexus, nine named tributaries, mirrored sides or a female pelvic venous model.',
      pathology: {
        body: 'Pelvic venous injury can contribute to major traumatic bleeding. Venous reflux and outflow obstruction are different mechanisms considered in pelvic venous disorders; the presence of several blue components does not show reflux, varices or the cause of pelvic pain.',
        bullets: [
          'A pelvic pain complaint has multiple possible causes and is not diagnosed by vessel prominence.',
          'Evidence from female pelvic venous cohorts does not validate this adult-male reference or its missing organ-specific plexuses.',
        ],
      },
      clinical: {
        body: 'Major pelvic trauma needs emergency assessment. Persistent pelvic symptoms require an appropriate clinical evaluation rather than assignment to a visible vein; neither explode view nor component count measures venous pressure or drainage.',
        bullets: [
          'Arterial and venous bleeding sources may coexist; selecting an arterial trunk does not account for the whole injury.',
          'No embolisation route, reflux manoeuvre, pelvic pressure estimate or treatment decision is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC5241998/',
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC11332375/',
      ],
    },
  ];
const byFma = new Map(
  pelvicVesselClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
export function pelvicVesselClinicalLesson(
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
