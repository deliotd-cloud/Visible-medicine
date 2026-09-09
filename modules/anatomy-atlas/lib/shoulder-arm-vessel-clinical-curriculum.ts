import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
type ShoulderArmVesselClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'vessel',
];
interface ShoulderArmVesselClinicalGroup {
  key: string;
  identities: readonly ShoulderArmVesselClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original factual teaching bound to exact represented source identities; no publisher assets imported.
export const shoulderArmVesselClinicalGroups: readonly ShoulderArmVesselClinicalGroup[] =
  [
    {
      key: 'axillary-arteries',
      identities: [
        [
          'FMA22655',
          'right',
          'isa',
          ['FJ2268'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
        [
          'FMA22656',
          'left',
          'isa',
          ['FJ2216'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        'Separate axillary trunks; no intimal tear, wall layers, perfused lumen or patient-specific plexus clearance. The usual three parts are not separately segmented.',
      pathology: {
        body: 'Shoulder dislocation can be accompanied by axillary artery injury, including rupture and bleeding into the axilla. Vascular symptoms may appear immediately or later. The cited case establishes a possible complication, not how often it occurs.',
        bullets: [
          'Arterial injury is distinct from an axillary nerve injury, although both may require assessment.',
          'An enlarging haematoma is not represented by the normal arterial surface.',
        ],
      },
      clinical: {
        body: 'After shoulder trauma, rapidly increasing swelling, collapse, or a newly cold, painful, numb or weak hand needs emergency assessment. In the UK call 999 for a suspected threatened limb or collapse; do not attempt shoulder reduction yourself.',
        bullets: [
          'Clinical circulation and nerve assessment cannot be replaced by this model.',
          'No reduction technique, imaging threshold or vascular repair plan is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/38127679/',
        'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
      ],
    },
    {
      key: 'brachial-arteries',
      identities: [
        [
          'FMA22691',
          'right',
          'isa',
          ['FJ2271'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
        [
          'FMA22692',
          'left',
          'isa',
          ['FJ2219'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        "Independent brachial arteries, not profunda brachii. This adult reference is not a child's supracondylar fracture or a validated elbow collateral circuit.",
      pathology: {
        body: 'A displaced supracondylar humerus fracture in a child can impair circulation and injure nerves near the elbow. This is why an apparently local elbow injury requires assessment of the hand as well as the fracture.',
        bullets: [
          'The risk concerns the injured patient, not a fixed vessel-to-bone distance in the atlas.',
          'Reduced arterial delivery and venous swelling are different mechanisms.',
        ],
      },
      clinical: {
        body: 'A clinician assesses hand colour, warmth, pulse and nerve function after an elbow injury. A cold or pale hand, new weakness or numbness, or marked worsening pain requires urgent emergency assessment; do not wait for every possible sign.',
        bullets: [
          'A visible artery does not demonstrate adequate distal perfusion.',
          'No paediatric fracture classification, pulse-based treatment algorithm or pin trajectory is simulated.',
        ],
      },
      references: [
        'https://www.orthoinfo.org/diseases--conditions/elbow-fractures-in-children',
        'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
      ],
    },
    {
      key: 'deep-brachial-arteries',
      identities: [
        [
          'FMA22696',
          'right',
          'isa',
          ['FJ2277'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
        [
          'FMA22697',
          'left',
          'isa',
          ['FJ2225'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        'Separate profunda brachii sources; no complete radial-groove neurovascular dissection, pseudoaneurysm neck or collateral branches are newly modelled.',
      pathology: {
        body: 'A profunda brachii pseudoaneurysm has been reported after humeral fracture fixation. A pseudoaneurysm is blood escaping through an arterial injury into a contained space, rather than enlargement of an intact arterial wall.',
        bullets: [
          'The cited child had delayed swelling despite a normal neurovascular examination.',
          'A case report illustrates possibility, not a complication rate or usual presentation.',
        ],
      },
      clinical: {
        body: 'New or enlarging arm swelling after injury or a procedure needs prompt assessment, even if it is not obviously pulsatile. A clinician may use vascular imaging to distinguish a pseudoaneurysm from other soft-tissue swellings.',
        bullets: [
          'No massage, aspiration or attempted drainage of a suspected vascular swelling is advised.',
          'The atlas does not establish the source of bleeding or an access route.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/34754522/'],
    },
    {
      key: 'anterior-circumflex-humeral-arteries',
      identities: [
        [
          'FMA22682',
          'right',
          'isa',
          ['FJ2264'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
        [
          'FMA22683',
          'left',
          'isa',
          ['FJ2212'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        'One anterior circumflex source per side; no ascending/arcuate branch segmentation, intraosseous vessels or bone-viability map.',
      pathology: {
        body: 'The anterior and posterior circumflex systems contribute to the blood supply of the humeral head. Disruption around a proximal humeral fracture can jeopardise that supply; no one displayed branch establishes whether a fragment will remain viable.',
        bullets: [
          'Cadaver studies describe variable arterial courses and contributions.',
          'Do not assign a fixed percentage of humeral-head perfusion to this anterior surface.',
        ],
      },
      clinical: {
        body: 'Blood supply is one consideration when assessing a proximal humeral fracture or planning shoulder surgery. The clinical question is preservation of tissue perfusion, not whether a reference vessel merely appears close to the fracture.',
        bullets: [
          'Anatomical studies are not outcome predictions for an individual fracture.',
          'No fixation choice, implant clearance or safe repair corridor is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/31891033/',
        'https://pubmed.ncbi.nlm.nih.gov/15999218/',
      ],
    },
    {
      key: 'posterior-circumflex-humeral-arteries',
      identities: [
        [
          'FMA22685',
          'right',
          'isa',
          ['FJ2291', 'FJ2292'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
        [
          'FMA22687',
          'left',
          'isa',
          ['FJ2239', 'FJ2240'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        'Two ordered official components per side remain one posterior circumflex identity; no new aneurysm, embolus or validated quadrangular-space compression model.',
      pathology: {
        body: 'Posterior circumflex humeral artery aneurysm has been described in overhead athletes, including volleyball players, and can be associated with impaired blood supply to the hand. This vascular problem is not synonymous with ordinary shoulder pain.',
        bullets: [
          'Athlete-cohort observations must not be used as population-wide prevalence.',
          "The source's two components are not an aneurysm and its outflow branch.",
        ],
      },
      clinical: {
        body: 'New coldness, colour change, pain or numbness in the fingers during sport warrants medical assessment; abrupt severe symptoms require emergency care. Clinical ultrasound can assess vessel anatomy and flow, which the static atlas cannot measure.',
        bullets: [
          'No provocative sporting manoeuvre or return-to-play decision is offered.',
          'No diameter cut-off, aneurysm screen or embolisation procedure is reproduced.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/11273979/',
        'https://pubmed.ncbi.nlm.nih.gov/27255398/',
        'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
      ],
    },
    {
      key: 'circumflex-scapular-arteries',
      identities: [
        [
          'FMA23180',
          'right',
          'isa',
          ['FJ2273'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
        [
          'FMA23181',
          'left',
          'isa',
          ['FJ2221'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        'Separate circumflex scapular sources. Cutaneous perforators, venous partners and patent connections with neighbouring territories are not comprehensively represented.',
      pathology: {
        body: 'Loss of blood delivery to transferred tissue is a concern in reconstructive surgery. Circumflex scapular vessels are relevant because their cutaneous branches underpin scapular-region flaps; a named arterial surface alone cannot predict tissue survival.',
        bullets: [
          'Injection studies show connections with neighbouring vascular territories.',
          'Those experimental territories are not transferable patient-specific flap boundaries.',
        ],
      },
      clinical: {
        body: 'Study this artery to understand why a reconstructive flap must retain an effective blood supply. Choosing a flap also requires assessment of the defect, donor tissues and actual vessels; rotating the atlas does not perform that assessment.',
        bullets: [
          'Triangular-space anatomy must not be confused with the posterior humeral circumflex route.',
          'No harvesting plane, safe flap dimensions or vascular anastomosis technique is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/19319054/'],
    },
    {
      key: 'thoracodorsal-arteries',
      identities: [
        [
          'FMA66321',
          'right',
          'isa',
          ['FJ2305'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
        [
          'FMA66322',
          'left',
          'isa',
          ['FJ2253'],
          'shoulder-arm',
          ['shoulder-arm'],
          'vessel',
        ],
      ],
      scope:
        'Thoracodorsal artery selections only; no complete muscular branches, perforator map, venous outflow or motor-nerve anatomy is newly supplied.',
      pathology: {
        body: 'Thoracodorsal blood supply is important to latissimus-based reconstruction. Injury to an arterial pedicle or its relevant perforators can compromise the intended tissue supply; preservation of the motor nerve addresses a different function.',
        bullets: [
          'A perforator carries blood through tissue; it is not a nerve branch.',
          "No arterial insufficiency or flap viability is diagnosed from the model's colour.",
        ],
      },
      clinical: {
        body: 'Thoracodorsal perforator-based tissue transfer illustrates how a vascular branch can support reconstruction while the transferred tissue composition varies. The cited early anatomical and clinical work is educational context, not a prescription for selecting a flap.',
        bullets: [
          'Actual branch anatomy and donor-site function require specialist assessment.',
          'No pedicle length, skin-paddle design, dissection instruction or success guarantee is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/8937603/'],
    },
    {
      key: 'thyrocervical-trunks',
      identities: [
        [
          'FMA3992',
          'right',
          'isa',
          ['FJ2307'],
          'shoulder-arm',
          ['shoulder-arm', 'head-neck', 'thorax'],
          'vessel',
        ],
        [
          'FMA4084',
          'left',
          'isa',
          ['FJ2255'],
          'shoulder-arm',
          ['shoulder-arm', 'head-neck', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Separate thyrocervical trunks with shoulder-arm/head-neck/thorax navigation; no complete neck branches, airway compression model or puncture corridor.',
      pathology: {
        body: 'Thyrocervical trunk injury can produce a pseudoaneurysm and bleeding at the root of the neck. Case reports describe delayed presentations and blood entering the pleural space; a small external wound does not define the depth of injury.',
        bullets: [
          'Pseudoaneurysm is a contained arterial leak, not a normal branch junction.',
          'Rare reports do not establish a screening schedule or universal mechanism.',
        ],
      },
      clinical: {
        body: 'Expanding neck swelling, breathing difficulty or collapse after neck trauma or a procedure needs emergency help. Clinical examination and appropriate imaging locate the injury; the apparent space between reference structures is not proof of safety.',
        bullets: [
          'This lesson does not identify the injured branch in a particular patient.',
          'No central-line technique, compression manoeuvre or embolisation route is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/32146480/'],
    },
    {
      key: 'costocervical-trunks',
      identities: [
        [
          'FMA5039',
          'right',
          'isa',
          ['FJ2276'],
          'shoulder-arm',
          ['shoulder-arm', 'head-neck', 'thorax'],
          'vessel',
        ],
        [
          'FMA4086',
          'left',
          'isa',
          ['FJ2224'],
          'shoulder-arm',
          ['shoulder-arm', 'head-neck', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Independent costocervical trunks with original cross-region membership. Deep cervical and superior intercostal branches are not reconstructed by this selection.',
      pathology: {
        body: 'Costocervical arterial bleeding can involve both the neck and chest. A published neurofibromatosis type 1 case described aneurysmal rupture with cervical haematoma and haemothorax; this is a rare illustrative report, not a general prediction for people with NF1.',
        bullets: [
          'Blood in the pleural space is different from a normal vessel lying near the pleura.',
          'A single case cannot establish rupture frequency or screening policy.',
        ],
      },
      clinical: {
        body: 'Rapid neck swelling or breathing difficulty is an emergency, especially after trauma or with signs of bleeding. The lesson explains why symptoms can cross the neck–chest boundary; it cannot establish the responsible artery.',
        bullets: [
          'No disease-specific surveillance programme or airway procedure is supplied.',
          'The model does not show wall fragility, rupture risk or a safe embolisation target.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC3921660/'],
    },
    {
      key: 'dorsal-scapular-arteries',
      identities: [
        [
          'FMA4057',
          'right',
          'isa',
          ['FJ2284'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
        [
          'FMA10552',
          'left',
          'isa',
          ['FJ2232'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Separate dorsal scapular vessels with shoulder-arm/thorax navigation; no haematoma, dynamic compression, complete collateral network or validated arterial origin variant.',
      pathology: {
        body: 'A dorsal scapular artery pseudoaneurysm has been reported after blunt chest trauma, with delayed recognition of a large chest-wall haematoma. Pain near a fracture can therefore coexist with a separate vascular complication.',
        bullets: [
          'The case supports reassessment of evolving symptoms, not a diagnosis from bruising alone.',
          'It does not establish that a particular rib or clavicular injury always damages this artery.',
        ],
      },
      clinical: {
        body: 'Progressively enlarging swelling or worsening symptoms after chest or shoulder trauma warrants prompt reassessment. Collapse, severe breathlessness or rapidly expanding swelling needs emergency help; the atlas cannot rule out ongoing bleeding.',
        bullets: [
          "The displayed artery is not a map of the patient's injured vessel.",
          'No aspiration, embolisation method, operative exposure or safe interval is supplied.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/34504933/'],
    },
    {
      key: 'suprascapular-arteries',
      identities: [
        [
          'FMA10698',
          'right',
          'isa',
          ['FJ2303'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
        [
          'FMA10681',
          'left',
          'isa',
          ['FJ2251'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Right/left suprascapular arteries; the source does not certify their exact relationship to the superior transverse scapular ligament or a safe nerve-block path.',
      pathology: {
        body: 'Suprascapular artery position at the notch varies relative to the ligament, vein and nerve. A vessel beneath the ligament is an anatomical variant, not automatically a diagnosis of nerve entrapment.',
        bullets: [
          'Cadaveric arrangements explain possible crowding; they do not prove symptomatic compression.',
          'No pathological narrowing or nerve injury is added to the reference.',
        ],
      },
      clinical: {
        body: 'Persistent shoulder weakness or pain needs clinical evaluation. Notch anatomy may matter during specialist assessment and intervention, but symptoms alone cannot establish an arterial variant.',
        bullets: [
          "Neither the mnemonic nor this mesh proves where a patient's artery runs.",
          'No needle angle, decompression route or clearance measurement is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4555201/'],
    },
    {
      key: 'axillary-veins',
      identities: [
        [
          'FMA13330',
          'right',
          'isa',
          ['FJ2269'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
        [
          'FMA13331',
          'left',
          'isa',
          ['FJ2217'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Independent axillary veins; no compressibility, thrombus, valves, catheter or complete axillo-subclavian lumen is modelled.',
      pathology: {
        body: 'Axillary-vein thrombosis is a form of upper-limb deep vein thrombosis. Venous thoracic outlet compression can be associated with axillo-subclavian thrombosis, while neurological and arterial thoracic outlet syndromes involve different structures.',
        bullets: [
          'Impaired venous drainage can cause swelling and heaviness rather than isolated arterial coldness.',
          'A blue surface is not a test for clot, obstruction or valve function.',
        ],
      },
      clinical: {
        body: 'New unexplained arm pain and swelling warrants urgent assessment for DVT and other causes. In the UK contact urgent care or NHS 111; associated chest pain or breathlessness needs 999 because pulmonary embolism is possible.',
        bullets: [
          'Assessment may include clinical vascular ultrasound, not a colour comparison with the atlas.',
          'No anticoagulant dose, catheter access, thrombolysis or decompression plan is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/',
        'https://my.clevelandclinic.org/health/diseases/17553-thoracic-outlet-syndrome-tos',
      ],
    },
    {
      key: 'suprascapular-veins',
      identities: [
        [
          'FMA50859',
          'right',
          'isa',
          ['FJ2302'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
        [
          'FMA50860',
          'left',
          'isa',
          ['FJ2250'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Separate suprascapular veins, not the similarly named artery. No venous valves, flow, thrombosis or complete drainage confluence is shown.',
      pathology: {
        body: 'The suprascapular vein can pass above or below the superior transverse scapular ligament. Its position contributes to the structures occupying the notch; variation alone does not establish venous disease or explain shoulder pain.',
        bullets: [
          'Artery and vein cannot be assigned the same route by name alone.',
          'An anatomical relationship is not a measured entrapment syndrome.',
        ],
      },
      clinical: {
        body: "Recognition of the vein matters when interpreting notch anatomy and avoiding confusion with the artery. The reference cannot determine a patient's vessel positions or whether a symptom is vascular.",
        bullets: [
          'No safe injection corridor, drainage intervention or Doppler criterion is supplied.',
          'The cadaver study is anatomical evidence, not an outcome predictor.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4555201/'],
    },
    {
      key: 'thoracoacromial-trunks',
      identities: [
        [
          'FMA66563',
          'right',
          'isa',
          ['FJ2304'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
        [
          'FMA66564',
          'left',
          'isa',
          ['FJ2252'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Trunk identities remain separate from pectoral, acromial and deltoid branches. No missing clavicular branch or complete four-branch tree is inferred.',
      pathology: {
        body: "Thoracoacromial branching variation is not itself a disease. It matters in reconstruction because an assumed common origin or textbook branch pattern may not match the patient's vessels; damage to a feeding branch can affect the tissue it serves.",
        bullets: [
          'An imaging study found multiple branching patterns rather than one universal arrangement.',
          "The study's selected sample is not population-wide prevalence.",
        ],
      },
      clinical: {
        body: 'Use this trunk to orient the named branches before studying a reconstructive pedicle. Actual vascular anatomy, the planned tissue transfer and clinical imaging determine the operative plan, not reference distances.',
        bullets: [
          'No branch must be present merely because a textbook diagram includes it.',
          'No flap eligibility, territory boundary or harvesting procedure is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC9649491/'],
    },
    {
      key: 'pectoral-thoracoacromial-branches',
      identities: [
        [
          'FMA23063',
          'right',
          'isa',
          ['FJ2361'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
        [
          'FMA23064',
          'left',
          'isa',
          ['FJ2330'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Separate named pectoral branches, not the parent trunk or pectoral nerves. No intramuscular perfusion, skin paddle or venous pedicle is represented.',
      pathology: {
        body: 'The pectoral branch is relevant to the blood supply of a pectoralis major flap. Disruption of the intended feeding vessels can threaten transferred tissue; muscle blood supply must not be equated with a guaranteed supply to every overlying skin area.',
        bullets: [
          'Cadaveric work describes differing pectoral branch origins and courses.',
          'The branch is a vessel, not the motor innervation of pectoralis major.',
        ],
      },
      clinical: {
        body: "Pectoralis-based reconstruction illustrates why both a vessel's origin and its course through or under muscle matter. Those details must be established in the patient; a surface selection does not plan a safe transposition.",
        bullets: [
          'No measured landmark rule or skin-paddle dimensions are copied into the viewer.',
          'There is no validated flap survival model or reconstructive treatment recommendation.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/15290107/',
        'https://pubmed.ncbi.nlm.nih.gov/24115845/',
      ],
    },
    {
      key: 'acromial-thoracoacromial-branches',
      identities: [
        [
          'FMA23068',
          'right',
          'isa',
          ['FJ2263'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
        [
          'FMA23069',
          'left',
          'isa',
          ['FJ2211'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Named acromial branches retain their original IDs; not the acromial nerve or every artery near the acromion. No dynamic subcoracoid clearance is certified.',
      pathology: {
        body: 'The acromial arterial branch lies in anatomy relevant to work around the coracoid and shoulder. Potential vascular injury is a different concern from tendon impingement; a small-looking interval in the atlas cannot diagnose either.',
        bullets: [
          'Cadaveric subcoracoid measurements are observations, not universal safe distances.',
          "The acromial branch's origin can vary; it is not necessarily an independent trunk branch in every person.",
        ],
      },
      clinical: {
        body: "Anatomical studies help explain why the coracoid region requires attention to both nerves and vessels. Patient-specific anatomy and the intended procedure must guide assessment; the atlas's exploded spacing is for learning only.",
        bullets: [
          'No portal placement, drill depth, needle path or surgical clearance is supplied.',
          'No presumed anastomosis or exclusive acromial perfusion territory is added.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/17072446/',
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC9649491/',
      ],
    },
    {
      key: 'deltoid-thoracoacromial-branches',
      identities: [
        [
          'FMA23072',
          'right',
          'isa',
          ['FJ2282'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
        [
          'FMA23073',
          'left',
          'isa',
          ['FJ2230'],
          'shoulder-arm',
          ['shoulder-arm', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        "Deltoid arterial branches only, not the deltoid muscle's complete circulation or axillary nerve. No perforator course or skin territory is newly segmented.",
      pathology: {
        body: 'Deltoid-branch perforators have been investigated for thoracoacromial-based tissue transfer. This shows reconstructive relevance, but does not mean the named branch alone maintains all deltoid muscle or overlying skin viability.',
        bullets: [
          'Arterial insufficiency and denervation are different causes of tissue dysfunction.',
          "Cadaver perforator findings do not establish the patency or suitability of a patient's vessels.",
        ],
      },
      clinical: {
        body: 'Study the distinction between a named parent branch and the smaller perforators that reach transferable tissue. The source selection supplies orientation, not a complete clinical perforator map.',
        bullets: [
          'No skin-paddle boundaries, donor-site morbidity prediction or harvest technique is supplied.',
          'Clinical mapping and specialist review are required before any reconstructive use.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/24115845/'],
    },
  ];
const byFma = new Map(
  shoulderArmVesselClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
export function shoulderArmVesselClinicalLesson(
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
