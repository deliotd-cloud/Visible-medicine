import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
type HeadNeckVesselClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'vessel',
];
interface HeadNeckVesselClinicalGroup {
  key: string;
  identities: readonly HeadNeckVesselClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original factual teaching bound to exact represented source identities; no publisher assets imported.
export const headNeckVesselClinicalGroups: readonly HeadNeckVesselClinicalGroup[] =
  [
    {
      key: 'common-carotid-arteries',
      identities: [
        [
          'FMA3941',
          'right',
          'isa',
          ['FJ3564'],
          'head-neck',
          ['head-neck', 'thorax'],
          'vessel',
        ],
        [
          'FMA4058',
          'left',
          'isa',
          ['FJ3483'],
          'head-neck',
          ['head-neck', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Separate common carotid trunks with different usual origins. Head-neck/thorax navigation remains; no carotid bulb plaque, intima-media measurement or certified bifurcation level.',
      pathology: {
        body: "Carotid atherosclerosis can narrow the arterial pathway or contribute embolic material to downstream brain arteries. These are different mechanisms of reduced cerebral blood supply. A common carotid selection is not a map of a patient's plaque or the cause of every stroke.",
        bullets: [
          'The common trunk and internal/external carotid divisions must not be treated as interchangeable labels.',
          'Thrombosis at one site and embolism from elsewhere require different clinical explanations.',
        ],
      },
      clinical: {
        body: 'New facial weakness, arm weakness or speech difficulty requires emergency assessment; in the UK call 999. Symptoms that resolve still need urgent assessment. Clinical carotid ultrasound assesses vessel walls and flow; this surface model does not.',
        bullets: [
          'A normal-looking common trunk does not exclude distal disease or another stroke mechanism.',
          'No stenosis percentage, Doppler cut-off, surgery indication or plaque-risk score is supplied.',
        ],
      },
      references: [
        'https://www.nhlbi.nih.gov/health/stroke/causes',
        'https://www.nhs.uk/conditions/stroke/symptoms/',
        'https://www.nhs.uk/conditions/transient-ischaemic-attack-tia/',
        'https://www.nhlbi.nih.gov/health/heart-tests',
      ],
    },
    {
      key: 'internal-carotid-arteries',
      identities: [
        [
          'FMA3949',
          'right',
          'isa',
          ['FJ1682'],
          'head-neck',
          ['head-neck', 'thorax'],
          'vessel',
        ],
        [
          'FMA4062',
          'left',
          'isa',
          ['FJ1682M'],
          'head-neck',
          ['head-neck', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Independent right/left internal carotid sources; the left FJ1682M file is explicitly present in the official index. No segmented vessel wall, dissection flap, true/false lumen or validated angiographic segment boundaries.',
      pathology: {
        body: 'Cervical internal carotid dissection involves injury within the arterial wall and may lead to narrowing, clot formation or cerebral ischaemia. It can occur without major trauma. Head or neck pain alone is nonspecific and cannot diagnose a dissection.',
        bullets: [
          'A dissection is not the same as atherosclerotic plaque or a normal vessel bend.',
          'The viewer does not show the wall changes needed to characterise a suspected lesion.',
        ],
      },
      clinical: {
        body: "Sudden focal neurological symptoms need emergency care, including when associated with new head or neck pain. Assessment of suspected dissection uses clinical findings and appropriate vascular imaging, not a comparison with the atlas's apparent curvature.",
        bullets: [
          'No neck manipulation, provocative rotation test or symptom-based self-diagnosis is suggested.',
          'No antithrombotic regimen, imaging threshold, thrombolysis eligibility or endovascular route is supplied.',
        ],
      },
      references: [
        'https://www.ahajournals.org/doi/epdf/10.1161/STR.0000000000000457',
        'https://www.nhs.uk/conditions/stroke/symptoms/',
      ],
    },
    {
      key: 'vertebral-arteries',
      identities: [
        [
          'FMA3958',
          'right',
          'isa',
          ['FJ1725'],
          'head-neck',
          ['head-neck', 'thorax'],
          'vessel',
        ],
        [
          'FMA4066',
          'left',
          'isa',
          ['FJ1725M'],
          'head-neck',
          ['head-neck', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Separate right/left sources, including official left FJ1725M. No validated V1–V4 segmentation, dominance, transverse-foramen clearance, complete intracranial branches or dynamic flow study.',
      pathology: {
        body: 'Vertebral artery dissection is another potential cause of ischaemia in the posterior circulation. Arterial wall injury and the resulting effect on blood supply cannot be inferred from asymmetry or a narrow-looking segment in a reference model.',
        bullets: [
          'Different right/left calibre or course does not by itself establish disease or arterial dominance.',
          'Clinical symptoms are not a reliable way to identify one displayed vertebral segment.',
        ],
      },
      clinical: {
        body: 'Stroke can include sudden visual disturbance, dizziness or loss of balance as well as weakness and speech changes. New sudden neurological symptoms require emergency assessment; the absence of a familiar facial or arm sign does not establish safety.',
        bullets: [
          'Dizziness alone has many possible causes; this lesson is not a stroke-screening test.',
          'No neck-rotation manoeuvre, safe manipulation angle, vessel-occlusion test or reperfusion plan is supplied.',
        ],
      },
      references: [
        'https://www.ahajournals.org/doi/epdf/10.1161/STR.0000000000000457',
        'https://www.nhs.uk/conditions/stroke/symptoms/',
      ],
    },
    {
      key: 'internal-jugular-veins',
      identities: [
        [
          'FMA4754',
          'right',
          'isa',
          ['FJ3585'],
          'head-neck',
          ['head-neck', 'thorax'],
          'vessel',
        ],
        [
          'FMA4762',
          'left',
          'isa',
          ['FJ3485'],
          'head-neck',
          ['head-neck', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'Independent internal jugular veins, not external jugulars or a complete dural sinus system. No valves, clot, pressure waveform, compressibility or safe cannulation corridor is represented.',
      pathology: {
        body: 'Internal jugular thrombosis can obstruct venous drainage; infection-associated thrombosis is one recognised clinical context. This is different from jugular distension related to raised venous pressure. A prominent blue surface cannot distinguish either process.',
        bullets: [
          'Lemierre syndrome is a clinical infection/thrombosis syndrome, not a diagnosis from an isolated vein outline.',
          'The reference does not measure intracranial pressure or prove a normal route into the chest.',
        ],
      },
      clinical: {
        body: 'New painful neck swelling or swelling with fever warrants prompt medical assessment. Significant breathing difficulty or collapse needs emergency help. Examination and appropriate imaging distinguish clot, infection, pressure-related distension and other causes.',
        bullets: [
          'Jugular venous assessment is a clinical examination, not a ruler measurement on the atlas.',
          'No needle trajectory, central-line technique, antibiotic regimen, filter route or anticoagulant dose is supplied.',
        ],
      },
      references: [
        'https://my.clevelandclinic.org/health/body/23148-jugular-vein',
        'https://my.clevelandclinic.org/health/symptoms/23149-jugular-vein-distention',
      ],
    },
    {
      key: 'basilar-artery',
      identities: [
        [
          'FMA50542',
          'midline',
          'isa',
          ['FJ1672', 'FJ1844'],
          'head-neck',
          ['head-neck'],
          'vessel',
        ],
      ],
      scope:
        'One midline basilar identity with two ordered official ISA components, not paired arteries. No perforator territories, occluding clot, patent vertebral confluence or measured brainstem perfusion.',
      pathology: {
        body: 'Basilar artery occlusion is a serious posterior-circulation stroke mechanism that can threaten brainstem function. Its effects depend on the lesion and circulation involved; the two source components do not represent two independent supply routes.',
        bullets: [
          'A displayed basilar trunk does not establish functioning perforators or viable brain tissue.',
          'This surface cannot distinguish occlusion from low flow or predict disability.',
        ],
      },
      clinical: {
        body: 'Suspected posterior-circulation stroke requires emergency assessment, including sudden severe neurological change or reduced consciousness. A clinical stroke team evaluates the patient and relevant imaging; the atlas cannot select treatment or establish eligibility.',
        bullets: [
          'The guideline concerns actual acute basilar occlusion, not a finding established by this model.',
          'No time window, severity cut-off, thrombectomy route, drug regimen or outcome prediction is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/39043395/',
        'https://www.nhs.uk/conditions/stroke/symptoms/',
      ],
    },
    {
      key: 'anterior-communicating-artery',
      identities: [
        [
          'FMA50169',
          'midline',
          'isa',
          ['FJ1655'],
          'head-neck',
          ['head-neck'],
          'vessel',
        ],
      ],
      scope:
        'One midline connecting-artery source, not the paired anterior cerebral arteries. No aneurysm sac, perforator tree, A1 dominance, wall layers or measured cross-flow.',
      pathology: {
        body: 'The anterior communicating complex is an important location in cerebral aneurysm assessment. An aneurysm is a pathological arterial enlargement, not the normal connecting artery itself; rupture can cause bleeding around the brain.',
        bullets: [
          'A short connecting surface is not an aneurysm neck or a safe clipping landmark.',
          'Observational morphology studies do not turn this reference shape into a rupture-risk calculator.',
        ],
      },
      clinical: {
        body: 'A sudden exceptionally severe headache, especially with collapse or other neurological symptoms, needs immediate emergency help. Appropriate investigation determines whether there is haemorrhage or an aneurysm; the reference model cannot exclude either.',
        bullets: [
          'Aneurysm location, patient factors and clinical imaging matter together.',
          'No size threshold, clipping or coiling route, collateral guarantee or treatment recommendation is supplied.',
        ],
      },
      references: [
        'https://www.ninds.nih.gov/health-information/disorders/cerebral-aneurysms',
        'https://pubmed.ncbi.nlm.nih.gov/33637879/',
      ],
    },
    {
      key: 'anterior-cerebral-arteries',
      identities: [
        [
          'FMA50029',
          'right',
          'isa',
          ['FJ1654'],
          'head-neck',
          ['head-neck'],
          'vessel',
        ],
        [
          'FMA50030',
          'left',
          'isa',
          ['FJ1654M'],
          'head-neck',
          ['head-neck'],
          'vessel',
        ],
      ],
      scope:
        'Right/left ACA source selections with official FJ1654/FJ1654M. No separately validated A1/A2 branches, motor homunculus, deep perforators or infarct boundaries.',
      pathology: {
        body: 'Anterior cerebral territory infarction may produce weakness on the opposite side, sometimes greater in the leg than the arm. The clinical pattern depends on the affected tissue; it is not an inevitable result of any change to the named artery.',
        bullets: [
          'A clinical series supports a possible localisation pattern, not a complete diagnostic rule.',
          'Do not map one source component to a guaranteed cortical territory.',
        ],
      },
      clinical: {
        body: 'Sudden leg weakness can be a stroke presentation even without a typical facial deficit and needs emergency assessment. Clinical examination and brain/vascular imaging establish the lesion; the atlas cannot determine the cause from weakness alone.',
        bullets: [
          'Other neurological and nonvascular causes remain possible.',
          'No stroke-severity score, perfusion estimate, treatment eligibility or rehabilitation prescription is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/17895117/',
        'https://www.nhs.uk/conditions/stroke/symptoms/',
      ],
    },
    {
      key: 'posterior-cerebral-arteries',
      identities: [
        [
          'FMA50584',
          'right',
          'partof',
          [
            'FJ1661',
            'FJ1675',
            'FJ1677',
            'FJ1678',
            'FJ1680',
            'FJ1687',
            'FJ1691',
            'FJ1720',
            'FJ1727',
          ],
          'head-neck',
          ['head-neck'],
          'vessel',
        ],
        [
          'FMA50585',
          'left',
          'partof',
          [
            'FJ1661M',
            'FJ1675M',
            'FJ1677M',
            'FJ1678M',
            'FJ1680M',
            'FJ1687M',
            'FJ1691M',
            'FJ1720M',
            'FJ1727M',
          ],
          'head-neck',
          ['head-neck'],
          'vessel',
        ],
      ],
      scope:
        'Each PCA selection is nine ordered PART-OF files, not nine adjudicated branches. All left M filenames occur in the official index; no P1/P2 assignment, fetal-type variant or exclusive territory is inferred.',
      pathology: {
        body: 'Posterior cerebral artery territory infarction may affect vision, including loss of the same side of the visual field in both eyes. Other deficits can occur because posterior cerebral territories include more than visual cortex; a vessel label cannot predict the full syndrome.',
        bullets: [
          'Visual-field loss is not necessarily blindness in one eye.',
          'The grouped surface does not establish which cortical or deep branch is involved.',
        ],
      },
      clinical: {
        body: 'New sudden visual loss or a visual-field change needs urgent emergency assessment, particularly with other neurological symptoms. Clinical visual-field examination and imaging are needed; rotating this nine-component selection is not a visual-field or perfusion test.',
        bullets: [
          'Do not assume macular sparing, intact memory or a specific deficit from this reference geometry.',
          'No infarct map, automated scan diagnosis, branch-specific clot target or prognosis is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/10773642/',
        'https://www.nhs.uk/conditions/stroke/symptoms/',
      ],
    },
    {
      key: 'posterior-communicating-arteries',
      identities: [
        [
          'FMA50085',
          'right',
          'isa',
          ['FJ1713'],
          'head-neck',
          ['head-neck'],
          'vessel',
        ],
        [
          'FMA50086',
          'left',
          'isa',
          ['FJ1713M'],
          'head-neck',
          ['head-neck'],
          'vessel',
        ],
      ],
      scope:
        'Independent posterior communicating arteries with official FJ1713/FJ1713M. They are not the PCAs; no complete circle of Willis, measured collateral flow, aneurysm or oculomotor-nerve clearance.',
      pathology: {
        body: 'An aneurysm near the internal carotid–posterior communicating junction can affect the third cranial nerve. New double vision, eyelid droop or pupil change can be important, but not every third-nerve palsy is aneurysmal and pupil sparing alone cannot exclude an aneurysm.',
        bullets: [
          'The cited pupil-sparing report demonstrates possibility, not frequency.',
          'A nearby nerve surface is not evidence of compression or a measured safe distance.',
        ],
      },
      clinical: {
        body: 'New third-nerve-type eye symptoms need urgent clinical assessment; severe sudden headache, neurological change or collapse needs emergency help. Specialist examination and appropriate vascular imaging evaluate the cause; a normal atlas view is not reassurance.',
        bullets: [
          'Imaging quality and interpretation matter; the cited clinical series is not a guarantee that any scan excludes an aneurysm.',
          'No pupil-based rule-out test, clipping route, aneurysm threshold or treatment protocol is supplied.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/21150642/',
        'https://pubmed.ncbi.nlm.nih.gov/1327612/',
        'https://www.ninds.nih.gov/health-information/disorders/cerebral-aneurysms',
      ],
    },
  ];
const byFma = new Map(
  headNeckVesselClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
export function headNeckVesselClinicalLesson(
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
