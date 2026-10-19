import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type AxialBoneClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
];
interface AxialBoneClinicalGroup {
  key: string;
  identities: readonly AxialBoneClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const axialBoneClinicalGroups: readonly AxialBoneClinicalGroup[] = [
  {
    key: 'atlas',
    identities: [
      [
        'FMA12519',
        'midline',
        'isa',
        ['FJ3176'],
        'spine',
        ['spine', 'head-neck'],
      ],
    ],
    scope:
      'C1 is a ring, not a body-bearing vertebra. Neither transverse-ligament competence nor safe neck motion is established by this source mesh.',
    pathology: {
      body: 'C1 fractures can involve the arches or lateral masses. An isolated bony injury is different from an injury that also disrupts stabilising ligaments.',
      bullets: [
        'An intact-looking bone arrangement cannot exclude an important ligament injury after trauma.',
      ],
    },
    clinical: {
      body: 'Orient the C1 ring around the dens of the separate C2 selection; assess bone and ligament injury as related but distinct questions.',
      bullets: [
        'The transverse ligament is clinically important for C1–C2 stability. Explode separation does not test it or reproduce a clinical instability examination.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/2a-isolated-bony-injury/definition',
      'https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/further-reading/ao-spine-upper-cervical-injuries-classification-system',
    ],
  },
  {
    key: 'axis',
    identities: [
      [
        'FMA12520',
        'midline',
        'isa',
        ['FJ3177'],
        'spine',
        ['spine', 'head-neck'],
      ],
    ],
    scope:
      'The dens and posterior arch remain parts of this single C2 mesh; no fracture line, ligament tear or C2–C3 disc injury is reconstructed.',
    pathology: {
      body: 'An odontoid fracture concerns the dens; other C2 injuries involve the body or posterior elements. The label “C2 fracture” does not specify one uniform pattern.',
      bullets: [
        'Location, associated soft-tissue injury and alignment matter; a normal reference axis does not establish injury stability.',
      ],
    },
    clinical: {
      body: 'Distinguish the dens–C1 relationship from the lower C2–C3 junction when describing an upper cervical injury.',
      bullets: [
        'Do not infer healing potential, nerve injury or a treatment plan from the selected bone alone.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/further-reading/ao-spine-upper-cervical-injuries-classification-system',
    ],
  },
  {
    key: 'subaxial-cervical',
    identities: [
      [
        'FMA12521',
        'midline',
        'isa',
        ['FJ3161'],
        'spine',
        ['spine', 'head-neck'],
      ],
      [
        'FMA12522',
        'midline',
        'isa',
        ['FJ3164'],
        'spine',
        ['spine', 'head-neck'],
      ],
      [
        'FMA12523',
        'midline',
        'isa',
        ['FJ3167'],
        'spine',
        ['spine', 'head-neck'],
      ],
      [
        'FMA12524',
        'midline',
        'isa',
        ['FJ3170'],
        'spine',
        ['spine', 'head-neck'],
      ],
      [
        'FMA12525',
        'midline',
        'isa',
        ['FJ3172'],
        'spine',
        ['spine', 'head-neck'],
      ],
    ],
    scope:
      'C3–C7 source numbering is retained. No patient ligament stability, cord lesion or vertebral-artery course is supplied.',
    pathology: {
      body: 'Following neck trauma, bone, disc, ligament and neural injury must be considered separately. A bone-only assessment cannot exclude spinal-cord injury.',
      bullets: [
        'New weakness or altered sensation after significant spinal trauma requires urgent emergency assessment.',
      ],
    },
    clinical: {
      body: 'Relate the vertebral body, posterior elements and adjacent motion segments without treating a normal surface as clinical clearance.',
      bullets: [
        'NICE recommends MRI after CT when a neurological abnormality could reflect spinal-cord injury, even if CT does not explain it. This is clinical context, not an implemented scan pathway.',
      ],
    },
    references: [
      'https://www.nice.org.uk/guidance/ng41/chapter/Recommendations',
    ],
  },
  {
    key: 'thoracic-vertebrae',
    identities: [
      ['FMA9165', 'midline', 'isa', ['FJ3158'], 'spine', ['spine', 'thorax']],
      ['FMA9187', 'midline', 'isa', ['FJ3160'], 'spine', ['spine', 'thorax']],
      ['FMA9209', 'midline', 'isa', ['FJ3163'], 'spine', ['spine', 'thorax']],
      ['FMA9248', 'midline', 'isa', ['FJ3166'], 'spine', ['spine', 'thorax']],
      ['FMA9922', 'midline', 'isa', ['FJ3169'], 'spine', ['spine', 'thorax']],
      ['FMA9945', 'midline', 'isa', ['FJ3171'], 'spine', ['spine', 'thorax']],
      ['FMA9968', 'midline', 'isa', ['FJ3173'], 'spine', ['spine', 'thorax']],
      ['FMA9991', 'midline', 'isa', ['FJ3174'], 'spine', ['spine', 'thorax']],
      ['FMA10014', 'midline', 'isa', ['FJ3175'], 'spine', ['spine', 'thorax']],
      ['FMA10037', 'midline', 'isa', ['FJ3154'], 'spine', ['spine', 'thorax']],
    ],
    scope:
      'T1–T10 retain individual source identities and variable rib-facet anatomy. No vertebral marrow, fracture age or bone density is measured.',
    pathology: {
      body: 'Vertebral compression fractures can follow low-energy events in weakened bone as well as trauma. An abnormal vertebral shape alone does not establish the cause or age of injury.',
      bullets: [
        'Osteoporosis is one cause; other bone-weakening conditions also need clinical consideration.',
      ],
    },
    clinical: {
      body: 'Distinguish a body-height change from posterior-element, ligament or neural involvement when reading patient imaging.',
      bullets: [
        'A normal atlas is an orientation reference, not evidence that a painful vertebra is unfractured or that a collapsed vertebra is necessarily osteoporotic.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/osteoporosis-and-spinal-fractures/',
      'https://www.orthoinfo.org/diseases--conditions/fractures-of-the-thoracic-and-lumbar-spine/',
    ],
  },
  {
    key: 'thoracolumbar-junction',
    identities: [
      ['FMA10059', 'midline', 'isa', ['FJ3155'], 'spine', ['spine', 'thorax']],
      ['FMA10081', 'midline', 'isa', ['FJ3156'], 'spine', ['spine', 'thorax']],
      ['FMA13072', 'midline', 'isa', ['FJ3157'], 'spine', ['spine', 'abdomen']],
    ],
    scope:
      'T11, T12 and L1 remain separate bones, not a fixed cord-segment map. Explode displacement is not injury angulation or translation.',
    pathology: {
      body: 'The thoracolumbar transition is a frequent site of spinal trauma. Compression, burst and distraction injuries are different patterns, not synonyms for back pain.',
      bullets: [
        'Burst injury may affect the spinal canal; neither every burst fracture nor every compression fracture has the same stability or neurological consequences.',
      ],
    },
    clinical: {
      body: 'Describe the injured bone and its relationship to adjacent segments, then consider posterior tissues and neurological findings.',
      bullets: [
        'A fracture pattern on patient imaging and the clinical examination are needed; the atlas does not classify instability or choose treatment.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/fractures-of-the-thoracic-and-lumbar-spine/',
    ],
  },
  {
    key: 'lumbar-vertebrae',
    identities: [
      ['FMA13073', 'midline', 'isa', ['FJ3159'], 'spine', ['spine', 'abdomen']],
      ['FMA13074', 'midline', 'isa', ['FJ3162'], 'spine', ['spine', 'abdomen']],
      ['FMA13075', 'midline', 'isa', ['FJ3165'], 'spine', ['spine', 'abdomen']],
    ],
    scope:
      'L2–L4 are bone-level labels, not individual nerve-root diagnoses. The reference has no symptomatic stenosis or validated neural compression.',
    pathology: {
      body: 'Lumbar spinal stenosis may involve degenerative bone, discs and thickened ligaments narrowing space available to nerves. It is not a disease of the vertebral body alone.',
      bullets: [
        'Leg symptoms provoked by standing or walking can be relevant, but a symptom pattern or bone contour alone is insufficient for diagnosis.',
      ],
    },
    clinical: {
      body: 'Consider the canal and exiting nerve spaces alongside discs, facet joints and ligaments; bone-only isolation hides part of the clinical problem.',
      bullets: [
        'Back pain with new bladder/bowel disturbance, saddle sensory loss or symptoms in both legs needs emergency assessment; in the UK call 999 or attend A&E.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/lumbar-spinal-stenosis/',
      'https://www.nhs.uk/conditions/back-pain/',
    ],
  },
  {
    key: 'lumbosacral-junction',
    identities: [
      ['FMA13076', 'midline', 'isa', ['FJ3168'], 'spine', ['spine', 'abdomen']],
    ],
    scope:
      'Source L5 is not proof of patient vertebral numbering. No pars defect, slip measurement, disc degeneration or instability is simulated.',
    pathology: {
      body: 'Spondylolysis describes a pars-interarticularis defect; spondylolisthesis describes vertebral displacement. A pars defect does not inevitably lead to a slip.',
      bullets: [
        'Degenerative spondylolisthesis can occur without a pars fracture; these mechanisms should not be merged.',
      ],
    },
    clinical: {
      body: 'Locate the posterior bony bridge separately from the vertebral body and the L5–sacrum relationship.',
      bullets: [
        'The selected normal bone cannot demonstrate whether a patient has a defect, displacement or a symptomatic nerve lesion.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/adult-spondylolisthesis-in-the-low-back/',
    ],
  },
  {
    key: 'sacrum',
    identities: [
      [
        'FMA16202',
        'midline',
        'isa',
        ['FJ3393'],
        'spine',
        ['spine', 'pelvis', 'thigh'],
      ],
    ],
    scope:
      'One fused sacrum, not five separately dissectible vertebrae. No sacral marrow oedema, fracture zone or patient neural deficit is represented.',
    pathology: {
      body: 'Sacral insufficiency fractures may be difficult to see on radiographs and can present as lower-back or pelvic pain without major trauma.',
      bullets: [
        'MRI can reveal injury and marrow changes not evident on initial radiographs; no sensitivity estimate is extrapolated to an individual patient.',
      ],
    },
    clinical: {
      body: 'Study both the lateral sacral regions and the central canal in relation to the pelvic ring, without assuming that pain is lumbar in origin.',
      bullets: [
        'Patient examination and appropriately targeted imaging are required; a smooth source surface does not exclude an insufficiency fracture.',
      ],
    },
    references: [
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC9456416/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC7964142/',
    ],
  },
  {
    key: 'first-rib',
    identities: [
      ['FMA7857', 'right', 'isa', ['FJ3334'], 'thorax', ['thorax']],
      ['FMA7987', 'left', 'isa', ['FJ3228'], 'thorax', ['thorax']],
    ],
    scope:
      'One rib per side, not a vascular study or reconstructed brachial plexus. No subclavian clearance or traumatic displacement is validated.',
    pathology: {
      body: 'Traumatic first-rib fractures can accompany injury to nearby vessels or the brachial plexus and other major injuries, but this association is not inevitable.',
      bullets: [
        'Fracture context and clinical neurovascular findings matter more than assuming that every first-rib fracture has the same risk.',
      ],
    },
    clinical: {
      body: 'Use the rib as an upper-chest landmark while keeping the clavicle, vessels and nerves as distinct anatomical structures.',
      bullets: [
        'No angiography indication, needle route or neurovascular diagnosis is determined by this normal reference surface.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/9158123/',
      'https://pubmed.ncbi.nlm.nih.gov/1130843/',
    ],
  },
  {
    key: 'second-rib',
    identities: [
      ['FMA7882', 'right', 'isa', ['FJ3336'], 'thorax', ['thorax']],
      ['FMA8012', 'left', 'isa', ['FJ3229'], 'thorax', ['thorax']],
    ],
    scope:
      'The second-rib/sternal-angle landmark supports orientation only, not verified patient rib counting, cartilage integrity or a procedural entry point.',
    pathology: {
      body: 'Pain from a rib injury can limit deep breathing and coughing, with a risk of retained secretions and chest infection.',
      bullets: [
        'Respiratory function and accompanying chest injury matter, not just whether one fracture line is visible.',
      ],
    },
    clinical: {
      body: 'Trace the rib towards its anterior cartilage connection rather than treating the bony end as the sternocostal joint.',
      bullets: [
        'This atlas does not assess breathing or prescribe analgesia; patient symptoms and examination determine care.',
      ],
    },
    references: [
      'https://www.cuh.nhs.uk/patient-information/chest-injury-advice-sheet-for-patients/',
      'https://www.nhs.uk/conditions/broken-or-bruised-ribs/',
    ],
  },
  {
    key: 'ribs-three-to-ten',
    identities: [
      ['FMA7909', 'right', 'isa', ['FJ3338'], 'thorax', ['thorax']],
      ['FMA8039', 'left', 'isa', ['FJ3230'], 'thorax', ['thorax']],
      ['FMA7957', 'right', 'isa', ['FJ3340'], 'thorax', ['thorax']],
      ['FMA8148', 'left', 'isa', ['FJ3231'], 'thorax', ['thorax']],
      ['FMA8066', 'right', 'isa', ['FJ3342'], 'thorax', ['thorax']],
      ['FMA8093', 'left', 'isa', ['FJ3232'], 'thorax', ['thorax']],
      ['FMA8175', 'right', 'isa', ['FJ3344'], 'thorax', ['thorax']],
      ['FMA8202', 'left', 'isa', ['FJ3233'], 'thorax', ['thorax']],
      ['FMA8229', 'right', 'isa', ['FJ3346'], 'thorax', ['thorax']],
      ['FMA8256', 'left', 'isa', ['FJ3234'], 'thorax', ['thorax']],
      ['FMA8283', 'right', 'isa', ['FJ3347'], 'thorax', ['thorax']],
      ['FMA8310', 'left', 'isa', ['FJ3235'], 'thorax', ['thorax']],
      ['FMA8364', 'right', 'isa', ['FJ3348'], 'thorax', ['thorax']],
      ['FMA8391', 'left', 'isa', ['FJ3236'], 'thorax', ['thorax']],
      ['FMA8445', 'right', 'isa', ['FJ3330'], 'thorax', ['thorax']],
      ['FMA8472', 'left', 'isa', ['FJ3225'], 'thorax', ['thorax']],
    ],
    scope:
      'Each rib retains its own level and side. No fracture segment, paradoxical breathing or lower-rib cartilage instability is simulated.',
    pathology: {
      body: 'A radiographic flail segment and clinical flail chest are distinct: the latter describes abnormal chest-wall movement during breathing, not simply multiple fractured ribs.',
      bullets: [
        'The WSES/CWIS definition of a flail segment uses at least three consecutive ribs fractured in at least two places each; definitions have varied between studies.',
      ],
    },
    clinical: {
      body: 'Study adjacent ribs together while separating fracture configuration from respiratory function and associated lung injury.',
      bullets: [
        'An exploded arrangement moves intact reference bones. It is neither a flail-segment reconstruction nor a breathing simulation.',
      ],
    },
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC11487890/'],
  },
  {
    key: 'floating-ribs',
    identities: [
      ['FMA8531', 'right', 'isa', ['FJ3331'], 'thorax', ['thorax']],
      ['FMA8532', 'left', 'isa', ['FJ3226'], 'thorax', ['thorax']],
      ['FMA8533', 'right', 'isa', ['FJ3332'], 'thorax', ['thorax']],
      ['FMA8534', 'left', 'isa', ['FJ3227'], 'thorax', ['thorax']],
    ],
    scope:
      'Ribs 11 and 12 have no anterior sternal attachment; “floating” does not mean fractured or freely mobile. Pleural and organ boundaries are not patient-registered.',
    pathology: {
      body: 'Lower chest injury must not be assessed as a bone problem alone. Associated breathing difficulty or abdominal symptoms may reflect deeper injury.',
      bullets: [
        'After rib trauma, worsening breathlessness, coughing blood, or abdominal/shoulder pain requires emergency assessment; in the UK call 999 or attend A&E.',
      ],
    },
    clinical: {
      body: 'Relate these lower ribs to the thoracoabdominal boundary without assigning a precise organ injury from rib number or side alone.',
      bullets: [
        'A normal rib mesh cannot exclude lung, liver or splenic injury. No safe puncture corridor is provided.',
      ],
    },
    references: ['https://www.nhs.uk/conditions/broken-or-bruised-ribs/'],
  },
  {
    key: 'manubrium',
    identities: [
      ['FMA7486', 'midline', 'isa', ['FJ3290'], 'thorax', ['thorax']],
    ],
    scope:
      'This recovered upper sternal surface is separate from the body and xiphoid; exact joints and soft-tissue boundaries remain unreviewed.',
    pathology: {
      body: 'The manubriosternal junction may show developmental or fusion variation. A normal junction must not automatically be labelled a fracture or traumatic separation.',
      bullets: [
        'A patient injury requires its own examination and imaging; the atlas does not distinguish a normal variant from an acute break.',
      ],
    },
    clinical: {
      body: 'Keep the manubrium, sternoclavicular connections and sternal body distinct when orienting an anterior chest injury.',
      bullets: [
        'The software divides the sternum for selection, not because all three pieces normally move independently.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/34280594/',
      'https://pubmed.ncbi.nlm.nih.gov/24100061/',
    ],
  },
  {
    key: 'sternal-body',
    identities: [
      ['FMA7487', 'midline', 'isa', ['FJ3178'], 'thorax', ['thorax']],
    ],
    scope:
      'Recovered reference surface only: no fracture, retrosternal collection, ECG finding or cardiac injury is represented.',
    pathology: {
      body: 'A sternal fracture by itself does not establish blunt cardiac injury. Associated injuries and the clinical assessment remain important.',
      bullets: [
        'This distinction is not permission to dismiss chest trauma or bypass the appropriate cardiac assessment.',
      ],
    },
    clinical: {
      body: 'Relate anterior chest-wall injury to the underlying thoracic organs while keeping bony and cardiac findings separate.',
      bullets: [
        'Selecting the sternum cannot screen the heart, establish haemodynamic stability or determine whether monitoring is needed.',
      ],
    },
    references: [
      'https://www.east.org/education-resources/practice-management-guidelines/details/blunt-cardiac-injury%2C-screening-for',
    ],
  },
  {
    key: 'xiphoid',
    identities: [
      ['FMA7488', 'midline', 'isa', ['FJ3153'], 'thorax', ['thorax']],
    ],
    scope:
      'The recovered xiphoid depicts one shape, not all normal variants or a fixed age of ossification. It is not a recommended compression or needle target.',
    pathology: {
      body: 'A curved, bifid or prominent xiphoid may be a normal variant and can be mistaken for an epigastric mass; appearance alone does not diagnose disease.',
      bullets: [
        'A new lump or pain still needs assessment rather than reassurance based solely on resemblance to an atlas variant.',
      ],
    },
    clinical: {
      body: 'Identify continuity with the inferior sternum and distinguish normal morphological variation from a clinically assessed lesion.',
      bullets: [
        'Study reports show diverse shapes; their frequencies are not applied to this model or to an individual patient.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/29098125/',
      'https://pubmed.ncbi.nlm.nih.gov/23839070/',
    ],
  },
];

const byFma = new Map(
  axialBoneClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function axialBoneClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'skeleton' ||
    s.category !== 'bone'
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions] = match.identity;
  if (
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
