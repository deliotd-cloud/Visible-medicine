import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type PelvicOrganClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'organ',
];
interface PelvicOrganClinicalGroup {
  key: string;
  identities: readonly PelvicOrganClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const pelvicOrganClinicalGroups: readonly PelvicOrganClinicalGroup[] = [
  {
    key: 'bladder',
    identities: [
      [
        'FMA15900',
        'unpaired',
        'partof',
        ['FJ3149'],
        'pelvis',
        ['pelvis'],
        'organ',
      ],
    ],
    scope:
      'One urinary-bladder surface, not a measured bladder volume, validated mucosal layer or functional emptying study. This reference does not represent every sex, age or filling state.',
    pathology: {
      body: 'A bladder infection is a lower urinary tract infection, most often caused by bacteria. Infection can spread towards the kidneys; cystitis and kidney infection describe different anatomical levels.',
      bullets: [
        'Burning during urination, urgency and lower abdominal discomfort can occur, but symptoms alone do not identify the organism.',
        'A reference bladder surface does not demonstrate inflammation or confirm that urine is sterile.',
      ],
    },
    clinical: {
      body: 'Relate the bladder to the incoming ureters and outgoing urethra. Urinary symptoms need clinical assessment; accompanying fever, chills, vomiting or flank pain may suggest infection beyond the bladder and need prompt care.',
      bullets: [
        'Do not use a pelvic-only highlight to exclude upper urinary tract disease.',
        'No urine culture, antibiotic selection or patient-specific assessment is supplied by this model.',
      ],
    },
    references: [
      'https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-infection-uti-in-adults/symptoms-causes',
    ],
  },
  {
    key: 'prostate',
    identities: [
      [
        'FMA9600',
        'unpaired',
        'partof',
        ['FJ3139'],
        'pelvis',
        ['pelvis'],
        'organ',
      ],
    ],
    scope:
      'One adult-male reference prostate surface with unvalidated boundaries. Internal zones, tumour foci, urethral compression and disease-dependent gland size are not independently represented.',
    pathology: {
      body: 'Benign prostatic hyperplasia (BPH) is non-cancerous enlargement. It can narrow the passage through the prostate and interfere with bladder emptying. It is not synonymous with prostatitis or prostate cancer.',
      bullets: [
        'The severity of urinary symptoms does not reliably track prostate size.',
        'The fixed atlas shape cannot demonstrate BPH, exclude a coexisting tumour or establish cancer stage.',
      ],
    },
    clinical: {
      body: 'Hesitancy, a weak stream, frequency or incomplete emptying can occur with BPH, but other urinary conditions can cause similar symptoms. Assess the bladder outlet as well as the prostate rather than assigning every urinary symptom to gland enlargement.',
      bullets: [
        'Inability to pass urine requires urgent medical assessment.',
        'This lesson supplies no PSA interpretation, biopsy target, operation choice or treatment regimen.',
      ],
    },
    references: [
      'https://www.niddk.nih.gov/health-information/urologic-diseases/prostate-problems/enlarged-prostate-benign-prostatic-hyperplasia',
    ],
  },
  {
    key: 'testes',
    identities: [
      ['FMA7211', 'right', 'isa', ['FJ3142'], 'pelvis', ['pelvis'], 'organ'],
      ['FMA7212', 'left', 'isa', ['FJ3138'], 'pelvis', ['pelvis'], 'organ'],
    ],
    scope:
      'Each testis has its own indexed side and single reference surface. Pelvis is a browsing group, not a claim that the testis lies within the pelvic cavity. No perfusion, torsion, histology, fertility or paediatric geometry is simulated.',
    pathology: {
      body: 'Testicular torsion is twisting that can threaten the testis and requires rapid assessment. Infection, injury and hernia are other possible causes of scrotal pain.',
      bullets: [
        'An atlas highlight cannot distinguish torsion from inflammation.',
        'A persistent lump or swelling also needs medical assessment.',
      ],
    },
    clinical: {
      body: 'In the UK, sudden severe testicular pain requires immediate A&E assessment or a 999 call. Do not delay help to compare sides or inspect the model.',
      bullets: [
        'Selecting a normal reference testis does not exclude a real emergency.',
        'No manual untwisting manoeuvre, ultrasound clearance or operative plan is provided.',
      ],
    },
    references: ['https://www.nhs.uk/symptoms/testicle-pain/'],
  },
  {
    key: 'seminal-vesicles',
    identities: [
      ['FMA19387', 'right', 'isa', ['FJ3143'], 'pelvis', ['pelvis'], 'organ'],
      ['FMA19388', 'left', 'isa', ['FJ3137'], 'pelvis', ['pelvis'], 'organ'],
    ],
    scope:
      'Two independently indexed accessory-gland surfaces, not validated lumens or a complete ejaculatory tract. Secretion, sperm transport, fertility and microscopic abnormalities cannot be assessed from these meshes.',
    pathology: {
      body: 'Seminal vesicles may be affected by inflammation, cysts or stones. These are different processes, and a normal reference surface does not identify any of them.',
      bullets: [
        'Blood in semen can arise from several parts of the urinary or reproductive tract.',
        'A symptom does not establish which gland or side is affected.',
      ],
    },
    clinical: {
      body: 'Use the posterior bladder relationship to orient these glands separately from the prostate and testes. Blood in semen or painful ejaculation needs clinical assessment, not automatic attribution to a selected seminal vesicle.',
      bullets: [
        'Gland visibility does not demonstrate normal fertility or duct patency.',
        'No semen-analysis interpretation or procedural route is supplied.',
      ],
    },
    references: [
      'https://my.clevelandclinic.org/health/body/22433-seminal-vesicle',
      'https://my.clevelandclinic.org/health/symptoms/blood-in-semen-hematospermia',
    ],
  },
  {
    key: 'rectum',
    identities: [
      [
        'FMA14544',
        'unpaired',
        'isa',
        ['FJ2571'],
        'pelvis',
        ['pelvis'],
        'organ',
      ],
    ],
    scope:
      'This rectal surface is separately owned and excluded from the large-intestine display aggregate. No validated mucosal layer, mesorectal surgical plane, sphincter mechanism or full bowel-wall dissection is supplied.',
    pathology: {
      body: 'Proctitis affects the rectal lining. Inflammatory bowel disease and infections are possible causes. Radiation-related rectal injury may have little inflammation, so radiation proctopathy is a more precise term for that process.',
      bullets: [
        'Inflammation elsewhere in the colon is not automatically proctitis; the anatomical site matters.',
        'The outer rectal surface cannot distinguish infection, inflammatory bowel disease or radiation injury.',
      ],
    },
    clinical: {
      body: 'Tenesmus is a persistent urge to pass stool despite an empty bowel. It can occur with rectal inflammation, alongside bleeding, mucus, altered bowel habit or pain; clinical assessment is needed to determine the cause.',
      bullets: [
        'Rectal bleeding, discharge or severe abdominal pain warrants prompt medical assessment.',
        'The model supplies no endoscopy, biopsy result, tumour stage or operative plane.',
      ],
    },
    references: [
      'https://www.niddk.nih.gov/health-information/digestive-diseases/proctitis',
      'https://www.niddk.nih.gov/health-information/digestive-diseases/proctitis/symptoms-causes',
    ],
  },
  {
    key: 'epididymides',
    identities: [
      ['FMA18256', 'right', 'isa', ['FJ3141'], 'pelvis', ['pelvis'], 'organ'],
      ['FMA18257', 'left', 'isa', ['FJ3136'], 'pelvis', ['pelvis'], 'organ'],
    ],
    scope:
      'Each source-labelled epididymis remains distinct from its testis. The coiled internal duct, wall layers, transport, infectious spread and fertility are not validated; these adult-male surfaces are not a complete tract.',
    pathology: {
      body: 'Epididymitis is inflammation of the epididymis, often due to infection. Sexually transmitted and urinary infections are possible causes; the label alone does not establish the organism.',
      bullets: [
        'Pain and swelling can overlap with other scrotal disorders.',
        'Clinical history and testing are needed to establish the cause.',
      ],
    },
    clinical: {
      body: 'Sudden severe scrotal pain must not be dismissed as infection because testicular torsion can present urgently. In the UK, seek immediate A&E assessment or call 999 for sudden unbearable pain.',
      bullets: [
        'Keep the epididymis and testis as separate selections when studying their relationship.',
        'No antibiotic regimen, partner-management plan or fertility prediction is supplied.',
      ],
    },
    references: ['https://www.nhs.uk/conditions/epididymitis/'],
  },
  {
    key: 'urethra',
    identities: [
      [
        'FMA19667',
        'unpaired',
        'isa',
        ['FJ3148'],
        'pelvis',
        ['pelvis'],
        'organ',
      ],
    ],
    scope:
      'One adult-male source representation, not female urethral anatomy or a validated complete lumen. Urethral subdivisions, sphincters, calibre and catheter/device routes are not independently validated by this selection.',
    pathology: {
      body: 'Urethral stricture narrows the urine outflow passage, often through scarring after injury or inflammation. Urinary retention may result from an outlet blockage, but inadequate bladder contraction is another mechanism.',
      bullets: [
        'A urethral narrowing is distinct from an obstructed ureter between kidney and bladder.',
        'This surface does not show a stricture, establish its length or measure urinary flow.',
      ],
    },
    clinical: {
      body: 'Difficulty starting urination, a slow stream or incomplete emptying requires assessment of both the outlet and bladder function. Inability to urinate or severe lower abdominal pain needs urgent medical care.',
      bullets: [
        'Do not interpret a clipped or transparent reference surface as proof of an open lumen.',
        'No catheterisation technique, dilatation plan or procedure selection is provided.',
      ],
    },
    references: [
      'https://magazine.urologyhealth.org/summer_2021/uro-mythbusters',
      'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-retention/symptoms-causes',
    ],
  },
];
const byFma = new Map(
  pelvicOrganClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function pelvicOrganClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'organs')
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
