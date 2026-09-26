import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
type LowerLimbVesselClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'vessel',
];
interface LowerLimbVesselClinicalGroup {
  key: string;
  identities: readonly LowerLimbVesselClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original factual teaching bound to exact represented source identities; no publisher assets imported.
export const lowerLimbVesselClinicalGroups: readonly LowerLimbVesselClinicalGroup[] =
  [
    {
      key: 'femoral-arteries',
      scope:
        'Right and left femoral arterial source surfaces only; no plaque, lumen narrowing, access site or measured distal perfusion is represented.',
      pathology: {
        body: 'Peripheral arterial disease can reduce blood supply to the leg. Exertional muscle pain that settles with rest is a typical presentation, while persistent rest pain or a non-healing wound raises concern for more severe disease.',
        bullets: [
          'Symptoms do not identify a femoral lesion without vascular assessment.',
          'This artery is not the adjacent femoral vein; arterial insufficiency and venous thrombosis are different processes.',
        ],
      },
      clinical: {
        body: 'Use this selection to follow thigh inflow towards the popliteal artery. A suddenly painful, cold, pale, numb or weak limb needs emergency assessment for possible acute limb ischaemia.',
        bullets: [
          'The model cannot determine pulse strength, arterial pressure or whether a vessel is open.',
          'No groin puncture landmark, compression clearance or revascularisation plan is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/peripheral-arterial-disease-pad/',
        'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
      ],
      identities: [
        [
          'FMA70249',
          'right',
          'isa',
          ['FJ2143'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'vessel',
        ],
        [
          'FMA70250',
          'left',
          'isa',
          ['FJ2074'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'vessel',
        ],
      ],
    },
    {
      key: 'deep-femoral-arteries',
      scope:
        'Each profunda femoris selection retains two ordered PART-OF components; they are not assigned new perforator/circumflex names, a pseudoaneurysm or a validated operative relationship.',
      pathology: {
        body: 'Deep femoral branch pseudoaneurysms have been reported after hip-fracture surgery. A contained arterial leak can produce thigh pain, swelling and bruising, sometimes after the initial operation.',
        bullets: [
          'The cited small case series illustrates a possible complication, not its incidence.',
          'Proximity to fracture fragments or fixation does not establish the cause in an individual patient.',
        ],
      },
      clinical: {
        body: 'New or increasing thigh swelling after hip trauma or surgery warrants clinical reassessment. The reported cases used vascular imaging to identify the injured branch; a labelled mesh cannot establish a bleeding source.',
        bullets: [
          'Keep the profunda source separate from the continuing femoral artery.',
          'No drill trajectory, embolisation technique or presumed safe distance from hardware is provided.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/29419700/'],
      identities: [
        [
          'FMA20796',
          'right',
          'partof',
          ['FJ2137', 'FJ2158'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'vessel',
        ],
        [
          'FMA20797',
          'left',
          'partof',
          ['FJ2069', 'FJ2078'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'vessel',
        ],
      ],
    },
    {
      key: 'femoral-veins',
      scope:
        'Femoral deep-vein identities only; no thrombus, compressibility, venous valve function or propagation into neighbouring segments is represented.',
      pathology: {
        body: "Thrombosis of the femoral vein is deep-vein thrombosis. The misleading historical term 'superficial femoral vein' does not make this a superficial vein or a minor form of phlebitis.",
        bullets: [
          'DVT can cause one-sided thigh or calf pain and swelling, but symptoms alone cannot confirm it.',
          'Clot can travel to the lungs and cause pulmonary embolism.',
        ],
      },
      clinical: {
        body: 'Suspected DVT needs urgent medical assessment. Leg pain or swelling accompanied by breathlessness or chest pain needs emergency help; in the UK, call 999.',
        bullets: [
          'Use femoral vein terminology clearly in teaching and handover.',
          'The atlas supplies neither a DVT exclusion test nor an anticoagulation decision.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/7563535/',
        'https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/',
      ],
      identities: [
        [
          'FMA21188',
          'right',
          'isa',
          ['FJ2144'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'vessel',
        ],
        [
          'FMA21189',
          'left',
          'isa',
          ['FJ2102'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'vessel',
        ],
      ],
    },
    {
      key: 'great-saphenous-veins',
      scope:
        'Separate superficial great saphenous identities, not a complete tributary/valve map or proof of reflux at the saphenofemoral junction.',
      pathology: {
        body: 'Valve failure in superficial leg veins can allow backward flow and contribute to varicose veins. Aching, heaviness, swelling and skin changes may accompany the visible enlarged veins.',
        bullets: [
          'A prominent vein is not automatically thrombosed or incompetent.',
          'Great saphenous disease is distinct from femoral deep-vein thrombosis.',
        ],
      },
      clinical: {
        body: 'Assess troublesome varicose symptoms clinically. Duplex ultrasound can establish which superficial pathways reflux and help a vascular service plan care; the appearance of this source surface cannot do that.',
        bullets: [
          'Bleeding from a varicose vein requires urgent medical attention.',
          'No ablation, vein-harvesting or compression prescription is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/varicose-veins/',
        'https://www.nice.org.uk/guidance/cg168/chapter/1-recommendations',
      ],
      identities: [
        [
          'FMA21379',
          'right',
          'isa',
          ['FJ2145'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'vessel',
        ],
        [
          'FMA21380',
          'left',
          'isa',
          ['FJ2103'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'vessel',
        ],
      ],
    },
    {
      key: 'popliteal-arteries',
      scope:
        'Source arteries behind the knees only; no aneurysm diameter, wall defect, thrombus or validated relation to a popliteal mass.',
      pathology: {
        body: "A popliteal artery aneurysm is an abnormal arterial enlargement behind the knee. Clotting can interrupt downstream circulation, and enlargement can affect neighbouring tissues; not every lump here is a Baker's cyst.",
        bullets: [
          'An aneurysm and a fluid-filled cyst are different lesions.',
          'The source artery is not a diagnostic depiction of either condition.',
        ],
      },
      clinical: {
        body: 'An unexplained lump behind the knee needs clinical assessment and appropriate imaging. Sudden pain with a cold, pale, numb or weak foot is an emergency rather than a routine cyst complaint.',
        bullets: [
          'A normal-looking model cannot exclude an aneurysm or distal obstruction.',
          'No screening interval, diameter threshold or repair technique is supplied.',
        ],
      },
      references: [
        'https://vascular.org/your-vascular-health/vascular-conditions/peripheral-aneurysm',
        'https://www.nhs.uk/conditions/bakers-cyst/',
        'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
        'https://pubmed.ncbi.nlm.nih.gov/34023430/',
      ],
      identities: [
        [
          'FMA77380',
          'right',
          'isa',
          ['FJ2170'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
        [
          'FMA77381',
          'left',
          'isa',
          ['FJ2086'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
      ],
    },
    {
      key: 'anterior-tibial-arteries',
      scope:
        'Anterior tibial source identities only; no ankle portal, injured wall, aneurysm sac or patient-specific relation to tendons is validated.',
      pathology: {
        body: 'A delayed anterior tibial artery pseudoaneurysm has been reported after ankle arthroscopy and ligament repair. Progressive ankle pain and swelling can therefore have a vascular cause after an apparently completed procedure.',
        bullets: [
          'A case report demonstrates possibility, not a general complication rate.',
          'Postoperative swelling has several causes; location alone does not diagnose an arterial leak.',
        ],
      },
      clinical: {
        body: 'Persistent or enlarging postoperative ankle swelling warrants reassessment. Vascular imaging established the lesion in the cited case; this selection explains the arterial route, not the imaging diagnosis.',
        bullets: [
          'A pulsatile swelling should not be treated as a simple cyst.',
          'No aspiration, injection treatment, arthroscopy portal or preferred intervention is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/36212756/'],
      identities: [
        [
          'FMA43896',
          'right',
          'isa',
          ['FJ2130'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
        [
          'FMA43897',
          'left',
          'isa',
          ['FJ2065'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
      ],
    },
    {
      key: 'posterior-tibial-arteries',
      scope:
        'Posterior tibial sources continue towards the plantar circulation; there are no measured pulses, pressure recordings, calcification or validated tarsal-tunnel clearances.',
      pathology: {
        body: "Disease in the leg's arterial inflow can affect foot tissue perfusion. In a person with diabetes, a normal or raised ankle-brachial pressure index does not by itself exclude peripheral arterial disease.",
        bullets: [
          'The posterior tibial surface supplies anatomy, not a pressure result.',
          'Pain or a non-healing wound requires assessment beyond matching its location to a vessel.',
        ],
      },
      clinical: {
        body: 'Foot circulation is assessed using the clinical history, examination and suitable vascular tests together. Use this artery to orient the transition from posterior leg to sole without assuming that a visible route is patent.',
        bullets: [
          'No single model landmark clears a patient for compression or rules out ischaemia.',
          'No pressure-measurement protocol, nerve-block route or treatment algorithm is supplied.',
        ],
      },
      references: [
        'https://www.nice.org.uk/guidance/cg147/chapter/Recommendations',
      ],
      identities: [
        [
          'FMA43898',
          'right',
          'isa',
          ['FJ2172'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
        [
          'FMA43899',
          'left',
          'isa',
          ['FJ2087'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
      ],
    },
    {
      key: 'popliteal-veins',
      scope:
        'Separate deep popliteal vein identities; no clot, venous compressibility, cyst or verified compression of the neurovascular bundle.',
      pathology: {
        body: "A popliteal vein clot is DVT. A ruptured Baker's cyst can also cause painful calf swelling, so an apparent cyst history does not safely distinguish the two conditions.",
        bullets: [
          'A cyst contains fluid; DVT affects a deep vein.',
          'Symptoms and this reference anatomy cannot establish which process is present.',
        ],
      },
      clinical: {
        body: 'New or suddenly worsening calf pain and swelling needs urgent assessment. Breathlessness or chest pain with leg symptoms needs emergency help; in the UK, call 999.',
        bullets: [
          'Do not use a calf-stretch manoeuvre or a normal-looking model to exclude DVT.',
          'No ultrasound compression protocol or drug recommendation is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/bakers-cyst/',
        'https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/',
      ],
      identities: [
        [
          'FMA44328',
          'right',
          'isa',
          ['FJ2171'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
        [
          'FMA44329',
          'left',
          'isa',
          ['FJ2117'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
      ],
    },
    {
      key: 'small-saphenous-veins',
      scope:
        'Small saphenous source selections only; no complete junction/valve network, measured reflux or validated sural-nerve separation.',
      pathology: {
        body: 'Superficial venous disease may involve the small saphenous pathway. Varicose symptoms do not establish the affected segment, and the adjacent sural nerve is relevant when interventions are considered.',
        bullets: [
          'An ultrasound study in healthy participants found variable nerve-to-vein relationships.',
          'That study is not a map of either displayed leg or a guaranteed safe separation.',
        ],
      },
      clinical: {
        body: 'Compare the small saphenous route with the deep popliteal vein, keeping superficial return distinct from DVT. Clinical duplex assessment addresses reflux; patient-specific anatomy matters for nearby nerves.',
        bullets: [
          'The atlas does not validate the termination pattern or an intervention level.',
          'No ablation length, harvesting corridor or nerve-protection distance is supplied.',
        ],
      },
      references: [
        'https://www.nice.org.uk/guidance/cg168/chapter/1-recommendations',
        'https://pubmed.ncbi.nlm.nih.gov/30328148/',
      ],
      identities: [
        [
          'FMA44334',
          'right',
          'isa',
          ['FJ2176'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
        [
          'FMA44335',
          'left',
          'isa',
          ['FJ2121'],
          'leg',
          ['leg', 'foot'],
          'vessel',
        ],
      ],
    },
    {
      key: 'dorsalis-pedis-arteries',
      scope:
        'Source-labelled dorsal foot arteries; no measured pulse, stenosis, skin perfusion or assigned variant of the anterior tibial-dorsalis pedis axis.',
      pathology: {
        body: 'Cadaver research describes variation in the anterior tibial-dorsalis pedis route, including alternative arterial contributions. An unexpected course is not itself arterial disease or proof of an absent vessel.',
        bullets: [
          'The study does not assign a variant to this source model.',
          'Vascular disease and normal variation must be assessed separately.',
        ],
      },
      clinical: {
        body: 'Use the dorsal artery to orient the top of the foot and compare it with plantar inflow. Clinical assessment of suspected arterial disease combines history, foot examination and suitable vascular tests.',
        bullets: [
          'Do not infer tissue viability or exclude disease from a labelled surface or one presumed pulse position.',
          'No arthroscopy portal, catheter route or safe incision depth is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/16517313/',
        'https://www.nice.org.uk/guidance/cg147/chapter/Recommendations',
      ],
      identities: [
        ['FMA43916', 'right', 'isa', ['FJ2055'], 'foot', ['foot'], 'vessel'],
        ['FMA43917', 'left', 'isa', ['FJ2073'], 'foot', ['foot'], 'vessel'],
      ],
    },
    {
      key: 'medial-plantar-arteries',
      scope:
        'Parent medial plantar arterial selections, distinct from the separately selected superficial branches; no individual cutaneous pedicles or flap territory is created.',
      pathology: {
        body: 'Heel tissue loss illustrates why blood supply and protective sensation both matter in reconstruction. A clinical series used medial plantar vessel-based instep tissue to address heel defects.',
        bullets: [
          'The artery carries blood; sensation depends on neural structures, not on the artery itself.',
          'A reported reconstructive option is not automatically suitable for every wound.',
        ],
      },
      clinical: {
        body: 'Compare medial plantar inflow with the neighbouring plantar routes. Reconstruction requires assessment of the wound, actual circulation and available tissue; a parent vessel label does not establish flap viability.',
        bullets: [
          'The cited series is clinical context, not a guaranteed outcome.',
          'No flap outline, nerve dissection, donor-site dimensions or harvesting instructions are supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/16432324/'],
      identities: [
        ['FMA43929', 'right', 'isa', ['FJ2164'], 'foot', ['foot'], 'vessel'],
        ['FMA43930', 'left', 'isa', ['FJ2082'], 'foot', ['foot'], 'vessel'],
      ],
    },
    {
      key: 'lateral-plantar-arteries',
      scope:
        'Lateral plantar sources only; no puncture tract, ruptured sac, wound contamination or validated depth from the sole.',
      pathology: {
        body: 'A lateral plantar artery pseudoaneurysm and subsequent rupture have been reported after a nail puncture to the sole. A small skin wound can therefore coexist with a deeper vascular injury.',
        bullets: [
          'A pseudoaneurysm is a contained arterial leak, not a normal plantar branch.',
          'The case does not establish that most plantar punctures injure this artery.',
        ],
      },
      clinical: {
        body: 'Persistent swelling, renewed bleeding or a pulsatile mass after a plantar wound warrants prompt clinical reassessment. The wound history and appropriate vascular evaluation matter more than matching a lump to this surface.',
        bullets: [
          'Do not assume that a healed entry wound excludes an underlying complication.',
          'No self-exploration, aspiration, injection or ligation recommendation is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/25192411/'],
      identities: [
        ['FMA43931', 'right', 'isa', ['FJ2159'], 'foot', ['foot'], 'vessel'],
        ['FMA43932', 'left', 'isa', ['FJ2079'], 'foot', ['foot'], 'vessel'],
      ],
    },
    {
      key: 'plantar-arterial-arches',
      scope:
        'Source plantar arch identities, not proof of a complete patent pedal circuit. Published angiographic categories are not automatically assigned to these mesh selections.',
      pathology: {
        body: 'In a retrospective cohort of diabetic patients with foot wounds after endovascular revascularisation, pedal arch status was associated with healing outcomes. This supports attention to the wider foot circulation, not only one named inflow artery.',
        bullets: [
          'Association in a selected treated cohort does not prove that changing the arch alone causes healing.',
          'A surface connection is not evidence of lumen patency or adequate tissue blood flow.',
        ],
      },
      clinical: {
        body: 'Use the plantar arch to relate dorsal and plantar arterial pathways. Wound assessment requires patient-specific perfusion and tissue information; neither arch colour nor visual continuity predicts whether a wound will heal.',
        bullets: [
          'No angiographic grade or prognosis is assigned to this atlas.',
          'No revascularisation target, amputation level or treatment sequence is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/29353999/'],
      identities: [
        ['FMA43943', 'right', 'isa', ['FJ2169'], 'foot', ['foot'], 'vessel'],
        ['FMA43944', 'left', 'isa', ['FJ2085'], 'foot', ['foot'], 'vessel'],
      ],
    },
    {
      key: 'deep-plantar-arteries',
      scope:
        'Deep plantar source branches remain separate from the plantar arch. Close mesh endpoints do not establish a validated anastomosis, measured depth or safe intermetatarsal corridor.',
      pathology: {
        body: 'The deep plantar artery links dorsal and plantar arterial pathways near the first intermetatarsal space. Cadaver studies describe its local relationships and variation in the relative contributions to the plantar arch.',
        bullets: [
          'A variable arterial contribution is anatomy, not proof of collateral sufficiency after injury.',
          'No study-specific dimensions or dominance pattern are assigned to this model.',
        ],
      },
      clinical: {
        body: 'Procedures around the proximal first intermetatarsal region may encounter this artery. Use its selection to understand why a dorsal intervention can affect a plantar connection, without treating the atlas as an operative map.',
        bullets: [
          'Actual vessel position and continuity need independent patient-specific assessment.',
          'No safe drilling angle, osteotomy margin or bypass-recipient recommendation is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/31549862/',
        'https://pubmed.ncbi.nlm.nih.gov/16015643/',
      ],
      identities: [
        ['FMA69514', 'right', 'isa', ['FJ2136'], 'foot', ['foot'], 'vessel'],
        ['FMA69515', 'left', 'isa', ['FJ2068'], 'foot', ['foot'], 'vessel'],
      ],
    },
    {
      key: 'superficial-medial-plantar-arteries',
      scope:
        'Source superficial medial plantar branch identities only; no newly numbered perforators, mapped skin territory or validated superficial depth.',
      pathology: {
        body: 'An anatomical study mapped the superficial branch of the medial plantar artery and its perforators in cadaver feet for reconstructive research. A parent branch and the individual skin perforators are not interchangeable anatomical selections.',
        bullets: [
          'Cadaver tissue distribution is not proof of a viable graft or flap in a patient.',
          'The displayed source does not contain newly validated perforator-level anatomy.',
        ],
      },
      clinical: {
        body: 'Compare this branch with its medial plantar parent while keeping claims about skin supply bounded by the source. Reconstructive use requires confirmation of the actual vessels and tissue requirements.',
        bullets: [
          "The study's dimensions and proposed harvesting landmarks are not reproduced.",
          'No finger-pulp replacement plan, flap size or donor-site safety guarantee is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/29575166/'],
      identities: [
        ['FMA43937', 'right', 'isa', ['FJ2179'], 'foot', ['foot'], 'vessel'],
        ['FMA43938', 'left', 'isa', ['FJ2089'], 'foot', ['foot'], 'vessel'],
      ],
    },
    {
      key: 'dorsal-foot-venous-arches',
      scope:
        'Each dorsal foot venous arch retains two ordered source components. No individual tributaries, full drainage circuit or venous aneurysm is newly identified.',
      pathology: {
        body: 'A venous aneurysm of the dorsal foot arch has been reported as a gradually enlarging swelling. A nonpulsatile lump on the top of the foot can therefore have a vascular origin rather than being a ganglion.',
        bullets: [
          'The reported association with repeated local pressure does not establish a universal cause.',
          'This venous lesion is different from an arterial pseudoaneurysm or deep-vein thrombosis.',
        ],
      },
      clinical: {
        body: 'An unexplained persistent foot lump needs clinical assessment. The cited case is a reminder to include superficial veins in the differential, not a way to diagnose a mass by appearance alone.',
        bullets: [
          'Neither the two-component grouping nor the arch label proves a dilated vein.',
          'No self-puncture, excision technique or claim that superficial venous swellings are always harmless is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/20237367/',
        'https://pubmed.ncbi.nlm.nih.gov/11266485/',
      ],
      identities: [
        [
          'FMA44881',
          'right',
          'isa',
          ['FJ2061', 'FJ2062'],
          'foot',
          ['foot'],
          'vessel',
        ],
        [
          'FMA44882',
          'left',
          'isa',
          ['FJ2059', 'FJ2060'],
          'foot',
          ['foot'],
          'vessel',
        ],
      ],
    },
  ];

const byFma = new Map(
  lowerLimbVesselClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
export function lowerLimbVesselClinicalLesson(
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
